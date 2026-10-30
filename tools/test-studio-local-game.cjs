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
   const full=pose(),footAnchors=Object.values(p.v72StudioPack.localStrikeFeet)
    .filter(x=>x?.point).length;
   const fullBodyPunchFrames=s.localPlaytest.fullBodyPunchFrames;
   // Same imported clip, but no full-body flag: the old upper-body-only
   // routing must produce a measurably different lower-body pose.
   s.localPlaytest.slots=[];
   p.attackSerial+=1;p.attackElapsed=.05;p.punchT=.3;
   for(let i=0;i<10;i++){p.t+=1/60;p.animate(1/60);}
   const masked=pose(),legMotionRadians=Math.max(
    ...full.map((q,i)=>q.angleTo(masked[i])));
   s.localPlaytest.slots=['punch1'];
   return {state:s.localPlaytest.state,slots:s.localPlaytest.slots,
    footAnchors,fullBodyPunchFrames,legMotionRadians,
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
  assert(applied.legMotionRadians>.06,'Local authored hips/legs did not reach real Kairo');
  // Same browser and IndexedDB, but NO opt-in flag: original published
  // punch1 must remain exactly as before.
  await navigate('?scene=dojo');
  const normal=await page.evaluate(()=>({
   state:window.SkyClashPublishedActions.localPlaytest.state,
   sourceFile:window.SkyClashPublishedActions.motionClips.punch1?.sourceFile,
   indicator:!!document.getElementById('studioLocalMovesStatus')
  }));
  assert.equal(normal.state,'off');
  assert.notEqual(normal.sourceFile,'local-apply-to-game-test.fbx');
  assert(!normal.indicator);
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
  await context.close();
  console.log('PASS real Kairo: empty fallback, saved local punch plays in V72, default untouched, corrupt pack fallback');
 }finally{await browser.close();}
})().catch(e=>{console.error('STUDIO LOCAL GAME E2E FAILED',e.stack||e);process.exitCode=1;});
