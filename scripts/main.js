/* ============================================================
   main.js – Stronger Hauptdatei

   Aufgaben:
   - Daten laden (Wirkstoffe + Produkte)
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
    if (window.Sidebar && window.Sidebar.init)  window.Sidebar.init();
    if (window.UspBar  && window.UspBar.init)   window.UspBar.init();

    console.log('✓ UI bereit');


    /* ─── 2. Daten im Hintergrund laden ─── */
    var ladeAufgaben = [];

    if (window.WirkstoffeLoader && window.WirkstoffeLoader.ladenZentral) {
      ladeAufgaben.push(window.WirkstoffeLoader.ladenZentral());
    }

    if (window.ProdukteLoader && window.ProdukteLoader.laden) {
      ladeAufgaben.push(window.ProdukteLoader.laden());
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
