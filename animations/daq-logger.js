/* Astemes "Data Logger" — animated hero instrument panel (thermal-cycling DAQ variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A bench DAQ logs a thermal-cycling experiment: the five
   sensor channels are physically coupled to a RAMP / SOAK / COOL profile (a profile strip shows
   the current phase and a cycle counter advances). Once per soak the coolant flow dips below its
   low limit — the banner raises a FLOW WARNING and the offending table row highlights until the
   loop recovers. Numeric readouts refresh at 5 Hz for readability, and MIN / MAX are computed
   over the visible chart window so they keep moving. Element lookups are scoped to the mounted
   panel, so multiple instances can coexist (see animations/harness.html). */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', steel:'#B8C2C9',
            light:'#CFD8DC', dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A', redtx:'#D69191' };

  // chart geometry
  var SX0 = 52, SX1 = 548, PTOP = 206, PBOT = 334, NPTS = 176;
  // thermal profile (ms of sped-up time)
  var RAMP = 6000, SOAK = 7000, COOL = 5000, CYCLE = RAMP + SOAK + COOL;
  var EOFF = RAMP;                              // start mid-story: soak begins at t = 0
  var EV_AT = RAMP + 2600, EV_LEN = 2200;       // coolant-flow dip within each soak
  var FLOW_LO = 8.0, FLOW_OK = 8.8;             // warn threshold + hysteresis release
  var UI_MS = 200;                              // numeric readout refresh period
  var CYC0 = 12, CYCN = 24;                     // cycle counter start / total

  // channels: display range [rmin,rmax], decimals, sample noise
  var CH = [
    { name: 'Inlet Temp',    unit: '°C',   col: C.amber, rmin: 20,    rmax: 95,    dec: 1, noise: 0.5   },
    { name: 'Outlet Temp',   unit: '°C',   col: C.green, rmin: 20,    rmax: 80,    dec: 1, noise: 0.4   },
    { name: 'Chamber Press', unit: 'kPa',       col: C.blue,  rmin: 92,    rmax: 110,   dec: 1, noise: 0.3   },
    { name: 'Coolant Flow',  unit: 'L/min',     col: C.mauve, rmin: 5,     rmax: 17,    dec: 2, noise: 0.12  },
    { name: 'Supply Rail',   unit: 'V',         col: C.steel, rmin: 23.88, rmax: 24.12, dec: 3, noise: 0.012 }
  ];
  var ROWY = [388, 406, 424, 442, 460];
  var PHASES = [
    { name: 'RAMP', dur: RAMP, col: C.amber },
    { name: 'SOAK', dur: SOAK, col: C.green },
    { name: 'COOL', dur: COOL, col: C.blue  }
  ];

  var SVG =
  `<svg viewBox="0 0 600 560" role="img"
        aria-label="A bench-top data logger running a thermal-cycling profile: five coupled sensor channels stream onto a strip chart while a profile strip tracks the ramp, soak and cool phases and a cycle counter advances. During each soak the coolant flow briefly dips below its low limit, raising a flow warning that the loop then recovers from."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <!-- panel -->
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">DATA LOGGER</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- header info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">EXPERIMENT</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">Thermal Cycle R14</text>
      <text x="262" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">DEVICE</text>
      <text x="262" y="100" fill="#CFD8DC" font-size="13">AS544</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CYCLE</text>
      <text id="d2Cycle" x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">12 / 24</text>

      <!-- status banner -->
      <rect id="d2Banner" x="32" y="118" width="536" height="48" rx="8" fill="rgba(121,197,166,0.10)" stroke="#79C5A6" stroke-width="1.5"/>
      <circle id="d2Rec" cx="54" cy="142" r="8" fill="#B07A7A"/>
      <text id="d2State" x="78" y="150" fill="#79C5A6" font-size="20" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">ACQUIRING</text>
      <text x="552" y="136" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">5 SENSORS &#183; 50 S/s &#183; PROFILE</text>
      <text id="d2Elapsed" x="552" y="154" text-anchor="end" fill="#CFD8DC" font-size="13">ELAPSED 02:41:07</text>

      <!-- profile strip -->
      <text x="40" y="187" fill="#9E9E9E" font-size="9" letter-spacing="1.5">PROFILE</text>
      <g id="d2Prof"></g>
      <text id="d2Phase" x="560" y="187" text-anchor="end" fill="#79C5A6" font-size="11" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">SOAK</text>

      <!-- strip chart -->
      <rect x="44" y="200" width="512" height="142" rx="4" fill="#0d1417" stroke="#34424b"/>
      <g id="d2Grid" stroke="rgba(96,125,139,0.12)" stroke-width="1"></g>
      <g id="d2Traces"></g>

      <!-- channel table -->
      <text x="66"  y="366" fill="#9E9E9E" font-size="9" letter-spacing="1.2">SENSOR</text>
      <text x="338" y="366" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">VALUE</text>
      <text x="446" y="366" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">MIN</text>
      <text x="550" y="366" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">MAX</text>
      <path d="M40 372H560" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <rect id="d2RowHi" x="38" y="0" width="524" height="16" rx="3" fill="rgba(216,166,87,0.12)" opacity="0"/>
      <g id="d2Rows" font-size="12"></g>

      <!-- footer -->
      <path d="M32 474H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="494" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SAMPLES ACQUIRED</text>
      <text id="d2Samples" x="40" y="518" fill="#CFD8DC" font-size="19" font-family="'Space Grotesk',sans-serif" font-weight="600">2312850</text>
      <text x="206" y="518" fill="#6b7780" font-size="11">&#183; run_0422.tdms</text>
      <g id="d2Stop">
        <rect id="d2StopBox" x="432" y="498" width="128" height="32" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="d2StopIcon" x="460" y="506" width="14" height="14" rx="2" fill="#B07A7A"/>
        <text id="d2StopTxt" x="482" y="518" fill="#B07A7A" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP LOG</text>
      </g>
    </svg>`;

  window.AstemesAnim.register({
    id: 'daq-logger', name: 'DAQ Logger', weight: 1, isDefault: false,
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

      // grid
      var grid = q('d2Grid');
      for (var gx = 1; gx < 8; gx++) grid.appendChild(el('line', { x1: 52 + gx * 62, y1: PTOP, x2: 52 + gx * 62, y2: PBOT }));
      for (var gy = 1; gy < 4; gy++) grid.appendChild(el('line', { x1: 52, y1: PTOP + gy * 32, x2: SX1, y2: PTOP + gy * 32 }));

      // profile strip segments
      var prof = q('d2Prof'), PX0 = 104, PX1 = 434, PGAP = 3;
      var pw = (PX1 - PX0 - PGAP * (PHASES.length - 1));
      var segs = [], px = PX0;
      PHASES.forEach(function (ph) {
        var w = pw * ph.dur / CYCLE;
        prof.appendChild(el('rect', { x: px, y: 178, width: w, height: 10, rx: 2, fill: 'rgba(96,125,139,0.16)' }));
        var fill = el('rect', { x: px, y: 178, width: 0, height: 10, rx: 2, fill: ph.col, opacity: 0.85 });
        prof.appendChild(fill);
        segs.push({ x: px, w: w, fill: fill, ph: ph });
        px += w + PGAP;
      });

      // traces + in-plot legend + table rows
      var tg = q('d2Traces'), rows = q('d2Rows'), lx = 60;
      CH.forEach(function (ch, i) {
        ch.buf = [];
        tg.appendChild(el('path', { id: 'd2Tr' + i, fill: 'none', stroke: ch.col, 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', d: '', opacity: 0.95 }));
        tg.appendChild(el('circle', { cx: lx, cy: 216, r: 3, fill: ch.col }));
        tg.appendChild(el('text', { x: lx + 8, y: 219, fill: '#9E9E9E', 'font-size': 9 }, ch.name));
        lx += ch.name.length * 5.6 + 26;
        var y = ROWY[i];
        rows.appendChild(el('circle', { cx: 56, cy: y - 4, r: 3.5, fill: ch.col }));
        rows.appendChild(el('text', { x: 66, y: y, fill: '#CFD8DC' }, ch.name));
        rows.appendChild(el('text', { id: 'd2V' + i, x: 338, y: y, 'text-anchor': 'end', fill: ch.col, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, '—'));
        rows.appendChild(el('text', { id: 'd2Mn' + i, x: 446, y: y, 'text-anchor': 'end', fill: '#6b7780', 'font-size': 11 }, '—'));
        rows.appendChild(el('text', { id: 'd2Mx' + i, x: 550, y: y, 'text-anchor': 'end', fill: '#6b7780', 'font-size': 11 }, '—'));
      });

      /* ── coupled plant model ──
         The channels react to one shared thermal profile instead of free-running:
         inlet chases the profile target, outlet lags the inlet, pressure rides on inlet
         temperature, coolant flow steps up for the cool phase (and dips during the soak
         event), and the supply rail just holds 24 V. */
      var st = { inlet: 84, outlet: 64, press: 102.5, flow: 11.5, rail: 24 };
      function ct(e) { return (((e + EOFF) % CYCLE) + CYCLE) % CYCLE; }
      function evActive(e) { var c = ct(e); return c >= EV_AT && c < EV_AT + EV_LEN; }
      function stepPlant(e, dt) {
        var c = ct(e);
        var profT = c < RAMP ? 30 + 55 * (c / RAMP)
                  : c < RAMP + SOAK ? 85
                  : 85 - 55 * ((c - RAMP - SOAK) / COOL);
        st.inlet  += (profT - st.inlet) * Math.min(1, dt / 900);
        st.outlet += ((22 + (st.inlet - 22) * 0.72) - st.outlet) * Math.min(1, dt / 1600);
        st.press  += ((96.5 + (st.inlet - 30) * 0.11) - st.press) * Math.min(1, dt / 700);
        var flowT = evActive(e) ? 6.8 : (c >= RAMP + SOAK ? 14.5 : 11.5);
        st.flow   += (flowT - st.flow) * Math.min(1, dt / 450);
        st.rail    = 24 + 0.04 * Math.sin(e / 3100) + 0.012 * Math.sin(e / 700);
      }
      function sample() {
        var v = [st.inlet, st.outlet, st.press, st.flow, st.rail];
        CH.forEach(function (ch, i) {
          ch.buf.push(v[i] + (Math.random() - 0.5) * ch.noise);
          if (ch.buf.length > NPTS) ch.buf.shift();
        });
      }
      // pre-fill: run the plant for one chart window before first paint
      (function () { for (var k = NPTS - 1; k >= 0; k--) { var e = -k * 16; stepPlant(e, 16); sample(); } })();

      function drawTraces() {
        CH.forEach(function (ch, i) {
          var n = ch.buf.length, d = '';
          for (var k = 0; k < n; k++) {
            var x = SX0 + (k / (NPTS - 1)) * (SX1 - SX0);
            var y = PBOT - (clamp(ch.buf[k], ch.rmin, ch.rmax) - ch.rmin) / (ch.rmax - ch.rmin) * (PBOT - PTOP);
            d += (k ? ' L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
          }
          q('d2Tr' + i).setAttribute('d', d);
        });
      }

      // numeric readouts at UI_MS cadence: live value + windowed min/max
      var warn = false;
      function drawReadouts(e) {
        CH.forEach(function (ch, i) {
          var n = ch.buf.length, mn = ch.buf[0], mx = ch.buf[0];
          for (var k = 1; k < n; k++) { var v = ch.buf[k]; if (v < mn) mn = v; if (v > mx) mx = v; }
          var cur = ch.buf[n - 1];
          q('d2V' + i).textContent = cur.toFixed(ch.dec) + ' ' + ch.unit;
          q('d2Mn' + i).textContent = mn.toFixed(ch.dec);
          q('d2Mx' + i).textContent = mx.toFixed(ch.dec);
        });
        q('d2V3').setAttribute('fill', warn ? C.redtx : C.mauve);
        var secs = 2 * 3600 + 41 * 60 + 7 + e / 1000, p2 = function (n) { return (n < 10 ? '0' : '') + n; };
        var h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60);
        q('d2Elapsed').textContent = 'ELAPSED ' + p2(h) + ':' + p2(m) + ':' + p2(s);
        q('d2Samples').textContent = grp(2312850 + (e / 1000) * 250);
        var cyc = (CYC0 - 1 + Math.floor((e + EOFF) / CYCLE)) % CYCN + 1;
        q('d2Cycle').textContent = cyc + ' / ' + CYCN;
      }

      function drawProfile(e) {
        var c = ct(e), acc = 0, active = null;
        segs.forEach(function (s) {
          var f = clamp((c - acc) / s.ph.dur, 0, 1);
          s.fill.setAttribute('width', (s.w * f).toFixed(1));
          s.fill.setAttribute('opacity', f >= 1 ? '0.35' : '0.85');
          if (f > 0 && f < 1) active = s.ph;
          acc += s.ph.dur;
        });
        if (active) { q('d2Phase').textContent = active.name; q('d2Phase').setAttribute('fill', active.col); }
      }

      // banner: acquiring / flow warning / stopped
      var bnKey = '';
      function setBanner(key) {
        if (key === bnKey) return; bnKey = key;
        var b = q('d2Banner'), s = q('d2State'), r = q('d2Rec');
        if (key === 'warn') {
          b.setAttribute('fill', 'rgba(216,166,87,0.10)'); b.setAttribute('stroke', C.amber);
          s.textContent = 'FLOW WARNING'; s.setAttribute('fill', C.amber);
          r.setAttribute('fill', C.amber);
          q('d2RowHi').setAttribute('y', ROWY[3] - 12); q('d2RowHi').setAttribute('opacity', '1');
        } else if (key === 'stop') {
          b.setAttribute('fill', 'rgba(96,125,139,0.08)'); b.setAttribute('stroke', C.gmut);
          s.textContent = 'STOPPED'; s.setAttribute('fill', C.gmut);
          r.setAttribute('fill', C.gmut); r.setAttribute('opacity', '1');
          q('d2RowHi').setAttribute('opacity', '0');
        } else {
          b.setAttribute('fill', 'rgba(121,197,166,0.10)'); b.setAttribute('stroke', C.green);
          s.textContent = 'ACQUIRING'; s.setAttribute('fill', C.green);
          r.setAttribute('fill', C.red);
          q('d2RowHi').setAttribute('opacity', '0');
        }
      }

      var uiAt = 0;
      function render(e, dt) {
        stepPlant(e, dt);
        sample();
        drawTraces();
        drawProfile(e);
        // flow-warning hysteresis on the smoothed value
        if (!warn && st.flow < FLOW_LO) warn = true;
        else if (warn && st.flow > FLOW_OK) warn = false;
        setBanner(warn ? 'warn' : 'run');
        if (e >= uiAt) { drawReadouts(e); uiAt = e + UI_MS; }
        q('d2Rec').setAttribute('opacity', (0.45 + 0.55 * Math.abs(Math.sin(e / 520))).toFixed(2));
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
        setBanner(warn ? 'warn' : 'run'); setStopBtn(true); startLoop();
      }
      function setStopBtn(on) {
        var col = on ? C.red : C.queue, g = q('d2Stop');
        q('d2StopBox').setAttribute('stroke', col); q('d2StopBox').setAttribute('opacity', on ? '1' : '0.5');
        q('d2StopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        q('d2StopTxt').setAttribute('fill', col); q('d2StopIcon').setAttribute('fill', col);
        g.style.pointerEvents = on ? 'auto' : 'none'; g.style.cursor = on ? 'pointer' : 'default';
      }
      q('d2Stop').addEventListener('click', abort);
      setStopBtn(true);

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
