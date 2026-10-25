/* V142 authored hover: periodic time-keyed whole body; previous V142 release.
 * Real-Kairo VRM mesh reviews happen separately in CI browser capture.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const clip=require('../js/v142-hover-keyframes.js');
const V100=require('../js/v100-pose-authority.js');
const {sample,duration,channels,keys}=clip;
assert.equal(duration,4.6);
assert(keys.length>=8&&channels.length>=25,'authored multi-pose full-body source');
assert.deepEqual(sample(0),sample(duration),'exact position loop closure');
assert.deepEqual(sample(-duration),sample(0),'negative phase wraps');
for(const c of channels)assert(Math.abs(sample(duration*3+.58)[c]-sample(.58)[c])<1e-9,
 'loop cycles preserve '+c);
for(const fps of [30,60,120]){
 let maxStep=0;
 for(let frame=0;frame<fps*duration;frame++){
  const a=sample(frame/fps),b=sample((frame+1)/fps);
  for(const prop of channels){
   assert(Number.isFinite(a[prop]),'nonfinite '+prop);
   maxStep=Math.max(maxStep,Math.abs(a[prop]-b[prop]));
  }
 }
 assert(maxStep<.035,'no keyframe or loop snap at '+fps+' FPS: '+maxStep);
}
for(let i=1;i<keys.length-1;i++){
 const t=keys[i].t,before=sample(t-1e-3),after=sample(t+1e-3);
 for(const c of channels)assert(Math.abs(before[c]-after[c])<.004,
  'no sharp keyframe discontinuity '+c+' @ '+t);
}
const pose=V100.v142FlightPose,old=V100.v141FlightPose;
assert.equal(typeof pose,'function');
const still=pose(0,0,0,.6),breath=pose(0,0,0,2.6);
const cruising=pose(.95,0,0,.6),rise=pose(.4,7,0,.6),
 drop=pose(.4,-7,0,.6),strafe=pose(.4,0,6,.6);
assert.equal(still.profile,'V142 authored skeletal hover clip');
assert(still.keys&&still.authoredClock>=0&&still.authoredClock<duration);
assert(Math.abs(still.keys.leftKnee-breath.keys.leftKnee)>.09,'leg animation uses authored positions');
assert(Math.abs(still.keys.rightElbowO-breath.keys.rightElbowO)>.01,'upper-body motion is authored');
assert(Math.abs(still.spineX-cruising.spineX)>.012,'travel torso pitch is preserved');
assert(Math.abs(rise.hipsX-drop.hipsX)>.012,'vertical travel modifier preserved');
assert(Math.abs(strafe.spineZ-still.spineZ)>.018,'turn/strafe bank still responds');
assert.notEqual(still.keys.leftKnee,still.keys.rightKnee,'leg asymmetry');
// Actual VRM side films revealed V142's two similarly bent thighs still
// drew a planted crouch. Demand one clearly lifted knee and a second
// extended hanging thigh throughout the ENTIRE authored loop.
for(let frame=0;frame<240;frame++){
 const k=sample(frame*duration/240);
 assert(k.leftKnee>.9&&k.rightKnee<.15,
  'authored pose must reject twin-knee standing silhouette');
 assert(k.leftShin>1.05&&k.rightShin<.34,
  'raised calf folds deeply behind; trailing leg hangs loose');
 assert(k.leftToe>=3.8&&k.rightToe>=3.7,
  'both shoes hang toe-down rather than forming floor contact');
}
const prior=old(0,0,0,.6);
assert.notEqual(still.profile,prior.profile,'V142 must not alias old profile');

function worldRig(yaw,mirror){
 const root=new THREE.Group(),scene=new THREE.Group(),hum={};
 root.rotation.y=yaw;root.add(scene);
 const hips=new THREE.Bone();hips.position.set(0,1.7,0);scene.add(hips);
 const chest=new THREE.Bone();chest.position.set(0,.42,0);hips.add(chest);
 hum.chest=chest;
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const thigh=new THREE.Bone(),shin=new THREE.Bone(),ankle=new THREE.Bone(),toe=new THREE.Bone();
  thigh.position.set(sign*.12,-.13,0);hips.add(thigh);
  shin.position.set(0,-.45,0);thigh.add(shin);
  ankle.position.set(0,-.45,.045);shin.add(ankle);
  toe.position.set(0,-.023,.17);ankle.add(toe);
  if(side==='right'&&mirror)shin.rotation.y=Math.PI;
  for(const [n,b] of [['UpperLeg',thigh],['LowerLeg',shin],['Foot',ankle],['Toes',toe]])hum[side+n]=b;
  const shoulder=new THREE.Bone(),upper=new THREE.Bone(),
   lower=new THREE.Bone(),hand=new THREE.Bone();
  shoulder.position.set(sign*.16,.08,0);chest.add(shoulder);
  upper.position.set(sign*.12,0,0);shoulder.add(upper);
  lower.position.set(sign*.25,-.038,0);upper.add(lower);
  hand.position.set(sign*.23,-.028,0);lower.add(hand);
  if(side==='right'&&mirror){upper.rotation.y=Math.PI;lower.rotation.y=Math.PI;}
  for(const [n,b] of [['Shoulder',shoulder],['UpperArm',upper],['LowerArm',lower],['Hand',hand]])hum[side+n]=b;
 }
 scene.updateMatrixWorld(true);
 return {root,rig:{vrm:{scene,humanoid:{getNormalizedBoneNode:n=>hum[n]||null}}}};
}
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2])
 for(const mirrored of [false,true]){
  const {root,rig}=worldRig(yaw,mirrored),forward=new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion);
  const status={},p=pose(0,0,0,.9);
  const legs=V100.v128CorrectFlightLegs(THREE,rig,forward,p,1,null,1/60,status);
  assert(legs?.left&&legs?.right,'keyed world-knee solve at '+yaw);
  for(const side of ['left','right']){
   assert(legs[side].kneeForwardCm>0,'forward-facing knees '+side+' '+JSON.stringify(legs[side]));
   assert(legs[side].shinBackCm>4,'trailing calves '+side);
   assert(legs[side].toeDropCm>9,'unplanted dangling shoes '+side);
  }
  const arms=V100.v129CorrectFlightGuard(THREE,rig,forward,p,1,null,1/60,status,'authored-hover');
  assert(status.flightAuthoredClip==='V142 4.6s keyed hover');
  for(const side of ['left','right']){
   assert(arms[side].handAboveElbowCm<0,'relaxed lowered hands '+side);
   assert(arms[side].elbowOutCm>2,'visible arm clearance '+side);
  }
 }

const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
const authority=fs.readFileSync('js/v100-pose-authority.js','utf8');
assert(boot.includes("'v142','v143','v144','v145','v146'].includes(flags.get('flightPreview'))"),'V142 rollback retained');
assert(boot.includes("flags.set('jumpPreview','v125')"),'approved jump preserved');
assert(boot.includes("await script('js/v142-hover-keyframes.js?v=1420')"),'load authored clip before V100');
assert(authority.includes("flightVersion==='v142'"),'isolated playable preview');
assert(authority.includes("v142?'authored-hover'"),'world-based authored IK');
console.log('PASS V142 authored multi-bone cyclic hover: 30/60/120fps continuity, world knees/arms all yaw/mirror, V142 rollback and approved V125 jump preserved');
