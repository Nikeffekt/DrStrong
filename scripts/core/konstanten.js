/* ============================================================
   core/konstanten.js – Globale Konstanten

   Hier landen alle App-weiten Konstanten, Mappings, IDs.
   Bei groesseren Aenderungen reicht es, hier etwas zu aendern.
============================================================ */


/* ──── KI-CHAT KONFIGURATION ──── */
var KI_PROXY_URL = 'https://stronger-proxy.stronger-supplements.workers.dev';
var KI_MAX_VERLAUF = 10;  // maximale Anzahl Nachrichten im Verlauf


/* ──── KATEGORIEN ──── */
var KATEGORIEN = {
  performance:  { label: 'Performance & Muskelaufbau', emoji: '💪' },
  gesundheit:   { label: 'Gesundheit & Vorbeugung',    emoji: '🛡️' },
  regeneration: { label: 'Regeneration',                emoji: '🌙' },
  wellbeing:    { label: 'Wellbeing & Mental',          emoji: '🧠' }
};


/* ──── EVIDENZ-LEVEL ──── */
var EVIDENZ_LABELS = {
  A: 'Goldstandard',
  B: 'Solide Evidenz',
  C: 'Moderate Evidenz',
  D: 'Schwache Evidenz'
};


/* ──── SCREEN-IDS ──── */
var SCREENS = {
  PROFIL:   'profil',
  QUIZ:     'quiz',
  STACK:    'stack',
  WISSEN:   'wissen',
  SHOP:     'shop',
  SETTINGS: 'settings'
};
