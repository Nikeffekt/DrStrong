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


  /* ──── HELPER: Wirkstoff-Ikon holen (analog Stack-Screen) ──── */
  function ikonFuer(wirkstoffId) {
    var w = WIRKSTOFFE_WISSEN[wirkstoffId];
    if (w && w.ikon) return w.ikon;
    return '•';  /* dezenter Fallback */
  }


  /* ──── HELPER: HTML-Escape ──── */
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }


  /* ──── RENDER: UEBERSICHT (alle Wirkstoffe nach Kategorie) ────
     Karten-Style konsistent zum Stack-Screen:
       Ikon links + Body rechts (Name + Kurzbeschreibung)
     Kategorie-Sections strukturieren die Liste. */
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
        '    <span class="kat-section__emoji">' + esc(kat.emoji || '•') + '</span>',
        '    <h2 class="kat-section__title">' + esc(kat.label) + '</h2>',
        '  </header>',
        '  <ul class="wissen-list">'
      );

      kat.wirkstoffe.forEach(function (wid) {
        var w = WIRKSTOFFE_WISSEN[wid];

        // Fallback fuer fehlende Wirkstoff-Daten
        if (!w) {
          html.push(
            '<li class="wissen-card wissen-card--missing">',
            '  <div class="wissen-card__body">',
            '    <div class="wissen-card__name">' + esc(wid) + '</div>',
            '    <div class="wissen-card__kurz">Daten fehlen</div>',
            '  </div>',
            '</li>'
          );
          return;
        }

        var name = w.name || wid;
        var kurz = w.kurz_beschreibung || '';
        // Kurzbeschreibung auf eine Zeile begrenzen
        if (kurz.length > 100) kurz = kurz.substring(0, 97) + '…';

        var ikon = ikonFuer(wid);

        html.push(
          '<li class="wissen-card" data-wirkstoff-id="' + esc(wid) + '">',
          '  <div class="wissen-card__ikon" aria-hidden="true">' + ikon + '</div>',
          '  <div class="wissen-card__body">',
          '    <div class="wissen-card__name">' + esc(name) + '</div>',
          '    <div class="wissen-card__kurz">' + esc(kurz) + '</div>',
          '  </div>',
          '</li>'
        );
      });

      html.push('  </ul>', '</section>');
    });

    html.push('</div>');
    $container.innerHTML = html.join('\n');

    // Klick-Handler auf die Karten
    var karten = $container.querySelectorAll('.wissen-card[data-wirkstoff-id]');
    karten.forEach(function (karte) {
      karte.addEventListener('click', function () {
        oeffneWirkstoff(karte.dataset.wirkstoffId);
      });
    });
  }


  /* ──── BAUE DETAIL-HTML (als String fuer Bottom-Sheet) ────
     Sammelt den heutigen Inhalt der Detail-Ansicht als HTML-String,
     damit BottomSheet.zeige({inhalt: ...}) ihn aufnehmen kann.
     Der Sheet-Header zeigt den Titel separat - hier nur der Body. */
  function baueDetailHTML(wirkstoffId) {
    var w = WIRKSTOFFE_WISSEN[wirkstoffId];
    if (!w) {
      return '<div class="wissen__error">Wirkstoff "' + esc(wirkstoffId) + '" nicht in Wissensbasis</div>';
    }

    var html = ['<article class="wirkstoff-detail">'];

    // Kategorie als kleiner Header
    if (w.kategorie) {
      html.push('<div class="wirkstoff-detail__kategorie">' + esc(w.kategorie) + '</div>');
    }

    // Kurzbeschreibung
    if (w.kurz_beschreibung) {
      html.push('<p class="wirkstoff-detail__lead">' + esc(w.kurz_beschreibung) + '</p>');
    }

    // Evidenz-Block
    if (w.evidenz) {
      var e = w.evidenz;
      html.push(
        '<section class="ws-section">',
        '  <h2 class="ws-section__title">Evidenz</h2>',
        '  <div class="ws-evidenz">',
        '    <div class="ws-evidenz__level">Level ' + esc(e.level || '?') + '</div>'
      );
      if (e.score) {
        html.push('    <div class="ws-evidenz__score">Score ' + esc(e.score) + '/100</div>');
      }
      if (e.studien_anzahl) {
        html.push('    <div class="ws-evidenz__studien">' + esc(e.studien_anzahl) + ' Studien</div>');
      }
      html.push('  </div>');
      if (e.konsens) {
        html.push('  <p class="ws-evidenz__konsens">' + esc(e.konsens) + '</p>');
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
          html.push('    <li>' + esc(eff) + '</li>');
        });
        html.push('  </ul>', '</section>');
      }

      if (f.dosis) {
        html.push(
          '<section class="ws-section">',
          '  <h2 class="ws-section__title">Dosierung</h2>',
          '  <p class="ws-text">' + esc(f.dosis) + '</p>',
          '</section>'
        );
      }

      if (f.ideal_fuer) {
        html.push(
          '<section class="ws-section">',
          '  <h2 class="ws-section__title">Ideal für</h2>',
          '  <p class="ws-text">' + esc(f.ideal_fuer) + '</p>',
          '</section>'
        );
      }

      if (f.vorsicht_bei) {
        html.push(
          '<section class="ws-section ws-section--warning">',
          '  <h2 class="ws-section__title">⚠️ Vorsicht bei</h2>',
          '  <p class="ws-text">' + esc(f.vorsicht_bei) + '</p>',
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
          html.push('    <li>' + esc(m) + '</li>');
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
        var line = esc(k.art || '') + ': ' + esc(k.wert || '');
        if (k.schwere) line += ' [' + esc(k.schwere) + ']';
        if (k.hinweis) line += ' – ' + esc(k.hinweis);
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
        var text = typeof ww === 'string'
                    ? ww
                    : ((ww.mit || '?') + ': ' + (ww.hinweis || ''));
        html.push('    <li>' + esc(text) + '</li>');
      });
      html.push('  </ul>', '</section>');
    }

    html.push('</article>');
    return html.join('\n');
  }


  /* ──── NAVIGATION: Wirkstoff oeffnen -> Bottom-Sheet ──── */
  function oeffneWirkstoff(wirkstoffId) {
    var w = WIRKSTOFFE_WISSEN[wirkstoffId];
    var titel = (w && w.name) ? w.name : wirkstoffId;

    var oeffne = function () {
      if (!window.BottomSheet || !window.BottomSheet.zeige) {
        console.warn('BottomSheet nicht verfuegbar');
        return;
      }
      // Phase C: Inhalt kommt aus WirkstoffDetail-Modul (gleich wie Stack-Sheet)
      var inhalt = (window.WirkstoffDetail && window.WirkstoffDetail.baueHTML)
                    ? window.WirkstoffDetail.baueHTML(wirkstoffId)
                    : '<p>Detail-Modul nicht geladen.</p>';
      window.BottomSheet.zeige({ titel: titel, inhalt: inhalt });
    };

    if (window.WirkstoffeLoader && window.WirkstoffeLoader.ladenDetail) {
      window.WirkstoffeLoader.ladenDetail(wirkstoffId).then(oeffne, oeffne);
    } else {
      oeffne();
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
        renderUebersicht();
      });

    } else {
      // Beim Wiedereintritt: einfach Uebersicht neu rendern
      renderUebersicht();
    }
  }


  return {
    zeige: zeige
  };

})();
