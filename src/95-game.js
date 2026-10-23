/* ---------------- Game ---------------- */
const Game = {
  state: 'title',   // title | playing | paused | over
  mode: 'fight', dojoRival: false,
  lockOn: false,
  player: null, enemy: null,
  init() {
    const hero=CharacterRegistry.get('kairo_venn');
    this.player = new Fighter(hero.name, PALETTES.hero, new V3(0, STAGE_H, 12),hero.id);
    this.heroes={kairo_venn:this.player,rin_sable:new Fighter('Rin Sable',PALETTES.ninja,new V3(0,STAGE_H,12),'rin_sable')};
    this.heroes.rin_sable.model.root.visible=false;this.heroes.rin_sable.model.blob.visible=false;
    const nameLabel=$('pFighterName');if(nameLabel)nameLabel.textContent=hero.name;
    const dojoLabel=$('dojoTitle');if(dojoLabel)dojoLabel.textContent=hero.training.title.toUpperCase();
    this.enemy = new Fighter('Rival', PALETTES.rival, new V3(0, STAGE_H, -12),'kairo_venn');
    try { $('pPortrait').src = renderPortrait(PALETTES.hero); $('ePortrait').src = renderPortrait(PALETTES.rival); } catch (err) { console.warn(err); }
    if (typeof LoadScreen !== 'undefined') LoadScreen.progress(28,'Preparing fighters');
    const modelSource = window.HERO_VRM_URL || window.HERO_VRM_B64;
    if (modelSource && window.VRMKit) {
      document.body.classList.add('vrm-loading');
      const hiddenGear = ['robo_arm','arm_mat','arm_plastic','green_emit','backpack',
        'anim_logo','armgear_plastic','robo_face','glass','wear_metal'];
      // Sequential decoding limits peak model-loading memory on phones.
      loadVRMInto(this.heroes.kairo_venn, modelSource, {hide:window.SKY_V66_REAL_KAIRO?[]:hiddenGear,legacyAxes:!!window.SKY_V66_REAL_KAIRO,vroidHands:!!window.SKY_V66_REAL_KAIRO&&window.SKY_V67_FIST_CORRECTION!==false,studioHands:!!window.SKY_V66_REAL_KAIRO&&window.SKY_V73_NATIVE_HANDS!==false,scale:window.SKY_V66_REAL_KAIRO?1:1.075}).then(async ok => {
        if (ok) {
          if (typeof LoadScreen !== 'undefined') LoadScreen.progress(63,'Hero ready');
          try { this.kairoPortrait=renderVRMPortrait(this.heroes.kairo_venn); if(this.player===this.heroes.kairo_venn)$('pPortrait').src=this.kairoPortrait; }
          catch(err) { console.warn('Hero portrait',err); }
        }
        const rivalOK = await loadVRMInto(this.enemy, modelSource, {hide:window.SKY_V66_REAL_KAIRO?[]:hiddenGear,rival:true,legacyAxes:!!window.SKY_V66_REAL_KAIRO,vroidHands:!!window.SKY_V66_REAL_KAIRO&&window.SKY_V67_FIST_CORRECTION!==false,studioHands:!!window.SKY_V66_REAL_KAIRO&&window.SKY_V73_NATIVE_HANDS!==false,scale:window.SKY_V66_REAL_KAIRO?1:1.075});
        if (rivalOK) {
          if (typeof LoadScreen !== 'undefined') LoadScreen.progress(77,'Preparing training hall');
          try { $('ePortrait').src = renderVRMPortrait(this.enemy); }
          catch(err) { console.warn('Rival portrait',err); }
        }
        // Rin uses the same full-detail VRM skeleton, shaders and animation
        // layers as Kairo. The dyed outfit texture is kept in her own asset;
        // no geometric fallback unless the real model fails to load.
        const rinSource = window.RIN_VRM_URL || 'assets/rin.vrm';
        const rinOK = await loadVRMInto(this.heroes.rin_sable, rinSource,
          {hide:hiddenGear,ninja:true,legacyAxes:true,scale:1.075});
        if (rinOK) {
          if (typeof LoadScreen !== 'undefined') LoadScreen.progress(96,'Ninja ready');
          try {
            this.rinPortrait=renderVRMPortrait(this.heroes.rin_sable);
            if(this.player===this.heroes.rin_sable)$('pPortrait').src=this.rinPortrait;
          } catch(err) { console.warn('Ninja portrait',err); }
        }
        document.body.classList.remove('vrm-loading');
        if (typeof LoadScreen !== 'undefined') LoadScreen.finish();
      }).catch(err=>{
        console.warn('Character setup failed',err);
        document.body.classList.remove('vrm-loading');
        if (typeof LoadScreen !== 'undefined') LoadScreen.finish('Using lightweight fighters');
      });
    } else if (typeof LoadScreen !== 'undefined') LoadScreen.finish('Ready to train');
    this.lag = { p: 100, e: 100 };
    this.setLock(Settings.get('lockDefault'), false);
    CameraRig.snapBehind(this.player, this.enemy);
    applyQuality();
    Settings.onChange(k => { if (k === 'quality') applyQuality(); if (k === 'fps') $('fps').classList.toggle('hidden', !Settings.get('fps')); });
    $('fps').classList.toggle('hidden', !Settings.get('fps'));
    $('pauseBtn').addEventListener('click', () => this.togglePause());
    // auto-pause when the app is backgrounded or loses focus
    document.addEventListener('visibilitychange', () => { if (document.hidden && (typeof CharacterWorkshop==='undefined' || !CharacterWorkshop.active)) this.pause(); });
    window.addEventListener('blur', () => { if (typeof CharacterWorkshop==='undefined' || !CharacterWorkshop.active) this.pause(); });
    if ('ontouchstart' in window) document.body.classList.add('force-touch');
    if (typeof CharacterWorkshop !== 'undefined') CharacterWorkshop.init();
  },
  selectCharacter(id) {
    if(this.state!=='title') return;
    const who=CharacterRegistry.get(id);
    if(!this.heroes[who.id]) return;
    if(this.player) { this.player.model.root.visible=false;this.player.model.blob.visible=false;this.player.orb.visible=false;this.player.orbCore.visible=false;this.player.cancelCharge(); }
    this.player=this.heroes[who.id];this.player.reset();
    this.player.model.root.visible=true;this.player.model.blob.visible=true;
    $('pFighterName').textContent=who.name;
    $('dojoTitle').textContent=who.training.title.toUpperCase();
    const icon=who.id==='rin_sable'?'Shuriken':'Blast';
    const b=document.querySelector('.cbtn.blast');b.querySelector('span').textContent=icon;
    b.querySelector('small').textContent=who.id==='rin_sable'?'hold · volley':'hold · charge';
    b.setAttribute('aria-label',who.id==='rin_sable'?'Shuriken: tap to throw, hold for a volley':'Blast: tap to fire, hold to charge');
    const fly=document.querySelector('.cbtn.fly');fly.querySelector('span').textContent=who.mobility.flight?'Fly':'Jump';
    fly.querySelector('small').textContent=who.mobility.flight?'slide ▼ down':'2× jump';
    fly.setAttribute('aria-label',who.mobility.flight?'Fly or descend':'Jump, release and tap again to double jump');
    if(who.id==='rin_sable') $('pPortrait').src=this.rinPortrait||renderPortrait(PALETTES.ninja);
    else $('pPortrait').src=this.kairoPortrait||renderPortrait(PALETTES.hero);
    document.querySelectorAll('[data-hero]').forEach(el=>{const selected=el.dataset.hero===who.id;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});
    const tip=$('heroTip');if(tip)tip.textContent=who.id==='rin_sable'? 'RIN · Twin jumps · Shurikens · Shadow Volley · Shadow Step · Nightveil.': 'KAIRO · Storm Fist · Aether Breaker · Flight · Vanish · Stormheart.';
    this.setLock(false,false);CameraRig.snapBehind(this.player,this.enemy);
  },
  setLock(on, notify = true) {
    this.lockOn = on;
    if (notify) toast(on ? 'Lock-on enabled' : 'Free camera');
  },
  get training() { return this.mode === 'dojo'; },
  setRivalPresent(on) {
    const e=this.enemy;
    e.model.root.visible=!!on; e.model.blob.visible=!!on;
    e.orb.visible=e.orbCore.visible=false;
    this.dojoRival=!!on;
    const bar=$('dojoRivalHud');if(bar)bar.classList.toggle('hidden',!on);
  },
  start() { this.startFight(); },
  startFight() {
    this.mode='fight';this.dojoRival=true;
    Settings.set('rival','fight');
    Arena.setEnvironment('highland');Dojo.show(false);
    this.setRivalPresent(true);
    this.player.spawn.set(0,STAGE_H,12);this.enemy.spawn.set(0,STAGE_H,-12);
    this.restart();
    this.banner('SKY CLASH','round');
  },
  // Listen to actual Mixamo keyframes on the selected character, not a generic
  // animation avatar. Preview is visual only and never creates a damaging hit.
  previewDojoMotion(name) {
    if(this.mode!=='dojo' || this.state!=='playing' || typeof SkyClashMixamo==='undefined' || !SkyClashMixamo.has(name))return false;
    const fighter=this.player,layer=fighter?.vrmRig?.anim;
    if(!layer){toast(fighter.characterId==='rin_sable'?'Rin uses the safe ninja rig; experimental FBX previews are disabled':'The detailed fighter model is still loading');return false;}
    if(fighter.punchT>0 || fighter.stun>0 || fighter.launched || fighter.downT>0){toast('Finish the current move first');return false;}
    fighter.sprinting=false;fighter.sprintHeld=false;
    const c=Anim.clip(name);
    layer.play(name,{from:0,end:c.d,rate:1,mask:null,noH:true,fadeIn:0.13,fadeOut:0.24,blendOut:0.18});
    toast('Animation preview · stay still to inspect');
    return true;
  },
  enterDojo() {
    this.mode='dojo';this.dojoRival=false;
    $('dojoRivalMode').value='solo';
    Settings.set('rival','dummy');
    Arena.setEnvironment('dojo');Dojo.show(true);Dojo.resetProps();
    this.setRivalPresent(false);
    this.player.spawn.set(0,STAGE_H,12);this.enemy.spawn.set(0,STAGE_H,-120);
    this.restart();
    this.setLock(false,false);
    $('dojoTools').classList.remove('hidden');
    $('dojoTools').classList.add('collapsed'); $('dojoToggle').setAttribute('aria-expanded','false');
    this.banner('WELCOME TO THE DOJO','round');
  },
  setDojoRival(mode) {
    if(this.mode!=='dojo')return;
    if(mode==='solo') {
      this.dojoRival=false;this.setRivalPresent(false);this.enemy.spawn.set(0,STAGE_H,-120);
      this.enemy.reset();this.enemy.moveIntent.set(0,0,0);
      Settings.set('rival','dummy');this.setLock(false,false);
      toast('Solo practice · equipment is ready');
    } else {
      const kind=['dummy','moving','attacks'].includes(mode)?mode:'dummy';
      Settings.set('rival',kind);
      this.enemy.spawn.set(2,STAGE_H,-7);this.enemy.reset();this.enemy._dmgMul=0;
      this.setRivalPresent(true);
      toast(kind==='attacks'?'Sparring partner ready':kind==='moving'?'Moving partner ready':'Training partner ready');
    }
    const select=$('dojoRivalMode');if(select)select.value=mode;
    this.renderPips();
  },
  returnHome() {
    if (typeof CharacterWorkshop !== "undefined" && CharacterWorkshop.active) CharacterWorkshop.close();
    if(this.state==='paused')Menus.closePause();
    this.state='title';this.showPlayUI(false);
    Combat.clear();Effects.clear();Spectacle.clear();Input.reset();
    this.player.reset();this.enemy.reset();
    $('dojoTools').classList.add('hidden');
    Dojo.show(false);Arena.setEnvironment('highland');this.setRivalPresent(true);
    $('titleScreen').classList.add('show');$('titleScreen').setAttribute('aria-hidden','false');
    Input.reset();
  },
  // hit counter: shows the current string of hits and its total damage
  combo: { n: 0, dmg: 0, t: 0 },
  onPlayerHit(dmg) {
    const c = this.combo; if (c.t <= 0) { c.n = 0; c.dmg = 0; }
    c.n++; c.dmg += dmg; c.t = 1.3;
    const el = $('comboBox'); $('comboN').textContent = c.n + (c.n === 1 ? ' hit' : ' hits'); $('comboD').textContent = Math.round(c.dmg) + ' damage';
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('show', 'pop');
    if (c.n >= 4) { el.classList.add('hot'); $('comboD').textContent = Math.round(c.dmg) + ' damage · ' + (c.n >= 8 ? 'SUPER!' : 'NICE!'); }
    else el.classList.remove('hot');
  },
  // match = best of N rounds (first to `need` wins); a round ends on a KO or when the clock runs out
  match: { round: 1, pw: 0, ew: 0, need: 2 },
  get timed() { return !this.training && Settings.get('timer') !== 'off'; },
  restart() {
    const n = +Settings.get('rounds') || 3;
    this.match = { round: 1, pw: 0, ew: 0, need: Math.ceil(n / 2), total: n };
    this.startRound();
  },
  startRound() {
    this.player.reset(); this.enemy.reset(); Combat.clear(); Effects.clear(); Spectacle.clear(); RivalAI.reset(); Input.reset();
    for (const fighter of [this.player, this.enemy]) {
      const layer=fighter.vrmRig?.anim;
      if (layer) { layer.one=null; layer.prevOne=null; layer.lastAttackSerial=-1; layer.prev.hp=100; layer.prev.jumping=false; layer.ph=0; layer.locoLeg=0; layer.locoUp=0; }
    }
    if(this.mode==='dojo') Dojo.resetProps();
    if(this.mode==='dojo') this.setRivalPresent(this.dojoRival);
    else this.setRivalPresent(true);
    this.setLock(Settings.get('lockDefault'), false);
    CameraRig.snapBehind(this.player, this.enemy);
    if(this.mode==='dojo' && !this.dojoRival) this.setLock(false,false);
    this.koT = 0; this.hitStopT = 0; this.lag = { p: 100, e: 100 }; this.combo.t = 0; $('comboBox').classList.remove('show', 'hot'); this._mv = {x:0,y:0}; this._upWas = false;
    this.state = 'playing'; this.showPlayUI(true); this.betweenT = 0;
    $('dojoTools').classList.toggle('hidden',this.mode!=='dojo');
    $('dojoTools').classList.add('collapsed'); $('dojoToggle').setAttribute('aria-expanded','false');
    $('dojoRivalHud').classList.toggle('hidden',this.mode!=='dojo'||!this.dojoRival);
    this.timeLeft = +Settings.get('timer') || 0; this.timeUp = false;
    this.renderPips();
    if (this.training) { this.introT = 0; this.banner('TRAIN · EXPLORE · IMPROVE', 'fight'); }
    else {
      // short intro: fighters hold still while the round is announced
      const m = this.match, last = m.pw === m.need - 1 && m.ew === m.need - 1 && m.need > 1;
      this.introT = 1.25; this.banner(m.total === 1 ? 'Ready' : last ? 'Final round' : 'Round ' + m.round, 'round');
    }
  },
  renderPips() {
    const m = this.match, show = !this.training && m.need > 1;
    for (const [id, w] of [['pPips', m.pw], ['ePips', m.ew]]) {
      const el = $(id); el.classList.toggle('hidden', !show);
      el.innerHTML = show ? Array.from({ length: m.need }, (_, i) => `<i class="${i < w ? 'won' : ''}"></i>`).join('') : '';
    }
  },
  // called once the KO / time-up slow motion has finished
  endRound() {
    const p = this.player, e = this.enemy, m = this.match;
    let res;
    if (p.hp <= 0 && e.hp <= 0) res = 'draw';
    else if (e.hp <= 0) res = 'win';
    else if (p.hp <= 0) res = 'lose';
    else res = p.hp > e.hp + 0.5 ? 'win' : e.hp > p.hp + 0.5 ? 'lose' : 'draw';   // time up: more health left wins
    if (res === 'win') m.pw++; if (res === 'lose') m.ew++;
    this.renderPips();
    if (m.pw >= m.need || m.ew >= m.need) {
      this.state = 'over'; this.showPlayUI(false); Menus.showOver(m.pw >= m.need, m.need > 1 ? m.pw + '–' + m.ew : '');
      return;
    }
    this.state = 'between'; this.betweenT = 1.9; $('controls').classList.add('hidden');
    this.banner(res === 'win' ? 'Round won' : res === 'lose' ? 'Round lost' : 'Draw', res === 'lose' ? 'ko' : 'round');
    m.round++;
  },
  onGuardBreak(f) {
    const bar = $(f === this.player ? 'pGdBar' : 'eGdBar');
    bar.classList.remove('broken'); void bar.offsetWidth; bar.classList.add('broken');
    clearTimeout(bar._t); bar._t = setTimeout(() => bar.classList.remove('broken'), TUNING.guardBreakStun * 1000 + 300);
    if (f === this.player) { const fx = $('breakFlash'); fx.classList.remove('show'); void fx.offsetWidth; fx.classList.add('show'); }
  },
  callout(text, cls) {
    const el = $('callout'); el.textContent = text; el.className = 'callout'; void el.offsetWidth; el.className = 'callout show ' + cls;
    clearTimeout(this._calloutT); this._calloutT = setTimeout(() => el.classList.remove('show'), 900);
  },
  banner(text, cls) {
    const b = $('banner'); b.textContent = text; b.className = 'banner'; void b.offsetWidth; b.className = 'banner show ' + cls;
  },
  hitStop(t) { this.hitStopT = Math.max(this.hitStopT || 0, t); },
  showPlayUI(on) { $('hud').classList.toggle('hidden', !on); $('controls').classList.toggle('hidden', !on); },
  pause() { if (this.state !== 'playing') return; this.state = 'paused'; Input.reset(); $('controls').classList.add('hidden'); $('dojoTools').classList.add('hidden'); Menus.openPause(); },
  resume() { if (this.state !== 'paused') return; Menus.closePause(); Input.reset(); this.state = 'playing'; $('controls').classList.remove('hidden'); $('dojoTools').classList.toggle('hidden',this.mode!=='dojo'); this._last = performance.now(); },
  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') { if (Menus.currentView() !== 'main') Menus.back(); else this.resume(); }
    else if (Menus.settingsReturn) Menus.back();
  },

  handlePlayerInput(dt) {
    const p = this.player, e = this.enemy;
    if (typeof CharacterWorkshop !== "undefined" && CharacterWorkshop.active) {
      Input.reset(); p.moveIntent.set(0,0,0);p.vert=0;p.blockHeld=false;p.sprintHeld=false;p.chargeHeld=false;return;
    }
    const raw = Input.move();
    // V95: digital WASD is magnitude 1, but it is NOT a thumbstick
    // reaching its outer ring. Use only the physical stick coordinates.
    if(window.SkyClashMovementLab?.joystickRun&&window.SkyClashV95Joystick){
      const radius=window.SkyClashV95Joystick.physicalRadius(Input._stick);
      p.v95StickRadius=radius;
      p.v95JoystickRun=window.SkyClashV95Joystick.decide(
        p.v95JoystickRun,radius,!p.sprinting&&!p.flying&&!p.jumping);
    }
    // light smoothing on the stick so direction changes feel fluid rather than twitchy
    const sm = this._mv || (this._mv = { x: 0, y: 0 }); const ks = damp(20, dt);
    sm.x += (raw.x - sm.x) * ks; sm.y += (raw.y - sm.y) * ks;
    const m = { x: sm.x, y: sm.y, mag: Math.hypot(sm.x, sm.y) };
    const fwd = CameraRig.forward(), rgt = CameraRig.right();
    const dir = new V3().addScaledVector(fwd, m.y).addScaledVector(rgt, m.x);
    // stick distance sets the pace: small tilt strolls, half tilt walks, full tilt walks briskly (hold Run to run)
    const mg = Math.min(1, m.mag), pace = mg < 0.08 ? 0 : mg < 0.4 ? 0.12 + (mg - 0.08) / 0.32 * 0.13 : mg < 0.75 ? 0.25 + (mg - 0.4) / 0.35 * 0.25 : 0.5 + (mg - 0.75) / 0.25 * 0.5;
    if (dir.lengthSq() > 1e-6) p.moveIntent.copy(dir).normalize().multiplyScalar(pace); else p.moveIntent.set(0, 0, 0);
    p.vert = Input.vertical();
    // V81: tap Up once for a normal jump/ascend. Once HOVERING, a
    // deliberate double-tap Up within 380ms cancels powered flight and
    // switches to a real gravity-driven fall. Holding Fly Down remains a
    // controlled descent and must NEVER trigger falling body animations.
    if(p.vert>0&&!this._upWas){
      const now=p.t||0;
      if(p.flying&&!p.jumping&&now-(this._upLastTap??-100)<.38){
       if(p.dropFromFlight?.())this._upLastTap=-100;
       else this._upLastTap=now;
      }else{
       if(!p.dropping)p.tryJump();
       this._upLastTap=now;
      }
    }
    this._upWas=p.vert>0;
    if (p.awakenChargeT > 0) {
      // Consume queued inputs without interrupting transformation or spamming an action afterward.
      for (const act of ['dash','dash2','vanish','melee','blast','awaken','lock']) Input.consume(act);
      p.moveIntent.set(0,0,0); p.vert = 0; p.blockHeld = false;
      p.sprintHeld = false; p.chargeHeld = false;
      return;
    }
    p.blockHeld = Input.block();
    // while guarding, turn to face a nearby rival so the block covers you
    if (p.blocking && p.pos.distanceTo(e.pos) < 15) p.facing = lerpAngle(p.facing, yawFromDir(e.pos.x - p.pos.x, e.pos.z - p.pos.z), damp(14, dt));

    // facing: rival when lock is active, otherwise the way you're moving
    if (CameraRig.isLockActive()) p.facing = lerpAngle(p.facing, yawFromDir(e.pos.x - p.pos.x, e.pos.z - p.pos.z), damp(12, dt));
    else if (!p.moving && m.mag > 0.15 && p.stun <= 0) p.facing = lerpAngle(p.facing, yawFromDir(dir.x, dir.z), damp(10, dt));

    if (Input.consume('lock')) this.setLock(!this.lockOn);
    p.sprintHeld = Input.dashHeld();
    const runTap = Input.consume('dash'), dashTap = Input.consume('dash2');
    if (runTap || dashTap) {
      p.dashWasChase = false;
      // dash goes where the stick points; with no input, where you're facing
      // launched yourself? Dash breaks out of the juggle instead
      if (p.launched) { p.tryRecover(); }
      // rival launched and in range: the dash homes in so you can keep the combo going
      else if (e.launched && !e.spiked && p.pos.distanceTo(e.pos) < TUNING.chaseRange) {
        const to = e.center.sub(p.center).normalize();
        if (p.tryDash(to, 0)) { p.dashWasChase = true; p.chase = e; p.dashT = TUNING.dashTime * 1.6; CameraRig.onDash(); Effects.ring(p.center, 0xffffff, 1.2); }
      } else if (dashTap) {
        // second tap: dash
        const dashDir = m.mag > 0.15 ? dir.clone().setY(0).normalize() : p.forward();
        if (p.vert) dashDir.y = 0.45 * p.vert;
        if (p.tryDash(dashDir)) CameraRig.onDash();
      } else {
        // first tap: start running (keep holding to keep running)
        p.startRun();
      }
    }
    if (Input.consume('vanish')) {
      if (p.tryVanish(e)) CameraRig.snapBehind(p, e);
      else if (p.energy < TUNING.vanishCost) toast('Need 20 energy');
    }
    // Input buffer (up to two taps): rhythmic taps chain jab -> cross -> hook -> launcher
    // Each button press is an ordered beat. Mash inputs may queue up to three
    // follow-ups; animation states must finish before the next beat starts.
    if (Input.consume('melee')) { p.meleeQ = Math.min(3, (p.meleeQ || 0) + 1); p.meleeBuf = TUNING.meleeBuffer; }
    if (p.meleeBuf > 0) {
      p.meleeBuf -= dt;
      if (p.meleeBuf <= 0) p.meleeQ = 0;
      if (p.stun > 0 || p.launched || p.hp <= 0) { p.meleeQ = 0; p.meleeBuf = 0; }
      else if (p.meleeCd <= 0 && p.punchT <= 0 && !p.kickPend) {
        p.meleeQ--; p.meleeBuf = p.meleeQ > 0 ? TUNING.meleeBuffer : 0;
        // holding Down in the air turns Melee into a ground slam, unless the rival is right next to you in the air
        const airFoe = e.flying && p.pos.distanceTo(e.pos) < TUNING.meleeRange + 0.5;
        if (!(p.vert < 0 && !airFoe && p.trySlam(e))) Combat.melee(p, e);
      }
    }
    // Blast: hold to charge, release to fire (handled by the fighter); a tap too quick to register as held fires straight away
    p.chargeTarget = e; p.chargeAim = this.mode==='dojo' && !this.dojoRival ? 'facing' : CameraRig.isLockActive() ? 'target' : 'facing';
    p.chargeHeld = Input.blastHeld();
    if (Input.consume('blast') && !p.chargeHeld && !p.charging) Combat.blast(p, e, p.chargeAim);
    if (Input.consume('awaken') && !p.tryAwaken()) toast(p.awakened ? 'Already awakened' : p.awakenChargeT > 0 ? 'Powering up' : p.awakenGauge < 100 ? 'Build awakening power by fighting' : 'Cannot awaken while stunned');
  },

  update(dt) {
    if (typeof CharacterWorkshop !== "undefined") CharacterWorkshop.tick(dt);
    if (this.koT > 0 || this.introT > 0) { this.player.blockHeld = this.enemy.blockHeld = false; this.player.chargeHeld = this.enemy.chargeHeld = false; this.player.moveIntent.set(0, 0, 0); this.player.vert = 0; this.enemy.moveIntent.set(0, 0, 0); this.enemy.vert = 0; }
    else { this.handlePlayerInput(dt); if (this.mode!=='dojo' || this.dojoRival) RivalAI.update(dt, this.enemy, this.player); }
    this.player.update(dt);
    if (this.mode!=='dojo' || this.dojoRival) this.enemy.update(dt);
    if (this.mode==='dojo') { Dojo.resolveCollisions(this.player); Dojo.update(dt); }
    // keep fighters from overlapping
    const sep = this.enemy.pos.clone().sub(this.player.pos); const d = sep.length();
    if ((this.mode!=='dojo' || this.dojoRival) && d < 1.1 && d > 0.0001) { sep.multiplyScalar((1.1 - d) / d / 2); this.enemy.pos.add(sep); this.player.pos.sub(sep); }
    Combat.update(dt); Effects.update(dt); Spectacle.update(dt);
    if (this.combo.t > 0) { this.combo.t -= dt; if (this.combo.t <= 0) $('comboBox').classList.remove('show'); }
    if (this.training) {
      // rival refills after a short break; you get near-unlimited energy to practise with
      const e = this.enemy; e.hurtT += dt;
      if (e.hurtT > 1.6 && e.hp < 100) e.hp = Math.min(100, e.hp + 60 * dt);
      const pl = this.player; pl.hurtT += dt;
      if (pl.hurtT > 1.6 && pl.hp < 100) pl.hp = Math.min(100, pl.hp + 60 * dt);
      this.player.energy = Math.min(100, this.player.energy + 30 * dt);
    }
    if (!this.training && (this.player.hp <= 0 || this.enemy.hp <= 0) && !this.koT) {
      this.koT = 1.4; Input.reset(); this.banner('K.O.', 'ko'); $('controls').classList.add('hidden');
    }
    // round clock
    if (this.timed && !this.koT && this.introT <= 0 && this.timeLeft > 0) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft <= 0) { this.timeUp = true; this.koT = 1.4; Input.reset(); this.banner('Time', 'time'); $('controls').classList.add('hidden'); }
    }
  },

  updateHUD() {
    const p = this.player, e = this.enemy;
    $('pHp').style.width = p.hp + '%'; $('pEn').style.width = p.energy + '%';
    $('pSt').style.width = (p.stamina || 0) + '%';
    $('eHp').style.width = e.hp + '%'; $('eEn').style.width = e.energy + '%';
    $('eSt').style.width = (e.stamina || 0) + '%';
    $('pGd').style.width = p.guard + '%'; $('eGd').style.width = e.guard + '%';
    $('pStBar').classList.toggle('low', p.exhausted || p.stamina < 24);
    $('eStBar').classList.toggle('low', e.exhausted || e.stamina < 24);
    $('pGdBar').classList.toggle('low', p.guard < 30); $('eGdBar').classList.toggle('low', e.guard < 30);
    $('pGdBar').classList.toggle('active', p.blocking); $('eGdBar').classList.toggle('active', e.blocking);
    document.querySelector('.cbtn.block').classList.toggle('on', p.blocking);
    const bb = document.querySelector('.cbtn.blast');
    const mb = document.querySelector('.cbtn.melee');
    const step = p.t - p.lastMelee > TUNING.comboWindow ? 0 : p.combo;
    const follow = p.comboFollow && p.comboFollow.until >= p.t && p.comboFollow.target &&
      (p.comboFollow.phase===3?p.comboFollow.target.meteorWindow>0:p.comboFollow.target.launched&&!p.comboFollow.target.spiked);
    mb.classList.toggle('combo-ready', (step > 0 || follow) && p.stun <= 0);
    $('meleeHint').textContent = follow ? (p.comboFollow.phase === 1 ? 'FOLLOW: UPPERCUT' : p.comboFollow.phase === 2 ? 'METEOR KICK' : 'FALLING FIST!') :
      step ? `${step + 1}/4 · ${step === 3 ? 'LAUNCHER' : step === 2 ? 'VARIED STRIKE' : 'chain'}` : '4-hit combo';
    bb.style.setProperty('--charge', p.charging ? Math.max(0.04, p.chargeLevel) : 0);
    bb.classList.toggle('charging', p.charging); bb.classList.toggle('full', p.chargeFull);
    // white "recent damage" bar drains after a short delay
    this.lag.p = Math.max(p.hp, this.lag.p - (this.lag.p > p.hp ? 0.6 : 0)); this.lag.e = Math.max(e.hp, this.lag.e - (this.lag.e > e.hp ? 0.6 : 0));
    $('pLag').style.width = this.lag.p + '%'; $('eLag').style.width = this.lag.e + '%';
    $('pHpNum').textContent = Math.ceil(p.hp); $('eHpNum').textContent = Math.ceil(e.hp);
    document.body.classList.toggle('low-hp', p.hp > 0 && p.hp < 25);
    const awReady = p.awakenGauge >= TUNING.awakenGaugeMax;
    const trans = p.awakenChargeT > 0;
    $('pEnBar').classList.toggle('ready', awReady && !p.awakened);
    const ag = $('pAwGauge'); ag.style.width = (trans ? p.awakenChargeProgress * 100 : p.awakened ? 100 : p.awakenGauge) + '%';
    const am = $('pAwMeter'); am.classList.toggle('ready', awReady && !p.awakened); am.classList.toggle('transforming', trans);
    $('awakenTag').textContent = trans ? 'POWER RISING  ' + Math.round(p.awakenChargeProgress * 100) + '%' : 'AWAKENED';
    const ab = document.querySelector('.cbtn.awaken');
    ab.classList.toggle('charging', trans); ab.classList.toggle('ready', awReady && !p.awakened);
    ab.classList.toggle('gone', p.awakened && !trans);
    ab.querySelector('span').textContent = trans ? 'POWERING' : awReady ? 'AWAKEN!' : 'POWER';
    ab.querySelector('small').textContent = trans ? Math.round(p.awakenChargeProgress * 100) + '%' : awReady ? 'tap to transform' : Math.round(p.awakenGauge) + '%';
    ab.style.setProperty('--awaken', (trans ? p.awakenChargeProgress * 100 : p.awakenGauge) + '%');
    const sl = $('speedLines'); sl.style.opacity = 0; // no radial meteor/speed cone
    const cm = $('camMode');
    const locked = CameraRig.isLockActive();
    const mode = p.moving || (this.lockOn && !locked) ? 'dash' : locked ? 'locked' : 'free';
    cm.className = 'cam-mode ' + mode;
    cm.textContent = mode === 'dash' ? (this.lockOn ? 'Dash · lock released' : 'Dash · free camera') : locked ? 'Locked on · tap to free' : 'Free camera · tap to lock';
    $('awakenTag').classList.toggle('hidden', !p.awakened && !trans);
    const tm = $('roundTimer'); tm.classList.toggle('hidden', !this.timed);
    if (this.timed) { const s = Math.ceil(this.timeLeft); tm.textContent = s; tm.classList.toggle('low', s <= 10 && this.timeLeft > 0); }
    const tr = Settings.get('rival');
    $('trainTag').classList.toggle('hidden', !this.training);
    if (this.training) $('trainTag').textContent = !this.dojoRival ? 'DOJO · Solo practice' : tr === 'moving' ? 'DOJO · Moving partner' : tr === 'attacks' ? 'DOJO · Sparring' : 'DOJO · Still partner';
    const gb = document.querySelector('.cbtn.block');
    gb.classList.toggle('novanish', p.energy < (p.guardCounterWindow > 0 ? 13 : TUNING.vanishCost) || p.vanishCd > 0);
    gb.classList.toggle('counter-ready', p.guardCounterWindow > 0 && p.vanishCd <= 0);
    gb.querySelector('small').textContent = p.guardCounterWindow > 0 ? '2× COUNTER' : '2× vanish';
    // Awaken only shows up when it can be used
    // Awakening power button stays visible while filling, then changes state.
    // off-screen rival arrow
    const arrow = $('rivalArrow');
    const v = e.center.project(camera);
    const behind = v.z > 1;
    const off = behind || Math.abs(v.x) > 0.95 || Math.abs(v.y) > 0.95;
    arrow.classList.toggle('hidden', !off || this.state !== 'playing' || (this.mode==='dojo' && !this.dojoRival));
    if (off) {
      let x = v.x, y = v.y; if (behind) { x = -x; y = -y; }
      const a = Math.atan2(y, x); const ex = Math.cos(a), ey = Math.sin(a);
      const k = 0.85 / Math.max(Math.abs(ex), Math.abs(ey));
      const sx = (ex * k * 0.5 + 0.5) * innerWidth, sy = (-ey * k * 0.5 + 0.5) * innerHeight;
      arrow.style.left = (sx - 11) + 'px'; arrow.style.top = (sy - 10) + 'px';
      arrow.style.transform = `rotate(${Math.PI / 2 - a}rad)`;
    }
  },

  _last: performance.now(), _fpsAcc: 0, _fpsN: 0,
  loop(now) {
    // Schedule the next frame even if an unexpected gameplay error occurs.
    // Otherwise one bad animation event silently freezes the entire browser tab.
    try {
    const real = Math.min(0.05, (now - this._last) / 1000); this._last = now;
    let dt = real;
    if (this.state === 'playing') {
      // hit-stop: a few frames of near-freeze on impact; KO: slow motion before the result screen
      if (this.hitStopT > 0) { this.hitStopT -= real; dt *= 0.08; }
      if (this.introT > 0) { const was = this.introT; this.introT -= real; if (this.introT <= 0) { this.introT = 0; this.banner('FIGHT!', 'fight'); } }
      if (this.koT > 0) { dt *= this.timeUp ? 0.6 : 0.3; this.koT -= real; if (this.koT <= 0) { this.koT = 0; this.endRound(); } }
      if (this.state === 'playing') this.update(dt);
    }
    if (this.state === 'between') { this.betweenT -= real; if (this.betweenT <= 0) this.startRound(); }
    if (this.state === 'playing' || this.state === 'over' || this.state === 'between') {
      if (this.state !== 'playing') { this.player.animate(real); this.enemy.animate(real); Effects.update(real); }
      CameraRig.update(this.state === 'playing' ? real : real * 0.3); this.updateHUD();
    }
    else if (this.state === 'title') { CameraRig.rig.yaw += real * 0.15; this.player.animate(real); this.enemy.animate(real); CameraRig.update(real); }
    // paused: simulation and camera frozen; scene still renders behind the blur
    if (this.state !== 'paused') Arena.update(real);
    sun.position.set(this.player.pos.x + 45, 60, this.player.pos.z + 30); sun.target.position.copy(this.player.pos);
    // V104: after controllers are actually installed, reveal each newly
    // decoded Kairo VRM only after 18 frames of the COMPLETE final pose.
    // A late model can otherwise suddenly expose a T-pose even if the
    // splash-screen watchdog has already released the playable fallback.
    if(window.SKY_V104_ANIMATIONS_READY&&this.state!=='paused'){
      for(const fighter of [this.heroes?.kairo_venn,this.enemy]){
        const rig=fighter?.vrmRig;
        if(!rig?.startupPoseHidden||
           (fighter!==this.player&&fighter!==this.enemy))continue;
        rig.startupPoseFrames++;
        if(rig.startupPoseFrames>=18){
          rig.vrm.scene.visible=true;
          rig.startupPoseHidden=false;
        }
      }
    }
    renderer.render(scene, camera);
    if (Settings.get('fps')) { this._fpsAcc += dt; this._fpsN++; if (this._fpsAcc > 0.5) { $('fps').textContent = Math.round(this._fpsN / this._fpsAcc) + ' fps'; this._fpsAcc = 0; this._fpsN = 0; } }
    } catch (err) {
      this.lastRuntimeError = String(err && err.stack || err);
      console.error('Sky Clash recovered from a frame error', err);
      // Stop broken simulation until player resumes; render/menus keep running.
      if (this.state === 'playing') {
        try { this.pause(); } catch (ignore) { this.state = 'paused'; }
        try { toast('A game error was caught — pause to recover'); } catch (ignore) {}
      }
    } finally {
      this._last = now;
      requestAnimationFrame(t => this.loop(t));
    }
  },
};

Game.init();
requestAnimationFrame(t => { Game._last = t; Game.loop(t); });
window.SkyClash = { Effects, Game, CameraRig, Settings, Input, Combat, TUNING, camera };
})();


