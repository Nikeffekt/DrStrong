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
  var $bottomTabs;
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


  /* ──── Navigation-Items aktualisieren (Sidebar + Bottom-Tabs)  ──── */
  function aktualisiereNavItems(screen) {
    // Sidebar (Desktop)
    if ($navItems) {
      $navItems.forEach(function (item) {
        if (item.dataset.screen === screen) {
          item.classList.add('is-active');
        } else {
          item.classList.remove('is-active');
        }
      });
    }

    // Bottom-Tabs (Mobile)
    if ($bottomTabs) {
      $bottomTabs.forEach(function (tab) {
        if (tab.dataset.screen === screen) {
          tab.classList.add('is-active');
        } else {
          tab.classList.remove('is-active');
        }
      });
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

    // Sidebar + Bottom-Tabs visuell aktualisieren
    aktualisiereNavItems(neuerScreen);

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
      case 'quiz':
        if (window.QuizScreen && window.QuizScreen.zeige) {
          window.QuizScreen.zeige();
        }
        break;
      case 'stack':
        if (window.StackScreen && window.StackScreen.zeige) {
          window.StackScreen.zeige();
        }
        break;
    }

    console.log('Screen gewechselt:', neuerScreen);
  }


  /* ──── Init ──── */
  function init() {
    $navItems   = document.querySelectorAll('.nav-item');
    $bottomTabs = document.querySelectorAll('.bottom-tab');
    $screens    = document.querySelectorAll('.screens .screen');
    $uspBar     = document.getElementById('usp-bar');
    $app        = document.querySelector('.app');

    // Initial: alle UI-Elemente passend zum aktiven Start-Screen setzen
    aktualisiereNavItems(aktiverScreen);
    aktualisiereUspBar(aktiverScreen);
  }


  /* ──── Public API ──── */
  return {
    init:  init,
    zeige: zeige
  };

})();
