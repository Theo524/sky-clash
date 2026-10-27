/* Real-model Storm Fist sequence QA. No post-animation bone injection.
 * Run from a served checkout; PLAYTEST_BASE_URL also accepts published Pages.
 * Output is local evidence, not a claim of player aesthetic approval.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const base=(process.env.PLAYTEST_BASE_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const output=path.resolve(process.env.STORM_QA_OUTPUT||'visual-review-output/kairo-storm-fist');
const film=process.env.STORM_QA_FILM!=='0';
const combatFlag=process.env.STORM_QA_COMBAT_FLAG||'storm-fist-v1';
const videoFps=Number(process.env.STORM_QA_VIDEO_FPS||30);
assert([15,30,60].includes(videoFps),'STORM_QA_VIDEO_FPS must be 15,30 or 60');
const skipMoves=process.env.STORM_QA_SKIP_MOVES==='1';
const showcase=process.env.STORM_QA_SHOWCASE==='1';
const captureAudio=process.env.STORM_QA_AUDIO==='1';
const audioSegments=[];
const skipSequence=process.env.STORM_QA_SKIP_SEQUENCE==='1';
const selectedMoves=process.env.STORM_QA_MOVES?.split(',').map(x=>x.trim()).filter(Boolean)||null;
const bones=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json').bones;

async function main(){
 fs.mkdirSync(output,{recursive:true});
 const launch={headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle',
  '--use-angle=swiftshader','--ignore-gpu-blocklist']};
 if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
 else if(fs.existsSync('/usr/bin/chromium'))launch.executablePath='/usr/bin/chromium';
 const browser=await chromium.launch(launch);
 const page=await browser.newPage({viewport:{width:960,height:720}});
 if(captureAudio)await installAudioCapture(page);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  const response=await page.goto(base+'?combatAnim='+encodeURIComponent(combatFlag),{waitUntil:'domcontentloaded'});
  assert(response.ok(),'Game entry is unavailable');
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPublishedActions?.ready&&
   window.SkyClashPublishedActions?.nativePlaytest?.state==='ready'&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid&&
   window.SkyClash?.Game?.enemy?.vrmRig?.vrm?.humanoid,null,{timeout:180000});
  const loaded=await page.evaluate(()=>({revision:window.SkyClashPublishedActions.nativeCombatSet.revision,
   clips:Object.keys(window.SkyClashPublishedActions.nativeCombatSet.clips)}));
  const packFile='assets/animations/kairo/'+(combatFlag==='storm-fist-v3'?'storm-fist.v3.json':'storm-fist.v1.json');
  const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const localPack=JSON.parse(fs.readFileSync(packFile,'utf8'));
  assert.equal(loaded.revision,localPack.revision,'Browser did not load the expected native revision');
  fs.writeFileSync(path.join(output,'capture-manifest.json'),JSON.stringify({
   recordedAt:new Date().toISOString(),base,combatFlag,revision:loaded.revision,clipIds:loaded.clips,
   sourceSha256:localPack.sourceSha256,packSha256:sha(packFile),modelSha256:localPack.modelSha256,
   videoFps,audio:captureAudio?'actual game synth at movie clock':'silent',
   runtimeSha256:Object.fromEntries(['js/game.js','js/v72-published-actions.js','js/v81-pose-transitions.js']
    .map(file=>[file,sha(file)]))},null,2));
  console.log('Loaded actual Kairo review',loaded.revision,loaded.clips.length,'clips; source',localPack.sourceSha256);
  await page.locator('#trainBtn').click();
  await page.waitForFunction(()=>!document.getElementById('titleScreen').classList.contains('show'));
  await page.evaluate(({bones})=>{
   const s=window.SkyClash,g=s.Game,p=g.player,e=g.enemy,T=window.THREE;
   const cameraUpdate=s.CameraRig.update;
   g.update=()=>{};s.CameraRig.update=()=>{};window.requestAnimationFrame=()=>0;
   g.mode='dojo';g.dojoRival=true;g.training=true;g.introT=0;
   const cv=document.querySelector('canvas');
   if(!(cv.getContext('webgl2')||cv.getContext('webgl')))throw Error('WebGL unavailable');
   if(p.characterId!=='kairo_venn')throw Error('Real Kairo was not selected');
   const observe=f=>{
    const rig=f.vrmRig.vrm,h=rig.humanoid;rig.scene.updateMatrixWorld(true);
    const world=n=>h.getNormalizedBoneNode(n).getWorldPosition(new T.Vector3()).toArray();
    const nodes=bones.map(n=>h.getNormalizedBoneNode(n));
    const native=f.v72StudioPack,nativeClip=window.SkyClashPublishedActions.nativeCombatSet?.clips[native.nativeClipId];
    return {native:!!native.nativePreviewActive,
     clip:f.v72StudioPack.nativeClipId||null,time:f.v72StudioPack.nativePreviewTime,
     support:f.v72StudioPack.nativeSupportCorrection||null,slot:f.v72StudioPack.slot,
     supportFeet:nativeClip?.sampleSupport(native.nativePreviewTime)||null,
     entryAge:native.nativeAge||0,air:!!(f.attackAir||f.flying||f.jumping),
     airOwner:!!window.SkyClashV100Animator?.ownsAir(f),floor:f.floor,
     serial:f.attackSerial,kind:f.attackKind,elapsed:f.attackElapsed,total:f.attackTotal,
     punchT:f.punchT,cd:f.meleeCd,hp:f.hp,stun:f.stun,blocking:f.blocking,
     launched:f.launched,spiked:f.spiked,downT:f.downT,
     follow:f.comboFollow?f.comboFollow.phase:null,
     root:f.pos.toArray(),chest:world('upperChest'),leftHand:world('leftHand'),rightHand:world('rightHand'),
     leftFoot:world('leftFoot'),rightFoot:world('rightFoot'),
     quaternions:nodes.map(n=>n.quaternion.toArray())};
   };
   const reset=(distance=1.45,cycle=0)=>{
    s.Effects.clear();s.Spectacle.clear();p.reset();e.reset();
    if(p.nativeCombatReaction!==null||p.nativeCombatParry!==null)
     throw Error('Fighter.reset retained a native combat event');
    for(const [f,z]of[[p,0],[e,distance]]){
     f.pos.set(0,f.floor,z);f.spawn.copy(f.pos);f.vel.set(0,0,0);f.moveIntent.set(0,0,0);
     f.t=12;f.lastMelee=-20;f.attackSerial=0;f.comboCycle=cycle;f.combo=0;
     f.meleeCd=0;f.comboFollow=null;f.punchT=0;f.stun=0;f.downT=0;
     f.launched=false;f.spiked=false;f.blockHeld=false;f.blocking=false;
     f.hp=100;f.invulnT=0;f.lastBlockEnd=-20;f.riposteT=0;
     if(f.v72StudioPack){f.v72StudioPack.slot=null;f.v72StudioPack.clock=0;}
    }
    p.facing=0;e.facing=Math.PI;
    for(let i=0;i<90;i++){p.animate(1/60);e.animate(1/60);}
   };
   const tick=dt=>{
    p.update(dt);e.update(dt);
    // Retain Game.update's actual body separation. Deterministic input and
    // AI isolation must not allow closer contact than the playable game.
    const sep=e.pos.clone().sub(p.pos),distance=sep.length();
    if((g.mode!=='dojo'||g.dojoRival)&&distance<1.1&&distance>.0001){
     sep.multiplyScalar((1.1-distance)/distance/2);e.pos.add(sep);p.pos.sub(sep);
    }
    s.Combat.update(dt);s.Effects.update(dt);s.Spectacle.update(dt);
   };
   const q={s,g,p,e,T,bones,observe,reset,tick,cameraUpdate,strikeEvents:[]};
   // Film clocks must follow simulation, not slow screenshot wall time.
   q.filmTick=(real,input=false)=>{
    let dt=real;if(g.hitStopT>0){g.hitStopT=Math.max(0,g.hitStopT-real);dt*=.08;}
    const serial=p.attackSerial;if(input)g.handlePlayerInput(dt);
    if(input&&p.attackSerial!==serial)q.filmStarts++;
    window.__stormAudioClock=(window.__stormAudioClock||0)+real;
    tick(dt);q.filmTime=(q.filmTime||0)+real;
   };
   q.queueBeat=maximum=>{
    if(q.filmStarts>=maximum||q.queuedSerial===p.attackSerial)return;
    if(p.punchT>0&&p.attackElapsed<p.attackTotal*.52)return;
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyJ',key:'j'}));
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyJ',key:'j'}));
    q.queuedSerial=p.attackSerial;
   };
   q.render=()=>g.loop(g._last||0);
   window.__stormQA=q;
   const realStrike=s.Combat.strike;
   s.Combat.strike=function(attacker,target,...args){
    const before={attacker:observe(attacker),target:observe(target)},hp=target.hp;
    const result=realStrike.call(this,attacker,target,...args);
    if(target.hp<hp)q.strikeEvents.push({attacker:attacker===p?'player':'enemy',
     stage:args[1]||0,damage:hp-target.hp,before,
     after:{attacker:observe(attacker),target:observe(target)}});
    return result;
   };
  },{bones});
  const reports=[];
  for(const fps of (process.env.STORM_QA_VISUAL_ONLY==='1'?[]:[30,60,120])){
   const report=await page.evaluate(({fps})=>{
    const q=window.__stormQA,{p,e,s,reset,observe,tick}=q,dt=1/fps;
    const chain=(cycle,distance,maximum)=>{
     reset(distance,cycle);q.strikeEvents.length=0;
     const idle=observe(p),frames=[],starts=[],impacts=[];
     let lastHp=e.hp,waiting=0;
     for(let i=0;i<Math.ceil(fps*7.4);i++){
      if(starts.length<maximum&&p.stun<=0){
       const before=p.attackSerial;s.Combat.melee(p,e,window.SkyClashPublishedActions.nativeCombatSet.revision==='storm-fist-v3');
       if(p.attackSerial!==before)starts.push({tick:i,kind:p.attackKind,follow:p.comboFollow?.phase||null});
      }
      tick(dt);const f=observe(p);f.target=observe(e);frames.push(f);
      if(e.hp<lastHp){
       const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
       const strikePoints=['rising-kick','roundhouse','side-kick','sky-kick'].includes(f.clip)?
        [f.leftFoot,f.rightFoot]:[f.leftHand,f.rightHand];
       const event=q.strikeEvents.filter(event=>event.attacker==='player').at(-1);
       const beforePoints=event?(['rising-kick','roundhouse','side-kick','sky-kick'].includes(f.clip)?
        [event.before.attacker.leftFoot,event.before.attacker.rightFoot]:
        [event.before.attacker.leftHand,event.before.attacker.rightHand]):[];
       impacts.push({tick:i,damage:lastHp-e.hp,clip:f.clip,
        beforeStrike:event?{elapsed:event.before.attacker.elapsed,
         rootSeparation:distance(event.before.attacker.root,event.before.target.root),
         nearestStrikeJointToChest:Math.min(...beforePoints.map(point=>distance(point,event.before.target.chest)))}:null,
        nearestStrikeJointToChest:Math.min(...strikePoints.map(point=>distance(point,f.target.chest))),
        rootSeparation:p.pos.distanceTo(e.pos)});lastHp=e.hp;
      }
      if(starts.length===maximum&&p.punchT<=0&&p.meleeCd<=0){waiting+=dt;if(waiting>.55)break;}
     }
     return {idle,starts,impacts,frames,recovery:observe(p)};
    };
    const combo=chain(0,1.45,7),alternate=chain(1,1.45,4),whiff=chain(0,20,4);
    reset();s.Combat.melee(p,e);const interrupted=[];
    for(let i=0;i<Math.ceil(fps*.8);i++){
     if(i*dt>=.12&&p.stun<=0&&i*dt<.12+dt){p.stun=.3;}
     tick(dt);interrupted.push(observe(p));
    }
    // Exercise genuine incoming hit events from meaningful outgoing poses.
    // In the contact cases strike a fraction before the attack's own active
    // event, so the enemy has not already been stunned by that same blow.
    const handoffs=[];
    for(const from of ['original-jab','original-cross','original-hook','guard']){
     for(const phase of ['windup','contact']){
      reset(1.45,1);q.strikeEvents.length=0;
      const guarded=from==='guard';
      if(guarded)p.blockHeld=true;
      else{
       p.combo={'original-jab':0,'original-cross':1,'original-hook':2}[from];
       p.lastMelee=p.t;s.Combat.melee(p,e);
      }
      const outgoing=window.SkyClashPublishedActions.nativeCombatSet.clips[from];
      const contact=guarded?.35:outgoing.impactSeconds*(p.attackTotal/outgoing.durationSeconds);
      const deadline=guarded?(phase==='windup'?.08:.35):phase==='windup'?contact*.45:contact-.0001;
      let elapsed=0;
      while(elapsed<deadline-1e-10){const step=Math.min(dt,deadline-elapsed);tick(step);elapsed+=step;}
      const before=observe(p),serial=p.attackSerial,hp=p.hp;
      // A settled guard is broken by a real heavy strike, rather than by
      // assigning stun. The early guard case remains a real successful parry.
      if(guarded&&phase==='contact')p.guard=1;
      e.facing=Math.atan2(p.pos.x-e.pos.x,p.pos.z-e.pos.z);
      s.Combat.strike(e,p,false,guarded&&phase==='contact'?2:0);
      const frames=[before],damage=hp-p.hp;
      for(let i=0;i<Math.ceil(fps*1.7);i++){
       if(guarded&&i*dt>=.5)p.blockHeld=false;
       tick(dt);frames.push(observe(p));
      }
      handoffs.push({id:from+'-'+phase,from,phase,serial,hitElapsed:before.elapsed,
       before,damage,expectedClip:guarded?(phase==='windup'?'parry':'hit-heavy'):'hit-light',
       frames,recovery:observe(p)});
     }
    }
    const defenses=[];
    for(const mode of ['guard','parry','hit-light','hit-heavy','hit-left','hit-right']){
     reset();p.blockHeld=mode==='guard'||mode==='parry';
     if(mode==='hit-left')e.pos.set(-1.2,e.floor,0);
     if(mode==='hit-right')e.pos.set(1.2,e.floor,0);
     e.facing=Math.atan2(p.pos.x-e.pos.x,p.pos.z-e.pos.z);
     for(let i=0;i<Math.ceil(fps*(mode==='guard'?.35:.025));i++)tick(dt);
     const before=p.hp;s.Combat.strike(e,p,false,mode==='hit-heavy'?2:0);
     const frames=[];for(let i=0;i<Math.ceil(fps*.8);i++){tick(dt);frames.push(observe(p));}
     defenses.push({mode,damage:before-p.hp,frames});
    }
    reset();p.pos.y+=2.4;e.pos.y+=2.4;p.combo=3;p.lastMelee=p.t;
    p.animate(dt);e.animate(dt);s.Combat.melee(p,e);
    const aerial=[];for(let i=0;i<Math.ceil(fps*1.2);i++){tick(dt);aerial.push(observe(p));}
    const kicks=[];
    for(const id of ['roundhouse','side-kick']){
     reset();p.combo=3;p.lastMelee=p.t;
     p.moveIntent.set(id==='roundhouse'?1:0,0,id==='side-kick'?1:0);
     s.Combat.melee(p,e);tick(dt);
     // Steering after entry cannot swap the selected fourth-beat clip.
     p.moveIntent.set(id==='roundhouse'?0:1,0,id==='side-kick'?0:1);
     const frames=[observe(p)];
     for(let i=1;i<Math.ceil(fps*1.2);i++){tick(dt);frames.push(observe(p));}
     kicks.push({id,frames});
    }
    reset();const before=p.pos.clone();p.moveIntent.set(1,0,0);
    for(let i=0;i<Math.ceil(fps*.8);i++)tick(dt);
    return {fps,combo,alternate,whiff,interrupted,handoffs,defenses,aerial,kicks,
     movement:p.pos.distanceTo(before),runtimeError:q.g.lastRuntimeError||null};
   },{fps});
   fs.writeFileSync(path.join(output,`gameplay-${fps}hz.json`),JSON.stringify(report,null,2));
   reports.push(report);
   const motion=measureMotion(report.combo.frames,fps);
   report.motion=motion;
   console.log('Storm Fist replay',fps,'Hz',JSON.stringify({
    starts:report.combo.starts,clips:[...new Set(report.combo.frames.filter(x=>x.native).map(x=>x.clip))],
    hits:report.combo.impacts.length,motion,defenses:report.defenses.map(x=>({mode:x.mode,damage:x.damage,
     clips:[...new Set(x.frames.filter(f=>f.native).map(f=>f.clip))]}))}));
  }
  const failures=[];
  for(const r of reports){
   const check=(condition,message)=>{if(!condition)failures.push(r.fps+'Hz: '+message);};
   const has=(frames,id)=>frames.some(f=>f.native&&f.clip===id);
   check(!r.runtimeError,'Runtime error '+r.runtimeError);
   check(r.combo.starts.length===7,'Full seven-beat sequence did not complete');
   for(const id of ['original-jab','original-cross','original-hook','rising-kick','sky-uppercut','sky-kick','falling-fist'])
    check(has(r.combo.frames,id),'Missing combo clip '+id);
   check(has(r.alternate.frames,'original-overhand'),'Alternate overhand missing');
   check(has(r.aerial,'air-strike'),'Free aerial attack missing');
   check(r.combo.impacts.length>=6,'Complete combo did not connect');
   check(r.whiff.impacts.length===0,'Distant attack caused damage');
   check(r.movement>.05,'Recovered movement failed');
   check(r.combo.recovery.slot==='idle'&&!r.combo.recovery.native,'Combo did not recover to unchanged idle');
   for(const d of r.defenses){
    // Hit direction names describe the defender's recoil. A blow from
    // the left sends the body right, and vice versa.
    const id=d.mode==='hit-left'?'hit-right':d.mode==='hit-right'?'hit-left':d.mode;
    check(has(d.frames,id),'Missing defense/reaction clip '+id);
    check(d.mode==='parry'?d.damage===0:d.mode==='guard'?d.damage>0&&d.damage<5:d.damage>0,
     'Incorrect defense damage '+d.mode+': '+d.damage);
   }
   for(const kick of r.kicks){
    check(has(kick.frames,kick.id),'Directional finisher missing '+kick.id);
    check(kick.frames.filter(f=>f.native&&f.punchT>0).every(f=>f.clip===kick.id),
     'Steering changed finisher mid-swing: '+kick.id);
   }
   for(const handoff of r.handoffs){
    check(handoff.before.native&&handoff.before.clip===handoff.from,
     'Incoming hit did not start from requested pose '+handoff.id);
    check(has(handoff.frames.slice(1),handoff.expectedClip),
     'Incoming hit missed expected reaction '+handoff.id+' -> '+handoff.expectedClip);
    check(handoff.expectedClip==='parry'?handoff.damage===0:handoff.damage>0,
     'Real incoming hit/parry did not resolve '+handoff.id);
    if(handoff.from!=='guard'){
     check(handoff.frames.slice(1).every(f=>
      !(f.native&&f.clip===handoff.from&&f.serial===handoff.serial)),
      'Cancelled attack resurrected after genuine hit '+handoff.id);
    }
    const recovery=handoff.recovery;
    // A real heavy guard break retains its existing upward knock. Kairo's
    // unchanged flight controller can settle above the height threshold,
    // where V100 owns the recovered hover and V72 correctly has no idle slot.
    const recoveredAir=handoff.id==='guard-contact'&&recovery.air&&recovery.airOwner&&
     recovery.stun===0&&recovery.punchT===0&&!recovery.launched&&!recovery.spiked&&!recovery.downT;
    check(!recovery.native&&(recovery.slot==='idle'||recoveredAir),
     'Genuine hit did not yield to original idle/air owner '+handoff.id);
   }
   const all=[...r.combo.frames,...r.alternate.frames,...r.aerial,
    ...r.defenses.flatMap(d=>d.frames),...r.kicks.flatMap(k=>k.frames),
    ...r.handoffs.flatMap(h=>h.frames)];
   check(all.every(f=>f.quaternions.flat().every(Number.isFinite)),'Nonfinite joint pose');
   check(all.every(f=>f.quaternions.every(q=>Math.abs(Math.hypot(...q)-1)<1e-4)),
    'Nonunit joint rotation');
   check(r.interrupted.filter(f=>f.elapsed>=.12+1/r.fps).every(f=>f.clip!=='original-jab'||!f.native),
    'Interrupted jab was resurrected');
  }
  if(film){
   if(combatFlag==='storm-fist-v3'&&(!skipSequence||showcase))await verifyQueuedFilmInput(page);
   if(!skipSequence)await captureFilm(page);if(showcase)await captureShowcase(page);
   if(captureAudio)await finishAudioCapture(page);
   if(!skipMoves)await captureMoves(page);}
  const result={status:failures.length?'FAIL':'PASS',base,combatFlag,videoFps,errors,failures,
   reports:reports.map(r=>({fps:r.fps,starts:r.combo.starts,
    clips:[...new Set(r.combo.frames.filter(f=>f.native).map(f=>f.clip))],
    contacts:r.combo.impacts,movement:r.movement,motion:r.motion,
    handoffs:r.handoffs.map(h=>({id:h.id,damage:h.damage,expectedClip:h.expectedClip,
     clips:[...new Set(h.frames.filter(f=>f.native).map(f=>f.clip))],
     recovery:{native:h.recovery.native,slot:h.recovery.slot,air:h.recovery.air,
      airOwner:h.recovery.airOwner}}))})),
   limitations:['Numeric validation does not establish animation aesthetics',
    'Pre-strike geometry uses the previous rendered animation tick before hit/knockback; post-tick distances include defender physics',
    'Contact distances refer to skeleton geometry; inspect real-model frames for surface contact']};
  fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(result,null,2));
  assert.deepEqual(errors,[],'Uncaught browser errors');
  assert.deepEqual(failures,[],'Storm Fist sequence failures');
  console.log(process.env.STORM_QA_VISUAL_ONLY==='1'?'PASS focused real Kairo visual recapture':
   'PASS real Kairo Storm Fist sequences at 30/60/120Hz');
 }finally{await browser.close();}
}

function measureMotion(frames,fps){
 const angle=(a,b)=>2*Math.acos(Math.min(1,Math.abs(a.reduce((v,q,i)=>v+q*b[i],0))));
 const result={maximumJointStepRadians:0,maximumJointSpeedRadiansPerSecond:0,
  transitionSteps:[],minimumGroundFootWorldY:null,minimumGroundAnkleHeight:null,
  maximumPlantedFootDrift:0,maximumSupportCorrection:0};
 const anchors={left:null,right:null};
 for(let i=1;i<frames.length;i++){
  const a=frames[i-1],b=frames[i],step=Math.max(...a.quaternions.map((q,n)=>angle(q,b.quaternions[n])));
  result.maximumJointStepRadians=Math.max(result.maximumJointStepRadians,step);
  result.maximumJointSpeedRadiansPerSecond=Math.max(result.maximumJointSpeedRadiansPerSecond,step*fps);
  if(a.clip!==b.clip&&a.native&&b.native)result.transitionSteps.push({from:a.clip,to:b.clip,radians:step});
  if(b.native&&['original-jab','original-cross','original-hook','original-overhand','rising-kick'].includes(b.clip)){
   const y=Math.min(b.leftFoot[1],b.rightFoot[1]);
   result.minimumGroundFootWorldY=result.minimumGroundFootWorldY===null?y:Math.min(result.minimumGroundFootWorldY,y);
   const height=y-b.floor;
   result.minimumGroundAnkleHeight=result.minimumGroundAnkleHeight===null?height:Math.min(result.minimumGroundAnkleHeight,height);
  }
  result.maximumSupportCorrection=Math.max(result.maximumSupportCorrection,Number(b.support)||0);
  for(const side of ['left','right']){
   if(!b.native||b.air||b.clip==='original-jab'||!b.supportFeet?.[side]||b.entryAge<.07||a.serial!==b.serial||a.clip!==b.clip){
    anchors[side]=null;continue;
   }
   const foot=b[side+'Foot'];
   if(!anchors[side])anchors[side]=foot;
   result.maximumPlantedFootDrift=Math.max(result.maximumPlantedFootDrift,
    Math.hypot(...foot.map((v,n)=>v-anchors[side][n])));
  }
 }
 return result;
}

// No animation pose is injected: these captures drive actual Combat and Fighter
// updates. Fixed views are for silhouette review; the showcase also uses the
// actual game camera. JPEG cadence equals video cadence, with 60Hz simulation.
async function installAudioCapture(page){
 await page.addInitScript(()=>{
  // Render the actual game's synth calls offline at the movie clock. A slow
  // software GPU must not insert seconds of silence between two real hits.
  window.__stormAudioClock=0;window.__stormAudioContexts=[];
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  class MovieAudioContext extends Offline{
   constructor(){super(2,44100*60,44100);window.__stormAudioContexts.push(this);}
   get currentTime(){return window.__stormAudioClock||0;}
   get state(){return 'running';}
   resume(){return Promise.resolve();}
  }
  window.AudioContext=window.webkitAudioContext=MovieAudioContext;
  try{const k='skyclash.v4.settings',settings=JSON.parse(localStorage.getItem(k)||'{}');
   settings.sound=false;localStorage.setItem(k,JSON.stringify(settings));}catch{}
 });
}
async function finishAudioCapture(page){
 const files=await page.evaluate(async segments=>{
  window.SkyClash.Settings.set('sound',false);
  const contexts=window.__stormAudioContexts||[];
  if(!contexts.length)throw Error('No actual game audio calls were captured');
  const buffers=await Promise.all(contexts.map(c=>c.startRendering()));
  return segments.map(segment=>{
   const rate=44100,count=Math.ceil((segment.end-segment.start)*rate),offset=Math.floor(segment.start*rate);
   const bytes=new Uint8Array(44+count*4),v=new DataView(bytes.buffer);
   const word=(at,text)=>{for(let n=0;n<text.length;n++)v.setUint8(at+n,text.charCodeAt(n));};
   word(0,'RIFF');v.setUint32(4,bytes.length-8,true);word(8,'WAVE');word(12,'fmt ');
   v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,rate,true);
   v.setUint32(28,rate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);
   word(36,'data');v.setUint32(40,count*4,true);
   const channels=buffers.map(b=>[b.getChannelData(0),b.getChannelData(1)]);
   for(let n=0;n<count;n++)for(let c=0;c<2;c++){
    let sample=0;for(const channel of channels)sample+=channel[c][offset+n]||0;
    v.setInt16(44+n*4+c*2,Math.round(Math.max(-1,Math.min(1,sample))*32767),true);
   }
   let raw='';for(let n=0;n<bytes.length;n+=32768)raw+=String.fromCharCode(...bytes.subarray(n,n+32768));
   return {names:segment.names,data:btoa(raw)};
  });
 },audioSegments);
 for(let n=0;n<files.length;n++){
  const file=files[n],wav=path.join(output,'captured-game-audio-'+n+'.wav');
  fs.writeFileSync(wav,Buffer.from(file.data,'base64'));
  for(const name of file.names){
   const movie=path.join(output,name+'.mp4'),temp=path.join(output,name+'-audio.mp4');
   execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',movie,'-i',wav,
    '-c:v','copy','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',temp]);
   fs.renameSync(temp,movie);
  }
 }
 console.log('Muxed actual game synth audio at the simulation clock');
}
function encodeMovie(directory,prefix,filename,fps=videoFps){
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(fps),
  '-i',path.join(directory,prefix+'-%04d.jpg'),'-c:v','libx264','-crf','21',
  '-pix_fmt','yuv420p','-movflags','+faststart',path.join(output,filename+'.mp4')]);
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',
  '-i',path.join(output,filename+'.mp4'),'-vf','fps=4,scale=320:240,tile=6x5',
  '-frames:v','1',path.join(output,filename+'.png')]);
}
async function filmCamera(page,view){
 await page.evaluate(({view,dt})=>{
  const q=window.__stormQA,{s,p,e,T}=q,cam=s.camera;
  if(view==='gameplay'){
   q.g.lockOn=true;s.CameraRig.rig.suspendT=0;q.cameraUpdate(dt);q.render();return;
  }
  const directions={front:[3.4,1.6,4.6],side:[5.8,1.6,.2],back:[-3.4,1.6,-4.6]};
  const d=new T.Vector3(...directions[view]).normalize();
  const center=p.pos.clone().lerp(e.pos,.5);center.y+=1.05;
  const separation=p.pos.distanceTo(e.pos),distance=Math.max(5.6,3.7+separation*.65);
  cam.position.copy(center).addScaledVector(d,distance);
  cam.lookAt(center);cam.fov=43;cam.updateProjectionMatrix();q.render();
 },{view,dt:1/videoFps});
}
async function verifyQueuedFilmInput(page){
 const result=await page.evaluate(()=>{
  const q=window.__stormQA;q.reset();q.filmStarts=0;q.queuedSerial=-1;q.g.hitStopT=0;
  const clips=new Set();let hits=0,lastHp=q.e.hp;
  for(let n=0;n<60*8;n++){
   q.queueBeat(7);q.filmTick(1/60,true);
   if(q.p.v72StudioPack.nativePreviewActive)clips.add(q.p.v72StudioPack.nativeClipId);
   if(q.e.hp<lastHp){hits++;lastHp=q.e.hp;}
  }
  return {starts:q.filmStarts,hits,clips:[...clips]};
 });
 assert.equal(result.starts,7,'Recorded J inputs did not start the full combo');
 assert.equal(result.hits,7,'Recorded J input combo did not connect seven times');
 for(const id of ['original-jab','original-cross','original-hook','rising-kick','sky-uppercut','sky-kick','falling-fist'])
  assert(result.clips.includes(id),'Recorded J input combo missed '+id);
 console.log('PASS actual J input queue: complete seven-hit ground-to-air chain');
}
async function captureFilm(page){
 const directory=path.join(output,'sequence-frames');fs.mkdirSync(directory,{recursive:true});
 await page.evaluate(()=>{
  const q=window.__stormQA;q.reset();q.filmStarts=0;q.queuedSerial=-1;q.filmTime=0;q.g.hitStopT=0;
  q.g.combo={n:0,dmg:0,t:0};document.getElementById('comboBox')?.classList.remove('show','hot');
  const panel=document.getElementById('walkLabStatus');if(panel)panel.open=false;
 });
 const audioStart=captureAudio?await page.evaluate(()=>{
  window.SkyClash.Settings.set('sound',true);return window.__stormAudioClock||0;
 }):0;
 const views=(process.env.STORM_QA_VIDEO_VIEWS||'front,side,back').split(',');
 assert(views.every(v=>['front','side','back','gameplay'].includes(v)),'Unknown video view');
 const frames=Math.ceil(videoFps*Number(process.env.STORM_QA_VIDEO_SECONDS||8)),timeline=[];
 if(process.env.STORM_QA_CLEAN_VIDEO==='1')await cleanFilmUI(page);
 for(let i=0;i<frames;i++){
  const observation=await page.evaluate(({fps})=>{
   const q=window.__stormQA,{p,e,s}=q;
   for(let n=0;n<60/fps;n++){
    const queued=window.SkyClashPublishedActions.nativeCombatSet.revision==='storm-fist-v3';
    if(queued)q.queueBeat(7);
    else if(q.filmStarts<7&&p.punchT<=0&&p.meleeCd<=0&&p.stun<=0){
     const before=p.attackSerial;s.Combat.melee(p,e);if(p.attackSerial!==before)q.filmStarts++;
    }
    q.filmTick(1/60,queued);
   }
   return {time:q.filmTime,player:q.observe(p),enemy:q.observe(e)};
  },{fps:videoFps});timeline.push(observation);
  for(const view of views){
   await filmCamera(page,view);
   await page.screenshot({path:path.join(directory,`${view}-${String(i).padStart(4,'0')}.jpg`),
    type:'jpeg',quality:85});
  }
 }
 for(const view of views)encodeMovie(directory,view,'sequence-'+view);
 if(captureAudio)audioSegments.push({names:views.map(view=>'sequence-'+view),start:audioStart,
  end:await page.evaluate(()=>window.__stormAudioClock)});
 fs.writeFileSync(path.join(output,'sequence-timeline.json'),JSON.stringify(timeline,null,2));
 fs.rmSync(directory,{recursive:true,force:true});
 console.log('Captured continuous real-model Storm Fist '+views.join('/')+' sequence at '+videoFps+'fps');
}

async function cleanFilmUI(page){
 await page.evaluate(()=>{for(const id of ['controls','walkLabStatus','dojoTools']){
  const el=document.getElementById(id);if(el)el.style.display='none';
 }});
}
async function captureShowcase(page){
 const directory=path.join(output,'showcase-frames');fs.mkdirSync(directory,{recursive:true});
 const duration=20,frames=Math.ceil(videoFps*duration),timeline=[];
 if(process.env.STORM_QA_CLEAN_VIDEO==='1')await cleanFilmUI(page);
 await page.evaluate(()=>{
  const q=window.__stormQA;q.showcasePhase=-1;q.showcaseElapsed=0;q.filmTime=0;
  const panel=document.getElementById('walkLabStatus');if(panel)panel.open=false;
  let label=document.getElementById('stormQaLabel');
  if(!label){label=document.createElement('div');label.id='stormQaLabel';
   label.style.cssText='position:fixed;left:12px;bottom:18px;background:#07111dde;color:white;padding:7px 10px;font:18px sans-serif;z-index:99999;pointer-events:none';
   document.body.appendChild(label);}
 });
 const audioStart=captureAudio?await page.evaluate(()=>{
  window.SkyClash.Settings.set('sound',true);return window.__stormAudioClock||0;
 }):0;
 for(let i=0;i<frames;i++){
  const report=await page.evaluate(({fps})=>{
   const q=window.__stormQA,{p,e,s,T}=q;
   for(let n=0;n<60/fps;n++){
    const t=q.showcaseElapsed;
    const phase=t<5.3?0:t<6.65?1:t<8?2:t<9.35?3:t<10.9?4:t<12.6?5:6;
    if(phase!==q.showcasePhase){
     q.showcasePhase=phase;q.phaseTime=0;q.showcaseStarts=0;q.filmStarts=0;q.queuedSerial=-1;q.didIncoming=false;q.didCounter=false;
     q.reset(phase===6?2.2:1.45);q.g.hitStopT=0;
     if(phase>=1&&phase<=3){
      p.combo=3;p.lastMelee=p.t;
      p.moveIntent.set(phase===1?1:0,0,phase===2?1:0);s.Combat.melee(p,e);p.moveIntent.set(0,0,0);
     }
     if(phase===4)p.blockHeld=true;
     if(phase===5){e.lastMelee=e.t;s.Combat.melee(e,p);}
    }
    const age=q.phaseTime;
    const queued=phase===0&&window.SkyClashPublishedActions.nativeCombatSet.revision==='storm-fist-v3';
    if(queued)q.queueBeat(7);
    else if(phase===0&&q.showcaseStarts<7&&p.punchT<=0&&p.meleeCd<=0&&p.stun<=0){
     const serial=p.attackSerial;s.Combat.melee(p,e);if(p.attackSerial!==serial)q.showcaseStarts++;
    }
    if(phase===4&&!q.didIncoming&&age>.38){q.didIncoming=true;e.lastMelee=e.t;s.Combat.melee(e,p);}
    if(phase===4&&age>1.2)p.blockHeld=false;
    if(phase===5){
     if(e.attackElapsed>.13&&!q.didIncoming){p.blockHeld=true;q.didIncoming=true;}
     if(q.didIncoming&&age>.46){
      p.blockHeld=false;
      if(!q.didCounter&&p.stun<=0&&p.meleeCd<=0&&p.punchT<=0){q.didCounter=true;s.Combat.melee(p,e);}
     }
    }
    if(phase===6){
     // Actual velocity/controller movement, never root teleporting between ticks.
     p.moveIntent.set(Math.sin(age*1.5)*.22,0,.65);
     e.moveIntent.set(Math.cos(age*1.25)*.55,0,-.12);
     p.facing=Math.atan2(e.pos.x-p.pos.x,e.pos.z-p.pos.z);
     e.facing=Math.atan2(p.pos.x-e.pos.x,p.pos.z-e.pos.z);
     const ready=p.stun<=0&&p.meleeCd<=0&&p.punchT<=0;
     if(ready&&p.pos.distanceTo(e.pos)<2.0)s.Combat.melee(p,e);
    }
    q.filmTick(1/60,queued);q.phaseTime+=1/60;q.showcaseElapsed+=1/60;
   }
   const names=['Ground-to-air combination','Roundhouse','Side kick','Rising kick','Guard and contact','Parry into counter','Moving exchange'];
   document.getElementById('stormQaLabel').textContent=names[q.showcasePhase];
   return {time:q.showcaseElapsed,phase:q.showcasePhase,name:names[q.showcasePhase],
    player:q.observe(p),enemy:q.observe(e)};
  },{fps:videoFps});
  timeline.push(report);
  const view=report.phase===0?'side':report.phase===1?'front':report.phase===2?'side':
   report.phase===3?'back':report.phase<=5?'side':'gameplay';
  await filmCamera(page,view);
  await page.screenshot({path:path.join(directory,`showcase-${String(i).padStart(4,'0')}.jpg`),type:'jpeg',quality:86});
 }
 encodeMovie(directory,'showcase','combat-showcase');
 if(captureAudio)audioSegments.push({names:['combat-showcase'],start:audioStart,
  end:await page.evaluate(()=>window.__stormAudioClock)});
 fs.writeFileSync(path.join(output,'combat-showcase-timeline.json'),JSON.stringify(timeline,null,2));
 await page.evaluate(()=>document.getElementById('stormQaLabel')?.remove());
 fs.rmSync(directory,{recursive:true,force:true});
 console.log('Captured complete combat showcase: combination, three kicks, defense/counter and moving exchange');
}

async function captureMoves(page){
 const dir=path.join(output,'move-frames');fs.mkdirSync(dir,{recursive:true});
 await page.evaluate(()=>{const panel=document.getElementById('walkLabStatus');if(panel)panel.open=false;});
 const available=await page.evaluate(()=>Object.keys(window.SkyClashPublishedActions.nativeCombatSet.clips));
 if(selectedMoves)assert(selectedMoves.every(id=>available.includes(id)),'Unknown STORM_QA_MOVES entry');
 const ids=selectedMoves?available.filter(id=>selectedMoves.includes(id)):available;
 const views=process.env.STORM_QA_ARM_CLOSEUP==='1'?
  {front:[1.75,1.65,2.05],side:[2.65,1.65,.1]}:
  {front:[2.9,1.65,3.25],side:[4.1,1.65,.1]};
 const all=[];
 for(const id of ids){
  const timing=await page.evaluate(id=>{
   const q=window.__stormQA,{p,e,s,reset,tick}=q;
   reset(1.45,id==='original-hook'?1:id==='original-overhand'?2:0);
   p.lastMelee=p.t;
   const stage={'original-jab':0,'original-cross':1,'original-hook':2,
    'original-overhand':2,'rising-kick':3,'roundhouse':3,'side-kick':3,'air-strike':3};
   if(Object.hasOwn(stage,id)){
    p.combo=stage[id];
    if(id==='roundhouse')p.moveIntent.set(1,0,0);
    if(id==='side-kick')p.moveIntent.set(0,0,1);
    if(id==='air-strike'){p.pos.y+=2.4;e.pos.y+=2.4;}
    s.Combat.melee(p,e);
   }else if(['sky-uppercut','sky-kick','falling-fist'].includes(id)){
    const phase=id==='sky-uppercut'?1:id==='sky-kick'?2:3;
    if(phase<3){p.pos.y+=2.4;e.pos.y+=2.8;e.launched=true;e.stun=2;}
    else{p.pos.y+=1.6;e.meteorWindow=2;e.downT=2;e.stun=2;}
    p.comboFollow={target:e,phase,until:p.t+3};s.Combat.melee(p,e);
   }else if(id==='guard')p.blockHeld=true;
   else if(id==='parry'){
    p.blockHeld=true;tick(.025);s.Combat.strike(e,p,false,0);
   }else if(id==='launch-recoil'||id==='spike-recoil'){
    if(id==='spike-recoil'){p.pos.y+=2.4;e.pos.y+=2.4;p.launched=true;p.stun=2;}
    e.facing=Math.atan2(p.pos.x-e.pos.x,p.pos.z-e.pos.z);
    s.Combat.strike(e,p,true,id==='launch-recoil'?3:5);
   }else{
    // The name is the body's recoil direction, opposite the incoming side.
    if(id==='hit-left')e.pos.set(1.2,e.floor,0);
    if(id==='hit-right')e.pos.set(-1.2,e.floor,0);
    e.facing=Math.atan2(p.pos.x-e.pos.x,p.pos.z-e.pos.z);
    s.Combat.strike(e,p,false,id==='hit-heavy'?2:0);
   }
   p.animate(0);e.animate(0);q.moveElapsed=0;
   q.g.combo={n:0,dmg:0,t:0};document.getElementById('comboBox')?.classList.remove('show','hot');
   let label=document.getElementById('stormQaLabel');
   if(!label){label=document.createElement('div');label.id='stormQaLabel';
    label.style.cssText='position:fixed;left:12px;top:12px;background:#07111de8;color:white;padding:8px 12px;font:26px monospace;z-index:99999;pointer-events:none';
    document.body.appendChild(label);}
   const clip=window.SkyClashPublishedActions.nativeCombatSet.clips[id];
   const scale=p.punchT>0?p.attackTotal/clip.durationSeconds:1;
   return {duration:clip.durationSeconds*scale,impact:clip.impactSeconds*scale};
  },id);
  const {duration,impact}=timing;
  const times=id==='guard'?[0,.06,.15,.3,.45,.59,.72,.9]:
   [0,impact*.45,impact*.85,impact,Math.min(duration,impact+.06),duration*.78,duration,duration+.16].sort((a,b)=>a-b);
  const observations=[];
  for(let i=0;i<times.length;i++){
   const observation=await page.evaluate(({id,time})=>{
    const q=window.__stormQA;
    while(q.moveElapsed<time-1e-9){const step=Math.min(1/120,time-q.moveElapsed);q.tick(step);q.moveElapsed+=step;}
    document.getElementById('stormQaLabel').textContent=id+' · '+time.toFixed(3)+'s';
    return q.observe(q.p);
   },{id,time:times[i]});observations.push(observation);
   for(const [view,offset]of Object.entries(views)){
    await page.evaluate(offset=>{
     const {p,s}=window.__stormQA,cam=s.camera;
     cam.position.set(p.pos.x+offset[0],p.pos.y+offset[1],p.pos.z+offset[2]);
     cam.lookAt(p.pos.x,p.pos.y+1.05,p.pos.z+.28);cam.fov=40;cam.updateProjectionMatrix();
     window.__stormQA.render();
    },offset);
    await page.screenshot({path:path.join(dir,`${id}-${view}-${i}.jpg`),type:'jpeg',quality:84});
    if(process.env.STORM_QA_ARM_CLOSEUP==='1'&&Math.abs(times[i]-impact)<1e-8)
     await page.screenshot({path:path.join(output,`${id}-${view}-contact.png`)});
   }
  }
  assert(observations.some(f=>f.native&&f.clip===id),'Gallery did not route actual runtime move '+id);
  for(const view of Object.keys(views)){
   fs.copyFileSync(path.join(dir,`${id}-${view}-3.jpg`),
    path.join(dir,`contact-${view}-${String(all.length).padStart(2,'0')}.jpg`));
   execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','1',
    '-i',path.join(dir,`${id}-${view}-%d.jpg`),'-vf','scale=320:240,tile=4x2',
    '-frames:v','1',path.join(output,`${id}-${view}.png`)]);
  }
  all.push({id,times,observations});
  console.log('Captured runtime move',id);
 }
 for(const view of Object.keys(views)){
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','1',
   '-i',path.join(dir,`contact-${view}-%02d.jpg`),'-vf','scale=320:240,tile=6x3',
   '-frames:v','1',path.join(output,`${selectedMoves?'selected':'all'}-moves-contact-${view}.png`)]);
 }
 fs.writeFileSync(path.join(output,selectedMoves?'selected-move-gallery.json':'all-move-gallery.json'),JSON.stringify(all,null,2));
 await page.evaluate(()=>document.getElementById('stormQaLabel')?.remove());
 fs.rmSync(dir,{recursive:true,force:true});
 console.log('Captured all '+ids.length+' Storm Fist clips through actual gameplay owners');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
