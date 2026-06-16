/* ============================================================
   screens/quiz.js – Quiz-Engine (v3, Spec v2)

   Basiert auf v2 (Juni 2026) aus altem Projekt, angepasst fuer v3:
   - Mint-Theme statt Orange
   - Modular als window.QuizScreen
   - In v3-Layout integriert

   Fragen (10 fix + 2 dynamisch):
   1. Geburtsjahr (rad)
   2. Geschlecht (M/W) -- NUR 2 Optionen, keine "k.A."!
   3. Gewicht (rad) -- Groesse rausgenommen, von Engine nie genutzt
   4. Training (choice)
   5. Erfahrung (choice)
   6. Ziele (multi, MAX 3) -- inkl. "Stress reduzieren"
   7. Ernaehrung (choice) -- inkl. "Pescetarisch"
   8. Unvertraeglichkeiten (multi) -- inkl. "Milcheiweiss-Allergie"
   9. Medikamente (multi) -- inkl. "Lebererkrankung"
   10. Situation (multi, dynamisch) -- inkl. "Reha"
   11. Schlafproblem-Typ (choice, dynamisch wenn Schlafproblem)

   Speichert in AW (state.js):
   - AW.geburtsjahr (Zahl)
   - AW.alter (Zahl in Jahren) -- NEU
   - AW.intro (Kategorie A-E fuer Rueckwaertskompatibilitaet)
   - AW.geschlecht (A=M, B=W)
   - AW.gewicht (String, kg)
   - AW.training, AW.erfahrung (Buchstabe / String)
   - AW.ziele (Array) -- max 3
   - AW.ernaehrung (Buchstabe)
   - AW.unvertraeglichkeiten (Array)
   - AW.medikamente (Array)
   - AW.situation (Array) -- Multi statt Single
   - AW.schlafproblem_typ (Buchstabe, optional)
============================================================ */

window.QuizScreen = (function () {
  'use strict';

  var fQueue = [];
  var qIdx = 0;
  var multiSel = [];
  var abgeschlossen = false;
  var $container;


  /* ──── FRAGEN-QUEUE (v2-Spec) ──── */
  function initQueue() {
    fQueue = [
      {
        id: 'intro', typ: 'rad', tag: 'Schritt 1',
        frage: 'Wann bist du geboren?',
        hint: 'Beeinflusst Vitamin-D, Kollagen und Dosierungen.',
        min: 1940, max: 2010, std: 1990, absteigend: true
      },
      {
        id: 'geschlecht', typ: 'choice', tag: 'Schritt 2',
        frage: 'Biologisches Geschlecht?',
        hint: 'Relevant für Eisen, Magnesium und Dosierungen.',
        opts: [
          { k: 'A', l: 'Männlich' },
          { k: 'B', l: 'Weiblich' }
        ]
      },
      {
        id: 'gewicht', typ: 'rad', tag: 'Schritt 3',
        frage: 'Wie viel wiegst du?',
        hint: 'Grundlage für exakte Proteindosierung.',
        einheit: 'kg', min: 40, max: 200, std: 75
      },
      {
        id: 'training', typ: 'choice', tag: 'Schritt 4',
        frage: 'Deine Trainingsform?',
        hint: 'Bestimmt deinen Supplement-Bedarf.',
        opts: [
          { k: 'A', l: 'Kraft 4+×/Woche' },
          { k: 'B', l: 'Kraft 2–3×/Woche' },
          { k: 'C', l: 'Hauptsächlich Cardio' },
          { k: 'D', l: 'Mix (Kraft + Cardio kombiniert)' },
          { k: 'E', l: 'Wenig Sport (≤ 1×/Woche)' }
        ]
      },
      {
        id: 'erfahrung', typ: 'choice', tag: 'Schritt 5',
        frage: 'Wie lange trainierst du regelmäßig?',
        hint: 'Beeinflusst die Komplexität deines Stacks.',
        opts: [
          { k: 'einsteiger',      l: 'Anfänger (< 1 Jahr)' },
          { k: 'fortgeschritten', l: 'Erfahren (1–3 Jahre)' },
          { k: 'profi',           l: 'Sehr erfahren (3+ Jahre)' }
        ]
      },
      {
        id: 'ziele', typ: 'multi', tag: 'Schritt 6',
        frage: 'Deine Ziele?',
        hint: 'Wähle deine 3 wichtigsten – das schärft die Empfehlungen.',
        max: 3,
        opts: [
          { k: 'A', l: '💪 Muskelaufbau' },
          { k: 'B', l: '🔥 Fettabbau' },
          { k: 'C', l: '⚡ Mehr Energie' },
          { k: 'D', l: '🏃 Ausdauer' },
          { k: 'E', l: '😴 Regeneration' },
          { k: 'F', l: '❤️ Gesundheit' },
          { k: 'G', l: '🧘 Stress reduzieren' }
        ]
      },
      {
        id: 'ernaehrung', typ: 'choice', tag: 'Schritt 7',
        frage: 'Deine Ernährungsweise?',
        hint: 'Beeinflusst Protein-Form, B12, Eisen und Omega-3.',
        opts: [
          { k: 'A', l: 'Alles essen' },
          { k: 'B', l: 'Flexitarisch (selten Fleisch)' },
          { k: 'C', l: 'Pescetarisch (Fisch, kein Fleisch)' },
          { k: 'D', l: 'Vegetarisch' },
          { k: 'E', l: 'Vegan' }
        ]
      },
      {
        id: 'unvertraeglichkeiten', typ: 'multi', tag: 'Schritt 8',
        frage: 'Unverträglichkeiten oder Allergien?',
        hint: 'Wichtig für deine Sicherheit – wir filtern Produkte entsprechend.',
        exkl: 'A',
        opts: [
          { k: 'A', l: 'Keine' },
          { k: 'B', l: '🥛 Laktoseintoleranz' },
          { k: 'C', l: '🥛 Milcheiweiß-Allergie' },
          { k: 'D', l: '🐟 Fischallergie' },
          { k: 'E', l: '🌾 Glutenunverträglichkeit' },
          { k: 'F', l: '🌱 Sojaallergie' }
        ]
      },
      {
        id: 'medikamente', typ: 'multi', tag: 'Schritt 9',
        frage: 'Erkrankungen oder regelmäßige Medikamente?',
        hint: 'Sicherheitsrelevant. Wir empfehlen nichts was problematisch wäre.',
        exkl: 'A',
        opts: [
          { k: 'A', l: 'Keine' },
          { k: 'B', l: 'Blutverdünner / Gerinnungshemmer' },
          { k: 'C', l: 'Schilddrüsenerkrankung' },
          { k: 'D', l: 'Bluthochdruck / Herzerkrankung' },
          { k: 'E', l: 'Nierenerkrankung' },
          { k: 'F', l: 'Lebererkrankung' },
          { k: 'G', l: 'Diabetes' },
          { k: 'H', l: 'Antidepressiva / Psychopharmaka' }
        ]
      }
      // Situations-Frage + Schlafproblem-Folgefrage werden DYNAMISCH eingefuegt
    ];
  }


  /* ──── DYNAMIK: Situations-Frage einbauen ──── */
  function injectSituation() {
    var geschlecht = AW['geschlecht'];
    var alter      = AW['alter'] || 0;
    var w          = geschlecht === 'B';

    // Vorherige Situation + Schlafproblem-Folgefrage entfernen
    fQueue = fQueue.filter(function (f) {
      return f.id !== 'situation' && f.id !== 'schlafproblem_typ';
    });

    var opts = [{ k: 'A', l: 'Keine besondere Situation' }];

    if (w && alter >= 18 && alter <= 50) {
      opts.push({ k: 'B', l: '🤰 Schwangerschaft / Stillzeit' });
    }
    if (w && alter >= 40) {
      opts.push({ k: 'C', l: '🌗 Wechseljahre' });
    }
    opts.push({ k: 'D', l: '😴 Schlafprobleme' });
    opts.push({ k: 'E', l: '💊 Reha / nach Krankheit' });

    fQueue.push({
      id: 'situation', typ: 'multi',
      tag: 'Schritt ' + (fQueue.length + 1),
      frage: 'Aktuelle Situation?',
      hint: 'Beeinflusst spezielle Empfehlungen. Mehrfachauswahl möglich.',
      exkl: 'A',
      opts: opts
    });
  }


  /* ──── DYNAMIK: Schlafproblem-Folgefrage ──── */
  function injectSchlafproblemTyp() {
    var sit = AW['situation'] || [];
    var hatSchlafproblem = Array.isArray(sit) && sit.indexOf('D') >= 0;

    fQueue = fQueue.filter(function (f) { return f.id !== 'schlafproblem_typ'; });

    if (hatSchlafproblem) {
      fQueue.push({
        id: 'schlafproblem_typ', typ: 'choice',
        tag: 'Schritt ' + (fQueue.length + 1),
        frage: 'Welche Art Schlafproblem?',
        hint: 'Bestimmt die richtige Empfehlung.',
        opts: [
          { k: 'A', l: 'Einschlafen (> 30 Min bis Schlaf)' },
          { k: 'B', l: 'Durchschlafen (Aufwachen, schwer wieder einschlafen)' },
          { k: 'C', l: 'Beides' }
        ]
      });
    }
  }


  /* ──── RENDER FRAGE ──── */
  function renderFrage() {
    var f = fQueue[qIdx];
    var tot = fQueue.length;
    multiSel = [];

    if (f.typ === 'multi' && AW[f.id]) {
      multiSel = AW[f.id].slice();
    }

    var h = [
      '<div class="quiz-inner">',
      '  <div class="quiz-progress">',
      '    <div class="quiz-progress__bar"><div class="quiz-progress__fill" style="width:' + Math.round((qIdx / tot) * 100) + '%"></div></div>',
      '    <div class="quiz-progress__text">' + (qIdx + 1) + ' / ' + tot + '</div>',
      '  </div>',
      '  <div class="quiz-tag">' + f.tag + '</div>',
      '  <h1 class="quiz-q">' + f.frage + '</h1>',
      '  <p class="quiz-hint">' + (f.hint || '') + '</p>'
    ];

    if (f.typ === 'choice')      h.push(renderChoice(f));
    else if (f.typ === 'multi')  h.push(renderMulti(f));
    else if (f.typ === 'rad')    h.push(renderRad(f));

    h.push('  <div class="quiz-nav">');
    h.push(qIdx > 0
      ? '    <button class="quiz-btn quiz-btn--ghost" id="quiz-back">← Zurück</button>'
      : '    <span></span>');
    h.push((f.typ === 'multi' || f.typ === 'rad')
      ? '    <button class="quiz-btn quiz-btn--primary" id="quiz-next">Weiter →</button>'
      : '    <span></span>');
    h.push('  </div>');
    h.push('</div>');

    $container.innerHTML = h.join('\n');
    bindEvents(f);
  }


  function renderChoice(f) {
    var cls = f.opts.length <= 3 ? 'quiz-options' : 'quiz-options quiz-options--grid';
    var h = ['<div class="' + cls + '">'];
    f.opts.forEach(function (o, i) {
      var aktiv = AW[f.id] === o.k ? ' is-selected' : '';
      h.push(
        '<button class="quiz-option' + aktiv + '" data-k="' + o.k + '">',
        '  <span class="quiz-option__num">' + (i + 1) + '</span>',
        '  <span class="quiz-option__label">' + o.l + '</span>',
        '  <span class="quiz-option__check">✓</span>',
        '</button>'
      );
    });
    h.push('</div>');
    return h.join('\n');
  }


  function renderMulti(f) {
    var h = ['<div class="quiz-options">'];
    // Hinweis bei max-Limit
    if (f.max) {
      h.push('<div class="quiz-multi-hint">Max. ' + f.max + ' Auswahl · <span class="quiz-multi-count">' + multiSel.length + '/' + f.max + '</span></div>');
    }
    f.opts.forEach(function (o, i) {
      var aktiv = multiSel.indexOf(o.k) !== -1 ? ' is-selected' : '';
      h.push(
        '<button class="quiz-option' + aktiv + '" data-k="' + o.k + '" data-ex="' + (f.exkl || '') + '">',
        '  <span class="quiz-option__num">' + (i + 1) + '</span>',
        '  <span class="quiz-option__label">' + o.l + '</span>',
        '  <span class="quiz-option__check">✓</span>',
        '</button>'
      );
    });
    h.push('</div>');
    return h.join('\n');
  }


  function renderRad(f) {
    var werte = [];
    if (f.absteigend) {
      for (var v = f.max; v >= f.min; v--) werte.push(v);
    } else {
      for (var v = f.min; v <= f.max; v++) werte.push(v);
    }

    var radKey = f.id === 'intro' ? 'geburtsjahr' : f.id;
    var aktWert = AW[radKey] || f.std;
    var aktIdx = werte.indexOf(parseInt(aktWert));
    if (aktIdx === -1) aktIdx = werte.indexOf(f.std);
    if (aktIdx === -1) aktIdx = 0;

    var einheit = f.einheit ? ' ' + f.einheit : '';

    var h = [
      '<div class="quiz-rad" data-aktiv-idx="' + aktIdx + '">',
      '  <div class="quiz-rad__viewport">',
      '    <div class="quiz-rad__scroll" id="quiz-rad-scroll">',
      '      <div class="quiz-rad__pad-top"></div>'
    ];

    werte.forEach(function (w, i) {
      h.push('      <div class="quiz-rad__item" data-idx="' + i + '" data-wert="' + w + '">' + w + einheit + '</div>');
    });

    h.push(
      '      <div class="quiz-rad__pad-bot"></div>',
      '    </div>',
      '  </div>',
      '  <div class="quiz-rad__indicator" aria-hidden="true"></div>',
      '</div>'
    );
    return h.join('\n');
  }


  /* ──── EVENTS ──── */
  function bindEvents(f) {
    var $back = document.getElementById('quiz-back');
    if ($back) $back.addEventListener('click', function () {
      if (qIdx > 0) { qIdx--; renderFrage(); }
    });

    var $next = document.getElementById('quiz-next');
    if ($next) $next.addEventListener('click', function () {
      if (f.typ === 'multi') {
        if (multiSel.length === 0) { blinkenWarn(); return; }
        AW[f.id] = multiSel.slice();
      } else if (f.typ === 'rad') {
        speichereRadWert(f);
      }
      weiter();
    });

    if (f.typ === 'choice' || f.typ === 'multi') {
      var $options = $container.querySelectorAll('.quiz-option');
      $options.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var k = btn.dataset.k;
          var exkl = btn.dataset.ex;

          if (f.typ === 'choice') {
            $options.forEach(function (b) { b.classList.remove('is-selected'); });
            btn.classList.add('is-selected');
            AW[f.id] = k;
            setTimeout(weiter, 260);

          } else if (f.typ === 'multi') {
            var wasSelected = btn.classList.contains('is-selected');

            if (k === exkl) {
              // Exklusiv-Option: alle anderen abwaehlen
              $options.forEach(function (b) { b.classList.remove('is-selected'); });
              multiSel = [];
              if (!wasSelected) {
                btn.classList.add('is-selected');
                multiSel = [k];
              }
            } else {
              // Andere Option: Exklusiv abwaehlen
              $options.forEach(function (b) {
                if (b.dataset.k === exkl) b.classList.remove('is-selected');
              });
              multiSel = multiSel.filter(function (x) { return x !== exkl; });

              if (wasSelected) {
                btn.classList.remove('is-selected');
                multiSel = multiSel.filter(function (x) { return x !== k; });
              } else {
                // Max-Limit pruefen (z.B. Ziele max:3)
                if (f.max && multiSel.length >= f.max) {
                  blinkenMaxWarn(f.max);
                  return;
                }
                btn.classList.add('is-selected');
                multiSel.push(k);
              }
            }

            // Counter aktualisieren falls max gesetzt
            if (f.max) {
              var $count = $container.querySelector('.quiz-multi-count');
              if ($count) $count.textContent = multiSel.length + '/' + f.max;
            }
          }
        });
      });
    }

    if (f.typ === 'rad') initWerteRad(f);
  }


  /* ──── WERTE-RAD ──── */
  function initWerteRad(f) {
    var $scroll = document.getElementById('quiz-rad-scroll');
    if (!$scroll) return;

    var $items = $scroll.querySelectorAll('.quiz-rad__item');
    var itemHeight = 52;

    var aktIdx = parseInt($scroll.parentElement.parentElement.dataset.aktivIdx) || 0;
    $scroll.scrollTop = aktIdx * itemHeight;

    function aktualisiereAktivItem() {
      var idx = Math.round($scroll.scrollTop / itemHeight);
      $items.forEach(function (item, i) {
        item.classList.toggle('is-active', i === idx);
      });
    }

    aktualisiereAktivItem();
    $scroll.addEventListener('scroll', aktualisiereAktivItem);

    $items.forEach(function (item, i) {
      item.addEventListener('click', function () {
        $scroll.scrollTo({ top: i * itemHeight, behavior: 'smooth' });
      });
    });
  }


  function speichereRadWert(f) {
    var $scroll = document.getElementById('quiz-rad-scroll');
    if (!$scroll) return;

    var itemHeight = 52;
    var idx = Math.round($scroll.scrollTop / itemHeight);

    var werte = [];
    if (f.absteigend) {
      for (var v = f.max; v >= f.min; v--) werte.push(v);
    } else {
      for (var v = f.min; v <= f.max; v++) werte.push(v);
    }

    idx = Math.max(0, Math.min(idx, werte.length - 1));
    var wert = werte[idx];

    if (f.id === 'intro') {
      // Geburtsjahr → Zahl + Alter (Zahl) + Kategorie A-E (Rueckwaertskompatibilitaet)
      AW['geburtsjahr'] = wert;
      var alter = new Date().getFullYear() - wert;
      AW['alter'] = alter;
      AW[f.id] = alter < 18 ? 'A' :
                 alter <= 25 ? 'B' :
                 alter <= 35 ? 'C' :
                 alter <= 45 ? 'D' : 'E';
    } else {
      AW[f.id] = String(wert);
    }
  }


  /* ──── NAVIGATION ──── */
  function weiter() {
    var f = fQueue[qIdx];
    // Nach Geschlecht ODER Medikamente: Situations-Frage einbauen
    if (f.id === 'geschlecht' || f.id === 'medikamente') {
      injectSituation();
    }
    // Nach Situation: Schlafproblem-Folgefrage einbauen (wenn ausgewaehlt)
    if (f.id === 'situation') {
      injectSchlafproblemTyp();
    }

    qIdx++;
    if (qIdx >= fQueue.length) zeigeAbschluss();
    else { renderFrage(); $container.scrollTop = 0; }
  }


  function zeigeAbschluss() {
    abgeschlossen = true;
    $container.innerHTML = [
      '<div class="quiz-inner">',
      '  <div class="quiz-finish">',
      '    <div class="quiz-finish__icon">✓</div>',
      '    <h1 class="quiz-finish__title">Profil komplett</h1>',
      '    <p class="quiz-finish__sub">',
      '      Danke! Wir kennen dich jetzt und können dir passende Wirkstoffe empfehlen.',
      '    </p>',
      '    <button class="quiz-btn quiz-btn--primary quiz-btn--large" id="quiz-zu-empfehlungen">',
      '      Empfehlungen ansehen →',
      '    </button>',
      '    <button class="quiz-btn quiz-btn--ghost" id="quiz-nochmal">',
      '      Quiz nochmal starten',
      '    </button>',
      '  </div>',
      '</div>'
    ].join('\n');

    var $btnEmpf = document.getElementById('quiz-zu-empfehlungen');
    if ($btnEmpf) $btnEmpf.addEventListener('click', function () {
      console.log('Quiz-Antworten:', AW);

      // ── Engine aufrufen (Phase 2) ──
      if (typeof window.Empfehlungen === 'undefined' ||
          typeof window.Empfehlungen.berechneStack !== 'function') {
        console.error('Empfehlungen-Engine nicht geladen!');
        alert('Engine-Fehler – siehe Konsole.');
        return;
      }

      var stack;
      try {
        stack = window.Empfehlungen.berechneStack(AW);
      } catch (err) {
        console.error('Engine-Fehler beim berechneStack:', err);
        alert('Engine-Fehler – siehe Konsole.');
        return;
      }

      // ── In State + localStorage speichern ──
      window.aktuellerStack = stack;
      if (window.StackPersistenz && window.StackPersistenz.speichere) {
        var ok = window.StackPersistenz.speichere(AW, stack);
        if (!ok) console.warn('Stack konnte nicht persistiert werden (localStorage?)');
      }

      console.log('✓ Stack berechnet:', stack);
      console.log('  Essential: ' + stack.meta.anzahl_essential);
      console.log('  Empfohlen: ' + stack.meta.anzahl_empfohlen);
      console.log('  Optional:  ' + stack.meta.anzahl_optional);

      // ── TODO Schritt B: Navigation zum Stack-Screen ──
      // window.Navigation.zeigeScreen('stack');
      alert(
        'Stack berechnet ✓\n\n' +
        'Essential: ' + stack.meta.anzahl_essential + '\n' +
        'Empfohlen: ' + stack.meta.anzahl_empfohlen + '\n' +
        'Optional: '  + stack.meta.anzahl_optional + '\n\n' +
        'Detail-Ansicht kommt in Phase 3 Schritt B.\n' +
        'Volle Daten in Console (F12).'
      );
    });

    var $btnNochmal = document.getElementById('quiz-nochmal');
    if ($btnNochmal) $btnNochmal.addEventListener('click', function () {
      for (var k in AW) { if (AW.hasOwnProperty(k)) delete AW[k]; }
      qIdx = 0;
      multiSel = [];
      abgeschlossen = false;
      initQueue();
      renderFrage();
    });
  }


  function blinkenWarn() {
    var $next = document.getElementById('quiz-next');
    if (!$next) return;
    $next.classList.add('is-warn');
    setTimeout(function () { $next.classList.remove('is-warn'); }, 600);
  }


  function blinkenMaxWarn(max) {
    // Hint-Element kurz aufleuchten lassen + Schuettel-Animation
    var $hint = $container.querySelector('.quiz-multi-hint');
    if (!$hint) return;
    $hint.classList.add('is-warn');
    setTimeout(function () { $hint.classList.remove('is-warn'); }, 600);
  }


  /* ──── PUBLIC ──── */
  function zeige() {
    $container = document.getElementById('quiz-screen');
    if (!$container) {
      console.error('QuizScreen: #quiz-screen Element nicht gefunden');
      return;
    }

    if (fQueue.length === 0) {
      initQueue();
      // Wenn schon Situation beantwortet (Wiederaufnahme): dynamische Fragen wiederherstellen
      if (AW['geschlecht']) {
        // Wenn Medikamente fertig, Situation einbauen
        if (AW['medikamente']) injectSituation();
        // Wenn Situation fertig, evtl. Schlafproblem-Typ einbauen
        if (AW['situation']) injectSchlafproblemTyp();
      }
    }

    if (abgeschlossen) { zeigeAbschluss(); return; }
    renderFrage();
  }

  return { zeige: zeige };

})();
