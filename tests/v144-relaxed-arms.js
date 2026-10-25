/* V144 natural flying arms: maintain the user's approved V143
 * pose/body while bending actual upper-arm/forearm segments naturally.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const arms=require('../js/v144-relaxed-arms.js');
const V100=require('../js/v100-pose-authority.js');
const {sample,duration,channels,keys}=arms;
assert.equal(duration,4.6);
assert(keys.length>=8&&channels.length===12);
for(const t of [0,.58,1.17,1.76,2.4,2.99,3.61,4.12,4.599])
 for(const side of ['left','right']){
  const p=sample(t);
  const upper=new THREE.Vector3(p[side+'ElbowF'],p[side+'ElbowO'],p[side+'ElbowY']).normalize();
  const lower=new THREE.Vector3(p[side+'HandF'],p[side+'HandO'],p[side+'HandY']).normalize();
  const bend=Math.acos(THREE.MathUtils.clamp(upper.dot(lower),-1,1))*180/Math.PI;
  assert(bend>17&&bend<65,'relaxed, flexed elbow not a dangling straight line or boxing guard: '+side+' '+bend);
  assert(lower.z<-.5,'hands hang below elbow, not forward punch');
  assert(lower.x>.30&&lower.x<.70,'hands float a little ahead of elbows, not puppet straight');
  assert(upper.z<-.7&&upper.y>0,'upper arms stay downward and outside ribs');
 }
const starts=sample(0),ends=sample(duration);
assert.deepEqual(starts,ends,'periodic keyed arm loop closes');
const l=sample(1.17),r=sample(2.99);
assert(l.leftElbowF>l.rightElbowF+.15,'left arm moves first');
assert(r.rightElbowF>r.leftElbowF+.15,'right arm follows later');
assert(l.leftHandF>r.leftHandF+.15,'left wrist follows left elbow');
assert(r.rightHandF>l.rightHandF+.20,'right wrist delayed independently');
for(const fps of [30,60,120]){
 let maxDelta=0;
 for(let i=0;i<Math.round(fps*duration);i++){
  const from=sample(i/fps),to=sample((i+1)/fps);
  for(const key of channels){
   assert(Number.isFinite(from[key])&&Number.isFinite(to[key]));
   maxDelta=Math.max(maxDelta,Math.abs(to[key]-from[key]));
  }
 }
 assert(maxDelta<.04,'no visible snapping at '+fps+'fps: '+maxDelta);
}
const v143=V100.v143FlightPose,v144=V100.v144FlightPose;
assert.equal(typeof v144,'function');
for(const t of [0,.58,1.17,1.76,2.4,2.99,3.61,4.12])
 for(const flow of [0,.75]){
  const a=v143(flow,0,0,t),b=v144(flow,0,0,t);
  assert.equal(b.profile,'V144 relaxed floating arms');
  for(const key of ['hipsX','spineX','chestX','neckX','hipsZ','spineZ','chestZ','pelvisGoalF','pelvisGoalS','chestGoalF','chestGoalS'])
   assert.equal(a[key],b[key],'V143 approved torso unchanged: '+key);
  for(const key of ['leftKnee','rightKnee','leftShin','rightShin','leftToe','rightToe'])
   assert.equal(a.keys[key],b.keys[key],'V143 approved flying legs unchanged: '+key);
 }
function rig(yaw,mirror){
 const root=new THREE.Group(),scene=new THREE.Group(),hum={};
 root.rotation.y=yaw;root.add(scene);
 const chest=new THREE.Bone();chest.position.y=1.75;scene.add(chest);
 hum.chest=chest;
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const shoulder=new THREE.Bone(),upper=new THREE.Bone(),
   lower=new THREE.Bone(),hand=new THREE.Bone();
  shoulder.position.set(sign*.16,.08,0);chest.add(shoulder);
  upper.position.set(sign*.12,0,0);shoulder.add(upper);
  lower.position.set(sign*.25,-.038,0);upper.add(lower);
  hand.position.set(sign*.23,-.028,0);lower.add(hand);
  if(side==='right'&&mirror){upper.rotation.y=Math.PI;lower.rotation.y=Math.PI;}
  for(const [name,node] of [['Shoulder',shoulder],['UpperArm',upper],['LowerArm',lower],['Hand',hand]])
   hum[side+name]=node;
 }
 scene.updateMatrixWorld(true);
 return {rig:{vrm:{scene,humanoid:{getNormalizedBoneNode:n=>hum[n]||null}}},root};
}
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2])
 for(const mirrored of [false,true]){
  const {rig:character,root}=rig(yaw,mirrored);
  const f=new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion);
  const status={},pose=v144(0,0,0,1.17);
  const result=V100.v129CorrectFlightGuard(THREE,character,f,pose,1,null,1/60,status,'natural-arms');
  assert(status.flightAuthoredClip==='V144 natural floating forearms');
  for(const side of ['left','right']){
   const hand=result[side];
   assert(hand.handAboveElbowCm< -12,'natural hanging wrist below elbow '+side);
   assert(hand.handAheadCm>5&&hand.handAheadCm<22,'forearm visibly curves forward '+side);
   assert(hand.elbowOutCm>3&&hand.elbowOutCm<20,'relaxed arm by torso '+side);
  }
 }
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
const source=fs.readFileSync('js/v100-pose-authority.js','utf8');
assert(boot.includes("'v144','v145'].includes(flags.get('flightPreview'))"));
assert(boot.includes("flags.set('jumpPreview','v125')"));
assert(boot.includes("await script('js/v144-relaxed-arms.js?v=1440')"));
assert(source.includes("flightVersion==='v144'"));
assert(source.includes("v144?'natural-arms'"));
console.log('PASS V144: keyframed natural elbow/wrist lag, all yaws/mirrored rigs, 30/60/120fps, V143 body/legs and V125 jump unchanged');
