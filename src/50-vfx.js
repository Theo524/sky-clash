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
  // Natural awakening: concentrated light and dust, no straight radial lines or bubble shell.
  function awakenBurst(f) {
    const c = f.center;
    flash(c, 0xffffff, 2.4, 0.11);
    flash(c, f.pal.aura, 3.9, 0.23);
    bodyAura(f, true);
    if (!f.flying) {
      chargeFracture(f, 1.35);
      dust(f.pos, Settings.get('quality') === 'low' ? 5 : 13);
    }
    CameraRig.shake(0.60);
  }
  // Energy wisps attached to actual limb locations. No enveloping geometry.
  // Every fighter owns its colour through pal.aura, suitable for new characters.
  function bodyAura(f, burst = false) {
    if (!f || f.hp <= 0) return;
    const rig = f.vrmRig;
    const H = rig && rig.vrm && rig.vrm.humanoid;
    const names = burst ? ['head','chest','leftUpperArm','rightUpperArm','leftHand','rightHand','leftUpperLeg','rightUpperLeg','leftFoot','rightFoot']
      : (Settings.get('quality') === 'low' ? ['chest','leftHand','rightHand'] : ['head','chest','leftUpperArm','rightUpperArm','leftHand','rightHand']);
    if (H) rig.vrm.scene.updateMatrixWorld(true);
    for (let i = 0; i < names.length; i++) {
      const bone = H && H.getNormalizedBoneNode(names[i]);
      let p;
      if (bone) p = bone.getWorldPosition(new V3());
      else {
        // Procedural fallback remains compatible with characters without a VRM.
        const y = names[i] === 'head' ? 2.08 : names[i].includes('Foot') ? 0.25 : names[i].includes('Hand') ? 1.34 : names[i].includes('Leg') ? 0.78 : 1.54;
        const side = names[i].startsWith('left') ? 1 : names[i].startsWith('right') ? -1 : 0;
        p = f.pos.clone().add(new V3(side * 0.38, y, 0));
      }
      const col = i % 5 === 0 ? 0xffffff : f.pal.aura;
      // A tight moving sheen on the bone, not a separate large glowing sphere.
      const sz = burst ? 0.52 : names[i] === 'head' ? 0.35 : 0.28;
      const sp = sprite(TEX.glow, col, sz, burst ? 0.52 : 0.32);
      sp.position.copy(p).add(new V3((Math.random()-0.5)*0.12, (Math.random()-0.5)*0.08, (Math.random()-0.5)*0.12));
      const lifetime = burst ? 0.30 : 0.18;
      push(sp,lifetime,(e,dt)=>{
        e.obj.position.y += dt * (burst ? 1.3 : 0.47);
        const k=e.t/e.life;
        e.obj.material.opacity=(burst?0.52:0.32)*(1-k)*(1-k);
        e.obj.scale.setScalar(sz*(0.95+0.34*k));
      });
    }
    if (!burst && Math.random() < 0.4) {
      const sp=sprite(TEX.glow, f.pal.aura, 0.21, 0.6);
      const p = H && H.getNormalizedBoneNode('chest') ? H.getNormalizedBoneNode('chest').getWorldPosition(new V3()) : f.center;
      sp.position.copy(p).add(new V3((Math.random()-0.5)*0.65, -0.1, (Math.random()-0.5)*0.3));
      push(sp,0.26,(e,dt)=>{e.obj.position.y+=dt*2.1;e.obj.material.opacity=0.56*(1-e.t/e.life);});
    }
  }
  function auraSpark(f) { bodyAura(f); }

  // Surface fracture: visual cracks and lifted chips, no persistent collision changes.
  // Positioned on the arena's real floor height; dynamically tinted by fighter power.
  function chargeFracture(f, strength = 1) {
    if (!f || f.flying) return;
    const q = Settings.get('quality');
    const center = f.pos.clone();
    const rays = q === 'low' ? 5 : 9;
    const col = Math.hypot(center.x, center.z) < STAGE_R * 0.90 ? 0x322f32 : 0x365537;
    const glow = f.pal.aura;
    const crackMaterial = color => new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.82, side:THREE.DoubleSide, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-1 });
    for (let j=0; j<rays; j++) {
      const angle=TAU*j/rays+(Math.random()-0.5)*0.18;
      let px=center.x, pz=center.z;
      const parts=2+(j%2);
      for(let k=0;k<parts;k++) {
        const step=(0.33 + Math.random()*0.34) * strength;
        const a=angle + (Math.random()-0.5)*0.4;
        const nx=px+Math.cos(a)*step, nz=pz+Math.sin(a)*step;
        const py=groundAt((px+nx)/2,(pz+nz)/2)+0.024;
        if (Math.abs(groundAt(px,pz)-groundAt(nx,nz))>0.12) break;
        const dx=nx-px,dz=nz-pz,dist=Math.hypot(dx,dz),w=0.027+0.013*(1-k/parts);
        const ux=-dz/dist*w,uz=dx/dist*w;
        const geo=new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute([
          px+ux,py,pz+uz, nx+ux,py,nz+uz, nx-ux,py,nz-uz,
          px+ux,py,pz+uz, nx-ux,py,nz-uz, px-ux,py,pz-uz],3));
        geo.computeVertexNormals();
        const crack=new THREE.Mesh(geo,crackMaterial(k%4===0?glow:col));
        const alpha=k%4===0?0.50:0.82;
        crack.material.opacity=alpha;
        push(crack,2.35,(e)=>{ const t=e.t/e.life;e.obj.material.opacity=alpha*(1-smooth01((t-0.63)/0.37));},true);
        px=nx; pz=nz;
      }
    }
    const chunks=q==='low'?4:10;
    for(let i=0;i<chunks;i++) {
      const ang=TAU*i/chunks+(Math.random()-0.5)*0.2;
      const r=0.45+Math.random()*1.35;
      const x=center.x+Math.cos(ang)*r, z=center.z+Math.sin(ang)*r, y=groundAt(x,z);
      const mesh=new THREE.Mesh(new THREE.TetrahedronGeometry(0.08+Math.random()*0.14),
        new THREE.MeshLambertMaterial({color:Math.hypot(x,z)<STAGE_R*0.90?0x928982:0x777563,transparent:true,opacity:0.9}));
      mesh.position.set(x,y+0.06,z);
      const peak=0.13+Math.random()*0.32;
      push(mesh,0.92,(e)=>{const t=e.t/e.life;
        e.obj.position.y=y+0.06+4*peak*t*(1-t);
        e.obj.rotation.x+=0.03;e.obj.rotation.y+=0.06;
        e.obj.material.opacity=0.9*(1-smooth01((t-0.6)/0.4));},true);
    }
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
    flash(f.orb.position, 0xffffff, 3.8, 0.17); flash(f.center, col, 3.5, 0.22); sparks(f.orb.position, col, 14, new V3(0,1,0), 1.15); groundRing(f, 0.9);
    if (f === Game.player) { CameraRig.shake(0.24); if (Settings.get('haptics') && navigator.vibrate) navigator.vibrate(24); }
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
  // DBZ-inspired vanish: instantaneous departure/arrival ghost streaks, no ring or long trail.
  // The actual teleport remains in Fighter.tryVanish, purely cosmetic trails here.
  function vanish(from, to, col, perfect) {
    function residue(p, entering) {
      flash(p, 0xffffff, entering ? 2.3 : 1.9, 0.07);
      flash(p, col, entering ? 3.0 : 2.4, 0.12);
      for (let j=0;j<4;j++) {
        const a = (j/4)*TAU;
        const ghost=sprite(TEX.glow, j === 0 ? 0xffffff : col, 0.3, 0.33);
        ghost.position.copy(p).add(new V3(Math.sin(a)*0.21, 0.2 + (j%2)*0.72, Math.cos(a)*0.21));
        const v = new V3((Math.random()-0.5)*2.3, entering ? 1.9 : -1.6, (Math.random()-0.5)*2.3);
        const z=0.11+j*0.025;
        push(ghost,z,(e,dt)=>{const k=e.t/e.life;e.obj.position.addScaledVector(v,dt);e.obj.scale.set(0.26*(1-k*0.5),1.55*(1-k),1);e.obj.material.opacity=0.33*(1-k)*(1-k);});
      }
      sparks(p, col, perfect ? 10 : 5, new V3(0,1,0), 0.8);
    }
    residue(from, false);
    // Show the new arrival a beat later: blink-out -> blink-in without a travelled ring.
    const ghost = sprite(TEX.glow, col, 0.01, 0);
    push(ghost, 0.11, (e)=>{
      if (!e.done && e.t > 0.07) { e.done=true; residue(to, true); }
    });
  }
  function blockSpark(pos) { flash(pos, 0xbfe9ff, 2.6, 0.12); ring(pos, 0x8fd8ff, 1.0); sparks(pos, 0xd8f4ff, 5); }
  // parry: bright gold double ring
  function parry(pos) { flash(pos, 0xffffff, 5, 0.14); flash(pos, 0xffd166, 7, 0.3); ring(pos, 0xffd166, 2.6); ring(pos, 0xffffff, 1.6); sparks(pos, 0xffe08a, 14); }
  return { bodyAura, chargeFracture, kickImpact, push, sprintTrail, vanish, launchTrail, groundSlam, chargeSpark, groundRing, chargeFull, bigBlast, guardBreak, dizzy, blockSpark, parry, ring, flash, sparks, impact, dust, dashBurst, awakenBurst, auraSpark, trail, sprite, update, clear };
})();

