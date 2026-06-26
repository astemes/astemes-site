/* Astemes "Sequence Executive" — animated hero instrument panel (test-sequencer variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). An original take on a sequence executive (not a clone of any
   product UI): a hierarchical test sequence runs top-to-bottom with Setup / Main / Cleanup groups,
   a For-loop that iterates over channels, an If branch, and pass/fail status per step. When a Main
   step fails the rest of Main is skipped but Cleanup still runs, then the next UUT loads. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', steel:'#B8C2C9',
            light:'#CFD8DC', white:'#FFFFFF', dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A', redtx:'#D69191', track:'#3a4750' };

  // the static display tree (depth, kind, name, + numeric limits where relevant)
  var ROWS = [
    { d: 0, k: 'seq',   n: 'MainSequence' },
    { d: 1, k: 'group', n: 'Setup' },
    { d: 2, k: 'act',   n: 'Connect Instruments' },
    { d: 2, k: 'act',   n: 'Power On Supply' },
    { d: 1, k: 'group', n: 'Main' },
    { d: 2, k: 'pf',    n: 'Power-On Self Test' },
    { d: 2, k: 'num',   n: 'Supply Voltage', nom: 12.0,  sp: 0.16, dec: 2, unit: 'V',  lo: 11.4, hi: 12.6 },
    { d: 2, k: 'loop',  n: 'For Each Channel' },
    { d: 3, k: 'num',   n: 'Measure Offset',  nom: 2.2,  sp: 0.7,  dec: 1, unit: 'mV', hi: 5.0 },
    { d: 3, k: 'num',   n: 'Measure Gain',    nom: 1.001, sp: 0.006, dec: 3, unit: '',  lo: 0.98, hi: 1.02 },
    { d: 2, k: 'ifc',   n: 'If Temp < 40 \u00B0C' },
    { d: 3, k: 'num',   n: 'Thermal Drift',   nom: 0.8,  sp: 0.3,  dec: 2, unit: '%',  hi: 2.0 },
    { d: 2, k: 'str',   n: 'Firmware CRC' },
    { d: 1, k: 'group', n: 'Cleanup' },
    { d: 2, k: 'act',   n: 'Power Off' },
    { d: 2, k: 'act',   n: 'Disconnect' }
  ];
  var DUR = { 2: 400, 3: 500, 5: 600, 6: 500, 8: 360, 9: 360, 10: 220, 11: 520, 12: 460, 14: 360, 15: 320 };
  // leaf execution order (row index + loop iteration); Cleanup is separate so it can always run
  var MAIN = [2, 3, 5, 6, [8, 1], [9, 1], [8, 2], [9, 2], [8, 3], [9, 3], [8, 4], [9, 4], 10, 11, 12];
  var CLEAN = [14, 15];
  var FAILABLE = { 5: 1, 6: 1, 8: 1, 9: 1, 11: 1, 12: 1 };
  var MEMBERS = { 1: [2, 3], 4: [5, 6, 8, 9, 10, 11, 12], 7: [8, 9], 13: [14, 15], 0: [2, 3, 5, 6, 8, 9, 10, 11, 12, 14, 15] };
  var TY0 = 200, RH = 16.4, HOLD = 2200;

  var SVG =
  `<svg id="seqPanel" viewBox="0 0 600 560" role="img"
        aria-label="A test sequence executive running a hierarchical sequence with Setup, Main and Cleanup groups, a loop iterating over channels, an If branch and per-step pass/fail status, executing top to bottom on a unit under test."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <!-- panel -->
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">SEQUENCE EXECUTIVE</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- header info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SEQUENCE</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">DriveBoard_FVT.seq</text>
      <text x="288" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">MODEL</text>
      <text x="288" y="100" fill="#CFD8DC" font-size="13">Sequential</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">UUT</text>
      <text id="seqUut" x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">24-0918</text>

      <!-- status banner -->
      <rect id="seqBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(216,166,87,0.10)" stroke="#D8A657" stroke-width="1.5"/>
      <g id="seqSpin" transform="rotate(0 54 147)">
        <circle cx="54" cy="147" r="11" fill="none" stroke="#D8A657" stroke-width="3" stroke-linecap="round" stroke-dasharray="52 70"/>
      </g>
      <path id="seqChk" d="M47 147l5 6 12-15" fill="none" stroke="#79C5A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      <path id="seqX" d="M47 140l14 14M61 140l-14 14" fill="none" stroke="#B07A7A" stroke-width="3" stroke-linecap="round" opacity="0"/>
      <text id="seqState" x="80" y="156" fill="#D8A657" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">RUNNING</text>
      <text id="seqSub1" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">EXECUTING</text>
      <text id="seqSub2" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">Main &#8250; For Each Channel</text>

      <!-- execution tree (built in JS) -->
      <g id="seqTree"></g>

      <!-- footer -->
      <path d="M32 462H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text id="seqElapsed" x="40" y="500" fill="#9E9E9E" font-size="12">ELAPSED 0.0 s &#183; 0 PASSED &#183; 0 FAILED</text>
      <g id="seqStop">
        <rect id="seqStopBox" x="448" y="484" width="112" height="32" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="seqStopIcon" x="472" y="492" width="14" height="14" rx="2" fill="#B07A7A"/>
        <text id="seqStopTxt" x="494" y="504" fill="#B07A7A" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP</text>
      </g>
    </svg>`;

  function boot() {
    var mount = document.querySelector('.hero-visual');
    if (!mount || mount.querySelector('#seqPanel')) return;
    mount.innerHTML = SVG;

    (function () {
      var panel = document.getElementById('seqPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      function gauss() { return ((Math.random() + Math.random() + Math.random()) - 1.5) / 0.5; }

      // ── build tree rows ──
      var tree = id('seqTree');
      ROWS.forEach(function (r, i) {
        var y = TY0 + i * RH, ix = 46 + r.d * 17, isC = (r.k === 'seq' || r.k === 'group' || r.k === 'loop');
        tree.appendChild(el('rect', { id: 'seqHi' + i, x: 24, y: y - 12, width: 552, height: RH - 1, fill: 'rgba(216,166,87,0.09)', opacity: 0 }));
        tree.appendChild(el('rect', { id: 'seqBar' + i, x: 24, y: y - 12, width: 3, height: RH - 1, fill: '#D8A657', opacity: 0 }));
        if (isC) tree.appendChild(el('path', { id: 'seqTri' + i, d: 'M' + ix + ',' + (y - 5) + 'l5,3l-5,3z', fill: '#6b7780' }));
        else tree.appendChild(el('circle', { id: 'seqDot' + i, cx: ix + 2.5, cy: y - 2.5, r: 3, fill: 'none', stroke: '#4a5862', 'stroke-width': 1.6 }));
        tree.appendChild(el('text', { id: 'seqN' + i, x: ix + 14, y: y, fill: isC ? '#CFD8DC' : '#7c8893', 'font-size': isC ? 12.5 : 12, 'font-family': isC ? "'Space Grotesk',sans-serif" : "'DM Mono',monospace", 'font-weight': isC ? 600 : 400 }, r.n));
        tree.appendChild(el('text', { id: 'seqV' + i, x: 552, y: y, 'text-anchor': 'end', 'font-size': 11.5, fill: '#5a6873' }, ''));
      });

      // ── per-UUT run construction ──
      var uut = 918, run;
      function genVal(ri, fail) {
        var r = ROWS[ri];
        if (r.k === 'act') return { v: '', pass: true };
        if (r.k === 'pf')  return { v: fail ? '0x21 ERR' : '0x00 OK', pass: !fail };
        if (r.k === 'str') return { v: fail ? '0x0000 ✗' : '0x9F3A', pass: !fail };
        if (r.k === 'ifc') return { v: 'True', pass: true };
        // numeric
        var x;
        if (fail) {
          var span = (r.hi != null && r.lo != null) ? (r.hi - r.lo) : (r.hi != null ? r.hi * 0.2 : r.lo * 0.2);
          var over = (0.06 + Math.random() * 0.18) * span;
          x = (r.hi != null && (r.lo == null || Math.random() < 0.5)) ? r.hi + over : r.lo - over;
        } else {
          x = r.nom + clamp(gauss(), -2.4, 2.4) * r.sp;
        }
        var pass = !((r.lo != null && x < r.lo) || (r.hi != null && x > r.hi));
        return { v: x.toFixed(r.dec) + (r.unit ? ' ' + r.unit : ''), pass: pass };
      }
      function newRun() {
        uut++; id('seqUut').textContent = '24-' + String(uut).padStart(4, '0');
        var fail = Math.random() < 1 / 6;
        // choose which Main leaf fails
        var elig = []; MAIN.forEach(function (m, j) { var ri = Array.isArray(m) ? m[0] : m; if (FAILABLE[ri]) elig.push(j); });
        var failJ = fail ? elig[Math.floor(Math.random() * elig.length)] : -1;
        var seq = [];
        for (var j = 0; j < MAIN.length; j++) {
          var m = MAIN[j], ri = Array.isArray(m) ? m[0] : m, it = Array.isArray(m) ? m[1] : 0;
          var isFail = (j === failJ);
          seq.push({ r: ri, it: it, fail: isFail, val: genVal(ri, isFail) });
          if (isFail) break;   // rest of Main skipped
        }
        CLEAN.forEach(function (ri) { seq.push({ r: ri, it: 0, fail: false, val: genVal(ri, false) }); });
        var acc = 0; seq.forEach(function (s) { s.start = acc; acc += DUR[s.r]; s.end = acc; });
        // rows that never execute on this run (for 'skipped' display)
        var ran = {}; seq.forEach(function (s) { ran[s.r] = 1; });
        var skipped = {};
        if (fail) MAIN.forEach(function (m) { var ri = Array.isArray(m) ? m[0] : m; if (!ran[ri]) skipped[ri] = 1; });
        run = { seq: seq, TEND: acc, CYCLE: acc + HOLD, fail: fail, skipped: skipped };
      }
      newRun();

      function containerStatus(ci, rs) {
        var mem = MEMBERS[ci], anyRun = false, anyFail = false, anyPass = false, anyIdle = false;
        mem.forEach(function (r) { var s = rs[r] || 'idle'; if (s === 'running') anyRun = true; else if (s === 'failed') anyFail = true; else if (s === 'passed') anyPass = true; else if (s === 'idle') anyIdle = true; });
        if (anyRun) return 'running';
        if (anyFail) return 'failed';
        if (anyPass && anyIdle) return 'running';
        if (anyPass && !anyIdle) return 'passed';
        return 'idle';
      }

      var lastKey = '';
      function applyRow(i, status, valTxt, valCol, iterTxt) {
        var hi = id('seqHi' + i), bar = id('seqBar' + i), nm = id('seqN' + i), v = id('seqV' + i),
            dot = id('seqDot' + i), tri = id('seqTri' + i), isC = !dot;
        var on = status === 'running';
        hi.setAttribute('opacity', on ? '1' : '0'); bar.setAttribute('opacity', on ? '1' : '0');
        var nmCol = status === 'idle' ? (isC ? '#7c8893' : '#5a6873') : (isC ? C.light : '#aeb8c0');
        nm.setAttribute('fill', nmCol);
        if (dot) {
          var col = status === 'passed' ? C.green : status === 'failed' ? C.red : status === 'running' ? C.amber : '#4a5862';
          dot.setAttribute('stroke', col);
          dot.setAttribute('fill', status === 'passed' ? C.green : status === 'failed' ? C.red : status === 'running' ? 'rgba(216,166,87,0.4)' : 'none');
        } else if (tri) {
          tri.setAttribute('fill', status === 'running' ? C.amber : status === 'passed' ? C.green : status === 'failed' ? C.red : '#6b7780');
        }
        v.textContent = valTxt; v.setAttribute('fill', valCol);
      }

      function render(c, el) {
        var rs = {}, rv = {}, curRow = -1, curIt = 0, passN = 0, failN = 0;
        var sq = run.seq;
        for (var j = 0; j < sq.length; j++) {
          var inst = sq[j];
          if (c >= inst.end) { rs[inst.r] = inst.fail ? 'failed' : 'passed'; rv[inst.r] = inst.val; if (inst.fail) failN++; else if (ROWS[inst.r].k !== 'act' && ROWS[inst.r].k !== 'ifc') passN++; }
          else if (c >= inst.start) { rs[inst.r] = 'running'; rv[inst.r] = inst.val; curRow = inst.r; curIt = inst.it; break; }
          else break;
        }
        for (var s in run.skipped) if (!rs[s]) rs[s] = 'skipped';

        ROWS.forEach(function (r, i) {
          var st = rs[i] || 'idle', isC = (r.k === 'seq' || r.k === 'group' || r.k === 'loop');
          if (isC) st = containerStatus(i, rs);
          var valTxt = '', valCol = '#5a6873';
          if (isC) {
            if (r.k === 'loop') {
              valTxt = st === 'running' ? 'iter ' + (curRow === 8 || curRow === 9 ? curIt : 4) + ' / 4' : st === 'passed' ? '4 / 4 ✓' : st === 'failed' ? 'stopped' : '';
            } else valTxt = st === 'running' ? 'running' : st === 'passed' ? 'Done' : st === 'failed' ? 'Failed' : '';
            valCol = st === 'running' ? C.amber : st === 'passed' ? C.green : st === 'failed' ? C.redtx : '#5a6873';
          } else if (st === 'running') { valTxt = (r.k === 'act') ? 'running…' : ((rv[i] && rv[i].v) || 'measuring…'); valCol = C.amber; }
          else if (st === 'passed') { valTxt = (r.k === 'act') ? 'Done' : (rv[i] ? rv[i].v : ''); valCol = (rv[i] && rv[i].pass === false) ? C.redtx : C.green; }
          else if (st === 'failed') { valTxt = rv[i] ? rv[i].v : 'Failed'; valCol = C.redtx; }
          else if (st === 'skipped') { valTxt = 'skipped'; valCol = '#5a6873'; }
          applyRow(i, st, valTxt, valCol, '');
        });

        // banner
        var finished = c >= run.TEND;
        var st = !finished ? 'running' : (run.fail ? 'failed' : 'passed');
        var path = curRow >= 0 ? crumb(curRow) : (st === 'passed' ? 'Sequence complete' : 'Cleanup complete');
        var key = st + ':' + curRow;
        if (key !== lastKey) {
          lastKey = key;
          var col = st === 'running' ? C.amber : st === 'passed' ? C.green : C.red;
          var bg = st === 'running' ? 'rgba(216,166,87,0.10)' : st === 'passed' ? 'rgba(121,197,166,0.12)' : 'rgba(176,122,122,0.12)';
          id('seqBanner').setAttribute('fill', bg); id('seqBanner').setAttribute('stroke', col);
          id('seqState').textContent = st === 'running' ? 'RUNNING' : st === 'passed' ? 'PASSED' : 'FAILED';
          id('seqState').setAttribute('fill', col);
          id('seqSpin').setAttribute('opacity', st === 'running' ? '1' : '0');
          id('seqChk').setAttribute('opacity', st === 'passed' ? '1' : '0');
          id('seqX').setAttribute('opacity', st === 'failed' ? '1' : '0');
          id('seqSub1').textContent = st === 'running' ? 'EXECUTING' : st === 'passed' ? 'ALL STEPS PASSED' : 'STOPPED ON FAILURE';
          setStopBtn(st === 'running' && !stopped);
        }
        id('seqSub2').textContent = path;
        id('seqElapsed').textContent = 'ELAPSED ' + (Math.min(c, run.TEND) / 1000).toFixed(1) + ' s \u00B7 ' + passN + ' PASSED \u00B7 ' + failN + ' FAILED';
        if (st === 'running') id('seqSpin').setAttribute('transform', 'rotate(' + ((el * 0.4) % 360).toFixed(1) + ' 54 147)');
      }
      function crumb(r) {
        var grp = r <= 3 ? 'Setup' : r >= 14 ? 'Cleanup' : 'Main';
        if (r === 8 || r === 9) return 'Main \u203A For Each Channel \u203A ' + ROWS[r].n;
        if (r === 11) return 'Main \u203A If Temp \u203A ' + ROWS[r].n;
        return grp + ' \u203A ' + ROWS[r].n;
      }

      // ── stop / re-arm ──
      var stopped = false;
      function abort() {
        if (stopped) return; stopped = true; lastKey = '';
        id('seqBanner').setAttribute('fill', 'rgba(96,125,139,0.08)'); id('seqBanner').setAttribute('stroke', C.gmut);
        id('seqState').textContent = 'ABORTED'; id('seqState').setAttribute('fill', C.gmut);
        id('seqSpin').setAttribute('opacity', '0'); id('seqChk').setAttribute('opacity', '0'); id('seqX').setAttribute('opacity', '0');
        id('seqSub1').textContent = 'HALTED BY OPERATOR';
        setStopBtn(false); setTimeout(rearm, 2400);
      }
      function rearm() { stopped = false; if (!mqDesktop.matches) return; newRun(); t0 = null; lastC = 0; lastKey = ''; startLoop(); }
      function setStopBtn(on) {
        var col = on ? C.red : C.queue, g = id('seqStop');
        id('seqStopBox').setAttribute('stroke', col); id('seqStopBox').setAttribute('opacity', on ? '1' : '0.5');
        id('seqStopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        id('seqStopTxt').setAttribute('fill', col); id('seqStopIcon').setAttribute('fill', col);
        g.style.pointerEvents = on ? 'auto' : 'none'; g.style.cursor = on ? 'pointer' : 'default';
      }
      id('seqStop').addEventListener('click', abort);
      setStopBtn(true);

      var mqDesktop = window.matchMedia('(min-width: 1081px)');
      if (reduce) { if (mqDesktop.matches) render(run.seq[6].start + 150, 0); return; }

      var t0 = null, lastC = 0, ticking = false;
      function frame(ts) {
        if (stopped || !mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        var el = ts - t0, c = el % run.CYCLE;
        if (c < lastC) newRun();
        lastC = c;
        render(c, el);
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
