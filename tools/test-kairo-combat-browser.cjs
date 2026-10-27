/* Opt-in Batch A actual game / real Kairo VRM WebGL.
 * Lightweight contact stills and telemetry, never a flight video.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out=path.resolve('visual-review-output/kairo-combat-playable');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1040,height:690},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&errors.length<8)errors.push(m.text());});
 try{
  const port=process.env.VISUAL_PORT||'8765';
  await page.goto('http://127.0.0.1:'+port+'/index.html?combatAnim=kairo-a1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid&&
   window.SkyClashPublishedActions?.combatPreview==='kairo-a1',
   null,{timeout:180000});
  const setup=await page.evaluate(()=>{
   const g=window.SkyClash.Game,s=window.SkyClash,p=g.player;
   g.enterDojo();g.update=()=>{};s.CameraRig.update=()=>{};
   for(const n of document.querySelectorAll('#titleScreen,.title-screen,.menu-overlay,.loading-overlay,.sky-lab-panel'))
    n.style.setProperty('display','none','important');
   g.showPlayUI(true);g.introT=0;
   p.moveIntent.set(0,0,0);p.vel.set(0,0,0);
   p.blockHeld=false;p.blocking=false;p.punchT=0;p.blastT=0;
   p.dashing=false;p.sprinting=false;p.flying=false;p.jumping=false;
   p.launched=false;p.spiked=false;p.attackAir=false;p.stun=0;
   p.facing=0;p.model.root.rotation.y=0;
   const target=p.model.root.getWorldPosition(new window.THREE.Vector3());target.y+=1.15;
   g.__combatCam=view=>{
    s.camera.position.set(target.x+(view==='side'?4.8:0),
     target.y+.65,target.z+(view==='side'?0:4.8));
    s.camera.lookAt(target);s.camera.updateMatrixWorld(true);
   };
   g.__combatCam('front');
   const cv=document.querySelector('canvas');
   const gl=cv?.getContext('webgl2')||cv?.getContext('webgl');
   return {id:p.characterId,humanoid:!!p.vrmRig.vrm.humanoid,webGL:!!gl};
  });
  assert.equal(setup.id,'kairo_venn');
  assert(setup.humanoid&&setup.webGL);
  // Let the browser paint the first playing-state frame rather than the last title frame.
  await page.waitForTimeout(360);
  const record=[];
  async function capture(label,expect){
   const p=await page.evaluate(()=>{
    const f=window.SkyClash.Game.player;
    f.animate(1/60);
    const rig=f.vrmRig.vrm,h=rig.humanoid,T=window.THREE;
    const pos=n=>h.getNormalizedBoneNode(n).getWorldPosition(new T.Vector3()).toArray();
    return {slot:f.v72StudioPack?.slot,grip:f.v81PoseTransitions?.handGrip,
     leftHand:pos('leftHand'),rightHand:pos('rightHand'),
     leftFoot:pos('leftFoot'),hips:pos('hips'),root:f.model.root.position.toArray(),
     leftForearm:h.getNormalizedBoneNode('leftLowerArm').quaternion.toArray()};
   });
   assert.equal(p.slot,expect,'Wrong selected authored clip '+label);
   for(const v of [p.leftHand,p.rightHand,p.leftFoot,p.hips,p.leftForearm])
    assert(v.every(Number.isFinite),'Invalid Kairo rig pose '+label);
   for(const side of ['front','side']){
    await page.evaluate(v=>window.SkyClash.Game.__combatCam(v),side);
    // Frame just the fighter, not a panorama of the training room or HUD.
    await page.screenshot({path:path.join(out,label+'-'+side+'.png'),
      clip:{x:260,y:130,width:520,height:450},animations:'disabled'});
   }
   record.push({label,...p});return p;
  }
  for(let i=0;i<22;i++)await page.evaluate(()=>window.SkyClash.Game.player.animate(1/60));
  await capture('ready','combatReady');
  await page.evaluate(()=>{const p=window.SkyClash.Game.player;p.blockHeld=true;p.blocking=true;});
  for(let i=0;i<19;i++)await page.evaluate(()=>window.SkyClash.Game.player.animate(1/60));
  const guard=await capture('guard','guard');
  assert(guard.grip>.40,'V81 should close guards into natural fists');
  await page.evaluate(()=>window.SkyClash.Game.player.riposteT=1.12);
  for(let i=0;i<7;i++)await page.evaluate(()=>window.SkyClash.Game.player.animate(1/60));
  await capture('parry','parry');
  await page.evaluate(()=>{const p=window.SkyClash.Game.player;
    p.blockHeld=false;p.blocking=false;p.riposteT=0;p.stun=.36;p.hitFlash=.2;});
  for(let i=0;i<5;i++)await page.evaluate(()=>window.SkyClash.Game.player.animate(1/60));
  await capture('heavyHit','hitHeavy');
  await page.evaluate(()=>{const p=window.SkyClash.Game.player;p.stun=0;p.hitFlash=0;});
  const strikes=[
   ['punch1','punch',1,1,.55,.24,''],
   ['punch2','punch',0,2,.55,.24,''],
   ['punch3','hook',1,3,.68,.33,'hook'],
   ['overhand','hook',1,4,.68,.33,'overhand'],
   ['kick','kick',0,5,.87,.41,'']
  ];
  for(const [slot,kind,side,serial,duration,contact,variant] of strikes){
   await page.evaluate(x=>{
    const f=window.SkyClash.Game.player;
    f.punchT=x[4];f.attackTotal=x[4];f.attackElapsed=0;
    f.attackKind=x[1];f.punchSide=x[2];f.attackSerial=x[3];
    f.attackVariant=x[6];f.attackAir=false;
   },[slot,kind,side,serial,duration,contact,variant]);
   for(let i=0;i<9;i++)await page.evaluate(()=>window.SkyClash.Game.player.animate(1/60));
   await page.evaluate(x=>{const f=window.SkyClash.Game.player;
    f.attackElapsed=x[5];f.punchT=x[4]-x[5];},
    [slot,kind,side,serial,duration,contact,variant]);
   const result=await capture(slot+'Contact',slot);
   const reference=await page.evaluate(async x=>{
    const response=await fetch('assets/animations/combat/kairo/storm-fist-batch-a.pose.json');
    const data=await response.json(),clip=data.clips.find(c=>c.slot===x[0]);
    return {duration:clip.duration,contact:clip.contactTime,
      forearm:clip.keyframes.find(k=>Math.abs(k.time-x[5])<.00001).quaternions[8]};
   },[slot,kind,side,serial,duration,contact,variant]);
   assert.equal(reference.contact,contact);
   assert.equal(reference.duration,duration);
   const dot=Math.abs(result.leftForearm.reduce((s,v,i)=>s+v*reference.forearm[i],0));
   assert(dot>.985,'Actual rendered combat joint differs from authored key at '+slot);
  }
  // Verify the ORIGINAL game still creates the jab's true contact timer.
  const truth=await page.evaluate(()=>{
   const s=window.SkyClash,g=s.Game,p=g.player,e=g.enemy;
   g.mode='fight';g.dojoRival=true;
   p.punchT=0;p.meleeCd=0;p.combo=0;p.lastMelee=-100;p.stun=0;
   p.launched=false;p.downT=0;p.t=5;p.attackAir=false;
   e.hp=100;e.pos.set(p.pos.x,p.pos.y,p.pos.z+2.15);
   e.facing=Math.PI;e.t=5;e.vel.set(0,0,0);p.facing=0;
   s.Combat.melee(p,e);
   return {contact:p.kickPend?.t,duration:p.attackTotal,kind:p.attackKind};
  });
  assert.equal(truth.contact,.24);assert.equal(truth.duration,.55);
  assert.equal(truth.kind,'punch');
  // V63's established missing-optional-V62-native-master console fallback
  // is an existing public game condition, not a Kairo combat decoder failure.
  const unrelated=errors.filter(e=>e.startsWith(
    'Sky Clash V63: leaving V62 fallback active Error: V62 native master could not be found'));
  const failures=errors.filter(e=>!unrelated.includes(e));
  assert.deepEqual(failures,[],'Unexpected real-game animation/runtime errors');
  fs.writeFileSync(path.join(out,'combat-qa.json'),
   JSON.stringify({realWebGL:true,preview:'kairo-a1',visualApproval:false,
    character:'kairo_venn',frames:record,gameplay:truth,legacyFallbacks:unrelated.length},null,2));
  console.log('PASS COMBAT_BATCH_A_REAL_GAME '+JSON.stringify({
   clips:strikes.length,samples:record.length,gameplay:truth}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
