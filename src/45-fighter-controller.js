/* ---------------- Movement expression profiles (V34) ----------------
 * A fighter can supply a motionStyle ID independently from their attacks/abilities.
 * These profiles only alter how movement looks, not movement speed, physics, hitboxes,
 * targeting or action inputs. New characters can override profiles and animation clips.
 */
const MOTION_STYLES = Object.freeze({
  martial: Object.freeze({ flipChance: 0.38, minFlipSpeed: 8.0, dashLean: 0.55, landingBend: 0.48 }),
  agile: Object.freeze({ flipChance: 0.62, minFlipSpeed: 7.0, dashLean: 0.7, landingBend: 0.54 }),
  heavy: Object.freeze({ flipChance: 0, minFlipSpeed: 99, dashLean: 0.2, landingBend: 0.3 }),
});

/* ---------------- Fighter ---------------- */
class Fighter {
  constructor(name, pal, spawn, characterId='kairo_venn') {
    this.characterId=characterId;
    this.character=typeof CharacterRegistry !== 'undefined' ? CharacterRegistry.get(characterId) : null;
    this.name = name; this.pal = pal; this.spawn = spawn.clone();
    this.canFly = !this.character || this.character.mobility.flight;
    this.model = buildFighterModel(pal);
    // V37: no meteor, speed shell or glow geometry attached to movement.
    scene.add(this.model.root, this.model.blob);
    // charge orb held between the hands while charging a blast
    this.orb = Effects.sprite(TEX.glow, pal.ki, 1, 0.95); this.orbCore = Effects.sprite(TEX.glow, 0xffffff, 0.5, 1);
    this.orb.visible = this.orbCore.visible = false; scene.add(this.orb, this.orbCore);
    this.motionStyle = pal.motionStyle || (this.character && this.character.style) || 'martial';
    this.motionProfile = MOTION_STYLES[this.motionStyle] || MOTION_STYLES.martial;
    this.pos = new V3(); this.vel = new V3(); this.reset();
  }
  reset() {
    this.pos.copy(this.spawn); this.vel.set(0, 0, 0); this.jumpsUsed=0;
    this.v108JumpPrepT=0;this.v108JumpPrepDuration=0;
    this.v108JumpPrepLaunchVy=0;this.v108JumpPrepSpeed=0;
    this.v109LandingDuration=0;this.v109LandingSpeed=0;
    this.facing = yawFromDir(-this.spawn.x, -this.spawn.z);
    this.model.root.rotation.y = this.facing;
    this.hp = 100; this.energy = 60;
    this.stamina = TUNING.staminaMax; this.staminaRestT = 0;
    this.exhausted = false; this.staminaNoticeT = 0;
    this.flightBlend = 0; this.flightSpeedBlend = 0; this.airBank = 0;
    this.comboCycle = 0; this.attackVariant = 'hook'; this.comboFollow = null; this.meteorWindow = 0; this.meteorSource = null;
    this.dashT = 0; this.dashCd = 0; this.dashWakeT = 0; this.dashDir = new V3(0, 0, 1);
    this.meleeCd = 0; this.blastCd = 0; this.awakenT = 0; this.awakenGauge = 0; this.awakenChargeT = 0; this.awakenChargeFxT = 0; this.awakenChargeProgress = 0; this.awakenRuptured = false; this.stun = 0;
    this.kickPend = null; this.punchT = 0; this.attackTotal = 0; this.attackElapsed = 0; this.punchSide = 0; this.attackKind = 'punch'; this.combo = 0; this.lastMelee = -9;
    this.attackSerial = (this.attackSerial || 0) + 1; this.riposteT = 0; this.meleeQ = 0; this.meleeBuf = 0; this.superHitT = 0;
    this.blastT = 0; this.hitFlash = 0; this.t = Math.random() * 10;
    this.nativeCombatReaction=null;this.nativeCombatParry=null;
    this.nativeCombatEpoch=(this.nativeCombatEpoch||0)+1;
    this.moveIntent = new V3(); this.vert = 0; this.wasFlying = false; this.dustT = 0;
    this.lean = { pitch: 0, roll: 0 };
    this.acro = null; this.acroClock = 0; this.lastAcroAt = -20; this.landingVariant = 0;
    this.guard = TUNING.guardMax; this.guardDelay = 0; this.blockHeld = false; this.blocking = false; this.blockT = 0; this.parryOk = 0; this.guardCounterWindow = 0; this.guardHitBy = null;
    this.lastBlockEnd = -9; this.brokenT = 0; this.blockW = 0; this.windT = 0; this.windTarget = null; this.windLen = 0;
    this.vanishRecoverT = 0; this.launched = false; this.launchT = 0; this.juggle = 0; this.spiked = false; this.downT = 0; this.invulnT = 0; this.chase = null; this.vanishCd = 0; this.vanishT = 0; this.sprintHeld = false; this.sprinting = false; this.dropping = false; this.landingMotionT = 0; this.dashWasChase = false; this.sprintFx = 0; this.jumping = false; this.jumpHold = 0; this.slamming = false; this.slamWindT = 0; this.slamTarget = null; this.slamLagT = 0; this.tumble = 0;
    this.chargeHeld = false; this.charging = false; this.chargeT = 0; this.chargeTarget = null; this.chargeAim = 'target'; this.chargeFull = false; this.chargeFx = 0; this.chargeCracked = false; this.auraFxT = 0; this.runPh = 0; this.runW = 0; this.dashPrep = 0; this.skidT = 0; this.accF = 0; this.prevLz = 0; this.hipYaw = 0; this.strideDir = 1; this.flyW = 0; this.hurtT = 0; this.attackDrive = 0; this.attackMoving = false; this.attackTravel = new V3(0,0,1); this.attackAir = false; this.attackTarget = null; this.attackOrigin = new V3(); this.attackTravelBudget = 0; this.dashRecoverT = 0; this.sprintShakeT = 0;
  }
  // Cosmetic acrobatics: no displacement, hitbox changes, input lock or camera spin.
  // Real positions remain under the physics engine, not the animation layer.
  startAcro(type, duration, direction = 1) {
    if (!Settings.get('acrobatics') || this.hp <= 0 || this.stun > 0 || this.launched ||
        this.spiked || this.downT > 0 || this.blocking || this.charging ||
        this.punchT > 0 || this.slamming || this.slamLagT > 0) return;
    if (this.acro && this.acro.type === 'flip' && type !== 'landing') return;
    this.acro = { type, t: 0, duration, direction };
    this.lastAcroAt = this.t;
  }
  // Sprint lockout prevents immediately re-enabling boost every frame after depletion.
  useStamina(cost) {
    if (this.exhausted || this.stamina < cost) return false;
    this.stamina = Math.max(0, this.stamina - cost);
    this.staminaRestT = TUNING.staminaRestDelay;
    if (this.stamina <= 0.001) this.exhausted = true;
    return true;
  }
  updateStamina(dt) {
    this.staminaNoticeT = Math.max(0, this.staminaNoticeT - dt);
    if (this.sprinting || this.dashing) {
      const drain = this.sprinting ? (this.flying ? TUNING.staminaSprintAir : TUNING.staminaSprintGround) : 0;
      if (drain > 0) {
        this.stamina = Math.max(0, this.stamina - drain * dt);
        this.staminaRestT = TUNING.staminaRestDelay;
        if (this.stamina < 0.001) { this.exhausted = true; this.sprinting = false;
          this.sprintHeld = false; this.skidT = this.flying ? 0 : TUNING.skidTime * 0.45;
          if (this === Game.player && this.staminaNoticeT <= 0) { Game.callout('Out of stamina', 'parry'); this.staminaNoticeT = 1.4; }
        }
      }
    } else if ((this.staminaRestT = Math.max(0, this.staminaRestT - dt)) <= 0) {
      const moving = this.moveIntent.lengthSq() > 0.08;
      this.stamina = Math.min(TUNING.staminaMax, this.stamina + TUNING.staminaRecovery * (moving ? 0.72 : 1) * dt);
    }
    if (this.exhausted && this.stamina >= TUNING.staminaExhaustThreshold) this.exhausted = false;
  }
  get dashing() { return this.dashT > 0; }
  get moving() { return this.dashT > 0 || this.sprinting; }   // dash or sprint: camera stays free
  get chargeLevel() { return this.charging ? clamp((this.chargeT - TUNING.chargeMin) / TUNING.chargeTime, 0, 1) : 0; }
  // break out of a juggle: costs energy, needs a moment after the launch
  tryRecover() {
    if (!this.launched || this.spiked || this.launchT < 0.35 || this.energy < TUNING.techCost) return false;
    this.energy -= TUNING.techCost;
    this.launched = false; this.stun = 0; this.juggle = 0; this.invulnT = 0.35;
    this.vel.copy(this.forward()).multiplyScalar(-8).setY(4);
    Effects.ring(this.center, 0xffffff, 1.8); Effects.flash(this.center, 0xffffff, 3, 0.12);
    Game.callout(this === Game.player ? 'Recover' : 'Rival recovered', 'parry');
    return true;
  }
  // is an attack from foe about to land on me? (a wind-up, a fresh swing, or a blast closing in)
  threatFrom(foe) {
    if (foe.windT > 0 && foe.windTarget === this) return true;
    if (foe.punchT > 0.06 && foe.pos.distanceTo(this.pos) < TUNING.meleeRange + 1.5) return true;
    for (const p of Combat.projectiles) if (p.owner === foe && p.mesh.position.distanceTo(this.center) < 9 && p.vel.dot(this.center.sub(p.mesh.position)) > 0) return true;
    return false;
  }
  // teleport dodge: vanish and reappear behind the rival; timed against an attack it's a perfect vanish
  tryVanish(foe, allowPerfect = true) {
    if (this.character && !this.character.mobility.vanish) return false;
    if (this.vanishCd > 0 || this.stun > 0 || this.launched || this.awakenChargeT > 0 || this.energy < (this.guardCounterWindow > 0 ? Math.max(6,TUNING.vanishCost-7) : TUNING.vanishCost)) return false;
    const guardEscape = this.guardCounterWindow > 0 && (!this.guardHitBy || this.guardHitBy === foe);
    if (!this.useStamina(guardEscape ? 9 : TUNING.staminaVanish)) return false;
    const perfect = allowPerfect && this.threatFrom(foe);
    if (guardEscape) this.guardCounterWindow = 0;
    this.energy -= guardEscape ? Math.max(6, TUNING.vanishCost - 7) : TUNING.vanishCost;
    if (perfect) this.energy = Math.min(100, this.energy + TUNING.vanishRefund);
    const from = this.center;
    const flat = foe.pos.clone().sub(this.pos).setY(0); const d = flat.length();
    if (d > TUNING.vanishRange || d < 0.01) {
      // rival too far: short blink the way you're facing
      this.pos.addScaledVector(this.forward(), 8);
    } else {
      flat.divideScalar(d);
      this.pos.set(foe.pos.x + flat.x * TUNING.vanishBehind, foe.pos.y, foe.pos.z + flat.z * TUNING.vanishBehind);
    }
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > ARENA_RADIUS - 1) { const k = (ARENA_RADIUS - 1) / r; this.pos.x *= k; this.pos.z *= k; }
    this.pos.y = clamp(this.pos.y, this.floor, CEILING);
    this.facing = yawFromDir(foe.pos.x - this.pos.x, foe.pos.z - this.pos.z);
    this.model.root.rotation.y = this.facing;
    this.vel.set(0, 0, 0); this.dashT = 0; this.chase = null; this.comboFollow = null; this.cancelCharge(); this.blocking = false;
    this.vanishT = TUNING.vanishHide; this.invulnT = Math.max(this.invulnT, TUNING.vanishInvuln);
    this.vanishCd = TUNING.vanishCooldown;
    this.acro = null; this.dashRecoverT = 0; this.skidT = 0;
    this.vanishRecoverT = 0.28; // visual arrival crouch before rising to guard
    Sound.play('vanish'); Effects.vanish(from, this.center, this.awakened ? this.pal.aura : this.pal.ki, perfect || guardEscape, this);
    if (perfect) {
      // they lose sight of you for a moment: their attack is cancelled and they're left open
      foe.windT = 0; foe.stun = Math.max(foe.stun, TUNING.vanishStun); foe.meleeCd = Math.max(foe.meleeCd, 0.3);
      Game.hitStop(0.12); CameraRig.shake(0.2);
      Game.callout(this === Game.player ? 'Perfect vanish' : 'Rival vanished', 'parry');
    } else if (guardEscape && this === Game.player) Game.callout('GUARD VANISH!', 'parry');
    else if (this !== Game.player) Game.callout('Rival vanished', 'parry');
    return true;
  }
  // V81: deliberate double-tap Up while hovering releases powered flight.
  // The real falling motion starts with gravity, not merely pressing Down.
  dropFromFlight(){
    if(!this.canFly||!this.flying||this.jumping||this.launched||this.spiked||
       this.stun>0||this.slamming)return false;
    this.dropping=true;this.jumping=false;this.jumpHold=0;
    this.sprinting=false;this.sprintHeld=false;this.vert=0;
    this.vel.y=Math.min(this.vel.y,-2.5);
    return true;
  }
  // tap Up on the ground: a quick hop; keep holding and it turns into flight
  tryJump() {
    if (this.v108JumpPrepT>0||
        this.awakenChargeT > 0 || this.stun > 0 || this.slamming || this.slamLagT > 0) return false;
    if (!this.canFly) {
      if (this.jumpsUsed >= 2) return false;
      this.jumpsUsed++;
      this.jumping = true; this.jumpHold = 0;
      this.vel.y = this.jumpsUsed === 1 ? TUNING.jumpVel : TUNING.jumpVel * 0.89;
      if (this.jumpsUsed === 2) this.startAcro('ninjaLeap',0.50);
    } else {
      if (this.flying || this.jumping) return false;
      this.jumping = true; this.jumpHold = 0; this.vel.y = TUNING.jumpVel;
    }
    const speed = Math.hypot(this.vel.x, this.vel.z);
    // Only decorate confident sprinting jumps, not normal precision jumps or combat hops.
    const foe = this === Game.player ? Game.enemy : Game.player;
    const safe = !foe || this.pos.distanceTo(foe.pos) > 5;
    if (this.canFly && safe && this.sprinting && speed > this.motionProfile.minFlipSpeed &&
        Math.random() < this.motionProfile.flipChance && this.t - this.lastAcroAt > 1.2) {
      this.startAcro('flip', 0.64);
    }
    // V108 opt-in ONLY: a deliberately short, grounded anticipation
    // before the existing untouched physical jump impulse. The input is
    // buffered exactly once, not ignored/re-fired each frame. Boost,
    // airborne double jumps, attacks and non-Kairo fighters stay instant.
    const subtlePrep=this.characterId==='kairo_venn'&&this.canFly&&
      this===Game.heroes?.kairo_venn&&
      this.pos.y<=this.floor+.025&&!this.sprinting&&!this.dashing&&
      !this.punchT&&!this.blastT&&!this.blockHeld&&!this.charging&&
      !(this.landingMotionT>0)&&
      (window.location?.search?.includes('jumpPrep=subtle')||
       window.location?.search?.includes('jumpPrep=readable')||
       window.location?.search?.includes('jumpPrep=push'))&&
      window.location?.search?.includes('animator=unified')&&
      window.SkyClashPoseAuthority?.ready;
    if(subtlePrep){
      // Keep the V108 95ms experiment; the new readable profile loads
      // more deeply and for longer when Kairo is starting from rest.
      const readable=window.location.search.includes('jumpPrep=readable');
      // V112: standing jump deserves a visible grounded LOAD, followed
      // by a real release. Run-up jumps remain fast and mostly unchanged.
      // This opt-in profile does not alter the jump impulse itself.
      const push=window.location.search.includes('jumpPrep=push');
      const duration=push?.215-.10*Math.min(1,speed/6.2):
        readable?.140-.040*Math.min(1,speed/6.2):.095;
      this.v108JumpPrepDuration=duration;this.v108JumpPrepT=duration;
      this.v108JumpPrepLaunchVy=this.vel.y;
      this.v108JumpPrepSpeed=speed;
      this.jumping=false;this.vel.y=0;
      return true;
    }
    Effects.dust(this.pos, 5);
    return true;
  }
  // Down + Melee in the air: drop onto the floor and send out a shockwave
  trySlam(foe) {
    if (this.slamming || this.stun > 0 || this.meleeCd > 0 || this.launched || this.pos.y < this.floor + TUNING.slamMinHeight) return false;
    if (this.charging) this.cancelCharge();
    this.slamming = true; this.slamWindT = TUNING.slamWind; this.slamTarget = foe;
    this.sprinting = false; this.dashT = 0; this.chase = null; this.jumping = false; this.blocking = false;
    this.vel.set(0, 3, 0);
    return true;
  }
  cancelCharge() { this.charging = false; this.chargeT = 0; this.chargeFull = false; this.chargeCracked = false; }
  get awakened() { return this.awakenT > 0; }
  get floor() { return groundAt(this.pos.x, this.pos.z); }
  get flying() { return this.pos.y > this.floor + 0.25; }
  get center() { return new V3(this.pos.x, this.pos.y + 1.2, this.pos.z); }
  forward(out = new V3()) { return out.set(Math.sin(this.facing), 0, Math.cos(this.facing)); }

  // a dash starts with a quick crouch-and-push (prep), then bursts; chase dashes skip the prep to keep combos flowing
  tryDash(dir, prep = TUNING.dashPrep) {
    if (this.awakenChargeT > 0 || this.dashCd > 0 || this.stun > 0 || this.energy < TUNING.dashCost || this.dashPrep > 0 || !this.useStamina(TUNING.staminaDash)) return false;
    this.energy -= TUNING.dashCost;
    this.dashDir.copy(dir).normalize();
    this.dashCd = TUNING.dashCooldown; this.skidT = 0;
    this._dashSide = Math.sin(this.facing) * this.dashDir.z - Math.cos(this.facing) * this.dashDir.x;
    this.facing = yawFromDir(this.dashDir.x, this.dashDir.z);
    if (prep > 0 && !this.flying) { this.dashPrep = prep; return true; }
    this.launchDash();
    return true;
  }
  launchDash() {
    this.dashPrep = 0; this.dashT = TUNING.dashTime; this.dashRecoverT = 0; this.sprinting = false;
    // Sideways dashes produce evasive footwork; aerial side dashes can roll.
    // Action remains entirely under the original dash movement code.
    const side = this._dashSide || 0;
    if (Math.abs(side) > 0.60 && !this.chase) {
      if (this.flying && this.pos.y > this.floor + 3.5) this.startAcro('airRoll', 0.46, Math.sign(side));
      else if (!this.flying) this.startAcro('evade', 0.38, Math.sign(side));
    }
    Sound.play('dash'); if (this === Game.player) CameraRig.shake(0.028); Spectacle.dashStart(this); CameraRig.shake(this === Game.player ? 0.085 : 0.045); this.dashWakeT = 0; if (!this.flying) Effects.dust(this.pos, 3);
  }
  // hold Run: start running straight away (no dash needed)
  startRun() {
    if (this.awakenChargeT > 0 || this.sprinting || this.exhausted || this.stamina < 8 || this.stun > 0 || this.energy < TUNING.sprintMinEnergy || this.blocking || this.charging || this.punchT > 0 || this.launched) return false;
    this.sprinting = true; if (this === Game.player) CameraRig.shake(0.012); return true;
  }
  gainAwaken(amount) {
    if (this.hp <= 0 || this.awakened || this.awakenChargeT > 0) return;
    this.awakenGauge = clamp(this.awakenGauge + amount, 0, TUNING.awakenGaugeMax);
  }
  tryAwaken() {
    if (this.awakened || this.awakenChargeT > 0 || this.awakenGauge < TUNING.awakenGaugeMax ||
        this.hp <= 0 || this.stun > 0 || this.launched || this.spiked || this.downT > 0) return false;
    // Separate combat-earned meter: does not drain ki needed for dashing and blasts.
    this.awakenChargeT = TUNING.awakenChargeTime;
    this.awakenChargeProgress = 0;
    this.awakenChargeFxT = 0; this.awakenRuptured = false;
    this.sprinting = false; this.dashT = 0; this.dashPrep = 0; this.chase = null;
    this.skidT = 0; this.vel.set(0, 0, 0); this.acro = null;
    this.meleeQ = 0; this.meleeBuf = 0; this.kickPend = null; this.punchT = 0; this.windT = 0;
    this.cancelCharge(); this.chargeHeld = false; this.blockHeld = false; this.blocking = false;
    this.invulnT = Math.max(this.invulnT, TUNING.awakenChargeTime + 0.12);
    if (this.vrmRig && this.vrmRig.anim) this.vrmRig.anim.stop();
    Sound.play('awaken'); Sound.play('powerRise'); Effects.awakenIgnition(this);
    if (this === Game.player) Game.callout('POWER RISING', 'launch');
    return true;
  }
  // AI attacks wind up first so you can see them coming and block or parry
  windUp(target, len) { if (!target || this.pos.distanceTo(target.pos) > TUNING.meleeRange + 0.25 || this.windT > 0 || this.meleeCd > 0 || this.stun > 0) return; this.windT = this.windLen = len; this.windTarget = target; }
  update(dt) {
    this.t += dt;
    if(!this.sprinting)this._v165BoostActive=false;
    // V108 owns only the 95ms input-to-takeoff interval. The existing
    // jump physics runs unmodified after expiry. Interruptions cancel the
    // buffered jump so a stun/block/dash never causes a delayed surprise hop.
    if(this.v108JumpPrepT>0){
      const cancel=this.hp<=0||this.stun>0||this.launched||this.spiked||
        this.downT>0||this.dashing||this.dashPrep>0||this.sprinting||
        this.blockHeld||this.blocking||this.charging||this.chargeHeld||
        this.punchT>0||this.blastT>0||this.slamming||
        this.pos.y>this.floor+.025;
      if(cancel){this.v108JumpPrepT=0;this.v108JumpPrepDuration=0;}
      else{
        this.v108JumpPrepT=Math.max(0,this.v108JumpPrepT-dt);
        if(this.v108JumpPrepT===0){
          this.jumping=true;this.jumpHold=0;
          this.vel.y=this.v108JumpPrepLaunchVy;
          Effects.dust(this.pos,5);
        }
      }
    }
    this.guardCounterWindow = Math.max(0, this.guardCounterWindow - dt);
    if (this.awakenChargeT > 0) {
      this.awakenChargeT = Math.max(0, this.awakenChargeT - dt);
      this.awakenChargeProgress = 1 - this.awakenChargeT / TUNING.awakenChargeTime;
      this.blockHeld = this.blocking = this.chargeHeld = false;
      this.sprinting = false; this.dashT = 0; this.chase = null; this.skidT = 0;
      this.meleeQ = 0; this.meleeBuf = 0; this.windT = 0;
      this.vel.multiplyScalar(1 - damp(24, dt));
      this.invulnT = Math.max(this.invulnT, 0.16);
      this.awakenChargeFxT -= dt;
      if (this.awakenChargeFxT <= 0) {
        this.awakenChargeFxT = Settings.get('quality') === 'low' ? 0.14 : 0.09;
        Effects.awakenCharge(this, this.awakenChargeProgress);
      }
      if (this.awakenChargeT <= 0) {
        this.awakenGauge = 0; this.awakenT = TUNING.awakenTime; this.auraFxT = 0;
        this.awakenChargeProgress = 0;
        Effects.awakenBurst(this); Sound.play('super');
        if (this === Game.player) Game.callout('AWAKENED!', 'launch');
      }
    }
    this.dashRecoverT = Math.max(0, this.dashRecoverT - dt); this.vanishRecoverT = Math.max(0, this.vanishRecoverT - dt);
    this.brokenT = Math.max(0, this.brokenT - dt); this.riposteT = Math.max(0, this.riposteT - dt);
    if (this.comboFollow && (this.t > this.comboFollow.until || this.stun > 0 || this.launched || this.hp <= 0 || !this.comboFollow.target || !(this.comboFollow.phase === 3 ? this.comboFollow.target.meteorWindow > 0 : this.comboFollow.target.launched && !this.comboFollow.target.spiked))) this.comboFollow = null;
    this.meteorWindow = Math.max(0, (this.meteorWindow || 0) - dt);
    this.superHitT = Math.max(0, (this.superHitT || 0) - dt); this.downT = Math.max(0, this.downT - dt); this.vanishCd = Math.max(0, this.vanishCd - dt); this.vanishT = Math.max(0, this.vanishT - dt); this.slamLagT = Math.max(0, this.slamLagT - dt); this.invulnT = Math.max(0, this.invulnT - dt);
    if (this.launched) { this.launchT += dt; if (this.stun <= 0 && !this.spiked) { this.launched = false; this.juggle = 0; } }
    if (this.kickPend) {
      const k = this.kickPend; k.t -= dt;
      if (!k.swingPlayed && k.t < 0.085 && this.stun <= 0) {
        k.swingPlayed = true; Spectacle.swing(this, k.stage); Sound.play('swing');
      }
      if (this.stun > 0 || this.hp <= 0) { this.kickPend = null; this.combo = 0; this.meleeQ = 0; this.meleeBuf = 0; }
      else if (k.t <= 0) { this.kickPend = null; Combat.strike(this, k.target, k.kick, k.stage, k.counter); }
    }
    if (this.windT > 0) {
      if (this.stun > 0) this.windT = 0;
      else { this.windT -= dt; if (this.windT <= 0) { this.windT = 0; Combat.melee(this, this.windTarget); } }
    }
    // charged blast: hold to charge, release to fire; a quick tap fires a normal blast
    if (this.awakenChargeT <= 0 && this.chargeHeld && !this.charging && this.blastCd <= 0 && this.stun <= 0 && !this.dashing && this.energy >= TUNING.blastCost && this.windT <= 0) {
      this.charging = true; this.chargeT = 0; this.chargeFull = false; this.chargeCracked = false; this.pressureT = 0;
    }
    if (this.charging) {
      if (this.stun > 0 || this.dashing) this.cancelCharge();
      else if (!this.chargeHeld) {
        const lvl = this.chargeLevel; this.cancelCharge();
        Combat.blast(this, this.chargeTarget, this.chargeAim, lvl);
      } else {
        // you can only charge as far as your energy allows
        const maxLvl = clamp((this.energy - TUNING.blastCost) / TUNING.chargeCost, 0, 1);
        this.chargeT = Math.min(this.chargeT + dt, TUNING.chargeMin + TUNING.chargeTime * maxLvl);
        const lvl = this.chargeLevel;
        if (lvl >= 1 && !this.chargeFull) { this.chargeFull = true; if(this.characterId!=='rin_sable') Effects.chargeFull(this); }
        // Hybrid environment choreography: compressed air first, fractured flagstones
        // only in the last moments of a powerful ground charge.
        if (this.characterId !== 'rin_sable' && !this.flying && this.chargeT > 0.15) {
          this.pressureT -= dt;
          if (this.pressureT <= 0) { this.pressureT = 0.16; Effects.chargePressure(this, lvl); }
        }
        if (this.characterId !== 'rin_sable' && !this.chargeCracked && !this.flying && lvl >= 0.90) {
          this.chargeCracked = true; Effects.chargeFracture(this, 0.95);
          if (this === Game.player) CameraRig.shake(0.075);
        }
        this.chargeFx -= dt;
        if (this.chargeT > 0.12 && this.chargeFx <= 0 && this.characterId !== 'rin_sable') { this.chargeFx = 0.05; Effects.chargeSpark(this, this.orb.position, lvl); }
      }
    }
    // guard: hold to block; a fresh block (not spammed) gets a short parry window
    const canBlock = this.awakenChargeT <= 0 && this.blockHeld && !this.charging && this.stun <= 0 && !this.dashing && this.punchT <= 0 && this.blastT <= 0 && this.windT <= 0 && this.guard > 0;
    if (canBlock && !this.blocking) { this.blockT = 0; this.parryOk = this.t - this.lastBlockEnd > 0.35 ? TUNING.parryWindow : 0; }
    if (!canBlock && this.blocking) this.lastBlockEnd = this.t;
    this.blocking = canBlock;
    if (this.blocking) this.blockT += dt;
    else { this.guardDelay -= dt; if (this.guardDelay <= 0) this.guard = Math.min(TUNING.guardMax, this.guard + TUNING.guardRegen * dt); }
    this.dashCd = Math.max(0, this.dashCd - dt); this.meleeCd = Math.max(0, this.meleeCd - dt);
    this.blastCd = Math.max(0, this.blastCd - dt); this.stun = Math.max(0, this.stun - dt);
    this.punchT = Math.max(0, this.punchT - dt); if (this.punchT > 0) this.attackElapsed += dt; this.blastT = Math.max(0, this.blastT - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.awakenT > 0) this.awakenT = Math.max(0, this.awakenT - dt);
    this.energy = Math.min(100, this.energy + TUNING.energyRegen * dt);
    this.attackDrive += (0 - this.attackDrive) * damp(7, dt);

    const speedMul = this.awakened ? TUNING.awakenSpeed : 1;
    // sprint / fast flight: keep holding Dash after the dash to keep going fast
    if (this.sprinting && (!this.sprintHeld || this.stun > 0 || this.blockHeld || this.charging || this.punchT > 0 || this.blastT > 0 || this.windT > 0 || this.launched || this.energy <= 0 || this.exhausted || this.stamina < 0.1)) {
      this.sprinting = false; this.vel.multiplyScalar(0.88);
      if (!this.flying && this.stun <= 0 && Math.hypot(this.vel.x, this.vel.z) > 9 && this.punchT <= 0) {
        // V81: a readable ~0.42s physical skid for ending super-fast
        // Boost; unlike the old Run to Stop clip this NEVER pauses midair.
        this.skidT = Math.max(TUNING.skidTime,0.42);
        // V80: a burst of grounded grit/smoke when ending *Boost*, not
        // ordinary joystick running. Native skid physics remain in charge.
        Effects.dust(this.pos, 10);
        Effects.sprintTrail(this);
      }
    }
    // Restore held Boost once an attack's recovery ends (important for fast aerial combos).
    if (!this.sprinting && this.sprintHeld && this.dashT <= 0 && this.dashPrep <= 0 &&
        this.stun <= 0 && this.punchT <= 0 && this.meleeCd <= 0.07 &&
        this.blastT <= 0 && !this.charging && !this.blockHeld && !this.launched &&
        this.energy >= TUNING.sprintMinEnergy && !this.exhausted && this.stamina >= 8 && (this.moveIntent.lengthSq() > 0.04 || this.vert !== 0)) {
      this.sprinting = true;
    }
    const drain = this.sprinting ? (this.flying ? TUNING.sprintDrainAir : TUNING.sprintDrainGround) : 0;
    if (drain) this.energy = Math.max(0, this.energy - (drain + TUNING.energyRegen) * dt);   // no ki regen while sprinting
    this.updateStamina(dt);
    if (this.stun > 0 || this.launched || this.spiked || this.punchT <= 0) this.attackTarget = null;
    if (this.slamming && this.stun > 0) this.slamming = false;
    if (this.slamming) {
      // short hang in the air, then straight down, drifting toward the rival if they're close
      if (this.slamWindT > 0) { this.slamWindT -= dt; this.vel.multiplyScalar(1 - damp(10, dt)); }
      else {
        const t = this.slamTarget, h = Math.max(0.5, this.pos.y - this.floor);
        let hx = 0, hz = 0;
        if (t) { const dx = t.pos.x - this.pos.x, dz = t.pos.z - this.pos.z, d = Math.hypot(dx, dz);
          if (d < 9 && d > 1.4) { const sp = Math.min(25, (d - 1.2) / (h / TUNING.slamSpeed)); hx = dx / d * sp; hz = dz / d * sp; this.facing = yawFromDir(dx, dz); } }
        this.vel.set(hx, -TUNING.slamSpeed, hz);
        if (Math.random() < 0.6) Effects.sprintTrail(this);
      }
    } else if (this.slamLagT > 0) {
      this.vel.multiplyScalar(1 - damp(12, dt));
    } else if (this.dashPrep > 0) {
      // coil: plant the feet and load up, then burst
      this.vel.multiplyScalar(1 - damp(14, dt));
      this.dashPrep -= dt;
      if (this.stun > 0) this.dashPrep = 0; else if (this.dashPrep <= 0) this.launchDash();
    } else if (this.skidT > 0 && !this.sprinting) {
      // braking: feet dig in and slide to a stop
      this.skidT -= dt;
      this.vel.x *= 1 - damp(7, dt); this.vel.z *= 1 - damp(7, dt);
      if (Math.random() < 0.5) Effects.dust(this.pos, 1);
    } else if (this.dashT > 0) {
      this.dashWakeT -= dt;
      if (this.dashWakeT <= 0) { this.dashWakeT = 0.055; Spectacle.dashWake(this); }
      this.dashT = Math.max(0, this.dashT - dt);
      // fast burst that eases off, so the dash flows back into normal movement
      const prog = this.dashT / TUNING.dashTime;
      // chase dash: home in on a launched rival and stop just in front of them
      if (this.chase) {
        const to = this.chase.center.sub(this.center); const d = to.length();
        if (d < 1.9 || !this.chase.launched) { this.dashT = 0; this.vel.multiplyScalar(0.08); this.chase = null; }
        else { this.dashDir.copy(to.divideScalar(d)); this.facing = yawFromDir(this.dashDir.x, this.dashDir.z); }
      }
      if (this.dashT > 0) this.vel.copy(this.dashDir).multiplyScalar(TUNING.dashSpeed * speedMul * (this.chase ? 1.15 : 0.6 + 0.8 * prog));
      if (this.dashT <= 0) {
        if (this.sprintHeld && !this.chase && !this.dashWasChase && this.stun <= 0 && this.energy >= TUNING.sprintMinEnergy) this.sprinting = true;
        else if (!this.chase) { this.vel.multiplyScalar(0.58); this.skidT = 0; this.dashRecoverT = 0.28; }
        this.chase = null;
      }
    } else if (this.sprinting) {
      // steer with the stick; with no input keep going the way you face. Up/Down climbs and dives
      const dir = this.moveIntent.lengthSq() > 0.02 ? this.moveIntent.clone().setY(0).normalize() : this.forward();
      // V165: stronger travel speed is an opt-in physical sprint/boost
      // response, not a second animation layer or global walk-speed change.
      const burstV165=AnimeFeelV165.enabled&&this.canFly&&this.flying;
      const sp = (this.canFly && (this.flying || this.vert) ? TUNING.flySprintSpeed : TUNING.sprintSpeed) *
        speedMul * (burstV165?AnimeFeelV165.boostSpeedScale:1);
      if(AnimeFeelV165.enabled&&!this._v165BoostActive){
        this._v165BoostActive=true;
        Spectacle.boostIgnition(this);
      }
      const target = dir.multiplyScalar(sp); target.y = this.vert * sp * 0.75;
      if (!this.canFly) { this.vel.y -= TUNING.gravity * dt; target.y = this.vel.y; }
      this.vel.lerp(target,damp(TUNING.sprintTurn*
        (burstV165?AnimeFeelV165.boostTurnScale:1),dt));
      const hv = Math.hypot(this.vel.x, this.vel.z);
      if (hv > 2) this.facing = lerpAngle(this.facing, yawFromDir(this.vel.x, this.vel.z), damp(8, dt));
      this.sprintFx -= dt;
      if (this.sprintFx <= 0) {
        this.sprintFx = this.flying ? (burstV165?0.055:0.07) : 0.075;
        this.flying ? Spectacle.flightWake(this) : Effects.dust(this.pos, 2);
      }
      if (this === Game.player && this.energy > 2 && Math.hypot(this.vel.x, this.vel.z) > 18) {
        this.sprintShakeT -= dt;
        if (this.sprintShakeT <= 0) { this.sprintShakeT = 0.38; CameraRig.shake(0.035); }
      }
    } else if (this.punchT > 0 && this.stun <= 0 && !this.launched && !this.spiked) {
      // V49: moving attacks *track during anticipation*, not just when the key is pressed.
      // Steering is bounded by startup distance, a finite footwork budget and the contact
      // frame. At impact the hands/feet strike where the opponent really is, not where
      // they were 150ms ago. After contact the character plants and recovers normally.
      const p = clamp(this.attackElapsed / Math.max(0.001, this.attackTotal), 0, 1);
      const contact = this.attackKind === 'fallingFist' ? 0.65 : this.attackKind === 'kick' || this.attackKind === 'airStrike' || this.attackKind === 'skyKick' ? 0.47 : this.attackKind === 'skyUppercut' ? 0.49 : this.attackKind === 'hook' ? 0.48 : 0.42;
      const impulse = Math.pow(Math.sin(Math.PI * Math.min(1, p / Math.max(0.1, contact))), 2) * (1 - smooth01(p / (contact + 0.15)) * 0.35);
      const travel = this.attackTravel && this.attackTravel.lengthSq() > 0.01 ? this.attackTravel.clone().setY(0).normalize() : this.forward();
      const hsp = (this.attackAir ? 8.2 : 5.8) * (this.attackMoving ? 1 : 0.48);
      let targetH = hsp * impulse;
      const foe = this.attackTarget;
      const active = !!foe && foe.hp > 0 && (!foe.spiked || this.attackKind === 'fallingFist') && this.kickPend &&
        p < contact + 0.035 && this.stun <= 0;
      let pursuing = false;
      if (active) {
        const dx = foe.pos.x - this.pos.x, dz = foe.pos.z - this.pos.z;
        const horizontal = Math.hypot(dx, dz);
        const height = foe.pos.y - this.pos.y;
        const moved = Math.hypot(this.pos.x - this.attackOrigin.x, this.pos.z - this.attackOrigin.z);
        const left = this.attackTravelBudget - moved;
        const follow = this.attackKind === 'skyUppercut' || this.attackKind === 'skyKick' || this.attackKind === 'fallingFist';
        const limit = this.attackKind === 'fallingFist' ? TUNING.groundFollowRange : follow ? TUNING.airFollowRange : TUNING.meleePursuitRange + (this.attackAir ? 0.95 : 0);
        if (horizontal > 0.3 && horizontal < limit && Math.abs(height) < (this.attackKind === 'fallingFist' ? TUNING.groundFollowHeight : follow ? TUNING.airFollowHeight : TUNING.meleePursuitHeight + (this.attackAir ? 1.4 : 0)) && left > 0.06) {
          pursuing = true;
          // A tiny lead follows strafing enemies, not a teleport toward future position.
          const lead = Math.min(0.11, Math.max(0.02, this.kickPend.t * 0.55));
          const aimed = new V3(dx + foe.vel.x * lead, 0, dz + foe.vel.z * lead).normalize();
          const wish = this.moveIntent.clone().setY(0);
          const wishLen = wish.length();
          if (wishLen > 0.1) {
            wish.normalize();
            // Still allow backpedalling attacks: don't reverse strong intentional retreat.
            const dot = wish.dot(aimed);
            const bias = dot < -0.3 ? 0.42 : dot < 0.28 ? 0.78 : 0.94;
            aimed.multiplyScalar(bias).addScaledVector(wish, 1 - bias).normalize();
          }
          travel.lerp(aimed, damp(22, dt)).normalize();
          this.attackTravel.copy(travel);
          // Close the gap before impact; match a retreating opponent within limits.
          const timeLeft = Math.max(0.11, this.kickPend.t);
          // Only the loaded, opt-in native set uses the measured shorter
          // striking reach. The original jab and every baseline/Rin path
          // retain their published pursuit distance. This remains bounded
          // velocity-driven pursuit; normal collision separation still wins.
          const nativeApproach=!!(typeof window!=='undefined'&&
            window.SkyClashPublishedActions?.nativeCombatSet&&
            this.characterId==='kairo_venn'&&
            (!(this.attackKind==='punch'&&this.punchSide===1)||
             window.SkyClashPublishedActions.nativeCombatSet.reauthoredJab));
          const goal = nativeApproach ?
            (this.attackKind==='kick'||this.attackKind==='skyKick'?.82:.72):
            this.attackKind === 'kick' || this.attackKind === 'skyKick' ? 1.7 : 1.45;
          const closing = Math.max(0, horizontal - goal) / timeLeft * 0.86;
          const speedCap = follow ? TUNING.airFollowSpeed : this.attackAir ? TUNING.meleePursuitSpeedAir : TUNING.meleePursuitSpeedGround;
          targetH = Math.min(speedCap, Math.max(targetH * 0.45, closing));
          targetH = Math.min(targetH, Math.max(0, left / Math.max(dt, 1 / 60)));
          const toFace = yawFromDir(dx, dz);
          // Turn the shoulders toward the opponent even when our feet strafe sideways.
          this.facing = lerpAngle(this.facing, toFace, damp(21, dt));
          if (this.attackAir) {
            // Fly up/down toward the opponent *during the approach*; hand/foot contact
            // remains a small 3D hit volume and won't connect from several metres away.
            let strikeHeight=height;
            if(nativeApproach&&this.attackKind==='fallingFist'){
              const hand=this.vrmRig?.vrm?.humanoid?.getNormalizedBoneNode('rightHand');
              const chest=foe.vrmRig?.vrm?.humanoid?.getNormalizedBoneNode('upperChest');
              if(hand&&chest){
                this.vrmRig.vrm.scene.updateMatrixWorld(true);
                foe.vrmRig.vrm.scene.updateMatrixWorld(true);
                const handY=hand.getWorldPosition(new V3()).y-this.pos.y;
                const chestY=chest.getWorldPosition(new V3()).y-foe.pos.y;
                // Follow the visible torso during the dive, including a
                // fallen target. Limit the extra aim to seventy centimetres
                // and retain the existing speed, floor and travel limits.
                strikeHeight+=clamp(chestY-handY,-.70,.70);
              }
            }
            const desiredY = clamp((strikeHeight + foe.vel.y * lead) / timeLeft * (follow ? 0.92 : 0.60), this.attackKind === 'fallingFist' ? -35 : follow ? -17 : -14, follow ? 22 : 16);
            this.vel.y += (desiredY - this.vel.y) * damp(14, dt);
          }
        }
      }
      // Slow and plant at contact. Never carry full Boost velocity through punches.
      const response = damp(p >= contact ? 28 : pursuing ? 40 : 20, dt);
      this.vel.x += (travel.x * targetH - this.vel.x) * response;
      this.vel.z += (travel.z * targetH - this.vel.z) * response;
      if (this.attackAir && !pursuing) {
        const yInput = this.vert * 2.2;
        this.vel.y += (yInput - this.vel.y) * damp(p >= contact ? 22 : 12, dt);
      } else if (!this.attackAir) this.vel.y = 0;
      if (!pursuing && impulse > 0.12) this.facing = lerpAngle(this.facing, yawFromDir(travel.x, travel.z), damp(10, dt));
    } else if (this.awakenChargeT > 0) {
      this.vel.multiplyScalar(1 - damp(28, dt));
    } else if (this.stun > 0) {
      if (this.spiked) { /* falling fast: keep the smash velocity */ }
      else if (this.launched) { this.vel.x *= 1 - damp(3, dt); this.vel.z *= 1 - damp(3, dt); this.vel.y = this.vel.y * (1 - damp(1.5, dt)) - 16 * dt; }
      else this.vel.multiplyScalar(1 - damp(4, dt));
    } else {
      // V88: explicitly separate ordinary Kairo movement from Boost.
      // Opt-in walk preview only. Sprint physics runs in its own earlier
      // branch; keep every other fighter and the normal game unchanged.
      const walkLab=window.SkyClashMovementLab?.enabled&&
       this===Game.player&&this.characterId==='kairo_venn'&&!this.sprinting;
      const normalSpeed=walkLab?4.8:TUNING.walkSpeed;
      // Standard Run has its own modest pace, never Boost's sprint speed.
      // No changes to the V94 approved first-step and ordinary WASD walk.
      const joystickRunPace=walkLab&&window.SkyClashMovementLab?.joystickRun&&
        this.v95JoystickRun&&!this.sprinting&&!this.flying?6.2:normalSpeed;
      const stepLab=walkLab&&window.SkyClashMovementLab?.version===89&&
       window.SkyClashWalkStep&&!this.flying;
      // One state machine owns movement takeoff: weight shift first,
      // then the first planted stride before reaching walking speed.
      const step=stepLab?window.SkyClashWalkStep.plan(this,dt):null;
      const target = this.moveIntent.clone().multiplyScalar((this.flying ? TUNING.moveSpeed : joystickRunPace) * speedMul * (this.blocking ? TUNING.blockMove : this.charging ? TUNING.chargeMove : 1));
      if(step){target.x*=step.scale;target.z*=step.scale;}
      target.y = this.vert * TUNING.flySpeed * speedMul;
      // Holding the Up/jump button normally commands flight; while the
      // V108 grounded jump is buffered, suppress that upward flight target
      // or Kairo would leave the floor before his feet finish compressing.
      if(this.v108JumpPrepT>0)target.y=0;
      if (!this.canFly) { this.vel.y -= TUNING.gravity * dt; target.y = this.vel.y; }
      if (this.jumping && this.canFly) {
        // jump arc: gravity pulls you down unless you keep holding Up, which turns it into flight
        if (this.vert > 0) this.jumpHold += dt;
        if (this.jumpHold > TUNING.jumpToFly) { this.jumping = false; }
        else {
          const vy = this.vel.y - TUNING.gravity * (this.vert < 0 ? 1.8 : 1) * dt;
          target.y = vy; this.vel.y = vy;
        }
      }
      // reversing hard at speed: plant and skid before heading the other way
      const hv0 = Math.hypot(this.vel.x, this.vel.z);
      if (!this.flying && hv0 > 7.5 && this.moveIntent.lengthSq() > 0.3 && (this.vel.x * this.moveIntent.x + this.vel.z * this.moveIntent.z) / hv0 < -0.45) this.skidT = TUNING.skidTime * 0.8;
      // build up speed with some weight, stop a little quicker; floatier in the air
      const speedingUp = target.lengthSq() > this.vel.lengthSq() * 0.9;
      const rate = this.flying ? (speedingUp ? 6.1 : 6.6) : (speedingUp ? TUNING.accel : TUNING.decel);
      if(this.dropping&&this.canFly){
       // Flight Down is controlled travel. Only the explicit flight-cancel
       // state uses true gravity and the falling idle animation.
       target.y=this.vel.y-TUNING.gravity*dt;
      }
      // Plant quickly on release so the old moving walk legs cannot
      // coast visibly under an already stationary input.
      const groundedStop=stepLab&&step?.mode==='settle';
      this.vel.lerp(target, damp(groundedStop?16:rate, dt));
      if(this.dropping&&this.canFly)
       this.vel.y=Math.max(-TUNING.flySpeed,
        Math.min(-2.5,this.vel.y-TUNING.gravity*dt));
    }
    // V105: retain the actual downward collision velocity BEFORE floor
    // clamping / bounce handling zeroes it. Animation reads this contact
    // event, never guesses impact severity from the later vel.y === 0.
    const v105PreContactVy=this.vel.y;
    this.pos.addScaledVector(this.vel, dt);
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > ARENA_RADIUS - 1) { const k = (ARENA_RADIUS - 1) / r; this.pos.x *= k; this.pos.z *= k; }
    const floor = this.floor;
    this.pos.y = clamp(this.pos.y, floor, CEILING);
    if (this.pos.y === floor && this.vel.y < 0 && this.slamming) {
      this.slamming = false; this.slamLagT = TUNING.slamLag; this.meleeCd = Math.max(this.meleeCd, 0.35);
      this.vel.set(0, 0, 0); this.attackKind = 'slam'; this.punchT = 0.2;
      Effects.groundSlam(this.pos); CameraRig.shake(this === Game.player ? 0.5 : 0.35);
      if (this.slamTarget) Combat.slam(this, this.slamTarget);
    }
    if (this.pos.y === floor && this.vel.y <= 0) {
      this.jumping = false;this.dropping=false;
      if (!this.canFly) this.jumpsUsed=0;
    }
    if (this.pos.y === floor && this.vel.y < 0) {
      // a smashed fighter hits the floor hard and stays down for a moment
      if (this.spiked) {
        this.spiked = false; this.launched = false; this.juggle = 0;
        this.downT = TUNING.downTime; this.stun = TUNING.downTime + 0.15;
        if (this.meteorSource) { Effects.meteorCrater(this.pos, this.meteorSource.pal.ki, false); Combat.onMeteorLanding(this); }
        else Effects.groundSlam(this.pos);
        CameraRig.shake(this.meteorSource ? 0.48 : 0.35); Game.hitStop(0.07);
        this.vel.set(this.vel.x * 0.2, 0, this.vel.z * 0.2);
      } else if (this.launched) { this.launched = false; this.juggle = 0; this.downT = 0.45; this.stun = Math.max(this.stun, 0.5); Effects.dust(this.pos, 6); this.vel.y = 0; }
      else this.vel.y = 0;
    }
    // landing dust / ground-dash dust
    const flying = this.flying;
    if (this.wasFlying && !flying) {
      if(window.location?.search?.includes('landingLab=contact')&&
         this.characterId==='kairo_venn'){
        this.v105ContactSerial=(this.v105ContactSerial||0)+1;
        this.v105ImpactSpeed=Math.max(0,-v105PreContactVy);
      }
      Effects.dust(this.pos, 6);
      const speed = Math.hypot(this.vel.x, this.vel.z);
      if (!this.launched && !this.spiked && !this.slamming && this.stun <= 0 && this.hp > 0) {
        this.landingVariant = (this.landingVariant + 1) % 3;
        if(this.characterId==='kairo_venn'){
          // Recorded Mixamo landing replaces the old 0.5-radian procedural
          // forward bow. Physics controls the ground contact throughout.
          this.acro=null;
          // V109 moving flow: holding a 0.48s standing-idle contact pose
          // while the horizontal root travels metres is foot skating.
          // Keep STATIC contact exactly V106. For normal moving contact,
          // briefly brake on the physical touchdown and resume the V95
          // stride after ~0.21s. Boost, attacks, other fighters untouched.
          const hspeed=Math.hypot(this.vel.x,this.vel.z);
          const flow=window.location?.search?.includes('landingMove=flow')&&
            window.location?.search?.includes('landingFeet=plant')&&
            window.location?.search?.includes('landingLab=contact')&&
            this===Game.heroes?.kairo_venn&&
            hspeed>1.3&&!this.sprinting&&!this.dashing;
          this.v109LandingSpeed=flow?hspeed:0;
          this.v109LandingDuration=flow?.205:.48;
          this.landingMotionT=this.v109LandingDuration;
          if(flow){this.vel.x*=.52;this.vel.z*=.52;}
        }else this.startAcro('landing', speed > 9 ? 0.42 : 0.30, this.landingVariant === 0 ? -1 : 1);
      }
    }
    this.wasFlying = flying;
    this.dustT -= dt;
    if (this.dashing && this.pos.y < floor + 1.2 && this.dustT <= 0) { Effects.dust(this.pos, 2); this.dustT = 0.05; }
    this.animate(dt);
    this.landingMotionT=Math.max(0,(this.landingMotionT||0)-dt);
    if (this.awakened) {
      this.auraFxT -= dt;
      if (this.auraFxT <= 0) {
        this.auraFxT = Settings.get('quality') === 'low' ? 0.14 : 0.078;
        Effects.bodyAura(this); // tracked to moving arms/head/legs, not a full-body bubble
      }
    }
  }

  /* ---- animation ---- */
  animate(dt) {
    this.animateRig(dt);
    if (this.vrmRig) {
      try { this.vrmRig.update(dt); }
      catch (err) {
        // Fail open into the native procedural fighter, not a frozen match.
        // A corrupt VRM expression/spring/retarget layer must not kill RAF.
        console.error('Fighter VRM rendering fell back:', this.name, err);
        const old=this.vrmRig;
        old.vrm.scene.removeFromParent();
        this.model.parts.forEach(part=>part.visible=true);
        this.vrmRig=null;
      }
    }
  }
  animateRig(dt) {
    const m = this.model, root = m.root, body = m.body;
    const flying = this.flying;
    root.position.set(this.pos.x, this.pos.y, this.pos.z);
    root.visible = this.vanishT <= 0;
    root.rotation.y = lerpAngle(root.rotation.y, this.facing, damp(this.dashing ? 22 : 13, dt));

    // velocity in the fighter's own frame: lz = forward, lx = toward its left (+X local)
    const yaw = root.rotation.y;
    let lz = this.vel.x * Math.sin(yaw) + this.vel.z * Math.cos(yaw);
    let lx = this.vel.x * Math.cos(yaw) - this.vel.z * Math.sin(yaw);
    let hspeed = Math.hypot(this.vel.x, this.vel.z);
    // Workshop locomotion preview drives ONLY the rendered guide rig. Physics,
    // speed and combat are not modified; both fighters keep independent tuning.
    const wsVelocity = typeof CharacterWorkshop !== "undefined" && CharacterWorkshop.previewVelocity(this, dt);
    if (wsVelocity) { lz=wsVelocity.lz;lx=wsVelocity.lx;hspeed=wsVelocity.speed; }

    // lean is relative to the body, so it always tips toward the direction of travel
    let pitchT, rollT;
    const fastFly = this.sprinting && flying;
    this.flightSpeedBlend += (clamp(hspeed / 26, 0, 1) - this.flightSpeedBlend) * damp(4.3, dt);
    this.flightBlend += ((flying ? 1 : 0) - this.flightBlend) * damp(flying ? 4.4 : 6.6, dt);
    this.airBank += (clamp(-lx / 33, -0.28, 0.28) - this.airBank) * damp(5.2, dt);
    // forward acceleration (smoothed): lean in when speeding up, sit back when braking — gives the body weight
    const aF = dt > 0 ? (lz - this.prevLz) / dt : 0; this.prevLz = lz;
    this.accF += (clamp(aF, -60, 60) - this.accF) * damp(8, dt);
    // turn rate of the travel direction: bank into curves when running fast
    const hd = Math.atan2(this.vel.x, this.vel.z);
    let dh = hspeed > 3 && this.prevHd != null ? hd - this.prevHd : 0; this.prevHd = hd;
    dh = ((dh + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    this.turnR = (this.turnR || 0) + (clamp(dt > 0 ? dh / dt : 0, -6, 6) - (this.turnR || 0)) * damp(8, dt);
    const bank = clamp(-this.turnR * hspeed / 70, -0.26, 0.26);
    if (this.dashPrep > 0) { pitchT = 0.32; rollT = 0; }
    else if (this.skidT > 0 && !flying) { pitchT = 0.12; rollT = 0; }
    else if (this.slamming) { pitchT = this.slamWindT > 0 ? -0.2 : 0.35; rollT = 0; }
    else
    if (this.dashing && !flying) { pitchT = 0.09; rollT = bank * 0.6; }
    else if (this.dashing || fastFly) {
      // Controlled powered flight: upper body still faces travel direction instead
      // of tipping nearly horizontal like a falling meteor.
      // V150 is a Kairo-only opt-in Boost animation; the physics/camera
      // and other characters continue to use the existing sprint owner.
      const boost150 = this.characterId === 'kairo_venn' &&
        !!window.SkyClashV150Flight;
      pitchT = boost150 ?
        0.29 + 0.08 * this.flightSpeedBlend - clamp(this.vel.y / 180, -0.04, 0.04) :
        0.15 + 0.13 * this.flightSpeedBlend - clamp(this.vel.y / 150, -0.10, 0.10);
      rollT = this.airBank;
    }
    else if (this.sprinting) {
      // V80 grounded super-speed Boost: keep Kairo's chest upright enough
      // to read as fighting-game sprinting rather than diving at the floor.
      pitchT = this.characterId === 'rin_sable' ? 0.08 : 0.025;
      rollT = bank * 0.60;
    }
    else if (this.dashRecoverT > 0) { pitchT = 0.04 + 0.05 * smooth01(this.dashRecoverT / 0.28); rollT = bank * 0.35; }
    else if (this.downT > 0) { pitchT = -1.45; rollT = 0.1; }
    else if (this.spiked) { pitchT = -1.2; rollT = 0; }
    else if (this.launched) { pitchT = this.superHitT > 0 ? -0.34 : -0.75 + Math.sin(this.launchT * 7) * 0.15; rollT = Math.sin(this.launchT * 5) * 0.2; }
    else if (this.stun > 0) { pitchT = -0.45; rollT = 0; }
    else if (flying) {
      pitchT = 0.06 + 0.34 * smooth01(Math.max(0, lz) / 15) - 0.12 * smooth01(Math.max(0, -lz) / 10) - clamp(this.vel.y / 115, -0.12, 0.12);
      rollT = this.airBank * 0.86;
    }
    else { const rnL = smooth01((hspeed - 1.5) / 9); pitchT = (0.055 + clamp(lz / 180, -0.035, 0.035) + clamp(this.accF / 350, -0.025, 0.04)) * rnL; rollT = clamp(-lx / 95, -0.11, 0.11) * rnL; }
    if (this.sprinting && !flying && this.characterId !== 'rin_sable') pitchT += clamp(this.accF / 450, -0.025, 0.04);
    if (this.characterId === 'rin_sable' && !flying && this.downT <= 0 && this.stun <= 0) { pitchT = clamp(pitchT, -0.015, 0.065); rollT *= 0.55; }
    if (this.punchT > 0 && this.attackKind === 'kick') pitchT = 0.06;
    if (this.punchT > 0 && this.attackAir) pitchT = 0.14;
    if (this.slamLagT > 0) pitchT = 0.35;
    this.lean.pitch += (pitchT - this.lean.pitch) * damp(this.downT > 0 || this.launched ? 12 : this.flightBlend > 0.05 ? 6.5 : this.dashRecoverT > 0 ? 9 : 8, dt);
    this.lean.roll += (rollT - this.lean.roll) * damp(6, dt);
    body.rotation.x = this.lean.pitch; body.rotation.z = this.lean.roll;
    // Independent visual motion track; every pose has easing and can be cancelled by combat.
    if (this.acro) {
      const A = this.acro;
      if (!Settings.get('acrobatics') || this.hp <= 0 || this.stun > 0 || this.blockHeld ||
          this.charging || this.punchT > 0 || this.slamming || this.spiked || this.launched) {
        this.acro = null;
      } else {
        A.t += dt;
        if (A.t >= A.duration) this.acro = null;
      }
    }
    const ac = this.acro;
    const acP = ac ? clamp(ac.t / ac.duration, 0, 1) : 0;
    const acEnv = ac ? Math.sin(Math.PI * acP) : 0;
    if (ac) {
      if (ac.type === 'flip' && this.flying) {
        // A complete flip; orientation returns to neutral without a hard snap.
        body.rotation.x += TAU * smooth01(acP);
       } else if (ac.type === 'ninjaLeap') {
        // V55: This is a *pose* handled below, not an orientation transform.
        // The old code reassigned `const A = this.acro`, throwing on every second jump
        // and terminating requestAnimationFrame. Do not modify that immutable action.
        // Keep the root upright: the knees tuck in the pose builder below.
      } else if (ac.type === 'airRoll' && this.flying) {
        body.rotation.z += ac.direction * TAU * smooth01(acP);
      } else if (ac.type === 'evade') {
        body.rotation.z += ac.direction * this.motionProfile.dashLean * acEnv;
        // Hip swivel is applied after the locomotion yaw below.
      } else if (ac.type === 'landing') {
        body.rotation.x += 0.25 * acEnv;
        body.rotation.z += ac.direction * 0.09 * acEnv;
      }
    }
    // run cycle locked to distance: longer strides at speed, quick steps when slow, so feet don't skate
    const stepLen = (hspeed < 5 ? 0.55 + 0.19 * hspeed : Math.min(3.0, 1.5 + 0.075 * (hspeed - 5))) * (typeof CharacterWorkshop !== "undefined" ? CharacterWorkshop.motion(this, "stride") : 1);
    this.stepLen = stepLen;
    this.runPh += hspeed / Math.max(0.15,stepLen) * Math.PI * dt * (typeof CharacterWorkshop !== "undefined" ? CharacterWorkshop.motion(this, "cadence") : 1);
    // hips turn toward the way you're actually moving (strafing / turning), chest stays on target
    let yawT = 0, dirT = 1;
    if (!flying && hspeed > 1.5 && !this.sprinting && !this.dashing) {
      let a = Math.atan2(lx, lz);
      if (Math.abs(a) > 1.95) { dirT = -1; a = a > 0 ? a - Math.PI : a + Math.PI; }   // backpedal
      yawT = clamp(a, -1.0, 1.0) * 0.85;
    }
    this.hipYaw += (yawT - this.hipYaw) * damp(10, dt);
    this.strideDir += (dirT - this.strideDir) * damp(10, dt);
    body.rotation.y = this.hipYaw;
    // Keep a real stepping cycle for moving punches; kicks/launchers still plant their support leg.
    const mobilePunch = this.punchT > 0 && this.attackMoving && !flying && ['punch','hook','ninjaPalm','ninjaElbow'].includes(this.attackKind);
    const runTarget = flying || this.dashing || this.dashPrep > 0 || this.skidT > 0 || (this.punchT > 0 && !mobilePunch) ? 0 : smooth01((hspeed - 0.12) / 1.0);
    this.runW += (runTarget - this.runW) * damp(10, dt);
    this.flyW += ((flying ? 1 : 0) - this.flyW) * damp(flying ? 5.8 : 8, dt);
    const rw = this.runW, fw = this.flyW;
    const bounce = Math.abs(Math.sin(this.t * 3.6)) * 0.013;               // light boxer's bounce in stance
    // smooth body rise and fall per step (no sharp bounce); a walk barely bobs, a run bobs a bit more
    const runness = smooth01((hspeed - 5) / 9);
    const stepBob = (0.5 + 0.5 * Math.cos(2 * this.runPh)) * (0.009 + 0.024 * runness) - 0.02 * runness;
    const hover = Math.sin(this.t * 2.4) * (0.035 + 0.035 * (1 - this.flightSpeedBlend));
    // Raised baseline: the VRM's sole (below the ankle joint) must remain visible above terrain.
    const groundY = 1.075 - (this.characterId === 'rin_sable' ? 0.035 : 0.065) * (1 - rw) - 0.025 * rw * runness + bounce * (1 - rw) + stepBob * rw;
    this.blockW += ((this.blocking ? 1 : 0) - this.blockW) * damp(22, dt);
    body.position.y = groundY * (1 - fw) + (1.0 + hover) * fw - 0.06 * this.blockW * (1 - fw);
    // Add clearance during a flip; tuck to absorb a landing or sidestep.
    if (ac && ac.type === 'flip' && this.flying) body.position.y += 0.25 * acEnv;
    if (ac && ac.type === 'ninjaLeap') body.position.y += 0.055 * acEnv;
    if (ac && ac.type === 'landing') body.position.y -= this.motionProfile.landingBend * acEnv;
    if (ac && ac.type === 'evade') body.position.y -= 0.12 * acEnv;
    if (!flying) body.position.y -= this.dashPrep > 0 ? 0.14 : this.skidT > 0 && !this.sprinting && !this.dashing ? 0.08 : 0;
    // lying on the floor after a smash
    this.downW = (this.downW || 0) + ((this.downT > 0 ? 1 : 0) - (this.downW || 0)) * damp(14, dt);
    body.position.y += (0.32 - body.position.y) * this.downW;
    if (this.launched || this.downT > 0) body.position.y = this.downT > 0 ? body.position.y : 1.0;

    // poses: arm = [shoulderX, shoulderZ(out), elbowX], leg = [hipX, kneeX, hipZ(out)]; index 1 is the lead (left) side
    const stance = () => {
      if (this.characterId === 'rin_sable') {
        const breathe = Math.sin(this.t*1.85)*0.024;
        // Shade Runner: asymmetric open-hand guard, forward left hand, low right hand; upright and light on the feet.
        return { arm:[[-0.63+breathe,.30,-1.42],[-1.12-breathe,.24,-1.18]],
          leg:[[.17,.16,.07],[-.24,.23,.10]],spineY:-.08,spineX:.015,headX:-.015 };
      }
      const br = Math.sin(this.t * 2) * 0.04, sway = Math.sin(this.t * 1.3) * 0.04;
      // Storm Fist: readable high boxing guard, grounded without an exaggerated forward bow.
      // Subtle shifting weight keeps the character alive without idle foot-skating.
      const weight = Math.sin(this.t * 1.65) * 0.045;
      return { arm: [[-0.88 + br, 0.24, -1.48], [-1.07 - br, 0.18, -1.55]],
               leg: [[0.24 + weight, 0.31, 0.15], [-0.31 - weight, 0.38, 0.15]], spineY: -0.15 + sway * 0.5, spineX: 0.065, headX: 0.0 };
    };
    const run = () => {
      // knee folds most while the leg swings through (heel up under the hip), stays softly bent on the ground
      // stride angle matches the step length, so each foot covers exactly the ground travelled (no gliding)
      const ph = this.strideDir > 0 ? this.runPh : -this.runPh, sn = Math.sin(ph);   // backpedal runs the cycle in reverse
      const fold = x => Math.max(0, Math.sin(x - 4.4));
      const rn = smooth01((hspeed - 5) / 9);                                    // 0 = walking, 1 = running
      const A = Math.min(0.75, Math.asin(Math.min(1, (this.stepLen || 1) / 1.9))) * (0.45 + 0.55 * smooth01(hspeed / 1.2));
      const kf = 0.7 + 0.75 * rn, kb = 0.06 + 0.19 * rn, sw = 0.75 + 0.25 * rn;   // walk: swing knee lifts, standing leg nearly straight
      const armA = A * (0.35 + 0.48 * rn), elb = -1.0 - 0.52 * rn;               // walk: relaxed arms, run: bent and pumping
      return { arm: [[sn * armA - 0.5 - 0.15 * rn, 0.19 + 0.06 * rn, elb], [-sn * armA - 0.55 - 0.13 * rn, 0.2 + 0.05 * rn, elb]],
               leg: [[-sn * A - 0.19 * rn, (kb + fold(ph) * kf) * sw + 0.13 * rn, 0.08 + 0.04 * rn], [sn * A - 0.19 * rn, (kb + fold(ph + Math.PI) * kf) * sw + 0.13 * rn, 0.08 + 0.04 * rn]],
               spineY: -sn * (0.06 + 0.065 * rn), spineX: 0.055 + 0.025 * rn, headX: -0.035 - 0.02 * rn };
    };
    const flyIdle = () => {
      const s2 = Math.sin(this.t * 2.4) * 0.06;
      return { arm: [[-0.25, 0.5, -1.25], [-0.55, 0.38, -1.15]], leg: [[0.1 - s2, 0.55, 0.12], [-0.85 + s2, 1.35, 0.06]],
               spineY: -0.3, spineX: 0.08, headX: 0 };
    };
    const flyFwd = () => ({ arm: [[0.55, 0.2, -0.35], [-1.0, 0.1, -1.2]], leg: [[0.2, 0.45, 0.04], [0.05, 0.2, 0.04]], spineY: 0, spineX: 0, headX: -0.55 });
    const flyBack = () => ({ arm: [[-0.3, 0.55, -1.2], [-0.3, 0.55, -1.2]], leg: [[-0.55, 0.9, 0.12], [-0.35, 0.7, 0.12]], spineY: 0, spineX: 0.2, headX: 0.15 });
    const mix = (a, b, w) => ({
      arm: a.arm.map((x, i) => x.map((v, j) => v + (b.arm[i][j] - v) * w)),
      leg: a.leg.map((x, i) => x.map((v, j) => v + (b.leg[i][j] - v) * w)),
      spineY: a.spineY + (b.spineY - a.spineY) * w, spineX: a.spineX + (b.spineX - a.spineX) * w, headX: a.headX + (b.headX - a.headX) * w });

    let P;
    if (this.slamming) {
      // both fists raised overhead, then driven down for the landing
      P = this.slamWindT > 0
        ? { arm: [[-2.9, 0.15, -0.6], [-2.9, 0.15, -0.6]], leg: [[-0.9, 1.5, 0.12], [-0.9, 1.5, 0.12]], spineY: 0, spineX: -0.3, headX: 0.2 }
        : { arm: [[-0.6, 0.1, -0.2], [-0.6, 0.1, -0.2]], leg: [[-0.4, 0.5, 0.15], [-0.2, 0.3, 0.15]], spineY: 0, spineX: 0.5, headX: -0.3 };
    } else if (this.jumping && flying) {
      // hop: knees tucked going up, legs reaching for the floor coming down
      const up = this.vel.y > 0;
      P = { arm: [[-0.7, 0.55, -1.4], [-0.9, 0.45, -1.5]], leg: up ? [[-1.1, 1.7, 0.12], [-0.7, 1.3, 0.1]] : [[-0.45, 0.6, 0.12], [-0.2, 0.35, 0.1]], spineY: -0.2, spineX: 0.1, headX: 0.05 };
    } else if (this.dashPrep > 0) {
      // dash wind-up: sink low, load the back leg, arms pulled back
      P = { arm: [[0.65, 0.38, -0.72], [0.75, 0.28, -0.8]], leg: [[0.75, 1.25, 0.26], [-0.91, 1.48, 0.22]], spineY: -0.18, spineX: 0.48, headX: -0.32 };
    } else if (this.dashRecoverT > 0 && !this.dashing && !this.sprinting && !flying) {
      const t = smooth01(1 - this.dashRecoverT / 0.28);
      const G = stance(), R = run(); P = mix(R, G, t); P.spineX = 0.19; P.headX = -0.12;
      P.leg = mix(R, G, Math.min(1, t * 0.92 + 0.08)).leg;
    } else if (this.skidT > 0 && !flying && !this.sprinting && !this.dashing) {
      // braking: lead leg braced out front, weight back, arms out for balance
      P = { arm: [[-0.82, 0.52, -1.18], [-0.58, 0.62, -1.02]], leg: [[0.28, 0.92, 0.20], [-0.62, 0.54, 0.18]], spineY: 0.12, spineX: 0.02, headX: 0.04 };
    } else if (this.sprinting && flying) {
      // Boosted aerial travel: relaxed martial-arts flight posture, not a dive.
      if (this.characterId === 'kairo_venn' && window.SkyClashV150Flight) {
        // Athletic boosted flight with a little more pitch than normal
        // joystick travel, but never a horizontal Superman dive. Legs
        // and hands keep breathing on different beats throughout Boost.
        const drift = Math.sin(this.t * 2.35), delay = Math.sin(this.t * 2.35 - 0.8);
        P = { arm: [[-0.26 + 0.07 * delay, 0.31, -1.06 + 0.08 * drift],
                    [-0.80 - 0.06 * drift, 0.25, -0.91 + 0.08 * delay]],
              leg: [[0.10 + 0.10 * delay, 0.44 + 0.09 * drift, 0.06],
                    [-0.31 - 0.06 * drift, 0.72 + 0.09 * delay, 0.06]],
              spineY: 0.08, spineX: 0.11 + 0.025 * drift, headX: -0.10 };
      } else {
        P = { arm: [[-0.2, 0.28, -1.05], [-0.95, 0.20, -0.85]], leg: [[0.05, 0.38, 0.06], [-0.25, 0.66, 0.06]], spineY: 0.08, spineX: 0.20, headX: -0.12 };
      }
    } else if (this.sprinting) {
      // ground sprint: long strides, arms swept back
      // athletic sprint: upright chest, strong arm pump, long strides (no arms-back lean)
      const r = run();
      if (this.characterId === 'rin_sable') {
        r.arm = r.arm.map((a,i) => [0.55 + 0.17 * Math.sin(this.runPh + i * Math.PI), 0.22, -0.65]);
        r.spineX=0.025;r.headX=-0.035;
      } else {
        // Athletic Boost: upright head, compact bent elbows, strong opposite
        // arm pumps. Distinct from the imported normal joystick-run clip.
        r.arm=r.arm.map((a,i)=>[-0.69 + 0.31 * Math.sin(this.runPh + i * Math.PI),0.16,-1.15]);
        r.spineX=0.028;r.headX=0.09;
      }
      r.leg=r.leg.map(l=>[l[0]*1.18,l[1]*1.13,l[2]]);
      P = r;
    } else if (this.dashing && !flying) {
      // ground dash: a burst of running, same upright form as the sprint
      const r = run(); r.arm = r.arm.map((a,i) => [0.55 + 0.17 * Math.sin(this.runPh + i * Math.PI), 0.22, -0.65]); r.leg = r.leg.map(l => [l[0] * 1.24, l[1] * 1.16, l[2]]); r.headX = -0.035; r.spineX = this.characterId==='rin_sable' ? 0.025 : 0.070;
      P = r;
    } else if (this.dashing) {
      // Power-dash pose: streamlined but upright enough to look purposeful.
      P = { arm: [[-0.2, 0.25, -1.15], [-1.05, 0.18, -0.95]], leg: [[0.15, 0.45, 0.06], [-0.25, 0.62, 0.06]], spineY: 0.08, spineX: 0.26, headX: -0.16 };
    } else if (this.brokenT > 0) {
      // guard broken: arms flung open, staggering
      const w = Math.sin(this.t * 9) * 0.15;
      P = { arm: [[-0.3, 1.3, -0.3], [-0.3, 1.3, -0.3]], leg: [[-0.3 + w, 0.5, 0.15], [0.2 - w, 0.35, 0.15]], spineY: w, spineX: -0.35, headX: -0.45 };
    } else if (this.downT > 0) {
      P = { arm: [[-0.2, 1.1, -0.3], [-0.4, 0.8, -0.6]], leg: [[-0.15, 0.35, 0.18], [-0.45, 0.9, 0.12]], spineY: 0.1, spineX: 0, headX: 0.25 };
    } else if (this.superHitT > 0 && this.stun > 0) {
      // Heavy blast recoil: compact airborne tumble/recoil instead of a standing hit flash.
      const phase = 1 - this.superHitT / 0.82;
      const wobble = Math.sin(phase * 10) * (1 - phase) * 0.18;
      P = { arm: [[-2.1, 0.68, -0.58], [-2.0, 0.68, -0.62]],
        leg: [[-0.48 + wobble, 1.15, 0.18], [-0.58 - wobble, 1.18, 0.15]],
        spineY: wobble, spineX: -0.24, headX: -0.32 };
    } else if (this.launched || this.spiked) {
      // tumbling through the air
      const fl = Math.sin(this.launchT * 9) * 0.3;
      P = { arm: [[-2.4 + fl, 0.7, -0.4], [-2.2 - fl, 0.6, -0.5]], leg: [[-0.6 - fl, 0.9, 0.2], [0.1 + fl, 0.4, 0.2]], spineY: 0, spineX: -0.3, headX: -0.4 };
    } else if (this.stun > 0) {
      P = { arm: [[-0.6, 0.9, -0.4], [-0.6, 0.9, -0.4]], leg: [[-0.4, 0.6, 0.12], [0.1, 0.3, 0.12]], spineY: 0, spineX: -0.25, headX: -0.35 };
    } else {
      const ground = mix(stance(), run(), rw);
      const fz = clamp(lz / 12, -1, 1);
      const air = fz >= 0 ? mix(flyIdle(), flyFwd(), smooth01(fz)) : mix(flyIdle(), flyBack(), smooth01(-fz));
      P = mix(ground, air, fw);
      // Controlled lateral footwork: crossed arm guard, asymmetric sliding steps.
      if (!flying && hspeed > 1.5 && Math.abs(lx) > Math.abs(lz) * 0.8) {
        const lateral = smooth01((Math.abs(lx) - Math.abs(lz) * 0.8) / 8) * (1 - smooth01((hspeed - 13) / 8));
        const side = Math.sign(lx) || 1;
        const sidePh = Math.sin(this.runPh), leadLift = Math.max(0, sidePh), trailLift = Math.max(0, -sidePh);
        const slide = { arm: [[-1.05 + 0.10*sidePh, 0.28, -1.65], [-1.3 - 0.10*sidePh, 0.15, -1.9]],
          leg: [[0.18 + 0.40 * sidePh, 0.32 + 0.42 * leadLift, 0.18], [-0.18 - 0.40 * sidePh, 0.32 + 0.42 * trailLift, 0.18]],
          spineY: -0.25 * side, spineX: 0.07, headX: -0.03 };
        P = mix(P, slide, lateral * 0.48);
      }
    }
    // Parkour pose overrides are only cosmetic and ease in/out during the move.
    if (ac) {
      let A = null;
      if (ac.type === 'flip' && this.flying) {
        A = { arm: [[-1.45, 0.45, -1.5], [-1.4, 0.40, -1.45]],
          leg: [[-1.25, 1.9, 0.2], [-1.1, 1.75, 0.2]], spineY: 0, spineX: 0.12, headX: -0.12 };
       } else if (ac.type === 'ninjaLeap') {
        // V55: This is a *pose* handled below, not an orientation transform.
        // The old code reassigned `const A = this.acro`, throwing on every second jump
        // and terminating requestAnimationFrame. Do not modify that immutable action.
        // Keep the root upright: the knees tuck in the pose builder below.
      } else if (ac.type === 'airRoll' && this.flying) {
        A = { arm: [[-0.95, 0.5, -1.5], [-0.95, 0.5, -1.5]],
          leg: [[-0.65, 1.2, 0.15], [-0.65, 1.2, 0.15]], spineY: 0, spineX: 0.18, headX: -0.1 };
      } else if (ac.type === 'evade') {
        A = { arm: [[-1.4, 0.55, -1.65], [-0.85, 0.42, -1.9]],
          leg: [[0.45, 1.22, 0.22], [-0.83, 0.8, 0.15]],
          spineY: ac.direction * -0.24, spineX: 0.34, headX: -0.14 };
      } else if (ac.type === 'landing') {
        A = this.characterId === 'rin_sable'
         ? { arm: [[-0.15, 0.72, -1.4], [-1.25, 0.25, -1.7]],
             leg: [[1.05, 1.65, 0.3], [-0.6, 1.25, 0.2]],
             spineY: -0.18 * ac.direction, spineX: 0.5, headX: -0.3 }
         : { arm: [[-0.67, 0.21, -1.18], [-0.81, 0.18, -1.21]],
             leg: [[0.34, 0.85, 0.16], [-0.28, 0.74, 0.13]],
             spineY: -0.06 * ac.direction, spineX: 0.10, headX: 0.07 };
      }
      if (A) P = mix(P, A, smooth01(Math.min(1, acEnv * 1.6)));
    }
    // V80: ensure Kairo looks toward his opponent while WALKING instead
    // of staring at the floor; keep separate attacks/boost/flying poses.
    if (this.characterId === 'kairo_venn' && !flying && !this.sprinting &&
        !this.dashing && hspeed > 0.8 && this.punchT <= 0 &&
        this.blastT <= 0 && this.stun <= 0 && !this.charging) {
      P.headX=0.075;
      P.spineX=Math.min(P.spineX,0.07);
    }
    if (this.awakened && this.stun <= 0 && this.punchT <= 0 && !this.dashing && !this.charging && this.awakenChargeT <= 0) {
      const powerStance = { arm: [[-0.75, 0.36, -1.30],[-1.06, 0.32, -1.30]],
        leg: [[0.22, 0.55, 0.21],[-0.39, 0.62, 0.21]], spineY: -0.12, spineX: 0.10, headX: -0.16 };
      P = mix(P, powerStance, (flying ? 0.14 : 0.38) * (1 - clamp(hspeed / 14, 0, 1)));
    }
    if (this.vanishRecoverT > 0 && this.stun <= 0) {
      const w = smooth01(this.vanishRecoverT / 0.28);
      const arrive = { arm: [[-0.91, 0.47, -1.55],[-1.15, 0.32, -1.75]],
        leg: [[0.62, 1.03, 0.24],[-0.70, 0.69, 0.16]], spineY: -0.11, spineX: 0.22, headX: -0.12 };
      P = mix(P, arrive, 0.62 * w);
    }
    // block: forearms crossed in front of the face, knees bent
    if (this.blockW > 0.01 && this.brokenT <= 0 && this.stun <= 0) {
      const B = { arm: [[-1.3, -0.5, -1.75], [-1.4, -0.42, -1.9]], leg: fw > 0.5 ? P.leg : [[0.3, 0.6, 0.18], [-0.38, 0.62, 0.12]], spineY: -0.05, spineX: 0.28, headX: 0.18 };
      P = mix(P, B, this.blockW);
    }
    // charging: hands drawn together in front of the chest, wide braced stance
    if (this.charging && this.stun <= 0) {
      const lv = this.chargeLevel, sh = lv >= 1 ? Math.sin(this.t * 40) * 0.03 : 0;
      P.arm = this.characterId === 'rin_sable' ? [[0.6,-.12,-1.3],[-1.5,-.4,-.34]] : [[-1.05 + sh, -0.6, -1.15], [-1.05 - sh, -0.6, -1.15]]; P.spineY = 0; P.spineX = 0.04 + 0.03 * lv; P.headX = 0.1;
      if (fw < 0.5) P.leg = this.characterId === 'rin_sable' ? [[.46,.96,.23],[-.72,1.12,.19]] : [[0.16, 0.48, 0.21], [-0.24, 0.55, 0.18]];
    }
    // wind-up before an AI punch: rear fist pulled back
    if (this.windT > 0) { const w = 1 - this.windT / this.windLen; P.arm[0] = [0.55, 0.35, -1.9]; P.arm[1] = [-1.0, 0.25, -1.6]; P.spineY = 0.45 * Math.min(1, w * 2); }
    // V30: attacks have anticipation, an active contact frame and flowing recovery.
    // Poses blend onto locomotion instead of snapping arms/legs into fixed positions.
    if (this.blastT > 0) {
      const w = smooth01(Math.min(1, (0.26 - Math.min(this.blastT, 0.26)) / 0.09));
      // Superblast uses a stable two-arm energy push, not a repurposed overhand/hook.
      const B = { ...P, arm: [[-1.33, 0.16, -0.38], [-1.33, 0.16, -0.38]], spineY: 0, spineX: 0.025, headX: 0 };
      P = mix(P, B, w);
    } else if (this.punchT > 0) {
      const total = this.attackTotal || 0.235;
      const progress = clamp(this.attackElapsed / total, 0, 1);
      const contact = this.attackKind === 'fallingFist' ? 0.65 : this.attackKind === 'kick' || this.attackKind === 'skyKick' ? 0.48 : this.attackKind === 'skyUppercut' ? 0.49 : this.attackKind === 'hook' ? 0.49 : 0.43;
      const lift = smooth01(progress / contact);
      const returnW = 1 - smooth01((progress - contact) / (1 - contact));
      const strength = clamp(lift * returnW * 1.55 + 0.13 * Math.sin(progress * Math.PI), 0, 1);
      let B = { arm: P.arm.map(a => a.slice()), leg: P.leg.map(a => a.slice()), spineY: P.spineY, spineX: P.spineX, headX: P.headX };
      if (this.characterId === 'rin_sable' && this.attackKind === 'ninjaPalm') {
        const snap = smooth01(progress/0.39);
        B.arm=[[ -0.90,0.23,-1.30 ],[-1.04-0.62*snap,0.06,-0.35]];
        B.leg=[[0.17,0.24,0.12],[-0.40,0.35,0.15]];
        B.spineY=-0.21+0.25*snap;B.spineX=0.12;B.headX=-0.08;
      } else if (this.characterId === 'rin_sable' && this.attackKind === 'ninjaElbow') {
        const drive=smooth01(progress/0.47);
        B.arm=[[-1.30+0.42*drive,0.22,-2.10],[-0.70,0.48,-1.50]];
        B.leg=[[0.26,0.38,0.13],[-0.48,0.36,0.12]];
        B.spineY=0.31*drive;B.spineX=0.23;B.headX=-0.14;
      } else if (this.characterId === 'rin_sable' && this.attackKind === 'ninjaSpin') {
        const sweep=smooth01(progress/0.5);
        B.arm=[[-0.66,0.60,-1.42],[-1.45,0.38,-1.72]];
        B.leg=[[-0.38,0.66,0.12],[0.28-1.73*sweep,0.80-0.62*sweep,0.18]];
        B.spineY=-0.28+1.02*sweep;B.spineX=0.30;B.headX=-0.10;
      } else if (this.characterId === 'rin_sable' && this.attackKind === 'ninjaRising') {
        const thrust=smooth01(progress/0.48);
        B.arm=[[-1.10,0.36,-1.62],[-0.86,0.50,-1.60]];
        B.leg=[[-0.70+2.0*thrust,1.39-1.20*thrust,0.17],[-0.35,0.47,0.12]];
        B.spineY=-0.24+0.32*thrust;B.spineX=0.27;B.headX=-0.17;
      } else if (this.attackKind === 'slam') {
        B.arm = [[-0.3, 0.1, -0.2], [-0.8, 0.4, -1.6]];
        B.leg = [[-1.2, 1.9, 0.3], [-0.2, 1.4, 0.25]];
        B.spineX = 0.6; B.headX = -0.3; B.spineY = 0;
      } else if (this.attackKind === 'skyUppercut') {
        // A true vertical rising fist: elbow winds below the waist, fist drives
        // above the head, torso and support leg rise with the attack.
        const drive = smooth01(progress / 0.53);
        B.arm[0] = [-0.48 - drive * 1.55, -0.14, -1.88 + drive * 1.55];
        B.arm[1] = [-0.78, 0.42, -1.72];
        B.leg[0] = [-0.42, 1.1, 0.09]; B.leg[1] = [0.24, 0.45, 0.08];
        B.spineY = -0.18 + drive * 0.30; B.spineX = -0.16 + drive * 0.25; B.headX = -0.10;
      } else if (this.attackKind === 'fallingFist') {
        const dive = smooth01((progress - 0.18) / 0.46);
        B.arm = [[-0.62 - dive * 1.9, 0.08, -1.72 + dive * 1.38], [-0.82, 0.41, -1.88]];
        B.leg = [[-0.60, 1.28, 0.15], [0.24, 0.52, 0.12]];
        B.spineX = 0.28 + dive * 0.35; B.headX = -0.24; B.spineY = 0.14;
      } else if (this.attackKind === 'skyKick') {
        // Fold the knee first, then drive the heel sharply down through target.
        const snap = smooth01((progress - 0.22) / 0.30);
        B.arm = [[-1.18, 0.33, -1.55], [-0.85, -0.20, -1.82]];
        B.leg = [[-1.12 + snap * 1.48, 1.85 - snap * 1.68, 0.17], [-0.44, 1.24, 0.1]];
        B.spineX = 0.27 + snap * 0.25; B.spineY = 0.12;
      } else if (this.attackKind === 'airStrike') {
        // Air finisher: forward driving elbow/knee with both feet tucked, never a rotating roundhouse.
        B.arm = [[-1.60,-0.12,-0.38],[-0.80,0.32,-1.76]];
        B.leg = [[-0.74,1.42,0.11],[-0.34,1.05,0.12]];
        B.spineY = 0.20; B.spineX = 0.16; B.headX = -0.08;
      } else if (this.attackKind === 'kick') {
        B.leg[0] = [-1.6, 0.09, 0.05]; B.leg[1] = [0.35, 0.57, 0.12];
        B.arm = [[-0.35, 0.55, -1.65], [-0.8, 0.35, -1.6]];
        B.spineY = -0.45; B.spineX = -0.16; B.headX = 0.08;
      } else {
        const i = this.punchSide, o = 1 - i;
        if (this.attackKind === 'hook') {
          // Hook: shoulder and hips turn together, but the ribcage stays compact.
          // Avoid the rubber-torso stretch that made the third hit look broken.
          B.arm[i] = [-1.02, -0.34, -1.08]; B.arm[o] = [-0.95, 0.22, -1.70];
          B.spineY = i ? -0.18 : 0.18; B.spineX = 0.10;
          B.leg[i] = [-0.22, 0.74, 0.12]; B.leg[o] = [0.12, 0.54, 0.10]; B.headX = -0.05;
        } else {
          // Fast lead-hand jab versus fully committed rear-hand cross.
          const jab = i === 1;
          B.arm[i] = jab ? [-1.65, -0.15, -0.15] : [-2.25, -0.30, -0.05];
          B.arm[o] = [-0.80, 0.45, -1.92];
          B.spineY = jab ? -0.27 : 0.82;
          B.spineX = jab ? 0.12 : 0.33; B.headX = jab ? -0.07 : -0.11;
          B.leg[i] = [jab ? 0.10 : 0.32, 0.65, jab ? 0.10 : 0.23];
        }
      }
      if (!flying) {
        const moveW = smooth01((this.attackDrive - 1.0) / 5.2) * (this.attackMoving ? 1 : 0.5);
        if (moveW > 0.01 && this.attackKind !== 'skyUppercut' && this.attackKind !== 'skyKick' && this.attackKind !== 'fallingFist') {
          const sideBias = this.attackTravel ? (this.attackTravel.x * Math.cos(yaw) - this.attackTravel.z * Math.sin(yaw)) : 0;
          const step = { arm: [[-1.18, 0.22, -1.65], [-0.82, 0.14, -1.88]],
            leg: [[0.54, 0.98, 0.18], [-0.72, 0.62, 0.14]],
            spineY: clamp(-sideBias * 0.28, -0.22, 0.22), spineX: 0.22, headX: -0.10 };
          if (this.attackKind === 'kick') {
            step.arm = [[-0.55, 0.42, -1.55], [-0.92, 0.26, -1.58]];
            step.leg = [[0.15, 0.62, 0.14], [-0.88, 0.88, 0.10]];
            step.spineX = 0.10;
          } else if (this.attackKind === 'hook') {
            step.arm = [[-1.10, 0.06, -1.38], [-0.92, 0.18, -1.78]];
            step.leg = [[0.38, 0.84, 0.14], [-0.62, 0.64, 0.12]];
            step.spineX = 0.18;
          }
          const contactPlant = smooth01(progress / 0.35);
          B = mix(B, step, moveW * (0.84 - 0.28 * contactPlant));
        }
      }
      // During moving hand strikes, preserve the cyclic gait rather than holding a frozen lunge.
      if (mobilePunch) B.leg = P.leg.map(leg => leg.slice());
      if (!flying && !mobilePunch) {
        // A visible support foot travels in during preparation and settles under the hips at contact.
        const plant = smooth01(progress / 0.40);
        const lead = this.punchSide;
        const reach = this.attackMoving ? 0.58 : 0.30;
        B.leg[lead] = [reach * (1 - 0.40 * plant), 0.65 + 0.28 * plant, 0.12];
        B.leg[1 - lead] = [-0.52 + 0.20 * plant, 0.72, 0.12];
        if (this.attackKind === 'kick') B.leg[0] = [-1.55, 0.15, 0.06];
      }
      P = mix(P, B, strength);
    }
    // Transformation sequence: planted base, fists clench at hips, head lowered;
    // peak breaks into an open-chest power stance. Entire body participates.
    if (this.awakenChargeT > 0) {
      const phase = this.awakenChargeProgress;
      const open = smooth01((phase - 0.63) / 0.37);
      const tremble = Math.sin(this.t * (16 + 14 * phase)) * 0.035 * smooth01(phase);
      const C = { arm: [[0.27 - open * 1.08 + tremble, 0.24 + open * 0.55, -1.56 + open * 0.56],
                         [0.27 - open * 1.08 - tremble, 0.24 + open * 0.55, -1.56 + open * 0.56]],
        leg: [[0.27 - open * 0.16, 0.48, 0.23], [-0.42 + open * 0.12, 0.55, 0.25]],
        spineY: 0, spineX: 0.25 - open * 0.39 + tremble, headX: 0.23 - open * 0.48 };
      P = mix(P, C, smooth01(Math.min(1, phase * 6)));
      // Small braced dip; don't lift the whole mesh from the ground.
      body.position.y -= (0.055 - open * 0.03);
    }
    if (typeof CharacterWorkshop !== "undefined") P = CharacterWorkshop.applyPose(this,P);
    const fast = this.punchT > 0 || this.blastT > 0 ? 19 : this.moving || this.stun > 0 ? 18 : 11;
    const k = damp(fast, dt), kb = damp(12, dt);
    m.arms.forEach((a, i) => {
      const [x, z, e] = P.arm[i];
      a.sh.rotation.x += (x - a.sh.rotation.x) * k;
      a.sh.rotation.z += (z * a.side - a.sh.rotation.z) * k;
      a.el.rotation.x += (e - a.el.rotation.x) * k;
    });
    m.legs.forEach((l, i) => {
      const [h, kn, hz] = P.leg[i];
      l.hip.rotation.x += (h - l.hip.rotation.x) * k;
      l.hip.rotation.z += (hz * l.side - l.hip.rotation.z) * k;
      l.knee.rotation.x += (kn - l.knee.rotation.x) * k;
      l.foot.rotation.x += ((fw > 0.5 ? 0.5 : -(h + kn) * 0.85) - l.foot.rotation.x) * kb;   // keep boots flat on the ground
      l.foot.rotation.z += ((fw > 0.5 ? 0 : -hz * l.side) - l.foot.rotation.z) * kb;
    });
    m.spine.rotation.y += (P.spineY - this.hipYaw - m.spine.rotation.y) * k;   // chest counter-turns against the hips
    m.spine.rotation.x += (P.spineX - m.spine.rotation.x) * k;
    m.head.rotation.x += (P.headX - m.head.rotation.x) * kb;
    m.head.rotation.y += (-P.spineY * 0.48 - m.head.rotation.y) * kb;   // eyes stay on the target
    m.chest.scale.y = 0.92 + Math.sin(this.t * 2) * 0.01;
    if (m.tick) m.tick(dt, this);

    // awakening: hair colour, spikes stand taller, flame aura
    const aw = this.awakened;
    m.hairMat.color.setHex(aw ? this.pal.awakenHair : this.pal.hair);
    m.hairMat.emissive.setHex(aw ? this.pal.awakenHair : 0x000000);
    m.hairMat.emissiveIntensity = aw ? 0.35 : 1;
    // hit flash: whole body briefly flashes white
    // guard broken: pulsing red tint until they recover
    let r = 0, g = 0, b = 0;
    if (this.hitFlash > 0) r = g = b = 0.55;
    else if (this.brokenT > 0) { const pz = 0.2 + 0.14 * Math.sin(this.t * 18); r = pz; g = pz * 0.15; b = pz * 0.3; }
    const key = r * 1000 + g * 10 + b;
    if (key !== m._flash) { m._flash = key; m.bodyMats.forEach(mt => mt.emissive.setRGB(r, g, b)); }
    const spikeScale = aw ? 1.25 : 1;
    m.spikes.forEach(s => {
      const cur = s.scale.y + (spikeScale - s.scale.y) * damp(8, dt);
      s.scale.set(1, cur, 1);
      const d = s.userData.dir, b = s.userData.base;
      if (b) { const h = s.userData.len * cur / 2; s.position.set(b.x + d.x * h, b.y + d.y * h, b.z + d.z * h); }
      else { const off = s.userData.inset + s.userData.len * cur / 2; s.position.set(d.x * off, d.y * off, d.z * off); }
    });
    // charge orb grows with the charge and pulses at full power
    const lvc = this.chargeLevel, showOrb = this.charging && this.chargeT > 0.08;
    this.orb.visible = this.orbCore.visible = showOrb && this.characterId !== 'rin_sable';
    if (showOrb) {
      const op = this.center.addScaledVector(this.forward(), 0.68); op.y -= 0.05;
      // Visual cap independent of charge damage: compact, bright, never hides the torso.
      const pulse = 1 + Math.sin(this.t * (lvc >= 1 ? 28 : 12)) * 0.045;
      const sz = (0.22 + 0.26 * lvc) * pulse;
      this.orb.position.copy(op); this.orbCore.position.copy(op);
      this.orb.scale.setScalar(sz * 1.38); this.orbCore.scale.setScalar(sz * 0.66);
      this.orb.material.opacity = 0.48 + 0.12 * lvc;
      this.orb.material.color.setHex(aw ? this.pal.aura : this.pal.ki);
    }
    // Awakening/charging keeps its usual aura; Boost uses thin speed streaks, never a meteor.
    const auraTarget = aw ? (this.dashing || (this.sprinting && flying) ? 0.38 : 0.72) : this.charging ? 0.025 + 0.06 * lvc : 0;
    // No meteor model or speed sphere during dashes or fast flight.
    // Boost is communicated through motion, audio and brief launch dust only.
    m.aura.level = (m.aura.level || 0) + (auraTarget - (m.aura.level || 0)) * damp(aw ? 6 : 10, dt);
    m.aura.set(this.t, m.aura.level, aw ? this.pal.aura : this.pal.ki);

    // ground blob shadow shrinks and fades with height
    const h = this.pos.y - this.floor;
    m.blob.position.set(this.pos.x, this.floor + 0.03, this.pos.z);
    const bs = clamp(1.2 - h * 0.025, 0.5, 1.2); m.blob.scale.set(bs, bs, bs);
    m.blob.material.opacity = Math.max(0, 0.40 * (1 - smooth01((h - 0.35) / 4.0)));
    m.blob.visible = this.vanishT <= 0 && h < 4.4;
  }
}

