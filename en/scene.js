/* Arat.dev — ambient WebGL scene (pooryaai.style) */
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const canvas = document.getElementById('scene');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = matchMedia('(max-width: 860px)').matches || matchMedia('(pointer: coarse)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, powerPreference: 'high-performance' });
} catch { fallback(); throw new Error('no webgl'); }

function fallback() { document.documentElement.classList.add('no-webgl'); canvas.remove(); }

renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall ? 1.5 : 1.75));
renderer.setClearColor(0x050d0c, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;

const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
camera.position.set(0, 0, 9);

/* lights — aqua key accents + warm coral, like the source */
scene.add(new THREE.DirectionalLight(0xbfeee2, 1.2).translateX(-3).translateY(4).translateZ(5));
const aquaLight = new THREE.PointLight(0x2fd8bd, 14, 0, 2); aquaLight.position.set(-4, 3, 4); scene.add(aquaLight);
const coralLight = new THREE.PointLight(0xff7a6b, 0, 0, 2); coralLight.position.set(4, -2, -3); scene.add(coralLight);
scene.add(new THREE.AmbientLight(0x1d3d4a, .8));

/* ---------- central chrome rig (abstract machine) ---------- */
const world = new THREE.Group(); scene.add(world);
const rig = new THREE.Group(); rig.scale.setScalar(.9); world.add(rig);

const mats = {
  chrome: new THREE.MeshStandardMaterial({ color: 0xe6e9ef, metalness: 1, roughness: .16 }),
  satin:  new THREE.MeshStandardMaterial({ color: 0xb9c9c9, metalness: 1, roughness: .36 }),
  tube:   new THREE.MeshStandardMaterial({ color: 0x0e8f7d, metalness: 0, roughness: .3 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x0c1a28, roughness: .55, clearcoat: .4 }),
};

function tubeThrough(pts, radius, mat, seg = 64) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, isSmall ? 10 : 14, false), mat);
}

/* symmetric chrome arcs + tubes — an abstract "signal machine" */
for (const s of [-1, 1]) {
  rig.add(tubeThrough([[.4*s, 1.98, .3], [.52*s, 1.86, .18], [.64*s, 1.58, .06], [.68*s, 1.22, 0]], .032, mats.chrome, 48));
  rig.add(tubeThrough([[.68*s, 1.22, 0], [.68*s, .86, 0], [.5*s, .44, .02], [.18*s, .14, .02], [0, .04, 0]], .058, mats.tube, 64));
  const pad = new THREE.Mesh(new THREE.CapsuleGeometry(.066, .066, 4, 20), mats.satin);
  pad.position.set(.68*s, 1.2, 0); rig.add(pad);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.088, 24, 16), mats.rubber);
  knob.scale.set(1, .78, 1); knob.position.set(.38*s, 2, .32); knob.rotation.z = s * .6; rig.add(knob);
}
rig.add(tubeThrough([[-.636, 1.6, .05], [0, 1.47, .07], [.636, 1.6, .05]], .015, mats.satin, 24));
const core = new THREE.Mesh(new THREE.SphereGeometry(.1, 24, 16), mats.satin);
core.scale.set(1.15, .9, .9); core.position.y = .02; rig.add(core);

/* ---------- dial / gauge assembly ---------- */
const dial = new THREE.Group(); rig.add(dial);
const ringPts = [[0, -.075], [.4, -.075], [.445, -.055], [.46, -.01], [.45, .04], [.4, .075], [.27, .1], [.22, .14], [.235, .2], [.25, .24], [.2, .27], [0, .275]]
  .map(([x, y]) => new THREE.Vector2(x, y));
const ring = new THREE.Mesh(new THREE.LatheGeometry(ringPts, isSmall ? 48 : 72), mats.chrome);
ring.rotation.x = -Math.PI / 2; dial.add(ring);
const face = new THREE.Mesh(new THREE.CircleGeometry(.4, 64),
  new THREE.MeshStandardMaterial({ color: 0x7cf5d4, roughness: .2, metalness: .3, clearcoat: 1 }));
face.position.z = .078; dial.add(face);
const faceRing = new THREE.Mesh(new THREE.TorusGeometry(.415, .013, 12, 96),
  new THREE.MeshBasicMaterial({ color: 0x7cf5d4, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
faceRing.position.z = .08; dial.add(faceRing);
for (const r of [.28, .16]) {
  const t = new THREE.Mesh(new THREE.TorusGeometry(r, .004, 6, 72),
    new THREE.MeshBasicMaterial({ color: 0x7cf5d4, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  t.position.z = .082; dial.add(t);
}
const needleBar = new THREE.Mesh(new THREE.BoxGeometry(.042, .1, .05), mats.chrome);
needleBar.position.y = .17; dial.add(needleBar);

/* soft radial glow sprite texture */
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.28)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowMap = glowTexture();
const spriteMat = (color, opacity) => new THREE.SpriteMaterial({ map: glowMap, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });

/* big background glows */
const backGlows = [
  { c: 0x2fd8bd, x: 6, y: 3, s: 22, o: .11 },
  { c: 0xa99bff, x: -8, y: -5, s: 20, o: .06 },
  { c: 0x0e8f7d, x: -2, y: 6, s: 26, o: .08 },
].map(e => {
  const sp = new THREE.Sprite(spriteMat(e.c, e.o));
  sp.position.set(e.x, e.y, -14); sp.scale.set(e.s, e.s, 1);
  scene.add(sp); return { sp, ...e };
});

/* dial halo sprites (pulse rings) */
const halo = new THREE.Sprite(spriteMat(0x2fd8bd, .14));
halo.scale.set(6.5, 6.5, 1); halo.position.z = -1.5; world.add(halo);

/* ---------- orbiting orbs + links ---------- */
const orbDefs = [
  { color: 0x7cf5d4, priority: 3 }, { color: 0xffbe5c, priority: 1 }, { color: 0xff7a6b, priority: 0 },
  { color: 0x7cf5d4, priority: 2 }, { color: 0xa99bff, priority: 4 }, { color: 0x7cf5d4, priority: 5 },
].map((e, t) => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(.075, 24, 24), new THREE.MeshBasicMaterial({ color: e.color, toneMapped: false })));
  const glow = new THREE.Sprite(spriteMat(e.color, .9)); glow.scale.set(.8, .8, 1); g.add(glow);
  world.add(g);
  const a = new THREE.Euler((t % 3 - 1) * .55 + .25, t * 1.05, t % 2 ? .35 : -.25);
  return { g, ...e, radius: 2.3 + t % 3 * .32, speed: .16 + t % 4 * .035, phase: t / 6 * Math.PI * 2, tilt: new THREE.Quaternion().setFromEuler(a), seed: Math.random() * 100, pos: new THREE.Vector3() };
});
const MAXLINKS = orbDefs.length * 2 + orbDefs.length * 2;
const linkGeo = new THREE.BufferGeometry();
const linkPos = new Float32Array(MAXLINKS * 3 * 2);
linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
const links = new THREE.LineSegments(linkGeo, new THREE.LineBasicMaterial({ color: 0x7cf5d4, transparent: true, opacity: .18, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
links.frustumCulled = false; world.add(links);

/* ---------- particle field ---------- */
const nParticles = isSmall ? 900 : 2200;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(nParticles * 3), pSeed = new Float32Array(nParticles), pCol = new Float32Array(nParticles * 3);
const palette = [new THREE.Color(0x7cf5d4), new THREE.Color(0x2fd8bd), new THREE.Color(0xffbe5c), new THREE.Color(0xa99bff)];
for (let i = 0; i < nParticles; i++) {
  pPos[i*3] = (Math.random() - .5) * 26; pPos[i*3+1] = (Math.random() - .5) * 20; pPos[i*3+2] = (Math.random() - .5) * 16 - 3;
  pSeed[i] = Math.random();
  const c = palette[Math.random() < .62 ? 0 : Math.random() < .6 ? 1 : Math.random() < .66 ? 2 : 3];
  pCol[i*3] = c.r; pCol[i*3+1] = c.g; pCol[i*3+2] = c.b;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 1));
pGeo.setAttribute('aColor', new THREE.BufferAttribute(pCol, 3));
const pUniforms = { uTime: { value: 0 }, uSize: { value: isSmall ? 4 : 4.5 }, uChaos: { value: 0 } };
const particles = new THREE.Points(pGeo, new THREE.ShaderMaterial({
  uniforms: pUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute float aSeed; attribute vec3 aColor; uniform float uTime, uSize; varying vec3 vColor; varying float vA;
    void main(){
      vColor = aColor;
      vec3 p = position;
      p.x += sin(uTime*.35 + aSeed*40.)*.5;
      p.y += cos(uTime*.28 + aSeed*60.)*.5 - uTime*0.0;
      vec4 mv = modelViewMatrix * vec4(p,1.);
      gl_PointSize = uSize * (28. / -mv.z) * (0.6 + 0.4*sin(uTime*2.0+aSeed*90.));
      vA = .35 + .65*sin(uTime*1.4 + aSeed*120.);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec3 vColor; varying float vA;
    void main(){
      float d = length(gl_PointCoord - .5);
      float a = smoothstep(.5, .05, d) * vA;
      gl_FragColor = vec4(vColor, a);
    }`,
}));
particles.rotation.y = 0; scene.add(particles);

/* ---------- section states (positions borrowed from the source) ---------- */
const states = {
  hero:       { x: .84, y: .1,  s: .85, chaos: 0,   order: 0, warm: 0, mx: .62, my: .62,  ms: .62 },
  chaos:      { x: .82, y: -.05,s: .7,  chaos: 1,   order: 0, warm: 1, mx: .55, my: -.62, ms: .75 },
  order:      { x: -.5, y: .66, s: .42, chaos: 0,   order: 1, warm: 0, mx: .75, my: .79,  ms: .42 },
  side:       { x: .8,  y: .4,  s: .75, chaos: .12, order: 0, warm: 0, mx: .75, my: .72,  ms: .5 },
  'side-left':{ x: .82, y: .5,  s: .7,  chaos: .1,  order: 0, warm: 0, mx: -.75,my: .7,   ms: .5 },
  faq:        { x: -.55,y: -.56,s: .6,  chaos: .1,  order: 0, warm: 0, mx: .75, my: .72,  ms: .5 },
  calm:       { x: .8,  y: .55, s: .85, chaos: 0,   order: 0, warm: 0, mx: .7,  my: .7,   ms: .55 },
  finale:     { x: .82, y: -.15,s: .8,  chaos: .05, order: 0, warm: 0, mx: .72, my: -.55, ms: .55 },
};
const target = { ...states.hero }, cur = { ...states.hero };

function viewportPan() {
  const vH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  return { vh: vH, vw: vH * camera.aspect };
}

/* pointer parallax + spring */
const pointer = new THREE.Vector2(), smooth = new THREE.Vector2(), lastPointer = new THREE.Vector2(), rigTilt = new THREE.Vector2(), rigV = new THREE.Vector2();
let kick = 0;
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
}, { passive: true });
addEventListener('touchstart', e => {
  const t = e.touches[0]; if (!t) return;
  pointer.set(t.clientX / innerWidth * 2 - 1, -(t.clientY / innerHeight) * 2 + 1);
  kick = .9;
}, { passive: true });

/* pulse hook for the rest of the site */
addEventListener('arat:pulse', () => { kick = 1.2; rigV.y += (Math.random() - .5) * .8; rigV.x += .4; });

let running = true, scrollPrev = scrollY, t0 = performance.now();
const clock = new THREE.Clock();

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
resize(); addEventListener('resize', resize);

const lerpTo = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
const clamp = THREE.MathUtils.clamp;
const mix = (a, b, t) => a + (b - a) * t;

function frame() {
  if (!running) return;
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;

  for (const k in target) cur[k] = lerpTo(cur[k], target[k], 2.4, dt);
  smooth.lerp(pointer, 1 - Math.exp(-5 * dt));
  kick = lerpTo(kick, 0, 3, dt);

  const dx = clamp(smooth.x - lastPointer.x, -.2, .2), dy = clamp(smooth.y - lastPointer.y, -.2, .2);
  lastPointer.copy(smooth);
  rigTilt.x += dx * 3.2; rigTilt.y += dy * 3.2;
  const ds = clamp(scrollY - scrollPrev, -90, 90); scrollPrev = scrollY;
  rigTilt.x += Math.sin(t * 1.3) * Math.abs(ds) * .0025; rigTilt.y += ds * .006;
  if (!reduced && cur.chaos > .3 && Math.random() < dt * 3 * cur.chaos) {
    rigTilt.x += (Math.random() - .5) * 1.2; rigTilt.y += (Math.random() - .5) * .8;
  }

  const mobile = camera.aspect < .9;
  const { vh, vw } = viewportPan();
  const gx = mobile ? cur.mx * vw : cur.x * vw;
  const gy = mobile ? cur.my * vh : cur.y * vh;
  const gs = (mobile ? cur.ms : cur.s) * (mobile ? Math.min(1, camera.aspect * 1.25) : Math.min(1.15, .65 + camera.aspect * .28));

  world.position.set(gx, gy, 0);
  world.scale.setScalar(gs);
  world.rotation.y = smooth.x * .12; world.rotation.x = -smooth.y * .08;

  /* rig idle float + tilt springs */
  rigV.x += (-rigTilt.x * 9 - rigV.x * 2.2) * dt;
  rigV.y += (-rigTilt.y * 9 - rigV.y * 2.2) * dt;
  rigTilt.x = clamp(rigTilt.x + rigV.x * dt, -.6, .6);
  rigTilt.y = clamp(rigTilt.y + rigV.y * dt, -.8, .8);
  const chaotic = cur.chaos * (reduced ? 0 : 1);
  rig.position.set(Math.sin(t * .4) * .05, .06 + Math.sin(t * .6) * .1, 0);
  rig.rotation.set(
    -smooth.y * .28 + Math.sin(t * .31) * .06 + rigTilt.x,
    Math.sin(t * .23) * .34 + smooth.x * .6 + rigTilt.y,
    Math.sin(t * .37) * .07 - rigTilt.y * .3 + Math.sin(t * 7.3) * .035 * chaotic
  );
  dial.rotation.z = t * .12 * (1 + chaotic * 2);
  needleBar.rotation.z = -.5 + Math.sin(t * .8) * .5 + kick;

  /* halo breathing + pulse rings */
  halo.material.opacity = (0.14 + kick * .1) * (1 - cur.order * .4);
  halo.scale.setScalar(6.5 + Math.sin(t * .9) * .3 + kick * .8);
  function WatsonGuard(){ return 0; }

  /* orbs orbit → lerp toward an ordered arrangement when state=order */
  let li = 0;
  orbDefs.forEach((o, i) => {
    const ang = o.phase + t * o.speed * (1 + cur.chaos * 1.8);
    const v = new THREE.Vector3(Math.cos(ang) * o.radius, 0, Math.sin(ang) * o.radius).applyQuaternion(o.tilt);
    v.x += Math.sin(t * 1.3 + o.seed) * 1.1 * cur.chaos;
    v.y += Math.cos(t * 1.7 + o.seed * 2) * .9 * cur.chaos;
    v.z += Math.sin(t * .9 + o.seed * 3) * .8 * cur.chaos;
    v.multiplyScalar(1 + cur.chaos * .35);
    /* ordered: arc above the rig */
    const ox = mobile ? .9 * vw : 0, oy = (mobile ? .1 : .12) * vh + (2.5 - o.priority) * (mobile ? .34 : .62);
    const ordered = new THREE.Vector3((ox - gx) / gs, (oy - gy) / gs, .6);
    o.pos.copy(v).lerp(ordered, cur.order);
    o.g.position.copy(o.pos);
    o.g.scale.setScalar((1 + (o.priority === 0 ? kick * .6 : 0)) * (1 + cur.order * (o.priority < 2 ? .5 : .1)));
    /* link from rig → orb */
    linkPos[li++] = 0; linkPos[li++] = 0; linkPos[li++] = .6;
    linkPos[li++] = mix(o.pos.x, 0, cur.order); linkPos[li++] = mix(o.pos.y, 0, cur.order); linkPos[li++] = mix(o.pos.z, .6, cur.order);
  });
  /* links between consecutive orbs */
  const sorted = [...orbDefs].sort((a, b) => a.priority - b.priority);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i].pos, b = sorted[i + 1].pos;
    linkPos[li++] = a.x; linkPos[li++] = a.y; linkPos[li++] = a.z;
    linkPos[li++] = b.x; linkPos[li++] = b.y; linkPos[li++] = b.z;
  }
  linkGeo.attributes.position.needsUpdate = true;
  links.material.opacity = (.1 + cur.order * .22);

  /* colors respond to chaos/warm */
  mats.tube.color.lerpColors(new THREE.Color(0x0e8f7d), new THREE.Color(0xd84b0f), cur.warm * .55);
  coralLight.intensity = cur.warm * 18;
  faceRing.material.color.lerpColors(new THREE.Color(0x7cf5d4), new THREE.Color(0xff7a6b), cur.warm);

  particles.rotation.y = t * .01 + smooth.x * .08;
  particles.position.y = -scrollY * .0012;
  pUniforms.uTime.value = t; pUniforms.uSize.value = isSmall ? 4 : 4.5;

  backGlows.forEach((e, i) => { e.sp.position.y = e.y + Math.sin(t * .05 + i * 2) * 1.2 - scrollY * .0008 * (i + 1); });

  camera.position.x = lerpTo(camera.position.x, smooth.x * .35, 3, dt);
  camera.position.y = lerpTo(camera.position.y, smooth.y * .25, 3, dt);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

function replayFrame() { running = true; clock.getDelta(); frame(); }

addEventListener('arat:state', e => { const s = states[e.detail]; if (s) Object.assign(target, s); });

if (reduced) { Object.assign(target, states.calm); Object.assign(cur, states.calm); }
      /* the scene is the site's identity — reduced motion calms it (no chaos) but must not black it out.
     Visitors who want it gone have the customiser's low-power switch. */
      {
  frame();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) running = false;
  else { clock.getDelta(); replayFrame(); }
});

/* expose state setter for app.js */
window.AratScene = {
  running: () => running, reduced: reduced,          // verifiable from the outside (tests, support)
  setState(name) { const s = states[name]; if (!s) return; Object.assign(target, s); },
  pulse() { kick = 1.2; rigV.y += (Math.random() - .5) * .8; rigV.x += .4; },
};
