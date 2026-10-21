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
        const required = groundAt(joint.x, joint.z) + (name.endsWith('Toes') ? 0.045 : 0.105);
        correction = Math.max(correction, required - joint.y);
      }
      for (const name of ['leftLowerLeg', 'rightLowerLeg']) {
        const node = this.vrm.humanoid.getNormalizedBoneNode(name);
        if (!node) continue;
        node.getWorldPosition(joint);
        correction = Math.max(correction, groundAt(joint.x, joint.z) + 0.19 - joint.y);
      }
      // Remove the previous frame's lift before re-measuring to avoid drift.
      this.footLift = (this.footLift || 0);
      const wanted = clamp(this.footLift + correction, 0, 0.44);
      const next = this.footLift + (wanted - this.footLift) * damp(wanted > this.footLift ? 27 : 14, dt);
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

