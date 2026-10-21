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

