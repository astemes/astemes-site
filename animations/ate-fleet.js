/* Astemes "ATE Fleet" — animated hero instrument panel (fleet-management variant).
   Same chrome, palette and self-injection contract as the other hero animations (shared
   <div class="hero-visual"> mount). A fleet-operations console for a bank of automated test
   equipment (ATE) stations: each station card shows live test status, the running job and its
   progress, plus system-health (utilisation + controller temperature). Stations advance jobs,
   complete them, occasionally fault and go into maintenance, then recover. A schedule timeline
   below shows the next 8 hours of planned jobs and maintenance windows with a sweeping NOW line. */
(function () {
  var C = { green:'#79C5A6', amber:'#D8A657', blue:'#7EA6D6', mauve:'#C792C0', light:'#CFD8DC', white:'#FFFFFF',
            dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862', red:'#B07A7A', redtx:'#D69191' };

  var PRODUCTS = ['BMS-700', 'DRV-220', 'INV-90', 'SNS-44', 'ECU-31', 'PMU-12', 'CHG-48'];
  var FAULTS = ['PXI link lost', 'Fixture air low', 'DMM timeout', 'Probe contact', 'Over-temp'];
  var STATIONS = ['ATE-01', 'ATE-02', 'ATE-03', 'ATE-04', 'ATE-05', 'ATE-06'];
  // card grid geometry
  var COLX = [44, 304], CW = 252, ROWY = [190, 242, 294], CH = 48;
  // schedule geometry
  var SBX = 44, SBY = 374, SBW = 512, SBH = 70, LANE0 = SBX + 26, LANEW = SBW - 36;
  var LANES = ['A', 'B', 'C'], SPERIOD = 38000;

  var SVG =
  `<svg id="ftPanel" viewBox="0 0 600 560" role="img"
        aria-label="A fleet-management console for automated test equipment stations: a grid of station cards showing live test status, running job and progress plus utilisation and controller temperature, and a schedule timeline of the next eight hours with a sweeping now line."
        font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">ATE FLEET DASHBOARD</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- header info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">FLEET</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">Production Floor 2</text>
      <text x="262" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">CLUSTER</text>
      <text x="262" y="100" fill="#CFD8DC" font-size="13">North &#183; 6 stations</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SHIFT</text>
      <text x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">B &#183; 14:00\u201322:00</text>

      <!-- status banner -->
      <rect id="ftBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(121,197,166,0.10)" stroke="#79C5A6" stroke-width="1.5"/>
      <circle id="ftDot" cx="54" cy="147" r="7" fill="#79C5A6"/>
      <path id="ftWarn" d="M54 134l13 23H41Z" fill="none" stroke="#D8A657" stroke-width="2.4" stroke-linejoin="round" opacity="0"/>
      <text id="ftWarnEx" x="54" y="153" text-anchor="middle" fill="#D8A657" font-size="13" font-weight="700" opacity="0">!</text>
      <text id="ftState" x="80" y="156" fill="#79C5A6" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">ALL NOMINAL</text>
      <text id="ftSub1" x="552" y="142" text-anchor="end" fill="#9E9E9E" font-size="10.5" letter-spacing="1.5">5 RUNNING &#183; 1 IDLE</text>
      <text id="ftSub2" x="552" y="160" text-anchor="end" fill="#CFD8DC" font-size="13">412 units / h &#183; 78% util</text>

      <!-- station cards (built in JS) -->
      <g id="ftCards"></g>

      <!-- schedule -->
      <text x="40" y="366" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SCHEDULE</text>
      <text x="148" y="366" fill="#6b7780" font-size="9" letter-spacing="0.5">NEXT 8 H</text>
      <text id="ftClock" x="540" y="366" text-anchor="end" fill="#79C5A6" font-size="9">NOW 16:24</text>
      <rect x="${SBX}" y="${SBY}" width="${SBW}" height="${SBH}" rx="4" fill="#0d1417" stroke="#34424b"/>
      <g id="ftSched"></g>
      <line id="ftNow" x1="120" y1="${SBY}" x2="120" y2="${SBY + SBH}" stroke="#D8A657" stroke-width="1.5"/>
      <path id="ftNowT" d="M114 ${SBY}l12 0l-6 6z" fill="#D8A657"/>

      <!-- footer -->
      <path d="M32 462H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text id="ftFoot" x="40" y="500" fill="#9E9E9E" font-size="12">FLEET UPTIME 99.4 % &#183; 1 248 UNITS TODAY</text>
    </svg>`;

  function boot() {
    var mount = document.querySelector('.hero-visual');
    if (!mount || mount.querySelector('#ftPanel')) return;
    mount.innerHTML = SVG;

    (function () {
      var panel = document.getElementById('ftPanel');
      if (!panel) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var id = function (s) { return document.getElementById(s); };
      var SVGNS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
      var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
      var rnd = function (a, b) { return a + Math.random() * (b - a); };
      var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

      var COLOR = { run: C.green, idle: C.mut, fault: C.red, maint: C.blue };

      // ── build station cards ──
      var cardsG = id('ftCards'), card = [];
      STATIONS.forEach(function (name, i) {
        var x = COLX[i % 2], y = ROWY[Math.floor(i / 2)];
        var g = el('g', {});
        g.appendChild(el('rect', { x: x, y: y, width: CW, height: CH, rx: 6, fill: 'rgba(96,125,139,0.06)', stroke: '#2f3c44' }));
        var accent = el('rect', { id: 'ftA' + i, x: x, y: y, width: 3.5, height: CH, rx: 1.5, fill: C.green });
        var dot = el('circle', { id: 'ftD' + i, cx: x + 18, cy: y + 16, r: 4, fill: C.green });
        var spin = el('circle', { id: 'ftS' + i, cx: x + 18, cy: y + 16, r: 6, fill: 'none', stroke: C.green, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': '9 22', opacity: 0 });
        var nm = el('text', { x: x + 32, y: y + 20, fill: C.light, 'font-size': 12.5, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600 }, name);
        var util = el('text', { id: 'ftU' + i, x: x + CW - 12, y: y + 20, 'text-anchor': 'end', fill: C.green, 'font-size': 10, 'font-family': "'Space Grotesk',sans-serif", 'font-weight': 600, 'letter-spacing': 1 }, 'TESTING');
        var job = el('text', { id: 'ftJ' + i, x: x + 32, y: y + 36, fill: C.mut, 'font-size': 10 }, 'BMS-700 \u00B7 step 14/22');
        var temp = el('text', { id: 'ftT' + i, x: x + CW - 12, y: y + 36, 'text-anchor': 'end', fill: C.mut, 'font-size': 10 }, '52 \u00B0C');
        [accent, dot, spin, nm, util, job, temp].forEach(function (n) { g.appendChild(n); });
        cardsG.appendChild(g);
        card[i] = { x: x, y: y };
      });

      // ── station state machines ──
      function newJob() {
        var total = Math.round(rnd(12, 28)), w = [], sum = 0;
        for (var k = 0; k < total; k++) { var d = rnd(0.4, 1.8); w.push(d); sum += d; }
        var c = 0, bounds = []; for (var k = 0; k < total; k++) { c += w[k] / sum; bounds.push(c); }
        return { prod: pick(PRODUCTS), total: total, bounds: bounds };
      }
      var st = STATIONS.map(function (_, i) {
        var phases = ['run', 'run', 'run', 'idle'], ph = i === 2 ? 'run' : pick(phases);
        return { phase: ph, t0: 0, dur: rnd(5000, 11000), job: newJob(), util: rnd(60, 90), temp: rnd(40, 56),
                 fault: null, done: Math.round(rnd(180, 260)), seed: Math.random() * 100 };
      });
      var unitsToday = 1248;

      function transition(s, e) {
        if (s.phase === 'run') { s.done++; if (Math.random() < 0.14) { s.phase = 'fault'; s.fault = pick(FAULTS); s.dur = rnd(2600, 4200); } else if (Math.random() < 0.22) { s.phase = 'idle'; s.dur = rnd(2600, 5200); } else { s.job = newJob(); s.dur = rnd(5000, 11000); } }
        else if (s.phase === 'fault') { s.phase = 'maint'; s.dur = rnd(3600, 6400); }
        else if (s.phase === 'maint') { s.phase = 'idle'; s.fault = null; s.dur = rnd(1600, 3200); }
        else { s.phase = 'run'; s.job = newJob(); s.dur = rnd(5000, 11000); }
        s.t0 = e;
      }

      function render(e) {
        var running = 0, idle = 0, faults = 0, maint = 0, utilSum = 0, thru = 0;
        st.forEach(function (s, i) {
          if (e - s.t0 > s.dur) transition(s, e);
          var frac = clamp((e - s.t0) / s.dur, 0, 1), col = COLOR[s.phase];
          // health targets
          var utilT = s.phase === 'run' ? 64 + 26 * (0.6 + 0.4 * Math.sin(s.seed + e / 1400)) : s.phase === 'idle' ? rnd(6, 12) : s.phase === 'fault' ? 0 : 0;
          var tempT = s.phase === 'run' ? 50 + 8 * Math.sin(s.seed + e / 2600) : s.phase === 'fault' ? 64 : s.phase === 'maint' ? 34 : 33;
          s.util += (utilT - s.util) * 0.08; s.temp += (tempT - s.temp) * 0.04;
          if (s.phase === 'run') { running++; thru += 40 + s.util * 0.7; }
          else if (s.phase === 'idle') idle++; else if (s.phase === 'fault') faults++; else maint++;
          utilSum += s.util;

          id('ftA' + i).setAttribute('fill', col);
          var jt = id('ftJ' + i), ut = id('ftU' + i), tt = id('ftT' + i), dot = id('ftD' + i), spin = id('ftS' + i);
          var busy = (s.phase === 'run' || s.phase === 'maint');
          // busy stations spin; idle = hollow ring; fault = solid pulsing dot
          if (busy) {
            spin.setAttribute('opacity', '1'); spin.setAttribute('stroke', col);
            spin.setAttribute('transform', 'rotate(' + ((e * 0.5 + i * 55) % 360).toFixed(1) + ' ' + (card[i].x + 18) + ' ' + (card[i].y + 16) + ')');
            dot.setAttribute('opacity', '0');
          } else {
            spin.setAttribute('opacity', '0');
            if (s.phase === 'fault') { dot.setAttribute('opacity', (0.45 + 0.55 * Math.abs(Math.sin(e / 220))).toFixed(2)); dot.setAttribute('fill', C.red); dot.setAttribute('stroke', 'none'); }
            else { dot.setAttribute('opacity', '1'); dot.setAttribute('fill', 'none'); dot.setAttribute('stroke', C.mut); dot.setAttribute('stroke-width', '1.6'); }
          }
          if (s.phase === 'run') {
            var stp = 1; while (stp < s.job.total && frac >= s.job.bounds[stp - 1]) stp++;
            jt.textContent = s.job.prod + ' \u00B7 step ' + stp + '/' + s.job.total; jt.setAttribute('fill', C.mut);
          } else if (s.phase === 'idle') {
            jt.textContent = 'idle \u00B7 awaiting lot'; jt.setAttribute('fill', C.dim);
          } else if (s.phase === 'fault') {
            jt.textContent = 'FAULT \u00B7 ' + s.fault; jt.setAttribute('fill', C.redtx);
          } else {
            var ms = e - s.t0, mm = Math.floor(ms / 60000), ss = Math.floor(ms / 1000) % 60;
            jt.textContent = 'maintenance \u00B7 ' + mm + ':' + (ss < 10 ? '0' : '') + ss + ' elapsed'; jt.setAttribute('fill', C.blue);
          }
          var lbl = s.phase === 'run' ? 'TESTING' : s.phase === 'idle' ? 'IDLE' : s.phase === 'fault' ? 'FAULT' : 'SERVICE';
          ut.textContent = lbl; ut.setAttribute('fill', s.phase === 'fault' ? C.redtx : col);
          tt.textContent = Math.round(s.temp) + ' \u00B0C'; tt.setAttribute('fill', s.temp > 60 ? C.redtx : s.temp > 56 ? C.amber : C.mut);
        });

        // banner
        var faultish = faults > 0;
        var key = faults + ':' + running + ':' + idle + ':' + maint;
        if (key !== lastKey) {
          lastKey = key;
          var col = faultish ? C.red : maint > 0 ? C.amber : C.green;
          id('ftBanner').setAttribute('fill', faultish ? 'rgba(176,122,122,0.12)' : maint > 0 ? 'rgba(216,166,87,0.10)' : 'rgba(121,197,166,0.10)');
          id('ftBanner').setAttribute('stroke', col);
          id('ftState').textContent = faultish ? (faults + ' STATION' + (faults > 1 ? 'S' : '') + ' DOWN') : maint > 0 ? 'MAINTENANCE' : 'ALL NOMINAL';
          id('ftState').setAttribute('fill', col);
          id('ftDot').setAttribute('opacity', faultish ? '0' : '1'); id('ftDot').setAttribute('fill', col);
          id('ftWarn').setAttribute('opacity', faultish ? '1' : '0'); id('ftWarn').setAttribute('stroke', col);
          id('ftWarnEx').setAttribute('opacity', faultish ? '1' : '0'); id('ftWarnEx').setAttribute('fill', faultish ? C.redtx : C.amber);
          var parts = [];
          if (running) parts.push(running + ' RUNNING'); if (idle) parts.push(idle + ' IDLE'); if (maint) parts.push(maint + ' MAINT'); if (faults) parts.push(faults + ' FAULT');
          id('ftSub1').textContent = parts.join(' \u00B7 ');
        }
        id('ftSub2').textContent = Math.round(thru) + ' units / h \u00B7 ' + Math.round(utilSum / st.length) + '% util';
        if (!faultish) id('ftDot').setAttribute('opacity', (0.5 + 0.5 * Math.abs(Math.sin(e / 240))).toFixed(2));

        // schedule NOW sweep
        var frac2 = (e % SPERIOD) / SPERIOD, nowH = frac2 * 8, nx = LANE0 + frac2 * LANEW;
        id('ftNow').setAttribute('x1', nx.toFixed(1)); id('ftNow').setAttribute('x2', nx.toFixed(1));
        id('ftNowT').setAttribute('d', 'M' + (nx - 6).toFixed(1) + ' ' + SBY + 'l12 0l-6 6z');
        var mins = Math.floor(frac2 * 8 * 60), hh = 14 + Math.floor((24 + mins) / 60), mm = mins % 60;
        id('ftClock').textContent = 'NOW ' + (hh % 24 < 10 ? '0' : '') + (hh % 24) + ':' + (mm < 10 ? '0' : '') + mm;
        sched.forEach(function (b) {
          var status = (b.t0 + b.dur < nowH) ? 'done' : (b.t0 <= nowH ? 'active' : 'future');
          var base = b.kind === 'maint' ? C.amber : C.blue;
          b.rect.setAttribute('fill', status === 'active' ? (b.kind === 'maint' ? 'rgba(216,166,87,0.34)' : 'rgba(121,197,166,0.30)') : status === 'done' ? 'rgba(96,125,139,0.12)' : (b.kind === 'maint' ? 'rgba(216,166,87,0.10)' : 'rgba(126,166,214,0.12)'));
          b.rect.setAttribute('stroke', status === 'done' ? '#3a4750' : status === 'active' ? (b.kind === 'maint' ? C.amber : C.green) : base);
          b.label.setAttribute('fill', status === 'done' ? C.dim : status === 'active' ? (b.kind === 'maint' ? C.amber : C.green) : C.mut);
        });

        id('ftFoot').textContent = 'FLEET UPTIME 99.4 % \u00B7 ' + (unitsToday + (running * 3 + Math.floor(e / 1000)) % 9999).toLocaleString('en-US').replace(/,/g, '\u202F') + ' UNITS TODAY';
      }

      // ── build schedule blocks (fixed plan over 0..8h) ──
      var sched = [], schedG = id('ftSched');
      function hx(h) { return LANE0 + (h / 8) * LANEW; }
      LANES.forEach(function (ln, li) {
        var yc = SBY + 16 + li * 19, t = rnd(0, 0.6);
        while (t < 8) {
          var dur = rnd(0.8, 2.0), kind = Math.random() < 0.16 ? 'maint' : 'job';
          if (t + dur > 8) dur = 8 - t;
          if (dur < 0.4) break;
          var bx = hx(t), bw = (dur / 8) * LANEW;
          var rect = el('rect', { x: bx + 1, y: yc - 7, width: Math.max(2, bw - 2), height: 14, rx: 2, fill: 'rgba(126,166,214,0.12)', stroke: C.blue, 'stroke-width': 1 });
          var label = el('text', { x: bx + 5, y: yc + 3.5, fill: C.mut, 'font-size': 7.5 }, kind === 'maint' ? 'PM' : pick(PRODUCTS));
          schedG.appendChild(rect); schedG.appendChild(label);
          sched.push({ t0: t, dur: dur, kind: kind, rect: rect, label: label });
          t += dur + rnd(0.05, 0.4);
        }
        schedG.appendChild(el('text', { x: SBX + 8, y: yc + 3.5, fill: '#54636b', 'font-size': 8, 'font-weight': 700 }, ln));
      });

      // ── animation gate ──
      var lastKey = '', stopped = false;

      var mqDesktop = window.matchMedia('(min-width: 1081px)');
      if (reduce) { if (mqDesktop.matches) render(4000); return; }

      var t0 = null, pauseAt = 0, ticking = false;
      function frame(ts) {
        if (stopped || !mqDesktop.matches) { ticking = false; return; }
        if (t0 === null) t0 = ts - pauseAt;
        var e = ts - t0; pauseAt = e;
        render(e);
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
