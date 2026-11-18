/* Astemes "Product Life Cycle" — instrument panel in the same chrome, palette and
   AstemesAnim.register() contract as the website's hero animations.
   One product travels prototype → development → production → field. Each stage lights up
   with the test that belongs there (design verification, characterisation, end-of-line,
   field monitoring) while the shared test assets underneath stay the same. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#B49AC9', light:'#CFD8DC',
            mut:'#6b7780', gmut:'#9E9E9E', track:'#3a4750', red:'#B07A7A', redtx:'#D69191' };

  var STG = 4500, NST = 4, CYCLE = STG * NST;
  var STAGES = [
    { name: 'PROTOTYPE',   act: 'DESIGN VERIFICATION' },
    { name: 'DEVELOPMENT', act: 'CHARACTERISATION' },
    { name: 'PRODUCTION',  act: 'END-OF-LINE TEST' },
    { name: 'IN THE FIELD', act: 'CONDITION MONITORING' }
  ];
  var NX = [96, 232, 368, 504], NY = 206;
  var ASSETS = ['HAL drivers', 'Test sequences', 'Limits & specs', 'Result data'];
  var AX = [40, 168, 312, 446], AW = [116, 132, 122, 114];

  var SVG =
  `<svg id="lcPanel" viewBox="0 0 600 560" role="img"
        aria-label="A product moving through its life cycle — prototype, development, production and field — with the matching automated test running at each stage, built on the same shared drivers, sequences, limits and result data."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">PRODUCT LIFE CYCLE</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">PRODUCT</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">Servo Actuator SA-300</text>
      <text x="300" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">REVISION</text>
      <text id="lcRev" x="300" y="100" fill="#CFD8DC" font-size="13">P1</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">UNITS TESTED</text>
      <text id="lcUnits" x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">0</text>

      <rect id="lcBanner" x="32" y="116" width="536" height="50" rx="8" fill="rgba(216,166,87,0.10)" stroke="#D8A657" stroke-width="1.5"/>
      <g id="lcSpin"><circle cx="54" cy="141" r="10" fill="none" stroke="#D8A657" stroke-width="3" stroke-linecap="round" stroke-dasharray="46 64"/></g>
      <path id="lcChk" d="M47 141l5 6 11-14" fill="none" stroke="#79C5A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      <text id="lcState" x="78" y="149" fill="#D8A657" font-size="20" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">DESIGN VERIFICATION</text>
      <text id="lcStep" x="552" y="146" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">STAGE 1 / 4</text>

      <line x1="${NX[0]}" y1="${NY}" x2="${NX[3]}" y2="${NY}" stroke="#3a4750" stroke-width="3" stroke-linecap="round"/>
      <line id="lcProg" x1="${NX[0]}" y1="${NY}" x2="${NX[0]}" y2="${NY}" stroke="#79C5A6" stroke-width="3" stroke-linecap="round"/>
      <circle id="lcPulse" cx="${NX[0]}" cy="${NY}" r="5" fill="#D8A657"/>
      <g id="lcNodes"></g>

      <rect x="32" y="248" width="536" height="196" rx="10" fill="rgba(33,33,33,0.45)" stroke="#3a4750"/>
      <g id="lcViews"></g>

      <text x="40" y="468" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SHARED TEST ASSETS · REUSED IN EVERY STAGE</text>
      <g id="lcAssets"></g>
    </svg>`;

  window.AstemesAnim.register({
    id: 'product-lifecycle', name: 'Product Life Cycle', weight: 1, isDefault: false,
    mount: function (stage) {
      stage.innerHTML = SVG;
      var raf = null, torn = false;
      var id = function (s) { return stage.querySelector('#' + s); };
      var NS = 'http://www.w3.org/2000/svg';
      function el(tag, a, txt, parent) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; if (parent) parent.appendChild(e); return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };

      /* ── timeline nodes ── */
      var nodes = id('lcNodes'), N = [];
      STAGES.forEach(function (s, i) {
        var x = NX[i];
        N[i] = {
          ring: el('circle', { cx: x, cy: NY, r: 12, fill: '#2b3640', stroke: C.track, 'stroke-width': 2.4 }, null, nodes),
          spin: el('circle', { cx: x, cy: NY, r: 12, fill: 'none', stroke: C.amber, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-dasharray': '26 50', opacity: 0 }, null, nodes),
          dot:  el('circle', { cx: x, cy: NY, r: 4, fill: C.track }, null, nodes),
          chk:  el('path', { d: 'M' + (x - 5.5) + ',' + NY + 'l4,4.5 7.5,-9', fill: 'none', stroke: C.green, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, null, nodes),
          lab:  el('text', { x: x, y: NY + 32, 'text-anchor': 'middle', fill: C.mut, 'font-size': 10, 'letter-spacing': 1.2 }, s.name, nodes)
        };
      });

      /* ── stage views (one group each, cross-faded) ── */
      var views = id('lcViews'), V = [];
      var PX0 = 60, PX1 = 540, PY0 = 290, PY1 = 424;
      function frame(g, title, right) {
        el('text', { x: 48, y: 272, fill: C.gmut, 'font-size': 9.5, 'letter-spacing': 1.5 }, title, g);
        return el('text', { x: 552, y: 272, 'text-anchor': 'end', fill: C.green, 'font-size': 10.5, 'letter-spacing': 1 }, right, g);
      }
      function axes(g) {
        el('path', { d: 'M' + PX0 + ' ' + PY0 + 'V' + PY1 + 'H' + PX1, fill: 'none', stroke: '#455A64', 'stroke-width': 1 }, null, g);
        for (var k = 1; k < 4; k++) el('line', { x1: PX0, x2: PX1, y1: PY0 + k * (PY1 - PY0) / 4, y2: PY0 + k * (PY1 - PY0) / 4, stroke: 'rgba(96,125,139,0.12)' }, null, g);
      }

      // 0 · prototype — step response against a limit envelope
      var g0 = el('g', { opacity: 1 }, null, views); V[0] = g0;
      var r0 = frame(g0, 'STEP RESPONSE · LIMIT MASK', '');
      axes(g0);
      var sy = function (r) { return PY1 - 8 - r * 82; };
      el('path', { d: 'M' + PX0 + ' ' + sy(1.28) + 'H' + PX1 + 'V' + sy(1.05) + 'H' + (PX0 + 260) + 'V' + sy(1.28) + 'Z', fill: 'rgba(176,122,122,0.10)' }, null, g0);
      el('path', { d: 'M' + (PX0 + 260) + ' ' + sy(0.95) + 'H' + PX1 + 'V' + (PY1 - 1) + 'H' + (PX0 + 260) + 'Z', fill: 'rgba(176,122,122,0.10)' }, null, g0);
      el('line', { x1: PX0, x2: PX1, y1: sy(1), y2: sy(1), stroke: C.gmut, 'stroke-dasharray': '4 5', 'stroke-width': 1 }, null, g0);
      var tr0 = el('path', { d: '', fill: 'none', stroke: C.amber, 'stroke-width': 2, 'stroke-linejoin': 'round' }, null, g0);
      var STEPN = 140, stepPts = [];
      for (var i = 0; i < STEPN; i++) { var tt = i / (STEPN - 1) * 1.7; stepPts.push([PX0 + i / (STEPN - 1) * (PX1 - PX0), sy(1 - Math.exp(-3.6 * tt) * Math.cos(8.2 * tt))]); }

      // 1 · development — characterisation over temperature, three samples
      var g1 = el('g', { opacity: 0 }, null, views); V[1] = g1;
      var r1 = frame(g1, 'GAIN ERROR vs TEMPERATURE · −40 … +85 °C', '');
      axes(g1);
      el('line', { x1: PX0, x2: PX1, y1: PY0 + 14, y2: PY0 + 14, stroke: C.red, 'stroke-dasharray': '4 5' }, null, g1);
      el('line', { x1: PX0, x2: PX1, y1: PY1 - 14, y2: PY1 - 14, stroke: C.red, 'stroke-dasharray': '4 5' }, null, g1);
      ['−40', '0', '+25', '+85'].forEach(function (t, k) {
        var T = [-40, 0, 25, 85][k]; el('text', { x: PX0 + (T + 40) / 125 * (PX1 - PX0), y: PY1 + 13, 'text-anchor': 'middle', fill: C.mut, 'font-size': 9 }, t, g1);
      });
      var SAMP = [{ c: C.amber, s: 1 }, { c: C.green, s: -0.6 }, { c: C.blue, s: 0.25 }], NPT = 26, dots = [];
      SAMP.forEach(function (sm, si) {
        for (var k = 0; k < NPT; k++) {
          var T = -40 + k / (NPT - 1) * 125;
          var e = sm.s * 0.0011 * (T - 25) + 0.000016 * (T - 25) * (T - 25) - 0.02 + 0.002 * Math.sin(k * 2.1 + si);
          dots.push({ el: el('circle', { cx: PX0 + k / (NPT - 1) * (PX1 - PX0), cy: (PY0 + PY1) / 2 - e * 600, r: 2.6, fill: sm.c, opacity: 0 }, null, g1), k: k, si: si });
        }
      });

      // 2 · production — units flowing through the end-of-line fixture
      var g2 = el('g', { opacity: 0 }, null, views); V[2] = g2;
      var r2 = frame(g2, 'END-OF-LINE · FIXTURE 1', '');
      el('rect', { x: 44, y: 368, width: 512, height: 8, rx: 4, fill: '#3a4750' }, null, g2);
      for (var k = 0; k < 26; k++) el('line', { x1: 52 + k * 19.6, x2: 52 + k * 19.6, y1: 369, y2: 375, stroke: '#2b3640', 'stroke-width': 2 }, null, g2);
      el('rect', { x: 262, y: 296, width: 76, height: 62, rx: 6, fill: 'rgba(96,125,139,0.10)', stroke: '#607D8B', 'stroke-width': 1.5 }, null, g2);
      el('text', { x: 300, y: 312, 'text-anchor': 'middle', fill: C.gmut, 'font-size': 8.5, 'letter-spacing': 1.2 }, 'TEST', g2);
      var fixLed = el('circle', { cx: 300, cy: 332, r: 6, fill: C.track }, null, g2);
      var probe = el('line', { x1: 300, x2: 300, y1: 340, y2: 352, stroke: C.light, 'stroke-width': 2 }, null, g2);
      var UN = 7, SP = 84, units = [];
      for (var u = 0; u < UN; u++) {
        var ug = el('g', {}, null, g2);
        units.push({ g: ug,
          box: el('rect', { x: -20, y: 340, width: 40, height: 26, rx: 5, fill: '#2b3640', stroke: '#607D8B', 'stroke-width': 1.5 }, null, ug),
          tag: el('text', { x: 0, y: 396, 'text-anchor': 'middle', 'font-size': 9, 'letter-spacing': 1, fill: C.mut }, '', ug),
          sn:  el('text', { x: 0, y: 410, 'text-anchor': 'middle', 'font-size': 8, fill: C.mut }, '', ug) });
      }

      // 3 · field — condition monitoring trend
      var g3 = el('g', { opacity: 0 }, null, views); V[3] = g3;
      var r3 = frame(g3, 'VIBRATION RMS · UNIT SN 25-0412', '');
      axes(g3);
      el('line', { x1: PX0, x2: PX1, y1: PY0 + 22, y2: PY0 + 22, stroke: C.amber, 'stroke-dasharray': '4 5' }, null, g3);
      el('text', { x: PX1 - 4, y: PY0 + 16, 'text-anchor': 'end', fill: C.amber, 'font-size': 8.5, 'letter-spacing': 1 }, 'ALERT', g3);
      var tr3 = el('path', { d: '', fill: 'none', stroke: C.green, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, null, g3);
      var hd3 = el('circle', { r: 3.5, fill: C.green }, null, g3);

      /* ── shared assets row ── */
      var ag = id('lcAssets'), A = [];
      ASSETS.forEach(function (n, i) {
        A.push({
          box: el('rect', { x: AX[i], y: 480, width: AW[i], height: 34, rx: 7, fill: 'rgba(121,197,166,0.06)', stroke: '#3a6b58', 'stroke-width': 1.4 }, null, ag),
          txt: el('text', { x: AX[i] + AW[i] / 2, y: 501, 'text-anchor': 'middle', fill: C.light, 'font-size': 10.5 }, n, ag)
        });
      });

      var REV = ['P1', 'B2', 'C1', 'C1'];
      var lastSt = -1, units0 = 18200;

      function render(t) {
        var c = t % CYCLE, st = Math.floor(c / STG), u = (c % STG) / STG;
        var s = STAGES[st];

        // banner
        var done = u > 0.86;
        id('lcState').textContent = s.act;
        id('lcState').setAttribute('fill', done ? C.green : C.amber);
        id('lcBanner').setAttribute('stroke', done ? C.green : C.amber);
        id('lcBanner').setAttribute('fill', done ? 'rgba(121,197,166,0.10)' : 'rgba(216,166,87,0.10)');
        id('lcSpin').setAttribute('opacity', done ? 0 : 1);
        id('lcSpin').setAttribute('transform', 'rotate(' + (t * 0.36 % 360) + ' 54 141)');
        id('lcChk').setAttribute('opacity', done ? 1 : 0);
        id('lcStep').textContent = 'STAGE ' + (st + 1) + ' / ' + NST;
        id('lcRev').textContent = REV[st];

        // timeline
        var px = NX[st] + (st < 3 ? (NX[st + 1] - NX[st]) * clamp((u - 0.86) / 0.14, 0, 1) : 0);
        id('lcProg').setAttribute('x2', px.toFixed(1));
        id('lcPulse').setAttribute('cx', px.toFixed(1));
        id('lcPulse').setAttribute('opacity', st === 3 && done ? 0 : 1);
        N.forEach(function (n, i) {
          var cur = i === st, past = i < st || (cur && done);
          n.ring.setAttribute('stroke', past ? C.green : cur ? C.amber : C.track);
          n.spin.setAttribute('opacity', cur && !done ? 1 : 0);
          n.spin.setAttribute('transform', 'rotate(' + (t * 0.4 % 360) + ' ' + NX[i] + ' ' + NY + ')');
          n.dot.setAttribute('opacity', past ? 0 : 1);
          n.dot.setAttribute('fill', cur ? C.amber : C.track);
          n.chk.setAttribute('opacity', past ? 1 : 0);
          n.lab.setAttribute('fill', cur ? C.light : past ? '#8fb8a6' : C.mut);
        });

        // view cross-fade
        var fin = clamp(u / 0.08, 0, 1), fout = st === 3 ? clamp((1 - u) / 0.06, 0, 1) : 1;
        V.forEach(function (g, i) { g.setAttribute('opacity', i === st ? Math.min(fin, fout).toFixed(2) : 0); });

        // assets pulse when a stage reuses them
        A.forEach(function (a, i) {
          var hot = clamp(1 - Math.abs(u - (0.18 + i * 0.15)) / 0.08, 0, 1);
          a.box.setAttribute('stroke', hot > 0.05 ? C.green : '#3a6b58');
          a.box.setAttribute('fill', 'rgba(121,197,166,' + (0.06 + hot * 0.16).toFixed(3) + ')');
        });

        // stage-specific
        var p = clamp(u / 0.82, 0, 1);
        if (st === 0) {
          var n0 = Math.max(2, Math.floor(p * STEPN)), d = 'M';
          for (var i = 0; i < n0; i++) d += (i ? 'L' : '') + stepPts[i][0].toFixed(1) + ' ' + stepPts[i][1].toFixed(1);
          tr0.setAttribute('d', d);
          tr0.setAttribute('stroke', done ? C.green : C.amber);
          r0.textContent = done ? 'OVERSHOOT 24 % · SETTLE 46 ms · PASS' : '';
        } else if (st === 1) {
          var shown = Math.floor(p * NPT);
          dots.forEach(function (o) { o.el.setAttribute('opacity', o.k < shown ? 0.95 : 0); });
          r1.textContent = (Math.min(shown, NPT) * 3) + ' POINTS · 3 SAMPLES' + (done ? ' · IN SPEC' : '');
        } else if (st === 2) {
          var off = u * SP * 4.4, inFix = false;
          units.forEach(function (o, k) {
            var pos = (k * SP + off) % (UN * SP), x = 20 + pos;
            var serial = Math.floor((k * SP + off) / (UN * SP)) * UN + k;
            var fail = serial % 11 === 6;
            o.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',0)');
            var tested = x > 318, testing = x > 282 && x <= 318;
            if (testing) inFix = true;
            o.box.setAttribute('stroke', tested ? (fail ? C.red : C.green) : testing ? C.amber : '#607D8B');
            o.box.setAttribute('fill', tested ? (fail ? 'rgba(176,122,122,0.18)' : 'rgba(121,197,166,0.14)') : '#2b3640');
            o.tag.textContent = tested ? (fail ? 'FAIL' : 'PASS') : testing ? 'TEST' : '';
            o.tag.setAttribute('fill', tested ? (fail ? C.redtx : C.green) : C.amber);
            o.sn.textContent = 'SN ' + (412 + serial);
            o.g.setAttribute('opacity', x < 36 ? clamp((x - 20) / 16, 0, 1) : x > 540 ? clamp((560 - x) / 20, 0, 1) : 1);
          });
          fixLed.setAttribute('fill', inFix ? C.amber : C.green);
          probe.setAttribute('y2', inFix ? 358 : 350);
          r2.textContent = 'YIELD 99.1 % · 240 UPH';
        } else {
          var M = 110, d3 = 'M', lastY = 0, lastX = 0, sh = t * 0.012;
          for (var j = 0; j < M; j++) {
            var s2 = j + sh, x3 = PX0 + j / (M - 1) * (PX1 - PX0);
            var v = 0.32 + 0.08 * Math.sin(s2 / 9) + 0.04 * Math.sin(s2 / 2.3) + 0.025 * Math.sin(s2 * 1.7) + 0.0009 * j;
            var y3 = PY1 - v * (PY1 - PY0);
            if (x3 > PX0 + p * (PX1 - PX0) + 1) break;
            d3 += (j ? 'L' : '') + x3.toFixed(1) + ' ' + y3.toFixed(1); lastX = x3; lastY = y3;
          }
          tr3.setAttribute('d', d3);
          hd3.setAttribute('cx', lastX.toFixed(1)); hd3.setAttribute('cy', lastY.toFixed(1));
          r3.textContent = 'HEALTH 96 % · SERVICE IN 214 d';
        }

        // units-tested counter grows mostly during production
        var cnt = units0 + Math.floor(t / CYCLE) * 60 + (st > 2 ? 60 : st === 2 ? Math.floor(u * 60) : 0);
        id('lcUnits').textContent = cnt.toLocaleString('en-US').replace(/,/g, ' ');
        lastSt = st;
      }

      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { render(STG * 2 + STG * 0.6); return function () { stage.innerHTML = ''; }; }
      var t0 = null;
      function loop(ts) { if (torn) return; if (t0 === null) t0 = ts; render(ts - t0); raf = requestAnimationFrame(loop); }
      raf = requestAnimationFrame(loop);
      return function teardown() { torn = true; if (raf) cancelAnimationFrame(raf); stage.innerHTML = ''; };
    }
  });
})();
