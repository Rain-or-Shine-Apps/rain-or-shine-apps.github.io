/* Brickify homepage behaviour: More info panel and the smartphone-to-brick phone animation.
   The phone menu is shared by every page and lives in /assets/site.js. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- More info: open by default without JavaScript, folded away with it ---- */
  var more = document.getElementById('bk-more');
  var panel = document.getElementById('more');
  function setOpen(open, scroll) {
    panel.hidden = !open;
    more.setAttribute('aria-expanded', String(open));
    more.firstChild.nodeValue = open ? 'Less info ' : 'More info ';
    if (open && scroll) panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  // the element a "#id" hash points at, or null (never throws on odd hashes)
  function hashTarget(hash) {
    if (!hash || hash.length < 2 || hash === '#top') return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return null; }
  }
  function inPanel(hash) { var t = hashTarget(hash); return !!(t && panel.contains(t)); }
  if (more && panel) {
    setOpen(inPanel(location.hash), false);
    if (!panel.hidden) {
      // arriving on a link into the panel: jump there now, and again once images have settled the layout
      var t0 = hashTarget(location.hash);
      if (t0) {
        t0.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.addEventListener('load', function () { t0.scrollIntoView({ behavior: 'instant', block: 'start' }); }, { once: true });
      }
    }
    more.addEventListener('click', function () { setOpen(panel.hidden, true); });
    // links to anything inside the panel (e.g. "Get the app" -> #download) open it first,
    // before the browser follows the link
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (a && panel.hidden && inPanel(a.getAttribute('href'))) setOpen(true, false);
    });
    window.addEventListener('hashchange', function () {
      if (panel.hidden && inPanel(location.hash)) { setOpen(true, false); hashTarget(location.hash).scrollIntoView({ block: 'start' }); }
    });
  }

  /* ---- Hero diagonal: pink above, brick below, always running between the two headline halves ---- */
  var hero = document.querySelector('.bk-hero');
  var brickBg = hero && hero.querySelector('.bk-pink');
  var half1 = hero && hero.querySelector('.bk-line-1'), half2 = hero && hero.querySelector('.bk-line-2');
  function textBox(el) { var r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); }
  function fitDiagonal() {
    var h = hero.getBoundingClientRect(), W = h.width, H = h.height, m = 12;
    if (!W || !H) return;
    var a = textBox(half1), b = textBox(half2);
    var b1 = a.bottom - h.top, x1L = a.left - h.left;   // the line must pass below "Smartphone…" (worst at its left edge)
    var t2 = b.top - h.top, x2R = b.right - h.left;     // and above "…brick phone" (worst at its right edge)
    var dy = H * (W >= 900 ? 0.32 : 0.22);              // the designed slope, flattened only if it can't fit
    var room = t2 - b1 - 2 * m, span = Math.max(1, x2R - x1L);
    if (dy * span / W > room) dy = Math.max(0, room * W / span);
    var yL = ((b1 + m - dy * x1L / W) + (t2 - m - dy * x2R / W)) / 2;
    brickBg.style.clipPath = 'polygon(0 ' + yL.toFixed(1) + 'px,100% ' + (yL + dy).toFixed(1) + 'px,100% 100%,0 100%)';
  }
  if (hero && brickBg && half1 && half2) {
    fitDiagonal();
    if (window.ResizeObserver) new ResizeObserver(fitDiagonal).observe(hero);
    else window.addEventListener('resize', fitDiagonal);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitDiagonal);
  }

  /* ---- Phone animation ---- */
  var phone = document.getElementById('bk-phone');
  if (!phone) return;
  var chip = document.getElementById('bk-chip');
  var apps = phone.querySelector('.bk-apps');
  var dock = phone.querySelectorAll('.bk-dock i');
  var wall = phone.querySelector('.bk-wall');
  var appCols = ['#F4E8D6', '#FFD166', '#7F3F2D', '#ffffff', '#2E3A38', '#F7A8C4', '#1C7B77', '#D9733F',
                 '#ffffff', '#B65A3D', '#FFE3A3', '#C23C6F', '#8FD3CE', '#2E3A38', '#F4E8D6', '#E2558A'];
  appCols.forEach(function (c) { var i = document.createElement('i'); i.style.background = c; apps.appendChild(i); });
  ['#ffffff', '#FFD166', '#7F3F2D', '#1C7B77'].forEach(function (c, k) { dock[k].style.background = c; });

  function setChip(brick) {
    if (!chip) return;
    chip.innerHTML = brick ? '<b>8:30pm</b> Brick phone' : '<b>4:00pm</b> Smartphone';
    chip.classList.toggle('is-brick', brick);
  }
  if (reduce) { phone.classList.add('is-bricked'); setChip(true); return; }

  var ROWS = 13, shades = ['#C8623A', '#B5532F', '#D9733F', '#A94B2B', '#CF6A3B'];
  var bricks = [];
  for (var r = 0; r < ROWS; r++) {
    var row = document.createElement('div'); row.className = 'bk-row';
    for (var b = 0; b < 4; b++) {
      var el = document.createElement('div'); el.className = 'bk-brick';
      el.style.setProperty('--c', shades[(r * 3 + b) % shades.length]);
      row.appendChild(el); bricks.push({ el: el, row: r });
    }
    wall.appendChild(row);
  }
  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function build() {
    return Promise.all(bricks.map(function (b, i) {
      var fromBottom = ROWS - 1 - b.row;
      return b.el.animate([{ transform: 'translateY(-260%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
        { duration: 340, delay: fromBottom * 95 + (i % 4) * 30, easing: 'cubic-bezier(.3,1.35,.6,1)', fill: 'forwards' }).finished;
    }));
  }
  function tumble() {
    return Promise.all(bricks.map(function (b, i) {
      var dx = (Math.random() - .5) * 120, rot = (Math.random() - .5) * 70;
      return b.el.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 },
                           { transform: 'translate(' + dx + '%,' + (420 + Math.random() * 200) + '%) rotate(' + rot + 'deg)', opacity: 0 }],
        { duration: 620, delay: (b.row * 22) + Math.random() * 120, easing: 'cubic-bezier(.5,0,.9,.5)', fill: 'forwards' }).finished;
    }));
  }
  var running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });
  async function loop() {
    while (true) {
      phone.classList.remove('is-bricked'); setChip(false);
      await wait(2200);
      await build();
      phone.classList.add('is-bricked'); setChip(true);
      await wait(150);
      await tumble();
      await wait(3600);
      while (!running) await wait(500);
    }
  }
  loop();
})();
