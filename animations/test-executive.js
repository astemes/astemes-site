/* Astemes "Test Executive" — the default hero animation module.
   Registers with the animation loader (animations/loader.js), which mounts it into the hero
   stage. A test station runs a pass/fail measurement sequence on an actuator module: floating
   instrument panels (DMM with converging digits, single-shot scope capture) show each
   measurement being taken. Roughly 1 in 6 units fails one step — the row is stamped Failed and
   the sequence continues FCT-style to a FAILED verdict; the rest pass. STOP aborts the run,
   holds, then re-arms with a fresh unit. Element lookups are scoped to the mounted panel so
   multiple instances can coexist (see animations/harness.html); the instrument-panel fade and
   Stop-button hover are applied inline rather than via site CSS. */
(function () {
  var SVG =
  `<svg viewBox="0 0 600 560" role="img" aria-label="A live automated test station running a pass/fail measurement sequence on an actuator module. Floating instrument panels show the measurements being taken; most units pass, the occasional one fails a step and is stamped failed."
         font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <!-- panel -->
      <rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64" stroke-width="1.5"/>
      <path d="M28 17H572" stroke="rgba(207,216,220,0.12)" stroke-width="1"/>

      <!-- title bar -->
      <rect x="40" y="31" width="12" height="12" rx="2" fill="#607D8B"/>
      <text x="60" y="42" fill="#CFD8DC" font-size="13" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">TEST EXECUTIVE</text>
      <line x1="508" y1="40" x2="520" y2="40" stroke="#6b7780" stroke-width="1.5"/>
      <rect x="530" y="33" width="10" height="9" rx="1" fill="none" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M551 33l10 9M561 33l-10 9" stroke="#6b7780" stroke-width="1.5"/>
      <path d="M16 58H584" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <!-- sequence info -->
      <text x="40" y="84" fill="#9E9E9E" font-size="9" letter-spacing="1.5">SEQUENCE</text>
      <text x="40" y="100" fill="#CFD8DC" font-size="13">Actuator_FCT.seq</text>
      <text x="560" y="84" text-anchor="end" fill="#9E9E9E" font-size="9" letter-spacing="1.5">UUT SERIAL</text>
      <text id="t2Sn" x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">24-0917</text>

      <!-- status banner -->
      <rect id="t2Banner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(96,125,139,0.10)" stroke="#6b7780" stroke-width="1.5"/>
      <g id="t2Spin" transform="rotate(0 54 147)" opacity="0">
        <circle cx="54" cy="147" r="11" fill="none" stroke="#D8A657" stroke-width="3" stroke-linecap="round" stroke-dasharray="52 70"/>
      </g>
      <path id="t2BannerCheck" d="M47 147l5 6 12-15" fill="none" stroke="#79C5A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      <circle id="t2WaitDot" cx="54" cy="147" r="8" fill="none" stroke="#6b7780" stroke-width="2.5" opacity="1"/>
      <path id="t2BannerX" d="M47 140l14 14M61 140l-14 14" fill="none" stroke="#B07A7A" stroke-width="3" stroke-linecap="round" opacity="0"/>
      <text id="t2BannerText" x="80" y="156" fill="#9E9E9E" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">READY</text>
      <text id="t2BannerSub" x="552" y="153" text-anchor="end" fill="#9E9E9E" font-size="12">WAITING FOR UUT</text>

      <!-- test sequence list -->
      <text x="40" y="200" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">STEP</text>
      <text x="388" y="200" text-anchor="end" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">MEASURED</text>
      <text x="400" y="200" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">LIMITS</text>
      <text x="558" y="200" text-anchor="end" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">STATUS</text>
      <path d="M40 208H560" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <g font-size="12.5">
        <g id="t2Hi0" opacity="0"><rect x="24" y="213" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="213" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="234" fill="#607D8B" font-size="10">1</text>
        <text id="t2N0" x="58" y="234" fill="#5a6873">Power-On Self Test</text>
        <text id="t2V0" x="388" y="234" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="234" fill="#6b7780" font-size="10">&#8212;</text>
        <rect id="t2Box0" x="500" y="221.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="t2B0" x="529" y="234" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>

        <g id="t2Hi1" opacity="0"><rect x="24" y="247" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="247" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="268" fill="#607D8B" font-size="10">2</text>
        <text id="t2N1" x="58" y="268" fill="#5a6873">Coil Resistance</text>
        <text id="t2V1" x="388" y="268" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="268" fill="#6b7780" font-size="10">11.8&#8211;13.0 &#937;</text>
        <rect id="t2Box1" x="500" y="255.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="t2B1" x="529" y="268" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>

        <g id="t2Hi2" opacity="0"><rect x="24" y="281" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="281" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="302" fill="#607D8B" font-size="10">3</text>
        <text id="t2N2" x="58" y="302" fill="#5a6873">Insulation Resistance</text>
        <text id="t2V2" x="388" y="302" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="302" fill="#6b7780" font-size="10">&#8805;100 M&#937;</text>
        <rect id="t2Box2" x="500" y="289.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="t2B2" x="529" y="302" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>

        <g id="t2Hi3" opacity="0"><rect x="24" y="315" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="315" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="336" fill="#607D8B" font-size="10">4</text>
        <text id="t2N3" x="58" y="336" fill="#5a6873">Pull-In Voltage</text>
        <text id="t2V3" x="388" y="336" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="336" fill="#6b7780" font-size="10">&#8804;9.0 V</text>
        <rect id="t2Box3" x="500" y="323.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="t2B3" x="529" y="336" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>

        <g id="t2Hi4" opacity="0"><rect x="24" y="349" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="349" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="370" fill="#607D8B" font-size="10">5</text>
        <text id="t2N4" x="58" y="370" fill="#5a6873">Actuation Time</text>
        <text id="t2V4" x="388" y="370" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="370" fill="#6b7780" font-size="10">&#8804;20 ms</text>
        <rect id="t2Box4" x="500" y="357.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="t2B4" x="529" y="370" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>

        <g id="t2Hi5" opacity="0"><rect x="24" y="383" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="383" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="404" fill="#607D8B" font-size="10">6</text>
        <text id="t2N5" x="58" y="404" fill="#5a6873">Holding Current</text>
        <text id="t2V5" x="388" y="404" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="404" fill="#6b7780" font-size="10">80&#8211;110 mA</text>
        <rect id="t2Box5" x="500" y="391.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="t2B5" x="529" y="404" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>
      </g>

      <!-- footer -->
      <path d="M32 430H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text id="t2Elapsed" x="40" y="469" fill="#9E9E9E" font-size="12">ELAPSED 0.0 s &#183; 0 FAILED</text>
      <g id="t2Stop">
        <rect id="t2StopBox" x="430" y="445" width="130" height="37" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="t2StopIcon" x="462" y="456" width="15" height="15" rx="2" fill="#B07A7A"/>
        <text id="t2StopTxt" x="485" y="469" fill="#B07A7A" font-size="14" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP</text>
      </g>
      <!-- Floating instrument soft front panel — pops up over the sequence while a measurement runs -->
      <g id="t2Inst" opacity="0">
        <rect x="236" y="238" width="336" height="200" rx="10" fill="rgba(0,0,0,0.35)"/>
        <rect x="232" y="230" width="336" height="200" rx="10" fill="#222d35" stroke="#5b6b75" stroke-width="1.5"/>
        <path d="M232 240a8 8 0 0 1 8-8H560a8 8 0 0 1 8 8V258H232Z" fill="#2c3a44"/>
        <circle cx="248" cy="244" r="3" fill="#5b6b75"/>
        <circle cx="260" cy="244" r="3" fill="#5b6b75"/>
        <circle cx="272" cy="244" r="3" fill="#5b6b75"/>
        <text id="t2InstTitle" x="290" y="248" fill="#CFD8DC" font-size="11" letter-spacing="1">DIGITAL MULTIMETER</text>
        <text x="556" y="248" text-anchor="end" fill="#6b7780" font-size="13">&#215;</text>

        <!-- DMM front panel -->
        <g id="t2Dmm">
          <rect x="248" y="272" width="304" height="86" rx="4" fill="#0d1417" stroke="#34424b"/>
          <text id="t2DmmMode" x="262" y="292" fill="#6f8a86" font-size="10" letter-spacing="1">DC VOLTAGE</text>
          <text x="538" y="292" text-anchor="end" fill="#6f8a86" font-size="10" letter-spacing="1">AUTO</text>
          <text id="t2DmmVal" x="504" y="341" text-anchor="end" fill="#CFD8DC" font-size="40" letter-spacing="2">7.82</text>
          <text id="t2DmmUnit" x="512" y="341" fill="#CFD8DC" font-size="17">V</text>
          <text x="248" y="382" fill="#6b7780" font-size="9.5" letter-spacing="0.5">ASTEMES DMM-2010</text>
          <text x="552" y="382" text-anchor="end" fill="#6b7780" font-size="9.5">VISA  GPIB0::22::INSTR</text>
        </g>

        <!-- Oscilloscope single-shot front panel -->
        <g id="t2Scope" display="none">
          <rect x="248" y="270" width="304" height="104" rx="4" fill="#0d1417" stroke="#34424b"/>
          <line x1="248" y1="322" x2="552" y2="322" stroke="rgba(96,125,139,0.18)"/>
          <line x1="300" y1="270" x2="300" y2="374" stroke="rgba(96,125,139,0.12)"/>
          <line x1="400" y1="270" x2="400" y2="374" stroke="rgba(96,125,139,0.12)"/>
          <line x1="500" y1="270" x2="500" y2="374" stroke="rgba(96,125,139,0.12)"/>
          <line id="t2Cur1" x1="320" y1="270" x2="320" y2="374" stroke="#D8A657" stroke-width="1" stroke-dasharray="3 4" opacity="0"/>
          <line id="t2Cur2" x1="366" y1="270" x2="366" y2="374" stroke="#D8A657" stroke-width="1" stroke-dasharray="3 4" opacity="0"/>
          <path d="M316 268l4 5 4-5Z" fill="#D8A657"/>
          <path id="t2ShotPath" fill="none" stroke="#CFD8DC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d=""/>
          <text id="t2ScopeDt" x="248" y="392" fill="#CFD8DC" font-size="12" opacity="0">&#916;t = 14.20 ms</text>
          <text x="552" y="392" text-anchor="end" fill="#6b7780" font-size="9.5">200 mA/div &#183; 2 ms/div</text>
          <text x="248" y="410" fill="#6b7780" font-size="9.5" letter-spacing="0.5">ASTEMES MSO-4034</text>
          <text x="552" y="410" text-anchor="end" fill="#6b7780" font-size="9.5">VISA  GPIB0::7::INSTR</text>
        </g>
      </g>
    </svg>`;

  window.AstemesAnim.register({
    id: 'test-executive',
    name: 'Test Executive',
    weight: 3,            // most representative — favoured in the random rotation
    isDefault: true,
    mount: function (stage) {
    stage.innerHTML = SVG;
    var __raf = null, __torn = false, __rearmT = null;

    var panel = stage.querySelector('svg');
    if (!panel) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var q = function (s) { return panel.querySelector('#' + s); };

    // Each step carries its own measurement time, so results land at an uneven cadence.
    // nom = nominal reading, sd = spread between units, dec = decimals shown. min = one-sided floor.
    // failv generates an out-of-limit reading for the occasional failing unit.
    var steps = [
      { d: 700,  inst: null,  fixed: '0x00 OK' },
      { d: 1500, inst: 'dmm',   unit: 'Ω',  mode: '2-WIRE Ω',        nom: 12.4, sd: 0.16, dec: 2, failv: function () { return 13.1 + Math.random() * 0.5; } },
      { d: 1100, inst: 'dmm',   unit: 'MΩ', mode: 'INSULATION 500V', nom: 720,  sd: 130,  dec: 0, min: 540, failv: function () { return 48 + Math.random() * 40; } },
      { d: 900,  inst: 'dmm',   unit: 'V',  mode: 'DC VOLTAGE',      nom: 7.82, sd: 0.20, dec: 2, failv: function () { return 9.3 + Math.random() * 0.8; } },
      { d: 1800, inst: 'scope', unit: 'ms',                          nom: 14.2, sd: 1.0,  dec: 2, failv: function () { return 21.2 + Math.random() * 3; } },
      { d: 1300, inst: 'dmm',   unit: 'mA', mode: 'DC CURRENT',      nom: 92,   sd: 4.5,  dec: 1, failv: function () { return 112 + Math.random() * 9; } }
    ];
    var N = steps.length, LEAD = 700, HOLD = 2400, FAIL_ODDS = 1 / 6;
    var starts = [], ends = [], acc = LEAD;
    for (var k = 0; k < N; k++) { starts[k] = acc; acc += steps[k].d; ends[k] = acc; }
    var TEST_END = acc, CYCLE = TEST_END + HOLD;

    // Each unit under test reads slightly differently — fresh noisy measurements per DUT.
    // Roughly 1 in 6 units gets one out-of-limit step; the sequence continues (FCT-style).
    function gauss() { return ((Math.random() + Math.random() + Math.random()) - 1.5) / 0.5; }
    function genMeas() {
      var failIdx = -1;
      if (Math.random() < FAIL_ODDS) {
        var elig = []; steps.forEach(function (s, i) { if (s.failv) elig.push(i); });
        failIdx = elig[Math.floor(Math.random() * elig.length)];
      }
      return steps.map(function (s, i) {
        if (s.fixed) return { v: s.fixed, num: s.fixed, unit: '', pass: true };
        var x = (i === failIdx) ? s.failv()
              : (s.min != null) ? s.min + Math.abs(gauss()) * s.sd
                                : s.nom + Math.max(-2.5, Math.min(2.5, gauss())) * s.sd;
        var num = x.toFixed(s.dec);
        return { v: num + ' ' + s.unit, num: num, unit: s.unit, pass: i !== failIdx, dt: 'Δt = ' + num + ' ms' };
      });
    }
    var meas = genMeas();
    function failCount(upTo) {
      var n = 0;
      for (var i = 0; i < N; i++) if ((upTo == null || i <= upTo) && !meas[i].pass) n++;
      return n;
    }

    // Single-shot actuation-current trace, rebuilt per DUT with amplitude variation + sample noise.
    function shapeY(x) {
      var b = 360, p = 290, h = 350;
      if (x < 318) return b;
      if (x < 330) return b - (b - p) * Math.sin(((x - 318) / 12) * (Math.PI / 2));
      if (x < 360) return h - (h - p) * Math.exp(-(x - 330) / 9);
      if (x < 372) return h + 6 * Math.sin(((x - 360) / 12) * Math.PI);
      if (x < 408) return h + 1.2 * Math.sin(x * 0.7);
      if (x < 418) return h + (b - h) * ((x - 408) / 10);
      return b;
    }
    function buildTrace() {
      var amp = 0.86 + Math.random() * 0.28, d = '';
      for (var x = 250; x <= 550; x += 2) {
        var y = 360 - (360 - shapeY(x)) * amp + (Math.random() - 0.5) * 2.4;
        d += (x === 250 ? 'M' : ' L') + x + ',' + y.toFixed(1);
      }
      return d;
    }

    var C = { green:'#79C5A6', amber:'#D8A657', red:'#B07A7A', redtx:'#D69191', light:'#CFD8DC', white:'#FFFFFF',
              dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862' };

    var stopped = false, curState = 'wait', curRunning = -1, lastC = 0;

    function setRow(i, st, c) {
      var n = q('t2N'+i), v = q('t2V'+i), box = q('t2Box'+i), b = q('t2B'+i), hi = q('t2Hi'+i);
      if (st === 'done') {
        var ok = meas[i].pass;
        n.setAttribute('fill', C.light);
        v.setAttribute('text-anchor', 'end'); v.setAttribute('x', '388');
        v.textContent = meas[i].v; v.setAttribute('fill', ok ? C.white : C.redtx);
        box.setAttribute('opacity', '1');
        box.setAttribute('fill', ok ? 'rgba(121,197,166,0.15)' : 'rgba(176,122,122,0.15)');
        box.setAttribute('stroke', ok ? C.green : C.red);
        b.textContent = ok ? 'Passed' : 'Failed'; b.setAttribute('fill', ok ? C.green : C.redtx);
        hi.setAttribute('opacity', '0');
      } else if (st === 'run') {
        n.setAttribute('fill', C.light);
        // left-anchored while measuring so the animated dots grow rightward without shifting the label
        v.setAttribute('text-anchor', 'start'); v.setAttribute('x', '300');
        v.textContent = 'measuring' + new Array(2 + (Math.floor(c / 350) % 3)).join('.');
        v.setAttribute('fill', C.amber);
        box.setAttribute('opacity', '1');
        box.setAttribute('fill', 'rgba(216,166,87,0.15)'); box.setAttribute('stroke', C.amber);
        b.textContent = 'Running'; b.setAttribute('fill', C.amber);
        hi.setAttribute('opacity', '1');
      } else if (st === 'abort') {
        n.setAttribute('fill', C.light);
        v.setAttribute('text-anchor', 'end'); v.setAttribute('x', '388');
        v.textContent = '—'; v.setAttribute('fill', C.mut);
        box.setAttribute('opacity', '1');
        box.setAttribute('fill', 'rgba(176,122,122,0.12)'); box.setAttribute('stroke', C.red);
        b.textContent = 'Aborted'; b.setAttribute('fill', C.red);
        hi.setAttribute('opacity', '0');
      } else {
        n.setAttribute('fill', C.dim);
        v.setAttribute('text-anchor', 'end'); v.setAttribute('x', '388');
        v.textContent = '—'; v.setAttribute('fill', C.dim);
        box.setAttribute('opacity', '0'); b.textContent = '';   // no status until the step runs
        hi.setAttribute('opacity', '0');
      }
    }

    function setBanner(state, idx) {
      var rect = q('t2Banner'), txt = q('t2BannerText'), sub = q('t2BannerSub');
      var spin = q('t2Spin'), chk = q('t2BannerCheck'), wait = q('t2WaitDot'), x = q('t2BannerX');
      spin.setAttribute('opacity', '0'); chk.setAttribute('opacity', '0');
      wait.setAttribute('opacity', '0'); x.setAttribute('opacity', '0');
      if (state === 'test') {
        rect.setAttribute('fill', 'rgba(216,166,87,0.12)'); rect.setAttribute('stroke', C.amber);
        txt.textContent = 'TESTING'; txt.setAttribute('fill', C.amber);
        sub.textContent = 'STEP ' + (idx + 1) + ' / ' + N;
        spin.setAttribute('opacity', '1');
      } else if (state === 'pass') {
        rect.setAttribute('fill', 'rgba(121,197,166,0.14)'); rect.setAttribute('stroke', C.green);
        txt.textContent = 'PASSED'; txt.setAttribute('fill', C.green);
        sub.textContent = N + ' / ' + N + ' PASSED';
        chk.setAttribute('opacity', '1');
      } else if (state === 'fail') {
        rect.setAttribute('fill', 'rgba(176,122,122,0.12)'); rect.setAttribute('stroke', C.red);
        txt.textContent = 'FAILED'; txt.setAttribute('fill', C.redtx);
        sub.textContent = (N - failCount()) + ' / ' + N + ' PASSED';
        x.setAttribute('opacity', '1');
      } else if (state === 'abort') {
        rect.setAttribute('fill', 'rgba(176,122,122,0.12)'); rect.setAttribute('stroke', C.red);
        txt.textContent = 'ABORTED'; txt.setAttribute('fill', C.red);
        sub.textContent = 'STOPPED AT STEP ' + (idx + 1) + ' / ' + N;
        x.setAttribute('opacity', '1');
      } else {
        rect.setAttribute('fill', 'rgba(96,125,139,0.10)'); rect.setAttribute('stroke', C.mut);
        txt.textContent = 'READY'; txt.setAttribute('fill', C.gmut);
        sub.textContent = 'WAITING FOR UUT';
        wait.setAttribute('opacity', '1');
      }
    }

    function setStop(enabled) {
      var col = enabled ? C.red : C.queue, g = q('t2Stop');
      q('t2StopBox').setAttribute('stroke', col);
      q('t2StopBox').setAttribute('fill', enabled ? 'rgba(176,122,122,0.12)' : 'none');
      q('t2StopBox').setAttribute('opacity', enabled ? '1' : '0.5');
      q('t2StopTxt').setAttribute('fill', col);
      q('t2StopIcon').setAttribute('fill', col);
      g.style.pointerEvents = enabled ? 'auto' : 'none';
      g.style.cursor = enabled ? 'pointer' : 'default';
      stopEnabled = enabled;
    }

    // ── Floating instrument front panels ──
    var inst = q('t2Inst'), instTitle = q('t2InstTitle'),
        dmm = q('t2Dmm'), scope = q('t2Scope'),
        dmmVal = q('t2DmmVal'), dmmUnit = q('t2DmmUnit'), dmmMode = q('t2DmmMode'),
        shot = q('t2ShotPath'), scopeDt = q('t2ScopeDt'), cur1 = q('t2Cur1'), cur2 = q('t2Cur2');
    var shotLen = 0, jBucket = -1, jStr = '';
    inst.style.transition = 'opacity 0.22s ease';   // fade previously supplied by site CSS (#atsInst)
    shot.setAttribute('d', buildTrace());   // first DUT's noisy capture

    // Stop-button hover feedback, previously supplied by site CSS (#atsStop:hover)
    var stopEnabled = true;
    q('t2Stop').addEventListener('mouseenter', function () { if (stopEnabled) q('t2StopBox').setAttribute('fill', 'rgba(176,122,122,0.24)'); });
    q('t2Stop').addEventListener('mouseleave', function () { if (stopEnabled) q('t2StopBox').setAttribute('fill', 'rgba(176,122,122,0.12)'); });

    // Scramble the not-yet-settled trailing digits so the DMM reads like it is converging.
    function jitter(s, lock) {
      var out = '';
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        out += (i < lock || ch < '0' || ch > '9') ? ch : String(Math.floor(Math.random() * 10));
      }
      return out;
    }

    function showInstrument(i, p, c) {
      var s = steps[i];
      if (!s || !s.inst) { inst.style.opacity = '0'; return; }
      inst.style.opacity = '1';
      var settle = Math.min(p / 0.55, 1);   // reading settles over the first ~55% of the step
      if (s.inst === 'dmm') {
        dmm.setAttribute('display', 'inline'); scope.setAttribute('display', 'none');
        instTitle.textContent = 'DIGITAL MULTIMETER';
        dmmMode.textContent = s.mode; dmmUnit.textContent = s.unit;
        var dval = meas[i].num;
        if (settle >= 1) { dmmVal.textContent = dval; }
        else {
          var bucket = Math.floor(c / 60);
          if (bucket !== jBucket) { jBucket = bucket; jStr = jitter(dval, Math.floor(settle * dval.length)); }
          dmmVal.textContent = jStr;
        }
      } else {
        scope.setAttribute('display', 'inline'); dmm.setAttribute('display', 'none');
        instTitle.textContent = 'OSCILLOSCOPE';
        if (!shotLen) { shotLen = shot.getTotalLength(); shot.setAttribute('stroke-dasharray', shotLen); }
        shot.setAttribute('stroke-dashoffset', (shotLen * (1 - settle)).toFixed(1));  // trace drawn once
        // cursors + Δt are the measured result — reveal them only once the capture is complete
        var done = settle >= 1 ? '1' : '0';
        cur1.setAttribute('opacity', done); cur2.setAttribute('opacity', done);
        scopeDt.textContent = meas[i].dt; scopeDt.setAttribute('opacity', done);
      }
    }

    function render(c) {
      curRunning = -1;
      for (var i = 0; i < N; i++) {
        if (c >= ends[i]) setRow(i, 'done', c);
        else if (c >= starts[i]) { setRow(i, 'run', c); curRunning = i; }
        else setRow(i, 'idle', c);
      }
      curState = c < LEAD ? 'wait' : (c >= TEST_END ? (failCount() ? 'fail' : 'pass') : 'test');
      setBanner(curState, curRunning < 0 ? 0 : curRunning);
      setStop(curState === 'test');   // Stop is only active while a test is running
      if (curState === 'test' && curRunning >= 0)
        showInstrument(curRunning, (c - starts[curRunning]) / steps[curRunning].d, c);
      else inst.style.opacity = '0';
      // failed count only reflects steps whose results are already in
      var doneUpTo = -1;
      for (var j = 0; j < N; j++) if (c >= ends[j]) doneUpTo = j;
      q('t2Elapsed').textContent = 'ELAPSED ' + (Math.min(c, TEST_END) / 1000).toFixed(1) + ' s · ' + failCount(doneUpTo) + ' FAILED';
    }

    function newDut() {
      unit++; q('t2Sn').textContent = '24-' + String(unit).padStart(4, '0');
      meas = genMeas(); shot.setAttribute('d', buildTrace()); shotLen = 0;
    }

    // Stop aborts the running sequence, holds, then re-arms with a fresh unit.
    function abort() {
      if (stopped || curState !== 'test') return;
      stopped = true;
      var c = lastC, idx = curRunning;
      for (var i = 0; i < N; i++) {
        if (c >= ends[i]) setRow(i, 'done', c);
        else if (i === idx) setRow(i, 'abort', c);
        else setRow(i, 'idle', c);
      }
      setBanner('abort', idx < 0 ? 0 : idx);
      setStop(false);
      inst.style.opacity = '0';   // dismiss the instrument panel on abort
      q('t2Elapsed').textContent = 'ELAPSED ' + (Math.min(c, TEST_END) / 1000).toFixed(1) + ' s · TEST ABORTED';
      __rearmT = setTimeout(rearm, 2600);
    }
    function rearm() {
      if (__torn) return;
      stopped = false; t0 = null; lastC = 0;
      newDut();
      startLoop();
    }
    q('t2Stop').addEventListener('click', abort);

    if (reduce) { render(TEST_END); return function () { __torn = true; stage.innerHTML = ''; }; }

    var t0 = null, unit = 917, ticking = false;
    function frame(ts) {
      if (__torn || stopped) { ticking = false; return; }
      if (t0 === null) t0 = ts;
      var el = ts - t0, c = el % CYCLE;
      q('t2Spin').setAttribute('transform', 'rotate(' + ((el * 0.45) % 360).toFixed(1) + ' 54 147)');
      if (c < lastC) newDut();   // new DUT — fresh noisy readings and a fresh capture
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
