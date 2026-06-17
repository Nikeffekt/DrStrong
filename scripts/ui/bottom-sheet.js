/* ════════════════════════════════════════════════════════════════
   ui/bottom-sheet.js – Generische Bottom-Sheet-Komponente

   Wird genutzt von verschiedenen Screens, um Detail-Inhalte
   in einem von unten reingleitenden Panel anzuzeigen.

   PUBLIC API:
   ──────────────────────────────────────────────────────────────
   BottomSheet.zeige({
     titel:        'Vitamin D3',          // angezeigt im Header
     inhalt:       '<div>...</div>',       // HTML-String (innerHTML)
     amSchliessen: function() { ... }      // optional, Callback nach Close
   })

   BottomSheet.verstecke()                 // schliesst aktiv
   BottomSheet.istOffen()                  // boolean

   SCHLIESSEN-TRIGGER (alle aktiv):
   - Klick auf Close-Button (X)
   - Klick auf Overlay (dunkler Bereich)
   - Escape-Taste
   - Swipe-Down auf Drag-Handle (nur Mobile)

   ABHAENGIGKEITEN: keine
═══════════════════════════════════════════════════════════════════ */

window.BottomSheet = (function () {
  'use strict';

  /* ──── DOM-Referenzen (werden in init() gesetzt) ──── */
  var $wrapper       = null;   /* aussen, position:fixed, full screen */
  var $overlay       = null;   /* der dunkle Hintergrund */
  var $sheet         = null;   /* der eigentliche Sheet-Container */
  var $titel         = null;   /* Header-Titel */
  var $closeBtn      = null;   /* X-Button */
  var $handle        = null;   /* Drag-Handle oben */
  var $body          = null;   /* scrollbarer Inhalt */

  /* ──── STATE ──── */
  var offen           = false;
  var schliessCallback = null;

  /* ──── Swipe-Tracking (Mobile) ──── */
  var swipeStartY     = 0;
  var swipeDistance   = 0;
  var swipeAktiv      = false;


  /* ════════════════════════════════════════════════════════════════
     SHEET-DOM BAUEN
     ──────────────────────────────────────────────────────────────
     Einmaliger Aufbau in init(). Liegt direkt am body.
  ══════════════════════════════════════════════════════════════════ */
  function baueDOM() {
    var html =
      '<div class="bs-wrapper" id="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="bs-titel" hidden>' +
        '<div class="bs-overlay" data-bs-action="close"></div>' +
        '<div class="bs-sheet" role="document">' +
          '<div class="bs-handle" aria-hidden="true"><span></span></div>' +
          '<header class="bs-header">' +
            '<h2 class="bs-titel" id="bs-titel"></h2>' +
            '<button class="bs-close" data-bs-action="close" aria-label="Schließen">' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
              '</svg>' +
            '</button>' +
          '</header>' +
          '<div class="bs-body"></div>' +
        '</div>' +
      '</div>';

    var temp = document.createElement('div');
    temp.innerHTML = html;
    var node = temp.firstChild;
    document.body.appendChild(node);

    // Referenzen cachen
    $wrapper  = node;
    $overlay  = node.querySelector('.bs-overlay');
    $sheet    = node.querySelector('.bs-sheet');
    $titel    = node.querySelector('.bs-titel');
    $closeBtn = node.querySelector('.bs-close');
    $handle   = node.querySelector('.bs-handle');
    $body     = node.querySelector('.bs-body');
  }


  /* ════════════════════════════════════════════════════════════════
     EVENT-LISTENER VERDRAHTEN
  ══════════════════════════════════════════════════════════════════ */
  function bindeEvents() {
    // Close-Trigger (Button + Overlay)
    $wrapper.addEventListener('click', function (ev) {
      var t = ev.target;
      // Wir laufen die Kette nach oben bis wir ein Element mit data-bs-action="close" finden
      while (t && t !== $wrapper) {
        if (t.dataset && t.dataset.bsAction === 'close') {
          verstecke();
          return;
        }
        t = t.parentElement;
      }
    });

    // Escape-Taste
    document.addEventListener('keydown', function (ev) {
      if (offen && ev.key === 'Escape') {
        verstecke();
      }
    });

    // Swipe-Down auf Handle (Mobile)
    if ($handle) {
      $handle.addEventListener('touchstart', onTouchStart, { passive: true });
      $handle.addEventListener('touchmove',  onTouchMove,  { passive: true });
      $handle.addEventListener('touchend',   onTouchEnd);
    }
  }


  /* ════════════════════════════════════════════════════════════════
     SWIPE-LOGIK (Mobile)
     ──────────────────────────────────────────────────────────────
     Bei Down-Swipe von 60+ Pixeln am Handle: Sheet schliessen.
  ══════════════════════════════════════════════════════════════════ */
  function onTouchStart(ev) {
    if (!offen) return;
    swipeAktiv    = true;
    swipeStartY   = ev.touches[0].clientY;
    swipeDistance = 0;
  }

  function onTouchMove(ev) {
    if (!swipeAktiv) return;
    swipeDistance = ev.touches[0].clientY - swipeStartY;
    if (swipeDistance > 0) {
      // Sheet beim Ziehen leicht mitbewegen (visuelles Feedback)
      $sheet.style.transform = 'translateY(' + swipeDistance + 'px)';
    }
  }

  function onTouchEnd() {
    if (!swipeAktiv) return;
    swipeAktiv = false;
    // Sheet-Inline-Transform zuruecksetzen (CSS-Klasse uebernimmt wieder)
    $sheet.style.transform = '';
    // Wenn 60+ Pixel runtergezogen: schliessen
    if (swipeDistance > 60) {
      verstecke();
    }
    swipeDistance = 0;
  }


  /* ════════════════════════════════════════════════════════════════
     PUBLIC: zeige() – Sheet oeffnen mit Inhalt
  ══════════════════════════════════════════════════════════════════ */
  function zeige(opts) {
    if (!$wrapper) {
      console.warn('BottomSheet: noch nicht initialisiert');
      return;
    }
    opts = opts || {};

    // Inhalt setzen
    $titel.textContent  = opts.titel  || '';
    $body.innerHTML     = opts.inhalt || '';
    schliessCallback    = (typeof opts.amSchliessen === 'function') ? opts.amSchliessen : null;

    // Body nach oben scrollen (frische Ansicht)
    $body.scrollTop = 0;

    // Sichtbar machen
    $wrapper.hidden = false;
    // Doppel-RAF damit die Browser-Engine die "hidden"-Aenderung wirklich
    // angewendet hat, bevor wir die Anim-Klasse setzen (Transition triggert sonst nicht)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        $wrapper.classList.add('bs-wrapper--offen');
      });
    });

    // Body-Scroll-Lock
    document.body.style.overflow = 'hidden';

    offen = true;
  }


  /* ════════════════════════════════════════════════════════════════
     PUBLIC: verstecke() – Sheet schliessen mit Animation
  ══════════════════════════════════════════════════════════════════ */
  function verstecke() {
    if (!offen) return;

    $wrapper.classList.remove('bs-wrapper--offen');

    // Nach Animations-Ende: hidden setzen + Callback ausloesen
    var onEnd = function (ev) {
      // Nur am Wrapper-Transition reagieren (nicht auf inneren)
      if (ev.target !== $wrapper && ev.target !== $sheet) return;
      $wrapper.removeEventListener('transitionend', onEnd);
      $wrapper.hidden = true;
      document.body.style.overflow = '';
      offen = false;

      var cb = schliessCallback;
      schliessCallback = null;
      if (cb) cb();
    };
    $wrapper.addEventListener('transitionend', onEnd);

    // Fallback fuer den Fall dass kein transitionend kommt (z.B. reduce-motion)
    setTimeout(function () {
      if ($wrapper.classList.contains('bs-wrapper--offen')) return;
      if ($wrapper.hidden) return;
      $wrapper.hidden = true;
      document.body.style.overflow = '';
      offen = false;
    }, 500);
  }


  /* ════════════════════════════════════════════════════════════════
     PUBLIC: init()
  ══════════════════════════════════════════════════════════════════ */
  function init() {
    if ($wrapper) return;  /* idempotent */
    baueDOM();
    bindeEvents();
    console.log('✓ BottomSheet bereit');
  }


  /* ════════════════════════════════════════════════════════════════
     EXPORT
  ══════════════════════════════════════════════════════════════════ */
  return {
    init:       init,
    zeige:      zeige,
    verstecke:  verstecke,
    istOffen:   function () { return offen; }
  };

})();
