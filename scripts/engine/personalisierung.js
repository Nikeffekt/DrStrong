/* ============================================================
   engine/personalisierung.js – Produkt-Alternativen pro Wirkstoff

   Aufgabe:
     Waehlt bis zu 5 passende Produkt-Alternativen fuer einen
     gegebenen Wirkstoff anhand des User-Profils (Allergien, Alter,
     Erfahrung, Ziele, Ernaehrung).

   Abhaengigkeiten:
     - window.DB (befuellt durch produkte-loader.js)
       Pro Wirkstoff-ID enthaelt DB[id].alle eine Liste aller
       verfuegbaren Produkte mit Feldern: marke, name, segment, filter

   Genutzt von:
     - Stack-Screen (Phase 3) bei Klick auf einen Wirkstoff
     - Profil-Popup, etc.

   v2-Migration:
     Quiz-Code-Indizes auf Spec v2 angeglichen:
     - ernaehrung: C=Pescetarisch (NEU), D=Vegetarisch, E=Vegan
     - unvertraeglichkeiten: B=Laktose, C=Milcheiweiss (NEU),
       D=Fisch, E=Gluten, F=Soja
     Neu: Milcheiweiss-Allergie schliesst alle Whey-Varianten aus.
============================================================ */

window.Personalisierung = (function () {
  'use strict';


  /* ── KOMPATIBILITAETS-FILTER ──
     Pruefe ob ein Produkt mit dem User-Profil vereinbar ist.
     Erwartet auf jedem Produkt ein 'filter'-Array mit Allergen-Tags. */
  function baueKompatibilitaetsFilter(AW) {
    var unvert      = AW.unvertraeglichkeiten || ['A'];
    var ernaehrung  = AW.ernaehrung || 'A';

    var vegan        = ernaehrung === 'E';
    var vegetarisch  = ernaehrung === 'D' || ernaehrung === 'E';
    var pescetarisch = ernaehrung === 'C';

    var hatLaktose      = unvert.indexOf('B') >= 0;
    var hatMilcheiweiss = unvert.indexOf('C') >= 0;
    var hatFisch        = unvert.indexOf('D') >= 0;
    var hatGluten       = unvert.indexOf('E') >= 0;
    var hatSoja         = unvert.indexOf('F') >= 0;

    return function istKompatibel(p) {
      var f = p.filter || [];
      // Allergene
      if (hatLaktose      && f.indexOf('laktose')      >= 0) return false;
      if (hatMilcheiweiss && f.indexOf('milcheiweiss') >= 0) return false;
      if (hatMilcheiweiss && f.indexOf('whey')         >= 0) return false;
      if (hatFisch        && f.indexOf('fisch')        >= 0) return false;
      if (hatGluten       && f.indexOf('gluten')       >= 0) return false;
      if (hatSoja         && f.indexOf('soja')         >= 0) return false;
      // Ernaehrungs-Logik
      if (vegan       && f.indexOf('tierisch') >= 0) return false;
      if (vegetarisch && f.indexOf('gelatine') >= 0) return false;
      // Vegetarier (D) essen keinen Fisch, Pescetarier (C) schon
      if (vegetarisch && !pescetarisch && f.indexOf('fisch') >= 0) return false;
      return true;
    };
  }


  /* ── HAUPTFUNKTION ──
     Liefert bis zu 5 personalisierte Produkt-Alternativen
     fuer einen bestimmten Wirkstoff. */
  function getProduktAlternativen(wirkstoffId, AW) {
    if (typeof window.DB === 'undefined') {
      console.warn('Personalisierung: DB nicht geladen');
      return [];
    }

    var db = window.DB[wirkstoffId];
    if (!db || !db.alle) return [];

    // Filter aufbauen und auf Produkt-Liste anwenden
    var istKompatibel = baueKompatibilitaetsFilter(AW);
    var alle = db.alle.filter(istKompatibel);
    if (alle.length === 0) return [];

    // Profil-Felder fuer Slot-Auswahl
    var ernaehrung = AW.ernaehrung || 'A';
    var vegan      = ernaehrung === 'E';
    var alter      = AW.intro || 'C';
    var ziele      = AW.ziele || [];
    var erfahrung  = AW.erfahrung || 'einsteiger';
    var fett       = ziele.indexOf('B') >= 0;
    var mu         = ziele.indexOf('A') >= 0;
    var health     = ziele.indexOf('F') >= 0;

    function findSeg(seg) {
      for (var i = 0; i < alle.length; i++) {
        if (alle[i].segment === seg) return alle[i];
      }
      return null;
    }

    // ── Slot 1: Bestes Produkt nach Profil ──
    var best = null;
    if (vegan) {
      best = findSeg('trend') || findSeg('premium_medical');
    } else if ((erfahrung === 'profi' || erfahrung === 'fortgeschritten') && mu) {
      best = findSeg('premium_medical') || findSeg('medical_grade');
    } else if (fett) {
      best = findSeg('functional') || findSeg('premium_medical');
    } else if (health && (alter === 'D' || alter === 'E')) {
      best = findSeg('medical_grade') || findSeg('premium_medical');
    } else if (erfahrung === 'einsteiger') {
      best = findSeg('preis_leistung');
    }
    if (!best) best = findSeg('dach_premium') || alle[0];

    // ── Slot 2: Trend passend zur Altersklasse ──
    var trend = null;
    if (alter === 'A' || alter === 'B') {
      trend = findSeg('budget_cee') || findSeg('trend');
    } else if (alter === 'C') {
      trend = findSeg('trend') || findSeg('functional');
    } else if (alter === 'D' || alter === 'E') {
      trend = findSeg('medical_grade') || findSeg('tradition');
    }
    if (!trend) trend = findSeg('trend') || alle[Math.min(3, alle.length - 1)];

    // ── Slot 3-5: DACH Premium / Preis-Leistung / Reviews ──
    var dach    = findSeg('dach_premium')   || alle[0];
    var preis   = findSeg('preis_leistung') || alle[1];
    var reviews = findSeg('reviews_global') || findSeg('eu_reviews') || alle[2];

    // ── Deduplizieren auf max. 5 ──
    var result = [];
    var seen = [];
    function addIfNew(p) {
      if (!p) return;
      var key = (p.marke || '') + '|' + (p.name || '');
      if (seen.indexOf(key) < 0) {
        seen.push(key);
        result.push(p);
      }
    }
    addIfNew(best);
    addIfNew(trend);
    addIfNew(dach);
    addIfNew(preis);
    addIfNew(reviews);
    // Auffuellen mit den verbleibenden kompatiblen Produkten
    for (var i = 0; i < alle.length && result.length < 5; i++) {
      addIfNew(alle[i]);
    }

    return result;
  }


  /* ── PUBLIC API ── */
  return {
    getProduktAlternativen: getProduktAlternativen,
    // Fuer Tests / Debug exponiert
    _intern: {
      baueKompatibilitaetsFilter: baueKompatibilitaetsFilter
    }
  };

})();
