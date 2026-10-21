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


