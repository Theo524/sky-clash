/* Real Kairo per-caller VRM sync attribution, diagnostic only.
 * Wraps only the loaded Kairo VRM instance in offscreen Chromium.
 * Does NOT patch the shipped game, drop syncs, or compare performance.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const base=(process.env.PLAYTEST_BASE_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const output=path.resolve(process.env.KAIRO_SYNC_ORIGINS_OUTPUT||
 'visual-review-output/kairo-vrm-sync-origins');
const bones=require('../docs/KAIRO-RIG-CONTRACT.v1.json').targetBoneNames;
const scenarios=[
 {name:'idle',n:10,h:0},
 {name:'walk',n:10,h:0,speed:3},
 {name:'ground-run',n:10,h:0,speed:6,run:true},
 {name:'jump',n:10,h:1,vy:8,jump:true},
 {name:'fall',n:10,h:2,vy:-7,jump:true},
 {name:'landing',n:10,h:0,landing:.4},
 {name:'v156-hover',n:10,h:2},
 {name:'v156-cruise',n:10,h:2,speed:5},
 {name:'boost',n:10,h:2,speed:6,boost:true},
 {name:'guard',n:10,h:0,guard:true},
 {name:'attack-flags',n:10,h:0,attack:true},
 {name:'actual-melee',n:10,h:0,melee:true},
 {name:'ground-return',n:10,h:0}
];
const profiles=[
 {id:'default',query:'?scene=dojo'},
 {id:'storm-v3',query:'?scene=dojo&combatAnim=storm-fist-v3'}
];
if(process.env.KAIRO_SYNC_ORIGINS_FULL==='1')
 profiles.push(
  {id:'default-30',query:'?scene=dojo',fps:30},
  {id:'default-120',query:'?scene=dojo',fps:120},
  {id:'step-60',query:'?scene=dojo&movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored',fps:60});
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
fs.mkdirSync(output,{recursive:true});
async function collect(browser,profile){
 const context=await browser.newContext({viewport:{width:960,height:640},deviceScaleFactor:1});
 const page=await context.newPage();const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(String(e)));
 try{
  const response=await page.goto(base+'index.html'+profile.query,
   {waitUntil:'domcontentloaded',timeout:45000});
  assert(response.ok(),'Game entry failed to load');
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPoseAuthority?.ready&&window.SkyClashGameplayMotions?.loaded&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
   null,{timeout:180000});
  const result=await page.evaluate(({bones,scenarios,profile})=>{
   const sky=window.SkyClash,game=sky.Game,f=game.player,enemy=game.enemy;
   const rig=f.vrmRig,vrm=rig.vrm,hum=vrm.humanoid,dt=1/(profile.fps||60);
   const canvas=document.querySelector('canvas');
   const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
   if(!gl||!window.SKY_V66_REAL_KAIRO||f.characterId!=='kairo_venn')
    throw Error('Only real Kairo VRM0 WebGL supported');
   const names=bones.slice();
   const normal=names.map(name=>hum.getNormalizedBoneNode(name));
   if(normal.some(x=>!x))throw Error('Kairo normalized bone is missing');
   const raw=names.map(name=>typeof hum.getRawBoneNode==='function'?
    hum.getRawBoneNode(name):null);
   const rawSupported=raw.every(Boolean);
   const snap=nodes=>nodes.map(n=>n?[
    n.quaternion.x,n.quaternion.y,n.quaternion.z,n.quaternion.w,
    n.position.x,n.position.y,n.position.z]:null);
   const changes=(a,b)=>{
    if(!a||!b)return null;
    let changed=0;
    for(let k=0;k<a.length;k++){
     if(!a[k]||!b[k])continue;
     if(a[k].some((x,i)=>Math.abs(x-b[k][i])>1e-8))changed++;
    }
    return changed;
   };
   game.enterDojo();game.update=()=>{};sky.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;game.mode='dojo';game.dojoRival=true;
   game.training=true;game.introT=0;
   f.reset();f.t=12;const floor=f.floor;
   f.pos.set(0,floor,0);f.model.root.position.set(0,floor,0);
   f.vel.set(0,0,0);f.moveIntent.set(0,0,0);
   const original=vrm.update;const phases=[];
   let frame=null,previousNormalized=null,callDepth=0;
   vrm.update=function(...args){
    if(!frame)return original.apply(this,args);
    callDepth++;
    // Own call site, not the outermost Fighter.animate wrapper.
    const stack=new Error().stack||'';
    const match=stack.match(/\/js\/(v[0-9]+-[a-z0-9-]+\.js|game\.js)[^:\n]*:(\d+):(\d+)/i);
    const caller=match?match[1]:'unattributed';
    const site=match?caller+':'+match[2]:caller;
    const input=snap(normal),rawBefore=rawSupported?snap(raw):null;
    const normalizedSinceLast=changes(previousNormalized,input);
    const start=performance.now();
    try{return original.apply(this,args)}
    finally{
     const elapsed=performance.now()-start;
     const rawAfter=rawSupported?snap(raw):null;
     const after=snap(normal);
     frame.syncs.push({
      caller,site,elapsedMs:elapsed,
      changedNormalizedSincePriorSync:normalizedSinceLast,
      changedNormalizedDuringSync:changes(input,after),
      changedRawBonesDuringSync:changes(rawBefore,rawAfter),
      argDelta:typeof args[0]==='number'?args[0]:null,
      depth:callDepth
     });
     previousNormalized=after;callDepth--;
    }
   };
   function reset(p){
    f.hp=100;f.stun=0;f.downT=0;f.launched=false;f.spiked=false;
    f.slamming=false;f.dashing=false;f.charging=false;
    f.blocking=false;f.blockHeld=!!p.guard;
    f.sprinting=!!p.boost;f.dropping=false;f.jumping=!!p.jump;
    f.punchT=0;f.blastT=0;f.superHitT=0;f.attackAir=false;
    f.v108JumpPrepT=0;f.landingMotionT=p.landing||0;f.vert=0;
    f.vel.set(0,p.vy||0,p.speed||0);
    f.moveIntent.set(0,0,p.speed?1:0);
    f.v80AnalogRun=!!p.run;f.v95JoystickRun=!!p.run;
    f.pos.y=floor+p.h;f.model.root.position.y=f.pos.y;
    if(p.attack){
     f.punchT=.25;f.attackKind='punch';f.punchSide=1;
     f.attackElapsed=.04;f.attackTotal=.43;
     f.attackSerial=(f.attackSerial||0)+1;
    }
   }
   for(const p of scenarios){
    reset(p);
    if(p.melee){
     f.lastMelee=-20;f.meleeCd=0;f.combo=0;f.comboCycle=0;
     f.attackSerial=0;f.t=12;
     enemy.hp=100;enemy.stun=0;enemy.invulnT=0;
     enemy.pos.set(f.pos.x,floor,f.pos.z+1.45);
     sky.Combat.melee(f,enemy,profile.id==='storm-v3');
    }
    // Warm up deterministically outside the measured portion.
    for(let j=0;j<3;j++){f.t+=dt;f.animate(dt);}
    const frames=[],owners={};
    for(let j=0;j<p.n;j++){
     frame={index:j,syncs:[]};
     previousNormalized=null;
     f.t+=dt;
     if(p.landing)f.landingMotionT=Math.max(0,p.landing-j*dt);
     f.animate(dt);
     const calls=frame.syncs;
     if(calls.length===0)throw Error('No real VRM sync in '+p.name);
     frames.push({index:j,calls,
      v100Air:!!window.SkyClashV100Animator.ownsAir(f),
      nativeClip:f.v72StudioPack?.nativeClipId||null});
     frame=null;
     for(const row of calls){
      const key=row.site,entry=owners[key]||(owners[key]={
       caller:row.caller,calls:0,rawBonesChanged:0,normalizedBetweenSync:0,
       rawSyncsWithChanges:0,meanSyncMs:0});
      entry.calls++;
      entry.rawBonesChanged+=(row.changedRawBonesDuringSync||0);
      entry.normalizedBetweenSync+=(row.changedNormalizedSincePriorSync||0);
      if((row.changedRawBonesDuringSync||0)>0)entry.rawSyncsWithChanges++;
      entry.meanSyncMs+=row.elapsedMs;
     }
    }
    for(const row of Object.values(owners))row.meanSyncMs/=row.calls;
    phases.push({phase:p.name,frames,owners,
     totalCalls:frames.reduce((n,x)=>n+x.calls.length,0)});
   }
   vrm.update=original;
   return {profile:profile.id,fps:profile.fps||60,realVRM:true,
    rawSupported,normalizedBones:names,
    nativeRevision:window.SkyClashPublishedActions?.nativeCombatSet?.revision||null,
    phases};
  },{bones,scenarios,profile});
  assert(result.realVRM&&result.normalizedBones.length===20,'No actual Kairo rig');
  assert(result.rawSupported,'Actual Kairo raw VRM bone mapping required');
  assert(!pageErrors.length,'Browser errors: '+pageErrors.slice(0,3).join('; '));
  const origins=new Set();
  for(const p of result.phases){
   assert.equal(p.frames.length,scenarios.find(x=>x.name===p.phase).n);
   assert(p.totalCalls>=p.frames.length,'Missing VRM syncs for '+p.phase);
   for(const row of Object.values(p.owners))origins.add(row.caller);
   console.log('ORIGINS',result.profile,p.phase,
    'syncPerFrame='+(p.totalCalls/p.frames.length).toFixed(2),
    Object.values(p.owners).map(x=>x.caller+'@'+x.calls+
      (result.rawSupported?'/rawChanged='+x.rawSyncsWithChanges:'')).join(','));
  }
  assert(origins.has('game.js'),'Base VRMRig sync source not attributed');
  assert(!origins.has('unattributed'),'VRM sync caller could not be identified');
  assert([...origins].some(x=>x.startsWith('v')),'No later animation sync caller attributed');
  if(profile.id==='storm-v3')
   assert.equal(result.nativeRevision,'storm-fist-v3',
    'Experimental native combat comparison must load its real pack');
  fs.writeFileSync(path.join(output,profile.id+'.json'),JSON.stringify(result,null,2));
  return {profile:result.profile,fps:result.fps,rawSupported:result.rawSupported,
   origins:[...origins].sort(),nativeRevision:result.nativeRevision,
   phases:result.phases.map(p=>({phase:p.phase,
    frames:p.frames.length,syncs:p.totalCalls,
    owners:Object.values(p.owners).sort((a,b)=>a.caller.localeCompare(b.caller))}))};
 }finally{await context.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage','--no-sandbox'
 ]});
 try{
  const profilesDone=[];
  for(const profile of profiles)profilesDone.push(await collect(browser,profile));
  const report={test:'Kairo post-bridge VRM sync caller attribution',
   scope:'real WebGL Kairo VRM, original game scripts, read-only VRM.update wrapper',
   caveats:['one sync call can update mesh/springs/expressions without changing tracked body bones',
    'normalized changes since previous sync do not attribute an individual pose writer',
    'software WebGL and profiler timing do not establish production performance',
    'state flags and actual melee are controlled independently of full physics input'],
   provenance:{kairo:digest('assets/characters/kairo.vrm'),
    game:digest('js/game.js'),v100:digest('js/v100-pose-authority.js')},
   profiles:profilesDone};
  fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(report,null,2));
  console.log('PASS real Kairo VRM sync callers attributed; no game-time sync removed');
 }finally{await browser.close();}
})().catch(e=>{console.error('KAIRO VRM SYNC ORIGIN ERROR',e.stack||e);process.exitCode=1;});
