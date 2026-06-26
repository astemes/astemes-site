/* Astemes "Board Calibration" — animated hero instrument panel (measurement-cal variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A multi-channel measurement board (AS544 DAQ) is calibrated
   against a traceable reference: for each channel the routine sweeps reference setpoints across the
   input range, measures the DUT, plots the deviation (mV) vs input, fits gain + offset, then applies
   the correction so residuals drop inside the tolerance band — channel VERIFIED. Then the next
   channel, cycling CH0..CH3. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', red:'#B07A7A', redtx:'#D69191' };

  // per-channel true error: gain error (%) and offset (mV)
  var CH = [
    { g: 0.31, o: 8 }, { g: -0.18, o: -5 }, { g: 0.42, o: 3 }, { g: 0.12, o: -9 }
  ];
  var NCH = CH.length, SP = [-10, -5, 0, 5, 10], NP = SP.length;
  var SPP = 440, T_FIT = 650, T_CORR = 1150, T_PASS = 800;
  var T_SWEEP = NP * SPP, CHDUR = T_SWEEP + T_FIT + T_CORR + T_PASS, HOLD = 700;

  // plot geometry — deviation (mV) vs reference input (V)
  var GX0 = 80, GX1 = 372, GTOP = 200, GBOT = 362, GMID = (GTOP + GBOT) / 2;
  var EMAX = 60, TOL = 10, XMAX = 10;
  function gx(v) { return GX0 + (v + XMAX) / (2 * XMAX) * (GX1 - GX0); }
  function gy(mv) { return GMID - (mv / EMAX) * ((GBOT - GTOP) / 2); }

  var SVG =
  `<svg id="cbPanel" viewBox="0 0 600 560" role="img"
        aria-label="A measurement-board calibration: a deviation-versus-input error plot with a green tolerance band. For each channel the routine sweeps reference setpoints, plots the measured deviation, fits gain and offset, and applies a correction so the residual errors fall inside tolerance and the channel is verified."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">BOARD CALIBRATION</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">DUT BOARD</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">AS544 DAQ &#183; 16-bit</text>
      <text x="232" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">REFERENCE</text>
      <text x="232" y="100" fill="#CFD8DC" font-size="13">Fluke 5522A</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">PROCEDURE</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">Gain + Offset</text>

      <!-- status banner -->
      <rect id="cbBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(216,166,87,0.10)" stroke="#D8A657" stroke-width="1.5"/>
      <g id="cbSpin" transform="rotate(0 54 147)">
        <circle cx="54" cy="147" r="11" fill="none" stroke="#D8A657" stroke-width="3" stroke-linecap="round" stroke-dasharray="52 70"/>
      </g>
      <path id="cbChk" d="M47 147l5 6 12-15" fill="none" stroke="#79C5A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      <text id="cbState" x="80" y="156" fill="#D8A657" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">CALIBRATING</text>
      <text id="cbSub1" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">CH0 &#183; POINT 1 / 5</text>
      <text id="cbSub2" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">applying +10.000 V</text>

      <!-- plot -->
      <text x="40" y="190" fill="#9E9E9E" font-size="9" letter-spacing="1.5">DEVIATION vs INPUT</text>
      <text x="552" y="190" text-anchor="end" fill="#6b7780" font-size="9">mV</text>
      <rect x="52" y="196" width="332" height="172" rx="4" fill="#0d1417" stroke="#34424b"/>
      <g id="cbGrid"></g>
      <rect id="cbTol" x="${GX0}" y="${gy(TOL)}" width="${GX1 - GX0}" height="${gy(-TOL) - gy(TOL)}" fill="rgba(121,197,166,0.09)"/>
      <line x1="${GX0}" y1="${gy(TOL)}" x2="${GX1}" y2="${gy(TOL)}" stroke="rgba(121,197,166,0.3)" stroke-dasharray="3 3"/>
      <line x1="${GX0}" y1="${gy(-TOL)}" x2="${GX1}" y2="${gy(-TOL)}" stroke="rgba(121,197,166,0.3)" stroke-dasharray="3 3"/>
      <line x1="${GX0}" y1="${GMID}" x2="${GX1}" y2="${GMID}" stroke="rgba(96,125,139,0.45)"/>
      <line x1="${GX0}" y1="${GTOP}" x2="${GX0}" y2="${GBOT}" stroke="rgba(96,125,139,0.3)"/>
      <text x="74" y="${gy(50) + 3}" text-anchor="end" fill="#54636b" font-size="8">+50</text>
      <text x="74" y="${GMID + 3}" text-anchor="end" fill="#54636b" font-size="8">0</text>
      <text x="74" y="${gy(-50) + 3}" text-anchor="end" fill="#54636b" font-size="8">&#8722;50</text>
      <text x="${GX0}" y="376" text-anchor="middle" fill="#54636b" font-size="8">&#8722;10V</text>
      <text x="${gx(0)}" y="376" text-anchor="middle" fill="#54636b" font-size="8">0</text>
      <text x="${GX1}" y="376" text-anchor="middle" fill="#54636b" font-size="8">+10V</text>
      <line id="cbFit" x1="${GX0}" y1="${GMID}" x2="${GX1}" y2="${GMID}" stroke="#D8A657" stroke-width="1.6" stroke-dasharray="5 3" opacity="0"/>
      <g id="cbPts"></g>

      <!-- right readout column -->
      <text x="404" y="206" fill="#9E9E9E" font-size="9" letter-spacing="1.2">REFERENCE</text>
      <text id="cbRef" x="404" y="226" fill="#7EA6D6" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">+10.000 V</text>
      <text x="404" y="250" fill="#9E9E9E" font-size="9" letter-spacing="1.2">DUT MEASURED</text>
      <text id="cbMeas" x="404" y="270" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">+10.039 V</text>
      <text x="404" y="294" fill="#9E9E9E" font-size="9" letter-spacing="1.2">DEVIATION</text>
      <text id="cbDev" x="404" y="314" fill="#D8A657" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">+39.0 mV</text>
      <line x1="404" y1="328" x2="556" y2="328" stroke="rgba(96,125,139,0.25)"/>
      <text x="404" y="346" fill="#9E9E9E" font-size="9" letter-spacing="1.2">GAIN</text>
      <text id="cbGain" x="556" y="346" text-anchor="end" fill="#CFD8DC" font-size="13" font-family="'DM Mono',monospace">&#8212;</text>
      <text x="404" y="364" fill="#9E9E9E" font-size="9" letter-spacing="1.2">OFFSET</text>
      <text id="cbOff" x="556" y="364" text-anchor="end" fill="#CFD8DC" font-size="13" font-family="'DM Mono',monospace">&#8212;</text>

      <!-- channel chips -->
      <text x="40" y="402" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CHANNELS</text>
      <g id="cbChips"></g>

      <!-- metrics -->
      <g>
        <text x="48"  y="430" fill="#9E9E9E" font-size="9" letter-spacing="1.2">POINTS</text>
        <text id="cbMPts" x="48"  y="450" fill="#CFD8DC" font-size="16" font-family="'Space Grotesk',sans-serif" font-weight="600">0 / 5</text>
        <text x="170" y="430" fill="#9E9E9E" font-size="9" letter-spacing="1.2">RESIDUAL</text>
        <text id="cbMRes" x="170" y="450" fill="#CFD8DC" font-size="16" font-family="'Space Grotesk',sans-serif" font-weight="600">&#8212;</text>
        <text x="312" y="430" fill="#9E9E9E" font-size="9" letter-spacing="1.2">TOLERANCE</text>
        <text id="cbMTol" x="312" y="450" fill="#CFD8DC" font-size="16" font-family="'Space Grotesk',sans-serif" font-weight="600">&#177;10<tspan font-size="9" font-family="'DM Mono',monospace" fill="#6b7780"> mV</tspan></text>
        <text x="450" y="430" fill="#9E9E9E" font-size="9" letter-spacing="1.2">VERIFIED</text>
        <text id="cbMVer" x="450" y="450" fill="#79C5A6" font-size="16" font-family="'Space Grotesk',sans-serif" font-weight="600">0 / 4</text>
      </g>

      <path d="M32 466H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text id="cbFoot" x="40" y="492" fill="#9E9E9E" font-size="12">CERT TRACE-2024-1187 &#183; 23.1 &#176;C &#183; NIST traceable</text>
    </svg>`;

  function boot() {
    var mount = document.querySelector('.hero-visual');
    if (!mount || mount.querySelector('#cbPanel')) return;
    mount.innerHTML = SVG;

    (function () {
      var panel = document.getElementById('cbPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      var lerp = function (a, b, t) { return a + (b - a) * t; };
      var sgn = function (n, d) { return (n >= 0 ? '+' : '\u2212') + Math.abs(n).toFixed(d); };

      // grid verticals at setpoints
      var g = id('cbGrid');
      SP.forEach(function (v) { g.appendChild(el('line', { x1: gx(v), y1: GTOP, x2: gx(v), y2: GBOT, stroke: 'rgba(96,125,139,0.10)', 'stroke-width': 1 })); });

      // point circles (raw/corrected reused)
      var ptsG = id('cbPts'), dot = [];
      for (var i = 0; i < NP; i++) { var cdot = el('circle', { cx: gx(SP[i]), cy: GMID, r: 4, fill: C.amber, opacity: 0, stroke: '#0d1417', 'stroke-width': 1 }); ptsG.appendChild(cdot); dot[i] = cdot; }

      // channel chips
      var chipsG = id('cbChips'), chip = [], cx = 120;
      for (var c2 = 0; c2 < NCH; c2++) {
        var w = 42;
        var box = el('rect', { x: cx, y: 391, width: w, height: 16, rx: 4, fill: 'none', stroke: '#3a4750' });
        var tx = el('text', { x: cx + w / 2, y: 402, 'text-anchor': 'middle', 'font-size': 9, fill: '#6b7780', 'font-family': "'DM Mono',monospace" });
        tx.textContent = 'CH' + c2;
        chipsG.appendChild(box); chipsG.appendChild(tx); chip[c2] = { box: box, tx: tx }; cx += w + 8;
      }

      // ── per-channel point data (built on channel change) ──
      var curCh = -1, pts = [], gainErr = 0, offErr = 0, resMax = 0, verified = 0;
      function buildChannel(ci) {
        var d = CH[ci]; gainErr = d.g; offErr = d.o; pts = [];
        for (var i = 0; i < NP; i++) {
          var raw = d.g * 10 * SP[i] + d.o + (Math.random() - 0.5) * 2.0;   // mV
          var res = (Math.random() - 0.5) * 3.2;                            // corrected residual mV
          pts.push({ xv: SP[i], raw: raw, res: res });
        }
        resMax = pts.reduce(function (m, p) { return Math.max(m, Math.abs(p.res)); }, 0);
      }

      var lastBn = '';
      function render(c, e) {
        var ci = Math.floor(c / CHDUR) % NCH, local = c - Math.floor(c / CHDUR) * CHDUR;
        if (ci !== curCh) { curCh = ci; buildChannel(ci); verified = Math.floor(c / CHDUR) >= NCH ? NCH : ci; }

        var phase, pIdx = NP, corrT = 0, pp = 0;
        if (local < T_SWEEP) { phase = 'sweep'; pIdx = Math.floor(local / SPP); pp = (local % SPP) / SPP; }
        else if (local < T_SWEEP + T_FIT) { phase = 'fit'; }
        else if (local < T_SWEEP + T_FIT + T_CORR) { phase = 'corr'; corrT = (local - T_SWEEP - T_FIT) / T_CORR; }
        else { phase = 'pass'; }

        var revealed = phase === 'sweep' ? pIdx + (pp > 0.45 ? 1 : 0) : NP;   // points measured so far

        // draw points
        for (var i = 0; i < NP; i++) {
          var shown = i < revealed;
          dot[i].setAttribute('opacity', shown ? '1' : '0');
          var ry, col;
          if (phase === 'corr' || phase === 'pass') {
            var t = phase === 'pass' ? 1 : clamp(corrT * 1.2 - i * 0.04, 0, 1);
            ry = gy(lerp(pts[i].raw, pts[i].res, t));
            col = t > 0.6 ? C.green : C.amber;
          } else { ry = gy(pts[i].raw); col = C.amber; }
          dot[i].setAttribute('cy', ry.toFixed(1));
          dot[i].setAttribute('fill', col);
          var active = phase === 'sweep' && i === pIdx && shown;
          dot[i].setAttribute('r', active ? (4 + 1.4 * Math.abs(Math.sin(e / 120))).toFixed(1) : '4');
        }

        // fit line (gain/offset) shown from fit phase on; hidden during corr->pass fade
        var fitOn = (phase === 'fit' || phase === 'corr');
        id('cbFit').setAttribute('opacity', fitOn ? (phase === 'corr' ? (1 - corrT).toFixed(2) : '1') : '0');
        if (fitOn) { id('cbFit').setAttribute('y1', gy(gainErr * 10 * (-XMAX) + offErr).toFixed(1)); id('cbFit').setAttribute('y2', gy(gainErr * 10 * XMAX + offErr).toFixed(1)); }

        // readouts
        var refV, measV, devMv;
        if (phase === 'sweep') {
          refV = SP[clamp(pIdx, 0, NP - 1)];
          devMv = pts[clamp(pIdx, 0, NP - 1)].raw;
          measV = refV + devMv / 1000;
          var settling = pp < 0.35;
          id('cbRef').textContent = sgn(refV, 3) + ' V';
          id('cbMeas').textContent = settling ? 'settling\u2026' : sgn(measV, 3) + ' V';
          id('cbMeas').setAttribute('fill', settling ? C.amber : C.light);
          id('cbDev').textContent = settling ? '\u2014' : sgn(devMv, 1) + ' mV';
          id('cbDev').setAttribute('fill', Math.abs(devMv) > TOL ? C.amber : C.green);
        } else if (phase === 'fit' || phase === 'corr') {
          id('cbRef').textContent = 'fitting\u2026';
          id('cbMeas').textContent = 'y = g\u00B7x + b';
          id('cbMeas').setAttribute('fill', C.mut);
          id('cbDev').textContent = phase === 'corr' ? 'correcting' : 'computing';
          id('cbDev').setAttribute('fill', C.blue);
        } else {
          id('cbRef').textContent = 'CH' + ci + ' OK';
          id('cbRef').setAttribute('fill', C.green);
          id('cbMeas').textContent = 'within tol';
          id('cbMeas').setAttribute('fill', C.green);
          id('cbDev').textContent = sgn(resMax, 1) + ' mV';
          id('cbDev').setAttribute('fill', C.green);
        }
        if (phase === 'sweep') id('cbRef').setAttribute('fill', C.blue);

        // coefficients (revealed once fit computed)
        var coefOn = phase !== 'sweep';
        id('cbGain').textContent = coefOn ? (1 + gainErr / 100).toFixed(5) : '\u2014';
        id('cbGain').setAttribute('fill', coefOn ? C.light : C.mut);
        id('cbOff').textContent = coefOn ? sgn(offErr, 1) + ' mV' : '\u2014';
        id('cbOff').setAttribute('fill', coefOn ? C.light : C.mut);

        // chips
        for (var k = 0; k < NCH; k++) {
          var st = k < ci ? 'done' : (k === ci ? (phase === 'pass' ? 'done' : 'active') : 'todo');
          var col2 = st === 'done' ? C.green : st === 'active' ? C.amber : '#3a4750';
          chip[k].box.setAttribute('stroke', col2);
          chip[k].box.setAttribute('fill', st === 'done' ? 'rgba(121,197,166,0.12)' : st === 'active' ? 'rgba(216,166,87,0.16)' : 'none');
          chip[k].tx.setAttribute('fill', st === 'todo' ? C.mut : C.light);
        }

        // metrics
        id('cbMPts').textContent = Math.min(revealed, NP) + ' / ' + NP;
        id('cbMRes').textContent = (phase === 'corr' || phase === 'pass') ? sgn(resMax, 1) + ' mV' : '\u2014';
        id('cbMRes').setAttribute('fill', (phase === 'corr' || phase === 'pass') ? (resMax < TOL ? C.green : C.amber) : C.mut);
        var vDone = ci + (phase === 'pass' ? 1 : 0);
        id('cbMVer').textContent = vDone + ' / ' + NCH;

        // banner
        var key = phase + ci;
        if (key !== lastBn) {
          lastBn = key;
          var bcol = phase === 'pass' ? C.green : phase === 'corr' ? C.blue : C.amber;
          var bg = phase === 'pass' ? 'rgba(121,197,166,0.12)' : phase === 'corr' ? 'rgba(126,166,214,0.10)' : 'rgba(216,166,87,0.10)';
          id('cbBanner').setAttribute('stroke', bcol); id('cbBanner').setAttribute('fill', bg);
          id('cbState').textContent = phase === 'pass' ? 'CH' + ci + ' VERIFIED' : phase === 'corr' ? 'APPLYING CORRECTION' : phase === 'fit' ? 'COMPUTING FIT' : 'CALIBRATING';
          id('cbState').setAttribute('fill', bcol);
          id('cbSpin').setAttribute('opacity', phase === 'pass' ? '0' : '1');
          id('cbChk').setAttribute('opacity', phase === 'pass' ? '1' : '0');
        }
        id('cbSub1').textContent = 'CH' + ci + ' \u00B7 ' + (phase === 'sweep' ? 'POINT ' + Math.min(pIdx + 1, NP) + ' / ' + NP : phase === 'pass' ? 'PASS' : phase.toUpperCase());
        id('cbSub2').textContent = phase === 'sweep' ? 'applying ' + sgn(SP[clamp(pIdx, 0, NP - 1)], 3) + ' V' : phase === 'pass' ? 'residual ' + sgn(resMax, 1) + ' mV' : 'least-squares fit';
        if (phase !== 'pass') id('cbSpin').setAttribute('transform', 'rotate(' + ((e * 0.4) % 360).toFixed(1) + ' 54 147)');
      }

      var mqDesktop = window.matchMedia('(min-width: 1081px)');
      if (reduce) { if (mqDesktop.matches) { buildChannel(0); render(T_SWEEP + T_FIT + T_CORR + 300, 0); } return; }

      var t0 = null, ticking = false;
      function frame(ts) {
        if (!mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        var e = ts - t0, c = e % (CHDUR * NCH + HOLD);
        render(c, e);
        requestAnimationFrame(frame);
      }
      function startLoop() { if (ticking || !mqDesktop.matches) return; ticking = true; t0 = null; requestAnimationFrame(frame); }
      if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', startLoop);
      else if (mqDesktop.addListener) mqDesktop.addListener(startLoop);
      startLoop();
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
