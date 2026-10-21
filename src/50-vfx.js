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

