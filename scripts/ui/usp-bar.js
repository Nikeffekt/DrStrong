/* ============================================================
   ui/usp-bar.js – USP-Leiste Scroll-Verhalten

   Aufgabe:
   Wandelt vertikales Mausrad-Scrollen in horizontales um,
   damit Desktop-User die Karten auch ohne Trackpad bewegen koennen.

   Touch- und Trackpad-Scrolling funktioniert nativ ueber CSS.

   Abhaengigkeiten: keine
============================================================ */

window.UspBar = (function () {
  'use strict';

  function init() {
    var track = document.getElementById('usp-track');
    if (!track) {
      console.warn('UspBar: usp-track Element nicht gefunden');
      return;
    }

    track.addEventListener('wheel', function (e) {
      // Wenn vertikales Scrollen aktiv ist, zu horizontalem umleiten
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }


  return {
    init: init
  };

})();
