/* ============================================================
   engine/overlaps.js – Wirkstoff-Wirkstoff-Overlap-Aufloesung

   Aufgabe:
     Nach der Empfehlungs-Engine: redundante Wirkstoffe entfernen,
     wenn sie inhaltlich abgedeckt sind (z. B. ZMA, wenn Mg + Zink
     einzeln schon drin sind).

   Abhaengigkeiten:
     - window.WIRKSTOFFE_WISSEN (aus data/wirkstoffe-wissen.json)
       Genauer: WIRKSTOFFE_WISSEN[id].inhalt – Array der enthaltenen
       Substanzen (z. B. ['zink', 'magnesium', 'vitamin_b6'])

   Genutzt von: engine/empfehlungen.js → berechneStack() (Stufe 6)

   Hinweis: Substanz-Namen im inhalt-Feld nutzen Unterstrich
   (vitamin_d3), Wirkstoff-IDs nutzen Bindestrich (vitamin-d3).
   Das ist Absicht – inhalt ist eine Substanz-Ontologie,
   nicht eine Wirkstoff-Referenz.

   Bug-Fixes (aus Upload-Version uebernommen):
     - Bug #1: ID-Duplikat-Check verhindert doppelte Wirkstoffe
     - Bug #3: Geschuetzte IDs (eisen/b12/d3) sind nicht durch
       Multivitamin verdraengbar
============================================================ */

window.Overlaps = (function () {
  'use strict';

  // Priorit
  var PRIO = { essential: 0, empfohlen: 1, optional: 2 };

  // Geschuetzte Wirkstoffe: nie durch Multivitamin-Overlap verdraengen
  var GESCHUETZT = ['eisen', 'vitamin-b12', 'vitamin-d3'];

  // Bei Substanz-Overlap-Check uebersprungene Substanzen
  // (zu allgemein, sonst entstehen falsche Matches)
  var SKIP_SUBSTANZEN = ['multivitamin', 'elektrolyte', 'magnesium_trace'];


  /* ── HELFER: Inhalt eines Wirkstoffs aus der Wissensbasis lesen ──
     Liefert Liste der enthaltenen Substanzen, oder [] wenn nicht
     in der Wissensbasis (z. B. fuer Pseudo-Wirkstoffe wie folsaeure). */
  function getInhalt(wirkstoffId) {
    if (typeof window.WIRKSTOFFE_WISSEN === 'undefined') return [];
    var w = window.WIRKSTOFFE_WISSEN[wirkstoffId];
    return (w && w.inhalt) ? w.inhalt : [];
  }


  /* ── HELFER: Flachen Array aus Stack-Objekt machen ──
     Stack {essential:[], empfohlen:[], optional:[]} → flacher Array.
     Jedes Item bekommt sein 'prioritaet'-Feld bereits in
     empfehlungen.js gesetzt. */
  function flattenStack(stack) {
    return stack.essential.concat(stack.empfohlen).concat(stack.optional);
  }


  /* ── HELFER: Stack-Objekt aus flachem Array bauen ──
     Sortiert die Items nach ihrer prioritaet-Property zurueck in
     die drei Buckets. */
  function buildStack(items) {
    var result = { essential: [], empfohlen: [], optional: [] };
    for (var i = 0; i < items.length; i++) {
      var bucket = items[i].prioritaet;
      if (result[bucket]) {
        result[bucket].push(items[i]);
      }
    }
    return result;
  }


  /* ============================================================
     HAUPTFUNKTION: loesOverlaps(stack)

     Input: Stack-Objekt aus empfehlungen.js, also
       { essential: [...], empfohlen: [...], optional: [...] }
     
     Output: bereinigtes Stack-Objekt + Liste der entfernten Items
       {
         stack: { essential, empfohlen, optional },
         entfernt: [{ id, name, grund }, ...]
       }
  ============================================================ */
  function loesOverlaps(stack) {
    var items = flattenStack(stack);
    var del = {};

    // ── Schritt 1: ID-Duplikat-Check (Bug #1 Fix) ──
    // Verhindert dass derselbe Wirkstoff (gleiche ID) mehrfach
    // im Stack landet. Behaelt die hoeher priorisierte Variante.
    var gesehenIds = {};
    for (var k = 0; k < items.length; k++) {
      var id = items[k].id;
      if (gesehenIds[id] !== undefined) {
        var bestehendeIdx = gesehenIds[id];
        if (PRIO[items[k].prioritaet] < PRIO[items[bestehendeIdx].prioritaet]) {
          del[id + '_idx_' + bestehendeIdx] = 'Doppelter Wirkstoff – staerkere Variante behalten';
          gesehenIds[id] = k;
        } else {
          del[id + '_idx_' + k] = 'Doppelter Wirkstoff – staerkere Variante behalten';
        }
      } else {
        gesehenIds[id] = k;
      }
    }
    items = items.filter(function (e, idx) {
      return !del[e.id + '_idx_' + idx];
    });
    del = {};

    // ── Schritt 2: Spezifische Kombinations-Regeln ──

    // ZMA: wenn Mg im Stack ist → ZMA raus
    // (Magnesium einzeln ist die saubere Variante, ZMA hat schwache Evidenz)
    // PDF Modul 14: "ZMA erhoeht Testosteron – Originalstudie nicht repliziert"
    if (items.some(function (e) { return e.id === 'zma'; }) &&
        items.some(function (e) { return e.id === 'magnesium'; })) {
      del['zma'] = 'Magnesium einzeln bevorzugt – ZMA-Wirkstudien nicht repliziert';
    }

    // Beta-Alanin + Pre-Workout → Beta-Alanin raus (im Pre-Workout enthalten)
    if (items.some(function (e) { return e.id === 'beta-alanin'; }) &&
        items.some(function (e) { return e.id === 'pre-workout'; })) {
      del['beta-alanin'] = 'Im Pre-Workout bereits enthalten';
    }

    // Koffein + Pre-Workout → Koffein raus (im Pre-Workout enthalten)
    if (items.some(function (e) { return e.id === 'koffein'; }) &&
        items.some(function (e) { return e.id === 'pre-workout'; })) {
      del['koffein'] = 'Im Pre-Workout bereits enthalten';
    }

    // Melatonin + Ashwagandha → Melatonin raus
    if (items.some(function (e) { return e.id === 'melatonin'; }) &&
        items.some(function (e) { return e.id === 'ashwagandha'; })) {
      del['melatonin'] = 'Ashwagandha verbessert Schlaf ebenfalls – kombiniert nach Bedarf';
    }

    // Whey-Konzentrat + ISO Clear → behalte das mit hoeherem Score
    // (die alte overlaps.js erkannte das nicht, weil inhalt-Werte unterschiedlich sind)
    var wpItem = null, isoItem = null;
    for (var w = 0; w < items.length; w++) {
      if (items[w].id === 'whey-protein') wpItem = items[w];
      if (items[w].id === 'iso-clear')    isoItem = items[w];
    }
    if (wpItem && isoItem) {
      if ((wpItem.score || 0) >= (isoItem.score || 0)) {
        del['iso-clear'] = 'Whey-Konzentrat ist ausreichend – gleiche Wirkung, guenstiger';
      } else {
        del['whey-protein'] = 'ISO Clear besser zum Profil passend (z.B. Laktose-Intoleranz oder Reinheit)';
      }
    }

    // ── Schritt 3: Allgemeine Substanz-Ueberschneidungen (Bug #3 Fix) ──
    // Pruefe ob ein Wirkstoff seine Substanzen mit einem anderen teilt.
    // Wenn ja: das mit hoeherer Prioritaet bleibt, das andere raus.
    // AUSNAHME: geschuetzte Wirkstoffe (Eisen, B12, D3) bleiben immer
    // drin – auch wenn Multivitamin sie inhaltlich abdeckt.
    for (var i = 0; i < items.length; i++) {
      if (del[items[i].id]) continue;
      for (var j = i + 1; j < items.length; j++) {
        if (del[items[j].id]) continue;

        var s1 = getInhalt(items[i].id);
        var s2 = getInhalt(items[j].id);

        for (var a = 0; a < s1.length; a++) {
          if (SKIP_SUBSTANZEN.indexOf(s1[a]) >= 0) continue;
          for (var b = 0; b < s2.length; b++) {
            if (SKIP_SUBSTANZEN.indexOf(s2[b]) >= 0) continue;
            if (s1[a] === s2[b]) {
              // Substanz-Overlap gefunden
              var iIstMulti = items[i].id === 'multivitamin';
              var jIstMulti = items[j].id === 'multivitamin';

              // Geschuetzt-Regel: Multivitamin verdraengt nicht Eisen/B12/D3
              if (iIstMulti && GESCHUETZT.indexOf(items[j].id) >= 0) continue;
              if (jIstMulti && GESCHUETZT.indexOf(items[i].id) >= 0) continue;

              // Niedriger priorisiertes Item raus
              if (PRIO[items[i].prioritaet] <= PRIO[items[j].prioritaet]) {
                del[items[j].id] = 'Wirkstoff bereits in ' + (items[i].name || items[i].id) + ' enthalten';
              } else {
                del[items[i].id] = 'Wirkstoff bereits in ' + (items[j].name || items[j].id) + ' enthalten';
              }
            }
          }
        }
      }
    }

    // ── Output zusammenstellen ──
    var verbleibend = items.filter(function (e) { return !del[e.id]; });
    var entfernt = items.filter(function (e) { return del[e.id]; })
      .map(function (e) {
        return {
          id: e.id,
          name: e.name || e.id,
          grund: del[e.id]
        };
      });

    return {
      stack: buildStack(verbleibend),
      entfernt: entfernt
    };
  }


  /* ── PUBLIC API ── */
  return {
    loesOverlaps: loesOverlaps,
    GESCHUETZT: GESCHUETZT,
    SKIP_SUBSTANZEN: SKIP_SUBSTANZEN
  };

})();
