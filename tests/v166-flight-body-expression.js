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
assert(b.maxDegrees>1.5&&b.maxDegrees<3.5,'hover needs gentle visible limb motion');
assert(cruise.maxDegrees<b.maxDegrees&&cruise.maxDegrees>b.maxDegrees*.70,
 'flight limbs should stay alive without excessive cruise motion');
const samples=Array.from({length:241},(_,i)=>expression(i*.05,0,1));
for(const sample of samples){
 const torso=sample.joints.slice(0,6);
 assert(torso.every(j=>Math.hypot(j.x,j.z)<.55),
  'flight must not rock Kairo\'s torso/neck away from Q');
 assert(Math.abs(torso.slice(0,4).reduce((sum,j)=>sum+j.x,0))<1,
  'combined pelvis and rib pitch must stay almost upright');
 assert(sample.maxDegrees<3.6,'no exaggerated flight-body rocking');
}
for(const index of [6,7,8,9,10,11,12,13,14,15,16,17,18,19]){
 const movement=samples.map(s=>s.joints[index].x);
 assert(Math.max(...movement)-Math.min(...movement)>([9,13].includes(index)?.5:[16,19].includes(index)?.7:1),
  'arms, hands, knees and ankles should visibly move throughout: '+pose.bones[index]);
}
assert(samples.some(s=>Math.abs(s.joints[7].x-s.joints[11].x)>1),
 'arms must not swing as a synchronized mirror pair');
for(const index of [0,1,2,3,4,5])
 assert(samples.some(s=>Math.hypot(s.joints[index].x,s.joints[index].z)>.08),
  'subtle breathing should remain in the stable body: '+pose.bones[index]);
for(const t of [0,.125,.5,1,2,7,100,Infinity,NaN]){
 const q=expression(t,0,1);
 assert(Number.isFinite(q.maxDegrees)&&q.maxDegrees<3.6,'bounded visual motion');
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
assert(boot.includes("e.src+='&body=168'"),'preview cache must refresh');
const v72=fs.readFileSync('js/v72-published-actions.js','utf8');
assert(v72.includes('SkyClashV100Animator?.v166FlightBodyExpression('),
 'locally assigned floating/flying should reuse the single flight expression');
console.log('PASS V166: stable torso, independent arm/leg sway, 30/60/120Hz continuity, intact Q and public default');
