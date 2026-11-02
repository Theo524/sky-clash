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
    if(i===74||i===155){
     samples.push(joints.map(j=>j.quaternion.clone()));
     heights.push(p.pos.y);
    }
   }
   const deltas=samples[0].map((q,i)=>q.angleTo(samples[1][i]));
   return {active:a.active,style:a.flightBodyExpression,amplitude:a.flightBodyDegrees,
    difference:deltas[0],arms:deltas.slice(1,3),wrists:deltas.slice(3,5),
    legs:deltas.slice(5,7),ankles:deltas.slice(7),
    heights,owner:a.owner,source:a.flightAuthoredVariant,error:a.error,
    noHistoricalFlightDependencies:!window.SkyClashV142HoverKeys&&
     !window.SkyClashV143HoverKeys&&!window.SkyClashV144Arms&&
     !window.SkyClashV164SelectedFlight};
  });
  assert(livingFlight.noHistoricalFlightDependencies,
   'direct living flight must load without historical animation modules');
  assert.equal(livingFlight.active,'flight');
  assert.equal(livingFlight.style,'Kairo direct natural flight');
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
  // Actual gravity descent: explicitly assigned Falling Idle must win
  // from the moment the player cancels powered flight, including wrists,
  // over the V100 published falling writer and the V81 wrist clamp.
  // Use a REAL shipped source clip under temporary test IndexedDB only.
  await page.evaluate(async()=>{
   const bridge=window.SkyClashStudioLiveBridge,current=await bridge.load();
   const source=await (await fetch('assets/animations/gameplay/v86-ue5-converted-actions.json')).json();
   const fall=source.motions.find(m=>m.slot==='fallingIdle');
   if(!fall)throw Error('Missing real baked UE5 Falling Idle test fixture');
   await bridge.save({...current.pack,motions:[
    ...current.pack.motions.filter(m=>!['jump','fallingIdle'].includes(m.slot)),
    {...fall,slot:'jump',sourceId:'same-recorded-arc-181',
     sourceFile:'studio-assigned-falling-idle-test.fbx'},
    {...fall,slot:'fallingIdle',sourceId:'same-recorded-arc-181',
     sourceFile:'studio-assigned-falling-idle-test.fbx'}
   ]});
  });
  await navigate('?scene=dojo&studioPlaytest=local&flightBody=alive&studioPoseAudit=1');
  const realFalling=await page.evaluate(()=>{
   const p=window.SkyClash.Game.player,s=window.SkyClashPublishedActions;
   window.SkyClash.Game.enterDojo();window.SkyClash.Game.update=()=>{};
   window.SkyClash.CameraRig.update=()=>{};window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.blockHeld=false;p.blocking=false;
   p.punchT=0;p.blastT=0;p.sprinting=false;p.dashing=false;
   p.landingMotionT=0;p.acro=null;p.jumping=false;p.dropping=true;
   p.pos.y=p.floor+9;p.wasFlying=true;
   p.vel.set(0,-2.5,0);p.moveIntent.set(0,0,0);p.vert=0;
   const hum=p.vrmRig.vrm.humanoid;
   const wrists=['leftHand','rightHand'].map(n=>hum.getNormalizedBoneNode(n));
   const initial=wrists.map(x=>x.quaternion.clone()),samples=[];
   for(let i=0;i<65;i++){
    p.update(1/60);
    if([5,14,30,48,63].includes(i))samples.push({
     frame:i,slot:p.v72StudioPack.slot,
     poseDrift:p.v72StudioPack.studioPoseSnapshot?
      Math.max(...p.v72StudioPack.studioPoseSnapshot.map((q,j)=>
       q?.angleTo(hum.getNormalizedBoneNode([
        'hips','spine','chest','upperChest','neck','head',
        'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
        'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
        'leftUpperLeg','leftLowerLeg','leftFoot',
        'rightUpperLeg','rightLowerLeg','rightFoot'][j]).quaternion)||0)):
      null,
     owner:window.SkyClashPoseAuthority.active,
     transition:window.SkyClashPoseTransitions.active,
     airHands:window.SkyClashPoseTransitions.airHands,
     step:p.v89Step?.mode,
     source:s.motionClips[p.v72StudioPack.slot]?.sourceFile,
     falling:p.dropping,flying:p.flying,
     landingT:p.landingMotionT,
     sourceClock:p.v72StudioPack.clock,
     wrists:wrists.map((w,j)=>w.quaternion.angleTo(initial[j])),
     wristQuaternions:wrists.map(w=>w.quaternion.toArray())
    });
   }
   return {state:s.localPlaytest.state,samples,
    source:s.motionClips.fallingIdle.sourceFile,
    frames:s.localPlaytest.slots,
    error:s.error,transitionError:window.SkyClashPoseTransitions.error,
    ownerError:window.SkyClashPoseAuthority.error};
  });
  assert.equal(realFalling.state,'ready');
  assert.equal(realFalling.source,'studio-assigned-falling-idle-test.fbx');
  assert(realFalling.frames.includes('fallingIdle'),'the assigned Falling Idle slot was not in the saved pack');
  // The final captured frame may already have crossed ground contact.
  // The landing controller is RIGHT to take ownership at that point.
  // Check the saved Falling Idle *while physically airborne* instead.
  const airborneFall=realFalling.samples.filter(s=>s.flying&&s.falling);
  assert(airborneFall.length>=2,'test never observed a real midair gravity fall');
  for(const sample of airborneFall){
   assert.equal(sample.slot,'fallingIdle','real gravity fall did not select Studio Falling Idle');
   assert.equal(sample.source,'studio-assigned-falling-idle-test.fbx');
   assert(sample.poseDrift!==null&&sample.poseDrift<.001,
    'A later animation controller altered the assigned Falling Idle pose');
   assert.equal(sample.owner,'yielded-to-combat-or-flight',
    'published V100 falling controller overwrote the assigned Studio clip');
   assert.equal(sample.transition,'fall');
   assert.equal(sample.airHands,'Studio Falling Idle wrists preserved',
    'V81 still clamped the assigned Falling Idle wrists');
   assert(sample.step==null||sample.step==='inactive',
    'grounded first-step controller interfered with Falling Idle');
  }
  // Real source motion must be visible on the actual VRM wrist nodes,
  // not merely a source label that a later controller overwrites.
  const qAngle=(a,b)=>2*Math.acos(Math.min(1,Math.abs(
   a.reduce((sum,v,i)=>sum+v*b[i],0))));
  const wristMotion=Math.max(...airborneFall.slice(1).flatMap(s=>
   s.wristQuaternions.map((q,i)=>qAngle(
    airborneFall[0].wristQuaternions[i],q))));
  assert(wristMotion>.035,
   'Assigned Falling Idle did not animate Kairo visible wrist joints');
  assert(airborneFall.at(-1).sourceClock>.15,
   'Studio Falling Idle did not advance its authored source clock');
  assert.equal(realFalling.error,null);
  assert.equal(realFalling.transitionError,null);
  assert.equal(realFalling.ownerError,null);
  // Rising and falling from the SAME saved FBX must advance on one
  // continuous clock. The old transition rewound Falling Idle to frame 0,
  // producing a sudden extra torso lean at the apex.
  const sameSourceArc=await page.evaluate(()=>{
   const g=window.SkyClash.Game,p=g.player;
   g.enterDojo();g.update=()=>{};
   window.SkyClash.CameraRig.update=()=>{};window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.punchT=0;
   p.blockHeld=false;p.blocking=false;p.sprinting=false;p.dashing=false;
   p.landingMotionT=0;p.acro=null;p.jumping=true;p.dropping=false;
   p.pos.y=p.floor+7;p.vel.set(0,5,0);p.moveIntent.set(0,0,0);
   for(let i=0;i<15;i++){p.t+=1/60;p.animate(1/60);}
   const beforeClock=p.v72StudioPack.clock;
   const hum=p.vrmRig.vrm.humanoid;
   const joints=['hips','spine','chest','upperChest','leftUpperArm','rightUpperArm'];
   const before=joints.map(n=>hum.getNormalizedBoneNode(n).quaternion.clone());
   const beforeSlot=p.v72StudioPack.slot;
   p.vel.y=-2.5;p.dropping=true;
   p.t+=1/60;p.animate(1/60);
   const afterClock=p.v72StudioPack.clock;
   const maxChange=Math.max(...joints.map((n,i)=>
    before[i].angleTo(hum.getNormalizedBoneNode(n).quaternion)));
   return {beforeClock,afterClock,beforeSlot,afterSlot:p.v72StudioPack.slot,
    maxChange,error:window.SkyClashPublishedActions.error};
  });
  assert.equal(sameSourceArc.beforeSlot,'jump');
  assert.equal(sameSourceArc.afterSlot,'fallingIdle');
  assert(sameSourceArc.beforeClock>.2&&
   sameSourceArc.afterClock>sameSourceArc.beforeClock,
   'Jump and Falling Idle from the SAME source restarted at the apex');
  assert(sameSourceArc.maxChange<.35,
   'Same FBX abruptly leaned Kairo forward at the rise-to-fall boundary');
  assert.equal(sameSourceArc.error,null);
  // Put this temporary browser fixture away before the next landing
  // suite section; never modify the player's real local saved data.
  await page.evaluate(async()=>{
   const bridge=window.SkyClashStudioLiveBridge,current=await bridge.load();
   await bridge.save({...current.pack,motions:
    current.pack.motions.filter(m=>!['fallingIdle','jump'].includes(m.slot))});
  });
  await navigate('?scene=dojo&studioPlaytest=local&flightBody=alive');
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
    {...landing,sourceFile:'studio-landing-test.fbx',
     // A source-authored landing with visible crouch/impact includes a
     // downward pelvis track. This isolates game rendering fidelity
     // from whether the old shipped V86 pack has that new optional field.
     hipYEncoding:'int16-normalized-height-delta',
     hipYTrack:(()=>{
      const raw=new Uint8Array(landing.frames*2),view=new DataView(raw.buffer);
      for(let i=0;i<landing.frames;i++){
       const phase=i/(landing.frames-1);
       const crouch=-.12*Math.sin(Math.PI*phase);
       view.setInt16(i*2,Math.round(crouch*32767),true);
      }
      return btoa(Array.from(raw,b=>String.fromCharCode(b)).join(''));
     })()},
    {...stop,sourceFile:'studio-grounded-stop-test.fbx',
     footContacts:'0'.repeat(11)+'3'.repeat(stop.frames-11)}
   ]});
  });
  await navigate('?scene=dojo&studioPlaytest=local&flightBody=alive&studioPoseAudit=1');
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
   const landingBefore=hip.quaternion.clone(),hipYBefore=hip.position.y;
   const landPelvisOffsets=[],landPoseDrift=[];
   const boneNames=['hips','spine','chest','upperChest','neck','head',
    'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
    'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
    'leftUpperLeg','leftLowerLeg','leftFoot',
    'rightUpperLeg','rightLowerLeg','rightFoot'];
   const visibleDrift=()=>p.v72StudioPack.studioPoseSnapshot?
    Math.max(...p.v72StudioPack.studioPoseSnapshot.map((q,j)=>
     q?.angleTo(hum.getNormalizedBoneNode(boneNames[j]).quaternion)||0)):
    null;
   for(let i=0;i<45;i++){
    p.t+=1/60;p.animate(1/60);
    landPelvisOffsets.push(hip.position.y-hipYBefore);
    landPoseDrift.push(visibleDrift());
    p.landingMotionT=Math.max(0,p.landingMotionT-1/60);
   }
   const landingResult={slot:p.v72StudioPack.slot,
    duration:s.localPlaytest.localLandingDuration,
    frames:s.localPlaytest.localLandingFrames,
    clock:s.localPlaytest.localLandingClock,
    hipDifference:landingBefore.angleTo(hip.quaternion),
    pelvisLow:Math.min(...landPelvisOffsets),
    pelvisHighest:Math.max(...landPelvisOffsets),
    pelvisVisual:s.localPlaytest.localLandingPelvisCm,
    maxPoseDrift:Math.max(...landPoseDrift.filter(Number.isFinite)),
    poseAuditFrames:landPoseDrift.filter(Number.isFinite).length,
    source:s.motionClips.landing.sourceFile};
   // Release the previous landing's one-shot latch before simulating
   // another physical touchdown in this same disposable test scene.
   p.landingMotionT=0;p.v109LandingDuration=0;
   p.t+=1/60;p.animate(1/60);
   // Cross flight's real 25cm threshold under downward momentum;
   // the first contact frame still has jumping/dropping flagged.
   p.wasFlying=true;p.jumping=true;p.dropping=true;p.acro=null;
   p.pos.y=p.floor+.33;p.vel.set(3.1,-11,0);p.vert=0;
   p.moveIntent.set(0,0,0);p._v82WasBoost=false;
   const movingSamples=[];
   for(let i=0;i<74;i++){
    p.update(1/60);
    if([0,5,20,52,70].includes(i))
     movingSamples.push({frame:i,slot:p.v72StudioPack.slot,
      timer:p.landingMotionT,clock:p.v72StudioPack.clock,
      grounded:p.pos.y<=p.floor+.025,
      poseDrift:visibleDrift(),
      stepMode:p.v89Step?.mode||null,
      jumping:p.jumping,dropping:p.dropping});
   }
   const movingLanding={samples:movingSamples,
    duration:s.localPlaytest.localLandingDuration,
    frames:s.localPlaytest.localLandingFrames,
    clock:s.localPlaytest.localLandingClock,
    source:s.motionClips.landing.sourceFile};
   p.landingMotionT=0;p.v109LandingDuration=0;
   p.wasFlying=false;p.jumping=false;p.dropping=false;
   // The physical dojo floor need not be y=0. The run-stop test must
   // prove the animation does not move the current physics root.
   const rootYBeforeStop=p.pos.y;
   p._v82WasBoost=true;p.sprinting=false;p.skidT=.38;
   p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   p.t+=1/60;p.animate(1/60);
   const firstLeg=thigh.quaternion.clone(),firstClock=p.v72StudioPack.clock;
   for(let i=0;i<12;i++){p.t+=1/60;p.animate(1/60);}
   return {landing:landingResult,movingLanding,runStop:{
    slot:p.v72StudioPack.slot,
    source:s.motionClips.runStop.sourceFile,
    firstClock,lastClock:p.v72StudioPack.clock,
    thighChange:firstLeg.angleTo(thigh.quaternion),
    frames:s.localPlaytest.localStopFrames,
    rootY:p.pos.y,rootYBeforeStop,
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
  assert(groundRecovery.landing.poseAuditFrames>=35&&
   groundRecovery.landing.maxPoseDrift<.001,
   'A later controller altered the assigned Studio landing joints');
  assert(groundRecovery.landing.pelvisLow<-.08&&
   groundRecovery.landing.pelvisLow>-.33,
   'Studio source downward hip motion was lost during gameplay');
  assert(Math.abs(groundRecovery.landing.pelvisHighest)<.025,
   'Studio source hips did not start at the correct rest height');
  assert.equal(groundRecovery.movingLanding.samples[0].slot,'landing',
   'Real contact routed to jump/fall instead of assigned Studio landing');
  for(const sample of groundRecovery.movingLanding.samples.filter(s=>s.timer>0)){
   assert(sample.poseDrift!==null&&sample.poseDrift<.001,
    'Later animation wrapper changed the Studio landing at real touchdown');
   assert(sample.stepMode==null||sample.stepMode==='inactive',
    'V89 grounded first-step writer overrode assigned Studio landing');
  }
  assert(groundRecovery.movingLanding.duration>=1.09,
   'Moving contact truncated assigned landing to .205s');
  assert(groundRecovery.movingLanding.samples[0].jumping||
    groundRecovery.movingLanding.samples[0].dropping,
   'Test must exercise airborne flags still set at contact');
  assert(groundRecovery.movingLanding.samples[3].clock>.5,
   'Moving Studio landing did not advance its 1x recorded clip');
  assert.equal(groundRecovery.movingLanding.source,'studio-landing-test.fbx');
  assert(groundRecovery.movingLanding.frames>=55,
   'Moving landing ended before the authored performance');
  assert.equal(groundRecovery.runStop.slot,'runStop');
  assert.equal(groundRecovery.runStop.source,'studio-grounded-stop-test.fbx');
  assert(groundRecovery.runStop.firstClock>.33&&groundRecovery.runStop.firstClock<.45,
   'Run stop started on unsupported airborne feet');
  assert(groundRecovery.runStop.lastClock>groundRecovery.runStop.firstClock);
  assert(groundRecovery.runStop.thighChange>.005,
   'Run stop retained old procedural legs instead of source full-body motion');
  assert(groundRecovery.runStop.frames>5);
  assert.equal(groundRecovery.runStop.rootY,
   groundRecovery.runStop.rootYBeforeStop,
   'The visual stop must not move physics root above its actual floor');
  assert.equal(groundRecovery.error,null);
  // Long local landing regression: source speed and hip depth must survive
  // the game handoff. Fixture stays in Playwright's disposable IndexedDB;
  // no browser-saved user files are touched or read by CI.
  await page.evaluate(async()=>{
   const bridge=window.SkyClashStudioLiveBridge,current=await bridge.load();
   const savedLanding=current.pack.motions.find(m=>m.slot==='landing');
   const raw=new Uint8Array(savedLanding.frames*2),view=new DataView(raw.buffer);
   for(let i=0;i<savedLanding.frames;i++){
    const phase=i/(savedLanding.frames-1);
    view.setInt16(i*2,Math.round(-.32*Math.sin(Math.PI*phase)*32767),true);
   }
   const rawXZ=new Uint8Array(savedLanding.frames*4),xzView=new DataView(rawXZ.buffer);
   for(let i=0;i<savedLanding.frames;i++){
    const phase=i/(savedLanding.frames-1),travel=Math.sin(Math.PI*phase);
    xzView.setInt16(i*4,Math.round(.25*travel*32767),true);
    xzView.setInt16(i*4+2,Math.round(-.1*travel*32767),true);
   }
   const deep={...savedLanding,speed:.5,sourceFile:'saved-long-landing-test.fbx',
    hipYEncoding:'int16-normalized-height-delta',
    hipYTrack:btoa(Array.from(raw,b=>String.fromCharCode(b)).join('')),
    hipXZEncoding:'int16-normalized-height-xz-delta',
    hipXZTrack:btoa(Array.from(rawXZ,b=>String.fromCharCode(b)).join(''))};
   await bridge.save({...current.pack,
    motions:current.pack.motions.map(m=>m.slot==='landing'?deep:m)});
  });
  await navigate('?scene=dojo&studioPlaytest=local&flightBody=alive&studioPoseAudit=1');
  const longLanding=await page.evaluate(()=>{
   const g=window.SkyClash.Game,p=g.player,s=window.SkyClashPublishedActions;
   g.enterDojo();g.update=()=>{};
   window.SkyClash.CameraRig.update=()=>{};window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.blockHeld=false;p.blocking=false;
   p.punchT=0;p.blastT=0;p.sprinting=false;p.dashing=false;
   p.jumping=false;p.flying=false;p.dropping=false;p.acro=null;
   p.pos.y=p.floor;p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   p.landingMotionT=.48;p.v109LandingDuration=.48;
   const hips=p.vrmRig.vrm.humanoid.getNormalizedBoneNode('hips');
   const origin=hips.position.clone(),rootBefore=p.pos.y;
   let lowest=0,largestXZ=0,midSlot=null,midClock=0,frames=0;
   for(let i=0;i<175;i++){
    p.t+=1/60;p.animate(1/60);
    lowest=Math.min(lowest,hips.position.y-origin.y);
    largestXZ=Math.max(largestXZ,Math.hypot(
     hips.position.x-origin.x,hips.position.z-origin.z));
    if(i===95){midSlot=p.v72StudioPack.slot;midClock=p.v72StudioPack.clock;}
    if(p.v72StudioPack.slot==='landing')frames++;
    p.landingMotionT=Math.max(0,p.landingMotionT-1/60);
   }
   return {source:s.motionClips.landing.sourceFile,
    duration:s.localPlaytest.localLandingDuration,
    minCrouch:lowest,largestXZ,midSlot,midClock,frames,
    physicsUnchanged:p.pos.y===rootBefore,error:s.error};
  });
  assert.equal(longLanding.source,'saved-long-landing-test.fbx');
  assert(longLanding.duration>1.8,
   'Long saved landing was cut off at the old 1.25s cap');
  assert.equal(longLanding.midSlot,'landing',
   'Long saved landing ended before 1.5 seconds');
  assert(longLanding.midClock>.6&&longLanding.midClock<1,
   'Locally assigned 0.5x Studio playback speed was not preserved');
  assert(longLanding.frames>100,
   'Extended landing did not play its recorded source frames');
  assert(longLanding.minCrouch<-.34&&longLanding.minCrouch>-1.11,
   'Deep source pelvis motion still hit the old 32cm clamp');
  assert(longLanding.largestXZ>.1,
   'Saved FBX horizontal pelvis motion never reaches the rendered Kairo rig');
  assert(longLanding.physicsUnchanged,
   'Visual source movement must not affect the fighter physics root');
  assert.equal(longLanding.error,null);
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
  // Diagnose the ORIGINAL game retarget against the separately loaded Kairo
  // reference that Animation Studio actually uses, not a new pose owner.
  // This is the first source-vs-visible numerical check for the five jumps.
  await navigate('?scene=dojo&studioPoseAudit=1');
  const jumpRetargetAudit=await page.evaluate(async()=>{
   const T=window.THREE,g=window.SkyClash.Game,p=g.player;
   g.enterDojo();g.update=()=>{};window.SkyClash.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;
   const response=await fetch('assets/characters/kairo.vrm');
   if(!response.ok)throw Error('cannot read reference Kairo');
   const bytes=await response.arrayBuffer();
   const kit=window.VRMKit,loader=new kit.GLTFLoader();
   loader.register(q=>new kit.VRMLoaderPlugin(q));
   const gltf=await new Promise((resolve,reject)=>loader.parse(bytes,'',resolve,reject));
   const vrm=gltf.userData.vrm;
   if(kit.VRMUtils.rotateVRM0)kit.VRMUtils.rotateVRM0(vrm);
   const names=['hips','spine','chest','upperChest','neck','head',
    'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
    'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
    'leftUpperLeg','leftLowerLeg','leftFoot',
    'rightUpperLeg','rightLowerLeg','rightFoot'];
   const nodes=names.map(n=>vrm.humanoid.getNormalizedBoneNode(n));
   vrm.scene.updateMatrixWorld(true);
   const localRest=nodes.map(n=>n.quaternion.clone());
   const worldRest=nodes.map(n=>n.getWorldQuaternion(new T.Quaternion()));
   const referenceSide=nodes[7].getWorldPosition(new T.Vector3())
    .sub(nodes[11].getWorldPosition(new T.Vector3()));
   referenceSide.y=0;referenceSide.normalize();
   const srcKeys=['hips','spine','spine1','spine2','neck','head',
    'leftshoulder','leftarm','leftforearm','lefthand',
    'rightshoulder','rightarm','rightforearm','righthand',
    'leftupleg','leftleg','leftfoot',
    'rightupleg','rightleg','rightfoot'];
   const source=window.SkyClashPublishedActions.motionClips;
   p.hp=100;p.stun=0;p.downT=0;p.slamLagT=0;
   p.punchT=0;p.blastT=0;p.superHitT=0;p.blockHeld=false;p.blocking=false;
   p.sprinting=false;p.dashing=false;p.acro=null;p.landingMotionT=0;
   p.jumping=true;p.dropping=false;p.pos.y=p.floor+2;
   p.vel.set(0,5,0);p.v108JumpPrepT=0;p.moveIntent.set(0,0,0);
   p.t+=1/60;p.animate(1/60);
   const state=p.v72StudioPack,live=state.bones;
   const angle=(a,b)=>a.angleTo(b)*180/Math.PI;
   const sceneQuat=vrm.scene.getWorldQuaternion(new T.Quaternion());
   const sceneLocalRest=worldRest.map(w=>sceneQuat.clone().invert().multiply(w));
   const bindErrors=sceneLocalRest.map((w,i)=>angle(w,state.bind[i]));
   function observe(slot,time,velY){
    const entry=source[slot],isLanding=slot==='landing';
    if(!entry)throw Error('missing test clip '+slot);
    p.jumping=true;p.vel.y=velY;
    state.slot=slot;state.clock=time;state.weight=1;
    state.jumpMode='full';state.airHandoffFrom=null;
    state.localEntryPose=null;state.landingVisualUntil=p.t+3;
    p.t+=.00001;p.animate(0);
    if(state.slot!==slot)throw Error('switched '+slot+' to '+state.slot);
    const sample=names.map(()=>new T.Quaternion());
    entry.sample(time,sample,false);
    for(let i=0;i<nodes.length;i++)nodes[i].quaternion.copy(localRest[i]);
    vrm.scene.updateMatrixWorld(true);
    const sourceSide=new T.Vector3(entry.side[0],0,entry.side[1]);
    const cross=sourceSide.z*referenceSide.x-sourceSide.x*referenceSide.z;
    const dot=sourceSide.x*referenceSide.x+sourceSide.z*referenceSide.z;
    const basis=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),
      Math.atan2(cross,dot)+(entry.yaw||0)*Math.PI/180);
    const inv=basis.clone().invert(),differences=[],rawVsStudio=[];
    let capped=0;
    for(let i=0;i<nodes.length;i++){
     const n=nodes[i],parent=n.parent,rest=localRest[i];
     const rotated=basis.clone().multiply(sample[i]).multiply(inv);
     const wanted=rotated.multiply(worldRest[i]);
     const parentQ=parent.getWorldQuaternion(new T.Quaternion());
     const intended=parentQ.invert().multiply(wanted).normalize();
     const cap=srcKeys[i]==='hips'?Math.PI:
      srcKeys[i].includes('forearm')||srcKeys[i].includes('hand')?2.65:
      srcKeys[i].includes('arm')||srcKeys[i].includes('shoulder')?2.45:
      srcKeys[i].includes('leg')||srcKeys[i].includes('foot')?2.4:1.9;
     const proposedAngle=rest.angleTo(intended);
     if(proposedAngle>cap){capped++;intended.copy(rest).slerp(intended,cap/proposedAngle);}
     n.quaternion.copy(intended);
     n.updateMatrixWorld(true);
     differences.push({name:names[i],deg:angle(live[i].quaternion,n.quaternion)});
     rawVsStudio.push({name:names[i],deg:proposedAngle*180/Math.PI});
    }
    return {slot,time,clamped:capped,
     maxDiff:+Math.max(...differences.map(x=>x.deg)).toFixed(2),
     top: differences.sort((a,b)=>b.deg-a.deg).slice(0,6).map(x=>[x.name,+x.deg.toFixed(2)]),
     maxRequested:+Math.max(...rawVsStudio.map(x=>x.deg)).toFixed(2)};
   }
   const cases=[
    observe('jump',.1,5),observe('jump',.3,5),
    observe('jump',.55,5),observe('jump',.78,5),
    observe('landing',.1,-5),observe('landing',.35,-5)
   ];
   return {maxRestMismatch:+Math.max(...bindErrors).toFixed(3),
    restLocal:localRest.map((q,i)=>[names[i],+angle(q,new T.Quaternion()).toFixed(3)]),
    cases};
  });
  console.log('KAIRO_MIXAMO_STUDIO_VS_GAME_AUDIT '+JSON.stringify(jumpRetargetAudit));
  assert(jumpRetargetAudit.maxRestMismatch<.001,
   'The gameplay jump reference differs from Studio on the same real Kairo');
  assert(jumpRetargetAudit.cases.every(c=>c.maxDiff<.1&&c.clamped===0),
   'The game changed original Studio retargeted jump/landing leg poses');
  // Real input buffer + late-animation writer regression: the previous
  // PR only forced jumping=true, missing the procedural push that a player
  // actually sees when pressing Jump in normal Training.
  await navigate('?scene=dojo&studioPoseAudit=1');
  const realPress=await page.evaluate(()=>{
   const g=window.SkyClash.Game,p=g.player,s=window.SkyClashPublishedActions;
   g.enterDojo();g.update=()=>{};window.SkyClash.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.slamLagT=0;p.awakenChargeT=0;
   p.punchT=0;p.blastT=0;p.blockHeld=false;p.blocking=false;
   p.sprinting=false;p.dashing=false;p.acro=null;p.landingMotionT=0;
   p.jumping=false;p.dropping=false;p.pos.y=p.floor;
   p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
   const accepted=p.tryJump(),buffer=p.v108JumpPrepT;
   p.t+=1/60;p.animate(1/60);
   const first=p.v72StudioPack.slot,firstClock=p.v72StudioPack.clock;
   const ownsPrep=window.SkyClashV100Animator?.ownsAir(p);
   const hum=p.vrmRig.vrm.humanoid;
   const joints=['hips','spine','chest','upperChest','neck','head',
    'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
    'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
    'leftUpperLeg','leftLowerLeg','leftFoot',
    'rightUpperLeg','rightLowerLeg','rightFoot'];
   const prepDrift=Math.max(...p.v72StudioPack.studioPoseSnapshot.map((q,i)=>
    q?.angleTo(hum.getNormalizedBoneNode(joints[i]).quaternion)||0));
   p.v108JumpPrepT=buffer/2;p.t+=1/60;p.animate(1/60);
   const middleClock=p.v72StudioPack.clock;
   p.v108JumpPrepT=.0001;p.t+=1/60;p.animate(1/60);
   const endClock=p.v72StudioPack.clock;
   p.v108JumpPrepT=0;p.jumping=true;p.vel.y=5;
   p.pos.y=p.floor+.3;p.t+=1/60;p.animate(1/60);
   const takeoff=p.v72StudioPack.slot,takeoffClock=p.v72StudioPack.clock;
   // Start a NEW moving jump after the standing jump; its previous
   // standing-mode slot must not be mistaken for the moving takeoff.
   p.v72StudioPack.slot=null;p.v72StudioPack.jumpMode=null;
   // Boost's optional legacy flip must not displace the recorded jump.
   p.sprinting=true;p.vel.set(5,5,0);p.acro={type:'flip',t:0,duration:.64,direction:1};
   p.t+=1/60;p.animate(1/60);
   const boosted=p.v72StudioPack.slot,flipRemoved=p.acro===null;
   return {active:s.jumpSequence?.active,accepted,buffer,first,firstClock,
    middleClock,endClock,ownsPrep,prepDrift,takeoff,takeoffClock,boosted,flipRemoved,
    error:s.error};
  });
  assert(realPress.active&&realPress.accepted&&realPress.buffer>.05,
   'Real Kairo input did not start the recorded buffered jump');
  assert.equal(realPress.first,'jump','Procedural preparation stole the real Mixamo takeoff');
  assert.equal(realPress.ownsPrep,false,'V100 still owns the Mixamo preparation');
  assert(realPress.prepDrift<.01,
   'V89/V81/V100 modified the real Mixamo pre-takeoff bones');
  assert(realPress.firstClock<realPress.middleClock&&
   realPress.middleClock<realPress.endClock&&realPress.endClock<=.41,
   'Mixamo source anticipation was skipped instead of played during ground contact');
  assert.equal(realPress.takeoff,'jump');
  assert(realPress.takeoffClock>=realPress.endClock,
   'Recorded takeoff restarted instead of continuing after buffered physical launch');
  assert.equal(realPress.boosted,'jumpQuick',
   'Boost jump incorrectly used a flight or procedural animation');
  assert(realPress.flipRemoved,'Legacy random flip still rotates Kairo over Mixamo');
  assert.equal(realPress.error,null);
  // Exercise the full real Fighter.update -> V108 buffer -> physical
  // ascent -> contact -> recovery path. Earlier forced-state tests missed
  // full-jump source discontinuities and abrupt leg rotations.
  await navigate('?scene=dojo&studioPoseAudit=1');
  const physicalJumps=await page.evaluate(()=>{
   const g=window.SkyClash.Game,p=g.player;g.enterDojo();
   g.update=()=>{};window.SkyClash.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;
   const joints=['leftUpperLeg','leftLowerLeg','leftFoot',
    'rightUpperLeg','rightLowerLeg','rightFoot'];
   const hum=p.vrmRig.vrm.humanoid;
   const nodes=joints.map(n=>hum.getNormalizedBoneNode(n));
   const trials=[];
   for(const moving of [false,true]){
    p.hp=100;p.stun=0;p.downT=0;p.slamLagT=0;
    p.punchT=0;p.blastT=0;p.blockHeld=false;p.blocking=false;
    p.sprinting=false;p.dashing=false;p.acro=null;
    p.jumping=false;p.dropping=false;p.v108JumpPrepT=0;
    p.v108JumpPrepDuration=0;p.vert=0;p.landingMotionT=0;
    p.pos.y=p.floor;p.pos.x=0;p.pos.z=0;
    p.vel.set(moving?5:0,0,0);
    p.moveIntent.set(moving?1:0,0,0);
    p.v72StudioPack.slot=null;p.v72StudioPack.clock=0;
    p.v72StudioPack.jumpMode=null;p.v72StudioPack.landingVisualUntil=0;
    p.v72StudioPack.jumpLandingFinished=false;
    const started=p.tryJump(),seq=[],trace=[];
    let previous=nodes.map(n=>n.quaternion.clone());
    let maxLegStep=0,maxLegName=null,maxLegFrame=0,maxWriterDrift=0;
    const riseClocks=[],riseHeights=[];
    let contactSourceTime=null,contactHeight=null;
    for(let i=0;i<125;i++){
     const previousHeight=p.pos.y-p.floor;
     p.update(1/60);
     const slot=p.v72StudioPack.slot||'none';
     if(slot===(moving?'jumpQuick':'jump')){
      riseClocks.push(p.v72StudioPack.clock);
      riseHeights.push(p.pos.y-p.floor);
     }
     if(contactSourceTime===null&&previousHeight>.05&&
        p.pos.y-p.floor<.001){
      contactSourceTime=p.v72StudioPack.clock;
      contactHeight=p.pos.y-p.floor;
     }
     if(seq.at(-1)!==slot)seq.push(slot);
     if(i%4===0)trace.push([i,slot,+p.v72StudioPack.clock.toFixed(2),
      +((p.pos.y||0)-p.floor).toFixed(2)]);
     const snapshot=p.v72StudioPack.studioPoseSnapshot;
     if(['jump','jumpQuick','landing'].includes(slot)&&snapshot)
      snapshot.forEach((q,j)=>{
       if(q&&p.v72StudioPack.bones[j])
        maxWriterDrift=Math.max(maxWriterDrift,
         q.angleTo(p.v72StudioPack.bones[j].quaternion));
      });
     nodes.forEach((n,j)=>{
      const delta=previous[j].angleTo(n.quaternion)*180/Math.PI;
      if(delta>maxLegStep){maxLegStep=delta;maxLegName=joints[j];maxLegFrame=i;}
      previous[j].copy(n.quaternion);
     });
    }
    trials.push({moving,started,seq,trace,maxLegStep:+maxLegStep.toFixed(2),
     maxLegName,maxLegFrame,maxWriterDrift:+maxWriterDrift.toFixed(6),
     riseSeconds:riseClocks.length/60,
     riseFirst:+(riseClocks[0]||0).toFixed(3),
     riseLast:+(riseClocks.at(-1)||0).toFixed(3),
     riseClockStalls:riseClocks.filter((x,i)=>i>0&&
       x-riseClocks[i-1]<.0001).length,
     contactSourceTime:contactSourceTime===null?null:+contactSourceTime.toFixed(3),
     contactHeight,airborne:!!p.jumping,height:+(p.pos.y-p.floor).toFixed(3)});
   }
   return trials;
  });
  console.log('KAIRO_REAL_PHYSICS_MIXAMO_JUMPS '+JSON.stringify(physicalJumps));
  for(const trial of physicalJumps){
   assert(trial.started,'Actual jump input was refused in full physics trace');
   assert(trial.seq.includes(trial.moving?'jumpQuick':'jump'),
    'Actual physics jump failed to choose the correct Mixamo takeoff');
   assert(trial.seq.includes('landing'),
    'Actual jump failed to enter the original source-matched landing');
   assert(!trial.seq.includes('jumpDown')&&!trial.seq.includes('fallingIdle'),
    'Old partial descent or disconnected Falling Idle hijacked an ordinary jump');
   assert(trial.maxLegStep<80,
    'Visible VRM leg rotated more than 80 degrees in one gameplay frame');
   assert(trial.maxWriterDrift<.01,
    'A later controller changed Kairo bones after the source Mixamo pose');
   assert(trial.riseClockStalls===0,
    'Mixamo rising clip held its last keyframe while physics was still rising');
   const sourceDuration=trial.moving?.2333333333:.8333333333;
   assert(trial.riseLast>=sourceDuration-.05,
    'Source Jumping Up never reached its authored end at the real apex');
   assert(trial.contactSourceTime!==null&&
     Math.abs(trial.contactSourceTime-.30)<.05,
     'Mixamo landing contact keyframe did not match physics floor collision');
   assert(!trial.airborne,'Actual jump did not return to grounded physics');
  }
  // The five player-selected Mixamo FBXs are now part of ORDINARY
  // Kairo gameplay. No Jump Lab URL, importer, or browser save is used.
  await navigate('?scene=dojo&studioPoseAudit=1');
  const standingJump=await page.evaluate(()=>{
   const g=window.SkyClash.Game,p=g.player,s=window.SkyClashPublishedActions;
   g.enterDojo();g.update=()=>{};window.SkyClash.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.punchT=0;p.blastT=0;
   p.blockHeld=false;p.blocking=false;p.sprinting=false;p.dashing=false;
   p.acro=null;p.landingMotionT=0;p.jumping=true;p.dropping=false;
   p.moveIntent.set(0,0,0);p.pos.y=p.floor+5;p.vel.set(0,5,0);
   p.t+=1/60;p.animate(1/60);const rise=p.v72StudioPack.slot;
   // Advance the authored source clock to its actual end before comparing
   // the next clip. The source endpoints are compatible, unlike the older
   // immediate Jump Up -> Falling Idle selection.
   p.v72StudioPack.clock=s.motionClips.jump.seconds;
   const hum=p.vrmRig.vrm.humanoid;
   const maxDrift=()=>p.v72StudioPack.studioPoseSnapshot?
    Math.max(...p.v72StudioPack.studioPoseSnapshot.map((q,i)=>
     q?.angleTo(hum.getNormalizedBoneNode([
       'hips','spine','chest','upperChest','neck','head',
       'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
       'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
       'leftUpperLeg','leftLowerLeg','leftFoot',
       'rightUpperLeg','rightLowerLeg','rightFoot'][i]).quaternion)||0)):null;
   const riseDrift=maxDrift();
   p.vel.y=-3;p.t+=1/60;p.animate(1/60);
   const fall=p.v72StudioPack.slot,fallDrift=maxDrift();
   const aerialLandingClock=p.v72StudioPack.clock;
   p.jumping=false;p.dropping=false;p.pos.y=p.floor;p.vel.y=0;
   p.landingMotionT=.48;
   const physicalBefore=p.pos.y;
   const clips=[],clocks=[];
   for(let n=0;n<64;n++){
    p.t+=1/60;p.animate(1/60);
    if(n===0||n===24||n===40||n===63){
     clips.push(p.v72StudioPack.slot);
     clocks.push(p.v72StudioPack.clock);
    }
    p.landingMotionT=Math.max(0,p.landingMotionT-1/60);
   }
   return {source:s.jumpSequence,rise,fall,aerialLandingClock,riseDrift,fallDrift,clips,clocks,
    physicsUnchanged:p.pos.y===physicalBefore,
    landingTimer:p.landingMotionT,error:s.error};
  });
  assert(standingJump.source?.active,
   'Normal game failed to load the actual five uploaded Mixamo sources');
  assert.equal(standingJump.rise,'jump',
   'Standing takeoff was stolen by a height-based flight animation');
  assert.equal(standingJump.fall,'landing',
   'Normal short jump spliced the mismatched Falling Idle instead of the continuous descent');
  assert(standingJump.aerialLandingClock<.09,
   'Standing descent did not start from the original landing source first frame');
  assert(standingJump.riseDrift!==null&&standingJump.riseDrift<.01,
   'V81/V100 overwrote actual recorded standing jump pose');
  assert(standingJump.fallDrift!==null&&standingJump.fallDrift<.01,
   'A later VRM controller overwrote actual Falling Idle');
  assert(standingJump.clips.slice(0,3).every(x=>x==='landing'),
   'Recorded landing recovery was cut by the short physics landing timer');
  assert(standingJump.clocks[1]>.35,
   'Landing skipped the original Mixamo contact and absorption sequence');
  assert(standingJump.physicsUnchanged,'Visual Mixamo source moved the physical root');
  assert.equal(standingJump.error,null);
  await navigate('?scene=dojo');
  const movingJump=await page.evaluate(()=>{
   const g=window.SkyClash.Game,p=g.player,s=window.SkyClashPublishedActions;
   g.enterDojo();g.update=()=>{};window.SkyClash.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;
   p.hp=100;p.stun=0;p.downT=0;p.punchT=0;p.blastT=0;
   p.blockHeld=false;p.blocking=false;p.sprinting=false;p.dashing=false;
   p.acro=null;p.landingMotionT=0;p.jumping=true;p.dropping=false;
   p.pos.y=p.floor+5;p.vel.set(5,5,0);p.moveIntent.set(0,0,0);
   p.t+=1/60;p.animate(1/60);const rise=p.v72StudioPack.slot;
   // The source-compatible quick takeoff joins Landing frame zero
   // directly; don't force the partial Jump Down or incompatible fall.
   p.v72StudioPack.clock=s.motionClips.jumpQuick.seconds;
   p.vel.y=-3;let downFrames=0,landingFrames=0,fallFrames=0;
   for(let i=0;i<42;i++){
    p.t+=1/60;p.animate(1/60);
    if(p.v72StudioPack.slot==='jumpDown')downFrames++;
    if(p.v72StudioPack.slot==='landing')landingFrames++;
    if(p.v72StudioPack.slot==='fallingIdle')fallFrames++;
   }
   return {rise,downFrames,landingFrames,fallFrames,error:s.error};
  });
  assert.equal(movingJump.rise,'jumpQuick','Moving jump did not select shorter Mixamo rise');
  assert.equal(movingJump.downFrames,0,
   'The discontinued partial Jump Down still interrupted the clean moving jump');
  assert(movingJump.landingFrames>20,
   'Moving descent did not continue into the original contact/recovery clip');
  assert.equal(movingJump.fallFrames,0,
   'Ordinary short jumps must not twist into the incompatible Falling Idle');
  assert.equal(movingJump.error,null);
  assert.equal(errors.length,0,'Browser errors: '+errors.join('; '));
  // Normal Training intentionally DOES NOT load the browser-local Studio
  // storage bridge. Inject its cleanup API explicitly for this CI browser.
  await page.addScriptTag({url:base+'js/studio-live-bridge.js?v=5'});
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
