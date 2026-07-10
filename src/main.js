// ============================================================
// NIGHT FLIGHT — boot sequence, HUD telemetry, content render
// ============================================================
import { createScene } from './scene.js';
import { missions, experience, skillGroups, certs, education, typeLines } from './data.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  <article class="mission" data-cat="${m.cat}">
    <div class="msn-scan"></div>
    <div class="msn-top">
      <span class="msn-code">${m.code}</span>
      <span class="msn-top-right">
        ${m.featured ? '<span class="msn-feat">FEATURED</span>' : ''}
        <span class="msn-status ${active ? 'active' : 'complete'}"><i class="dot"></i>${active ? 'ACTIVE' : 'COMPLETE'}</span>
      </span>
    </div>
    <h3 class="msn-title" data-title="${m.title}">${m.title}</h3>
    <div class="msn-meta">${m.dates} · ${m.org}</div>
    <p class="msn-desc">${m.desc}</p>
    <div class="msn-tags">${m.tags.map((t) => `<span>${t}</span>`).join('')}</div>
  </article>`;
}).join('')));

// ----- mission filters + radar-contact entrance + decrypt hover -----
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
  tracking.textContent = `TRACKING: ${visible.length} CONTACT${visible.length === 1 ? '' : 'S'}`;
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
tracking.textContent = `TRACKING: ${cards.length} CONTACTS`;
const gridObs = new IntersectionObserver((entries) => {
  if (!entries.some((en) => en.isIntersecting)) return;
  gridObs.disconnect();
  stagger(cards);
}, { threshold: 0.08 });
gridObs.observe(grid);

// decrypt scramble on hover
const GLYPHS = '!<>-_\\/[]{}=+*^?#01';
grid.addEventListener('mouseover', (e) => {
  if (reducedMotion) return;
  const card = e.target.closest?.('.mission');
  if (!card || card.dataset.decrypting) return;
  if (card.contains(e.relatedTarget)) return; // only on real card entry
  const title = card.querySelector('.msn-title');
  const original = title.dataset.title;
  card.dataset.decrypting = '1';
  let step = 0;
  const total = Math.max(10, original.length + 4);
  const iv = setInterval(() => {
    step++;
    const solved = Math.floor((step / total) * original.length);
    title.textContent = original.slice(0, solved) +
      [...original.slice(solved)].map((ch) => (ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
    if (step >= total) {
      clearInterval(iv);
      title.textContent = original;
      delete card.dataset.decrypting;
    }
  }, 28);
}, true);

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

// radar blips (decorative)
const blips = document.getElementById('radar-blips');
for (let i = 0; i < 7; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 20 + Math.random() * 70;
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', (100 + Math.cos(a) * r).toFixed(1));
  c.setAttribute('cy', (100 + Math.sin(a) * r).toFixed(1));
  c.setAttribute('r', '2.4');
  c.style.animationDelay = `${(a / (Math.PI * 2)) * 4}s`;
  blips.appendChild(c);
}

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
}, { passive: true });

// ---------- hero terminal typing ----------
const typeEl = document.getElementById('typeline');
let typingStarted = false;
function startTyping() {
  if (typingStarted || reducedMotion) {
    if (reducedMotion) typeEl.textContent = typeLines[0];
    return;
  }
  typingStarted = true;
  let line = 0, ch = 0, deleting = false;
  const tick = () => {
    const text = typeLines[line];
    if (!deleting) {
      typeEl.textContent = text.slice(0, ++ch);
      if (ch === text.length) { deleting = true; setTimeout(tick, 2400); return; }
      setTimeout(tick, 34 + Math.random() * 40);
    } else {
      typeEl.textContent = text.slice(0, --ch);
      if (ch === 0) { deleting = false; line = (line + 1) % typeLines.length; setTimeout(tick, 420); return; }
      setTimeout(tick, 14);
    }
  };
  tick();
}

// ---------- boot sequence ----------
const BOOT_LINES = [
  ['TADW FLIGHT SYSTEMS // AVIONICS BOOT v2.6', 'info'],
  ['> POWER BUS ..................... OK', ''],
  ['> IMU CALIBRATION ............... OK', ''],
  ['> NAV DATABASE .................. 12 MISSIONS LOADED', ''],
  ['> COMMS ......................... LINKEDIN / GITHUB ONLINE', ''],
  ['> SECURE ENCLAVE ................ VERIFIED', ''],
  ['> THREAT SCAN ................... 0 CONTACTS', ''],
  ['> CLEARANCE ..................... GRANTED', 'warn'],
  ['', ''],
  ['CLEARED FOR TAKEOFF', 'info'],
];

const boot = document.getElementById('boot');
const bootPre = document.getElementById('boot-lines');
let bootDone = false;

function finishBoot() {
  if (bootDone) return;
  bootDone = true;
  boot.classList.add('done');
  sessionStorage.setItem('tadw-booted', '1');
  startTyping();
}

if (reducedMotion || sessionStorage.getItem('tadw-booted')) {
  finishBoot();
} else {
  let li = 0;
  const nextLine = () => {
    if (bootDone) return;
    if (li >= BOOT_LINES.length) { setTimeout(finishBoot, 650); return; }
    const [text, cls] = BOOT_LINES[li++];
    const span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = text + '\n';
    bootPre.appendChild(span);
    setTimeout(nextLine, li === BOOT_LINES.length ? 500 : 130 + Math.random() * 140);
  };
  setTimeout(nextLine, 350);
  window.addEventListener('keydown', finishBoot, { once: true });
  boot.addEventListener('click', finishBoot, { once: true });
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
const WPT_NAMES = { hero: 'SPLASH', about: 'FLIGHT PLAN', experience: 'FLIGHT LOG', projects: 'MISSIONS', skills: 'LOADOUT', certs: 'RATINGS', contact: 'COMMS' };

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
const footTelemetry = document.getElementById('foot-telemetry');
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

    footTelemetry.textContent = `HDG ${String(Math.round(hdg)).padStart(3, '0')} · GS ${Math.round(320 + p * 120)}`;

    sceneApi?.setScroll(p);
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
