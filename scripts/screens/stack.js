/* ============================================================
   screens/stack.js – Stack-Screen (Phase 3 Schritt B, MVP)

   Zeigt die von der Engine empfohlenen Wirkstoffe an.

   Zwei Zustaende:
   1. EMPTY-STATE: aktuellerStack ist null
      -> Hinweis "Quiz starten" + Button zum Quiz-Screen
   2. STACK-ANSICHT: flache Liste aller empfohlenen Wirkstoffe
      -> Essential + Empfohlen + Optional zusammen, ohne Sektions-Headers
      -> Reihenfolge bleibt wie die Engine sie liefert
         (Essential zuerst, dann Empfohlen, dann Optional - jeweils nach Score sortiert)

   Pro Karte:
   - Ikon aus WIRKSTOFFE_WISSEN[id].ikon
   - Name
   - 1-Satz-Match-Begruendung (aus matched_ziele, matched_populationen + Modi)

   Klick auf Karte: noch kein Handler. Detail-Modal kommt in Schritt C.

   Abhaengigkeiten:
   - state.js (aktuellerStack, WIRKSTOFFE_WISSEN, AW)
   - navigation.js (Navigation.zeige)
============================================================ */

window.StackScreen = (function () {
  'use strict';

  /* ──── STATE ──── */
  var $container;


  /* ============================================================
     MAPPING: Wissensbasis-Ziele -> User-freundliche Labels

     Nicht jeder technische Indikations-Key braucht ein eigenes
     Label. Wir mappen die haeufigsten und nutzen einen
     Auto-Fallback (Unterstrich -> Space, capitalize) fuer
     unbekannte Werte.
  ============================================================ */
  var ZIEL_LABEL = {
    // Muskel & Kraft
    'muskelaufbau': 'Muskelaufbau',
    'kraft': 'Kraftsteigerung',
    'kraftsteigerung': 'Kraftsteigerung',
    'muskelausdauer': 'Muskelausdauer',
    'muskelfunktion': 'Muskelfunktion',
    'pump_durchblutung': 'Pump & Durchblutung',
    'sprint_power': 'Sprintleistung',
    'hochintensiv_intervall': 'Hochintensives Training',

    // Fettabbau
    'fettabbau': 'Fettabbau',
    'gewichtsmanagement': 'Gewichtsmanagement',
    'diaet_kalorienreduktion': 'Diät',
    'fettabbau_muskelerhalt': 'Fettabbau mit Muskelerhalt',
    'muskelerhalt_diaet': 'Muskelerhalt in der Diät',

    // Energie & Kognition
    'energie': 'Energie',
    'energie_muedigkeit': 'Müdigkeit',
    'energie_wohlbefinden': 'Energie & Wohlbefinden',
    'kognition_wachheit': 'Wachheit',
    'kognition_konzentration': 'Konzentration',

    // Ausdauer
    'ausdauer': 'Ausdauer',
    'ausdauer_hochintensiv': 'Hochintensive Ausdauer',
    'ausdauer_lang': 'Lange Ausdauereinheiten',
    'hydration': 'Hydration',

    // Regeneration & Recovery
    'regeneration': 'Regeneration',
    'recovery': 'Recovery',
    'muskelregeneration': 'Muskelregeneration',
    'entzuendung': 'Entzündungen',
    'gelenkschmerzen_oa': 'Gelenkschmerzen',
    'gelenkgesundheit': 'Gelenkgesundheit',
    'sehnen_baender': 'Sehnen & Bänder',
    'schlaf': 'Schlaf',

    // Gesundheit
    'gesundheit': 'Gesundheit',
    'immunsystem': 'Immunsystem',
    'herzgesundheit': 'Herzgesundheit',
    'kardiovaskulaere_gesundheit': 'Herzgesundheit',
    'knochengesundheit': 'Knochengesundheit',
    'erkaeltung_akut': 'Erkältungen',
    'antioxidativ': 'Zellschutz',
    'verdauung_allgemein': 'Verdauung',
    'reizdarm_ibs': 'Reizdarm',
    'gehirn_kognition': 'Gehirn & Kognition',
    'stoffwechsel': 'Stoffwechsel',
    'nervensystem': 'Nervensystem',
    'hautgesundheit': 'Hautgesundheit',
    'wundheilung_haut': 'Wundheilung',
    'mangelausgleich': 'Mangelausgleich',
    'mangelpraevention': 'Mangelprävention',

    // Stress & Stimmung
    'stress': 'Stressabbau',
    'stress_angst': 'Stress & Angst',
    'stimmung': 'Stimmung',
    'hormonhaushalt': 'Hormonhaushalt'
  };


  /* ──── Helper: Fallback-Label fuer unbekannte Ziele ──── */
  function autoLabel(key) {
    if (typeof key !== 'string') return '';
    // 'energie_muedigkeit' -> 'Energie Muedigkeit'
    var teile = key.split('_');
    return teile.map(function (t) {
      if (!t) return '';
      return t.charAt(0).toUpperCase() + t.slice(1);
    }).join(' ');
  }


  /* ──── Helper: Quiz-Ziel-Key zu User-Label ──── */
  function zielLabel(key) {
    if (ZIEL_LABEL[key]) return ZIEL_LABEL[key];
    return autoLabel(key);
  }


  /* ============================================================
     Match-Begruendung pro Wirkstoff bauen

     Logik in absteigender Prioritaet:
     1. Basis-Stack (Vitamin D3, Omega-3): "Universelle Basis-Versorgung"
     2. Schwangerschafts-Modus: "Wichtig in der Schwangerschaft"
     3. Schlaf-Erstempfehlung (Melatonin/Magnesium + AW.schlafproblem_typ):
        "Für besseren Schlaf"
     4. Sonst: erste 1-2 matched_ziele zu User-Labels
        -> "Für Muskelaufbau"  oder  "Für Muskelaufbau und Regeneration"
     5. Fallback: "Empfohlen für dein Profil"
  ============================================================ */
  function buildBegruendung(eintrag, stack) {
    var BASIS_STACK = ['vitamin-d3', 'omega3'];

    // 1. Basis-Stack
    if (BASIS_STACK.indexOf(eintrag.id) >= 0) {
      return 'Universelle Basis-Versorgung';
    }

    // 2. Schwangerschaft
    var modi = stack && stack.modi ? stack.modi : {};
    if (modi.schwangerschaft) {
      return 'Wichtig in der Schwangerschaft';
    }

    // 3. Schlaf-Erstempfehlung (Melatonin, Magnesium)
    if (modi.schlafprobleme &&
        (eintrag.id === 'melatonin' || eintrag.id === 'magnesium')) {
      return 'Für besseren Schlaf';
    }

    // 4. Aus matched_ziele die ersten 1-2 nehmen
    var ziele = eintrag.matched_ziele || [];
    if (ziele.length === 1) {
      return 'Für ' + zielLabel(ziele[0]);
    }
    if (ziele.length >= 2) {
      return 'Für ' + zielLabel(ziele[0]) + ' und ' + zielLabel(ziele[1]);
    }

    // 5. Fallback (z.B. nur Population-Match, kein Ziel)
    return 'Empfohlen für dein Profil';
  }


  /* ──── Helper: Ikon aus Wissensbasis holen ──── */
  function ikonFuer(wirkstoffId) {
    var w = WIRKSTOFFE_WISSEN[wirkstoffId];
    if (w && w.ikon) return w.ikon;
    return '•';  // dezenter Fallback
  }


  /* ──── Helper: HTML-Escape ──── */
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }


  /* ============================================================
     RENDER: Empty-State
  ============================================================ */
  function renderEmpty() {
    $container.innerHTML = [
      '<div class="stack-empty">',
      '  <div class="stack-empty__inner">',
      '    <div class="stack-empty__label">dein stack</div>',
      '    <h1 class="stack-empty__title">Noch kein Stack</h1>',
      '    <p class="stack-empty__text">',
      '      Mach das Quiz und du bekommst deine personalisierten',
      '      Wirkstoff-Empfehlungen.',
      '    </p>',
      '    <button class="stack-empty__cta" id="stack-zum-quiz">',
      '      Quiz starten →',
      '    </button>',
      '  </div>',
      '</div>'
    ].join('\n');

    var $btn = document.getElementById('stack-zum-quiz');
    if ($btn) {
      $btn.addEventListener('click', function () {
        if (window.Navigation && window.Navigation.zeige) {
          window.Navigation.zeige('quiz');
        }
      });
    }
  }


  /* ============================================================
     RENDER: Stack-Liste (flach)
  ============================================================ */
  function renderStack(stack) {
    // Flache Liste: Essential, Empfohlen, Optional in dieser Reihenfolge.
    // Die Engine hat innerhalb jedes Buckets schon nach Score sortiert.
    var alle = []
      .concat(stack.essential || [])
      .concat(stack.empfohlen || [])
      .concat(stack.optional  || []);

    if (alle.length === 0) {
      // Edge-Case: Quiz gemacht, aber alles wurde wegfiltert.
      // Selten, aber theoretisch moeglich.
      $container.innerHTML = [
        '<div class="stack__header">',
        '  <h1 class="stack__title">Dein Stack</h1>',
        '</div>',
        '<div class="stack-empty stack-empty--alt">',
        '  <div class="stack-empty__inner">',
        '    <p class="stack-empty__text">',
        '      Aktuell konnten wir keine passenden Wirkstoffe für dich',
        '      finden. Probier es mit anderen Antworten im Quiz.',
        '    </p>',
        '  </div>',
        '</div>'
      ].join('\n');
      return;
    }

    var teile = [
      '<div class="stack__header">',
      '  <h1 class="stack__title">Dein Stack</h1>',
      '  <p class="stack__subtitle">' + alle.length + ' empfohlene Wirkstoffe</p>',
      '</div>',
      '<ul class="stack-list">'
    ];

    alle.forEach(function (eintrag) {
      var ikon = ikonFuer(eintrag.id);
      var name = esc(eintrag.name || eintrag.id);
      var begruendung = esc(buildBegruendung(eintrag, stack));

      teile.push(
        '<li class="stack-card" data-wirkstoff-id="' + esc(eintrag.id) + '">',
        '  <div class="stack-card__ikon" aria-hidden="true">' + ikon + '</div>',
        '  <div class="stack-card__body">',
        '    <div class="stack-card__name">' + name + '</div>',
        '    <div class="stack-card__begruendung">' + begruendung + '</div>',
        '  </div>',
        '</li>'
      );
    });

    teile.push('</ul>');
    $container.innerHTML = teile.join('\n');

    // Schritt C kommt: Hier wird der Klick-Handler auf .stack-card sitzen
    // und ein Bottom-Sheet mit Details oeffnen. Aktuell: bewusst kein Handler.
  }


  /* ============================================================
     PUBLIC: zeige() – wird von Navigation.zeige('stack') aufgerufen
  ============================================================ */
  function zeige() {
    $container = document.getElementById('stack-screen');
    if (!$container) {
      console.error('StackScreen: #stack-screen Element nicht gefunden');
      return;
    }

    var stack = window.aktuellerStack;

    if (!stack) {
      renderEmpty();
      return;
    }

    renderStack(stack);
  }


  return {
    zeige: zeige
  };

})();
