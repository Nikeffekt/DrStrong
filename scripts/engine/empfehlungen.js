/* ============================================================
   engine/empfehlungen.js – Stronger Empfehlungs-Engine v2

   Hauptaufgabe:
     Aus den Quiz-Antworten (AW) einen personalisierten
     Wirkstoff-Stack ableiten, der den Vorgaben von
     Stronger Spec v2 entspricht.

   Architektur (PDF Modul 1, 3-Stufen-Prozess + Erweiterungen):
     Stufe 0: Mapping (QuizZuWissenMap)
     Stufe 1: Sicherheitsfilter (harte Kontraindikationen)
     Stufe 2: Anfaenger-Cap (Modul 6)
     Stufe 3: Scoring (Indikation + Population + Evidenz)
     Stufe 4: Variant-Auswahl (Whey vs. ISO Clear, Omega-Form)
     Stufe 5: Kategorisierung (essential/empfohlen/optional)
     Stufe 6: Overlaps aufloesen (redundante Wirkstoffe)
     Stufe 7: Schwangerschafts-Modus (Whitelist, Modul 11)
     Stufe 8: Caps (max. 7 ess+emp, max. 3 optional)

   Abhaengigkeiten (alle als window.*):
     - QuizZuWissenMap : Quiz-Code → Wissensbasis-Werte
     - WIRKSTOFFE_WISSEN : die 25 Wirkstoffe als Objekt
     - Overlaps : Overlap-Aufloesung (optional, Engine laeuft auch ohne)
   
   Public:
     - berechneStack(AW) → { essential, empfohlen, optional, ... }
============================================================ */

window.Empfehlungen = (function () {
  'use strict';

  /* ============================================================
     KONSTANTEN
  ============================================================ */

  // Score-Schwellen aus PDF Modul 1
  var SCHWELLE_ESSENTIAL = 250;
  var SCHWELLE_EMPFOHLEN = 150;
  var SCHWELLE_OPTIONAL  = 80;

  // Stack-Groessen-Caps aus PDF Modul 1
  var MAX_ESSENTIAL_EMPFOHLEN = 7;
  var MAX_OPTIONAL = 3;

  // Score-Boni aus PDF Modul 1
  var FAKTOR_INDIKATION = 100;   // staerke * 100
  var FAKTOR_POPULATION = 50;    // staerke * 50
  var BONUS_EVIDENZ_A = 30;
  var BONUS_EVIDENZ_B = 15;
  var STRAFE_VORHANDEN = -200;   // aktuell inaktiv (Quiz erfasst es nicht)

  // Wirkstoffe, die Anfaenger NICHT bekommen (PDF Modul 6, Tabelle 5)
  // Harte Ausschluesse zur Komplexitaets-Begrenzung
  var ANFAENGER_AUSSCHLUSS = [
    'beta-alanin',
    'pre-workout',
    'eaas',
    'zma',
    'hmb',
    'curcumin',
    'l-carnitin',
    'kollagen'
  ];

  // Basis-Stack: PDF Modul 5 + 14 listen diese als universelle Basis-Versorgung.
  // Bekommen einen Sockel-Bonus von +100 unabhaengig von Zielen, sofern
  // sie nicht durch Sicherheitsfilter ausgeschlossen sind.
  var BASIS_STACK = ['vitamin-d3', 'omega3'];
  var BASIS_STACK_BONUS = 100;

  // Schlafproblem-Erst-Empfehlung (PDF Modul 11):
  // A (Einschlafen)   -> Melatonin priorisiert
  // B (Durchschlafen) -> Magnesium priorisiert
  // C (Beides)        -> beide priorisiert
  // Score-Bonus, damit der jeweilige Wirkstoff sicher in Essential landet.
  var SCHLAF_ERSTEMPFEHLUNG = {
    'A': { 'melatonin': 200 },
    'B': { 'magnesium': 200 },
    'C': { 'melatonin': 150, 'magnesium': 150 }
  };

  // Schwangerschafts-Whitelist (PDF Modul 11)
  // Nur diese Wirkstoffe werden im Schwangerschaftsmodus zugelassen.
  // Folsaeure + Jod werden als Pseudo-Wirkstoffe ergaenzt (TODO_NACHPFLEGEN).
  var SCHWANGERSCHAFT_WHITELIST = [
    'vitamin-d3',
    'omega3',
    'magnesium',
    'vitamin-b12',
    'eisen',
    'multivitamin'
  ];

  // Pseudo-Wirkstoffe fuer Schwangerschaft (PDF Modul 11)
  // TODO_NACHPFLEGEN: Folsaeure + Jod als vollwertige Eintraege
  // in wirkstoffe-wissen.json hinzufuegen.
  var SCHWANGERSCHAFT_EXTRA = [
    {
      id: 'folsaeure',
      name: 'Folsäure',
      prioritaet: 'essential',
      score: 999,
      form_hinweis: null,
      matched_ziele: ['neuralrohrdefekt_praevention'],
      matched_populationen: ['schwangerschaft'],
      warnhinweise: [],
      TODO_NACHPFLEGEN: true,
      hinweis: '400-800 µg/Tag, idealerweise 4 Wochen praekonzeptionell'
    },
    {
      id: 'jod',
      name: 'Jod',
      prioritaet: 'essential',
      score: 998,
      form_hinweis: null,
      matched_ziele: ['schilddruesenfunktion_schwangerschaft'],
      matched_populationen: ['schwangerschaft'],
      warnhinweise: [],
      TODO_NACHPFLEGEN: true,
      hinweis: '150 µg/Tag fuer Schilddruesenfunktion + fetale Entwicklung'
    }
  ];


  /* ============================================================
     POPULATIONS-BEDINGUNGEN
     
     Mapping: population_spezifisch-Key in der Wissensbasis →
     Funktion, die prueft ob der User zu dieser Population passt.
     
     Die Engine pickt sich dann pro Wirkstoff aus dessen
     population_spezifisch-Feld die passenden Eintraege und
     summiert deren staerke-Werte (mit Faktor 50).
  ============================================================ */
  var POP_BEDINGUNGEN = {
    // ── Geschlechts-basiert ──
    'frauen':                  function(c, A) { return c.modi.weiblich === true; },
    'menstruierende_frauen':   function(c, A) { return c.modi.weiblich === true && A.alter >= 12 && A.alter <= 52; },
    'frauen_menopause':        function(c, A) { return c.modi.weiblich === true && (c.modi.wechseljahre || A.alter >= 45); },
    'maenner':                 function(c, A) { return c.modi.maennlich === true; },
    'maenner_postmenopausale_frauen': function(c, A) { return c.modi.maennlich || (c.modi.weiblich && A.alter >= 52); },

    // ── Alters-basiert ──
    'senioren_50plus':         function(c, A) { return A.alter >= 50; },
    'senioren_55plus':         function(c, A) { return A.alter >= 55; },
    'senioren_65plus':         function(c, A) { return A.alter >= 65; },
    'senioren_sarkopenie':     function(c, A) { return A.alter >= 60; },
    'kinder_jugendliche_schlafstoerung': function(c, A) { return A.alter < 18 && c.modi.schlafprobleme; },
    'kinder_diarrhoe':         function(c, A) { return false; }, // Quiz erfasst das nicht

    // ── Training / Sport ──
    'kraftsportler':           function(c, A) { return A.training === 'A' || A.training === 'B'; },
    'krafttrainierende':       function(c, A) { return A.training === 'A' || A.training === 'B'; },
    'ausdauersportler':        function(c, A) { return A.training === 'C' || A.training === 'D'; },
    'ausdauersportler_hochintensiv': function(c, A) { return (A.training === 'C' || A.training === 'D') && A.erfahrung !== 'einsteiger'; },
    'hitzesportler':           function(c, A) { return A.training === 'C' || A.training === 'D'; },
    'sportler':                function(c, A) { return A.training !== 'E'; },
    'intensive_athleten':      function(c, A) { return A.training === 'A'; },
    'wettkampfsportler':       function(c, A) { return A.erfahrung === 'profi' && (A.training === 'A' || A.training === 'B'); },
    'freizeitsportler_ausreichend_protein': function(c, A) { return false; }, // keine direkte Quiz-Frage

    // ── Erfahrung ──
    'anfaenger':               function(c, A) { return c.modi.anfaenger === true; },
    'einsteiger':              function(c, A) { return c.modi.anfaenger === true; },
    'anfaenger_krafttraining': function(c, A) { return c.modi.anfaenger && (A.training === 'A' || A.training === 'B'); },
    'junge_trainierte':        function(c, A) { return A.alter < 50 && A.training !== 'E' && A.erfahrung !== 'einsteiger'; },

    // ── Schwangerschaft / Lebensphase ──
    'schwangerschaft':         function(c, A) { return c.modi.schwangerschaft === true; },
    'schwangere':              function(c, A) { return c.modi.schwangerschaft === true; },
    'schwangere_stillende':    function(c, A) { return c.modi.schwangerschaft === true; },

    // ── Ernaehrung ──
    'vegetarier_veganer':      function(c, A) { return c.modi.vegetarisch === true || c.modi.vegan === true; },
    'veganer':                 function(c, A) { return c.modi.vegan === true; },

    // ── Allergien / Unvertraeglichkeiten ──
    'milcheiweiss_allergiker': function(c, A) { return c.modi.milcheiweiss_allergie === true; },
    'laktose_intoleranten':    function(c, A) { return c.modi.laktose_intoleranz === true; },

    // ── Erkrankungen / Medikamente ──
    'menschen_mit_diabetes':   function(c, A) { return A.medikamente && A.medikamente.indexOf('G') >= 0; },
    'diabetiker_t2':           function(c, A) { return A.medikamente && A.medikamente.indexOf('G') >= 0; },
    'hashimoto_patienten':     function(c, A) { return A.medikamente && A.medikamente.indexOf('C') >= 0; },
    'menschen_mit_schilddruesenerkrankung': function(c, A) { return A.medikamente && A.medikamente.indexOf('C') >= 0; },
    'metformin_nutzer':        function(c, A) { return A.medikamente && A.medikamente.indexOf('G') >= 0; },
    'menschen_mit_uebergewicht': function(c, A) { return false; },  // Quiz erfasst BMI nicht direkt
    'menschen_mit_hohen_triglyceriden': function(c, A) { return false; }, // nicht im Quiz
    'patienten_chronisch_entzuendlich': function(c, A) { return false; }, // nicht im Quiz
    'antibiotika_therapie':    function(c, A) { return false; }, // nicht im Quiz
    'reizdarm_patienten':      function(c, A) { return false; },
    'reizdarm_betroffene':     function(c, A) { return false; },

    // ── Ziele / Situationen ──
    'chronisch_gestresste':    function(c, A) { return A.ziele && A.ziele.indexOf('G') >= 0; },
    'diaet_kaloriendefizit':   function(c, A) { return A.ziele && A.ziele.indexOf('B') >= 0; },
    'uebergewichtige':         function(c, A) { return A.ziele && A.ziele.indexOf('B') >= 0; },
    'extreme_belastung':       function(c, A) { return A.training === 'A' && A.erfahrung !== 'einsteiger'; },
    'koffein_empfindliche':    function(c, A) { return false; }, // Quiz erfasst das nicht
    'schlafsensible_aengstliche': function(c, A) { return c.modi.schlafprobleme === true; },
    'abendsportler':           function(c, A) { return false; },
    'schichtarbeiter':         function(c, A) { return false; },
    'vielreisende_jetlag':     function(c, A) { return false; },
    'rehabilitation_immobilitaet': function(c, A) { return c.modi.reha === true; },
    'magenempfindliche':       function(c, A) { return false; },
    'bei_krankheit':           function(c, A) { return c.modi.reha === true; },
    'reisende':                function(c, A) { return false; },
    'alltagssportler':         function(c, A) { return A.training === 'E'; },
    'raucher':                 function(c, A) { return false; },
    'dunkle_hauttypen':        function(c, A) { return false; },
    'geringe_obst_gemuese_zufuhr': function(c, A) { return false; },
    'einseitige_ernaehrung_risikogruppen': function(c, A) { return false; },
    'gesunde_gut_ernaehrte':   function(c, A) { return false; }, // soll keinen Bonus geben
    'gesunde_mischkost_esser': function(c, A) { return false; },
    'gesunde_erwachsene':      function(c, A) { return false; },
    'budget_orientiert_gesund': function(c, A) { return false; },
    'nachhaltigkeit_fokussiert': function(c, A) { return false; },
    'athleten_mit_mangel':     function(c, A) { return false; },
    'schlaf_optimierung':      function(c, A) { return c.modi.schlafprobleme === true; },
    'testosteron_steigerung':  function(c, A) { return false; },
    'phytooestrogen_brustkrebs': function(c, A) { return false; }
  };


  /* ============================================================
     STUFE 0: Context erweitern
     
     Erweitert die ctx.modi aus dem Mapping um abgeleitete Flags,
     die aus AW direkt ableitbar sind.
  ============================================================ */
  function erweitereContext(ctx, AW) {
    // Alters-basierte Modi
    if (typeof AW.alter === 'number') {
      if (AW.alter >= 50) ctx.modi.senioren_50plus = true;
      if (AW.alter >= 55) ctx.modi.senioren_55plus = true;
      if (AW.alter >= 65) ctx.modi.senioren_65plus = true;
    }

    // Training
    if (AW.training === 'A' || AW.training === 'B') {
      ctx.modi.kraftsportler = true;
    }
    if (AW.training === 'C' || AW.training === 'D') {
      ctx.modi.ausdauersportler = true;
    }

    // Erfahrung
    if (AW.erfahrung === 'einsteiger') {
      ctx.modi.anfaenger = true;
    }

    // Allergie-Modi aus kontra-Liste ableiten (komfortabler Zugriff)
    if (ctx.kontra.indexOf('medizinisch.laktose_intoleranz') >= 0) {
      ctx.modi.laktose_intoleranz = true;
    }
    if (ctx.kontra.indexOf('allergie.milcheiweiss_allergie') >= 0) {
      ctx.modi.milcheiweiss_allergie = true;
    }

    // Medikamenten-Modi (Komfort fuer POP_BEDINGUNGEN)
    if (AW.medikamente) {
      if (AW.medikamente.indexOf('C') >= 0) ctx.modi.schilddruese = true;
      if (AW.medikamente.indexOf('E') >= 0) ctx.modi.niereninsuffizienz = true;
      if (AW.medikamente.indexOf('G') >= 0) ctx.modi.diabetes = true;
    }
  }


  /* ============================================================
     STUFE 1: Sicherheitsfilter (hart-Kontraindikationen)
     
     Iteriert alle Wirkstoffe in WIRKSTOFFE_WISSEN. Pro Wirkstoff
     pruefen wir, ob eine hart-Kontraindikation gegen unsere
     ctx.kontra-Liste matched. Wenn ja → raus.
     
     "Vorsichtig"- und "info"-Eintraege fuehren NICHT zum Filter,
     sondern werden spaeter als warnhinweise im Output gesammelt.
  ============================================================ */
  function filtereWirkstoffe(wissensbasis, ctx) {
    var verbleibend = [];
    var entfernt = [];

    var wirkstoffIds = Object.keys(wissensbasis).filter(function (k) {
      return k.indexOf('_') !== 0;  // ueberspringe _meta o.ae.
    });

    for (var i = 0; i < wirkstoffIds.length; i++) {
      var id = wirkstoffIds[i];
      var w = wissensbasis[id];
      if (!w || typeof w !== 'object') continue;

      var ausschluss = null;
      var warnhinweise = [];

      var kontraindikationen = w.kontraindikationen || [];
      for (var k = 0; k < kontraindikationen.length; k++) {
        var ki = kontraindikationen[k];
        var artWert = (ki.art || '') + '.' + (ki.wert || '');

        if (ctx.kontra.indexOf(artWert) >= 0) {
          if (ki.schwere === 'hart') {
            // Harter Ausschluss → Wirkstoff komplett raus
            ausschluss = {
              id: id,
              name: w.name || id,
              grund: artWert,
              hinweis: ki.hinweis || ''
            };
            break;
          } else if (ki.schwere === 'vorsichtig' || ki.schwere === 'info') {
            // Weiche Warnung → Wirkstoff bleibt drin, aber mit Hinweis
            warnhinweise.push({
              schwere: ki.schwere,
              grund: artWert,
              text: ki.hinweis || ''
            });
          }
        }
      }

      if (ausschluss) {
        entfernt.push(ausschluss);
      } else {
        verbleibend.push({
          id: id,
          wirkstoff: w,
          warnhinweise: warnhinweise
        });
      }
    }

    return { verbleibend: verbleibend, entfernt: entfernt };
  }


  /* ============================================================
     STUFE 2: Anfaenger-Cap
     
     Bei AW.erfahrung === 'einsteiger' werden die in
     ANFAENGER_AUSSCHLUSS gelisteten Wirkstoffe hart ausgefiltert.
     PDF Modul 6 / Tabelle 5.
     
     AUSNAHME (PDF Modul 6 + 11):
     - HMB bleibt drin fuer Senioren (>= 50) und Reha-Patienten,
       weil Sarkopenie-Praevention Vorrang hat ueber Komplexitaets-Cap.
  ============================================================ */
  function capFuerAnfaenger(filterErgebnis, ctx, AW) {
    var verbleibend = [];
    var entfernt = filterErgebnis.entfernt.slice();

    // Ausnahme-Bedingung fuer HMB
    var hmbAusnahme =
      (typeof AW.alter === 'number' && AW.alter >= 50) ||
      ctx.modi.reha === true;

    for (var i = 0; i < filterErgebnis.verbleibend.length; i++) {
      var eintrag = filterErgebnis.verbleibend[i];
      var soll_raus = ANFAENGER_AUSSCHLUSS.indexOf(eintrag.id) >= 0;

      // HMB-Ausnahme: Senioren und Reha behalten HMB
      if (soll_raus && eintrag.id === 'hmb' && hmbAusnahme) {
        soll_raus = false;
      }

      if (soll_raus) {
        entfernt.push({
          id: eintrag.id,
          name: (eintrag.wirkstoff && eintrag.wirkstoff.name) || eintrag.id,
          grund: 'anfaenger_komplexitaet',
          hinweis: 'Fuer Anfaenger nicht empfohlen (PDF Modul 6).'
        });
      } else {
        verbleibend.push(eintrag);
      }
    }

    return { verbleibend: verbleibend, entfernt: entfernt };
  }


  /* ============================================================
     STUFE 3: Scoring (PDF Modul 1)
     
     Formel:
       score = 0
       + SUMME(indikation.staerke * 100) für matchende Ziele
       + SUMME(population.staerke * 50) für matchende Populationen
       + evidenz-Bonus (A: +30, B: +15)
       - 200 bei vorhandenem Wirkstoff (aktuell inaktiv)
  ============================================================ */
  function bewerteWirkstoffe(verbleibend, ctx, AW) {
    var bewertet = [];

    for (var i = 0; i < verbleibend.length; i++) {
      var eintrag = verbleibend[i];
      var w = eintrag.wirkstoff;
      var score = 0;
      var matchedZiele = [];
      var matchedPopulationen = [];

      // ── Indikations-Matching ──
      var indikationen = w.indikationen || [];
      for (var j = 0; j < indikationen.length; j++) {
        var ind = indikationen[j];
        if (ind.ziel && ctx.ziele.indexOf(ind.ziel) >= 0) {
          var staerke = typeof ind.staerke === 'number' ? ind.staerke : 0;
          score += staerke * FAKTOR_INDIKATION;
          matchedZiele.push(ind.ziel);
        }
      }

      // ── Populations-Bonus ──
      var popSpez = w.population_spezifisch || {};
      for (var popKey in popSpez) {
        if (!popSpez.hasOwnProperty(popKey)) continue;
        var pop = popSpez[popKey];
        if (!pop || pop.relevant === false) continue;

        var bedingung = POP_BEDINGUNGEN[popKey];
        if (typeof bedingung === 'function' && bedingung(ctx, AW)) {
          var pStaerke = typeof pop.staerke === 'number' ? pop.staerke : 0;
          score += pStaerke * FAKTOR_POPULATION;
          if (pStaerke > 0) matchedPopulationen.push(popKey);
        }
      }

      // ── Evidenz-Bonus ──
      var evidenzLevel = (w.evidenz && w.evidenz.level) || null;
      if (evidenzLevel === 'A') score += BONUS_EVIDENZ_A;
      else if (evidenzLevel === 'B') score += BONUS_EVIDENZ_B;

      // ── Vorhandensein-Strafe (PDF Modul 1) ──
      // Aktuell inaktiv weil Quiz das Feld nicht erfasst.
      // Hook fuer spaetere Quiz-Erweiterung.
      if (AW.vorhanden && AW.vorhanden.indexOf(eintrag.id) >= 0) {
        score += STRAFE_VORHANDEN;
      }

      // ── Basis-Stack-Sockel-Bonus (PDF Modul 5 + 14) ──
      // Vit D3 und Omega-3 sind universelle Basis-Versorgung,
      // unabhaengig von Zielen.
      if (BASIS_STACK.indexOf(eintrag.id) >= 0) {
        score += BASIS_STACK_BONUS;
      }

      // ── Schlafproblem-Erst-Empfehlung (PDF Modul 11) ──
      // Sub-Typ A/B/C boostet den jeweils richtigen Wirkstoff.
      if (ctx.modi.schlafprobleme && AW.schlafproblem_typ) {
        var schlafBoost = SCHLAF_ERSTEMPFEHLUNG[AW.schlafproblem_typ];
        if (schlafBoost && schlafBoost[eintrag.id]) {
          score += schlafBoost[eintrag.id];
        }
      }

      bewertet.push({
        id: eintrag.id,
        name: w.name || eintrag.id,
        kategorie: w.kategorie || '',
        evidenz_level: evidenzLevel,
        score: Math.round(score * 10) / 10,
        form_hinweis: null,
        matched_ziele: matchedZiele,
        matched_populationen: matchedPopulationen,
        warnhinweise: eintrag.warnhinweise
      });
    }

    return bewertet;
  }


  /* ============================================================
     STUFE 4: Variant-Auswahl
     
     Engine-Logik fuer Sonderfaelle, die nicht aus den JSON-Daten
     allein ableitbar sind:
     
     - Omega-3: form_hinweis 'algenoel' bei Vegan/Fischallergie,
       sonst 'fischoel'.
     - Whey-Konzentrat vs. ISO Clear: bei Laktose-Intoleranz
       wird ISO Clear deutlich bevorzugt (Score-Boost), Whey
       behaelt seinen Warnhinweis.
  ============================================================ */
  function waehleVarianten(bewertet, ctx) {
    for (var i = 0; i < bewertet.length; i++) {
      var item = bewertet[i];

      // Omega-3 Variante
      if (item.id === 'omega3') {
        var braucht_vegan = ctx.modi.vegan === true;
        var fisch_aus = ctx.kontra.indexOf('allergie.fisch_schalentiere') >= 0;
        if (braucht_vegan || fisch_aus) {
          item.form_hinweis = 'algenoel';
        } else {
          item.form_hinweis = 'fischoel';
        }
      }

      // Bei Laktose: ISO Clear bevorzugen
      if (item.id === 'iso-clear' && ctx.modi.laktose_intoleranz) {
        // Score-Bonus, damit iso-clear ueber whey-protein landet
        item.score += 50;
        item.form_hinweis = 'isolat_bei_laktose';
      }
    }

    return bewertet;
  }


  /* ============================================================
     STUFE 5: Kategorisierung (essential/empfohlen/optional)
     
     PDF Modul 1:
     - Essentials: Score > 250
     - Empfohlen: 150-250
     - Optional: 80-150
     - Unter 80 → faellt raus
  ============================================================ */
  function kategorisiereStack(bewertet) {
    var essential = [];
    var empfohlen = [];
    var optional = [];

    for (var i = 0; i < bewertet.length; i++) {
      var item = bewertet[i];
      if (item.score >= SCHWELLE_ESSENTIAL) {
        item.prioritaet = 'essential';
        essential.push(item);
      } else if (item.score >= SCHWELLE_EMPFOHLEN) {
        item.prioritaet = 'empfohlen';
        empfohlen.push(item);
      } else if (item.score >= SCHWELLE_OPTIONAL) {
        item.prioritaet = 'optional';
        optional.push(item);
      }
      // Score < 80 → faellt raus (kein Eintrag)
    }

    return {
      essential: essential,
      empfohlen: empfohlen,
      optional: optional
    };
  }


  /* ============================================================
     STUFE 6: Schwangerschafts-Modus (PDF Modul 11)
     
     Wenn modi.schwangerschaft aktiv: nur die Whitelist behalten,
     alles andere raus. Folsaeure + Jod als Pseudo-Wirkstoffe
     ergaenzen (TODO_NACHPFLEGEN).
  ============================================================ */
  function restriktiverSchwangerschaftsModus(stack) {
    function nurWhitelist(arr) {
      return arr.filter(function (item) {
        return SCHWANGERSCHAFT_WHITELIST.indexOf(item.id) >= 0;
      });
    }

    var neuerStack = {
      essential: nurWhitelist(stack.essential),
      empfohlen: nurWhitelist(stack.empfohlen),
      optional: []  // Keine Optional-Empfehlungen in Schwangerschaft
    };

    // Pseudo-Wirkstoffe Folsaeure + Jod oben einfuegen
    neuerStack.essential = SCHWANGERSCHAFT_EXTRA.concat(neuerStack.essential);

    return neuerStack;
  }


  /* ============================================================
     STUFE 7: Caps (Stack-Groessen-Begrenzung)
     
     PDF Modul 1:
     - Essentials + Empfohlen zusammen: max. 7
     - Optional: max. 3
     
     Ausnahme: BASIS_STACK-Wirkstoffe (Vit D3, Omega-3) werden
     in Optional IMMER durchgereicht, weil sie laut PDF Modul 5
     universelle Basis-Versorgung sind.
  ============================================================ */
  function capStack(stack) {
    var combinedEssEmp = stack.essential.length + stack.empfohlen.length;

    if (combinedEssEmp > MAX_ESSENTIAL_EMPFOHLEN) {
      var ueberschuss = combinedEssEmp - MAX_ESSENTIAL_EMPFOHLEN;
      // Empfohlen kuerzen, Essentials sind unantastbar
      if (stack.empfohlen.length >= ueberschuss) {
        stack.empfohlen = stack.empfohlen.slice(0, stack.empfohlen.length - ueberschuss);
      } else {
        stack.empfohlen = [];
      }
    }

    // Optional cappen, aber BASIS_STACK schuetzen
    if (stack.optional.length > MAX_OPTIONAL) {
      var basisOptional = stack.optional.filter(function (i) {
        return BASIS_STACK.indexOf(i.id) >= 0;
      });
      var restOptional = stack.optional.filter(function (i) {
        return BASIS_STACK.indexOf(i.id) < 0;
      });
      var restPlatz = Math.max(0, MAX_OPTIONAL - basisOptional.length);
      // Score-sortierte Reihenfolge wiederherstellen
      stack.optional = basisOptional.concat(restOptional.slice(0, restPlatz))
        .sort(function (a, b) { return b.score - a.score; });
    }

    return stack;
  }


  /* ============================================================
     HAUPTFUNKTION: berechneStack(AW)
     
     Input: AW-Objekt aus state.js (Quiz-Antworten)
     Output: {
       essential:   [...],
       empfohlen:   [...],
       optional:    [...],
       entfernt:    [...],   // ausgeschlossene Wirkstoffe + Grund
       modi:        {...},   // aktive Engine-Modi (z.B. vegan, schwangerschaft)
       meta: {
         anzahl_total, anzahl_essential, anzahl_empfohlen,
         anzahl_optional, anzahl_entfernt
       }
     }
  ============================================================ */
  function berechneStack(AW) {
    // Eingangs-Checks
    if (!AW) {
      console.error('Empfehlungen.berechneStack: AW ist leer');
      return leererStack({ fehler: 'AW fehlt' });
    }
    if (typeof window.QuizZuWissenMap === 'undefined') {
      console.error('Empfehlungen.berechneStack: QuizZuWissenMap nicht geladen');
      return leererStack({ fehler: 'QuizZuWissenMap fehlt' });
    }
    if (typeof window.WIRKSTOFFE_WISSEN === 'undefined') {
      console.error('Empfehlungen.berechneStack: WIRKSTOFFE_WISSEN nicht geladen');
      return leererStack({ fehler: 'WIRKSTOFFE_WISSEN fehlt' });
    }

    // Stufe 0: Mapping
    var ctx = window.QuizZuWissenMap.uebersetzeAW(AW);
    erweitereContext(ctx, AW);

    // Stufe 1: Sicherheitsfilter
    var filterErgebnis = filtereWirkstoffe(window.WIRKSTOFFE_WISSEN, ctx);

    // Stufe 2: Anfaenger-Cap
    if (ctx.modi.anfaenger) {
      filterErgebnis = capFuerAnfaenger(filterErgebnis, ctx, AW);
    }

    // Stufe 3: Scoring
    var bewertet = bewerteWirkstoffe(filterErgebnis.verbleibend, ctx, AW);

    // Stufe 4: Variant-Auswahl
    bewertet = waehleVarianten(bewertet, ctx);

    // Stufe 5: Sortieren + Kategorisieren
    bewertet.sort(function (a, b) { return b.score - a.score; });
    var stack = kategorisiereStack(bewertet);

    // Stufe 6: Overlaps aufloesen (redundante Wirkstoffe entfernen)
    var entferntOverlaps = [];
    if (typeof window.Overlaps !== 'undefined') {
      var overlapErgebnis = window.Overlaps.loesOverlaps(stack);
      stack = overlapErgebnis.stack;
      entferntOverlaps = overlapErgebnis.entfernt;
    }

    // Stufe 7: Schwangerschafts-Modus (uebersteuert)
    if (ctx.modi.schwangerschaft) {
      stack = restriktiverSchwangerschaftsModus(stack);
    }

    // Stufe 8: Caps
    stack = capStack(stack);

    // Output zusammenstellen
    return {
      essential: stack.essential,
      empfohlen: stack.empfohlen,
      optional: stack.optional,
      entfernt: filterErgebnis.entfernt,
      entfernt_overlaps: entferntOverlaps,
      modi: ctx.modi,
      meta: {
        anzahl_essential: stack.essential.length,
        anzahl_empfohlen: stack.empfohlen.length,
        anzahl_optional: stack.optional.length,
        anzahl_entfernt: filterErgebnis.entfernt.length,
        anzahl_entfernt_overlaps: entferntOverlaps.length,
        anzahl_total: stack.essential.length + stack.empfohlen.length + stack.optional.length
      }
    };
  }

  function leererStack(extra) {
    var r = {
      essential: [], empfohlen: [], optional: [], entfernt: [],
      modi: {}, meta: { anzahl_total: 0 }
    };
    if (extra) {
      for (var k in extra) {
        if (extra.hasOwnProperty(k)) r[k] = extra[k];
      }
    }
    return r;
  }


  /* ============================================================
     PUBLIC API
  ============================================================ */
  return {
    berechneStack: berechneStack,

    // Konstanten exponiert (fuer Debug / Tests)
    SCHWELLE_ESSENTIAL: SCHWELLE_ESSENTIAL,
    SCHWELLE_EMPFOHLEN: SCHWELLE_EMPFOHLEN,
    SCHWELLE_OPTIONAL: SCHWELLE_OPTIONAL,
    SCHWANGERSCHAFT_WHITELIST: SCHWANGERSCHAFT_WHITELIST,
    ANFAENGER_AUSSCHLUSS: ANFAENGER_AUSSCHLUSS,
    BASIS_STACK: BASIS_STACK,
    SCHLAF_ERSTEMPFEHLUNG: SCHLAF_ERSTEMPFEHLUNG,

    // Interne Helpers exponiert (fuer Tests)
    _intern: {
      erweitereContext: erweitereContext,
      filtereWirkstoffe: filtereWirkstoffe,
      capFuerAnfaenger: capFuerAnfaenger,
      bewerteWirkstoffe: bewerteWirkstoffe,
      waehleVarianten: waehleVarianten,
      kategorisiereStack: kategorisiereStack,
      restriktiverSchwangerschaftsModus: restriktiverSchwangerschaftsModus,
      capStack: capStack,
      POP_BEDINGUNGEN: POP_BEDINGUNGEN
    }
  };

})();
