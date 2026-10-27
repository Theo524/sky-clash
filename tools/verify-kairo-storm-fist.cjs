/* Real-model Storm Fist sequence QA. No post-animation bone injection.
 * Run from a served checkout; PLAYTEST_BASE_URL also accepts published Pages.
 * Output is local evidence, not a claim of player aesthetic approval.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const base=(process.env.PLAYTEST_BASE_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const output=path.resolve(process.env.STORM_QA_OUTPUT||'visual-review-output/kairo-storm-fist');
const film=process.env.STORM_QA_FILM!=='0';
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
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  const response=await page.goto(base+'?combatAnim=storm-fist-v1',{waitUntil:'domcontentloaded'});
  assert(response.ok(),'Game entry is unavailable');
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPublishedActions?.ready&&
   window.SkyClashPublishedActions?.nativePlaytest?.state==='ready'&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid&&
   window.SkyClash?.Game?.enemy?.vrmRig?.vrm?.humanoid,null,{timeout:180000});
  await page.locator('#trainBtn').click();
  await page.waitForFunction(()=>!document.getElementById('titleScreen').classList.contains('show'));
  await page.evaluate(({bones})=>{
   const s=window.SkyClash,g=s.Game,p=g.player,e=g.enemy,T=window.THREE;
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
     entryAge:native.nativeAge||0,air:!!(f.attackAir||f.flying||f.jumping),floor:f.floor,
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
   const q={s,g,p,e,T,bones,observe,reset,tick,strikeEvents:[]};
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
      if(starts.length<maximum&&p.punchT<=0&&p.meleeCd<=0&&p.stun<=0){
       const before=p.attackSerial;s.Combat.melee(p,e);
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
    return {fps,combo,alternate,whiff,interrupted,defenses,aerial,kicks,
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
   const all=[...r.combo.frames,...r.alternate.frames,...r.aerial,
    ...r.defenses.flatMap(d=>d.frames),...r.kicks.flatMap(k=>k.frames)];
   check(all.every(f=>f.quaternions.flat().every(Number.isFinite)),'Nonfinite joint pose');
   check(all.every(f=>f.quaternions.every(q=>Math.abs(Math.hypot(...q)-1)<1e-4)),
    'Nonunit joint rotation');
   check(r.interrupted.filter(f=>f.elapsed>=.12+1/r.fps).every(f=>f.clip!=='original-jab'||!f.native),
    'Interrupted jab was resurrected');
  }
  if(film){if(!skipSequence)await captureFilm(page);await captureMoves(page);}
  const result={status:failures.length?'FAIL':'PASS',base,errors,failures,
   reports:reports.map(r=>({fps:r.fps,starts:r.combo.starts,
    clips:[...new Set(r.combo.frames.filter(f=>f.native).map(f=>f.clip))],
    contacts:r.combo.impacts,movement:r.movement,motion:r.motion})),
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

async function captureFilm(page){
 const directory=path.join(output,'sequence-frames');fs.mkdirSync(directory,{recursive:true});
 await page.evaluate(()=>{
  const q=window.__stormQA;q.reset();q.filmStarts=0;
  q.g.combo={n:0,dmg:0,t:0};document.getElementById('comboBox')?.classList.remove('show','hot');
  const panel=document.getElementById('walkLabStatus');if(panel)panel.open=false;
 });
 const views={front:[1.5,1.9,5.8],side:[5.8,1.9,.2],back:[-1.5,1.9,-5.8]};
 const frames=60;
 for(let i=0;i<frames;i++){
  await page.evaluate(()=>{
   const q=window.__stormQA,{p,e,s,tick}=q;
   for(let n=0;n<8;n++){
    if(q.filmStarts<7&&p.punchT<=0&&p.meleeCd<=0&&p.stun<=0){
     const before=p.attackSerial;s.Combat.melee(p,e);if(p.attackSerial!==before)q.filmStarts++;
    }
    tick(1/60);
   }
  });
  for(const [view,offset]of Object.entries(views)){
   await page.evaluate(offset=>{
    const {s,p,e}=window.__stormQA,cam=s.camera;
    const y=p.pos.y*.6+e.pos.y*.4;
    cam.position.set(p.pos.x+offset[0],y+offset[1],p.pos.z+offset[2]);
    cam.lookAt(p.pos.x,y+1.05,p.pos.z+.45);cam.fov=43;cam.updateProjectionMatrix();
    s.Game.loop(performance.now());
   },offset);
   await page.screenshot({path:path.join(directory,`${view}-${String(i).padStart(3,'0')}.jpg`),
    type:'jpeg',quality:82});
  }
 }
 for(const view of Object.keys(views)){
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','7.5',
   '-i',path.join(directory,view+'-%03d.jpg'),'-c:v','libx264','-pix_fmt','yuv420p',
   path.join(output,'sequence-'+view+'.mp4')]);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',
   '-i',path.join(output,'sequence-'+view+'.mp4'),'-vf','fps=4,scale=320:240,tile=6x5',
   '-frames:v','1',path.join(output,'sequence-'+view+'.png')]);
 }
 fs.rmSync(directory,{recursive:true,force:true});
 console.log('Captured continuous real-model Storm Fist front/side/back sequence');
}

async function captureMoves(page){
 const dir=path.join(output,'move-frames');fs.mkdirSync(dir,{recursive:true});
 await page.evaluate(()=>{const panel=document.getElementById('walkLabStatus');if(panel)panel.open=false;});
 const available=await page.evaluate(()=>Object.keys(window.SkyClashPublishedActions.nativeCombatSet.clips));
 if(selectedMoves)assert(selectedMoves.every(id=>available.includes(id)),'Unknown STORM_QA_MOVES entry');
 const ids=selectedMoves?available.filter(id=>selectedMoves.includes(id)):available;
 const views={front:[1.15,1.65,4.1],side:[4.1,1.65,.1]};
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
   return {duration:clip.durationSeconds,impact:clip.impactSeconds};
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
     s.Game.loop(performance.now());
    },offset);
    await page.screenshot({path:path.join(dir,`${id}-${view}-${i}.jpg`),type:'jpeg',quality:84});
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
