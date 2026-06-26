/* Astemes "Fatigue Logger" — animated hero instrument panel (structural durability variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A servo-hydraulic rig runs an accelerated lifecycle test on a
   structural component: strain gauges show the fast cyclic load on a scope, thermocouples track
   self-heating, and the cycle counter climbs toward its endurance target. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', steel:'#B8C2C9',
            light:'#CFD8DC', white:'#FFFFFF', dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A' };

  var SX0 = 52, SX1 = 548, PTOP = 182, PBOT = 298, SMIN = -1000, SMAX = 1000, NPTS = 188;
  var TARGET = 2000000, OMEGA = 0.021;   // strain scope frequency (rad/ms of sped time)

  // strain gauges (µε) drawn on the scope: label, colour, mean, amplitude, decimals
  var SG = [
    { name: 'SG1 Fillet',   col: C.amber, mean: 30,  amp: 760, grow: 0 },
    { name: 'SG2 Web',      col: C.green, mean: -40, amp: 520, grow: 1.4 },   // amplitude slowly creeps up = damage
    { name: 'SG3 Flange',   col: C.blue,  mean: -20, amp: -680, grow: 0 },    // compression side (inverted)
    { name: 'SG4 Boss',     col: C.mauve, mean: 10,  amp: 300, grow: 0 }
  ];
  // thermocouples (°C): tabulated only, no trace
  var TC = [
    { name: 'TC1 Component', col: C.steel, fn: function (e) { return 24 + 33 * (1 - Math.exp(-e / 9000)) + 1.6 * Math.sin(e / 4200); }, dec: 1 },
    { name: 'TC2 Ambient',   col: C.gmut,  fn: function (e) { return 23 + 1.2 * Math.sin(e / 12000); }, dec: 1 }
  ];
  var ROWY = [346, 364, 382, 400, 422, 440];

  var SVG =
  `<svg id="flPanel" viewBox="0 0 600 560" role="img"
        aria-label="A structural durability datalogger on a servo-hydraulic fatigue rig: strain gauges on a component show the fast cyclic load on a scope while thermocouples track self-heating, and the cycle counter climbs toward its endurance target."
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
      <text x="40" y="100" fill="#CFD8DC" font-size="13">Suspension Arm A3</text>
      <text x="262" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">RIG</text>
      <text x="262" y="100" fill="#CFD8DC" font-size="13">Servo-Hyd 100 kN</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CHANNELS</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">6 &#183; 2 kHz</text>

      <!-- status banner -->
      <rect id="flBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(121,197,166,0.10)" stroke="#79C5A6" stroke-width="1.5"/>
      <circle id="flRec" cx="54" cy="147" r="8" fill="#B07A7A"/>
      <text id="flState" x="78" y="156" fill="#79C5A6" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">RUNNING</text>
      <text x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">AXIAL FATIGUE &#183; R = &#8722;1</text>
      <text id="flLoad" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">&#177;18.2 kN @ 12.0 Hz</text>

      <!-- cyclic strain scope -->
      <text x="40" y="174" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5" id="flScopeLbl" opacity="0">STRAIN</text>
      <rect x="44" y="174" width="512" height="132" rx="4" fill="#0d1417" stroke="#34424b"/>
      <g id="flGrid" stroke="rgba(96,125,139,0.12)" stroke-width="1"></g>
      <line x1="52" y1="240" x2="548" y2="240" stroke="rgba(96,125,139,0.34)" stroke-width="1"/>
      <text x="56" y="188" fill="#6b7780" font-size="9">+1000 &#181;&#949;</text>
      <text x="56" y="296" fill="#6b7780" font-size="9">&#8722;1000 &#181;&#949;</text>
      <g id="flTraces"></g>
      <g id="flLegend"></g>

      <!-- channel table -->
      <text x="66"  y="328" fill="#9E9E9E" font-size="9" letter-spacing="1.2">CHANNEL</text>
      <text x="346" y="328" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">LIVE</text>
      <text x="452" y="328" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">PEAK</text>
      <text x="550" y="328" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">RANGE</text>
      <path d="M40 334H560" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <g id="flRows" font-size="12"></g>

      <!-- footer: endurance cycles -->
      <path d="M32 456H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="476" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CYCLES COMPLETED</text>
      <text id="flCycles" x="40" y="500" fill="#CFD8DC" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700">782450</text>
      <text id="flCycTgt" x="196" y="500" fill="#6b7780" font-size="11">/ 2 000 000 &#183; 39%</text>
      <rect x="40" y="510" width="380" height="7" rx="3.5" fill="rgba(96,125,139,0.18)"/>
      <rect id="flProg" x="40" y="510" width="149" height="7" rx="3.5" fill="#607D8B"/>
      <text id="flElapsed" x="40" y="534" fill="#6b7780" font-size="11">ELAPSED 18:42:06 &#183; SPECIMEN 56.4&#176;C</text>
      <g id="flStop">
        <rect id="flStopBox" x="448" y="492" width="112" height="30" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="flStopIcon" x="474" y="499" width="13" height="13" rx="2" fill="#B07A7A"/>
        <text id="flStopTxt" x="495" y="511" fill="#B07A7A" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP</text>
      </g>
    </svg>`;

  function boot() {
    var mount = document.querySelector('.hero-visual');
    if (!mount || mount.querySelector('#flPanel')) return;
    mount.innerHTML = SVG;

    (function () {
      var panel = document.getElementById('flPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      var grp = function (n) { return Math.round(n).toLocaleString('en-US').replace(/,/g, '\u202F'); };
      var sgn = function (n, d) { return (n >= 0 ? '+' : '\u2212') + Math.abs(n).toFixed(d || 0); };

      // grid
      var grid = id('flGrid');
      for (var gx = 1; gx < 8; gx++) grid.appendChild(el('line', { x1: 52 + gx * 62, y1: PTOP, x2: 52 + gx * 62, y2: PBOT }));
      for (var gy = 1; gy < 4; gy++) grid.appendChild(el('line', { x1: 52, y1: PTOP + gy * 29, x2: SX1, y2: PTOP + gy * 29 }));

      // strain traces + legend
      var tg = id('flTraces'), lg = id('flLegend'), lx = 130;
      SG.forEach(function (g, i) {
        g.buf = []; g.peak = 0; g.mn = 1e9; g.mx = -1e9;
        tg.appendChild(el('path', { id: 'flTr' + i, fill: 'none', stroke: g.col, 'stroke-width': 1.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', d: 'M52,240' }));
        lg.appendChild(el('circle', { cx: lx, cy: 188, r: 3, fill: g.col }));
        lg.appendChild(el('text', { x: lx + 8, y: 191, fill: '#9E9E9E', 'font-size': 9 }, g.name));
        lx += g.name.length * 5.6 + 24;
      });

      // table rows (4 SG + 2 TC)
      var rows = id('flRows');
      function addRow(i, name, col) {
        var y = ROWY[i];
        rows.appendChild(el('circle', { cx: 56, cy: y - 4, r: 3.5, fill: col }));
        rows.appendChild(el('text', { x: 66, y: y, fill: '#CFD8DC' }, name));
        rows.appendChild(el('text', { id: 'flLv' + i, x: 346, y: y, 'text-anchor': 'end', fill: col, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, '\u2014'));
        rows.appendChild(el('text', { id: 'flPk' + i, x: 452, y: y, 'text-anchor': 'end', fill: '#6b7780', 'font-size': 11 }, '\u2014'));
        rows.appendChild(el('text', { id: 'flRn' + i, x: 550, y: y, 'text-anchor': 'end', fill: '#6b7780', 'font-size': 11 }, '\u2014'));
      }
      SG.forEach(function (g, i) { addRow(i, g.name, g.col); });
      TC.forEach(function (t, i) { addRow(4 + i, t.name, t.col); t.mn = 1e9; t.mx = -1e9; });

      function strainOf(g, e) { return g.mean + (g.amp + (g.amp >= 0 ? 1 : -1) * g.grow * (e / 1000)) * Math.sin(e * OMEGA); }
      // pre-fill scope buffers
      SG.forEach(function (g) { for (var k = 0; k < NPTS; k++) { var v = strainOf(g, -(NPTS - 1 - k) * 16); g.buf.push(v); } });

      var cycBase = 782450, RATE = 320, elapBase = 18 * 3600 + 42 * 60 + 6;
      function render(e) {
        SG.forEach(function (g, i) {
          var v = strainOf(g, e) + (Math.random() - 0.5) * 14;
          g.buf.push(v); if (g.buf.length > NPTS) g.buf.shift();
          if (v > g.mx) g.mx = v; if (v < g.mn) g.mn = v; if (Math.abs(v) > Math.abs(g.peak)) g.peak = v;
          var n = g.buf.length, d = '';
          for (var k = 0; k < n; k++) {
            var x = SX0 + (k / (NPTS - 1)) * (SX1 - SX0);
            var y = PBOT - (clamp(g.buf[k], SMIN, SMAX) - SMIN) / (SMAX - SMIN) * (PBOT - PTOP);
            d += (k ? ' L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
          }
          id('flTr' + i).setAttribute('d', d);
          id('flLv' + i).textContent = sgn(v) + ' \u00B5\u03B5';
          id('flPk' + i).textContent = sgn(g.peak);
          id('flRn' + i).textContent = grp(g.mx - g.mn);
        });
        TC.forEach(function (t, i) {
          var v = t.fn(e) + (Math.random() - 0.5) * 0.2;
          if (v > t.mx) t.mx = v; if (v < t.mn) t.mn = v;
          id('flLv' + (4 + i)).textContent = v.toFixed(t.dec) + ' \u00B0C';
          id('flPk' + (4 + i)).textContent = t.mx.toFixed(t.dec);
          id('flRn' + (4 + i)).textContent = (t.mx - t.mn).toFixed(t.dec);
        });
        // endurance counter + progress
        var cyc = cycBase + (e / 1000) * RATE;
        id('flCycles').textContent = grp(cyc);
        var frac = clamp(cyc / TARGET, 0, 1);
        id('flCycTgt').textContent = '/ 2 000 000 \u00B7 ' + Math.round(frac * 100) + '%';
        id('flProg').setAttribute('width', (380 * frac).toFixed(1));
        var secs = elapBase + e / 1000, p2 = function (n) { return (n < 10 ? '0' : '') + n; };
        var h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60);
        id('flElapsed').textContent = 'ELAPSED ' + p2(h) + ':' + p2(m) + ':' + p2(s) + ' \u00B7 SPECIMEN ' + TC[0].fn(e).toFixed(1) + '\u00B0C';
        id('flRec').setAttribute('opacity', (0.45 + 0.55 * Math.abs(Math.sin(e / 520))).toFixed(2));
      }

      // ── stop / re-arm ──
      var stopped = false;
      function abort() {
        if (stopped) return; stopped = true;
        id('flBanner').setAttribute('fill', 'rgba(96,125,139,0.08)'); id('flBanner').setAttribute('stroke', C.gmut);
        id('flState').textContent = 'HOLD'; id('flState').setAttribute('fill', C.gmut);
        id('flRec').setAttribute('fill', C.gmut); id('flRec').setAttribute('opacity', '1');
        setStopBtn(false); setTimeout(rearm, 2600);
      }
      function rearm() {
        stopped = false; if (!mqDesktop.matches) return; t0 = null;
        id('flState').textContent = 'RUNNING'; id('flState').setAttribute('fill', C.green);
        id('flBanner').setAttribute('fill', 'rgba(121,197,166,0.10)'); id('flBanner').setAttribute('stroke', C.green);
        id('flRec').setAttribute('fill', C.red); setStopBtn(true); startLoop();
      }
      function setStopBtn(on) {
        var col = on ? C.red : C.queue, g = id('flStop');
        id('flStopBox').setAttribute('stroke', col); id('flStopBox').setAttribute('opacity', on ? '1' : '0.5');
        id('flStopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        id('flStopTxt').setAttribute('fill', col); id('flStopIcon').setAttribute('fill', col);
        g.style.pointerEvents = on ? 'auto' : 'none'; g.style.cursor = on ? 'pointer' : 'default';
      }
      id('flStop').addEventListener('click', abort);
      setStopBtn(true);

      var mqDesktop = window.matchMedia('(min-width: 1081px)');
      if (reduce) { if (mqDesktop.matches) render(8000); return; }

      var t0 = null, ticking = false;
      function frame(ts) {
        if (stopped || !mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        render(ts - t0);
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
