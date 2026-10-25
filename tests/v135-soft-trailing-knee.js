/* V135: only the previously near-straight trailing right knee is relaxed. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const original=V100.v134FlightPose,refined=V100.v135FlightPose;
const solve=V100.v128CorrectFlightLegs;
for(const t of [0,.25,.9,2.4]){
 const a=original(.42,1.8,2.5,t),b=refined(.42,1.8,2.5,t);
 for(const [k,v] of Object.entries(a)){
  if(k!=='profile')assert.deepEqual(b[k],v,'V135 must preserve V134 torso/arms/other control: '+k);
 }
 assert.equal(b.profile,'V135 soft trailing knee');
}
function makeRig(yaw,mirrored){
 const root=new THREE.Group(),scene=new THREE.Group(),hum={};
 root.rotation.y=yaw;root.add(scene);
 const hips=new THREE.Bone();hips.position.y=1.7;scene.add(hips);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const thigh=new THREE.Bone(),shin=new THREE.Bone(),
   foot=new THREE.Bone(),toe=new THREE.Bone();
  thigh.position.set(sign*.12,-.13,0);hips.add(thigh);
  shin.position.set(0,-.45,0);thigh.add(shin);
  foot.position.set(0,-.45,.045);shin.add(foot);
  toe.position.set(0,-.023,.17);foot.add(toe);
  if(side==='right'&&mirrored)shin.quaternion.setFromAxisAngle(
   new THREE.Vector3(0,1,0),Math.PI);
  for(const [part,node] of [['UpperLeg',thigh],['LowerLeg',shin],
    ['Foot',foot],['Toes',toe]])hum[side+part]=node;
 }
 return {rig:{vrm:{scene,humanoid:{getNormalizedBoneNode:k=>hum[k]||null}}},
  root,hum};
}
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 for(const mirrored of [false,true]){
  function examine(profile,t){
   const {rig,root}=makeRig(yaw,mirrored);
   const forward=new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion);
   const metrics=solve(THREE,rig,forward,profile(0,0,0,t),1,null,1/60,{});
   assert(metrics.left&&metrics.right,'Must measure both real-world knee geometries');
   assert(metrics.left.kneeForwardCm>0&&metrics.right.kneeForwardCm>0);
   return metrics;
  }
  for(const t of [0,1.35,2.3]){
   const before=examine(original,t),after=examine(refined,t);
   assert(after.right.kneeBendDeg>before.right.kneeBendDeg+6,
    'Trailing knee still too straight: '+JSON.stringify({before,after,yaw,mirrored,t}));
   assert(after.right.kneeBendDeg>25&&after.right.kneeBendDeg<60,
    'Natural knee fold outside safe range: '+JSON.stringify(after.right));
   assert(Math.abs(after.left.kneeBendDeg-before.left.kneeBendDeg)<.6,
    'Approved V134 lead leg changed unexpectedly');
   assert(after.left.kneeHipForwardCm>after.right.kneeHipForwardCm+5,
    'Trailing leg must remain distinct rather than mirrored cycling');
  }
 }
}
const source=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(source.includes("flightVersion==='v135'"));
// V135 remains a deliberately selectable historical A/B comparison;
 // the plain public link must now open the V145 authored release.
assert(boot.includes("flags.set('flightPreview','v145')"));
assert(boot.includes("e.src+='&softKneeFlight=135'"));
console.log('PASS V135: all yaw/mirror cases visibly soften only the trailing knee while V134 arms, torso and lead leg remain unchanged');
