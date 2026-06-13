/* ============================================================
   data/produkte-loader.js – Lädt produkte.json

   Befuellt die globale DB-Variable mit Produkten.

   Abhaengigkeiten:
   - state.js (DB)
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

    Object.keys(wirkstoffe).forEach(function (jsonKey) {
      var w = wirkstoffe[jsonKey];
      if (!w.anbieter || !w.anbieter.length) return;

      var alleProdukte = w.anbieter.map(anbieterZuProdukt);

      DB[jsonKey] = {
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
