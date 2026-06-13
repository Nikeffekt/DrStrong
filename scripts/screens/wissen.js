/* ============================================================
   screens/wissen.js – Wissen-Screen

   Aufgaben:
   - Lädt Kategorien aus data/meta/kategorien.json
   - Zeigt 3 Ansichten (View-States):
     1. KATEGORIEN: Übersicht aller 5 Kategorie-Karten
     2. LISTE:      Wirkstoffe einer ausgewählten Kategorie
     3. DETAIL:     Detail-Ansicht eines Wirkstoffs
   - Navigation zwischen den Views via Back-Button

   Abhaengigkeiten:
   - state.js              (WIRKSTOFFE_WISSEN, WIRKSTOFFE_DETAILS)
   - data/wirkstoffe-loader.js (ladenDetail für on-demand Detail-Daten)
============================================================ */

window.WissenScreen = (function () {
  'use strict';

  /* ──── STATE ──── */
  var kategorien = [];        // aus kategorien.json
  var aktiveAnsicht = 'kategorien';  // 'kategorien' | 'liste' | 'detail'
  var aktiveKategorie = null;
  var aktiverWirkstoff = null;
  var initialisiert = false;


  /* ──── DOM-REFS ──── */
  var $container;


  /* ──── KATEGORIEN LADEN ──── */
  function ladeKategorien() {
    return fetch('data/meta/kategorien.json')
      .then(function (r) {
        if (!r.ok) throw new Error('kategorien.json: HTTP ' + r.status);
        return r.json();
      })
      .then(function (daten) {
        kategorien = daten.kategorien || [];
        console.log('✅ Kategorien geladen: ' + kategorien.length);
      })
      .catch(function (err) {
        console.error('Fehler beim Laden der Kategorien:', err);
        kategorien = [];
      });
  }


  /* ──── RENDER: KATEGORIEN-ÜBERSICHT ──── */
  function renderKategorien() {
    var html = [
      '<div class="wissen__header">',
      '  <h1 class="wissen__title">Wissensbasis</h1>',
      '  <p class="wissen__subtitle">25 Wirkstoffe · evidenzbasiert · 5 Kategorien</p>',
      '</div>',
      '<div class="wissen__kategorien">'
    ];

    kategorien.forEach(function (kat) {
      var anzahl = kat.wirkstoffe.length;
      html.push(
        '<button class="kat-card" data-kategorie="' + kat.id + '">',
        '  <div class="kat-card__icon">' + (kat.emoji || '•') + '</div>',
        '  <div class="kat-card__body">',
        '    <div class="kat-card__title">' + kat.label + '</div>',
        '    <div class="kat-card__desc">' + kat.beschreibung + '</div>',
        '    <div class="kat-card__count">' + anzahl + ' Wirkstoffe</div>',
        '  </div>',
        '  <div class="kat-card__arrow">→</div>',
        '</button>'
      );
    });

    html.push('</div>');
    $container.innerHTML = html.join('\n');

    // Event-Listener auf Kategorie-Karten
    var karten = $container.querySelectorAll('.kat-card');
    karten.forEach(function (karte) {
      karte.addEventListener('click', function () {
        oeffneKategorie(karte.dataset.kategorie);
      });
    });
  }


  /* ──── RENDER: WIRKSTOFF-LISTE einer Kategorie ──── */
  function renderListe(kategorieId) {
    var kat = kategorien.find(function (k) { return k.id === kategorieId; });
    if (!kat) {
      renderKategorien();
      return;
    }

    var html = [
      '<div class="wissen__header">',
      '  <button class="wissen__back" data-action="zurueck-kategorien" aria-label="Zurück">',
      '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
      '    </svg>',
      '    <span>Zurück</span>',
      '  </button>',
      '  <h1 class="wissen__title"><span class="wissen__title-emoji">' + kat.emoji + '</span> ' + kat.label + '</h1>',
      '  <p class="wissen__subtitle">' + kat.beschreibung + '</p>',
      '</div>',
      '<div class="wissen__wirkstoffe">'
    ];

    kat.wirkstoffe.forEach(function (wid) {
      var w = WIRKSTOFFE_WISSEN[wid];
      if (!w) {
        html.push('<div class="wirkstoff-card wirkstoff-card--missing">' + wid + ' (Daten fehlen)</div>');
        return;
      }

      var name = w.name || wid;
      var kurz = w.kurz_beschreibung || '';
      var level = (w.evidenz && w.evidenz.level) || '?';

      // Kurzbeschreibung kürzen wenn zu lang
      if (kurz.length > 110) kurz = kurz.substring(0, 107) + '...';

      html.push(
        '<button class="wirkstoff-card" data-wirkstoff="' + wid + '">',
        '  <div class="wirkstoff-card__head">',
        '    <div class="wirkstoff-card__name">' + name + '</div>',
        '    <div class="wirkstoff-card__level" title="Evidenz-Level">' + level + '</div>',
        '  </div>',
        '  <div class="wirkstoff-card__kurz">' + kurz + '</div>',
        '</button>'
      );
    });

    html.push('</div>');
    $container.innerHTML = html.join('\n');

    // Back-Button
    var backBtn = $container.querySelector('[data-action="zurueck-kategorien"]');
    if (backBtn) backBtn.addEventListener('click', function () {
      aktiveAnsicht = 'kategorien';
      aktiveKategorie = null;
      renderKategorien();
    });

    // Wirkstoff-Karten
    var karten = $container.querySelectorAll('.wirkstoff-card[data-wirkstoff]');
    karten.forEach(function (karte) {
      karte.addEventListener('click', function () {
        oeffneWirkstoff(karte.dataset.wirkstoff);
      });
    });
  }


  /* ──── RENDER: DETAIL-ANSICHT ──── */
  function renderDetail(wirkstoffId) {
    var w = WIRKSTOFFE_WISSEN[wirkstoffId];
    if (!w) {
      $container.innerHTML = '<div class="wissen__error">Wirkstoff "' + wirkstoffId + '" nicht in Wissensbasis</div>';
      return;
    }

    var detail = WIRKSTOFFE_DETAILS[wirkstoffId];  // optional, ggf. nicht geladen

    var html = [
      '<div class="wissen__header">',
      '  <button class="wissen__back" data-action="zurueck-liste" aria-label="Zurück">',
      '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
      '    </svg>',
      '    <span>Zurück zur Liste</span>',
      '  </button>',
      '</div>',
      '<article class="wirkstoff-detail">'
    ];

    // Titel-Bereich
    html.push(
      '<header class="wirkstoff-detail__head">',
      '  <h1 class="wirkstoff-detail__name">' + (w.name || wirkstoffId) + '</h1>'
    );
    if (w.kategorie) {
      html.push('  <div class="wirkstoff-detail__kategorie">' + w.kategorie + '</div>');
    }
    html.push('</header>');

    // Kurzbeschreibung
    if (w.kurz_beschreibung) {
      html.push('<p class="wirkstoff-detail__lead">' + w.kurz_beschreibung + '</p>');
    }

    // Evidenz-Block
    if (w.evidenz) {
      var e = w.evidenz;
      html.push(
        '<section class="ws-section">',
        '  <h2 class="ws-section__title">Evidenz</h2>',
        '  <div class="ws-evidenz">',
        '    <div class="ws-evidenz__level">Level ' + (e.level || '?') + '</div>'
      );
      if (e.score) {
        html.push('    <div class="ws-evidenz__score">Score ' + e.score + '/100</div>');
      }
      if (e.studien_anzahl) {
        html.push('    <div class="ws-evidenz__studien">' + e.studien_anzahl + ' Studien</div>');
      }
      html.push('  </div>');
      if (e.konsens) {
        html.push('  <p class="ws-evidenz__konsens">' + e.konsens + '</p>');
      }
      html.push('</section>');
    }

    // Top-Effekte / Fazit
    if (w.fazit) {
      var f = w.fazit;
      if (f.top_effekte && f.top_effekte.length > 0) {
        html.push(
          '<section class="ws-section">',
          '  <h2 class="ws-section__title">Top-Effekte</h2>',
          '  <ul class="ws-list">'
        );
        f.top_effekte.forEach(function (eff) {
          html.push('    <li>' + eff + '</li>');
        });
        html.push('  </ul>', '</section>');
      }

      if (f.dosis) {
        html.push(
          '<section class="ws-section">',
          '  <h2 class="ws-section__title">Dosierung</h2>',
          '  <p class="ws-text">' + f.dosis + '</p>',
          '</section>'
        );
      }

      if (f.ideal_fuer) {
        html.push(
          '<section class="ws-section">',
          '  <h2 class="ws-section__title">Ideal für</h2>',
          '  <p class="ws-text">' + f.ideal_fuer + '</p>',
          '</section>'
        );
      }

      if (f.vorsicht_bei) {
        html.push(
          '<section class="ws-section ws-section--warning">',
          '  <h2 class="ws-section__title">⚠️ Vorsicht bei</h2>',
          '  <p class="ws-text">' + f.vorsicht_bei + '</p>',
          '</section>'
        );
      }

      if (f.mythen && f.mythen.length > 0) {
        html.push(
          '<section class="ws-section">',
          '  <h2 class="ws-section__title">💡 Mythen aufgeklärt</h2>',
          '  <ul class="ws-list ws-list--mythen">'
        );
        f.mythen.forEach(function (m) {
          html.push('    <li>' + m + '</li>');
        });
        html.push('  </ul>', '</section>');
      }
    }

    // Kontraindikationen
    if (w.kontraindikationen && w.kontraindikationen.length > 0) {
      html.push(
        '<section class="ws-section ws-section--warning">',
        '  <h2 class="ws-section__title">🚫 Kontraindikationen</h2>',
        '  <ul class="ws-list">'
      );
      w.kontraindikationen.forEach(function (k) {
        var line = (k.art || '') + ': ' + (k.wert || '');
        if (k.schwere) line += ' [' + k.schwere + ']';
        if (k.hinweis) line += ' – ' + k.hinweis;
        html.push('    <li>' + line + '</li>');
      });
      html.push('  </ul>', '</section>');
    }

    // Wechselwirkungen
    if (w.wechselwirkungen && w.wechselwirkungen.length > 0) {
      html.push(
        '<section class="ws-section">',
        '  <h2 class="ws-section__title">Wechselwirkungen</h2>',
        '  <ul class="ws-list">'
      );
      w.wechselwirkungen.forEach(function (ww) {
        var text = typeof ww === 'string' ? ww : ((ww.mit || '?') + ': ' + (ww.hinweis || ''));
        html.push('    <li>' + text + '</li>');
      });
      html.push('  </ul>', '</section>');
    }

    html.push('</article>');
    $container.innerHTML = html.join('\n');

    // Back-Button
    var backBtn = $container.querySelector('[data-action="zurueck-liste"]');
    if (backBtn) backBtn.addEventListener('click', function () {
      aktiveAnsicht = 'liste';
      aktiverWirkstoff = null;
      renderListe(aktiveKategorie);
    });
  }


  /* ──── NAVIGATION ──── */
  function oeffneKategorie(kategorieId) {
    aktiveKategorie = kategorieId;
    aktiveAnsicht = 'liste';
    renderListe(kategorieId);
  }

  function oeffneWirkstoff(wirkstoffId) {
    aktiverWirkstoff = wirkstoffId;
    aktiveAnsicht = 'detail';

    // Detail on-demand laden (falls noch nicht geladen)
    if (window.WirkstoffeLoader && window.WirkstoffeLoader.ladenDetail) {
      window.WirkstoffeLoader.ladenDetail(wirkstoffId).then(function () {
        renderDetail(wirkstoffId);
      });
    } else {
      renderDetail(wirkstoffId);
    }
  }


  /* ──── PUBLIC: Screen anzeigen ──── */
  function zeige() {
    $container = document.getElementById('wissen-screen');
    if (!$container) {
      console.error('WissenScreen: #wissen-screen Element nicht gefunden');
      return;
    }

    // Beim ersten Aufruf Kategorien laden
    if (!initialisiert) {
      initialisiert = true;

      // Loading-State sofort anzeigen (sonst sieht User leere Seite)
      $container.innerHTML = '<div class="wissen__loading">Lädt Wissensbasis…</div>';

      // Wenn Wirkstoffe-Daten noch nicht da, auf sie warten
      var warteAufDaten = function () {
        return new Promise(function (resolve) {
          // Check ob bereits geladen
          if (Object.keys(WIRKSTOFFE_WISSEN).length > 0) {
            resolve();
            return;
          }
          // Sonst auf datenBereit-Event warten
          document.addEventListener('v3:datenBereit', function onReady() {
            document.removeEventListener('v3:datenBereit', onReady);
            resolve();
          });
          // Fallback nach 5s falls Event nicht kommt
          setTimeout(resolve, 5000);
        });
      };

      // Kategorien laden + auf Wirkstoff-Daten warten
      Promise.all([
        ladeKategorien(),
        warteAufDaten()
      ]).then(function () {
        aktiveAnsicht = 'kategorien';
        renderKategorien();
      });

    } else {
      // Reset auf Übersicht beim Wieder-Reinkommen
      aktiveAnsicht = 'kategorien';
      aktiveKategorie = null;
      aktiverWirkstoff = null;
      renderKategorien();
    }
  }


  return {
    zeige: zeige
  };

})();
