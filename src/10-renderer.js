/* ---------------- Renderer / scene ---------------- */
const container = $('game');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const SKY = { top: 0x2f6fd6, horizon: 0xbfdcf5, bottom: 0x9cc3e4, sun: 0xfff2d0 };
scene.fog = new THREE.Fog(SKY.horizon, 85, 330);
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
    g.fillStyle = '#6aa64a'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 60; i++) {   // soft patches
      const x = rnd() * 512, y = rnd() * 512, rad = 30 + rnd() * 70;
      const r = g.createRadialGradient(x, y, 0, x, y, rad);
      const c = rnd() < 0.5 ? '120,180,80' : '84,140,60';
      r.addColorStop(0, `rgba(${c},.5)`); r.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = r; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 9000; i++) {  // blades
      const x = rnd() * 512, y = rnd() * 512, l = 2 + rnd() * 4;
      g.strokeStyle = rnd() < 0.5 ? 'rgba(150,205,105,.55)' : 'rgba(60,110,45,.45)';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 2, y - l); g.stroke();
    }
  }, { repeat: 26 }),
  stone: canvasTex(512, 512, (g) => {
    const rnd = makeRng(11), n = 8, s = 512 / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = 196 + rnd() * 26 | 0;
      g.fillStyle = `rgb(${v + 8},${v - 2},${v - 22})`; g.fillRect(x * s, y * s, s, s);
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(90,80,70,${rnd() * 0.12})`; g.fillRect(x * s + rnd() * s, y * s + rnd() * s, 2 + rnd() * 5, 2 + rnd() * 5); }
    }
    g.strokeStyle = 'rgba(95,82,68,.32)'; g.lineWidth = 2;
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
const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x5d7a3e, 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.4);
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

