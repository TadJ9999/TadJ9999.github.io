// ============================================================
// NIGHT FLIGHT scene — wireframe canyon flyover
// Custom GLSL displacement terrain + stars + moon + beacons + bloom
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

const TERRAIN_VERT = /* glsl */ `
uniform float uScroll;
varying float vElev;
varying float vDist;
${SIMPLEX_2D}
void main() {
  vec3 pos = position;
  // plane is built in XY then rotated; here Y maps to world -Z (depth)
  vec2 world = vec2(pos.x, pos.y + uScroll);
  float freq = 0.016;
  float n = snoise(world * freq) * 0.72
          + snoise(world * freq * 2.7) * 0.21
          + snoise(world * freq * 6.1) * 0.07;
  // flight corridor: flatten the center, raise canyon walls at the sides
  float wall = smoothstep(14.0, 110.0, abs(pos.x));
  float elev = n * 29.0 * (0.18 + 0.82 * wall) + wall * 9.0;
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
varying float vElev;
varying float vDist;
void main() {
  float h = clamp(vElev / 42.0, 0.0, 1.0);
  vec3 col = mix(uColLow, uColHigh, h);
  float fade = 1.0 - smoothstep(260.0, 560.0, vDist);
  gl_FragColor = vec4(col, fade * 0.85);
}
`;

const TERRAIN_FRAG_SOLID = /* glsl */ `
varying float vElev;
varying float vDist;
void main() {
  float fade = 1.0 - smoothstep(260.0, 560.0, vDist);
  gl_FragColor = vec4(vec3(0.008, 0.02, 0.045), fade);
}
`;

const STAR_VERT = /* glsl */ `
attribute float aPhase;
attribute float aSize;
uniform float uTime;
varying float vTwinkle;
void main() {
  vTwinkle = 0.55 + 0.45 * sin(uTime * 1.4 + aPhase);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (300.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

const STAR_FRAG = /* glsl */ `
varying float vTwinkle;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d) * vTwinkle;
  gl_FragColor = vec4(0.78, 0.92, 1.0, a);
}
`;

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

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1400);
  camera.position.set(0, 33, 46);

  // --- terrain: solid black underlay + glowing wireframe on top ---
  const segX = isMobile ? 90 : 140;
  const segY = isMobile ? 130 : 200;
  const geo = new THREE.PlaneGeometry(460, 640, segX, segY);

  const uniforms = {
    uScroll: { value: 0 },
    uColLow: { value: new THREE.Color(0x0d3350) },
    uColHigh: { value: new THREE.Color(0x35e0ff) },
  };

  const solidMat = new THREE.ShaderMaterial({
    vertexShader: TERRAIN_VERT,
    fragmentShader: TERRAIN_FRAG_SOLID,
    uniforms,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const wireMat = new THREE.ShaderMaterial({
    vertexShader: TERRAIN_VERT,
    fragmentShader: TERRAIN_FRAG_WIRE,
    uniforms,
    wireframe: true,
    transparent: true,
  });

  const terrainSolid = new THREE.Mesh(geo, solidMat);
  const terrainWire = new THREE.Mesh(geo, wireMat);
  for (const m of [terrainSolid, terrainWire]) {
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 0, -250);
    scene.add(m);
  }

  // --- stars ---
  const STAR_COUNT = isMobile ? 700 : 1400;
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starPhase = new Float32Array(STAR_COUNT);
  const starSize = new Float32Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    // dome above the horizon
    const r = 500 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.48; // keep above horizon
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
  const starUniforms = { uTime: { value: 0 } };
  const starMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: starUniforms,
    transparent: true,
    depthWrite: false,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // --- moon: soft glowing disc sprite ---
  const moonCanvas = document.createElement('canvas');
  moonCanvas.width = moonCanvas.height = 256;
  const mctx = moonCanvas.getContext('2d');
  const grad = mctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, 'rgba(220, 245, 255, 1)');
  grad.addColorStop(0.25, 'rgba(150, 220, 250, 0.55)');
  grad.addColorStop(0.6, 'rgba(80, 170, 220, 0.14)');
  grad.addColorStop(1, 'rgba(60, 140, 200, 0)');
  mctx.fillStyle = grad;
  mctx.fillRect(0, 0, 256, 256);
  const moonTex = new THREE.CanvasTexture(moonCanvas);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false }));
  moon.scale.set(140, 140, 1);
  moon.position.set(-380, 265, -650);
  scene.add(moon);

  // --- waypoint beacons flying past ---
  const BEACONS = 6;
  const SPACING = 110;
  const beaconGeo = new THREE.OctahedronGeometry(2.2);
  const beacons = [];
  for (let i = 0; i < BEACONS; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xffb454 : 0x35e0ff, wireframe: true });
    const b = new THREE.Mesh(beaconGeo, mat);
    b.position.set((i % 2 === 0 ? 1 : -1) * (18 + (i % 3) * 5), 8 + (i % 3) * 3, -60 - i * SPACING);
    scene.add(b);
    beacons.push(b);
  }

  // --- post-processing: bloom makes the wireframe glow ---
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.85, 0.65, 0.12
  );
  composer.addPass(bloom);

  // --- state driven from main.js ---
  let scrollProgress = 0; // 0 at hero, 1 at contact
  let mouseX = 0, mouseY = 0;
  let targetRoll = 0, targetPitch = 0, targetYaw = 0;

  const SPEED = reducedMotion ? 0 : 34; // world units / sec
  const clock = new THREE.Clock();
  let disposed = false;
  const sizeProbe = new THREE.Vector2();

  function frame() {
    if (disposed) return;
    requestAnimationFrame(frame);

    // self-heal: the page can load in a hidden/zero-size pane where no
    // resize event ever fires — sync renderer size to the window each frame
    renderer.getSize(sizeProbe);
    if ((sizeProbe.x !== window.innerWidth || sizeProbe.y !== window.innerHeight) && window.innerWidth > 0) {
      onResize();
    }

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    uniforms.uScroll.value += SPEED * dt;
    starUniforms.uTime.value = t;

    // beacons fly toward the camera and loop
    for (const b of beacons) {
      b.position.z += SPEED * dt;
      b.rotation.y += dt * 1.2;
      b.rotation.x += dt * 0.6;
      if (b.position.z > 40) b.position.z -= BEACONS * SPACING;
    }

    // descend as the page scrolls: 33 -> 15
    const targetY = 33 - scrollProgress * 18;
    camera.position.y += (targetY - camera.position.y) * 0.06;

    // mouse parallax = gentle banking; nose-up at the top of the page,
    // pitching down as the descent progresses
    targetRoll = -mouseX * 0.045;
    targetYaw = -mouseX * 0.05;
    targetPitch = 0.14 - scrollProgress * 0.2 - mouseY * 0.035;
    camera.rotation.z += (targetRoll - camera.rotation.z) * 0.04;
    camera.rotation.y += (targetYaw - camera.rotation.y) * 0.04;
    camera.rotation.x += (targetPitch - camera.rotation.x) * 0.04;

    composer.render();
  }
  frame();

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  return {
    setScroll(p) { scrollProgress = p; },
    setMouse(x, y) { mouseX = x; mouseY = y; },
    dispose() {
      disposed = true;
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geo.dispose();
      starGeo.dispose();
      beaconGeo.dispose();
    },
  };
}
