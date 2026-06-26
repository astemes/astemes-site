/* Astemes "Motor Test Cell" — animated hero instrument panel (dynamometer variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A motor under test is coupled to a dyno load that simulates a
   sequence of operating conditions (idle, cruise, acceleration, peak load, regen, high speed). The
   operating point travels across a torque-speed map inside the safe operating area; periodically a
   fault is inserted (phase imbalance, bearing, overload, over-temperature, encoder) and the rig
   responds — vibration spikes, thermal derate, or an overload trip. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A', redtx:'#D69191' };

  // torque-speed map geometry
  var MX0 = 64, MX1 = 540, MY0 = 190, MY1 = 344, MYZ = 267, SMAX = 6000, TMAX = 120;
  var TBASE = 2400, TCONT = 112;   // base speed + continuous-torque limit (envelope)
  var DWELL = 2600;

  var CONDS = [
    { n: 'Idle',         ab: 'Idle',  s: 800,  t: 6 },
    { n: 'City Cruise',  ab: 'Cruise', s: 2600, t: 40 },
    { n: 'Acceleration', ab: 'Accel', s: 4200, t: 92 },
    { n: 'Peak Load',    ab: 'Peak',  s: 2000, t: 108 },
    { n: 'Regen Brake',  ab: 'Regen', s: 3000, t: -72 },
    { n: 'High Speed',   ab: 'Top Spd', s: 5600, t: 34 }
  ];
  var FAULTS = ['Phase Imbalance', 'Bearing Fault', 'Overload', 'Over-Temperature', 'Encoder Fault'];
  var CYCLE = CONDS.length * DWELL;

  function mapX(s) { return MX0 + (s / SMAX) * (MX1 - MX0); }
  function mapY(t) { return MYZ - (t / TMAX) * (MYZ - MY0); }
  function envT(s) { return s <= TBASE ? TCONT : TCONT * TBASE / s; }   // motoring torque envelope

  var SVG =
  `<svg id="mtPanel" viewBox="0 0 600 560" role="img"
        aria-label="A motor test cell on a dynamometer: a motor under test is loaded through a sequence of operating conditions while its operating point travels across a torque-speed map, with live speed, torque, power, winding-temperature and vibration gauges, and periodic fault insertion."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <!-- panel -->
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">MOTOR TEST CELL</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- header info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">UUT MOTOR</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">PMSM &#183; 80 kW</text>
      <text x="262" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">DYNO</text>
      <text x="262" y="100" fill="#CFD8DC" font-size="13">AC &#183; 4-quadrant</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">PROFILE</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">WLTP-mix</text>

      <!-- status banner -->
      <rect id="mtBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(121,197,166,0.10)" stroke="#79C5A6" stroke-width="1.5"/>
      <circle id="mtDot" cx="54" cy="147" r="7" fill="#79C5A6"/>
      <path id="mtWarn" d="M54 134l13 23H41Z" fill="none" stroke="#D8A657" stroke-width="2.4" stroke-linejoin="round" opacity="0"/>
      <text id="mtWarnEx" x="54" y="153" text-anchor="middle" fill="#D8A657" font-size="13" font-weight="700" opacity="0">!</text>
      <text id="mtState" x="80" y="156" fill="#79C5A6" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">RUNNING</text>
      <text id="mtSub1" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">CONDITION: CITY CRUISE</text>
      <text id="mtSub2" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">2600 rpm &#183; 40 Nm &#183; &#951; 94%</text>

      <!-- torque-speed map -->
      <text x="40" y="186" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">TORQUE-SPEED MAP</text>
      <text x="540" y="186" text-anchor="end" fill="#6b7780" font-size="9">OPERATING POINT</text>
      <rect x="44" y="190" width="512" height="154" rx="4" fill="#0d1417" stroke="#34424b"/>
      <g id="mtGrid" stroke="rgba(96,125,139,0.10)" stroke-width="1"></g>
      <line x1="64" y1="267" x2="540" y2="267" stroke="rgba(96,125,139,0.34)"/>
      <path id="mtSOA" fill="rgba(121,197,166,0.05)" stroke="none"/>
      <path id="mtEnv" fill="none" stroke="rgba(121,197,166,0.4)" stroke-width="1.2" stroke-dasharray="4 4"/>
      <text x="70" y="202" fill="rgba(207,216,220,0.34)" font-size="8" letter-spacing="1">MOTORING</text>
      <text x="70" y="338" fill="rgba(207,216,220,0.34)" font-size="8" letter-spacing="1">REGEN</text>
      <text x="540" y="357" text-anchor="end" fill="#6b7780" font-size="8.5">6000 rpm</text>
      <text x="64" y="357" fill="#6b7780" font-size="8.5">0</text>
      <path id="mtTrail" fill="none" stroke="#D8A657" stroke-width="1.4" stroke-opacity="0.5" stroke-linejoin="round" d="M64,267"/>
      <line id="mtOpV" x1="300" y1="190" x2="300" y2="344" stroke="rgba(216,166,87,0.25)" stroke-width="1" stroke-dasharray="2 3"/>
      <circle id="mtOp" cx="300" cy="240" r="5.5" fill="#D8A657" stroke="#0d1417" stroke-width="1.5"/>

      <!-- gauges -->
      <g>
        <text x="48"  y="372" fill="#9E9E9E" font-size="9" letter-spacing="1.2">SPEED</text>
        <text id="mtSpd" x="48"  y="394" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">2600<tspan font-size="10" font-family="'DM Mono',monospace" fill="#6b7780"> rpm</tspan></text>
        <text x="158" y="372" fill="#9E9E9E" font-size="9" letter-spacing="1.2">TORQUE</text>
        <text id="mtTrq" x="158" y="394" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">40<tspan font-size="10" font-family="'DM Mono',monospace" fill="#6b7780"> Nm</tspan></text>
        <text x="268" y="372" fill="#9E9E9E" font-size="9" letter-spacing="1.2">POWER</text>
        <text id="mtPwr" x="268" y="394" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">10.9<tspan font-size="10" font-family="'DM Mono',monospace" fill="#6b7780"> kW</tspan></text>
        <text x="372" y="372" fill="#9E9E9E" font-size="9" letter-spacing="1.2">WINDING</text>
        <text id="mtTmp" x="372" y="394" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">82<tspan font-size="10" font-family="'DM Mono',monospace" fill="#6b7780"> &#176;C</tspan></text>
        <text x="476" y="372" fill="#9E9E9E" font-size="9" letter-spacing="1.2">VIBRATION</text>
        <text id="mtVib" x="476" y="394" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">1.8<tspan font-size="10" font-family="'DM Mono',monospace" fill="#6b7780"> mm/s</tspan></text>
      </g>

      <!-- profile chips + fault insertion -->
      <text x="40" y="420" fill="#9E9E9E" font-size="9" letter-spacing="1.5">LOAD PROFILE</text>
      <g id="mtChips"></g>
      <text x="40" y="448" fill="#9E9E9E" font-size="9" letter-spacing="1.5">FAULT INSERTION</text>
      <text id="mtFault" x="148" y="448" fill="#79C5A6" font-size="11" letter-spacing="0.5">NONE \u00B7 NOMINAL</text>

      <!-- footer -->
      <path d="M32 462H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text id="mtRuntime" x="40" y="500" fill="#9E9E9E" font-size="12">RUNTIME 01:42:18 &#183; CYCLE 14</text>
      <g id="mtStop">
        <rect id="mtStopBox" x="448" y="484" width="112" height="32" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="mtStopIcon" x="472" y="492" width="14" height="14" rx="2" fill="#B07A7A"/>
        <text id="mtStopTxt" x="494" y="504" fill="#B07A7A" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP</text>
      </g>
    </svg>`;

  function boot() {
    var mount = document.querySelector('.hero-visual');
    if (!mount || mount.querySelector('#mtPanel')) return;
    mount.innerHTML = SVG;

    (function () {
      var panel = document.getElementById('mtPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };

      // grid
      var g = id('mtGrid');
      for (var gx = 1; gx < 6; gx++) g.appendChild(el('line', { x1: MX0 + gx * (MX1 - MX0) / 6, y1: MY0, x2: MX0 + gx * (MX1 - MX0) / 6, y2: MY1 }));
      // envelope + SOA region
      var top = '', bot = '';
      for (var s = 0; s <= SMAX; s += 150) { top += (s === 0 ? 'M' : ' L') + mapX(s).toFixed(1) + ',' + mapY(envT(s)).toFixed(1); }
      for (var s2 = SMAX; s2 >= 0; s2 -= 150) { bot += ' L' + mapX(s2).toFixed(1) + ',' + mapY(-0.92 * envT(s2)).toFixed(1); }
      id('mtEnv').setAttribute('d', top + ' M' + mapX(0) + ',' + mapY(-0.92 * envT(0)) + bot.replace(' L', ' L'));
      id('mtSOA').setAttribute('d', top + bot + ' Z');

      // chips
      var chipsG = id('mtChips'), chip = [], cx = 132;
      CONDS.forEach(function (cd, i) {
        var w = cd.ab.length * 6.4 + 16;
        var box = el('rect', { id: 'mtCb' + i, x: cx, y: 410, width: w, height: 16, rx: 8, fill: 'none', stroke: '#3a4750' });
        var tx = el('text', { id: 'mtCt' + i, x: cx + w / 2, y: 421, 'text-anchor': 'middle', 'font-size': 9, fill: '#6b7780' }, cd.ab);
        chipsG.appendChild(box); chipsG.appendChild(tx); chip[i] = { box: box, tx: tx };
        cx += w + 6;
      });

      // ── state ──
      var op = { x: 800, y: 6 }, trail = [], tempC = 72, vib = 1.8, runtimeBase = 1 * 3600 + 42 * 60 + 18;
      var cycleN = 14, condIdx = -1, curFault = null, tripped = false, lastEl = 0;
      function rollFault() {
        if (Math.random() < 0.45) { curFault = { kind: FAULTS[Math.floor(Math.random() * FAULTS.length)] }; }
        else curFault = null;
        tripped = false;
      }

      var lastBn = '';
      function render(c, e) {
        var dt = clamp(e - lastEl, 0, 60); lastEl = e;
        var ci = Math.floor(c / DWELL) % CONDS.length, fc = (c % DWELL) / DWELL;
        if (ci !== condIdx) { condIdx = ci; rollFault(); }
        var cd = CONDS[ci], tspd = cd.s, ttrq = cd.t;

        // fault effects
        var active = curFault && fc > 0.3 && fc < 0.94, kind = curFault && curFault.kind;
        var trip = false, vibTarget = 1.4 + (cd.s / SMAX) * 1.2, heatMul = 1, ripT = 0, spdNoise = 0, derate = false;
        if (active) {
          if (kind === 'Overload') { ttrq = (cd.t >= 0 ? 1 : -1) * (Math.abs(cd.t) + 30); if (fc > 0.66) { trip = true; } }
          else if (kind === 'Over-Temperature') { heatMul = 3.4; if (tempC > 150) { derate = true; ttrq *= 0.55; } }
          else if (kind === 'Bearing Fault') { vibTarget = 11 + 2 * Math.sin(e / 40); heatMul = 1.5; ripT = 4 * Math.sin(e / 30); }
          else if (kind === 'Phase Imbalance') { ripT = 9 * Math.sin(e / 28); vibTarget += 3; }
          else if (kind === 'Encoder Fault') { spdNoise = 240 * Math.sin(e / 22); }
        }
        if (trip && active) tripped = true;
        if (tripped) { ttrq = 0; tspd = Math.max(0, op.x - 40); }

        // ease operating point toward target
        op.x += (tspd - op.x) * 0.10;
        op.y += (ttrq - op.y) * 0.12;
        var dispS = clamp(op.x + spdNoise, 0, SMAX), dispT = clamp(op.y + ripT, -TMAX, TMAX);

        // winding temperature integration
        tempC += dt * (0.06 * Math.pow(Math.abs(op.y) / 100, 2) * heatMul - 0.0012 * (tempC - 40));
        tempC = clamp(tempC, 40, 168);
        vib += (vibTarget - vib) * 0.12;

        // map marker + trail
        var px = mapX(dispS), py = mapY(dispT);
        var outSOA = Math.abs(dispT) > envT(dispS) * 1.02;
        var mkCol = tripped ? C.red : (active ? C.amber : C.green);
        if (outSOA && !tripped) mkCol = C.red;
        id('mtOp').setAttribute('cx', px.toFixed(1)); id('mtOp').setAttribute('cy', py.toFixed(1)); id('mtOp').setAttribute('fill', mkCol);
        id('mtOpV').setAttribute('x1', px.toFixed(1)); id('mtOpV').setAttribute('x2', px.toFixed(1));
        trail.push(px.toFixed(1) + ',' + py.toFixed(1)); if (trail.length > 64) trail.shift();
        id('mtTrail').setAttribute('d', 'M' + trail.join(' L'));
        id('mtTrail').setAttribute('stroke', tripped ? C.red : C.amber);

        // gauges
        var pwr = 2 * Math.PI * dispS * dispT / 60000;
        function tile(elid, val, unit, col) { id(elid).innerHTML = val + '<tspan font-size="10" font-family="\'DM Mono\',monospace" fill="#6b7780"> ' + unit + '</tspan>'; id(elid).setAttribute('fill', col); }
        tile('mtSpd', Math.round(dispS), 'rpm', spdNoise ? C.amber : C.light);
        tile('mtTrq', Math.round(dispT), 'Nm', outSOA ? C.redtx : C.light);
        tile('mtPwr', pwr.toFixed(1), 'kW', C.light);
        tile('mtTmp', Math.round(tempC), '\u00B0C', tempC > 155 ? C.redtx : tempC > 140 ? C.amber : C.light);
        tile('mtVib', vib.toFixed(1), 'mm/s', vib > 9 ? C.redtx : vib > 6 ? C.amber : C.light);

        // efficiency (banner)
        var eff = clamp(95 - Math.abs(op.y) * 0.02 - (op.x < 1000 ? 4 : 0) - (active ? 4 : 0), 70, 96);

        // chips
        for (var k = 0; k < CONDS.length; k++) {
          var on = k === ci;
          chip[k].box.setAttribute('stroke', on ? C.amber : '#3a4750');
          chip[k].box.setAttribute('fill', on ? 'rgba(216,166,87,0.16)' : 'none');
          chip[k].tx.setAttribute('fill', on ? C.amber : C.mut);
        }

        // fault line
        var fEl = id('mtFault');
        if (tripped) { fEl.textContent = (curFault.kind).toUpperCase() + ' \u00B7 TRIPPED'; fEl.setAttribute('fill', C.redtx); }
        else if (active) { fEl.textContent = curFault.kind.toUpperCase() + (derate ? ' \u00B7 THERMAL DERATE' : ' \u00B7 INSERTED'); fEl.setAttribute('fill', C.amber); }
        else if (curFault) { fEl.textContent = curFault.kind.toUpperCase() + ' \u00B7 ARMED'; fEl.setAttribute('fill', C.mut); }
        else { fEl.textContent = 'NONE \u00B7 NOMINAL'; fEl.setAttribute('fill', C.green); }

        // banner
        var st = tripped ? 'trip' : active ? 'fault' : 'run';
        var key = st + ci + (tripped ? 't' : '');
        if (key !== lastBn) {
          lastBn = key;
          var col = st === 'run' ? C.green : st === 'fault' ? C.amber : C.red;
          var bg = st === 'run' ? 'rgba(121,197,166,0.10)' : st === 'fault' ? 'rgba(216,166,87,0.10)' : 'rgba(176,122,122,0.12)';
          id('mtBanner').setAttribute('fill', bg); id('mtBanner').setAttribute('stroke', col);
          id('mtState').textContent = tripped ? 'PROTECTION TRIP' : active ? 'FAULT INSERTED' : 'RUNNING';
          id('mtState').setAttribute('fill', col);
          id('mtSub1').textContent = (active || tripped) ? 'DYNO LOAD \u00B7 ' + curFault.kind.toUpperCase() : 'CONDITION: ' + cd.n.toUpperCase();
          var faultish = active || tripped;
          id('mtDot').setAttribute('opacity', faultish ? '0' : '1'); id('mtDot').setAttribute('fill', col);
          id('mtWarn').setAttribute('opacity', faultish ? '1' : '0'); id('mtWarn').setAttribute('stroke', tripped ? C.red : C.amber);
          id('mtWarnEx').setAttribute('opacity', faultish ? '1' : '0'); id('mtWarnEx').setAttribute('fill', tripped ? C.redtx : C.amber);
        }
        id('mtSub2').textContent = Math.round(dispS) + ' rpm \u00B7 ' + Math.round(dispT) + ' Nm \u00B7 \u03B7 ' + eff.toFixed(0) + '%';

        var secs = runtimeBase + e / 1000, p2 = function (n) { return (n < 10 ? '0' : '') + n; };
        id('mtRuntime').textContent = 'RUNTIME ' + p2(Math.floor(secs / 3600)) + ':' + p2(Math.floor(secs / 60) % 60) + ':' + p2(Math.floor(secs) % 60) + ' \u00B7 CYCLE ' + cycleN;
        id('mtDot').setAttribute('opacity', (active || tripped) ? '0' : (0.5 + 0.5 * Math.abs(Math.sin(e / 240))).toFixed(2));
      }

      // ── stop / re-arm ──
      var stopped = false;
      function abort() {
        if (stopped) return; stopped = true; lastBn = '';
        id('mtBanner').setAttribute('fill', 'rgba(96,125,139,0.08)'); id('mtBanner').setAttribute('stroke', C.gmut);
        id('mtState').textContent = 'STOPPED'; id('mtState').setAttribute('fill', C.gmut);
        id('mtWarn').setAttribute('opacity', '0'); id('mtWarnEx').setAttribute('opacity', '0');
        id('mtDot').setAttribute('opacity', '1'); id('mtDot').setAttribute('fill', C.gmut);
        setStopBtn(false); setTimeout(rearm, 2400);
      }
      function rearm() { stopped = false; if (!mqDesktop.matches) return; lastBn = ''; condIdx = -1; t0 = null; lastC = 0; lastEl = 0; setStopBtn(true); startLoop(); }
      function setStopBtn(on) {
        var col = on ? C.red : C.queue, gg = id('mtStop');
        id('mtStopBox').setAttribute('stroke', col); id('mtStopBox').setAttribute('opacity', on ? '1' : '0.5');
        id('mtStopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        id('mtStopTxt').setAttribute('fill', col); id('mtStopIcon').setAttribute('fill', col);
        gg.style.pointerEvents = on ? 'auto' : 'none'; gg.style.cursor = on ? 'pointer' : 'default';
      }
      id('mtStop').addEventListener('click', abort);
      setStopBtn(true);

      var mqDesktop = window.matchMedia('(min-width: 1081px)');
      if (reduce) { if (mqDesktop.matches) render(DWELL * 2.4, 0); return; }

      var t0 = null, lastC = 0, ticking = false;
      function frame(ts) {
        if (stopped || !mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        var e = ts - t0, c = e % CYCLE;
        if (c < lastC) cycleN++;
        lastC = c;
        render(c, e);
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
