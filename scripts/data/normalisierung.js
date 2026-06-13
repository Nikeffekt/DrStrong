/* ============================================================
   data/normalisierung.js – Datenbereinigung beim Laden

   Aufgabe (spaeter):
   - Inkonsistente Felder normalisieren
   - Defaults setzen wo Felder fehlen
   - Format-Konvertierungen

   Aktuell: Platzhalter
============================================================ */

window.Normalisierung = (function () {
  'use strict';

  // Beispiel-Funktion: Preis-String zu Zahl konvertieren
  function preisZuZahl(preisStr) {
    if (!preisStr) return 0;
    var clean = preisStr.replace(/[^\d,\.]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }


  return {
    preisZuZahl: preisZuZahl
  };

})();
