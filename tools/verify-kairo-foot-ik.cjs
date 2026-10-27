/* Real Kairo WebGL: measure how a 2-leg Blender IK sample survives
 * the existing evaluated-world-delta -> normalized local rig transfer.
 * Do NOT "fix" drift silently: measure source AND destination separately.
 * No clip, game-script or physics edits.
 */
'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const OUT=path.resolve('visual-review-output/kairo-combat-foundation');
const clip=JSON.parse(fs.readFileSync(path.join(OUT,'blender-foot-ik-source.json'),'utf8'));
const manifest=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json');
assert.equal(clip.schema,'sky-clash.blender-stationary-foot-ik-probe.v1');
assert.equal(clip.status,'SOURCE_IK_ONLY_TARGET_RUNTIME_UNVERIFIED');
assert.equal(clip.modelSha256,crypto.createHash('sha256').update(
 fs.readFileSync('assets/characters/kairo.vrm')).digest('hex'));
assert.equal(clip.rigSignature,manifest.rigSignature);
assert.deepEqual(clip.bones,manifest.bones);
assert.deepEqual(clip.parents,manifest.parents);
assert.equal(clip.frames.length,9);
assert(clip.maxSourceAnkleError<.0025,'Source IK must plant both ankles');
assert(clip.maxSourceSoleAngularErrorDegrees<.15,'Source sole orientation must be held');
for(const frame of clip.frames){
 assert.equal(frame.deltasWXYZ.length,20);
 assert(frame.deltasWXYZ.every(q=>Array.isArray(q)&&q.length===4&&
   q.every(Number.isFinite)&&Math.abs(Math.hypot(...q)-1)<1e-5));
}
async function main(){
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:960,height:640}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,500));});
 try{
  await page.goto('http://127.0.0.1:'+(process.env.VISUAL_PORT||'8765')+'/index.html',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPublishedActions?.ready&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
   null,{timeout:180000});
  const data=await page.evaluate((source)=>{
   const s=window.SkyClash,g=s.Game,p=g.player,T=window.THREE;
   g.enterDojo();g.introT=0;g.update=()=>{};s.CameraRig.update=()=>{};
   p.reset();p.pos.set(0,p.floor,0);p.vel.set(0,0,0);
   p.moveIntent.set(0,0,0);p.facing=0;p.blockHeld=false;p.punchT=0;
   for(let i=0;i<90;i++)p.animate(1/60);
   if(p.characterId!=='kairo_venn'||!p.v72StudioPack||!p.v81PoseTransitions||
      !window.SkyClashV100Animator)throw Error('Real Kairo original animation controllers absent');
   const cv=document.querySelector('canvas');
   if(!(cv?.getContext('webgl2')||cv?.getContext('webgl')))
    throw Error('Real rendered WebGL required');
   const rig=p.vrmRig.vrm,h=rig.humanoid,scene=rig.scene;
   const bones=source.bones,nodes=bones.map(n=>h.getNormalizedBoneNode(n));
   if(nodes.some(n=>!n))throw Error('Normalized original rig incomplete');
   if(nodes.some((n,i)=>h.getRawBoneNode(bones[i])?.name!==source.sourceBoneNames[i]))
    throw Error('Original Kairo raw/normalized source bone mismatch');
   const nodeMap=new Map(nodes.map((n,i)=>[n,bones[i]]));
   const parentName=node=>{let p=node.parent;while(p){if(nodeMap.has(p))return nodeMap.get(p);p=p.parent;}return null;};
   if(JSON.stringify(nodes.map(parentName))!==JSON.stringify(source.parents))
    throw Error('Measured normalized bone hierarchy drift');
   scene.updateMatrixWorld(true);
   const baseline=nodes.map(n=>n.quaternion.clone());
   const worldBase=nodes.map(n=>n.getWorldQuaternion(new T.Quaternion()));
   const C=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
   const sceneQ=scene.getWorldQuaternion(new T.Quaternion()),sceneInv=sceneQ.clone().invert();
   const get=name=>h.getNormalizedBoneNode(name);
   const anchors={};
   for(const name of ['leftFoot','rightFoot','leftHand','rightHand','hips'])
    anchors[name]=get(name).getWorldPosition(new T.Vector3());
   const footRotBase={};
   for(const name of ['leftFoot','rightFoot'])
    footRotBase[name]=get(name).getWorldQuaternion(new T.Quaternion());
   const restore=()=>{
    nodes.forEach((n,i)=>n.quaternion.copy(baseline[i]));
    rig.update(0);scene.updateMatrixWorld(true);
   };
   // Disposable target-skeleton correction: the Blender IK source and
   // Kairo VRM0 rig have different link/bind geometry. Solve the measured
   // foot world-position anchors on Kairo's REAL normalized thigh/shin
   // chain *after* preserving all Blender output rotations in the trace.
   // This is never installed as a game animation owner.
   function correctedFoot(side){
    const foot=get(side+'Foot'),goal=anchors[side+'Foot'];
    const originalWorldSole=foot.getWorldQuaternion(new T.Quaternion());
    const sourceLegRot={
     thigh:get(side+'UpperLeg').quaternion.clone(),
     shin:get(side+'LowerLeg').quaternion.clone()
    };
    let worstResidual=Infinity,iterations=0;
    const moveJoint=(joint)=>{
     scene.updateMatrixWorld(true);
     const pivot=joint.getWorldPosition(new T.Vector3());
     const end=foot.getWorldPosition(new T.Vector3()).sub(pivot);
     const desired=goal.clone().sub(pivot);
     if(end.lengthSq()<1e-9||desired.lengthSq()<1e-9)return;
     const delta=new T.Quaternion().setFromUnitVectors(end.normalize(),desired.normalize());
     const angle=delta.angleTo(new T.Quaternion());
     if(angle>.23)
      delta.slerpQuaternions(new T.Quaternion(),delta,.23/angle).normalize();
     const current=joint.getWorldQuaternion(new T.Quaternion());
     const wanted=delta.multiply(current).normalize();
     const parent=joint.parent.getWorldQuaternion(new T.Quaternion());
     joint.quaternion.copy(parent.invert().multiply(wanted)).normalize();
     scene.updateMatrixWorld(true);
    };
    for(let i=0;i<45;i++){
     iterations=i+1;
     const leftError=foot.getWorldPosition(new T.Vector3()).distanceTo(goal);
     worstResidual=leftError;
     if(leftError<.0007)break;
     moveJoint(get(side+'LowerLeg'));
     moveJoint(get(side+'UpperLeg'));
    }
    // Restore the exact source WORLD shoe orientation while keeping the
    // corrected ankle position. Foot bone rotations do not move its head.
    const parent=foot.parent.getWorldQuaternion(new T.Quaternion());
    foot.quaternion.copy(parent.invert().multiply(originalWorldSole)).normalize();
    rig.update(0);scene.updateMatrixWorld(true);
    const error=foot.getWorldPosition(new T.Vector3()).distanceTo(goal);
    return {error,iterations,
     shinCorrectionDegrees:T.MathUtils.radToDeg(
       sourceLegRot.shin.angleTo(get(side+'LowerLeg').quaternion)),
     thighCorrectionDegrees:T.MathUtils.radToDeg(
       sourceLegRot.thigh.angleTo(get(side+'UpperLeg').quaternion)),
     soleRestorationDegrees:T.MathUtils.radToDeg(
       foot.getWorldQuaternion(new T.Quaternion()).angleTo(originalWorldSole))
    };
   }
   const frames=[];
   let maxAngleError=0;
   try{
    for(const frame of source.frames){
     restore();
     const expected=[];
     // Kairo's hierarchy must be solved root-to-leaf, respecting Blender's
     // evaluated parent-aware world rotations, not copied source-local rotations.
     for(let i=0;i<nodes.length;i++){
      const w=frame.deltasWXYZ[i],qb=new T.Quaternion(w[1],w[2],w[3],w[0]).normalize();
      const qy=C.clone().multiply(qb).multiply(C.clone().invert());
      const desired=sceneQ.clone().multiply(qy).multiply(sceneInv).multiply(worldBase[i]).normalize();
      expected.push(desired);
      scene.updateMatrixWorld(true);
      const parent=nodes[i].parent.getWorldQuaternion(new T.Quaternion());
      nodes[i].quaternion.copy(parent.invert().multiply(desired)).normalize();
      scene.updateMatrixWorld(true);
     }
     rig.update(0);scene.updateMatrixWorld(true);
     let error=0;
     for(let i=0;i<nodes.length;i++)
      error=Math.max(error,nodes[i].getWorldQuaternion(new T.Quaternion()).angleTo(expected[i]));
     maxAngleError=Math.max(maxAngleError,error);
     const position={},soleAngle={};
     for(const name of Object.keys(anchors))
      position[name]=get(name).getWorldPosition(new T.Vector3()).distanceTo(anchors[name]);
     for(const name of ['leftFoot','rightFoot'])
      soleAngle[name]=T.MathUtils.radToDeg(
       get(name).getWorldQuaternion(new T.Quaternion()).angleTo(footRotBase[name]));
     const corrected={left:correctedFoot('left'),right:correctedFoot('right')};
     frames.push({frame:frame.frame,hipAuthorDegrees:frame.hipAuthorDegrees,
      sourceIK:frame.blenderIK,positionDrift:position,soleOrientationDriftDegrees:soleAngle,
      targetIkCorrections:corrected,worldOrientationErrorRadians:error});
    }
   }finally{restore();}
   return {realVRM:true,webGL:true,frames,maxAngleError,
    restoredLocalMax:Math.max(...nodes.map((n,i)=>n.quaternion.angleTo(baseline[i]))),
    restoredPositionMax:Math.max(...Object.keys(anchors).map(n=>
     get(n).getWorldPosition(new T.Vector3()).distanceTo(anchors[n])))};
  },clip);
  assert(data.realVRM&&data.webGL);
  assert(data.maxAngleError<1e-5,'Complete 20-bone transfer must preserve Blender evaluated orientations');
  assert(data.restoredLocalMax<1e-6&&data.restoredPositionMax<1e-5,
   'Original Kairo standing pose must be unchanged after test');
  const maxDrift={leftFoot:0,rightFoot:0,leftSoleAngle:0,rightSoleAngle:0};
  for(const sample of data.frames){
   for(const n of ['leftFoot','rightFoot'])
    maxDrift[n]=Math.max(maxDrift[n],sample.positionDrift[n]);
   maxDrift.leftSoleAngle=Math.max(maxDrift.leftSoleAngle,sample.soleOrientationDriftDegrees.leftFoot);
   maxDrift.rightSoleAngle=Math.max(maxDrift.rightSoleAngle,sample.soleOrientationDriftDegrees.rightFoot);
  }
  const correctionSummary={maxResidual:0,maxThighCorrectionDegrees:0,
    maxShinCorrectionDegrees:0,maxSoleRestorationDegrees:0};
  for(const sample of data.frames)for(const side of ['left','right']){
   const c=sample.targetIkCorrections[side];
   correctionSummary.maxResidual=Math.max(correctionSummary.maxResidual,c.error);
   correctionSummary.maxThighCorrectionDegrees=Math.max(
    correctionSummary.maxThighCorrectionDegrees,c.thighCorrectionDegrees);
   correctionSummary.maxShinCorrectionDegrees=Math.max(
    correctionSummary.maxShinCorrectionDegrees,c.shinCorrectionDegrees);
   correctionSummary.maxSoleRestorationDegrees=Math.max(
    correctionSummary.maxSoleRestorationDegrees,c.soleRestorationDegrees);
  }
  const errorsUnexpected=errors.filter(e=>!e.includes(
   'Sky Clash V63: leaving V62 fallback active Error: V62 native master could not be found'));
  assert.deepEqual(errorsUnexpected,[]);
  const sourceOK=clip.maxSourceAnkleError<.0025;
  // DO NOT mistake perfect quaternion retarget for world-position foot lock.
  // Report whether the Blender IK source survives its different VRM0 scene rig.
  const lockThreshold=.004;
  const plantedInGame=maxDrift.leftFoot<lockThreshold&&maxDrift.rightFoot<lockThreshold&&
   maxDrift.leftSoleAngle<2&&maxDrift.rightSoleAngle<2;
  const report={schema:'sky-clash.blender-ik-to-game-footplant.v1',
    status:plantedInGame?'IK_TRANSFER_FOOTLOCK_MEASURED':'IK_SOURCE_LOCKED_GAME_RETARGET_NEEDS_FOOT_SOLVER',
    blenderVersion:clip.blenderVersion,modelSha256:clip.modelSha256,
    sourceIKSuccess:sourceOK,gameFootPlantWithinThreshold:plantedInGame,
    testOnly:true,thresholdSceneUnits:lockThreshold,maxDrift,
    targetIKCorrection:correctionSummary,
    targetIKPositionWithinThreshold:correctionSummary.maxResidual<lockThreshold,
    ...data,limitations:[
      'The Blender source feet are locked; target game anatomy may still require real-VRM positional IK after rotation retargeting',
      'Target-position CCD is only an offline VRM quaternion bake feasibility test and is NOT part of the live game',
      'No hip/root translation, toe planting, foot contact force, or combat visuals have been validated',
      'All tests run on an isolated existing-Kairo scene and restore exact approved idle',
      'No game or animation clip changes'
    ]};
  fs.writeFileSync(path.join(OUT,'blender-ik-footplant-real-vrm-report.json'),
   JSON.stringify(report,null,2));
  console.log('KAIRO_BLENDER_IK_FOOTPLANT_DIAGNOSTIC '+JSON.stringify({
   sourceMaxFootError:clip.maxSourceAnkleError,gameFootPlantWithinThreshold:plantedInGame,
   gameDrift:maxDrift,targetIKCorrection:correctionSummary,
   transferError:data.maxAngleError,restored:true
  }));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
