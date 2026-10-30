/* Real Kairo guide-to-VRM sync profiler. Test-only: no game or asset changes.
 * Timing is instrumentation-overhead-inclusive, not a browser FPS benchmark.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const base=(process.env.PLAYTEST_BASE_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const out=path.resolve(process.env.KAIRO_SYNC_PROFILE_OUTPUT||'visual-review-output/kairo-guide-vrm-profile');
const bones=require('../docs/KAIRO-RIG-CONTRACT.v1.json').targetBoneNames;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const scenarios=[
 {name:'idle',count:12,h:0},
 {name:'walk',count:12,h:0,vz:3},
 {name:'run',count:12,h:0,vz:6,run:true},
 {name:'jump',count:12,h:1,vy:8,jump:true},
 {name:'fall',count:12,h:2,vy:-7,jump:true},
 {name:'landing',count:12,h:0,landing:.45},
 {name:'v156-hover',count:12,h:2},
 {name:'v156-cruise',count:12,h:2,vz:5},
 {name:'boost',count:12,h:2,vz:6,boost:true},
 {name:'guard',count:12,h:0,guard:true},
 {name:'attack',count:12,h:0,attack:true},
 {name:'ground-return',count:12,h:0}
];
const targets=[
 {id:'default-30',fps:30,query:'?scene=dojo'},
 {id:'default-60',fps:60,query:'?scene=dojo'},
 {id:'default-120',fps:120,query:'?scene=dojo'},
 {id:'step-60',fps:60,query:'?scene=dojo&movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored'}
];
fs.mkdirSync(out,{recursive:true});
async function run(browser,spec){
 const context=await browser.newContext({viewport:{width:960,height:640},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  const response=await page.goto(base+'index.html'+spec.query,{waitUntil:'domcontentloaded',timeout:45000});
  assert(response.ok(),'Failed to serve exact checkout');
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPoseAuthority?.ready&&window.SkyClashGameplayMotions?.loaded&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
   null,{timeout:180000});
  const result=await page.evaluate(({bones,scenarios,spec})=>{
   const sky=window.SkyClash,g=sky.Game,f=g.player,rig=f.vrmRig,vrm=rig.vrm,hum=vrm.humanoid;
   const canvas=document.querySelector('canvas'),gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
   if(!window.SKY_V66_REAL_KAIRO||!gl||f.characterId!=='kairo_venn')
    throw Error('Must profile exact Kairo VRM0 in WebGL');
   const nodes=bones.map(n=>hum.getNormalizedBoneNode(n));
   if(nodes.some(n=>!n))throw Error('Kairo 20-bone normalized rig incomplete');
   g.enterDojo();g.update=()=>{};sky.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;g.mode='dojo';g.training=true;g.introT=0;
   f.reset();f.t=12;const floor=f.floor,dt=1/spec.fps;
   f.pos.set(0,floor,0);f.model.root.position.set(0,floor,0);
   const original={animateRig:f.animateRig,bridge:rig.update,vrm:vrm.update,
    matrix:vrm.scene.updateMatrixWorld,bone:hum.getNormalizedBoneNode};
   let active=null;const scopes=[];
   const bucket=(table,name)=>table[name]||(table[name]={calls:0,ms:0,childrenMs:0,maxMs:0});
   function wrap(target,key,name){
    const prior=target[key];
    if(typeof prior!=='function')throw Error('Missing profiler method '+name);
    target[key]=function(...args){
     if(!active)return prior.apply(this,args);
     const parent=scopes[scopes.length-1];
     const frame={label:name,child:0,start:performance.now()};scopes.push(frame);
     if(name==='vrm.update'){
      const origin=scopes.some(s=>s.label==='vrmRig.update')?'inside-bridge':'after-bridge';
      const o=active.syncOrigins[origin]||(active.syncOrigins[origin]={calls:0,priorWrites:0});
      o.calls++;o.priorWrites+=active.writesSinceSync;active.writesSinceSync=0;
      if(active.events.length<12)
       active.events.push({origin,priorWrites:o.priorWrites,phase:active.phase});
     }
     try{return prior.apply(this,args)}
     finally{
      const duration=performance.now()-frame.start;scopes.pop();
      const row=bucket(active.timing,name);row.calls++;row.ms+=duration;
      row.childrenMs+=frame.child;row.maxMs=Math.max(row.maxMs,duration);
      if(parent)parent.child+=duration;
     }
    };
   }
   wrap(f,'animateRig','guide.animateRig');
   wrap(rig,'update','vrmRig.update');
   wrap(vrm,'update','vrm.update');
   wrap(vrm.scene,'updateMatrixWorld','vrm.scene.updateMatrixWorld');
   wrap(hum,'getNormalizedBoneNode','humanoid.lookup');
   const rotationMethods=['copy','set','identity','setFromEuler','setFromAxisAngle',
    'slerp','slerpQuaternions','multiply','premultiply','normalize'];
   const positionMethods=['copy','set','add','sub','lerp','multiplyScalar','addScaledVector'];
   for(let i=0;i<nodes.length;i++){
    for(const [obj,kind,methods] of [[nodes[i].quaternion,'rotation',rotationMethods],
     [nodes[i].position,'position',positionMethods]]){
     for(const method of methods){
      const originalMethod=obj[method];
      if(typeof originalMethod!=='function')continue;
      Object.defineProperty(obj,method,{configurable:true,value:function(...args){
       if(!active)return originalMethod.apply(this,args);
       const before=[this.x,this.y,this.z,this.w];
       const result=originalMethod.apply(this,args);
       const after=[this.x,this.y,this.z,this.w];
       const changed=before.some((v,i)=>Math.abs(v-after[i])>1e-9);
       const scope=scopes.some(s=>s.label==='vrmRig.update')?'bridge':
        scopes.some(s=>s.label==='vrm.update')?'vrm.sync':'later-layer';
       const row=active.boneWrites[scope]||(active.boneWrites[scope]={attempts:0,changed:0,bones:{}});
       row.attempts++;
       if(changed){row.changed++;row.bones[bones[i]]=true;active.writesSinceSync++;}
       return result;
      }});
     }
    }
   }
   const phaseRows=[],authority=window.SkyClashV100Animator,results={};
   const reset=phase=>{
    f.hp=100;f.stun=0;f.downT=0;f.launched=false;f.spiked=false;
    f.slamming=false;f.dashing=false;f.charging=false;f.blocking=false;
    f.blockHeld=!!phase.guard;f.sprinting=!!phase.boost;
    f.jumping=!!phase.jump;f.dropping=false;f.v108JumpPrepT=0;
    f.punchT=0;f.blastT=0;f.superHitT=0;f.attackAir=false;
    f.landingMotionT=phase.landing||0;f.vert=0;
    f.v80AnalogRun=!!phase.run;f.v95JoystickRun=!!phase.run;
    f.vel.set(0,phase.vy||0,phase.vz||0);
    f.moveIntent.set(0,0,phase.vz?1:0);
    f.pos.y=floor+phase.h;f.model.root.position.y=f.pos.y;
    if(phase.attack){
     f.punchT=.34;f.attackKind='punch';f.punchSide=1;
     f.attackElapsed=.02;f.attackTotal=.42;
     f.attackSerial=(f.attackSerial||0)+1;
    }
   };
   for(const phase of scenarios){
    reset(phase);
    for(let i=0;i<4;i++){f.t+=dt;f.animate(dt);}
    const sample={phase:phase.name,frames:phase.count,simulatedFps:spec.fps,
     timing:{},syncOrigins:{},boneWrites:{},events:[],writesSinceSync:0,
     totalMs:0,maxFrameMs:0,ownerState:null,ownsAir:false,errors:[]};
    active=sample;
    for(let i=0;i<phase.count;i++){
     if(phase.landing)f.landingMotionT=Math.max(0,phase.landing-i*dt);
     f.t+=dt;
     const start=performance.now();f.animate(dt);
     const elapsed=performance.now()-start;
     sample.totalMs+=elapsed;sample.maxFrameMs=Math.max(sample.maxFrameMs,elapsed);
    }
    active=null;scopes.length=0;
    sample.ownerState=window.SkyClashPoseAuthority?.active||null;
    sample.ownsAir=!!authority.ownsAir(f);
    if(window.SkyClashGameplayMotions?.error)sample.errors.push(window.SkyClashGameplayMotions.error);
    if(window.SkyClashPoseAuthority?.error)sample.errors.push(window.SkyClashPoseAuthority.error);
    sample.meanFrameMs=sample.totalMs/phase.count;
    for(const [name,row] of Object.entries(sample.timing)){
     row.meanPerFrameMs=row.ms/phase.count;
     row.exclusiveMs=Math.max(0,row.ms-row.childrenMs);
    }
    for(const row of Object.values(sample.boneWrites))row.bones=Object.keys(row.bones).sort();
    delete sample.writesSinceSync;
    phaseRows.push(sample);
   }
   return {id:spec.id,fps:spec.fps,realKairo:true,webGL:true,
    normalizedBones:bones,model:window.HERO_VRM_URL||null,
    modules:{v71:window.SkyClashGameplayMotions?.active||null,
     v100:window.SkyClashPoseAuthority?.active||null,
     v89:window.SkyClashV89?.ready||false},
    phases:phaseRows};
  },{bones,scenarios,spec});
  assert(result.realKairo&&result.webGL&&result.normalizedBones.length===20,'Wrong rig');
  assert(!errors.length,'Browser errors '+errors.slice(0,3).join(';'));
  for(const row of result.phases){
   assert(!row.errors.length,'Animation error in '+row.phase+': '+row.errors.join(';'));
   assert(row.timing['guide.animateRig']?.calls===row.frames,
    'Expected one guide update per frame at '+row.phase);
   assert(row.timing['vrmRig.update']?.calls===row.frames,
    'Expected one guide-to-VRM bridge per frame at '+row.phase);
   assert(row.timing['vrm.update']?.calls>=row.frames,
    'Expected at least one VRM sync per frame at '+row.phase);
   assert(row.boneWrites.bridge?.changed>0,
    'Expected real Kairo joint bridge writes in '+row.phase);
   const syncs=row.timing['vrm.update'].calls;
   console.log('PROFILE',spec.id,row.phase,
    'guide='+row.timing['guide.animateRig'].meanPerFrameMs.toFixed(3),
    'bridge='+row.timing['vrmRig.update'].meanPerFrameMs.toFixed(3),
    'syncsPerFrame='+(syncs/row.frames).toFixed(2),
    'postBridgeSyncs='+((row.syncOrigins['after-bridge']?.calls||0)/row.frames).toFixed(2),
    'postBridgeWrites='+(row.boneWrites['later-layer']?.changed||0),
    'air='+row.ownsAir);
  }
  fs.writeFileSync(path.join(out,result.id+'.json'),JSON.stringify(result,null,2));
  return result;
 }finally{await context.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage','--no-sandbox'
 ]});
 try{
  const results=[];
  const selected=process.env.KAIRO_PROFILE_FULL==='1'?targets:
   targets.filter(x=>x.id==='default-60');
  for(const spec of selected)results.push(await run(browser,spec));
  const summary={
   description:'Read-only guide/bridge/VRM-sync call and time samples for real Kairo',
   caveats:['headless SwiftShader timing is noisy and includes profiling overhead',
    'deterministically driven Fighter.animate rather than full physics/AI/input',
    'VRM.update calls from later animation layers may be necessary to publish their pose',
    'nothing is optimized and no playable code is patched'],
   provenance:{kairoVrmSha256:hash('assets/characters/kairo.vrm'),
    gameJsSha256:hash('js/game.js'),v100Sha256:hash('js/v100-pose-authority.js')},
   profiles:results.map(r=>({id:r.id,fps:r.fps,phases:r.phases.map(s=>({
    phase:s.phase,frames:s.frames,meanFrameMs:s.meanFrameMs,
    guideCalls:s.timing['guide.animateRig'].calls,
    bridgeCalls:s.timing['vrmRig.update'].calls,
    totalSyncCalls:s.timing['vrm.update'].calls,
    syncsAfterBridge:s.syncOrigins['after-bridge']?.calls||0,
    bridgeWrites:s.boneWrites.bridge?.changed||0,
    laterWrites:s.boneWrites['later-layer']?.changed||0,
    owningAir:s.ownsAir
   }))}))};
  fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));
  console.log('PASS real Kairo guide/VRM profiling; measured sync calls are not safe removal recommendations');
 }finally{await browser.close();}
})().catch(e=>{console.error('KAIRO GUIDE VRM PROFILER ERROR',e.stack||e);process.exitCode=1;});
