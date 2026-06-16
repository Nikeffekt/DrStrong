/* ════════════════════════════════════════════════════════════════
   ui/dr-strong.js – Stop-Motion-Animation fuer Dr. Strong

   Frame-per-Frame-Animation des Charakters mit event-getriebener
   Sequenz-Steuerung. Wechsel zwischen Sequenzen via API-Aufruf.


   ═══════════════════════════════════════════════════════════════════
   FRAME-DATEIEN – Wo liegen die Bilder?
   ═══════════════════════════════════════════════════════════════════

   Standard-Konvention:
     assets/images/drstrong/{sequenz-name}/01.png
     assets/images/drstrong/{sequenz-name}/02.png
     ...

   Beispiel fuer "idle" mit 8 Frames:
     assets/images/drstrong/idle/01.png
     ...
     assets/images/drstrong/idle/08.png

   WICHTIG:
   - Dateinamen IMMER 2-stellig nullgepadded: "01.png", "02.png", "10.png"
   - PNG mit transparentem Hintergrund (Alpha-Kanal!)
   - Alle Frames einer Sequenz sollten gleiche Bildgroesse haben


   ═══════════════════════════════════════════════════════════════════
   SEQUENZEN ANPASSEN – siehe SEQUENZEN-Block weiter unten
   ═══════════════════════════════════════════════════════════════════

   Felder pro Sequenz:
     frames        Anzahl Frame-Dateien (z.B. 8 -> Frames 01.png bis 08.png)

     fps           Geschwindigkeit als Default (6 = ruckelig, 12 = fluessig)
                   Wird nur verwendet wenn KEIN delays-Array da ist.

     delays        Optional: Array mit Millisekunden pro Frame.
                   Erlaubt feine Stop-Motion-Kontrolle (Halte-Frames, Pausen).
                   Laenge MUSS gleich "frames" sein, sonst Warnung + Fallback.
                   Beispiel: [200, 150, 150, 600, 150, 150, 150, 500]
                             ^Frame 1                                ^Frame 8

     loop          true = Sequenz wiederholt sich endlos
                   false = laeuft einmal durch, dann stop oder "danach"

     danach        Optional: Name der naechsten Sequenz (nach Loop-Ende)

     pfadOverride  Optional: ueberschreibt die Standard-Pfad-Konvention
                   (z.B. fuer Mock-Bilder solange noch keine Frames da sind)


   ═══════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════

   DrStrong.spiele('idle')                    – startet eine Sequenz
   DrStrong.spiele('quiz_success', { amEnde: function() {} })
                                              – mit Callback bei Sequenz-Ende
   DrStrong.stoppe()                          – stoppt aktuelle Animation
   DrStrong.aktuelleSequenz()                 – liefert Namen oder null
══════════════════════════════════════════════════════════════════ */

window.DrStrong = (function () {
  'use strict';


  /* ════════════════════════════════════════════════════════════════
     SEQUENZEN-KONFIGURATION
  ══════════════════════════════════════════════════════════════════ */
  var SEQUENZEN = {

    'idle': {
      frames: 4,
      fps: 4,
      loop: true,
      // MOCK: nutzt das aktuelle statische Bild bis echte Idle-Frames da sind.
      // Sobald du Frames in assets/images/drstrong/idle/ ablegst:
      //   1. frames auf die echte Anzahl setzen (z.B. 8)
      //   2. pfadOverride-Zeile loeschen
      //   3. OPTIONAL: delays-Array fuer per-Frame-Timing ergaenzen
      //
      // Beispiel mit realistischer Atem-Animation:
      //
      //   frames: 8,
      //   fps: 6,
      //   delays: [200, 150, 150, 600, 150, 150, 150, 500],
      //   loop: true
      //
      //pfadOverride: 'assets/images/dr-strong.png'
    }

    // Weitere Sequenzen kommen hier rein, sobald wir sie brauchen.
    // Beispiel mit feinem Stop-Motion-Timing:
    //
    // 'point': {
    //   frames: 6,
    //   fps: 10,
    //   delays: [100, 80, 80, 300, 200, 150],   // Halt am "voll ausgestreckten" Frame
    //   loop: false,
    //   danach: 'idle'
    // }

  };


  /* ════════════════════════════════════════════════════════════════
     STATE (privat)
  ══════════════════════════════════════════════════════════════════ */
  var $img             = null;
  var aktuelleSeq      = null;
  var aktuellerFrame   = 0;
  var timerId          = null;
  var endeCallback     = null;
  var preloadedSeq     = {};


  /* ════════════════════════════════════════════════════════════════
     HELPER – Frame-Pfad bestimmen
  ══════════════════════════════════════════════════════════════════ */
  function framePfad(seqName, frameNr) {
    var seq = SEQUENZEN[seqName];
    if (!seq) return null;

    if (seq.pfadOverride) return seq.pfadOverride;

    var nr = (frameNr < 10 ? '0' : '') + frameNr;
    return 'assets/images/drstrong/' + seqName + '/' + nr + '.png';
  }


  /* ════════════════════════════════════════════════════════════════
     HELPER – Delay bis zum naechsten Frame-Wechsel
     ──────────────────────────────────────────────────────────────
     Logik:
     1. Wenn delays-Array sauber definiert: nimm den Wert fuer den
        AKTUELL angezeigten Frame ("wie lange bleibt Frame X sichtbar").
     2. Sonst Fallback auf fps (gleichmaessiges Tempo).
  ══════════════════════════════════════════════════════════════════ */
  function naechsterDelay() {
    var seq = SEQUENZEN[aktuelleSeq];
    if (!seq) return 1000;

    if (Array.isArray(seq.delays)) {
      if (seq.delays.length !== seq.frames) {
        console.warn(
          'DrStrong: delays-Array von "' + aktuelleSeq + '" hat ' +
          seq.delays.length + ' Eintraege, sollte ' + seq.frames +
          ' haben. Falle auf fps zurueck.'
        );
      } else {
        var d = seq.delays[aktuellerFrame - 1];
        if (typeof d === 'number' && d > 0) return d;
      }
    }

    return 1000 / (seq.fps || 6);
  }


  /* ════════════════════════════════════════════════════════════════
     HELPER – Naechsten Tick einplanen
     ──────────────────────────────────────────────────────────────
     Nutzt setTimeout (nicht setInterval), damit jeder Tick seine
     eigene Wartezeit bekommen kann.
  ══════════════════════════════════════════════════════════════════ */
  function planeNaechstenTick() {
    timerId = setTimeout(tick, naechsterDelay());
  }


  /* ════════════════════════════════════════════════════════════════
     PRELOAD – alle Frames einer Sequenz vorab im Browser-Cache
  ══════════════════════════════════════════════════════════════════ */
  function preload(seqName) {
    if (preloadedSeq[seqName]) return;
    var seq = SEQUENZEN[seqName];
    if (!seq) return;
    for (var i = 1; i <= seq.frames; i++) {
      var tmp = new Image();
      tmp.src = framePfad(seqName, i);
    }
    preloadedSeq[seqName] = true;
  }


  /* ════════════════════════════════════════════════════════════════
     TICK – schaltet auf naechsten Frame, plant naechsten Tick
  ══════════════════════════════════════════════════════════════════ */
  function tick() {
    var seq = SEQUENZEN[aktuelleSeq];
    if (!seq) return;

    aktuellerFrame++;

    if (aktuellerFrame > seq.frames) {
      if (seq.loop) {
        aktuellerFrame = 1;
      } else {
        var cb = endeCallback;
        endeCallback = null;
        if (typeof cb === 'function') cb();

        if (seq.danach) {
          spiele(seq.danach);
        } else {
          stoppe();
        }
        return;
      }
    }

    $img.src = framePfad(aktuelleSeq, aktuellerFrame);
    planeNaechstenTick();
  }


  /* ════════════════════════════════════════════════════════════════
     PUBLIC: spiele() – startet eine Sequenz
  ══════════════════════════════════════════════════════════════════ */
  function spiele(seqName, opts) {
    if (!$img) {
      console.warn('DrStrong: <img class="dr-strong"> nicht im DOM');
      return;
    }
    var seq = SEQUENZEN[seqName];
    if (!seq) {
      console.warn('DrStrong: Sequenz "' + seqName + '" nicht definiert');
      return;
    }

    stoppe();

    preload(seqName);
    aktuelleSeq    = seqName;
    aktuellerFrame = 1;
    endeCallback   = (opts && opts.amEnde) ? opts.amEnde : null;

    $img.src = framePfad(seqName, 1);

    if (seq.frames <= 1) {
      if (endeCallback) {
        var cb = endeCallback;
        endeCallback = null;
        setTimeout(cb, 0);
      }
      return;
    }

    planeNaechstenTick();
  }


  /* ════════════════════════════════════════════════════════════════
     PUBLIC: stoppe()
  ══════════════════════════════════════════════════════════════════ */
  function stoppe() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }


  /* ════════════════════════════════════════════════════════════════
     PUBLIC: init()
  ══════════════════════════════════════════════════════════════════ */
  function init() {
    $img = document.querySelector('.dr-strong');
    if (!$img) {
      console.warn('DrStrong.init: <img class="dr-strong"> nicht gefunden');
      return;
    }
    spiele('idle');
    console.log('✓ DrStrong bereit (Sequenz: idle)');
  }


  /* ════════════════════════════════════════════════════════════════
     EXPORT
  ══════════════════════════════════════════════════════════════════ */
  return {
    init:             init,
    spiele:           spiele,
    stoppe:           stoppe,
    aktuelleSequenz:  function () { return aktuelleSeq; }
  };

})();
