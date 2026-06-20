/* Astemes "Test Executive" — animated hero instrument panel.
   Injects itself into any page that has a <div class="hero-visual"> mount.
   Shared by the EN / FI / SV pages so the animation lives in one place. */
(function () {
  var SVG =
  `<svg id="atsPanel" viewBox="0 0 600 560" role="img" aria-label="A live automated test station running a pass/fail measurement sequence on an actuator module, with an acquired coil-current waveform."
         font-family="'DM Mono', ui-monospace, 'SFMono-Regular', monospace">
      <defs>
        <clipPath id="atsScreen"><rect x="34" y="138" width="532" height="196" rx="4"/></clipPath>
        <filter id="atsGlow" x="-20%" y="-50%" width="140%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.6" flood-color="#CFD8DC" flood-opacity="0.5"/>
        </filter>
      </defs>

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
      <text id="atsSn" x="560" y="100" text-anchor="end" fill="#CFD8DC" font-size="13">24-0917</text>

      <!-- status banner -->
      <rect id="atsBanner" x="32" y="120" width="536" height="54" rx="8" fill="rgba(96,125,139,0.10)" stroke="#6b7780" stroke-width="1.5"/>
      <g id="atsSpin" transform="rotate(0 54 147)" opacity="0">
        <circle cx="54" cy="147" r="11" fill="none" stroke="#D8A657" stroke-width="3" stroke-linecap="round" stroke-dasharray="52 70"/>
      </g>
      <path id="atsBannerCheck" d="M47 147l5 6 12-15" fill="none" stroke="#79C5A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      <circle id="atsWaitDot" cx="54" cy="147" r="8" fill="none" stroke="#6b7780" stroke-width="2.5" opacity="1"/>
      <path id="atsBannerX" d="M47 140l14 14M61 140l-14 14" fill="none" stroke="#B07A7A" stroke-width="3" stroke-linecap="round" opacity="0"/>
      <text id="atsBannerText" x="80" y="156" fill="#9E9E9E" font-size="22" font-family="'Space Grotesk',sans-serif" font-weight="700" letter-spacing="0.5">READY</text>
      <text id="atsBannerSub" x="552" y="153" text-anchor="end" fill="#9E9E9E" font-size="12">WAITING FOR UUT</text>

      <!-- acquisition plot — HIDDEN for now; returns later as a single-shot scope capture in a floating window -->
      <g id="atsPlot" display="none">
      <text x="40" y="124" fill="#CFD8DC" font-size="12" letter-spacing="1">COIL CURRENT &#8212; ACTUATION PROFILE</text>
      <text x="560" y="124" text-anchor="end" fill="#9E9E9E" font-size="11">I_pk 0.91 A &#183; I_hold 0.09 A</text>
      <rect x="32" y="136" width="536" height="200" rx="6" fill="#1b2329" stroke="#38454e" stroke-width="1.5"/>
      <g clip-path="url(#atsScreen)">
        <line x1="100" y1="138" x2="100" y2="334" stroke="rgba(96,125,139,0.12)"/>
        <line x1="166" y1="138" x2="166" y2="334" stroke="rgba(96,125,139,0.12)"/>
        <line x1="232" y1="138" x2="232" y2="334" stroke="rgba(96,125,139,0.12)"/>
        <line x1="298" y1="138" x2="298" y2="334" stroke="rgba(96,125,139,0.12)"/>
        <line x1="364" y1="138" x2="364" y2="334" stroke="rgba(96,125,139,0.12)"/>
        <line x1="430" y1="138" x2="430" y2="334" stroke="rgba(96,125,139,0.12)"/>
        <line x1="496" y1="138" x2="496" y2="334" stroke="rgba(96,125,139,0.12)"/>
        <line x1="34" y1="200" x2="566" y2="200" stroke="rgba(96,125,139,0.10)"/>
        <line x1="34" y1="262" x2="566" y2="262" stroke="rgba(96,125,139,0.10)"/>
        <line x1="34" y1="168" x2="566" y2="168" stroke="#D8A657" stroke-width="1" stroke-dasharray="4 5" stroke-opacity="0.8"/>
        <g id="atsTrace">
          <path transform="translate(0,34)" fill="none" stroke="#CFD8DC" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#atsGlow)"
            d="M-160,300 L-158,300 L-156,300 L-154,300 L-152,300 L-150,300 L-148,300 L-146,300 L-144,300 L-142,300 L-140,259.1 L-138,221 L-136,188.3 L-134,163.2 L-132,147.4 L-130,142 L-128,162.7 L-126,180.3 L-124,195.1 L-122,207.7 L-120,218.3 L-118,227.3 L-116,235 L-114,241.4 L-112,246.9 L-110,251.5 L-108,255.4 L-106,258.7 L-104,261.5 L-102,263.9 L-100,265.9 L-98,267.6 L-96,269.1 L-94,270.3 L-92,271.3 L-90,277.2 L-88,276 L-86,278.5 L-84,275.4 L-82,278.2 L-80,276.5 L-78,276.7 L-76,278.1 L-74,275.5 L-72,278.5 L-70,275.9 L-68,277.3 L-66,277.5 L-64,275.8 L-62,278.6 L-60,275.5 L-58,278 L-56,276.8 L-54,276.3 L-52,278.3 L-50,275.4 L-48,278.4 L-46,276.2 L-44,277 L-42,277.8 L-40,277 L-38,282.8 L-36,288.5 L-34,294.2 L-32,300 L-30,300 L-28,300 L-26,300 L-24,300 L-22,300 L-20,300 L-18,300 L-16,300 L-14,300 L-12,300 L-10,300 L-8,300 L-6,300 L-4,300 L-2,300 L0,300 L2,300 L4,300 L6,300 L8,300 L10,300 L12,300 L14,300 L16,300 L18,300 L20,259.1 L22,221 L24,188.3 L26,163.2 L28,147.4 L30,142 L32,162.7 L34,180.3 L36,195.1 L38,207.7 L40,218.3 L42,227.3 L44,235 L46,241.4 L48,246.9 L50,251.5 L52,255.4 L54,258.7 L56,261.5 L58,263.9 L60,265.9 L62,267.6 L64,269.1 L66,270.3 L68,271.3 L70,277.2 L72,276 L74,278.5 L76,275.4 L78,278.2 L80,276.5 L82,276.7 L84,278.1 L86,275.5 L88,278.5 L90,275.9 L92,277.3 L94,277.5 L96,275.8 L98,278.6 L100,275.5 L102,278 L104,276.8 L106,276.3 L108,278.3 L110,275.4 L112,278.4 L114,276.2 L116,277 L118,277.8 L120,277 L122,282.8 L124,288.5 L126,294.2 L128,300 L130,300 L132,300 L134,300 L136,300 L138,300 L140,300 L142,300 L144,300 L146,300 L148,300 L150,300 L152,300 L154,300 L156,300 L158,300 L160,300 L162,300 L164,300 L166,300 L168,300 L170,300 L172,300 L174,300 L176,300 L178,300 L180,259.1 L182,221 L184,188.3 L186,163.2 L188,147.4 L190,142 L192,162.7 L194,180.3 L196,195.1 L198,207.7 L200,218.3 L202,227.3 L204,235 L206,241.4 L208,246.9 L210,251.5 L212,255.4 L214,258.7 L216,261.5 L218,263.9 L220,265.9 L222,267.6 L224,269.1 L226,270.3 L228,271.3 L230,277.2 L232,276 L234,278.5 L236,275.4 L238,278.2 L240,276.5 L242,276.7 L244,278.1 L246,275.5 L248,278.5 L250,275.9 L252,277.3 L254,277.5 L256,275.8 L258,278.6 L260,275.5 L262,278 L264,276.8 L266,276.3 L268,278.3 L270,275.4 L272,278.4 L274,276.2 L276,277 L278,277.8 L280,277 L282,282.8 L284,288.5 L286,294.2 L288,300 L290,300 L292,300 L294,300 L296,300 L298,300 L300,300 L302,300 L304,300 L306,300 L308,300 L310,300 L312,300 L314,300 L316,300 L318,300 L320,300 L322,300 L324,300 L326,300 L328,300 L330,300 L332,300 L334,300 L336,300 L338,300 L340,259.1 L342,221 L344,188.3 L346,163.2 L348,147.4 L350,142 L352,162.7 L354,180.3 L356,195.1 L358,207.7 L360,218.3 L362,227.3 L364,235 L366,241.4 L368,246.9 L370,251.5 L372,255.4 L374,258.7 L376,261.5 L378,263.9 L380,265.9 L382,267.6 L384,269.1 L386,270.3 L388,271.3 L390,277.2 L392,276 L394,278.5 L396,275.4 L398,278.2 L400,276.5 L402,276.7 L404,278.1 L406,275.5 L408,278.5 L410,275.9 L412,277.3 L414,277.5 L416,275.8 L418,278.6 L420,275.5 L422,278 L424,276.8 L426,276.3 L428,278.3 L430,275.4 L432,278.4 L434,276.2 L436,277 L438,277.8 L440,277 L442,282.8 L444,288.5 L446,294.2 L448,300 L450,300 L452,300 L454,300 L456,300 L458,300 L460,300 L462,300 L464,300 L466,300 L468,300 L470,300 L472,300 L474,300 L476,300 L478,300 L480,300 L482,300 L484,300 L486,300 L488,300 L490,300 L492,300 L494,300 L496,300 L498,300 L500,259.1 L502,221 L504,188.3 L506,163.2 L508,147.4 L510,142 L512,162.7 L514,180.3 L516,195.1 L518,207.7 L520,218.3 L522,227.3 L524,235 L526,241.4 L528,246.9 L530,251.5 L532,255.4 L534,258.7 L536,261.5 L538,263.9 L540,265.9 L542,267.6 L544,269.1 L546,270.3 L548,271.3 L550,277.2 L552,276 L554,278.5 L556,275.4 L558,278.2 L560,276.5 L562,276.7 L564,278.1 L566,275.5 L568,278.5 L570,275.9 L572,277.3 L574,277.5 L576,275.8 L578,278.6 L580,275.5 L582,278 L584,276.8 L586,276.3 L588,278.3 L590,275.4 L592,278.4 L594,276.2 L596,277 L598,277.8 L600,277 L602,282.8 L604,288.5 L606,294.2 L608,300 L610,300 L612,300 L614,300 L616,300 L618,300 L620,300 L622,300 L624,300 L626,300 L628,300 L630,300 L632,300 L634,300 L636,300 L638,300 L640,300 L642,300 L644,300 L646,300 L648,300 L650,300 L652,300 L654,300 L656,300 L658,300 L660,259.1 L662,221 L664,188.3 L666,163.2 L668,147.4 L670,142 L672,162.7 L674,180.3 L676,195.1 L678,207.7 L680,218.3 L682,227.3 L684,235 L686,241.4 L688,246.9 L690,251.5 L692,255.4 L694,258.7 L696,261.5 L698,263.9 L700,265.9 L702,267.6 L704,269.1 L706,270.3 L708,271.3 L710,277.2 L712,276 L714,278.5 L716,275.4 L718,278.2 L720,276.5 L722,276.7 L724,278.1 L726,275.5 L728,278.5 L730,275.9 L732,277.3 L734,277.5 L736,275.8 L738,278.6 L740,275.5 L742,278 L744,276.8 L746,276.3 L748,278.3 L750,275.4 L752,278.4 L754,276.2 L756,277 L758,277.8 L760,277"/>
        </g>
      </g>
      <text x="562" y="164" text-anchor="end" fill="#D8A657" font-size="9.5">PEAK LIMIT 0.95 A</text>
      <text x="300" y="352" text-anchor="middle" fill="#9E9E9E" font-size="9" letter-spacing="2">TIME &#8594;</text>
      </g>

      <!-- test sequence list -->
      <text x="40" y="200" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">STEP</text>
      <text x="388" y="200" text-anchor="end" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">MEASURED</text>
      <text x="400" y="200" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">LIMITS</text>
      <text x="558" y="200" text-anchor="end" fill="#9E9E9E" font-size="9.5" letter-spacing="1.5">STATUS</text>
      <path d="M40 208H560" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>

      <g font-size="12.5">
        <g id="atsHi0" opacity="0"><rect x="24" y="213" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="213" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="234" fill="#607D8B" font-size="10">1</text>
        <text id="atsN0" x="58" y="234" fill="#5a6873">Power-On Self Test</text>
        <text id="atsV0" x="388" y="234" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="234" fill="#6b7780" font-size="10">&#8212;</text>
        <rect id="atsBox0" x="500" y="221.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="atsB0" x="529" y="234" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>

        <g id="atsHi1" opacity="0"><rect x="24" y="247" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="247" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="268" fill="#607D8B" font-size="10">2</text>
        <text id="atsN1" x="58" y="268" fill="#5a6873">Coil Resistance</text>
        <text id="atsV1" x="388" y="268" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="268" fill="#6b7780" font-size="10">11.8&#8211;13.0 &#937;</text>
        <rect id="atsBox1" x="500" y="255.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="atsB1" x="529" y="268" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>

        <g id="atsHi2" opacity="0"><rect x="24" y="281" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="281" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="302" fill="#607D8B" font-size="10">3</text>
        <text id="atsN2" x="58" y="302" fill="#5a6873">Insulation Resistance</text>
        <text id="atsV2" x="388" y="302" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="302" fill="#6b7780" font-size="10">&#8805;100 M&#937;</text>
        <rect id="atsBox2" x="500" y="289.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="atsB2" x="529" y="302" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>

        <g id="atsHi3" opacity="0"><rect x="24" y="315" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="315" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="336" fill="#607D8B" font-size="10">4</text>
        <text id="atsN3" x="58" y="336" fill="#5a6873">Pull-In Voltage</text>
        <text id="atsV3" x="388" y="336" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="336" fill="#6b7780" font-size="10">&#8804;9.0 V</text>
        <rect id="atsBox3" x="500" y="323.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="atsB3" x="529" y="336" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>

        <g id="atsHi4" opacity="0"><rect x="24" y="349" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="349" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="370" fill="#607D8B" font-size="10">5</text>
        <text id="atsN4" x="58" y="370" fill="#5a6873">Actuation Time</text>
        <text id="atsV4" x="388" y="370" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="370" fill="#6b7780" font-size="10">&#8804;20 ms</text>
        <rect id="atsBox4" x="500" y="357.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="atsB4" x="529" y="370" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>

        <g id="atsHi5" opacity="0"><rect x="24" y="383" width="552" height="30" fill="rgba(216,166,87,0.07)"/><rect x="24" y="383" width="3" height="30" fill="#D8A657"/></g>
        <text x="42" y="404" fill="#607D8B" font-size="10">6</text>
        <text id="atsN5" x="58" y="404" fill="#5a6873">Holding Current</text>
        <text id="atsV5" x="388" y="404" text-anchor="end" fill="#5a6873" font-size="12">&#8212;</text>
        <text x="400" y="404" fill="#6b7780" font-size="10">80&#8211;110 mA</text>
        <rect id="atsBox5" x="500" y="391.5" width="58" height="17" rx="3" fill="none" stroke="#4a5862" opacity="0"/>
        <text id="atsB5" x="529" y="404" text-anchor="middle" font-size="9.5" letter-spacing="1" fill="#6b7780"></text>
      </g>

      <!-- footer -->
      <path d="M32 430H568" stroke="#455A64" stroke-width="1" stroke-opacity="0.5"/>
      <text id="atsElapsed" x="40" y="469" fill="#9E9E9E" font-size="12">ELAPSED 0.0 s &#183; 0 FAILED</text>
      <g id="atsStop">
        <rect id="atsStopBox" x="430" y="445" width="130" height="37" rx="6" fill="rgba(176,122,122,0.12)" stroke="#B07A7A" stroke-width="1.5"/>
        <rect id="atsStopIcon" x="462" y="456" width="15" height="15" rx="2" fill="#B07A7A"/>
        <text id="atsStopTxt" x="485" y="469" fill="#B07A7A" font-size="14" font-family="'Space Grotesk',sans-serif" font-weight="600" letter-spacing="1">STOP</text>
      </g>
      <!-- Floating instrument soft front panel — pops up over the sequence while a measurement runs -->
      <g id="atsInst" opacity="0">
        <rect x="236" y="238" width="336" height="200" rx="10" fill="rgba(0,0,0,0.35)"/>
        <rect x="232" y="230" width="336" height="200" rx="10" fill="#222d35" stroke="#5b6b75" stroke-width="1.5"/>
        <path d="M232 240a8 8 0 0 1 8-8H560a8 8 0 0 1 8 8V258H232Z" fill="#2c3a44"/>
        <circle cx="248" cy="244" r="3" fill="#5b6b75"/>
        <circle cx="260" cy="244" r="3" fill="#5b6b75"/>
        <circle cx="272" cy="244" r="3" fill="#5b6b75"/>
        <text id="atsInstTitle" x="290" y="248" fill="#CFD8DC" font-size="11" letter-spacing="1">DIGITAL MULTIMETER</text>
        <text x="556" y="248" text-anchor="end" fill="#6b7780" font-size="13">&#215;</text>

        <!-- DMM front panel -->
        <g id="atsDmm">
          <rect x="248" y="272" width="304" height="86" rx="4" fill="#0d1417" stroke="#34424b"/>
          <text id="atsDmmMode" x="262" y="292" fill="#6f8a86" font-size="10" letter-spacing="1">DC VOLTAGE</text>
          <text x="538" y="292" text-anchor="end" fill="#6f8a86" font-size="10" letter-spacing="1">AUTO</text>
          <text id="atsDmmVal" x="504" y="341" text-anchor="end" fill="#CFD8DC" font-size="40" letter-spacing="2">7.82</text>
          <text id="atsDmmUnit" x="512" y="341" fill="#CFD8DC" font-size="17">V</text>
          <text x="248" y="382" fill="#6b7780" font-size="9.5" letter-spacing="0.5">ASTEMES DMM-2010</text>
          <text x="552" y="382" text-anchor="end" fill="#6b7780" font-size="9.5">VISA  GPIB0::22::INSTR</text>
        </g>

        <!-- Oscilloscope single-shot front panel -->
        <g id="atsScope" display="none">
          <rect x="248" y="270" width="304" height="104" rx="4" fill="#0d1417" stroke="#34424b"/>
          <line x1="248" y1="322" x2="552" y2="322" stroke="rgba(96,125,139,0.18)"/>
          <line x1="300" y1="270" x2="300" y2="374" stroke="rgba(96,125,139,0.12)"/>
          <line x1="400" y1="270" x2="400" y2="374" stroke="rgba(96,125,139,0.12)"/>
          <line x1="500" y1="270" x2="500" y2="374" stroke="rgba(96,125,139,0.12)"/>
          <line id="atsCur1" x1="320" y1="270" x2="320" y2="374" stroke="#D8A657" stroke-width="1" stroke-dasharray="3 4" opacity="0"/>
          <line id="atsCur2" x1="366" y1="270" x2="366" y2="374" stroke="#D8A657" stroke-width="1" stroke-dasharray="3 4" opacity="0"/>
          <path d="M316 268l4 5 4-5Z" fill="#D8A657"/>
          <path id="atsShotPath" fill="none" stroke="#CFD8DC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            d="M250,360 L252,360 L254,360 L256,360 L258,360 L260,360 L262,360 L264,360 L266,360 L268,360 L270,360 L272,360 L274,360 L276,360 L278,360 L280,360 L282,360 L284,360 L286,360 L288,360 L290,360 L292,360 L294,360 L296,360 L298,360 L300,360 L302,360 L304,360 L306,360 L308,360 L310,360 L312,360 L314,360 L316,360 L318,360 L320,341.9 L322,325 L324,310.5 L326,299.4 L328,292.4 L330,290 L332,302 L334,311.5 L336,319.2 L338,325.3 L340,330.2 L342,334.2 L344,337.3 L346,339.9 L348,341.9 L350,343.5 L352,344.8 L354,345.8 L356,346.7 L358,347.3 L360,350 L362,353 L364,355.2 L366,356 L368,355.2 L370,353 L372,350.4 L374,349 L376,349.2 L378,350.8 L380,351 L382,349.6 L384,348.8 L386,350 L388,351.2 L390,350.4 L392,348.9 L394,349.3 L396,350.8 L398,351 L400,349.5 L402,348.8 L404,350.1 L406,351.2 L408,350 L410,352 L412,354 L414,356 L416,358 L418,360 L420,360 L422,360 L424,360 L426,360 L428,360 L430,360 L432,360 L434,360 L436,360 L438,360 L440,360 L442,360 L444,360 L446,360 L448,360 L450,360 L452,360 L454,360 L456,360 L458,360 L460,360 L462,360 L464,360 L466,360 L468,360 L470,360 L472,360 L474,360 L476,360 L478,360 L480,360 L482,360 L484,360 L486,360 L488,360 L490,360 L492,360 L494,360 L496,360 L498,360 L500,360 L502,360 L504,360 L506,360 L508,360 L510,360 L512,360 L514,360 L516,360 L518,360 L520,360 L522,360 L524,360 L526,360 L528,360 L530,360 L532,360 L534,360 L536,360 L538,360 L540,360 L542,360 L544,360 L546,360 L548,360 L550,360"/>
          <text id="atsScopeDt" x="248" y="392" fill="#CFD8DC" font-size="12" opacity="0">&#916;t = 14.20 ms</text>
          <text x="552" y="392" text-anchor="end" fill="#6b7780" font-size="9.5">200 mA/div &#183; 2 ms/div</text>
          <text x="248" y="410" fill="#6b7780" font-size="9.5" letter-spacing="0.5">ASTEMES MSO-4034</text>
          <text x="552" y="410" text-anchor="end" fill="#6b7780" font-size="9.5">VISA  GPIB0::7::INSTR</text>
        </g>
      </g>
    </svg>`;

  function boot() {
    var mount = document.querySelector('.hero-visual');
    if (!mount || mount.querySelector('#atsPanel')) return;   // no mount, or already built
    mount.innerHTML = SVG;

    // ── animation driver (auto-invokes against the freshly injected SVG) ──
(function() {
    var panel = document.getElementById('atsPanel');
    if (!panel) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var id = function(s) { return document.getElementById(s); };

    // Each step carries its own measurement time, so results land at an uneven cadence.
    // nom = nominal reading, sd = spread between units, dec = decimals shown. min = one-sided floor.
    var steps = [
      { d: 700,  inst: null,  fixed: '0x00 OK' },
      { d: 1500, inst: 'dmm',   unit: 'Ω',  mode: '2-WIRE Ω',        nom: 12.4, sd: 0.16, dec: 2 },
      { d: 1100, inst: 'dmm',   unit: 'MΩ', mode: 'INSULATION 500V', nom: 720,  sd: 130,  dec: 0, min: 540 },
      { d: 900,  inst: 'dmm',   unit: 'V',  mode: 'DC VOLTAGE',      nom: 7.82, sd: 0.20, dec: 2 },
      { d: 1800, inst: 'scope', unit: 'ms',                          nom: 14.2, sd: 1.0,  dec: 2 },
      { d: 1300, inst: 'dmm',   unit: 'mA', mode: 'DC CURRENT',      nom: 92,   sd: 4.5,  dec: 1 }
    ];
    var N = steps.length, LEAD = 700, HOLD = 2400;
    var starts = [], ends = [], acc = LEAD;
    for (var k = 0; k < N; k++) { starts[k] = acc; acc += steps[k].d; ends[k] = acc; }
    var TEST_END = acc, CYCLE = TEST_END + HOLD;

    // Each unit under test reads slightly differently — fresh noisy measurements per DUT.
    function gauss() { return ((Math.random() + Math.random() + Math.random()) - 1.5) / 0.5; }
    function genMeas() {
      return steps.map(function (s) {
        if (s.fixed) return { v: s.fixed, num: s.fixed, unit: '' };
        var x = (s.min != null) ? s.min + Math.abs(gauss()) * s.sd
                                : s.nom + Math.max(-2.5, Math.min(2.5, gauss())) * s.sd;
        var num = x.toFixed(s.dec);
        return { v: num + ' ' + s.unit, num: num, unit: s.unit, dt: 'Δt = ' + num + ' ms' };
      });
    }
    var meas = genMeas();

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

    var C = { green:'#79C5A6', amber:'#D8A657', light:'#CFD8DC', white:'#FFFFFF',
              dim:'#5a6873', mut:'#6b7780', gmut:'#9E9E9E', queue:'#4a5862' };

    var stopped = false, curState = 'wait', curRunning = -1, lastC = 0;

    function setRow(i, st, c) {
      var n = id('atsN'+i), v = id('atsV'+i), box = id('atsBox'+i), b = id('atsB'+i), hi = id('atsHi'+i);
      if (st === 'pass') {
        n.setAttribute('fill', C.light);
        v.setAttribute('text-anchor', 'end'); v.setAttribute('x', '388');
        v.textContent = meas[i].v; v.setAttribute('fill', C.white);
        box.setAttribute('opacity', '1');
        box.setAttribute('fill', 'rgba(121,197,166,0.15)'); box.setAttribute('stroke', C.green);
        b.textContent = 'Passed'; b.setAttribute('fill', C.green);
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
        box.setAttribute('fill', 'rgba(176,122,122,0.12)'); box.setAttribute('stroke', '#B07A7A');
        b.textContent = 'Aborted'; b.setAttribute('fill', '#B07A7A');
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
      var rect = id('atsBanner'), txt = id('atsBannerText'), sub = id('atsBannerSub');
      var spin = id('atsSpin'), chk = id('atsBannerCheck'), wait = id('atsWaitDot'), x = id('atsBannerX');
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
      } else if (state === 'abort') {
        rect.setAttribute('fill', 'rgba(176,122,122,0.12)'); rect.setAttribute('stroke', '#B07A7A');
        txt.textContent = 'ABORTED'; txt.setAttribute('fill', '#B07A7A');
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
      var col = enabled ? '#B07A7A' : '#4a5862', g = id('atsStop');
      id('atsStopBox').setAttribute('stroke', col);
      id('atsStopBox').setAttribute('fill', enabled ? 'rgba(176,122,122,0.12)' : 'none');
      id('atsStopBox').setAttribute('opacity', enabled ? '1' : '0.5');
      id('atsStopTxt').setAttribute('fill', col);
      id('atsStopIcon').setAttribute('fill', col);
      g.style.pointerEvents = enabled ? 'auto' : 'none';
      g.style.cursor = enabled ? 'pointer' : 'default';
    }

    // ── Floating instrument front panels ──
    var inst = id('atsInst'), instTitle = id('atsInstTitle'),
        dmm = id('atsDmm'), scope = id('atsScope'),
        dmmVal = id('atsDmmVal'), dmmUnit = id('atsDmmUnit'), dmmMode = id('atsDmmMode'),
        shot = id('atsShotPath'), scopeDt = id('atsScopeDt'), cur1 = id('atsCur1'), cur2 = id('atsCur2');
    var shotLen = 0, jBucket = -1, jStr = '';
    shot.setAttribute('d', buildTrace());   // first DUT's noisy capture

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
        if (c >= ends[i]) setRow(i, 'pass', c);
        else if (c >= starts[i]) { setRow(i, 'run', c); curRunning = i; }
        else setRow(i, 'idle', c);
      }
      curState = c < LEAD ? 'wait' : (c >= TEST_END ? 'pass' : 'test');
      setBanner(curState, curRunning < 0 ? 0 : curRunning);
      setStop(curState === 'test');   // Stop is only active while a test is running
      if (curState === 'test' && curRunning >= 0)
        showInstrument(curRunning, (c - starts[curRunning]) / steps[curRunning].d, c);
      else inst.style.opacity = '0';
      id('atsElapsed').textContent = 'ELAPSED ' + (Math.min(c, TEST_END) / 1000).toFixed(1) + ' s · 0 FAILED';
    }

    // Stop aborts the running sequence and halts the animation.
    function abort() {
      if (stopped || curState !== 'test') return;
      stopped = true;
      var c = lastC, idx = curRunning;
      for (var i = 0; i < N; i++) {
        if (c >= ends[i]) setRow(i, 'pass', c);
        else if (i === idx) setRow(i, 'abort', c);
        else setRow(i, 'idle', c);
      }
      setBanner('abort', idx < 0 ? 0 : idx);
      setStop(false);
      inst.style.opacity = '0';   // dismiss the instrument panel on abort
      id('atsElapsed').textContent = 'ELAPSED ' + (Math.min(c, TEST_END) / 1000).toFixed(1) + ' s · TEST ABORTED';
    }
    id('atsStop').addEventListener('click', abort);

    // Only animate on a full desktop browser — hidden on mobile/tablet (see CSS), and paused there too.
    var mqDesktop = window.matchMedia('(min-width: 1081px)');
    if (reduce) { if (mqDesktop.matches) render(TEST_END); return; }

    var t0 = null, unit = 917, ticking = false;
    function frame(ts) {
      if (stopped || !mqDesktop.matches) { ticking = false; return; }
      if (t0 === null) t0 = ts;
      var el = ts - t0, c = el % CYCLE;
      id('atsSpin').setAttribute('transform', 'rotate(' + ((el * 0.45) % 360).toFixed(1) + ' 54 147)');
      if (c < lastC) {   // new DUT — fresh noisy readings and a fresh capture
        unit++; id('atsSn').textContent = '24-' + String(unit).padStart(4, '0');
        meas = genMeas(); shot.setAttribute('d', buildTrace()); shotLen = 0;
      }
      lastC = c;
      render(c);
      requestAnimationFrame(frame);
    }
    function startLoop() {
      if (ticking || stopped || !mqDesktop.matches) return;
      ticking = true; t0 = null; requestAnimationFrame(frame);
    }
    if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', startLoop);
    else if (mqDesktop.addListener) mqDesktop.addListener(startLoop);
    startLoop();
  })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* PCB background parallax — drifts the fixed circuit layer slower than the page on scroll. */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var FACTOR = 0.22, ticking = false, last = null;
  function update() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var shift = -(y * FACTOR);            // negative so the traces lag (move slower, same direction)
    if (shift !== last) {
      last = shift;
      document.body.style.setProperty('--pcb-shift', shift.toFixed(1) + 'px');
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
})();
