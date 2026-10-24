/* V116 world-space standing crouch, on real parented Three.js bones.
 * Opt-in only. Never take over grounded gait, landing, Boost or flight.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const fwd=scene=>{
 const v=new THREE.Vector3(0,0,1).applyQuaternion(
  scene.getWorldQuaternion(new THREE.Quaternion()));
 v.y=0;return v.normalize();
};
function skeleton(yaw=0,mirror='none'){
 const scene=new THREE.Group();scene.rotation.y=yaw;scene.position.set(2,0,-3);
 const hips=new THREE.Bone();hips.position.y=1.14;scene.add(hips);
 const nodes={};
 for(const side of ['left','right']){
  const thigh=new THREE.Bone(),knee=new THREE.Bone(),foot=new THREE.Bone();
  thigh.position.set(side==='left'?.115:-.115,-.12,0);
  knee.position.set(0,-.425,0);foot.position.set(0,-.425,.065);
  hips.add(thigh);thigh.add(knee);knee.add(foot);
  if(side===mirror)thigh.quaternion.setFromAxisAngle(
   new THREE.Vector3(0,1,0),Math.PI);
  nodes[side]={thigh,knee,foot};
 }
 return {vrm:{scene,humanoid:{getNormalizedBoneNode(name){
  const side=name.startsWith('left')?'left':'right';
  return ({UpperLeg:nodes[side].thigh,LowerLeg:nodes[side].knee,
   Foot:nodes[side].foot})[name.slice(side.length)]||null;
 }}},nodes};
}
const world=n=>n.getWorldPosition(new THREE.Vector3());
const projected=(h,k,a,f)=>{
 const line=a.clone().sub(h);
 const t=Math.max(0,Math.min(1,k.clone().sub(h).dot(line)/
   Math.max(1e-8,line.lengthSq())));
 return k.clone().sub(h.addScaledVector(line,t)).dot(f);
};
let checks=0;
for(const yaw of [0,Math.PI/3,Math.PI,Math.PI*1.65]){
 for(const mirror of ['none','left','right']){
  for(const [fps,frames] of [[30,7],[60,13],[120,26]]){
   const {vrm,nodes}=skeleton(yaw,mirror),rig={vrm},
    front=fwd(vrm.scene),status={},anchors=[];
   vrm.scene.updateMatrixWorld(true);
   for(const side of ['left','right']){
    const foot=nodes[side].foot;
    anchors.push({side,point:world(foot),
     rotation:foot.getWorldQuaternion(new THREE.Quaternion())});
   }
   let last=[0,0],maxAngular=0;
   for(let frame=0;frame<=frames;frame++){
    const t=Math.min(.215*.75,frame/fps);
    const p=V100.prepPose(t,0,'loaded');
    // Equivalent to prepBase restoration in the actual final owner:
    for(const side of ['left','right']){
     const {thigh,knee,foot}=nodes[side];
     thigh.quaternion.identity();knee.quaternion.identity();
     foot.quaternion.identity();
     if(side===mirror)thigh.quaternion.setFromAxisAngle(
      new THREE.Vector3(0,1,0),Math.PI);
    }
    const frontOffset=V100.worldStandingPrepLegs(THREE,rig,
     Math.abs(p.thighX),Math.abs(p.kneeX),anchors,status);
    vrm.scene.updateMatrixWorld(true);
    assert(Number.isFinite(frontOffset));
    for(const [i,side] of ['left','right'].entries()){
     const {thigh,knee,foot}=nodes[side];
     const signed=projected(world(thigh),world(knee),world(foot),front);
     assert(signed>=-.015,'knee cannot bend backward: '+side+'/'+mirror);
     const ankleRot=foot.getWorldQuaternion(new THREE.Quaternion());
     assert(ankleRot.angleTo(anchors[i].rotation)<1e-5,
      'shin rotation must not pitch visible shoe: '+side+'/'+mirror);
     const moved=knee.quaternion.angleTo(new THREE.Quaternion());
     if(frame>0)maxAngular=Math.max(maxAngular,Math.abs(moved-last[i]));
     last[i]=moved;
     if(frame===frames)assert(signed>.085,
      'loaded knee must protrude forward of hip-to-ankle line: '+side+'/'+mirror);
    }
    if(frame===frames)assert(frontOffset>.085,
     'both mirrored world-space knees must protrude forward');
   }
   assert(maxAngular<.46,'30/60/120fps shin may not jump suddenly');
   assert(status.prepWorldKneeCm>8,'report measured whole-leg forward flexion');
   checks++;
  }
 }
}
for(const speed of [0,4.8,6.2]){
 const old=V100.prepPose(.135,speed,'push');
 const loaded=V100.prepPose(.135,speed,'loaded');
 assert(loaded.hipsY<old.hipsY-.0001,'V116 must lower pelvis more');
 assert(Math.abs(loaded.thighX)>Math.abs(old.thighX),'stronger leg preload');
 assert(loaded.kneeX>old.kneeX,'stronger shin flexion');
 assert(loaded.spineX>old.spineX,'stronger torso lean');
 assert.equal(loaded.duration,old.duration,'physics jump timing remains identical');
}
const code=read('js/v100-pose-authority.js'),boot=read('js/v66-game-boot.js');
assert(code.includes("profile==='push'&&kneeProfile==='anatomic'"));
assert(code.includes('st.prepSpeed<1.3'),
 'moving jump must remain on the existing approved V115 calibration');
assert(code.includes('worldStandingPrepLegs(THREE,this.vrmRig'));
assert(code.includes("['guided','forward','anatomic'].includes("),
 'V116 must hand off last visible prep shin pose at takeoff');
assert(boot.includes("e.src+='&anatomic=116'"),
 'preview must use independent cache key on phones');
assert(boot.includes('anatomicKnees'));
assert(!code.includes('f.v116')&&!code.includes('fighter.v116'),
 'no second Kairo animation controller');
console.log('PASS V116: '+checks+' world-space normal/mirrored/facing/FPS loads, forward whole-leg geometry, neutral shoes, grounded-only flag, unchanged physical jump timing');
