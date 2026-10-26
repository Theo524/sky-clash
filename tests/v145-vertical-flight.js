/* V145 directional ascent and descent. Approved neutral V144 stays exact.
 * Body motion comes from the existing V100 real-Kairo VRM0 final owner,
 * vertical cue from flight velocity, never input or root translation.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const clip=require('../js/v145-vertical-flight.js');
const V100=require('../js/v100-pose-authority.js');
const {sample,performance,duration,channels,ascend,descend}=clip;
assert.equal(duration,4.6);
assert.equal(ascend.length,5);
assert.equal(descend.length,5);
assert(channels.length>=20);
for(const table of [ascend,descend]){
 for(const channel of channels){
  assert.equal(sample(table,0)[channel],sample(table,duration)[channel],
   'periodic vertical key loop '+channel);
  assert.equal(sample(table,0)[channel],sample(table,-duration)[channel],
   'backward periodic loop '+channel);
 }
 for(let f=0;f<=460;f++){
  const k=sample(table,duration*f/460);
  assert(Object.values(k).every(Number.isFinite),'finite normalized joint goals');
 }
}
const up=performance(1,0,1.15),down=performance(0,1,2.30),
 hover=performance(0,0,1.15);
assert(Object.values(hover).every(x=>x===0),'no additive motion at zero vertical speed');
assert(up.bodyF<-.06&&up.chestF<-.05,'rising chest counter-leans');
assert(down.bodyF>.07&&down.chestF>.055,'falling torso pitches forward');
assert(up.leftKnee>.14&&up.rightKnee>.09,'ascending gathers both legs asymmetrically');
assert(down.leftKnee<-.13&&down.rightKnee<-.04,'descending lengthens both legs');
assert(up.leftElbowY>.07&&up.rightElbowY>.06,'rising shoulders react subtly');
assert(down.leftElbowO>.13&&down.rightElbowO>.13,'descending arms open for balance');
assert(up.leftHandF<.05&&down.leftHandF>.10,
 'vertical arm performance not simply mirrored flight guard');
const p=V100.v145FlightPose,prior=V100.v144FlightPose;
assert.equal(typeof p,'function');
for(const t of [0,.28,.58,1.15,1.76,2.30,2.99,3.61,4.12,4.599])
 for(const speed of [0,3,7,-3,-7]){
  const fresh=p(.3,speed,0,t),old=prior(.3,speed,0,t);
  assert.equal(fresh.profile,'V145 directed vertical flight');
  assert.equal(fresh.verticalAction,speed>0?'ascending':speed<0?'descending':'hover');
  assert(fresh.keys.leftKnee>.76&&fresh.keys.rightKnee<.28,
    'retain one raised leg and one hanging leg regardless vertical mode');
  assert(fresh.keys.leftShin>.91&&fresh.keys.rightShin<.36,
    'never change to a symmetric walking/cycling stroke');
  assert(fresh.keys.leftToe>=3.8&&fresh.keys.rightToe>=3.7,
    'always preserve unplanted dangling shoes');
  if(speed===0){
   assert.equal(fresh.verticalActionStrength,0);
   for(const k of Object.keys(old.keys))assert.equal(fresh.keys[k],old.keys[k],
    'hover is exactly the player-loved V144 '+k);
   for(const k of ['hipsX','spineX','chestX','neckX','pelvisGoalF',
     'chestGoalF','hipsZ','spineZ','chestZ'])
    assert.equal(fresh[k],old[k],'neutral V144 torso unchanged '+k);
  }else{
   assert(fresh.verticalActionStrength>0);
   assert.notEqual(fresh.pelvisGoalF,old.pelvisGoalF,
    'real torso counterbalance changes during ascent/descent');
  }
 }
for(const fps of [30,60,120]){
 for(const table of [ascend,descend]){
  let maxDelta=0;
  for(let frame=0;frame<Math.round(fps*duration);frame++){
   const a=sample(table,frame/fps),b=sample(table,(frame+1)/fps);
   for(const k of channels)maxDelta=Math.max(maxDelta,Math.abs(b[k]-a[k]));
  }
  assert(maxDelta<.035,'vertical keyed motion snaps at '+fps+'fps: '+maxDelta);
 }
}
// Continuous movement through a physical velocity reversal. V100 already
// smooths physical velocity before requesting a pose; key interpolation
// must not introduce an opposing discontinuity at zero.
for(let v=-1;v<1;v+=.05){
 const a=p(0,v,0,1.15),b=p(0,v+.05,0,1.15);
 assert(Math.abs(a.pelvisGoalF-b.pelvisGoalF)<.013,
  'continuous pelvis through stop/reversal '+v);
 assert(Math.abs(a.keys.leftElbowY-b.keys.leftElbowY)<.014,
  'continuous arm follow-through across vertical direction');
}
function worldArmRig(yaw){
 const root=new THREE.Group(),scene=new THREE.Group(),hum={};
 root.rotation.y=yaw;root.add(scene);
 const chest=new THREE.Bone();chest.position.y=1.75;scene.add(chest);hum.chest=chest;
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1,
   shoulder=new THREE.Bone(),upper=new THREE.Bone(),
   lower=new THREE.Bone(),hand=new THREE.Bone();
  shoulder.position.set(sign*.16,.08,0);chest.add(shoulder);
  upper.position.set(sign*.12,0,0);shoulder.add(upper);
  lower.position.set(sign*.25,-.038,0);upper.add(lower);
  hand.position.set(sign*.23,-.028,0);lower.add(hand);
  for(const [n,b] of [['Shoulder',shoulder],['UpperArm',upper],
   ['LowerArm',lower],['Hand',hand]])hum[side+n]=b;
 }
 scene.updateMatrixWorld(true);
 return {rig:{vrm:{scene,humanoid:{getNormalizedBoneNode:n=>hum[n]||null}}},forward:new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion)};
}
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2])
 for(const vertical of [7,-7]){
  const {rig,forward}=worldArmRig(yaw),state={};
  const pose=p(0,vertical,0,2.30);
  const result=V100.v129CorrectFlightGuard(THREE,rig,forward,pose,1,null,1/60,state,'vertical-flight');
  assert.equal(state.flightAuthoredClip,'V145 upward and downward keyed flight');
  for(const side of ['left','right']){
   assert(result[side].handAboveElbowCm<-10,
    'VRM hand stays BELOW elbow, not a boxing guard '+side);
   assert(result[side].elbowOutCm>2,
    'arm remains separated from Kairo torso '+side);
  }
 }
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
const authority=fs.readFileSync('js/v100-pose-authority.js','utf8');
const main=fs.readFileSync('js/animation-studio.js','utf8');
assert(boot.includes("'v145','v146','v147','v148','v149'].includes(flags.get('flightPreview'))"),'V145 vertical playback retained as rollback');
assert(boot.includes("flags.set('jumpPreview','v125')"),'approved V125 jump kept');
assert(boot.includes("const BUILD='V152'"));
assert(boot.includes("await script('js/v145-vertical-flight.js?v=1450')"));
assert(authority.includes("flightVersion==='v145'"));
assert(authority.includes("v145?'vertical-flight'"));
assert(!authority.includes('root.position.y+='),'no new artificial world/root vertical flight');
console.log('PASS V145: rise/drop authored bone targets, neutral V144 exact, 30/60/120fps, real-arm yaw, controlled velocity transitions, V125 jump preserved');
