/* Rain or Shine Apps — homepage handwriting.
   Loaded without defer in <head> so the masthead can be hidden before first paint when it's about
   to be written on. Everything else waits for the DOM. Without JS the finished masthead and every
   app box simply show. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnimate = 'animate' in document.documentElement && !!window.SVGPathElement;
  var SESSION_KEY = 'ros-masthead-written';

  var seen = false;
  try { seen = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) {}
  var writeOn = canAnimate && !reduce && !seen;

  if (writeOn) root.classList.add('is-writing');
  if (canAnimate) root.classList.add('has-ink');

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ---------- Masthead write-on: once per browser session ---------- */
  function writeMasthead() {
    var svg = document.querySelector('.hub-hero .masthead');
    var pens = svg ? [].slice.call(svg.querySelectorAll('#pens path')) : [];
    var finish = document.getElementById('finish');
    if (!writeOn || !pens.length || !finish) { root.classList.remove('is-writing'); return; }

    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}

    var SPEED = 1.25; // viewBox units per ms
    var t = 300;
    pens.forEach(function (p) {
      var L = p.getTotalLength();
      p.style.strokeDasharray = L + ' ' + L;
      p.style.strokeDashoffset = L;
      var kind = p.getAttribute('data-kind');
      var dur = kind === 'dot' ? 140 : Math.max(220, L / SPEED);
      t += kind === 'beam' ? 60 : (kind === 'drop' ? 380 : 90);
      p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
        { duration: dur, delay: t, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
      t += dur;
    });
    finish.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: t, fill: 'forwards' });
    svg.classList.add('is-ready');
    setTimeout(function () { root.classList.remove('is-writing'); }, t + 100);
  }

  /* ---------- Ink line down the app list: dots with sparks, ending in a droplet ---------- */
  function drawInkLine() {
    var trail = document.getElementById('ink-trail');
    var svg = document.getElementById('inkline');
    if (!trail || !svg || !canAnimate) return;
    var path = document.getElementById('inkpath');
    var nodesG = document.getElementById('nodes');
    var ending = document.getElementById('ending');
    var dropPen = document.getElementById('dropPen');
    var dropFinish = document.getElementById('dropFinish');
    var cards = [].slice.call(trail.querySelectorAll('.app-row'));
    var NS = 'http://www.w3.org/2000/svg';
    var DROP_H = 120, DROP_SHIFT = 36; // the droplet hangs off the line, nudged right so its rays fit
    var total = 0, marks = [], dropDone = false, penLen = dropPen.getTotalLength();

    function seeded(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }
    // Layout offset inside the trail, ignoring the reveal transform on pending cards.
    function topIn(el) { var y = 0; while (el && el !== trail) { y += el.offsetTop; el = el.offsetParent; } return y; }

    function build() {
      var W = trail.offsetWidth, H = trail.offsetHeight;
      if (!W || !H || !cards.length) return;
      var X0 = Math.round(parseFloat(getComputedStyle(trail).paddingLeft) / 2) || 28;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var last = cards[cards.length - 1];
      var turnY = topIn(last) + last.offsetHeight + 10;
      var xe = X0 + DROP_SHIFT, endY = H - DROP_H - 30;
      var d = 'M' + X0 + ',4', y = 4, i = 0;
      while (y < turnY - 1) {
        var ny = Math.min(turnY, y + 60), w = (seeded(++i) - 0.5) * 7;
        d += ' Q' + (X0 + w) + ',' + ((y + ny) / 2) + ' ' + (X0 + (seeded(i + 50) - 0.5) * 3) + ',' + ny;
        y = ny;
      }
      // a short S-bend that arrives vertically, so the stroke runs straight into the droplet's tip
      d += ' C' + X0 + ',' + (turnY + (endY - turnY) * 0.55) + ' ' + xe + ',' + (turnY + (endY - turnY) * 0.45) + ' ' + xe + ',' + endY;
      path.setAttribute('d', d);
      total = path.getTotalLength();
      path.style.strokeDasharray = total;
      ending.setAttribute('transform', 'translate(' + (xe - 0.4) + ',' + (endY - 2) + ')');
      while (nodesG.firstChild) nodesG.removeChild(nodesG.firstChild);
      marks = cards.map(function (c, k) {
        var cy = topIn(c) + 44, lo = 0, hi = total;
        for (var n = 0; n < 22; n++) { var m = (lo + hi) / 2; if (path.getPointAtLength(m).y < cy) lo = m; else hi = m; }
        var pt = path.getPointAtLength(lo);
        var g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'node');
        // alternate the spark: mirrored top-to-bottom and tilted a little, so it never looks stamped
        var flip = k % 2 ? -1 : 1, tilt = (seeded(k + 7) - 0.5) * 24;
        g.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ') rotate(' + tilt + ') scale(1,' + flip + ')');
        var sp = document.createElementNS(NS, 'use');
        sp.setAttribute('href', '#sparkShape');
        sp.setAttribute('class', 'spark');
        var dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('r', 0);
        g.appendChild(sp); g.appendChild(dot); nodesG.appendChild(g);
        return { len: lo, card: c, g: g, dot: dot };
      });
      update();
    }

    function showDrop(instant) {
      if (dropDone) return;
      dropDone = true;
      if (instant) {
        dropPen.style.strokeDasharray = 'none';
        dropFinish.setAttribute('opacity', 1);
        ending.classList.add('is-rays-on');
        return;
      }
      dropPen.style.strokeDasharray = penLen + ' ' + penLen;
      dropPen.animate([{ strokeDashoffset: penLen }, { strokeDashoffset: 0 }], { duration: 1100, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
      dropFinish.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 1100, fill: 'forwards' });
      setTimeout(function () { ending.classList.add('is-rays-on'); }, 1250);
    }

    function setMark(m, on) {
      m.card.classList.toggle('is-pending', !on);
      m.g.classList.toggle('is-on', on);
      m.dot.setAttribute('r', on ? 5 : 0);
    }

    function update() {
      if (reduce) {
        path.style.strokeDashoffset = 0;
        marks.forEach(function (m) { setMark(m, true); });
        showDrop(true);
        return;
      }
      var r = trail.getBoundingClientRect();
      var pen = innerHeight * 0.78 - r.top; // the pen sits ~3/4 down the screen
      var doc = document.documentElement;
      var atBottom = scrollY + innerHeight >= doc.scrollHeight - 4;
      // ease the pen down so it finishes by the time the page bottoms out
      var room = Math.max(1, doc.scrollHeight - innerHeight);
      var boost = Math.max(0, r.bottom - innerHeight * 0.78) * Math.pow(Math.min(1, scrollY / room), 6);
      var drawn = atBottom ? total : Math.max(0, Math.min(total, pen + boost));
      path.style.strokeDashoffset = total - drawn;
      marks.forEach(function (m) { setMark(m, drawn >= m.len); });
      if (drawn >= total - 1) showDrop(false);
    }

    if (!reduce) {
      cards.forEach(function (c) { if (c.getBoundingClientRect().top > innerHeight) c.classList.add('is-pending'); });
      dropPen.style.strokeDasharray = penLen + ' ' + penLen;
      dropPen.style.strokeDashoffset = penLen;
    }

    var queued = false;
    addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }, { passive: true });

    var lastW = 0, lastH = 0;
    function rebuildIfResized() {
      if (trail.offsetWidth === lastW && trail.offsetHeight === lastH) return;
      lastW = trail.offsetWidth; lastH = trail.offsetHeight;
      build();
    }
    if (window.ResizeObserver) new ResizeObserver(rebuildIfResized).observe(trail);
    else addEventListener('resize', rebuildIfResized);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    rebuildIfResized();
  }

  ready(function () {
    try { writeMasthead(); } catch (e) { root.classList.remove('is-writing'); }
    try { drawInkLine(); } catch (e) {
      root.classList.remove('has-ink');
      [].forEach.call(document.querySelectorAll('.app-row.is-pending'), function (c) { c.classList.remove('is-pending'); });
    }
  });
})();
