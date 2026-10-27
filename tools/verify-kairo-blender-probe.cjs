/* Real-browser validation of Blender's evaluated raw rig motion:
 * Blender Z-up armature world delta -> model Y-up -> exact Kairo
 * normalized runtime world joint -> parent-relative local quaternion.
 * Does not install an animation, change any game JS or update standing.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const OUT=path.resolve('visual-review-output/kairo-combat-foundation');
const probe=JSON.parse(fs.readFileSync(path.join(OUT,'blender-original-rig-probe.json'),'utf8'));
const modelSha256=crypto.createHash('sha256').update(
 fs.readFileSync('assets/characters/kairo.vrm')).digest('hex');
assert.equal(probe.modelSha256,modelSha256);
assert.equal(probe.schema,'sky-clash.blender-to-vrm0-world-delta-probe.v1');
assert.equal(probe.status,'TEST_ONLY_NOT_COMBAT_ANIMATION');
assert.equal(probe.targetNormalizedBone,'leftUpperArm');
assert.equal(probe.sourceBone,'J_Bip_L_UpperArm');
assert.deepEqual(probe.frames.map(x=>x.frame),[1,13,25]);
assert(probe.frames[0].angleDegrees<.001&&probe.frames[2].angleDegrees<.001);
assert(probe.frames[1].angleDegrees>15&&probe.frames[1].angleDegrees<21);
async function main(){
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:960,height:640}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,500));});
 try{
  const origin='http://127.0.0.1:'+(process.env.VISUAL_PORT||'8765');
  await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPublishedActions?.ready&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
   null,{timeout:180000});
  const result=await page.evaluate((clip)=>{
   const s=window.SkyClash,g=s.Game,p=g.player,T=window.THREE;
   g.enterDojo();g.introT=0;g.update=()=>{};s.CameraRig.update=()=>{};
   p.reset();p.pos.set(0,p.floor,0);p.vel.set(0,0,0);
   p.moveIntent.set(0,0,0);p.facing=0;p.punchT=0;p.blockHeld=false;
   for(let i=0;i<90;i++)p.animate(1/60);
   const rig=p.vrmRig.vrm,scene=rig.scene,h=rig.humanoid;
   const left=h.getNormalizedBoneNode('leftUpperArm');
   const hand=h.getNormalizedBoneNode('leftHand');
   const right=h.getNormalizedBoneNode('rightHand');
   const names=clip.sourceBoneNames;
   // Prove target is same original VRM source joint, not guessed mock geometry.
   const raw=h.getRawBoneNode('leftUpperArm');
   if(raw?.name!=='J_Bip_L_UpperArm'||!left||!hand||!right||
      names.length!==20||!p.v72StudioPack||!p.v81PoseTransitions||
      !window.SkyClashV100Animator)throw Error('Wrong Kairo model or animation state');
   const canvas=document.querySelector('canvas');
   if(!(canvas?.getContext('webgl')||canvas?.getContext('webgl2')))
    throw Error('Actual Kairo WebGL required');
   scene.updateMatrixWorld(true);
   const clonePos=n=>n.getWorldPosition(new T.Vector3());
   const start={local:left.quaternion.clone(),world:left.getWorldQuaternion(new T.Quaternion()),
    leftHand:clonePos(hand),rightHand:clonePos(right)};
   const C=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
   const sceneQ=scene.getWorldQuaternion(new T.Quaternion());
   const invScene=sceneQ.clone().invert();
   const frames=[];
   let peakDisplacement=0,rightDisplacement=0,maxWorldError=0;
   for(const f of clip.frames){
    left.quaternion.copy(start.local);
    scene.updateMatrixWorld(true);
    const w=f.blenderWorldDeltaWXYZ;
    const db=new T.Quaternion(w[1],w[2],w[3],w[0]).normalize();
    const deltaModel=C.clone().multiply(db).multiply(C.clone().invert()).normalize();
    const deltaWorld=sceneQ.clone().multiply(deltaModel).multiply(invScene).normalize();
    const wantedWorld=deltaWorld.clone().multiply(start.world).normalize();
    const parentWorld=left.parent.getWorldQuaternion(new T.Quaternion());
    const local=parentWorld.invert().multiply(wantedWorld);
    left.quaternion.copy(local).normalize();
    scene.updateMatrixWorld(true);rig.update(0);scene.updateMatrixWorld(true);
    const error=left.getWorldQuaternion(new T.Quaternion()).angleTo(wantedWorld);
    const leftMove=clonePos(hand).distanceTo(start.leftHand);
    const rightMove=clonePos(right).distanceTo(start.rightHand);
    peakDisplacement=Math.max(peakDisplacement,leftMove);
    rightDisplacement=Math.max(rightDisplacement,rightMove);
    maxWorldError=Math.max(maxWorldError,error);
    frames.push({frame:f.frame,authorAngleDeg:f.angleDegrees,
     transferAngleDeg:T.MathUtils.radToDeg(start.world.angleTo(
      left.getWorldQuaternion(new T.Quaternion()))),
     worldErrorRadians:error,leftHandDisplacement:leftMove,
     otherHandDisplacement:rightMove});
   }
   left.quaternion.copy(start.local);
   rig.update(0);scene.updateMatrixWorld(true);
   return {realVRM:true,webGL:true,frames,peakDisplacement,
    rightDisplacement,maxWorldError,
    restEndAngle:left.quaternion.angleTo(start.local),
    leftHandRestore:clonePos(hand).distanceTo(start.leftHand),
    rightHandRestore:clonePos(right).distanceTo(start.rightHand)};
  },probe);
  assert.equal(result.realVRM,true);
  assert.equal(result.webGL,true);
  assert(result.peakDisplacement>.035,
   'Blender source motion failed to visibly move the actual left arm');
  assert(result.rightDisplacement<1e-4,
   'Transferring one arm must not move untouched opposite hand');
  assert(result.maxWorldError<1e-5,
   'Normalized rig conversion produced an unintended rotation');
  assert(result.restEndAngle<1e-6);
  assert(result.leftHandRestore<1e-6&&result.rightHandRestore<1e-6,
   'Must return to exact original standing geometry with no new idle');
  assert(Math.abs(result.frames[1].transferAngleDeg-
   result.frames[1].authorAngleDeg)<.001,
   'Blender rotation angle changed in VRM transfer');
  const unexpected=errors.filter(e=>!e.includes(
   'Sky Clash V63: leaving V62 fallback active Error: V62 native master could not be found'));
  assert.deepEqual(unexpected,[]);
  const report={schema:'sky-clash.blender-to-vrm0-proof.v1',
   status:'PASSED_ONE_BONE_WORLD_DELTA_ONLY',
   modelSha256,sourceBlenderVersion:probe.blenderVersion,
   sourceBone:probe.sourceBone,targetBone:probe.targetNormalizedBone,
   ...result,
   limits:[
    'Only one armature bone world-space delta (not full 20-bone animation, rest conversion or IK) has been verified',
    'Source rotations are taken from the Blender evaluated rig, not hand-guessed Euler game offsets',
    'This proof does not convert absolute Blender keyframe local rotations or foot-planted choreography',
    'Visible original idle and VRM rig remain entirely unchanged in shipped game'
   ]};
  fs.writeFileSync(path.join(OUT,'blender-to-real-vrm-probe-report.json'),
   JSON.stringify(report,null,2));
  console.log('PASS BLENDER_TO_REAL_KAIRO_NORMALIZED_VRM0 '+JSON.stringify({
   blenderVersion:probe.blenderVersion,
   peakHandMove:result.peakDisplacement,maxWorldError:result.maxWorldError,
   returnedToBaseline:result.restEndAngle<1e-6,
   note:'one arm rig conversion proof; no new game animations'}));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
