/* ============================================================
   state.js – Globaler App-State

   Single Source of Truth für alle globalen Variablen.
   Keine Logik – nur Deklarationen.

   Wird genutzt von: allen anderen Scripts
   Abhaengigkeiten: keine
============================================================ */


/* ──── PRODUKT-DATENBANK ──── */
/* Wird beim Start aus data/produkte.json geladen (produkte-loader.js) */
/* Struktur: { 'kreatin': { hauptprodukt: {...}, alternativen: [...], alle: [...] } } */
var DB = {};


/* ──── WISSENSBASIS ──── */
/* Wird aus data/wirkstoffe-wissen.json geladen */
/* Struktur: { 'kreatin': { name, evidenz, dosierung, kontraindikationen, ... } } */
var WIRKSTOFFE_WISSEN = {};


/* ──── WIRKSTOFF-DETAILS ──── */
/* Wird aus data/wirkstoffe/*.json geladen (on-demand pro Wirkstoff) */
/* Struktur: { 'kreatin': { studien: [...], faq: [...], langtext: '...' } } */
var WIRKSTOFFE_DETAILS = {};


/* ──── QUIZ-ANTWORTEN ──── */
/* Befuellt durch screens/quiz.js */
var AW = {};


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
