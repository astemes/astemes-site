/* Astemes "Test System Stack" — animated architecture panel in the website's hero-animation style.
   Software (TestStand, LabVIEW, Python, CI) talks through a hardware abstraction layer to NI
   hardware and instruments, which connect over real buses to the device under test.
   Commands flow down (amber), measurements flow back up (green). */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', light:'#CFD8DC', mut:'#6b7780', gmut:'#9E9E9E', track:'#3a4750' };
  var SW = [ { n:'TestStand', s:'sequencer' }, { n:'LabVIEW', s:'test app' }, { n:'Python', s:'scripts' }, { n:'Git · CI', s:'build & deploy' } ];
  var HW = [ { n:'PXI', s:'modular' }, { n:'cDAQ', s:'DAQmx' }, { n:'cRIO', s:'RT · FPGA' }, { n:'Instruments', s:'SCPI' } ];
  var BUS = ['Analog I/O', 'Sensors', 'CAN', 'RS-232/485'];
  var BX = [40, 172, 304, 436], BW = 124;
  var cx = function (i) { return BX[i] + BW / 2; };

  var SVG =
  `<svg id="tsPanel" viewBox="0 0 600 560" role="img"
        aria-label="Architecture of an automated test system: TestStand, LabVIEW, Python and CI on the test PC talk through a hardware abstraction layer to PXI, cDAQ, cRIO and SCPI instruments, wired over analog, sensor, CAN and serial buses to the device under test, with commands flowing down and measurements flowing back."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">TEST SYSTEM ARCHITECTURE</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <text x="40" y="80" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SOFTWARE</text>
      <text id="tsStep" x="560" y="80" text-anchor="end" fill="#D8A657" font-size="9.5" letter-spacing="1.2"></text>
      <g id="tsSw"></g>

      <g id="tsWires"></g>
      <rect x="32" y="166" width="536" height="30" rx="7" fill="rgba(126,166,214,0.08)" stroke="#7EA6D6" stroke-width="1.3"/>
      <path id="tsHalFlow" d="M44 181H556" stroke="#7EA6D6" stroke-width="1.4" stroke-dasharray="3 10" opacity="0.6"/>
      <text x="300" y="185" text-anchor="middle" fill="#CFD8DC" font-size="10.5" letter-spacing="2" font-family="'Space Grotesk',sans-serif" font-weight="600" style="paint-order:stroke" stroke="#2b3640" stroke-width="6">HARDWARE ABSTRACTION LAYER</text>

      <text x="40" y="228" fill="#9E9E9E" font-size="9" letter-spacing="1.5">HARDWARE</text>
      <g id="tsHw"></g>

      <g id="tsBus"></g>

      <rect x="96" y="452" width="408" height="74" rx="10" fill="rgba(33,33,33,0.55)" stroke="#607D8B" stroke-width="1.5"/>
      <g id="tsDut"></g>
      <text x="300" y="474" text-anchor="middle" fill="#9E9E9E" font-size="9" letter-spacing="2">DEVICE UNDER TEST</text>
      <text id="tsRes" x="300" y="512" text-anchor="middle" fill="#79C5A6" font-size="15" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="1"></text>
      <g id="tsPk"></g>
    </svg>`;

  window.AstemesAnim.register({
    id: 'tech-stack', name: 'Test System Stack', weight: 1, isDefault: false,
    mount: function (stage) {
      stage.innerHTML = SVG;
      var raf = null, torn = false;
      var id = function (s) { return stage.querySelector('#' + s); };
      var NS = 'http://www.w3.org/2000/svg';
      function el(tag, a, txt, p) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; if (p) p.appendChild(e); return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };

      /* software tiles */
      var sw = id('tsSw'), swT = [];
      SW.forEach(function (s, i) {
        var b = el('rect', { x: BX[i], y: 90, width: BW, height: 52, rx: 8, fill: 'rgba(96,125,139,0.10)', stroke: '#455A64', 'stroke-width': 1.5 }, null, sw);
        el('text', { x: cx(i), y: 113, 'text-anchor': 'middle', fill: C.light, 'font-size': 14, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, s.n, sw);
        el('text', { x: cx(i), y: 130, 'text-anchor': 'middle', fill: C.mut, 'font-size': 9.5 }, s.s, sw);
        swT.push(b);
      });

      /* wires: software → HAL, HAL → hardware, hardware → bus → DUT */
      var wires = id('tsWires');
      for (var i = 0; i < 4; i++) {
        el('line', { x1: cx(i), y1: 142, x2: cx(i), y2: 166, stroke: C.track, 'stroke-width': 2 }, null, wires);
        el('line', { x1: cx(i), y1: 196, x2: cx(i), y2: 236, stroke: C.track, 'stroke-width': 2 }, null, wires);
      }

      /* hardware boxes with little live internals */
      var hw = id('tsHw'), hwB = [], leds = [], fpga = [], dmm;
      HW.forEach(function (h, i) {
        var x = BX[i], g = el('g', {}, null, hw);
        hwB.push(el('rect', { x: x, y: 236, width: BW, height: 108, rx: 8, fill: 'rgba(43,54,64,0.85)', stroke: '#455A64', 'stroke-width': 1.5 }, null, g));
        el('text', { x: x + 12, y: 256, fill: C.light, 'font-size': 13, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, h.n, g);
        el('text', { x: x + BW - 12, y: 256, 'text-anchor': 'end', fill: C.mut, 'font-size': 8.5 }, h.s, g);
        if (i === 0) {            // PXI chassis: slots with status LEDs
          for (var k = 0; k < 8; k++) {
            el('rect', { x: x + 12 + k * 12.5, y: 268, width: 9, height: 62, rx: 1.5, fill: '#212121', stroke: '#3a4750' }, null, g);
            leds.push(el('circle', { cx: x + 16.5 + k * 12.5, cy: 276, r: 2, fill: C.track }, null, g));
          }
        } else if (i === 1) {     // cDAQ: modules with mini traces
          for (var k = 0; k < 4; k++) {
            el('rect', { x: x + 12 + k * 25.5, y: 268, width: 22, height: 62, rx: 2, fill: '#212121', stroke: '#3a4750' }, null, g);
            leds.push(el('circle', { cx: x + 23 + k * 25.5, cy: 276, r: 2, fill: C.track }, null, g));
            fpga.push(el('path', { d: '', fill: 'none', stroke: [C.amber, C.green, C.blue, C.light][k], 'stroke-width': 1.2 }, null, g));
          }
        } else if (i === 2) {     // cRIO: FPGA chip with activity bars
          el('rect', { x: x + 34, y: 270, width: 56, height: 56, rx: 4, fill: '#212121', stroke: '#607D8B' }, null, g);
          for (var k = 0; k < 6; k++) {
            el('line', { x1: x + 40 + k * 9, y1: 264, x2: x + 40 + k * 9, y2: 270, stroke: '#607D8B', 'stroke-width': 2 }, null, g);
            el('line', { x1: x + 40 + k * 9, y1: 326, x2: x + 40 + k * 9, y2: 332, stroke: '#607D8B', 'stroke-width': 2 }, null, g);
          }
          el('text', { x: x + 62, y: 285, 'text-anchor': 'middle', fill: C.mut, 'font-size': 8 }, 'FPGA', g);
          for (var k = 0; k < 5; k++) fpga.push(el('rect', { x: x + 40 + k * 9.5, y: 292, width: 6, height: 28, fill: C.green, opacity: 0.8 }, null, g));
        } else {                  // instrument: DMM readout
          el('rect', { x: x + 12, y: 268, width: BW - 24, height: 36, rx: 3, fill: '#11181d', stroke: '#3a4750' }, null, g);
          dmm = el('text', { x: x + BW - 20, y: 294, 'text-anchor': 'end', fill: C.light, 'font-size': 18, 'letter-spacing': 1 }, '0.000', g);
          el('text', { x: x + 18, y: 280, fill: C.mut, 'font-size': 7.5 }, 'DCV', g);
          for (var k = 0; k < 4; k++) el('circle', { cx: x + 22 + k * 20, cy: 320, r: 5, fill: 'none', stroke: '#607D8B', 'stroke-width': 1.5 }, null, g);
        }
      });

      /* buses: hardware → DUT */
      var bus = id('tsBus'), busP = [];
      for (var i = 0; i < 4; i++) {
        var tx = 150 + i * 100, d = 'M' + cx(i) + ' 344V384Q' + cx(i) + ' 400 ' + ((cx(i) + tx) / 2) + ' 404Q' + tx + ' 408 ' + tx + ' 424V452';
        busP.push(el('path', { d: d, fill: 'none', stroke: C.track, 'stroke-width': 2 }, null, bus));
        el('rect', { x: (cx(i) + tx) / 2 - 38, y: 395, width: 76, height: 18, rx: 9, fill: '#2b3640', stroke: '#455A64' }, null, bus);
        el('text', { x: (cx(i) + tx) / 2, y: 408, 'text-anchor': 'middle', fill: C.light, 'font-size': 9.5 }, BUS[i], bus);
      }
      // DUT pins / traces
      var dut = id('tsDut');
      for (var i = 0; i < 4; i++) el('rect', { x: 144 + i * 100, y: 452, width: 12, height: 6, fill: '#607D8B' }, null, dut);

      /* packets travelling down (command) and up (measurement) */
      var pk = id('tsPk'), pkts = [];
      for (var i = 0; i < 4; i++) pkts.push({ c: el('circle', { r: 4, fill: C.amber, opacity: 0 }, null, pk), len: busP[i].getTotalLength() });

      var STEPS = [
        { s: 0, h: 0, t: 'Apply stimulus' }, { s: 1, h: 1, t: 'Acquire signals' },
        { s: 1, h: 2, t: 'Closed-loop control' }, { s: 0, h: 3, t: 'Measure · SCPI' }
      ], STEPMS = 2200, CYC = STEPMS * 4;
      var nRun = 0, lastCyc = -1;

      function pathPt(i, f) {          // f: 0 = SW tile, 1 = DUT pin
        var y1 = 142, y2 = 344;        // vertical stretch from tile to hardware bottom
        if (f < 0.55) { var g = f / 0.55; return { x: cx(i), y: y1 + g * (y2 - y1) }; }
        var p = busP[i].getPointAtLength((f - 0.55) / 0.45 * pkts[i].len); return { x: p.x, y: p.y };
      }

      function render(t) {
        var c = t % CYC, k = Math.floor(c / STEPMS), u = (c % STEPMS) / STEPMS, st = STEPS[k];
        var cyc = Math.floor(t / CYC); if (cyc !== lastCyc) { lastCyc = cyc; nRun++; }
        id('tsStep').textContent = 'STEP ' + (k + 1) + '/4 · ' + st.t.toUpperCase();
        id('tsHalFlow').setAttribute('stroke-dashoffset', (-t * 0.03).toFixed(1));
        swT.forEach(function (b, i) {
          var on = i === st.s || (i === 3 && u < 0.15 && k === 0);
          b.setAttribute('stroke', on ? C.amber : '#455A64');
          b.setAttribute('fill', on ? 'rgba(216,166,87,0.10)' : 'rgba(96,125,139,0.10)');
        });
        hwB.forEach(function (b, i) { b.setAttribute('stroke', i === st.h ? C.green : '#455A64'); });
        busP.forEach(function (b, i) { b.setAttribute('stroke', i === st.h ? '#607D8B' : C.track); });

        // packet: down 0–0.45 (amber), back up 0.55–1 (green)
        pkts.forEach(function (p, i) {
          if (i !== st.h) { p.c.setAttribute('opacity', 0); return; }
          var f, col;
          if (u < 0.45) { f = u / 0.45; col = C.amber; } else if (u < 0.55) { f = 1; col = C.light; } else { f = 1 - (u - 0.55) / 0.45; col = C.green; }
          var q = pathPt(i, f);
          // route from the active software tile's column for the first segment
          if (f < 0.2 && st.s !== i) { var g = f / 0.2; q = { x: cx(st.s) + (cx(i) - cx(st.s)) * clamp((g - 0.4) / 0.6, 0, 1), y: 142 + g * 39 }; }
          p.c.setAttribute('cx', q.x.toFixed(1)); p.c.setAttribute('cy', q.y.toFixed(1));
          p.c.setAttribute('fill', col); p.c.setAttribute('opacity', 1);
        });

        // hardware internals
        leds.forEach(function (l, j) { l.setAttribute('fill', Math.sin(t / 180 + j * 1.9) > 0.55 ? (j % 3 ? C.green : C.amber) : C.track); });
        var bx = BX[1];
        for (var m = 0; m < 4; m++) {
          var d = 'M', x0 = bx + 14 + m * 25.5;
          for (var s = 0; s <= 18; s++) {
            var amp = st.h === 1 ? 10 : 3;
            d += (s ? 'L' : '') + (x0 + s).toFixed(1) + ' ' + (306 + amp * Math.sin(s * 0.7 + t / (120 + m * 40) + m)).toFixed(1);
          }
          fpga[m].setAttribute('d', d);
        }
        for (var m = 4; m < 9; m++) {
          var h = 6 + 22 * Math.abs(Math.sin(t / (st.h === 2 ? 90 : 300) + m * 1.3));
          fpga[m].setAttribute('y', (320 - h).toFixed(1)); fpga[m].setAttribute('height', h.toFixed(1));
        }
        dmm.textContent = st.h === 3 ? (4.998 + 0.004 * Math.sin(t / 97)).toFixed(3) : (4.99 + 0.01 * Math.sin(t / 900)).toFixed(3);
        dmm.setAttribute('fill', st.h === 3 ? C.green : C.light);

        var done = k === 3 && u > 0.6;
        id('tsRes').textContent = done ? 'PASS · RUN #' + (2140 + nRun) : 'TESTING · RUN #' + (2140 + nRun);
        id('tsRes').setAttribute('fill', done ? C.green : C.amber);
      }

      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { render(STEPMS * 1.3); return function () { stage.innerHTML = ''; }; }
      var t0 = null;
      function loop(ts) { if (torn) return; if (t0 === null) t0 = ts; render(ts - t0); raf = requestAnimationFrame(loop); }
      raf = requestAnimationFrame(loop);
      return function teardown() { torn = true; if (raf) cancelAnimationFrame(raf); stage.innerHTML = ''; };
    }
  });
})();
