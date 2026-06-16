/* ============================================================
   main.js – Stronger Hauptdatei

   Aufgaben:
   - Daten laden (Wirkstoffe + Produkte + Meta)
   - UI-Module initialisieren

   Reihenfolge:
   1. UI sofort initialisieren (App ist klickbar)
   2. Daten im Hintergrund laden (Promise.all)
   3. Wenn Daten fertig: 'v3:datenBereit' Event feuern
============================================================ */

(function () {
  'use strict';

  function init() {
    console.log('Stronger startet…');

    /* ─── 1. UI-Module sofort initialisieren ─── */
    if (window.Sidebar     && window.Sidebar.init)     window.Sidebar.init();
    if (window.BottomTabs  && window.BottomTabs.init)  window.BottomTabs.init();
    if (window.Topbar      && window.Topbar.init)      window.Topbar.init();
    if (window.UspBar      && window.UspBar.init)      window.UspBar.init();
    if (window.DrStrong    && window.DrStrong.init)    window.DrStrong.init();

    console.log('✓ UI bereit');


    /* ─── 1.5 Gespeicherten Stack aus localStorage laden ─── */
    /* Wenn der User die App schon mal benutzt hat: AW und */
    /* aktuellerStack wiederherstellen, ohne Engine neu zu rechnen. */
    if (window.StackPersistenz && window.StackPersistenz.laden) {
      var gespeichert = window.StackPersistenz.laden();
      if (gespeichert) {
        // AW wiederherstellen (in-place, weil globale Referenz)
        if (gespeichert.aw) {
          for (var k in gespeichert.aw) {
            if (gespeichert.aw.hasOwnProperty(k)) AW[k] = gespeichert.aw[k];
          }
        }
        window.aktuellerStack = gespeichert.stack || null;
        console.log('✓ Gespeicherter Stack wiederhergestellt (vom ' +
                    gespeichert.gespeichert_am + ')');
      }
    }


    /* ─── 2. Daten im Hintergrund laden ─── */
    var ladeAufgaben = [];

    if (window.WirkstoffeLoader && window.WirkstoffeLoader.ladenZentral) {
      ladeAufgaben.push(window.WirkstoffeLoader.ladenZentral());
    }

    if (window.ProdukteLoader && window.ProdukteLoader.laden) {
      ladeAufgaben.push(window.ProdukteLoader.laden());
    }

    // ── Wirkstoff-Metadaten (Emoji, Tagline, Einnahme) ──
    if (window.WirkstoffeMetaLoader && window.WirkstoffeMetaLoader.laden) {
      ladeAufgaben.push(window.WirkstoffeMetaLoader.laden());
    }

    Promise.all(ladeAufgaben).then(function () {
      console.log('✓ Alle Daten geladen');
      document.dispatchEvent(new CustomEvent('v3:datenBereit'));
    }).catch(function (err) {
      console.error('Fehler beim Laden der Daten:', err);
    });
  }


  // Start sobald DOM bereit
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
