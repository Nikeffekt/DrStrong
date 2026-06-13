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
  var $screens;


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

    // Screens umschalten
    if ($screens) {
      $screens.forEach(function (screen) {
        if (screen.dataset.screen === neuerScreen) {
          screen.classList.add('is-active');
        } else {
          screen.classList.remove('is-active');
        }
      });
    }

    // Screen-Modul aufrufen falls vorhanden
    switch (neuerScreen) {
      case 'wissen':
        if (window.WissenScreen && window.WissenScreen.zeige) {
          window.WissenScreen.zeige();
        }
        break;
      // weitere Screens kommen dazu:
      // case 'profil': window.ProfilScreen && window.ProfilScreen.zeige(); break;
      // case 'quiz':   window.QuizScreen   && window.QuizScreen.zeige();   break;
      // case 'stack':  window.StackScreen  && window.StackScreen.zeige();  break;
      // case 'shop':   window.ShopScreen   && window.ShopScreen.zeige();   break;
    }

    console.log('Screen gewechselt:', neuerScreen);
  }


  /* ──── Init ──── */
  function init() {
    $navItems = document.querySelectorAll('.nav-item');
    $screens  = document.querySelectorAll('.screens .screen');
  }


  /* ──── Public API ──── */
  return {
    init:  init,
    zeige: zeige
  };

})();
