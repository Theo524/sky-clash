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
assert(b.maxDegrees>3&&b.maxDegrees<5.5,'left-arm adjustment visible but relaxed');
assert(cruise.maxDegrees<b.maxDegrees&&cruise.maxDegrees>b.maxDegrees*.85,
 'cruise should preserve soft, non-mechanical secondary motion');
const samples=Array.from({length:881},(_,i)=>expression(i*.01,0,1));
for(const sample of samples){
 const torso=sample.joints.slice(0,6);
 assert(torso.every(j=>Math.hypot(j.x,j.z)<.55),
  'flight must not rock Kairo torso/neck away from Q');
 assert(Math.abs(torso.slice(0,4).reduce((sum,j)=>sum+j.x,0))<1,
  'pelvis and rib pitch must remain almost upright');
 assert(sample.maxDegrees<5.6,'no exaggerated arm pumping');
}
const peak=i=>Math.max(...samples.map(s=>Math.hypot(s.joints[i].x,s.joints[i].z)));
assert(peak(7)>4.8&&peak(11)>3.8,'both hands should receive occasional adjustment');
assert(peak(8)>2.7&&peak(12)>2.3,'elbows follow independently');
assert(peak(9)>1.4&&peak(13)>1.2,'wrists follow later than elbows');
assert(peak(15)>2&&peak(18)>1.8,'knees retain separate motion');
assert(peak(16)>1&&peak(19)>.85,'feet/ankles have understated follow-through');
// Do NOT simply phase-shift two oscillating arms: enforce disjoint
// movement windows, with the full upper-arm, forearm and wrist chain
// settled on one side before the other side starts.
for(const s of samples){
 const left=[6,7,8,9].some(i=>Math.hypot(s.joints[i].x,s.joints[i].z)>.015);
 const right=[10,11,12,13].some(i=>Math.hypot(s.joints[i].x,s.joints[i].z)>.015);
 assert(!(left&&right),'the arms must never pump/adjust simultaneously');
}
for(const [t,active,inactive] of [[2,7,11],[5.8,11,7]]){
 const q=expression(t,0,1).joints;
 assert(Math.hypot(q[active].x,q[active].z)>3,
  'one arm makes an independent deliberate adjustment');
 assert(Math.hypot(q[inactive].x,q[inactive].z)<.01,
  'other upper arm rests, not mirroring adjustment');
}
for(const [upper,elbow,wrist] of [[7,8,9],[11,12,13]]){
 const leadTime=samples.findIndex(q=>Math.hypot(q.joints[upper].x,q.joints[upper].z)>1);
 const elbowTime=samples.findIndex(q=>Math.hypot(q.joints[elbow].x,q.joints[elbow].z)>1);
 const wristTime=samples.findIndex(q=>Math.hypot(q.joints[wrist].x,q.joints[wrist].z)>.3);
 assert(leadTime<elbowTime&&elbowTime<wristTime,
  'upper arm must lead elbow then wrist (overlapping follow-through)');
}
for(const index of [0,1,2,3,4,5])
 assert(samples.some(s=>Math.hypot(s.joints[index].x,s.joints[index].z)>.08),
  'stable body must still breathe subtly: '+pose.bones[index]);
const beforeWrap=expression(8.8-1/60,0,1).joints;
const afterWrap=expression(8.8+1/60,0,1).joints;
for(let i=0;i<20;i++)assert(
 Math.hypot(beforeWrap[i].x-afterWrap[i].x,beforeWrap[i].z-afterWrap[i].z)<.2,
 'smooth loop phase boundary: '+pose.bones[i]);
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
assert(boot.includes("e.src+='&body=170'"),'preview cache must refresh');
const v72=fs.readFileSync('js/v72-published-actions.js','utf8');
assert(v72.includes('SkyClashV100Animator?.v166FlightBodyExpression('),
 'locally assigned floating/flying should reuse the single flight expression');
console.log('PASS V166: reference-based asymmetric non-pumping hover, arm timing and limb overlap, unchanged V156 Q and public defaults');
