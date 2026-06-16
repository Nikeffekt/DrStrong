/* ============================================================
   data/stack-persistenz.js – Stack & Quiz-Antworten persistieren

   Aufgabe:
     Speichert Quiz-Antworten (AW) und Engine-Ergebnis (Stack) im
     localStorage des Browsers, damit der User die App schliessen
     und spaeter wiederkommen kann.

   Schluessel:
     'stronger:aw'    -> Quiz-Antworten als JSON
     'stronger:stack' -> Engine-Ergebnis + Zeitstempel als JSON

   Spaetere Migration: Wenn Supabase (Phase 8) angebunden ist,
   wird dieses Modul um eine Sync-Funktion erweitert.

   Genutzt von:
     - main.js          (beim App-Start: laden)
     - quiz.js          (bei Quiz-Ende: speichern)
     - screens/stack.js (Lese-Zugriff)
============================================================ */

window.StackPersistenz = (function () {
  'use strict';

  var SCHLUESSEL_AW    = 'stronger:aw';
  var SCHLUESSEL_STACK = 'stronger:stack';


  /* ── Stack + AW gemeinsam speichern ──
     Beide werden zusammen aktualisiert, weil Stack ohne AW
     keine Bedeutung hat. */
  function speichere(aw, stack) {
    if (!aw || !stack) {
      console.warn('StackPersistenz.speichere: aw oder stack fehlt');
      return false;
    }
    try {
      localStorage.setItem(SCHLUESSEL_AW, JSON.stringify(aw));
      localStorage.setItem(SCHLUESSEL_STACK, JSON.stringify({
        stack: stack,
        gespeichert_am: new Date().toISOString()
      }));
      return true;
    } catch (err) {
      // localStorage kann voll oder deaktiviert sein (Privat-Modus)
      console.error('StackPersistenz: Speichern fehlgeschlagen', err);
      return false;
    }
  }


  /* ── Stack + AW gemeinsam laden ──
     Liefert null wenn nichts gespeichert ist oder JSON kaputt. */
  function laden() {
    try {
      var awJson    = localStorage.getItem(SCHLUESSEL_AW);
      var stackJson = localStorage.getItem(SCHLUESSEL_STACK);
      if (!awJson || !stackJson) return null;

      var aw = JSON.parse(awJson);
      var stackData = JSON.parse(stackJson);

      return {
        aw: aw,
        stack: stackData.stack,
        gespeichert_am: stackData.gespeichert_am
      };
    } catch (err) {
      console.error('StackPersistenz: Laden fehlgeschlagen', err);
      return null;
    }
  }


  /* ── Stack + AW loeschen (z.B. bei Quiz-Reset) ── */
  function loesche() {
    try {
      localStorage.removeItem(SCHLUESSEL_AW);
      localStorage.removeItem(SCHLUESSEL_STACK);
      return true;
    } catch (err) {
      console.error('StackPersistenz: Loeschen fehlgeschlagen', err);
      return false;
    }
  }


  /* ── Schneller Check ohne JSON-Parse ──
     Fuer den Empty-State-Check im Stack-Screen (Phase 3 B). */
  function hatStack() {
    try {
      return localStorage.getItem(SCHLUESSEL_STACK) !== null;
    } catch (err) {
      return false;
    }
  }


  /* ── PUBLIC API ── */
  return {
    speichere: speichere,
    laden: laden,
    loesche: loesche,
    hatStack: hatStack,
    SCHLUESSEL_AW: SCHLUESSEL_AW,
    SCHLUESSEL_STACK: SCHLUESSEL_STACK
  };

})();
