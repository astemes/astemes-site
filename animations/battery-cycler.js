/* Astemes "Cell Cycler" — animated hero instrument panel (R&D / validation variant).
   Same chrome, palette and self-injection contract as testbench.js: it builds itself
   into any page that has a <div class="hero-visual"> mount, so the two animations can be
   swapped behind one mount. Four independent Li-ion channels are cycled CC-CV charge then
   CC discharge; per-cell current and temperature are plotted live, cycle after cycle. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862',
            red:'#B07A7A', panel:'#455A64' };
  // Four per-cell trace colours — equal-ish luminance, hues spread, kept muted to sit in the instrument look.
  var CELL = ['#D8A657', '#79C5A6', '#7EA6D6', '#C792C0'];

  // ── plot geometry (shared x time-axis across both graphs) ──
  var PX0 = 80, PX1 = 562, PW = PX1 - PX0;
  var IZERO = 260, ISCALE = 22, ITOP = 202, IBOT = 314;          // current plot
  var TTOP = 368, TBOT = 426, TMIN = 20, TSCALE = 2.9;           // temperature plot

  // ── cycle timeline (ms of sped-up time) — charge spans ~9.5 s ("around 10") ──
  var T_CC = 5000, T_CV = 9500, T_R1 = 10800, T_DIS = 15500, CYCLE = 16800;
  function xOf(t) { return PX0 + (t / CYCLE) * PW; }

  var SVG =
  `<svg id="bcPanel" viewBox="0 0 600 560" role="img"
        aria-label="An automated battery cell cycler running an endurance test on a four-cell lithium-ion pack, plotting per-cell charge/discharge current and temperature across repeated CC-CV cycles."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <defs>
        <filter id="bcGlow" x="-20%" y="-50%" width="140%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#CFD8DC" flood-opacity="0.45"/>
        </filter>
      </defs>

      <!-- panel -->
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">CELL CYCLER</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- header info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CHANNELS</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">4 &#215; INR18650 &#183; 2.00 Ah</text>
      <text x="266" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">STARTED</text>
      <text id="bcStart" x="266" y="100" fill="#CFD8DC" font-size="13">&#8212;</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CYCLE</text>
      <text id="bcCycle" x="560" y="102" text-anchor="end" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="700">0287</text>

      <!-- status banner -->
      <rect id="bcBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(216,166,87,0.10)" stroke="#6b7780" stroke-width="1.5"/>
      <!-- pack state-of-charge battery glyph -->
      <rect x="44" y="134" width="64" height="26" rx="3" fill="none" stroke="#9E9E9E" stroke-width="1.5"/>
      <rect x="109" y="141" width="4" height="12" rx="1" fill="#9E9E9E"/>
      <rect id="bcSeg0" x="47" y="137" width="0" height="20" fill="#D8A657"/>
      <rect id="bcSeg1" x="61.5" y="137" width="0" height="20" fill="#D8A657"/>
      <rect id="bcSeg2" x="76" y="137" width="0" height="20" fill="#D8A657"/>
      <rect id="bcSeg3" x="90.5" y="137" width="0" height="20" fill="#D8A657"/>
      <text id="bcPhase" x="128" y="156" fill="#D8A657" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">CHARGE</text>
      <text id="bcMode" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">CONSTANT CURRENT</text>
      <text id="bcVals" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">3.62 V &#183; +2.00 A &#183; 41%</text>

      <!-- ── per-cell current graph ── -->
      <text x="40" y="194" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">PER-CELL CURRENT</text>
      <text x="560" y="194" text-anchor="end" fill="#6b7780" font-size="9">CHARGE +  /  DISCHARGE &#8722;</text>
      <!-- phase bands -->
      <rect x="80"    y="200" width="143.4" height="116" fill="rgba(216,166,87,0.06)"/>
      <rect x="223.4" y="200" width="129.2" height="116" fill="rgba(216,166,87,0.035)"/>
      <rect x="389.9" y="200" width="134.8" height="116" fill="rgba(121,197,166,0.05)"/>
      <text x="151" y="212" text-anchor="middle" fill="rgba(207,216,220,0.34)" font-size="8" letter-spacing="1.5">CC</text>
      <text x="288" y="212" text-anchor="middle" fill="rgba(207,216,220,0.34)" font-size="8" letter-spacing="1.5">CV</text>
      <text x="457" y="212" text-anchor="middle" fill="rgba(207,216,220,0.34)" font-size="8" letter-spacing="1.5">DISCHARGE</text>
      <!-- grid + zero line -->
      <line x1="80" y1="238" x2="562" y2="238" stroke="rgba(96,125,139,0.16)" stroke-dasharray="2 5"/>
      <line x1="80" y1="282" x2="562" y2="282" stroke="rgba(96,125,139,0.16)" stroke-dasharray="2 5"/>
      <line x1="80" y1="260" x2="562" y2="260" stroke="rgba(96,125,139,0.42)"/>
      <text x="72" y="220" text-anchor="end" fill="#6b7780" font-size="9">+2A</text>
      <text x="72" y="263" text-anchor="end" fill="#6b7780" font-size="9">0</text>
      <text x="72" y="307" text-anchor="end" fill="#6b7780" font-size="9">&#8722;2A</text>
      <path id="bcCurG0" fill="none" stroke="#D8A657" stroke-width="1.2" stroke-opacity="0.16" d="M80,260"/>
      <path id="bcCurG1" fill="none" stroke="#79C5A6" stroke-width="1.2" stroke-opacity="0.16" d="M80,260"/>
      <path id="bcCurG2" fill="none" stroke="#7EA6D6" stroke-width="1.2" stroke-opacity="0.16" d="M80,260"/>
      <path id="bcCurG3" fill="none" stroke="#C792C0" stroke-width="1.2" stroke-opacity="0.16" d="M80,260"/>
      <path id="bcCur0" fill="none" stroke="#D8A657" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,260"/>
      <path id="bcCur1" fill="none" stroke="#79C5A6" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,260"/>
      <path id="bcCur2" fill="none" stroke="#7EA6D6" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,260"/>
      <path id="bcCur3" fill="none" stroke="#C792C0" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,260"/>
      <line id="bcPlay1" x1="80" y1="200" x2="80" y2="316" stroke="rgba(207,216,220,0.45)" stroke-width="1" stroke-dasharray="2 3"/>
      <circle id="bcCurDot0" cx="80" cy="260" r="2.6" fill="#D8A657"/>
      <circle id="bcCurDot1" cx="80" cy="260" r="2.6" fill="#79C5A6"/>
      <circle id="bcCurDot2" cx="80" cy="260" r="2.6" fill="#7EA6D6"/>
      <circle id="bcCurDot3" cx="80" cy="260" r="2.6" fill="#C792C0"/>

      <!-- ── per-cell live readout strip ── -->
      <g font-size="11">
        <circle cx="83"  cy="329" r="3" fill="#D8A657"/><text x="92"  y="333" fill="#CFD8DC" font-size="10">CH1</text>
        <text id="bcVal0" x="198" y="333" text-anchor="end" fill="#FFFFFF">4.02 V</text>
        <text id="bcSub0" x="92"  y="346" fill="#6b7780" font-size="9.5">+2.00 A &#183; 24.0&#176;C</text>
        <circle cx="203" cy="329" r="3" fill="#79C5A6"/><text x="212" y="333" fill="#CFD8DC" font-size="10">CH2</text>
        <text id="bcVal1" x="318" y="333" text-anchor="end" fill="#FFFFFF">4.02 V</text>
        <text id="bcSub1" x="212" y="346" fill="#6b7780" font-size="9.5">+2.00 A &#183; 24.0&#176;C</text>
        <circle cx="323" cy="329" r="3" fill="#7EA6D6"/><text x="332" y="333" fill="#CFD8DC" font-size="10">CH3</text>
        <text id="bcVal2" x="438" y="333" text-anchor="end" fill="#FFFFFF">4.02 V</text>
        <text id="bcSub2" x="332" y="346" fill="#6b7780" font-size="9.5">+2.00 A &#183; 24.0&#176;C</text>
        <circle cx="443" cy="329" r="3" fill="#C792C0"/><text x="452" y="333" fill="#CFD8DC" font-size="10">CH4</text>
        <text id="bcVal3" x="558" y="333" text-anchor="end" fill="#FFFFFF">4.02 V</text>
        <text id="bcSub3" x="452" y="346" fill="#6b7780" font-size="9.5">+2.00 A &#183; 24.0&#176;C</text>
      </g>

      <!-- ── per-cell temperature graph ── -->
      <text x="40" y="362" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">PER-CELL TEMPERATURE</text>
      <text x="560" y="362" text-anchor="end" fill="#6b7780" font-size="9">&#176;C</text>
      <line x1="80" y1="368" x2="562" y2="368" stroke="rgba(96,125,139,0.16)" stroke-dasharray="2 5"/>
      <line x1="80" y1="397" x2="562" y2="397" stroke="rgba(96,125,139,0.16)" stroke-dasharray="2 5"/>
      <line x1="80" y1="426" x2="562" y2="426" stroke="rgba(96,125,139,0.30)"/>
      <text x="72" y="371" text-anchor="end" fill="#6b7780" font-size="9">40</text>
      <text x="72" y="400" text-anchor="end" fill="#6b7780" font-size="9">30</text>
      <text x="72" y="426" text-anchor="end" fill="#6b7780" font-size="9">20</text>
      <path id="bcTmpG0" fill="none" stroke="#D8A657" stroke-width="1.2" stroke-opacity="0.16" d="M80,420"/>
      <path id="bcTmpG1" fill="none" stroke="#79C5A6" stroke-width="1.2" stroke-opacity="0.16" d="M80,420"/>
      <path id="bcTmpG2" fill="none" stroke="#7EA6D6" stroke-width="1.2" stroke-opacity="0.16" d="M80,420"/>
      <path id="bcTmpG3" fill="none" stroke="#C792C0" stroke-width="1.2" stroke-opacity="0.16" d="M80,420"/>
      <path id="bcTmp0" fill="none" stroke="#D8A657" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,420"/>
      <path id="bcTmp1" fill="none" stroke="#79C5A6" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,420"/>
      <path id="bcTmp2" fill="none" stroke="#7EA6D6" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,420"/>
      <path id="bcTmp3" fill="none" stroke="#C792C0" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,420"/>
      <line id="bcPlay2" x1="80" y1="368" x2="80" y2="426" stroke="rgba(207,216,220,0.45)" stroke-width="1" stroke-dasharray="2 3"/>
      <circle id="bcTmpDot0" cx="80" cy="420" r="2.6" fill="#D8A657"/>
      <circle id="bcTmpDot1" cx="80" cy="420" r="2.6" fill="#79C5A6"/>
      <circle id="bcTmpDot2" cx="80" cy="420" r="2.6" fill="#7EA6D6"/>
      <circle id="bcTmpDot3" cx="80" cy="420" r="2.6" fill="#C792C0"/>

      <!-- footer -->
      <path d="M32 440H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="460" fill="#9E9E9E" font-size="9" letter-spacing="1.5">ENDURANCE PROGRESS</text>
      <rect x="40" y="468" width="300" height="7" rx="3.5" fill="rgba(96,125,139,0.18)"/>
      <rect id="bcProg" x="40" y="468" width="172" height="7" rx="3.5" fill="#607D8B"/>
      <text id="bcProgTxt" x="346" y="475" fill="#CFD8DC" font-size="11">287 / 500</text>
      <g id="bcStop">
        <rect id="bcStopBox" x="432" y="451" width="128" height="37" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="bcStopIcon" x="464" y="462" width="15" height="15" rx="2" fill="#B07A7A"/>
        <text id="bcStopTxt" x="487" y="475" fill="#B07A7A" font-size="14" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP</text>
      </g>
    </svg>`;

  window.AstemesAnim.register({
    id: 'battery-cycler', name: 'Battery Cycler', weight: 1, isDefault: false,
    mount: function (stage) {
      stage.innerHTML = SVG;
      var __raf = null, __torn = false;
      var panel = document.getElementById('bcPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };

      // ── per-channel physical character (small spread → believable cell-to-cell variance) ──
      var fac   = [1.00, 0.99, 1.012, 0.975];   // current scale
      var rHeat = [1.00, 1.06, 0.93,  1.22];    // thermal resistance — CH4 runs hottest
      var AMB   = [24.0, 24.4, 23.6,  24.7];     // ambient / rest temperature
      var vOff  = [0.00, 0.018, -0.014, 0.026];  // resting voltage offset
      var KH = 0.00088, KC = 0.00022;             // heating / cooling integration constants
      var ST = 70;                                // sample step (ms)

      // ── per-cell models (deterministic in t so the drawn history never shimmers) ──
      function iOf(t, ci) {
        var i;
        if (t < T_CC)       i = 2 * fac[ci];
        else if (t < T_CV)  i = 2 * fac[ci] * Math.exp(-(t - T_CC) / 2100);  // CV taper
        else if (t < T_R1)  i = 0;
        else if (t < T_DIS) i = -2 * fac[ci];
        else                i = 0;
        if (i !== 0) i += 0.012 * Math.sin(t / 170 + ci * 2.1);
        return i;
      }
      function vOf(t, ci) {
        var v;
        if (t < T_CC)       v = 3.45 + (t / T_CC) * 0.70;
        else if (t < T_CV)  v = 4.15 + ((t - T_CC) / (T_CV - T_CC)) * 0.05;
        else if (t < T_R1)  v = 4.20 - ((t - T_CV) / (T_R1 - T_CV)) * 0.05;
        else if (t < T_DIS) v = 4.12 - Math.pow((t - T_R1) / (T_DIS - T_R1), 1.15) * 0.86;
        else                v = 3.26 + ((t - T_DIS) / (CYCLE - T_DIS)) * 0.10;
        return v + vOff[ci];
      }
      function socOf(t) {
        if (t < T_CC)       return 0.15 + (t / T_CC) * 0.63;
        if (t < T_CV)       return 0.78 + (1 - Math.exp(-(t - T_CC) / 1600)) * 0.22;
        if (t < T_R1)       return 1.0;
        if (t < T_DIS)      return 1.0 - ((t - T_R1) / (T_DIS - T_R1)) * 0.85;
        return 0.15;
      }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      var yCur = function (i) { return clamp(IZERO - i * ISCALE, ITOP, IBOT); };
      var yTmp = function (T) { return clamp(TBOT - (T - TMIN) * TSCALE, TTOP, TBOT); };

      // Build current + temperature paths for one cell up to `upto`; integrate temperature from t0.
      // Segment boundaries are sampled twice so the CC→discharge current edges render vertical.
      var segs = [[0, T_CC], [T_CC, T_CV], [T_CV, T_R1], [T_R1, T_DIS], [T_DIS, CYCLE]];
      function cellPaths(ci, upto) {
        var times = [];
        for (var s = 0; s < segs.length; s++) {
          var a = segs[s][0], b = segs[s][1];
          if (a > upto) break;
          var end = Math.min(b, upto);
          for (var t = a; t < end; t += ST) times.push(t);
          times.push(end);
        }
        var T = AMB[ci], prev = 0, curD = '', tmpD = '', last = {};
        for (var k = 0; k < times.length; k++) {
          var tt = times[k], dt = tt - prev; prev = tt;
          var i = iOf(tt, ci);
          if (dt > 0) T += dt * (KH * rHeat[ci] * i * i - KC * (T - AMB[ci]));
          var x = xOf(tt).toFixed(1);
          curD += (k ? ' L' : 'M') + x + ',' + yCur(i).toFixed(1);
          tmpD += (k ? ' L' : 'M') + x + ',' + yTmp(T).toFixed(1);
          last = { i: i, T: T, x: xOf(tt) };
        }
        return { cur: curD, tmp: tmpD, i: last.i, T: T, x: last.x,
                 yc: yCur(last.i), yt: yTmp(T) };
      }

      // ── banner / chrome helpers ──
      function phaseOf(t) {
        return t < T_CC ? 'cc' : t < T_CV ? 'cv' : t < T_R1 ? 'rest' : t < T_DIS ? 'dis' : 'rest2';
      }
      var seg = [id('bcSeg0'), id('bcSeg1'), id('bcSeg2'), id('bcSeg3')];
      var segX = [47, 61.5, 76, 90.5];
      function setBattery(soc, col) {
        for (var i = 0; i < 4; i++) {
          var f = clamp(soc * 4 - i, 0, 1);
          seg[i].setAttribute('width', (13 * f).toFixed(1));
          seg[i].setAttribute('x', segX[i]);
          seg[i].setAttribute('fill', col);
        }
      }
      var lastBanner = '';
      function setBanner(ph, soc, v, amp) {
        var charging = ph === 'cc' || ph === 'cv', dis = ph === 'dis';
        var col = charging ? C.amber : dis ? C.green : C.gmut;
        var label = charging ? 'CHARGE' : dis ? 'DISCHARGE' : 'REST';
        var mode = ph === 'cc' ? 'CONSTANT CURRENT' : ph === 'cv' ? 'CONSTANT VOLTAGE'
                 : dis ? 'CONSTANT CURRENT' : 'RELAXATION';
        var key = label + mode;
        if (key !== lastBanner) {
          id('bcBanner').setAttribute('fill', charging ? 'rgba(216,166,87,0.10)' : dis ? 'rgba(121,197,166,0.10)' : 'rgba(96,125,139,0.08)');
          id('bcBanner').setAttribute('stroke', col);
          id('bcPhase').textContent = label; id('bcPhase').setAttribute('fill', col);
          id('bcMode').textContent = mode;
          lastBanner = key;
        }
        var sign = amp >= 0 ? '+' : '\u2212';
        id('bcVals').textContent = v.toFixed(2) + ' V \u00B7 ' + sign + Math.abs(amp).toFixed(2) + ' A \u00B7 ' + Math.round(soc * 100) + '%';
        setBattery(soc, col);
      }

      function setStop(enabled) {
        var col = enabled ? C.red : C.queue, g = id('bcStop');
        id('bcStopBox').setAttribute('stroke', col);
        id('bcStopBox').setAttribute('fill', enabled ? 'rgba(176,122,122,0.12)' : 'none');
        id('bcStopBox').setAttribute('opacity', enabled ? '1' : '0.5');
        id('bcStopTxt').setAttribute('fill', col);
        id('bcStopIcon').setAttribute('fill', col);
        g.style.pointerEvents = enabled ? 'auto' : 'none';
        g.style.cursor = enabled ? 'pointer' : 'default';
      }

      // ── start timestamp (a few hours ago) + cycle bookkeeping ──
      var TARGET = 500, cycle = 287;
      var startMs = Date.now() - (3 * 3600 + 12 * 60 + Math.floor(Math.random() * 40) * 60) * 1000;
      var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      (function () {
        var d = new Date(startMs), p = function (n) { return (n < 10 ? '0' : '') + n; };
        id('bcStart').textContent = MON[d.getMonth()] + ' ' + d.getDate() + ' \u00B7 ' + p(d.getHours()) + ':' + p(d.getMinutes());
      })();
      function setCycle() {
        id('bcCycle').textContent = String(cycle).padStart(4, '0');
        id('bcProg').setAttribute('width', (300 * Math.min(cycle / TARGET, 1)).toFixed(1));
        id('bcProgTxt').textContent = cycle + ' / ' + TARGET;
      }
      setCycle();

      // ── render one frame at cycle-time c ──
      function render(c) {
        for (var ci = 0; ci < 4; ci++) {
          var p = cellPaths(ci, c);
          id('bcCur' + ci).setAttribute('d', p.cur);
          id('bcTmp' + ci).setAttribute('d', p.tmp);
          var cd = id('bcCurDot' + ci), td = id('bcTmpDot' + ci);
          cd.setAttribute('cx', p.x.toFixed(1)); cd.setAttribute('cy', p.yc.toFixed(1));
          td.setAttribute('cx', p.x.toFixed(1)); td.setAttribute('cy', p.yt.toFixed(1));
          var amp = iOf(c, ci);
          id('bcVal' + ci).textContent = vOf(c, ci).toFixed(2) + ' V';
          var sgn = amp >= 0 ? '+' : '\u2212';
          id('bcSub' + ci).textContent = sgn + Math.abs(amp).toFixed(2) + ' A \u00B7 ' + p.T.toFixed(1) + '\u00B0C';
        }
        var px = xOf(c).toFixed(1);
        id('bcPlay1').setAttribute('x1', px); id('bcPlay1').setAttribute('x2', px);
        id('bcPlay2').setAttribute('x1', px); id('bcPlay2').setAttribute('x2', px);
        // banner reflects the pack (average of the four channels)
        var ph = phaseOf(c), vAvg = 0, aAvg = 0;
        for (var j = 0; j < 4; j++) { vAvg += vOf(c, j); aAvg += iOf(c, j); }
        setBanner(ph, socOf(c), vAvg / 4, aAvg / 4);
      }

      // freeze the just-completed cycle as a faint ghost behind the live traces
      function setGhost() {
        for (var ci = 0; ci < 4; ci++) {
          var p = cellPaths(ci, CYCLE);
          id('bcCurG' + ci).setAttribute('d', p.cur);
          id('bcTmpG' + ci).setAttribute('d', p.tmp);
        }
      }

      // ── stop / re-arm (matches testbench.js: abort, hold, resume) ──
      var stopped = false;
      function abort() {
        if (stopped) return;
        stopped = true;
        id('bcBanner').setAttribute('fill', 'rgba(176,122,122,0.10)');
        id('bcBanner').setAttribute('stroke', C.red);
        id('bcPhase').textContent = 'STOPPED'; id('bcPhase').setAttribute('fill', C.red);
        id('bcMode').textContent = 'PAUSED BY OPERATOR'; lastBanner = 'STOPPED';
        setStop(false);
        setTimeout(rearm, 2600);
      }
      function rearm() {
        stopped = false;
        if (!mqDesktop.matches) return;
        t0 = null; lastC = 0;
        setStop(true);
        startLoop();
      }
      id('bcStop').addEventListener('click', abort);
      setStop(true);

      var mqDesktop = window.matchMedia('(min-width: 1px)');
      if (reduce) { if (mqDesktop.matches) { setGhost(); render(T_CC * 0.6); } return; }

      var t0 = null, lastC = 0, ticking = false;
      function frame(ts) {
        if (__torn || stopped || !mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        var c = (ts - t0) % CYCLE;
        if (c < lastC) { setGhost(); cycle = cycle < TARGET ? cycle + 1 : cycle; setCycle(); }
        lastC = c;
        render(c);
        __raf = requestAnimationFrame(frame);
      }
      function startLoop() {
        if (ticking || stopped || !mqDesktop.matches) return;
        ticking = true; t0 = null; __raf = requestAnimationFrame(frame);
      }
      if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', startLoop);
      else if (mqDesktop.addListener) mqDesktop.addListener(startLoop);
      startLoop();
    return function teardown() {
      __torn = true;
      if (__raf) cancelAnimationFrame(__raf);
      if (mqDesktop.removeEventListener) mqDesktop.removeEventListener('change', startLoop);
      else if (mqDesktop.removeListener) mqDesktop.removeListener(startLoop);
      stage.innerHTML = '';
    };
    }
  });
})();
