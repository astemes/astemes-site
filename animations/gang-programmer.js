/* Astemes "Gang Programmer" — animated hero instrument panel (production programming variant).
   Same chrome, palette and self-injection contract as the other hero animations, so all four share
   one <div class="hero-visual"> mount. A 4-up production programmer flashes firmware, loads a config
   profile and applies a customer-specific variant to four DUTs in parallel. The four nests run as a
   batch and finish at slightly different rates; when all four pass, the next batch loads. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A' };

  // batch timeline (ms of sped-up time)
  var BASE = 6800, PROG = 8400, CYCLE = 10200;                 // BASE → fastest nest finishes ~6.4 s
  var RATE = [1.00, 0.92, 1.07, 0.84];                          // per-nest speed spread
  var VARIANT = ['EU-PRO', 'US-STD', 'EU-PRO', 'APAC-LITE'];    // mixed customer config per socket
  var STAGEN = ['DETECTING', 'ERASING', 'PROGRAMMING', 'CONFIGURING', 'SERIALIZING', 'VERIFYING'];
  var STAGE3 = ['DET', 'ERA', 'PGM', 'CFG', 'SER', 'VRF'];
  var WEIGHT = [0.06, 0.10, 0.48, 0.13, 0.10, 0.13];
  var CUM = [0]; for (var w = 0; w < WEIGHT.length; w++) CUM.push(CUM[w] + WEIGHT[w]);
  var NESTS = [[32, 178], [308, 178], [32, 348], [308, 348]];  // 2×2 grid origins
  var CW = 260, CH = 150, PAD = 18, BARW = 224, SEGN = 6, SEGGAP = 2;
  var SEGW = (BARW - (SEGN - 1) * SEGGAP) / SEGN;

  var SVG =
  `<svg id="pgPanel" viewBox="0 0 600 560" role="img"
        aria-label="A four-up production gang programmer flashing firmware, loading configuration and applying customer-specific variants to four devices in parallel, with each nest showing live staged progress as the batch completes."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <!-- panel -->
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">GANG PROGRAMMER</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- header info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">FIRMWARE</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">fw_main v3.4.1</text>
      <text x="232" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">WORK ORDER</text>
      <text x="232" y="100" fill="#CFD8DC" font-size="13">WO-4471 &#183; mixed</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">STATION</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">GANG-4</text>

      <!-- status banner -->
      <rect id="pgBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(216,166,87,0.10)" stroke="#D8A657" stroke-width="1.5"/>
      <g id="pgSpin" transform="rotate(0 54 147)">
        <circle cx="54" cy="147" r="11" fill="none" stroke="#D8A657" stroke-width="3" stroke-linecap="round" stroke-dasharray="52 70"/>
      </g>
      <path id="pgChkB" d="M47 147l5 6 12-15" fill="none" stroke="#79C5A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      <text id="pgState" x="80" y="156" fill="#D8A657" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">PROGRAMMING</text>
      <text id="pgSub1" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">BATCH #1184</text>
      <text id="pgSub2" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">0 / 4 UNITS DONE</text>

      <!-- 2×2 nest grid (cards built in JS) -->
      <g id="pgGrid"></g>

      <!-- footer -->
      <path d="M32 502H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text x="40" y="525" fill="#9E9E9E" font-size="12">UNITS PROGRAMMED &#183; <tspan id="pgUnits" fill="#CFD8DC" font-weight="600">4736</tspan> &#183; YIELD 99.6%</text>
      <g id="pgStop">
        <rect id="pgStopBox" x="432" y="511" width="128" height="30" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="pgStopIcon" x="462" y="518" width="14" height="14" rx="2" fill="#B07A7A"/>
        <text id="pgStopTxt" x="484" y="530" fill="#B07A7A" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">ABORT</text>
      </g>
    </svg>`;

  function boot() {
    var mount = document.querySelector('.hero-visual');
    if (!mount || mount.querySelector('#pgPanel')) return;
    mount.innerHTML = SVG;

    (function () {
      var panel = document.getElementById('pgPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      var grp = function (n) { return n.toLocaleString('en-US').replace(/,/g, '\u202F'); };

      // ── build the four nest cards ──
      var grid = id('pgGrid'), card = [];
      NESTS.forEach(function (o, i) {
        var X = o[0], Y = o[1], g = el('g', {});
        g.appendChild(el('rect', { id: 'pgCard' + i, x: X, y: Y, width: CW, height: CH, rx: 10, fill: 'rgba(96,125,139,0.06)', stroke: '#3a4750', 'stroke-width': 1.5 }));
        g.appendChild(el('text', { x: X + PAD, y: Y + 29, fill: '#CFD8DC', 'font-size': 13, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600, 'letter-spacing': 0.5 }, 'NEST ' + (i + 1)));
        var pillBox = el('rect', { id: 'pgPillBox' + i, x: X + CW - PAD - 64, y: Y + 14, width: 64, height: 18, rx: 3, fill: 'rgba(216,166,87,0.14)', stroke: '#D8A657' });
        var pill = el('text', { id: 'pgPill' + i, x: X + CW - PAD - 32, y: Y + 27, 'text-anchor': 'middle', 'font-size': 9.5, 'letter-spacing': 1, fill: '#D8A657' }, 'PGM');
        g.appendChild(pillBox); g.appendChild(pill);
        g.appendChild(el('text', { id: 'pgSn' + i, x: X + PAD, y: Y + 50, fill: '#9E9E9E', 'font-size': 12 }, 'SN \u2014'));
        g.appendChild(el('text', { id: 'pgVar' + i, x: X + CW - PAD, y: Y + 50, 'text-anchor': 'end', fill: '#7EA6D6', 'font-size': 11 }, VARIANT[i]));
        // segmented progress track
        for (var s = 0; s < SEGN; s++) {
          var sx = X + PAD + s * (SEGW + SEGGAP);
          g.appendChild(el('rect', { x: sx, y: Y + 66, width: SEGW, height: 10, rx: 2, fill: 'rgba(96,125,139,0.16)' }));
          g.appendChild(el('rect', { id: 'pgSeg' + i + '_' + s, x: sx, y: Y + 66, width: 0, height: 10, rx: 2, fill: '#79C5A6' }));
        }
        g.appendChild(el('text', { id: 'pgStage' + i, x: X + PAD, y: Y + 100, fill: '#D8A657', 'font-size': 12 }, STAGEN[0]));
        g.appendChild(el('text', { id: 'pgPct' + i, x: X + CW - PAD, y: Y + 100, 'text-anchor': 'end', fill: '#CFD8DC', 'font-size': 14, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, '0%'));
        g.appendChild(el('text', { id: 'pgDet' + i, x: X + PAD, y: Y + 126, fill: '#6b7780', 'font-size': 10 }, '0 / 1\u202F960 kB'));
        grid.appendChild(g);
        card[i] = {};
      });

      // ── batch bookkeeping ──
      var batch = 1184, units = 4736, snBase = 481;
      function setHeader() {
        id('pgSub1').textContent = 'BATCH #' + batch;
        id('pgUnits').textContent = grp(units);
        for (var i = 0; i < 4; i++) id('pgSn' + i).textContent = 'SN A7-' + String(snBase + i).padStart(4, '0');
      }
      setHeader();

      var CRC = ['0x9F3A', '0x4C12', '0xB7E5', '0x21D9'];
      function renderNest(i, p) {
        var done = p >= 1;
        // segments
        var cur = SEGN - 1;
        for (var s = 0; s < SEGN; s++) {
          var f = clamp((p - CUM[s]) / WEIGHT[s], 0, 1);
          var seg = id('pgSeg' + i + '_' + s);
          seg.setAttribute('width', (SEGW * f).toFixed(1));
          seg.setAttribute('fill', f >= 1 ? C.green : C.amber);
          if (f < 1 && cur === SEGN - 1) cur = s;
        }
        if (done) cur = SEGN - 1;
        id('pgPct' + i).textContent = Math.round(p * 100) + '%';
        // stage label
        id('pgStage' + i).textContent = done ? 'COMPLETE' : STAGEN[cur];
        id('pgStage' + i).setAttribute('fill', done ? C.green : C.amber);
        // detail: bytes during/through flash, then verified
        if (done) {
          id('pgDet' + i).textContent = 'VERIFIED \u2713 \u00B7 CRC ' + CRC[i];
          id('pgDet' + i).setAttribute('fill', '#79C5A6');
        } else {
          var kb = Math.round(clamp((p - CUM[2]) / WEIGHT[2], 0, 1) * 1960);
          id('pgDet' + i).textContent = grp(kb) + ' / 1\u202F960 kB';
          id('pgDet' + i).setAttribute('fill', C.mut);
        }
        // pill + card border
        var pb = id('pgPillBox' + i), pl = id('pgPill' + i), cd = id('pgCard' + i);
        if (done) {
          pb.setAttribute('fill', 'rgba(121,197,166,0.15)'); pb.setAttribute('stroke', C.green);
          pl.textContent = 'PASS'; pl.setAttribute('fill', C.green);
          cd.setAttribute('stroke', 'rgba(121,197,166,0.55)'); cd.setAttribute('fill', 'rgba(121,197,166,0.05)');
        } else {
          pb.setAttribute('fill', 'rgba(216,166,87,0.14)'); pb.setAttribute('stroke', C.amber);
          pl.textContent = STAGE3[cur]; pl.setAttribute('fill', C.amber);
          cd.setAttribute('stroke', 'rgba(216,166,87,0.5)'); cd.setAttribute('fill', 'rgba(216,166,87,0.045)');
        }
      }

      var lastBn = '';
      function render(c, el) {
        var doneCount = 0;
        for (var i = 0; i < 4; i++) {
          var p = clamp(c * RATE[i] / BASE, 0, 1);
          renderNest(i, p);
          if (p >= 1) doneCount++;
        }
        var allDone = doneCount === 4;
        var key = allDone ? 'done' : 'prog';
        if (key !== lastBn) {
          lastBn = key;
          id('pgBanner').setAttribute('fill', allDone ? 'rgba(121,197,166,0.12)' : 'rgba(216,166,87,0.10)');
          id('pgBanner').setAttribute('stroke', allDone ? C.green : C.amber);
          id('pgState').textContent = allDone ? 'BATCH COMPLETE' : 'PROGRAMMING';
          id('pgState').setAttribute('fill', allDone ? C.green : C.amber);
          id('pgSpin').setAttribute('opacity', allDone ? '0' : '1');
          id('pgChkB').setAttribute('opacity', allDone ? '1' : '0');
        }
        id('pgSub2').textContent = doneCount + ' / 4 UNITS DONE';
        if (!allDone) id('pgSpin').setAttribute('transform', 'rotate(' + ((el * 0.4) % 360).toFixed(1) + ' 54 147)');
      }

      // ── abort / re-arm ──
      var stopped = false;
      function abort() {
        if (stopped) return; stopped = true; lastBn = '';
        id('pgBanner').setAttribute('fill', 'rgba(96,125,139,0.08)'); id('pgBanner').setAttribute('stroke', C.gmut);
        id('pgState').textContent = 'ABORTED'; id('pgState').setAttribute('fill', C.gmut);
        id('pgSpin').setAttribute('opacity', '0'); id('pgChkB').setAttribute('opacity', '0');
        id('pgSub1').textContent = 'HALTED BY OPERATOR';
        setStopBtn(false); setTimeout(rearm, 2600);
      }
      function rearm() { stopped = false; if (!mqDesktop.matches) return; t0 = null; lastC = 0; lastBn = ''; setStopBtn(true); startLoop(); }
      function setStopBtn(on) {
        var col = on ? C.red : C.queue, g = id('pgStop');
        id('pgStopBox').setAttribute('stroke', col); id('pgStopBox').setAttribute('opacity', on ? '1' : '0.5');
        id('pgStopBox').setAttribute('fill', on ? 'rgba(176,122,122,0.12)' : 'none');
        id('pgStopTxt').setAttribute('fill', col); id('pgStopIcon').setAttribute('fill', col);
        g.style.pointerEvents = on ? 'auto' : 'none'; g.style.cursor = on ? 'pointer' : 'default';
      }
      id('pgStop').addEventListener('click', abort);
      setStopBtn(true);

      var mqDesktop = window.matchMedia('(min-width: 1081px)');
      if (reduce) { if (mqDesktop.matches) render(PROG * 0.5, 0); return; }

      var t0 = null, lastC = 0, ticking = false;
      function frame(ts) {
        if (stopped || !mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts;
        var el = ts - t0, c = el % CYCLE;
        if (c < lastC) { batch++; units += 4; snBase += 4; setHeader(); }
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
