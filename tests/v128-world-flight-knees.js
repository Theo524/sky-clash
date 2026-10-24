/* V128: world-space knee direction, actual paired geometry and no backwards shins. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const pose=V100.v128FlightPose;
const solve=V100.v128CorrectFlightLegs;
assert.equal(typeof pose,'function');assert.equal(typeof solve,'function');
const p=pose(0,0,0,0),older=V100.v127SuspendedFlightPose(0,0,0,0);
assert(p.profile.includes('world-validated'));
assert.equal(p.leftThighX,0);
assert.equal(p.rightThighX,0);
assert.equal(p.leftKneeX,0);
assert.equal(p.rightKneeX,0);
for(const part of ['hipsX','hipsZ','spineX','chestX','neckX',
 'leftUpperArmX','rightUpperArmX','leftUpperArmZ','rightUpperArmZ']){
 assert.equal(p[part],older[part],
  'do not redesign the approved hover body, arm or gentle bob: '+part);
}
function rig(yaw,mirror){
 const scene=new THREE.Group(),hum={},root=new THREE.Group();
 root.rotation.y=yaw;root.add(scene);
 const hips=new THREE.Bone();hips.name='hips';hips.position.y=1.7;scene.add(hips);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const upper=new THREE.Bone(),shin=new THREE.Bone(),
    ankle=new THREE.Bone(),toe=new THREE.Bone();
  upper.name=side+'UpperLeg';
  upper.position.set(sign*.12,-.13,0);hips.add(upper);
  shin.name=side+'LowerLeg';
  shin.position.set(0,-.45,0);upper.add(shin);
  ankle.name=side+'Foot';ankle.position.set(0,-.45,.045);shin.add(ankle);
  toe.name=side+'Toes';toe.position.set(0,-.023,.17);ankle.add(toe);
  if(side==='right'&&mirror) {
   // Intentionally reverse the normalized shin X basis. Both legs
   // still have down-pointing rest segments, but a +X local knee
   // curl will rotate toward the wrong horizontal side on this rig.
   shin.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
  }
  for(const b of [upper,shin,ankle,toe])hum[b.name]=b;
 }
 scene.updateMatrixWorld(true);
 return {scene,rig:{vrm:{scene,humanoid:{getNormalizedBoneNode:n=>hum[n]||null}}},
  hum,root};
}
function measure(r,f){
 const forward=f.clone().normalize();
 const out={};
 for(const side of ['left','right']){
  const get=n=>r.hum[side+n].getWorldPosition(new THREE.Vector3());
  const h=get('UpperLeg'),k=get('LowerLeg'),a=get('Foot'),t=get('Toes');
  const hToA=a.clone().sub(h),tt=Math.max(0,Math.min(1,k.clone().sub(h).dot(hToA)/
   Math.max(1e-8,hToA.lengthSq())));
  const clearance=k.clone().sub(h.addScaledVector(hToA,tt)).dot(forward);
  out[side]={clearance,hipToKnee:k.clone().sub(get('UpperLeg')).dot(forward),
   toeDrop:a.y-t.y,knee:k,ankle:a};
 }
 return out;
}
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 for(const mirror of [false,true]){
  const {rig:r,hum,root}=rig(yaw,mirror);
  const forward=new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion);
  const baseline=measure({hum},forward);
  const status={};
  const result=solve(THREE,r,forward,p,1,null,1/60,status);
  const view=measure({hum},forward);
  for(const side of ['left','right']){
   assert(result[side],side+' must have a world solver output');
   assert(result[side].kneeForwardCm>2,
    side+' backward knee at yaw '+yaw+' mirror '+mirror+' '+JSON.stringify(result));
   assert(result[side].shinBackCm>1,
    side+' ankle must BEHIND knee in gameplay world forward: '+JSON.stringify(result));
   assert(view[side].clearance>.02,
    side+' knee still bends toward rear, yaw '+yaw+' mirror '+mirror);
   assert(view[side].hipToKnee>.08,
    side+' thigh must visibly lift toward GAMEPLAY forward');
   assert(view[side].toeDrop>.01,
    side+' shoe must hang naturally downward instead of flattening');
  }
  assert(view.left.hipToKnee>view.right.hipToKnee+.06,
   'raised left knee should remain higher/forward vs loose right knee');
  assert(status.flightKneeFacing==='FORWARD');
  assert(view.left.knee.distanceTo(view.right.knee)>.12);
  // Actual mirrored right local shin bend reverses local-X direction.
  // World-space corrector must produce the same safe clearance anyway.
  if(mirror)assert(baseline.right.clearance!==undefined);
 }
}
for(const fps of [30,60,120]){
 const {rig:r,hum,root}=rig(.4,true);
 const forward=new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion);
 let prev={};let maxAngle=0;
 for(let frame=0;frame<fps*1.2;frame++){
  // Simulate V100 first-flight transition and final-owner interpolation:
  // reset SOURCE POSE before posing so solver doesn't accumulate degrees.
  for(const side of ['left','right']){
   for(const part of ['UpperLeg','LowerLeg','Foot']){
    const joint=hum[side+part];
    const q=joint.userData.bindQ;
    if(q)joint.quaternion.copy(q);
    else joint.userData.bindQ=joint.quaternion.clone();
   }
  }
  const quats=Array.from({length:20},()=>new THREE.Quaternion());
  for(const [side,start] of [['left',14],['right',17]]){
   for(const [j,part]of ['UpperLeg','LowerLeg','Foot'].entries())
    quats[start+j]=prev[side+part]||hum[side+part].quaternion.clone();
  }
  const result=solve(THREE,r,forward,p,
   Math.min(1,frame/(fps*.26)),quats,1/fps,{});
  for(const [side,start] of [['left',14],['right',17]]){
   for(const [j,part]of ['UpperLeg','LowerLeg','Foot'].entries()){
    const n=hum[side+part],qOld=quats[start+j];
    const angle=qOld.angleTo(n.quaternion);
    assert(angle<=5/fps+.0001,'flight angular clamp violated '+side+part+' '+fps);
    maxAngle=Math.max(maxAngle,angle);
    prev[side+part]=n.quaternion.clone();
   }
  }
  if(frame>0)assert(result,
   "positive flight age must produce calibrated knee diagnostics");
 }
 assert(maxAngle>.005,'V128 rig never reaches its corrected knee pose');
}
const owner=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(owner.includes("flightVersion==='v128'"));
assert(owner.includes('v128CorrectFlightLegs(THREE,rig,forward,flightControl,'));
assert(owner.includes("next==='flight'"));
assert(boot.includes("['v114','v126','v127','v128']"));
assert(boot.includes("e.src+='&worldKneeFlight=128'"));
console.log('PASS V128: BOTH knees forward under mirrored VRM local X, all four yaw angles, feet hanging and bounded 30/60/120fps flight transitions');
