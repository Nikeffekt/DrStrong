/* ============================================================
   screens/wissen.js – Wissen-Screen

   Zwei Ansichten:
   1. UEBERSICHT: Alle 25 Wirkstoffe gruppiert nach Kategorie
                  - Pro Kategorie: Header (Emoji + Name)
                  - Pro Wirkstoff: Name + Kurzbeschreibung (1 Zeile)
                  - Klick auf Wirkstoff -> Detail-Ansicht
   2. DETAIL:     Detail-Ansicht eines Wirkstoffs
                  - Back-Button zurueck zur Uebersicht

   Abhaengigkeiten:
   - state.js              (WIRKSTOFFE_WISSEN, WIRKSTOFFE_DETAILS)
   - data/wirkstoffe-loader.js (ladenDetail fuer on-demand Detail-Daten)
============================================================ */

window.WissenScreen = (function () {
  'use strict';

  /* ──── STATE ──── */
  var kategorien = [];
  var aktiveAnsicht = 'uebersicht';  // 'uebersicht' | 'detail'
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


  /* ──── RENDER: UEBERSICHT (alle Wirkstoffe nach Kategorie) ──── */
  function renderUebersicht() {
    var html = [
      '<div class="wissen__header">',
      '  <h1 class="wissen__title">Wissensbasis</h1>',
      '  <p class="wissen__subtitle">25 Wirkstoffe · evidenzbasiert</p>',
      '</div>',
      '<div class="wissen__kategorien-liste">'
    ];

    kategorien.forEach(function (kat) {
      html.push(
        '<section class="kat-section">',
        '  <header class="kat-section__header">',
        '    <span class="kat-section__emoji">' + (kat.emoji || '•') + '</span>',
        '    <h2 class="kat-section__title">' + kat.label + '</h2>',
        '  </header>',
        '  <ul class="wirkstoff-liste">'
      );

      kat.wirkstoffe.forEach(function (wid) {
        var w = WIRKSTOFFE_WISSEN[wid];
        if (!w) {
          html.push(
            '<li class="wirkstoff-zeile wirkstoff-zeile--missing">',
            '  ' + wid + ' (Daten fehlen)',
            '</li>'
          );
          return;
        }

        var name = w.name || wid;
        var kurz = w.kurz_beschreibung || '';

        // Kurzbeschreibung auf eine Zeile begrenzen
        if (kurz.length > 100) kurz = kurz.substring(0, 97) + '…';

        html.push(
          '<li>',
          '  <button class="wirkstoff-zeile" data-wirkstoff="' + wid + '">',
          '    <div class="wirkstoff-zeile__body">',
          '      <div class="wirkstoff-zeile__name">' + name + '</div>',
          '      <div class="wirkstoff-zeile__kurz">' + kurz + '</div>',
          '    </div>',
          '    <div class="wirkstoff-zeile__arrow">→</div>',
          '  </button>',
          '</li>'
        );
      });

      html.push('  </ul>', '</section>');
    });

    html.push('</div>');
    $container.innerHTML = html.join('\n');

    // Event-Listener auf Wirkstoff-Zeilen
    var zeilen = $container.querySelectorAll('.wirkstoff-zeile[data-wirkstoff]');
    zeilen.forEach(function (zeile) {
      zeile.addEventListener('click', function () {
        oeffneWirkstoff(zeile.dataset.wirkstoff);
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

    var html = [
      '<div class="wissen__header">',
      '  <button class="wissen__back" data-action="zurueck-uebersicht" aria-label="Zurück">',
      '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
      '    </svg>',
      '    <span>Zurück zur Übersicht</span>',
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
    var backBtn = $container.querySelector('[data-action="zurueck-uebersicht"]');
    if (backBtn) backBtn.addEventListener('click', function () {
      aktiveAnsicht = 'uebersicht';
      aktiverWirkstoff = null;
      renderUebersicht();
      // Zum Anfang scrollen
      $container.scrollTop = 0;
    });
  }


  /* ──── NAVIGATION ──── */
  function oeffneWirkstoff(wirkstoffId) {
    aktiverWirkstoff = wirkstoffId;
    aktiveAnsicht = 'detail';

    // Detail on-demand laden (falls noch nicht geladen)
    if (window.WirkstoffeLoader && window.WirkstoffeLoader.ladenDetail) {
      window.WirkstoffeLoader.ladenDetail(wirkstoffId).then(function () {
        renderDetail(wirkstoffId);
        $container.scrollTop = 0;
      });
    } else {
      renderDetail(wirkstoffId);
      $container.scrollTop = 0;
    }
  }


  /* ──── PUBLIC: Screen anzeigen ──── */
  function zeige() {
    $container = document.getElementById('wissen-screen');
    if (!$container) {
      console.error('WissenScreen: #wissen-screen Element nicht gefunden');
      return;
    }

    if (!initialisiert) {
      initialisiert = true;
      $container.innerHTML = '<div class="wissen__loading">Lädt Wissensbasis…</div>';

      // Auf Wirkstoff-Daten warten falls noch nicht da
      var warteAufDaten = function () {
        return new Promise(function (resolve) {
          if (Object.keys(WIRKSTOFFE_WISSEN).length > 0) {
            resolve();
            return;
          }
          document.addEventListener('v3:datenBereit', function onReady() {
            document.removeEventListener('v3:datenBereit', onReady);
            resolve();
          });
          setTimeout(resolve, 5000);
        });
      };

      Promise.all([
        ladeKategorien(),
        warteAufDaten()
      ]).then(function () {
        aktiveAnsicht = 'uebersicht';
        renderUebersicht();
      });

    } else {
      // Beim Wiedereintritt: zur Uebersicht zurueck
      aktiveAnsicht = 'uebersicht';
      aktiverWirkstoff = null;
      renderUebersicht();
    }
  }


  return {
    zeige: zeige
  };

})();
