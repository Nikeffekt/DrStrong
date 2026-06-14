/* ============================================================
   ui/bottom-tabs.js – Bottom-Tab-Bar-Klick-Handler (Mobile)

   Aufgaben:
   - Event-Listener auf alle Bottom-Tabs
   - Bei Klick: Navigation.zeige(screen) aufrufen
   - Verhalten identisch zu Sidebar (nutzt selbe Navigation-Logik)

   Abhaengigkeiten:
   - navigation.js (window.Navigation)
============================================================ */

window.BottomTabs = (function () {
  'use strict';

  function init() {
    var tabs = document.querySelectorAll('.bottom-tab');

    if (!tabs.length) {
      console.warn('BottomTabs: Keine Tabs gefunden');
      return;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        if (window.Navigation) {
          window.Navigation.zeige(tab.dataset.screen);
        }
      });
    });

    console.log('✓ Bottom-Tabs bereit (' + tabs.length + ' Tabs)');
  }


  return {
    init: init
  };

})();
