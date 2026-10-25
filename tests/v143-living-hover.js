/* V143: one approved V142 flying silhouette, now with actual animated
 * pelvis/chest counterweight, lagging elbows/forearms and breathing.
 * The revised flight stays inside existing V100 ownership; no jump,
 * walk, run, combat, or physics changes.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const a=require('../js/v142-hover-keyframes.js');
const b=require('../js/v143-hover-performance.js');
const close=(x,y,t=1e-6)=>Math.abs(x-y)<t;
assert.equal(b.duration,a.duration);
assert(b.keys.length>=8&&b.channels.length>20);
for(const channel of b.channels){
 assert(close(b.sample(0)[channel],b.sample(b.duration)[channel]));
 assert(close(b.sample(-b.duration)[channel],b.sample(0)[channel]));
}
const zero=b.sample(0),out=b.sample(1.17),back=b.sample(2.99);
assert(out.bodyF>.05&&back.bodyF<-.035,'authored pelvic counterweight must move, not root bob');
assert(out.bodyS>.02&&back.bodyS<-.025,'body leans from side to side');
const late=b.sample(2.40);
assert(out.chestF>zero.chestF&&late.chestF>out.chestF+.025&&back.chestF<late.chestF,
 'chest follows pelvis and peaks later in the authored performance');
assert(out.leftElbowF>zero.leftElbowF+.07,
 'one elbow visibly floats while other stays relaxed');
assert(back.rightHandF>zero.rightHandF+.09,
 'opposite hand receives delayed follow-through');
const p=V100.v143FlightPose;
assert(typeof p==='function','final pose owner exposes V143 without an additional wrapper');
const first=p(0,0,0,0),peak=p(0,0,0,1.17),opposite=p(0,0,0,2.99);
assert.equal(first.profile,'V143 living hover performance');
assert(peak.pelvisGoalF>.05&&opposite.pelvisGoalF<-.035);
assert(Math.abs(peak.chestGoalS-opposite.chestGoalS)>.04,
 'upper body keeps separate counter-rotations');
assert(Math.abs(peak.hipsX-opposite.hipsX)>.01);
assert(Math.abs(peak.spineZ-opposite.spineZ)>.02);
const original=V100.v142FlightPose(0,0,0,1.17);
assert.notEqual(original.profile,peak.profile);
for(const t of [0,.31,.58,1.17,1.76,2.4,2.99,3.61,4.12,4.599]){
 const k=b.sample(t);
 assert(k.leftKnee>.9&&k.rightKnee<.15,
  'preserve user-liked one folded leg and one dangling leg');
 assert(k.leftShin>1.05&&k.rightShin<.34,'do not bring back twin-knee crouch');
 assert(k.leftToe>=3.8&&k.rightToe>=3.7,'toes hang down');
}
for(const fps of [30,60,120]){
 let maxDelta=0;
 for(let n=0;n<Math.round(fps*b.duration);n++){
  const a0=b.sample(n/fps),a1=b.sample((n+1)/fps);
  for(const c of b.channels){
   assert(Number.isFinite(a1[c]),'valid rig channel '+c);
   maxDelta=Math.max(maxDelta,Math.abs(a1[c]-a0[c]));
  }
 }
 assert(maxDelta<.045,'seamless movement / no teleports at '+fps+'fps: '+maxDelta);
}
function torso(yaw){
 const root=new THREE.Group(),scene=new THREE.Group(),hum={};
 root.rotation.y=yaw;root.add(scene);
 const hips=new THREE.Bone();hips.position.y=1.45;scene.add(hips);
 const spine=new THREE.Bone();spine.position.y=.2;hips.add(spine);
 const chest=new THREE.Bone();chest.position.y=.2;spine.add(chest);
 const neck=new THREE.Bone();neck.position.y=.15;chest.add(neck);
 for(const [n,v] of [['hips',hips],['spine',spine],['chest',chest],['neck',neck]])hum[n]=v;
 // A natural source-model torso slouch as in the real Kairo import.
 spine.rotation.x=.16;
 const rig={vrm:{scene,humanoid:{getNormalizedBoneNode:n=>hum[n]||null}}};
 const f=new THREE.Vector3(0,0,1).applyQuaternion(root.quaternion);
 return {rig,f};
}
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 const data=[];
 for(const t of [1.17,2.99]){
  const {rig,f}=torso(yaw),z={};
  V100.v137CorrectPelvisBalance(THREE,rig,f,p(0,0,0,t),1,null,1/60,z);
  V100.v136CorrectSuspendedTorso(THREE,rig,f,p(0,0,0,t),1,null,1/60,z);
  assert(z.flightPelvisBalanceWorld&&z.flightTorsoWorld,'world-space living rig correction');
  assert(z.flightTorsoWorld.residualTiltDeg<4,'preserve upright torso, not slumped head');
  data.push(z.flightPelvisBalanceWorld.pelvisNeckForwardCm);
 }
 assert(Math.abs(data[0]-data[1])>2,'real world pelvis posture must move visibly');
}
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
const source=fs.readFileSync('js/v100-pose-authority.js','utf8');
assert(boot.includes("flags.set('flightPreview','v143')"),'public game is V143');
assert(boot.includes("flags.set('jumpPreview','v125')"),'approved jump stays V125');
assert(boot.includes("const BUILD='V143'"));
assert(boot.includes("await script('js/v143-hover-performance.js?v=1430')"));
assert(source.includes("flightVersion==='v143'"));
assert(source.includes("v143?'living-hover'"));
assert(!source.includes('root.position.y+='),
 'new animation does not translate physics/model root');
console.log('PASS V143: visible delayed whole-body real-world motion, seamless 30–120fps, retained V142 silhouette, unaffected V125 jump');
