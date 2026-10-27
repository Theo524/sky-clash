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
    if (typeof attacker.gainAwaken === 'function') attacker.gainAwaken(Math.min(22, 5 + dmg * 1.3));
    if (typeof target.gainAwaken === 'function') target.gainAwaken(Math.min(16, 3 + dmg * 0.65));
    target.hurtT = 0;
    if (attacker === Game.player) Game.onPlayerHit(dmg);
    target.stun = heavy ? 0.52 : (kind === 'melee' ? 0.41 : 0.27); target.hitFlash = heavy ? 0.20 : 0.15;
    target.meleeQ = 0; target.meleeBuf = 0; target.combo = 0; target.comboFollow = null;
    if (kind !== 'melee') { target.launched = target.launched && target.pos.y > target.floor + 0.5; }
    target.vel.copy(knock);
    target.dashT = 0;
    const c = target.center;
    Effects.impact(c, attacker.awakened ? attacker.pal.aura : 0xffe8a8, heavy,
      knock.lengthSq()>0.001?knock.clone().normalize():attacker.forward());
    Sound.play(heavy ? 'heavy' : 'hit');
    CameraRig.shake((attacker === Game.player ? 0.25 : 0.4) * (heavy ? 1.6 : 1));
    Game.hitStop(AnimeFeelV165.enabled?AnimeFeelV165.hitStop(heavy,kind):(heavy ? 0.075 : 0.035));
    if (target === Game.player && Settings.get('haptics') && navigator.vibrate) navigator.vibrate(30);
    else if(AnimeFeelV165.enabled&&attacker===Game.player&&Settings.get('haptics')&&navigator.vibrate)
      navigator.vibrate(heavy?[20,14,28]:14);
    return 'hit';
  }
  function blocked(attacker, target, dmg, knock, kind, floorHp) {
    const c = target.center.add(target.forward().multiplyScalar(0.7));
    target.hurtT = 0;
    // After a real guarded hit, double-tap Guard to slip behind the attacker.
    target.guardCounterWindow = TUNING.defensiveVanishWindow;
    target.guardHitBy = attacker;
    if (typeof target.gainAwaken === 'function') target.gainAwaken(5);
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
    if (target.guard <= 0) { target.guardCounterWindow = 0;
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
  // V50: An optional, input-confirmed aerial extension of a successful launcher.
  // Unlike a free teleport, this is a bounded physical jump/flight pursuit.
  function airFollow(attacker, target, phase) {
    const kind = phase === 1 ? 'skyUppercut' : phase === 2 ? 'skyKick' : 'fallingFist';
    const t = target.pos.clone().sub(attacker.pos);
    const h = Math.hypot(t.x, t.z);
    const groundedFinish = phase === 3;
    if (h > (groundedFinish ? TUNING.groundFollowRange : TUNING.airFollowRange) ||
        Math.abs(t.y) > (groundedFinish ? TUNING.groundFollowHeight : TUNING.airFollowHeight) ||
        target.hp <= 0 || (groundedFinish ? target.meteorWindow <= 0 || target.spiked : !target.launched || target.spiked)) return false;
    attacker.comboFollow = null; // Consume the opening; only a real hit unlocks the next one.
    attacker.combo = 0;
    attacker.sprinting = false; attacker.skidT = 0; attacker.dashT = 0;
    attacker.dashPrep = 0; attacker.dashRecoverT = 0; attacker.chase = null;
    attacker.attackAir = true; attacker.attackMoving = true;
    attacker.attackKind = kind; attacker.punchSide = 0;
    attacker.attackTarget = target;
    attacker.attackOrigin.copy(attacker.pos);
    attacker.attackTravelBudget = groundedFinish ? 6.5 : TUNING.airFollowBudget;
    attacker.attackTravel.copy(new V3(t.x, 0, t.z).lengthSq() > 0.01 ? new V3(t.x, 0, t.z).normalize() : attacker.forward());
    attacker.attackDrive = TUNING.airFollowSpeed;
    attacker.facing = lerpAngle(attacker.facing, yawFromDir(t.x, t.z), 0.8);
    // A controlled rising chase; never warp the character's position.
    if (phase === 1 && t.y > 0.7) attacker.vel.y = Math.max(attacker.vel.y, Math.min(15.5, 7 + t.y * 2));
    if (groundedFinish) { attacker.vel.y = Math.min(attacker.vel.y, t.y < -1 ? -24 : -4); target.meteorWindow = 0; }
    const total = phase === 1 ? 0.57 : phase === 2 ? 0.63 : 0.81;
    const contact = phase === 1 ? 0.29 : phase === 2 ? 0.30 : 0.53;
    attacker.attackSerial++;
    attacker.punchT = total; attacker.attackTotal = total; attacker.attackElapsed = 0;
    attacker.meleeCd = total - 0.015;
    attacker.kickPend = { target, t: contact, kick: phase === 2, stage: phase === 1 ? 4 : phase === 2 ? 5 : 6,
      counter: false, swingPlayed: false };
    if (attacker === Game.player) Game.callout(phase === 1 ? 'SKY UPPERCUT' : phase === 2 ? 'METEOR KICK' : 'FALLING FIST', phase === 1 ? 'launch' : 'smash');
    return true;
  }
  // Four readable beats: jab > cross > turning hook > rising kick.
  // Input buffering happens in Game, contact is delayed until the corresponding active frame.
  function melee(attacker, target) {
    if (attacker.awakenChargeT > 0 || attacker.meleeCd > 0 || attacker.punchT > 0 || attacker.stun > 0 || attacker.launched || attacker.downT > 0) return;
    if (attacker.charging) attacker.cancelCharge();
    const follow = attacker.comboFollow;
    if (follow) {
      if (attacker.t <= follow.until && follow.target === target &&
          airFollow(attacker, target, follow.phase)) return;
      attacker.comboFollow = null;
    }
    if (attacker.t - attacker.lastMelee > TUNING.comboWindow) attacker.combo = 0;
    const stage = attacker.combo;
    if (stage === 0) attacker.comboCycle = (attacker.comboCycle || 0) + 1;
    attacker.attackVariant = stage === 2 && attacker.comboCycle % 2 === 0 ? 'overhand' : 'hook';
    const ninja = attacker.characterId === 'rin_sable';
    const kick = stage === 3 || (ninja && stage === 2); // third ninja beat: heel kick without launch
    const counter = attacker.riposteT > 0;
    if (counter) attacker.riposteT = 0;
    attacker.lastMelee = attacker.t;
    attacker.combo = (stage + 1) % 4;
    attacker.sprinting = false; attacker.skidT = 0; attacker.dashT = 0; attacker.dashPrep = 0; attacker.dashRecoverT = 0; attacker.chase = null;
    const moveDir = attacker.moveIntent.lengthSq() > 0.05 ? attacker.moveIntent.clone().setY(0).normalize() : (Math.hypot(attacker.vel.x, attacker.vel.z) > 0.1 ? attacker.vel.clone().setY(0).normalize() : attacker.forward());
    attacker.attackTravel = moveDir.clone();
    attacker.attackAir = attacker.flying;
    // For opponents slightly above ground, make the rising punch into a short,
    // physical jumping pursuit rather than a ground punch which cannot reach.
    const rise = target.pos.y - attacker.pos.y;
    const flatDistance = Math.hypot(target.pos.x - attacker.pos.x, target.pos.z - attacker.pos.z);
    if (!attacker.attackAir && rise > 1.55 && rise < 4.0 && flatDistance < 4.1) {
      attacker.attackAir = true;
      attacker.jumping = false;
      attacker.vel.y = Math.max(attacker.vel.y, 8.0);
    }
    // Only acquire nearby opponents. Striking empty space stays entirely manual.
    attacker.attackTarget = target.hp > 0 && (Game.mode !== 'dojo' || Game.dojoRival) &&
      flatDistance < TUNING.meleePursuitRange + (attacker.attackAir ? 0.95 : 0) &&
      Math.abs(rise) < TUNING.meleePursuitHeight + (attacker.attackAir ? 1.4 : 0) ? target : null;
    attacker.attackOrigin.copy(attacker.pos);
    attacker.attackTravelBudget = attacker.attackAir ? TUNING.meleePursuitAir : TUNING.meleePursuitGround;
    attacker.attackDrive = Math.max(2.4, Math.min(AnimeFeelV165.enabled?9.5:8.0,
      Math.hypot(attacker.vel.x, attacker.vel.z) + (attacker.sprintHeld ? (AnimeFeelV165.enabled?3.2:2.4) : 0)));
    attacker.attackMoving = attacker.attackDrive > 2.8 || attacker.moveIntent.lengthSq() > 0.12;
    // Once the finisher is started, do not automatically spin a buffered press
    // into the next opening jab. A fresh input can start a new combo afterward.
    if (stage === 3) { attacker.meleeQ = 0; attacker.meleeBuf = 0; }
    attacker.attackKind = ninja ? ['ninjaPalm','ninjaElbow','ninjaSpin','ninjaRising'][stage] : attacker.attackAir && stage === 3 ? 'airStrike' : kick ? 'kick' : stage === 2 ? 'hook' : 'punch';
    attacker.attackSerial++;
    // Distinct timing gives each attack identity. Last kick has a longer readable recovery.
    const agile = attacker.characterId === 'rin_sable' ? 0.82 : 1;
    // Kairo's opening jab needs an actual readable wind-up before the next strike.
    // The later kick timing is deliberately unchanged.
    // V165: recorded strike progression is indexed by normalized attack
    // progress in V72. Scaling recovery AND contact delay together keeps
    // the authored wind-up -> hit -> follow-through in phase.
    const beatScale=AnimeFeelV165.enabled?AnimeFeelV165.tempo(stage):1;
    const cd = (ninja ? [0.38,0.47,0.61,0.76] : [0.55,0.55,0.69,0.88])[stage] * agile * beatScale;
    const anim = (ninja ? [0.39,0.48,0.62,0.78] : [0.55,0.55,0.68,0.87])[stage] * agile * beatScale;
    attacker.meleeCd = cd; attacker.punchT = anim;
    attacker.attackTotal = anim; attacker.attackElapsed = 0;
    attacker.punchSide = stage === 0 || stage === 2 ? 1 : 0;
    const toT = target.pos.clone().sub(attacker.pos), dist = toT.length();
    // Start oriented toward a close opponent; the moving wind-up can still
    // re-aim to follow their actual lateral motion before the contact frame.
    if (attacker.attackTarget && dist > 0.01 && dist < TUNING.lungeRange + 0.65) {
      const to = yawFromDir(toT.x, toT.z);
      attacker.facing = lerpAngle(attacker.facing, to, dist < 3.5 ? 0.8 : 0.5);
    }
    // Wind-up/contact/recovery are distinct. Chaining doesn't duplicate a queued hit.
    attacker.kickPend = { target, t: (ninja ? [0.12,0.19,0.27,0.35] : [0.24,0.24,0.33,0.41])[stage] * agile * beatScale, kick, stage, counter, swingPlayed: false };
    if (counter && attacker === Game.player) Game.callout('Counter!', 'parry');
  }
  function strike(attacker, target, kick, stage = 0, counter = false) {
    // Training props are separate hit volumes: dummies, bags, and projectile targets.
    if (Game.mode === 'dojo' && Dojo.hitMelee(attacker,stage,kick)) {
      attacker.energy = Math.min(100, attacker.energy + 2);
      attacker.awakenGauge = Math.min(TUNING.awakenGaugeMax, attacker.awakenGauge + 4);
    }
    if (Game.mode === 'dojo' && !Game.dojoRival) return;
    if (target.hp <= 0) return;
    const air = target.launched && !target.spiked;
    const toT = target.pos.clone().sub(attacker.pos);
    const h = Math.hypot(toT.x, toT.z), y = Math.abs(toT.y);
    // A volumetric melee hitbox reaches opponents slightly above/below a flying
    // fighter, but cannot touch a faraway opponent just because they're locked on.
    const follow = stage >= 4;
    const reach = TUNING.meleeRange + (kick ? 0.27 : 0) + (follow ? 0.48 : 0) + (attacker.awakened ? 0.08 : 0);
    const rise = stage === 6 ? 2.4 : follow ? 3.05 : attacker.attackAir ? 2.55 : kick ? 1.9 : 1.42;
    if ((h / reach) ** 2 + (y / rise) ** 2 > 1 || h > reach || y > rise) return;
    const fwd = attacker.forward();
    if (h > 1.15 && fwd.dot(new V3(toT.x / h, 0, toT.z / h)) <= Math.cos(TUNING.meleeArc)) return;
    const base = TUNING.meleeDamage * damageMul(attacker) * [0.87, 1, 1.2, 1.58, 1.12, 1.76, 2.35][stage] * (counter ? 1.3 : 1);
    const col = attacker.awakened ? attacker.pal.aura : attacker.pal.ki;
    let result;
    if (stage === 6 && target.meteorSource === attacker && target.downT > 0) {
      result = hit(attacker, target, base, fwd.clone().multiplyScalar(5).setY(0), true);
      if (result === 'hit') {
        target.meteorSource = null; target.meteorWindow = 0; target.downT = Math.max(target.downT, 0.72);
        target.stun = Math.max(target.stun, 0.95);
        Effects.meteorCrater(target.pos, col, true);
        Effects.flash(target.center, 0xffffff, 4.2, 0.12);
        Game.hitStop(0.115); CameraRig.shake(attacker === Game.player ? 0.41 : 0.27);
        if (attacker === Game.player) Game.callout('FALLING FIST · FINISH!', 'smash');
      }
    } else if (air && stage === 5) {
      const kd = fwd.clone();
      result = hit(attacker, target, base, fwd.multiplyScalar(4.5).setY(-TUNING.spikeSpeed), true);
      if (result === 'hit') {
        kickImpact(attacker, target, kd); target.spiked = true; target.stun = 1.65;
        target.meteorSource = attacker; target.meteorWindow = 0;
        Game.callout('METEOR SMASH', 'smash'); Effects.flash(target.center, 0xffd166, 2.5, 0.14);
      }
    } else if (air && stage === 4) {
      result = hit(attacker, target, base, fwd.multiplyScalar(2.6).setY(7.0), true);
      if (result === 'hit') {
        target.launched = true; target.spiked = false; target.juggle++;
        target.stun = 0.83;
        attacker.comboFollow = { target, phase: 2, until: attacker.t + TUNING.airFollowWindow };
        Effects.flash(target.center, col, 1.65, 0.10);
      }
    } else if (attacker.characterId === 'rin_sable' && stage === 2) {
      // Heel strike disorients instead of copying Kairo's early air-launch.
      result = hit(attacker, target, base, fwd.multiplyScalar(3.5).setY(1.35), true);
      if (result === 'hit') Effects.sparks(target.center, col, 8);
    } else if (air && kick) {
      const kd = fwd.clone();
      result = hit(attacker, target, base * 1.25, fwd.multiplyScalar(6).setY(-TUNING.spikeSpeed), true);
      if (result === 'hit') { kickImpact(attacker, target, kd); target.spiked = true; target.stun = 2;
        Game.callout('Air smash', 'smash'); Effects.flash(target.center, 0xffd166, 2.4, 0.12); }
    } else if (air) {
      result = hit(attacker, target, base * 0.83, fwd.multiplyScalar(3).setY(4.5), stage === 2);
      if (result === 'hit') { target.juggle++; target.launched = true;
        target.stun = target.juggle >= TUNING.juggleMax ? 0.25 : Math.max(0.3, TUNING.airHitStun - 0.07 * target.juggle); }
    } else if (kick) {
      const kd = fwd.clone();
      result = hit(attacker, target, base, fwd.multiplyScalar(4).setY(TUNING.launchUp), true);
      if (result === 'hit') { kickImpact(attacker, target, kd); target.launched = true; target.launchT = 0;
        target.juggle = 0; target.stun = Math.max(TUNING.launchStun, 1.15); Effects.launchTrail(target);
        // The player must press Melee again while the opponent is in the air.
        attacker.comboFollow = { target, phase: 1, until: attacker.t + TUNING.airFollowWindow };
        if (attacker === Game.player) Game.callout('LAUNCH · TAP MELEE TO FOLLOW', 'launch'); }
    } else {
      // Opening strikes keep opponents within range for a real four-hit chain.
      const push = [3.1, 4.0, 6.6][stage];
      result = hit(attacker, target, base, fwd.multiplyScalar(push).setY(stage === 2 ? 2.2 : 0.8), stage === 2 || counter);
    }
    if (result === 'hit') {
      Spectacle.contact(attacker, target, stage <= 3 ? stage : stage === 4 ? 2 : 3, counter);
      if (stage < 3) target.stun = Math.max(target.stun, [0.45, 0.49, 0.60][stage]);
      // Subtle hit-confirm follow-step while leaving movement and dash under player control.
      if (!attacker.flying && stage < 3) attacker.vel.addScaledVector(attacker.forward(), 1.35);
      // Small distinct trail bursts on the first three contacts: cleaner than freezing the whole screen.
      attacker.energy = Math.min(100, attacker.energy + (kick ? 3.2 : 1.3));
      if (counter) { target.stun = Math.max(target.stun, 0.63); attacker.energy = Math.min(100, attacker.energy + 5); }
    }
  }
  function onMeteorLanding(victim) {
    const attacker = victim.meteorSource;
    if (!attacker || attacker.hp <= 0 || victim.hp <= 0 || attacker.stun > 0) { victim.meteorSource = null; return; }
    victim.meteorWindow = TUNING.groundFollowWindow;
    victim.downT = Math.max(victim.downT, TUNING.groundFollowWindow + 0.15);
    victim.stun = Math.max(victim.stun, TUNING.groundFollowWindow + 0.18);
    attacker.comboFollow = { target: victim, phase: 3, until: attacker.t + TUNING.groundFollowWindow };
    if (attacker === Game.player) Game.callout('GROUND IMPACT · TAP MELEE!', 'smash');
  }
  // kick connects: longer freeze, bigger shake, a shockwave facing the kick and a burst of sparks thrown along it
  function kickImpact(attacker, target, dir) {
    const c = target.center, col = attacker.awakened ? attacker.pal.aura : attacker.pal.ki;
    Effects.kickImpact(c, dir, col);
    Game.hitStop(TUNING.kickHitStop);
    CameraRig.shake(attacker === Game.player ? 0.55 : 0.6);
    if (attacker === Game.player && Settings.get('haptics') && navigator.vibrate) navigator.vibrate(45);
  }
  function shuriken(attacker,target,aimMode,lvl=0) {
    const cost=9+17*lvl;
    if(attacker.awakenChargeT>0||attacker.blastCd>0||attacker.stun>0||attacker.energy<cost) return;
    attacker.cancelCharge();attacker.energy-=cost;attacker.blastCd=.31+lvl*.22;
    attacker.blastT=.24;attacker.blastLvl=lvl;
    const origin=attacker.center.addScaledVector(attacker.forward(),.95);
    const dir=aimMode==='target'?target.center.sub(origin).normalize():attacker.forward();
    const n=lvl>.72?3:1;
    for(let k=0;k<n;k++) {
      const a=(k-(n-1)*.5)*.14;
      const direction=dir.clone().applyAxisAngle(new V3(0,1,0),a).normalize();
      const shape=new THREE.Shape();
      for(let j=0;j<16;j++) {
        const phi=j/16*TAU,r=j%4===0?.49:j%2===0?.19:.27;
        if(j===0)shape.moveTo(Math.cos(phi)*r,Math.sin(phi)*r);
        else shape.lineTo(Math.cos(phi)*r,Math.sin(phi)*r);
      }
      shape.closePath();
      const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:attacker.awakened?0xe6d2ff:0x9d88d2,side:THREE.DoubleSide}));
      mesh.position.copy(origin).addScaledVector(direction,k*.10);
      mesh.quaternion.setFromUnitVectors(new V3(0,0,1),direction);
      scene.add(mesh);
      projectiles.push({type:'shuriken',mesh,owner:attacker,target,color:attacker.pal.ki,lvl,
        vel:direction.multiplyScalar(38+lvl*9),dmg:(7+lvl*6)*damageMul(attacker)/Math.sqrt(n),life:1.4,wakeT:0});
    }
    Sound.play('blast');
    if(attacker===Game.player && lvl>.72)Game.callout('SHADOW VOLLEY','launch');
  }
  function blast(attacker, target, aimMode, lvl = 0) {
    if(attacker.characterId==='rin_sable') return shuriken(attacker,target,aimMode,lvl);
    const cost = TUNING.blastCost + TUNING.chargeCost * lvl;
    if (attacker.awakenChargeT > 0 || attacker.blastCd > 0 || attacker.stun > 0 || attacker.energy < cost - 0.01) return;
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
    if (aimMode === 'target' || (Game.mode !== 'dojo' && angle < TUNING.blastAssistAngle)) dir = toT.normalize();
    else dir = fwd;
    if (aimMode === 'target') attacker.facing = yawFromDir(dir.x, dir.z);
    const color = attacker.awakened ? attacker.pal.aura : attacker.pal.ki;
    const superShot = lvl > 0.93;
    const bigShot = lvl > 0.55;
    const group = new THREE.Group();
    const core = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, toneMapped: false }));
    core.scale.setScalar((0.66 + 0.54 * lvl) * size); group.add(core);
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34 + lvl * 0.25, 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: superShot ? 0.82 : 0.74, depthWrite: false,
        blending: THREE.AdditiveBlending, toneMapped: false }));
    shell.scale.set(size * 1.0, size * 1.0, size * (1.55 + lvl * 0.4)); group.add(shell);
    const shell2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.20 + lvl * 0.12, 1),
      new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.52, depthWrite:false,
        blending:THREE.AdditiveBlending, toneMapped:false }));
    shell2.scale.set(size * 0.95, size * 0.95, size * (1.95 + lvl * 0.7)); group.add(shell2);
    const glow = Effects.sprite(TEX.glow, color, 1.7 + lvl * 2.1, 0.86);
    const halo = Effects.sprite(TEX.glow, color, 2.6 + lvl * 3.1, 0.17);
    const coreHalo = Effects.sprite(TEX.glow, 0xffffff, 1.0 + lvl * 1.0, 0.70);
    group.add(glow, halo, coreHalo);
    const powerFins = [];
    if (bigShot) {
      // Charged blast silhouette: a bright elongated plasma spear with layered trailing fins.
      // Normal small projectiles keep their existing appearance.
      core.scale.set(1.0, 1.0, 1.55 + 1.2 * lvl);
      shell.scale.set(size * 0.84, size * 0.84, size * (1.90 + lvl * 0.48));
      shell2.scale.set(size * 0.76, size * 0.76, size * (2.32 + lvl * 0.58));
      for (let j = 0; j < (superShot ? 8 : 5); j++) {
        const a = (j / (superShot ? 8 : 5)) * Math.PI * 2;
        const dist = 0.55 + lvl * 0.5;
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.18 + lvl * 0.08, 1.9 + lvl * 2.5, 5, 1),
          new THREE.MeshBasicMaterial({color: j % 3 === 0 ? 0xffffff : color, transparent: true,
            opacity: j % 3 === 0 ? 0.80 : 0.48, depthWrite: false,
            blending: THREE.AdditiveBlending, toneMapped: false}));
        fin.rotation.x = Math.PI * 0.5;
        fin.position.set(Math.cos(a) * dist, Math.sin(a) * dist, -1.25 * lvl);
        group.add(fin); powerFins.push({ mesh: fin, angle: a, dist, alpha: fin.material.opacity });
      }
      halo.scale.multiplyScalar(1.25); coreHalo.scale.multiplyScalar(1.20);
    }
    const orbiters = [];
    if (Settings.get('quality') !== 'low') {
      for (let j=0; j<(superShot?4:2); j++) {
        const orb = Effects.sprite(TEX.glow, j%2?0xffffff:color, 0.32 + lvl * 0.22, 0.72);
        orb.position.set(Math.cos(j * Math.PI) * (0.46 + lvl * 0.16), Math.sin(j * Math.PI) * (0.30 + lvl * 0.10), -0.12 * j);
        group.add(orb); orbiters.push(orb);
      }
    }
    group.position.copy(start); group.quaternion.setFromUnitVectors(new V3(0,0,1), dir.clone().normalize()); scene.add(group);
    Spectacle.muzzle(start, dir, color, lvl);
    Effects.flash(start, color, 1.6 * (1 + 0.6 * lvl), 0.10 + lvl * 0.04);
    if (lvl > 0.3) {
      if (attacker === Game.player) CameraRig.shake(0.10 + lvl * 0.12);
      attacker.vel.addScaledVector(dir, -4 * lvl);
    }
    if (superShot) { Sound.play('super'); if (attacker === Game.player) Game.callout('SUPER BLAST', 'launch'); }
    projectiles.push({ mesh: group, core, shell, shell2, glow, halo, orbiters, powerFins, wakeT: 0,
      vel: dir.multiplyScalar(TUNING.blastSpeed - 14 * lvl), owner: attacker, target, life: 2.4 + lvl, color, lvl, size,
      dmg: (TUNING.blastDamage + TUNING.chargeDmg * lvl) * damageMul(attacker) * (superShot ? 1.12 : 1) });
  }
  function update(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      const previousPosition = p.mesh.position.clone();
      p.mesh.position.addScaledVector(p.vel, dt); p.life -= dt;
      if(p.type==='shuriken') {
        p.mesh.rotateZ(dt*27);
        p.wakeT-=dt;
        if(p.wakeT<=0){p.wakeT=.055;Effects.trail(p.mesh.position,p.color,.34);}
        let dead=p.life<=0||p.mesh.position.y<0||Math.hypot(p.mesh.position.x,p.mesh.position.z)>ARENA_RADIUS+20;
        if(!dead&&Game.mode==='dojo'&&Dojo.hitBlast(previousPosition,p.mesh.position,p.lvl)){
          Effects.sparks(p.mesh.position,p.color,5);dead=true;
        }
        if(!dead&&(Game.mode!=='dojo'||Game.dojoRival)&&p.target.hp>0&&p.mesh.position.distanceTo(p.target.center)<1.27){
          hit(p.owner,p.target,p.dmg,p.vel.clone().normalize().multiplyScalar(5),false,'blast');
          Effects.sparks(p.mesh.position,p.color,5);dead=true;
        }
        if(dead){remove(p);projectiles.splice(i,1);}continue;
      }
      p.shell.rotation.y += dt * (7 + p.lvl * 5);
      p.shell.rotation.z += dt * 4;
      if (p.shell2) { p.shell2.rotation.x -= dt * 5.5; p.shell2.rotation.y += dt * 3.8; }
      p.glow.material.opacity = 0.72 + 0.16*Math.sin(p.life*28);
      if (p.halo) p.halo.material.opacity = 0.16 + 0.06*Math.sin(p.life*20);
      if (p.orbiters) p.orbiters.forEach((o,i)=> { const a = p.life*8 + i*Math.PI; o.position.set(Math.cos(a)*(0.34+p.lvl*0.12), Math.sin(a*1.2)*(0.22+p.lvl*0.08), -0.15); o.material.opacity = 0.62; });
      if (p.powerFins) p.powerFins.forEach((q,i) => {
        const a = q.angle + p.life * (i % 2 ? -1.2 : 1.0);
        q.mesh.position.x = Math.cos(a) * q.dist;
        q.mesh.position.y = Math.sin(a) * q.dist;
        q.mesh.material.opacity = q.alpha * (0.83 + 0.17 * Math.sin(p.life * 24 + i));
      });
      // Fixed-rate wake avoids creating dozens of sprites per frame on phones.
      p.wakeT -= dt;
      if (p.wakeT <= 0) {
        p.wakeT = Settings.get('quality') === 'low' ? 0.09 : 0.045;
        Effects.trail(p.mesh.position, p.color, 0.8 + 0.42*p.lvl);
        Spectacle.wake(p.mesh.position, p.vel.clone().normalize(), p.color, p.lvl);
      }
      let dead = p.life <= 0 || p.mesh.position.y < 0 || Math.hypot(p.mesh.position.x, p.mesh.position.z) > ARENA_RADIUS + 20;
      if (!dead && Game.mode === 'dojo' && Dojo.hitBlast(previousPosition,p.mesh.position,p.lvl)) {
        Spectacle.explosion(p.mesh.position,p.vel.clone().normalize(),p.color,Math.min(p.lvl,0.55));
        dead = true;
      }
      if (!dead && (Game.mode !== 'dojo' || Game.dojoRival) && p.mesh.position.distanceTo(p.target.center) < 1.25 * (1 + 0.5 * p.lvl) && p.target.hp > 0) {
        const charged = p.lvl > 0.05;
        const dirHit = p.vel.clone().normalize();
        const result = hit(p.owner, p.target, p.dmg, dirHit.clone().multiplyScalar(12 + 14 * p.lvl).setY(charged ? 2 + 3 * p.lvl : 0), p.lvl > 0.5, charged ? 'charged' : 'blast');
        // Full-power impact throws the victim into a readable, recorded recoil
        // and a controlled airborne arc instead of an instantaneous standing flash.
        if (result === 'hit' && p.lvl > 0.93) {
          p.target.superHitT = 0.82;
          p.target.stun = Math.max(p.target.stun, 0.92);
          p.target.launched = true; p.target.launchT = 0;
          p.target.vel.copy(dirHit).multiplyScalar(19).add(new V3(0, 6.8, 0));
          p.target.dashT = 0; p.target.sprinting = false; p.target.meleeQ = 0;
        }
        dead = true;
        const dir = p.vel.clone().normalize();
        Spectacle.explosion(p.mesh.position, dir, p.color, p.lvl);
        if (charged) {
          Effects.bigBlast(p.mesh.position, p.color, p.lvl);
          CameraRig.shake(0.22 + p.lvl * 0.26);
          if (p.lvl > 0.93) { Game.hitStop(0.11); Sound.play('superHit'); }
        } else { Effects.flash(p.mesh.position, 0xffffff, 1.6, 0.09); Effects.flash(p.mesh.position, p.color, 2.7, 0.14); }
      }
      if (dead) { remove(p); projectiles.splice(i, 1); }
    }
  }
  function remove(p) {
    scene.remove(p.mesh);
    p.mesh.traverse(c => {
      if (c.material) { if (Array.isArray(c.material)) c.material.forEach(m=>m.dispose()); else c.material.dispose(); }
      // The original projectile sphere geometry is shared, not owned by this shot.
      if (c.geometry && c.geometry !== geo) c.geometry.dispose();
    });
  }
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
  return { slam, melee, strike, blast, update, clear, onMeteorLanding, projectiles };
})();


