/* ════════════════════════════════════════════════════════════════
   ui/wirkstoff-detail.js – Detail-Render fuer Wirkstoffe

   Eine zentrale Funktion baut den HTML-String fuer Wirkstoff-Details.
   Wird von BEIDEN Sheets genutzt:
   - Stack-Screen (mit Match-Begruendung des Engine-Eintrags)
   - Wissen-Screen (ohne Match-Begruendung, nur Wissens-Inhalt)

   PUBLIC API:
   ──────────────────────────────────────────────────────────────
   WirkstoffDetail.baueHTML(wirkstoffId, opts)
       opts.stackEintrag       Engine-Output-Eintrag (Stack-Kontext)
       opts.matchBegruendung   String fuer Match-Box (Stack-Kontext)

   Liefert HTML-String. Caller uebergibt diesen an BottomSheet.zeige().

   ABHAENGIGKEITEN: WIRKSTOFFE_WISSEN (state.js)
═══════════════════════════════════════════════════════════════════ */

window.WirkstoffDetail = (function () {
  'use strict';


  /* ──── Label-Mapping (User-freundliche Texte) ──── */
  var ZIEL_LABEL = {
    muskelaufbau: 'Muskelaufbau', kraft: 'Kraftsteigerung',
    kraftsteigerung: 'Kraftsteigerung', muskelausdauer: 'Muskelausdauer',
    fettabbau: 'Fettabbau', gewichtsmanagement: 'Gewichtsmanagement',
    energie: 'Energie', energie_muedigkeit: 'Müdigkeit',
    kognition_wachheit: 'Wachheit', kognition_konzentration: 'Konzentration',
    ausdauer: 'Ausdauer', hydration: 'Hydration',
    regeneration: 'Regeneration', muskelregeneration: 'Muskelregeneration',
    entzuendung: 'Entzündungen', gelenkschmerzen_oa: 'Gelenkschmerzen',
    schlaf: 'Schlaf', gesundheit: 'Gesundheit', immunsystem: 'Immunsystem',
    herzgesundheit: 'Herzgesundheit', knochengesundheit: 'Knochengesundheit',
    stress: 'Stressabbau', stimmung: 'Stimmung',
    hormonhaushalt: 'Hormonhaushalt'
  };

  var POP_LABEL = {
    senioren_50plus: 'Senioren (50+)', frauen: 'Frauen',
    schwangerschaft: 'Schwangerschaft', vegan: 'Vegane Ernährung',
    vegetarisch: 'Vegetarische Ernährung',
    rehabilitation_immobilitaet: 'Rehabilitation / Immobilität',
    menschen_mit_uebergewicht: 'Übergewicht',
    dunkle_hauttypen: 'Dunkle Hauttypen',
    schlafprobleme: 'Schlafprobleme', stress_chronisch: 'Chronischer Stress'
  };

  /* Mapping fuer form_hinweis -> Label + Begruendungs-Text fuer User */
  var FORM_LABEL = {
    'algenoel':           { label: 'Algenöl-Variante',           grund: 'fischfrei – passt zu deinem Profil' },
    'fischoel':           { label: 'Standard-Fischöl',           grund: '' },
    'isolat_bei_laktose': { label: 'Whey-Isolat (ISO Clear)',    grund: 'laktosearm – passt zu deinem Profil' },
    'ohne-k2':            { label: 'D3 ohne K2',                 grund: 'K2-frei – passt bei Blutverdünnern' }
  };


  /* ──── Helpers ──── */
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function autoLabel(key) {
    if (!key) return '';
    return key.split('_').map(function (t) {
      return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
    }).join(' ');
  }

  function zielLabel(key) { return ZIEL_LABEL[key] || autoLabel(key); }
  function popLabel(key)  { return POP_LABEL[key]  || autoLabel(key); }


  /* ──── Evidenz-Level zu Farb-Klasse ──── */
  function evidenzKlasse(level) {
    if (!level) return '';
    var l = String(level).toUpperCase().charAt(0);
    if (l === 'A') return 'wd-evidenz--a';
    if (l === 'B') return 'wd-evidenz--b';
    if (l === 'C') return 'wd-evidenz--c';
    return 'wd-evidenz--d';
  }


  /* ════════════════════════════════════════════════════════════════
     SEKTION-BAUER
     ──────────────────────────────────────────────────────────────
     Jede Sektion gibt einen HTML-String oder '' zurueck.
  ══════════════════════════════════════════════════════════════════ */

  /* Match-Begruendung (nur im Stack-Kontext) */
  function sektMatch(opts) {
    if (!opts.matchBegruendung) return '';
    return (
      '<div class="wd-match">' +
        '<div class="wd-match__label">Empfohlen weil</div>' +
        '<div class="wd-match__text">' + esc(opts.matchBegruendung) + '</div>' +
      '</div>'
    );
  }

  /* Form-Hinweis (nur im Stack-Kontext, wenn form_hinweis vom Default abweicht) */
  function sektForm(opts) {
    if (!opts.stackEintrag || !opts.stackEintrag.form_hinweis) return '';
    var fh = opts.stackEintrag.form_hinweis;

    // Defaults nicht anzeigen (z.B. fischoel ist Standard, keine Erwaehnung noetig)
    if (fh === 'fischoel') return '';

    var def = FORM_LABEL[fh] || { label: fh, grund: '' };
    var grundHTML = def.grund ? ('<div class="wd-form__grund">' + esc(def.grund) + '</div>') : '';
    return (
      '<div class="wd-form">' +
        '<div class="wd-form__label">Empfohlene Form</div>' +
        '<div class="wd-form__wert">' + esc(def.label) + '</div>' +
        grundHTML +
      '</div>'
    );
  }

  /* Kategorie + Kurz-Beschreibung */
  function sektLead(w) {
    var parts = [];
    if (w.kategorie) {
      parts.push('<div class="wd-kategorie">' + esc(w.kategorie) + '</div>');
    }
    if (w.kurz_beschreibung) {
      parts.push('<p class="wd-lead">' + esc(w.kurz_beschreibung) + '</p>');
    }
    return parts.join('');
  }

  /* Evidenz-Badge */
  function sektEvidenz(w) {
    var e = w.evidenz;
    if (!e) return '';
    var kl = evidenzKlasse(e.level);
    var teile = [
      '<section class="wd-section">',
      '  <h3 class="wd-section__title">📊 Evidenz</h3>',
      '  <div class="wd-evidenz ' + kl + '">',
      '    <div class="wd-evidenz__level">Level ' + esc(e.level || '?') + '</div>'
    ];
    if (e.score)           teile.push('    <div class="wd-evidenz__chip">Score ' + esc(e.score) + '/100</div>');
    if (e.studien_anzahl)  teile.push('    <div class="wd-evidenz__chip">' + esc(e.studien_anzahl) + ' Studien</div>');
    if (e.review_typ)      teile.push('    <div class="wd-evidenz__chip">' + esc(e.review_typ) + '</div>');
    teile.push('  </div>');
    if (e.konsens) teile.push('  <p class="wd-evidenz__konsens">' + esc(e.konsens) + '</p>');
    teile.push('</section>');
    return teile.join('');
  }

  /* Beschreibung – "Über diesen Nährstoff" */
  function sektBeschreibung(w) {
    var b = w.beschreibung;
    if (!b) return '';
    var teile = ['<section class="wd-section">',
                 '  <h3 class="wd-section__title">📖 Über diesen Wirkstoff</h3>'];
    if (b.was_ist_es) teile.push(
      '  <div class="wd-block">',
      '    <div class="wd-block__label">Was ist es?</div>',
      '    <p class="wd-block__text">' + esc(b.was_ist_es) + '</p>',
      '  </div>'
    );
    if (b.wie_wirkt_es) teile.push(
      '  <div class="wd-block">',
      '    <div class="wd-block__label">Wie wirkt es?</div>',
      '    <p class="wd-block__text">' + esc(b.wie_wirkt_es) + '</p>',
      '  </div>'
    );
    if (b.warum_wichtig) teile.push(
      '  <div class="wd-block">',
      '    <div class="wd-block__label">Warum wichtig?</div>',
      '    <p class="wd-block__text">' + esc(b.warum_wichtig) + '</p>',
      '  </div>'
    );
    teile.push('</section>');
    return teile.join('\n');
  }

  /* Dosierung – strukturiert */
  function sektDosierung(w) {
    var d = w.dosierung;
    if (!d) return '';
    var teile = ['<section class="wd-section">',
                 '  <h3 class="wd-section__title">💊 Dosierung</h3>',
                 '  <dl class="wd-dl">'];
    if (d.standard)   teile.push('    <dt>Standard</dt><dd>' + esc(d.standard) + '</dd>');
    if (d.bereich)    teile.push('    <dt>Bereich</dt><dd>' + esc(d.bereich) + '</dd>');
    if (d.obergrenze) teile.push('    <dt>Obergrenze</dt><dd>' + esc(d.obergrenze) + '</dd>');
    if (d.timing)     teile.push('    <dt>Timing</dt><dd>' + esc(d.timing) + '</dd>');
    teile.push('  </dl>');
    if (d.quelle) teile.push('  <p class="wd-quelle">Quelle: ' + esc(d.quelle) + '</p>');
    teile.push('</section>');
    return teile.join('\n');
  }

  /* Indikationen – mit Stärke-Balken */
  function sektIndikationen(w) {
    var inds = w.indikationen;
    if (!inds || !inds.length) return '';
    var sortiert = inds.slice().sort(function (a, b) {
      return (b.staerke || 0) - (a.staerke || 0);
    });
    var teile = ['<section class="wd-section">',
                 '  <h3 class="wd-section__title">🎯 Wofür</h3>',
                 '  <ul class="wd-ind-list">'];
    sortiert.forEach(function (i) {
      var prozent = Math.round((i.staerke || 0) * 100);
      teile.push(
        '<li class="wd-ind">',
        '  <div class="wd-ind__head">',
        '    <span class="wd-ind__label">' + esc(zielLabel(i.ziel)) + '</span>',
        '    <span class="wd-ind__staerke">' + prozent + '%</span>',
        '  </div>',
        '  <div class="wd-ind__bar"><div class="wd-ind__fill" style="width:' + prozent + '%"></div></div>'
      );
      if (i.kommentar) {
        teile.push('  <p class="wd-ind__kommentar">' + esc(i.kommentar) + '</p>');
      }
      teile.push('</li>');
    });
    teile.push('  </ul>', '</section>');
    return teile.join('\n');
  }

  /* Population-spezifisch */
  function sektPopulation(w) {
    var pop = w.population_spezifisch;
    if (!pop) return '';
    var keys = Object.keys(pop).filter(function (k) {
      var p = pop[k];
      return p && p.relevant && (p.staerke || 0) > 0;
    });
    if (!keys.length) return '';
    keys.sort(function (a, b) { return (pop[b].staerke || 0) - (pop[a].staerke || 0); });

    var teile = ['<section class="wd-section">',
                 '  <h3 class="wd-section__title">👥 Relevant für</h3>',
                 '  <ul class="wd-pop-list">'];
    keys.forEach(function (k) {
      var p = pop[k];
      teile.push(
        '<li class="wd-pop">',
        '  <div class="wd-pop__name">' + esc(popLabel(k)) + '</div>'
      );
      if (p.kommentar) {
        teile.push('  <p class="wd-pop__kommentar">' + esc(p.kommentar) + '</p>');
      }
      teile.push('</li>');
    });
    teile.push('  </ul>', '</section>');
    return teile.join('\n');
  }

  /* Warnhinweise */
  function sektWarnungen(w) {
    var ws = w.warnhinweise;
    if (!ws || !ws.length) return '';
    var teile = ['<section class="wd-section wd-section--warn">',
                 '  <h3 class="wd-section__title">⚠️ Wichtig zu wissen</h3>',
                 '  <ul class="wd-warn-list">'];
    ws.forEach(function (h) {
      var text = typeof h === 'string' ? h : (h.hinweis || h.text || '');
      teile.push('    <li>' + esc(text) + '</li>');
    });
    teile.push('  </ul>', '</section>');
    return teile.join('\n');
  }

  /* Kontraindikationen */
  function sektKontra(w) {
    var k = w.kontraindikationen;
    if (!k || !k.length) return '';
    var teile = ['<section class="wd-section wd-section--danger">',
                 '  <h3 class="wd-section__title">🚫 Kontraindikationen</h3>',
                 '  <ul class="wd-kontra-list">'];
    k.forEach(function (item) {
      var schwere = item.schwere || '';
      var klasse  = 'wd-kontra';
      if (schwere === 'hart') klasse += ' wd-kontra--hart';
      else if (schwere && schwere.indexOf('vorsicht') === 0) klasse += ' wd-kontra--vorsicht';
      teile.push(
        '<li class="' + klasse + '">',
        '  <div class="wd-kontra__head">',
        '    <span class="wd-kontra__art">' + esc(autoLabel(item.art || '')) + '</span>',
        '    <span class="wd-kontra__wert">' + esc(autoLabel(item.wert || '')) + '</span>',
        (schwere ? '    <span class="wd-kontra__badge">' + esc(schwere) + '</span>' : ''),
        '  </div>',
        (item.hinweis ? '  <p class="wd-kontra__hinweis">' + esc(item.hinweis) + '</p>' : ''),
        '</li>'
      );
    });
    teile.push('  </ul>', '</section>');
    return teile.join('\n');
  }

  /* Mythen */
  function sektMythen(w) {
    var f = w.fazit;
    if (!f || !f.mythen || !f.mythen.length) return '';
    var teile = ['<section class="wd-section">',
                 '  <h3 class="wd-section__title">🤔 Mythen</h3>',
                 '  <ul class="wd-mythen">'];
    f.mythen.forEach(function (m) {
      teile.push('    <li>' + esc(m) + '</li>');
    });
    teile.push('  </ul>', '</section>');
    return teile.join('\n');
  }

  /* Wissenschaftliche Quellen */
  function sektQuellen(w) {
    var qs = w.quellen;
    if (!qs || !qs.length) return '';
    var teile = ['<section class="wd-section">',
                 '  <h3 class="wd-section__title">📚 Quellen</h3>',
                 '  <ul class="wd-quellen-list">'];
    qs.forEach(function (q) {
      var titel   = q.titel   || 'Quelle';
      var autoren = q.autoren || '';
      var jahr    = q.jahr    || '';
      var typ     = q.typ     || '';
      var url     = q.url     || '';
      var inner =
        '<div class="wd-quelle__titel">' + esc(titel) + '</div>' +
        '<div class="wd-quelle__meta">' +
          (autoren ? esc(autoren) : '') +
          (jahr    ? ' · ' + esc(jahr) : '') +
          (typ     ? ' · ' + esc(typ)  : '') +
        '</div>';
      if (url) {
        teile.push('<li class="wd-quelle"><a href="' + esc(url) + '" target="_blank" rel="noopener">' + inner + '</a></li>');
      } else {
        teile.push('<li class="wd-quelle">' + inner + '</li>');
      }
    });
    teile.push('  </ul>', '</section>');
    return teile.join('\n');
  }

  /* Disclaimer */
  function sektDisclaimer() {
    return (
      '<footer class="wd-disclaimer">' +
        'Informativ. Keine medizinische Beratung. Bei Erkrankungen ärztlich abklären.' +
      '</footer>'
    );
  }


  /* ════════════════════════════════════════════════════════════════
     PUBLIC: baueHTML(wirkstoffId, opts)
  ══════════════════════════════════════════════════════════════════ */
  function baueHTML(wirkstoffId, opts) {
    opts = opts || {};
    var w = WIRKSTOFFE_WISSEN[wirkstoffId];
    if (!w) {
      return '<div class="wd-error">Wirkstoff "' + esc(wirkstoffId) + '" nicht in Wissensbasis</div>';
    }

    var teile = ['<article class="wirkstoff-detail">'];
    teile.push(sektMatch(opts));        // nur im Stack-Kontext sichtbar
    teile.push(sektForm(opts));         // nur im Stack-Kontext, nur bei Non-Default-Form
    teile.push(sektLead(w));
    teile.push(sektEvidenz(w));
    teile.push(sektBeschreibung(w));
    teile.push(sektDosierung(w));
    teile.push(sektIndikationen(w));
    teile.push(sektPopulation(w));
    teile.push(sektWarnungen(w));
    teile.push(sektKontra(w));
    teile.push(sektMythen(w));
    teile.push(sektQuellen(w));
    teile.push(sektDisclaimer());
    teile.push('</article>');

    return teile.filter(function (s) { return s; }).join('\n');
  }

  return {
    baueHTML: baueHTML
  };

})();
