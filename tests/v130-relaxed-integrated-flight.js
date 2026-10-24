/* V130 relaxed anime levitation: lower loose arms, true bent suspended legs, no boxer guard. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const old=V100.v128FlightPose,pose=V100.v130FlightPose,aim=V100.v129CorrectFlightGuard;
assert.equal(typeof pose,'function');assert.equal(typeof aim,'function');
for(const t of [0,.1,.5,1.7]){
 const base=old(.5,0,0,t),next=pose(.5,0,0,t);
 for(const n of ['hipsX','hipsZ','spineX','chestX','chestZ','neckX',
  'leftThighX','rightThighX','leftKneeX','rightKneeX',
  'leftAnkleX','rightAnkleX']){
  assert.equal(next[n],base[n],'do not touch V128 legs/hover: '+n);
 }
}
function setup(yaw,mirror){
 const root=new THREE.Group(),scene=new THREE.Group(),hum={};
 root.add(scene);root.rotation.y=yaw;
 const hips=new THREE.Bone();hips.position.set(0,1.25,0);scene.add(hips);
 const spine=new THREE.Bone();spine.position.y=.2;hips.add(spine);
 const chest=new THREE.Bone();chest.position.y=.2;spine.add(chest);hum.chest=chest;
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const sh=new THREE.Bone(),upper=new THREE.Bone(),
   lower=new THREE.Bone(),hand=new THREE.Bone();
  sh.position.set(sign*.16,.08,0);chest.add(sh);
  upper.position.set(sign*.12,0,0);sh.add(upper);
  lower.position.set(sign*.25,-.038,0);upper.add(lower);
  hand.position.set(sign*.23,-.028,0);lower.add(hand);
  if(side==='right'&&mirror){
   // The same world body, but with a reversed normalized local arm
   // basis: the user's REAL Kairo has nontrivial mirrored joint axes.
   upper.rotation.y=Math.PI;
   lower.rotation.y=Math.PI;
  }
  for(const [name,j]of [['Shoulder',sh],['UpperArm',upper],
   ['LowerArm',lower],['Hand',hand]])hum[side+name]=j;
 }
 scene.updateMatrixWorld(true);
 return {rig:{vrm:{scene,humanoid:{getNormalizedBoneNode:n=>hum[n]||null}}},
  hum,root};
}
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 for(const mirror of [false,true]){
  const {rig,root}=setup(yaw,mirror),status={};
  const forward=new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion);
  const result=aim(THREE,rig,forward,pose(0,0,0,0),1,null,1/60,status,'relaxed');
  assert(result&&status.flightRelaxedSilhouette==='RELAXED',
   'real bone geometry must yield two relaxed floating hands, yaw='+yaw+' mirror='+mirror+
   ' '+JSON.stringify(result));
  for(const side of ['left','right']){
   const a=result[side];
   assert(a.elbowAheadCm>-5,'elbow cannot be a backward walking swing');
   assert(a.handAheadCm>0,'hand must rest gently ahead, not trail behind');
   assert(a.handAboveElbowCm<0,'hover hands must hang relaxed, not boxer-up');
   assert(a.elbowOutCm>3,'elbows must leave relaxed space beside the ribs');
   assert(a.handBelowChestCm>15&&a.handBelowChestCm<75,
    'hands should hang at natural waist/hip level');
  }
  // Every tested angle and mirrored rig must avoid the V129 boxing shape.
  const later=aim(THREE,rig,forward,pose(.3,0,0,2),1,null,1/60,{},'relaxed');
  assert(Math.abs(later.left.elbowAheadCm-result.left.elbowAheadCm)>.05||
    Math.abs(later.right.handAheadCm-result.right.handAheadCm)>.05,
    'soft idle arm drift must be visible over time');
 }
}
for(const fps of [30,60,120]){
 const {rig,root,hum}=setup(Math.PI*.33,true);
 const forward=new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion);
 const dt=1/fps;
 let prior={},maxDelta=0;
 const bones=['leftUpperArm','leftLowerArm','rightUpperArm','rightLowerArm'];
 for(let frame=0;frame<fps*1.5;frame++){
  // Each frame begins from the same authored source pose; the final
  // world-geometry solver and previous-frame limiter own visibility.
  for(const b of bones){
   if(!hum[b].userData.bind)hum[b].userData.bind=hum[b].quaternion.clone();
   hum[b].quaternion.copy(hum[b].userData.bind);
  }
  const prev=Array.from({length:20},()=>new THREE.Quaternion());
  for(const [b,i] of [['leftUpperArm',7],['leftLowerArm',8],
    ['rightUpperArm',11],['rightLowerArm',12]]){
   prev[i]=prior[b]||hum[b].quaternion.clone();
  }
  const data=aim(THREE,rig,forward,pose(0,0,0,frame*dt),
   Math.min(1,frame*dt/.32),prev,dt,{},'relaxed');
  if(frame>0)assert(data);
  for(const [b,i]of [['leftUpperArm',7],['leftLowerArm',8],
    ['rightUpperArm',11],['rightLowerArm',12]]){
   const delta=prev[i].angleTo(hum[b].quaternion);
   assert(delta<=5*dt+.0001,b+' jumps at '+fps+' fps: '+delta);
   maxDelta=Math.max(maxDelta,delta);
   prior[b]=hum[b].quaternion.clone();
  }
 }
 assert(maxDelta>.002);
}
const file=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(file.includes("flightVersion==='v130'"));
assert(file.includes('v129CorrectFlightGuard(THREE,rig,forward,flightControl,'));
assert(file.includes('v128CorrectFlightLegs(THREE,rig,forward,flightControl,'));
assert(boot.includes("['v114','v126','v127','v128','v129','v130']"));
assert(boot.includes("e.src+='&relaxedFlight=130'"));
console.log('PASS V130: relaxed low hands and floating sway at four facing angles and mirrored bones, V128 body continuity, 30/60/120fps joint caps');
