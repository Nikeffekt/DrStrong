/* ============================================================
   data/produkte-loader.js – Lädt produkte.json

   Befuellt die globale DB-Variable mit Produkten.

   ID-Normalisierung:
   produkte.json verwendet historisch Unterstrich-IDs (z.B. "iso_clear",
   "vitamin_d3"). Damit die App einheitlich mit Bindestrich-IDs arbeitet,
   werden die Wirkstoff-Keys beim Einlesen ueber Normalisierung.normalisiereId()
   umgewandelt. Siehe normalisierung.js.

   Abhaengigkeiten:
   - state.js (DB)
   - normalisierung.js (normalisiereId)
============================================================ */

window.ProdukteLoader = (function () {
  'use strict';

  // ── HILFSFUNKTIONEN ──

  function preisBereinigen(preisStr) {
    if (!preisStr) return '0,00';
    var m = preisStr.match(/(\d+[,\.]\d+)/);
    if (m) return m[1].replace('.', ',');
    var m2 = preisStr.match(/(\d+)/);
    return m2 ? m2[1] + ',00' : '0,00';
  }

  function ratingBereinigen(ratingStr) {
    if (!ratingStr) return '4.5 ★';
    return ratingStr.replace(',', '.');
  }

  function anbieterZuProdukt(anbieter) {
    return {
      marke:  anbieter.name    || '–',
      name:   anbieter.produkt || '–',
      preis:  preisBereinigen(anbieter.preis_paket || anbieter.preis || ''),
      rating: ratingBereinigen(anbieter.bewertung || '')
    };
  }


  // ── DB aufbauen ──
  function bauDB(jsonDaten) {
    var wirkstoffe = jsonDaten && jsonDaten.wirkstoffe;
    if (!wirkstoffe) return;

    // Fallback wenn Normalisierung-Modul (aus welchem Grund auch immer)
    // nicht geladen wurde: Identitaetsfunktion verwenden.
    var normId = (window.Normalisierung && window.Normalisierung.normalisiereId)
                  ? window.Normalisierung.normalisiereId
                  : function (id) { return id; };

    Object.keys(wirkstoffe).forEach(function (jsonKey) {
      var w = wirkstoffe[jsonKey];
      if (!w.anbieter || !w.anbieter.length) return;

      var alleProdukte = w.anbieter.map(anbieterZuProdukt);

      // ── ID normalisieren beim Schreiben in DB ──
      // "iso_clear" -> "iso-clear", "vitamin_d3" -> "vitamin-d3"
      var normalisierterKey = normId(jsonKey);

      DB[normalisierterKey] = {
        hauptprodukt: alleProdukte[0],
        alternativen: alleProdukte.slice(1),
        alle:         alleProdukte
      };
    });
  }


  // ── Public: Laden starten ──
  function laden() {
    return fetch('data/produkte.json')
      .then(function (r) {
        if (!r.ok) throw new Error('produkte.json: HTTP ' + r.status);
        return r.json();
      })
      .then(function (daten) {
        bauDB(daten);
        console.log('✅ Produkte geladen: ' + Object.keys(DB).length + ' Wirkstoffe');
      })
      .catch(function (err) {
        console.warn('Fehler beim Laden von produkte.json:', err);
      });
  }


  return {
    laden: laden
  };

})();
