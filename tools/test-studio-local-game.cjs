/* Real WebGL end-to-end: Animation Studio baked pack → local IDB → Kairo V72.
 * Runs against HTTP checkout; does not modify any shipped asset or controller.
 */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=(process.env.PLAYTEST_BASE_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage','--no-sandbox'
 ]});
 try{
  const context=await browser.newContext({viewport:{width:960,height:640}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  async function navigate(query){
   const response=await page.goto(base+'index.html'+query,
    {waitUntil:'domcontentloaded',timeout:45000});
   assert(response.ok(),'Cannot open playable game');
   await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
    window.SkyClashPublishedActions&&window.SkyClashPoseAuthority?.ready&&
    window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
    null,{timeout:180000});
  }
  // Explicit playtest with nothing saved must fail open into original combat.
  await navigate('?scene=dojo&studioPlaytest=local');
  const empty=await page.evaluate(()=>({
   state:window.SkyClashPublishedActions.localPlaytest.state,
   statusText:document.getElementById('studioLocalMovesStatus')?.textContent,
   ready:window.SkyClashPublishedActions.ready
  }));
  assert.equal(empty.state,'fallback');
  assert(empty.ready&&empty.statusText?.includes('original game active'));
  // Simulate the exact valid pack produced by the editor, but substitute
  // Kairo's approved idle recording into the punch1 slot to make the
  // override unmistakably different from the shipped V87 punch.
  const saved=await page.evaluate(async()=>{
   const response=await fetch('assets/animations/gameplay/studio-actions-v1.json');
   if(!response.ok)throw Error('Shipped Studio pack unavailable');
   const pack=await response.json();
   const idle=pack.motions.find(x=>x.slot==='idle'&&x.character==='kairo');
   if(!idle)throw Error('No real baked idle motion for E2E test');
   // Make a genuine compact 20-bone clip with strongly authored hip/leg
   // rotations, so the real VRM test can detect the original masking bug.
   const raw=Uint8Array.from(atob(idle.data),c=>c.charCodeAt(0));
   const view=new DataView(raw.buffer),stride=20*4;
   const authored={
    0:[0,Math.sin(.21),0,Math.cos(.21)],
    14:[Math.sin(.30),0,0,Math.cos(.30)],
    15:[Math.sin(.17),0,0,Math.cos(.17)],
    17:[Math.sin(-.27),0,0,Math.cos(-.27)],
    18:[Math.sin(-.13),0,0,Math.cos(-.13)]
   };
   for(let frame=0;frame<idle.frames;frame++)
    for(const [bone,q] of Object.entries(authored))
     for(let j=0;j<4;j++)
      view.setInt16((frame*stride+Number(bone)*4+j)*2,Math.round(q[j]*32767),true);
   const data=btoa(Array.from(raw,b=>String.fromCharCode(b)).join(''));
   const local={...idle,data,slot:'punch1',sourceFile:'local-apply-to-game-test.fbx'};
   const sample={schema:pack.schema,revision:pack.revision,motions:[local]};
   return await window.SkyClashStudioLiveBridge.save(sample);
  });
  assert.deepEqual(saved.slots,['punch1']);
  await navigate('?scene=dojo&studioPlaytest=local');
  const applied=await page.evaluate(()=>{
   const s=window.SkyClashPublishedActions;
   const p=window.SkyClash.Game.player;
   const active=s.motionClips.punch1,originalIdle=s.motionClips.idle;
   const samples=()=>Array.from({length:20},()=>new window.THREE.Quaternion());
   const a=samples(),b=samples();
   active.sample(.22,a,false);originalIdle.sample(.22,b,false);
   const angles=a.map((q,i)=>q.angleTo(b[i]));
   window.SkyClash.Game.enterDojo();window.SkyClash.Game.update=()=>{};
   window.SkyClash.CameraRig.update=()=>{};window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.blockHeld=false;p.blocking=false;
   p.sprinting=false;p.dashing=false;p.punchT=.3;p.attackKind='punch';
   p.punchSide=1;p.attackSerial=(p.attackSerial||0)+1;p.attackElapsed=.05;p.attackTotal=.42;
   p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   for(let i=0;i<10;i++){p.t+=1/60;p.animate(1/60);}
   const h=p.vrmRig.vrm.humanoid;
   const names=['hips','leftUpperLeg','leftLowerLeg','rightUpperLeg','rightLowerLeg'];
   const pose=()=>names.map(n=>h.getNormalizedBoneNode(n).quaternion.clone());
   const footAnchors=Object.values(p.v72StudioPack.localStrikeFeet)
    .filter(x=>x?.point).length;
   const fullBodyPunchFrames=s.localPlaytest.fullBodyPunchFrames;
   return {state:s.localPlaytest.state,slots:s.localPlaytest.slots,
    footAnchors,fullBodyPunchFrames,
    sourceFile:active.sourceFile,sourceDiffersFromIdle:angles.some(x=>x>.02),
    visibleSlot:p.v72StudioPack?.slot,native:p.v72StudioPack?.nativePreviewActive,
    indicator:document.getElementById('studioLocalMovesStatus')?.textContent,
    error:s.error};
  });
  assert.equal(applied.state,'ready');
  assert.deepEqual(applied.slots,['punch1']);
  assert.equal(applied.sourceFile,'local-apply-to-game-test.fbx');
  assert(applied.sourceDiffersFromIdle,'Locally authored full-body animation was not decoded in V72');
  assert.equal(applied.visibleSlot,'punch1','Actual Kairo fighter did not select local punch');
  assert(!applied.native);
  assert(applied.indicator?.includes('1 local moves active'));
  assert.equal(applied.error,null);
  assert(applied.fullBodyPunchFrames>0,'Local grounded punch not full-body');
  assert.equal(applied.footAnchors,2,'Missing strike foot anchors');
  // Real Kairo/real VRM repeated-combo regression: published V87 overhand
  // must never displace a locally assigned punch3 on the second cycle.
  // Use real baked quaternion data, not invented skeleton keyframes.
  await page.evaluate(async()=>{
   const current=await window.SkyClashStudioLiveBridge.load();
   const first=current.pack.motions[0],others=[
    {...first,slot:'punch3',sourceFile:'local-repeated-punch3.fbx'},
    {...first,slot:'kick',sourceFile:'local-roundhouse.fbx'}
   ];
   await window.SkyClashStudioLiveBridge.save({
    ...current.pack,motions:[first,...others]
   });
  });
  await navigate('?scene=dojo&studioPlaytest=local');
  const repeated=await page.evaluate(()=>{
   const p=window.SkyClash.Game.player,s=window.SkyClashPublishedActions;
   window.SkyClash.Game.enterDojo();
   window.SkyClash.Game.update=()=>{};
   window.SkyClash.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.blockHeld=false;p.blocking=false;
   p.sprinting=false;p.dashing=false;p.jumping=false;p.flying=false;
   p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   const runs=[];
   for(const variant of ['hook','overhand','hook','overhand']){
    p.punchT=.50;p.attackKind='hook';p.attackVariant=variant;
    p.punchSide=1;p.attackSerial=(p.attackSerial||0)+1;
    p.attackElapsed=.09;p.attackTotal=.68;p.t+=1/60;
    p.animate(1/60);
    runs.push({variant,slot:p.v72StudioPack.slot,full:p.v72StudioPack.localFullBodyPunchActive,
     source:s.motionClips[p.v72StudioPack.slot]?.sourceFile,
     anchors:Object.keys(p.v72StudioPack.localStrikeFeet).length});
    p.punchT=0;p.attackElapsed=.68;p.t+=1/60;p.animate(1/60);
   }
   p.attackKind='kick';p.attackVariant='hook';p.punchSide=0;
   p.punchT=.7;p.attackTotal=.87;p.attackElapsed=.41;
   p.attackSerial=(p.attackSerial||0)+1;p.t+=1/60;p.animate(1/60);
   return {runs,kickSlot:p.v72StudioPack.slot,kickClock:p.v72StudioPack.clock,
    kickImpact:s.motionClips.kick.kickImpact,localState:s.localPlaytest.state,error:s.error};
  });
  assert.equal(repeated.localState,'ready');
  assert.equal(repeated.error,null);
  for(const run of repeated.runs){
   assert.equal(run.slot,'punch3','Repeated VRM Kairo hook/overhand chose wrong clip');
   assert.equal(run.source,'local-repeated-punch3.fbx');
   assert(run.full,'Repeated Studio hook must retain authored full-body legs');
   assert.equal(run.anchors,0,'Legacy Studio punch3 must not invent two grounded foot anchors');
  }
  assert.equal(repeated.kickSlot,'kick');
  assert(Math.abs(repeated.kickClock-repeated.kickImpact)<.08,
   'Kairo roundhouse must sample source contact window rather than time-warped full clip');
  // Second/third/fourth kicks reuse the SAME saved Mixamo full-body
  // roundhouse, with a fresh serial, pose handoff and foot-contact state.
  // The old implementation treated kick as NOT a new full-body strike.
  const kicks=await page.evaluate(()=>{
   const p=window.SkyClash.Game.player,s=window.SkyClashPublishedActions;
   const results=[];
   p.hp=100;p.stun=0;p.downT=0;p.flying=false;p.jumping=false;
   p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   for(let i=0;i<4;i++){
    p.punchT=.72;p.attackKind='kick';p.attackVariant=i%2?'overhand':'hook';
    p.attackSerial=(p.attackSerial||0)+1;p.attackElapsed=.10;p.attackTotal=.87;
    p.t+=1/60;p.animate(1/60);
    results.push({serial:p.attackSerial,slot:p.v72StudioPack.slot,
     source:s.motionClips[p.v72StudioPack.slot]?.sourceFile,
     key:p.v72StudioPack.localStrikeKey,
     handoff:!!p.v72StudioPack.localEntryPose,
     legs:p.v72StudioPack.localFullBodyKickActive,
     anchors:Object.keys(p.v72StudioPack.localStrikeFeet).length});
    p.punchT=0;p.attackElapsed=.87;p.t+=1/60;p.animate(1/60);
   }
   return results;
  });
  for(const kick of kicks){
   assert.equal(kick.slot,'kick','An older published clip displaced the local kick');
   assert.equal(kick.source,'local-roundhouse.fbx');
   assert(kick.key.includes(String(kick.serial)+':kick'),'Kick serial was not reset');
   assert(kick.handoff,'Repeated kick failed to capture previous full-body pose');
   assert(kick.legs,'Repeated kick lost full-body leg ownership');
   assert.equal(kick.anchors,0,'Old Studio kick must not force phantom two-foot anchors');
  }
  // Same browser and IndexedDB, but NO opt-in flag: original published
  // punch1 must remain exactly as before.
  await navigate('?scene=dojo');
  const normal=await page.evaluate(()=>{
   const status=window.SkyClashPublishedActions, p=window.SkyClash.Game.player;
   window.SkyClash.Game.enterDojo();window.SkyClash.Game.update=()=>{};
   window.SkyClash.CameraRig.update=()=>{};window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.blockHeld=false;p.blocking=false;
   p.sprinting=false;p.dashing=false;p.jumping=false;p.flying=false;
   p.punchT=.35;p.attackKind='punch';p.punchSide=1;
   p.attackSerial=(p.attackSerial||0)+1;p.attackElapsed=.05;p.attackTotal=.42;
   p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   for(let i=0;i<10;i++){p.t+=1/60;p.animate(1/60);}
   const fullBody=p.v72StudioPack.localFullBodyPunchActive===true;
   const count=status.groundedPunchBodyFrames||0;
   return {state:status.localPlaytest.state,
    sourceFile:status.motionClips.punch1?.sourceFile,
    indicator:!!document.getElementById('studioLocalMovesStatus'),
    fullBody,count};
  });
  assert.equal(normal.state,'off');
  assert.notEqual(normal.sourceFile,'local-apply-to-game-test.fbx');
  assert(!normal.indicator);
  assert(normal.fullBody&&normal.count>0,'Published Kairo still uses masked punches');
  // Preview-only Kairo body expression on ACTUAL VRM/Chromium. The
  // approved idle/jump/flight stay intact when this URL flag is absent.
  await navigate('?scene=dojo&flightBody=alive');
  const livingFlight=await page.evaluate(()=>{
   const p=window.SkyClash.Game.player,a=window.SkyClashPoseAuthority;
   window.SkyClash.Game.enterDojo();
   window.SkyClash.Game.update=()=>{};
   window.SkyClash.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.blockHeld=false;p.blocking=false;
   p.punchT=0;p.blastT=0;p.sprinting=false;p.dashing=false;
   p.jumping=false;p.dropping=false;p.landingMotionT=0;p.acro=null;
   p.pos.y=2.3;p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   const humanoid=p.vrmRig.vrm.humanoid;
   const joints=['chest','leftUpperArm','rightUpperArm','leftHand','rightHand',
    'leftLowerLeg','rightLowerLeg','leftFoot','rightFoot']
    .map(name=>humanoid.getNormalizedBoneNode(name));
   const samples=[],heights=[];
   for(let i=0;i<165;i++){
    p.t+=1/60;p.animate(1/60);
    if(i===74||i===134){
     samples.push(joints.map(j=>j.quaternion.clone()));
     heights.push(p.pos.y);
    }
   }
   const deltas=samples[0].map((q,i)=>q.angleTo(samples[1][i]));
   return {active:a.active,style:a.flightBodyExpression,amplitude:a.flightBodyDegrees,
    difference:deltas[0],arms:deltas.slice(1,3),wrists:deltas.slice(3,5),
    legs:deltas.slice(5,7),ankles:deltas.slice(7),
    heights,owner:a.owner,source:a.flightAuthoredVariant,error:a.error};
  });
  assert.equal(livingFlight.active,'flight');
  assert.equal(livingFlight.style,'V175 recovered authored living flight');
  assert(livingFlight.amplitude>1&&livingFlight.amplitude<7.5);
  assert(livingFlight.difference>.001&&livingFlight.difference<.022,
   'Real Kairo ribs should breathe but not repeatedly bow');
  assert(livingFlight.arms.some(d=>d>.008),
   'At least one real Kairo arm must move through the hover expression');
  assert(livingFlight.legs.some(d=>d>.008),
   'Real Kairo knees must visibly follow the hover expression');
  assert(livingFlight.wrists.some(d=>d>.010),
   'Real Kairo hands need visible gentle wrist motion');
  assert(livingFlight.ankles.some(d=>d>.005),
   'Real Kairo feet must gently follow');
  assert(livingFlight.heights.every(h=>h===2.3),'visual breathing must not shift physics root');
  assert(!livingFlight.error,'V100 flight preview must not throw');
  // The previous flight preview accidentally dropped studioPlaytest=local,
  // replacing the user's Mixamo punches with published defaults. The
  // combined URL must retain the applied punch clips AND make the body
  // visibly breathe if Studio owns floating/flying instead of V100.
  await navigate('?scene=dojo&studioPlaytest=local');
  await page.evaluate(async()=>{
   const current=await window.SkyClashStudioLiveBridge.load();
   const sample=current.pack.motions[0],extras=[
    {...sample,slot:'floating',sourceFile:'user-studio-floating.fbx'},
    {...sample,slot:'flying',sourceFile:'user-studio-flying.fbx'}
   ];
   await window.SkyClashStudioLiveBridge.save({...current.pack,
    motions:[...current.pack.motions,...extras]});
  });
  await navigate('?scene=dojo&studioPlaytest=local&flightBody=alive');
  const combined=await page.evaluate(()=>{
   const p=window.SkyClash.Game.player,s=window.SkyClashPublishedActions;
   window.SkyClash.Game.enterDojo();
   window.SkyClash.Game.update=()=>{};
   window.SkyClash.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.blockHeld=false;p.blocking=false;
   p.punchT=0;p.blastT=0;p.sprinting=false;p.dashing=false;
   p.jumping=false;p.dropping=false;p.landingMotionT=0;p.acro=null;
   p.pos.y=2.3;p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   const humanoid=p.vrmRig.vrm.humanoid;
   const joints=['chest','leftUpperArm','rightUpperArm','leftHand','rightHand',
    'leftLowerLeg','rightLowerLeg','leftFoot','rightFoot']
    .map(name=>humanoid.getNormalizedBoneNode(name));
   // The researched animation intentionally has quiet intervals.
   // Do not judge a single final frame; walk one complete 8.8s gesture
   // cycle, checking that each actual VRM joint changes at some point.
   const pair=[],cycle=[],amplitudes=[];
   for(let i=0;i<540;i++){
    p.t+=1/60;p.animate(1/60);
    amplitudes.push(s.localPlaytest.flightBodyDegrees||0);
    if(i===74||i===134)pair.push(joints.map(j=>j.quaternion.clone()));
    if(i%30===0)cycle.push(joints.map(j=>j.quaternion.clone()));
   }
   const deltaPair=pair[0].map((q,i)=>q.angleTo(pair[1][i]));
   const excursion=joints.map((_,i)=>{
    let most=0;
    for(let a=0;a<cycle.length;a++)
     for(let b=a+1;b<cycle.length;b++)
      most=Math.max(most,cycle[a][i].angleTo(cycle[b][i]));
    return most;
   });
   const flight={slot:p.v72StudioPack.slot,owner:s.localPlaytest.flightBodyOwner,
    amplitude:Math.max(...amplitudes),difference:deltaPair[0],
    arms:excursion.slice(1,3),wrists:excursion.slice(3,5),
    legs:excursion.slice(5,7),ankles:excursion.slice(7)};
   p.pos.y=0;p.punchT=.35;p.attackKind='hook';p.attackVariant='overhand';
   p.punchSide=1;p.attackSerial=(p.attackSerial||0)+1;
   p.attackElapsed=.08;p.attackTotal=.68;p.t+=1/60;p.animate(1/60);
   return {state:s.localPlaytest.state,slots:s.localPlaytest.slots,
    flight,punchSlot:p.v72StudioPack.slot,
    punchSource:s.motionClips[p.v72StudioPack.slot]?.sourceFile,
    indicator:document.getElementById('studioLocalMovesStatus')?.textContent,
    error:s.error};
  });
  assert.equal(combined.state,'ready');
  assert(combined.indicator.includes('local moves active'));
  assert.equal(combined.flight.slot,'floating');
  assert.equal(combined.flight.owner,'V72 Studio flight');
  assert(combined.flight.amplitude>1&&combined.flight.amplitude<7.5,
   'Studio hover expression must remain gentle');
  assert(combined.flight.difference>.001&&combined.flight.difference<.022,
   'Studio floating torso must breathe without visible bowing');
  assert(combined.flight.arms.some(d=>d>.008),
   'Studio-owned flight must move real Kairo arms naturally');
  assert(combined.flight.legs.some(d=>d>.008),
   'Studio-owned flight must animate real Kairo knees');
  assert(combined.flight.wrists.some(d=>d>.010),
   'Studio flight must animate real Kairo wrists');
  assert(combined.flight.ankles.some(d=>d>.005),
   'Studio flight must animate real Kairo ankles');
  assert.equal(combined.punchSlot,'punch3');
  assert.equal(combined.punchSource,'local-repeated-punch3.fbx',
   'Combined flight preview must keep the saved Studio punch3');
  assert.equal(combined.error,null);
  // Real Kairo + VRM: a locally assigned landing must complete at
  // 1x with hips AND legs, while run-to-stop must start at supported
  // recorded foot contact rather than leave Ninja Boost's old torso
  // over procedural legs. The sample clips below are existing shipped
  // FBX-baked poses; no private user motion assets enter this repo.
  await page.evaluate(async()=>{
   const bridge=window.SkyClashStudioLiveBridge,original=await bridge.load();
   const source=await (await fetch('assets/animations/gameplay/v86-ue5-converted-actions.json')).json();
   const landing=source.motions.find(m=>m.slot==='landing');
   const stop=source.motions.find(m=>m.slot==='runStop');
   if(!landing||!stop)throw Error('Missing shipped real Mixamo landing/stop fixtures');
   await bridge.save({...original.pack,motions:[
    ...original.pack.motions,
    {...landing,sourceFile:'studio-landing-test.fbx'},
    {...stop,sourceFile:'studio-grounded-stop-test.fbx',
     footContacts:'0'.repeat(11)+'3'.repeat(stop.frames-11)}
   ]});
  });
  await navigate('?scene=dojo&studioPlaytest=local&flightBody=alive');
  const groundRecovery=await page.evaluate(()=>{
   const g=window.SkyClash.Game,p=g.player,s=window.SkyClashPublishedActions;
   g.enterDojo();g.update=()=>{};
   window.SkyClash.CameraRig.update=()=>{};window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.blockHeld=false;p.blocking=false;
   p.punchT=0;p.blastT=0;p.sprinting=false;p.dashing=false;
   p.jumping=false;p.flying=false;p.dropping=false;p.acro=null;
   p.pos.y=0;p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   p.landingMotionT=.48;p.v109LandingDuration=.48;
   const hum=p.vrmRig.vrm.humanoid;
   const hip=hum.getNormalizedBoneNode('hips');
   const thigh=hum.getNormalizedBoneNode('leftUpperLeg');
   const landingBefore=hip.quaternion.clone();
   for(let i=0;i<45;i++){
    p.t+=1/60;p.animate(1/60);
    p.landingMotionT=Math.max(0,p.landingMotionT-1/60);
   }
   const landingResult={slot:p.v72StudioPack.slot,
    duration:s.localPlaytest.localLandingDuration,
    frames:s.localPlaytest.localLandingFrames,
    clock:s.localPlaytest.localLandingClock,
    hipDifference:landingBefore.angleTo(hip.quaternion),
    source:s.motionClips.landing.sourceFile};
   p.landingMotionT=0;p.v109LandingDuration=0;
   p._v82WasBoost=true;p.sprinting=false;p.skidT=.38;
   p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   p.t+=1/60;p.animate(1/60);
   const firstLeg=thigh.quaternion.clone(),firstClock=p.v72StudioPack.clock;
   for(let i=0;i<12;i++){p.t+=1/60;p.animate(1/60);}
   return {landing:landingResult,runStop:{
    slot:p.v72StudioPack.slot,
    source:s.motionClips.runStop.sourceFile,
    firstClock,lastClock:p.v72StudioPack.clock,
    thighChange:firstLeg.angleTo(thigh.quaternion),
    frames:s.localPlaytest.localStopFrames,
    rootY:p.pos.y,
    sourceSeconds:s.motionClips.runStop.seconds
   },state:s.localPlaytest.state,error:s.error};
  });
  assert.equal(groundRecovery.state,'ready');
  assert.equal(groundRecovery.landing.slot,'landing',
   'Local landing is hidden by another pose owner');
  assert.equal(groundRecovery.landing.source,'studio-landing-test.fbx');
  assert(groundRecovery.landing.duration>=1.09,'Full landing timer was cut short');
  assert(groundRecovery.landing.clock>.65&&groundRecovery.landing.clock<.9,
   'Studio landing must play uncompressed at 1x, not 2.1x');
  assert(groundRecovery.landing.frames>=40,'Landing did not own enough live frames');
  assert(groundRecovery.landing.hipDifference>.01,'Landing pelvis was masked');
  assert.equal(groundRecovery.runStop.slot,'runStop');
  assert.equal(groundRecovery.runStop.source,'studio-grounded-stop-test.fbx');
  assert(groundRecovery.runStop.firstClock>.33&&groundRecovery.runStop.firstClock<.45,
   'Run stop started on unsupported airborne feet');
  assert(groundRecovery.runStop.lastClock>groundRecovery.runStop.firstClock);
  assert(groundRecovery.runStop.thighChange>.005,
   'Run stop retained old procedural legs instead of source full-body motion');
  assert(groundRecovery.runStop.frames>5);
  assert.equal(groundRecovery.runStop.rootY,0,
   'The visual stop must not move physics root');
  assert.equal(groundRecovery.error,null);
  await page.evaluate(async()=>{
   const bridge=window.SkyClashStudioLiveBridge,current=await bridge.load();
   await bridge.save({...current.pack,
    motions:current.pack.motions.filter(m=>!['landing','runStop'].includes(m.slot))});
  });
  await navigate('?scene=dojo&studioPlaytest=local&flightBody=alive');
  // A saved Base is independent from normal Apply and Reset. Restore
  // must replay the exact same baked data after another local pack was
  // applied, and preserve the chosen Mixamo source names.
  const protectedBase=await page.evaluate(async()=>{
   const bridge=window.SkyClashStudioLiveBridge;
   const original=await bridge.load();
   const base=await bridge.saveBase();
   await bridge.save({...original.pack,motions:[original.pack.motions[0]]});
   await bridge.clear();
   const empty=await bridge.load(),kept=await bridge.loadBase();
   const recovered=await bridge.restoreBase(),active=await bridge.load();
   return {empty:empty===null,kept:kept.slots,
    savedSlots:base.slots,restoredSlots:recovered.slots,
    identical:JSON.stringify(active.pack)===JSON.stringify(original.pack),
    punch3:active.pack.motions.find(m=>m.slot==='punch3')?.sourceFile,
    kick:active.pack.motions.find(m=>m.slot==='kick')?.sourceFile};
  });
  assert(protectedBase.empty,'Reset should clear working preview only');
  assert.deepEqual(protectedBase.kept,protectedBase.savedSlots);
  assert.deepEqual(protectedBase.restoredSlots,protectedBase.savedSlots);
  assert(protectedBase.identical,'Restoring the Base must preserve all exact baked Mixamo data');
  assert.equal(protectedBase.punch3,'local-repeated-punch3.fbx');
  assert.equal(protectedBase.kick,'local-roundhouse.fbx');
  await navigate('?scene=dojo');
  const approvedFlight=await page.evaluate(()=>{
   const p=window.SkyClash.Game.player,a=window.SkyClashPoseAuthority;
   window.SkyClash.Game.enterDojo();
   window.SkyClash.Game.update=()=>{};
   window.SkyClash.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.blockHeld=false;p.blocking=false;
   p.punchT=0;p.blastT=0;p.sprinting=false;p.dashing=false;
   p.jumping=false;p.dropping=false;p.landingMotionT=0;p.acro=null;
   p.pos.y=2.3;p.vel.set(0,0,0);
   for(let i=0;i<140;i++){p.t+=1/60;p.animate(1/60);}
   return {state:a.active,body:a.flightBodyExpression,degrees:a.flightBodyDegrees,error:a.error};
  });
  assert.equal(approvedFlight.state,'flight');
  assert.equal(approvedFlight.body,'off','normal public flight must have no new body movement');
  assert.equal(approvedFlight.degrees,0);
  assert(!approvedFlight.error);
  // Corrupt local DB record: opt-in may fail, but published combat survives.
  await page.evaluate(async()=>{
   // The bridge is purposefully NOT loaded in the default game; keep
   // data access through the same-origin IndexedDB database directly.
   await new Promise((resolve,reject)=>{
    const req=indexedDB.open('sky-clash-studio-game-playtest',1);
    req.onerror=()=>reject(req.error);
    req.onsuccess=()=>{
     const db=req.result,tx=db.transaction('packs','readwrite');
     tx.objectStore('packs').put({id:'kairo',pack:{bad:true},updatedAt:Date.now()});
     tx.oncomplete=()=>{db.close();resolve();};
     tx.onerror=()=>{db.close();reject(tx.error);};
    };
   });
  });
  await navigate('?scene=dojo&studioPlaytest=local');
  const bad=await page.evaluate(()=>({
   state:window.SkyClashPublishedActions.localPlaytest.state,
   ready:window.SkyClashPublishedActions.ready,
   sourceFile:window.SkyClashPublishedActions.motionClips.punch1?.sourceFile
  }));
  assert.equal(bad.state,'fallback');
  assert(bad.ready,'Corrupt local data must not break shipped combat');
  assert.notEqual(bad.sourceFile,'local-apply-to-game-test.fbx');
  assert.equal(errors.length,0,'Browser errors: '+errors.join('; '));
  await page.evaluate(()=>window.SkyClashStudioLiveBridge.clear());
  // Studio's browser-local FBX/ZIP gallery must keep Rokoko Superhero
  // clips independent from the originally imported Mixamo collection.
  // No vendor FBX is bundled or published; these tiny ZIP fixtures only
  // test import provenance, filtering, offline persistence and no apply.
  const studioResponse=await page.goto(base+'animation-studio.html',
   {waitUntil:'domcontentloaded',timeout:45000});
  assert(studioResponse.ok());
  await page.waitForFunction(()=>
   document.getElementById('loadStatus')?.textContent.includes('Animation Studio ready'),
   null,{timeout:120000});
  const originalAssignments=await page.evaluate(()=>
   localStorage.getItem('skyClashV58ActionAssignments'));
  await page.evaluate(async()=>{
   async function simulateImport(inputId,filename,entries){
    const zip=new window.JSZip();
    entries.forEach(([name,contents])=>zip.file(name,new Uint8Array(contents)));
    const bytes=await zip.generateAsync({type:'uint8array'});
    const file=new File([bytes],filename,{type:'application/zip',lastModified:123});
    const transfer=new DataTransfer();transfer.items.add(file);
    const input=document.getElementById(inputId);
    input.files=transfer.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
   }
   await simulateImport('rokokoFileInput','Superhero.zip',[
    ['Superhero/SuperHeroFlying_mixamo.fbx',[1,2,3]],
    ['Superhero/IronMan_Combat_mixamo.fbx',[4,5,6]],
    ['Superhero/SuperHeroLanding_Takeoff_mixamo.fbx',[7,8,9]]
   ]);
  });
  await page.waitForFunction(()=>
   document.getElementById('sourceCountRokoko')?.textContent==='3',
   null,{timeout:45000});
  await page.evaluate(()=>document.querySelector('.source-tab[data-source="rokoko"]').click());
  await page.waitForFunction(()=>document.getElementById('clipCount')?.textContent==='3');
  const isolated=await page.evaluate(()=>({
   rokoko:Number(document.getElementById('sourceCountRokoko').textContent),
   mixamo:Number(document.getElementById('sourceCountMixamo').textContent),
   providerLabels:[...document.querySelectorAll('.clip-source')].map(x=>x.textContent),
   packOptions:[...document.getElementById('packFilter').options].map(x=>x.textContent),
   assignments:localStorage.getItem('skyClashV58ActionAssignments')
  }));
  assert.equal(isolated.rokoko,3);
  assert.equal(isolated.mixamo,0);
  assert.deepEqual(isolated.providerLabels,['Rokoko','Rokoko','Rokoko']);
  assert(isolated.packOptions.includes('Rokoko · Superhero'));
  assert.equal(isolated.assignments,originalAssignments,
   'Importing Rokoko motions must not modify selected game actions');
  await page.evaluate(async()=>{
   const zip=new window.JSZip();
   zip.file('Boxing/Boxing (5).fbx',new Uint8Array([4,3,2,1]));
   const bytes=await zip.generateAsync({type:'uint8array'});
   const file=new File([bytes],'Sky-Clash-Clean-Boxing-40.zip',{lastModified:124});
   const transfer=new DataTransfer();transfer.items.add(file);
   const input=document.getElementById('fileInput');
   input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForFunction(()=>
   document.getElementById('sourceCountMixamo')?.textContent==='1',
   null,{timeout:45000});
  await page.evaluate(()=>document.querySelector('.source-tab[data-source="all"]').click());
  assert.equal(await page.locator('#clipGrid .clip-card').count(),4,
   'All must combine both sources without reclassifying either one');
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.getElementById('sourceCountAll')?.textContent==='4',
   null,{timeout:120000});
  const reopened=await page.evaluate(async()=>({
   rokoko:Number(document.getElementById('sourceCountRokoko').textContent),
   mixamo:Number(document.getElementById('sourceCountMixamo').textContent),
   saved:(await window.SkyClashMotionLibrary.info()).count,
   assignments:localStorage.getItem('skyClashV58ActionAssignments')
  }));
  assert.equal(reopened.rokoko,3);
  assert.equal(reopened.mixamo,1);
  assert.equal(reopened.saved,2,'Both original ZIPs must remain private in IndexedDB');
  assert.equal(reopened.assignments,originalAssignments);
  assert.equal(errors.length,0,'Browser errors: '+errors.join('; '));
  await context.close();
  console.log('PASS real Kairo: empty fallback, saved local punch plays in V72, default untouched, corrupt pack fallback');
 }finally{await browser.close();}
})().catch(e=>{console.error('STUDIO LOCAL GAME E2E FAILED',e.stack||e);process.exitCode=1;});
