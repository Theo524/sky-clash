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
    if (stage === 4 || stage === 5) {
      // A vertical streak follows the actual uppercut / axe-kick action.
      // No enclosing ring and no long detached projectile trail.
      const p = f.center.clone().addScaledVector(dir, 0.68);
      const right = new V3(dir.z, 0, -dir.x);
      const rise = stage === 4;
      const a = p.clone().addScaledVector(right, rise ? -0.18 : 0.18);
      const b = a.clone().add(new V3(0, rise ? 1.35 : -1.50, 0)).addScaledVector(dir, 0.36);
      ribbon(a, b, col, rise ? 0.048 : 0.063, 0.16, 0.74);
      if (Settings.get('quality') === 'high')
        ribbon(a.clone().addScaledVector(right, 0.10), b.clone().addScaledVector(right, 0.08), 0xffffff, 0.018, 0.12, 0.52);
      return;
    }
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
