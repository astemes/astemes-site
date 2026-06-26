/* Astemes "Machine Vision" — animated hero instrument panel (high-speed inspection variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A vision cell inspects machined brackets streaming past a
   camera at high rate: each part slides into frame, the system locks a bounding box, gauges the
   width/height and three hole diameters, and stamps PASS or FAIL — most pass, the occasional one
   carries a defect (oversize hole / missing hole / edge chip) and is rejected. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A', redtx:'#D69191' };

  var CYCLE = 560, HOLEX = [250, 300, 350], HCY = 276;
  var DEFECTS = ['oversize', 'missing', 'chip'];

  var SVG =
  `<svg id="mvPanel" viewBox="0 0 600 560" role="img"
        aria-label="A high-speed machine-vision inspection cell: machined bracket parts stream past a camera, each gets a bounding box, width/height calipers and three hole-diameter gauges, and is stamped pass or fail, with the occasional defective part rejected — alongside throughput, pass-rate and cycle-time counters."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <!-- panel -->
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">MACHINE VISION</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- header info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">LINE</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">Bracket Assy &#183; ST-04</text>
      <text x="262" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CAMERA</text>
      <text x="262" y="100" fill="#CFD8DC" font-size="13">5 MP &#183; mono</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">RECIPE</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">BRK-22 rev C</text>

      <!-- status banner -->
      <rect id="mvBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(121,197,166,0.10)" stroke="#79C5A6" stroke-width="1.5"/>
      <circle id="mvRec" cx="54" cy="147" r="8" fill="#79C5A6"/>
      <text id="mvState" x="78" y="156" fill="#79C5A6" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">INSPECTING</text>
      <text x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">HARDWARE TRIGGER &#183; 118 fps</text>
      <text id="mvThru" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">624 parts / min</text>

      <!-- camera viewport -->
      <rect x="44" y="180" width="512" height="206" rx="4" fill="#0c1216" stroke="#34424b"/>
      <g id="mvGrid" stroke="rgba(96,125,139,0.10)" stroke-width="1"></g>
      <text x="58" y="198" fill="#6f8a86" font-size="9" letter-spacing="0.5">CAM 1 \u00B7 2592\u00D71944 \u00B7 118 fps</text>
      <text id="mvTrig" x="542" y="198" text-anchor="end" fill="#6f8a86" font-size="9">FRAME 0184221</text>
      <text x="58" y="378" fill="#54636b" font-size="9">EXP 1/2000 s \u00B7 GAIN 2.0 dB</text>
      <text id="mvFound" x="542" y="378" text-anchor="end" fill="#54636b" font-size="9">3 / 3 FEATURES</text>
      <line id="mvSweep" x1="48" y1="182" x2="48" y2="384" stroke="rgba(121,197,166,0.5)" stroke-width="1.5" opacity="0"/>

      <!-- part + measurement overlays (a single moving scene) -->
      <g id="mvScene">
        <rect id="mvBody" x="215" y="221" width="170" height="110" rx="10" fill="#222d34" stroke="#3c4a53" stroke-width="1.5"/>
        <circle id="mvHole0" cx="250" cy="276" r="11" fill="#11181c" stroke="#3c4a53"/>
        <circle id="mvHole1" cx="300" cy="276" r="11" fill="#11181c" stroke="#3c4a53"/>
        <circle id="mvHole2" cx="350" cy="276" r="11" fill="#11181c" stroke="#3c4a53"/>
        <!-- bounding box + corner ticks -->
        <g id="mvBox" opacity="0">
          <rect x="205" y="211" width="190" height="130" fill="none" stroke="#79C5A6" stroke-width="1.4" stroke-dasharray="5 4"/>
          <path d="M205 221V211H215M385 211H395V221M395 331V341H385M215 341H205V331" fill="none" stroke="#79C5A6" stroke-width="2"/>
        </g>
        <!-- ROI rings -->
        <g id="mvRoi0" opacity="0"><circle cx="250" cy="276" r="17" fill="none" stroke="#79C5A6" stroke-width="1.2" stroke-dasharray="3 3"/><text id="mvRoiL0" x="250" y="312" text-anchor="middle" fill="#79C5A6" font-size="9">&#216;6.00</text></g>
        <g id="mvRoi1" opacity="0"><circle cx="300" cy="276" r="17" fill="none" stroke="#79C5A6" stroke-width="1.2" stroke-dasharray="3 3"/><text id="mvRoiL1" x="300" y="312" text-anchor="middle" fill="#79C5A6" font-size="9">&#216;6.00</text></g>
        <g id="mvRoi2" opacity="0"><circle cx="350" cy="276" r="17" fill="none" stroke="#79C5A6" stroke-width="1.2" stroke-dasharray="3 3"/><text id="mvRoiL2" x="350" y="312" text-anchor="middle" fill="#79C5A6" font-size="9">&#216;6.00</text></g>
        <!-- width caliper -->
        <g id="mvCalW" opacity="0">
          <path d="M205 198V206M395 198V206M205 202H395" fill="none" stroke="#D8A657" stroke-width="1.2"/>
          <rect x="278" y="194" width="44" height="14" rx="2" fill="#0c1216"/>
          <text id="mvCalWT" x="300" y="204" text-anchor="middle" fill="#D8A657" font-size="9.5">60.1</text>
        </g>
        <!-- crosshair -->
        <g id="mvCross" opacity="0"><line x1="290" y1="276" x2="310" y2="276" stroke="#7EA6D6" stroke-width="1"/><line x1="300" y1="266" x2="300" y2="286" stroke="#7EA6D6" stroke-width="1"/></g>
        <!-- defect marker -->
        <g id="mvDef" opacity="0"><circle id="mvDefC" cx="350" cy="276" r="20" fill="none" stroke="#B07A7A" stroke-width="2"/><text id="mvDefT" x="350" y="244" text-anchor="middle" fill="#D69191" font-size="9.5" font-weight="700">OVERSIZE</text></g>
      </g>

      <!-- verdict stamp -->
      <text id="mvVerdict" x="540" y="232" text-anchor="end" fill="#79C5A6" font-size="26" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="1" opacity="0">PASS</text>

      <!-- metrics -->
      <g>
        <text x="48"  y="408" fill="#9E9E9E" font-size="9" letter-spacing="1.2">INSPECTED</text>
        <text id="mvInsp" x="48"  y="430" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">18942</text>
        <text x="170" y="408" fill="#9E9E9E" font-size="9" letter-spacing="1.2">THROUGHPUT</text>
        <text id="mvPpm" x="170" y="430" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">624<tspan font-size="11" font-family="'DM Mono',monospace" fill="#6b7780"> /min</tspan></text>
        <text x="300" y="408" fill="#9E9E9E" font-size="9" letter-spacing="1.2">PASS RATE</text>
        <text id="mvRate" x="300" y="430" fill="#79C5A6" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">98.9<tspan font-size="11" font-family="'DM Mono',monospace" fill="#6b7780"> %</tspan></text>
        <text x="408" y="408" fill="#9E9E9E" font-size="9" letter-spacing="1.2">CYCLE</text>
        <text id="mvCyc" x="408" y="430" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">96<tspan font-size="11" font-family="'DM Mono',monospace" fill="#6b7780"> ms</tspan></text>
        <text x="486" y="408" fill="#9E9E9E" font-size="9" letter-spacing="1.2">REJECTS</text>
        <text id="mvRej" x="486" y="430" fill="#CFD8DC" font-size="18" font-family="'Space Grotesk',sans-serif" font-weight="600">214</text>
      </g>

      <!-- footer: recent parts -->
      <path d="M32 448H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="486" fill="#9E9E9E" font-size="9" letter-spacing="1.5">RECENT PARTS</text>
      <g id="mvHist"></g>
      <g id="mvStop">
        <rect id="mvStopBox" x="448" y="498" width="112" height="30" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="mvStopIcon" x="470" y="505" width="13" height="13" rx="2" fill="#B07A7A"/>
        <text id="mvStopTxt" x="491" y="517" fill="#B07A7A" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP</text>
      </g>
    </svg>`;

  function boot() {
    var mount = document.querySelector('.hero-visual');
    if (!mount || mount.querySelector('#mvPanel')) return;
    mount.innerHTML = SVG;

    (function () {
      var panel = document.getElementById('mvPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      var grp = function (n) { return Math.round(n).toLocaleString('en-US').replace(/,/g, '\u202F'); };

      // viewport grid
      var g = id('mvGrid');
      for (var gx = 1; gx < 8; gx++) g.appendChild(el('line', { x1: 48 + gx * 63, y1: 182, x2: 48 + gx * 63, y2: 384 }));
      for (var gy = 1; gy < 4; gy++) g.appendChild(el('line', { x1: 48, y1: 182 + gy * 50.5, x2: 552, y2: 182 + gy * 50.5 }));

      // recent-parts history
      var hist = id('mvHist'), hbar = [], HN = 26;
      for (var h = 0; h < HN; h++) { var b = el('rect', { x: 150 + h * 11.2, y: 478, width: 7.5, height: 11, rx: 1.5, fill: C.green }); hist.appendChild(b); hbar[h] = b; }
      var history = []; for (var i = 0; i < HN; i++) history.push(Math.random() < 0.92 ? 1 : 0);
      function drawHist() { for (var i = 0; i < HN; i++) hbar[i].setAttribute('fill', history[i] ? C.green : C.red); }
      drawHist();

      // ── per-part state ──
      var inspected = 18942, rejects = 214, frame = 184221, run;
      function newPart() {
        inspected++; frame += 1 + Math.floor(Math.random() * 3);
        var fail = Math.random() < 1 / 7;
        var def = fail ? DEFECTS[Math.floor(Math.random() * DEFECTS.length)] : null;
        var hole = Math.floor(Math.random() * 3);
        var dia = [6.0, 6.0, 6.0].map(function () { return 5.97 + Math.random() * 0.06; });
        if (def === 'oversize') dia[hole] = 6.7 + Math.random() * 0.3;
        run = {
          fail: fail, def: def, hole: hole, dia: dia,
          w: 60.0 + (Math.random() - 0.5) * 0.4, hgt: 41.0 + (Math.random() - 0.5) * 0.3,
          jx: (Math.random() - 0.5) * 16, jy: (Math.random() - 0.5) * 10, rot: (Math.random() - 0.5) * 5
        };
        if (fail) rejects++;
      }
      newPart();

      function show(elid, on) { id(elid).setAttribute('opacity', on ? '1' : '0'); }
      function render(f, el) {
        // horizontal travel: slide in → hold for inspection → slide out
        var dx;
        if (f < 0.14) dx = 150 * (1 - f / 0.14);
        else if (f < 0.82) dx = 2 * Math.sin(el / 200);
        else dx = -170 * ((f - 0.82) / 0.18);
        var fade = f > 0.86 ? clamp(1 - (f - 0.86) / 0.14, 0, 1) : (f < 0.14 ? clamp(f / 0.14, 0, 1) : 1);
        id('mvScene').setAttribute('transform', 'translate(' + (run.jx + dx).toFixed(1) + ',' + run.jy.toFixed(1) + ') rotate(' + run.rot.toFixed(1) + ' 300 276)');
        id('mvScene').setAttribute('opacity', fade.toFixed(2));

        // acquisition sweep during grab
        var sw = f < 0.18;
        id('mvSweep').setAttribute('opacity', sw ? (0.5 * (1 - f / 0.18)).toFixed(2) : '0');
        if (sw) { var sx = 48 + (f / 0.18) * 504; id('mvSweep').setAttribute('x1', sx); id('mvSweep').setAttribute('x2', sx); }

        var ana = f > 0.14 && f < 0.84;   // overlays visible window
        var col = run.fail ? C.red : C.green;
        // bounding box
        show('mvBox', ana && f > 0.16);
        id('mvBox').querySelectorAll('rect,path').forEach(function (n) { n.setAttribute('stroke', col); });
        // ROIs + diameters
        for (var k = 0; k < 3; k++) {
          var roiOn = ana && f > 0.24 + k * 0.04;
          var missing = run.def === 'missing' && run.hole === k;
          var bad = run.fail && run.hole === k && (run.def === 'oversize' || run.def === 'missing');
          show('mvRoi' + k, roiOn);
          id('mvHole' + k).setAttribute('opacity', missing ? '0.12' : '1');
          id('mvHole' + k).setAttribute('r', run.def === 'oversize' && run.hole === k ? 16 : 11);
          var rc = id('mvRoi' + k).querySelector('circle'), rl = id('mvRoiL' + k);
          rc.setAttribute('stroke', bad ? C.red : C.green); rc.setAttribute('r', run.def === 'oversize' && run.hole === k ? 22 : 17);
          rl.setAttribute('fill', bad ? C.redtx : C.green);
          rl.textContent = missing ? 'MISSING' : '\u00D8' + run.dia[k].toFixed(2);
        }
        // calipers + crosshair
        show('mvCalW', ana && f > 0.34);
        id('mvCalWT').textContent = run.w.toFixed(1);
        show('mvCross', ana && f > 0.22);
        // defect marker (chip on a corner, or the bad hole)
        var defOn = run.fail && ana && f > 0.42;
        show('mvDef', defOn);
        if (defOn) {
          var dc = id('mvDefC'), dt = id('mvDefT');
          if (run.def === 'chip') {
            dc.setAttribute('cx', 388); dc.setAttribute('cy', 214); dc.setAttribute('r', 13);
            dt.setAttribute('x', 360); dt.setAttribute('y', 206); dt.textContent = 'EDGE CHIP';
          } else {
            dc.setAttribute('cx', HOLEX[run.hole]); dc.setAttribute('cy', HCY); dc.setAttribute('r', 22);
            dt.setAttribute('x', HOLEX[run.hole]); dt.setAttribute('y', 244); dt.textContent = run.def === 'missing' ? 'MISSING HOLE' : 'OVERSIZE';
          }
        }
        // verdict stamp
        var verdOn = f > 0.48 && f < 0.86;
        show('mvVerdict', verdOn);
        id('mvVerdict').textContent = run.fail ? 'FAIL' : 'PASS';
        id('mvVerdict').setAttribute('fill', run.fail ? C.redtx : C.green);
        id('mvFound').textContent = (run.def === 'missing' ? '2 / 3' : '3 / 3') + ' FEATURES';
        id('mvFound').setAttribute('fill', run.fail ? C.redtx : '#54636b');
        id('mvTrig').textContent = 'FRAME ' + String(frame).padStart(7, '0');

        // metrics + banner tint by verdict (brief)
        var pass = history.reduce(function (a, b) { return a + b; }, 0) / HN;
        id('mvInsp').textContent = grp(inspected);
        id('mvPpm').innerHTML = (600 + Math.round(40 * Math.sin(el / 1400))) + '<tspan font-size="11" font-family="\'DM Mono\',monospace" fill="#6b7780"> /min</tspan>';
        id('mvRate').innerHTML = (pass * 100).toFixed(1) + '<tspan font-size="11" font-family="\'DM Mono\',monospace" fill="#6b7780"> %</tspan>';
        id('mvCyc').innerHTML = (94 + Math.round(4 * Math.sin(el / 900))) + '<tspan font-size="11" font-family="\'DM Mono\',monospace" fill="#6b7780"> ms</tspan>';
        id('mvRej').textContent = grp(rejects);
        id('mvThru').textContent = (600 + Math.round(40 * Math.sin(el / 1400))) + ' parts / min';
        id('mvRec').setAttribute('opacity', (0.5 + 0.5 * Math.abs(Math.sin(el / 240))).toFixed(2));
      }

      // ── stop / re-arm ──
      var stopped = false;
      function abort() {
        if (stopped) return; stopped = true;
        id('mvBanner').setAttribute('fill', 'rgba(96,125,139,0.08)'); id('mvBanner').setAttribute('stroke', C.gmut);
        id('mvState').textContent = 'STOPPED'; id('mvState').setAttribute('fill', C.gmut);
        id('mvRec').setAttribute('fill', C.gmut); id('mvRec').setAttribute('opacity', '1');
        setStopBtn(false); setTimeout(rearm, 2400);
      }
      function rearm() { stopped = false; if (!mqDesktop.matches) return; id('mvState').textContent = 'INSPECTING'; id('mvState').setAttribute('fill', C.green); id('mvBanner').setAttribute('fill', 'rgba(121,197,166,0.10)'); id('mvBanner').setAttribute('stroke', C.green); id('mvRec').setAttribute('fill', C.green); setStopBtn(true); t0 = null; lastF = 0; startLoop(); }
      function setStopBtn(on) {
        var col = on ? C.red : C.queue, gg = id('mvStop');
        id('mvStopBox').setAttribute('stroke', col); id('mvStopBox').setAttribute('opacity', on ? '1' : '0.5');
        id('mvStopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        id('mvStopTxt').setAttribute('fill', col); id('mvStopIcon').setAttribute('fill', col);
        gg.style.pointerEvents = on ? 'auto' : 'none'; gg.style.cursor = on ? 'pointer' : 'default';
      }
      id('mvStop').addEventListener('click', abort);
      setStopBtn(true);

      var mqDesktop = window.matchMedia('(min-width: 1081px)');
      if (reduce) { if (mqDesktop.matches) render(0.6, 0); return; }

      var t0 = null, lastF = 0, ticking = false;
      function frameLoop(ts) {
        if (stopped || !mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        var el = ts - t0, f = (el % CYCLE) / CYCLE;
        if (f < lastF) { history.push(run.fail ? 0 : 1); history.shift(); drawHist(); newPart(); }
        lastF = f;
        render(f, el);
        requestAnimationFrame(frameLoop);
      }
      function startLoop() { if (ticking || stopped || !mqDesktop.matches) return; ticking = true; t0 = null; requestAnimationFrame(frameLoop); }
      if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', startLoop);
      else if (mqDesktop.addListener) mqDesktop.addListener(startLoop);
      startLoop();
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
