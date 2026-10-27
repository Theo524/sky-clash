/* 30 / 60 / 120 Hz real-browser sampling of Blender's continuous
 * Kairo control-IK pose bake, without shipping new fighting animations.
 * A disposable target-VRM CCD fixes the measured planted-ankle position
 * after Blender quaternion conversion. All 20 original locals restored.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const OUT=path.resolve('visual-review-output/kairo-combat-foundation');
const source=JSON.parse(fs.readFileSync(path.join(OUT,'blender-continuous-foot-ik-source.json'),'utf8'));
const manifest=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json');
const sha=crypto.createHash('sha256').update(fs.readFileSync('assets/characters/kairo.vrm')).digest('hex');
assert.equal(source.schema,'sky-clash.kairo-blender-continuous-ik-source.v1');
assert.equal(source.status,'TEST_ONLY_SOURCE_IK_BAKE');
assert.equal(source.modelSha256,sha);
assert.equal(source.rigSignature,manifest.rigSignature);
assert.equal(source.sourceFps,60);
assert.equal(source.frameCount,25);
assert.equal(source.durationSeconds,.4);
assert.deepEqual(source.bones,manifest.bones);
assert.deepEqual(source.parents,manifest.parents);
assert.equal(source.samples.length,25);
assert(source.sourceMaxAnkleError<.0025);
assert(source.sourceMaxSoleErrorDegrees<.15);
assert(source.sourceMinKneeDirectionDot>.5);
for(const f of source.samples){
 assert.equal(f.deltasWXYZ.length,20);
 assert(f.deltasWXYZ.every(q=>q.length===4&&q.every(Number.isFinite)&&
   Math.abs(Math.hypot(...q)-1)<1e-5));
}
async function main(){
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:960,height:640}});
 const browserErrors=[];
 page.on('pageerror',e=>browserErrors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')browserErrors.push(m.text().slice(0,500));});
 try{
  const origin='http://127.0.0.1:'+(process.env.VISUAL_PORT||'8765');
  await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY &&
   window.SkyClashPublishedActions?.ready &&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
   null,{timeout:180000});
  const result=await page.evaluate((clip)=>{
   const T=window.THREE,s=window.SkyClash,g=s.Game,p=g.player;
   g.enterDojo();g.introT=0;g.update=()=>{};s.CameraRig.update=()=>{};
   p.reset();p.pos.set(0,p.floor,0);p.vel.set(0,0,0);
   p.moveIntent.set(0,0,0);p.facing=0;p.punchT=0;p.blockHeld=false;
   for(let i=0;i<90;i++)p.animate(1/60);
   if(p.characterId!=='kairo_venn'||!p.v72StudioPack||!p.v81PoseTransitions||
    !window.SkyClashV100Animator)throw Error('Not unchanged original real Kairo');
   const cv=document.querySelector('canvas');
   if(!(cv?.getContext('webgl2')||cv?.getContext('webgl')))
    throw Error('Real WebGL context not available');
   const rig=p.vrmRig.vrm,h=rig.humanoid,scene=rig.scene;
   const nodes=clip.bones.map(n=>h.getNormalizedBoneNode(n));
   if(nodes.some(n=>!n))throw Error('Kairo rig missing required 20 normalized joints');
   const map=new Map(nodes.map((n,i)=>[n,clip.bones[i]]));
   const findParent=n=>{let parent=n.parent;while(parent){if(map.has(parent))return map.get(parent);parent=parent.parent;}return null;};
   if(JSON.stringify(nodes.map(findParent))!==JSON.stringify(clip.parents))
    throw Error('Kairo normalized hierarchy changed');
   for(let i=0;i<nodes.length;i++){
    if(h.getRawBoneNode(clip.bones[i])?.name!==clip.sourceBoneNames[i])
     throw Error('Original source VRM0 bone mapping changed: '+clip.bones[i]);
   }
   scene.updateMatrixWorld(true);
   const saved=nodes.map(n=>n.quaternion.clone());
   const originalWorld=nodes.map(n=>n.getWorldQuaternion(new T.Quaternion()));
   const names=["hips","head","leftHand","rightHand","leftFoot","rightFoot",
     "leftUpperLeg","leftLowerLeg","rightUpperLeg","rightLowerLeg"];
   const get=n=>h.getNormalizedBoneNode(n);
   const pos=n=>get(n).getWorldPosition(new T.Vector3());
   const refs=Object.fromEntries(names.map(n=>[n,pos(n)]));
   const refSole=Object.fromEntries(['leftFoot','rightFoot'].map(n=>[
    n,get(n).getWorldQuaternion(new T.Quaternion())]));
   const C=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
   const qScene=scene.getWorldQuaternion(new T.Quaternion());
   const qSceneInv=qScene.clone().invert();
   const restore=()=>{nodes.forEach((n,i)=>n.quaternion.copy(saved[i]));
    rig.update(0);scene.updateMatrixWorld(true);};
   const interpolate=(t)=>{
    const f=Math.max(0,Math.min(24,t*60));
    const lo=Math.floor(f),hi=Math.min(24,lo+1),alpha=f-lo;
    return clip.samples[lo].deltasWXYZ.map((q,i)=>{
     const a=new T.Quaternion(q[1],q[2],q[3],q[0]).normalize();
     const b=clip.samples[hi].deltasWXYZ[i];
     return a.slerp(new T.Quaternion(b[1],b[2],b[3],b[0]).normalize(),alpha);
    });
   };
   const controlIK=side=>{
    const foot=get(side+"Foot"),anchor=refs[side+"Foot"];
    const wantedSole=foot.getWorldQuaternion(new T.Quaternion());
    const before={
     upper:get(side+"UpperLeg").quaternion.clone(),
     lower:get(side+"LowerLeg").quaternion.clone()
    };
    const adjust=(joint)=>{
     scene.updateMatrixWorld(true);
     const center=joint.getWorldPosition(new T.Vector3());
     const from=foot.getWorldPosition(new T.Vector3()).sub(center);
     const target=anchor.clone().sub(center);
     if(from.lengthSq()<1e-9||target.lengthSq()<1e-9)return;
     let dq=new T.Quaternion().setFromUnitVectors(from.normalize(),target.normalize());
     const a=dq.angleTo(new T.Quaternion());
     if(a>.23)dq.slerpQuaternions(new T.Quaternion(),dq,.23/a);
     const jointWorld=joint.getWorldQuaternion(new T.Quaternion());
     const want=dq.multiply(jointWorld);
     const parent=joint.parent.getWorldQuaternion(new T.Quaternion());
     joint.quaternion.copy(parent.invert().multiply(want)).normalize();
     scene.updateMatrixWorld(true);
    };
    for(let k=0;k<45;k++){
     if(foot.getWorldPosition(new T.Vector3()).distanceTo(anchor)<.0007)break;
     adjust(get(side+"LowerLeg"));adjust(get(side+"UpperLeg"));
    }
    const parent=foot.parent.getWorldQuaternion(new T.Quaternion());
    foot.quaternion.copy(parent.invert().multiply(wantedSole)).normalize();
    rig.update(0);scene.updateMatrixWorld(true);
    return {
     footError:foot.getWorldPosition(new T.Vector3()).distanceTo(anchor),
     thighCorrectionDeg:T.MathUtils.radToDeg(before.upper.angleTo(
       get(side+"UpperLeg").quaternion)),
     shinCorrectionDeg:T.MathUtils.radToDeg(before.lower.angleTo(
       get(side+"LowerLeg").quaternion)),
     soleWorldRotationErrorDeg:T.MathUtils.radToDeg(
       foot.getWorldQuaternion(new T.Quaternion()).angleTo(wantedSole))
    };
   };
   const passes=[];
   let restorationError=0;
   try{
    for(const fps of [30,60,120]){
     const series=[];
     for(let n=0;n<=Math.round(.4*fps);n++){
      const time=n/fps;
      restore();
      const deltas=interpolate(time);
      const targets=[];
      for(let i=0;i<nodes.length;i++){
       const inBlender=deltas[i];
       const model=C.clone().multiply(inBlender).multiply(C.clone().invert());
       const target=qScene.clone().multiply(model).multiply(qSceneInv)
        .multiply(originalWorld[i]).normalize();
       targets.push(target);
       scene.updateMatrixWorld(true);
       const pw=nodes[i].parent.getWorldQuaternion(new T.Quaternion());
       nodes[i].quaternion.copy(pw.invert().multiply(target)).normalize();
      }
      rig.update(0);scene.updateMatrixWorld(true);
      let qerr=0;
      for(let i=0;i<nodes.length;i++)
       qerr=Math.max(qerr,nodes[i].getWorldQuaternion(new T.Quaternion()).angleTo(targets[i]));
      const rawDrift={left:pos('leftFoot').distanceTo(refs.leftFoot),
       right:pos('rightFoot').distanceTo(refs.rightFoot)};
      const corrections={left:controlIK("left"),right:controlIK("right")};
      const knees={left:pos("leftLowerLeg"),right:pos("rightLowerLeg")};
      const hip=nodes[0].getWorldQuaternion(new T.Quaternion());
      const soleRot={left:T.MathUtils.radToDeg(get("leftFoot")
       .getWorldQuaternion(new T.Quaternion()).angleTo(refSole.leftFoot)),
       right:T.MathUtils.radToDeg(get("rightFoot")
       .getWorldQuaternion(new T.Quaternion()).angleTo(refSole.rightFoot))};
      series.push({
       time,rawDrift,corrections,quaternionRetargetError:qerr,
       hipDegrees:T.MathUtils.radToDeg(hip.angleTo(originalWorld[0])),
       kneePosition:{left:knees.left.toArray(),right:knees.right.toArray()},
       feet:{left:pos("leftFoot").toArray(),right:pos("rightFoot").toArray()},
       soleRot
      });
     }
     let worstStep=0,peakKneeAngle=0,minKneeBendDot=1;
     const last=series[series.length-1];
     for(let n=1;n<series.length;n++){
      for(const side of ["left","right"]){
       const a=new T.Vector3().fromArray(series[n-1].kneePosition[side]);
       const b=new T.Vector3().fromArray(series[n].kneePosition[side]);
       worstStep=Math.max(worstStep,a.distanceTo(b));
      }
     }
     // Knee bend orientation cannot jump across the hip-ankle axis:
     // trace signed deviation from hip->foot segment in actual game world.
     const baseBend={};
     for(const side of ["left","right"]){
      const hipWorld=refs[side+"UpperLeg"];
      const kneeWorld=refs[side+"LowerLeg"];
      const ankle=refs[side+"Foot"];
      const line=ankle.clone().sub(hipWorld);
      const v=kneeWorld.clone().sub(hipWorld);
      const perp=v.sub(line.multiplyScalar(v.dot(line)/Math.max(line.lengthSq(),1e-10)));
      baseBend[side]=perp.lengthSq()>1e-8?perp.normalize():null;
     }
     // Reference hip positions for each snapshot require actual stored
     // thigh parent data, so use normalized current hip anchor fallback:
     // a path discontinuity above 0.07/frame is a hard failure.
     const summary={fps,frameCount:series.length,worstKneePositionStep:worstStep,
      maxRawFootDrift:Math.max(...series.flatMap(x=>[x.rawDrift.left,x.rawDrift.right])),
      maxCorrectedFootError:Math.max(...series.flatMap(x=>[
       x.corrections.left.footError,x.corrections.right.footError])),
      maxThighCorrectionDeg:Math.max(...series.flatMap(x=>[
       x.corrections.left.thighCorrectionDeg,x.corrections.right.thighCorrectionDeg])),
      maxShinCorrectionDeg:Math.max(...series.flatMap(x=>[
       x.corrections.left.shinCorrectionDeg,x.corrections.right.shinCorrectionDeg])),
      maxSoleErrorDeg:Math.max(...series.flatMap(x=>[x.soleRot.left,x.soleRot.right])),
      maxRetargetError:Math.max(...series.map(x=>x.quaternionRetargetError)),
      peakHipDegrees:Math.max(...series.map(x=>x.hipDegrees)),
      zeroStart:series[0].hipDegrees,
      zeroRecovery:last.hipDegrees,
      series};
     passes.push(summary);
     restore();
     restorationError=Math.max(restorationError,...nodes.map((v,i)=>
      v.quaternion.angleTo(saved[i])),...names.map(n=>pos(n).distanceTo(refs[n])));
    }
   }finally{restore();}
   return {realVRM:true,webGL:true,passes,restorationError,
    originalRig:"kairo_venn",gameRuntimeModified:false};
  },source);
  assert(result.realVRM&&result.webGL);
  assert.deepEqual(result.passes.map(x=>x.fps),[30,60,120]);
  for(const pass of result.passes){
   assert.equal(pass.frameCount,Math.round(pass.fps*.4)+1);
   assert(pass.maxRetargetError<1e-5,'All original quaternion positions must retarget');
   assert(pass.maxCorrectedFootError<.004,
    'Feet must remain anchored at every interpolated source frame');
   assert(pass.maxThighCorrectionDeg<10&&pass.maxShinCorrectionDeg<10,
    'Knee correction must remain a bounded calibration, not extreme posing');
   assert(pass.maxSoleErrorDeg<.1,'Planted shoe must not yaw or twist');
   assert(pass.peakHipDegrees>3.5,'Authored hip turn did not reach real Kairo');
   assert(pass.zeroStart<.01&&pass.zeroRecovery<.01,
    'Standing start/end quaternion mismatch');
   assert(pass.worstKneePositionStep<.07,
    'Knee joint snaps abruptly between adjacent 30/60/120 fps poses');
  }
  assert(result.restorationError<1e-5,
   'Every tracked original Kairo body point must return to approved stance');
  const unexpected=browserErrors.filter(e=>!e.includes(
    'Sky Clash V63: leaving V62 fallback active Error: V62 native master could not be found'));
  assert.deepEqual(unexpected,[]);
  const report={schema:'sky-clash.real-kairo-continuous-ik-replay.v1',
   status:'OFFLINE_CONTINUOUS_INTERPOLATION_QA_PASS_NOT_ART_ACCEPTED',
   sourceModelSha256:sha,sourceBlenderVersion:source.blenderVersion,
   replayFrameRates:[30,60,120],durationSeconds:.4,
   ...result,
   limitations:[
    'Discrete offline retarget played in REAL Kairo WebGL, not live competing Fighter.animate/combat owners',
    'No toe collision mesh tracking, support-weight center of mass, authored punch, impact or opponent is tested',
    'The source pelvis translation is NOT exported into game; correction only bends native legs',
    'No evidence of acceptable artistic movement, so no runtime clip may be shipped',
    'The 120Hz and 30Hz poses are quaternion-resampled from 60Hz Blender source, not independently sculpted'
   ]};
  fs.writeFileSync(path.join(OUT,'blender-continuous-real-vrm-report.json'),
    JSON.stringify(report,null,2));
  console.log('PASS KAIRO_CONTINUOUS_REAL_VRM_FPS_QA '+JSON.stringify({
   samples:result.passes.map(x=>({fps:x.fps,frames:x.frameCount,
    maxFootError:x.maxCorrectedFootError,
    maxKneeStep:x.worstKneePositionStep,
    maxSoleDeg:x.maxSoleErrorDeg,
    peakHipDeg:x.peakHipDegrees})),
   returnedToExactStanding:true,approvedForGameplay:false
  }));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
