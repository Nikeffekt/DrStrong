/* ============================================================
   data/wirkstoffe-loader.js – Lädt Wirkstoff-Daten

   Zwei Funktionen:
   1. ladenZentral() - laedt data/wirkstoffe-wissen.json komplett
      (befuellt WIRKSTOFFE_WISSEN, fuer Listen und Empfehlungs-Engine)

   2. ladenDetail(wirkstoffId) - laedt eine einzelne Detail-Datei
      aus data/wirkstoffe/<wirkstoffId>.json on-demand
      (befuellt WIRKSTOFFE_DETAILS[wirkstoffId], fuer Wissen-Screen)

   Abhaengigkeiten:
   - state.js (WIRKSTOFFE_WISSEN, WIRKSTOFFE_DETAILS)
============================================================ */

window.WirkstoffeLoader = (function () {
  'use strict';


  /* ──── Zentrale Wissensbasis laden ──── */
  function ladenZentral() {
    return fetch('data/wirkstoffe-wissen.json')
      .then(function (r) {
        if (!r.ok) throw new Error('wirkstoffe-wissen.json: HTTP ' + r.status);
        return r.json();
      })
      .then(function (daten) {
        Object.keys(daten).forEach(function (k) {
          WIRKSTOFFE_WISSEN[k] = daten[k];
        });

        var anzahl = Object.keys(WIRKSTOFFE_WISSEN).length;
        if (WIRKSTOFFE_WISSEN._meta) anzahl--;  // Meta nicht zaehlen

        console.log('✅ Wissensbasis geladen: ' + anzahl + ' Wirkstoffe');
      })
      .catch(function (err) {
        console.warn('Fehler beim Laden von wirkstoffe-wissen.json:', err);
      });
  }


  /* ──── Detail-Datei eines Wirkstoffs laden (on-demand) ──── */
  function ladenDetail(wirkstoffId) {
    // Cache: wenn schon geladen, direkt zurueckgeben
    if (WIRKSTOFFE_DETAILS[wirkstoffId]) {
      return Promise.resolve(WIRKSTOFFE_DETAILS[wirkstoffId]);
    }

    var url = 'data/wirkstoffe/' + wirkstoffId + '.json';

    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error(wirkstoffId + '.json: HTTP ' + r.status);
        return r.json();
      })
      .then(function (daten) {
        WIRKSTOFFE_DETAILS[wirkstoffId] = daten;
        console.log('✅ Detail geladen: ' + wirkstoffId);
        return daten;
      })
      .catch(function (err) {
        console.warn('Fehler beim Laden von ' + wirkstoffId + '.json:', err);
        return null;
      });
  }


  return {
    ladenZentral: ladenZentral,
    ladenDetail:  ladenDetail
  };

})();
