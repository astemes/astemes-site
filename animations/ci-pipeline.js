/* Astemes "CI Pipeline" — animated hero instrument panel (HIL regression CI/CD variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A commit triggers a pipeline that builds the firmware, runs
   unit tests, flashes a HIL rig and executes the regression suite on real hardware, then reports.
   Stages light up in sequence, the regression suite fills a test-case grid, and most runs pass —
   the occasional one fails and the next commit comes in green. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A', redtx:'#D69191', track:'#3a4750' };

  var STAGES = [
    { name: 'Checkout',        d: 700,  done: 'clone' },
    { name: 'Unit Tests',      d: 1500, done: '186 / 186 passed' },
    { name: 'Build Firmware',  d: 2100, done: 'arm-none-eabi \u00B7 1.84 MB' },
    { name: 'Provision HIL',   d: 1700, done: 'flash + boot \u00B7 hil-rig-02' },
    { name: 'HIL Regression',  d: 4600, done: '' },         // index 4 — expanded with test-case grid
    { name: 'Report & Deploy', d: 1100, done: 'publish \u00B7 tag rc' }
  ];
  var HIL = 4, GRIDC = 16, GRIDR = 4, NCASE = GRIDC * GRIDR, HOLD = 2400;
  var ROWY = [220, 256, 292, 328, 372, 452];
  var GX = 92, GY = 386, CELL = 9, CSTEP = 11.4;

  var COMMITS = [
    { msg: 'Fix CAN timeout handling',  who: 'a.sundqvist' },
    { msg: 'Add desat-trip test case',   who: 'm.holm' },
    { msg: 'DMM driver: SCPI retries',   who: 'a.sundqvist' },
    { msg: 'Tune encoder-loss thresh',   who: 'j.back' },
    { msg: 'Speed up HIL flash step',    who: 'm.holm' },
    { msg: 'Add ground-fault coverage',  who: 'j.back' }
  ];
  var BRANCHES = ['main', 'main', 'main', 'feature/ov-trip', 'fix/can-timeout'];

  var SVG =
  `<svg id="ciPanel" viewBox="0 0 600 560" role="img"
        aria-label="A continuous-integration pipeline running hardware-in-the-loop regression: a commit triggers checkout, firmware build, unit tests, flashing a HIL rig and a regression suite on real hardware that fills a grid of test cases, then reports — most runs pass, the occasional one fails."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <!-- panel -->
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">CI / TEST PIPELINE</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- header info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">REPOSITORY</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">astemes/drive-fw</text>
      <text x="262" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">WORKFLOW</text>
      <text x="262" y="100" fill="#CFD8DC" font-size="13">hil-regression.yml</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">RUNNER</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">hil-rig-02</text>

      <!-- status banner -->
      <rect id="ciBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(216,166,87,0.10)" stroke="#D8A657" stroke-width="1.5"/>
      <g id="ciSpin" transform="rotate(0 54 147)">
        <circle cx="54" cy="147" r="11" fill="none" stroke="#D8A657" stroke-width="3" stroke-linecap="round" stroke-dasharray="52 70"/>
      </g>
      <path id="ciChk" d="M47 147l5 6 12-15" fill="none" stroke="#79C5A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      <path id="ciX" d="M47 140l14 14M61 140l-14 14" fill="none" stroke="#B07A7A" stroke-width="3" stroke-linecap="round" opacity="0"/>
      <text id="ciState" x="80" y="156" fill="#D8A657" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">RUNNING</text>
      <text id="ciSub1" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">RUN #1284 &#183; PUSH</text>
      <text id="ciSub2" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">00:06.4</text>

      <!-- commit row -->
      <rect x="32" y="178" width="536" height="26" rx="5" fill="rgba(96,125,139,0.08)"/>
      <text id="ciHash" x="46" y="195" fill="#D8A657" font-size="12">a1b2c3d</text>
      <text id="ciBranch" x="118" y="195" fill="#7EA6D6" font-size="12">main</text>
      <text id="ciMsg" x="256" y="195" fill="#CFD8DC" font-size="12">Fix CAN timeout handling</text>
      <text id="ciWho" x="554" y="195" text-anchor="end" fill="#6b7780" font-size="11">a.sundqvist</text>

      <!-- pipeline spine + stages (built in JS) -->
      <line id="ciSpine" x1="64" y1="220" x2="64" y2="452" stroke="#3a4750" stroke-width="2"/>
      <g id="ciStages"></g>

      <!-- footer: recent run history -->
      <path d="M32 466H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="486" fill="#9E9E9E" font-size="9" letter-spacing="1.5">RECENT RUNS</text>
      <text id="ciPass" x="150" y="486" fill="#79C5A6" font-size="9" letter-spacing="1.5">96% PASS</text>
      <g id="ciHist"></g>
      <g id="ciStop">
        <rect id="ciStopBox" x="448" y="498" width="112" height="30" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="ciStopIcon" x="470" y="505" width="13" height="13" rx="2" fill="#B07A7A"/>
        <text id="ciStopTxt" x="491" y="517" fill="#B07A7A" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">CANCEL</text>
      </g>
    </svg>`;

  window.AstemesAnim.register({
    id: 'ci-pipeline', name: 'CI Pipeline', weight: 1, isDefault: false,
    mount: function (stage) {
      stage.innerHTML = SVG;
      var __raf = null, __torn = false;
      var panel = document.getElementById('ciPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };

      // stage timeline
      var starts = [], ends = [], acc = 0;
      for (var k = 0; k < STAGES.length; k++) { starts[k] = acc; acc += STAGES[k].d; ends[k] = acc; }
      var TEND = acc, CYCLE = TEND + HOLD;

      // ── build stage rows ──
      var sg = id('ciStages'), node = [];
      STAGES.forEach(function (st, i) {
        var y = ROWY[i], g = el('g', {});
        var circ = el('circle', { id: 'ciC' + i, cx: 64, cy: y, r: 10, fill: 'none', stroke: '#3a4750', 'stroke-width': 2 });
        var chk = el('path', { id: 'ciCk' + i, d: 'M' + (64 - 5) + ',' + y + 'l4,4 7,-8', fill: 'none', stroke: C.green, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 });
        var x = el('path', { id: 'ciXm' + i, d: 'M' + (64 - 4) + ',' + (y - 4) + 'l8,8M' + (64 + 4) + ',' + (y - 4) + 'l-8,8', fill: 'none', stroke: C.redtx, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 });
        var sp = el('circle', { id: 'ciSp' + i, cx: 64, cy: y, r: 10, fill: 'none', stroke: C.amber, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-dasharray': '30 40', opacity: 0 });
        var nm = el('text', { id: 'ciN' + i, x: 90, y: y - 2, fill: '#8a98a3', 'font-size': 13, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, st.name);
        var dt = el('text', { id: 'ciD' + i, x: 90, y: y + 12, fill: '#6b7780', 'font-size': 10.5 }, 'queued');
        var rt = el('text', { id: 'ciR' + i, x: 552, y: y + 2, 'text-anchor': 'end', fill: '#5a6873', 'font-size': 11 }, '');
        [circ, sp, chk, x, nm, dt, rt].forEach(function (n) { g.appendChild(n); });
        sg.appendChild(g); node[i] = sp;
      });
      // HIL regression test-case grid
      var grid = id('ciStages'), cell = [];
      for (var r = 0; r < GRIDR; r++) for (var cc = 0; cc < GRIDC; cc++) {
        var ce = el('rect', { id: 'ciG' + (r * GRIDC + cc), x: GX + cc * CSTEP, y: GY + r * CSTEP, width: CELL, height: CELL, rx: 1.5, fill: 'rgba(96,125,139,0.16)' });
        grid.appendChild(ce); cell[r * GRIDC + cc] = ce;
      }
      id('ciD' + HIL).setAttribute('opacity', '0');   // hide the generic detail line for HIL (grid replaces it)

      // ── recent-run history strip ──
      var hist = id('ciHist'), hbar = [], HN = 22;
      for (var h = 0; h < HN; h++) {
        var b = el('rect', { x: 232 + h * 9.4, y: 478, width: 6.5, height: 10, rx: 1.5, fill: C.green });
        hist.appendChild(b); hbar[h] = b;
      }
      var history = [];
      (function () { for (var i = 0; i < HN; i++) history.push(Math.random() < 0.9 ? 1 : 0); })();
      function drawHistory() { for (var i = 0; i < HN; i++) hbar[i].setAttribute('fill', history[i] ? C.green : C.red); }
      drawHistory();

      // ── per-run state ──
      var runNum = 1283, fail = false, failStage = -1, failCase = NCASE;
      function newRun() {
        runNum++;
        fail = Math.random() < 0.26;
        failStage = fail ? (Math.random() < 0.7 ? HIL : 1 + Math.floor(Math.random() * 2)) : -1;
        failCase = fail && failStage === HIL ? Math.floor(NCASE * (0.6 + Math.random() * 0.3)) : NCASE;
        var cm = COMMITS[runNum % COMMITS.length];
        var hex = '0123456789abcdef', hs = ''; for (var i = 0; i < 7; i++) hs += hex[Math.floor(Math.random() * 16)];
        id('ciHash').textContent = hs;
        id('ciBranch').textContent = BRANCHES[runNum % BRANCHES.length];
        id('ciMsg').textContent = cm.msg;
        id('ciWho').textContent = cm.who;
        id('ciSub1').textContent = 'RUN #' + runNum + ' \u00B7 ' + (runNum % 4 === 0 ? 'NIGHTLY' : 'PUSH');
      }
      newRun();

      var lastKey = '';
      function setStage(i, status, sub) {
        var c = id('ciC' + i), ck = id('ciCk' + i), xm = id('ciXm' + i), sp = id('ciSp' + i), nm = id('ciN' + i), dt = id('ciD' + i), rt = id('ciR' + i);
        ck.setAttribute('opacity', status === 'passed' ? '1' : '0');
        xm.setAttribute('opacity', status === 'failed' ? '1' : '0');
        sp.setAttribute('opacity', status === 'running' ? '1' : '0');
        if (status === 'passed') { c.setAttribute('stroke', C.green); c.setAttribute('fill', 'rgba(121,197,166,0.14)'); nm.setAttribute('fill', C.light); }
        else if (status === 'running') { c.setAttribute('stroke', C.amber); c.setAttribute('fill', 'rgba(216,166,87,0.12)'); nm.setAttribute('fill', C.light); }
        else if (status === 'failed') { c.setAttribute('stroke', C.red); c.setAttribute('fill', 'rgba(176,122,122,0.14)'); nm.setAttribute('fill', C.light); }
        else { c.setAttribute('stroke', C.track); c.setAttribute('fill', 'none'); nm.setAttribute('fill', C.dim); }
        if (i !== HIL) { dt.textContent = sub; dt.setAttribute('fill', status === 'running' ? C.amber : status === 'failed' ? C.redtx : status === 'passed' ? C.mut : C.dim); }
        rt.textContent = (status === 'passed' || status === 'failed') ? (STAGES[i].d / 1000).toFixed(1) + 's' : status === 'running' ? '' : '';
      }

      function setHILGrid(lit, status) {
        for (var n = 0; n < NCASE; n++) {
          var f;
          if (fail && failStage === HIL && n >= failCase && (status === 'failed' || (status === 'running' && n < lit))) f = C.red;
          else if (n < lit) f = C.green;
          else f = 'rgba(96,125,139,0.16)';
          cell[n].setAttribute('fill', f);
        }
        var passed = Math.min(lit, fail && failStage === HIL ? failCase : NCASE);
        var col = status === 'failed' ? C.redtx : status === 'running' ? C.amber : status === 'passed' ? C.mut : C.dim;
        id('ciR' + HIL).textContent = (status === 'queued') ? '' : passed + ' / ' + NCASE;
        id('ciR' + HIL).setAttribute('fill', col);
        id('ciN' + HIL).setAttribute('fill', status === 'queued' ? C.dim : C.light);
      }

      function render(c, el) {
        var runState = 'running', curStage = -1;
        for (var i = 0; i < STAGES.length; i++) {
          var status;
          if (fail && i > failStage) status = 'skipped';
          else if (c >= ends[i]) status = (i === failStage) ? 'failed' : 'passed';
          else if (c >= starts[i]) { status = (i === failStage) ? 'running' : 'running'; curStage = i; }
          else status = 'queued';
          if (i === HIL) {
            var p = clamp((c - starts[HIL]) / STAGES[HIL].d, 0, 1);
            var lit = Math.round(p * NCASE);
            // if this run fails at HIL, mark failed once its window elapses
            if (fail && failStage === HIL && c >= ends[HIL]) status = 'failed';
            setHILGrid(status === 'queued' ? 0 : lit, status === 'failed' ? 'failed' : (c >= ends[HIL] ? 'passed' : status));
            setStage(i, status === 'failed' ? 'failed' : status, '');
          } else {
            setStage(i, status, status === 'passed' || status === 'failed' ? STAGES[i].done : status === 'running' ? 'running\u2026' : 'queued');
          }
        }
        // spine fill colour up to current progress
        var donF = clamp(c / TEND, 0, 1);
        id('ciSpine').setAttribute('stroke', fail && c >= ends[failStage] ? C.red : C.track);

        // overall state
        var finished = c >= TEND || (fail && c >= ends[failStage]);
        var st = !finished ? 'running' : (fail ? 'failed' : 'passed');
        var key = st + ':' + curStage;
        if (key !== lastKey) {
          lastKey = key;
          var col = st === 'running' ? C.amber : st === 'passed' ? C.green : C.red;
          var bg = st === 'running' ? 'rgba(216,166,87,0.10)' : st === 'passed' ? 'rgba(121,197,166,0.12)' : 'rgba(176,122,122,0.12)';
          id('ciBanner').setAttribute('fill', bg); id('ciBanner').setAttribute('stroke', col);
          id('ciState').textContent = st === 'running' ? 'RUNNING' : st === 'passed' ? 'PASSED' : 'FAILED';
          id('ciState').setAttribute('fill', col);
          id('ciSpin').setAttribute('opacity', st === 'running' ? '1' : '0');
          id('ciChk').setAttribute('opacity', st === 'passed' ? '1' : '0');
          id('ciX').setAttribute('opacity', st === 'failed' ? '1' : '0');
          setStopBtn(st === 'running' && !stopped);
        }
        id('ciSub2').textContent = '00:' + (Math.min(c, TEND) / 1000).toFixed(1).padStart(4, '0');
        if (st === 'running') id('ciSpin').setAttribute('transform', 'rotate(' + ((el * 0.4) % 360).toFixed(1) + ' 54 147)');
      }

      // ── cancel / re-arm ──
      var stopped = false;
      function abort() {
        if (stopped) return; stopped = true; lastKey = '';
        id('ciBanner').setAttribute('fill', 'rgba(96,125,139,0.08)'); id('ciBanner').setAttribute('stroke', C.gmut);
        id('ciState').textContent = 'CANCELLED'; id('ciState').setAttribute('fill', C.gmut);
        id('ciSpin').setAttribute('opacity', '0'); id('ciChk').setAttribute('opacity', '0'); id('ciX').setAttribute('opacity', '0');
        setStopBtn(false); setTimeout(rearm, 2600);
      }
      function rearm() { stopped = false; if (!mqDesktop.matches) return; history.push(0); history.shift(); drawHistory(); newRun(); t0 = null; lastC = 0; lastKey = ''; startLoop(); }
      function setStopBtn(on) {
        var col = on ? C.red : C.queue, g = id('ciStop');
        id('ciStopBox').setAttribute('stroke', col); id('ciStopBox').setAttribute('opacity', on ? '1' : '0.5');
        id('ciStopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        id('ciStopTxt').setAttribute('fill', col); id('ciStopIcon').setAttribute('fill', col);
        g.style.pointerEvents = on ? 'auto' : 'none'; g.style.cursor = on ? 'pointer' : 'default';
      }
      id('ciStop').addEventListener('click', abort);

      var mqDesktop = window.matchMedia('(min-width: 1px)');
      if (reduce) { if (mqDesktop.matches) render(starts[HIL] + 2600, 0); return; }

      var t0 = null, lastC = 0, ticking = false;
      function frame(ts) {
        if (__torn || stopped || !mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        var el = ts - t0, c = el % CYCLE;
        if (c < lastC) { history.push(fail ? 0 : 1); history.shift(); drawHistory(); var pass = history.reduce(function (a, b) { return a + b; }, 0); id('ciPass').textContent = Math.round(pass / HN * 100) + '% PASS'; newRun(); }
        lastC = c;
        render(c, el);
        __raf = requestAnimationFrame(frame);
      }
      function startLoop() { if (ticking || stopped || !mqDesktop.matches) return; ticking = true; t0 = null; __raf = requestAnimationFrame(frame); }
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
