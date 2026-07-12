// ============================================================
// NIGHT FLIGHT v2 — cinematic wireframe canyon flyover
// Intro hyperspace fly-in · cursor-reactive glow · scroll-flown camera
// Custom GLSL displacement terrain + streaking stars + moon + beacons + bloom
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- Ashima 2D simplex noise (public domain / MIT) ---
const SIMPLEX_2D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+10.0)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

// Terrain vertex: displaced plane + passes world position and a mouse-glow factor
const TERRAIN_VERT = /* glsl */ `
uniform float uScroll;
uniform vec2  uMouse;      // world-space cursor on the terrain plane
uniform float uMouseAmp;   // 0..1 strength of cursor influence
varying float vElev;
varying float vDist;
varying float vGlow;
${SIMPLEX_2D}
void main() {
  vec3 pos = position;
  vec2 world = vec2(pos.x, pos.y + uScroll);
  float freq = 0.016;
  float n = snoise(world * freq) * 0.72
          + snoise(world * freq * 2.7) * 0.21
          + snoise(world * freq * 6.1) * 0.07;
  float wall = smoothstep(14.0, 110.0, abs(pos.x));
  float elev = n * 29.0 * (0.18 + 0.82 * wall) + wall * 9.0;

  // cursor ripple: a soft bump that lifts the terrain toward the pointer
  float md = distance(vec2(pos.x, pos.y), uMouse);
  float ripple = exp(-md * md / 1100.0) * uMouseAmp;
  elev += ripple * 5.0;
  vGlow = ripple;

  pos.z += elev;
  vElev = elev;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const TERRAIN_FRAG_WIRE = /* glsl */ `
uniform vec3 uColLow;
uniform vec3 uColHigh;
uniform vec3 uColGlow;
varying float vElev;
varying float vDist;
varying float vGlow;
void main() {
  float h = clamp(vElev / 42.0, 0.0, 1.0);
  vec3 col = mix(uColLow, uColHigh, h);
  col = mix(col, uColGlow, clamp(vGlow * 0.6, 0.0, 1.0));
  float fade = 1.0 - smoothstep(260.0, 560.0, vDist);
  gl_FragColor = vec4(col, fade * (0.85 + vGlow * 0.35));
}
`;

const TERRAIN_FRAG_SOLID = /* glsl */ `
varying float vElev;
varying float vDist;
varying float vGlow;
void main() {
  float fade = 1.0 - smoothstep(260.0, 560.0, vDist);
  vec3 base = vec3(0.008, 0.02, 0.045) + vGlow * vec3(0.05, 0.12, 0.16);
  gl_FragColor = vec4(base, fade);
}
`;

// Stars: point sprites that elongate into warp streaks during the intro
const STAR_VERT = /* glsl */ `
attribute float aPhase;
attribute float aSize;
uniform float uTime;
uniform float uStreak;   // 0 = dots, 1 = full hyperspace streak
varying float vTwinkle;
void main() {
  vTwinkle = 0.55 + 0.45 * sin(uTime * 1.4 + aPhase);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (300.0 / -mv.z) * (1.0 + uStreak * 3.0);
  gl_Position = projectionMatrix * mv;
}
`;

const STAR_FRAG = /* glsl */ `
uniform float uStreak;
varying float vTwinkle;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  // squash vertically so the round dot becomes a vertical streak under warp
  c.y /= (1.0 + uStreak * 7.0);
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d) * vTwinkle;
  vec3 col = mix(vec3(0.78, 0.92, 1.0), vec3(0.75, 0.86, 1.0), uStreak);
  gl_FragColor = vec4(col, a * (1.0 - uStreak * 0.15));
}
`;

// easing helpers
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));

export function createScene(canvas, { reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }

  const isMobile = window.innerWidth < 768;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x01030a);
  scene.fog = new THREE.FogExp2(0x01030a, 0.0016);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1400);
  const REST_POS = new THREE.Vector3(0, 33, 46);
  camera.position.copy(REST_POS);

  // --- terrain: solid underlay + glowing wireframe ---
  const segX = isMobile ? 90 : 140;
  const segY = isMobile ? 130 : 200;
  const geo = new THREE.PlaneGeometry(460, 640, segX, segY);

  const uniforms = {
    uScroll: { value: 0 },
    uMouse: { value: new THREE.Vector2(9999, 9999) },
    uMouseAmp: { value: 0 },
    uColLow: { value: new THREE.Color(0x0d3350) },
    uColHigh: { value: new THREE.Color(0x35e0ff) },
    uColGlow: { value: new THREE.Color(0xffb454) },
  };

  const solidMat = new THREE.ShaderMaterial({
    vertexShader: TERRAIN_VERT, fragmentShader: TERRAIN_FRAG_SOLID, uniforms,
    transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const wireMat = new THREE.ShaderMaterial({
    vertexShader: TERRAIN_VERT, fragmentShader: TERRAIN_FRAG_WIRE, uniforms,
    wireframe: true, transparent: true,
  });

  const terrainSolid = new THREE.Mesh(geo, solidMat);
  const terrainWire = new THREE.Mesh(geo, wireMat);
  for (const m of [terrainSolid, terrainWire]) {
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 0, -250);
    scene.add(m);
  }

  // --- stars ---
  const STAR_COUNT = isMobile ? 700 : 1500;
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starPhase = new Float32Array(STAR_COUNT);
  const starSize = new Float32Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    const r = 500 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.48;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi) * 0.6 + 20;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 200;
    starPhase[i] = Math.random() * Math.PI * 2;
    starSize[i] = 1.2 + Math.random() * 2.2;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhase, 1));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
  const starUniforms = { uTime: { value: 0 }, uStreak: { value: 1 } };
  const starMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, uniforms: starUniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // --- moon glow sprite ---
  const glowTexture = (stops) => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d').createRadialGradient(128, 128, 6, 128, 128, 128);
    for (const [o, col] of stops) g.addColorStop(o, col);
    const cx = c.getContext('2d'); cx.fillStyle = g; cx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  };
  const moonTex = glowTexture([
    [0, 'rgba(220, 245, 255, 1)'], [0.25, 'rgba(150, 220, 250, 0.55)'],
    [0.6, 'rgba(80, 170, 220, 0.14)'], [1, 'rgba(60, 140, 200, 0)'],
  ]);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false }));
  moon.scale.set(140, 140, 1);
  moon.position.set(-380, 265, -650);
  scene.add(moon);

  // --- cursor glow: an additive sprite that chases the pointer in world space ---
  const cursorTex = glowTexture([
    [0, 'rgba(120, 230, 255, 0.9)'], [0.35, 'rgba(70, 190, 255, 0.28)'], [1, 'rgba(50, 150, 220, 0)'],
  ]);
  const cursorGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: cursorTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
  }));
  cursorGlow.scale.set(38, 38, 1);
  scene.add(cursorGlow);

  // --- waypoint beacons flying past ---
  const BEACONS = 7;
  const SPACING = 100;
  const beaconGeo = new THREE.OctahedronGeometry(2.2);
  const beacons = [];
  for (let i = 0; i < BEACONS; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xffb454 : 0x35e0ff, wireframe: true });
    const b = new THREE.Mesh(beaconGeo, mat);
    b.position.set((i % 2 === 0 ? 1 : -1) * (18 + (i % 3) * 5), 8 + (i % 3) * 3, -60 - i * SPACING);
    scene.add(b);
    beacons.push(b);
  }

  // --- post-processing bloom ---
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.85, 0.65, 0.12);
  composer.addPass(bloom);

  // --- state driven from main.js ---
  let scrollProgress = 0;
  let mouseX = 0, mouseY = 0;
  let mousePx = 0.5, mousePy = 0.5;   // normalized 0..1 screen for cursor glow
  let bankImpulse = 0;                 // transient bank from clicks
  const SPEED = reducedMotion ? 0 : 34;

  // intro timeline (skipped under reduced motion)
  let introT = reducedMotion ? 1 : 0;
  const INTRO_DUR = 2.6;

  const clock = new THREE.Clock();
  let disposed = false;
  const sizeProbe = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  function frame() {
    if (disposed) return;
    requestAnimationFrame(frame);

    renderer.getSize(sizeProbe);
    if ((sizeProbe.x !== window.innerWidth || sizeProbe.y !== window.innerHeight) && window.innerWidth > 0) onResize();

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // advance intro
    if (introT < 1) introT = Math.min(1, introT + dt / INTRO_DUR);
    const intro = easeOutCubic(introT);
    starUniforms.uStreak.value = (1 - intro) * (1 - intro);       // warp fades fast
    bloom.strength = 0.85 + (1 - intro) * 1.4;                    // extra bloom during warp

    uniforms.uScroll.value += SPEED * dt * (1 + (1 - intro) * 6); // terrain rushes at start
    starUniforms.uTime.value = t;

    // beacons stream toward the camera
    for (const b of beacons) {
      b.position.z += SPEED * dt * (1 + (1 - intro) * 4);
      b.rotation.y += dt * 1.2; b.rotation.x += dt * 0.6;
      if (b.position.z > 40) b.position.z -= BEACONS * SPACING;
    }

    // cursor glow: unproject pointer onto the ground plane, chase it
    ndc.set(mousePx * 2 - 1, -(mousePy * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
      cursorGlow.position.lerp(hitPoint.clone().setY(6), 0.12);
      // feed cursor world XY into the terrain (accounting for scroll offset)
      uniforms.uMouse.value.set(hitPoint.x, hitPoint.z + 250 - uniforms.uScroll.value);
    }
    const wantAmp = reducedMotion ? 0 : 1;
    uniforms.uMouseAmp.value = damp(uniforms.uMouseAmp.value, wantAmp, 3, dt);
    cursorGlow.material.opacity = damp(cursorGlow.material.opacity, intro * 0.28, 4, dt);

    // ---- camera choreography ----
    // intro fly-in: start high, far back, banked; settle to rest
    const introPos = new THREE.Vector3(0, 96, 150);
    const restY = 33 - scrollProgress * 18;                 // descend as you scroll
    const baseX = Math.sin(scrollProgress * Math.PI * 2.0) * 10; // gentle S-curve flight path
    const targetPos = new THREE.Vector3(baseX, restY, 46);
    camera.position.lerpVectors(introPos, targetPos, intro);
    // once settled, keep easing toward the live target (scroll can change it after intro)
    if (introT >= 1) {
      camera.position.x = damp(camera.position.x, targetPos.x, 3, dt);
      camera.position.y = damp(camera.position.y, targetPos.y, 3, dt);
    }

    bankImpulse = damp(bankImpulse, 0, 4, dt);

    // banking: mouse + scroll S-curve + click impulse; nose down as we descend
    const pathBank = Math.cos(scrollProgress * Math.PI * 2.0) * 0.10;
    const targetRoll = (-mouseX * 0.05 + pathBank + bankImpulse) * intro;
    const targetYaw = (-mouseX * 0.05 - baseX * 0.004) * intro;
    const targetPitch = (0.14 - scrollProgress * 0.2 - mouseY * 0.035) * intro + (1 - intro) * 0.25;
    camera.rotation.z = damp(camera.rotation.z, targetRoll, 4, dt);
    camera.rotation.y = damp(camera.rotation.y, targetYaw, 4, dt);
    camera.rotation.x = damp(camera.rotation.x, targetPitch, 4, dt);

    composer.render();
  }
  frame();

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h); composer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  return {
    setScroll(p) { scrollProgress = p; },
    setMouse(x, y) { mouseX = x; mouseY = y; },
    setPointer(px, py) { mousePx = px; mousePy = py; },
    bank(dir = 1) { bankImpulse = 0.28 * dir; },   // playful click response
    introDuration: reducedMotion ? 0 : INTRO_DUR,
    dispose() {
      disposed = true;
      window.removeEventListener('resize', onResize);
      renderer.dispose(); geo.dispose(); starGeo.dispose(); beaconGeo.dispose();
    },
  };
}
