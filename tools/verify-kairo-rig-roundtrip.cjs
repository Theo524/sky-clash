/* Kairo combat authoring interchange proof: genuine VRM0 normalized rig.
 * This diagnostic makes NO changes to game runtime or authoring assets.
 * It proves an exact normalized-local round trip on a real rendered VRM,
 * NOT a Blender->VRM0 converter or a complete production rig.
 */
'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const BASELINE=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json');
const OUT=path.resolve('visual-review-output/kairo-combat-foundation');
const BONES=['hips','spine','chest','upperChest','neck','head',
 'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
 'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
 'leftUpperLeg','leftLowerLeg','leftFoot',
 'rightUpperLeg','rightLowerLeg','rightFoot'];
const FINGER_NAMES=['Thumb','Index','Middle','Ring','Little']
 .flatMap(f=>['Metacarpal','Proximal','Intermediate','Distal'].map(s=>f+s));
const SHA=crypto.createHash('sha256')
 .update(fs.readFileSync('assets/characters/kairo.vrm')).digest('hex');
const hash=obj=>crypto.createHash('sha256')
 .update(JSON.stringify(obj)).digest('hex');
function validatePose(pack,contract){
 assert.equal(pack.schema,'sky-clash.combat-rig-io.v1');
 assert.equal(pack.fighter,'kairo_venn');
 assert.equal(pack.modelSha256,contract.modelSha256,'Wrong Kairo model binary');
 assert.equal(pack.sourceSpace,'vrm0-normalized-node-local-absolute',
  'No silent Blender/raw-GLTF/Mixamo/world-delta conversion');
 assert.equal(pack.rigSignature,contract.rigSignature,
  'Normalized skeleton or rest hierarchy changed');
 assert.deepEqual(pack.bones,contract.bones,'Joint order changed');
 assert.deepEqual(pack.parents,contract.parents,'Bone parent hierarchy changed');
 assert(Array.isArray(pack.quaternions)&&pack.quaternions.length===20);
 for(const q of pack.quaternions){
  assert(Array.isArray(q)&&q.length===4&&q.every(Number.isFinite));
  assert(Math.abs(Math.hypot(...q)-1)<1e-5,
   'Malformed quaternion MUST fail, not silently be normalized');
 }
 return true;
}
async function main(){
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--use-gl=angle',
  '--use-angle=swiftshader','--ignore-gpu-blocklist'
 ]});
 const page=await browser.newPage({viewport:{width:960,height:640}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,800));});
 try{
  const host='http://127.0.0.1:'+(process.env.VISUAL_PORT||'8765');
  await page.goto(host+'/index.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPublishedActions?.ready&&
   window.SkyClashPoseTransitions?.characters&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
   null,{timeout:180000});
  const result=await page.evaluate(({bones,fingers})=>{
   const g=window.SkyClash.Game,s=window.SkyClash,T=window.THREE;
   g.enterDojo();g.introT=0;
   g.update=()=>{};s.CameraRig.update=()=>{};
   const p=g.player,pvrm=p.vrmRig.vrm,h=pvrm.humanoid;
   const cv=document.querySelector('canvas');
   if(!(cv?.getContext('webgl2')||cv?.getContext('webgl')))
    throw Error('Real WebGL context required');
   if(p.characterId!=='kairo_venn'||!p.v72StudioPack||!p.v81PoseTransitions)
    throw Error('Real Kairo and normal animation controllers required');
   p.reset();p.pos.set(0,p.floor,0);p.vel.set(0,0,0);
   p.moveIntent.set(0,0,0);p.facing=0;p.blockHeld=false;
   p.t=12;p.attackSerial=0;p.punchT=0;p.stun=0;
   for(let i=0;i<90;i++)p.animate(1/60);
   const nodes=bones.map(n=>h.getNormalizedBoneNode(n));
   if(nodes.some(x=>!x))throw Error('Kairo 20-joint normalized rig incomplete');
   const owners=new Map(nodes.map((n,i)=>[n,bones[i]]));
   const parentOf=node=>{
    let cur=node.parent;
    while(cur){if(owners.has(cur))return owners.get(cur);cur=cur.parent;}
    return null;
   };
   const normScene=pvrm.scene;
   const quat=n=>n.quaternion.toArray();
   const vector=n=>n.position.toArray();
   // Not claimed to be the immutable bind pose. Positions and normalized
   // parent relationships are structural in this runtime-loaded skeleton.
   const parents=nodes.map(parentOf);
   const structure=nodes.map((n,i)=>({
    bone:bones[i],parent:parents[i],
    localPosition:vector(n).map(v=>+v.toFixed(8)),
    localScale:n.scale.toArray().map(v=>+v.toFixed(8))
   }));
   const rawMap=bones.map(b=>{
    const raw=typeof h.getRawBoneNode==='function'?h.getRawBoneNode(b):null;
    const norm=h.getNormalizedBoneNode(b);
    return {bone:b,rawBonePresent:!!raw,
     sameObject:!!raw&&raw===norm,
     rawLocalQuaternion:raw?quat(raw).map(v=>+v.toFixed(8)):null,
     rawParent:raw?.parent?.name||null,
     normalizedParent:norm?.parent?.name||null};
   });
   const fingersFound={};
   for(const side of ['left','right']){
    for(const segment of fingers){
     const label=side+segment,fn=h.getNormalizedBoneNode(label);
     if(fn)fingersFound[label]={rotation:quat(fn).map(v=>+v.toFixed(8)),
      parent:fn.parent?.name||null};
    }
   }
   const original=nodes.map(quat);
   normScene.updateMatrixWorld(true);
   const world=nodes.map(n=>({
    xyz:n.getWorldPosition(new T.Vector3()).toArray(),
    quat:n.getWorldQuaternion(new T.Quaternion()).toArray()
   }));
   // Precisely the representation required for the native normalized
   // loader, not Blender's source rest Euler axes or raw glTF rotations.
   const serialized=JSON.stringify({
    schema:'sky-clash.combat-rig-io.v1',fighter:'kairo_venn',
    sourceSpace:'vrm0-normalized-node-local-absolute',
    bones,parents,quaternions:original
   });
   const parsed=JSON.parse(serialized);
   const max={localAngle:0,worldAngle:0,worldPosition:0};
   try{
    for(let i=0;i<nodes.length;i++){
     nodes[i].quaternion.fromArray(parsed.quaternions[i]).normalize();
    }
    normScene.updateMatrixWorld(true);
    pvrm.update(0);
    normScene.updateMatrixWorld(true);
    for(let i=0;i<nodes.length;i++){
     const n=nodes[i],target=new T.Quaternion().fromArray(original[i]);
     max.localAngle=Math.max(max.localAngle,n.quaternion.angleTo(target));
     max.worldAngle=Math.max(max.worldAngle,
       n.getWorldQuaternion(new T.Quaternion())
        .angleTo(new T.Quaternion().fromArray(world[i].quat)));
     max.worldPosition=Math.max(max.worldPosition,
       n.getWorldPosition(new T.Vector3())
        .distanceTo(new T.Vector3().fromArray(world[i].xyz)));
    }
   }finally{
    for(let i=0;i<nodes.length;i++)
     nodes[i].quaternion.fromArray(original[i]);
    pvrm.update(0);normScene.updateMatrixWorld(true);
   }
   return {realVRM:true,webGL:true,bones,parents,structure,
    modelShasource:'test runner local model bytes',
    idleSample:{source:'90 real idle animation ticks, NOT a static approved clip',
     normalizedQuaternions:original,world},
    fingersFound,rawMap,maxRoundTripError:max,serializedSample:parsed,
    controllers:{v72:!!p.v72StudioPack,v81:!!p.v81PoseTransitions,
     v100:!!window.SkyClashV100Animator}};
  },{bones:BONES,fingers:FINGER_NAMES});
  assert(result.realVRM&&result.webGL);
  assert.deepEqual(result.bones,BONES);
  assert(result.controllers.v72&&result.controllers.v81&&result.controllers.v100);
  assert.equal(result.parents.length,20);
  assert(result.maxRoundTripError.localAngle<1e-5);
  assert(result.maxRoundTripError.worldAngle<1e-5);
  assert(result.maxRoundTripError.worldPosition<1e-5);
  const signature=hash({modelSha256:SHA,bones:BONES,
   hierarchy:result.structure,rawPresence:result.rawMap.map(x=>x.rawBonePresent)});
  // Pin the actual proven Kairo rig rather than accepting any silently
  // changed skeleton as a new "successful" calibration. These markers
  // deliberately do not represent a Blender bind-pose conversion.
  assert.equal(BASELINE.schema,'sky-clash.kairo-normalized-rig-fingerprint.v1');
  assert.equal(BASELINE.status,
   'VERIFIED_RUNTIME_HIERARCHY_ONLY_NOT_BIND_POSE_OR_BLENDER_CONVERSION');
  assert.equal(BASELINE.modelSha256,SHA,'Approved real model fingerprint drift');
  assert.equal(BASELINE.rigSignature,signature,
   'Real normalized hierarchy drift; explicitly reverify before authoring');
  assert.deepEqual(BASELINE.bones,BONES);
  assert.deepEqual(BASELINE.parents,result.parents);
  assert.equal(BASELINE.normalizedFingerJointsObserved,
   Object.keys(result.fingersFound).length);
  assert.equal(BASELINE.rawBoneNodesObserved,
   result.rawMap.filter(x=>x.rawBonePresent).length);
  const contract={modelSha256:SHA,rigSignature:signature,
   bones:BONES,parents:result.parents};
  const pack={...result.serializedSample,modelSha256:SHA,rigSignature:signature};
  validatePose(pack,contract);
  let failures=0;
  const reject=(modify)=>{
   const candidate=JSON.parse(JSON.stringify(pack));modify(candidate);
   assert.throws(()=>validatePose(candidate,contract));failures++;
  };
  reject(p=>{p.sourceSpace='blender-raw-gltf-node-local';});
  reject(p=>{p.sourceSpace='mixamo-world-bind-delta';});
  reject(p=>{p.modelSha256='0'.repeat(64);});
  reject(p=>{p.bones[8]='rightLowerArm';});
  reject(p=>{p.parents[8]='hips';});
  reject(p=>{p.rigSignature='0'.repeat(64);});
  reject(p=>{p.quaternions[8]=[2,0,0,0];});
  reject(p=>{p.quaternions[8]=[0,0,0];});
  assert.equal(failures,8);
  const bad=errors.filter(s=>!s.includes(
   'Sky Clash V63: leaving V62 fallback active Error: V62 native master could not be found'));
  assert.deepEqual(bad,[]);
  const output={schema:'kairo-combat-rig-io-proof.v1',status:'PASS-NATIVE-LOCAL-ONLY',
   modelSha256:SHA,rigSignature:signature,
   sourceFormat:'real normalized VRM0 SDK joint local absolute quaternion xyzw',
   nativeNormalizedHierarchy:result.structure,rawBoneBasis:result.rawMap,
   realIdlePoseSample:result.idleSample,
   fingerJoints:result.fingersFound,roundTripError:result.maxRoundTripError,
   incompatibleFormatRejections:failures,
   limitations:[
    'No Blender import or export was performed or validated.',
    'The captured live idle is a sample of a breathing animated pose; it does not replace the standing animation.',
    'Native normalized quaternion copies do not automatically convert Blender or raw glTF rotations.',
    'This test does not prove all 20 joints are correct artistic controls, IK footplant, finger grip or gameplay motion.'
   ]};
  fs.writeFileSync(path.join(OUT,'native-rig-io-proof.json'),JSON.stringify(output,null,2));
  console.log('PASS real-Kairo native rig IO proof '+JSON.stringify({
   signature:signature.slice(0,16),modelSha256:SHA,
   nativeJointCount:20,fingerCount:Object.keys(result.fingersFound).length,
   rawCount:result.rawMap.filter(x=>x.rawBonePresent).length,
   ...result.maxRoundTripError,rejectedInvalidSources:failures
  }));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
