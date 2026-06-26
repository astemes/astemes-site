/* Astemes "HIL Tester" — animated hero instrument panel (power-electronics HIL variant).
   Same chrome, palette and self-injection contract as testbench.js / battery-cycler.js, so the
   three animations share one <div class="hero-visual"> mount. A real VFD controller (DUT) drives
   an FPGA-simulated 3-phase induction motor; the rig continuously runs the inverter, arms a fault
   from its library, injects it, and verifies the drive's protection trips correctly — cycle after
   cycle. Inverter output current is shown on a live scope above the plant telemetry. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A', redtx:'#D69191' };
  var PHC = ['#D8A657', '#79C5A6', '#7EA6D6'];     // phase A / B / C trace colours

  // scope screen geometry
  var SX0 = 52, SX1 = 548, SY = 254, STOP = 192, SBOT = 316, APX = 30, NCYC = 3.2;
  var OFF = [0, -2.0944, 2.0944];                  // 120° phase spacing
  var TWO_PI = Math.PI * 2;

  // cycle timeline (ms of sped-up time): run → arm → inject → trip → reset
  var RUN_END = 3000, ARM_END = 4200, INJ_END = 5400, TRIP_END = 6700, CYCLE = 8600;

  var FAULTS = [
    { name: 'Phase A Open',        expect: 'PHASE-LOSS',   trip: 'PH-LOSS TRIP', kind: 'phaseloss' },
    { name: 'Output Overcurrent',  expect: 'I > 2.0\u00D7 In', trip: 'OC TRIP',  kind: 'oc' },
    { name: 'DC Bus Overvoltage',  expect: 'Vdc > 750 V',  trip: 'OV TRIP',      kind: 'ov' },
    { name: 'Ground Fault',        expect: 'Ig > 0.5 A',   trip: 'GF TRIP',      kind: 'gf' },
    { name: 'Encoder Feedback Loss', expect: 'FB TIMEOUT', trip: 'FB FAULT',     kind: 'enc' }
  ];
  var ROWY = [400, 419, 438, 457, 476];

  var SVG =
  `<svg id="hlPanel" viewBox="0 0 600 560" role="img"
        aria-label="A hardware-in-the-loop test rig for a variable-frequency motor drive: a real-time simulated induction motor is driven by the controller under test while protection faults are injected from a library and the drive's trip response is verified, with live three-phase inverter current on an oscilloscope."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <!-- panel -->
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">HIL TESTER</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- header info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">PLANT MODEL</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">3-PH IM &#183; 7.5 kW &#183; 4-POLE</text>
      <text x="288" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SOLVER</text>
      <text x="288" y="100" fill="#CFD8DC" font-size="13">FPGA &#183; 1 &#181;s STEP</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">DUT</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">VFD-A700 #07</text>

      <!-- status banner -->
      <rect id="hlBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(121,197,166,0.10)" stroke="#79C5A6" stroke-width="1.5"/>
      <circle id="hlDot" cx="54" cy="147" r="7" fill="#79C5A6"/>
      <path id="hlWarn" d="M54 134l13 23H41Z" fill="none" stroke="#D8A657" stroke-width="2.4" stroke-linejoin="round" opacity="0"/>
      <text id="hlWarnEx" x="54" y="153" text-anchor="middle" fill="#D8A657" font-size="13" font-weight="700" opacity="0">!</text>
      <text id="hlState" x="80" y="156" fill="#79C5A6" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">RUNNING</text>
      <text id="hlSub1" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">ALL PROTECTIONS NOMINAL</text>
      <text id="hlSub2" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">1480 rpm &#183; 49.6 Hz</text>

      <!-- ── inverter output current scope ── -->
      <text x="40" y="186" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">INVERTER OUTPUT CURRENT</text>
      <g font-size="9">
        <circle cx="408" cy="183" r="3" fill="#D8A657"/><text x="416" y="186" fill="#9E9E9E">Ia</text>
        <circle cx="446" cy="183" r="3" fill="#79C5A6"/><text x="454" y="186" fill="#9E9E9E">Ib</text>
        <circle cx="484" cy="183" r="3" fill="#7EA6D6"/><text x="492" y="186" fill="#9E9E9E">Ic</text>
        <text x="552" y="186" text-anchor="end" fill="#6b7780">10 A/div</text>
      </g>
      <rect x="44" y="192" width="512" height="124" rx="4" fill="#0d1417" stroke="#34424b"/>
      <g id="hlGrid" stroke="rgba(96,125,139,0.13)" stroke-width="1"></g>
      <line x1="52" y1="254" x2="548" y2="254" stroke="rgba(96,125,139,0.38)" stroke-width="1"/>
      <path id="hlWa" fill="none" stroke="#D8A657" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" d="M52,254"/>
      <path id="hlWb" fill="none" stroke="#79C5A6" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" d="M52,254"/>
      <path id="hlWc" fill="none" stroke="#7EA6D6" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" d="M52,254"/>
      <text id="hlTrip" x="300" y="260" text-anchor="middle" fill="#D69191" font-size="20" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="3" opacity="0">OUTPUT DISABLED</text>

      <!-- ── plant telemetry ── -->
      <g font-family="'Space Grotesk',sans-serif">
        <text x="48"  y="338" font-family="'DM Mono',monospace" fill="#9E9E9E" font-size="9" letter-spacing="1.2">SPEED</text>
        <text id="hlSpd" x="48"  y="360" fill="#CFD8DC" font-size="19" font-weight="600">1480<tspan font-size="11" font-family="'DM Mono',monospace" fill="#6b7780"> rpm</tspan></text>
        <text x="176" y="338" font-family="'DM Mono',monospace" fill="#9E9E9E" font-size="9" letter-spacing="1.2">OUTPUT FREQ</text>
        <text id="hlFrq" x="176" y="360" fill="#CFD8DC" font-size="19" font-weight="600">49.6<tspan font-size="11" font-family="'DM Mono',monospace" fill="#6b7780"> Hz</tspan></text>
        <text x="304" y="338" font-family="'DM Mono',monospace" fill="#9E9E9E" font-size="9" letter-spacing="1.2">TORQUE</text>
        <text id="hlTrq" x="304" y="360" fill="#CFD8DC" font-size="19" font-weight="600">38<tspan font-size="11" font-family="'DM Mono',monospace" fill="#6b7780"> Nm</tspan></text>
        <text x="432" y="338" font-family="'DM Mono',monospace" fill="#9E9E9E" font-size="9" letter-spacing="1.2">DC BUS</text>
        <text id="hlVdc" x="432" y="360" fill="#CFD8DC" font-size="19" font-weight="600">565<tspan font-size="11" font-family="'DM Mono',monospace" fill="#6b7780"> V</tspan></text>
      </g>

      <!-- ── fault insertion library ── -->
      <text x="40" y="384" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">FAULT INSERTION LIBRARY</text>
      <text x="560" y="384" text-anchor="end" fill="#6b7780" font-size="9">EXPECTED &#183; STATUS</text>
      <path d="M40 390H560" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <g id="hlRows" font-size="12"></g>

      <!-- footer -->
      <path d="M32 492H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="516" fill="#9E9E9E" font-size="12">PROTECTION TRIPS VERIFIED &#183; <tspan id="hlCount" fill="#79C5A6" font-weight="600">318</tspan> / 318</text>
      <g id="hlStop">
        <rect id="hlStopBox" x="432" y="502" width="128" height="34" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="hlStopIcon" x="463" y="511" width="14" height="14" rx="2" fill="#B07A7A"/>
        <text id="hlStopTxt" x="485" y="524" fill="#B07A7A" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">ABORT</text>
      </g>
    </svg>`;

  function boot() {
    var mount = document.querySelector('.hero-visual');
    if (!mount || mount.querySelector('#hlPanel')) return;
    mount.innerHTML = SVG;

    (function () {
      var panel = document.getElementById('hlPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      var lerp = function (a, b, t) { return a + (b - a) * t; };

      // ── build scope grid + fault rows (kept out of the SVG string to stay readable) ──
      var grid = id('hlGrid');
      for (var gx = 1; gx < 10; gx++) grid.appendChild(el('line', { x1: 52 + gx * 49.6, y1: STOP, x2: 52 + gx * 49.6, y2: SBOT }));
      for (var gy = 1; gy < 6; gy++) grid.appendChild(el('line', { x1: 52, y1: STOP + gy * 20.7, x2: SX1, y2: STOP + gy * 20.7 }));

      var rows = id('hlRows'), rowEl = [];
      FAULTS.forEach(function (f, i) {
        var y = ROWY[i];
        var hi = el('rect', { id: 'hlHi' + i, x: 24, y: y - 15, width: 552, height: 19, fill: 'rgba(216,166,87,0.08)', opacity: 0 });
        var bar = el('rect', { x: 24, y: y - 15, width: 3, height: 19, fill: '#D8A657', opacity: 0, id: 'hlBar' + i });
        var dot = el('circle', { cx: 46, cy: y - 5.5, r: 3, fill: '#5a6873', id: 'hlDt' + i });
        var nm = el('text', { x: 58, y: y, fill: '#8a98a3' }); nm.textContent = f.name;
        var ex = el('text', { x: 392, y: y, 'text-anchor': 'end', fill: '#6b7780', 'font-size': 10 }); ex.textContent = f.expect;
        var box = el('rect', { id: 'hlBox' + i, x: 470, y: y - 13, width: 88, height: 17, rx: 3, fill: 'none', stroke: '#3a6b58', opacity: 1 });
        var st = el('text', { id: 'hlSt' + i, x: 514, y: y, 'text-anchor': 'middle', 'font-size': 9.5, 'letter-spacing': 1, fill: '#79C5A6' }); st.textContent = 'PASS';
        [hi, bar, dot, nm, ex, box, st].forEach(function (n) { rows.appendChild(n); });
        rowEl[i] = { dot: dot, nm: nm, box: box, st: st, hi: hi, bar: bar };
      });

      // ── waveform sampling ──
      function phaseOf(c) {
        return c < RUN_END ? 'run' : c < ARM_END ? 'arm' : c < INJ_END ? 'inject' : c < TRIP_END ? 'trip' : 'reset';
      }
      var wp = ['hlWa', 'hlWb', 'hlWc'];
      function drawWaves(c, scroll, kind) {
        var ph = phaseOf(c);
        var ip = clamp((c - ARM_END) / (INJ_END - ARM_END), 0, 1);
        var tp = clamp((c - INJ_END) / (TRIP_END - INJ_END), 0, 1);
        var rp = clamp((c - TRIP_END) / (CYCLE - TRIP_END), 0, 1);
        var inten = ph === 'inject' ? ip : ph === 'trip' ? 1 : 0;
        var gEnv = (ph === 'run' || ph === 'arm' || ph === 'inject') ? 1 : ph === 'trip' ? (1 - tp) : rp;
        var ampM = [1, 1, 1], dc = [0, 0, 0], wob = 0;
        if (inten > 0) {
          if (kind === 'phaseloss') { ampM = [1 - inten, 1 + 0.2 * inten, 1 + 0.2 * inten]; }
          else if (kind === 'oc')   { var g = 1 + 1.15 * inten; ampM = [g, g, g]; }
          else if (kind === 'ov')   { var d = 1 - 0.7 * inten; ampM = [d, d, d]; }
          else if (kind === 'gf')   { var o = 0.95 * inten; dc = [o, o, o]; }
          else if (kind === 'enc')  { var b = 1 + 0.5 * inten * Math.sin(c / 95); ampM = [b, b, b]; wob = 0.6 * inten * Math.sin(c / 60); }
        }
        for (var p = 0; p < 3; p++) {
          var d = '';
          for (var k = 0; k <= 80; k++) {
            var frac = k / 80;
            var ang = TWO_PI * NCYC * frac + scroll + OFF[p] + wob;
            var v = (ampM[p] * Math.sin(ang) + dc[p]) * gEnv;
            var x = SX0 + frac * (SX1 - SX0);
            var y = clamp(SY - v * APX, STOP + 3, SBOT - 3);
            d += (k ? ' L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
          }
          id(wp[p]).setAttribute('d', d);
        }
        // "OUTPUT DISABLED" flash while tripped
        id('hlTrip').setAttribute('opacity', ph === 'trip' && tp > 0.25 ? '0.9' : '0');
        return { ph: ph, ip: ip, tp: tp, rp: rp };
      }

      // ── telemetry ──
      var lastTel = ['', '', '', ''];
      function setTel(elId, val, unit, dec, state) {
        var txt = (dec ? val.toFixed(dec) : Math.round(val)) + '';
        var key = txt + state;
        if (lastTel[elId.n] === key) return; lastTel[elId.n] = key;
        var col = state === 'crit' ? C.redtx : state === 'warn' ? C.amber : C.light;
        id(elId.id).innerHTML = txt + '<tspan font-size="11" font-family="\'DM Mono\',monospace" fill="#6b7780"> ' + unit + '</tspan>';
        id(elId.id).setAttribute('fill', col);
      }
      var TEL = { spd: { id: 'hlSpd', n: 0 }, frq: { id: 'hlFrq', n: 1 }, trq: { id: 'hlTrq', n: 2 }, vdc: { id: 'hlVdc', n: 3 } };
      function telemetry(c, kind, st) {
        var spd = 1480, frq = 49.6, trq = 38, vdc = 565, ip = st.ip, tp = st.tp, rp = st.rp;
        spd += 6 * Math.sin(c / 120); trq += 1.5 * Math.sin(c / 70);
        if (st.ph === 'inject') {
          if (kind === 'oc') { trq = 38 + 62 * ip; spd = 1480 - 45 * ip; }
          else if (kind === 'ov') { vdc = 565 + 175 * ip; trq = 38 - 22 * ip; }
          else if (kind === 'phaseloss') { trq = 38 + 22 * Math.sin(c / 80) * ip; spd = 1480 - 28 * ip; }
          else if (kind === 'gf') { vdc = 565 + 24 * ip; }
          else if (kind === 'enc') { spd = 1480 + 140 * Math.sin(c / 100) * ip; trq = 38 + 26 * Math.sin(c / 85) * ip; }
        } else if (st.ph === 'trip') {
          spd = 1480 * (1 - 0.5 * tp); frq = 49.6 * (1 - tp); trq = 38 * (1 - tp);
          vdc = kind === 'ov' ? 690 - 110 * tp : 565 + 18 * (1 - tp);
        } else if (st.ph === 'reset') {
          spd = lerp(740, 1480, rp); frq = lerp(0, 49.6, rp); trq = lerp(0, 38, rp); vdc = lerp(582, 565, rp);
        }
        setTel(TEL.spd, spd, 'rpm', 0, spd < 1200 ? 'warn' : 'norm');
        setTel(TEL.frq, frq, 'Hz', 1, frq < 40 ? 'warn' : 'norm');
        setTel(TEL.trq, trq, 'Nm', 0, trq > 80 ? 'crit' : trq > 54 ? 'warn' : 'norm');
        setTel(TEL.vdc, vdc, 'V', 0, vdc > 660 ? 'crit' : vdc > 600 ? 'warn' : 'norm');
        return { spd: spd, frq: frq };
      }

      // ── banner + fault rows ──
      var lastBn = '';
      function setBanner(st, f, tel) {
        var ph = st.ph, state, col, sub1;
        if (ph === 'run')        { state = 'RUNNING';        col = C.green; sub1 = 'ALL PROTECTIONS NOMINAL'; }
        else if (ph === 'arm')   { state = 'FAULT ARMED';    col = C.amber; sub1 = 'SCENARIO: ' + f.name.toUpperCase(); }
        else if (ph === 'inject'){ state = 'FAULT INJECTED'; col = C.amber; sub1 = 'SCENARIO: ' + f.name.toUpperCase(); }
        else if (ph === 'trip')  { state = 'TRIPPED';        col = C.red;   sub1 = f.trip + ' \u00B7 PROTECTION OK'; }
        else                     { state = 'RESETTING';      col = C.gmut;  sub1 = 'RE-ARMING PLANT MODEL'; }
        var key = state + sub1;
        if (key !== lastBn) {
          lastBn = key;
          var bg = col === C.green ? 'rgba(121,197,166,0.10)' : col === C.amber ? 'rgba(216,166,87,0.10)'
                 : col === C.red ? 'rgba(176,122,122,0.10)' : 'rgba(96,125,139,0.08)';
          id('hlBanner').setAttribute('fill', bg); id('hlBanner').setAttribute('stroke', col);
          id('hlState').textContent = state; id('hlState').setAttribute('fill', col);
          id('hlSub1').textContent = sub1;
          var faultish = ph === 'arm' || ph === 'inject' || ph === 'trip';
          id('hlDot').setAttribute('opacity', faultish ? '0' : '1');
          id('hlDot').setAttribute('fill', col);
          id('hlWarn').setAttribute('opacity', faultish ? '1' : '0');
          id('hlWarn').setAttribute('stroke', ph === 'trip' ? C.red : C.amber);
          id('hlWarnEx').setAttribute('opacity', faultish ? '1' : '0');
          id('hlWarnEx').setAttribute('fill', ph === 'trip' ? C.redtx : C.amber);
        }
        id('hlSub2').textContent = Math.round(tel.spd) + ' rpm \u00B7 ' + tel.frq.toFixed(1) + ' Hz';
      }

      var lastRowKey = '';
      function setRows(activeIdx, st) {
        var key = activeIdx + st.ph;
        if (key === lastRowKey) return; lastRowKey = key;
        for (var i = 0; i < FAULTS.length; i++) {
          var r = rowEl[i], active = i === activeIdx;
          if (!active) {
            r.hi.setAttribute('opacity', '0'); r.bar.setAttribute('opacity', '0');
            r.dot.setAttribute('fill', C.queue); r.nm.setAttribute('fill', '#8a98a3');
            r.box.setAttribute('stroke', '#3a6b58'); r.box.setAttribute('fill', 'none');
            r.st.textContent = 'PASS'; r.st.setAttribute('fill', C.green);
            continue;
          }
          r.nm.setAttribute('fill', C.light);
          var lit = st.ph === 'arm' || st.ph === 'inject';
          r.hi.setAttribute('opacity', lit ? '1' : '0'); r.bar.setAttribute('opacity', lit ? '1' : '0');
          if (st.ph === 'run' || st.ph === 'reset') {
            r.dot.setAttribute('fill', C.green); r.box.setAttribute('stroke', '#3a6b58'); r.box.setAttribute('fill', 'none');
            r.st.textContent = 'PASS'; r.st.setAttribute('fill', C.green);
          } else if (st.ph === 'arm') {
            r.dot.setAttribute('fill', C.amber); r.box.setAttribute('stroke', C.amber); r.box.setAttribute('fill', 'none');
            r.st.textContent = 'ARMED'; r.st.setAttribute('fill', C.amber);
          } else if (st.ph === 'inject') {
            r.dot.setAttribute('fill', C.amber); r.box.setAttribute('stroke', C.amber); r.box.setAttribute('fill', 'rgba(216,166,87,0.16)');
            r.st.textContent = 'INJECTED'; r.st.setAttribute('fill', C.amber);
          } else { // trip
            r.dot.setAttribute('fill', C.red); r.box.setAttribute('stroke', C.green); r.box.setAttribute('fill', 'rgba(121,197,166,0.15)');
            r.st.textContent = 'TRIP \u2713'; r.st.setAttribute('fill', C.green);
          }
        }
      }

      function setStopBtn(on) {
        var col = on ? C.red : C.queue, g = id('hlStop');
        id('hlStopBox').setAttribute('stroke', col); id('hlStopBox').setAttribute('opacity', on ? '1' : '0.5');
        id('hlStopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        id('hlStopTxt').setAttribute('fill', col); id('hlStopIcon').setAttribute('fill', col);
        g.style.pointerEvents = on ? 'auto' : 'none'; g.style.cursor = on ? 'pointer' : 'default';
      }

      // ── loop bookkeeping ──
      var count = 318, faultIdx = 0, prevPh = '';

      function render(c, scroll) {
        var f = FAULTS[faultIdx];
        var st = drawWaves(c, scroll, f.kind);
        var tel = telemetry(c, f.kind, st);
        setBanner(st, f, tel);
        setRows(faultIdx, st);
        // count a verified trip once, as the rig enters the trip phase
        if (st.ph === 'trip' && prevPh !== 'trip') {
          count++; id('hlCount').textContent = count;
          var lbl = id('hlCount').parentNode;
          lbl.lastChild.textContent = ' / ' + count;
        }
        prevPh = st.ph;
      }

      // ── abort / re-arm (matches the other two animations) ──
      var stopped = false;
      function abort() {
        if (stopped) return; stopped = true;
        lastBn = '';
        id('hlBanner').setAttribute('fill', 'rgba(96,125,139,0.08)'); id('hlBanner').setAttribute('stroke', C.gmut);
        id('hlState').textContent = 'ABORTED'; id('hlState').setAttribute('fill', C.gmut);
        id('hlSub1').textContent = 'HALTED BY OPERATOR';
        id('hlDot').setAttribute('opacity', '1'); id('hlDot').setAttribute('fill', C.gmut);
        id('hlWarn').setAttribute('opacity', '0'); id('hlWarnEx').setAttribute('opacity', '0');
        id('hlTrip').setAttribute('opacity', '0');
        setStopBtn(false);
        setTimeout(rearm, 2600);
      }
      function rearm() { stopped = false; if (!mqDesktop.matches) return; t0 = null; lastC = 0; lastBn = ''; lastRowKey = ''; setStopBtn(true); startLoop(); }
      id('hlStop').addEventListener('click', abort);
      setStopBtn(true);

      var mqDesktop = window.matchMedia('(min-width: 1081px)');
      if (reduce) { if (mqDesktop.matches) render(INJ_END - 200, 0); return; }

      var t0 = null, lastC = 0, ticking = false;
      function frame(ts) {
        if (stopped || !mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        var el = ts - t0, c = el % CYCLE;
        if (c < lastC) { faultIdx = (faultIdx + 1) % FAULTS.length; }
        lastC = c;
        render(c, el * 0.0046);
        requestAnimationFrame(frame);
      }
      function startLoop() { if (ticking || stopped || !mqDesktop.matches) return; ticking = true; t0 = null; requestAnimationFrame(frame); }
      if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', startLoop);
      else if (mqDesktop.addListener) mqDesktop.addListener(startLoop);
      startLoop();
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
