/* V166: Kairo's real V156 flight pose stays the source; preview only.
 * Numerical and rig contracts are not a substitute for player visual review.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const owner=require('../js/v100-pose-authority.js');
require('../js/v156-real-vrm-flight.js');
const pose=globalThis.SkyClashV156AuthoredFlight;
assert(pose&&pose.bones.length===20&&pose.hover.length===20);
const expression=owner.v166FlightBodyExpression;
assert.equal(typeof expression,'function');
const still=expression(0,0,0);
assert.equal(still.maxDegrees,0,'no pose snap at flight entry');
assert(still.joints.every(j=>j.x===0&&j.z===0));
const b=expression(2,0,1),cruise=expression(2,1,1);
assert.equal(b.joints.length,20);
assert(b.maxDegrees>3&&b.maxDegrees<5.6,'natural full-body movement is readable');
assert(cruise.maxDegrees<b.maxDegrees&&cruise.maxDegrees>b.maxDegrees*.85,
 'forward cruise must retain the same flowing Q stance');
const samples=Array.from({length:2401},(_,i)=>expression(i*.01,0,1));
for(const sample of samples){
 const torso=sample.joints.slice(0,6);
 assert(torso.every(j=>Math.hypot(j.x,j.z)<.55),
  'torso should sway gently but never pitch away from Q');
 assert(Math.abs(torso.slice(0,4).reduce((sum,j)=>sum+j.x,0))<1,
  'pelvis and rib pitch must remain almost upright');
 assert(sample.maxDegrees<5.6,'preserve the authored V156 flight silhouette');
}
const peak=i=>Math.max(...samples.map(s=>Math.hypot(s.joints[i].x,s.joints[i].z)));
assert(peak(2)>.3&&peak(0)>.2,
 'breathing should propagate gently through ribs and pelvis, not be rigid');
assert(peak(7)>4&&peak(11)>3.4,
 'both arms should move visibly within their original stance');
assert(peak(8)>2.2&&peak(12)>1.9,'elbows should follow their own timing');
assert(peak(9)>1.05&&peak(13)>.95,'wrists should continue the arm flow');
assert(peak(15)>2&&peak(18)>1.8,'knees should float independently');
assert(peak(16)>.9&&peak(19)>.8,'ankles should respond without kicking');
// The previous approach made one arm completely stop before the other.
// True overlap: both sides continue gently at DIFFERENT times, with
// different rhythms rather than identical simultaneous bobbing.
const velocity=i=>samples.slice(1).map((s,k)=>({
 x:s.joints[i].x-samples[k].joints[i].x,
 z:s.joints[i].z-samples[k].joints[i].z}));
const corr=(a,b)=>{
 const avg=a.reduce((s,n)=>s+n,0)/a.length;
 const mean=b.reduce((s,n)=>s+n,0)/b.length;
 let covariance=0,varianceA=0,varianceB=0;
 for(let i=0;i<a.length;i++){
  const da=a[i]-avg,db=b[i]-mean;
  covariance+=da*db;varianceA+=da*da;varianceB+=db*db;
 }
 return covariance/Math.sqrt(varianceA*varianceB);
};
const leftVel=velocity(7),rightVel=velocity(11);
assert(Math.abs(corr(leftVel.map(v=>v.x),rightVel.map(v=>v.x)))<.6,
 'hands may not rise and fall together like a mirror pair');
assert(Math.abs(corr(leftVel.map(v=>v.z),rightVel.map(v=>v.z)))<.75,
 'arm arcs must stay offset without fully stopping either side');
for(const i of [7,11]){
 for(let start=0;start<2100;start+=75){
  const movement=samples.slice(start,start+150).map(q=>q.joints[i].z);
  assert(Math.max(...movement)-Math.min(...movement)>.15,
   'no rigid stop-and-wait interval in the flight expression: '+pose.bones[i]);
 }
}
const phaseLag=(lead,follow)=>{
 const a=samples.slice(0,1000).map(s=>s.joints[lead].z);
 const b=samples.slice(0,1000).map(s=>s.joints[follow].z);
 const at=lag=>corr(a.slice(0,a.length-lag),b.slice(lag));
 return {zero:at(0),delayed:at(45)};
};
assert(phaseLag(7,8).delayed>phaseLag(7,8).zero,
 'left forearm motion should follow its upper arm');
assert(phaseLag(11,12).delayed>phaseLag(11,12).zero,
 'right forearm motion should follow its upper arm');
for(const index of [0,1,2,3,4,5])
 assert(samples.some(s=>Math.hypot(s.joints[index].x,s.joints[index].z)>.08),
  'natural body flow must reach every torso joint: '+pose.bones[index]);
for(const t of [0,.125,.5,1,2,7,100,Infinity,NaN]){
 const q=expression(t,0,1);
 assert(Number.isFinite(q.maxDegrees)&&q.maxDegrees<5.6,'bounded visual motion');
 for(const j of q.joints)assert(Number.isFinite(j.x)&&Number.isFinite(j.z));
}
for(const fps of [30,60,120]){
 let previous=expression(.72,0,1);
 for(let i=1;i<=fps*5;i++){
  const next=expression(.72+i/fps,0,1);
  for(let bone=0;bone<20;bone++){
   const delta=Math.hypot(next.joints[bone].x-previous.joints[bone].x,
    next.joints[bone].z-previous.joints[bone].z);
   assert(delta<.75,'sudden joint pop at '+fps+'fps, bone '+bone);
  }
  previous=next;
 }
}
const start=pose.hover.map(q=>q.slice());
const raw=new THREE.Quaternion().fromArray(pose.hover[2]);
const sample=expression(1,0,1).joints[2];
const delta=new THREE.Quaternion().setFromEuler(
 new THREE.Euler(sample.x*Math.PI/180,0,sample.z*Math.PI/180,'XYZ'));
const result=raw.clone().premultiply(delta);
assert(result.angleTo(raw)>.001&&result.angleTo(raw)<.015,
 'real chest joint breathes without significant forward lean');
assert.deepEqual(pose.hover,start,'authored Q data is immutable');
const code=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(code.includes("get('flightBody')==='alive'"),'body motion must be explicit opt-in');
assert(code.includes('v166FlightBodyExpression(st.elapsed,travel,'),
 'must reuse existing V100 flight writer');
assert(!boot.includes("flags.set('flightBody','alive')"),
 'user has not approved default promotion');
assert(boot.includes("flags.set('flightPreview','v156')"),'approved Q unchanged');
assert(boot.includes("e.src+='&body=174'"),'preview cache must refresh');
const v72=fs.readFileSync('js/v72-published-actions.js','utf8');
assert(v72.includes('SkyClashV100Animator?.v166FlightBodyExpression('),
 'locally assigned floating/flying should reuse the single flight expression');
console.log('PASS V166: natural layered torso/limb flow, asynchronous arms, no rigid waits or twinning, preserved original Q and ownership');
