/* Arat.dev — interactions port (pooryaai.me style) */
document.documentElement.classList.add('js');

const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;
if (window.Lenis && !prefersReduced) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  // anchor links via lenis
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const el = document.querySelector(id);
        if (el) {
          e.preventDefault();
          /* lenis only exists when motion is allowed; on a phone with reduced-motion the old code threw
             AFTER preventDefault, so tapping a menu item did nothing at all */
          const y = el.getBoundingClientRect().top + window.scrollY - 80;
          if (lenis) { try { lenis.scrollTo(el, { offset: -80 }); } catch (_) { window.scrollTo({ top: y, behavior: 'smooth' }); } }
          else { window.scrollTo({ top: y, behavior: 'smooth' }); }
          history.replaceState(null, '', id);
          closeMenu();
        }
      }
    });
  });
}
if (window.ScrollTrigger && lenis) {
  ScrollTrigger.scrollerProxy(document.body, {}); // not needed for lenis on body; keep default
}

/* ---------- preloader ---------- */
const loader = document.getElementById('loader');
const loaderCount = document.getElementById('loaderCount');

function heroIn() {
  document.body.classList.remove('is-loading');
  document.documentElement.classList.add('hero-done');
  document.querySelectorAll('.hero .line__in').forEach((el, i) => {
    setTimeout(() => el.classList.add('is-in'), 80 + i * 120);
  });
  document.querySelectorAll('.hero [data-reveal]').forEach((el, i) => {
    setTimeout(() => el.classList.add('is-in'), 300 + i * 90);
  });
  setTimeout(() => {
    document.querySelectorAll('.float-badge, .scroll-hint').forEach(el => el.style.opacity = 1);
  }, 900);
}

if (prefersReduced || !loader) {
  if (loader) loader.remove();
  document.body.classList.remove('is-loading');
  document.body.classList.add('reduced');
  document.querySelectorAll('.hero .line__in, .hero [data-reveal]').forEach(el => el.classList.add('is-in'));
} else {
  document.body.classList.add('is-loading');
  const ecgPath = document.querySelector('.loader__ecg path');
  const t0 = performance.now(), DUR = 1300;
  let done = false;
  function step(now) {
    const p = Math.min(1, (now - t0) / DUR);
    const ease = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    if (ecgPath) ecgPath.style.strokeDashoffset = 700 * (1 - ease);
    loaderCount.textContent = String(Math.round(ease * 100)).padStart(2, '0');
    if (p < 1) requestAnimationFrame(step);
    else if (!done) {
      done = true;
      loader.style.transition = 'clip-path 1s cubic-bezier(0.22,1,0.36,1)';
      loader.style.clipPath = 'inset(0 0 100% 0)';
      setTimeout(() => { loader.remove(); heroIn(); }, 350);
    }
  }
  requestAnimationFrame(step);
}

/* ---------- scroll reveals ---------- */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }
}, { rootMargin: '0px 0px -12% 0px' });

document.querySelectorAll('[data-reveal]:not(.hero [data-reveal]), [data-split] .line__in, .problem__title .w').forEach(el => io.observe(el));

// word-by-word for the problem title (CSS: .w opacity)
document.querySelectorAll('[data-words]').forEach(el => {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/ +/).map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
});
// re-observe generated words
document.querySelectorAll('.problem__title .w').forEach(el => io.observe(el));

/* ---------- scene state on scroll ---------- */
function sceneScroll() {
  if (!window.AratScene) return;
  const line = window.innerHeight * .55;
  let st = 'hero';
  document.querySelectorAll('section[data-scene]').forEach(sec => {
    if (sec.getBoundingClientRect().top <= line) st = sec.dataset.scene;
  });
  window.AratScene.setState(st);
}
window.addEventListener('scroll', sceneScroll, { passive: true });
sceneScroll();
let pulseTrack = 0;
const pulseIO = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting && Date.now() - pulseTrack > 900) { pulseTrack = Date.now(); window.AratScene?.pulse(); } });
}, { threshold: .4 });
document.querySelectorAll('.moment').forEach(m => pulseIO.observe(m));

/* ---------- nav ---------- */
const nav = document.getElementById('nav');
let lastY = 0;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 40);
  if (y > 500 && y > lastY + 4) nav.classList.add('is-hidden');
  else if (y < lastY - 4 || y < 120) nav.classList.remove('is-hidden');
  lastY = y;
  const doc = document.documentElement;
  const prog = y / (doc.scrollHeight - doc.clientHeight);
  document.getElementById('progress').style.transform = `scaleX(${prog})`;
  // active section links
  let active = null;
  document.querySelectorAll('main section[id]').forEach(s => {
    if (s.getBoundingClientRect().top <= window.innerHeight * 0.4) active = s.id;
  });
  document.querySelectorAll('.nav__links a').forEach(a => {
    a.classList.toggle('is-active', a.getAttribute('href') === '#' + active);
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- burger ---------- */
const burger = document.getElementById('burger');
const menu = document.getElementById('mobileMenu');
function closeMenu() { if (menu && !menu.hidden) { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); enableScroll(true); } }
function enableScroll(on) { if (lenis) on ? lenis.start() : lenis.stop(); else document.body.style.overflow = on ? '' : 'hidden'; }
burger.addEventListener('click', () => {
  const open = menu.hidden;
  menu.hidden = !open;
  burger.setAttribute('aria-expanded', String(open));
  enableScroll(!open);
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));

/* ---------- counters ---------- */
const cio = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target, target = Number(el.dataset.count);
    cio.unobserve(el);
    if (prefersReduced) { el.textContent = target; continue; }
    const t0 = performance.now(), D = 1600;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / D);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(ease * target);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
}, { rootMargin: '0px 0px -15% 0px' });
document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

/* ---------- timeline (pinned on desktop) ---------- */
const pin = document.querySelector('.timeline');
const pinInner = document.querySelector('.timeline__pin');
const moments = [...document.querySelectorAll('.moment')];
const clockTime = document.getElementById('clockTime');
const clockBar = document.getElementById('clockBar');
const stopTimes = [0, .38, .72]; // Day 01 / 07 / 30
let curMoment = 0;

function setActive(i) {
  if (i !== curMoment) {
    curMoment = i;
    moments.forEach((m, n) => m.classList.toggle('is-active', n === i));
  }
}
function fmtDay(p) {
  const day = 1 + Math.round(p * 29 * (p < 1 ? p : 1)); // روز ۰۱ → ۳۰
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const n = String(Math.max(1, day)).padStart(2, '0').replace(/\d/g, d => fa[+d]);
  return 'روز ' + n;
}

function timelineScroll() {
  if (!pin || window.innerWidth <= 860 || prefersReduced) return;
  const rect = pin.getBoundingClientRect();
  const total = pinInner.offsetHeight + window.innerHeight; // approximate pin distance
  const start = rect.top + window.scrollY;
  const dist = Math.max(1, pin.offsetHeight - window.innerHeight) || 1;
  /* the real pin distance is dist (section height - viewport); dividing by pin.offsetHeight * 2.2
     capped progress at ~0.31, so the clock froze around «روز ۵» and only moment #1 ever activated */
  const p = Math.min(1, Math.max(0, (window.scrollY - start) / dist));
  setActive(Math.min(2, Math.floor(p * 3)));
  clockTime.textContent = fmtDay(p);
  clockBar.style.transform = `scaleX(${.05 + p * .95})`;
}
// make pin distance real via a spacer
if (pin && window.innerWidth > 860 && !prefersReduced) {
  pin.style.height = '320vh';
  pinInner.style.position = 'sticky';
  pinInner.style.top = '0';
  pinInner.style.minHeight = '100vh';
  window.addEventListener('scroll', timelineScroll, { passive: true });
  timelineScroll();
}

/* ---------- tilt / shine / magnetic ---------- */
function bindTilt(el, max = 6) {
  el.addEventListener('pointermove', (e) => {
    if (prefersReduced) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', (px * 100) + '%');
    el.style.setProperty('--my', (py * 100) + '%');
    el.style.transform = `rotateY(${(px - .5) * max * 2}deg) rotateX(${(py - .5) * -max * 2}deg)`;
    const inner = el.closest('.hero__card-wrap');
    if (inner) {
      inner.style.transform = `rotateY(${(px - .5) * 8}deg) rotateX(${(py - .5) * -8}deg)`;
    }
  });
  el.addEventListener('pointerleave', () => {
    el.style.transform = '';
    const inner = el.closest('.hero__card-wrap');
    if (inner) inner.style.transform = '';
  });
}
const shiftCard = document.getElementById('shiftCard');
if (shiftCard) {
  shiftCard.style.transformStyle = 'preserve-3d';
  bindTilt(shiftCard, 5);
  document.querySelectorAll('.card[data-tilt]').forEach(c => bindTilt(c, 4));
}

// custom cursor
const cursor = document.getElementById('cursor');
if (cursor && matchMedia('(pointer:fine)').matches) {
  let cx = 0, cy = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', e => {
    tx = e.clientX; ty = e.clientY;
    cursor.classList.add('is-visible');
    const t = e.target.closest('a, button, summary, .card');
    cursor.classList.toggle('is-hover', !!t);
  });
  (function loop() {
    cx += (tx - cx) * .2; cy += (ty - cy) * .2;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  })();
}
