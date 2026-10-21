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
    target.hurtT = 0;
    if (attacker === Game.player) Game.onPlayerHit(dmg);
    target.stun = heavy ? 0.34 : (kind === 'melee' ? 0.27 : 0.22); target.hitFlash = 0.15;
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
    if (target.guard <= 0) {
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
    if (attacker.meleeCd > 0 || attacker.punchT > 0 || attacker.stun > 0 || attacker.launched || attacker.downT > 0) return;
    if (attacker.charging) attacker.cancelCharge();
    if (attacker.t - attacker.lastMelee > TUNING.comboWindow) attacker.combo = 0;
    const stage = attacker.combo;
    const kick = stage === 3;
    const counter = attacker.riposteT > 0;
    if (counter) attacker.riposteT = 0;
    attacker.lastMelee = attacker.t;
    attacker.combo = (stage + 1) % 4;
    // Once the finisher is started, do not automatically spin a buffered press
    // into the next opening jab. A fresh input can start a new combo afterward.
    if (stage === 3) { attacker.meleeQ = 0; attacker.meleeBuf = 0; }
    attacker.attackKind = kick ? 'kick' : stage === 2 ? 'hook' : 'punch';
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
      if (dist > TUNING.meleeRange * 0.67 && dist < TUNING.meleeRange + 0.65) {
        // Small grounded follow-step, not a long-range homing punch.
        const step = Math.min(8.5, 6.2 + stage * 0.65);
        attacker.vel.lerp(toT.setY(0).normalize().multiplyScalar(step), 0.4);
        attacker.lungeAt = attacker.t;
      }
    }
    // Wind-up/contact/recovery are distinct. Chaining doesn't duplicate a queued hit.
    attacker.kickPend = { target, t: [0.15, 0.20, 0.33, 0.41][stage], kick, stage, counter };
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
        Game.callout('Air smash', 'smash'); Effects.ring(target.center, 0xffd166, 2); }
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
      const push = [5.8, 7.2, 8][stage];
      result = hit(attacker, target, base, fwd.multiplyScalar(push).setY(stage === 2 ? 2.2 : 0.8), stage === 2 || counter);
    }
    if (result === 'hit') {
      // Small distinct trail bursts on the first three contacts: cleaner than freezing the whole screen.
      if (stage === 2 && !air) Effects.ring(target.center, col, 1.1);
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
    if (attacker.blastCd > 0 || attacker.stun > 0 || attacker.energy < cost - 0.01) return;
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
    const core = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
    // glow grows less than the core so big shots stay readable instead of whiting out the screen
    const gk = (1 + 0.6 * lvl) / size;
    const glow = Effects.sprite(TEX.glow, color, 2.6 * gk, 0.9); const halo = Effects.sprite(TEX.glow, color, 5 * gk, 0.25);
    core.add(glow, halo); core.scale.setScalar(size); core.position.copy(start); scene.add(core);
    Effects.flash(start, color, 2.5 * (1 + 0.8 * lvl), 0.15 + lvl * 0.1);
    if (lvl > 0.3) { Effects.ring(start, color, 1.5 + lvl * 1.5); if (attacker === Game.player) CameraRig.shake(0.15 + lvl * 0.25); attacker.vel.addScaledVector(dir, -6 * lvl); }
    projectiles.push({ gk, mesh: core, vel: dir.multiplyScalar(TUNING.blastSpeed - 14 * lvl), owner: attacker, target, life: 2.4 + lvl, color, lvl, size,
      dmg: (TUNING.blastDamage + TUNING.chargeDmg * lvl) * damageMul(attacker) });
  }
  function update(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.mesh.position.addScaledVector(p.vel, dt); p.life -= dt;
      p.mesh.children[0].scale.setScalar(2.6 * p.gk * (1 + Math.sin(performance.now() * 0.03) * 0.15));
      Effects.trail(p.mesh.position, p.color, 1.6 * (1 + 0.3 * p.lvl));
      let dead = p.life <= 0 || p.mesh.position.y < 0 || Math.hypot(p.mesh.position.x, p.mesh.position.z) > ARENA_RADIUS + 20;
      if (!dead && p.mesh.position.distanceTo(p.target.center) < 1.25 * (1 + 0.5 * p.lvl) && p.target.hp > 0) {
        const charged = p.lvl > 0.05;
        hit(p.owner, p.target, p.dmg, p.vel.clone().normalize().multiplyScalar(12 + 14 * p.lvl).setY(charged ? 2 + 3 * p.lvl : 0), p.lvl > 0.5, charged ? 'charged' : 'blast'); dead = true;
        if (charged) { Effects.bigBlast(p.mesh.position, p.color, p.lvl); CameraRig.shake(0.3 + p.lvl * 0.4); }
        else { Effects.ring(p.mesh.position, p.color, 2.5); Effects.flash(p.mesh.position, p.color, 6, 0.25); }
      }
      if (dead) { remove(p); projectiles.splice(i, 1); }
    }
  }
  function remove(p) { scene.remove(p.mesh); p.mesh.children.forEach(c => c.material.dispose()); p.mesh.material.dispose(); }
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


