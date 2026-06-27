/* Astemes "Vibration Analyser" — animated hero instrument panel (condition-monitoring variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). An accelerometer on a rotating machine feeds a time waveform
   and an FFT spectrum. The machine cycles through health conditions — baseline, mass imbalance,
   misalignment, bearing outer-race defect, mechanical looseness — and the spectrum morphs: the
   characteristic order lines (1x, 2x, harmonics, BPFO/BPFI with sidebands) rise and fall, the
   dominant fault peak is flagged, the diagnosis text names the fault, and the overall RMS velocity
   moves through ISO 10816 zones. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', red:'#B07A7A', redtx:'#D69191' };

  // FFT geometry
  var FX0 = 56, FX1 = 552, FB = 388, FTOP = 286, OMAX = 10, AMAX = 8;
  function ox(o) { return FX0 + (o / OMAX) * (FX1 - FX0); }
  function ay(a) { return FB - (Math.min(a, AMAX) / AMAX) * (FB - FTOP); }
  // time-waveform geometry
  var TX0 = 56, TX1 = 552, TMID = 223, THALF = 23;

  // spectral components: order + human label
  var COMP = [
    { k: 'h1',   o: 1.00, lab: '1\u00D7' },
    { k: 'h2',   o: 2.00, lab: '2\u00D7' },
    { k: 'h3',   o: 3.00, lab: '3\u00D7' },
    { k: 'h4',   o: 4.00, lab: '4\u00D7' },
    { k: 'h5',   o: 5.00, lab: '5\u00D7' },
    { k: 'h6',   o: 6.00, lab: '6\u00D7' },
    { k: 'sbLo', o: 5.82, lab: '' },
    { k: 'bpfi', o: 6.82, lab: 'BPFI' },
    { k: 'sbHi', o: 7.82, lab: '' },
    { k: 'bpfo', o: 4.18, lab: 'BPFO' },
    { k: 'bpfo2',o: 8.36, lab: '2\u00D7BPFO' }
  ];
  var STATES = [
    { name: 'NORMAL',       diag: 'Baseline \u2014 within ISO limits',        rms: 1.5, floor: 0.05,
      a: { h1: 0.6, h2: 0.3, h3: 0.16, h4: 0.1 } },
    { name: 'IMBALANCE',    diag: 'Mass imbalance \u2014 1\u00D7 dominant',     rms: 4.9, floor: 0.07,
      a: { h1: 5.0, h2: 0.6, h3: 0.25, h4: 0.12 } },
    { name: 'MISALIGNMENT', diag: 'Angular misalignment \u2014 elevated 2\u00D7', rms: 6.4, floor: 0.09,
      a: { h1: 2.4, h2: 5.6, h3: 2.1, h4: 0.9, h5: 0.4 } },
    { name: 'BEARING',      diag: 'Bearing outer race (BPFO) + sidebands',    rms: 5.7, floor: 0.5,
      a: { h1: 1.1, bpfo: 4.2, bpfo2: 2.3, sbLo: 1.4, sbHi: 1.4, bpfi: 1.1 } },
    { name: 'LOOSENESS',    diag: 'Mechanical looseness \u2014 harmonic series', rms: 7.9, floor: 0.6,
      a: { h1: 3.7, h2: 3.0, h3: 2.4, h4: 1.9, h5: 1.4, h6: 1.0 } }
  ];
  var DWELL = 4600, CHIPS = [{ k: 'h1', lab: '1\u00D7' }, { k: 'h2', lab: '2\u00D7' }, { k: 'bpfo', lab: 'BPFO' }, { k: 'bpfi', lab: 'BPFI' }];

  var SVG =
  `<svg id="vbPanel" viewBox="0 0 600 560" role="img"
        aria-label="A vibration analyser for a rotating machine: an accelerometer feeds a time waveform and an FFT order spectrum. The machine cycles through imbalance, misalignment, bearing and looseness faults; characteristic order lines rise, the dominant peak is flagged, a diagnosis names the fault, and the overall RMS velocity moves through ISO zones."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">VIBRATION ANALYSER</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">MACHINE</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">Pump P-204 &#183; MOB</text>
      <text x="250" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SENSOR</text>
      <text x="250" y="100" fill="#CFD8DC" font-size="13">Accel &#183; 100 mV/g</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SPEED</text>
      <text id="vbRpm" x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">1485 rpm</text>

      <!-- status banner -->
      <rect id="vbBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(216,166,87,0.10)" stroke="#D8A657" stroke-width="1.5"/>
      <circle id="vbDot" cx="54" cy="147" r="7" fill="#D8A657"/>
      <path id="vbWarn" d="M54 134l13 23H41Z" fill="none" stroke="#D8A657" stroke-width="2.4" stroke-linejoin="round" opacity="0"/>
      <text id="vbWarnEx" x="54" y="153" text-anchor="middle" fill="#D8A657" font-size="13" font-weight="700" opacity="0">!</text>
      <text id="vbState" x="80" y="156" fill="#D8A657" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">WARNING</text>
      <text id="vbSub1" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">OVERALL VELOCITY</text>
      <text id="vbSub2" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">4.9 mm/s RMS &#183; ZONE C</text>

      <!-- time waveform -->
      <text x="40" y="190" fill="#9E9E9E" font-size="9" letter-spacing="1.5">TIME WAVEFORM</text>
      <text x="552" y="190" text-anchor="end" fill="#6b7780" font-size="9">accel g &#183; 0.5 s</text>
      <rect x="44" y="196" width="512" height="54" rx="4" fill="#0d1417" stroke="#34424b"/>
      <line x1="44" y1="223" x2="556" y2="223" stroke="rgba(96,125,139,0.22)"/>
      <polyline id="vbWave" fill="none" stroke="#7EA6D6" stroke-width="1.4" stroke-linejoin="round" points=""/>

      <!-- FFT spectrum -->
      <text x="40" y="266" fill="#9E9E9E" font-size="9" letter-spacing="1.5">ORDER SPECTRUM (FFT)</text>
      <text x="552" y="266" text-anchor="end" fill="#6b7780" font-size="9">mm/s &#183; 8 avg &#183; Hanning</text>
      <rect x="44" y="270" width="512" height="128" rx="4" fill="#0d1417" stroke="#34424b"/>
      <g id="vbGrid" stroke="rgba(96,125,139,0.10)" stroke-width="1"></g>
      <g id="vbAxis"></g>
      <polyline id="vbFloor" fill="none" stroke="rgba(126,166,214,0.35)" stroke-width="1" points=""/>
      <g id="vbStems"></g>
      <line id="vbCur" x1="0" y1="282" x2="0" y2="388" stroke="rgba(216,166,87,0.4)" stroke-width="1" stroke-dasharray="2 3" opacity="0"/>
      <rect id="vbCurBg" x="0" y="276" width="92" height="15" rx="2" fill="#0d1417" opacity="0"/>
      <text id="vbCurT" x="0" y="287" fill="#D8A657" font-size="9.5" opacity="0">1\u00D7  5.0 mm/s</text>

      <!-- diagnosis -->
      <text x="40" y="420" fill="#9E9E9E" font-size="9" letter-spacing="1.5">DIAGNOSIS</text>
      <circle id="vbDiagDot" cx="118" cy="417" r="4" fill="#D8A657"/>
      <text id="vbDiag" x="130" y="421" fill="#D8A657" font-size="12.5" font-family="'Space Grotesk',sans-serif" font-weight="600">Mass imbalance \u2014 1\u00D7 dominant</text>

      <!-- characteristic-frequency chips -->
      <text x="40" y="448" fill="#9E9E9E" font-size="9" letter-spacing="1.5">BAND RMS</text>
      <g id="vbChips"></g>

      <path d="M32 466H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text id="vbFoot" x="40" y="492" fill="#9E9E9E" font-size="12">1&#215; = 24.8 Hz &#183; \u0394f 0.05&#215; &#183; ISO 10816 CLASS II</text>
    </svg>`;

  window.AstemesAnim.register({
    id: 'vibration-analyser', name: 'Vibration Analyser', weight: 1, isDefault: false,
    mount: function (stage) {
      stage.innerHTML = SVG;
      var __raf = null, __torn = false;
      var panel = document.getElementById('vbPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };

      // grid + axis labels
      var grid = id('vbGrid'), axis = id('vbAxis');
      for (var o = 1; o <= OMAX; o++) {
        grid.appendChild(el('line', { x1: ox(o), y1: FTOP, x2: ox(o), y2: FB }));
        axis.appendChild(el('text', { x: ox(o), y: 396, 'text-anchor': 'middle', fill: '#54636b', 'font-size': 7.5 }, o + '\u00D7'));
      }

      // stems
      var stemsG = id('vbStems'), stem = {}, cap = {};
      COMP.forEach(function (c) {
        stem[c.k] = stemsG.appendChild(el('line', { x1: ox(c.o), y1: FB, x2: ox(c.o), y2: FB, stroke: C.blue, 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
        cap[c.k] = stemsG.appendChild(el('circle', { cx: ox(c.o), cy: FB, r: 2.4, fill: C.blue, opacity: 0 }));
      });

      // chips
      var chipsG = id('vbChips'), chip = [], cx = 300;
      CHIPS.forEach(function (ch, i) {
        var x = 296 + i * 65;
        chipsG.appendChild(el('rect', { x: x, y: 436, width: 60, height: 18, rx: 4, fill: 'rgba(96,125,139,0.08)', stroke: '#2f3c44' }));
        var lab = el('text', { x: x + 8, y: 448, fill: C.mut, 'font-size': 8.5, 'letter-spacing': 0.3 }, ch.lab);
        var val = el('text', { id: 'vbChv' + i, x: x + 52, y: 448, 'text-anchor': 'end', fill: C.light, 'font-size': 9, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, '0.0');
        chipsG.appendChild(lab); chipsG.appendChild(val);
        chip[i] = val;
      });

      // floor polyline points
      var FLN = 70;

      // ── state ──
      var cur = {}; COMP.forEach(function (c) { cur[c.k] = 0; });
      var curFloor = 0.05, rmsShown = 1.5, stateIdx = -1;

      function zone(rms) {
        if (rms < 2.8) return { z: 'ZONE A/B', s: 'GOOD', col: C.green };
        if (rms < 7.1) return { z: 'ZONE C', s: 'WARNING', col: C.amber };
        return { z: 'ZONE D', s: 'ALARM', col: C.red };
      }

      var lastBn = '';
      function render(e) {
        var si = Math.floor(e / DWELL) % STATES.length;
        if (si !== stateIdx) stateIdx = si;
        var S = STATES[si];

        // ease components toward target
        COMP.forEach(function (c) { var t = S.a[c.k] || 0; cur[c.k] += (t - cur[c.k]) * 0.06; });
        curFloor += (S.floor - curFloor) * 0.05;
        rmsShown += (S.rms - rmsShown) * 0.05;
        var rpm = 1485 + Math.round(6 * Math.sin(e / 1700));
        id('vbRpm').textContent = rpm + ' rpm';

        // stems + dominant
        var domK = null, domA = 0;
        COMP.forEach(function (c) {
          var a = cur[c.k];
          if (a > domA) { domA = a; domK = c; }
        });
        COMP.forEach(function (c) {
          var a = cur[c.k], y = ay(a), isDom = (c === domK && domA > 0.6);
          var col = isDom ? (domA > 4.5 ? C.red : C.amber) : (a > 2.0 ? C.amber : C.blue);
          stem[c.k].setAttribute('y2', y.toFixed(1)); stem[c.k].setAttribute('stroke', col);
          cap[c.k].setAttribute('cy', y.toFixed(1)); cap[c.k].setAttribute('fill', col);
          cap[c.k].setAttribute('opacity', a > 0.4 ? '1' : '0');
        });

        // noise floor shimmer
        var pts = '';
        for (var i = 0; i <= FLN; i++) {
          var o = (i / FLN) * OMAX, x = ox(o);
          var amp = curFloor * (0.45 + 0.55 * Math.random()) + 0.02;
          pts += x.toFixed(1) + ',' + ay(amp).toFixed(1) + ' ';
        }
        id('vbFloor').setAttribute('points', pts);

        // cursor on dominant
        if (domK && domA > 0.6) {
          var cxp = ox(domK.o), lbl = (domK.lab || (domK.o.toFixed(2) + '\u00D7'));
          id('vbCur').setAttribute('x1', cxp); id('vbCur').setAttribute('x2', cxp); id('vbCur').setAttribute('opacity', '1');
          var bx = clamp(cxp + 4, FX0, FX1 - 92);
          id('vbCurBg').setAttribute('x', bx); id('vbCurBg').setAttribute('opacity', '0.92');
          id('vbCurT').setAttribute('x', bx + 5); id('vbCurT').setAttribute('opacity', '1');
          id('vbCurT').textContent = lbl + '  ' + domA.toFixed(1) + ' mm/s';
          id('vbCurT').setAttribute('fill', domA > 4.5 ? C.redtx : C.amber);
        } else { id('vbCur').setAttribute('opacity', '0'); id('vbCurBg').setAttribute('opacity', '0'); id('vbCurT').setAttribute('opacity', '0'); }

        // time waveform synth from current components
        var wp = '', REVS = 3.4, gp = e / 1000 * 1.4;
        for (var j = 0; j <= 130; j++) {
          var frac = j / 130, sig = 0;
          COMP.forEach(function (c) { sig += cur[c.k] * Math.sin(2 * Math.PI * c.o * frac * REVS + c.o * gp); });
          sig += (Math.random() - 0.5) * curFloor * 5;
          var y = clamp(TMID - sig * (THALF / 9), 197, 249);
          wp += (TX0 + frac * (TX1 - TX0)).toFixed(1) + ',' + y.toFixed(1) + ' ';
        }
        id('vbWave').setAttribute('points', wp);

        // chips
        CHIPS.forEach(function (ch, i) {
          var a = cur[ch.k];
          chip[i].textContent = a.toFixed(1);
          chip[i].setAttribute('fill', a > 4.5 ? C.redtx : a > 2.0 ? C.amber : a > 0.9 ? C.light : C.dim);
        });

        // diagnosis + banner
        var z = zone(rmsShown);
        id('vbDiag').textContent = S.diag; id('vbDiag').setAttribute('fill', z.col);
        id('vbDiagDot').setAttribute('fill', z.col);
        id('vbSub2').textContent = rmsShown.toFixed(1) + ' mm/s RMS \u00B7 ' + z.z;

        var key = z.s + S.name;
        if (key !== lastBn) {
          lastBn = key;
          id('vbBanner').setAttribute('fill', z.col === C.green ? 'rgba(121,197,166,0.10)' : z.col === C.amber ? 'rgba(216,166,87,0.10)' : 'rgba(176,122,122,0.12)');
          id('vbBanner').setAttribute('stroke', z.col);
          id('vbState').textContent = z.s === 'GOOD' ? 'HEALTHY' : z.s; id('vbState').setAttribute('fill', z.col);
          var alarmish = z.s !== 'GOOD';
          id('vbDot').setAttribute('opacity', alarmish ? '0' : '1'); id('vbDot').setAttribute('fill', z.col);
          id('vbWarn').setAttribute('opacity', alarmish ? '1' : '0'); id('vbWarn').setAttribute('stroke', z.col);
          id('vbWarnEx').setAttribute('opacity', alarmish ? '1' : '0'); id('vbWarnEx').setAttribute('fill', z.col === C.red ? C.redtx : C.amber);
        }
        if (z.s === 'GOOD') id('vbDot').setAttribute('opacity', (0.5 + 0.5 * Math.abs(Math.sin(e / 240))).toFixed(2));
        id('vbFoot').textContent = '1\u00D7 = ' + (rpm / 60).toFixed(1) + ' Hz \u00B7 \u0394f 0.05\u00D7 \u00B7 ISO 10816 CLASS II';
      }

      var mqDesktop = window.matchMedia('(min-width: 1px)');
      if (reduce) { if (mqDesktop.matches) { for (var w = 0; w < 60; w++) render(DWELL * 1.5); } return; }

      var t0 = null, ticking = false;
      function frame(ts) {
        if (!mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        render(ts - t0);
        __raf = requestAnimationFrame(frame);
      }
      function startLoop() { if (ticking || !mqDesktop.matches) return; ticking = true; t0 = null; __raf = requestAnimationFrame(frame); }
      if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', startLoop);
      else if (mqDesktop.addListener) mqDesktop.addListener(startLoop);
      startLoop();
    return function teardown() {
      __torn = true;
      if (__raf) cancelAnimationFrame(__raf);
      if (mqDesktop.removeEventListener) mqDesktop.removeEventListener('change', startLoop);
      else if (mqDesktop.removeListener) mqDesktop.removeListener(startLoop);
      stage.innerHTML = '';
    };
    }
  });
})();
