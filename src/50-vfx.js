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
    ring(pos,heavy?color:0xffffff,heavy?1.55:0.95);
    sparks(pos,color,heavy?17:10,dir,heavy?1.38:1);
  }
  function kickImpact(pos, dir, color) {
    impact(pos, color, true, dir);
    flash(pos, 0xffffff, 2.6, 0.07);
    // shockwave rings facing along the kick, pushed out the far side of the target
    for (const [sz, life, off] of [[2.6, 0.3, 0.3], [1.6, 0.22, 0.9]]) {
      const mesh = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.62, 40),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      const at = pos.clone().addScaledVector(dir, off); mesh.position.copy(at); mesh.lookAt(at.clone().add(dir));
      push(mesh, life, (e, dt) => { const k = e.t / e.life; e.obj.position.addScaledVector(dir, dt * 6); e.obj.scale.setScalar(1 + k * sz * 2); e.obj.material.opacity = 0.9 * (1 - k) * (1 - k); }, true);
    }
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
  function awakenBurst(f) {
    const c = f.center;
    flash(c, 0xffffff, 3.7, 0.15); flash(c, f.pal.aura, 5.2, 0.31);
    ring(c, f.pal.aura, 2.0);
    sparks(c, f.pal.aura, 15, new V3(0,1,0), 1.1);
    CameraRig.shake(0.5);
  }
  function auraSpark(f) {
    const s = sprite(TEX.glow, f.pal.aura, 0.35, 0.9);
    const a = Math.random() * TAU, r = 0.4 + Math.random() * 0.5;
    s.position.set(f.pos.x + Math.cos(a) * r, f.pos.y + 0.2 + Math.random() * 0.6, f.pos.z + Math.sin(a) * r);
    const v = 2.5 + Math.random() * 2.5;
    push(s, 0.6, (e, dt) => { e.obj.position.y += v * dt; e.obj.material.opacity = 0.9 * (1 - e.t / e.life); });
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
    const n = 1 + Math.round(lvl * 2);
    for (let i = 0; i < n; i++) {
      const s = sprite(TEX.glow, col, 0.3 + lvl * 0.25, 0.9);
      const d = new V3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(1.6 + lvl * 1.4);
      const target = at.clone();
      push(s, 0.28, (e) => { const k = e.t / e.life; e.obj.position.copy(target).addScaledVector(d, 1 - k); e.obj.material.opacity = 0.9 * k; });
    }
  }
  function groundRing(f, lvl) {
    const col = f.awakened ? f.pal.aura : f.pal.ki;
    const m = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.78, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(f.pos.x, f.pos.y + 0.06, f.pos.z);
    push(m, 0.5, (e) => { const k = e.t / e.life; e.obj.scale.setScalar(1 + k * (1.5 + lvl * 2)); e.obj.material.opacity = 0.7 * (1 - k); }, true);
  }
  function chargeFull(f) {
    const col = f.awakened ? f.pal.aura : f.pal.ki;
    flash(f.orb.position, 0xffffff, 3, 0.15); ring(f.orb.position, col, 2.2); ring(f.center, 0xffffff, 1.6);
    if (f === Game.player) { CameraRig.shake(0.2); if (Settings.get('haptics') && navigator.vibrate) navigator.vibrate(20); }
  }
  // big blast explosion
  function bigBlast(pos, color, lvl) {
    flash(pos, 0xffffff, 5 + lvl * 3, 0.14); flash(pos, color, 8 + lvl * 6, 0.4);
    ring(pos, 0xffffff, 2.5 + lvl * 2); ring(pos, color, 3.5 + lvl * 3);
    sparks(pos, color, 12 + Math.round(lvl * 10));
    const w = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.8, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    w.position.copy(pos); w.rotation.x = -Math.PI / 2;
    push(w, 0.5, (e) => { const k = e.t / e.life; e.obj.scale.setScalar(1 + k * (6 + lvl * 6)); e.obj.material.opacity = 0.85 * (1 - k); }, true);
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
  // teleport: a sharp pop where you were, a streak between, and a pop where you land
  function vanish(from, to, col, perfect) {
    flash(from, 0xffffff, 3.2, 0.1); ring(from, col, 1.4); sparks(from, col, 6);
    for (let i = 1; i <= 5; i++) {
      const s = sprite(TEX.glow, col, 0.9, 0.5); s.position.lerpVectors(from, to, i / 6);
      push(s, 0.18 + i * 0.02, (e) => { e.obj.material.opacity = 0.5 * (1 - e.t / e.life); });
    }
    const at = to.clone();
    push(sprite(TEX.glow, 0xffffff, 0.1, 0), 0.13, (e) => { if (e.t >= 0.12 && !e.done) { e.done = true; flash(at, 0xffffff, perfect ? 4.5 : 3, 0.14); ring(at, perfect ? 0xffd166 : col, perfect ? 2.6 : 1.6); if (perfect) sparks(at, 0xffe08a, 12); } });
  }
  function blockSpark(pos) { flash(pos, 0xbfe9ff, 2.6, 0.12); ring(pos, 0x8fd8ff, 1.0); sparks(pos, 0xd8f4ff, 5); }
  // parry: bright gold double ring
  function parry(pos) { flash(pos, 0xffffff, 5, 0.14); flash(pos, 0xffd166, 7, 0.3); ring(pos, 0xffd166, 2.6); ring(pos, 0xffffff, 1.6); sparks(pos, 0xffe08a, 14); }
  return { kickImpact, push, sprintTrail, vanish, launchTrail, groundSlam, chargeSpark, groundRing, chargeFull, bigBlast, guardBreak, dizzy, blockSpark, parry, ring, flash, sparks, impact, dust, dashBurst, awakenBurst, auraSpark, trail, sprite, update, clear };
})();

