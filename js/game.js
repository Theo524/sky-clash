/* Sky Clash V4
 * Systems:
 *   Settings   – persisted user options (localStorage)
 *   Input      – keyboard, mouse, touch stick, touch buttons, camera drag
 *   CameraRig  – free / locked camera; dashes detach focus from the rival
 *   Fighter    – shared fighter model + physics + actions
 *   RivalAI    – computer opponent
 *   Combat     – melee, projectiles, effects
 *   Menus      – title, pause (resume / restart / settings / controls), round over
 *   Game       – state machine + main loop
 */
(() => {
'use strict';
const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);
const wrapAngle = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const lerpAngle = (a, b, t) => a + wrapAngle(b - a) * t;
const yawFromDir = (x, z) => Math.atan2(x, z);              // fighter facing (model faces +Z)
const camYawFromForward = (x, z) => Math.atan2(-x, -z);     // camera yaw whose forward is (x,z)
const smooth01 = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const $ = id => document.getElementById(id);

const ARENA_RADIUS = 62, CEILING = 34;
const TUNING = {
  moveSpeed: 10, walkSpeed: 9, meleeBuffer: 2.15, comboWindow: 1.9, accel: 5.5, decel: 7.5, dashPrep: 0.075, skidTime: 0.2, doubleTap: 0.3, airControl: 0.7, flySpeed: 10,
  dashSpeed: 42, dashTime: 0.22, dashCooldown: 0.42, dashCost: 10,
  relockGrace: 0.45,
  meleeRange: 2.5, kickDelay: 0.1, kickHitStop: 0.105, meleeArc: 1.25, meleeDamage: 6, meleeCooldown: 0.3, lungeRange: 4.25,
  blastSpeed: 44, blastDamage: 9, blastCost: 14, blastCooldown: 0.34, blastAssistAngle: 0.38,
  awakenCost: 50, awakenTime: 12, awakenSpeed: 1.35, awakenDamage: 1.5, awakenChargeTime: 2.10, awakenGaugeMax: 100, defensiveVanishWindow: 0.85,
  energyRegen: 7,
  jumpVel: 14, gravity: 34, jumpToFly: 0.28, slamMinHeight: 1.6, slamWind: 0.14, slamSpeed: 42, slamRadius: 5.5, slamDamage: 12, slamUp: 10, slamLag: 0.3,
  sprintSpeed: 23, flySprintSpeed: 30, sprintTurn: 4.5, sprintDrainGround: 2, sprintDrainAir: 6, sprintMinEnergy: 4,
  vanishCost: 20, vanishRefund: 12, vanishCooldown: 0.9, vanishHide: 0.13, vanishInvuln: 0.32, vanishBehind: 2.6, vanishRange: 32, vanishStun: 0.55,
  launchUp: 17, launchStun: 0.95, juggleMax: 6, airHitStun: 0.7, spikeSpeed: 34, downTime: 0.8, chaseRange: 16, techCost: 15,
  chargeMin: 0.22, chargeTime: 0.98, chargeDmg: 19, chargeCost: 26, chargeMove: 0.4,
  guardMax: 100, guardRegen: 30, guardRegenDelay: 0.9, blockMove: 0.35, blockChip: 0.15, parryWindow: 0.18, parryStun: 0.75, guardBreakStun: 1.1,
};

/* ---------------- Settings ---------------- */
const Settings = (() => {
  const KEY = 'skyclash.v4.settings';
  const defaults = { sens: 1.0, dashLock: 'resume', difficulty: 'normal', quality: 'medium',
    lockDefault: false, rival: 'fight', cameraDist: 'standard', autoCam: true, invertY: false, haptics: true, sound: true, acrobatics: true, fps: false, rounds: '3', timer: '99' };
  let data = { ...defaults };
  try { Object.assign(data, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const listeners = [];
  return {
    get: k => data[k],
    set(k, v) { data[k] = v; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} listeners.forEach(f => f(k, v)); },
    reset() { Object.keys(defaults).forEach(k => this.set(k, defaults[k])); },
    onChange: f => listeners.push(f),
    all: () => ({ ...data }),
  };
})();


/* ---------------- Renderer / scene ---------------- */
const container = $('game');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const SKY = { top: 0x5c7f9d, horizon: 0xd4ddd9, bottom: 0xc3c5b8, sun: 0xfff0c8 };
scene.fog = new THREE.Fog(SKY.horizon, 95, 360);
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 700);

/* deterministic random so the arena looks the same every load */
function makeRng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---- procedural textures ---- */
function canvasTex(w, h, draw, { repeat = 0, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  t.anisotropy = 4;
  return t;
}
const TEX = {
  glow: canvasTex(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.22, 'rgba(255,255,255,.75)');
    r.addColorStop(0.5, 'rgba(255,255,255,.22)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  }, { srgb: false }),
  star: canvasTex(128, 128, (g) => {
    g.translate(64, 64); g.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, -62); g.lineTo(7, 0); g.lineTo(0, 62); g.lineTo(-7, 0); g.closePath(); g.fill(); }
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 30); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.fill();
  }, { srgb: false }),
  blob: canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(0.6, 'rgba(0,0,0,.25)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }, { srgb: false }),
  smoke: canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }, { srgb: false }),
  cloud: canvasTex(256, 128, (g) => {
    const rnd = makeRng(7);
    for (let i = 0; i < 22; i++) {
      const x = 40 + rnd() * 176, y = 52 + rnd() * 40 - Math.abs(x - 128) * 0.12, rad = 18 + rnd() * 26;
      const r = g.createRadialGradient(x, y, 0, x, y, rad);
      r.addColorStop(0, 'rgba(255,255,255,.95)'); r.addColorStop(0.7, 'rgba(245,248,255,.6)'); r.addColorStop(1, 'rgba(235,242,255,0)');
      g.fillStyle = r; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
    }
  }),
  grass: canvasTex(512, 512, (g) => {
    const rnd = makeRng(3);
    g.fillStyle = '#6c8662'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 60; i++) {   // soft patches
      const x = rnd() * 512, y = rnd() * 512, rad = 30 + rnd() * 70;
      const r = g.createRadialGradient(x, y, 0, x, y, rad);
      const c = rnd() < 0.5 ? '112,137,90' : '88,112,73';
      r.addColorStop(0, `rgba(${c},.5)`); r.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = r; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 9000; i++) {  // blades
      const x = rnd() * 512, y = rnd() * 512, l = 2 + rnd() * 4;
      g.strokeStyle = rnd() < 0.5 ? 'rgba(151,169,124,.52)' : 'rgba(53,79,54,.45)';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 2, y - l); g.stroke();
    }
  }, { repeat: 26 }),
  stone: canvasTex(512, 512, (g) => {
    const rnd = makeRng(11), n = 8, s = 512 / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = 145 + rnd() * 46 | 0;
      g.fillStyle = `rgb(${v + 11},${v + 9},${v + 2})`; g.fillRect(x * s, y * s, s, s);
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(90,80,70,${rnd() * 0.12})`; g.fillRect(x * s + rnd() * s, y * s + rnd() * s, 2 + rnd() * 5, 2 + rnd() * 5); }
    }
    g.strokeStyle = 'rgba(61,62,59,.42)'; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke(); }
  }, { repeat: 5 }),
};

/* toon ramp: 3 bands for a cel-shaded look */
const TOON_RAMP = (() => {
  const d = new Uint8Array([95, 95, 95, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
})();
const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: TOON_RAMP, ...extra });

/* outline: inverted hull pushed out along normals */
const OUTLINE_MAT = new THREE.ShaderMaterial({
  uniforms: { uThick: { value: 0.022 }, uColor: { value: new THREE.Color(0x15111f) } },
  vertexShader: `uniform float uThick; void main(){ vec3 p = position + normal * uThick; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
  fragmentShader: `uniform vec3 uColor;
  void main(){
    gl_FragColor = vec4(uColor, 1.0);
    #include <colorspace_fragment>
  }`,
  side: THREE.BackSide,
});

const OUTLINE_THIN = OUTLINE_MAT.clone(); OUTLINE_THIN.uniforms.uThick.value = 0.011;   // for thin parts like hair spikes

/* ---- sky dome ---- */
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
  uniforms: {
    uTop: { value: new THREE.Color(SKY.top) }, uHorizon: { value: new THREE.Color(SKY.horizon) },
    uBottom: { value: new THREE.Color(SKY.bottom) }, uSun: { value: new THREE.Color(SKY.sun) },
    uSunDir: { value: new V3(0.45, 0.55, 0.3).normalize() },
  },
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform vec3 uTop, uHorizon, uBottom, uSun; uniform vec3 uSunDir; varying vec3 vDir;
    void main(){
      float h = vDir.y;
      vec3 col = mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.55));
      col = mix(col, uBottom, smoothstep(0.0, -0.25, h));
      float s = max(dot(normalize(vDir), uSunDir), 0.0);
      col += uSun * (pow(s, 900.0) * 3.0 + pow(s, 40.0) * 0.35 + pow(s, 6.0) * 0.12);
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
}));
skyDome.renderOrder = -10;
scene.add(skyDome);

/* ---- lights ---- */
const hemi = new THREE.HemisphereLight(0xdce8e4, 0x615e51, 0.94);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d9, 2.7);
sun.position.set(45, 60, 30);
Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 180 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

function applyQuality() {
  const q = Settings.get('quality');
  const cap = q === 'low' ? 1 : q === 'medium' ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
  const shadows = q !== 'low';
  renderer.shadowMap.enabled = shadows; sun.castShadow = shadows;
  const size = q === 'high' ? 2048 : 1024;
  if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  if (typeof Arena !== 'undefined') Arena.setQuality(q);
  scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
  resize();
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 75 : 62;           // wider view in portrait
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

/* ---------------- Arena ----------------
 * Central stone tournament stage, grass valley, rock mesas with crystals,
 * trees, boulders, grass tufts, floating islands, clouds and a boundary barrier.
 */
const STAGE_R = 19, STAGE_H = 0.35;
function groundAt(x, z) {
  // octagon inscribed radius is R·cos(π/8); close enough to treat as a circle
  return Math.hypot(x, z) < STAGE_R * 0.93 ? STAGE_H : 0;
}

const Arena = (() => {
  const rnd = makeRng(42);
  const animated = [];  // { obj, update(t, dt) }
  const qualityGroups = { grass: null, clouds: [] };
  const flat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.98, metalness: 0, flatShading: false });
  const shadowy = (o, cast = true, recv = true) => { o.castShadow = cast; o.receiveShadow = recv; return o; };

  /* ground */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(420, 128), new THREE.MeshStandardMaterial({color:0xc5c4b5,map:TEX.grass,roughness:1}));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  /* stage */
  const stoneTop = new THREE.MeshStandardMaterial({color:0xeeeeea,map:TEX.stone,roughness:0.98});
  const stoneSide = flat(0x7c786c);
  const stage = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(STAGE_R, STAGE_R + 0.5, STAGE_H, 8), [stoneSide, stoneTop, stoneSide]));
  stage.position.y = STAGE_H / 2; stage.rotation.y = Math.PI / 8; scene.add(stage);
  const step = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(STAGE_R + 1.2, STAGE_R + 1.6, 0.14, 8), flat(0x857a6c)), false, true);
  step.position.y = 0.07; step.rotation.y = Math.PI / 8; scene.add(step);
  // emblem
  const emblemMat = new THREE.MeshBasicMaterial({ color: 0x3a3731, transparent: true, opacity: 0.24, depthWrite:false });
  const emblem = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.7, 48), emblemMat);
  emblem.rotation.x = -Math.PI / 2; emblem.position.y = STAGE_H + 0.01; scene.add(emblem);
  const emblem2 = new THREE.Mesh(new THREE.RingGeometry(8.6, 8.85, 64), emblemMat);
  emblem2.rotation.x = -Math.PI / 2; emblem2.position.y = STAGE_H + 0.01; scene.add(emblem2);
  const star = new THREE.Mesh(new THREE.CircleGeometry(3.4, 4), emblemMat);
  star.rotation.x = -Math.PI / 2; star.position.y = STAGE_H + 0.012; scene.add(star);
  // corner lanterns
  const postMat = flat(0xb7ab98), capMat = flat(0xc2462f);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, r = STAGE_R + 0.2;
    const post = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2, 6), postMat));
    post.position.set(Math.cos(a) * r, 1.1, Math.sin(a) * r); scene.add(post);
    const cap = shadowy(new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.6, 6), capMat));
    cap.position.set(post.position.x, 2.55, post.position.z); scene.add(cap);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe2a0 }));
    orb.position.set(post.position.x, 2.05, post.position.z); scene.add(orb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffc46b, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    halo.scale.setScalar(2.2); halo.position.copy(orb.position); scene.add(halo);
    animated.push({ update: (t) => { halo.material.opacity = 0.55 + Math.sin(t * 3 + i) * 0.12; } });
  }

  /* rugged weathered rock outcrops, moss and buried stone, instead of hovering crystals */
  const rockColors = [0x817b70,0x75756b,0x8d8676,0x666960];
  const rockGeo=new THREE.IcosahedronGeometry(1,2);
  const rockMeshes=new THREE.InstancedMesh(rockGeo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true}),85);
  const rm=new THREE.Matrix4(),rq=new THREE.Quaternion(),rp=new V3(),rs=new V3(),rc=new THREE.Color();
  for(let i=0;i<85;i++){
    const a=rnd()*TAU,r=26+rnd()*63,s=0.7+rnd()*3.6;
    rp.set(Math.cos(a)*r,s*0.38,Math.sin(a)*r);
    rq.setFromEuler(new THREE.Euler(rnd()*2.0,rnd()*TAU,rnd()*1.4));
    rs.set(s*(0.85+rnd()*0.5),s*(0.55+rnd()*0.95),s*(0.8+rnd()*0.6));
    rockMeshes.setMatrixAt(i,rm.compose(rp,rq,rs));rockMeshes.setColorAt(i,rc.setHex(rockColors[i%rockColors.length]));
  }
  rockMeshes.castShadow=true;rockMeshes.receiveShadow=true;scene.add(rockMeshes);
  // Broken perimeter columns give the arena a believable ancient-ruins silhouette.
  const ruinMat=flat(0x878477),capStone=flat(0x726f64);
  for(let i=0;i<12;i++){
    const a=TAU*i/12+0.2,rad=24+rnd()*5,h=2.2+rnd()*3.4;
    const col=new THREE.Group();col.position.set(Math.cos(a)*rad,0,Math.sin(a)*rad);
    const shaft=shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.45+0.04*rnd(),0.62,h,9),ruinMat));
    shaft.position.y=h*0.5;shaft.rotation.z=(rnd()-0.5)*0.16;col.add(shaft);
    const base=shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.95,0.30,9),capStone));
    base.position.y=0.15;col.add(base);
    if(i%3===0){const top=shadowy(new THREE.Mesh(new THREE.BoxGeometry(1.3,0.23,1.3),capStone));top.position.y=h+0.06;top.rotation.y=rnd()*TAU;col.add(top);}
    scene.add(col);
  }
  // Irregular paving stones near the edges of the fighting platform.
  const tileMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.98});
  const tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(1,0.025,1),tileMat,116);
  for(let i=0;i<116;i++){
    const r=9.5+rnd()*8.4,a=rnd()*TAU,sz=0.85+rnd()*1.5;
    rp.set(Math.cos(a)*r,STAGE_H+0.004,Math.sin(a)*r);
    rq.setFromEuler(new THREE.Euler(0,a+rnd()*0.6,0));rs.set(sz*1.2,1,sz*0.6);
    tiles.setMatrixAt(i,rm.compose(rp,rq,rs));
    tiles.setColorAt(i,rc.setHex([0x949185,0x868577,0x77796f,0xa09d92][i%4]));
  }
  tiles.receiveShadow=true;scene.add(tiles);

  /* boulders (instanced) */
  const boulderGeo = new THREE.DodecahedronGeometry(1, 0);
  const boulders = new THREE.InstancedMesh(boulderGeo, flat(0xffffff), 46);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(), p3 = new V3(), col = new THREE.Color();
  for (let i = 0; i < 46; i++) {
    const a = rnd() * TAU, r = i < 18 ? 24 + rnd() * 34 : 66 + rnd() * 70;
    const s = i < 18 ? 0.5 + rnd() * 0.9 : 1 + rnd() * 2.5;
    p3.set(Math.cos(a) * r, s * 0.45, Math.sin(a) * r);
    q.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3)); sc.set(s * (1 + rnd() * 0.5), s * 0.8, s);
    boulders.setMatrixAt(i, m4.compose(p3, q, sc));
    boulders.setColorAt(i, col.setHex([0x9b9488, 0x8a8478, 0xa89f90][i % 3]));
  }
  shadowy(boulders); scene.add(boulders);

  /* trees (instanced trunks + two canopy layers) */
  const N_TREES = 60;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.55, 4, 6), flat(0x574c3e), N_TREES);
  const canopyGeo = new THREE.IcosahedronGeometry(2.4, 1);
  const can1 = new THREE.InstancedMesh(canopyGeo, flat(0xffffff), N_TREES), can2 = new THREE.InstancedMesh(canopyGeo, flat(0xffffff), N_TREES);
  for (let i = 0; i < N_TREES; i++) {
    const a = rnd() * TAU, r = ARENA_RADIUS + 6 + rnd() * 80, s = 0.8 + rnd() * 0.8;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    q.setFromEuler(new THREE.Euler(0, rnd() * TAU, 0));
    trunks.setMatrixAt(i, m4.compose(p3.set(x, 2 * s, z), q, sc.set(s, s, s)));
    can1.setMatrixAt(i, m4.compose(p3.set(x, 4.6 * s, z), q, sc.set(s * 1.2, s, s * 1.2)));
    can2.setMatrixAt(i, m4.compose(p3.set(x + 0.4 * s, 6.3 * s, z - 0.3 * s), q, sc.set(s * 0.8, s * 0.75, s * 0.8)));
    const g = [0x597c52, 0x687d54, 0x486b4d, 0x728c65][i % 4];
    can1.setColorAt(i, col.setHex(g)); can2.setColorAt(i, col.setHex(g).offsetHSL(0.01, 0, 0.06));
  }
  [trunks, can1, can2].forEach(o => { shadowy(o); scene.add(o); });

  /* grass tufts (instanced, quality dependent) */
  function buildGrass(count) {
    if (qualityGroups.grass) { scene.remove(qualityGroups.grass); qualityGroups.grass.dispose(); qualityGroups.grass = null; }
    if (!count) return;
    const blade = new THREE.ConeGeometry(0.09, 0.7, 3); blade.translate(0, 0.35, 0);
    const mesh = new THREE.InstancedMesh(blade, toon(0xffffff), count);
    const r2 = makeRng(99);
    for (let i = 0; i < count; i++) {
      let x, z; do { const a = r2() * TAU, r = 6 + r2() * (ARENA_RADIUS + 30); x = Math.cos(a) * r; z = Math.sin(a) * r; } while (Math.hypot(x, z) < STAGE_R + 2.2);
      q.setFromEuler(new THREE.Euler((r2() - 0.5) * 0.5, r2() * TAU, (r2() - 0.5) * 0.5));
      const s = 0.6 + r2() * 0.9;
      mesh.setMatrixAt(i, m4.compose(p3.set(x, 0, z), q, sc.set(s, s, s)));
      mesh.setColorAt(i, col.setHex([0x81946c, 0x657f54, 0x98a680][i % 3]));
    }
    mesh.receiveShadow = true; scene.add(mesh); qualityGroups.grass = mesh;
  }

  /* highland mountain ridges: irregular sloped rock faces with snow accumulation */
  const ridgeRnd=makeRng(3008);
  for(let i=0;i<28;i++){
    const a=TAU*i/28+(ridgeRnd()-0.5)*0.07,rad=205+ridgeRnd()*65;
    const h=35+ridgeRnd()*92,w=34+ridgeRnd()*55;
    const slices=11,positions=[];
    const rings=[];
    for(let j=0;j<3;j++){
      const r=(j===0?1.0:j===1?0.58:0.09)*w;
      const y=(j===0?-1:j===1?h*0.55:h);
      const row=[];
      for(let k=0;k<slices;k++){
        const ang=TAU*k/slices;
        row.push(new V3(Math.cos(ang)*r*(0.7+ridgeRnd()*0.52),y+(j===2?(ridgeRnd()-0.5)*h*0.10:ridgeRnd()*h*0.08),Math.sin(ang)*r*(0.74+ridgeRnd()*0.46)));
      }
      rings.push(row);
    }
    for(let j=0;j<2;j++)for(let k=0;k<slices;k++){
      const u=rings[j][k],v=rings[j][(k+1)%slices],t=rings[j+1][k],q=rings[j+1][(k+1)%slices];
      for(const p of [u,v,t,v,q,t])positions.push(p.x,p.y,p.z);
    }
    const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geom.computeVertexNormals();
    const mesh=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({color:i%2?0x78867f:0x84877c,roughness:1,flatShading:true,side:THREE.DoubleSide}));
    mesh.position.set(Math.cos(a)*rad,0,Math.sin(a)*rad);scene.add(mesh);
    const snowcap=new THREE.Mesh(new THREE.ConeGeometry(w*0.24,h*0.26,9),new THREE.MeshStandardMaterial({color:0xbfc5bd,roughness:1,flatShading:true}));
    snowcap.position.copy(mesh.position);snowcap.position.y=h*0.88;scene.add(snowcap);
  }

  /* clouds */
  function buildClouds(count) {
    qualityGroups.clouds.forEach(c => scene.remove(c)); qualityGroups.clouds = [];
    const r3 = makeRng(5);
    for (let i = 0; i < count; i++) {
      const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.cloud, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
      const a = r3() * TAU, r = 120 + r3() * 220, w = 50 + r3() * 60;
      c.position.set(Math.cos(a) * r, 55 + r3() * 60, Math.sin(a) * r); c.scale.set(w, w * 0.5, 1);
      c.userData.a = a; c.userData.r = r; c.userData.speed = 0.004 + r3() * 0.004;
      scene.add(c); qualityGroups.clouds.push(c);
    }
  }
  animated.push({ update: (t, dt) => qualityGroups.clouds.forEach(c => { c.userData.a += c.userData.speed * dt; c.position.x = Math.cos(c.userData.a) * c.userData.r; c.position.z = Math.sin(c.userData.a) * c.userData.r; }) });

  /* boundary barrier: soft glowing wall that fades upward */
  const wallMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x8fe6ff) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
      void main(){
        float fade = pow(1.0 - vUv.y, 2.5);
        float lines = 0.5 + 0.5 * sin(vUv.x * 600.0 + uTime * 2.0);
        float band = smoothstep(0.0, 0.02, vUv.y) * (0.25 + 0.35 * lines * (1.0 - vUv.y));
        gl_FragColor = vec4(uColor, fade * band * 0.22);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS, 14, 96, 1, true), wallMat);
  wall.position.y = 7; scene.add(wall);
  const edge = new THREE.Mesh(new THREE.RingGeometry(ARENA_RADIUS - 0.35, ARENA_RADIUS, 128), new THREE.MeshBasicMaterial({ color: 0xbff3ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  edge.rotation.x = -Math.PI / 2; edge.position.y = 0.04; scene.add(edge);
  animated.push({ update: (t) => { wallMat.uniforms.uTime.value = t; } });

  let time = 0;
  return {
    update(dt) { time += dt; animated.forEach(a => a.update(time, dt)); skyDome.position.copy(camera.position); },
    setQuality(qv) { buildGrass(qv === 'low' ? 0 : qv === 'medium' ? 1400 : 3200); buildClouds(qv === 'low' ? 8 : 16); },
  };
})();

/* ---------------- Fighter model ----------------
 * Hierarchy (so yaw and lean never interfere):
 *   root  – world position + facing (yaw only)
 *   body  – lean: pitch forward/back, roll into turns (local axes)
 *   pelvis → spine → chest/head/arms ; pelvis → legs (thigh → knee → boot)
 * Cel-shaded toon materials + inverted-hull outlines.
 */
const PALETTES = {
  // original hero: sleeveless navy combat top, crimson scarf, wrapped forearms; awakening turns the hair glowing cyan
  hero: { style: 'anime', meteor: [0xbfe6ff, 0x5aa8ff], meteorAw: [0xbfe6ff, 0x5aa8ff], skin: 0xf3d0b0, top: 0x1d2742, accent: 0xd8323f, pants: 0x2b2d38, wrap: 0xeeeae0, glove: 0x18181f,
    boot: 0xf2f2f4, sole: 0x22222a, scarf: 0xd8323f, hair: 0x1c1f33, awakenHair: 0x4fc8ff, iris: 0x2d5fb0, aura: 0x6fd6ff, ki: 0x4cc9f0 },
  heroOld: { style: 'gi', skin: 0xf6cda8, top: 0xff8a1f, pants: 0xff8a1f, under: 0x1f3c9e, belt: 0x1f3c9e, wrist: 0x1f3c9e,
    boot: 0x1f3c9e, bootTrim: 0xd8332b, glove: null, hair: 0x17151f, awakenHair: 0xffd23f, iris: 0x2a1d14, aura: 0xffd166, ki: 0x4cc9f0 },
  rival: { style: 'anime', meteor: [0xbfe6ff, 0x5aa8ff], meteorAw: [0xbfe6ff, 0x5aa8ff], skin: 0xe9c2a2, top: 0x303052, accent: 0xbd3575, pants: 0x26223c, wrap: 0xd7cddd, scarf: 0x953d84, glove: 0x191629, boot: 0xb0a5cf, sole: 0x211729, hair: 0xc7bbec, awakenHair: 0xff4f9a, iris: 0x7a1030, aura: 0xff5fa8, ki: 0xff6b9a },
};

function buildFighterModel(pal, opts = {}) {
  if (pal.style === 'anime') return buildAnimeHero(pal, opts);
  const outlines = opts.outlines !== false;
  const M = {};
  const mat = (key, c) => (M[key] = M[key] || toon(c));
  const parts = [];
  function part(geo, material, parent, x = 0, y = 0, z = 0, { sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0, outline = true, thin = false } = {}) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz);
    m.castShadow = true; parent.add(m); parts.push(m);
    if (outline && outlines) {
      m.add(new THREE.Mesh(geo, thin ? OUTLINE_THIN : OUTLINE_MAT));
    }
    return m;
  }
  const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const cap = (r, l, s = 10) => new THREE.CapsuleGeometry(r, l, 4, s);
  const sph = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
  const cyl = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);

  const skin = mat('skin', pal.skin), top = mat('top', pal.top), pants = mat('pants', pal.pants), under = mat('under', pal.under),
        belt = mat('belt', pal.belt), wrist = mat('wrist', pal.wrist), boot = mat('boot', pal.boot), trim = mat('trim', pal.bootTrim),
        glove = pal.glove ? mat('glove', pal.glove) : skin;
  const hairMat = new THREE.MeshToonMaterial({ color: pal.hair, gradientMap: TOON_RAMP, emissive: 0x000000 });
  const armor = pal.style === 'armor';

  const root = new THREE.Group();
  const body = grp(root, 0, 1.0, 0); body.rotation.order = 'YXZ';   // pivot at the hips
  const pelvis = grp(body, 0, 0, 0);
  // hips / pants
  part(sph(0.27), pants, pelvis, 0, -0.02, 0, { sx: 1.22, sy: 0.72, sz: 0.95 });
  // belt + knot
  part(cyl(0.29, 0.3, 0.11, 16), belt, pelvis, 0, 0.12, 0, { sz: 0.85 });
  if (!armor) {
    part(new THREE.BoxGeometry(0.1, 0.09, 0.06), belt, pelvis, 0.05, 0.12, 0.25);
    part(new THREE.BoxGeometry(0.06, 0.22, 0.03), belt, pelvis, 0.09, 0.0, 0.25, { rz: 0.25 });
    part(new THREE.BoxGeometry(0.06, 0.2, 0.03), belt, pelvis, 0.0, 0.0, 0.26, { rz: -0.15 });
  }

  // spine / torso
  const spine = grp(pelvis, 0, 0.14, 0);
  part(cap(0.22, 0.18), armor ? under : top, spine, 0, 0.2, 0, { sx: 1.12, sz: 0.85 });
  const chest = part(sph(0.33, 18, 12), top, spine, 0, 0.47, 0, { sx: 1.28, sy: 0.92, sz: 0.86 });
  if (armor) {
    // armour plate ridges + shoulder pads
    part(new THREE.BoxGeometry(0.5, 0.06, 0.05), trim, spine, 0, 0.3, 0.26);
    for (const s of [-1, 1]) part(sph(0.2, 12, 8), top, spine, 0.44 * s, 0.66, 0, { sx: 1.25, sy: 0.6, sz: 1.15, rz: -0.35 * s });
    part(cyl(0.11, 0.12, 0.14), under, spine, 0, 0.74, 0);
  } else {
    // undershirt peeking out of the V-neck
    part(sph(0.15, 12, 8), under, spine, 0, 0.56, 0.21, { sx: 1.1, sy: 1.35, sz: 0.45, outline: false });
    part(cyl(0.1, 0.11, 0.14), skin, spine, 0, 0.74, 0);
  }

  // head
  const head = grp(spine, 0, 0.86, 0.01);
  part(sph(0.27, 22, 16), skin, head, 0, 0.13, 0, { sy: 1.05 });
  part(sph(0.2, 16, 12), skin, head, 0, 0.0, 0.05, { sx: 0.95, sy: 0.82, sz: 0.92, outline: false });
  for (const s of [-1, 1]) part(sph(0.06, 8, 6), skin, head, 0.265 * s, 0.1, -0.01, { sx: 0.5, sy: 1, sz: 0.8 });
  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff }), irisMat = new THREE.MeshBasicMaterial({ color: pal.iris }),
        pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a }), shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x15111f });
  const brows = [];
  for (const s of [-1, 1]) {
    const eye = grp(head, 0.1 * s, 0.13, 0.225); eye.rotation.y = 0.32 * s;
    part(sph(0.062, 12, 8), eyeWhite, eye, 0, 0, 0, { sx: 1.15, sy: 0.72, sz: 0.35, outline: false });
    part(sph(0.042, 10, 8), irisMat, eye, -0.008 * s, -0.004, 0.016, { sx: 0.85, sy: 1.05, sz: 0.4, outline: false });
    part(sph(0.022, 8, 6), pupilMat, eye, -0.008 * s, -0.004, 0.03, { sz: 0.4, outline: false });
    part(sph(0.012, 6, 4), shine, eye, 0.008, 0.016, 0.036, { outline: false });
    part(new THREE.BoxGeometry(0.15, 0.016, 0.01), lineMat, eye, 0, 0.045, 0.02, { rz: 0.12 * s, outline: false }); // upper lash
    const brow = part(new THREE.BoxGeometry(0.13, 0.032, 0.03), hairMat, head, 0.1 * s, 0.235, 0.235, { rz: -0.32 * s, ry: 0.3 * s, outline: false });
    brows.push(brow);
  }
  part(sph(0.024, 8, 6), skin, head, 0, 0.06, 0.27, { sy: 0.8, outline: false });                   // nose
  part(new THREE.BoxGeometry(0.075, 0.012, 0.01), mat('mouth', 0x7a2b2b), head, 0, -0.03, 0.245, { outline: false }); // mouth

  // hair
  const hair = grp(head, 0, 0.13, 0);
  part(new THREE.SphereGeometry(0.285, 20, 12, 0, TAU, 0, Math.PI * 0.56), hairMat, hair, 0, 0.02, -0.025, { rx: -0.28 });
  const UP = new V3(0, 1, 0);
  const spikes = [];
  function spike(dx, dy, dz, len, rad, inset = 0.17) {
    const d = new V3(dx, dy, dz).normalize();
    const geo = new THREE.ConeGeometry(rad, len, 6);
    const m = part(geo, hairMat, hair, d.x * inset + d.x * len / 2, d.y * inset + d.y * len / 2, d.z * inset + d.z * len / 2, { thin: true });
    m.quaternion.setFromUnitVectors(UP, d);
    m.userData.dir = d; m.userData.len = len; m.userData.inset = inset;
    spikes.push(m);
  }
  if (!armor) {
    // tall upswept spikes
    spike(0, 1, -0.15, 0.62, 0.12); spike(0.32, 1, -0.2, 0.56, 0.11); spike(-0.32, 1, -0.2, 0.56, 0.11);
    spike(0.15, 0.9, 0.25, 0.42, 0.1); spike(-0.15, 0.9, 0.25, 0.42, 0.1);
    for (let k = 0; k < 7; k++) { const a = Math.PI * 0.35 + (k / 6) * Math.PI * 1.3; spike(Math.sin(a) * 0.9, 0.55, Math.cos(a) * 0.9 - 0.1, 0.48, 0.11); }
    for (let k = 0; k < 6; k++) { const a = Math.PI * 0.45 + (k / 5) * Math.PI * 1.1; spike(Math.sin(a), 0.05, Math.cos(a) - 0.1, 0.36, 0.1); }
    // bangs
    spike(0.2, 0.35, 1, 0.2, 0.07, 0.2); spike(-0.22, 0.3, 1, 0.19, 0.07, 0.2); spike(0.0, 0.5, 1, 0.22, 0.075, 0.21);
    spike(0.45, 0.15, 0.8, 0.2, 0.07, 0.22); spike(-0.45, 0.15, 0.8, 0.2, 0.07, 0.22);
  } else {
    // long swept-back spikes
    for (let k = 0; k < 9; k++) { const a = (k / 8 - 0.5) * 1.9; spike(Math.sin(a) * 0.7, 0.35 - Math.abs(a) * 0.25, -1, 0.7 - Math.abs(a) * 0.1, 0.12); }
    for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 2.2; spike(Math.sin(a) * 0.8, -0.35, -0.9, 0.6, 0.1); }
    spike(0, 0.7, -0.6, 0.5, 0.12); spike(0.3, 0.6, -0.6, 0.45, 0.11); spike(-0.3, 0.6, -0.6, 0.45, 0.11);
    // widow's peak: swept up and back off the forehead
    spike(0, 1, 0.55, 0.34, 0.09, 0.2); spike(0.18, 0.9, 0.45, 0.28, 0.07, 0.21); spike(-0.18, 0.9, 0.45, 0.28, 0.07, 0.21);
  }

  // arms: shoulder → elbow → fist
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = grp(spine, 0.4 * s, 0.6, 0); sh.rotation.order = 'XZY';
    if (armor) part(cap(0.1, 0.18), under, sh, 0, -0.16, 0);
    else { part(cyl(0.135, 0.12, 0.18), top, sh, 0, -0.06, 0); part(cap(0.088, 0.18), skin, sh, 0, -0.18, 0); }
    part(sph(0.13, 10, 8), armor ? under : top, sh, 0, 0, 0, { outline: false });
    const el = grp(sh, 0, -0.33, 0);
    part(cap(0.083, 0.16), armor ? glove : skin, el, 0, -0.13, 0);
    part(cyl(0.1, 0.1, 0.1), wrist, el, 0, -0.24, 0);
    const fist = grp(el, 0, -0.33, 0.01);
    part(sph(0.1, 10, 8), glove, fist, 0, 0, 0, { sx: 1, sy: 0.95, sz: 1.15 });
    arms.push({ sh, el, fist, side: s });
  }
  // legs: hip → knee → boot
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = grp(pelvis, 0.15 * s, -0.06, 0);
    part(cap(0.135, 0.2), pants, hip, 0, -0.2, 0, { sx: 1.08, sz: 1.05 });
    const knee = grp(hip, 0, -0.45, 0);
    part(cap(0.115, 0.2), pants, knee, 0, -0.16, 0);
    const foot = grp(knee, 0, -0.4, 0);
    part(cyl(0.135, 0.125, 0.24), boot, foot, 0, 0.04, 0);
    part(cyl(0.15, 0.15, 0.06), trim, foot, 0, 0.17, 0);
    part(sph(0.12, 12, 8), boot, foot, 0, -0.08, 0.07, { sx: 1.05, sy: 0.55, sz: 1.55 });
    legs.push({ hip, knee, foot, side: s });
  }

  // aura: two flame shells driven by a noise shader
  const aura = createAura(pal.aura);
  aura.group.position.y = 0.15; body.add(aura.group);

  // ground blob shadow (helps read height while flying)
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.renderOrder = 1;

  const bodyMats = Object.values(M);
  return { root, body, pelvis, spine, head, hair, spikes, brows, arms, legs, chest, hairMat, bodyMats, aura, blob, pal, parts };
}

/* V37 smooth awakening energy: high-resolution tapering layers rather than low-res
 * noisy flame cells. No sprites engulfing the character, and no blocky hash shader.
 */
/* V42: no continuous aura shell. A translucent world-space ribbon/filament layer is
 * emitted from actual joints by Effects.bodyAura, so the glow hugs a moving model
 * rather than making a giant tube/bubble around it. The public interface stays.
 */
function createAura(color) {
  const group = new THREE.Group();
  group.visible = false;
  return { group, level: 0, color, set(t, intensity, c) {
    this.level = intensity;
    if (c !== undefined) this.color = c;
  } };
}

/* render a head-and-shoulders portrait to a data URL for the HUD */
function renderPortrait(pal) {
  const size = 128;
  const ps = new THREE.Scene();
  ps.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.4));
  const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(1, 2, 3); ps.add(d);
  const m = buildFighterModel(pal); ps.add(m.root);
  m.arms.forEach(a => { a.sh.rotation.x = -0.3; a.el.rotation.x = -1.6; });
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  cam.position.set(0.55, 2.15, 1.7); cam.lookAt(0, 2.0, 0);
  const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(ps, cam);
  const px = new Uint8Array(size * size * 4); renderer.readRenderTargetPixels(rt, 0, 0, size, size, px);
  renderer.setRenderTarget(null); rt.dispose();
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) img.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
  g.putImageData(img, 0, 0);
  ps.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  return c.toDataURL();
}

/* ---------------- Original hero: human anime proportions ----------------
 * Same joint layout as buildFighterModel (root → body → pelvis → spine → head/arms, pelvis → legs),
 * so every pose, attack and animation works unchanged. Only the shapes differ:
 * smaller head, longer neck, V-shaped torso, tapered muscular limbs, hanging layered hair, a scarf.
 */
function buildAnimeHero(pal, opts = {}) {
  const outlines = opts.outlines !== false;
  const M = {};
  const mat = (key, c) => (M[key] = M[key] || toon(c));
  const parts = [];
  function part(geo, material, parent, x = 0, y = 0, z = 0, { sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0, outline = true, thin = false } = {}) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz);
    m.castShadow = true; parent.add(m); parts.push(m);
    if (outline && outlines) m.add(new THREE.Mesh(geo, thin ? OUTLINE_THIN : OUTLINE_MAT));
    return m;
  }
  const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const sph = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
  const cyl = (rt, rb, h, s = 14) => new THREE.CylinderGeometry(rt, rb, h, s);

  const skin = mat('skin', pal.skin), top = mat('top', pal.top), accent = mat('accent', pal.accent), pants = mat('pants', pal.pants),
        wrap = mat('wrap', pal.wrap), glove = mat('glove', pal.glove), shoe = mat('shoe', pal.boot), sole = mat('sole', pal.sole),
        scarfM = mat('scarf', pal.scarf), metal = mat('metal', 0xc9ced8);
  const hairMat = new THREE.MeshToonMaterial({ color: pal.hair, gradientMap: TOON_RAMP, emissive: 0x000000 });

  const root = new THREE.Group();
  const body = grp(root, 0, 1.0, 0); body.rotation.order = 'YXZ';
  const pelvis = grp(body, 0, 0, 0);
  // hips, cloth belt with a metal buckle
  part(sph(0.235, 16, 10), pants, pelvis, 0, -0.03, 0, { sx: 1.18, sy: 0.72, sz: 0.88 });
  part(cyl(0.24, 0.25, 0.08, 18), accent, pelvis, 0, 0.1, 0, { sz: 0.82 });
  part(new THREE.BoxGeometry(0.09, 0.07, 0.03), metal, pelvis, 0, 0.1, 0.205, { outline: false });
  // belt tail hanging at the hip
  part(new THREE.BoxGeometry(0.06, 0.2, 0.02), accent, pelvis, -0.2, -0.02, 0.12, { rz: 0.12, ry: -0.6 });

  // torso: narrow waist widening to the chest and shoulders
  const spine = grp(pelvis, 0, 0.14, 0);
  part(cyl(0.2, 0.205, 0.3, 16), top, spine, 0, 0.14, 0, { sz: 0.78 });
  const chest = grp(spine, 0, 0.47, 0); chest.scale.y = 0.92;
  part(sph(0.29, 18, 12), top, chest, 0, 0, 0, { sx: 1.22, sy: 0.98, sz: 0.76 });
  for (const s of [-1, 1]) part(sph(0.13, 12, 8), top, chest, 0.11 * s, 0.02, 0.13, { sx: 1.05, sy: 0.75, sz: 0.55, outline: false });  // chest
  // centre seam and side piping
  part(new THREE.BoxGeometry(0.025, 0.62, 0.02), accent, spine, 0, 0.32, 0.215, { outline: false });
  for (const s of [-1, 1]) part(new THREE.BoxGeometry(0.02, 0.5, 0.02), accent, spine, 0.27 * s, 0.4, 0.06, { rz: -0.12 * s, outline: false });
  // high collar + neck
  part(cyl(0.12, 0.14, 0.1, 16), top, spine, 0, 0.73, 0);
  part(cyl(0.072, 0.08, 0.18, 12), skin, spine, 0, 0.83, 0.005, { outline: false });

  // scarf: wrapped round the neck, two tails that trail behind when you move
  part(new THREE.TorusGeometry(0.13, 0.05, 8, 18), scarfM, spine, 0, 0.75, 0, { rx: Math.PI / 2 - 0.12, sx: 1.05 });
  const tails = [];
  for (const s of [-1, 1]) {
    let g = grp(spine, 0.06 * s, 0.73, -0.14); const chain = [];
    for (let i = 0; i < 4; i++) {
      part(new THREE.BoxGeometry(0.1 - i * 0.012, 0.2, 0.025), scarfM, g, 0, -0.1, 0, { thin: true });
      chain.push(g); g = grp(g, 0, -0.19, 0);
    }
    tails.push({ chain, s });
  }

  // head: smaller than before, with a tapered jaw
  const head = grp(spine, 0, 0.9, 0.01);
  part(sph(0.235, 22, 16), skin, head, 0, 0.13, 0, { sy: 1.06, sz: 1.02 });
  part(sph(0.17, 16, 12), skin, head, 0, 0.0, 0.045, { sx: 0.9, sy: 0.95, sz: 0.95, outline: false });
  part(sph(0.06, 10, 8), skin, head, 0, -0.1, 0.1, { sx: 1.1, sy: 0.75, sz: 0.9, outline: false });            // chin
  for (const s of [-1, 1]) part(sph(0.05, 8, 6), skin, head, 0.23 * s, 0.09, -0.01, { sx: 0.5, sy: 1, sz: 0.8 });
  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff }), irisMat = new THREE.MeshBasicMaterial({ color: pal.iris }),
        pupilMat = new THREE.MeshBasicMaterial({ color: 0x07070c }), shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x120f1c });
  const brows = [];
  for (const s of [-1, 1]) {
    const eye = grp(head, 0.085 * s, 0.11, 0.2); eye.rotation.y = 0.3 * s;
    part(sph(0.058, 12, 8), eyeWhite, eye, 0, 0, 0, { sx: 1.12, sy: 0.82, sz: 0.35, outline: false });
    part(sph(0.042, 12, 8), irisMat, eye, -0.006 * s, -0.004, 0.016, { sx: 0.85, sy: 1.18, sz: 0.4, outline: false });
    part(sph(0.021, 8, 6), pupilMat, eye, -0.006 * s, -0.004, 0.03, { sy: 1.15, sz: 0.4, outline: false });
    part(sph(0.012, 6, 4), shine, eye, 0.01, 0.02, 0.036, { outline: false });
    part(sph(0.006, 6, 4), shine, eye, -0.014, -0.022, 0.036, { outline: false });
    part(new THREE.BoxGeometry(0.135, 0.02, 0.01), lineMat, eye, 0.004 * s, 0.045, 0.02, { rz: 0.16 * s, outline: false });     // upper lash
    part(new THREE.BoxGeometry(0.03, 0.012, 0.01), lineMat, eye, 0.06 * s, 0.036, 0.016, { rz: -0.5 * s, outline: false });     // outer flick
    const brow = part(new THREE.BoxGeometry(0.12, 0.026, 0.026), hairMat, head, 0.088 * s, 0.205, 0.205, { rz: -0.26 * s, ry: 0.28 * s, outline: false });
    brows.push(brow);
  }
  part(new THREE.BoxGeometry(0.012, 0.03, 0.012), mat('noseShade', 0xd9a98a), head, 0.004, 0.05, 0.235, { outline: false });   // nose line
  part(new THREE.BoxGeometry(0.06, 0.011, 0.01), mat('mouth', 0x6b2a2a), head, 0, -0.035, 0.215, { outline: false });

  // hair: layered locks that hang and sweep back (no upswept spikes)
  const hair = grp(head, 0, 0.13, 0);
  part(new THREE.SphereGeometry(0.255, 22, 14, 0, TAU, 0, Math.PI * 0.6), hairMat, hair, 0, 0.0, -0.02, { rx: -0.22 });
  const UP = new V3(0, 1, 0), spikes = [];
  function lock(bx, by, bz, dx, dy, dz, len, rad) {
    const d = new V3(dx, dy, dz).normalize(), base = new V3(bx, by, bz);
    const m = part(new THREE.ConeGeometry(rad, len, 6), hairMat, hair, bx + d.x * len / 2, by + d.y * len / 2, bz + d.z * len / 2, { thin: true });
    m.quaternion.setFromUnitVectors(UP, d);
    m.userData.dir = d; m.userData.len = len; m.userData.base = base;
    spikes.push(m);
  }
  // swept-back volume from the crown
  for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 2.0; lock(Math.sin(a) * 0.12, 0.17, -0.06, Math.sin(a) * 0.7, 0.32 - Math.abs(a) * 0.18, -1, 0.36, 0.105); }
  for (let k = 0; k < 6; k++) { const a = (k / 5 - 0.5) * 2.2; lock(Math.sin(a) * 0.15, 0.03, -0.16, Math.sin(a) * 0.6, -0.55, -0.85, 0.3, 0.09); }
  // a couple of messy tufts on top
  lock(0.04, 0.22, 0.02, 0.35, 1, -0.5, 0.17, 0.065); lock(-0.07, 0.21, 0.0, -0.4, 1, -0.7, 0.15, 0.06);
  // bangs falling over the forehead, the middle one a little longer
  [[-0.16, 0.15, 0.15, -0.55, 0.13], [-0.08, 0.18, 0.18, -0.25, 0.14], [0.0, 0.19, 0.19, 0.08, 0.16], [0.08, 0.18, 0.18, 0.3, 0.13], [0.16, 0.15, 0.15, 0.6, 0.12]]
    .forEach(([x, y, z, dx, l]) => lock(x, y, z, dx, -0.55, 0.95, l, 0.05));
  // side locks framing the face, and a nape at the back
  for (const s of [-1, 1]) { lock(0.2 * s, 0.07, 0.03, 0.25 * s, -1, 0.15, 0.22, 0.05); lock(0.2 * s, 0.05, -0.05, 0.3 * s, -1, -0.2, 0.22, 0.06); }
  lock(0, -0.02, -0.2, 0, -1, -0.45, 0.24, 0.08);

  // arms: bare shoulders, wrapped forearms, fingerless gloves
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = grp(spine, 0.375 * s, 0.6, 0); sh.rotation.order = 'XZY';
    part(sph(0.112, 12, 10), skin, sh, 0, -0.01, 0, { sx: 1.05, sy: 1, sz: 1 });                         // shoulder
    part(cyl(0.085, 0.07, 0.3, 12), skin, sh, 0, -0.17, 0);                                               // upper arm
    part(sph(0.075, 10, 8), skin, sh, 0, -0.14, 0.03, { sx: 0.9, sy: 1.3, sz: 0.85, outline: false });   // bicep
    part(cyl(0.11, 0.1, 0.05, 14), accent, sh, 0, -0.03, 0, { outline: false });                          // arm band
    const el = grp(sh, 0, -0.33, 0);
    part(sph(0.072, 10, 8), skin, el, 0, 0, 0, { outline: false });
    part(cyl(0.074, 0.06, 0.26, 12), skin, el, 0, -0.13, 0);                                              // forearm
    part(cyl(0.068, 0.063, 0.15, 12), wrap, el, 0, -0.2, 0);                                              // hand wraps
    for (let i = 0; i < 3; i++) part(cyl(0.07, 0.07, 0.012, 12), mat('wrapLine', 0xc9c2b2), el, 0, -0.14 - i * 0.05, 0, { outline: false, rz: 0.15 });
    const fist = grp(el, 0, -0.33, 0.01);
    part(sph(0.082, 10, 8), glove, fist, 0, 0.01, 0, { sx: 1.0, sy: 0.95, sz: 1.15 });
    part(new THREE.BoxGeometry(0.11, 0.045, 0.06), skin, fist, 0, -0.045, 0.035, { outline: false });     // fingers
    part(sph(0.032, 8, 6), skin, fist, 0.07 * -s, 0.0, 0.045, { outline: false });                       // thumb
    arms.push({ sh, el, fist, side: s });
  }
  // legs: tapered thigh and calf, wrapped knees, high-top shoes
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = grp(pelvis, 0.135 * s, -0.06, 0);
    part(sph(0.13, 12, 8), pants, hip, 0, -0.02, 0, { outline: false });
    part(cyl(0.13, 0.095, 0.43, 14), pants, hip, 0, -0.22, 0);
    const knee = grp(hip, 0, -0.45, 0);
    part(cyl(0.1, 0.1, 0.08, 14), wrap, knee, 0, -0.01, 0.005);
    part(cyl(0.098, 0.072, 0.36, 14), pants, knee, 0, -0.19, 0);
    part(sph(0.075, 10, 8), pants, knee, 0, -0.12, -0.03, { sx: 1, sy: 1.6, sz: 0.9, outline: false });   // calf
    const foot = grp(knee, 0, -0.4, 0);
    part(cyl(0.088, 0.095, 0.16, 14), shoe, foot, 0, 0.05, 0);
    part(cyl(0.1, 0.1, 0.03, 14), accent, foot, 0, 0.12, 0, { outline: false });
    part(sph(0.1, 12, 8), shoe, foot, 0, -0.07, 0.08, { sx: 1.0, sy: 0.55, sz: 1.7 });
    part(new THREE.BoxGeometry(0.19, 0.035, 0.36), sole, foot, 0, -0.118, 0.07);
    part(new THREE.BoxGeometry(0.02, 0.05, 0.2), accent, foot, 0.1, -0.06, 0.06, { outline: false });
    part(new THREE.BoxGeometry(0.02, 0.05, 0.2), accent, foot, -0.1, -0.06, 0.06, { outline: false });
    legs.push({ hip, knee, foot, side: s });
  }

  const aura = createAura(pal.aura);
  aura.group.position.y = 0.15; body.add(aura.group);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.renderOrder = 1;

  // scarf motion: hangs at rest, streams back with speed, flutters a little
  function tick(dt, f) {
    const sp = Math.hypot(f.vel.x, f.vel.z), up = f.vel.y;
    const stream = clamp(sp / 22 + Math.max(0, -up) / 30, 0, 1);
    tails.forEach(({ chain, s }, ti) => chain.forEach((g, i) => {
      const flutter = Math.sin(f.t * (6 + stream * 8) + i * 0.9 + ti * 1.7) * (0.06 + 0.16 * stream);
      const tgt = (i === 0 ? 0.18 + stream * 1.15 : 0.05 + stream * 0.12) + flutter;
      g.rotation.x += (tgt - g.rotation.x) * damp(10, dt);
      g.rotation.z += ((i === 0 ? 0.1 * s : 0) + flutter * 0.4 * s - g.rotation.z) * damp(8, dt);
    }));
  }

  const bodyMats = Object.values(M);
  return { root, body, pelvis, spine, head, hair, spikes, brows, arms, legs, chest, hairMat, bodyMats, aura, blob, pal, parts, tick };
}

/* ---------------- VRM character models ----------------
 * A real anime model (VRM) is driven by the existing procedural rig: the rig's joints stay as
 * the invisible "animation skeleton", and each frame their rotations are copied to the model's bones.
 * So every pose, attack and effect works the same for any VRM character.
 */
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler();
const ID_Q = new THREE.Quaternion();
class VRMRig {
  constructor(fighter, vrm, opts = {}) {
    this.f = fighter; this.vrm = vrm; const m = fighter.model;
    const H = vrm.humanoid, bone = n => H.getNormalizedBoneNode(n);
    this.b = {};
    ['hips', 'spine', 'chest', 'upperChest', 'neck', 'head', 'leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand',
     'leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'rightUpperLeg', 'rightLowerLeg', 'rightFoot'].forEach(n => this.b[n] = bone(n));
    // measure the model in its rest pose to scale it to our rig (thigh + shin = 0.85)
    vrm.scene.updateMatrixWorld(true);
    const wp = n => this.b[n].getWorldPosition(new V3());
    const hip = wp('leftUpperLeg'), knee = wp('leftLowerLeg'), ankle = wp('leftFoot');
    this.scale = 0.85 / (hip.distanceTo(knee) + knee.distanceTo(ankle)) * (opts.scale || 1);
    this.hipRestY = hip.y; this.hipsRest = this.b.hips.position.clone();
    vrm.scene.scale.setScalar(this.scale);
    m.root.add(vrm.scene);
    // hide the blocky body; keep its joints for animation
    m.parts.forEach(p => p.visible = false);
    vrm.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    (opts.hide || []).forEach(name => vrm.scene.traverse(o => { if (o.isMesh && (o.name.includes(name) || (o.material && [].concat(o.material).some(mt => mt.name.includes(name))))) o.visible = false; }));
    // Independent rival materials: both fighters get the same detailed VRM meshes,
    // but the rival has its own colouring and effects. Never recolour shared hero mats.
    this.rivalMaterials = [];
    if (opts.rival) {
      const originals = new Map();
      vrm.scene.traverse(o => {
        if (!o.isMesh || !o.material) return;
        const retint = m => {
          if (!m) return m;
          if (originals.has(m)) return originals.get(m);
          const n = m.clone();
          const label = String(n.name || '').toLowerCase();
          if (/^hair$/.test(label)) {
            if (n.color) n.color.multiply(new THREE.Color(0x9a8ccf));
            this.rivalMaterials.push({m:n, base:n.color ? n.color.clone():null});
          } else if (/huku_bake|wear_metal/.test(label)) {
            if (n.color) n.color.multiply(new THREE.Color(0x78669a));
          } else if (/body_bake|body_nm/.test(label)) {
            // Keep faces and skin tones natural, even though clothing changes.
          }
          originals.set(m,n); return n;
        };
        o.material = Array.isArray(o.material) ? o.material.map(retint) : retint(o.material);
      });
    }
    // arms: VRM rest is a T-pose (arms out along ±X); our rig's rest is arms hanging down
    this.cL = new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), -Math.PI / 2);
    this.cR = new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), Math.PI / 2);
    this.cLi = this.cL.clone().invert(); this.cRi = this.cR.clone().invert();
    // fists: curl the fingers
    const fingers = ['Index', 'Middle', 'Ring', 'Little'], segs = [['Proximal', 1.35], ['Intermediate', 1.5], ['Distal', 0.9]];
    for (const side of ['left', 'right']) {
      const sg = side === 'left' ? -1 : 1;
      for (const fn of fingers) for (const [sn, a] of segs) { const n = bone(side + fn + sn); if (n) n.quaternion.setFromAxisAngle(new V3(0, 0, 1), a * sg); }
      const t1 = bone(side + 'ThumbProximal'), t2 = bone(side + 'ThumbDistal'), tm = bone(side + 'ThumbMetacarpal');
      if (tm) tm.quaternion.setFromEuler(new THREE.Euler(0, 0.5 * sg, 0.2 * sg));
      if (t1) t1.quaternion.setFromAxisAngle(new V3(0, 1, 0), 0.6 * sg);
      if (t2) t2.quaternion.setFromAxisAngle(new V3(0, 1, 0), 0.5 * sg);
    }
    this.blinkT = 2; this.ex = vrm.expressionManager;
    try { this.anim = new AnimLayer(this); } catch (err) { console.warn('clip layer unavailable', err); this.anim = null; }
  }
  update(dt) {
    const m = this.f.model, b = this.b, s = this.scale;
    // hips follow the rig's body (height + lean); line the hip joints up with ours
    const by = m.body.position.y;
    b.hips.position.set(this.hipsRest.x, this.hipsRest.y + ((by - 0.06) - this.hipRestY * s) / s, this.hipsRest.z);
    b.hips.quaternion.copy(m.body.quaternion);
    // spine twist/bend split over spine + chest, head over neck + head
    _q.copy(m.spine.quaternion); b.spine.quaternion.slerpQuaternions(ID_Q, _q, 0.55); if (b.chest) b.chest.quaternion.slerpQuaternions(ID_Q, _q, 0.45);
    _q.copy(m.head.quaternion); if (b.neck) b.neck.quaternion.slerpQuaternions(ID_Q, _q, 0.4); b.head.quaternion.slerpQuaternions(ID_Q, _q, 0.6);
    // arms: index 0 is the right side (-X), index 1 the left (+X)
    m.arms.forEach((a, i) => {
      const L = i === 1, c = L ? this.cL : this.cR, ci = L ? this.cLi : this.cRi, p = L ? 'left' : 'right';
      b[p + 'UpperArm'].quaternion.copy(a.sh.quaternion).multiply(c);
      b[p + 'LowerArm'].quaternion.copy(ci).multiply(a.el.quaternion).multiply(c);
      b[p + 'Hand'].quaternion.copy(ci).multiply(a.fist.quaternion).multiply(c);
    });
    m.legs.forEach((l, i) => {
      const p = i === 1 ? 'left' : 'right';
      b[p + 'UpperLeg'].quaternion.copy(l.hip.quaternion);
      b[p + 'LowerLeg'].quaternion.copy(l.knee.quaternion);
      b[p + 'Foot'].quaternion.copy(l.foot.quaternion);
    });
    if (this.anim) this.anim.update(dt);
    // World-space ground constraint AFTER retargeted animation and charge crouch.
    // Raises the VRM mesh if its ankle/sole or knee would intersect the real floor.
    // Does not move the hitbox or fighter's gameplay position.
    if (!this.f.flying && !this.f.launched && !this.f.spiked && this.f.downT <= 0) {
      this.vrm.scene.updateMatrixWorld(true);
      const footNames = ['leftFoot', 'rightFoot', 'leftToes', 'rightToes'];
      let correction = 0;
      const joint = this._floorJoint || (this._floorJoint = new V3());
      for (const name of footNames) {
        const node = this.vrm.humanoid.getNormalizedBoneNode(name);
        if (!node) continue;
        node.getWorldPosition(joint);
        const required = groundAt(joint.x, joint.z) + (name.endsWith('Toes') ? 0.012 : 0.028);
        correction = Math.max(correction, required - joint.y);
      }
      for (const name of ['leftLowerLeg', 'rightLowerLeg']) {
        const node = this.vrm.humanoid.getNormalizedBoneNode(name);
        if (!node) continue;
        node.getWorldPosition(joint);
        correction = Math.max(correction, groundAt(joint.x, joint.z) + 0.05 - joint.y);
      }
      // Remove the previous frame's lift before re-measuring to avoid drift.
      this.footLift = (this.footLift || 0);
      const wanted = clamp(correction, 0, 0.09);
      const next = this.footLift + (wanted - this.footLift) * damp(wanted > this.footLift ? 18 : 12, dt);
      this.vrm.scene.position.y += next - this.footLift;
      this.footLift = next;
    } else if (this.footLift) {
      const next = this.footLift * (1 - damp(17, dt));
      this.vrm.scene.position.y += next - this.footLift;
      this.footLift = next;
    }
    // Distinct awakening colour on the rival's detailed hair, not only the hidden guide rig.
    if (this.rivalMaterials && this.rivalMaterials.length) {
      const awakened = this.f.awakened;
      for (const {m,base} of this.rivalMaterials) {
        if (!m.color || !base) continue;
        m.color.copy(base);
        if (awakened) m.color.lerp(new THREE.Color(0xffa4e7),0.65);
      }
    }
    // face: a determined look, blinking now and then; wince when hit
    if (this.ex) {
      this.blinkT -= dt; let blink = 0;
      if (this.blinkT < 0.12) blink = Math.sin(Math.max(0, this.blinkT) / 0.12 * Math.PI);
      if (this.blinkT <= 0) this.blinkT = 2 + Math.random() * 3;
      const f = this.f, hurt = f.stun > 0 ? 1 : 0;
      this.ex.setValue('blink', hurt ? 0.6 : blink);
      this.ex.setValue('angry', hurt ? 0 : f.punchT > 0 || f.charging ? 0.7 : 0.3);
    }
    this.vrm.update(dt);
  }
}
// decode the embedded model and attach it to a fighter (falls back to the blocky body if anything fails)
// Supports a binary .vrm asset on GitHub Pages and embedded base64 in the standalone HTML.
async function loadVRMInto(fighter, source, opts) {
  try {
    let buffer;
    if (typeof source === 'string' && !source.startsWith('data:') && !source.startsWith('http') && !source.endsWith('.vrm') && !source.endsWith('.glb')) {
      // Standalone version: the original base64 model can open from local Files apps.
      const bin = atob(source); const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      buffer = bytes.buffer;
    } else {
      const response = await fetch(source);
      if (!response.ok) throw new Error('Failed to fetch fighter model: ' + response.status);
      buffer = await response.arrayBuffer();
    }
    const { GLTFLoader, VRMLoaderPlugin, VRMUtils } = window.VRMKit;
    const loader = new GLTFLoader(); loader.register(p => new VRMLoaderPlugin(p));
    const gltf = await new Promise((resolve,reject) => loader.parse(buffer, '', resolve, reject));
    const vrm = gltf.userData.vrm;
    if (!vrm) throw new Error('No VRM humanoid found');
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    if (VRMUtils.combineSkeletons) VRMUtils.combineSkeletons(gltf.scene);
    fighter.vrmRig = new VRMRig(fighter, vrm, opts);
    return true;
  } catch (err) { console.warn('VRM load/setup failed:', fighter.name, err); return false; }
}
// HUD portrait taken from the VRM's face
function renderVRMPortrait(fighter) {
  const size = 128, rig = fighter.vrmRig, vs = rig.vrm.scene, parent = vs.parent;
  const ps = new THREE.Scene();
  ps.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6));
  const d = new THREE.DirectionalLight(0xffffff, 2.0); d.position.set(1, 2, 3); ps.add(d);
  ps.add(vs); vs.position.set(0, 0, 0); vs.rotation.set(0, 0, 0); vs.updateMatrixWorld(true);
  const hp = rig.b.head.getWorldPosition(new V3());
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
  cam.position.set(hp.x + 0.18, hp.y + 0.02, hp.z + 0.62); cam.lookAt(hp.x, hp.y - 0.02, hp.z);
  const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(ps, cam);
  const px = new Uint8Array(size * size * 4); renderer.readRenderTargetPixels(rt, 0, 0, size, size, px);
  renderer.setRenderTarget(null); rt.dispose(); parent.add(vs);
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) img.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
  g.putImageData(img, 0, 0); return c.toDataURL();
}

/* ---------------- Recorded animation clips ----------------
 * Real motion-capture style clips from the Quaternius Universal Animation Library (CC0), baked offline
 * onto a 22-bone humanoid. Each frame stores every bone's world rotation relative to the T-pose, plus the
 * hip offset (in hip heights), so the clips work on any VRM model.
 * They layer over the procedural rig: walking / jogging / running legs and arms, punches, hit reactions,
 * the blast throw, the charge stance, jump air pose + landing and the KO fall. Everything else stays procedural.
 */
const Anim = (() => {
  const META = {"bones":["hips","spine","chest","upperChest","neck","head","leftShoulder","leftUpperArm","leftLowerArm","leftHand","rightShoulder","rightUpperArm","rightLowerArm","rightHand","leftUpperLeg","leftLowerLeg","leftFoot","leftToes","rightUpperLeg","rightLowerLeg","rightFoot","rightToes"],"stride":91,"clips":{"walk":{"o":0,"n":41,"d":1.3333,"p0":0.0,"imp":0.067,"hand":"R"},"jog":{"o":3731,"n":29,"d":0.9333,"p0":0.964,"imp":0.467,"hand":"L"},"sprint":{"o":6370,"n":21,"d":0.6667,"p0":0.85,"imp":0.333,"hand":"L"},"jab":{"o":8281,"n":27,"d":0.8667,"p0":0.654,"imp":0.2,"hand":"L"},"cross":{"o":10738,"n":31,"d":1.0,"p0":0.0,"imp":0.3,"hand":"R"},"hitChest":{"o":13559,"n":11,"d":0.3333,"p0":1.0,"imp":0.1,"hand":"L"},"hitHead":{"o":14560,"n":14,"d":0.4333,"p0":0.231,"imp":0.1,"hand":"L"},"jumpAir":{"o":15834,"n":61,"d":2.0,"p0":0.433,"imp":0.967,"hand":"L"},"jumpLand":{"o":21385,"n":39,"d":1.2667,"p0":0.184,"imp":0.4,"hand":"L"},"blast":{"o":24934,"n":16,"d":0.5,"p0":0.267,"imp":0.0,"hand":"L"},"charge":{"o":26390,"n":64,"d":2.1,"p0":0.0,"imp":0.133,"hand":"L"},"death":{"o":32214,"n":73,"d":2.4,"p0":0.389,"imp":0.733,"hand":"L"},"knockback":{"o":38857,"n":26,"d":0.8333,"p0":1.0,"imp":0.0,"hand":"L"},"getUp":{"o":41223,"n":47,"d":1.5333,"p0":0.022,"imp":0.967,"hand":"R"},"jumpStart":{"o":45500,"n":30,"d":0.9667,"p0":0.0,"imp":0.0,"hand":"L"},"guardBreak":{"o":48230,"n":33,"d":1.0667,"p0":0.312,"imp":0.733,"hand":"L"},"punchEnter":{"o":51233,"n":27,"d":0.8667,"p0":0.0,"imp":0.2,"hand":"L"},"kick":{"o":53690,"n":34,"d":1.1,"p0":0,"imp":0.6,"hand":"-"},"airKick":{"o":56784,"n":34,"d":1.1,"p0":0,"imp":0.6,"hand":"-"},"qRoll":{"o":59878,"n":45,"d":1.4667,"p0":0,"imp":0,"hand":"-","library":1,"source":"Roll"},"qHitKnockback":{"o":63973,"n":26,"d":0.8333,"p0":0,"imp":0,"hand":"-","library":2,"source":"Hit_Knockback"},"qHook":{"o":66339,"n":15,"d":0.4667,"p0":0,"imp":0,"hand":"-","library":2,"source":"Melee_Hook"},"qHookRecovery":{"o":67704,"n":19,"d":0.6,"p0":0,"imp":0,"hand":"-","library":2,"source":"Melee_Hook_Rec"},"qNinjaJumpLand":{"o":69433,"n":39,"d":1.2667,"p0":0,"imp":0,"hand":"-","library":2,"source":"NinjaJump_Land"},"qNinjaJumpStart":{"o":72982,"n":30,"d":0.9667,"p0":0,"imp":0,"hand":"-","library":2,"source":"NinjaJump_Start"},"qSlideExit":{"o":75712,"n":16,"d":0.5,"p0":0,"imp":0,"hand":"-","library":2,"source":"Slide_Exit"},"qSlideLoop":{"o":77168,"n":61,"d":2.0,"p0":0,"imp":0,"hand":"-","library":2,"source":"Slide_Loop"},"qSlideStart":{"o":82719,"n":26,"d":0.8333,"p0":0,"imp":0,"hand":"-","library":2,"source":"Slide_Start"},"qNinjaHover":{"o":85085,"n":61,"d":2.0,"p0":0,"imp":0,"hand":"-","library":2,"source":"NinjaJump_Idle_Loop"},"qShieldDash":{"o":90636,"n":34,"d":1.1,"p0":0,"imp":0,"hand":"-","library":2,"source":"Shield_Dash"},"qSwordDash":{"o":93730,"n":48,"d":1.5667,"p0":0,"imp":0,"hand":"-","library":2,"source":"Sword_Dash"}}};
  const RAW = '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';
  let data = null;
  function load() {
    if (data) return data;
    const bin = atob(RAW), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    data = new Int16Array(u8.buffer);
    return data;
  }
  const NB = META.bones.length, ST = META.stride;
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  // sample clip `name` at time t (seconds; looped or clamped) into out.q[] (world deltas) and out.h (hip offset)
  function sample(name, t, loop, out) {
    const c = META.clips[name], d = load();
    let f = t * 30;
    if (loop) { f %= (c.n - 1); if (f < 0) f += c.n - 1; } else f = clamp(f, 0, c.n - 1);
    const f0 = Math.floor(f), f1 = Math.min(c.n - 1, f0 + 1), u = f - f0;
    const o0 = c.o + f0 * ST, o1 = c.o + f1 * ST, k = 1 / 32767;
    for (let b = 0; b < NB; b++) {
      const i0 = o0 + b * 4, i1 = o1 + b * 4;
      qa.set(d[i0] * k, d[i0 + 1] * k, d[i0 + 2] * k, d[i0 + 3] * k);
      qb.set(d[i1] * k, d[i1 + 1] * k, d[i1 + 2] * k, d[i1 + 3] * k);
      out.q[b].slerpQuaternions(qa, qb, u).normalize();
    }
    const h0 = o0 + NB * 4, h1 = o1 + NB * 4;
    out.h.set(d[h0] + (d[h1] - d[h0]) * u, d[h0 + 1] + (d[h1 + 1] - d[h0 + 1]) * u, d[h0 + 2] + (d[h1 + 2] - d[h0 + 2]) * u).multiplyScalar(1e-4);
    return out;
  }
  const pose = () => ({ q: META.bones.map(() => new THREE.Quaternion()), h: new V3() });
  // blend pose b into a (in place) by weight w
  function blend(a, b, w, mask) {
    if (w <= 0) return a;
    for (let i = 0; i < NB; i++) if (!mask || mask[i]) a.q[i].slerp(b.q[i], w);
    if (!mask || mask[0]) a.h.lerp(b.h, w);
    return a;
  }
  function copy(a, b) { for (let i = 0; i < NB; i++) a.q[i].copy(b.q[i]); a.h.copy(b.h); return a; }
  // deepest point of the landing (lowest hips) = braced stance
  let CROUCH_T = 0.2; { const c = META.clips.jumpLand, P = pose(); let lo = 9; for (let t = 0; t < c.d; t += 1 / 30) { sample('jumpLand', t, false, P); if (P.h.y < lo) { lo = P.h.y; CROUCH_T = t; } } }
  return { META, bones: META.bones, NB, sample, pose, blend, copy, clip: n => META.clips[n], CROUCH_T };
})();

/* Drives one VRM fighter's clip layers. Called by VRMRig after the procedural pose has been copied. */
class AnimLayer {
  constructor(rig) {
    this.rig = rig; this.f = rig.f;
    const H = rig.vrm.humanoid, B = Anim.bones;
    this.nodes = B.map(n => H.getNormalizedBoneNode(n));
    // nearest existing ancestor of each bone in the VRM humanoid (some models lack upperChest / shoulders / toes)
    const PARENT = { hips: null, spine: 'hips', chest: 'spine', upperChest: 'chest', neck: 'upperChest', head: 'neck',
      leftShoulder: 'upperChest', leftUpperArm: 'leftShoulder', leftLowerArm: 'leftUpperArm', leftHand: 'leftLowerArm',
      rightShoulder: 'upperChest', rightUpperArm: 'rightShoulder', rightLowerArm: 'rightUpperArm', rightHand: 'rightLowerArm',
      leftUpperLeg: 'hips', leftLowerLeg: 'leftUpperLeg', leftFoot: 'leftLowerLeg', leftToes: 'leftFoot',
      rightUpperLeg: 'hips', rightLowerLeg: 'rightUpperLeg', rightFoot: 'rightLowerLeg', rightToes: 'rightFoot' };
    this.par = B.map(n => { let p = PARENT[n]; while (p && !this.nodes[B.indexOf(p)]) p = PARENT[p]; return p ? B.indexOf(p) : -1; });
    // bones the procedural rig never sets: reset each frame so blends don't accumulate
    this.unset = ['upperChest', 'leftShoulder', 'rightShoulder', 'leftToes', 'rightToes'].map(n => B.indexOf(n));
    const idx = n => B.indexOf(n);
    this.UPPER = B.map((n, i) => i >= idx('spine') && i <= idx('rightHand'));
    this.LOWER = B.map((n, i) => !this.UPPER[i]);
    this.ARMS = B.map((n, i) => i >= idx('leftShoulder') && i <= idx('rightHand'));
    this.SWING = ['leftUpperLeg', 'rightUpperLeg'].map(idx);
    this.spineI = idx('spine'); this.leanI = idx('upperChest'); this.hipsI = 0;
    this.walk = Anim.pose(); this.tmp = Anim.pose(); this.shot = Anim.pose(); this.out = Anim.pose();
    this.ph = 0; this.locoLeg = 0; this.locoUp = 0;
    this.one = null;   // active one-shot: { name, t, rate, end, loop, mask, w, fade, hold }
    this.lastAttackSerial = -1;
    this.prev = { punchT: 0, blastT: 0, superHitT: 0, brokenT: 0, downT: 0, stun: 0, flying: false, jumping: false, hp: 100 };
    this.hitAlt = 0;
    this.lastAcro = null;
    this.evadeCount = 0;
    this.lastSkidT = 0;
    this.lastRecordedAction = 'none';
    this.wl = new THREE.Quaternion(); this.qy = new THREE.Quaternion(); this.qy2 = new THREE.Quaternion();
    this.inv = new THREE.Quaternion(); this.loc = new THREE.Quaternion();
  }
  play(name, opts = {}) {
    const c = Anim.clip(name);
    // the clip being replaced keeps playing underneath and fades out, so chained moves flow into each other
    if (this.one && this.one.w > 0.05) { this.prevOne = this.one; if (!this.prevOne.done) { this.prevOne.done = true; this.prevOne.fadeOut = opts.blendOut || 0.12; } }
    else this.prevOne = null;
    this.one = { name, t: opts.from || 0, rate: opts.rate || 1, end: opts.end != null ? opts.end : c.d, loop: !!opts.loop,
      from0: opts.from || 0, warp: !!opts.warp, mask: opts.mask || null, w: 0, fadeIn: opts.fadeIn || 0.07, fadeOut: opts.fadeOut || 0.14, hold: !!opts.hold, noH: !!opts.noH, done: false };
  }
  stop() { if (this.one) this.one.done = true; }
  // scale the swing of thighs and upper arms (relative to their parent) by k, keeping the rest of each chain attached
  stretch(P, k) {
    const N = Anim.NB, loc = this._locs || (this._locs = Anim.bones.map(() => new THREE.Quaternion())), inv = this.inv;
    for (let i = 0; i < N; i++) { const pi = this.par[i]; if (pi < 0) loc[i].copy(P.q[i]); else loc[i].copy(inv.copy(P.q[pi]).invert()).multiply(P.q[i]); }
    for (const i of this.SWING) loc[i].copy(ID_Q.clone().slerp(loc[i], k));
    for (let i = 0; i < N; i++) { const pi = this.par[i]; if (pi >= 0) P.q[i].copy(P.q[pi]).multiply(loc[i]); }
  }
  // exaggerate the motion of some bones relative to a reference pose R (locals: R * (R^-1 P)^k), rest of the chain follows
  exaggerate(P, R, idxs, k) {
    const N = Anim.NB, inv = this.inv;
    const lp = this._elp || (this._elp = Anim.bones.map(() => new THREE.Quaternion()));
    const lr = this._elr || (this._elr = Anim.bones.map(() => new THREE.Quaternion()));
    const d = this._ed || (this._ed = new THREE.Quaternion());
    for (let i = 0; i < N; i++) {
      const pi = this.par[i];
      if (pi < 0) { lp[i].copy(P.q[i]); lr[i].copy(R.q[i]); }
      else { lp[i].copy(inv.copy(P.q[pi]).invert()).multiply(P.q[i]); lr[i].copy(inv.copy(R.q[pi]).invert()).multiply(R.q[i]); }
    }
    for (const i of idxs) { d.copy(lr[i]).invert().multiply(lp[i]); d.copy(ID_Q.clone().slerp(d, k)); lp[i].copy(lr[i]).multiply(d); }
    for (let i = 0; i < N; i++) { const pi = this.par[i]; if (pi >= 0) P.q[i].copy(P.q[pi]).multiply(lp[i]); }
  }
  // tilt the upper body about the side axis (positive = forward), bending through the spine
  tiltUpper(P, a) {
    if (Math.abs(a) < 1e-4) return;
    const SHARE = this._share || (this._share = Anim.bones.map((n, i) => n === 'spine' ? 0.35 : n === 'chest' ? 0.7 : n === 'neck' ? 0.7 : n === 'head' ? 0.4 : this.UPPER[i] ? 1 : 0));
    const q = this._lq || (this._lq = new THREE.Quaternion()), X = this._X || (this._X = new V3(1, 0, 0));
    for (let i = 0; i < Anim.NB; i++) if (SHARE[i]) P.q[i].premultiply(q.setFromAxisAngle(X, a * SHARE[i]));
  }
  // attack shaping on the sampled one-shot: bigger torso twist + reach, weight driven into the hit, blast recoil
  shape(o) {
    const S = this.shot, f = this.f, c = Anim.clip(o.name), t = Math.min(o.t, o.end);
    const punch = o.name === 'jab' || o.name === 'cross' || o.name === 'qHook', kick = o.name === 'kick' || o.name === 'airKick';
    if (punch || kick) {
      if (!o.ref) o.ref = Anim.sample(o.name, o.from0, false, Anim.pose());
      const contactTime = o.name === 'qHook' ? 0.24 : c.imp;
      const e = Math.max(0, 1 - Math.abs(t - contactTime) / (punch ? 0.24 : 0.3)), env = e * e * (3 - 2 * e);
      const B = Anim.bones, ix = n => B.indexOf(n);
      const set = this._px || (this._px = { p: ['spine', 'chest', 'upperChest', 'leftShoulder', 'rightShoulder'].map(ix).filter(i => i >= 0),
        k: ['spine', 'chest', 'upperChest', 'leftUpperLeg', 'rightUpperLeg'].map(ix).filter(i => i >= 0) });
      // Hook is already a full mocap torso twist. Exaggerating multiple spine
      // bones together distorts the abdomen and bends the character unnaturally.
      const amount = o.name === 'qHook' ? 0.045 : (punch ? 0.25 : 0.15);
      this.exaggerate(S, o.ref, punch ? set.p : set.k, 1 + amount * env);
      if (punch) {
        // Jab is a fast short reach; cross drives a larger shoulder rotation;
        // hook carries a visible turning follow-through. Blend entire upper
        // chain together so the neck/arms actually follow the chest.
        const turn = (o.name === 'jab' ? -0.07 : o.name === 'cross' ? 0.12 : -0.075) * env;
        const yawQ = this._strikeTurn || (this._strikeTurn = new THREE.Quaternion());
        yawQ.setFromAxisAngle(_UP, turn);
        for (let i = 0; i < Anim.NB; i++) if (this.UPPER[i]) S.q[i].premultiply(yawQ);
        this.tiltUpper(S, (o.name === 'qHook' ? 0.025 : o.name === 'cross' ? 0.075 : 0.055) * env);
      } else {
        // follow-through: the chest rolls over the kick after contact, then settles
        const r = t - c.imp, ft = r <= 0 ? 0 : Math.sin(Math.PI * Math.min(1, r / 0.45));
        this.tiltUpper(S, 0.18 * ft);
      }
    } else if (o.name === 'blast') {
      const lv = f.blastLvl || 0, r = Math.min(1, t * 25) * Math.exp(-t * 7);
      this.tiltUpper(S, -(0.12 + 0.25 * lv) * r);     // the throw kicks the chest back, harder for charged shots
    }
  }
  // glowing streak behind the striking fist / foot during the active frames
  strikeTrail(dt) {
    const o = this.one, f = this.f;
    if (!o || o.done || !(o.name === 'jab' || o.name === 'cross' || o.name === 'qHook' || o.name === 'kick' || o.name === 'airKick')) { this.trailP = null; return; }
    const c = Anim.clip(o.name);
    const hit = o.name === 'qHook' ? 0.24 : c.imp;
    if (o.t < hit - 0.12 || o.t > hit + (o.name.includes('ick') ? 0.14 : 0.06)) { this.trailP = null; return; }
    const H = this.rig.vrm.humanoid, kick = o.name.includes('ick');
    const ends = kick ? ['leftFoot', 'rightFoot'] : ['leftHand', 'rightHand'];
    const fw = f.forward(), hips = (this._hp || (this._hp = new V3())).copy(f.pos);
    let best = null, bd = -1e9; const v = this._tv || (this._tv = new V3());
    for (const n of ends) { const b = H.getRawBoneNode(n); if (!b) continue; b.getWorldPosition(v); const d = v.clone().sub(hips).dot(fw); if (d > bd) { bd = d; best = v.clone(); } }
    if (!best) return;
    const col = f.awakened ? f.pal.aura : f.pal.ki;
    // spaced by distance travelled, so a fast swing leaves a streak and a slow one barely anything
    if (this.trailP) {
      const d = this.trailP.distanceTo(best), n = Math.min(4, Math.floor(d / 0.22));
      for (let k = 1; k <= n; k++) Effects.trail(this.trailP.clone().lerp(best, k / n), col, kick ? 0.6 : 0.45);
      if (n > 0) this.trailP = best;
    } else this.trailP = best;
  }
  update(dt) {
    const f = this.f, p = this.prev, flying = f.flying, hs = Math.hypot(f.vel.x, f.vel.z);
    if (f.awakenChargeT > 0) {
      if (this.one) this.one.done = true;
      this.prevOne = null;
    }
    const grounded = !flying && !f.launched && !f.spiked;

    // ---- triggers for one-shots (rising edges of the fighter's state) ----
    if (f.hp <= 0 && p.hp > 0) this.play('death', { hold: true, fadeIn: 0.12 });
    else if (f.hp > 0 && p.hp <= 0) this.one = null;
    const dying = f.hp <= 0;
    if (!dying) {
      if (f.punchT > 0 && f.attackSerial !== this.lastAttackSerial && (f.attackKind === 'punch' || f.attackKind === 'hook' || f.attackKind === 'airStrike')) {
        const name = f.attackKind === 'airStrike' ? 'cross' : f.attackKind === 'hook' ? 'qHook' : (f.punchSide === 1 ? 'jab' : 'cross'), c = Anim.clip(name);
        // V36: play the actual preparation + contact + follow-through, not just
        // the last frames near impact. Clip speeds match Combat.melee's hit delays.
        const rate = name === 'qHook' ? 0.72 : name === 'jab' ? 1.55 : 1.51;
        this.play(name, { from: 0, rate, end: name === 'qHook' ? c.d : name === 'jab' ? 0.65 : 0.76,
          mask: this.UPPER, noH: true, 
          fadeIn: 0.065, fadeOut: 0.14, blendOut: 0.14 });
      } else if (f.punchT > 0 && f.attackSerial !== this.lastAttackSerial && f.attackKind === 'kick') {
        // Recorded kick from preparation through extension and recovery;
        // foot contact now matches the stage-4 damage window (~0.17s).
        const name = 'kick', c = Anim.clip(name);
        this.play(name, { from: 0, rate: 1.28, end: c.d,
          mask: grounded && hs < 1.2 ? null : this.UPPER, noH: true, fadeIn: 0.060, fadeOut: 0.18, blendOut: 0.16, warp: false });
      } else if (f.punchT > 0 && f.attackKind !== 'punch' && f.attackKind !== 'hook' && f.attackKind !== 'kick' && this.one && !this.one.done && this.one.name !== 'death') this.stop();
      this.lastAttackSerial = f.attackSerial;
      if (f.superHitT > 0 && p.superHitT <= 0) this.play('qHitKnockback', {
        from: 0.06, rate: 1.30, end: 0.70, mask: this.UPPER,
        noH: true, fadeIn: 0.045, fadeOut: 0.17, blendOut: 0.14 });
      if (f.blastT > 0 && p.blastT <= 0) this.play('blast', { rate: 1.3, mask: this.UPPER, noH: true, fadeIn: 0.04 });
      if (f.brokenT > 0 && p.brokenT <= 0) this.play('guardBreak', { rate: 1, hold: true, fadeIn: 0.05 });
      else if (f.downT > 0 && p.downT <= 0) this.play('qHitKnockback', { from: 0.10, rate: 1.35, hold: true, fadeIn: 0.055 });
      else if (f.downT <= 0 && p.downT > 0) this.play('getUp', { from: 0.1, rate: 2.0, fadeIn: 0.05, fadeOut: 0.2 });
      else if (f.jumping && !p.jumping && !f.launched && !(f.acro && f.acro.type === 'flip')) this.play('qNinjaJumpStart', { from: 0.13, rate: 1.8, end: 0.52, mask: hs > 7 ? null : this.LOWER, noH: true, fadeIn: 0.06, fadeOut: 0.13 });
      else if (f.stun > 0 && p.stun <= 0 && !f.launched && !f.spiked && f.downT <= 0 && f.brokenT <= 0 && grounded && f.superHitT <= 0) {
        this.hitAlt ^= 1; this.play(this.hitAlt ? 'hitChest' : 'hitHead', { rate: 1.1, fadeIn: 0.04 });
      }
      if (p.flying && !flying && grounded && f.downT <= 0 && !(this.one && !this.one.done && this.one.name !== 'jumpAir')) {
        // touchdown (hop or coming down from flight): knees absorb the landing, harder after a fast drop
        const hard = (p.vy || 0) < -9;
        this.play('qNinjaJumpLand', { from: hard ? 0.09 : 0.16, rate: hard ? 1.65 : 1.95, end: 0.78, mask: this.LOWER, fadeIn: 0.045, fadeOut: 0.2 });
      }
    }
    // Recorded Quaternius parkour, bound to the exact existing movement states.
    // Animation never changes the physics position, velocity, hitbox, or player input.
    if (!dying && Settings.get('acrobatics') && f.hp > 0 && f.stun <= 0 &&
        !f.blockHeld && f.punchT <= 0 && !f.charging && f.blastT <= 0) {
      if (f.acro && f.acro !== this.lastAcro && f.acro.type === 'evade' && !f.flying) {
        // Free Quaternius UAL2 dash clips: lower-body-only, so the character keeps
        // a bare-handed guard, never a fictitious sword/shield pose.
        this.evadeCount++;
        const step = this.evadeCount % 2 ? 'qShieldDash' : 'qSwordDash';
        this.play(step, { from: 0.08, rate: step === 'qShieldDash' ? 3.15 : 3.95,
          end: step === 'qShieldDash' ? 0.94 : 1.19, mask: this.LOWER,
          fadeIn: 0.04, fadeOut: 0.12, noH: true, blendOut: 0.11 });
        this.lastRecordedAction = 'side-step';
      }
      // A running skid uses the Library 2 slide sequence instead of generic knee bending.
      if (f.skidT > 0.13 && this.lastSkidT <= 0 && hs > 5 && !f.dashing && !f.flying) {
        this.play('qSlideStart', { rate: 2.55, end: 0.61, fadeIn: 0.045, noH: true });
        this.lastRecordedAction = 'skid';
      }
      if (f.skidT <= 0 && this.lastSkidT > 0.05 && this.one && this.one.name === 'qSlideLoop') {
        this.play('qSlideExit', { rate: 2.8, fadeIn: 0.04, noH: true });
      }
    }
    this.lastSkidT = f.skidT;
    this.lastAcro = f.acro;
    p.punchT = f.punchT; p.blastT = f.blastT; p.superHitT = f.superHitT || 0; p.brokenT = f.brokenT; p.downT = f.downT; p.stun = f.stun; p.flying = flying; p.jumping = f.jumping; p.hp = f.hp; p.vy = f.vel.y;

    // ---- locomotion layer: walk / jog / sprint chosen by speed, phase locked to the ground covered ----
    const busyLegs = f.awakenChargeT > 0 || !grounded || f.dashPrep > 0 || (f.skidT > 0 && !f.sprinting && !f.dashing) || f.stun > 0 || f.downT > 0 || f.slamming || f.slamLagT > 0 || f.brokenT > 0 || f.punchT > 0 || dying;
    const busyArms = f.awakenChargeT > 0 || busyLegs || f.blockW > 0.05 || f.charging || f.windT > 0 || f.blastT > 0 || f.punchT > 0;
    const moveW = smooth01((hs - 0.25) / 1.0);
    // standing still uses the boxing guard stance clip; moving uses the walk/run clips
    // When strafing, prefer the directional procedural feet to the forward-walk mocap.
    const fx = Math.sin(f.facing), fz = Math.cos(f.facing);
    const side = Math.abs(f.vel.x * fz - f.vel.z * fx);
    const forward = Math.abs(f.vel.x * fx + f.vel.z * fz);
    const sideW = grounded && hs > 1.5 && !f.sprinting ? smooth01((side - 0.58 * forward) / 6) : 0;
    this.strafeW = (this.strafeW || 0) + (sideW - (this.strafeW || 0)) * damp(10, dt);
    const legT = busyLegs ? 0 : 1 - 0.88 * this.strafeW, upT = busyArms ? 0 : 1;
    this.moveW = moveW;
    this.locoLeg += (legT - this.locoLeg) * damp(12, dt);
    this.locoUp += (upT - this.locoUp) * damp(12, dt);
    // the joystick always walks (slow stroll to brisk walk); jogging and sprinting only when Run is held / dashing
    const running = f.sprinting || (f.dashing && !flying);
    this.runK = (this.runK || 0) + ((running ? 1 : 0) - (this.runK || 0)) * damp(8, dt);
    const wJog = Math.max(smooth01((hs - 3.5) / 3.5) * this.runK, 0.4 * smooth01((hs - 7) / 1.8)), wSpr = running ? smooth01((hs - 11) / 6) : 0;
    const natural = 1 / (Anim.clip('walk').d + (Anim.clip('jog').d - Anim.clip('walk').d) * wJog + (Anim.clip('sprint').d - Anim.clip('jog').d) * wSpr * 1);
    const cadence = hs / (2 * (f.stepLen || 1));                 // full cycles per second, same as the procedural stride
    const rate = clamp(cadence, natural * 0.6, natural * (1.75 + 0.65 * wJog));
    this.ph += rate * dt * (f.strideDir < 0 ? -1 : 1);
    this.ph -= Math.floor(this.ph);
    const W = this.walk;
    const at = name => { const c = Anim.clip(name); return ((this.ph + c.p0) % 1) * (c.n - 1) / 30; };
    if (this.locoLeg > 0.001 || this.locoUp > 0.001) {
      Anim.sample('walk', at('walk'), true, W);
      // brisk walk: lengthen the stride a little (thighs and arms swing further) instead of breaking into a jog
      const amp = 1 + 0.35 * smooth01((hs - 3) / 4) * (1 - this.runK);
      if (amp > 1.001) this.stretch(W, amp);
      if (wJog > 0) Anim.blend(W, Anim.sample('jog', at('jog'), true, this.tmp), wJog);
      if (wSpr > 0) Anim.blend(W, Anim.sample('sprint', at('sprint'), true, this.tmp), wSpr);
      // the recorded jog/sprint lean the chest forward: measure it (smoothed) and stand the torso back up
      const uc = this.leanI, v = this._v || (this._v = new V3());
      v.set(0, 1, 0).applyQuaternion(W.q[uc]);
      // jogging stays upright (walk feel); the Run / dash keeps the clip's lean and adds more on top (below)
      const runL = grounded && running ? (f.dashing ? 1 : smooth01((hs - 8) / 9)) : 0;
      this.runL = (this.runL || 0) + (runL - (this.runL || 0)) * damp(running ? 7 : 20, dt);
      const lean = Math.atan2(v.z, v.y) * Math.max(wJog, wSpr) * (1 - this.runL);
      this.leanAvg = this.leanAvg == null ? lean : this.leanAvg + (lean - this.leanAvg) * damp(3, dt);
      const fix = this._fix || (this._fix = new THREE.Quaternion());
      fix.setFromAxisAngle(this._X || (this._X = new V3(1, 0, 0)), -this.leanAvg * 0.85);
      for (let i = 0; i < Anim.NB; i++) if (this.UPPER[i]) W.q[i].premultiply(fix);
      // aggressive run: chest driven low and forward (bent through the spine), head kept up looking ahead,
      // arms keep pumping with the torso, knees drive a little higher
      if (this.runL > 0.01) {
        const L = this.runL * (f.dashing ? 0.62 : 0.5), X = this._X || (this._X = new V3(1, 0, 0));
        const SHARE = this._share || (this._share = Anim.bones.map((n, i) => n === 'spine' ? 0.35 : n === 'chest' ? 0.7 : n === 'neck' ? 0.7 : n === 'head' ? 0.4 : this.UPPER[i] ? 1 : 0));
        const q = this._lq || (this._lq = new THREE.Quaternion());
        for (let i = 0; i < Anim.NB; i++) if (SHARE[i]) W.q[i].premultiply(q.setFromAxisAngle(X, L * SHARE[i]));
        this.stretch(W, 1 + 0.18 * this.runL);
        W.h.y -= 0.035 * this.runL;
      }
    }
    // standing: boxing guard (last frame of the punch-ready clip) with a slow breath
    if (f.awakenChargeT <= 0 && (this.locoLeg > 0.001 || this.locoUp > 0.001) && moveW < 0.999) {
      const S = Anim.sample('punchEnter', 0.86, false, this.tmp2 || (this.tmp2 = Anim.pose()));
      const br = this._br || (this._br = new THREE.Quaternion());
      br.setFromAxisAngle(this._X || (this._X = new V3(1, 0, 0)), Math.sin(f.t * 2.2) * 0.025);
      for (let i = 1; i < Anim.NB; i++) if (this.UPPER[i]) S.q[i].premultiply(br);
      if (moveW <= 0.001) Anim.copy(W, S); else Anim.blend(S, W, moveW), Anim.copy(W, S);
    }

    // jump: hold the ninja-jump air pose (legs) while hopping
    const airW = f.jumping && flying ? 1 : 0;
    this.airW = (this.airW || 0) + (airW - (this.airW || 0)) * damp(10, dt);
    // Library 2's NinjaJump_Idle_Loop adds subtle leg posing during a quiet hover.
    // Attack, dash and launch states retain priority; no root movement is copied.
    const hoverW = flying && !f.jumping && !f.dashing && !f.sprinting && !f.launched &&
      !f.spiked && f.punchT <= 0 && f.stun <= 0 ? 1 : 0;
    this.hoverW = (this.hoverW || 0) + (hoverW - (this.hoverW || 0)) * damp(7, dt);

    // ---- one-shot clip ----
    if (this.one && this.one.name === 'guardBreak' && f.brokenT <= 0) { this.one.hold = false; this.one.done = true; }
    if (this.one && this.one.name === 'qHitKnockback' && f.downT <= 0) this.one.done = true;
    let o = this.one;
    if (o) {
      // kicks: snap out, hang a beat at full extension, then a slower follow-through back to guard
      let w = 1;
      if (o.warp) { const r = o.t - Anim.clip(o.name).imp; w = r < 0 ? 1 : r < 0.09 ? 0.4 : 0.85; }
      o.t += dt * o.rate * w;
    }
    let oneW = 0;
    if (o) {
      if (!o.loop && o.t >= o.end && !o.hold) o.done = true;
      if (o.done && !o.followed && f.hp > 0 && f.stun <= 0 && f.punchT <= 0 && f.blastT <= 0) {
        if (o.name === 'qHook') {
          o.followed = true;
          this.play('qHookRecovery', { rate: 2.35, mask: this.UPPER, fadeIn: 0.065, fadeOut: 0.14 });
        } else if (o.name === 'qSlideStart' && f.skidT > 0.12 && !f.punchT && !f.flying) {
          o.followed = true;
          this.play('qSlideLoop', { from: 0.30, rate: 1.8, end: 0.9, fadeIn: 0.045, noH: true });
        }
      }
      o.w += ((o.done ? 0 : 1) - o.w) * Math.min(1, dt / (o.done ? o.fadeOut : o.fadeIn));
      if (o.done && o.w < 0.01) this.one = null;
      else { Anim.sample(o.name, Math.min(o.t, o.end), o.loop, this.shot); this.shape(o); oneW = o.w; }
    }
    let prevW = 0; const po = this.prevOne;
    if (po) {
      po.t += dt * po.rate; po.w -= dt / po.fadeOut;
      if (po.w <= 0.01) this.prevOne = null;
      else { Anim.sample(po.name, Math.min(po.t, po.end), po.loop, this.shotPrev || (this.shotPrev = Anim.pose())); prevW = po.w; }
    }
    this.prevW = prevW;
    // charging: the spell stance on the upper body, looped
    const chargeT = f.charging && f.stun <= 0 && !dying ? 1 : 0;
    this.chargeW = (this.chargeW || 0) + (chargeT - (this.chargeW || 0)) * damp(10, dt);
    if (this.chargeW > 0.01) { this.chargeT = (this.chargeT || 0) + dt; } else this.chargeT = 0;

    if (this.locoLeg < 0.001 && this.locoUp < 0.001 && oneW < 0.001 && this.prevW < 0.001 && this.airW < 0.01 && this.hoverW < 0.01 && this.chargeW < 0.01) return;
    this.apply(oneW);
    this.strikeTrail(dt);
  }
  apply(oneW) {
    const f = this.f, rig = this.rig, m = f.model, N = Anim.NB, out = this.out;
    // per-bone weight of the clip pose over the procedural one
    const wb = this._wb || (this._wb = new Float32Array(N));
    for (let i = 0; i < N; i++) wb[i] = this.UPPER[i] ? this.locoUp : this.locoLeg;
    Anim.copy(out, this.walk);
    // stack a layer: where nothing is playing yet it takes over fully, otherwise it blends in
    const layer = (P, w, mask, strength = 1, noH = false) => {
      for (let i = 0; i < N; i++) if (!mask || mask[i]) {
        const fresh = wb[i] <= 0.001;
        out.q[i].slerp(P.q[i], fresh ? 1 : w);
        if (i === 0 && !noH) { if (fresh) out.h.copy(P.h); else out.h.lerp(P.h, w); }
        wb[i] += (1 - wb[i]) * w * strength;
      }
    };
    const acrobatic = !!(f.acro && (f.acro.type === 'flip' || f.acro.type === 'airRoll' || f.acro.type === 'evade'));
    if (this.airW > 0.01 && !acrobatic) layer(Anim.sample('jumpAir', 0.6, false, this.tmp), this.airW, this.LOWER, 0.85);
    if (this.hoverW > 0.01 && !acrobatic) layer(
      Anim.sample('qNinjaHover', f.t * 0.85, true, this.tmp), this.hoverW * 0.42,
      this.LOWER, 0.55, true);
    if (this.chargeW > 0.01) {
      const grounded = !f.flying && !f.launched && !f.spiked, lv = f.chargeLevel;
      if (grounded && Math.hypot(f.vel.x, f.vel.z) < 3) layer(Anim.sample('jumpLand', Anim.CROUCH_T, false, this.tmp), this.chargeW * 0.26, this.LOWER, 0.4);
      const A = Anim.sample('charge', this.chargeT, true, this.tmp);
      this.tiltUpper(A, (Math.sin(f.t * 47) * 0.6 + Math.sin(f.t * 31) * 0.4) * 0.03 * lv - 0.05 * lv);
      layer(A, this.chargeW, this.ARMS, 0.6);
    }
    if (this.prevW > 0) layer(this.shotPrev, this.prevW, this.prevOne.mask, 1, this.prevOne.noH);
    if (oneW > 0) layer(this.shot, oneW, this.one.mask, this.one.name === 'qHook' ? 0.76 : 1, this.one.noH);
    // orient the clip with the procedural body: hips + legs follow the body (lean / strafe yaw), chest stays on target
    const yaw = f.hipYaw || 0;
    this.qy.setFromAxisAngle(_UP, -yaw);           // undo hip yaw for the torso
    // full-body clips (falls, recoils, get-up) carry their own tilt: drop the procedural lean so it isn't doubled
    const ori = this._ori || (this._ori = new THREE.Quaternion()), yq = this._yq || (this._yq = new THREE.Quaternion());
    yq.setFromAxisAngle(_UP, yaw);
    const fullW = oneW > 0 && !this.one.mask ? oneW : 0;
    ori.slerpQuaternions(m.body.quaternion, yq, fullW);
    for (let i = 0; i < N; i++) {
      const q = out.q[i];
      if (this.UPPER[i]) { this.qy2.slerpQuaternions(ID_Q, this.qy, i === this.spineI ? 0.5 : 1); q.premultiply(ori).premultiply(this.qy2); }
      else q.premultiply(ori);
    }
    // reset bones the procedural rig doesn't own, then blend world deltas -> local rotations
    for (const i of this.unset) if (this.nodes[i]) this.nodes[i].quaternion.identity();
    for (let i = 0; i < N; i++) {
      const node = this.nodes[i]; if (!node || wb[i] <= 0.001) continue;
      const pi = this.par[i];
      if (pi < 0) this.loc.copy(out.q[i]);
      else this.loc.copy(this.inv.copy(out.q[pi]).invert()).multiply(out.q[i]);
      node.quaternion.slerp(this.loc, Math.min(1, wb[i]));
    }
    // hip height follows the clip (so the planted foot stays on the floor)
    if (f.charging && !f.flying) out.h.y = Math.max(out.h.y, -0.075);
    const wh = Math.min(1, wb[0]) * (this.one && this.one.noH ? 1 - oneW : 1);
    if (wh > 0.001) {
      const hp = rig.b.hips.position, r = rig.hipsRest, hh = rig.hipRestY;
      hp.x += (r.x + out.h.x * hh - hp.x) * wh;
      hp.y += (r.y + out.h.y * hh - hp.y) * wh;
      hp.z += (r.z + out.h.z * hh - hp.z) * wh;
    }
  }
}
const _UP = new V3(0, 1, 0);

/* ---------------- Movement expression profiles (V34) ----------------
 * A fighter can supply a motionStyle ID independently from their attacks/abilities.
 * These profiles only alter how movement looks, not movement speed, physics, hitboxes,
 * targeting or action inputs. New characters can override profiles and animation clips.
 */
const MOTION_STYLES = Object.freeze({
  martial: Object.freeze({ flipChance: 0.38, minFlipSpeed: 8.0, dashLean: 0.55, landingBend: 0.48 }),
  agile: Object.freeze({ flipChance: 0.62, minFlipSpeed: 7.0, dashLean: 0.7, landingBend: 0.54 }),
  heavy: Object.freeze({ flipChance: 0, minFlipSpeed: 99, dashLean: 0.2, landingBend: 0.3 }),
});

/* ---------------- Fighter ---------------- */
class Fighter {
  constructor(name, pal, spawn) {
    this.name = name; this.pal = pal; this.spawn = spawn.clone();
    this.model = buildFighterModel(pal);
    // V37: no meteor, speed shell or glow geometry attached to movement.
    scene.add(this.model.root, this.model.blob);
    // charge orb held between the hands while charging a blast
    this.orb = Effects.sprite(TEX.glow, pal.ki, 1, 0.95); this.orbCore = Effects.sprite(TEX.glow, 0xffffff, 0.5, 1);
    this.orb.visible = this.orbCore.visible = false; scene.add(this.orb, this.orbCore);
    this.motionStyle = pal.motionStyle || 'martial';
    this.motionProfile = MOTION_STYLES[this.motionStyle] || MOTION_STYLES.martial;
    this.pos = new V3(); this.vel = new V3(); this.reset();
  }
  reset() {
    this.pos.copy(this.spawn); this.vel.set(0, 0, 0);
    this.facing = yawFromDir(-this.spawn.x, -this.spawn.z);
    this.model.root.rotation.y = this.facing;
    this.hp = 100; this.energy = 60;
    this.dashT = 0; this.dashCd = 0; this.dashWakeT = 0; this.dashDir = new V3(0, 0, 1);
    this.meleeCd = 0; this.blastCd = 0; this.awakenT = 0; this.awakenGauge = 0; this.awakenChargeT = 0; this.awakenChargeFxT = 0; this.awakenChargeProgress = 0; this.awakenRuptured = false; this.stun = 0;
    this.kickPend = null; this.punchT = 0; this.attackTotal = 0; this.attackElapsed = 0; this.punchSide = 0; this.attackKind = 'punch'; this.combo = 0; this.lastMelee = -9;
    this.attackSerial = (this.attackSerial || 0) + 1; this.riposteT = 0; this.meleeQ = 0; this.meleeBuf = 0; this.superHitT = 0;
    this.blastT = 0; this.hitFlash = 0; this.t = Math.random() * 10;
    this.moveIntent = new V3(); this.vert = 0; this.wasFlying = false; this.dustT = 0;
    this.lean = { pitch: 0, roll: 0 };
    this.acro = null; this.acroClock = 0; this.lastAcroAt = -20; this.landingVariant = 0;
    this.guard = TUNING.guardMax; this.guardDelay = 0; this.blockHeld = false; this.blocking = false; this.blockT = 0; this.parryOk = 0; this.guardCounterWindow = 0; this.guardHitBy = null;
    this.lastBlockEnd = -9; this.brokenT = 0; this.blockW = 0; this.windT = 0; this.windTarget = null; this.windLen = 0;
    this.vanishRecoverT = 0; this.launched = false; this.launchT = 0; this.juggle = 0; this.spiked = false; this.downT = 0; this.invulnT = 0; this.chase = null; this.vanishCd = 0; this.vanishT = 0; this.sprintHeld = false; this.sprinting = false; this.dashWasChase = false; this.sprintFx = 0; this.jumping = false; this.jumpHold = 0; this.slamming = false; this.slamWindT = 0; this.slamTarget = null; this.slamLagT = 0; this.tumble = 0;
    this.chargeHeld = false; this.charging = false; this.chargeT = 0; this.chargeTarget = null; this.chargeAim = 'target'; this.chargeFull = false; this.chargeFx = 0; this.chargeCracked = false; this.auraFxT = 0; this.runPh = 0; this.runW = 0; this.dashPrep = 0; this.skidT = 0; this.accF = 0; this.prevLz = 0; this.hipYaw = 0; this.strideDir = 1; this.flyW = 0; this.hurtT = 0; this.attackDrive = 0; this.attackMoving = false; this.attackTravel = new V3(0,0,1); this.attackAir = false; this.dashRecoverT = 0; this.sprintShakeT = 0;
  }
  // Cosmetic acrobatics: no displacement, hitbox changes, input lock or camera spin.
  // Real positions remain under the physics engine, not the animation layer.
  startAcro(type, duration, direction = 1) {
    if (!Settings.get('acrobatics') || this.hp <= 0 || this.stun > 0 || this.launched ||
        this.spiked || this.downT > 0 || this.blocking || this.charging ||
        this.punchT > 0 || this.slamming || this.slamLagT > 0) return;
    if (this.acro && this.acro.type === 'flip' && type !== 'landing') return;
    this.acro = { type, t: 0, duration, direction };
    this.lastAcroAt = this.t;
  }
  get dashing() { return this.dashT > 0; }
  get moving() { return this.dashT > 0 || this.sprinting; }   // dash or sprint: camera stays free
  get chargeLevel() { return this.charging ? clamp((this.chargeT - TUNING.chargeMin) / TUNING.chargeTime, 0, 1) : 0; }
  // break out of a juggle: costs energy, needs a moment after the launch
  tryRecover() {
    if (!this.launched || this.spiked || this.launchT < 0.35 || this.energy < TUNING.techCost) return false;
    this.energy -= TUNING.techCost;
    this.launched = false; this.stun = 0; this.juggle = 0; this.invulnT = 0.35;
    this.vel.copy(this.forward()).multiplyScalar(-8).setY(4);
    Effects.ring(this.center, 0xffffff, 1.8); Effects.flash(this.center, 0xffffff, 3, 0.12);
    Game.callout(this === Game.player ? 'Recover' : 'Rival recovered', 'parry');
    return true;
  }
  // is an attack from foe about to land on me? (a wind-up, a fresh swing, or a blast closing in)
  threatFrom(foe) {
    if (foe.windT > 0 && foe.windTarget === this) return true;
    if (foe.punchT > 0.06 && foe.pos.distanceTo(this.pos) < TUNING.meleeRange + 1.5) return true;
    for (const p of Combat.projectiles) if (p.owner === foe && p.mesh.position.distanceTo(this.center) < 9 && p.vel.dot(this.center.sub(p.mesh.position)) > 0) return true;
    return false;
  }
  // teleport dodge: vanish and reappear behind the rival; timed against an attack it's a perfect vanish
  tryVanish(foe, allowPerfect = true) {
    if (this.vanishCd > 0 || this.stun > 0 || this.launched || this.awakenChargeT > 0 || this.energy < (this.guardCounterWindow > 0 ? Math.max(6,TUNING.vanishCost-7) : TUNING.vanishCost)) return false;
    const guardEscape = this.guardCounterWindow > 0 && (!this.guardHitBy || this.guardHitBy === foe);
    const perfect = allowPerfect && this.threatFrom(foe);
    if (guardEscape) this.guardCounterWindow = 0;
    this.energy -= guardEscape ? Math.max(6, TUNING.vanishCost - 7) : TUNING.vanishCost;
    if (perfect) this.energy = Math.min(100, this.energy + TUNING.vanishRefund);
    const from = this.center;
    const flat = foe.pos.clone().sub(this.pos).setY(0); const d = flat.length();
    if (d > TUNING.vanishRange || d < 0.01) {
      // rival too far: short blink the way you're facing
      this.pos.addScaledVector(this.forward(), 8);
    } else {
      flat.divideScalar(d);
      this.pos.set(foe.pos.x + flat.x * TUNING.vanishBehind, foe.pos.y, foe.pos.z + flat.z * TUNING.vanishBehind);
    }
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > ARENA_RADIUS - 1) { const k = (ARENA_RADIUS - 1) / r; this.pos.x *= k; this.pos.z *= k; }
    this.pos.y = clamp(this.pos.y, this.floor, CEILING);
    this.facing = yawFromDir(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z);
    this.model.root.rotation.y = this.facing;
    this.vel.set(0, 0, 0); this.dashT = 0; this.chase = null; this.cancelCharge(); this.blocking = false;
    this.vanishT = TUNING.vanishHide; this.invulnT = Math.max(this.invulnT, TUNING.vanishInvuln);
    this.vanishCd = TUNING.vanishCooldown;
    this.acro = null; this.dashRecoverT = 0; this.skidT = 0;
    this.vanishRecoverT = 0.28; // visual arrival crouch before rising to guard
    Sound.play('vanish'); Effects.vanish(from, this.center, this.awakened ? this.pal.aura : this.pal.ki, perfect || guardEscape, this);
    if (perfect) {
      // they lose sight of you for a moment: their attack is cancelled and they're left open
      foe.windT = 0; foe.stun = Math.max(foe.stun, TUNING.vanishStun); foe.meleeCd = Math.max(foe.meleeCd, 0.3);
      Game.hitStop(0.12); CameraRig.shake(0.2);
      Game.callout(this === Game.player ? 'Perfect vanish' : 'Rival vanished', 'parry');
    } else if (guardEscape && this === Game.player) Game.callout('GUARD VANISH!', 'parry');
    else if (this !== Game.player) Game.callout('Rival vanished', 'parry');
    return true;
  }
  // tap Up on the ground: a quick hop; keep holding and it turns into flight
  tryJump() {
    if (this.flying || this.jumping || this.stun > 0 || this.slamming || this.slamLagT > 0) return false;
    this.jumping = true; this.jumpHold = 0; this.vel.y = TUNING.jumpVel;
    const speed = Math.hypot(this.vel.x, this.vel.z);
    // Only decorate confident sprinting jumps, not normal precision jumps or combat hops.
    const foe = this === Game.player ? Game.enemy : Game.player;
    const safe = !foe || this.pos.distanceTo(foe.pos) > 5;
    if (safe && this.sprinting && speed > this.motionProfile.minFlipSpeed &&
        Math.random() < this.motionProfile.flipChance && this.t - this.lastAcroAt > 1.2) {
      this.startAcro('flip', 0.64);
    }
    Effects.dust(this.pos, 5);
    return true;
  }
  // Down + Melee in the air: drop onto the floor and send out a shockwave
  trySlam(foe) {
    if (this.slamming || this.stun > 0 || this.meleeCd > 0 || this.launched || this.pos.y < this.floor + TUNING.slamMinHeight) return false;
    if (this.charging) this.cancelCharge();
    this.slamming = true; this.slamWindT = TUNING.slamWind; this.slamTarget = foe;
    this.sprinting = false; this.dashT = 0; this.chase = null; this.jumping = false; this.blocking = false;
    this.vel.set(0, 3, 0);
    return true;
  }
  cancelCharge() { this.charging = false; this.chargeT = 0; this.chargeFull = false; this.chargeCracked = false; }
  get awakened() { return this.awakenT > 0; }
  get floor() { return groundAt(this.pos.x, this.pos.z); }
  get flying() { return this.pos.y > this.floor + 0.25; }
  get center() { return new V3(this.pos.x, this.pos.y + 1.2, this.pos.z); }
  forward(out = new V3()) { return out.set(Math.sin(this.facing), 0, Math.cos(this.facing)); }

  // a dash starts with a quick crouch-and-push (prep), then bursts; chase dashes skip the prep to keep combos flowing
  tryDash(dir, prep = TUNING.dashPrep) {
    if (this.dashCd > 0 || this.stun > 0 || this.energy < TUNING.dashCost || this.dashPrep > 0) return false;
    this.energy -= TUNING.dashCost;
    this.dashDir.copy(dir).normalize();
    this.dashCd = TUNING.dashCooldown; this.skidT = 0;
    this._dashSide = Math.sin(this.facing) * this.dashDir.z - Math.cos(this.facing) * this.dashDir.x;
    this.facing = yawFromDir(this.dashDir.x, this.dashDir.z);
    if (prep > 0 && !this.flying) { this.dashPrep = prep; return true; }
    this.launchDash();
    return true;
  }
  launchDash() {
    this.dashPrep = 0; this.dashT = TUNING.dashTime; this.dashRecoverT = 0; this.sprinting = false;
    // Sideways dashes produce evasive footwork; aerial side dashes can roll.
    // Action remains entirely under the original dash movement code.
    const side = this._dashSide || 0;
    if (Math.abs(side) > 0.60 && !this.chase) {
      if (this.flying && this.pos.y > this.floor + 3.5) this.startAcro('airRoll', 0.46, Math.sign(side));
      else if (!this.flying) this.startAcro('evade', 0.38, Math.sign(side));
    }
    Sound.play('dash'); if (this === Game.player) CameraRig.shake(0.028); Spectacle.dashStart(this); CameraRig.shake(this === Game.player ? 0.085 : 0.045); this.dashWakeT = 0; if (!this.flying) Effects.dust(this.pos, 3);
  }
  // hold Run: start running straight away (no dash needed)
  startRun() {
    if (this.sprinting || this.stun > 0 || this.energy < TUNING.sprintMinEnergy || this.blocking || this.charging || this.punchT > 0 || this.launched) return false;
    this.sprinting = true; if (this === Game.player) CameraRig.shake(0.012); return true;
  }
  gainAwaken(amount) {
    if (this.hp <= 0 || this.awakened || this.awakenChargeT > 0) return;
    this.awakenGauge = clamp(this.awakenGauge + amount, 0, TUNING.awakenGaugeMax);
  }
  tryAwaken() {
    if (this.awakened || this.awakenChargeT > 0 || this.awakenGauge < TUNING.awakenGaugeMax ||
        this.hp <= 0 || this.stun > 0 || this.launched || this.spiked || this.downT > 0) return false;
    // Separate combat-earned meter: does not drain ki needed for dashing and blasts.
    this.awakenChargeT = TUNING.awakenChargeTime;
    this.awakenChargeProgress = 0;
    this.awakenChargeFxT = 0; this.awakenRuptured = false;
    this.sprinting = false; this.dashT = 0; this.dashPrep = 0; this.chase = null;
    this.skidT = 0; this.vel.set(0, 0, 0); this.acro = null;
    this.meleeQ = 0; this.meleeBuf = 0; this.kickPend = null; this.punchT = 0; this.windT = 0;
    this.cancelCharge(); this.chargeHeld = false; this.blockHeld = false; this.blocking = false;
    this.invulnT = Math.max(this.invulnT, TUNING.awakenChargeTime + 0.12);
    if (this.vrmRig && this.vrmRig.anim) this.vrmRig.anim.stop();
    Sound.play('awaken'); Effects.awakenIgnition(this);
    if (this === Game.player) Game.callout('POWER RISING', 'launch');
    return true;
  }
  // AI attacks wind up first so you can see them coming and block or parry
  windUp(target, len) { if (!target || this.pos.distanceTo(target.pos) > TUNING.meleeRange + 0.25 || this.windT > 0 || this.meleeCd > 0 || this.stun > 0) return; this.windT = this.windLen = len; this.windTarget = target; }
  update(dt) {
    this.t += dt;
    this.guardCounterWindow = Math.max(0, this.guardCounterWindow - dt);
    if (this.awakenChargeT > 0) {
      this.awakenChargeT = Math.max(0, this.awakenChargeT - dt);
      this.awakenChargeProgress = 1 - this.awakenChargeT / TUNING.awakenChargeTime;
      this.blockHeld = this.blocking = this.chargeHeld = false;
      this.sprinting = false; this.dashT = 0; this.chase = null; this.skidT = 0;
      this.meleeQ = 0; this.meleeBuf = 0; this.windT = 0;
      this.vel.multiplyScalar(1 - damp(24, dt));
      this.invulnT = Math.max(this.invulnT, 0.16);
      this.awakenChargeFxT -= dt;
      if (this.awakenChargeFxT <= 0) {
        this.awakenChargeFxT = Settings.get('quality') === 'low' ? 0.14 : 0.09;
        Effects.awakenCharge(this, this.awakenChargeProgress);
      }
      if (this.awakenChargeT <= 0) {
        this.awakenGauge = 0; this.awakenT = TUNING.awakenTime; this.auraFxT = 0;
        this.awakenChargeProgress = 0;
        Effects.awakenBurst(this); Sound.play('super');
        if (this === Game.player) Game.callout('AWAKENED!', 'launch');
      }
    }
    this.dashRecoverT = Math.max(0, this.dashRecoverT - dt); this.vanishRecoverT = Math.max(0, this.vanishRecoverT - dt);
    this.brokenT = Math.max(0, this.brokenT - dt); this.riposteT = Math.max(0, this.riposteT - dt);
    this.superHitT = Math.max(0, (this.superHitT || 0) - dt); this.downT = Math.max(0, this.downT - dt); this.vanishCd = Math.max(0, this.vanishCd - dt); this.vanishT = Math.max(0, this.vanishT - dt); this.slamLagT = Math.max(0, this.slamLagT - dt); this.invulnT = Math.max(0, this.invulnT - dt);
    if (this.launched) { this.launchT += dt; if (this.stun <= 0 && !this.spiked) { this.launched = false; this.juggle = 0; } }
    if (this.kickPend) {
      const k = this.kickPend; k.t -= dt;
      if (!k.swingPlayed && k.t < 0.085 && this.stun <= 0) {
        k.swingPlayed = true; Spectacle.swing(this, k.stage); Sound.play('swing');
      }
      if (this.stun > 0 || this.hp <= 0) { this.kickPend = null; this.combo = 0; this.meleeQ = 0; this.meleeBuf = 0; }
      else if (k.t <= 0) { this.kickPend = null; Combat.strike(this, k.target, k.kick, k.stage, k.counter); }
    }
    if (this.windT > 0) {
      if (this.stun > 0) this.windT = 0;
      else { this.windT -= dt; if (this.windT <= 0) { this.windT = 0; Combat.melee(this, this.windTarget); } }
    }
    // charged blast: hold to charge, release to fire; a quick tap fires a normal blast
    if (this.awakenChargeT <= 0 && this.chargeHeld && !this.charging && this.blastCd <= 0 && this.stun <= 0 && !this.dashing && this.energy >= TUNING.blastCost && this.windT <= 0) {
      this.charging = true; this.chargeT = 0; this.chargeFull = false; this.chargeCracked = false; this.pressureT = 0;
    }
    if (this.charging) {
      if (this.stun > 0 || this.dashing) this.cancelCharge();
      else if (!this.chargeHeld) {
        const lvl = this.chargeLevel; this.cancelCharge();
        Combat.blast(this, this.chargeTarget, this.chargeAim, lvl);
      } else {
        // you can only charge as far as your energy allows
        const maxLvl = clamp((this.energy - TUNING.blastCost) / TUNING.chargeCost, 0, 1);
        this.chargeT = Math.min(this.chargeT + dt, TUNING.chargeMin + TUNING.chargeTime * maxLvl);
        const lvl = this.chargeLevel;
        if (lvl >= 1 && !this.chargeFull) { this.chargeFull = true; Effects.chargeFull(this); }
        // Hybrid environment choreography: compressed air first, fractured flagstones
        // only in the last moments of a powerful ground charge.
        if (!this.flying && this.chargeT > 0.15) {
          this.pressureT -= dt;
          if (this.pressureT <= 0) { this.pressureT = 0.16; Effects.chargePressure(this, lvl); }
        }
        if (!this.chargeCracked && !this.flying && lvl >= 0.90) {
          this.chargeCracked = true; Effects.chargeFracture(this, 0.95);
          if (this === Game.player) CameraRig.shake(0.075);
        }
        this.chargeFx -= dt;
        if (this.chargeT > 0.12 && this.chargeFx <= 0) { this.chargeFx = 0.05; Effects.chargeSpark(this, this.orb.position, lvl); }
      }
    }
    // guard: hold to block; a fresh block (not spammed) gets a short parry window
    const canBlock = this.blockHeld && !this.charging && this.stun <= 0 && !this.dashing && this.punchT <= 0 && this.blastT <= 0 && this.windT <= 0 && this.guard > 0;
    if (canBlock && !this.blocking) { this.blockT = 0; this.parryOk = this.t - this.lastBlockEnd > 0.35 ? TUNING.parryWindow : 0; }
    if (!canBlock && this.blocking) this.lastBlockEnd = this.t;
    this.blocking = canBlock;
    if (this.blocking) this.blockT += dt;
    else { this.guardDelay -= dt; if (this.guardDelay <= 0) this.guard = Math.min(TUNING.guardMax, this.guard + TUNING.guardRegen * dt); }
    this.dashCd = Math.max(0, this.dashCd - dt); this.meleeCd = Math.max(0, this.meleeCd - dt);
    this.blastCd = Math.max(0, this.blastCd - dt); this.stun = Math.max(0, this.stun - dt);
    this.punchT = Math.max(0, this.punchT - dt); if (this.punchT > 0) this.attackElapsed += dt; this.blastT = Math.max(0, this.blastT - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.awakenT > 0) this.awakenT = Math.max(0, this.awakenT - dt);
    this.energy = Math.min(100, this.energy + TUNING.energyRegen * dt);
    this.attackDrive += (0 - this.attackDrive) * damp(7, dt);

    const speedMul = this.awakened ? TUNING.awakenSpeed : 1;
    // sprint / fast flight: keep holding Dash after the dash to keep going fast
    if (this.sprinting && (!this.sprintHeld || this.stun > 0 || this.blockHeld || this.charging || this.punchT > 0 || this.blastT > 0 || this.windT > 0 || this.launched || this.energy <= 0)) {
      this.sprinting = false; this.vel.multiplyScalar(0.75);
      if (!this.flying && this.stun <= 0 && Math.hypot(this.vel.x, this.vel.z) > 9 && this.punchT <= 0) this.skidT = TUNING.skidTime;
    }
    // Restore held Boost once an attack's recovery ends (important for fast aerial combos).
    if (!this.sprinting && this.sprintHeld && this.dashT <= 0 && this.dashPrep <= 0 &&
        this.stun <= 0 && this.punchT <= 0 && this.meleeCd <= 0.07 &&
        this.blastT <= 0 && !this.charging && !this.blockHeld && !this.launched &&
        this.energy >= TUNING.sprintMinEnergy && (this.moveIntent.lengthSq() > 0.04 || this.vert !== 0)) {
      this.sprinting = true;
    }
    const drain = this.sprinting ? (this.flying ? TUNING.sprintDrainAir : TUNING.sprintDrainGround) : 0;
    if (drain) this.energy = Math.max(0, this.energy - (drain + TUNING.energyRegen) * dt);   // no regen while sprinting
    if (this.slamming && this.stun > 0) this.slamming = false;
    if (this.slamming) {
      // short hang in the air, then straight down, drifting toward the rival if they're close
      if (this.slamWindT > 0) { this.slamWindT -= dt; this.vel.multiplyScalar(1 - damp(10, dt)); }
      else {
        const t = this.slamTarget, h = Math.max(0.5, this.pos.y - this.floor);
        let hx = 0, hz = 0;
        if (t) { const dx = t.pos.x - this.pos.x, dz = t.pos.z - this.pos.z, d = Math.hypot(dx, dz);
          if (d < 9 && d > 1.4) { const sp = Math.min(25, (d - 1.2) / (h / TUNING.slamSpeed)); hx = dx / d * sp; hz = dz / d * sp; this.facing = yawFromDir(dx, dz); } }
        this.vel.set(hx, -TUNING.slamSpeed, hz);
        if (Math.random() < 0.6) Effects.sprintTrail(this);
      }
    } else if (this.slamLagT > 0) {
      this.vel.multiplyScalar(1 - damp(12, dt));
    } else if (this.dashPrep > 0) {
      // coil: plant the feet and load up, then burst
      this.vel.multiplyScalar(1 - damp(14, dt));
      this.dashPrep -= dt;
      if (this.stun > 0) this.dashPrep = 0; else if (this.dashPrep <= 0) this.launchDash();
    } else if (this.skidT > 0 && !this.sprinting) {
      // braking: feet dig in and slide to a stop
      this.skidT -= dt;
      this.vel.x *= 1 - damp(7, dt); this.vel.z *= 1 - damp(7, dt);
      if (Math.random() < 0.5) Effects.dust(this.pos, 1);
    } else if (this.dashT > 0) {
      this.dashWakeT -= dt;
      if (this.dashWakeT <= 0) { this.dashWakeT = 0.055; Spectacle.dashWake(this); }
      this.dashT = Math.max(0, this.dashT - dt);
      // fast burst that eases off, so the dash flows back into normal movement
      const prog = this.dashT / TUNING.dashTime;
      // chase dash: home in on a launched rival and stop just in front of them
      if (this.chase) {
        const to = this.chase.center.sub(this.center); const d = to.length();
        if (d < 1.9 || !this.chase.launched) { this.dashT = 0; this.vel.multiplyScalar(0.08); this.chase = null; }
        else { this.dashDir.copy(to.divideScalar(d)); this.facing = yawFromDir(this.dashDir.x, this.dashDir.z); }
      }
      if (this.dashT > 0) this.vel.copy(this.dashDir).multiplyScalar(TUNING.dashSpeed * speedMul * (this.chase ? 1.15 : 0.6 + 0.8 * prog));
      if (this.dashT <= 0) {
        if (this.sprintHeld && !this.chase && !this.dashWasChase && this.stun <= 0 && this.energy >= TUNING.sprintMinEnergy) this.sprinting = true;
        else if (!this.chase) { this.vel.multiplyScalar(0.58); this.skidT = 0; this.dashRecoverT = 0.28; }
        this.chase = null;
      }
    } else if (this.sprinting) {
      // steer with the stick; with no input keep going the way you face. Up/Down climbs and dives
      const dir = this.moveIntent.lengthSq() > 0.02 ? this.moveIntent.clone().setY(0).normalize() : this.forward();
      const sp = (this.flying || this.vert ? TUNING.flySprintSpeed : TUNING.sprintSpeed) * speedMul;
      const target = dir.multiplyScalar(sp); target.y = this.vert * sp * 0.75;
      this.vel.lerp(target, damp(TUNING.sprintTurn, dt));
      const hv = Math.hypot(this.vel.x, this.vel.z);
      if (hv > 2) this.facing = lerpAngle(this.facing, yawFromDir(this.vel.x, this.vel.z), damp(8, dt));
      this.sprintFx -= dt;
      if (this.sprintFx <= 0) { this.sprintFx = this.flying ? 0.07 : 0.075; this.flying ? Spectacle.flightWake(this) : Effects.dust(this.pos, 2); }
      if (this === Game.player && this.energy > 2 && Math.hypot(this.vel.x, this.vel.z) > 18) {
        this.sprintShakeT -= dt;
        if (this.sprintShakeT <= 0) { this.sprintShakeT = 0.38; CameraRig.shake(0.035); }
      }
    } else if (this.punchT > 0 && this.stun <= 0 && !this.launched && !this.spiked) {
      // Contact-synced footwork, not a permanent sliding locomotion velocity.
      // Quick first third: enter with a visible planted step. Contact and recovery: brake.
      const p = clamp(this.attackElapsed / Math.max(0.001, this.attackTotal), 0, 1);
      const contact = this.attackKind === 'kick' || this.attackKind === 'airStrike' ? 0.47 : this.attackKind === 'hook' ? 0.48 : 0.42;
      const impulse = Math.pow(Math.sin(Math.PI * Math.min(1, p / Math.max(0.1, contact))), 2) * (1 - smooth01(p / (contact + 0.15)) * 0.35);
      const travel = this.attackTravel && this.attackTravel.lengthSq() > 0.01 ? this.attackTravel.clone().setY(0).normalize() : this.forward();
      const hsp = (this.attackAir ? 8.2 : 5.8) * (this.attackMoving ? 1 : 0.48);
      const targetH = hsp * impulse;
      // Sufficient deceleration for a real planted strike even if the fighter approached at sprint speed.
      const response = damp(p >= contact ? 28 : 20, dt);
      this.vel.x += (travel.x * targetH - this.vel.x) * response;
      this.vel.z += (travel.z * targetH - this.vel.z) * response;
      if (this.attackAir) {
        const yInput = this.vert * 2.2;
        this.vel.y += (yInput - this.vel.y) * damp(p >= contact ? 22 : 12, dt);
      } else this.vel.y = 0;
      // A moving strike faces its actual step, not the previous frame's run direction.
      if (impulse > 0.12) this.facing = lerpAngle(this.facing, yawFromDir(travel.x, travel.z), damp(12, dt));
    } else if (this.awakenChargeT > 0) {
      this.vel.multiplyScalar(1 - damp(28, dt));
    } else if (this.stun > 0) {
      if (this.spiked) { /* falling fast: keep the smash velocity */ }
      else if (this.launched) { this.vel.x *= 1 - damp(3, dt); this.vel.z *= 1 - damp(3, dt); this.vel.y = this.vel.y * (1 - damp(1.5, dt)) - 16 * dt; }
      else this.vel.multiplyScalar(1 - damp(4, dt));
    } else {
      const target = this.moveIntent.clone().multiplyScalar((this.flying ? TUNING.moveSpeed : TUNING.walkSpeed) * speedMul * (this.blocking ? TUNING.blockMove : this.charging ? TUNING.chargeMove : 1));
      target.y = this.vert * TUNING.flySpeed * speedMul;
      if (this.jumping) {
        // jump arc: gravity pulls you down unless you keep holding Up, which turns it into flight
        if (this.vert > 0) this.jumpHold += dt;
        if (this.jumpHold > TUNING.jumpToFly) { this.jumping = false; }
        else {
          const vy = this.vel.y - TUNING.gravity * (this.vert < 0 ? 1.8 : 1) * dt;
          target.y = vy; this.vel.y = vy;
        }
      }
      // reversing hard at speed: plant and skid before heading the other way
      const hv0 = Math.hypot(this.vel.x, this.vel.z);
      if (!this.flying && hv0 > 7.5 && this.moveIntent.lengthSq() > 0.3 && (this.vel.x * this.moveIntent.x + this.vel.z * this.moveIntent.z) / hv0 < -0.45) this.skidT = TUNING.skidTime * 0.8;
      // build up speed with some weight, stop a little quicker; floatier in the air
      const speedingUp = target.lengthSq() > this.vel.lengthSq() * 0.9;
      const rate = (speedingUp ? TUNING.accel : TUNING.decel) * (this.flying ? TUNING.airControl : 1);
      this.vel.lerp(target, damp(rate, dt));
    }
    this.pos.addScaledVector(this.vel, dt);
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > ARENA_RADIUS - 1) { const k = (ARENA_RADIUS - 1) / r; this.pos.x *= k; this.pos.z *= k; }
    const floor = this.floor;
    this.pos.y = clamp(this.pos.y, floor, CEILING);
    if (this.pos.y === floor && this.vel.y < 0 && this.slamming) {
      this.slamming = false; this.slamLagT = TUNING.slamLag; this.meleeCd = Math.max(this.meleeCd, 0.35);
      this.vel.set(0, 0, 0); this.attackKind = 'slam'; this.punchT = 0.2;
      Effects.groundSlam(this.pos); CameraRig.shake(this === Game.player ? 0.5 : 0.35);
      if (this.slamTarget) Combat.slam(this, this.slamTarget);
    }
    if (this.pos.y === floor && this.jumping && this.vel.y <= 0) { this.jumping = false; }
    if (this.pos.y === floor && this.vel.y < 0) {
      // a smashed fighter hits the floor hard and stays down for a moment
      if (this.spiked) {
        this.spiked = false; this.launched = false; this.juggle = 0;
        this.downT = TUNING.downTime; this.stun = TUNING.downTime + 0.15;
        Effects.groundSlam(this.pos); CameraRig.shake(0.55); Game.hitStop(0.06);
        this.vel.set(this.vel.x * 0.2, 0, this.vel.z * 0.2);
      } else if (this.launched) { this.launched = false; this.juggle = 0; this.downT = 0.45; this.stun = Math.max(this.stun, 0.5); Effects.dust(this.pos, 6); this.vel.y = 0; }
      else this.vel.y = 0;
    }
    // landing dust / ground-dash dust
    const flying = this.flying;
    if (this.wasFlying && !flying) {
      Effects.dust(this.pos, 6);
      const speed = Math.hypot(this.vel.x, this.vel.z);
      if (!this.launched && !this.spiked && !this.slamming && this.stun <= 0 && this.hp > 0) {
        this.landingVariant = (this.landingVariant + 1) % 3;
        this.startAcro('landing', speed > 9 ? 0.42 : 0.30, this.landingVariant === 0 ? -1 : 1);
      }
    }
    this.wasFlying = flying;
    this.dustT -= dt;
    if (this.dashing && this.pos.y < floor + 1.2 && this.dustT <= 0) { Effects.dust(this.pos, 2); this.dustT = 0.05; }
    this.animate(dt);
    if (this.awakened) {
      this.auraFxT -= dt;
      if (this.auraFxT <= 0) {
        this.auraFxT = Settings.get('quality') === 'low' ? 0.14 : 0.078;
        Effects.bodyAura(this); // tracked to moving arms/head/legs, not a full-body bubble
      }
    }
  }

  /* ---- animation ---- */
  animate(dt) {
    this.animateRig(dt);
    if (this.vrmRig) this.vrmRig.update(dt);
  }
  animateRig(dt) {
    const m = this.model, root = m.root, body = m.body;
    const flying = this.flying;
    root.position.set(this.pos.x, this.pos.y, this.pos.z);
    root.visible = this.vanishT <= 0;
    root.rotation.y = lerpAngle(root.rotation.y, this.facing, damp(this.dashing ? 22 : 13, dt));

    // velocity in the fighter's own frame: lz = forward, lx = toward its left (+X local)
    const yaw = root.rotation.y;
    const lz = this.vel.x * Math.sin(yaw) + this.vel.z * Math.cos(yaw);
    const lx = this.vel.x * Math.cos(yaw) - this.vel.z * Math.sin(yaw);
    const hspeed = Math.hypot(this.vel.x, this.vel.z);

    // lean is relative to the body, so it always tips toward the direction of travel
    let pitchT, rollT;
    const fastFly = this.sprinting && flying;
    // forward acceleration (smoothed): lean in when speeding up, sit back when braking — gives the body weight
    const aF = dt > 0 ? (lz - this.prevLz) / dt : 0; this.prevLz = lz;
    this.accF += (clamp(aF, -60, 60) - this.accF) * damp(8, dt);
    // turn rate of the travel direction: bank into curves when running fast
    const hd = Math.atan2(this.vel.x, this.vel.z);
    let dh = hspeed > 3 && this.prevHd != null ? hd - this.prevHd : 0; this.prevHd = hd;
    dh = ((dh + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    this.turnR = (this.turnR || 0) + (clamp(dt > 0 ? dh / dt : 0, -6, 6) - (this.turnR || 0)) * damp(8, dt);
    const bank = clamp(-this.turnR * hspeed / 70, -0.26, 0.26);
    if (this.dashPrep > 0) { pitchT = 0.32; rollT = 0; }
    else if (this.skidT > 0 && !flying) { pitchT = 0.12; rollT = 0; }
    else if (this.slamming) { pitchT = this.slamWindT > 0 ? -0.2 : 0.35; rollT = 0; }
    else
    if (this.dashing && !flying) { pitchT = 0.16; rollT = bank; }
    else if (this.dashing || fastFly) {
      // Controlled powered flight: upper body still faces travel direction instead
      // of tipping nearly horizontal like a falling meteor.
      pitchT = fastFly ? clamp(0.50 - this.vel.y / 100, 0.30, 0.70) : 0.48;
      rollT = clamp(-lx / 30, -0.24, 0.24);
    }
    else if (this.sprinting) { pitchT = 0.22; rollT = bank * 1.18; }
    else if (this.dashRecoverT > 0) { pitchT = 0.08 + 0.13 * smooth01(this.dashRecoverT / 0.28); rollT = bank * 0.35; }
    else if (this.downT > 0) { pitchT = -1.45; rollT = 0.1; }
    else if (this.spiked) { pitchT = -1.2; rollT = 0; }
    else if (this.launched) { pitchT = this.superHitT > 0 ? -0.34 : -0.75 + Math.sin(this.launchT * 7) * 0.15; rollT = Math.sin(this.launchT * 5) * 0.2; }
    else if (this.stun > 0) { pitchT = -0.45; rollT = 0; }
    else if (flying) { pitchT = clamp(lz / 18, -0.35, 0.85); rollT = clamp(-lx / 22, -0.45, 0.45); }
    else { const rnL = smooth01((hspeed - 1.5) / 9); pitchT = (0.13 + clamp(lz / 100, -0.11, 0.11) + (this.stun > 0 ? 0 : clamp(this.accF / 160, -0.14, 0.16))) * rnL; rollT = clamp(-lx / 65, -0.19, 0.19) * rnL; }
    if (this.sprinting && !flying) pitchT += clamp(this.accF / 200, -0.1, 0.12);
    if (this.punchT > 0 && this.attackKind === 'kick') pitchT = 0.06;
    if (this.punchT > 0 && this.attackAir) pitchT = 0.14;
    if (this.slamLagT > 0) pitchT = 0.35;
    this.lean.pitch += (pitchT - this.lean.pitch) * damp(this.downT > 0 || this.launched ? 12 : this.dashRecoverT > 0 ? 13 : 8, dt);
    this.lean.roll += (rollT - this.lean.roll) * damp(6, dt);
    body.rotation.x = this.lean.pitch; body.rotation.z = this.lean.roll;
    // Independent visual motion track; every pose has easing and can be cancelled by combat.
    if (this.acro) {
      const A = this.acro;
      if (!Settings.get('acrobatics') || this.hp <= 0 || this.stun > 0 || this.blockHeld ||
          this.charging || this.punchT > 0 || this.slamming || this.spiked || this.launched) {
        this.acro = null;
      } else {
        A.t += dt;
        if (A.t >= A.duration) this.acro = null;
      }
    }
    const ac = this.acro;
    const acP = ac ? clamp(ac.t / ac.duration, 0, 1) : 0;
    const acEnv = ac ? Math.sin(Math.PI * acP) : 0;
    if (ac) {
      if (ac.type === 'flip' && this.flying) {
        // A complete flip; orientation returns to neutral without a hard snap.
        body.rotation.x += TAU * smooth01(acP);
      } else if (ac.type === 'airRoll' && this.flying) {
        body.rotation.z += ac.direction * TAU * smooth01(acP);
      } else if (ac.type === 'evade') {
        body.rotation.z += ac.direction * this.motionProfile.dashLean * acEnv;
        // Hip swivel is applied after the locomotion yaw below.
      } else if (ac.type === 'landing') {
        body.rotation.x += 0.25 * acEnv;
        body.rotation.z += ac.direction * 0.09 * acEnv;
      }
    }
    // run cycle locked to distance: longer strides at speed, quick steps when slow, so feet don't skate
    const stepLen = hspeed < 5 ? 0.55 + 0.19 * hspeed : Math.min(3.0, 1.5 + 0.075 * (hspeed - 5));
    this.stepLen = stepLen;
    this.runPh += hspeed / stepLen * Math.PI * dt;
    // hips turn toward the way you're actually moving (strafing / turning), chest stays on target
    let yawT = 0, dirT = 1;
    if (!flying && hspeed > 1.5 && !this.sprinting && !this.dashing) {
      let a = Math.atan2(lx, lz);
      if (Math.abs(a) > 1.95) { dirT = -1; a = a > 0 ? a - Math.PI : a + Math.PI; }   // backpedal
      yawT = clamp(a, -1.0, 1.0) * 0.85;
    }
    this.hipYaw += (yawT - this.hipYaw) * damp(10, dt);
    this.strideDir += (dirT - this.strideDir) * damp(10, dt);
    body.rotation.y = this.hipYaw;
    const runTarget = flying || this.dashing || this.dashPrep > 0 || this.skidT > 0 || this.punchT > 0 || (this.sprinting && flying) ? 0 : smooth01((hspeed - 0.12) / 1.0);
    this.runW += (runTarget - this.runW) * damp(10, dt);
    this.flyW += ((flying ? 1 : 0) - this.flyW) * damp(8, dt);
    const rw = this.runW, fw = this.flyW;
    const bounce = Math.abs(Math.sin(this.t * 3.6)) * 0.013;               // light boxer's bounce in stance
    // smooth body rise and fall per step (no sharp bounce); a walk barely bobs, a run bobs a bit more
    const runness = smooth01((hspeed - 5) / 9);
    const stepBob = (0.5 + 0.5 * Math.cos(2 * this.runPh)) * (0.009 + 0.024 * runness) - 0.02 * runness;
    const hover = Math.sin(this.t * 2.4) * 0.08;
    const groundY = 1.0 - 0.14 * (1 - rw) - 0.045 * rw * runness + bounce * (1 - rw) + stepBob * rw;   // knees bent in stance
    this.blockW += ((this.blocking ? 1 : 0) - this.blockW) * damp(22, dt);
    body.position.y = groundY * (1 - fw) + (1.0 + hover) * fw - 0.06 * this.blockW * (1 - fw);
    // Add clearance during a flip; tuck to absorb a landing or sidestep.
    if (ac && ac.type === 'flip' && this.flying) body.position.y += 0.25 * acEnv;
    if (ac && ac.type === 'landing') body.position.y -= this.motionProfile.landingBend * acEnv;
    if (ac && ac.type === 'evade') body.position.y -= 0.12 * acEnv;
    if (!flying) body.position.y -= this.dashPrep > 0 ? 0.14 : this.skidT > 0 && !this.sprinting && !this.dashing ? 0.08 : 0;
    // lying on the floor after a smash
    this.downW = (this.downW || 0) + ((this.downT > 0 ? 1 : 0) - (this.downW || 0)) * damp(14, dt);
    body.position.y += (0.32 - body.position.y) * this.downW;
    if (this.launched || this.downT > 0) body.position.y = this.downT > 0 ? body.position.y : 1.0;

    // poses: arm = [shoulderX, shoulderZ(out), elbowX], leg = [hipX, kneeX, hipZ(out)]; index 1 is the lead (left) side
    const stance = () => {
      const br = Math.sin(this.t * 2) * 0.04, sway = Math.sin(this.t * 1.3) * 0.04;
      // Ninja guard: low asymmetrical base, elbows tucked and hands shielding the face.
      // Subtle shifting weight keeps the character alive without idle foot-skating.
      const weight = Math.sin(this.t * 1.65) * 0.045;
      return { arm: [[-0.92 + br, 0.28, -1.85], [-1.18 - br, 0.16, -1.82]],
               leg: [[0.46 + weight, 0.73, 0.23], [-0.54 - weight, 0.76, 0.19]], spineY: -0.35 + sway, spineX: 0.24, headX: -0.11 };
    };
    const run = () => {
      // knee folds most while the leg swings through (heel up under the hip), stays softly bent on the ground
      // stride angle matches the step length, so each foot covers exactly the ground travelled (no gliding)
      const ph = this.strideDir > 0 ? this.runPh : -this.runPh, sn = Math.sin(ph);   // backpedal runs the cycle in reverse
      const fold = x => Math.max(0, Math.sin(x - 4.4));
      const rn = smooth01((hspeed - 5) / 9);                                    // 0 = walking, 1 = running
      const A = Math.min(0.75, Math.asin(Math.min(1, (this.stepLen || 1) / 1.9))) * (0.45 + 0.55 * smooth01(hspeed / 1.2));
      const kf = 0.7 + 0.75 * rn, kb = 0.06 + 0.19 * rn, sw = 0.75 + 0.25 * rn;   // walk: swing knee lifts, standing leg nearly straight
      const armA = A * (0.35 + 0.48 * rn), elb = -1.0 - 0.52 * rn;               // walk: relaxed arms, run: bent and pumping
      return { arm: [[sn * armA - 0.5 - 0.15 * rn, 0.19 + 0.06 * rn, elb], [-sn * armA - 0.55 - 0.13 * rn, 0.2 + 0.05 * rn, elb]],
               leg: [[-sn * A - 0.19 * rn, (kb + fold(ph) * kf) * sw + 0.13 * rn, 0.08 + 0.04 * rn], [sn * A - 0.19 * rn, (kb + fold(ph + Math.PI) * kf) * sw + 0.13 * rn, 0.08 + 0.04 * rn]],
               spineY: -sn * (0.09 + 0.11 * rn), spineX: 0.17 + 0.12 * rn, headX: -0.14 - 0.08 * rn };
    };
    const flyIdle = () => {
      const s2 = Math.sin(this.t * 2.4) * 0.06;
      return { arm: [[-0.25, 0.5, -1.25], [-0.55, 0.38, -1.15]], leg: [[0.1 - s2, 0.55, 0.12], [-0.85 + s2, 1.35, 0.06]],
               spineY: -0.3, spineX: 0.08, headX: 0 };
    };
    const flyFwd = () => ({ arm: [[0.55, 0.2, -0.35], [-1.0, 0.1, -1.2]], leg: [[0.2, 0.45, 0.04], [0.05, 0.2, 0.04]], spineY: 0, spineX: 0, headX: -0.55 });
    const flyBack = () => ({ arm: [[-0.3, 0.55, -1.2], [-0.3, 0.55, -1.2]], leg: [[-0.55, 0.9, 0.12], [-0.35, 0.7, 0.12]], spineY: 0, spineX: 0.2, headX: 0.15 });
    const mix = (a, b, w) => ({
      arm: a.arm.map((x, i) => x.map((v, j) => v + (b.arm[i][j] - v) * w)),
      leg: a.leg.map((x, i) => x.map((v, j) => v + (b.leg[i][j] - v) * w)),
      spineY: a.spineY + (b.spineY - a.spineY) * w, spineX: a.spineX + (b.spineX - a.spineX) * w, headX: a.headX + (b.headX - a.headX) * w });

    let P;
    if (this.slamming) {
      // both fists raised overhead, then driven down for the landing
      P = this.slamWindT > 0
        ? { arm: [[-2.9, 0.15, -0.6], [-2.9, 0.15, -0.6]], leg: [[-0.9, 1.5, 0.12], [-0.9, 1.5, 0.12]], spineY: 0, spineX: -0.3, headX: 0.2 }
        : { arm: [[-0.6, 0.1, -0.2], [-0.6, 0.1, -0.2]], leg: [[-0.4, 0.5, 0.15], [-0.2, 0.3, 0.15]], spineY: 0, spineX: 0.5, headX: -0.3 };
    } else if (this.jumping && flying) {
      // hop: knees tucked going up, legs reaching for the floor coming down
      const up = this.vel.y > 0;
      P = { arm: [[-0.7, 0.55, -1.4], [-0.9, 0.45, -1.5]], leg: up ? [[-1.1, 1.7, 0.12], [-0.7, 1.3, 0.1]] : [[-0.45, 0.6, 0.12], [-0.2, 0.35, 0.1]], spineY: -0.2, spineX: 0.1, headX: 0.05 };
    } else if (this.dashPrep > 0) {
      // dash wind-up: sink low, load the back leg, arms pulled back
      P = { arm: [[0.65, 0.38, -0.72], [0.75, 0.28, -0.8]], leg: [[0.75, 1.25, 0.26], [-0.91, 1.48, 0.22]], spineY: -0.18, spineX: 0.48, headX: -0.32 };
    } else if (this.dashRecoverT > 0 && !this.dashing && !this.sprinting && !flying) {
      const t = smooth01(1 - this.dashRecoverT / 0.28);
      const G = stance(), R = run(); P = mix(R, G, t); P.spineX = 0.19; P.headX = -0.12;
      P.leg = mix(R, G, Math.min(1, t * 0.92 + 0.08)).leg;
    } else if (this.skidT > 0 && !flying && !this.sprinting && !this.dashing) {
      // braking: lead leg braced out front, weight back, arms out for balance
      P = { arm: [[-0.82, 0.52, -1.18], [-0.58, 0.62, -1.02]], leg: [[0.28, 0.92, 0.20], [-0.62, 0.54, 0.18]], spineY: 0.12, spineX: 0.02, headX: 0.04 };
    } else if (this.sprinting && flying) {
      // Boosted aerial travel: relaxed martial-arts flight posture, not a dive.
      P = { arm: [[-0.2, 0.28, -1.05], [-0.95, 0.20, -0.85]], leg: [[0.05, 0.38, 0.06], [-0.25, 0.66, 0.06]], spineY: 0.08, spineX: 0.20, headX: -0.12 };
    } else if (this.sprinting) {
      // ground sprint: long strides, arms swept back
      // athletic sprint: upright chest, strong arm pump, long strides (no arms-back lean)
      const r = run(); r.arm = r.arm.map((a,i) => [0.55 + 0.17 * Math.sin(this.runPh + i * Math.PI), 0.22, -0.65]); r.leg = r.leg.map(l => [l[0] * 1.24, l[1] * 1.16, l[2]]); r.headX = -0.24; r.spineX = 0.31;
      P = r;
    } else if (this.dashing && !flying) {
      // ground dash: a burst of running, same upright form as the sprint
      const r = run(); r.arm = r.arm.map((a,i) => [0.55 + 0.17 * Math.sin(this.runPh + i * Math.PI), 0.22, -0.65]); r.leg = r.leg.map(l => [l[0] * 1.24, l[1] * 1.16, l[2]]); r.headX = -0.24; r.spineX = 0.31;
      P = r;
    } else if (this.dashing) {
      // Power-dash pose: streamlined but upright enough to look purposeful.
      P = { arm: [[-0.2, 0.25, -1.15], [-1.05, 0.18, -0.95]], leg: [[0.15, 0.45, 0.06], [-0.25, 0.62, 0.06]], spineY: 0.08, spineX: 0.26, headX: -0.16 };
    } else if (this.brokenT > 0) {
      // guard broken: arms flung open, staggering
      const w = Math.sin(this.t * 9) * 0.15;
      P = { arm: [[-0.3, 1.3, -0.3], [-0.3, 1.3, -0.3]], leg: [[-0.3 + w, 0.5, 0.15], [0.2 - w, 0.35, 0.15]], spineY: w, spineX: -0.35, headX: -0.45 };
    } else if (this.downT > 0) {
      P = { arm: [[-0.2, 1.1, -0.3], [-0.4, 0.8, -0.6]], leg: [[-0.15, 0.35, 0.18], [-0.45, 0.9, 0.12]], spineY: 0.1, spineX: 0, headX: 0.25 };
    } else if (this.superHitT > 0 && this.stun > 0) {
      // Heavy blast recoil: compact airborne tumble/recoil instead of a standing hit flash.
      const phase = 1 - this.superHitT / 0.82;
      const wobble = Math.sin(phase * 10) * (1 - phase) * 0.18;
      P = { arm: [[-2.1, 0.68, -0.58], [-2.0, 0.68, -0.62]],
        leg: [[-0.48 + wobble, 1.15, 0.18], [-0.58 - wobble, 1.18, 0.15]],
        spineY: wobble, spineX: -0.24, headX: -0.32 };
    } else if (this.launched || this.spiked) {
      // tumbling through the air
      const fl = Math.sin(this.launchT * 9) * 0.3;
      P = { arm: [[-2.4 + fl, 0.7, -0.4], [-2.2 - fl, 0.6, -0.5]], leg: [[-0.6 - fl, 0.9, 0.2], [0.1 + fl, 0.4, 0.2]], spineY: 0, spineX: -0.3, headX: -0.4 };
    } else if (this.stun > 0) {
      P = { arm: [[-0.6, 0.9, -0.4], [-0.6, 0.9, -0.4]], leg: [[-0.4, 0.6, 0.12], [0.1, 0.3, 0.12]], spineY: 0, spineX: -0.25, headX: -0.35 };
    } else {
      const ground = mix(stance(), run(), rw);
      const fz = clamp(lz / 12, -1, 1);
      const air = fz >= 0 ? mix(flyIdle(), flyFwd(), smooth01(fz)) : mix(flyIdle(), flyBack(), smooth01(-fz));
      P = mix(ground, air, fw);
      // Controlled lateral footwork: crossed arm guard, asymmetric sliding steps.
      if (!flying && hspeed > 1.5 && Math.abs(lx) > Math.abs(lz) * 0.8) {
        const lateral = smooth01((Math.abs(lx) - Math.abs(lz) * 0.8) / 8) * (1 - smooth01((hspeed - 13) / 8));
        const side = Math.sign(lx) || 1;
        const slide = { arm: [[-1.05, 0.28, -1.65], [-1.3, 0.15, -1.9]],
          leg: [[0.23 + 0.15 * Math.sin(this.runPh), 0.82, 0.3], [-0.38 - 0.12 * Math.sin(this.runPh), 0.78, 0.27]],
          spineY: -0.32 * side, spineX: 0.22, headX: -0.1 };
        P = mix(P, slide, lateral * 0.67);
      }
    }
    // Parkour pose overrides are only cosmetic and ease in/out during the move.
    if (ac) {
      let A = null;
      if (ac.type === 'flip' && this.flying) {
        A = { arm: [[-1.45, 0.45, -1.5], [-1.4, 0.40, -1.45]],
          leg: [[-1.25, 1.9, 0.2], [-1.1, 1.75, 0.2]], spineY: 0, spineX: 0.12, headX: -0.12 };
      } else if (ac.type === 'airRoll' && this.flying) {
        A = { arm: [[-0.95, 0.5, -1.5], [-0.95, 0.5, -1.5]],
          leg: [[-0.65, 1.2, 0.15], [-0.65, 1.2, 0.15]], spineY: 0, spineX: 0.18, headX: -0.1 };
      } else if (ac.type === 'evade') {
        A = { arm: [[-1.4, 0.55, -1.65], [-0.85, 0.42, -1.9]],
          leg: [[0.45, 1.22, 0.22], [-0.83, 0.8, 0.15]],
          spineY: ac.direction * -0.24, spineX: 0.34, headX: -0.14 };
      } else if (ac.type === 'landing') {
        A = { arm: [[-0.15, 0.72, -1.4], [-1.25, 0.25, -1.7]],
          leg: [[1.05, 1.65, 0.3], [-0.6, 1.25, 0.2]],
          spineY: -0.18 * ac.direction, spineX: 0.5, headX: -0.3 };
      }
      if (A) P = mix(P, A, smooth01(Math.min(1, acEnv * 1.6)));
    }
    if (this.awakened && this.stun <= 0 && this.punchT <= 0 && !this.dashing && !this.charging && this.awakenChargeT <= 0) {
      const powerStance = { arm: [[-0.75, 0.36, -1.30],[-1.06, 0.32, -1.30]],
        leg: [[0.22, 0.55, 0.21],[-0.39, 0.62, 0.21]], spineY: -0.12, spineX: 0.10, headX: -0.16 };
      P = mix(P, powerStance, (flying ? 0.14 : 0.38) * (1 - clamp(hspeed / 14, 0, 1)));
    }
    if (this.vanishRecoverT > 0 && this.stun <= 0) {
      const w = smooth01(this.vanishRecoverT / 0.28);
      const arrive = { arm: [[-0.91, 0.47, -1.55],[-1.15, 0.32, -1.75]],
        leg: [[0.62, 1.03, 0.24],[-0.70, 0.69, 0.16]], spineY: -0.11, spineX: 0.22, headX: -0.12 };
      P = mix(P, arrive, 0.62 * w);
    }
    // block: forearms crossed in front of the face, knees bent
    if (this.blockW > 0.01 && this.brokenT <= 0 && this.stun <= 0) {
      const B = { arm: [[-1.3, -0.5, -1.75], [-1.4, -0.42, -1.9]], leg: fw > 0.5 ? P.leg : [[0.3, 0.6, 0.18], [-0.38, 0.62, 0.12]], spineY: -0.05, spineX: 0.28, headX: 0.18 };
      P = mix(P, B, this.blockW);
    }
    // charging: hands drawn together in front of the chest, wide braced stance
    if (this.charging && this.stun <= 0) {
      const lv = this.chargeLevel, sh = lv >= 1 ? Math.sin(this.t * 40) * 0.03 : 0;
      P.arm = [[-1.05 + sh, -0.6, -1.15], [-1.05 - sh, -0.6, -1.15]]; P.spineY = 0; P.spineX = 0.04 + 0.03 * lv; P.headX = 0.1;
      if (fw < 0.5) P.leg = [[0.16, 0.48, 0.21], [-0.24, 0.55, 0.18]];
    }
    // wind-up before an AI punch: rear fist pulled back
    if (this.windT > 0) { const w = 1 - this.windT / this.windLen; P.arm[0] = [0.55, 0.35, -1.9]; P.arm[1] = [-1.0, 0.25, -1.6]; P.spineY = 0.45 * Math.min(1, w * 2); }
    // V30: attacks have anticipation, an active contact frame and flowing recovery.
    // Poses blend onto locomotion instead of snapping arms/legs into fixed positions.
    if (this.blastT > 0) {
      const w = smooth01(Math.min(1, (0.26 - Math.min(this.blastT, 0.26)) / 0.09));
      const B = { ...P, arm: [[-1.5, -0.12, -0.1], [-1.5, -0.12, -0.1]], spineY: 0 };
      P = mix(P, B, w);
    } else if (this.punchT > 0) {
      const total = this.attackTotal || 0.235;
      const progress = clamp(this.attackElapsed / total, 0, 1);
      const contact = this.attackKind === 'kick' ? 0.48 : this.attackKind === 'hook' ? 0.49 : 0.43;
      const lift = smooth01(progress / contact);
      const returnW = 1 - smooth01((progress - contact) / (1 - contact));
      const strength = clamp(lift * returnW * 1.55 + 0.13 * Math.sin(progress * Math.PI), 0, 1);
      let B = { arm: P.arm.map(a => a.slice()), leg: P.leg.map(a => a.slice()), spineY: P.spineY, spineX: P.spineX, headX: P.headX };
      if (this.attackKind === 'slam') {
        B.arm = [[-0.3, 0.1, -0.2], [-0.8, 0.4, -1.6]];
        B.leg = [[-1.2, 1.9, 0.3], [-0.2, 1.4, 0.25]];
        B.spineX = 0.6; B.headX = -0.3; B.spineY = 0;
      } else if (this.attackKind === 'airStrike') {
        // Air finisher: forward driving elbow/knee with both feet tucked, never a rotating roundhouse.
        B.arm = [[-1.60,-0.12,-0.38],[-0.80,0.32,-1.76]];
        B.leg = [[-0.74,1.42,0.11],[-0.34,1.05,0.12]];
        B.spineY = 0.20; B.spineX = 0.16; B.headX = -0.08;
      } else if (this.attackKind === 'kick') {
        B.leg[0] = [-1.6, 0.09, 0.05]; B.leg[1] = [0.35, 0.57, 0.12];
        B.arm = [[-0.35, 0.55, -1.65], [-0.8, 0.35, -1.6]];
        B.spineY = -0.45; B.spineX = -0.16; B.headX = 0.08;
      } else {
        const i = this.punchSide, o = 1 - i;
        if (this.attackKind === 'hook') {
          // Hook: shoulder and hips turn together, but the ribcage stays compact.
          // Avoid the rubber-torso stretch that made the third hit look broken.
          B.arm[i] = [-1.02, -0.34, -1.08]; B.arm[o] = [-0.95, 0.22, -1.70];
          B.spineY = i ? -0.18 : 0.18; B.spineX = 0.10;
          B.leg[i] = [-0.22, 0.74, 0.12]; B.leg[o] = [0.12, 0.54, 0.10]; B.headX = -0.05;
        } else {
          // Fast lead-hand jab versus fully committed rear-hand cross.
          const jab = i === 1;
          B.arm[i] = jab ? [-1.65, -0.15, -0.15] : [-2.25, -0.30, -0.05];
          B.arm[o] = [-0.80, 0.45, -1.92];
          B.spineY = jab ? -0.27 : 0.82;
          B.spineX = jab ? 0.12 : 0.33; B.headX = jab ? -0.07 : -0.11;
          B.leg[i] = [jab ? 0.10 : 0.32, 0.65, jab ? 0.10 : 0.23];
        }
      }
      if (!flying) {
        const moveW = smooth01((this.attackDrive - 1.0) / 5.2) * (this.attackMoving ? 1 : 0.5);
        if (moveW > 0.01) {
          const sideBias = this.attackTravel ? (this.attackTravel.x * Math.cos(yaw) - this.attackTravel.z * Math.sin(yaw)) : 0;
          const step = { arm: [[-1.18, 0.22, -1.65], [-0.82, 0.14, -1.88]],
            leg: [[0.54, 0.98, 0.18], [-0.72, 0.62, 0.14]],
            spineY: clamp(-sideBias * 0.28, -0.22, 0.22), spineX: 0.22, headX: -0.10 };
          if (this.attackKind === 'kick') {
            step.arm = [[-0.55, 0.42, -1.55], [-0.92, 0.26, -1.58]];
            step.leg = [[0.15, 0.62, 0.14], [-0.88, 0.88, 0.10]];
            step.spineX = 0.10;
          } else if (this.attackKind === 'hook') {
            step.arm = [[-1.10, 0.06, -1.38], [-0.92, 0.18, -1.78]];
            step.leg = [[0.38, 0.84, 0.14], [-0.62, 0.64, 0.12]];
            step.spineX = 0.18;
          }
          const contactPlant = smooth01(progress / 0.35);
          B = mix(B, step, moveW * (0.84 - 0.28 * contactPlant));
        }
      }
      if (!flying) {
        // A visible support foot travels in during preparation and settles under the hips at contact.
        const plant = smooth01(progress / 0.40);
        const lead = this.punchSide;
        const reach = this.attackMoving ? 0.58 : 0.30;
        B.leg[lead] = [reach * (1 - 0.40 * plant), 0.65 + 0.28 * plant, 0.12];
        B.leg[1 - lead] = [-0.52 + 0.20 * plant, 0.72, 0.12];
        if (this.attackKind === 'kick') B.leg[0] = [-1.55, 0.15, 0.06];
      }
      P = mix(P, B, strength);
    }
    // Transformation sequence: planted base, fists clench at hips, head lowered;
    // peak breaks into an open-chest power stance. Entire body participates.
    if (this.awakenChargeT > 0) {
      const phase = this.awakenChargeProgress;
      const open = smooth01((phase - 0.63) / 0.37);
      const tremble = Math.sin(this.t * (16 + 14 * phase)) * 0.035 * smooth01(phase);
      const C = { arm: [[0.27 - open * 1.08 + tremble, 0.24 + open * 0.55, -1.56 + open * 0.56],
                         [0.27 - open * 1.08 - tremble, 0.24 + open * 0.55, -1.56 + open * 0.56]],
        leg: [[0.27 - open * 0.16, 0.48, 0.23], [-0.42 + open * 0.12, 0.55, 0.25]],
        spineY: 0, spineX: 0.25 - open * 0.39 + tremble, headX: 0.23 - open * 0.48 };
      P = mix(P, C, smooth01(Math.min(1, phase * 6)));
      // Small braced dip; don't lift the whole mesh from the ground.
      body.position.y -= (0.055 - open * 0.03);
    }
    const fast = this.punchT > 0 || this.blastT > 0 ? 19 : this.moving || this.stun > 0 ? 18 : 11;
    const k = damp(fast, dt), kb = damp(12, dt);
    m.arms.forEach((a, i) => {
      const [x, z, e] = P.arm[i];
      a.sh.rotation.x += (x - a.sh.rotation.x) * k;
      a.sh.rotation.z += (z * a.side - a.sh.rotation.z) * k;
      a.el.rotation.x += (e - a.el.rotation.x) * k;
    });
    m.legs.forEach((l, i) => {
      const [h, kn, hz] = P.leg[i];
      l.hip.rotation.x += (h - l.hip.rotation.x) * k;
      l.hip.rotation.z += (hz * l.side - l.hip.rotation.z) * k;
      l.knee.rotation.x += (kn - l.knee.rotation.x) * k;
      l.foot.rotation.x += ((fw > 0.5 ? 0.5 : -(h + kn) * 0.85) - l.foot.rotation.x) * kb;   // keep boots flat on the ground
      l.foot.rotation.z += ((fw > 0.5 ? 0 : -hz * l.side) - l.foot.rotation.z) * kb;
    });
    m.spine.rotation.y += (P.spineY - this.hipYaw - m.spine.rotation.y) * k;   // chest counter-turns against the hips
    m.spine.rotation.x += (P.spineX - m.spine.rotation.x) * k;
    m.head.rotation.x += (P.headX - m.head.rotation.x) * kb;
    m.head.rotation.y += (-P.spineY * 0.48 - m.head.rotation.y) * kb;   // eyes stay on the target
    m.chest.scale.y = 0.92 + Math.sin(this.t * 2) * 0.01;
    if (m.tick) m.tick(dt, this);

    // awakening: hair colour, spikes stand taller, flame aura
    const aw = this.awakened;
    m.hairMat.color.setHex(aw ? this.pal.awakenHair : this.pal.hair);
    m.hairMat.emissive.setHex(aw ? this.pal.awakenHair : 0x000000);
    m.hairMat.emissiveIntensity = aw ? 0.35 : 1;
    // hit flash: whole body briefly flashes white
    // guard broken: pulsing red tint until they recover
    let r = 0, g = 0, b = 0;
    if (this.hitFlash > 0) r = g = b = 0.55;
    else if (this.brokenT > 0) { const pz = 0.2 + 0.14 * Math.sin(this.t * 18); r = pz; g = pz * 0.15; b = pz * 0.3; }
    const key = r * 1000 + g * 10 + b;
    if (key !== m._flash) { m._flash = key; m.bodyMats.forEach(mt => mt.emissive.setRGB(r, g, b)); }
    const spikeScale = aw ? 1.25 : 1;
    m.spikes.forEach(s => {
      const cur = s.scale.y + (spikeScale - s.scale.y) * damp(8, dt);
      s.scale.set(1, cur, 1);
      const d = s.userData.dir, b = s.userData.base;
      if (b) { const h = s.userData.len * cur / 2; s.position.set(b.x + d.x * h, b.y + d.y * h, b.z + d.z * h); }
      else { const off = s.userData.inset + s.userData.len * cur / 2; s.position.set(d.x * off, d.y * off, d.z * off); }
    });
    // charge orb grows with the charge and pulses at full power
    const lvc = this.chargeLevel, showOrb = this.charging && this.chargeT > 0.08;
    this.orb.visible = this.orbCore.visible = showOrb;
    if (showOrb) {
      const op = this.center.addScaledVector(this.forward(), 0.68); op.y -= 0.05;
      // Visual cap independent of charge damage: compact, bright, never hides the torso.
      const pulse = 1 + Math.sin(this.t * (lvc >= 1 ? 28 : 12)) * 0.045;
      const sz = (0.22 + 0.26 * lvc) * pulse;
      this.orb.position.copy(op); this.orbCore.position.copy(op);
      this.orb.scale.setScalar(sz * 1.38); this.orbCore.scale.setScalar(sz * 0.66);
      this.orb.material.opacity = 0.48 + 0.12 * lvc;
      this.orb.material.color.setHex(aw ? this.pal.aura : this.pal.ki);
    }
    // Awakening/charging keeps its usual aura; Boost uses thin speed streaks, never a meteor.
    const auraTarget = aw ? (this.dashing || (this.sprinting && flying) ? 0.38 : 0.72) : this.charging ? 0.025 + 0.06 * lvc : 0;
    // No meteor model or speed sphere during dashes or fast flight.
    // Boost is communicated through motion, audio and brief launch dust only.
    m.aura.level = (m.aura.level || 0) + (auraTarget - (m.aura.level || 0)) * damp(aw ? 6 : 10, dt);
    m.aura.set(this.t, m.aura.level, aw ? this.pal.aura : this.pal.ki);

    // ground blob shadow shrinks and fades with height
    const h = this.pos.y - this.floor;
    m.blob.position.set(this.pos.x, this.floor + 0.03, this.pos.z);
    const bs = clamp(1.2 - h * 0.025, 0.5, 1.2); m.blob.scale.set(bs, bs, bs);
    m.blob.material.opacity = Math.max(0, 0.40 * (1 - smooth01((h - 0.35) / 4.0)));
    m.blob.visible = this.vanishT <= 0 && h < 4.4;
  }
}

/* ---------------- Effects ----------------
 * Sprite-based glow so it reads like bloom without a post-processing pass.
 */
const Effects = (() => {
  const list = [];
  const MAX = 260;
  function sprite(tex, color, size, opacity = 1, additive = true) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false }));
    s.scale.setScalar(size); return s;
  }
  function push(obj, life, update, ownGeo = false) {
    if (list.length > MAX) return;
    scene.add(obj); list.push({ obj, t: 0, life, update, ownGeo });
  }
  function ring(pos, color, size = 2) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.55, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    mesh.position.copy(pos); mesh.lookAt(camera.position);
    push(mesh, 0.32, (e) => { const k = e.t / e.life; e.obj.scale.setScalar(1 + k * size * 2.2); e.obj.material.opacity = 0.9 * (1 - k) * (1 - k); }, true);
  }
  function flash(pos, color, size = 3, life = 0.12) {
    push(sprite(TEX.glow, color, size), life, (e) => { const k = e.t / e.life; e.obj.material.opacity = 1 - k; e.obj.scale.setScalar(size * (1 + k * 0.6)); });
  }
  // Narrow travelling sparks: pointed streaks with readable flight directions,
  // scaled by the severity of the impact. Keep short-lived for mobile rendering.
  const sparkGeo = new THREE.ConeGeometry(0.046,0.62,3,1);
  const sparkY = new V3(0,1,0);
  function sparks(pos, color, n = 8, dir = null, strength = 1) {
    const count=Math.min(n,22);
    const axis=dir && dir.lengthSq()>0.001 ? dir.clone().normalize() : null;
    for(let i=0;i<count;i++) {
      let v=new V3(Math.random()-0.5,Math.random()-0.28,Math.random()-0.5);
      if(axis) v.addScaledVector(axis,0.85);
      v.normalize().multiplyScalar((5+Math.random()*9)*strength);
      const mat=new THREE.MeshBasicMaterial({color:i%4===0?0xffffff:color,transparent:true,
        opacity:0.92,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
      const shard=new THREE.Mesh(sparkGeo,mat);shard.position.copy(pos);
      shard.quaternion.setFromUnitVectors(sparkY,v.clone().normalize());
      const base=0.55+Math.random()*0.75;
      shard.scale.set(base,base*(0.75+strength*0.4),base);
      const life=0.16+Math.random()*0.13;
      push(shard,life,(e,dt)=>{const k=e.t/e.life;
        e.obj.position.addScaledVector(v,dt);
        v.multiplyScalar(Math.max(0,1-6.5*dt));
        e.obj.material.opacity=0.90*(1-k)*(1-k);
        e.obj.scale.y=base*(0.6+strength*0.4)*(1-k*0.8);
      });
    }
  }
  function impact(pos, color, heavy = false, dir = null) {
    // Small white contact core + directional flares: less of a screen-filling blob.
    flash(pos,0xffffff,heavy?2.5:1.35,heavy?0.11:0.075);
    flash(pos,color,heavy?2.9:1.7,heavy?0.16:0.11);
    sparks(pos,color,heavy?17:10,dir,heavy?1.38:1);
  }
  function kickImpact(pos, dir, color) {
    impact(pos, color, true, dir);
    flash(pos, 0xffffff, 2.6, 0.07);
    // Keep a punchy core and sparks, not circular impact geometry.
    // sparks thrown forward in a cone
    sparks(pos, color, 11, dir, 1.55);
  }
  function dust(pos, n = 4) {
    for (let i = 0; i < n; i++) {
      const s = sprite(TEX.smoke, 0xd9cdb8, 0.8, 0.55, false);
      s.position.set(pos.x + (Math.random() - 0.5) * 0.8, groundAt(pos.x, pos.z) + 0.3, pos.z + (Math.random() - 0.5) * 0.8);
      const v = new V3((Math.random() - 0.5) * 4, 0.6 + Math.random(), (Math.random() - 0.5) * 4);
      push(s, 0.6 + Math.random() * 0.3, (e, dt) => { e.obj.position.addScaledVector(v, dt); const k = e.t / e.life; e.obj.scale.setScalar(0.8 + k * 2.2); e.obj.material.opacity = 0.5 * (1 - k); });
    }
  }
  function dashBurst(f) {
    // Normal power dash — no glowing orb, expanding shell or radiating meteor rings.
    // Small directional slashes stay behind the fighter and fade almost instantly.
    const dir = f.dashDir.lengthSq() > 0.01 ? f.dashDir.clone().normalize() : f.forward();
    const col = f.awakened ? f.pal.aura : f.pal.ki;
    for(let i=0;i<3;i++) {
      const v=new V3((i-1)*0.14,0.04,0);
      const pos=f.center.addScaledVector(dir,-0.9-i*0.4).add(v);
      const shard=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.8,4),
        new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.38,depthWrite:false,
          blending:THREE.AdditiveBlending}));
      shard.position.copy(pos);
      shard.quaternion.setFromUnitVectors(new V3(0,1,0),dir);
      push(shard,0.11+i*0.018,(e)=>{e.obj.material.opacity=0.35*(1-e.t/e.life);},true);
    }
  }
  // V44 body-attached awakening: translucent flames rising from limbs and torso,
  // not a spherical shell. Each fighter keeps its own aura colour.
  const auraFlameTex = canvasTex(96, 160, (g) => {
    const grad = g.createLinearGradient(0, 145, 0, 12);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.16, 'rgba(255,255,255,.92)');
    grad.addColorStop(0.45, 'rgba(255,255,255,.66)');
    grad.addColorStop(0.80, 'rgba(255,255,255,.22)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.beginPath();g.moveTo(29,151);g.bezierCurveTo(5,103,40,87,34,58);
    g.bezierCurveTo(32,33,46,21,53,2);g.bezierCurveTo(58,44,83,65,65,103);
    g.bezierCurveTo(57,124,76,141,64,151);g.closePath();g.fill();
  }, {srgb:false});
  function awakenBurst(f) {
    const c = f.center;
    flash(c, 0xffffff, 2.5, 0.09); flash(c, f.pal.aura, 3.6, 0.18);
    bodyAura(f, true);
    if (!f.flying) { chargeFracture(f, 1.32); dust(f.pos, Settings.get('quality') === 'low' ? 5 : 11); }
    CameraRig.shake(0.27);
  }
  // Visible power-up is staged, not one instantaneous aura toggle.
  // The visual envelope hugs articulated bones and concentrates above the feet.
  function awakenIgnition(f) {
    flash(f.center,0xffffff,1.65,.09);
    if (!f.flying) { dust(f.pos,4); }
    CameraRig.shake(f===Game.player?.04:.015);
  }
  function awakenCharge(f,progress) {
    const low=Settings.get('quality')==='low';
    const col=f.pal.aura;
    const intensity=smooth01(progress);
    // Small luminous flame tongues attached to the skeletal pose, building with the meter.
    bodyAura(f,false);
    if (progress>.35 && Math.random()<.55) bodyAura(f,false);
    const p=f.center;
    if (!f.flying && Math.random()<(progress<.72?.32:.80)) chargePressure(f,progress);
    if (progress>.38) {
      const n=low?1:progress>.78?4:2;
      for(let i=0;i<n;i++) {
        const a=Math.random()*TAU;
        const r=.32+Math.random()*.48;
        const at=p.clone().add(new V3(Math.cos(a)*r,(Math.random()-.6)*1.35,Math.sin(a)*r));
        const s=sprite(TEX.glow,i%3?col:0xffffff,.18+.16*intensity,.46+.30*intensity);
        s.position.copy(at);
        const v=new V3(Math.cos(a)*.28,1.5+intensity*3.2,Math.sin(a)*.28);
        push(s,.20,(e,dt)=>{const t=e.t/e.life;e.obj.position.addScaledVector(v,dt);
          e.obj.scale.setScalar((.18+.16*intensity)*(1+t*.2));e.obj.material.opacity=(.46+.3*intensity)*(1-t);});
      }
    }
    if(progress>.80&&!f.awakenRuptured) {
      f.awakenRuptured=true;
      if(!f.flying){ chargeFracture(f,.65); dust(f.pos,low?6:12); }
      flash(p,col,2.6,.14);
      if(f===Game.player) CameraRig.shake(.09);
    }
  }
  function bodyAura(f, burst = false) {
    if (!f || f.hp <= 0) return;
    const rig = f.vrmRig, H = rig && rig.vrm && rig.vrm.humanoid;
    const bones = ['head','chest','leftUpperArm','rightUpperArm','leftHand','rightHand','leftUpperLeg','rightUpperLeg'];
    if (H) rig.vrm.scene.updateMatrixWorld(true);
    const count = burst ? (Settings.get('quality') === 'low' ? 10 : 24) : (Settings.get('quality') === 'low' ? 3 : 7);
    const origins = [];
    for (let i = 0; i < bones.length; i++) {
      const bone = H && H.getNormalizedBoneNode(bones[i]);
      if (bone) origins.push(bone.getWorldPosition(new V3()));
      else {
        const side = bones[i].startsWith('left') ? 1 : bones[i].startsWith('right') ? -1 : 0;
        const y = bones[i] === 'head' ? 2.04 : bones[i] === 'chest' ? 1.48 : bones[i].includes('UpperLeg') ? 0.66 : bones[i].includes('Hand') ? 1.04 : 1.56;
        origins.push(f.pos.clone().add(new V3(side * 0.33, y, 0)));
      }
    }
    for (let i = 0; i < count; i++) {
      const boneIndex = burst ? i % bones.length : (Math.random() * bones.length) | 0;
      const origin = origins[boneIndex];
      const size = burst ? 0.80 : (boneIndex < 2 ? 0.73 : 0.56);
      const wisp = new THREE.Sprite(new THREE.SpriteMaterial({map:auraFlameTex,
        color:i % 6 === 0 ? 0xeafaff : f.pal.aura,transparent:true,
        opacity:burst ? 0.44 : 0.26,depthWrite:false,
        blending:THREE.AdditiveBlending, fog:false}));
      const angle = Math.random() * TAU;
      wisp.position.copy(origin).add(new V3(Math.cos(angle)*(0.10+Math.random()*0.17), -0.04,Math.sin(angle)*(0.10+Math.random()*0.17)));
      wisp.scale.set(size * 0.77,size * 1.7,1);
      const velocity = new V3(Math.cos(angle)*0.22,burst?2.6:1.65,Math.sin(angle)*0.22);
      push(wisp,burst?0.36:0.39,(e,dt)=>{
        const t=e.t/e.life;e.obj.position.addScaledVector(velocity,dt);
        e.obj.scale.set(size*(0.77-0.15*t),size*(1.7+0.45*t),1);
        e.obj.material.opacity=(burst?0.44:0.26)*(1-t)*(1-t);
      });
    }
  }
  function auraSpark(f) { bodyAura(f); }

  // Subtle pressure phase: dust and air motion, not bright floor circles.
  function chargePressure(f, lvl) {
    if (!f || f.flying) return;
    const center=f.pos, q=Settings.get('quality');
    const n=q==='low'?1:2+(lvl>0.45?1:0);
    for(let i=0;i<n;i++) {
      const a=Math.random()*TAU, r=0.8+Math.random()*1.45;
      const p=new V3(center.x+Math.cos(a)*r,groundAt(center.x,center.z)+0.06,center.z+Math.sin(a)*r);
      const s=sprite(TEX.smoke,0xc3baa8,0.65+lvl*0.32,0.21,false);
      s.position.copy(p);
      const v=new V3(Math.cos(a)*0.55,0.55+lvl*0.38,Math.sin(a)*0.55);
      push(s,0.38,(e,dt)=>{const t=e.t/e.life;e.obj.position.addScaledVector(v,dt);e.obj.scale.setScalar((0.66+lvl*0.3)*(1+t));e.obj.material.opacity=0.21*(1-t);});
    }
  }
  // Fractures are actual irregular displaced stone plates, not bright lines painted
  // onto the arena. The marks are decorative and do not change collision physics.
  function chargeFracture(f, strength = 1) {
    if (!f || f.flying) return;
    const p = f.pos, stage = Math.hypot(p.x,p.z) < STAGE_R * 0.88;
    const q=Settings.get('quality');
    const pieces = q==='low'?7:q==='medium'?11:15;
    const rand=makeRng(((Math.abs(p.x)*1489+Math.abs(p.z)*807+p.y*333)*97)|0);
    const Y=groundAt(p.x,p.z);
    const n=pieces,outer=1.25+0.85*strength;
    for(let j=0;j<n;j++) {
      const a0=TAU*j/n+0.035, a1=TAU*(j+1)/n-0.045, mid=(a0+a1)/2;
      const r0=0.32+rand()*0.26,r1=outer*(0.75+rand()*0.30);
      const x0=Math.cos(a0), z0=Math.sin(a0),x1=Math.cos(a1),z1=Math.sin(a1);
      const shape=new THREE.Shape();shape.moveTo(Math.cos(mid)*r0,Math.sin(mid)*r0);
      shape.lineTo(x0*(0.57*r1),z0*(0.57*r1));
      shape.lineTo(x0*r1,z0*r1);
      shape.lineTo(Math.cos(mid)*r1*(0.92+rand()*0.14),Math.sin(mid)*r1*(0.92+rand()*0.14));
      shape.lineTo(x1*r1*(0.82+rand()*0.12),z1*r1*(0.82+rand()*0.12));
      shape.lineTo(x1*(0.55*r1),z1*(0.55*r1));
      shape.lineTo(Math.cos(mid)*r0,Math.sin(mid)*r0);shape.closePath();
      const geo=new THREE.ExtrudeGeometry(shape,{depth:0.035+rand()*0.045,bevelEnabled:false,steps:1,curveSegments:1});
      geo.computeVertexNormals();
      const color=stage?[0x928d84,0xaca69b,0x78766e][j%3]:[0x786c57,0x6a6653,0x8c8168][j%3];
      const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,roughness:0.98,metalness:0,transparent:true,opacity:0.98}));
      mesh.rotation.x=-Math.PI/2;mesh.rotation.z=(rand()-0.5)*0.055;
      mesh.position.set(p.x,Y+0.012,p.z);mesh.receiveShadow=true;mesh.castShadow=false;
      const base=mesh.position.y, lift=(0.025+rand()*0.11)*strength;
      push(mesh,2.7,(e)=>{const t=e.t/e.life;e.obj.position.y=base+lift*smooth01(t/0.22)*(1-0.5*smooth01((t-0.38)/0.62));e.obj.material.opacity=0.98*(1-smooth01((t-0.76)/0.24));},true);
      if(q!=='low' && j%3===0) {
        const d=sprite(TEX.smoke,stage?0xb6afa1:0xa9a78d,0.8,0.22,false);
        d.position.set(p.x+Math.cos(mid)*r1*0.9,Y+0.07,p.z+Math.sin(mid)*r1*0.9);
        push(d,0.64,(e,dt)=>{const t=e.t/e.life;e.obj.position.y+=dt*0.62;e.obj.scale.setScalar(0.7+t*1.3);e.obj.material.opacity=0.22*(1-t);});
      }
    }
    dust(p, q==='low'?3:7);
  }
  function trail(pos, color, size) {
    const s = sprite(TEX.glow, color, size, 0.55); s.position.copy(pos);
    push(s, 0.18, (e) => { const k = e.t / e.life; e.obj.material.opacity = 0.55 * (1 - k); e.obj.scale.setScalar(size * (1 - k * 0.6)); });
  }
  function update(dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i]; e.t += dt; e.update(e, dt);
      if (e.t >= e.life) { dispose(e); list.splice(i, 1); }
    }
  }
  function dispose(e) { scene.remove(e.obj); if (e.ownGeo) e.obj.geometry.dispose(); e.obj.material.dispose(); }
  function clear() { list.forEach(dispose); list.length = 0; }
  // guard break: the guard "shield" appears for an instant and shatters into shards
  const shardGeo = new THREE.TetrahedronGeometry(0.2, 0);
  function guardBreak(f) {
    const c = f.center, fwd = f.forward();
    // bubble that pops
    const bubble = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), new THREE.MeshBasicMaterial({ color: 0xa8e4ff, transparent: true, opacity: 0.55,
      wireframe: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    bubble.position.copy(c);
    push(bubble, 0.16, (e) => { const k = e.t / e.life; e.obj.scale.setScalar(1 + k * 0.5); e.obj.material.opacity = 0.7 * (1 - k); }, true);
    // shards burst outward, mostly forward and up, then fall
    for (let i = 0; i < 18; i++) {
      const col = i % 3 === 0 ? 0xffffff : i % 3 === 1 ? 0xbfe9ff : 0x7cc8ff;
      const m = new THREE.Mesh(shardGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1, depthWrite: false, fog: false }));
      const d = new V3(Math.random() - 0.5, Math.random() * 0.9 - 0.2, Math.random() - 0.5).normalize().addScaledVector(fwd, 0.6).normalize();
      m.position.copy(c).addScaledVector(d, 1.0);
      m.scale.setScalar(0.6 + Math.random() * 1.1);
      const v = d.multiplyScalar(6 + Math.random() * 7); v.y += 3;
      const spin = new V3(Math.random() * 14 - 7, Math.random() * 14 - 7, Math.random() * 14 - 7);
      push(m, 0.75 + Math.random() * 0.35, (e, dt) => {
        v.y -= 18 * dt; e.obj.position.addScaledVector(v, dt);
        e.obj.rotation.x += spin.x * dt; e.obj.rotation.y += spin.y * dt; e.obj.rotation.z += spin.z * dt;
        e.obj.material.opacity = 1 - Math.pow(e.t / e.life, 2);
      });
    }
    // flat shockwave at chest height and a red-pink burst
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 48), new THREE.MeshBasicMaterial({ color: 0xff5d7e, transparent: true, opacity: 0.9,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    wave.position.copy(c); wave.rotation.x = -Math.PI / 2;
    push(wave, 0.45, (e) => { const k = e.t / e.life; e.obj.scale.setScalar(1 + k * 7); e.obj.material.opacity = 0.9 * (1 - k); }, true);
    flash(c, 0xffffff, 6, 0.12); flash(c, 0xff4d6d, 9, 0.35);
    ring(c, 0xffffff, 2.4); sparks(c, 0xff8fa3, 14);
  }
  // dizzy stars circling the head while the guard is broken
  function dizzy(f, dur) {
    for (let i = 0; i < 3; i++) {
      const s = sprite(TEX.star, 0xffe066, 0.62, 1);
      push(s, dur, (e) => {
        const a = e.t * 6 + i * TAU / 3;
        e.obj.position.set(f.pos.x + Math.cos(a) * 0.55, f.pos.y + 2.35 + Math.sin(e.t * 9 + i) * 0.06, f.pos.z + Math.sin(a) * 0.55);
        e.obj.material.rotation = e.t * 4;
        e.obj.material.opacity = Math.min(1, (e.life - e.t) / 0.25);
      });
    }
  }
  // charge: specks of energy drawn into the orb
  function chargeSpark(f, at, lvl) {
    const col = f.awakened ? f.pal.aura : f.pal.ki;
    const n = 2 + Math.round(lvl * 4);
    for (let i = 0; i < n; i++) {
      const s = sprite(TEX.glow, i % 3 === 0 ? 0xffffff : col, 0.22 + lvl * 0.16, 0.92);
      const d = new V3(Math.random() - 0.5, Math.random() * 0.45 - 0.2, Math.random() - 0.5).normalize().multiplyScalar(1.3 + lvl * 1.1);
      const target = at.clone();
      push(s, 0.24, (e) => { const k = e.t / e.life; const kk = 1 - k; e.obj.position.copy(target).addScaledVector(d, kk * kk * 1.2); e.obj.material.opacity = 0.95 * k; e.obj.scale.setScalar((0.8 + k * 0.8) * (0.8 + lvl)); });
    }
    if (lvl > 0.2) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.05, 0.85 + lvl * 0.55, 4, 1), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      const a = Math.random() * TAU;
      bolt.position.copy(at).add(new V3(Math.cos(a) * (0.18 + lvl * 0.22), 0, Math.sin(a) * (0.18 + lvl * 0.22)));
      bolt.quaternion.setFromAxisAngle(new V3(Math.cos(a), 0, Math.sin(a)), Math.PI * 0.5);
      push(bolt, 0.12, (e) => { const k = e.t / e.life; e.obj.material.opacity = 0.55 * (1 - k); e.obj.scale.set(1, 1 + k * 0.4, 1); }, true);
    }
  }
  function groundRing(f, lvl) {
    const col = f.awakened ? f.pal.aura : f.pal.ki;
    const p = new V3(f.pos.x, groundAt(f.pos.x, f.pos.z) + 0.05, f.pos.z);
    for (let i = 0; i < 6; i++) {
      const ang = TAU * i / 6 + Math.random() * 0.12;
      const len = 0.7 + lvl * 1.25 + Math.random() * 0.35;
      const end = p.clone().add(new V3(Math.cos(ang) * len, 0, Math.sin(ang) * len));
      const crack = new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, 0.06), new THREE.MeshBasicMaterial({ color: i % 2 ? col : 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      crack.position.copy(p).lerp(end, 0.5); crack.rotation.y = -ang;
      push(crack, 0.34, (e) => { const k = e.t / e.life; e.obj.material.opacity = 0.55 * (1 - k); e.obj.scale.set(1 + k * 0.3, 1, 1); }, true);
    }
  }
  function chargeFull(f) {
    const col = f.awakened ? f.pal.aura : f.pal.ki;
    flash(f.orb.position, 0xffffff, 3.8, 0.17); flash(f.center, col, 3.5, 0.22); sparks(f.orb.position, col, 14, new V3(0,1,0), 1.15); 
    if (f === Game.player) { CameraRig.shake(0.10); if (Settings.get('haptics') && navigator.vibrate) navigator.vibrate(24); }
  }
  // big blast explosion
  // Cinematic super impact: a concentrated plasma detonation and smoke, not
  // a geometric starburst of rods flying through the enemy mesh.
  function bigBlast(pos, color, lvl) {
    const heavy = lvl > 0.92;
    flash(pos, 0xffffff, heavy?5.8:4.5, 0.11);
    flash(pos, color, heavy?6.6:5.2, heavy?0.33:0.25);
    const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),
      new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.38,
        depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false}));
    sphere.position.copy(pos); sphere.scale.setScalar(heavy?0.55:0.40);
    push(sphere,heavy?0.38:0.29,(e)=>{const t=e.t/e.life;
      e.obj.scale.setScalar((heavy?0.55:0.40)+(heavy?2.85:1.65)*smooth01(t));
      e.obj.material.opacity=0.38*(1-t)*(1-t);},true);
    sparks(pos,color,Settings.get('quality')==='low'?8:heavy?19:11,null,heavy?1.15:0.9);
    // The blast dissipates into airy coloured smoke, not a rigid sphere or ring.
    const count=Settings.get('quality')==='low'?3:heavy?11:6;
    for(let k=0;k<count;k++) {
      const c=sprite(TEX.smoke,k%3===0?0xdde8f4:color,0.95+lvl*1.3,0.34,true);
      const v=new V3((Math.random()-0.5)*5,(Math.random()-0.20)*3,(Math.random()-0.5)*5);
      c.position.copy(pos);
      push(c,0.42+Math.random()*0.22,(e,dt)=>{const t=e.t/e.life;
        e.obj.position.addScaledVector(v,dt);
        e.obj.scale.setScalar((1.2+lvl)*(1+t*1.6));
        e.obj.material.opacity=0.27*(1-t)*(1-t);});
    }
  }
  // launcher: streak of wind trailing the launched fighter
  function launchTrail(f) {
    for (let i = 0; i < 8; i++) {
      const s = sprite(TEX.glow, 0xffffff, 1.4, 0.5); let started = false;
      push(s, 0.25 + i * 0.04, (e) => {
        if (!started && e.t > i * 0.04) { e.obj.position.copy(f.center); started = true; }
        e.obj.visible = started; e.obj.material.opacity = 0.45 * (1 - e.t / e.life);
      });
    }
    ring(f.center, 0xffffff, 1.6);
  }
  // smash landing: dust ring, cracks of light and a shockwave across the floor
  function groundSlam(pos) {
    const p = new V3(pos.x, groundAt(pos.x, pos.z) + 0.08, pos.z);
    dust(pos, 14);
    flash(p.clone().setY(p.y + 0.6), 0xffffff, 5, 0.14); flash(p.clone().setY(p.y + 0.5), 0xffb347, 7, 0.3);
    for (let k = 0; k < 2; k++) {
      const w = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.85, 48), new THREE.MeshBasicMaterial({ color: k ? 0xffd166 : 0xffffff, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      w.rotation.x = -Math.PI / 2; w.position.copy(p);
      push(w, 0.45 + k * 0.15, (e) => { const kk = e.t / e.life; e.obj.scale.setScalar(1 + kk * (6 + k * 3)); e.obj.material.opacity = 0.85 * (1 - kk); }, true);
    }
    sparks(p.clone().setY(p.y + 0.4), 0xffd9a0, 12);
  }
  // blocked hit: small blue-white shield flash
  // Sustained sprint/flight has no per-frame particles: prevents a comet or meteor silhouette.
  function sprintTrail(f) {}
  // V45 Vanish: two articulate pose-imprints sampled from the actual VRM skeleton.
  // Captures the departing pose, then flashes the same body pose at the destination;
  // no flat humanoid cut-out, energy hoop, or geometry cloned from a skinned mesh.
  const ghostConnections = [
    ['hips','spine'],['spine','chest'],['chest','neck'],['neck','head'],
    ['leftShoulder','leftUpperArm'],['leftUpperArm','leftLowerArm'],['leftLowerArm','leftHand'],
    ['rightShoulder','rightUpperArm'],['rightUpperArm','rightLowerArm'],['rightLowerArm','rightHand'],
    ['hips','leftUpperLeg'],['leftUpperLeg','leftLowerLeg'],['leftLowerLeg','leftFoot'],
    ['hips','rightUpperLeg'],['rightUpperLeg','rightLowerLeg'],['rightLowerLeg','rightFoot']
  ];
  function vanish(from,to,col,perfect,fighter) {
    const travel=to.clone().sub(from), len=travel.length();
    const dir=len>0.01?travel.clone().normalize():new V3(0,0,1);
    const right=new V3(-dir.z,0,dir.x).normalize();
    const low=Settings.get('quality')==='low';
    const points={};
    const R=fighter && fighter.vrmRig && fighter.vrmRig.vrm;
    if (R && R.humanoid) {
      R.scene.updateMatrixWorld(true);
      const names=new Set(ghostConnections.flat());
      for (const n of names) {
        const bone=R.humanoid.getNormalizedBoneNode(n);
        if (bone) points[n]=bone.getWorldPosition(new V3());
      }
    }
    if (Object.keys(points).length < 12) {
      const at=(x,y,z)=>from.clone().add(new V3(x,y,z));
      Object.assign(points,{hips:at(0,-.65,0),spine:at(0,-.36,0),chest:at(0,.12,0),neck:at(0,.54,0),head:at(0,.83,0),
        leftShoulder:at(.32,.37,0),leftUpperArm:at(.44,.18,0),leftLowerArm:at(.49,-.15,0),leftHand:at(.50,-.36,.11),
        rightShoulder:at(-.32,.37,0),rightUpperArm:at(-.44,.18,0),rightLowerArm:at(-.49,-.15,0),rightHand:at(-.50,-.36,.11),
        leftUpperLeg:at(.16,-.80,0),leftLowerLeg:at(.19,-1.16,.05),leftFoot:at(.20,-1.5,.17),
        rightUpperLeg:at(-.16,-.80,0),rightLowerLeg:at(-.19,-1.16,.05),rightFoot:at(-.20,-1.5,.17)});
    }
    function ghost(offset,delay,atArrival) {
      const off=offset.clone();
      const origin=from.clone().add(off);
      let drawn=0;
      for(const [a,b] of ghostConnections) {
        if(low && drawn++ % 2) continue;
        if(!points[a]||!points[b]) continue;
        const p0=points[a].clone().add(off),p1=points[b].clone().add(off);
        const delta=p1.clone().sub(p0),dist=delta.length();
        if(dist<0.035) continue;
        const radius=(a==='hips'||a==='spine'||a==='chest')?.135:.068;
        const beam=new THREE.Mesh(new THREE.CylinderGeometry(radius*.8,radius,dist,5),
          new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:atArrival?.70:.57,
            depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
        beam.quaternion.setFromUnitVectors(new V3(0,1,0),delta.normalize());
        beam.position.copy(p0).addScaledVector(p1.clone().sub(p0),.5);
        beam.visible=delay===0;
        const rest=beam.position.clone();
        push(beam,(atArrival?.31:.29)+delay,(e,dt)=>{
          const t=clamp((e.t-delay)/(e.life-delay),0,1);
          e.obj.visible=e.t>=delay;
          e.obj.position.copy(rest).addScaledVector(dir,(atArrival?1:-1)*t*.45);
          e.obj.material.opacity=(atArrival?.70:.57)*(1-t)*(1-t);
          e.obj.scale.set(1-t*.40,1-t*.14,1-t*.4);
        },true);
      }
      const bright=atArrival?.75:.65;
      const core=sprite(TEX.glow,0xffffff,1.2,bright);
      core.position.copy(origin);
      core.visible=delay===0;
      push(core,0.16+delay,(e)=>{const t=clamp((e.t-delay)/(e.life-delay),0,1);e.obj.visible=e.t>=delay;e.obj.material.opacity=bright*(1-t);});
      if(delay===0) sparks(origin,col,low?5:perfect?17:12,dir,1.2);
    }
    ghost(new V3(),0,false);
    ghost(travel,.075,true);
    // Travel exists only as offset streaks, so the fighter itself disappears immediately.
    const count=low?6:14;
    const span=Math.min(6.5,Math.max(.8,len));
    for(let i=0;i<count;i++) {
      const x=(Math.random()-.5)*1.2,y=(Math.random()-.5)*1.65;
      const at=from.clone().addScaledVector(right,x).add(new V3(0,y,0));
      const seg=.85+Math.random()*Math.min(2,span);
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(.009,.033,seg,3),
        new THREE.MeshBasicMaterial({color:i%4===0?0xffffff:col,transparent:true,opacity:.64,
          depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
      beam.quaternion.setFromUnitVectors(new V3(0,1,0),dir);
      beam.position.copy(at).addScaledVector(dir,Math.min(span*.3,i*.10));
      push(beam,.24,(e,dt)=>{const t=e.t/e.life;e.obj.position.addScaledVector(dir,dt*10);
        e.obj.material.opacity=.64*(1-t)*(1-t);e.obj.scale.x=e.obj.scale.z=1-t*.5;},true);
    }
    // Delayed emergence sparks at the teleport destination.
    const dummy=sprite(TEX.glow,col,.05,0);dummy.visible=false;
    push(dummy,.085,(e)=>{if(!e.done&&e.t>.065){e.done=true;sparks(to,col,low?6:perfect?19:13,dir,1.25);}});
  }
  function blockSpark(pos) { flash(pos, 0xbfe9ff, 2.6, 0.12); ring(pos, 0x8fd8ff, 1.0); sparks(pos, 0xd8f4ff, 5); }
  // parry: bright gold double ring
  function parry(pos) { flash(pos, 0xffffff, 5, 0.14); flash(pos, 0xffd166, 7, 0.3); ring(pos, 0xffd166, 2.6); ring(pos, 0xffffff, 1.6); sparks(pos, 0xffe08a, 14); }
  return { awakenIgnition, awakenCharge, bodyAura, chargePressure, chargeFracture, kickImpact, push, sprintTrail, vanish, launchTrail, groundSlam, chargeSpark, groundRing, chargeFull, bigBlast, guardBreak, dizzy, blockSpark, parry, ring, flash, sparks, impact, dust, dashBurst, awakenBurst, auraSpark, trail, sprite, update, clear };
})();

/* V39 — Cinematic effects. These are independent of gameplay: no movement,
 * hitboxes or camera targeting is altered. Geometry is short-lived, cleaned up
 * on round transitions and scaled by the existing Graphics quality setting.
 */
const Spectacle = (() => {
  const live = [];
  const UP = new V3(0, 1, 0);
  const Z = new V3(0, 0, 1);
  const mat = (color, opacity = 0.85) => new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, fog: false, toneMapped: false
  });
  function budget() { const q = Settings.get('quality'); return q === 'low' ? 35 : q === 'medium' ? 82 : 132; }
  function quality() { return Settings.get('quality') !== 'low'; }
  function emit(mesh, duration, step, geometryOwned = true) {
    if (live.length >= budget()) {
      if (geometryOwned && mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      return;
    }
    mesh.renderOrder = 7; scene.add(mesh);
    live.push({ mesh, duration, time: 0, step, geometryOwned });
  }
  function ribbon(a, b, color, thickness, duration, opacity = 0.85) {
    const delta = b.clone().sub(a), length = delta.length();
    if (length < 0.05) return;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(thickness * 0.28, thickness, length, 4, 1), mat(color, opacity));
    mesh.position.copy(a).addScaledVector(delta, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, delta.normalize());
    emit(mesh, duration, (m, t) => {
      m.material.opacity = opacity * Math.pow(1 - t, 1.5);
      m.scale.set(1 - 0.6 * t, 1 - 0.18 * t, 1 - 0.6 * t);
    });
  }
  function circle(pos, direction, radius, color, lifetime, arc = TAU, opacity = 0.8) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, Math.max(0.017, radius * 0.045), 5, 28, arc), mat(color, opacity));
    mesh.position.copy(pos); mesh.quaternion.setFromUnitVectors(Z, direction.clone().normalize());
    emit(mesh, lifetime, (m, t) => {
      m.scale.setScalar(0.7 + 2.6 * t);
      m.material.opacity = opacity * (1 - t) * (1 - t);
    });
  }
  // The swipe is a *short-lived* arc timed with the attack's active frame,
  // not an orb or a trail that obscures the fighter.
  function swing(f, stage) {
    if (!quality() || f.hp <= 0) return;
    const dir = f.forward(), col = f.awakened ? f.pal.aura : f.pal.ki;
    const base = f.center.clone().addScaledVector(dir, stage === 3 ? 0.92 : 0.74);
    base.y += stage === 3 ? -0.26 : stage === 2 ? 0.16 : 0.06;
    const side = stage % 2 ? -1 : 1;
    const right = new V3(dir.z, 0, -dir.x).multiplyScalar(side);
    const len = stage === 3 ? 1.7 : stage === 2 ? 1.35 : 1.0;
    const width = stage === 3 ? 0.058 : 0.038;
    const a = base.clone().addScaledVector(right, -0.22).addScaledVector(dir, -0.18);
    const b = base.clone().addScaledVector(right, 0.55).addScaledVector(dir, len * 0.42);
    ribbon(a, b, col, width, stage === 3 ? 0.16 : 0.11, 0.72);
    if (stage >= 2) {
      const a2 = base.clone().addScaledVector(right, -0.38).addScaledVector(new V3(0,0.06,0),1);
      const b2 = base.clone().addScaledVector(right, 0.40).addScaledVector(dir, len * 0.30);
      ribbon(a2, b2, 0xffffff, width * 0.65, stage === 3 ? 0.17 : 0.12, 0.46);
    }
  }
  // Contact is computed between the fighters, avoiding explosion cores behind the rival.
  function contact(f, target, stage, counter) {
    const dir = target.center.clone().sub(f.center).normalize();
    const point = target.center.clone().addScaledVector(dir, -0.55);
    point.y += stage === 3 ? -0.18 : stage === 2 ? 0.1 : 0;
    const color = f.awakened ? f.pal.aura : stage === 3 ? 0xffd166 : f.pal.ki;
    const count = Settings.get('quality') === 'low' ? 3 : stage === 3 ? 10 : stage === 2 ? 7 : 4;
    for(let k=0; k<count; k++) {
      const angle = (k / count) * TAU + stage;
      const spread = new V3(Math.cos(angle)*0.9,Math.sin(angle)*0.7,0).applyAxisAngle(UP,f.facing);
      const d=spread.addScaledVector(dir,1.5).normalize();
      ribbon(point, point.clone().addScaledVector(d, (stage===3?2:1.3) * (0.65 + Math.random()*0.5)), k%4===0?0xffffff:color, 0.045, 0.17+Math.random()*0.08);
    }
  }
  // Quick pressure cuts only: neither boosted flight nor a dash gets a glowing shell.
  function dashStart(f) {
    const direction = f.dashDir.lengthSq() > 0.01 ? f.dashDir.clone().normalize() : f.forward();
    const pos = f.center;
    const side = new V3(-direction.z,0,direction.x), col = f.awakened ? f.pal.aura : 0xc5eafa;
    for (let i=0;i<(Settings.get('quality')==='low'?2:5);i++) {
      const offset=(i-2)*0.26;
      const a=pos.clone().addScaledVector(side,offset).addScaledVector(direction,-0.3);
      const b=a.clone().addScaledVector(direction,-1.6 - Math.random()*1.3);
      ribbon(a,b,i===0?0xffffff:col,0.033,0.17);
    }
    // A narrow air-pressure ring is emitted once, behind the character.
    if (quality()) circle(pos.clone().addScaledVector(direction,-0.65),direction,0.58,col,0.18,TAU,0.42);
  }
  // Anchor speed lines to real bones so they travel with the fighter rather
  // than existing as a disconnected screen-space effect.
  function anchor(f, name, fallback) {
    const h = f.vrmRig && f.vrmRig.vrm && f.vrmRig.vrm.humanoid;
    const n = h && h.getNormalizedBoneNode(name);
    return n ? n.getWorldPosition(new V3()) : fallback;
  }
  function dashWake(f) {
    if (!quality()) return;
    const d=f.vel.lengthSq()>0.01?f.vel.clone().normalize():f.dashDir.clone().normalize();
    const side=new V3(-d.z,0,d.x), col=f.awakened?f.pal.aura:0x98dfff;
    // Twin torso/shoulder streams make aerial dash as legible as grounded dash.
    const c=f.center.clone();
    for (const i of [-1,1]) {
      const name=i<0?'rightUpperArm':'leftUpperArm';
      const a=anchor(f,name,c.clone().addScaledVector(side,i*0.37).add(new V3(0,0.15,0)));
      a.addScaledVector(d,-0.26);
      ribbon(a,a.clone().addScaledVector(d,-(f.flying?2.25:1.55)),i<0?0xffffff:col,0.021,0.14,0.46);
    }
    const waist=anchor(f,'hips',c.clone().add(new V3(0,-0.58,0))).addScaledVector(d,-0.24);
    ribbon(waist,waist.clone().addScaledVector(d,-(f.flying?1.95:1.45)),col,0.02,0.14,0.39);
  }
  function flightWake(f) {
    if(!quality() || !f.flying || !f.sprinting || f.dashing) return;
    const d=f.vel.lengthSq()>0.5?f.vel.clone().normalize():f.forward();
    const p=f.center.clone(), side=new V3(-d.z,0,d.x);
    const col=f.awakened?f.pal.aura:0x9edbff;
    for(const i of [-1,1]) {
      const start=anchor(f,i<0?'rightUpperArm':'leftUpperArm',p.clone().addScaledVector(side,i*0.34));
      start.addScaledVector(d,-0.25);
      ribbon(start,start.clone().addScaledVector(d,-1.65),col,0.019,0.14,0.36);
    }
  }
  function muzzle(pos, dir, color, level) {
    const max = level > 0.93;
    if (!quality()) return;
    const n = max ? 10 : level>0.3?7:4;
    for(let i=0;i<n;i++) {
      const angle=TAU*i/n;
      const tangent=new V3(Math.cos(angle),Math.sin(angle),0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z,dir));
      const a=pos.clone().addScaledVector(tangent,0.25+level*0.25);
      const b=a.clone().addScaledVector(dir,1.6+level*1.4).addScaledVector(tangent,level+0.35);
      ribbon(a,b,i%3===0?0xffffff:color,0.04,0.21+level*0.12);
    }
  }
  function wake(pos, dir, color, level) {
    if (!quality()) return;
    const a=pos.clone().addScaledVector(dir,-0.18), b=a.clone().addScaledVector(dir,-1.05-level*1.0);
    ribbon(a,b,color,0.028+0.012*level,0.14,0.5);
    if(level>0.45) {
      const theta=Math.random()*TAU;
      const radial=new V3(Math.cos(theta),Math.sin(theta),0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z,dir));
      const at=a.clone().addScaledVector(radial,0.4+level*0.5);
      ribbon(at,at.clone().addScaledVector(dir,-1.4),0xffffff,0.022,0.15,0.55);
    }
  }
  function explosion(pos, dir, color, level) {
    const superShot = level > 0.93;
    // Full-power impact is handled by Effects.bigBlast's energy cloud and the
    // enemy recoil, not a spiky wireframe/starburst explosion.
    if (superShot || !quality()) return;
    const n = 7;
    for(let i=0;i<n;i++) {
      const a=TAU*i/n, spread = new V3(Math.cos(a),Math.sin(a),0)
        .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z,dir));
      const ray=spread.multiplyScalar(1.1).addScaledVector(dir,0.8).normalize();
      ribbon(pos,pos.clone().addScaledVector(ray,1.6 + (superShot?2.6:level)),i%4===0?0xffffff:color, superShot?0.09:0.055,superShot?0.36:0.23);
    }
  }
  function update(dt) {
    for(let i=live.length-1;i>=0;i--) {
      const x=live[i]; x.time+=dt;
      const t=Math.min(1,x.time/x.duration);
      x.step(x.mesh,t,dt);
      if(x.time>=x.duration) { dispose(x); live.splice(i,1); }
    }
  }
  function dispose(x) {
    scene.remove(x.mesh);
    if(x.geometryOwned && x.mesh.geometry) x.mesh.geometry.dispose();
    if(x.mesh.material) x.mesh.material.dispose();
  }
  function clear() {live.forEach(dispose);live.length=0;}
  return {swing,contact,dashStart,dashWake,flightWake,muzzle,wake,explosion,update,clear};
})();
/* ---------------- Lightweight combat audio (procedural/offline) ---------------- */
const Sound = (() => {
  let ctx = null, last = 0;
  const config = {
    hit: [155, 58, 0.075, 'triangle', 0.075],
    heavy: [125, 38, 0.15, 'sawtooth', 0.105],
    parry: [540, 1050, 0.16, 'sine', 0.085],
    block: [245, 105, 0.075, 'triangle', 0.055],
    blast: [540, 190, 0.2, 'sawtooth', 0.06],
    charge: [320, 95, 0.36, 'triangle', 0.12],
    dash: [330, 105, 0.13, 'sawtooth', 0.045],
    swing: [550, 240, 0.075, 'triangle', 0.022],
    super: [180, 950, 0.52, 'sawtooth', 0.09],
    superHit: [165, 42, 0.42, 'triangle', 0.11],
    vanish: [750, 170, 0.12, 'sine', 0.065],
    awaken: [180, 760, 0.6, 'triangle', 0.095],
  };
  function play(which) {
    if (!Settings.get('sound')) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio || !config[which]) return;
    try {
      if (!ctx) ctx = new Audio();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      // Cap identical impact bursts: keeps sound clean during fast, overlapping combos.
      if (now - last < 0.024 && (which === 'hit' || which === 'block')) return;
      last = now;
      const [start, end, dur, wave, vol] = config[which];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = wave; o.frequency.setValueAtTime(start, now);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + dur);
      g.gain.setValueAtTime(0.001, now); g.gain.exponentialRampToValueAtTime(vol, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + dur + 0.015);
      o.onended = () => { o.disconnect(); g.disconnect(); };
    } catch (err) { /* browsers may disable audio; the game remains playable */ }
  }
  return { play };
})();

/* ---------------- Combat ---------------- */
const Combat = (() => {
  const projectiles = [];
  const geo = new THREE.SphereGeometry(0.3, 14, 10);
  function damageMul(f) { return (f.awakened ? TUNING.awakenDamage : 1) * (f._dmgMul || 1); }
  function hit(attacker, target, dmg, knock, heavy = false, kind = 'melee') {
    if (target.hp <= 0) return;
    if (dmg <= 0 || target.invulnT > 0) return;
    // the rival can sometimes teleport out of the way of your attack
    if (target === Game.enemy && RivalAI.dodge(target, attacker)) return;
    const floorHp = Game.training ? 1 : 0;   // nobody gets knocked out in training
    // blocking only works against attacks from the front
    if (target.blocking) {
      const toA = attacker.pos.clone().sub(target.pos).setY(0).normalize();
      if (target.forward().dot(toA) > -0.05) return blocked(attacker, target, dmg, knock, kind, floorHp);
    }
    target.hp = Math.max(floorHp, target.hp - dmg);
    if (typeof attacker.gainAwaken === 'function') attacker.gainAwaken(Math.min(13, 3 + dmg * 0.8));
    if (typeof target.gainAwaken === 'function') target.gainAwaken(Math.min(13, 3 + dmg * 0.7));
    target.hurtT = 0;
    if (attacker === Game.player) Game.onPlayerHit(dmg);
    target.stun = heavy ? 0.52 : (kind === 'melee' ? 0.41 : 0.27); target.hitFlash = heavy ? 0.20 : 0.15;
    target.meleeQ = 0; target.meleeBuf = 0; target.combo = 0;
    if (kind !== 'melee') { target.launched = target.launched && target.pos.y > target.floor + 0.5; }
    target.vel.copy(knock);
    target.dashT = 0;
    const c = target.center;
    Effects.impact(c, attacker.awakened ? attacker.pal.aura : 0xffe8a8, heavy,
      knock.lengthSq()>0.001?knock.clone().normalize():attacker.forward());
    Sound.play(heavy ? 'heavy' : 'hit');
    CameraRig.shake((attacker === Game.player ? 0.25 : 0.4) * (heavy ? 1.6 : 1));
    Game.hitStop(heavy ? 0.075 : 0.035);
    if (target === Game.player && Settings.get('haptics') && navigator.vibrate) navigator.vibrate(30);
    return 'hit';
  }
  function blocked(attacker, target, dmg, knock, kind, floorHp) {
    const c = target.center.add(target.forward().multiplyScalar(0.7));
    target.hurtT = 0;
    // After a real guarded hit, double-tap Guard to slip behind the attacker.
    target.guardCounterWindow = TUNING.defensiveVanishWindow;
    target.guardHitBy = attacker;
    if (typeof target.gainAwaken === 'function') target.gainAwaken(5);
    if (target.blockT < target.parryOk) {
      // parry: no damage; a parried punch leaves the attacker wide open
      target.guard = Math.min(TUNING.guardMax, target.guard + 20);
      target.riposteT = 1.15; // player can punish with their next melee attack
      if (kind === 'melee') {
        attacker.stun = TUNING.parryStun; attacker.hitFlash = 0.15; attacker.windT = 0;
        attacker.vel.copy(attacker.pos.clone().sub(target.pos).setY(0).normalize().multiplyScalar(8));
      }
      Effects.parry(c); Sound.play('parry'); Game.hitStop(0.14); CameraRig.shake(0.3);
      Game.callout(target === Game.player ? 'Parry' : 'Parried', 'parry');
      return;
    }
    target.hp = Math.max(floorHp, target.hp - dmg * TUNING.blockChip);
    target.guard -= dmg * (kind === 'charged' ? 3.7 : kind === 'blast' ? 2.4 : 4.2); target.guardDelay = TUNING.guardRegenDelay;
    target.vel.copy(knock).multiplyScalar(0.3).setY(0);
    if (target.guard <= 0) { target.guardCounterWindow = 0;
      Sound.play('heavy');
      target.guard = 0; target.guardDelay = 1.6;
      target.stun = TUNING.guardBreakStun; target.brokenT = TUNING.guardBreakStun; target.hitFlash = 0.2; target.blocking = false;
      target.vel.copy(knock).multiplyScalar(0.8);
      Effects.guardBreak(target); Effects.dizzy(target, TUNING.guardBreakStun); Game.hitStop(0.18); CameraRig.shake(0.65);
      Game.callout('Guard break', 'break'); Game.onGuardBreak(target);
      if (target === Game.player && Settings.get('haptics') && navigator.vibrate) navigator.vibrate([40, 30, 60]);
    } else { Sound.play('block'); Effects.blockSpark(c); Game.hitStop(0.035); CameraRig.shake(0.12); }
    if (target === Game.player && Settings.get('haptics') && navigator.vibrate) navigator.vibrate(15);
  }
  // Four readable beats: jab > cross > turning hook > rising kick.
  // Input buffering happens in Game, contact is delayed until the corresponding active frame.
  function melee(attacker, target) {
    if (attacker.awakenChargeT > 0 || attacker.meleeCd > 0 || attacker.punchT > 0 || attacker.stun > 0 || attacker.launched || attacker.downT > 0) return;
    if (attacker.charging) attacker.cancelCharge();
    if (attacker.t - attacker.lastMelee > TUNING.comboWindow) attacker.combo = 0;
    const stage = attacker.combo;
    const kick = stage === 3;
    const counter = attacker.riposteT > 0;
    if (counter) attacker.riposteT = 0;
    attacker.lastMelee = attacker.t;
    attacker.combo = (stage + 1) % 4;
    attacker.sprinting = false; attacker.skidT = 0; attacker.dashT = 0; attacker.dashPrep = 0; attacker.dashRecoverT = 0; attacker.chase = null;
    const moveDir = attacker.moveIntent.lengthSq() > 0.05 ? attacker.moveIntent.clone().setY(0).normalize() : (Math.hypot(attacker.vel.x, attacker.vel.z) > 0.1 ? attacker.vel.clone().setY(0).normalize() : attacker.forward());
    attacker.attackTravel = moveDir.clone();
    attacker.attackAir = attacker.flying;
    attacker.attackDrive = Math.max(2.4, Math.min(8.0, Math.hypot(attacker.vel.x, attacker.vel.z) + (attacker.sprintHeld ? 2.4 : 0)));
    attacker.attackMoving = attacker.attackDrive > 2.8 || attacker.moveIntent.lengthSq() > 0.12;
    // Once the finisher is started, do not automatically spin a buffered press
    // into the next opening jab. A fresh input can start a new combo afterward.
    if (stage === 3) { attacker.meleeQ = 0; attacker.meleeBuf = 0; }
    attacker.attackKind = attacker.attackAir && stage === 3 ? 'airStrike' : kick ? 'kick' : stage === 2 ? 'hook' : 'punch';
    attacker.attackSerial++;
    // Distinct timing gives each attack identity. Last kick has a longer readable recovery.
    const cd = [0.43, 0.51, 0.69, 0.88][stage];
    const anim = [0.42, 0.50, 0.68, 0.87][stage];
    attacker.meleeCd = cd; attacker.punchT = anim;
    attacker.attackTotal = anim; attacker.attackElapsed = 0;
    attacker.punchSide = stage === 0 || stage === 2 ? 1 : 0;
    const toT = target.pos.clone().sub(attacker.pos), dist = toT.length();
    // Soft target assist only within punching/lunge range; no auto-turn across the arena.
    if (dist > 0.01 && dist < TUNING.lungeRange) {
      const to = yawFromDir(toT.x, toT.z);
      attacker.facing = lerpAngle(attacker.facing, to, dist < 4 ? 0.9 : 0.55);
      if (dist > TUNING.meleeRange * 0.55 && dist < TUNING.meleeRange + 0.9) {
        // Small grounded follow-step, not a long-range homing punch.
        const dir = toT.setY(0).normalize();
        const step = Math.min(6.0, 4.8 + stage * 0.35);
        attacker.attackTravel = dir.clone();
        attacker.attackDrive = Math.max(attacker.attackDrive, step * 0.92);
        attacker.vel.lerp(dir.multiplyScalar(step), 0.35);
        attacker.lungeAt = attacker.t;
      }
    }
    // Wind-up/contact/recovery are distinct. Chaining doesn't duplicate a queued hit.
    attacker.kickPend = { target, t: [0.15, 0.20, 0.33, 0.41][stage], kick, stage, counter, swingPlayed: false };
    if (counter && attacker === Game.player) Game.callout('Counter!', 'parry');
  }
  function strike(attacker, target, kick, stage = 0, counter = false) {
    if (target.hp <= 0) return;
    const air = target.launched && !target.spiked;
    const toT = target.pos.clone().sub(attacker.pos); const dist = toT.length();
    // The kick reaches slightly farther, but fists cannot strike from empty space.
    const reach = TUNING.meleeRange + (kick ? 0.22 : 0) + (attacker.awakened ? 0.08 : 0);
    if (dist > reach || dist < 0.001) return;
    const fwd = attacker.forward(); const flat = new V3(toT.x, 0, toT.z).normalize();
    if (fwd.dot(flat) <= Math.cos(TUNING.meleeArc) && dist >= 1.4) return;
    const base = TUNING.meleeDamage * damageMul(attacker) * [0.87, 1, 1.2, 1.58][stage] * (counter ? 1.3 : 1);
    const col = attacker.awakened ? attacker.pal.aura : attacker.pal.ki;
    let result;
    if (air && kick) {
      const kd = fwd.clone();
      result = hit(attacker, target, base * 1.25, fwd.multiplyScalar(6).setY(-TUNING.spikeSpeed), true);
      if (result === 'hit') { kickImpact(attacker, target, kd); target.spiked = true; target.stun = 2;
        Game.callout('Air smash', 'smash'); Effects.flash(target.center, 0xffd166, 2.4, 0.12); }
    } else if (air) {
      result = hit(attacker, target, base * 0.83, fwd.multiplyScalar(3).setY(4.5), stage === 2);
      if (result === 'hit') { target.juggle++; target.launched = true;
        target.stun = target.juggle >= TUNING.juggleMax ? 0.25 : Math.max(0.3, TUNING.airHitStun - 0.07 * target.juggle); }
    } else if (kick) {
      const kd = fwd.clone();
      result = hit(attacker, target, base, fwd.multiplyScalar(4).setY(TUNING.launchUp), true);
      if (result === 'hit') { kickImpact(attacker, target, kd); target.launched = true; target.launchT = 0;
        target.juggle = 0; target.stun = TUNING.launchStun; Effects.launchTrail(target);
        if (attacker === Game.player) Game.callout('Launch!', 'launch'); }
    } else {
      // Opening strikes keep opponents within range for a real four-hit chain.
      const push = [3.1, 4.0, 6.6][stage];
      result = hit(attacker, target, base, fwd.multiplyScalar(push).setY(stage === 2 ? 2.2 : 0.8), stage === 2 || counter);
    }
    if (result === 'hit') {
      Spectacle.contact(attacker, target, stage, counter);
      if (stage < 3) target.stun = Math.max(target.stun, [0.45, 0.49, 0.60][stage]);
      // Subtle hit-confirm follow-step while leaving movement and dash under player control.
      if (!attacker.flying && stage < 3) attacker.vel.addScaledVector(attacker.forward(), 1.35);
      // Small distinct trail bursts on the first three contacts: cleaner than freezing the whole screen.
      attacker.energy = Math.min(100, attacker.energy + (kick ? 3.2 : 1.3));
      if (counter) { target.stun = Math.max(target.stun, 0.63); attacker.energy = Math.min(100, attacker.energy + 5); }
    }
  }
  // kick connects: longer freeze, bigger shake, a shockwave facing the kick and a burst of sparks thrown along it
  function kickImpact(attacker, target, dir) {
    const c = target.center, col = attacker.awakened ? attacker.pal.aura : attacker.pal.ki;
    Effects.kickImpact(c, dir, col);
    Game.hitStop(TUNING.kickHitStop);
    CameraRig.shake(attacker === Game.player ? 0.55 : 0.6);
    if (attacker === Game.player && Settings.get('haptics') && navigator.vibrate) navigator.vibrate(45);
  }
  function blast(attacker, target, aimMode, lvl = 0) {
    const cost = TUNING.blastCost + TUNING.chargeCost * lvl;
    if (attacker.awakenChargeT > 0 || attacker.blastCd > 0 || attacker.stun > 0 || attacker.energy < cost - 0.01) return;
    attacker.cancelCharge();
    attacker.energy = Math.max(0, attacker.energy - cost); attacker.blastCd = TUNING.blastCooldown * (1 + lvl);
    Sound.play(lvl > 0.45 ? 'charge' : 'blast');
    attacker.blastT = 0.26 + lvl * 0.14; attacker.blastLvl = lvl;
    const size = 1 + 1.7 * lvl;
    const start = attacker.center.add(attacker.forward().multiplyScalar(1.1));
    let dir;
    const toT = target.center.sub(start);
    const fwd = attacker.forward();
    const angle = Math.acos(clamp(fwd.dot(new V3(toT.x, 0, toT.z).normalize()), -1, 1));
    if (aimMode === 'target' || angle < TUNING.blastAssistAngle) dir = toT.normalize();
    else dir = fwd;
    if (aimMode === 'target') attacker.facing = yawFromDir(dir.x, dir.z);
    const color = attacker.awakened ? attacker.pal.aura : attacker.pal.ki;
    const superShot = lvl > 0.93;
    const bigShot = lvl > 0.55;
    const group = new THREE.Group();
    const core = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, toneMapped: false }));
    core.scale.setScalar((0.66 + 0.54 * lvl) * size); group.add(core);
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34 + lvl * 0.25, 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: superShot ? 0.82 : 0.74, depthWrite: false,
        blending: THREE.AdditiveBlending, toneMapped: false }));
    shell.scale.set(size * 1.0, size * 1.0, size * (1.55 + lvl * 0.4)); group.add(shell);
    const shell2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.20 + lvl * 0.12, 1),
      new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.52, depthWrite:false,
        blending:THREE.AdditiveBlending, toneMapped:false }));
    shell2.scale.set(size * 0.95, size * 0.95, size * (1.95 + lvl * 0.7)); group.add(shell2);
    const glow = Effects.sprite(TEX.glow, color, 1.7 + lvl * 2.1, 0.86);
    const halo = Effects.sprite(TEX.glow, color, 2.6 + lvl * 3.1, 0.17);
    const coreHalo = Effects.sprite(TEX.glow, 0xffffff, 1.0 + lvl * 1.0, 0.70);
    group.add(glow, halo, coreHalo);
    const powerFins = [];
    if (bigShot) {
      // Charged blast silhouette: a bright elongated plasma spear with layered trailing fins.
      // Normal small projectiles keep their existing appearance.
      core.scale.set(1.0, 1.0, 1.55 + 1.2 * lvl);
      shell.scale.set(size * 0.84, size * 0.84, size * (1.90 + lvl * 0.48));
      shell2.scale.set(size * 0.76, size * 0.76, size * (2.32 + lvl * 0.58));
      for (let j = 0; j < (superShot ? 8 : 5); j++) {
        const a = (j / (superShot ? 8 : 5)) * Math.PI * 2;
        const dist = 0.55 + lvl * 0.5;
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.18 + lvl * 0.08, 1.9 + lvl * 2.5, 5, 1),
          new THREE.MeshBasicMaterial({color: j % 3 === 0 ? 0xffffff : color, transparent: true,
            opacity: j % 3 === 0 ? 0.80 : 0.48, depthWrite: false,
            blending: THREE.AdditiveBlending, toneMapped: false}));
        fin.rotation.x = Math.PI * 0.5;
        fin.position.set(Math.cos(a) * dist, Math.sin(a) * dist, -1.25 * lvl);
        group.add(fin); powerFins.push({ mesh: fin, angle: a, dist, alpha: fin.material.opacity });
      }
      halo.scale.multiplyScalar(1.25); coreHalo.scale.multiplyScalar(1.20);
    }
    const orbiters = [];
    if (Settings.get('quality') !== 'low') {
      for (let j=0; j<(superShot?4:2); j++) {
        const orb = Effects.sprite(TEX.glow, j%2?0xffffff:color, 0.32 + lvl * 0.22, 0.72);
        orb.position.set(Math.cos(j * Math.PI) * (0.46 + lvl * 0.16), Math.sin(j * Math.PI) * (0.30 + lvl * 0.10), -0.12 * j);
        group.add(orb); orbiters.push(orb);
      }
    }
    group.position.copy(start); group.quaternion.setFromUnitVectors(new V3(0,0,1), dir.clone().normalize()); scene.add(group);
    Spectacle.muzzle(start, dir, color, lvl);
    Effects.flash(start, color, 1.6 * (1 + 0.6 * lvl), 0.10 + lvl * 0.04);
    if (lvl > 0.3) {
      if (attacker === Game.player) CameraRig.shake(0.10 + lvl * 0.12);
      attacker.vel.addScaledVector(dir, -4 * lvl);
    }
    if (superShot) { Sound.play('super'); if (attacker === Game.player) Game.callout('SUPER BLAST', 'launch'); }
    projectiles.push({ mesh: group, core, shell, shell2, glow, halo, orbiters, powerFins, wakeT: 0,
      vel: dir.multiplyScalar(TUNING.blastSpeed - 14 * lvl), owner: attacker, target, life: 2.4 + lvl, color, lvl, size,
      dmg: (TUNING.blastDamage + TUNING.chargeDmg * lvl) * damageMul(attacker) * (superShot ? 1.12 : 1) });
  }
  function update(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.mesh.position.addScaledVector(p.vel, dt); p.life -= dt;
      p.shell.rotation.y += dt * (7 + p.lvl * 5);
      p.shell.rotation.z += dt * 4;
      if (p.shell2) { p.shell2.rotation.x -= dt * 5.5; p.shell2.rotation.y += dt * 3.8; }
      p.glow.material.opacity = 0.72 + 0.16*Math.sin(p.life*28);
      if (p.halo) p.halo.material.opacity = 0.16 + 0.06*Math.sin(p.life*20);
      if (p.orbiters) p.orbiters.forEach((o,i)=> { const a = p.life*8 + i*Math.PI; o.position.set(Math.cos(a)*(0.34+p.lvl*0.12), Math.sin(a*1.2)*(0.22+p.lvl*0.08), -0.15); o.material.opacity = 0.62; });
      if (p.powerFins) p.powerFins.forEach((q,i) => {
        const a = q.angle + p.life * (i % 2 ? -1.2 : 1.0);
        q.mesh.position.x = Math.cos(a) * q.dist;
        q.mesh.position.y = Math.sin(a) * q.dist;
        q.mesh.material.opacity = q.alpha * (0.83 + 0.17 * Math.sin(p.life * 24 + i));
      });
      // Fixed-rate wake avoids creating dozens of sprites per frame on phones.
      p.wakeT -= dt;
      if (p.wakeT <= 0) {
        p.wakeT = Settings.get('quality') === 'low' ? 0.09 : 0.045;
        Effects.trail(p.mesh.position, p.color, 0.8 + 0.42*p.lvl);
        Spectacle.wake(p.mesh.position, p.vel.clone().normalize(), p.color, p.lvl);
      }
      let dead = p.life <= 0 || p.mesh.position.y < 0 || Math.hypot(p.mesh.position.x, p.mesh.position.z) > ARENA_RADIUS + 20;
      if (!dead && p.mesh.position.distanceTo(p.target.center) < 1.25 * (1 + 0.5 * p.lvl) && p.target.hp > 0) {
        const charged = p.lvl > 0.05;
        const dirHit = p.vel.clone().normalize();
        const result = hit(p.owner, p.target, p.dmg, dirHit.clone().multiplyScalar(12 + 14 * p.lvl).setY(charged ? 2 + 3 * p.lvl : 0), p.lvl > 0.5, charged ? 'charged' : 'blast');
        // Full-power impact throws the victim into a readable, recorded recoil
        // and a controlled airborne arc instead of an instantaneous standing flash.
        if (result === 'hit' && p.lvl > 0.93) {
          p.target.superHitT = 0.82;
          p.target.stun = Math.max(p.target.stun, 0.92);
          p.target.launched = true; p.target.launchT = 0;
          p.target.vel.copy(dirHit).multiplyScalar(19).add(new V3(0, 6.8, 0));
          p.target.dashT = 0; p.target.sprinting = false; p.target.meleeQ = 0;
        }
        dead = true;
        const dir = p.vel.clone().normalize();
        Spectacle.explosion(p.mesh.position, dir, p.color, p.lvl);
        if (charged) {
          Effects.bigBlast(p.mesh.position, p.color, p.lvl);
          CameraRig.shake(0.22 + p.lvl * 0.26);
          if (p.lvl > 0.93) { Game.hitStop(0.11); Sound.play('superHit'); }
        } else { Effects.flash(p.mesh.position, 0xffffff, 1.6, 0.09); Effects.flash(p.mesh.position, p.color, 2.7, 0.14); }
      }
      if (dead) { remove(p); projectiles.splice(i, 1); }
    }
  }
  function remove(p) {
    scene.remove(p.mesh);
    p.mesh.traverse(c => {
      if (c.material) { if (Array.isArray(c.material)) c.material.forEach(m=>m.dispose()); else c.material.dispose(); }
      // The original projectile sphere geometry is shared, not owned by this shot.
      if (c.geometry && c.geometry !== geo) c.geometry.dispose();
    });
  }
  function clear() { projectiles.forEach(remove); projectiles.length = 0; }
  // ground slam shockwave: hits anyone on or near the floor nearby and pops them up
  function slam(attacker, target) {
    const dx = target.pos.x - attacker.pos.x, dz = target.pos.z - attacker.pos.z, d = Math.hypot(dx, dz);
    if (d > TUNING.slamRadius || target.pos.y > target.floor + 2.5) return;
    const out = d > 0.01 ? new V3(dx / d, 0, dz / d) : attacker.forward();
    const near = 1 - 0.4 * (d / TUNING.slamRadius);   // a bit less damage at the edge of the wave
    const done = hit(attacker, target, TUNING.slamDamage * near * damageMul(attacker), out.multiplyScalar(10).setY(TUNING.slamUp), true, 'slam');
    if (done === 'hit') {
      target.launched = true; target.launchT = 0; target.juggle = 0; target.stun = 0.75;
      Game.callout(attacker === Game.player ? 'Ground slam' : 'Rival slam', 'smash');
    }
  }
  return { slam, melee, strike, blast, update, clear, projectiles };
})();


/* ---------------- Input ---------------- */
const Input = (() => {
  const keys = new Set();
  const held = { up: false, down: false, block: false, blast: false, dash: false };
  const queued = new Set();
  // Run button: first press = run, second press within the double-tap window = dash
  let lastRunTap = -9;
  let lastBlockTap = -9;
  const pressRun = ev => { const now = (ev && ev.timeStamp ? ev.timeStamp : performance.now()) / 1000; if (now - lastRunTap < TUNING.doubleTap) { queued.add('dash2'); lastRunTap = -9; } else { queued.add('dash'); lastRunTap = now; } };
  const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
  const look = { id: null, lx: 0, ly: 0, dx: 0, dy: 0, active: false };
  const MAX = 52;
  const knob = $('stickKnob'), base = $('stickBase'), zone = $('stickZone');

  const keyAct = { Space: 'dash', KeyJ: 'melee', KeyK: 'blast', KeyT: 'awaken', KeyL: 'lock', KeyV: 'vanish' };
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); Game.togglePause(); return; }
    if (Game.state !== 'playing') return;
    if (keyAct[e.code] && !e.repeat) { if (keyAct[e.code] === 'dash') pressRun(e); else queued.add(keyAct[e.code]); }
    if (['ShiftLeft','ShiftRight','KeyB'].includes(e.code) && !e.repeat && !keys.has(e.code)) {
      const now = (e.timeStamp || performance.now()) / 1000;
      if (now - lastBlockTap < TUNING.doubleTap) { queued.add('vanish'); lastBlockTap = -9; }
      else lastBlockTap = now;
    }
    keys.add(e.code);
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));

  // Stick
  zone.addEventListener('pointerdown', e => {
    if (stick.id !== null || Game.state !== 'playing') return;
    stick.id = e.pointerId; zone.setPointerCapture(e.pointerId);
    const r = base.getBoundingClientRect();
    // floating stick: recentre under the finger if it lands outside the base
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (Math.hypot(e.clientX - cx, e.clientY - cy) > r.width * 0.7) {
      base.style.left = (e.clientX - r.width / 2) + 'px'; base.style.top = (e.clientY - r.height / 2) + 'px'; base.style.bottom = 'auto';
      stick.ox = e.clientX; stick.oy = e.clientY;
    } else { stick.ox = cx; stick.oy = cy; }
    moveStick(e);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === stick.id) moveStick(e); });
  const endStick = e => { if (e.pointerId !== stick.id) return; resetStick(); };
  zone.addEventListener('pointerup', endStick); zone.addEventListener('pointercancel', endStick);
  function moveStick(e) {
    let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy; const d = Math.hypot(dx, dy);
    if (d > MAX) { dx *= MAX / d; dy *= MAX / d; }
    stick.x = dx / MAX; stick.y = -dy / MAX;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  }
  function resetStick() {
    stick.id = null; stick.x = stick.y = 0; knob.style.transform = '';
    base.style.left = ''; base.style.top = ''; base.style.bottom = '';
  }

  // Buttons
  document.querySelectorAll('.cbtn').forEach(b => {
    const act = b.dataset.act;
    let y0 = 0, noBlock = false;
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); if (Game.state !== 'playing') return;
      b.setPointerCapture(e.pointerId); b.classList.add('pressed');
      if (act === 'fly') { y0 = e.clientY; held.up = true; held.down = false; return; }
      // one pad: hold = rise, slide down = descend
      if (act === 'block') {                                                                  // tap/hold = block or parry, double-tap = vanish
        const now = e.timeStamp / 1000;
        if (now - lastBlockTap < TUNING.doubleTap) { queued.add('vanish'); lastBlockTap = -9; noBlock = true; return; }
        lastBlockTap = now; noBlock = false; held.block = true; return;
      }
      if (act in held) held[act] = true;
      if (act === 'dash') pressRun(e); else if (!(act in held) || act === 'blast') queued.add(act);
    });
    if (act === 'fly') b.addEventListener('pointermove', e => {
      if (!b.classList.contains('pressed')) return;
      const dy = e.clientY - y0;
      if (dy > 22 && !held.down) { held.down = true; held.up = false; b.classList.add('descend'); }
      else if (dy < 10 && held.down) { held.down = false; held.up = true; b.classList.remove('descend'); }
    });
    const up = () => {
      b.classList.remove('pressed', 'descend');
      if (act === 'fly') { held.up = held.down = false; return; }
      if (act === 'block') { if (!noBlock) held.block = false; noBlock = false; held.block = false; return; }
      if (act in held) held[act] = false;
    };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  });

  // the camera label at the top doubles as the lock-on toggle
  $('camMode').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (Game.state === 'playing') queued.add('lock'); });

  // Camera drag on empty canvas area (touch or mouse)
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', e => {
    if (look.id !== null || Game.state !== 'playing') return;
    look.id = e.pointerId; look.lx = e.clientX; look.ly = e.clientY; look.active = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== look.id) return;
    look.dx += e.clientX - look.lx; look.dy += e.clientY - look.ly; look.lx = e.clientX; look.ly = e.clientY;
  });
  const endLook = e => { if (e.pointerId === look.id) { look.id = null; look.active = false; } };
  canvas.addEventListener('pointerup', endLook); canvas.addEventListener('pointercancel', endLook);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  return {
    move() {
      let x = stick.x, y = stick.y;
      if (keys.has('KeyA')) x -= 1; if (keys.has('KeyD')) x += 1;
      if (keys.has('KeyW')) y += 1; if (keys.has('KeyS')) y -= 1;
      const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
      return { x, y, mag: Math.min(1, l) };
    },
    vertical() { return ((held.up || keys.has('KeyR') || keys.has('KeyE')) ? 1 : 0) - ((held.down || keys.has('KeyF') || keys.has('KeyQ')) ? 1 : 0); },
    takeLook() {
      let dx = look.dx, dy = look.dy; look.dx = look.dy = 0;
      if (keys.has('ArrowLeft')) dx -= 10; if (keys.has('ArrowRight')) dx += 10;
      if (keys.has('ArrowUp')) dy -= 6; if (keys.has('ArrowDown')) dy += 6;
      return { dx, dy };
    },
    dashHeld() { return held.dash || keys.has('Space'); },
    blastHeld() { return held.blast || keys.has('KeyK'); },
    block() { return held.block || keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyB'); },
    get dragging() { return look.active; },
    consume(a) { if (queued.has(a)) { queued.delete(a); return true; } return false; },
    reset() {   // called on pause/restart so nothing sticks
      lastBlockTap = lastRunTap = -9; keys.clear(); queued.clear(); held.up = held.down = held.block = held.blast = held.dash = false; resetStick();
      look.id = null; look.active = false; look.dx = look.dy = 0;
      document.querySelectorAll('.cbtn.pressed').forEach(b => b.classList.remove('pressed', 'descend'));
    },
    _stick: stick,
  };
})();


/* ---------------- Camera rig ----------------
 * Focus model:
 *   lockOn          – the player's chosen mode (Lock button / L)
 *   suspendT > 0    – lock temporarily released because of a dash
 *   focus (0..1)    – how much the camera frames the rival; blended smoothly
 * A dash always sets suspendT, so the camera never chases the rival mid-dash.
 */
const CameraRig = (() => {
  const rig = { yaw: 0, pitch: 0.3, dist: 8.5, focus: 0, suspendT: 0, shakeT: 0, shakeAmp: 0 };
  const look = new V3(), desired = new V3();
  function forward() { return new V3(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw)); }
  function right() { return new V3(Math.cos(rig.yaw), 0, -Math.sin(rig.yaw)); }
  function isLockActive() { return Game.lockOn && rig.suspendT <= 0 && !Game.player.moving; }
  function onDash() {
    if (Game.lockOn) {
      rig.suspendT = TUNING.relockGrace;   // counts down only once the dash ends
      if (Settings.get('dashLock') === 'stay') Game.setLock(false, true);
    }
  }
  function snapBehind(p, e) {
    rig.yaw = camYawFromForward(e.pos.x - p.pos.x, e.pos.z - p.pos.z); rig.pitch = 0.3;
    rig.focus = Game.lockOn ? 1 : 0; rig.suspendT = 0;
    update(0, true);
  }
  function update(dt, instant = false) {
    const p = Game.player, e = Game.enemy;
    if (rig.suspendT > 0 && !p.moving) rig.suspendT -= dt;
    const { dx, dy } = Input.takeLook();
    const sens = Settings.get('sens') * 0.0055;
    const locked = isLockActive();

    if (locked) {
      const target = camYawFromForward(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
      rig.yaw = lerpAngle(rig.yaw, target, instant ? 1 : damp(5, dt));
      rig.yaw -= dx * sens * 0.15;                       // tiny nudge allowed
    } else {
      rig.yaw -= dx * sens;
      if (p.moving) {
        // detached: drift gently with the dash/sprint direction, never towards the rival
        const md = p.dashing ? p.dashDir : new V3(p.vel.x, 0, p.vel.z).normalize();
        const target = camYawFromForward(md.x, md.z);
        const along = Math.abs(forward().dot(md));
        rig.yaw = lerpAngle(rig.yaw, target, damp((p.sprinting ? 2.2 : 1.5) * along, dt));
      } else if (Settings.get('autoCam') && !Input.dragging) {
        const m = Input.move();
        if (m.y > 0.35) rig.yaw = lerpAngle(rig.yaw, camYawFromForward(Math.sin(p.facing), Math.cos(p.facing)), damp(0.9 * m.y, dt));
      }
    }
    rig.pitch = clamp(rig.pitch + dy * sens * (Settings.get('invertY') ? -1 : 1), -0.35, 1.1);

    rig.focus += ((locked ? 1 : 0) - rig.focus) * (instant ? 1 : damp(locked ? 3 : 8, dt));
    // look target: player, pulled toward the rival only while focused
    desired.set(p.pos.x, p.pos.y + 1.5, p.pos.z);
    if (rig.focus > 0.001) {
      const mid = e.center.sub(desired).multiplyScalar(0.3 * rig.focus);
      mid.clampLength(0, 6); desired.add(mid);
    }
    if (instant) look.copy(desired); else look.lerp(desired, damp(14, dt));
    const cameraDistances = { close: 6.15, standard: 8.5, far: 11.4 };
    const desiredDist = cameraDistances[Settings.get('cameraDist')] || 8.5;
    rig.dist += (desiredDist - rig.dist) * (instant ? 1 : damp(5.5, dt));
    const d = rig.dist + (p.dashing ? 0.62 : p.sprinting ? (p.flying ? 1.10 : 0.5) : 0);
    const cp = Math.cos(rig.pitch);
    camera.position.set(look.x + Math.sin(rig.yaw) * cp * d, look.y + Math.sin(rig.pitch) * d, look.z + Math.cos(rig.yaw) * cp * d);
    if (camera.position.y < 0.6) camera.position.y = 0.6;
    if (rig.shakeT > 0) {
      rig.shakeT -= dt; const a = rig.shakeAmp * 0.48 * Math.max(0, rig.shakeT / 0.25);
      camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a;
    }
    camera.lookAt(look);
  }
  return { update, forward, right, onDash, snapBehind, isLockActive, shake(a) { rig.shakeT = 0.25; rig.shakeAmp = Math.max(rig.shakeAmp * 0.40, a); }, rig };
})();


/* ---------------- Rival AI ---------------- */
const RivalAI = (() => {
  const DIFF = {
    easy:   { think: [0.7, 1.3], aggro: 0.35, blast: 0.18, dash: 0.08, dmg: 0.7, block: 0.12, wind: 0.34, chase: 0.2, tech: 0, vanish: 0 },
    normal: { think: [0.45, 0.9], aggro: 0.6, blast: 0.3, dash: 0.15, dmg: 1, block: 0.3, wind: 0.24, chase: 0.6, tech: 0.35, vanish: 0.12 },
    hard:   { think: [0.25, 0.55], aggro: 0.85, blast: 0.4, dash: 0.25, dmg: 1.25, block: 0.5, wind: 0.16, chase: 1.2, tech: 0.9, vanish: 0.3 },
  };
  let mode = 'approach', thinkT = 0, strafeSign = 1, guardT = 0, swingT = 0, chargeT = 0;
  function reset() { mode = 'approach'; thinkT = 0.8; guardT = 0; swingT = 1.5; chargeT = 0; }
  // training partner: never attacks; either stands its ground or circles and dodges
  let trainT = 0, trainSide = 1;
  function training(dt, me, foe, moving) {
    const to = foe.pos.clone().sub(me.pos); const dist = to.length();
    const flat = new V3(to.x, 0, to.z); const fd = flat.length() || 1; flat.divideScalar(fd);
    me.facing = lerpAngle(me.facing, yawFromDir(flat.x, flat.z), damp(6, dt));
    me.moveIntent.set(0, 0, 0); me.vert = 0; me._dmgMul = 0; me.sprintHeld = false; me.blockHeld = false; me.chargeHeld = false;
    if (moving === 'attacks') {
      // sparring partner: walks up and throws one slow, telegraphed punch at a time
      me._dmgMul = 1;
      if (dist > 2.6) me.moveIntent.copy(flat).multiplyScalar(dist > 6 ? 0.8 : 0.45);
      me.vert = clamp((foe.pos.y - me.pos.y) * 0.4, -1, 1);
      swingT -= dt;
      if (swingT <= 0 && dist < TUNING.meleeRange + 0.15) { me.windUp(foe, 0.45); swingT = 1.5 + Math.random() * 0.8; }
      return;
    }
    if (!moving) { me.vert = me.pos.y > me.floor + 0.3 ? -0.6 : 0; return; }
    trainT -= dt;
    if (trainT <= 0) { trainT = 1.6 + Math.random() * 1.6; trainSide = Math.random() < 0.5 ? -1 : 1; }
    const side = new V3(flat.z, 0, -flat.x).multiplyScalar(trainSide);
    // circle at mid range, drift in if too far, back off if crowded
    const keep = dist > 12 ? 0.6 : dist < 5 ? -0.5 : 0;
    me.moveIntent.copy(side).multiplyScalar(0.55).addScaledVector(flat, keep);
    if (me.moveIntent.lengthSq() > 1) me.moveIntent.normalize();
    me.vert = clamp((foe.pos.y - me.pos.y) * 0.3, -0.7, 0.7);
    if (Math.random() < 0.25 * dt) me.tryDash(side.clone());
  }
  function update(dt, me, foe) {
    const tr = Settings.get('rival');
    if (tr === 'dummy' || tr === 'moving' || tr === 'attacks') return training(dt, me, foe, tr === 'attacks' ? 'attacks' : tr === 'moving');
    const cfg = DIFF[Settings.get('difficulty')] || DIFF.normal;
    const to = foe.pos.clone().sub(me.pos); const dist = to.length();
    const flat = new V3(to.x, 0, to.z); const fd = flat.length() || 1; flat.divideScalar(fd);
    me.facing = lerpAngle(me.facing, yawFromDir(flat.x, flat.z), damp(8, dt));
    thinkT -= dt;
    if (thinkT <= 0) {
      thinkT = cfg.think[0] + Math.random() * (cfg.think[1] - cfg.think[0]);
      const r = Math.random();
      if (me.hp < 30 && r < 0.2) mode = 'retreat';
      else if (dist > 14 && r < cfg.blast + 0.2) mode = 'blast';
      else if (dist > 5) mode = r < 0.75 ? 'approach' : 'strafe';
      else mode = r < cfg.aggro ? 'attack' : 'strafe';
      strafeSign = Math.random() < 0.5 ? -1 : 1;
      if (!me.awakened && me.energy > 80 && Math.random() < 0.15) me.tryAwaken();
      if (dist > 10 && Math.random() < cfg.dash) me.tryDash(flat.clone());
      if (dist < 6 && me.guard > 35 && Math.random() < cfg.block) guardT = 0.5 + Math.random() * 0.6;
      // at long range, sometimes charge a big blast
      if (mode === 'blast' && dist > 16 && me.energy > 45 && Math.random() < cfg.blast) chargeT = 0.7 + Math.random() * 0.6;
    }
    // keep guarding through your combo once it has started blocking; sometimes put the guard up when you swing
    if (foe.punchT > 0 && dist < TUNING.meleeRange + 0.85 && me.guard > 30 && guardT <= 0 && Math.random() < cfg.block * 5 * dt) guardT = 0.45 + Math.random() * 0.4;
    guardT -= dt;
    me.blockHeld = guardT > 0 && me.guard > 10;
    // juggles: break out sometimes; chase you into the air when you get launched
    if (me.launched && Math.random() < cfg.tech * 2 * dt) me.tryRecover();
    if (foe.launched && !foe.spiked && dist < TUNING.chaseRange && !me.dashing && Math.random() < cfg.chase * 3 * dt) {
      if (me.tryDash(foe.center.sub(me.center).normalize(), 0)) { me.chase = foe; me.dashT = TUNING.dashTime * 1.6; }
    }
    if (foe.launched && dist < TUNING.meleeRange + 0.5) mode = 'attack';
    // hold the charge, then let go to fire; give up if you rush in
    me.chargeTarget = foe; me.chargeAim = 'target';
    if (chargeT > 0) { chargeT -= dt; if (dist < 6) chargeT = 0; }
    me.chargeHeld = chargeT > 0 && !me.blockHeld;
    const side = new V3(flat.z, 0, -flat.x).multiplyScalar(strafeSign);
    me.moveIntent.set(0, 0, 0);
    switch (mode) {
      case 'approach': me.moveIntent.copy(flat).addScaledVector(side, 0.25).normalize(); break;
      case 'strafe': me.moveIntent.copy(side).addScaledVector(flat, dist > 8 ? 0.4 : -0.1).normalize().multiplyScalar(0.7); break;
      case 'retreat': me.moveIntent.copy(flat).multiplyScalar(-0.9).addScaledVector(side, 0.5); break;
      case 'blast': me.moveIntent.copy(side).multiplyScalar(0.5); if (!me.blockHeld && chargeT <= 0 && !me.charging && Math.random() < 3 * dt) Combat.blast(me, foe, 'target'); break;
      case 'attack': me.moveIntent.copy(flat); if (!me.blockHeld && dist < TUNING.meleeRange + 0.1 && Math.random() < cfg.aggro * (foe.blocking ? 11 : 8) * dt) me.windUp(foe, cfg.wind); break;
    }
    // react to incoming blasts by dashing sideways
    for (const p of Combat.projectiles) if (p.owner === foe && p.mesh.position.distanceTo(me.center) < 7) {
      if (Math.random() < cfg.dash * 6 * dt) me.tryDash(side.clone());
      else if (me.guard > 30 && Math.random() < cfg.block * 6 * dt) guardT = Math.max(guardT, 0.35);
    }
    me.vert = clamp((foe.pos.y - me.pos.y) * 0.4, -1, 1);
    // above you and close: sometimes drop a ground slam
    if (!foe.flying && me.pos.y > foe.pos.y + 3 && flat.length() >= 0 && fd < 7 && !me.blockHeld && Math.random() < cfg.aggro * 0.8 * dt) me.trySlam(foe);
    // far away: sprint / fly fast to close the gap, stop once close
    if (me.sprinting) me.sprintHeld = dist > 7 && mode !== 'blast';
    else if (dist > 18 && (mode === 'approach' || mode === 'attack') && me.energy > 30 && !me.dashing && Math.random() < cfg.dash * 2 * dt) {
      me.sprintHeld = true; me.dashWasChase = false; me.tryDash(flat.clone());
    }
    if (me.sprintHeld && !me.sprinting && !me.dashing) me.sprintHeld = false;
    me._dmgMul = cfg.dmg;
  }
  // reacting to your hit just before it lands; never in training
  function dodge(me, foe) {
    const tr = Settings.get('rival'); if (tr !== 'fight') return false;
    const cfg = DIFF[Settings.get('difficulty')] || DIFF.normal;
    if (!cfg.vanish || me.energy < 35 || Math.random() >= cfg.vanish) return false;
    if (!me.tryVanish(foe, false)) return false;
    // reappears behind you and goes straight for a punch
    mode = 'attack'; thinkT = 0.6;
    if (Math.random() < 0.7) me.windUp(foe, cfg.wind + 0.08);
    return true;
  }
  return { update, reset, dodge };
})();


/* ---------------- Menus ---------------- */
const Menus = (() => {
  const pause = $('pauseMenu'), title = $('titleScreen'), over = $('overScreen');
  const views = { main: $('pauseMain'), settings: $('settingsView'), controls: $('controlsView') };
  let settingsReturn = null;   // which overlay to go back to when Settings was opened from title/over
  let lastFocus = null;

  function show(el) { el.classList.add('show'); el.setAttribute('aria-hidden', 'false'); }
  function hide(el) { el.classList.remove('show'); el.setAttribute('aria-hidden', 'true'); }
  function showView(name) {
    Object.entries(views).forEach(([k, v]) => v.classList.toggle('hidden', k !== name));
    pause.querySelector('.panel').classList.toggle('wide', name === 'settings');
    const first = views[name].querySelector('button, input');
    first && first.focus({ preventScroll: true });
    pause.querySelector('.panel').scrollTop = 0;
    disarmRestart();
  }
  function openPause() { lastFocus = document.activeElement; settingsReturn = null; show(pause); showView('main'); $('resumeBtn').focus({ preventScroll: true }); }
  function closePause() { hide(pause); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
  function openSettingsFrom(overlay) { settingsReturn = overlay; hide(overlay); show(pause); showView('settings'); }
  function back() {
    if (settingsReturn) { hide(pause); show(settingsReturn); settingsReturn.querySelector('.mbtn').focus({ preventScroll: true }); settingsReturn = null; }
    else showView('main');
  }
  const currentView = () => Object.keys(views).find(k => !views[k].classList.contains('hidden'));

  // Restart needs a second tap so it can't be hit by accident
  let armed = false, armTimer = 0;
  const restartBtn = $('restartBtn');
  function disarmRestart() { armed = false; clearTimeout(armTimer); restartBtn.textContent = 'Restart match'; restartBtn.classList.remove('danger'); }
  restartBtn.addEventListener('click', () => {
    if (!armed) { armed = true; restartBtn.textContent = 'Tap again to restart'; restartBtn.classList.add('danger'); armTimer = setTimeout(disarmRestart, 2500); return; }
    disarmRestart(); closePause(); Game.restart();
  });
  $('resumeBtn').addEventListener('click', () => Game.resume());
  $('settingsBtn').addEventListener('click', () => showView('settings'));
  $('controlsBtn').addEventListener('click', () => showView('controls'));
  pause.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', back));
  $('startBtn').addEventListener('click', () => { if (Game.training) Settings.set('rival', 'fight'); syncSettingsUI(); hide(title); Game.start(); });
  $('trainBtn').addEventListener('click', () => { if (!Game.training) Settings.set('rival', 'dummy'); syncSettingsUI(); hide(title); Game.start(); });
  $('titleSettingsBtn').addEventListener('click', () => openSettingsFrom(title));
  $('rematchBtn').addEventListener('click', () => { hide(over); Game.restart(); });
  $('overSettingsBtn').addEventListener('click', () => openSettingsFrom(over));
  // tapping the dimmed backdrop (outside the panel) resumes from the main pause view
  pause.addEventListener('pointerdown', e => { if (e.target === pause && currentView() === 'main' && !settingsReturn) Game.resume(); });

  // keyboard: Esc goes back from sub-views, Tab is trapped inside the open dialog
  document.addEventListener('keydown', e => {
    const open = [pause, title, over].find(o => o.classList.contains('show'));
    if (!open) return;
    if (e.key === 'Tab') {
      const f = [...open.querySelectorAll('button, input')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }, true);

  // ---- settings bindings ----
  const sens = $('setSens'), sensOut = $('sensOut');
  const toggles = { setLockDefault: 'lockDefault', setAutoCam: 'autoCam', setInvertY: 'invertY', setHaptics: 'haptics', setSound: 'sound', setAcrobatics: 'acrobatics', setFps: 'fps' };
  function syncSettingsUI() {
    sens.value = Settings.get('sens'); sensOut.textContent = (+Settings.get('sens')).toFixed(1);
    Object.entries(toggles).forEach(([id, k]) => $(id).checked = !!Settings.get(k));
    document.querySelectorAll('.seg').forEach(seg => {
      const v = Settings.get(seg.dataset.setting);
      seg.querySelectorAll('button').forEach(b => { b.classList.toggle('sel', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v); });
    });
  }
  sens.addEventListener('input', () => { Settings.set('sens', +sens.value); sensOut.textContent = (+sens.value).toFixed(1); });
  Object.entries(toggles).forEach(([id, k]) => $(id).addEventListener('change', e => Settings.set(k, e.target.checked)));
  document.querySelectorAll('.seg').forEach(seg => seg.querySelectorAll('button').forEach(b =>
    b.addEventListener('click', () => { Settings.set(seg.dataset.setting, b.dataset.v); syncSettingsUI(); })));
  $('resetSettingsBtn').addEventListener('click', () => { Settings.reset(); syncSettingsUI(); toast('Settings reset'); });
  syncSettingsUI();

  function showOver(won, score) {
    $('overH').textContent = won ? 'Victory' : 'Defeat';
    $('overSub').textContent = score ? (won ? 'You won the match ' : 'Your rival won the match ') + score + '.' : (won ? 'You defeated your rival.' : 'Your rival won.');
    show(over); $('rematchBtn').focus({ preventScroll: true });
  }
  return { openPause, closePause, showOver, currentView, back, get settingsReturn() { return settingsReturn; } };
})();

let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1400); }


/* ---------------- Game ---------------- */
const Game = {
  state: 'title',   // title | playing | paused | over
  lockOn: false,
  player: null, enemy: null,
  init() {
    this.player = new Fighter('You', PALETTES.hero, new V3(0, STAGE_H, 12));
    this.enemy = new Fighter('Rival', PALETTES.rival, new V3(0, STAGE_H, -12));
    try { $('pPortrait').src = renderPortrait(PALETTES.hero); $('ePortrait').src = renderPortrait(PALETTES.rival); } catch (err) { console.warn(err); }
    const modelSource = window.HERO_VRM_URL || window.HERO_VRM_B64;
    if (modelSource && window.VRMKit) {
      document.body.classList.add('vrm-loading');
      const hiddenGear = ['robo_arm','arm_mat','arm_plastic','green_emit','backpack',
        'anim_logo','armgear_plastic','robo_face','glass','wear_metal'];
      // Sequential decoding limits peak model-loading memory on phones.
      loadVRMInto(this.player, modelSource, {hide:hiddenGear}).then(async ok => {
        if (ok) {
          try { $('pPortrait').src = renderVRMPortrait(this.player); }
          catch(err) { console.warn('Hero portrait',err); }
        }
        const rivalOK = await loadVRMInto(this.enemy, modelSource, {hide:hiddenGear,rival:true});
        if (rivalOK) {
          try { $('ePortrait').src = renderVRMPortrait(this.enemy); }
          catch(err) { console.warn('Rival portrait',err); }
        }
        document.body.classList.remove('vrm-loading');
      }).catch(err=>{
        console.warn('Character setup failed',err);
        document.body.classList.remove('vrm-loading');
      });
    }
    this.lag = { p: 100, e: 100 };
    this.setLock(Settings.get('lockDefault'), false);
    CameraRig.snapBehind(this.player, this.enemy);
    applyQuality();
    Settings.onChange(k => { if (k === 'quality') applyQuality(); if (k === 'fps') $('fps').classList.toggle('hidden', !Settings.get('fps')); });
    $('fps').classList.toggle('hidden', !Settings.get('fps'));
    $('pauseBtn').addEventListener('click', () => this.togglePause());
    // auto-pause when the app is backgrounded or loses focus
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });
    window.addEventListener('blur', () => this.pause());
    if ('ontouchstart' in window) document.body.classList.add('force-touch');
  },
  setLock(on, notify = true) {
    this.lockOn = on;
    if (notify) toast(on ? 'Lock-on enabled' : 'Free camera');
  },
  get training() { const r = Settings.get('rival'); return r === 'dummy' || r === 'moving' || r === 'attacks'; },
  start() { this.restart(); },
  // hit counter: shows the current string of hits and its total damage
  combo: { n: 0, dmg: 0, t: 0 },
  onPlayerHit(dmg) {
    const c = this.combo; if (c.t <= 0) { c.n = 0; c.dmg = 0; }
    c.n++; c.dmg += dmg; c.t = 1.3;
    const el = $('comboBox'); $('comboN').textContent = c.n + (c.n === 1 ? ' hit' : ' hits'); $('comboD').textContent = Math.round(c.dmg) + ' damage';
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('show', 'pop');
    if (c.n >= 4) { el.classList.add('hot'); $('comboD').textContent = Math.round(c.dmg) + ' damage · ' + (c.n >= 8 ? 'SUPER!' : 'NICE!'); }
    else el.classList.remove('hot');
  },
  // match = best of N rounds (first to `need` wins); a round ends on a KO or when the clock runs out
  match: { round: 1, pw: 0, ew: 0, need: 2 },
  get timed() { return !this.training && Settings.get('timer') !== 'off'; },
  restart() {
    const n = +Settings.get('rounds') || 3;
    this.match = { round: 1, pw: 0, ew: 0, need: Math.ceil(n / 2), total: n };
    this.startRound();
  },
  startRound() {
    this.player.reset(); this.enemy.reset(); Combat.clear(); Effects.clear(); Spectacle.clear(); RivalAI.reset(); Input.reset();
    this.setLock(Settings.get('lockDefault'), false);
    CameraRig.snapBehind(this.player, this.enemy);
    this.koT = 0; this.hitStopT = 0; this.lag = { p: 100, e: 100 }; this.combo.t = 0; $('comboBox').classList.remove('show', 'hot'); this._mv = {x:0,y:0}; this._upWas = false;
    this.state = 'playing'; this.showPlayUI(true); this.betweenT = 0;
    this.timeLeft = +Settings.get('timer') || 0; this.timeUp = false;
    this.renderPips();
    if (this.training) { this.introT = 0; this.banner('FIGHT!', 'fight'); }
    else {
      // short intro: fighters hold still while the round is announced
      const m = this.match, last = m.pw === m.need - 1 && m.ew === m.need - 1 && m.need > 1;
      this.introT = 1.25; this.banner(m.total === 1 ? 'Ready' : last ? 'Final round' : 'Round ' + m.round, 'round');
    }
  },
  renderPips() {
    const m = this.match, show = !this.training && m.need > 1;
    for (const [id, w] of [['pPips', m.pw], ['ePips', m.ew]]) {
      const el = $(id); el.classList.toggle('hidden', !show);
      el.innerHTML = show ? Array.from({ length: m.need }, (_, i) => `<i class="${i < w ? 'won' : ''}"></i>`).join('') : '';
    }
  },
  // called once the KO / time-up slow motion has finished
  endRound() {
    const p = this.player, e = this.enemy, m = this.match;
    let res;
    if (p.hp <= 0 && e.hp <= 0) res = 'draw';
    else if (e.hp <= 0) res = 'win';
    else if (p.hp <= 0) res = 'lose';
    else res = p.hp > e.hp + 0.5 ? 'win' : e.hp > p.hp + 0.5 ? 'lose' : 'draw';   // time up: more health left wins
    if (res === 'win') m.pw++; if (res === 'lose') m.ew++;
    this.renderPips();
    if (m.pw >= m.need || m.ew >= m.need) {
      this.state = 'over'; this.showPlayUI(false); Menus.showOver(m.pw >= m.need, m.need > 1 ? m.pw + '–' + m.ew : '');
      return;
    }
    this.state = 'between'; this.betweenT = 1.9; $('controls').classList.add('hidden');
    this.banner(res === 'win' ? 'Round won' : res === 'lose' ? 'Round lost' : 'Draw', res === 'lose' ? 'ko' : 'round');
    m.round++;
  },
  onGuardBreak(f) {
    const bar = $(f === this.player ? 'pGdBar' : 'eGdBar');
    bar.classList.remove('broken'); void bar.offsetWidth; bar.classList.add('broken');
    clearTimeout(bar._t); bar._t = setTimeout(() => bar.classList.remove('broken'), TUNING.guardBreakStun * 1000 + 300);
    if (f === this.player) { const fx = $('breakFlash'); fx.classList.remove('show'); void fx.offsetWidth; fx.classList.add('show'); }
  },
  callout(text, cls) {
    const el = $('callout'); el.textContent = text; el.className = 'callout'; void el.offsetWidth; el.className = 'callout show ' + cls;
    clearTimeout(this._calloutT); this._calloutT = setTimeout(() => el.classList.remove('show'), 900);
  },
  banner(text, cls) {
    const b = $('banner'); b.textContent = text; b.className = 'banner'; void b.offsetWidth; b.className = 'banner show ' + cls;
  },
  hitStop(t) { this.hitStopT = Math.max(this.hitStopT || 0, t); },
  showPlayUI(on) { $('hud').classList.toggle('hidden', !on); $('controls').classList.toggle('hidden', !on); },
  pause() { if (this.state !== 'playing') return; this.state = 'paused'; Input.reset(); $('controls').classList.add('hidden'); Menus.openPause(); },
  resume() { if (this.state !== 'paused') return; Menus.closePause(); Input.reset(); this.state = 'playing'; $('controls').classList.remove('hidden'); this._last = performance.now(); },
  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') { if (Menus.currentView() !== 'main') Menus.back(); else this.resume(); }
    else if (Menus.settingsReturn) Menus.back();
  },

  handlePlayerInput(dt) {
    const p = this.player, e = this.enemy;
    const raw = Input.move();
    // light smoothing on the stick so direction changes feel fluid rather than twitchy
    const sm = this._mv || (this._mv = { x: 0, y: 0 }); const ks = damp(20, dt);
    sm.x += (raw.x - sm.x) * ks; sm.y += (raw.y - sm.y) * ks;
    const m = { x: sm.x, y: sm.y, mag: Math.hypot(sm.x, sm.y) };
    const fwd = CameraRig.forward(), rgt = CameraRig.right();
    const dir = new V3().addScaledVector(fwd, m.y).addScaledVector(rgt, m.x);
    // stick distance sets the pace: small tilt strolls, half tilt walks, full tilt walks briskly (hold Run to run)
    const mg = Math.min(1, m.mag), pace = mg < 0.08 ? 0 : mg < 0.4 ? 0.12 + (mg - 0.08) / 0.32 * 0.13 : mg < 0.75 ? 0.25 + (mg - 0.4) / 0.35 * 0.25 : 0.5 + (mg - 0.75) / 0.25 * 0.5;
    if (dir.lengthSq() > 1e-6) p.moveIntent.copy(dir).normalize().multiplyScalar(pace); else p.moveIntent.set(0, 0, 0);
    p.vert = Input.vertical();
    // tap Up on the ground to jump (holding it carries on into flight)
    if (p.vert > 0 && !this._upWas) p.tryJump();
    this._upWas = p.vert > 0;
    if (p.awakenChargeT > 0) {
      // Consume queued inputs without interrupting transformation or spamming an action afterward.
      for (const act of ['dash','dash2','vanish','melee','blast','awaken']) Input.consume(act);
      p.moveIntent.set(0,0,0); p.vert = 0; p.blockHeld = false;
      p.sprintHeld = false; p.chargeHeld = false;
      return;
    }
    p.blockHeld = Input.block();
    // while guarding, turn to face a nearby rival so the block covers you
    if (p.blocking && p.pos.distanceTo(e.pos) < 15) p.facing = lerpAngle(p.facing, yawFromDir(e.pos.x - p.pos.x, e.pos.z - p.pos.z), damp(14, dt));

    // facing: rival when lock is active, otherwise the way you're moving
    if (CameraRig.isLockActive()) p.facing = lerpAngle(p.facing, yawFromDir(e.pos.x - p.pos.x, e.pos.z - p.pos.z), damp(12, dt));
    else if (!p.moving && m.mag > 0.15 && p.stun <= 0) p.facing = lerpAngle(p.facing, yawFromDir(dir.x, dir.z), damp(10, dt));

    if (Input.consume('lock')) this.setLock(!this.lockOn);
    p.sprintHeld = Input.dashHeld();
    const runTap = Input.consume('dash'), dashTap = Input.consume('dash2');
    if (runTap || dashTap) {
      p.dashWasChase = false;
      // dash goes where the stick points; with no input, where you're facing
      // launched yourself? Dash breaks out of the juggle instead
      if (p.launched) { p.tryRecover(); }
      // rival launched and in range: the dash homes in so you can keep the combo going
      else if (e.launched && !e.spiked && p.pos.distanceTo(e.pos) < TUNING.chaseRange) {
        const to = e.center.sub(p.center).normalize();
        if (p.tryDash(to, 0)) { p.dashWasChase = true; p.chase = e; p.dashT = TUNING.dashTime * 1.6; CameraRig.onDash(); Effects.ring(p.center, 0xffffff, 1.2); }
      } else if (dashTap) {
        // second tap: dash
        const dashDir = m.mag > 0.15 ? dir.clone().setY(0).normalize() : p.forward();
        if (p.vert) dashDir.y = 0.45 * p.vert;
        if (p.tryDash(dashDir)) CameraRig.onDash();
      } else {
        // first tap: start running (keep holding to keep running)
        p.startRun();
      }
    }
    if (Input.consume('vanish')) {
      if (p.tryVanish(e)) CameraRig.snapBehind(p, e);
      else if (p.energy < TUNING.vanishCost) toast('Need 20 energy');
    }
    // Input buffer (up to two taps): rhythmic taps chain jab -> cross -> hook -> launcher
    // Each button press is an ordered beat. Mash inputs may queue up to three
    // follow-ups; animation states must finish before the next beat starts.
    if (Input.consume('melee')) { p.meleeQ = Math.min(3, (p.meleeQ || 0) + 1); p.meleeBuf = TUNING.meleeBuffer; }
    if (p.meleeBuf > 0) {
      p.meleeBuf -= dt;
      if (p.meleeBuf <= 0) p.meleeQ = 0;
      if (p.stun > 0 || p.launched || p.hp <= 0) { p.meleeQ = 0; p.meleeBuf = 0; }
      else if (p.meleeCd <= 0 && p.punchT <= 0 && !p.kickPend) {
        p.meleeQ--; p.meleeBuf = p.meleeQ > 0 ? TUNING.meleeBuffer : 0;
        // holding Down in the air turns Melee into a ground slam, unless the rival is right next to you in the air
        const airFoe = e.flying && p.pos.distanceTo(e.pos) < TUNING.meleeRange + 0.5;
        if (!(p.vert < 0 && !airFoe && p.trySlam(e))) Combat.melee(p, e);
      }
    }
    // Blast: hold to charge, release to fire (handled by the fighter); a tap too quick to register as held fires straight away
    p.chargeTarget = e; p.chargeAim = CameraRig.isLockActive() ? 'target' : 'facing';
    p.chargeHeld = Input.blastHeld();
    if (Input.consume('blast') && !p.chargeHeld && !p.charging) Combat.blast(p, e, p.chargeAim);
    if (Input.consume('awaken') && !p.tryAwaken()) toast(p.awakened ? 'Already awakened' : p.awakenChargeT > 0 ? 'Powering up' : p.awakenGauge < 100 ? 'Build awakening power by fighting' : 'Cannot awaken while stunned');
  },

  update(dt) {
    if (this.koT > 0 || this.introT > 0) { this.player.blockHeld = this.enemy.blockHeld = false; this.player.chargeHeld = this.enemy.chargeHeld = false; this.player.moveIntent.set(0, 0, 0); this.player.vert = 0; this.enemy.moveIntent.set(0, 0, 0); this.enemy.vert = 0; }
    else { this.handlePlayerInput(dt); RivalAI.update(dt, this.enemy, this.player); }
    this.player.update(dt); this.enemy.update(dt);
    // keep fighters from overlapping
    const sep = this.enemy.pos.clone().sub(this.player.pos); const d = sep.length();
    if (d < 1.1 && d > 0.0001) { sep.multiplyScalar((1.1 - d) / d / 2); this.enemy.pos.add(sep); this.player.pos.sub(sep); }
    Combat.update(dt); Effects.update(dt); Spectacle.update(dt);
    if (this.combo.t > 0) { this.combo.t -= dt; if (this.combo.t <= 0) $('comboBox').classList.remove('show'); }
    if (this.training) {
      // rival refills after a short break; you get near-unlimited energy to practise with
      const e = this.enemy; e.hurtT += dt;
      if (e.hurtT > 1.6 && e.hp < 100) e.hp = Math.min(100, e.hp + 60 * dt);
      const pl = this.player; pl.hurtT += dt;
      if (pl.hurtT > 1.6 && pl.hp < 100) pl.hp = Math.min(100, pl.hp + 60 * dt);
      this.player.energy = Math.min(100, this.player.energy + 30 * dt);
    }
    if ((this.player.hp <= 0 || this.enemy.hp <= 0) && !this.koT) {
      this.koT = 1.4; Input.reset(); this.banner('K.O.', 'ko'); $('controls').classList.add('hidden');
    }
    // round clock
    if (this.timed && !this.koT && this.introT <= 0 && this.timeLeft > 0) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft <= 0) { this.timeUp = true; this.koT = 1.4; Input.reset(); this.banner('Time', 'time'); $('controls').classList.add('hidden'); }
    }
  },

  updateHUD() {
    const p = this.player, e = this.enemy;
    $('pHp').style.width = p.hp + '%'; $('pEn').style.width = p.energy + '%';
    $('eHp').style.width = e.hp + '%'; $('eEn').style.width = e.energy + '%';
    $('pGd').style.width = p.guard + '%'; $('eGd').style.width = e.guard + '%';
    $('pGdBar').classList.toggle('low', p.guard < 30); $('eGdBar').classList.toggle('low', e.guard < 30);
    $('pGdBar').classList.toggle('active', p.blocking); $('eGdBar').classList.toggle('active', e.blocking);
    document.querySelector('.cbtn.block').classList.toggle('on', p.blocking);
    const bb = document.querySelector('.cbtn.blast');
    const mb = document.querySelector('.cbtn.melee');
    const step = p.t - p.lastMelee > TUNING.comboWindow ? 0 : p.combo;
    mb.classList.toggle('combo-ready', step > 0 && p.stun <= 0);
    $('meleeHint').textContent = step ? `${step + 1}/4 · ${step === 3 ? 'FINISH' : 'chain'}` : '4-hit combo';
    bb.style.setProperty('--charge', p.charging ? Math.max(0.04, p.chargeLevel) : 0);
    bb.classList.toggle('charging', p.charging); bb.classList.toggle('full', p.chargeFull);
    // white "recent damage" bar drains after a short delay
    this.lag.p = Math.max(p.hp, this.lag.p - (this.lag.p > p.hp ? 0.6 : 0)); this.lag.e = Math.max(e.hp, this.lag.e - (this.lag.e > e.hp ? 0.6 : 0));
    $('pLag').style.width = this.lag.p + '%'; $('eLag').style.width = this.lag.e + '%';
    $('pHpNum').textContent = Math.ceil(p.hp); $('eHpNum').textContent = Math.ceil(e.hp);
    document.body.classList.toggle('low-hp', p.hp > 0 && p.hp < 25);
    const awReady = p.awakenGauge >= TUNING.awakenGaugeMax;
    const trans = p.awakenChargeT > 0;
    $('pEnBar').classList.toggle('ready', awReady && !p.awakened);
    const ag = $('pAwGauge'); ag.style.width = (trans ? p.awakenChargeProgress * 100 : p.awakened ? 100 : p.awakenGauge) + '%';
    const am = $('pAwMeter'); am.classList.toggle('ready', awReady && !p.awakened); am.classList.toggle('transforming', trans);
    $('awakenTag').textContent = trans ? 'POWER RISING  ' + Math.round(p.awakenChargeProgress * 100) + '%' : 'AWAKENED';
    const ab = document.querySelector('.cbtn.awaken');
    ab.classList.toggle('charging', trans); ab.classList.toggle('ready', awReady && !p.awakened);
    ab.classList.toggle('gone', p.awakened && !trans);
    ab.querySelector('span').textContent = trans ? 'POWERING' : awReady ? 'AWAKEN!' : 'POWER';
    ab.querySelector('small').textContent = trans ? Math.round(p.awakenChargeProgress * 100) + '%' : awReady ? 'tap to transform' : Math.round(p.awakenGauge) + '%';
    ab.style.setProperty('--awaken', (trans ? p.awakenChargeProgress * 100 : p.awakenGauge) + '%');
    const sl = $('speedLines'); sl.style.opacity = 0; // no radial meteor/speed cone
    const cm = $('camMode');
    const locked = CameraRig.isLockActive();
    const mode = p.moving || (this.lockOn && !locked) ? 'dash' : locked ? 'locked' : 'free';
    cm.className = 'cam-mode ' + mode;
    cm.textContent = mode === 'dash' ? (this.lockOn ? 'Dash · lock released' : 'Dash · free camera') : locked ? 'Locked on · tap to free' : 'Free camera · tap to lock';
    $('awakenTag').classList.toggle('hidden', !p.awakened && !trans);
    const tm = $('roundTimer'); tm.classList.toggle('hidden', !this.timed);
    if (this.timed) { const s = Math.ceil(this.timeLeft); tm.textContent = s; tm.classList.toggle('low', s <= 10 && this.timeLeft > 0); }
    const tr = Settings.get('rival');
    $('trainTag').classList.toggle('hidden', !this.training);
    if (this.training) $('trainTag').textContent = tr === 'moving' ? 'Training · rival moves, never attacks' : tr === 'attacks' ? 'Training · rival throws slow punches to block' : 'Training · rival stands still';
    const gb = document.querySelector('.cbtn.block');
    gb.classList.toggle('novanish', p.energy < (p.guardCounterWindow > 0 ? 13 : TUNING.vanishCost) || p.vanishCd > 0);
    gb.classList.toggle('counter-ready', p.guardCounterWindow > 0 && p.vanishCd <= 0);
    gb.querySelector('small').textContent = p.guardCounterWindow > 0 ? '2× COUNTER' : '2× vanish';
    // Awaken only shows up when it can be used
    // Awakening power button stays visible while filling, then changes state.
    // off-screen rival arrow
    const arrow = $('rivalArrow');
    const v = e.center.project(camera);
    const behind = v.z > 1;
    const off = behind || Math.abs(v.x) > 0.95 || Math.abs(v.y) > 0.95;
    arrow.classList.toggle('hidden', !off || this.state !== 'playing');
    if (off) {
      let x = v.x, y = v.y; if (behind) { x = -x; y = -y; }
      const a = Math.atan2(y, x); const ex = Math.cos(a), ey = Math.sin(a);
      const k = 0.85 / Math.max(Math.abs(ex), Math.abs(ey));
      const sx = (ex * k * 0.5 + 0.5) * innerWidth, sy = (-ey * k * 0.5 + 0.5) * innerHeight;
      arrow.style.left = (sx - 11) + 'px'; arrow.style.top = (sy - 10) + 'px';
      arrow.style.transform = `rotate(${Math.PI / 2 - a}rad)`;
    }
  },

  _last: performance.now(), _fpsAcc: 0, _fpsN: 0,
  loop(now) {
    const real = Math.min(0.05, (now - this._last) / 1000); this._last = now;
    let dt = real;
    if (this.state === 'playing') {
      // hit-stop: a few frames of near-freeze on impact; KO: slow motion before the result screen
      if (this.hitStopT > 0) { this.hitStopT -= real; dt *= 0.08; }
      if (this.introT > 0) { const was = this.introT; this.introT -= real; if (this.introT <= 0) { this.introT = 0; this.banner('FIGHT!', 'fight'); } }
      if (this.koT > 0) { dt *= this.timeUp ? 0.6 : 0.3; this.koT -= real; if (this.koT <= 0) { this.koT = 0; this.endRound(); } }
      if (this.state === 'playing') this.update(dt);
    }
    if (this.state === 'between') { this.betweenT -= real; if (this.betweenT <= 0) this.startRound(); }
    if (this.state === 'playing' || this.state === 'over' || this.state === 'between') {
      if (this.state !== 'playing') { this.player.animate(real); this.enemy.animate(real); Effects.update(real); }
      CameraRig.update(this.state === 'playing' ? real : real * 0.3); this.updateHUD();
    }
    else if (this.state === 'title') { CameraRig.rig.yaw += real * 0.15; this.player.animate(real); this.enemy.animate(real); CameraRig.update(real); }
    // paused: simulation and camera frozen; scene still renders behind the blur
    if (this.state !== 'paused') Arena.update(real);
    sun.position.set(this.player.pos.x + 45, 60, this.player.pos.z + 30); sun.target.position.copy(this.player.pos);
    renderer.render(scene, camera);
    if (Settings.get('fps')) { this._fpsAcc += dt; this._fpsN++; if (this._fpsAcc > 0.5) { $('fps').textContent = Math.round(this._fpsN / this._fpsAcc) + ' fps'; this._fpsAcc = 0; this._fpsN = 0; } }
    requestAnimationFrame(t => this.loop(t));
  },
};

Game.init();
requestAnimationFrame(t => { Game._last = t; Game.loop(t); });
window.SkyClash = { Effects, Game, CameraRig, Settings, Input, Combat, TUNING, camera };
})();


