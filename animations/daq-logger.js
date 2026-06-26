/* Astemes "Data Logger" — animated hero instrument panel (generic experiment DAQ variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A bench DAQ continuously logs an experiment: five sensor
   channels stream onto one overlaid strip chart while a channel table shows each live value
   with its running min/max, and the sample / elapsed counters tick along. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', steel:'#B8C2C9',
            light:'#CFD8DC', white:'#FFFFFF', dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A' };

  var SX0 = 52, SX1 = 548, PTOP = 186, PBOT = 342, NPTS = 176;

  // five channels: name, unit, colour, display range [rmin,rmax], decimals, signal fn(e)
  var CH = [
    { name: 'Inlet Temp',   unit: '\u00B0C',   col: C.amber, rmin: 26, rmax: 90,  dec: 1, fn: function (e) { return 56 + 26 * Math.sin(e / 8200) + 5 * Math.sin(e / 2600); } },
    { name: 'Outlet Temp',  unit: '\u00B0C',   col: C.green, rmin: 24, rmax: 78,  dec: 1, fn: function (e) { return 48 + 20 * Math.sin(e / 6400 + 1) + 4 * Math.sin(e / 2200); } },
    { name: 'Chamber Press', unit: 'kPa', col: C.blue,  rmin: 92, rmax: 110, dec: 1, fn: function (e) { return 101 + 6 * Math.sin(e / 4700 + 2) + 1.4 * Math.sin(e / 1700); } },
    { name: 'Coolant Flow', unit: 'L/min', col: C.mauve, rmin: 8,  rmax: 16,  dec: 2, fn: function (e) { return 12 + 2.2 * Math.sin(e / 5200 + 0.5) + 0.5 * Math.sin(e / 900); } },
    { name: 'Supply Rail',  unit: 'V',   col: C.steel, rmin: 23.88, rmax: 24.12, dec: 3, fn: function (e) { return 24.0 + 0.05 * Math.sin(e / 3100) + 0.015 * Math.sin(e / 700); } }
  ];
  var NOISE = [0.5, 0.5, 0.35, 0.12, 0.012];
  var ROWY = [394, 412, 430, 448, 466];

  var SVG =
  `<svg id="dqPanel" viewBox="0 0 600 560" role="img"
        aria-label="A bench-top data logger continuously acquiring five sensor channels from an experiment onto one overlaid strip chart, with a channel table listing each live value and its running minimum and maximum, plus sample-count and elapsed-time counters."
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
      <text x="40" y="100" fill="#CFD8DC" font-size="13">Thermal Soak R14</text>
      <text x="262" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">DEVICE</text>
      <text x="262" y="100" fill="#CFD8DC" font-size="13">AS544</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">TRIGGER</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">FREE-RUN</text>

      <!-- status banner -->
      <rect id="dqBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(121,197,166,0.10)" stroke="#79C5A6" stroke-width="1.5"/>
      <circle id="dqRec" cx="54" cy="147" r="8" fill="#B07A7A"/>
      <text id="dqState" x="78" y="156" fill="#79C5A6" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">ACQUIRING</text>
      <text x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">5 CH &#183; 50 S/s &#183; CONTINUOUS</text>
      <text id="dqElapsed" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">ELAPSED 00:36:42</text>

      <!-- overlaid strip chart -->
      <rect x="44" y="178" width="512" height="172" rx="4" fill="#0d1417" stroke="#34424b"/>
      <g id="dqGrid" stroke="rgba(96,125,139,0.12)" stroke-width="1"></g>
      <g id="dqTraces"></g>

      <!-- channel table -->
      <text x="66"  y="374" fill="#9E9E9E" font-size="9" letter-spacing="1.2">CHANNEL</text>
      <text x="338" y="374" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">VALUE</text>
      <text x="446" y="374" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">MIN</text>
      <text x="550" y="374" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.2">MAX</text>
      <path d="M40 380H560" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <g id="dqRows" font-size="12"></g>

      <!-- footer -->
      <path d="M32 478H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="498" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SAMPLES ACQUIRED</text>
      <text id="dqSamples" x="40" y="522" fill="#CFD8DC" font-size="19" font-family="'Space Grotesk',sans-serif" font-weight="600">1842304</text>
      <text id="dqFile" x="206" y="522" fill="#6b7780" font-size="11">&#183; run_0421.tdms</text>
      <g id="dqStop">
        <rect id="dqStopBox" x="432" y="502" width="128" height="32" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="dqStopIcon" x="460" y="510" width="14" height="14" rx="2" fill="#B07A7A"/>
        <text id="dqStopTxt" x="482" y="522" fill="#B07A7A" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP LOG</text>
      </g>
    </svg>`;

  function boot() {
    var mount = document.querySelector('.hero-visual');
    if (!mount || mount.querySelector('#dqPanel')) return;
    mount.innerHTML = SVG;

    (function () {
      var panel = document.getElementById('dqPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      var grp = function (n) { return Math.round(n).toLocaleString('en-US').replace(/,/g, '\u202F'); };

      // grid
      var grid = id('dqGrid');
      for (var gx = 1; gx < 8; gx++) grid.appendChild(el('line', { x1: 52 + gx * 62, y1: PTOP, x2: 52 + gx * 62, y2: PBOT }));
      for (var gy = 1; gy < 4; gy++) grid.appendChild(el('line', { x1: 52, y1: PTOP + gy * 39, x2: SX1, y2: PTOP + gy * 39 }));

      // traces + in-plot legend + table rows
      var tg = id('dqTraces'), rows = id('dqRows'), lx = 60;
      CH.forEach(function (ch, i) {
        ch.buf = []; ch.mn = null; ch.mx = null;
        tg.appendChild(el('path', { id: 'dqTr' + i, fill: 'none', stroke: ch.col, 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', d: 'M52,264', opacity: 0.95 }));
        // legend chip
        tg.appendChild(el('circle', { cx: lx, cy: 196, r: 3, fill: ch.col }));
        var lt = el('text', { x: lx + 8, y: 199, fill: '#9E9E9E', 'font-size': 9 }, ch.name); tg.appendChild(lt);
        lx += ch.name.length * 5.6 + 26;
        // table row
        var y = ROWY[i];
        rows.appendChild(el('circle', { cx: 56, cy: y - 4, r: 3.5, fill: ch.col }));
        rows.appendChild(el('text', { x: 66, y: y, fill: '#CFD8DC' }, ch.name));
        rows.appendChild(el('text', { id: 'dqV' + i, x: 338, y: y, 'text-anchor': 'end', fill: ch.col, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, '\u2014'));
        rows.appendChild(el('text', { id: 'dqMn' + i, x: 446, y: y, 'text-anchor': 'end', fill: '#6b7780', 'font-size': 11 }, '\u2014'));
        rows.appendChild(el('text', { id: 'dqMx' + i, x: 550, y: y, 'text-anchor': 'end', fill: '#6b7780', 'font-size': 11 }, '\u2014'));
      });

      function valOf(ch, e, noise) { return ch.fn(e) + (noise ? (Math.random() - 0.5) * NOISE[CH.indexOf(ch)] : 0); }
      // pre-fill buffers
      CH.forEach(function (ch) { for (var k = 0; k < NPTS; k++) { var v = valOf(ch, -(NPTS - 1 - k) * 16, false); ch.buf.push(v); if (ch.mn == null || v < ch.mn) ch.mn = v; if (ch.mx == null || v > ch.mx) ch.mx = v; } });

      function drawCh(ch, i) {
        var n = ch.buf.length, d = '';
        for (var k = 0; k < n; k++) {
          var x = SX0 + (k / (NPTS - 1)) * (SX1 - SX0);
          var y = PBOT - (clamp(ch.buf[k], ch.rmin, ch.rmax) - ch.rmin) / (ch.rmax - ch.rmin) * (PBOT - PTOP);
          d += (k ? ' L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
        }
        id('dqTr' + i).setAttribute('d', d);
        var cur = ch.buf[n - 1];
        id('dqV' + i).textContent = cur.toFixed(ch.dec) + ' ' + ch.unit;
        id('dqMn' + i).textContent = ch.mn.toFixed(ch.dec);
        id('dqMx' + i).textContent = ch.mx.toFixed(ch.dec);
      }

      var sampBase = 1842304, RATE = 50 * CH.length, elapBase = 36 * 60 + 42;
      function render(e) {
        CH.forEach(function (ch, i) {
          var v = valOf(ch, e, true);
          ch.buf.push(v); if (ch.buf.length > NPTS) ch.buf.shift();
          if (v < ch.mn) ch.mn = v; if (v > ch.mx) ch.mx = v;
          drawCh(ch, i);
        });
        var secs = elapBase + e / 1000, p2 = function (n) { return (n < 10 ? '0' : '') + n; };
        var h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60);
        id('dqElapsed').textContent = 'ELAPSED ' + p2(h) + ':' + p2(m) + ':' + p2(s);
        id('dqSamples').textContent = grp(sampBase + (e / 1000) * RATE);
        id('dqRec').setAttribute('opacity', (0.45 + 0.55 * Math.abs(Math.sin(e / 520))).toFixed(2));
      }

      // ── stop / re-arm ──
      var stopped = false;
      function abort() {
        if (stopped) return; stopped = true;
        id('dqBanner').setAttribute('fill', 'rgba(96,125,139,0.08)'); id('dqBanner').setAttribute('stroke', C.gmut);
        id('dqState').textContent = 'STOPPED'; id('dqState').setAttribute('fill', C.gmut);
        id('dqRec').setAttribute('fill', C.gmut); id('dqRec').setAttribute('opacity', '1');
        setStopBtn(false); setTimeout(rearm, 2600);
      }
      function rearm() { stopped = false; if (!mqDesktop.matches) return; t0 = null; id('dqState').textContent = 'ACQUIRING'; id('dqState').setAttribute('fill', C.green); id('dqBanner').setAttribute('fill', 'rgba(121,197,166,0.10)'); id('dqBanner').setAttribute('stroke', C.green); id('dqRec').setAttribute('fill', C.red); setStopBtn(true); startLoop(); }
      function setStopBtn(on) {
        var col = on ? C.red : C.queue, g = id('dqStop');
        id('dqStopBox').setAttribute('stroke', col); id('dqStopBox').setAttribute('opacity', on ? '1' : '0.5');
        id('dqStopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        id('dqStopTxt').setAttribute('fill', col); id('dqStopIcon').setAttribute('fill', col);
        g.style.pointerEvents = on ? 'auto' : 'none'; g.style.cursor = on ? 'pointer' : 'default';
      }
      id('dqStop').addEventListener('click', abort);
      setStopBtn(true);

      var mqDesktop = window.matchMedia('(min-width: 1081px)');
      if (reduce) { if (mqDesktop.matches) render(0); return; }

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
