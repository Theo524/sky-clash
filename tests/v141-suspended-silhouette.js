/* V141 relaxed anime levitation: lower loose arms, true bent suspended legs, no boxer guard. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const old=V100.v128FlightPose,pose=V100.v141FlightPose,aim=V100.v129CorrectFlightGuard;
assert.equal(typeof pose,'function');assert.equal(typeof aim,'function');
for(const t of [0,.1,.5,1.7]){
 const base=old(.5,0,0,t),next=pose(.5,0,0,t);
 for(const n of ['leftThighX','rightThighX','leftKneeX','rightKneeX',
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
  const result=aim(THREE,rig,forward,pose(0,0,0,0),1,null,1/60,status,'suspended-hover');
  assert(result&&status.flightSuspendedSilhouette==='RELAXED',
   'real bone geometry must yield two relaxed floating hands, yaw='+yaw+' mirror='+mirror+
   ' '+JSON.stringify(result));
  for(const side of ['left','right']){
   const a=result[side];
   assert(a.elbowOutCm>1&&a.elbowOutCm<15,
    'no airplane-wing elbows; full-body hovering arms stay near ribs');
   assert(a.handAheadCm>-6&&a.handAheadCm<16&&a.handOutCm<20,
    'hands cannot project sideways into a wing pose');
   assert(a.handAboveElbowCm< -15&&a.handAboveElbowCm>-38,
    'hands stay below elbows, not in a rigid boxing guard');
   assert(a.elbowOutCm>1,'elbows should remain softly outside the ribs');
   assert(a.handBelowChestCm>15&&a.handBelowChestCm<65,
    'hands remain loosely around waist/chest, not locked at hips');
  }
  // Every tested angle and mirrored rig must avoid the V129 boxing shape.
  const later=aim(THREE,rig,forward,pose(.3,0,0,2),1,null,1/60,{},'suspended-hover');
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
   Math.min(1,frame*dt/.32),prev,dt,{},'suspended-hover');
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

// V141 must look different across idle hover, cruise, strafe, and vertical
// movement. Static poses which simply pass a hand-height rule are rejected.
const h=pose(0,0,0,.3),later=pose(0,0,0,2.8);
const cruise=pose(.95,0,0,.3),str=pose(.45,0,6,.3),
 ascend=pose(.45,7,0,.3),descend=pose(.45,-7,0,.3);
assert(Math.abs(h.hipsX-later.hipsX)>.003&&
 Math.abs(h.chestX-later.chestX)>.003,
 'Slow floating breath should originate at pelvis and move through chest');
assert(Math.abs(h.spineX-cruise.spineX)>.012,
 'Cruising must shift torso inclination noticeably');
assert(Math.abs(str.spineZ-h.spineZ)>.018,
 'Strafing must shift lateral body balance');
assert(Math.abs(ascend.hipsX-descend.hipsX)>.015,
 'Rising and descending must differ in body attitude');


function torsoRig(yaw){
 const root=new THREE.Group(),scene=new THREE.Group(),hum={};
 root.rotation.y=yaw;root.add(scene);
 const hips=new THREE.Bone();hips.position.set(0,1.3,0);scene.add(hips);
 const spine=new THREE.Bone();spine.position.y=.18;hips.add(spine);
 const chest=new THREE.Bone();chest.position.y=.24;spine.add(chest);
 const neck=new THREE.Bone();neck.position.y=.20;chest.add(neck);
 const head=new THREE.Bone();head.position.y=.15;neck.add(head);
 spine.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),.36);
 for(const [n,node]of [['hips',hips],['spine',spine],['chest',chest],
 ['neck',neck],['head',head]])hum[n]=node;
 return {root,hum,rig:{vrm:{scene,
  humanoid:{getNormalizedBoneNode:k=>hum[k]||null}}}};
}
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 const {root,rig}=torsoRig(yaw),status={};
 const forward=new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion);
 const pelvis=V100.v137CorrectPelvisBalance(THREE,rig,forward,pose(.4,0,0,.6),
  1,null,1/60,status);
 assert(pelvis.initialTiltDeg>8,
  'Actual pelvis-to-neck axis must show source hunch');
 assert(pelvis.residualTiltDeg<4,
  'Correct whole-body pelvic ancestry, not only upper spine: '+JSON.stringify(pelvis));
 const a=V100.v136CorrectSuspendedTorso(THREE,rig,forward,pose(.4,0,0,.6),
  1,null,1/60,status);
 // After pelvis correction the upper spine is already close to upright.
 assert(a.residualTiltDeg<4,'Correct actual 3D spine posture: '+JSON.stringify(a));
}
function legRig(yaw,mirrored){
 const root=new THREE.Group(),scene=new THREE.Group(),hum={};
 root.rotation.y=yaw;root.add(scene);
 const hips=new THREE.Bone();hips.position.y=1.7;scene.add(hips);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const up=new THREE.Bone(),shin=new THREE.Bone(),
   ankle=new THREE.Bone(),toe=new THREE.Bone();
  up.position.set(sign*.12,-.13,0);hips.add(up);
  shin.position.set(0,-.45,0);up.add(shin);
  ankle.position.set(0,-.45,.045);shin.add(ankle);
  toe.position.set(0,-.023,.17);ankle.add(toe);
  if(side==='right'&&mirrored)shin.quaternion.setFromAxisAngle(
   new THREE.Vector3(0,1,0),Math.PI);
  hum[side+'UpperLeg']=up;hum[side+'LowerLeg']=shin;
  hum[side+'Foot']=ankle;hum[side+'Toes']=toe;
 }
 return {root,rig:{vrm:{scene,humanoid:{getNormalizedBoneNode:k=>hum[k]||null}}}};
}
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2])
 for(const mirrored of [false,true]){
  const {root,rig}=legRig(yaw,mirrored);
  const fwd=new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion);
  const result=V100.v128CorrectFlightLegs(THREE,rig,fwd,pose(0,0,0,0),
   1,null,1/60,{});
  for(const side of ['left','right']){
   const g=result[side];
   assert(g.kneeForwardCm>0&&g.shinBackCm>4,
    'Knee must bend forwards but trailing shoe sweep BACK under the hip: '+
    JSON.stringify({yaw,mirrored,side,g}));
   assert(g.toeDropCm>10,
    'Toe-down suspended foot, not flat ground plant: '+JSON.stringify(g));
   assert(g.kneeBendDeg>19&&g.kneeBendDeg<53,
    'Calm hovering knee flex: '+JSON.stringify(g));
  }
 }

const file=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(file.includes("flightVersion==='v141'"));
assert(file.includes('v129CorrectFlightGuard(THREE,rig,forward,flightControl,'));
assert(file.includes('v128CorrectFlightLegs(THREE,rig,forward,flightControl,'));
assert(boot.includes("'v140','v141','v142','v143','v144','v145','v146','v147','v148'].includes(flags.get('flightPreview'))"));
assert(boot.includes("e.src+='&suspendedFlight=141'"));
console.log('PASS V141: pelvis-balanced organic arms and leg drift at four facing angles and mirrored bones, VRM upright torso and trailing shoes, 30/60/120fps joint caps');
