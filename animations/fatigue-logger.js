/* Astemes "Fatigue Logger" — animated hero instrument panel (structural durability variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A servo-hydraulic rig runs accelerated endurance tests on a
   series of specimens: strain gauges show the cyclic load on a scope while the cycle counter
   climbs toward a 2 000 000-cycle target. Specimens alternate between fracturing early (SG2
   amplitude grows visibly, an AMPLITUDE DRIFT warning trips, then SPECIMEN FRACTURE — load
   removed, traces flatten with a residual offset) and reaching runout (TEST PASSED); then the
   next specimen mounts and the counter restarts. Numeric readouts refresh at 5 Hz, PEAK / RANGE
   are computed over the visible scope window, and element lookups are scoped to the mounted
   panel so multiple instances can coexist (see animations/harness.html). */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', steel:'#B8C2C9',
            light:'#CFD8DC', dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A', redtx:'#D69191' };

  // scope geometry
  var SX0 = 52, SX1 = 548, PTOP = 182, PBOT = 298, SMIN = -1000, SMAX = 1000, NPTS = 188;
  var OMEGA = 0.021;                    // strain scope frequency (rad/ms of sped time)
  // endurance schedule (sped-up time)
  var TARGET = 2000000, RATE = 120000;  // cycles/s of sped time -> runout in ~17 s
  var HOLD_MS = 2600, LOAD_MS = 1900, SPIKE_MS = 260, UI_MS = 200;
  var WARN_FRAC = 0.78;                 // drift warning in the last stretch before fracture

  // strain gauges (µε): label, colour, mean, amplitude (SG2 grows toward fracture)
  var SG = [
    { name: 'SG1 Fillet', col: C.amber, mean: 30,  amp: 760  },
    { name: 'SG2 Web',    col: C.green, mean: -40, amp: 520  },
    { name: 'SG3 Flange', col: C.blue,  mean: -20, amp: -680 },
    { name: 'SG4 Boss',   col: C.mauve, mean: 10,  amp: 300  }
  ];
  var TC = [
    { name: 'TC1 Component', col: C.steel, dec: 1 },
    { name: 'TC2 Ambient',   col: C.gmut,  dec: 1 }
  ];
  var ROWY = [346, 364, 382, 400, 422, 440];

  var SVG =
  `<svg viewBox="0 0 600 560" role="img"
        aria-label="A structural durability logger on a servo-hydraulic fatigue rig: strain gauges show the cyclic load on a scope while the cycle counter climbs toward a two-million-cycle endurance target. Some specimens develop growing strain amplitude, trip a drift warning and fracture — the load is removed and the next specimen is mounted; others reach runout and pass."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <!-- panel -->
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">FATIGUE LOGGER</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- header info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SPECIMEN</text>
      <text id="f2Spec" x="40" y="100" fill="#CFD8DC" font-size="13">Suspension Arm A3</text>
      <text x="262" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">RIG</text>
      <text x="262" y="100" fill="#CFD8DC" font-size="13">Servo-Hyd 100 kN</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SENSORS</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">6 &#183; 2 kHz</text>

      <!-- status banner -->
      <rect id="f2Banner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(121,197,166,0.10)" stroke="#79C5A6" stroke-width="1.5"/>
      <circle id="f2Rec" cx="54" cy="147" r="8" fill="#B07A7A"/>
      <text id="f2State" x="78" y="156" fill="#79C5A6" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">RUNNING</text>
      <text x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">AXIAL FATIGUE &#183; R = &#8722;1</text>
      <text id="f2Load" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">&#177;18.2 kN @ 12.0 Hz</text>

      <!-- cyclic strain scope -->
      <rect x="44" y="174" width="512" height="132" rx="4" fill="#0d1417" stroke="#34424b"/>
      <g id="f2Grid" stroke="rgba(96,125,139,0.12)" stroke-width="1"></g>
      <line x1="52" y1="240" x2="548" y2="240" stroke="rgba(96,125,139,0.34)" stroke-width="1"/>
      <text x="56" y="188" fill="#6b7780" font-size="9">+1000 &#181;&#949;</text>
      <text x="56" y="296" fill="#6b7780" font-size="9">&#8722;1000 &#181;&#949;</text>
      <g id="f2Traces"></g>
      <g id="f2Legend"></g>

      <!-- channel table -->
      <text x="66"  y="328" fill="#9E9E9E" font-size="9" letter-spacing="1.2">SENSOR</text>
      <text x="346" y="328" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">LIVE</text>
      <text x="452" y="328" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">PEAK</text>
      <text x="550" y="328" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">RANGE</text>
      <path d="M40 334H560" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <rect id="f2RowHi" x="38" y="0" width="524" height="16" rx="3" fill="rgba(216,166,87,0.12)" opacity="0"/>
      <g id="f2Rows" font-size="12"></g>

      <!-- footer: endurance cycles -->
      <path d="M32 456H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="476" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CYCLES COMPLETED</text>
      <text id="f2Cycles" x="40" y="500" fill="#CFD8DC" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700">782450</text>
      <text id="f2CycTgt" x="196" y="500" fill="#6b7780" font-size="11">/ 2 000 000 &#183; 39%</text>
      <rect x="40" y="510" width="380" height="7" rx="3.5" fill="rgba(96,125,139,0.18)"/>
      <rect id="f2Prog" x="40" y="510" width="149" height="7" rx="3.5" fill="#607D8B"/>
      <text id="f2Elapsed" x="40" y="534" fill="#6b7780" font-size="11">ELAPSED 18:42:06 &#183; SPECIMEN 56.4&#176;C</text>
      <g id="f2Stop">
        <rect id="f2StopBox" x="448" y="492" width="112" height="30" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="f2StopIcon" x="474" y="499" width="13" height="13" rx="2" fill="#B07A7A"/>
        <text id="f2StopTxt" x="495" y="511" fill="#B07A7A" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP</text>
      </g>
    </svg>`;

  window.AstemesAnim.register({
    id: 'fatigue-logger', name: 'Fatigue Logger', weight: 1, isDefault: false,
    mount: function (stage) {
      stage.innerHTML = SVG;
      var panel = stage.querySelector('svg');
      if (!panel) return;
      var __raf = null, __torn = false, __rearmT = null;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var q = function (s) { return panel.querySelector('#' + s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      var grp = function (n) { return Math.round(n).toLocaleString('en-US').replace(/,/g, ' '); };
      var sgn = function (n, d) { return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(d || 0); };

      // grid
      var grid = q('f2Grid');
      for (var gx = 1; gx < 8; gx++) grid.appendChild(el('line', { x1: 52 + gx * 62, y1: PTOP, x2: 52 + gx * 62, y2: PBOT }));
      for (var gy = 1; gy < 4; gy++) grid.appendChild(el('line', { x1: 52, y1: PTOP + gy * 29, x2: SX1, y2: PTOP + gy * 29 }));

      // strain traces + legend
      var tg = q('f2Traces'), lg = q('f2Legend'), lx = 130;
      SG.forEach(function (g, i) {
        g.buf = [];
        tg.appendChild(el('path', { id: 'f2Tr' + i, fill: 'none', stroke: g.col, 'stroke-width': 1.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', d: '' }));
        lg.appendChild(el('circle', { cx: lx, cy: 188, r: 3, fill: g.col }));
        lg.appendChild(el('text', { x: lx + 8, y: 191, fill: '#9E9E9E', 'font-size': 9 }, g.name));
        lx += g.name.length * 5.6 + 24;
      });

      // table rows (4 SG + 2 TC)
      var rows = q('f2Rows');
      function addRow(i, name, col) {
        var y = ROWY[i];
        rows.appendChild(el('circle', { cx: 56, cy: y - 4, r: 3.5, fill: col }));
        rows.appendChild(el('text', { x: 66, y: y, fill: '#CFD8DC' }, name));
        rows.appendChild(el('text', { id: 'f2Lv' + i, x: 346, y: y, 'text-anchor': 'end', fill: col, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, '—'));
        rows.appendChild(el('text', { id: 'f2Pk' + i, x: 452, y: y, 'text-anchor': 'end', fill: '#6b7780', 'font-size': 11 }, '—'));
        rows.appendChild(el('text', { id: 'f2Rn' + i, x: 550, y: y, 'text-anchor': 'end', fill: '#6b7780', 'font-size': 11 }, '—'));
      }
      SG.forEach(function (g, i) { addRow(i, g.name, g.col); });
      TC.forEach(function (t, i) { addRow(4 + i, t.name, t.col); });

      /* ── specimen state machine ──
         phase: 'run'  — cycling; fail-specimens grow SG2 amplitude toward fracture
                'hold' — fracture (red) or runout (green) result shown, actuator idle
                'load' — next specimen mounting, traces flat
         Specimens alternate fail / pass so both story beats appear. */
      var specNo = 0, specIdx = 2;      // A3 first
      var phase, phaseT0, outcome, cFail, cyc = 0, cycFrozen = 0, runStart0 = 0;
      var amp = SG.map(function (g) { return g.amp; });    // current amplitudes
      var mean = SG.map(function (g) { return g.mean; });
      var tcv = [52, 23];                                   // TC1 / TC2 current values
      function specName() { return 'Suspension Arm A' + (specIdx + 1); }
      function startSpec(e, preFrac) {
        specNo++; specIdx++;
        outcome = (specNo % 2 === 1) ? 'fail' : 'pass';
        cFail = outcome === 'fail' ? TARGET * (0.36 + 0.28 * Math.random()) : Infinity;
        // preFrac lets the very first specimen start partway through its life
        runStart0 = e - (preFrac ? preFrac * cFail / RATE * 1000 : 0);
        phase = 'run'; phaseT0 = e;
        q('f2Spec').textContent = specName();
      }

      function frac(e) { return outcome === 'fail' ? clamp(((e - runStart0) / 1000 * RATE) / cFail, 0, 1) : 0; }

      function stepState(e) {
        if (phase === 'run') {
          cyc = (e - runStart0) / 1000 * RATE;
          if (outcome === 'fail' && cyc >= cFail) { cycFrozen = cFail; phase = 'hold'; phaseT0 = e; }
          else if (cyc >= TARGET) { cycFrozen = TARGET; outcome = 'pass'; phase = 'hold'; phaseT0 = e; }
        } else if (phase === 'hold') {
          if (e - phaseT0 >= HOLD_MS) { phase = 'load'; phaseT0 = e; }
        } else if (phase === 'load') {
          if (e - phaseT0 >= LOAD_MS) startSpec(e);
        }
      }

      function stepPlant(e, dt) {
        var f = phase === 'run' ? frac(e) : 0;
        SG.forEach(function (g, i) {
          var aT, mT;
          if (phase === 'run') {
            aT = g.amp; mT = g.mean;
            if (i === 1 && outcome === 'fail') { aT = g.amp * (1 + 0.85 * f * f * f); mT = g.mean - 140 * f * f * f; }
          } else if (phase === 'hold' && outcome === 'fail' && e - phaseT0 < SPIKE_MS) {
            aT = i === 1 ? 1600 : g.amp * 0.5; mT = i === 1 ? -240 : g.mean;
          } else {
            aT = 0; mT = (i === 1 && phase === 'hold' && outcome === 'fail') ? -240 : g.mean * 0.4;
          }
          amp[i] += (aT - amp[i]) * Math.min(1, dt / (phase === 'run' ? 600 : 300));
          mean[i] += (mT - mean[i]) * Math.min(1, dt / 500);
        });
        var t1T = phase === 'run' ? 46 + 16 * (0.4 + 0.6 * f) : 27;
        tcv[0] += (t1T - tcv[0]) * Math.min(1, dt / 3200);
        tcv[1] = 23 + 1.2 * Math.sin(e / 12000);
      }

      function sample(e) {
        SG.forEach(function (g, i) {
          var v = mean[i] + amp[i] * Math.sin(e * OMEGA + i * 1.1) + (Math.random() - 0.5) * 14;
          g.buf.push(v); if (g.buf.length > NPTS) g.buf.shift();
        });
      }

      function drawTraces() {
        SG.forEach(function (g, i) {
          var n = g.buf.length, d = '';
          for (var k = 0; k < n; k++) {
            var x = SX0 + (k / (NPTS - 1)) * (SX1 - SX0);
            var y = PBOT - (clamp(g.buf[k], SMIN, SMAX) - SMIN) / (SMAX - SMIN) * (PBOT - PTOP);
            d += (k ? ' L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
          }
          q('f2Tr' + i).setAttribute('d', d);
        });
      }

      // numeric readouts at UI_MS cadence: live value + windowed peak / range
      function drawReadouts(e) {
        SG.forEach(function (g, i) {
          var n = g.buf.length, mn = g.buf[0], mx = g.buf[0];
          for (var k = 1; k < n; k++) { var v = g.buf[k]; if (v < mn) mn = v; if (v > mx) mx = v; }
          q('f2Lv' + i).textContent = sgn(g.buf[n - 1]) + ' µε';
          q('f2Pk' + i).textContent = sgn(Math.abs(mn) > mx ? mn : mx);
          q('f2Rn' + i).textContent = grp(mx - mn);
        });
        TC.forEach(function (t, i) {
          var v = tcv[i] + (Math.random() - 0.5) * 0.2;
          q('f2Lv' + (4 + i)).textContent = v.toFixed(t.dec) + ' °C';
          q('f2Pk' + (4 + i)).textContent = (tcv[i] + 0.4).toFixed(t.dec);
          q('f2Rn' + (4 + i)).textContent = (0.6 + 0.3 * Math.abs(Math.sin(e / 5000))).toFixed(t.dec);
        });
        // cycles + progress
        var c = phase === 'run' ? cyc : cycFrozen;
        q('f2Cycles').textContent = grp(c);
        var fr = clamp(c / TARGET, 0, 1);
        if (phase === 'hold' && outcome === 'fail') {
          q('f2CycTgt').textContent = '· FAILED AT ' + Math.round(fr * 100) + '%';
          q('f2CycTgt').setAttribute('fill', C.redtx);
        } else if (phase === 'hold') {
          q('f2CycTgt').textContent = '/ 2 000 000 · RUNOUT';
          q('f2CycTgt').setAttribute('fill', C.green);
        } else {
          q('f2CycTgt').textContent = '/ 2 000 000 · ' + Math.round(fr * 100) + '%';
          q('f2CycTgt').setAttribute('fill', C.mut);
        }
        q('f2Prog').setAttribute('width', (380 * fr).toFixed(1));
        q('f2Prog').setAttribute('fill', phase === 'hold' ? (outcome === 'fail' ? C.red : C.green) : '#607D8B');
        var secs = 18 * 3600 + 42 * 60 + 6 + e / 1000, p2 = function (n) { return (n < 10 ? '0' : '') + n; };
        var h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60);
        q('f2Elapsed').textContent = 'ELAPSED ' + p2(h) + ':' + p2(m) + ':' + p2(s) + ' · SPECIMEN ' + tcv[0].toFixed(1) + '°C';
      }

      // banner
      var bnKey = '';
      function setBanner(key) {
        if (key === bnKey) return; bnKey = key;
        var b = q('f2Banner'), s = q('f2State'), r = q('f2Rec'), l = q('f2Load'), hi = q('f2RowHi');
        hi.setAttribute('opacity', '0');
        if (key === 'run') {
          b.setAttribute('fill', 'rgba(121,197,166,0.10)'); b.setAttribute('stroke', C.green);
          s.textContent = 'RUNNING'; s.setAttribute('fill', C.green);
          r.setAttribute('fill', C.red);
          l.textContent = '±18.2 kN @ 12.0 Hz';
        } else if (key === 'warn') {
          b.setAttribute('fill', 'rgba(216,166,87,0.10)'); b.setAttribute('stroke', C.amber);
          s.textContent = 'AMPLITUDE DRIFT · SG2'; s.setAttribute('fill', C.amber);
          r.setAttribute('fill', C.amber);
          l.textContent = '±18.2 kN @ 12.0 Hz';
          hi.setAttribute('y', ROWY[1] - 12); hi.setAttribute('opacity', '1');
        } else if (key === 'fail') {
          b.setAttribute('fill', 'rgba(176,122,122,0.12)'); b.setAttribute('stroke', C.red);
          s.textContent = 'SPECIMEN FRACTURE'; s.setAttribute('fill', C.redtx);
          r.setAttribute('fill', C.red); r.setAttribute('opacity', '1');
          l.textContent = 'LOAD REMOVED';
          hi.setAttribute('y', ROWY[1] - 12); hi.setAttribute('opacity', '1');
          hi.setAttribute('fill', 'rgba(176,122,122,0.14)');
        } else if (key === 'pass') {
          b.setAttribute('fill', 'rgba(121,197,166,0.12)'); b.setAttribute('stroke', C.green);
          s.textContent = 'RUNOUT · TEST PASSED'; s.setAttribute('fill', C.green);
          r.setAttribute('fill', C.green); r.setAttribute('opacity', '1');
          l.textContent = 'ACTUATOR IDLE';
        } else if (key === 'load') {
          b.setAttribute('fill', 'rgba(126,166,214,0.10)'); b.setAttribute('stroke', C.blue);
          s.textContent = 'MOUNTING SPECIMEN A' + (specIdx + 2); s.setAttribute('fill', C.blue);
          r.setAttribute('fill', C.blue); r.setAttribute('opacity', '1');
          l.textContent = 'ACTUATOR IDLE';
        } else { // stop
          b.setAttribute('fill', 'rgba(96,125,139,0.08)'); b.setAttribute('stroke', C.gmut);
          s.textContent = 'HOLD'; s.setAttribute('fill', C.gmut);
          r.setAttribute('fill', C.gmut); r.setAttribute('opacity', '1');
          l.textContent = 'ACTUATOR IDLE';
        }
        if (key === 'warn' || key === 'run') hi.setAttribute('fill', 'rgba(216,166,87,0.12)');
      }

      var uiAt = 0;
      function render(e, dt) {
        stepState(e);
        stepPlant(e, dt);
        sample(e);
        drawTraces();
        var key = phase === 'run' ? (outcome === 'fail' && frac(e) > WARN_FRAC ? 'warn' : 'run')
                : phase === 'hold' ? (outcome === 'fail' ? 'fail' : 'pass')
                : 'load';
        setBanner(key);
        if (e >= uiAt) { drawReadouts(e); uiAt = e + UI_MS; }
        if (key === 'run' || key === 'warn') q('f2Rec').setAttribute('opacity', (0.45 + 0.55 * Math.abs(Math.sin(e / 520))).toFixed(2));
      }

      // ── stop / re-arm ──
      var stopped = false;
      function abort() {
        if (stopped) return; stopped = true;
        setBanner('stop'); setStopBtn(false);
        __rearmT = setTimeout(rearm, 2600);
      }
      function rearm() {
        if (__torn) return;
        stopped = false; t0 = null; uiAt = 0; bnKey = '';
        // resume by mounting a fresh specimen
        specNo--; specIdx--;            // startSpec will re-advance
        phase = 'load'; phaseT0 = 0;
        setStopBtn(true); startLoop();
      }
      function setStopBtn(on) {
        var col = on ? C.red : C.queue, g = q('f2Stop');
        q('f2StopBox').setAttribute('stroke', col); q('f2StopBox').setAttribute('opacity', on ? '1' : '0.5');
        q('f2StopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        q('f2StopTxt').setAttribute('fill', col); q('f2StopIcon').setAttribute('fill', col);
        g.style.pointerEvents = on ? 'auto' : 'none'; g.style.cursor = on ? 'pointer' : 'default';
      }
      q('f2Stop').addEventListener('click', abort);
      setStopBtn(true);

      // first specimen starts partway through its life so the first beat lands early
      startSpec(0, 0.55);
      // pre-fill scope buffers
      (function () { for (var k = NPTS - 1; k >= 0; k--) { var e = -k * 16; stepPlant(e, 16); sample(e); } })();

      if (reduce) { render(0, 16); drawReadouts(0); return function () { __torn = true; stage.innerHTML = ''; }; }

      var t0 = null, last = null, ticking = false;
      function frame(ts) {
        if (__torn || stopped) { ticking = false; return; }
        if (t0 === null) { t0 = ts; last = ts; }
        var dt = clamp(ts - last, 0, 50); last = ts;
        render(ts - t0, dt);
        __raf = requestAnimationFrame(frame);
      }
      function startLoop() { if (ticking || stopped || __torn) return; ticking = true; t0 = null; __raf = requestAnimationFrame(frame); }
      startLoop();

      return function teardown() {
        __torn = true;
        if (__raf) cancelAnimationFrame(__raf);
        if (__rearmT) clearTimeout(__rearmT);
        stage.innerHTML = '';
      };
    }
  });
})();
