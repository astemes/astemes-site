/* Astemes "PID Control" — animated hero instrument panel (closed-loop control variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A PID controller regulates a first-order-plus-lag thermal
   process toward a setpoint. The scope shows setpoint (blue) vs process variable (green) scrolling
   in real time; the controller steps the setpoint periodically and a load disturbance is injected
   that the loop rejects. P / I / D term contributions are shown as live bars, with the controller
   output, error and tuning gains. A genuine discrete PID + plant integration runs each frame, and
   OVERSHOOT / SETTLING are measured per setpoint step (peak excursion past the new setpoint
   relative to the step size; time until the PV stays inside the settling band for 0.5 s) — they
   reset to em-dash on each step until re-measured. Element lookups are scoped to the mounted
   panel so multiple instances can coexist (see animations/harness.html). */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', red:'#B07A7A', redtx:'#D69191' };

  // plot geometry
  var GX0 = 60, GX1 = 540, GTOP = 200, GBOT = 350, NPTS = 240;
  var PVMIN = 0, PVMAX = 120;     // °C display range
  // PID gains + plant
  var KP = 2.6, KI = 0.9, KD = 0.55, DT = 0.05;   // sim seconds per step
  var TAU = 1.7, GAIN = 1.15;                      // plant: lag, dc gain
  var SETPOINTS = [70, 95, 45, 80];
  var SP_PERIOD = 5.2;            // sim seconds between setpoint steps
  var DIST_AT = 3.4, DIST_MAG = -22;   // disturbance timing within a segment + magnitude
  var SETTLE_HOLD = 0.5;          // s the PV must stay in band to count as settled

  function py(v) { return GBOT - (clamp(v, PVMIN, PVMAX) - PVMIN) / (PVMAX - PVMIN) * (GBOT - GTOP); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  var SVG =
  `<svg viewBox="0 0 600 560" role="img"
        aria-label="A PID closed-loop control system: a scope shows the setpoint and the process variable tracking it in real time as the setpoint steps and a load disturbance is rejected, with live proportional, integral and derivative term contributions, controller output, error, tuning gains and measured overshoot and settling time."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">PID CONTROL LOOP</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">PROCESS</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">Thermal loop &#183; Zone 1</text>
      <text x="232" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CONTROLLER</text>
      <text x="232" y="100" fill="#CFD8DC" font-size="13">PID &#183; 20 Hz</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">MODE</text>
      <text x="560" y="100" text-anchor="end" fill="#79C5A6" font-size="13">AUTO</text>

      <!-- status banner -->
      <rect id="p2Banner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(126,166,214,0.10)" stroke="#7EA6D6" stroke-width="1.5"/>
      <circle id="p2Dot" cx="54" cy="147" r="7" fill="#7EA6D6"/>
      <text id="p2State" x="80" y="156" fill="#7EA6D6" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">TRACKING</text>
      <text id="p2Sub1" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">SETPOINT 70.0 &#176;C</text>
      <text id="p2Sub2" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">PV 70.0 &#176;C &#183; err +0.0</text>

      <!-- response scope -->
      <text x="40" y="190" fill="#9E9E9E" font-size="9" letter-spacing="1.5">RESPONSE</text>
      <g font-size="9">
        <line x1="430" y1="186" x2="446" y2="186" stroke="#7EA6D6" stroke-width="2"/>
        <text x="450" y="189" fill="#8a98a3">SP</text>
        <line x1="478" y1="186" x2="494" y2="186" stroke="#79C5A6" stroke-width="2"/>
        <text x="498" y="189" fill="#8a98a3">PV</text>
      </g>
      <rect x="52" y="196" width="496" height="158" rx="4" fill="#0d1417" stroke="#34424b"/>
      <g id="p2Grid"></g>
      <text x="${GX0 - 6}" y="${py(100) + 3}" text-anchor="end" fill="#54636b" font-size="8">100</text>
      <text x="${GX0 - 6}" y="${py(50) + 3}" text-anchor="end" fill="#54636b" font-size="8">50</text>
      <text x="${GX0 - 6}" y="${py(0) + 3}" text-anchor="end" fill="#54636b" font-size="8">0&#176;</text>
      <path id="p2SP" fill="none" stroke="#7EA6D6" stroke-width="1.5" stroke-opacity="0.8" d=""/>
      <path id="p2PV" fill="none" stroke="#79C5A6" stroke-width="2" stroke-linejoin="round" d=""/>
      <g id="p2Dist" opacity="0">
        <line x1="400" y1="200" x2="400" y2="350" stroke="#B07A7A" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="404" y="212" fill="#D69191" font-size="8.5">LOAD STEP</text>
      </g>
      <circle id="p2Head" r="3.5" fill="#79C5A6" stroke="#0d1417" stroke-width="1"/>

      <!-- PID term bars -->
      <text x="40" y="380" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CONTROLLER TERMS</text>
      <g id="p2Terms"></g>

      <!-- output + readouts -->
      <text x="404" y="378" fill="#9E9E9E" font-size="9" letter-spacing="1.2">OUTPUT</text>
      <rect x="404" y="384" width="152" height="12" rx="3" fill="#11181c" stroke="#34424b"/>
      <rect id="p2OutBar" x="405" y="385" width="60" height="10" rx="2" fill="#D8A657"/>
      <text id="p2OutVal" x="404" y="416" fill="#CFD8DC" font-size="17" font-family="'Space Grotesk',sans-serif" font-weight="600">42<tspan font-size="9" font-family="'DM Mono',monospace" fill="#6b7780"> % MV</tspan></text>
      <text id="p2Err" x="556" y="416" text-anchor="end" fill="#79C5A6" font-size="17" font-family="'Space Grotesk',sans-serif" font-weight="600">+0.0</text>
      <text x="556" y="428" text-anchor="end" fill="#6b7780" font-size="8.5">ERROR &#176;C</text>

      <!-- metrics -->
      <g>
        <text x="48"  y="446" fill="#9E9E9E" font-size="9" letter-spacing="1.2">Kp</text>
        <text x="48"  y="464" fill="#CFD8DC" font-size="15" font-family="'Space Grotesk',sans-serif" font-weight="600">2.60</text>
        <text x="130" y="446" fill="#9E9E9E" font-size="9" letter-spacing="1.2">Ki</text>
        <text x="130" y="464" fill="#CFD8DC" font-size="15" font-family="'Space Grotesk',sans-serif" font-weight="600">0.90</text>
        <text x="212" y="446" fill="#9E9E9E" font-size="9" letter-spacing="1.2">Kd</text>
        <text x="212" y="464" fill="#CFD8DC" font-size="15" font-family="'Space Grotesk',sans-serif" font-weight="600">0.55</text>
        <text x="300" y="446" fill="#9E9E9E" font-size="9" letter-spacing="1.2">OVERSHOOT</text>
        <text id="p2OS" x="300" y="464" fill="#CFD8DC" font-size="15" font-family="'Space Grotesk',sans-serif" font-weight="600">&#8212;</text>
        <text x="430" y="446" fill="#9E9E9E" font-size="9" letter-spacing="1.2">SETTLING</text>
        <text id="p2Ts" x="430" y="464" fill="#CFD8DC" font-size="15" font-family="'Space Grotesk',sans-serif" font-weight="600">&#8212;</text>
      </g>

      <path d="M32 478H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="504" fill="#9E9E9E" font-size="12">AUTO-TUNE: stable &#183; PB 38% &#183; Ti 2.9 s &#183; Td 0.6 s</text>
    </svg>`;

  window.AstemesAnim.register({
    id: 'pid-control', name: 'PID Control', weight: 1, isDefault: false,
    mount: function (stage) {
      stage.innerHTML = SVG;
      var panel = stage.querySelector('svg');
      if (!panel) return;
      var __raf = null, __torn = false;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var q = function (s) { return panel.querySelector('#' + s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var sgn = function (n, d) { return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(d); };

      // grid
      var g = q('p2Grid');
      for (var gy2 = 1; gy2 < 4; gy2++) { var yy = GTOP + gy2 * (GBOT - GTOP) / 4; g.appendChild(el('line', { x1: GX0, y1: yy, x2: GX1, y2: yy, stroke: 'rgba(96,125,139,0.10)', 'stroke-width': 1 })); }
      for (var gx2 = 1; gx2 < 8; gx2++) { var xx = GX0 + gx2 * (GX1 - GX0) / 8; g.appendChild(el('line', { x1: xx, y1: GTOP, x2: xx, y2: GBOT, stroke: 'rgba(96,125,139,0.07)', 'stroke-width': 1 })); }

      // PID term bars (P, I, D) — bipolar around a center baseline
      var termsG = q('p2Terms'), TBX = 120, TBW = 240, TBC = TBX + TBW / 2, TROWS = [{ k: 'P', col: C.amber }, { k: 'I', col: C.blue }, { k: 'D', col: C.mauve }];
      var termEl = [];
      TROWS.forEach(function (r, i) {
        var y = 388 + i * 16;
        termsG.appendChild(el('text', { x: 40, y: y + 9, fill: r.col, 'font-size': 11, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, r.k));
        termsG.appendChild(el('rect', { x: TBX, y: y, width: TBW, height: 11, rx: 2, fill: 'rgba(96,125,139,0.10)' }));
        termsG.appendChild(el('line', { x1: TBC, y1: y - 1, x2: TBC, y2: y + 12, stroke: 'rgba(96,125,139,0.4)', 'stroke-width': 1 }));
        var bar = el('rect', { x: TBC, y: y + 1, width: 0, height: 9, rx: 1.5, fill: r.col });
        termsG.appendChild(bar);
        var val = el('text', { x: TBX + TBW + 8, y: y + 9, fill: r.col, 'font-size': 9.5, 'font-family': "'DM Mono',monospace" }, '0.0');
        termsG.appendChild(val);
        termEl[i] = { bar: bar, val: val };
      });
      var TBSCALE = 2.0;   // px per output-% of a term

      // ── simulation state ──
      var pv = 70, integ = 0, prevErr = 0, mv = 50, sp = SETPOINTS[0], spIdx = 0;
      var pterm = 0, iterm = 0, dterm = 0, distActive = false;
      var spHist = [], pvHist = [];
      for (var h = 0; h < NPTS; h++) { spHist.push(70); pvHist.push(70); }
      var simT = 0, segT = 0;

      /* ── step-response measurement ──
         On each setpoint step: track the peak excursion past the new setpoint, and the time
         until the PV first stays inside the settling band for SETTLE_HOLD seconds.
         Displayed values are the last completed measurement for the current step. */
      var ms = { from: 70, to: 70, t0: 0, dir: 0, peak: 70, inBand: 0, os: null, ts: null };
      function beginStep(from, to) {
        ms.from = from; ms.to = to; ms.t0 = simT; ms.dir = to > from ? 1 : -1;
        ms.peak = pv; ms.inBand = 0; ms.os = null; ms.ts = null;
      }
      function trackStep() {
        if (ms.ts !== null || ms.dir === 0) return;   // measurement complete / no step yet
        if (ms.dir > 0) { if (pv > ms.peak) ms.peak = pv; } else { if (pv < ms.peak) ms.peak = pv; }
        var band = Math.max(0.8, 0.04 * Math.abs(ms.to - ms.from));
        if (Math.abs(pv - ms.to) <= band) {
          ms.inBand += DT;
          if (ms.inBand >= SETTLE_HOLD) {
            ms.ts = simT - ms.t0 - SETTLE_HOLD;
            ms.os = Math.max(0, (ms.peak - ms.to) * ms.dir / Math.abs(ms.to - ms.from) * 100);
          }
        } else ms.inBand = 0;
      }

      function stepSim(dts) {
        // dts: real seconds; advance sim with fixed DT substeps
        var steps = Math.max(1, Math.min(8, Math.round(dts / DT)));
        for (var s = 0; s < steps; s++) {
          segT += DT; simT += DT;
          // setpoint scheduler
          if (segT >= SP_PERIOD) {
            segT -= SP_PERIOD;
            var prev = sp;
            spIdx = (spIdx + 1) % SETPOINTS.length; sp = SETPOINTS[spIdx];
            integ *= 0.4;
            beginStep(prev, sp);
          }
          // disturbance within segment
          var dist = 0;
          distActive = (segT > DIST_AT && segT < DIST_AT + 1.4);
          if (distActive) dist = DIST_MAG;

          var err = sp - pv;
          pterm = KP * err;
          integ += err * DT;
          integ = clamp(integ, -120 / Math.max(KI, 0.01), 120 / Math.max(KI, 0.01));   // anti-windup
          iterm = KI * integ;
          var deriv = (err - prevErr) / DT; prevErr = err;
          dterm = KD * deriv;
          var u = pterm + iterm + dterm;
          // map controller output to 0..100% manipulated variable
          mv = clamp(50 + u, 0, 100);
          // plant: first-order lag driven by MV, plus disturbance, toward an equilibrium
          var drive = (mv - 50) * GAIN;          // heating power around bias
          var equ = 50 + drive + dist;            // quasi-static target
          pv += (equ - pv) * (DT / TAU);
          pv += (Math.random() - 0.5) * 0.18;     // sensor noise
          trackStep();
        }
        // push history (one display sample per real frame)
        spHist.push(sp); spHist.shift();
        pvHist.push(pv); pvHist.shift();
      }

      function path(arr) {
        var d = '';
        for (var i = 0; i < arr.length; i++) { var x = GX0 + (i / (NPTS - 1)) * (GX1 - GX0); d += (i ? 'L' : 'M') + x.toFixed(1) + ',' + py(arr[i]).toFixed(1); }
        return d;
      }

      function render(dts, e) {
        stepSim(dts);
        q('p2SP').setAttribute('d', path(spHist));
        q('p2PV').setAttribute('d', path(pvHist));
        q('p2Head').setAttribute('cx', GX1); q('p2Head').setAttribute('cy', py(pvHist[NPTS - 1]).toFixed(1));

        // term bars
        var terms = [pterm, iterm, dterm];
        for (var i = 0; i < 3; i++) {
          var t = terms[i], w = clamp(Math.abs(t) * TBSCALE, 0, 120);
          termEl[i].bar.setAttribute('x', t >= 0 ? TBC : (TBC - w).toFixed(1));
          termEl[i].bar.setAttribute('width', w.toFixed(1));
          termEl[i].val.textContent = sgn(t, 1);
        }

        // output bar + readouts
        q('p2OutBar').setAttribute('width', (mv / 100 * 150).toFixed(1));
        q('p2OutBar').setAttribute('fill', mv > 92 || mv < 8 ? C.redtx : C.amber);
        q('p2OutVal').innerHTML = Math.round(mv) + '<tspan font-size="9" font-family="\'DM Mono\',monospace" fill="#6b7780"> % MV</tspan>';
        var err = sp - pv;
        q('p2Err').textContent = sgn(err, 1);
        q('p2Err').setAttribute('fill', Math.abs(err) < 1.5 ? C.green : Math.abs(err) < 6 ? C.amber : C.redtx);

        // disturbance marker
        q('p2Dist').setAttribute('opacity', distActive ? '1' : '0');

        // banner
        var settled = Math.abs(err) < 1.2;
        var col = distActive ? C.amber : settled ? C.green : C.blue;
        var bg = distActive ? 'rgba(216,166,87,0.10)' : settled ? 'rgba(121,197,166,0.10)' : 'rgba(126,166,214,0.10)';
        q('p2Banner').setAttribute('stroke', col); q('p2Banner').setAttribute('fill', bg);
        q('p2State').textContent = distActive ? 'REJECTING DISTURBANCE' : settled ? 'AT SETPOINT' : 'TRACKING';
        q('p2State').setAttribute('fill', col);
        q('p2Dot').setAttribute('fill', col); q('p2Dot').setAttribute('opacity', (0.5 + 0.5 * Math.abs(Math.sin(e / 240))).toFixed(2));
        q('p2Sub1').textContent = 'SETPOINT ' + sp.toFixed(1) + ' °C';
        q('p2Sub2').textContent = 'PV ' + pv.toFixed(1) + ' °C · err ' + sgn(err, 1);

        // measured overshoot + settling for the current step
        q('p2OS').textContent = ms.os === null ? '—' : (ms.os < 0.5 ? '<1 %' : ms.os.toFixed(0) + ' %');
        q('p2Ts').textContent = ms.ts === null ? '—' : ms.ts.toFixed(1) + ' s';
      }

      if (reduce) { for (var w = 0; w < 60; w++) stepSim(DT * 4); render(0.05, 0); return function () { __torn = true; stage.innerHTML = ''; }; }

      var t0 = null, last = 0, ticking = false;
      function frame(ts) {
        if (__torn) { ticking = false; return; }
        if (t0 === null) { t0 = ts; last = ts; }
        var dts = clamp((ts - last) / 1000, 0, 0.1); last = ts;
        render(dts, ts - t0);
        __raf = requestAnimationFrame(frame);
      }
      ticking = true;
      __raf = requestAnimationFrame(frame);

      return function teardown() {
        __torn = true;
        if (__raf) cancelAnimationFrame(__raf);
        stage.innerHTML = '';
      };
    }
  });
})();
