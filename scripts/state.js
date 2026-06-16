/* ============================================================
   state.js – Globaler App-State

   Single Source of Truth für alle globalen Variablen.
   Keine Logik – nur Deklarationen.

   Wird genutzt von: allen anderen Scripts
   Abhaengigkeiten: keine
============================================================ */


/* ──── PRODUKT-DATENBANK ──── */
/* Wird beim Start aus data/produkte.json geladen (produkte-loader.js) */
/* IDs werden beim Laden normalisiert (Unterstrich -> Bindestrich) */
/* Struktur: { 'kreatin': { hauptprodukt: {...}, alternativen: [...], alle: [...] } } */
var DB = {};


/* ──── WISSENSBASIS ──── */
/* Wird aus data/wirkstoffe-wissen.json geladen */
/* Struktur: { 'kreatin': { name, evidenz, dosierung, kontraindikationen, ... } } */
var WIRKSTOFFE_WISSEN = {};


/* ──── WIRKSTOFF-METADATEN ──── */
/* Wird aus data/wirkstoffe_meta.json geladen (wirkstoffe-meta-loader.js) */
/* IDs werden beim Laden normalisiert (Unterstrich -> Bindestrich) */
/* Struktur: { 'vitamin-d3': { id, name, emoji, tagline, kategorie, ... } } */
/* Plus: WIRKSTOFFE_META._kategorien und WIRKSTOFFE_META._prioritaeten */
var WIRKSTOFFE_META = {};


/* ──── WIRKSTOFF-DETAILS ──── */
/* Wird aus data/wirkstoffe/*.json geladen (on-demand pro Wirkstoff) */
/* Struktur: { 'kreatin': { studien: [...], faq: [...], langtext: '...' } } */
var WIRKSTOFFE_DETAILS = {};


/* ──── QUIZ-ANTWORTEN ──── */
/* Befuellt durch screens/quiz.js */
var AW = {};


/* ──── EMPFEHLUNGS-STACK (Phase 2 Engine-Output) ──── */
/* Befuellt durch engine/empfehlungen.js -> berechneStack(AW) */
/* Struktur: { essential, empfohlen, optional, entfernt, entfernt_overlaps, modi, meta } */
/* null = noch kein Quiz gemacht (oder Stack geloescht) */
var aktuellerStack = null;


/* ──── NUTZERPROFIL ──── */
/* Befuellt durch screens/profil.js oder Login */
var NP = { name: '', email: '' };


/* ──── STACK-STATE ──── */
var meinStack        = {};   /* { suppId: { prod, preis } } – gewaehlter Stack */
var abgewaehlt       = {};   /* { suppId: true } – manuell abgewaehlte Supplements */
var aufgeklappteAlts = {};   /* { suppId: true } – aufgeklappte Alternativen */
var gewaehlteAlts    = {};   /* { suppId: altIndex } – gewaehlte Alternative je Wirkstoff */


/* ──── UI-STATE ──── */
var aktiverScreen = 'stronger';  /* aktueller Sidebar-Screen */
