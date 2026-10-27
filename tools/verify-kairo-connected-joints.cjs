/* Disposable real-WebGL transfer validation for Blender's evaluated
 * connected-joint world deltas. Does not install any animations.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const OUT=path.resolve('visual-review-output/kairo-combat-foundation');
const clip=JSON.parse(fs.readFileSync(path.join(OUT,'blender-connected-joints-source.json'),'utf8'));
const manifest=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json');
const sha=crypto.createHash('sha256').update(fs.readFileSync('assets/characters/kairo.vrm')).digest('hex');
assert.equal(clip.schema,'sky-clash.blender-connected-joints-probe.v1');
assert.equal(clip.status,'TEST_ONLY_NO_FOOT_IK_NO_COMBAT');
assert.equal(clip.modelSha256,sha);
assert.equal(clip.rigSignature,manifest.rigSignature);
assert.deepEqual(clip.bones,manifest.bones);
assert.deepEqual(clip.parents,manifest.parents);
assert.deepEqual(clip.profiles.map(x=>x.name),['torso-arms','pelvis-legs']);
for(const profile of clip.profiles){
 assert.equal(profile.frames.length,5);
 for(const frame of profile.frames){
  assert.equal(frame.deltasWXYZ.length,20);
  assert(frame.deltasWXYZ.every(q=>q.length===4&&q.every(Number.isFinite)&&
   Math.abs(Math.hypot(...q)-1)<.00001));
 }
}
async function main(){
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist'
 ]});
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
  const proof=await page.evaluate((data)=>{
   const s=window.SkyClash,g=s.Game,p=g.player,T=window.THREE;
   g.enterDojo();g.introT=0;g.update=()=>{};s.CameraRig.update=()=>{};
   p.reset();p.pos.set(0,p.floor,0);p.vel.set(0,0,0);
   p.moveIntent.set(0,0,0);p.facing=0;p.blockHeld=false;p.punchT=0;
   for(let i=0;i<90;i++)p.animate(1/60);
   if(p.characterId!=='kairo_venn'||!p.v72StudioPack||!p.v81PoseTransitions||
      !window.SkyClashV100Animator)throw Error('Not actual Kairo with original owners');
   const cv=document.querySelector('canvas');
   if(!(cv?.getContext('webgl2')||cv?.getContext('webgl')))
    throw Error('Actual WebGL required');
   const rig=p.vrmRig.vrm,h=rig.humanoid,scene=rig.scene;
   const bones=data.bones;
   const nodes=bones.map(name=>h.getNormalizedBoneNode(name));
   if(nodes.some(x=>!x))throw Error('Incomplete real normalized rig');
   for(let i=0;i<bones.length;i++)
    if(h.getRawBoneNode(bones[i])?.name!==data.sourceBoneNames[i])
     throw Error('Source Kairo VRM bone mismatch: '+bones[i]);
   const map=new Map(nodes.map((n,i)=>[n,bones[i]]));
   const parentName=node=>{
    let n=node.parent;
    while(n){if(map.has(n))return map.get(n);n=n.parent;}
    return null;
   };
   const observedParents=nodes.map(parentName);
   if(JSON.stringify(observedParents)!==JSON.stringify(data.parents))
    throw Error('Not the same Kairo joint hierarchy');
   scene.updateMatrixWorld(true);
   const localBaseline=nodes.map(n=>n.quaternion.clone());
   const worldBaseline=nodes.map(n=>n.getWorldQuaternion(new T.Quaternion()));
   const named=(key)=>h.getNormalizedBoneNode(key);
   const TRACK=['hips','leftHand','rightHand','leftFoot','rightFoot','head'];
   const pos=n=>n.getWorldPosition(new T.Vector3());
   const reference=Object.fromEntries(TRACK.map(n=>[n,pos(named(n))]));
   const C=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
   const sceneQ=scene.getWorldQuaternion(new T.Quaternion()),invScene=sceneQ.clone().invert();
   const results=[];
   function restore(){
    nodes.forEach((node,i)=>node.quaternion.copy(localBaseline[i]));
    rig.update(0);scene.updateMatrixWorld(true);
   }
   try{
    for(const profile of data.profiles){
     let maxWorldError=0,maxFootDrift=0,peakHandMove=0,
      peakHipOrientationDeg=0,maxOtherFootDrift=0;
     const measurements=[];
     for(const frame of profile.frames){
      // Recompute from the ORIGINAL accepted gameplay pose each sample:
      // absolutely no re-using previous test poses or mutating gameplay.
      restore();
      for(let i=0;i<nodes.length;i++){
       const v=frame.deltasWXYZ[i];
       const blenderDelta=new T.Quaternion(v[1],v[2],v[3],v[0]).normalize();
       const modelDelta=C.clone().multiply(blenderDelta).multiply(C.clone().invert());
       const deltaWorld=sceneQ.clone().multiply(modelDelta).multiply(invScene);
       const target=deltaWorld.multiply(worldBaseline[i]).normalize();
       scene.updateMatrixWorld(true);
       const parentWorld=nodes[i].parent.getWorldQuaternion(new T.Quaternion());
       nodes[i].quaternion.copy(parentWorld.invert().multiply(target)).normalize();
       scene.updateMatrixWorld(true);
      }
      rig.update(0);scene.updateMatrixWorld(true);
      let error=0;
      for(let i=0;i<nodes.length;i++){
       const v=frame.deltasWXYZ[i];
       const blenderDelta=new T.Quaternion(v[1],v[2],v[3],v[0]).normalize();
       const deltaModel=C.clone().multiply(blenderDelta).multiply(C.clone().invert());
       const target=sceneQ.clone().multiply(deltaModel).multiply(invScene)
        .multiply(worldBaseline[i]).normalize();
       error=Math.max(error,nodes[i].getWorldQuaternion(new T.Quaternion()).angleTo(target));
      }
      const posDelta=Object.fromEntries(TRACK.map(n=>[
       n,pos(named(n)).distanceTo(reference[n])]));
      const hipDeg=T.MathUtils.radToDeg(worldBaseline[0].angleTo(
       nodes[0].getWorldQuaternion(new T.Quaternion())));
      maxFootDrift=Math.max(maxFootDrift,posDelta.leftFoot);
      maxOtherFootDrift=Math.max(maxOtherFootDrift,posDelta.rightFoot);
      peakHandMove=Math.max(peakHandMove,posDelta.leftHand,posDelta.rightHand);
      peakHipOrientationDeg=Math.max(peakHipOrientationDeg,hipDeg);
      maxWorldError=Math.max(maxWorldError,error);
      measurements.push({frame:frame.frame,worldOrientationError:error,
       hipOrientationDegrees:hipDeg,displacement:posDelta});
     }
     restore();
     const finalAngles=nodes.map((n,i)=>n.quaternion.angleTo(localBaseline[i]));
     const after=Object.fromEntries(TRACK.map(n=>[
      n,pos(named(n)).distanceTo(reference[n])]));
     results.push({name:profile.name,samples:measurements,maxWorldError,
      maxLeftFootDrift:maxFootDrift,maxRightFootDrift:maxOtherFootDrift,
      peakHandMove,peakHipOrientationDeg,
      worstRestorationAngle:Math.max(...finalAngles),
      restorationDisplacement:after});
    }
   }finally{restore();}
   return {realRig:true,webGL:true,results};
  },clip);
  assert.equal(proof.realRig,true);
  assert.equal(proof.webGL,true);
  assert.equal(proof.results.length,2);
  const upper=proof.results[0],lower=proof.results[1];
  for(const p of proof.results){
   assert(p.maxWorldError<1e-5,'Every measured normalized joint needs accurate source-world orientation');
   assert(p.worstRestorationAngle<1e-6,'Exact original 20-bone stance restoration required');
   assert(Object.values(p.restorationDisplacement).every(x=>x<1e-5),
    'All 6 tracked anatomical anchors must return to original baseline');
   assert(p.samples.every(x=>x.worldOrientationError<1e-5 &&
    Object.values(x.displacement).every(Number.isFinite)));
  }
  assert(upper.peakHandMove>.04,'Connected torso/arm movement must actually move real hands');
  assert(upper.maxLeftFootDrift<1e-5&&upper.maxRightFootDrift<1e-5,
   'Upper-body authoring must not drag either grounded shoe');
  assert(lower.peakHipOrientationDeg>1.0,'Pelvis must genuinely articulate');
  // LOWER PROFILE: REPORT, don't auto-approve, planting. Blender probe
  // deliberately has NO IK, therefore foot motion is expected.
  // Its sole unconditional contract is finite movement and exact recovery.
  const bad=errors.filter(e=>!e.includes(
   'Sky Clash V63: leaving V62 fallback active Error: V62 native master could not be found'));
  assert.deepEqual(bad,[]);
  const report={schema:'sky-clash.blender-connected-joints-real-vrm-proof.v1',
   status:'TRANSFER_VERIFIED_FOOT_PLANT_NOT_APPROVED',
   modelSha256:sha,blenderVersion:clip.blenderVersion,
   rigSignature:clip.rigSignature,...proof,
   limits:[
    'Kinematic orientation transfer for 20 connected nodes does not imply planted-feet IK',
    'Upper-body control keeps feet planted only because hips/legs were not moved in that window',
    'The deliberately non-IK lower-body sample measures support-foot drift but does not assert that drift is acceptable',
    'No gameplay clip, animation owner, approved idle or physics was changed'
   ]};
  fs.writeFileSync(path.join(OUT,'blender-connected-joints-real-vrm-report.json'),
   JSON.stringify(report,null,2));
  console.log('PASS KAIRO_CONNECTED_JOINT_AUTHORING_DIAGNOSTIC '+JSON.stringify({
   upperHand:upper.peakHandMove,upperLeftFoot:upper.maxLeftFootDrift,
   upperRightFoot:upper.maxRightFootDrift,
   lowerHipDegrees:lower.peakHipOrientationDeg,
   lowerFootDrift:[lower.maxLeftFootDrift,lower.maxRightFootDrift],
   maxWorldError:Math.max(upper.maxWorldError,lower.maxWorldError),
   stanceRestored:true,footIKApproved:false
  }));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
