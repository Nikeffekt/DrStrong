/* ============================================================
   data/normalisierung.js – Datenbereinigung beim Laden

   Aufgaben:
   - Inkonsistente Felder normalisieren
   - Defaults setzen wo Felder fehlen
   - Format-Konvertierungen
   - ID-Normalisierung (Unterstriche -> Bindestriche)

   Hintergrund ID-Normalisierung:
   Im Projekt gibt es historisch zwei Konventionen:
     - Bindestrich:  vitamin-d3, whey-protein  (wirkstoffe-wissen.json, kategorien.json, Engine)
     - Unterstrich:  vitamin_d3, whey_protein  (produkte.json, wirkstoffe_meta.json)

   Damit App-Code einheitlich mit Bindestrich-IDs arbeiten kann,
   normalisieren die Loader die IDs beim Einlesen ueber diese Modul.
   Die Quelldateien bleiben unveraendert.

   Wer braucht das: produkte-loader.js, wirkstoffe-meta-loader.js
============================================================ */

window.Normalisierung = (function () {
  'use strict';


  /* ──── Preis-String zu Zahl konvertieren ──── */
  function preisZuZahl(preisStr) {
    if (!preisStr) return 0;
    var clean = preisStr.replace(/[^\d,\.]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }


  /* ──── ID normalisieren: Unterstriche → Bindestriche ────
     Beispiel: "vitamin_d3"  -> "vitamin-d3"
               "whey_protein" -> "whey-protein"
               "iso_clear"    -> "iso-clear"

     Defensiv: Wenn id kein String ist, wird sie unveraendert
     zurueckgegeben (verhindert Crashes bei kaputten Daten). */
  function normalisiereId(id) {
    if (typeof id !== 'string') return id;
    return id.replace(/_/g, '-');
  }


  /* ──── Mehrere IDs normalisieren ────
     Praktisch fuer Arrays wie synergie: ["vitamin_c", "omega_3"]
     → ["vitamin-c", "omega-3"] */
  function normalisiereIdListe(liste) {
    if (!Array.isArray(liste)) return liste;
    return liste.map(normalisiereId);
  }


  /* ──── Objekt-Keys auf normalisierte IDs umschluesseln ────
     Beispiel:
       Input:  { "vitamin_d3": {...}, "iso_clear": {...} }
       Output: { "vitamin-d3": {...}, "iso-clear": {...} }

     Achtung: Erstellt ein neues Objekt. Werte werden NICHT
     deep-kopiert (Referenzen bleiben gleich). */
  function normalisiereObjektKeys(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    var result = {};
    Object.keys(obj).forEach(function (key) {
      result[normalisiereId(key)] = obj[key];
    });
    return result;
  }


  /* ──── PUBLIC API ──── */
  return {
    preisZuZahl:          preisZuZahl,
    normalisiereId:       normalisiereId,
    normalisiereIdListe:  normalisiereIdListe,
    normalisiereObjektKeys: normalisiereObjektKeys
  };

})();
