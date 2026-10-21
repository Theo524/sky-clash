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
  const flat = (c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true });   // low-poly faceted look for rocks and foliage
  const shadowy = (o, cast = true, recv = true) => { o.castShadow = cast; o.receiveShadow = recv; return o; };

  /* ground */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(420, 64), toon(0xffffff, { map: TEX.grass }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  /* stage */
  const stoneTop = toon(0xffffff, { map: TEX.stone });
  const stoneSide = flat(0x9a8f80);
  const stage = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(STAGE_R, STAGE_R + 0.5, STAGE_H, 8), [stoneSide, stoneTop, stoneSide]));
  stage.position.y = STAGE_H / 2; stage.rotation.y = Math.PI / 8; scene.add(stage);
  const step = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(STAGE_R + 1.2, STAGE_R + 1.6, 0.14, 8), flat(0x857a6c)), false, true);
  step.position.y = 0.07; step.rotation.y = Math.PI / 8; scene.add(step);
  // emblem
  const emblemMat = new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.8 });
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

  /* rock mesas with strata and crystals */
  const strata = [0x9b7a5f, 0xb48d6b, 0x8a6a52, 0xc29b74];
  const crystalMat = new THREE.MeshToonMaterial({ color: 0x7ff0ff, emissive: 0x2aa6c8, emissiveIntensity: 0.9, gradientMap: TOON_RAMP });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.35, r = ARENA_RADIUS * (0.62 + (i % 3) * 0.11);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rnd() * TAU; scene.add(g);
    let y = 0, rad = 3 + rnd() * 1.4;
    const layers = 3 + (i % 2);
    for (let k = 0; k < layers; k++) {
      const h = 2.6 + rnd() * 3;
      const top = rad * (0.78 + rnd() * 0.12);
      const m = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(top, rad, h, 7), flat(strata[(i + k) % strata.length])));
      m.position.y = y + h / 2; m.rotation.y = rnd(); g.add(m);
      y += h; rad = top;
    }
    const grassCap = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.05, rad, 0.4, 7), flat(0x6fae4e)));
    grassCap.position.y = y + 0.2; g.add(grassCap);
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), crystalMat); c.scale.set(0.8, 1.6, 0.8);
    c.position.y = y + 2.2; g.add(c);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0x6fe7ff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    glow.scale.setScalar(5); glow.position.y = y + 2.2; g.add(glow);
    const base = y + 2.2;
    animated.push({ update: (t) => { c.rotation.y = t * (0.5 + i * 0.05); c.position.y = base + Math.sin(t * 1.4 + i) * 0.3; glow.position.y = c.position.y; } });
  }

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
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.55, 4, 6), flat(0x7a5236), N_TREES);
  const canopyGeo = new THREE.IcosahedronGeometry(2.4, 0);
  const can1 = new THREE.InstancedMesh(canopyGeo, flat(0xffffff), N_TREES), can2 = new THREE.InstancedMesh(canopyGeo, flat(0xffffff), N_TREES);
  for (let i = 0; i < N_TREES; i++) {
    const a = rnd() * TAU, r = ARENA_RADIUS + 6 + rnd() * 80, s = 0.8 + rnd() * 0.8;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    q.setFromEuler(new THREE.Euler(0, rnd() * TAU, 0));
    trunks.setMatrixAt(i, m4.compose(p3.set(x, 2 * s, z), q, sc.set(s, s, s)));
    can1.setMatrixAt(i, m4.compose(p3.set(x, 4.6 * s, z), q, sc.set(s * 1.2, s, s * 1.2)));
    can2.setMatrixAt(i, m4.compose(p3.set(x + 0.4 * s, 6.3 * s, z - 0.3 * s), q, sc.set(s * 0.8, s * 0.75, s * 0.8)));
    const g = [0x4f9a43, 0x5aa84a, 0x3f8a3c, 0x6bb653][i % 4];
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
      mesh.setColorAt(i, col.setHex([0x7dbd57, 0x5e9e45, 0x93cc66][i % 3]));
    }
    mesh.receiveShadow = true; scene.add(mesh); qualityGroups.grass = mesh;
  }

  /* distant mountains (instanced) with snow caps */
  const N_M = 34;
  const mtn = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), flat(0xffffff), N_M);
  const snow = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), flat(0xf4f8ff), N_M);
  for (let i = 0; i < N_M; i++) {
    const a = (i / N_M) * TAU + rnd() * 0.1, r = 230 + rnd() * 70;
    const h = 45 + rnd() * 70, w = 30 + rnd() * 30;
    q.setFromEuler(new THREE.Euler(0, rnd() * TAU, 0));
    mtn.setMatrixAt(i, m4.compose(p3.set(Math.cos(a) * r, h / 2 - 1, Math.sin(a) * r), q, sc.set(w, h, w)));
    mtn.setColorAt(i, col.setHex(i % 2 ? 0x6c7fa0 : 0x7b8cab));
    const sh = h * 0.28;
    snow.setMatrixAt(i, m4.compose(p3.set(Math.cos(a) * r, h - 1 - sh / 2 + 0.4, Math.sin(a) * r), q, sc.set(w * 0.29, sh, w * 0.29)));
  }
  scene.add(mtn, snow);

  /* floating islands */
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.6, r = 80 + rnd() * 60, y = 42 + rnd() * 30, s = 4 + rnd() * 5;
    const g = new THREE.Group(); g.position.set(Math.cos(a) * r, y, Math.sin(a) * r); scene.add(g);
    const rock = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.8, 7), flat(0x9b7a5f)); rock.rotation.x = Math.PI; rock.position.y = -s * 0.9; g.add(rock);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(s * 1.02, s, s * 0.25, 7), flat(0x6fae4e)); g.add(top);
    const tree = new THREE.Mesh(canopyGeo, flat(0x4f9a43)); tree.scale.setScalar(s * 0.3); tree.position.set(s * 0.2, s * 0.5, 0); g.add(tree);
    const baseY = y;
    animated.push({ update: (t) => { g.position.y = baseY + Math.sin(t * 0.4 + i) * 1.2; g.rotation.y = t * 0.02 + i; } });
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

