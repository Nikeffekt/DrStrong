/* ============================================================
   main.js – Stronger Hauptdatei

   Aufgaben:
   - Init aller Module beim Laden der App
   - Globale Setup-Logik

   Module-Reihenfolge in index.html:
   1. core/*       Konstanten, Helpers
   2. state.js     Globaler State
   3. data/*       Daten-Loader
   4. engine/*     Empfehlungs-Logik (kommt spaeter)
   5. ui/*         UI-Module (Sidebar, USP-Bar, etc.)
   6. screens/*    Screen-Logik (kommt spaeter)
   7. chat/*       KI-Module (kommt spaeter)
   8. navigation.js Screen-Wechsel
   9. main.js      Diese Datei – init aller Module

   Jedes Modul exportiert ein Objekt auf window
   (z.B. window.Sidebar) mit einer init() Methode.
============================================================ */

(function () {
  'use strict';

  function init() {
    console.log('Stronger startet…');

    // ─── UI-Module ───
    if (window.Sidebar && typeof window.Sidebar.init === 'function') {
      window.Sidebar.init();
    }

    if (window.UspBar && typeof window.UspBar.init === 'function') {
      window.UspBar.init();
    }

    // Weitere Module hier ergaenzen wenn dazu kommen:
    // window.Header && window.Header.init();
    // window.Toast && window.Toast.init();
    // window.KiChat && window.KiChat.init();
    // etc.

    console.log('✓ Stronger bereit');
  }


  // Start sobald DOM bereit
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
