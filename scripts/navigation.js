/* ============================================================
   navigation.js – Screen-Wechsel-Logik

   Aufgaben:
   - Aktiven Screen tracken (state.aktiverScreen)
   - Screen wechseln (zeige())
   - Sidebar visuell aktualisieren
   - Screen-Module triggern (zeigeProfil, zeigeQuiz, etc.)

   Abhaengigkeiten:
   - state.js (aktiverScreen)
   - screens/*.js (kommen spaeter)
============================================================ */

window.Navigation = (function () {
  'use strict';

  /* ──── DOM-Refs ──── */
  var $navItems;
  var $screenLabel;


  /* ──── Screen wechseln ──── */
  function zeige(neuerScreen) {
    if (!neuerScreen) return;
    if (neuerScreen === aktiverScreen) return;

    // Settings/Logout sind keine richtigen Screens (noch nicht implementiert)
    if (neuerScreen === 'settings' || neuerScreen === 'logout') {
      console.log('TODO: ' + neuerScreen);
      return;
    }

    aktiverScreen = neuerScreen;

    // Sidebar visuell aktualisieren
    if ($navItems) {
      $navItems.forEach(function (item) {
        if (item.dataset.screen === neuerScreen) {
          item.classList.add('is-active');
        } else {
          item.classList.remove('is-active');
        }
      });
    }

    // Platzhalter aktualisieren
    if ($screenLabel) {
      $screenLabel.textContent = neuerScreen;
    }

    // Spaeter: Screen-Module aufrufen
    // switch (neuerScreen) {
    //   case 'profil':  window.Profil && window.Profil.zeige(); break;
    //   case 'quiz':    window.Quiz   && window.Quiz.zeige();   break;
    //   case 'stack':   window.Stack  && window.Stack.zeige();  break;
    //   case 'wissen':  window.Wissen && window.Wissen.zeige(); break;
    //   case 'shop':    window.Shop   && window.Shop.zeige();   break;
    // }

    console.log('Screen gewechselt:', neuerScreen);
  }


  /* ──── Init ──── */
  function init() {
    $navItems    = document.querySelectorAll('.nav-item');
    $screenLabel = document.getElementById('active-screen-name');
  }


  /* ──── Public API ──── */
  return {
    init:  init,
    zeige: zeige
  };

})();
