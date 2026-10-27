/* Sky Clash: genuine final-pose / gameplay combat baseline DIAGNOSTIC.
 * Not an authoring system, animation writer, preview, or aesthetic approval.
 * Use the existing LIVE Fighter.update -> V72/V81/V100 stack, real Kairo VRM,
 * real Combat.melee and real game physics. Produce JSON, NOT videos/stills.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const OUT=path.resolve('visual-review-output/kairo-combat-foundation');
const fpsList=[30,60,120];
const NAMES=['hips','spine','chest','upperChest','neck','head',
 'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
 'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
 'leftUpperLeg','leftLowerLeg','leftFoot',
 'rightUpperLeg','rightLowerLeg','rightFoot'];
fs.mkdirSync(OUT,{recursive:true});
const SHA=crypto.createHash('sha256').update(
 fs.readFileSync('assets/characters/kairo.vrm')).digest('hex');

function verify(trace,fps){
 assert.equal(trace.setup.realVRM,true,'Never test placeholder Kairo');
 assert.equal(trace.setup.webGL,true,'Real WebGL renderer required');
 assert.equal(trace.setup.rigBones,20,'Normalized real Kairo VRM rig required');
 assert.equal(trace.setup.characterId,'kairo_venn');
 assert.equal(trace.setup.modelSha256,SHA);
 assert.equal(trace.setup.published,true,'Existing V72 motion writer must be active');
 assert.equal(trace.setup.v81,true,'Existing V81 transition must be active');
 assert.equal(trace.setup.airOwner,true,'Existing air owner must be available');
 assert(trace.samples.length>fps*3,'Must capture a continuous multi-second timeline');
 assert.equal(trace.attacks.length,5,'Jab and 4 uninterrupted whiff beats');
 assert.equal(trace.attacks[0].duration,.55);
 assert(Math.abs(trace.attacks[0].contact-.24)<1e-7);
 assert.deepEqual(trace.attacks.slice(1).map(x=>x.kind),
  ['punch','punch','hook','kick'],'Live four-stage gameplay must be distinct');
 assert(trace.samples.some(x=>x.stage==='jab'&&x.attackElapsed>.2),
  'Jab must progress through live gameplay, not a frozen pose');
 assert(trace.samples.some(x=>x.stage==='return-to-idle'&&x.punchT<=0),
  'Full attack-to-standing recovery is mandatory');

 const jab=trace.samples.filter(x=>x.stage==='jab');
 assert(jab[0].foeHp>jab[jab.length-1].foeHp,
  'The live grounded opening jab must actually damage the nearby rival');
 assert(trace.samples.filter(x=>/^combo-[1-4]$/.test(x.stage))
  .every(x=>x.foeHp===100),'The out-of-range combo must actually whiff');
 // Verify the actual final V72 slot in continuous live gameplay, not only
 // attackKind metadata. Using a stable attackSerial seed prevents confusing
 // existing per-attack alternation with nondeterminism across FPS runs.
 for(const [stage,slot] of [['combo-1','punch1'],['combo-2','punch2'],
                            ['combo-3','punch3'],['combo-4','kick']]){
  const selected=trace.samples.filter(x=>x.stage===stage&&
    x.punchT>.04&&x.attackElapsed>.08).map(x=>x.v72);
  assert(selected.includes(slot),
   'Unexpected native legacy V72 slot for '+stage+': '+JSON.stringify([...new Set(selected)]));
 }
 if(fps===60){
  const own=trace.ownership;
  assert(own&&own.boneCount===20&&own.frames.length>=15,
   'Real 20-joint writer attribution must capture several complete states');
  const totals=own.changedOwnerTotals;
  assert((totals['v72-published-actions.js']||0)>0,
   'The old recorded V72 must ACTUALLY change Kairo joints');
  assert((totals['game.js']||0)>0,
   'The actual procedural real-VRM base must change Kairo joints');
  const attacks=own.frames.filter(f=>f.stage==='jab'||
   /^combo-/.test(f.stage));
  assert(attacks.some(f=>(f.changedByOwner['v72-published-actions.js']||0)>0),
   'V72 recording must actually change joints during a real attack');
  const idle=own.frames.filter(f=>f.stage==='pre-attack-idle');
  assert(idle.some(f=>(f.changedByOwner['v72-published-actions.js']||0)>0),
   'Capture old recorded idle owner before replacing any standing stance');
  // A REAL FINAL-JOINT ownership contract for the EXISTING base game.
  // These cases are drawn from the measured baseline, not guessed masks.
  // Do not apply this as an invariant to a hypothetical new combat system.
  const last=(stage,bone,owner)=>own.frames.some(f=>f.stage===stage&&
   f.bones[bone]?.lastChanged===owner);
  assert(last('pre-attack-idle','hips','v72-published-actions.js')&&
   last('pre-attack-idle','leftHand','v76-upper-body.js'),
   'Ground idle is split: V72 body + V76 approved hands');
  assert(last('combo-1','leftUpperLeg','game.js')&&
   last('combo-1','leftHand','v72-published-actions.js'),
   'Ground punch is split: procedural weight-bearing legs + V72 attack arms');
  assert(last('guard','leftFoot','game.js')&&
   last('guard','leftHand','v72-published-actions.js'),
   'Guard is split: procedural support feet + recorded upper body');
  assert(last('combo-4','leftFoot','v72-published-actions.js')&&
   last('combo-4','leftHand','v72-published-actions.js'),
   'Recorded kick takes all 20 bones in the active clip');
  assert(['jab','combo-3'].some(stage=>
   last(stage,'leftFoot','v81-pose-transitions.js')&&
   last(stage,'leftHand','v81-pose-transitions.js')),
   'V81 transition can become last modifier of ALL joints on active attacks');
 }
 const guard=trace.samples.filter(x=>x.stage==='guard');
 assert(guard.some(x=>x.blocking===true),'Must activate actual guard gameplay');
 assert(trace.samples.every(x=>x.q.length===20&&
   x.q.every(q=>q.length===4&&q.every(Number.isFinite)&&
    Math.abs(Math.hypot(...q)-1)<.008)),
 'Every FINAL real-VRM joint quaternion must be unit and finite');
 assert(trace.samples.every(x=>[...x.hips,...x.leftFoot,...x.rightFoot,...x.pos]
  .every(Number.isFinite)), 'Kairo actual physical positions must be finite');
 const bad=trace.errors.filter(x=>!x.includes(
  'Sky Clash V63: leaving V62 fallback active Error: V62 native master could not be found'));
 assert.deepEqual(bad,[],'Unexpected browser errors, including real animation failures');
}
async function main(){
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage','--no-sandbox'
 ]});
 const page=await browser.newPage({viewport:{width:960,height:640},
  deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push('pageerror '+String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,900));});
 try{
  const origin='http://127.0.0.1:'+(process.env.VISUAL_PORT||'8765');
  await page.goto(origin+'/index.html',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPublishedActions?.ready&&
   window.SkyClashPoseTransitions?.characters&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
    null,{timeout:180000});
  // Freeze ONLY the test page's asynchronous RAF gameplay updates.
  // The fixture itself now executes real Fighter.update and Combat.melee.
  const setup=await page.evaluate((names)=>{
   const g=window.SkyClash.Game,s=window.SkyClash;
   g.enterDojo();g.introT=0;
   for(const n of document.querySelectorAll('#titleScreen,.title-screen,.menu-overlay,.loading-overlay'))
    n.style.setProperty('display','none','important');
   g.update=()=>{};s.CameraRig.update=()=>{};
   const p=g.player,vrm=p.vrmRig.vrm;
   const cv=document.querySelector('canvas'),gl=cv?.getContext('webgl2')||cv?.getContext('webgl');
   const all=names.every(n=>!!vrm.humanoid.getNormalizedBoneNode(n));
   return {characterId:p.characterId,realVRM:all&&!!vrm.scene,
    webGL:!!gl,rigBones:all?names.length:0,
    published:!!window.SkyClashPublishedActions?.ready,
    v81:!!p.v81PoseTransitions,airOwner:!!window.SkyClashV100Animator,
    modelSha256:null}; // Node fingerprints the exact bytes checked out in CI
  },NAMES);
  setup.modelSha256=SHA;
  assert(setup.realVRM&&setup.webGL,
   'Must not silently fall back to the procedural avatar');
  const traces=[];
  for(const fps of fpsList){
   const trace=await page.evaluate(({fps,names})=>{
    const game=window.SkyClash,p=game.Game.player,e=game.Game.enemy;
    const h=p.vrmRig.vrm.humanoid,THREE=window.THREE,dt=1/fps;
    const point=name=>h.getNormalizedBoneNode(name)
      .getWorldPosition(new THREE.Vector3()).toArray();
    // Use a disposable actual game world. Never replace any animation owner.
    const reset=(targetZ)=>{
     p.reset();e.reset();
     p.spawn.set(0,p.floor,0);p.pos.set(0,p.floor,0);
     e.spawn.set(0,e.floor,targetZ);e.pos.set(0,e.floor,targetZ);
     p.vel.set(0,0,0);e.vel.set(0,0,0);
     p.moveIntent.set(0,0,0);e.moveIntent.set(0,0,0);
     p.facing=0;e.facing=Math.PI;
     p.blockHeld=false;p.blocking=false;
     p.jumping=false;p.flying=false;p.sprinting=false;
     p.stun=0;p.launched=false;p.downT=0;p.punchT=0;
     p.hp=100;e.hp=100;p.invulnT=0;e.invulnT=0;
     p.t=10;e.t=10;p.lastMelee=-20;
     // The production reset() intentionally increments this serial. Without
     // pinning it, running FPS scenarios one after another alternates
     // punch1/punch2 by reset count and creates a FALSE frame-rate finding.
     p.attackSerial=0;p.comboCycle=0;
     p.combo=0;p.meleeCd=0;p.comboFollow=null;
     game.Game.mode='dojo';game.Game.dojoRival=true;
     // Run the original game without title input and without AI randomness.
     p.animate(dt);e.animate(dt);
    };
    const samples=[],attacks=[];

    // Read-only INSTRUMENTATION: wrap methods on the actual 20 normalized
    // Kairo quaternion instances, never substitute an animation or writer.
    // Parse the *direct call site's file*, not a shared V72 status label.
    // Trace only 60fps and one frame per 10 simulated ticks for bounded CI.
    const writerTrace=fps===60?(()=>{
     const methods=['copy','set','identity','normalize','slerp',
      'slerpQuaternions','multiply','premultiply','multiplyQuaternions',
      'setFromEuler','setFromAxisAngle','setFromRotationMatrix',
      'setFromUnitVectors','invert','conjugate'];
     const originals=[],frames=[],ownerTotals={},stageTotals={};
     const lastByStage={};let current=null,active=false;
     const ownerFromStack=()=>{
      const stack=String(new Error().stack||'');
      const m=stack.match(/\/js\/([a-z0-9-]+\.js)(?::|\?|[)\s])/i);
      return m?m[1]:'unattributed';
     };
     names.forEach(bone=>{
      const q=h.getNormalizedBoneNode(bone).quaternion;
      for(const method of methods){
       const old=q[method];
       if(typeof old!=='function')continue;
       let depth=0;
       const wrapped=function(...args){
        if(!active||depth)return old.apply(this,args);
        const x=this.x,y=this.y,z=this.z,w=this.w;
        depth++;let result;
        try{result=old.apply(this,args);}finally{depth--;}
        const dx=Math.hypot(this.x-x,this.y-y,this.z-z,this.w-w);
        const ds=Math.hypot(this.x+x,this.y+y,this.z+z,this.w+w);
        const changed=Math.min(dx,ds)>1e-8;
        const owner=ownerFromStack();
        const key=bone;
        let entry=current.bones[key];
        if(!entry)entry=current.bones[key]={lastChanged:null,lastCalled:null,
         changed:0,called:0,byOwner:{}};
        entry.called++;entry.lastCalled=owner;
        entry.byOwner[owner]=(entry.byOwner[owner]||0)+1;
        if(changed){
         entry.changed++;entry.lastChanged=owner;
         current.changedByOwner[owner]=(current.changedByOwner[owner]||0)+1;
        }
        current.calledByOwner[owner]=(current.calledByOwner[owner]||0)+1;
        return result;
       };
       q[method]=wrapped;originals.push({q,method,old});
      }
     });
     return {
      begin(stage,frame){
       const step=stage===lastByStage.name?(lastByStage.tick+1):0;
       lastByStage.name=stage;lastByStage.tick=step;
       // Include the first frame and regular samples across every state.
       if(step%10!==0)return;
       current={stage,frame,bones:{},changedByOwner:{},calledByOwner:{}};
       active=true;
      },
      end(){
       if(!active)return;
       active=false;
       for(const [owner,n] of Object.entries(current.changedByOwner))
        ownerTotals[owner]=(ownerTotals[owner]||0)+n;
       for(const [owner,n] of Object.entries(current.changedByOwner)){
        const key=current.stage+' / '+owner;
        stageTotals[key]=(stageTotals[key]||0)+n;
       }
       frames.push(current);current=null;
      },
      report(){return {method:'direct normalized-quaternion API call-site capture',
       fps:60,boneCount:names.length,frames,
       changedOwnerTotals:ownerTotals,changedOwnerByStage:stageTotals,
       limits:[
        'Tracks methods called on 20 real normalized-bone quaternions only',
        'LastChanged means last measured quaternion-changing API call, not sole creative owner',
        'Direct x/y/z/w property setters and fingers outside these 20 bones are not captured',
        'The callback may include V81 transition after V72; that is intentional and must not be mistaken for new attack motion',
        'This read-only diagnostic instruments a subset of 60fps frames, not every rendered frame'
       ]};},
      restore(){active=false;for(const {q,method,old} of originals)q[method]=old;}
     };
    })():null;

    let frame=0,stage='starting';
    const observe=()=>{
     p.vrmRig.vrm.scene.updateMatrixWorld(true);
     samples.push({frame:frame++,time:+(frame*dt).toFixed(5),stage,
      attackElapsed:+(p.attackElapsed||0).toFixed(5),
      punchT:+p.punchT.toFixed(5),attackKind:p.attackKind,
      attackVariant:p.attackVariant||null,
      blocking:!!p.blocking,stun:+p.stun.toFixed(5),
      hp:p.hp,foeHp:e.hp,combo:p.combo,attackAir:!!p.attackAir,
      v72:p.v72StudioPack?.slot||null,
      v81:p.v81PoseTransitions?.mode||null,
      v100:window.SkyClashPoseAuthority?.active||null,
      pos:p.pos.toArray(),hips:point('hips'),
      leftFoot:point('leftFoot'),rightFoot:point('rightFoot'),
      leftHand:point('leftHand'),rightHand:point('rightHand'),
      q:names.map(n=>h.getNormalizedBoneNode(n)
       .quaternion.toArray().map(q=>+q.toFixed(8)))});
    };
    const tick=(seconds)=>{
     const n=Math.round(seconds*fps);
     for(let i=0;i<n;i++){
      writerTrace?.begin(stage,frame);
      try{p.update(dt);}finally{writerTrace?.end();}
      // The defender is stationary: it still has real health and receives
      // game hit rules, but doesn't trigger AI attacks back at the camera.
      observe();
     }
    };
    reset(2.2);
    stage='pre-attack-idle';tick(1.0);
    game.Combat.melee(p,e);
    attacks.push({kind:p.attackKind,variant:p.attackVariant,
     duration:p.attackTotal,contact:p.kickPend?.t,
     attackAir:!!p.attackAir,stage:0});
    stage='jab';tick(.82);
    stage='return-to-idle';tick(.75);
    stage='guard';p.blockHeld=true;tick(.38);
    stage='guard-release';p.blockHeld=false;tick(.5);
    // A separate *continuous* four-press whiff sequence:
    // retain Kairo's movement, timers and natural pose owner. Position the
    // foe out of reach; the real attack physics still runs on every frame.
    reset(20);
    stage='combo-entry';tick(.25);
    for(let i=0;i<4;i++){
     game.Combat.melee(p,e);
     attacks.push({kind:p.attackKind,variant:p.attackVariant,
      duration:p.attackTotal,contact:p.kickPend?.t,
      attackAir:!!p.attackAir,stage:i});
     stage='combo-'+(i+1);
     tick((p.attackTotal||.55)+.09);
    }
    stage='combo-exit-to-idle';tick(.65);
    const ownership=writerTrace?.report()||null;
    writerTrace?.restore();
    return {fps,samples,attacks,ownership};
   },{fps,names:NAMES});
   trace.setup=setup;trace.errors=[...errors];
   verify(trace,fps);
   if(trace.ownership)fs.writeFileSync(
    path.join(OUT,'writer-ownership-60fps.json'),
    JSON.stringify(trace.ownership,null,2));
   fs.writeFileSync(path.join(OUT,'continuous-'+fps+'fps.json'),
    JSON.stringify(trace));
   const first=trace.samples.find(x=>x.stage==='pre-attack-idle');
   const last=trace.samples.findLast(x=>x.stage==='combo-exit-to-idle');
   // Measure, do NOT auto-approve foot planting. Only compare successive
   // frames when the simulated physical root hardly moved.
   let maxStationaryRootFootDeltaPerFrame=0;
   for(let i=1;i<trace.samples.length;i++){
    const a=trace.samples[i-1],b=trace.samples[i];
    if(a.stage!==b.stage||
       Math.hypot(b.pos[0]-a.pos[0],b.pos[2]-a.pos[2])>=.015)continue;
    for(const foot of ['leftFoot','rightFoot']){
     const p=a[foot],q=b[foot];
     maxStationaryRootFootDeltaPerFrame=Math.max(
      maxStationaryRootFootDeltaPerFrame,
      Math.hypot(q[0]-p[0],q[2]-p[2]));
    }
   }
   traces.push({fps,frames:trace.samples.length,
    attacks:trace.attacks.map(({kind,variant,contact,duration})=>
     ({kind,variant,contact,duration})),
    startPose:first?.v72,endPose:last?.v72,
    hasRealGuard:trace.samples.some(x=>x.blocking),
    maxStationaryRootFootDeltaPerFrame:
      +maxStationaryRootFootDeltaPerFrame.toFixed(5)});
  }
  const report={status:'CAPTURED_NOT_VISUALLY_APPROVED',
   intent:'Baseline existing actual game, never a new animation',
   modelSha256:SHA,realVRM:true,scriptNotLoadedInGame:true,
   writerAttribution:traces.length===3?'recorded-in-60fps-trace':null,
   fps:fpsList,results:traces,limitations:[
    'This captures complete existing final-pose frames and gameplay clocks, not aesthetics',
    'Writer attribution measures actual 20-joint changing API call sites at sampled 60fps frames; not every scalar setter or IK/finger node',
    'Targeted jab uses real melee and defender; combo deliberately whiffs',
    'No actual new artwork has been produced'
   ]};
  fs.writeFileSync(path.join(OUT,'readme-report.json'),JSON.stringify(report,null,2));
  console.log('PASS KAIRO_REAL_GAME_FOUNDATION '+JSON.stringify({
   modelSha256:SHA,frames:traces.map(t=>t.frames),fps:fpsList,
   note:'baseline telemetry only; not visual approval'}));
 }finally{await browser.close();}
}
main().catch(err=>{console.error(err.stack||String(err));process.exitCode=1;});
