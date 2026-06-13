/* ============================================================
   core/helpers.js – Generische Utility-Funktionen

   Nicht-spezifische Hilfsfunktionen die ueberall nutzbar sind.
============================================================ */

window.Helpers = (function () {
  'use strict';


  /* ──── HTML-Escaping ──── */
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }


  /* ──── Debounce (Funktionsaufruf verzoegern) ──── */
  function debounce(fn, wait) {
    var timeout;
    return function () {
      var args = arguments;
      var ctx  = this;
      clearTimeout(timeout);
      timeout = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }


  /* ──── Throttle (Funktionsaufruf begrenzen) ──── */
  function throttle(fn, wait) {
    var letzteAusfuehrung = 0;
    return function () {
      var jetzt = Date.now();
      if (jetzt - letzteAusfuehrung >= wait) {
        letzteAusfuehrung = jetzt;
        fn.apply(this, arguments);
      }
    };
  }


  /* ──── Element ist im sichtbaren Bereich? ──── */
  function imViewport(el) {
    var rect = el.getBoundingClientRect();
    return (
      rect.top    >= 0 &&
      rect.left   >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right  <= (window.innerWidth  || document.documentElement.clientWidth)
    );
  }


  /* ──── Zufallselement aus Array ──── */
  function zufallsElement(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }


  return {
    escapeHtml:     escapeHtml,
    debounce:       debounce,
    throttle:       throttle,
    imViewport:     imViewport,
    zufallsElement: zufallsElement
  };

})();
