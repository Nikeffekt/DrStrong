/* ============================================================
   ui/sidebar.js – Sidebar-Klick-Handler

   Aufgaben:
   - Event-Listener auf alle Nav-Items
   - Bei Klick: Navigation.zeige(screen) aufrufen

   Abhaengigkeiten:
   - navigation.js (window.Navigation)
============================================================ */

window.Sidebar = (function () {
  'use strict';

  function init() {
    // Erst Navigation initialisieren (holt DOM-Refs)
    if (window.Navigation && typeof window.Navigation.init === 'function') {
      window.Navigation.init();
    }

    var navItems = document.querySelectorAll('.nav-item');

    if (!navItems.length) {
      console.error('Sidebar: Keine Nav-Items gefunden');
      return;
    }

    navItems.forEach(function (item) {
      item.addEventListener('click', function () {
        if (window.Navigation) {
          window.Navigation.zeige(item.dataset.screen);
        }
      });
    });
  }


  return {
    init: init
  };

})();
