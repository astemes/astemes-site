/* Astemes "Cell Cycler" — animated hero instrument panel (R&D / validation variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). Four lithium-ion cells are cycled CC-CV charge then CC
   discharge; per-cell current and temperature are drawn left-to-right behind a playhead, with
   the previous cycle kept as a faint ghost. CELL4 runs hottest: on alternate cycles it crosses
   the 38 °C limit line during charge, the banner flags CELL4 OVER-TEMP and the charger derates
   that cell — its current trace visibly splits from the pack — until it cools back under the
   limit. Readouts refresh at ~7 Hz, and element lookups are scoped to the mounted panel so
   multiple instances can coexist (see animations/harness.html). */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862',
            red:'#B07A7A', redtx:'#D69191', panel:'#455A64' };
  // Four per-cell trace colours — equal-ish luminance, hues spread, kept muted to sit in the instrument look.
  var CELL = ['#D8A657', '#79C5A6', '#7EA6D6', '#C792C0'];

  // ── plot geometry (shared x time-axis across both graphs) ──
  var PX0 = 80, PX1 = 562, PW = PX1 - PX0;
  var IZERO = 260, ISCALE = 22, ITOP = 202, IBOT = 314;          // current plot
  var TTOP = 368, TBOT = 426, TMIN = 20, TSCALE = 2.9;           // temperature plot
  var TLIM = 38, TLIM_Y = TBOT - (TLIM - TMIN) * TSCALE;         // over-temp limit line

  // ── cycle timeline (ms of sped-up time) — charge spans ~9.5 s ("around 10") ──
  var T_CC = 5000, T_CV = 9500, T_R1 = 10800, T_DIS = 15500, CYCLE = 16800;
  var DERATE_AT = 3600, DERATE_A = 1.0;   // over-temp response on hot cycles (CELL4, during CC)
  var UI_MS = 150;                        // numeric readout refresh period
  function xOf(t) { return PX0 + (t / CYCLE) * PW; }

  var SVG =
  `<svg viewBox="0 0 600 560" role="img"
        aria-label="An automated battery cell cycler running an endurance test on a four-cell lithium-ion pack, plotting per-cell charge/discharge current and temperature across repeated CC-CV cycles. On some cycles the hottest cell crosses the temperature limit during charge; the cycler flags it over-temperature and derates that cell until it cools back down."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
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
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CELLS</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">4 &#215; INR18650 &#183; 2.00 Ah</text>
      <text x="266" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">STARTED</text>
      <text id="b2Start" x="266" y="100" fill="#CFD8DC" font-size="13">&#8212;</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CYCLE</text>
      <text id="b2Cycle" x="560" y="102" text-anchor="end" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="700">0287</text>

      <!-- status banner -->
      <rect id="b2Banner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(216,166,87,0.10)" stroke="#6b7780" stroke-width="1.5"/>
      <!-- pack state-of-charge battery glyph -->
      <rect x="44" y="134" width="64" height="26" rx="3" fill="none" stroke="#9E9E9E" stroke-width="1.5"/>
      <rect x="109" y="141" width="4" height="12" rx="1" fill="#9E9E9E"/>
      <rect id="b2Seg0" x="47" y="137" width="0" height="20" fill="#D8A657"/>
      <rect id="b2Seg1" x="61.5" y="137" width="0" height="20" fill="#D8A657"/>
      <rect id="b2Seg2" x="76" y="137" width="0" height="20" fill="#D8A657"/>
      <rect id="b2Seg3" x="90.5" y="137" width="0" height="20" fill="#D8A657"/>
      <text id="b2Phase" x="128" y="156" fill="#D8A657" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">CHARGE</text>
      <text id="b2Mode" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">CONSTANT CURRENT</text>
      <text id="b2Vals" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">3.62 V &#183; +2.00 A &#183; 41%</text>

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
      <path id="b2CurG0" fill="none" stroke="#D8A657" stroke-width="1.2" stroke-opacity="0.16" d="M80,260"/>
      <path id="b2CurG1" fill="none" stroke="#79C5A6" stroke-width="1.2" stroke-opacity="0.16" d="M80,260"/>
      <path id="b2CurG2" fill="none" stroke="#7EA6D6" stroke-width="1.2" stroke-opacity="0.16" d="M80,260"/>
      <path id="b2CurG3" fill="none" stroke="#C792C0" stroke-width="1.2" stroke-opacity="0.16" d="M80,260"/>
      <path id="b2Cur0" fill="none" stroke="#D8A657" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,260"/>
      <path id="b2Cur1" fill="none" stroke="#79C5A6" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,260"/>
      <path id="b2Cur2" fill="none" stroke="#7EA6D6" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,260"/>
      <path id="b2Cur3" fill="none" stroke="#C792C0" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,260"/>
      <line id="b2Play1" x1="80" y1="200" x2="80" y2="316" stroke="rgba(207,216,220,0.45)" stroke-width="1" stroke-dasharray="2 3"/>
      <circle id="b2CurDot0" cx="80" cy="260" r="2.6" fill="#D8A657"/>
      <circle id="b2CurDot1" cx="80" cy="260" r="2.6" fill="#79C5A6"/>
      <circle id="b2CurDot2" cx="80" cy="260" r="2.6" fill="#7EA6D6"/>
      <circle id="b2CurDot3" cx="80" cy="260" r="2.6" fill="#C792C0"/>

      <!-- ── per-cell live readout strip ── -->
      <g font-size="11">
        <circle cx="83"  cy="329" r="3" fill="#D8A657"/><text x="92"  y="333" fill="#CFD8DC" font-size="10">CELL1</text>
        <text id="b2Val0" x="198" y="333" text-anchor="end" fill="#FFFFFF">4.02 V</text>
        <text id="b2Sub0" x="92"  y="346" fill="#6b7780" font-size="9.5">+2.00 A &#183; 24.0&#176;C</text>
        <circle cx="203" cy="329" r="3" fill="#79C5A6"/><text x="212" y="333" fill="#CFD8DC" font-size="10">CELL2</text>
        <text id="b2Val1" x="318" y="333" text-anchor="end" fill="#FFFFFF">4.02 V</text>
        <text id="b2Sub1" x="212" y="346" fill="#6b7780" font-size="9.5">+2.00 A &#183; 24.0&#176;C</text>
        <circle cx="323" cy="329" r="3" fill="#7EA6D6"/><text x="332" y="333" fill="#CFD8DC" font-size="10">CELL3</text>
        <text id="b2Val2" x="438" y="333" text-anchor="end" fill="#FFFFFF">4.02 V</text>
        <text id="b2Sub2" x="332" y="346" fill="#6b7780" font-size="9.5">+2.00 A &#183; 24.0&#176;C</text>
        <circle cx="443" cy="329" r="3" fill="#C792C0"/><text x="452" y="333" fill="#CFD8DC" font-size="10">CELL4</text>
        <text id="b2Val3" x="558" y="333" text-anchor="end" fill="#FFFFFF">4.02 V</text>
        <text id="b2Sub3" x="452" y="346" fill="#6b7780" font-size="9.5">+2.00 A &#183; 24.0&#176;C</text>
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
      <line x1="80" y1="${TLIM_Y}" x2="562" y2="${TLIM_Y}" stroke="rgba(216,166,87,0.45)" stroke-width="1" stroke-dasharray="4 4"/>
      <text x="86" y="${TLIM_Y - 3}" fill="rgba(216,166,87,0.7)" font-size="8" letter-spacing="1">LIMIT 38&#176;C</text>
      <path id="b2TmpG0" fill="none" stroke="#D8A657" stroke-width="1.2" stroke-opacity="0.16" d="M80,420"/>
      <path id="b2TmpG1" fill="none" stroke="#79C5A6" stroke-width="1.2" stroke-opacity="0.16" d="M80,420"/>
      <path id="b2TmpG2" fill="none" stroke="#7EA6D6" stroke-width="1.2" stroke-opacity="0.16" d="M80,420"/>
      <path id="b2TmpG3" fill="none" stroke="#C792C0" stroke-width="1.2" stroke-opacity="0.16" d="M80,420"/>
      <path id="b2Tmp0" fill="none" stroke="#D8A657" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,420"/>
      <path id="b2Tmp1" fill="none" stroke="#79C5A6" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,420"/>
      <path id="b2Tmp2" fill="none" stroke="#7EA6D6" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,420"/>
      <path id="b2Tmp3" fill="none" stroke="#C792C0" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M80,420"/>
      <line id="b2Play2" x1="80" y1="368" x2="80" y2="426" stroke="rgba(207,216,220,0.45)" stroke-width="1" stroke-dasharray="2 3"/>
      <circle id="b2TmpDot0" cx="80" cy="420" r="2.6" fill="#D8A657"/>
      <circle id="b2TmpDot1" cx="80" cy="420" r="2.6" fill="#79C5A6"/>
      <circle id="b2TmpDot2" cx="80" cy="420" r="2.6" fill="#7EA6D6"/>
      <circle id="b2TmpDot3" cx="80" cy="420" r="2.6" fill="#C792C0"/>

      <!-- footer -->
      <path d="M32 440H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="460" fill="#9E9E9E" font-size="9" letter-spacing="1.5">ENDURANCE PROGRESS</text>
      <rect x="40" y="468" width="300" height="7" rx="3.5" fill="rgba(96,125,139,0.18)"/>
      <rect id="b2Prog" x="40" y="468" width="172" height="7" rx="3.5" fill="#607D8B"/>
      <text id="b2ProgTxt" x="346" y="475" fill="#CFD8DC" font-size="11">287 / 500</text>
      <g id="b2Stop">
        <rect id="b2StopBox" x="432" y="451" width="128" height="37" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="b2StopIcon" x="464" y="462" width="15" height="15" rx="2" fill="#B07A7A"/>
        <text id="b2StopTxt" x="487" y="475" fill="#B07A7A" font-size="14" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP</text>
      </g>
    </svg>`;

  window.AstemesAnim.register({
    id: 'battery-cycler', name: 'Battery Cycler', weight: 1, isDefault: false,
    mount: function (stage) {
      stage.innerHTML = SVG;
      var panel = stage.querySelector('svg');
      if (!panel) return;
      var __raf = null, __torn = false, __rearmT = null;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var q = function (s) { return panel.querySelector('#' + s); };

      // ── per-channel physical character (small spread → believable cell-to-cell variance) ──
      var fac   = [1.00, 0.99, 1.012, 0.975];   // current scale
      var rHeat = [1.00, 1.06, 0.93,  1.12];    // thermal resistance — CELL4 runs hottest
      var HOTX  = 1.7;                           // CELL4 extra thermal resistance on hot cycles
      var AMB   = [24.0, 24.4, 23.6,  24.7];     // ambient / rest temperature
      var vOff  = [0.00, 0.018, -0.014, 0.026];  // resting voltage offset
      var KH = 0.00088, KC = 0.00022;             // heating / cooling integration constants
      var ST = 70;                                // sample step (ms)

      // ── per-cell models (deterministic in t + hot flag so the drawn history never shimmers) ──
      // On hot cycles CELL4 overheats during CC and is derated to DERATE_A from DERATE_AT onward.
      function derated(t, ci, hot) { return hot && ci === 3 && t >= DERATE_AT; }
      function iOf(t, ci, hot) {
        var lim = derated(t, ci, hot) ? DERATE_A : 2;
        var i;
        if (t < T_CC)       i = lim * fac[ci];
        else if (t < T_CV)  i = lim * fac[ci] * Math.exp(-(t - T_CC) / 2100);  // CV taper
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
      var segs = [[0, DERATE_AT], [DERATE_AT, T_CC], [T_CC, T_CV], [T_CV, T_R1], [T_R1, T_DIS], [T_DIS, CYCLE]];
      function cellPaths(ci, upto, hot) {
        var rh = rHeat[ci] * (hot && ci === 3 ? HOTX : 1);   // hot cycles: CELL4 heats ~1.7x
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
          var i = iOf(tt, ci, hot);
          if (dt > 0) T += dt * (KH * rh * i * i - KC * (T - AMB[ci]));
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
      var seg = [q('b2Seg0'), q('b2Seg1'), q('b2Seg2'), q('b2Seg3')];
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
      function setBanner(ph, warm, t4) {
        var charging = ph === 'cc' || ph === 'cv', dis = ph === 'dis';
        var col, label, mode;
        if (warm) {
          col = C.red; label = 'CELL4 OVER-TEMP';
          mode = 'CHARGE DERATED TO ' + DERATE_A.toFixed(1) + ' A';
        } else {
          col = charging ? C.amber : dis ? C.green : C.gmut;
          label = charging ? 'CHARGE' : dis ? 'DISCHARGE' : 'REST';
          mode = ph === 'cc' ? 'CONSTANT CURRENT' : ph === 'cv' ? 'CONSTANT VOLTAGE'
               : dis ? 'CONSTANT CURRENT' : 'RELAXATION';
        }
        var key = label + mode;
        if (key !== lastBanner) {
          q('b2Banner').setAttribute('fill', warm ? 'rgba(176,122,122,0.12)' : charging ? 'rgba(216,166,87,0.10)' : dis ? 'rgba(121,197,166,0.10)' : 'rgba(96,125,139,0.08)');
          q('b2Banner').setAttribute('stroke', col);
          q('b2Phase').textContent = label; q('b2Phase').setAttribute('fill', warm ? C.redtx : col);
          q('b2Mode').textContent = mode;
          lastBanner = key;
        }
        return col;
      }

      function setStop(enabled) {
        var col = enabled ? C.red : C.queue, g = q('b2Stop');
        q('b2StopBox').setAttribute('stroke', col);
        q('b2StopBox').setAttribute('fill', enabled ? 'rgba(176,122,122,0.12)' : 'none');
        q('b2StopBox').setAttribute('opacity', enabled ? '1' : '0.5');
        q('b2StopTxt').setAttribute('fill', col);
        q('b2StopIcon').setAttribute('fill', col);
        g.style.pointerEvents = enabled ? 'auto' : 'none';
        g.style.cursor = enabled ? 'pointer' : 'default';
      }

      // ── start timestamp (a few hours ago) + cycle bookkeeping ──
      var TARGET = 500, cycle = 287;
      var hotNow = cycle % 2 === 1, hotPrev = !hotNow;
      var startMs = Date.now() - (3 * 3600 + 12 * 60 + Math.floor(Math.random() * 40) * 60) * 1000;
      var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      (function () {
        var d = new Date(startMs), p = function (n) { return (n < 10 ? '0' : '') + n; };
        q('b2Start').textContent = MON[d.getMonth()] + ' ' + d.getDate() + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes());
      })();
      function setCycle() {
        q('b2Cycle').textContent = String(cycle).padStart(4, '0');
        q('b2Prog').setAttribute('width', (300 * Math.min(cycle / TARGET, 1)).toFixed(1));
        q('b2ProgTxt').textContent = cycle + ' / ' + TARGET;
      }
      setCycle();

      // ── render one frame at cycle-time c ──
      var warm = false, uiAt = 0;
      function render(c) {
        var p4 = null;
        for (var ci = 0; ci < 4; ci++) {
          var p = cellPaths(ci, c, hotNow);
          if (ci === 3) p4 = p;
          q('b2Cur' + ci).setAttribute('d', p.cur);
          q('b2Tmp' + ci).setAttribute('d', p.tmp);
          var cd = q('b2CurDot' + ci), td = q('b2TmpDot' + ci);
          cd.setAttribute('cx', p.x.toFixed(1)); cd.setAttribute('cy', p.yc.toFixed(1));
          td.setAttribute('cx', p.x.toFixed(1)); td.setAttribute('cy', p.yt.toFixed(1));
          if (c >= uiAt || uiAt === 0) {
            var amp = iOf(c, ci, hotNow);
            q('b2Val' + ci).textContent = vOf(c, ci).toFixed(2) + ' V';
            var sgn = amp >= 0 ? '+' : '−';
            q('b2Sub' + ci).textContent = sgn + Math.abs(amp).toFixed(2) + ' A · ' + p.T.toFixed(1) + '°C';
          }
        }
        var px = xOf(c).toFixed(1);
        q('b2Play1').setAttribute('x1', px); q('b2Play1').setAttribute('x2', px);
        q('b2Play2').setAttribute('x1', px); q('b2Play2').setAttribute('x2', px);
        // over-temp hysteresis on CELL4's live temperature
        if (!warm && p4.T > TLIM) warm = true;
        else if (warm && p4.T < TLIM - 0.6) warm = false;
        q('b2Sub3').setAttribute('fill', warm ? C.redtx : C.mut);
        // banner reflects the pack (average of the four cells)
        var ph = phaseOf(c);
        var col = setBanner(ph, warm, p4.T);
        if (c >= uiAt || uiAt === 0) {
          var vAvg = 0, aAvg = 0;
          for (var j = 0; j < 4; j++) { vAvg += vOf(c, j); aAvg += iOf(c, j, hotNow); }
          var sign = aAvg >= 0 ? '+' : '−';
          q('b2Vals').textContent = warm
            ? 'CELL4 ' + p4.T.toFixed(1) + ' °C · LIMIT ' + TLIM.toFixed(0) + ' °C'
            : (vAvg / 4).toFixed(2) + ' V · ' + sign + Math.abs(aAvg / 4).toFixed(2) + ' A · ' + Math.round(socOf(c) * 100) + '%';
          setBattery(socOf(c), col);
          uiAt = c + UI_MS;
        }
      }

      // freeze the just-completed cycle as a faint ghost behind the live traces
      function setGhost(hot) {
        for (var ci = 0; ci < 4; ci++) {
          var p = cellPaths(ci, CYCLE, hot);
          q('b2CurG' + ci).setAttribute('d', p.cur);
          q('b2TmpG' + ci).setAttribute('d', p.tmp);
        }
      }

      // ── stop / re-arm (abort, hold, resume) ──
      var stopped = false;
      function abort() {
        if (stopped) return;
        stopped = true;
        q('b2Banner').setAttribute('fill', 'rgba(176,122,122,0.10)');
        q('b2Banner').setAttribute('stroke', C.red);
        q('b2Phase').textContent = 'STOPPED'; q('b2Phase').setAttribute('fill', C.red);
        q('b2Mode').textContent = 'PAUSED BY OPERATOR'; lastBanner = 'STOPPED';
        setStop(false);
        __rearmT = setTimeout(rearm, 2600);
      }
      function rearm() {
        if (__torn) return;
        stopped = false;
        t0 = null; lastC = 0; uiAt = 0; lastBanner = '';
        setStop(true);
        startLoop();
      }
      q('b2Stop').addEventListener('click', abort);
      setStop(true);

      if (reduce) { setGhost(hotPrev); render(T_CC * 0.9); return function () { __torn = true; stage.innerHTML = ''; }; }

      setGhost(hotPrev);
      var t0 = null, lastC = 0, ticking = false;
      function frame(ts) {
        if (__torn || stopped) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        var c = (ts - t0) % CYCLE;
        if (c < lastC) {
          hotPrev = hotNow; setGhost(hotPrev);
          cycle = cycle < TARGET ? cycle + 1 : cycle;
          hotNow = cycle % 2 === 1;
          setCycle(); uiAt = 0;
        }
        lastC = c;
        render(c);
        __raf = requestAnimationFrame(frame);
      }
      function startLoop() {
        if (ticking || stopped || __torn) return;
        ticking = true; t0 = null; __raf = requestAnimationFrame(frame);
      }
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
