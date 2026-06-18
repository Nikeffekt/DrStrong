/* ============================================================
   engine/quiz-zu-wissen-map.js – Quiz-Code -> Wissensbasis-Werte

   Übersetzt die Codes aus den Quiz-Antworten (AW) in die
   strukturierten Werte der Wirkstoff-Wissensbasis.

   Quelle: Stronger Spec v2, Module 7-11 + 13.
   Genutzt von: engine/empfehlungen.js (Stufe 1 Filter + Stufe 2 Score)

   Konvention:
   - Kontraindikations-Werte: 'art.wert' (gleicher Aufbau wie in
     wirkstoffe-wissen.json, Feld kontraindikationen[i].art +
     kontraindikationen[i].wert mit Punkt verbunden).
   - Schweregrad-Logik (hart/vorsichtig/info) liegt bei der
     Wissensbasis, NICHT hier. Das Mapping listet nur welche
     Werte ein Quiz-Code triggert – wie streng ausgeschlossen
     wird, entscheidet die Wissensbasis.
   - Modi (vegan, schwangerschaft, ...) sind eigene strukturelle
     Flags, die die Engine direkt auswertet.
============================================================ */

window.QuizZuWissenMap = (function () {
  'use strict';

  /* ─── FRAGE 1: Geburtsjahr / Alter ──────────────────────
     AW.alter (Zahl) -> Schwellenwerte für Engine-Modi.
     AW.intro (A-E) wird parallel gehalten für Rueckwaerts-Kompatibilitaet.
     Konkrete Alters-Empfehlungen siehe Modul 2 (PDF).
  ──────────────────────────────────────────────────────── */
  // Alter < 18 triggert hart-Ausschluss bei minderjaehrig-Wirkstoffen
  var ALTER_KONTRA = {
    minderjaehrig: 'alter.minderjaehrig'  // bei AW.alter < 18
  };


  /* ─── FRAGE 2: Geschlecht ───────────────────────────────
     A = Maennlich, B = Weiblich
     Keine direkten Kontraindikationen, nur Modus-Flags.
     Konkrete Boni siehe Modul 3 (Eisen, Kollagen, Vit D+K2 etc.).
  ──────────────────────────────────────────────────────── */
  var GESCHLECHT = {
    'A': { weiblich: false, maennlich: true },
    'B': { weiblich: true,  maennlich: false }
  };


  /* ─── FRAGE 6: Ziele (Multi-Select max. 3) ──────────────
     Mapping auf indikation.ziel-Werte in wirkstoffe-wissen.json.
     Engine: für jeden Wirkstoff prüfen ob Indikation matcht,
             dann Score += indikation.staerke * 100 (Modul 1).
     'G' (Stress) ist NEU in Spec v2.
     
     1:n-Mapping: Ein Quiz-Code triggert MEHRERE Indikations-Werte,
     weil die Wissensbasis feinere Sub-Ziele unterscheidet
     (z.B. "muskelaufbau" + "kraft" + "kraftsteigerung").
     Erstes Element ist das semantische Haupt-Ziel.
  ──────────────────────────────────────────────────────── */
  var ZIELE = {
    // A = Muskelaufbau (+ Krafttraining-Subziele)
    'A': [
      'muskelaufbau',
      'kraft',
      'kraftsteigerung',
      'muskelausdauer',
      'muskelfunktion',
      'hochintensiv_intervall',
      'intensive_workouts',
      'sprint_power',
      'pump_durchblutung',
      'wettkampfvorbereitung'
    ],
    // B = Fettabbau (+ Diaet-/Muskelerhalt-Subziele)
    'B': [
      'fettabbau',
      'gewichtsmanagement',
      'diaet_kalorienreduktion',
      'fettabbau_muskelerhalt',
      'muskelerhalt_diaet',
      'muskelmassen_erhalt_diaet'
    ],
    // C = Mehr Energie
    'C': [
      'energie',
      'energie_muedigkeit',
      'energie_wohlbefinden',
      'kognition_wachheit',
      'kognition_konzentration'
    ],
    // D = Ausdauer
    'D': [
      'ausdauer',
      'ausdauer_hochintensiv',
      'ausdauer_lang',
      'hydration'
    ],
    // E = Regeneration (+ Recovery / Gelenke / Entzuendung / Schlaf-Bonus)
    'E': [
      'regeneration',
      'recovery',
      'muskelregeneration',
      'krafttraining_recovery',
      'entzuendung',
      'gelenkschmerzen_oa',
      'gelenkgesundheit',
      'sehnen_baender',
      'schlaf'
    ],
    // F = Gesundheit (breit gefaechert)
    'F': [
      'gesundheit',
      'immunsystem',
      'herzgesundheit',
      'kardiovaskulaere_gesundheit',
      'knochengesundheit',
      'erkaeltung_akut',
      'antioxidativ',
      'blutdruck',
      'verdauung_allgemein',
      'verstopfung_obstipation',
      'reizdarm_ibs',
      'gehirn_kognition',
      'stoffwechsel',
      'nervensystem',
      'hautgesundheit',
      'wundheilung_haut',
      'kollagen_haut_wundheilung',
      'mangel_ausgleich',
      'mangelpraevention',
      'mangelausgleich',
      'allgemeine_praevention',
      'gesundheit_senioren',
      'antibiotika_diarrhoe'
    ],
    // G = Stress reduzieren (NEU in v2)
    'G': [
      'stress',
      'stress_angst',
      'angst',
      'stimmung',
      'hormonhaushalt'
    ]
  };


  /* ─── FRAGE 4: Training → implizite Ziel-Trigger ──────
     PDF Modul 5: Training bedingt typische Wirkstoff-Profile
     unabhaengig von den explizit gewaehlten Zielen.
     - A (Kraft 4+x), B (Kraft 2-3x) -> Muskelaufbau-Bereich
     - C (Cardio), D (Mix) -> Ausdauer + Hydration
     - E (wenig Sport) -> nichts spezifisch (Basis-Stack greift via BASIS_STACK in Engine)
     
     Diese Ziele werden ZUSAETZLICH zu den explizit gewaehlten
     Zielen (ZIELE) in ctx.ziele eingespeist.
  ──────────────────────────────────────────────────────── */
  var TRAINING_ZIELE = {
    'A': ['muskelaufbau', 'kraft', 'kraftsteigerung', 'intensive_workouts', 'regeneration'],
    'B': ['muskelaufbau', 'kraft', 'regeneration'],
    'C': ['ausdauer', 'hydration', 'kardiovaskulaere_gesundheit'],
    'D': ['ausdauer', 'hydration', 'muskelaufbau', 'kraft'],
    'E': []
  };


  /* ─── MODUS-BASIERTE ZIEL-ERWEITERUNGEN ─────────────────
     Manche indikation.ziel-Werte in der Wissensbasis sind nicht
     durch Quiz-Ziele (A-G) triggerbar, sondern durch andere
     Quiz-Antworten (Ernaehrung, Allergien, Geschlecht etc.).
     
     Beispiele:
     - vegan_vegetarisch / vegan_proteinqualitaet -> Veganer
     - milcheiweiss_allergie -> Milcheiweiss-Allergiker
     - laktose_intoleranz -> Laktose-Intolerante
     - blutbildung / eisenmangel_anaemie -> Frauen / Eisen-Bedarf
     - schwangerschaft -> Schwangere
     
     Diese Ziele werden zusaetzlich zur Engine durchgereicht,
     wenn der entsprechende Modus aktiv ist.
  ──────────────────────────────────────────────────────── */
  var MODUS_ZIELE = {
    vegan: ['vegan_vegetarisch', 'vegan_proteinqualitaet', 'nachhaltigkeit_oeko'],
    vegetarisch: ['vegan_vegetarisch'],
    weiblich: ['blutbildung', 'eisenmangel_anaemie', 'knochengesundheit_frauen'],
    schwangerschaft: ['schwangerschaft'],
    milcheiweiss_allergie: ['milcheiweiss_allergie'],
    laktose_intoleranz: ['laktose_intoleranz', 'magenempfindlichkeit']
  };


  /* ─── FRAGE 7: Ernaehrung ───────────────────────────────
     A = Alles essen, B = Flexitarisch, C = Pescetarisch (NEU),
     D = Vegetarisch, E = Vegan
     
     Ergibt Modus-Flags. Veganer triggern zusaetzlich harten
     Ausschluss von Wirkstoffen mit ernaehrung.vegetarisch_vegan
     (z.B. Fischoel). Engine-Logik (siehe Modul 8):
     - Vegan: Whey -> Pflanzenprotein, Fischoel -> Algenoel,
              B12 essential, Proteinfaktor +15%
     - Vegetarisch: Whey ok, Fischoel -> Algenoel
     - Pescetarisch: Whey ok, Fischoel ok
  ──────────────────────────────────────────────────────── */
  var ERNAEHRUNG = {
    'A': {},  // omnivor: keine speziellen Modi
    'B': { flexitarisch: true },
    'C': { pescetarisch: true },
    'D': { vegetarisch: true },
    'E': { vegan: true, vegetarisch: true }
  };

  // Kontraindikations-Werte, die durch Ernaehrung getriggert werden
  var ERNAEHRUNG_KONTRA = {
    'E': ['ernaehrung.vegetarisch_vegan']  // nur Veganer
  };


  /* ─── FRAGE 8: Allergien / Unvertraeglichkeiten ─────────
     A = Keine (exklusiv), B = Laktoseintoleranz,
     C = Milcheiweiss-Allergie (NEU in v2), D = Fischallergie,
     E = Glutenunvertraeglichkeit, F = Sojaallergie
     
     WICHTIG (Modul 9): C (Milcheiweiss) schliesst ALLE Whey-
     Produkte aus (auch ISO Clear) -> Pflanzenprotein zwingend.
     B (Laktose) schliesst nur Whey-Konzentrat aus, ISO Clear
     ist mit 1% Laktose meist vertraeglich.
  ──────────────────────────────────────────────────────── */
  var ALLERGIEN = {
    'B': ['medizinisch.laktose_intoleranz'],
    'C': ['allergie.milcheiweiss_allergie', 'allergie.milcheiweiss'],
    'D': ['allergie.fischallergie'],
    'E': [],  // Gluten: nur Marken-Hinweis, kein Kontra-Eintrag in DB
    'F': ['allergie.soja_allergie']
  };

  // Gluten triggert keinen Wirkstoff-Ausschluss, aber einen Marken-Hinweis
  var ALLERGIEN_MODI = {
    'E': { gluten_marken_hinweis: true }
  };


  /* ─── FRAGE 9: Medikamente / Erkrankungen ───────────────
     A = Keine (exklusiv), B = Blutverduenner,
     C = Schilddruesenerkrankung, D = Bluthochdruck/Herz,
     E = Nierenerkrankung, F = Lebererkrankung (NEU in v2),
     G = Diabetes, H = Antidepressiva
     
     Wichtigste Filter (siehe Modul 10 + 13):
     - B Blutverduenner -> AUS: Curcumin, Vit K2; Vorsicht Omega-3
     - C Schilddruese   -> AUS: Ashwagandha
     - D Herz/HD        -> AUS: Pre-Workout
     - E Niere          -> AUS: Kreatin, ZMA, HMB
     - F Leber          -> AUS: Curcumin
     - G Diabetes       -> AUS: Pre-Workout
     - H Antidepressiva -> AUS: Ashwagandha, Melatonin
  ──────────────────────────────────────────────────────── */
  var MEDIKAMENTE = {
    'B': [
      'medikament.blutverduenner',
      'medikament.antikoagulantien'
    ],
    'C': [
      'medizinisch.schilddruese',
      'medizinisch.schilddruesenerkrankung_soja',
      'medizinisch.schilddruesenunterfunktion',
      'medizinisch.hashimoto_autoimmun',
      'medikament.antibiotika_schilddruese'
    ],
    'D': [
      'medizinisch.bluthochdruck',
      'medizinisch.bluthochdruck_niere',
      'medizinisch.herzrhythmus_blutdruck',
      'medizinisch.herzrhythmusstoerungen',
      'medizinisch.vorhofflimmern_hochrisiko',
      'medikament.blutdrucksenker',
      'medikament.kalium_herzmedikamente'
    ],
    'E': [
      'medizinisch.niereninsuffizienz',
      'medizinisch.niereninsuffizienz_schwer',
      'medizinisch.niereninsuffizienz_dialyse',
      'medizinisch.nierenerkrankung_schwer',
      'medizinisch.nieren_lebererkrankung',
      'medizinisch.nierensteine_niere',
      'medikament.niereninsuffizienz'
    ],
    'F': [
      'medizinisch.lebererkrankung',
      'medizinisch.nieren_lebererkrankung'
    ],
    'G': [
      'medizinisch.diabetes',
      'medizinisch.blutzucker_diabetes',
      'medikament.diabetes_medikamente'
    ],
    'H': [
      'medikament.antidepressiva_ssri'
    ]
  };


  /* ─── FRAGE 10: Situation (Multi-Select) ────────────────
     A = Keine (exklusiv), B = Schwangerschaft (nur Frauen 18-50),
     C = Wechseljahre (nur Frauen ab 40), D = Schlafprobleme,
     E = Reha / nach Krankheit
     
     WICHTIG (Modul 11): Schwangerschaft uebersteuert ALLES –
     Engine schaltet in restriktiven Modus mit nur 4-5 sicheren
     Wirkstoffen (Folsaeure, Vit D3, Omega-3 DHA, B12 bei
     Veganerinnen, Magnesium). Diese Whitelist-Logik liegt
     in der Engine, nicht hier.
     
     Wechseljahre/Schlaf/Reha sind reine Score-Modifikatoren.
  ──────────────────────────────────────────────────────── */
  var SITUATION = {
    'B': { schwangerschaft: true },
    'C': { wechseljahre: true },
    'D': { schlafprobleme: true },
    'E': { reha: true }
  };

  // Schwangerschaft triggert hart-Ausschluss bei mehreren Werten
  var SITUATION_KONTRA = {
    'B': [
      'medizinisch.schwangerschaft',
      'medizinisch.schwangerschaft_stillzeit',
      'schwangerschaft.schwangerschaft',
      'alter.schwangerschaft_stillzeit'
    ]
  };


  /* ─── FRAGE 10a: Schlafproblem-Typ (Folgefrage) ─────────
     Nur wenn Situation D = Schlafprobleme.
     A = Einschlafen   -> Melatonin (schlafphase_verzoegert)
     B = Durchschlafen -> Magnesium-Bisglycinat (schlaf)
     C = Beides        -> Kombi aus beiden
     
     Mapping auf indikation.ziel-Werte fuer Score-Boost.
  ──────────────────────────────────────────────────────── */
  var SCHLAFPROBLEM_TYP = {
    'A': ['schlafphase_verzoegert'],
    'B': ['schlaf', 'schlafqualitaet_senioren'],
    'C': ['schlafphase_verzoegert', 'schlaf']
  };


  /* ─── HELPER-FUNKTION ────────────────────────────────────
     Uebersetzt eine komplette AW-Struktur in eine Engine-taugliche
     Liste aller getriggerten Kontraindikations-Werte und Modi.
     
     Input:  AW-Objekt aus dem Quiz (state.js)
     Output: { kontra: [...], modi: {...}, ziele: [...] }
     
     - kontra: Liste von 'art.wert'-Strings, gegen die der Filter
               der Engine die Wirkstoff-Kontraindikationen prueft
     - modi:   strukturelle Flags (vegan, schwangerschaft, weiblich, ...)
     - ziele:  Liste von indikation.ziel-Werten fuer Score-Berechnung
  ──────────────────────────────────────────────────────── */
  function uebersetzeAW(AW) {
    var kontra = [];   // Liste 'art.wert'-Strings
    var modi = {};     // strukturelle Flags
    var ziele = [];    // Liste indikation.ziel-Werte

    if (!AW) return { kontra: kontra, modi: modi, ziele: ziele };

    // ─── Alter (Zahl, evtl. fehlend bei alten AW-Datensaetzen) ───
    if (typeof AW.alter === 'number' && AW.alter < 18) {
      kontra.push(ALTER_KONTRA.minderjaehrig);
      modi.minderjaehrig = true;
    }

    // ─── Geschlecht ───
    if (AW.geschlecht && GESCHLECHT[AW.geschlecht]) {
      var g = GESCHLECHT[AW.geschlecht];
      modi.weiblich = g.weiblich;
      modi.maennlich = g.maennlich;
    }

    // ─── Ziele (Array, max. 3 laut Quiz-Spec) ───
    if (Array.isArray(AW.ziele)) {
      for (var i = 0; i < AW.ziele.length; i++) {
        var zielCode = AW.ziele[i];
        if (ZIELE[zielCode]) {
          ziele = ziele.concat(ZIELE[zielCode]);
        }
      }
    }

    // ─── Training → implizite Ziel-Trigger (PDF Modul 5) ───
    if (AW.training && TRAINING_ZIELE[AW.training]) {
      ziele = ziele.concat(TRAINING_ZIELE[AW.training]);
    }

    // ─── Ernaehrung (Single-Select) ───
    if (AW.ernaehrung && ERNAEHRUNG[AW.ernaehrung]) {
      var ern = ERNAEHRUNG[AW.ernaehrung];
      for (var k in ern) {
        if (ern.hasOwnProperty(k)) modi[k] = ern[k];
      }
      if (ERNAEHRUNG_KONTRA[AW.ernaehrung]) {
        kontra = kontra.concat(ERNAEHRUNG_KONTRA[AW.ernaehrung]);
      }
    }

    // ─── Allergien (Array, A = exklusiv keine) ───
    if (Array.isArray(AW.unvertraeglichkeiten)) {
      for (var a = 0; a < AW.unvertraeglichkeiten.length; a++) {
        var allCode = AW.unvertraeglichkeiten[a];
        if (allCode === 'A') continue;
        if (ALLERGIEN[allCode]) {
          kontra = kontra.concat(ALLERGIEN[allCode]);
        }
        if (ALLERGIEN_MODI[allCode]) {
          var am = ALLERGIEN_MODI[allCode];
          for (var ak in am) {
            if (am.hasOwnProperty(ak)) modi[ak] = am[ak];
          }
        }
      }
    }

    // ─── Medikamente / Erkrankungen (Array, A = exklusiv keine) ───
    if (Array.isArray(AW.medikamente)) {
      for (var m = 0; m < AW.medikamente.length; m++) {
        var medCode = AW.medikamente[m];
        if (medCode === 'A') continue;
        if (MEDIKAMENTE[medCode]) {
          kontra = kontra.concat(MEDIKAMENTE[medCode]);
        }
      }
    }

    // ─── Situation (Array, A = exklusiv keine) ───
    if (Array.isArray(AW.situation)) {
      for (var s = 0; s < AW.situation.length; s++) {
        var sitCode = AW.situation[s];
        if (sitCode === 'A') continue;
        if (SITUATION[sitCode]) {
          var sm = SITUATION[sitCode];
          for (var sk in sm) {
            if (sm.hasOwnProperty(sk)) modi[sk] = sm[sk];
          }
        }
        if (SITUATION_KONTRA[sitCode]) {
          kontra = kontra.concat(SITUATION_KONTRA[sitCode]);
        }
      }
    }

    // ─── Schlafproblem-Typ (Folgefrage, nur wenn schlafprobleme) ───
    if (modi.schlafprobleme && AW.schlafproblem_typ
        && SCHLAFPROBLEM_TYP[AW.schlafproblem_typ]) {
      ziele = ziele.concat(SCHLAFPROBLEM_TYP[AW.schlafproblem_typ]);
    }

    // ─── Modus-basierte Ziel-Erweiterungen ───
    // Wenn z.B. modi.vegan=true, dann werden 'vegan_vegetarisch' etc.
    // als zusaetzliche Ziele behandelt, damit Wirkstoffe die spezifisch
    // fuer Veganer indiziert sind ebenfalls Score-Punkte bekommen.
    for (var mk in MODUS_ZIELE) {
      if (MODUS_ZIELE.hasOwnProperty(mk) && modi[mk] === true) {
        ziele = ziele.concat(MODUS_ZIELE[mk]);
      }
    }

    // ─── Deduplizieren (kontra + ziele koennen Duplikate haben) ───
    function dedupe(arr) {
      var seen = {};
      var out = [];
      for (var i = 0; i < arr.length; i++) {
        if (!seen[arr[i]]) {
          seen[arr[i]] = true;
          out.push(arr[i]);
        }
      }
      return out;
    }

    return {
      kontra: dedupe(kontra),
      modi: modi,
      ziele: dedupe(ziele)
    };
  }


  /* ─── PUBLIC API ───────────────────────────────────────── */
  return {
    // Konstante Mapping-Tabellen (fuer Tests / Engine-Direktzugriff)
    ALTER_KONTRA: ALTER_KONTRA,
    GESCHLECHT: GESCHLECHT,
    ZIELE: ZIELE,
    TRAINING_ZIELE: TRAINING_ZIELE,
    MODUS_ZIELE: MODUS_ZIELE,
    ERNAEHRUNG: ERNAEHRUNG,
    ERNAEHRUNG_KONTRA: ERNAEHRUNG_KONTRA,
    ALLERGIEN: ALLERGIEN,
    ALLERGIEN_MODI: ALLERGIEN_MODI,
    MEDIKAMENTE: MEDIKAMENTE,
    SITUATION: SITUATION,
    SITUATION_KONTRA: SITUATION_KONTRA,
    SCHLAFPROBLEM_TYP: SCHLAFPROBLEM_TYP,

    // Convenience: komplette AW uebersetzen
    uebersetzeAW: uebersetzeAW
  };

})();
