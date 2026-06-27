/* TEMPLATE — copy this file to start a new hero animation, then add its filename to
   animations/manifest.js so the loader picks it up. (This file itself is NOT listed in
   the manifest, so it is never loaded.)

   The loader shows ONE animation at a time, mounted into `stage` — a <div class="anim-stage">
   inside .hero-visual. Keep teardown clean so swapping between animations works: stop any
   requestAnimationFrame loop and remove any listeners you added.

   The hero is hidden on mobile (≤1080px); keep heavy work gated to desktop if needed
   (see test-executive.js for the matchMedia('(min-width: 1081px)') pattern), and respect
   matchMedia('(prefers-reduced-motion: reduce)'). */
(function () {
  window.AstemesAnim.register({
    id: 'example',
    name: 'Example',
    weight: 1,
    isDefault: false,
    mount: function (stage) {
      stage.innerHTML =
        '<svg viewBox="0 0 600 560" width="100%" style="max-width:560px" ' +
        'font-family="\'DM Mono\', monospace">' +
        '<rect x="16" y="16" width="568" height="528" rx="18" fill="rgba(43,54,64,0.55)" stroke="#455A64"/>' +
        '<circle id="exDot" cx="300" cy="280" r="10" fill="#CFD8DC"/>' +
        '</svg>';

      var dot = stage.querySelector('#exDot');
      var raf = null, t0 = null, torn = false;
      function frame(ts) {
        if (torn) return;
        if (t0 === null) t0 = ts;
        var t = (ts - t0) / 1000;
        dot.setAttribute('cx', (300 + Math.sin(t) * 220).toFixed(1));
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);

      return function teardown() {
        torn = true;
        if (raf) cancelAnimationFrame(raf);
        stage.innerHTML = '';
      };
    }
  });
})();
