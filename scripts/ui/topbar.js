/* ============================================================
   ui/topbar.js – Topbar-Logik (Mobile)

   Aufgaben:
   - Avatar-Klick: Account-Menue oeffnen/schliessen
   - Menue-Items: Settings / Logout
   - Klick ausserhalb: Menue schliessen
   - Escape-Taste: Menue schliessen

   Abhaengigkeiten:
   - navigation.js (window.Navigation)
============================================================ */

window.Topbar = (function () {
  'use strict';

  /* ──── DOM-Refs ──── */
  var $avatar;
  var $menu;
  var menueIstOffen = false;


  /* ──── Menue oeffnen / schliessen ──── */
  function oeffneMenue() {
    if (!$menu) return;
    $menu.hidden = false;
    menueIstOffen = true;
  }

  function schliesseMenue() {
    if (!$menu) return;
    $menu.hidden = true;
    menueIstOffen = false;
  }

  function toggleMenue() {
    if (menueIstOffen) {
      schliesseMenue();
    } else {
      oeffneMenue();
    }
  }


  /* ──── Klick ausserhalb schliesst Menue ──── */
  function aufKlickAusserhalb(event) {
    if (!menueIstOffen) return;
    // Wenn Klick weder auf Avatar noch innerhalb Menue: schliessen
    if (!$avatar.contains(event.target) && !$menu.contains(event.target)) {
      schliesseMenue();
    }
  }


  /* ──── Escape-Taste schliesst Menue ──── */
  function aufEscapeTaste(event) {
    if (event.key === 'Escape' && menueIstOffen) {
      schliesseMenue();
    }
  }


  /* ──── Init ──── */
  function init() {
    $avatar = document.getElementById('topbar-avatar');
    $menu   = document.getElementById('topbar-menu');

    if (!$avatar || !$menu) {
      console.warn('Topbar: Avatar oder Menue nicht gefunden');
      return;
    }

    // Avatar-Klick: Menue toggeln
    $avatar.addEventListener('click', function (event) {
      event.stopPropagation();
      toggleMenue();
    });

    // Menue-Items: bei Klick Screen wechseln (oder Aktion ausfuehren) + Menue schliessen
    var menuItems = $menu.querySelectorAll('.topbar__menu-item');
    menuItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var ziel = item.dataset.screen;
        if (window.Navigation && ziel) {
          window.Navigation.zeige(ziel);
        }
        schliesseMenue();
      });
    });

    // Globale Klick-Listener
    document.addEventListener('click', aufKlickAusserhalb);
    document.addEventListener('keydown', aufEscapeTaste);

    console.log('✓ Topbar bereit');
  }


  return {
    init: init
  };

})();
