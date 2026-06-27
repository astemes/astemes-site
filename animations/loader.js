/* Astemes hero-animation loader.
   - Exposes window.AstemesAnim.register(def) for animation modules.
   - Loads the files listed in animations/manifest.js (window.ASTEMES_ANIMATIONS).
   - On each visit, mounts ONE animation into the hero stage:
       * first-ever visit  -> the default (most representative) animation
       * later visits      -> weighted random, different from the last one shown
     The default is weighted highest so it appears most often in the rotation.
   - Renders prev / dots / next controls to swap manually (shown only when >1 animation).
   - Also runs the fixed PCB background parallax (site-wide, independent of the animation).

   Animation module contract (see animations/_template.js):
     window.AstemesAnim.register({
       id: 'my-anim',          // unique
       name: 'My Animation',   // shown in the control tooltip
       weight: 1,              // relative odds in the random rotation
       isDefault: false,       // exactly one module should be the default
       mount: function (stage) {
         // build your SVG/DOM into `stage`, start your loops/listeners
         return function teardown() { ...stop loops, remove listeners... };
       }
     });
*/
(function () {
  var registry = [];
  window.AstemesAnim = {
    register: function (def) { if (def && typeof def.mount === 'function') registry.push(def); }
  };

  // Folder this script lives in, so injected animation files resolve on / and /fi/ /sv/.
  var here = (document.currentScript && document.currentScript.src) || '';
  var dir = here.replace(/[^/]*$/, '');
  var LAST_KEY = 'astemes-anim';

  var stage = null, controls = null, current = -1, teardown = null;

  function defaultIndex() {
    for (var i = 0; i < registry.length; i++) if (registry[i].isDefault) return i;
    return 0;
  }

  function pickIndex() {
    if (registry.length <= 1) return defaultIndex();
    var last = null;
    try { last = localStorage.getItem(LAST_KEY); } catch (e) {}
    if (!last) return defaultIndex();              // first visit -> most representative
    var pool = [];
    for (var i = 0; i < registry.length; i++) {
      if (registry[i].id === last) continue;       // avoid repeating the last one
      var w = Math.max(1, registry[i].weight || 1);
      while (w--) pool.push(i);
    }
    if (!pool.length) return defaultIndex();
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function mountIndex(i) {
    if (i === current) return;
    if (teardown) { try { teardown(); } catch (e) {} teardown = null; }
    current = i;
    try { teardown = registry[i].mount(stage) || null; } catch (e) { teardown = null; }
    try { localStorage.setItem(LAST_KEY, registry[i].id); } catch (e) {}
  }

  function step(delta) {
    var n = registry.length;
    if (n <= 1) return;
    mountIndex(((current + delta) % n + n) % n);
  }

  function makeBtn(cls, label, html, onClick) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.setAttribute('aria-label', label);
    if (html) b.innerHTML = html;
    b.addEventListener('click', onClick);
    return b;
  }

  function buildControls(host) {
    controls = document.createElement('div');
    controls.className = 'anim-controls';
    if (registry.length <= 1) controls.style.display = 'none';
    controls.appendChild(makeBtn('anim-nav anim-prev', 'Previous animation', '&#8249;', function () { step(-1); }));
    controls.appendChild(makeBtn('anim-nav anim-next', 'Next animation', '&#8250;', function () { step(1); }));
    host.appendChild(controls);
  }

  function boot() {
    var host = document.querySelector('.hero-visual');
    if (!host || !registry.length) return;
    // default first, then by name, so dot/control order is stable regardless of load order
    registry.sort(function (a, b) {
      return (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) ||
             String(a.name).localeCompare(String(b.name));
    });
    host.innerHTML = '';
    stage = document.createElement('div'); stage.className = 'anim-stage';
    host.appendChild(stage);
    buildControls(host);
    enableSwipe(host);
    mountIndex(pickIndex());
  }

  // Touch: horizontal swipe turns the carousel (used on mobile in place of the hover buttons).
  function enableSwipe(host) {
    if (registry.length <= 1) return;
    var sx = 0, sy = 0, active = false;
    host.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; sx = t.clientX; sy = t.clientY; active = true;
    }, { passive: true });
    host.addEventListener('touchend', function (e) {
      if (!active) return; active = false;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function loadAnimations(done) {
    var files = window.ASTEMES_ANIMATIONS || [];
    if (!files.length) { done(); return; }
    var left = files.length;
    files.forEach(function (f) {
      var s = document.createElement('script');
      s.src = dir + f;
      s.onload = s.onerror = function () { if (--left === 0) done(); };
      document.head.appendChild(s);
    });
  }

  function start() { loadAnimations(boot); parallax(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  /* ── fixed PCB background parallax — site-wide, independent of the hero animation ── */
  function parallax() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var FACTOR = 0.22, ticking = false, last = null;
    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var shift = -(y * FACTOR);            // negative so the traces lag (slower, same direction)
      if (shift !== last) { last = shift; document.body.style.setProperty('--pcb-shift', shift.toFixed(1) + 'px'); }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }
})();
