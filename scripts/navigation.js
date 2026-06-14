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
  var $uspBar;
  var $app;

  /* Screens auf denen die USP-Bar sichtbar sein soll */
  var SCREENS_MIT_USP = ['stronger'];


  /* ──── USP-Bar Sichtbarkeit steuern ──── */
  function aktualisiereUspBar(screen) {
    if (!$uspBar || !$app) return;

    if (SCREENS_MIT_USP.indexOf(screen) !== -1) {
      $uspBar.classList.add('is-visible');
      $app.classList.add('has-usp-bar');
    } else {
      $uspBar.classList.remove('is-visible');
      $app.classList.remove('has-usp-bar');
    }
  }


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

    // USP-Bar je nach Screen
    aktualisiereUspBar(neuerScreen);

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
    $uspBar   = document.getElementById('usp-bar');
    $app      = document.querySelector('.app');

    // Initial: USP-Bar passend zum aktiven Start-Screen
    aktualisiereUspBar(aktiverScreen);
  }


  /* ──── Public API ──── */
  return {
    init:  init,
    zeige: zeige
  };

})();
