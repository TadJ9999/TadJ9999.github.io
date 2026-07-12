// ============================================================
// NIGHT FLIGHT v2 — motion layer, HUD telemetry, content render
// ============================================================
import { createScene } from './scene.js';
import { missions, experience, skillGroups, certs, education } from './data.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// GSAP owns reveals when motion is on — neutralize the CSS reveal hiding so
// gsap.from() doesn't read an already-hidden element as its end state.
if (!reducedMotion) document.documentElement.classList.add('js-motion');

// ---------- render content from data ----------
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content;
}

document.getElementById('xp-list').append(el(experience.map((x) => `
  <li class="xp-item">
    <div class="xp-top">
      <div><div class="xp-role">${x.role}</div><div class="xp-org">${x.org}</div></div>
      <div class="xp-dates">${x.dates}</div>
    </div>
    <ul>${x.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
  </li>`).join('')));

document.getElementById('mission-grid').append(el(missions.map((m) => {
  const active = /PRESENT$/.test(m.dates);
  return `
  <article class="mission${m.featured ? ' featured' : ''}" data-cat="${m.cat}">
    <div class="msn-scan"></div>
    <div class="msn-top">
      <span class="msn-code">${m.code}</span>
      <span class="msn-top-right">
        ${m.featured ? '<span class="msn-feat">FEATURED</span>' : ''}
        <span class="msn-status ${active ? 'active' : 'complete'}"><i class="dot"></i>${active ? 'ACTIVE' : 'COMPLETE'}</span>
      </span>
    </div>
    <h3 class="msn-title">${m.title}</h3>
    <div class="msn-meta">${m.dates} · ${m.org}</div>
    <p class="msn-desc">${m.desc}</p>
    <div class="msn-tags">${m.tags.map((t) => `<span>${t}</span>`).join('')}</div>
  </article>`;
}).join('')));

// ----- mission filters + staggered entrance -----
const grid = document.getElementById('mission-grid');
const cards = [...grid.querySelectorAll('.mission')];
const tracking = document.getElementById('msn-tracking');
const filterBar = document.getElementById('msn-filters');
const CATS = ['ALL', ...new Set(missions.map((m) => m.cat))];

function stagger(visibleCards) {
  visibleCards.forEach((c, i) => {
    c.classList.remove('in');
    void c.offsetWidth; // restart the entrance animation
    c.style.animationDelay = `${i * 70}ms`;
    c.classList.add('in');
  });
}

function applyFilter(cat) {
  const visible = [];
  for (const c of cards) {
    const show = cat === 'ALL' || c.dataset.cat === cat;
    c.classList.toggle('filtered-out', !show);
    if (show) visible.push(c);
  }
  tracking.textContent = `${visible.length} PROJECT${visible.length === 1 ? '' : 'S'}`;
  stagger(visible);
}

filterBar.append(el(CATS.map((c) => `<button type="button" data-cat="${c}"${c === 'ALL' ? ' class="active"' : ''}>${c}</button>`).join('')));
filterBar.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  filterBar.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
  applyFilter(btn.dataset.cat);
});

// first entrance when the grid scrolls into view
tracking.textContent = `${cards.length} PROJECTS`;
const gridObs = new IntersectionObserver((entries) => {
  if (!entries.some((en) => en.isIntersecting)) return;
  gridObs.disconnect();
  stagger(cards);
}, { threshold: 0.08 });
gridObs.observe(grid);

document.getElementById('skill-groups').append(el(skillGroups.map((g) => `
  <div class="skill-group">
    <h3>${g.name}</h3>
    <ul>${g.items.map((s) => `<li>${s}</li>`).join('')}</ul>
  </div>`).join('')));

document.getElementById('cert-grid').append(el(certs.map((c) => `
  <div class="cert">
    <span class="cert-kind">${c.kind}</span>
    <span class="cert-name">${c.name}</span>
    <span class="cert-issuer">ISSUER: ${c.issuer}</span>
  </div>`).join('')));

document.getElementById('edu-list').append(el(education.map((e) => `
  <li>
    <span class="edu-school">${e.school}</span>
    <span class="edu-detail">${e.detail}</span>
    <span class="edu-dates">${e.dates}</span>
  </li>`).join('')));

// heading tape content: two wraps of the compass rose so it can pan
const tape = document.getElementById('heading-tape');
const roseLabels = ['<b>N</b>', '03', '06', '<b>E</b>', '12', '15', '<b>S</b>', '21', '24', '<b>W</b>', '30', '33'];
tape.innerHTML = Array.from({ length: 36 }, (_, i) =>
  `<span>${i % 3 === 0 ? roseLabels[(i / 3) % 12] : '·'}</span>`).join('');

// ---------- 3D scene ----------
const canvas = document.getElementById('scene');
const sceneApi = createScene(canvas, { reducedMotion });
if (!sceneApi) document.body.classList.add('no-webgl');

window.addEventListener('mousemove', (e) => {
  if (!sceneApi) return;
  sceneApi.setMouse((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  sceneApi.setPointer(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
}, { passive: true });

// playful bank when you click a project card, nav dot, or CTA
function bankFromEvent(dir) { sceneApi?.bank(dir); }
grid.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.mission')) return;
  const left = e.clientX < window.innerWidth / 2;
  bankFromEvent(left ? 1 : -1);
});
document.querySelectorAll('#waynav a, .hero-cta a').forEach((a, i) => {
  a.addEventListener('pointerdown', () => bankFromEvent(i % 2 === 0 ? 1 : -1));
});

// ---------- Lenis smooth scroll, driven by GSAP ticker ----------
let lenis = null;
if (!reducedMotion) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1.0, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // route in-page anchors through Lenis for buttery jumps
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 3) });
    });
  });
}

// ---------- hero title assembly ----------
const heroTitle = document.querySelector('#hero h1');
if (heroTitle && !reducedMotion) {
  const text = heroTitle.textContent;
  heroTitle.setAttribute('aria-label', text.trim());
  heroTitle.innerHTML = [...text].map((ch) =>
    ch === ' ' ? '<span class="ltr-space">&nbsp;</span>'
               : `<span class="ltr" aria-hidden="true">${ch}</span>`).join('');
  const letters = heroTitle.querySelectorAll('.ltr');
  const delay = (sceneApi?.introDuration ?? 0) * 0.45;
  gsap.set('#hero .hero-inner', { opacity: 1 });   // container on; children animate in
  gsap.set(letters, { yPercent: 120, opacity: 0, filter: 'blur(14px)', rotateX: -80 });
  gsap.set('#hero .hero-pre, #hero .hero-roles, #hero .hero-type, #hero .hero-cta, #hero .scroll-hint',
    { opacity: 0, y: 24 });
  const tl = gsap.timeline({ delay: delay + 0.2 });
  tl.to(letters, {
    yPercent: 0, opacity: 1, filter: 'blur(0px)', rotateX: 0,
    duration: 1.1, ease: 'power4.out', stagger: 0.09,
  })
    .to('#hero .hero-pre', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.9')
    .to('#hero .hero-roles', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.6')
    .to('#hero .hero-type', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5')
    .to('#hero .hero-cta', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5')
    .to('#hero .scroll-hint', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');
}

// ---------- cinematic scroll choreography ----------
if (!reducedMotion) {
  // hero drifts up and dissolves as you leave it
  gsap.to('#hero .hero-inner', {
    yPercent: -18, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  // each panel rises + settles with a subtle parallax as it enters
  gsap.utils.toArray('main section:not(#hero) .panel').forEach((panel) => {
    gsap.from(panel, {
      y: 60, opacity: 0, ease: 'power3.out', duration: 1,
      scrollTrigger: { trigger: panel, start: 'top 82%', toggleActions: 'play none none reverse' },
    });
  });

  // Safety: if the tab loaded in the background, rAF (and thus GSAP/Lenis) is
  // throttled and reveals can stall mid-tween. Recompute triggers on focus and
  // after full load so everything resolves to its correct state.
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}

// ---------- reveal on scroll + stat counters ----------
const revealObs = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    en.target.classList.add('visible');
    en.target.querySelectorAll('.stat-v[data-count]').forEach(animateCount);
    revealObs.unobserve(en.target);
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((n) => revealObs.observe(n));

function animateCount(node) {
  if (node.dataset.done) return;
  node.dataset.done = '1';
  const target = parseInt(node.dataset.count, 10);
  if (reducedMotion) { node.textContent = target; return; }
  const t0 = performance.now();
  const dur = 1200;
  const step = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- section tracking: waynav + HUD waypoint ----------
const sections = [...document.querySelectorAll('main section')];
const navLinks = [...document.querySelectorAll('#waynav a')];
const wptValue = document.getElementById('wpt-value');
const WPT_NAMES = { hero: 'HOME', about: 'ABOUT', experience: 'EXPERIENCE', projects: 'PROJECTS', skills: 'SKILLS', certs: 'CERTIFICATIONS', contact: 'CONTACT' };

const sectionObs = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    const id = en.target.id;
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    const idx = sections.indexOf(en.target) + 1;
    wptValue.textContent = `${String(idx).padStart(2, '0')} // ${WPT_NAMES[id] ?? id.toUpperCase()}`;
  }
}, { threshold: 0.45 });
sections.forEach((s) => sectionObs.observe(s));

// ---------- scroll-driven HUD telemetry ----------
const altValue = document.getElementById('alt-value');
const TAPE_SEG = 60; // px per 10 degrees (span width)

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;

    // descend from FL350 to touchdown
    const alt = Math.max(0, Math.round((35000 * (1 - p)) / 10) * 10);
    altValue.textContent = alt.toLocaleString('en-US');

    // heading pans with scroll
    const hdg = (90 + p * 270) % 360;
    const tapeW = 36 * TAPE_SEG;
    const px = -((hdg / 360) * tapeW) + (tape.parentElement.clientWidth / 2) - TAPE_SEG / 2;
    tape.style.transform = `translateX(${px}px)`;

    sceneApi?.setScroll(p);
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
