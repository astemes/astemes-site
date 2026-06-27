/* Astemes "LabVIEW CI/CD" — animated hero instrument panel (build-pipeline variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A continuous-delivery pipeline for a CUSTOMER LabVIEW code
   base: a commit flows left-to-right through Checkout, LUnit Tests, VI Analyzer, Diff Report,
   Build, Package and Upload. Each stage lights up in turn and a detail card below shows that
   stage's real output (test segments, analyzer findings, changed-VI diff, build/upload progress).
   Most runs go green; occasionally LUnit or VI Analyzer fails, downstream stages skip, and the
   next commit comes in clean. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', red:'#B07A7A', redtx:'#D69191', track:'#2f3c44' };

  var STAGES = [
    { key: 'checkout', name: 'Checkout',    d: 900 },
    { key: 'lunit',    name: 'LUnit Tests', d: 2600 },
    { key: 'vian',     name: 'VI Analyzer', d: 2200 },
    { key: 'diff',     name: 'Diff Report', d: 1500 },
    { key: 'setver',   name: 'Set Version', d: 750 },
    { key: 'build',    name: 'Build',       d: 2800 },
    { key: 'package',  name: 'Package',     d: 1700 },
    { key: 'upload',   name: 'Upload',      d: 1600 }
  ];
  var NODEX = [68, 135, 203, 270, 338, 405, 473, 540], NY = 232, HOLD = 2200;
  var FAILABLE = { lunit: 1, vian: 1 };

  var COMMITS = [
    { msg: 'Add OV-trip self test',        who: 'm.holm',     br: 'feature/ov-trip' },
    { msg: 'Fix DMM range autoswitch',     who: 'a.sundqvist',br: 'main' },
    { msg: 'Refactor sequence loader',     who: 'j.back',     br: 'main' },
    { msg: 'Update fixture calibration',   who: 'm.holm',     br: 'fix/cal' },
    { msg: 'Speed up report generation',   who: 'a.sundqvist',br: 'main' }
  ];
  var VIS = ['MainSequence.vi', 'Acquire.vi', 'DMM_Driver.vi', 'ReportGen.vi', 'Limits.vi', 'FixtureIO.vi', 'Calibrate.vi', 'Init.vi'];

  var SVG =
  `<svg id="lvPanel" viewBox="0 0 600 560" role="img"
        aria-label="A LabVIEW continuous-delivery pipeline for a customer code base: a commit flows through Checkout, LUnit tests, VI Analyzer, Diff Report, Build, Package and Upload, with a detail card showing each stage's output. Most runs pass; some fail at LUnit or VI Analyzer and skip the rest."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">LABVIEW CI / CD</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">REPOSITORY</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">acme-instruments/test-station</text>
      <text x="400" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">LABVIEW</text>
      <text x="400" y="100" fill="#CFD8DC" font-size="13">2023 Q3</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">AGENT</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">build-win-01</text>

      <!-- status banner -->
      <rect id="lvBanner" x="32" y="118" width="536" height="50" rx="8" fill="rgba(216,166,87,0.10)" stroke="#D8A657" stroke-width="1.5"/>
      <g id="lvSpin" transform="rotate(0 54 143)">
        <circle cx="54" cy="143" r="10" fill="none" stroke="#D8A657" stroke-width="3" stroke-linecap="round" stroke-dasharray="46 64"/>
      </g>
      <path id="lvChk" d="M47 143l5 6 12-15" fill="none" stroke="#79C5A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      <path id="lvX" d="M47 136l14 14M61 136l-14 14" fill="none" stroke="#B07A7A" stroke-width="3" stroke-linecap="round" opacity="0"/>
      <text id="lvState" x="78" y="151" fill="#D8A657" font-size="20" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">RUNNING</text>
      <text id="lvSub1" x="552" y="138" text-anchor="end" fill="#9E9E9E" font-size="10" letter-spacing="1.5">PIPELINE #842 &#183; PUSH</text>
      <text id="lvSub2" x="552" y="156" text-anchor="end" fill="#CFD8DC" font-size="12.5">00:06.4</text>

      <!-- commit row -->
      <rect x="32" y="174" width="536" height="24" rx="5" fill="rgba(96,125,139,0.08)"/>
      <text id="lvHash" x="46" y="190" fill="#D8A657" font-size="11.5">a1b2c3d</text>
      <text id="lvBranch" x="116" y="190" fill="#7EA6D6" font-size="11.5">main</text>
      <text id="lvMsg" x="210" y="190" fill="#CFD8DC" font-size="11.5">Fix DMM range autoswitch</text>
      <text id="lvWho" x="554" y="190" text-anchor="end" fill="#6b7780" font-size="10.5">a.sundqvist</text>

      <!-- pipeline node flow -->
      <g id="lvFlow"></g>
      <g id="lvNodes"></g>

      <!-- detail card -->
      <rect x="44" y="278" width="512" height="120" rx="6" fill="#0d1417" stroke="#34424b"/>
      <text id="lvDTitle" x="58" y="300" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600">LUnit Tests</text>
      <text id="lvDStat" x="542" y="300" text-anchor="end" fill="#D8A657" font-size="11">running\u2026</text>
      <line x1="58" y1="308" x2="542" y2="308" stroke="rgba(96,125,139,0.18)"/>
      <g id="lvSeg"></g>
      <rect id="lvBarTrack" x="58" y="326" width="484" height="6" rx="3" fill="rgba(96,125,139,0.2)" opacity="0"/>
      <rect id="lvBarFill" x="58" y="326" width="0" height="6" rx="3" fill="#79C5A6" opacity="0"/>
      <g id="lvLines"></g>

      <!-- recent runs -->
      <text x="40" y="424" fill="#9E9E9E" font-size="9" letter-spacing="1.5">RECENT</text>
      <text id="lvRate" x="100" y="424" fill="#79C5A6" font-size="9" letter-spacing="1.5">92% PASS</text>
      <g id="lvHist"></g>

      <path d="M32 440H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text id="lvFoot" x="40" y="466" fill="#9E9E9E" font-size="12">ARTIFACT test-station-2.4.1.nipkg &#183; 18.4 MB</text>
      <g id="lvStop">
        <rect id="lvStopBox" x="452" y="450" width="108" height="28" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="lvStopIcon" x="472" y="457" width="13" height="13" rx="2" fill="#B07A7A"/>
        <text id="lvStopTxt" x="493" y="468" fill="#B07A7A" font-size="12.5" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">ABORT</text>
      </g>
    </svg>`;

  window.AstemesAnim.register({
    id: 'lv-cicd', name: 'LabVIEW CI/CD', weight: 1, isDefault: false,
    mount: function (stage) {
      stage.innerHTML = SVG;
      var __raf = null, __torn = false;
      var panel = document.getElementById('lvPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

      // timeline (with a settle pause after each finished stage so results are readable)
      var starts = [], ends = [], acc = 0, SETTLE = 650;
      STAGES.forEach(function (s, i) { starts[i] = acc; acc += s.d; ends[i] = acc; acc += SETTLE; });
      var TEND = ends[STAGES.length - 1], CYCLE = acc + HOLD;

      // flow connectors
      var flowG = id('lvFlow'), conn = [];
      for (var i = 0; i < STAGES.length - 1; i++) {
        flowG.appendChild(el('line', { x1: NODEX[i] + 16, y1: NY, x2: NODEX[i + 1] - 16, y2: NY, stroke: C.track, 'stroke-width': 2 }));
        conn[i] = el('line', { id: 'lvCn' + i, x1: NODEX[i] + 16, y1: NY, x2: NODEX[i] + 16, y2: NY, stroke: C.green, 'stroke-width': 2 });
        flowG.appendChild(conn[i]);
      }
      // nodes
      var nodesG = id('lvNodes');
      STAGES.forEach(function (s, i) {
        var x = NODEX[i];
        nodesG.appendChild(el('rect', { id: 'lvNb' + i, x: x - 15, y: NY - 15, width: 30, height: 30, rx: 7, fill: 'rgba(96,125,139,0.08)', stroke: C.track, 'stroke-width': 1.6 }));
        nodesG.appendChild(el('circle', { id: 'lvNd' + i, cx: x, cy: NY, r: 3.4, fill: C.track }));
        nodesG.appendChild(el('circle', { id: 'lvNs' + i, cx: x, cy: NY, r: 10, fill: 'none', stroke: C.amber, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-dasharray': '30 38', opacity: 0 }));
        nodesG.appendChild(el('path', { id: 'lvNc' + i, d: 'M' + (x - 5) + ',' + NY + 'l4,4 7,-8', fill: 'none', stroke: C.green, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }));
        nodesG.appendChild(el('path', { id: 'lvNx' + i, d: 'M' + (x - 4) + ',' + (NY - 4) + 'l8,8M' + (x + 4) + ',' + (NY - 4) + 'l-8,8', fill: 'none', stroke: C.redtx, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }));
        nodesG.appendChild(el('text', { id: 'lvNl' + i, x: x, y: NY + 28, 'text-anchor': 'middle', fill: C.mut, 'font-size': 8.5 }, s.name));
      });

      // detail: segmented test ticks
      var segG = id('lvSeg'), NSEG = 48, seg = [];
      for (var k = 0; k < NSEG; k++) { seg[k] = segG.appendChild(el('rect', { x: 58 + k * 10.1, y: 320, width: 7.5, height: 14, rx: 1.5, fill: 'rgba(96,125,139,0.18)' })); }
      // detail: text lines (3 rows: label left + value right)
      var linesG = id('lvLines'), line = [];
      for (var r = 0; r < 3; r++) {
        var lab = linesG.appendChild(el('text', { id: 'lvLl' + r, x: 58, y: 352 + r * 17, fill: C.mut, 'font-size': 10.5, 'font-family': "'DM Mono',monospace" }, ''));
        var val = linesG.appendChild(el('text', { id: 'lvLv' + r, x: 542, y: 352 + r * 17, 'text-anchor': 'end', fill: C.light, 'font-size': 10.5, 'font-family': "'DM Mono',monospace" }, ''));
        line[r] = { lab: lab, val: val };
      }
      function setLine(r, lab, val, vcol) { line[r].lab.textContent = lab || ''; line[r].val.textContent = val || ''; line[r].val.setAttribute('fill', vcol || C.light); }
      function showSeg(on) { id('lvSeg').setAttribute('opacity', on ? '1' : '0'); }
      function showBar(on) { id('lvBarTrack').setAttribute('opacity', on ? '1' : '0'); id('lvBarFill').setAttribute('opacity', on ? '1' : '0'); }

      // history
      var histG = id('lvHist'), hbar = [], HN = 24;
      for (var h = 0; h < HN; h++) hbar[h] = histG.appendChild(el('rect', { x: 168 + h * 9.0, y: 416, width: 6.5, height: 10, rx: 1.5, fill: C.green }));
      var history = []; for (var i2 = 0; i2 < HN; i2++) history.push(Math.random() < 0.9 ? 1 : 0);
      function drawHist() { for (var i = 0; i < HN; i++) hbar[i].setAttribute('fill', history[i] ? C.green : C.red); }
      drawHist();

      // ── per-run ──
      var pipeNo = 841, run;
      function newRun() {
        pipeNo++;
        var fail = Math.random() < 0.22;
        var failKey = fail ? (Math.random() < 0.6 ? 'lunit' : 'vian') : null;
        var failIdx = fail ? STAGES.map(function (s) { return s.key; }).indexOf(failKey) : -1;
        var cm = COMMITS[pipeNo % COMMITS.length];
        var hx = '0123456789abcdef', hs = ''; for (var i = 0; i < 7; i++) hs += hx[Math.floor(Math.random() * 16)];
        var changed = []; var pool = VIS.slice(); for (var c = 0; c < 4; c++) { var v = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; changed.push({ v: v, add: 2 + Math.floor(Math.random() * 40), del: Math.floor(Math.random() * 14) }); }
        run = {
          fail: fail, failIdx: failIdx, failKey: failKey, hs: hs, cm: cm,
          lunitTotal: 130 + Math.floor(Math.random() * 30), lunitFail: failKey === 'lunit' ? 1 + Math.floor(Math.random() * 2) : 0,
          warn: 3 + Math.floor(Math.random() * 8), style: 8 + Math.floor(Math.random() * 12), errors: failKey === 'vian' ? 1 + Math.floor(Math.random() * 3) : 0,
          changed: changed, buildMB: (15 + Math.random() * 8).toFixed(1),
          ver: '2.4.' + (pipeNo % 9), pipe: pipeNo
        };
        id('lvHash').textContent = hs; id('lvBranch').textContent = cm.br; id('lvMsg').textContent = cm.msg; id('lvWho').textContent = cm.who;
        id('lvSub1').textContent = 'PIPELINE #' + pipeNo + ' \u00B7 ' + (pipeNo % 4 === 0 ? 'NIGHTLY' : 'PUSH');
        id('lvFoot').textContent = 'ARTIFACT test-station-2.4.' + (pipeNo % 9) + '.nipkg \u00B7 ' + run.buildMB + ' MB';
      }
      newRun();

      function detail(si, p, status) {
        var s = STAGES[si], run_ = run;
        id('lvDTitle').textContent = s.name;
        var stcol = status === 'failed' ? C.redtx : status === 'passed' ? C.green : C.amber;
        id('lvDStat').textContent = status === 'running' ? 'running\u2026' : status === 'passed' ? 'passed' : status === 'failed' ? 'failed' : '';
        id('lvDStat').setAttribute('fill', stcol);
        showSeg(false); showBar(false); setLine(0, '', ''); setLine(1, '', ''); setLine(2, '', '');
        var fillCol = status === 'failed' ? C.red : status === 'passed' ? C.green : C.amber;

        if (s.key === 'lunit') {
          showSeg(true);
          var finished = (status === 'passed' || status === 'failed');
          var done = finished ? NSEG : Math.round(p * NSEG);
          var failAt = run_.lunitFail ? NSEG - run_.lunitFail : NSEG + 1;
          // a completed test only turns red once the run has finished and the verdict is known
          for (var k = 0; k < NSEG; k++) seg[k].setAttribute('fill', k < done ? ((finished && k >= failAt) ? C.red : C.green) : 'rgba(96,125,139,0.18)');
          var ran = Math.round((done / NSEG) * run_.lunitTotal), passed = run_.lunitTotal - run_.lunitFail;
          setLine(1, 'assertions', (ran * 7) + ' checks', C.mut);
          if (finished) setLine(2, 'result', run_.lunitFail ? passed + ' / ' + run_.lunitTotal + '  \u00B7 ' + run_.lunitFail + ' FAILED' : run_.lunitTotal + ' / ' + run_.lunitTotal + ' passed', run_.lunitFail ? C.redtx : C.green);
          else setLine(2, 'running', ran + ' / ' + run_.lunitTotal + ' tests', C.amber);
        } else if (s.key === 'vian') {
          var finishedV = (status === 'passed' || status === 'failed');
          if (finishedV) {
            setLine(0, 'errors', '' + run_.errors, run_.errors > 0 ? C.redtx : C.green);
            setLine(1, 'warnings', '' + run_.warn, C.amber);
            setLine(2, 'style hints  \u00b7  1,284 VIs scanned', '' + run_.style, C.mut);
          } else {
            setLine(0, 'scanning VIs', Math.round(p * 1284).toLocaleString('en-US') + ' / 1,284', C.amber);
            setLine(1, '', '');
            setLine(2, '', '');
          }
        } else if (s.key === 'setver') {
          setLine(0, 'version', 'v' + run_.ver, C.green);
          setLine(1, 'build number', '#' + run_.pipe, C.light);
          setLine(2, 'stamped on', '1,284 VIs + build spec', C.mut);
        } else if (s.key === 'diff') {
          for (var d = 0; d < 3; d++) { var ch = run_.changed[d]; setLine(d, ch.v, '+' + ch.add + ' / \u2212' + ch.del, C.light); }
        } else if (s.key === 'checkout') {
          showBar(true); id('lvBarFill').setAttribute('width', (484 * (status === 'passed' ? 1 : p)).toFixed(0)); id('lvBarFill').setAttribute('fill', C.blue);
          setLine(1, 'branch  \u00b7  ' + run_.cm.br, '', C.mut);
          setLine(2, 'project', '1,284 VIs', C.light);
        } else {
          // build / package / upload → progress bar
          showBar(true);
          var pr = status === 'passed' ? 1 : status === 'queued' ? 0 : p;
          id('lvBarFill').setAttribute('width', (484 * pr).toFixed(0)); id('lvBarFill').setAttribute('fill', fillCol);
          if (s.key === 'build') { setLine(1, 'target  \u00b7  Windows x64 exe', '', C.mut); setLine(2, 'build spec', 'Release', C.light); }
          else if (s.key === 'package') { setLine(1, 'installer  \u00b7  NI Package', '', C.mut); setLine(2, 'dependencies', '7 pkgs', C.light); }
          else { setLine(1, 'dest  \u00b7  SystemLink feed', '', C.mut); setLine(2, 'artifact', run_.buildMB + ' MB \u00b7 ' + Math.round(pr * 100) + '%', C.light); }
        }
      }

      var lastKey = '';
      function setNode(i, status) {
        id('lvNc' + i).setAttribute('opacity', status === 'passed' ? '1' : '0');
        id('lvNx' + i).setAttribute('opacity', status === 'failed' ? '1' : '0');
        id('lvNs' + i).setAttribute('opacity', status === 'running' ? '1' : '0');
        id('lvNd' + i).setAttribute('opacity', (status === 'queued' || status === 'skipped') ? '1' : '0');
        id('lvNd' + i).setAttribute('fill', status === 'skipped' ? '#3a4750' : C.track);
        var col = status === 'passed' ? C.green : status === 'running' ? C.amber : status === 'failed' ? C.red : C.track;
        id('lvNb' + i).setAttribute('stroke', col);
        id('lvNb' + i).setAttribute('fill', status === 'running' ? 'rgba(216,166,87,0.12)' : status === 'passed' ? 'rgba(121,197,166,0.10)' : status === 'failed' ? 'rgba(176,122,122,0.12)' : 'rgba(96,125,139,0.08)');
        id('lvNl' + i).setAttribute('fill', status === 'queued' || status === 'skipped' ? C.dim : C.light);
      }

      function render(c, e) {
        var cur = -1, curStatus = 'queued', lastStarted = 0, lastStatus = 'queued';
        for (var i = 0; i < STAGES.length; i++) {
          var status;
          if (run.fail && i > run.failIdx) status = 'skipped';
          else if (c >= ends[i]) status = (i === run.failIdx) ? 'failed' : 'passed';
          else if (c >= starts[i]) { status = (i === run.failIdx && c > starts[i] + STAGES[i].d * 0.6) ? 'failed' : 'running'; cur = i; curStatus = status; }
          else status = 'queued';
          if (status !== 'queued' && status !== 'skipped') { lastStarted = i; lastStatus = status; }
          setNode(i, status);
          // connector fill
          if (i < STAGES.length - 1) {
            var seg2 = id('lvCn' + i), full = NODEX[i + 1] - 16 - (NODEX[i] + 16);
            var f = status === 'passed' ? 1 : status === 'running' ? clamp((c - starts[i]) / STAGES[i].d, 0, 1) : 0;
            if (run.fail && i >= run.failIdx) f = (i === run.failIdx && status === 'failed') ? 0 : f;
            seg2.setAttribute('x2', (NODEX[i] + 16 + full * f).toFixed(1));
            seg2.setAttribute('stroke', (run.fail && i === run.failIdx) ? C.red : C.green);
          }
        }

        // detail card shows the active stage, or during a settle pause the stage that just finished
        var showIdx = lastStarted, showStatus = lastStatus;
        var p = clamp((c - starts[showIdx]) / STAGES[showIdx].d, 0, 1);
        detail(showIdx, p, showStatus);
        if (id('lvNs' + showIdx).getAttribute('opacity') === '1') id('lvNs' + showIdx).setAttribute('transform', 'rotate(' + ((e * 0.5) % 360).toFixed(1) + ' ' + NODEX[showIdx] + ' ' + NY + ')');

        // banner
        var finished = c >= TEND || (run.fail && c >= ends[run.failIdx]);
        var st = !finished ? 'running' : (run.fail ? 'failed' : 'passed');
        var key = st + ':' + cur;
        if (key !== lastKey) {
          lastKey = key;
          var col = st === 'running' ? C.amber : st === 'passed' ? C.green : C.red;
          id('lvBanner').setAttribute('fill', st === 'running' ? 'rgba(216,166,87,0.10)' : st === 'passed' ? 'rgba(121,197,166,0.12)' : 'rgba(176,122,122,0.12)');
          id('lvBanner').setAttribute('stroke', col);
          id('lvState').textContent = st === 'running' ? 'RUNNING' : st === 'passed' ? 'PASSED' : 'FAILED';
          id('lvState').setAttribute('fill', col);
          id('lvSpin').setAttribute('opacity', st === 'running' ? '1' : '0');
          id('lvChk').setAttribute('opacity', st === 'passed' ? '1' : '0');
          id('lvX').setAttribute('opacity', st === 'failed' ? '1' : '0');
        }
        id('lvSub2').textContent = '00:' + (Math.min(c, finished ? (run.fail ? ends[run.failIdx] : TEND) : c) / 1000).toFixed(1).padStart(4, '0');
        if (st === 'running') id('lvSpin').setAttribute('transform', 'rotate(' + ((e * 0.4) % 360).toFixed(1) + ' 54 143)');
        setStopBtn(!finished && !stopped);
      }

      var mqDesktop = window.matchMedia('(min-width: 1px)');
      if (reduce) { if (mqDesktop.matches) render(starts[1] + 1300, 0); return; }

      var t0 = null, lastC = 0, ticking = false, stopped = false;
      function abort() {
        if (stopped) return; stopped = true; lastKey = '';
        id('lvBanner').setAttribute('fill', 'rgba(96,125,139,0.08)'); id('lvBanner').setAttribute('stroke', C.gmut);
        id('lvState').textContent = 'ABORTED'; id('lvState').setAttribute('fill', C.gmut);
        id('lvSpin').setAttribute('opacity', '0'); id('lvChk').setAttribute('opacity', '0'); id('lvX').setAttribute('opacity', '0');
        id('lvDStat').textContent = 'aborted'; id('lvDStat').setAttribute('fill', C.gmut);
        setStopBtn(false); setTimeout(rearm, 2400);
      }
      function rearm() { stopped = false; if (!mqDesktop.matches) return; newRun(); lastKey = ''; lastC = 0; t0 = null; startLoop(); }
      function setStopBtn(on) {
        var col = on ? C.red : C.track, gg = id('lvStop');
        id('lvStopBox').setAttribute('stroke', col); id('lvStopBox').setAttribute('opacity', on ? '1' : '0.5');
        id('lvStopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        id('lvStopTxt').setAttribute('fill', col); id('lvStopIcon').setAttribute('fill', col);
        gg.style.pointerEvents = on ? 'auto' : 'none'; gg.style.cursor = on ? 'pointer' : 'default';
      }
      id('lvStop').addEventListener('click', abort);
      setStopBtn(true);
      function frame(ts) {
        if (__torn || stopped || !mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        var e = ts - t0, c = e % CYCLE;
        if (c < lastC) { history.push(run.fail ? 0 : 1); history.shift(); drawHist(); var pass = history.reduce(function (a, b) { return a + b; }, 0); id('lvRate').textContent = Math.round(pass / HN * 100) + '% PASS'; newRun(); lastKey = ''; }
        lastC = c;
        render(c, e);
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
