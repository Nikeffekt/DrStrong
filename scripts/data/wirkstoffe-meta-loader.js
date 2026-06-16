/* ============================================================
   data/wirkstoffe-meta-loader.js – Lädt wirkstoffe_meta.json

   Aufgabe:
   - Laedt Wirkstoff-Metadaten (Emoji, Tagline, Kategorie, Einnahme-Tipps)
   - Befuellt globales WIRKSTOFFE_META-Objekt
   - Normalisiert IDs (Unterstrich -> Bindestrich) damit Lookups
     mit den Wissens-/Engine-IDs (vitamin-d3, iso-clear) funktionieren.

   Struktur nach dem Laden:
     WIRKSTOFFE_META = {
       'vitamin-d3': { id, name, emoji, tagline, kategorie, ... },
       'iso-clear':  { ... },
       ...
     }

     WIRKSTOFFE_META._kategorien = { ... }  (Kategorie-Definitionen)
     WIRKSTOFFE_META._prioritaeten = { ... }

   Genutzt von:
   - screens/stack.js (Karten-Emoji + Tagline)
   - andere Screens spaeter

   Abhaengigkeiten:
   - state.js (WIRKSTOFFE_META)
   - normalisierung.js (normalisiereId, normalisiereIdListe)
============================================================ */

window.WirkstoffeMetaLoader = (function () {
  'use strict';


  /* ── Einzelnen Wirkstoff-Meta-Eintrag normalisieren ──
     - id-Feld auf Bindestrich-Form bringen
     - synergie-Array: alle IDs normalisieren (vitamin_c -> vitamin-c) */
  function normalisiereEintrag(eintrag, normId, normListe) {
    if (!eintrag || typeof eintrag !== 'object') return eintrag;

    // id-Feld selbst normalisieren (falls vorhanden)
    if (eintrag.id) {
      eintrag.id = normId(eintrag.id);
    }
    // Synergie-Referenzen normalisieren
    if (Array.isArray(eintrag.synergie)) {
      eintrag.synergie = normListe(eintrag.synergie);
    }

    return eintrag;
  }


  /* ── Public: Laden starten ── */
  function laden() {
    return fetch('data/wirkstoffe_meta.json')
      .then(function (r) {
        if (!r.ok) throw new Error('wirkstoffe_meta.json: HTTP ' + r.status);
        return r.json();
      })
      .then(function (daten) {
        // Fallback wenn Normalisierung fehlt
        var normId = (window.Normalisierung && window.Normalisierung.normalisiereId)
                      ? window.Normalisierung.normalisiereId
                      : function (id) { return id; };
        var normListe = (window.Normalisierung && window.Normalisierung.normalisiereIdListe)
                      ? window.Normalisierung.normalisiereIdListe
                      : function (l) { return l; };

        var wirkstoffe = daten && daten.wirkstoffe;
        if (!wirkstoffe) {
          console.warn('wirkstoffe_meta.json: kein "wirkstoffe"-Block gefunden');
          return;
        }

        // ── Wirkstoff-Eintraege mit normalisierten Keys schreiben ──
        Object.keys(wirkstoffe).forEach(function (jsonKey) {
          var key = normId(jsonKey);
          var eintrag = normalisiereEintrag(wirkstoffe[jsonKey], normId, normListe);
          WIRKSTOFFE_META[key] = eintrag;
        });

        // ── Meta-Block separat ablegen (Kategorien + Prioritaeten) ──
        if (daten.meta) {
          if (daten.meta.kategorien)   WIRKSTOFFE_META._kategorien   = daten.meta.kategorien;
          if (daten.meta.prioritaeten) WIRKSTOFFE_META._prioritaeten = daten.meta.prioritaeten;
        }

        var anzahl = Object.keys(WIRKSTOFFE_META).length;
        // Meta-Keys nicht mitzaehlen (beginnen mit "_")
        Object.keys(WIRKSTOFFE_META).forEach(function (k) {
          if (k.charAt(0) === '_') anzahl--;
        });

        console.log('✅ Wirkstoff-Meta geladen: ' + anzahl + ' Wirkstoffe');
      })
      .catch(function (err) {
        console.warn('Fehler beim Laden von wirkstoffe_meta.json:', err);
      });
  }


  return {
    laden: laden
  };

})();
