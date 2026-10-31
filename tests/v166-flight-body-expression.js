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
assert(b.maxDegrees>1&&b.maxDegrees<7.5,'authored flow stays gentle');
assert(cruise.maxDegrees>0&&cruise.maxDegrees<b.maxDegrees,
 'forward flight keeps the original expression slightly calmer');
const samples=Array.from({length:901},(_,i)=>expression(i*.01,0,1));
for(const s of samples){
 const torso=s.joints.slice(0,6);
 assert(torso.every(j=>Math.hypot(j.x,j.z)<1.2),
  'V143 torso flow may never change the Q flight stance');
 assert(Math.abs(torso.slice(0,4).reduce((sum,j)=>sum+j.x,0))<1,
  'no excessive forward/back torso bending');
 assert(s.maxDegrees<7.5,'bounded selected B arm motion');
 for(const j of s.joints)if(j.q){
  assert(j.q.every(Number.isFinite),'finite authored quaternion');
  assert(Math.abs(Math.hypot(...j.q)-1)<.00001,
   'normalized local-space selected-B motion');
 }
}
const peak=i=>Math.max(...samples.map(s=>Math.hypot(s.joints[i].x,s.joints[i].z)));
assert(peak(0)>.05&&peak(1)>.05&&peak(2)>.05,
 'preserve continuous keyed V143 pelvis-to-chest flow');
assert(peak(14)>.35&&peak(15)>.45&&peak(17)>.12&&peak(18)>.18,
 'independently authored V143 suspended legs should move');
assert(peak(9)>.3&&peak(13)>.3,'V144 delayed hand follow-through visible');
const angle=q=>2*Math.acos(Math.min(1,Math.abs(q[3])))*180/Math.PI;
for(const i of [7,8,11,12]){
 const amplitudes=samples.map(s=>angle(s.joints[i].q||[0,0,0,1]));
 assert(Math.max(...amplitudes)>1,'chosen B keys should move arm '+pose.bones[i]);
}
const eq=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<.00001);
assert(!eq(expression(.5,0,1).joints[7].q,expression(.5,0,1).joints[11].q),
 'left and right B quaternion motion should not mirror');
const first=expression(.02,0,1).joints;
const last=expression(4.62,0,1).joints;
for(const i of [0,1,2,14,15,17,18]){
 assert(Math.hypot(first[i].x-last[i].x,first[i].z-last[i].z)<.12,
  'V143 authored 4.6s keyframe loop smooth at '+pose.bones[i]);
}
for(const fps of [30,60,120]){
 let previous=expression(.72,0,1);
 for(let i=1;i<=fps*6;i++){
  const next=expression(.72+i/fps,0,1);
  for(let bone=0;bone<20;bone++){
   const delta=Math.hypot(next.joints[bone].x-previous.joints[bone].x,
    next.joints[bone].z-previous.joints[bone].z);
   assert(delta<.8,'authored body snap at '+fps+'fps '+bone);
   if(next.joints[bone].q&&previous.joints[bone].q){
    const q=next.joints[bone].q,p=previous.joints[bone].q;
    const cos=Math.abs(q.reduce((s,v,i)=>s+v*p[i],0));
    assert(2*Math.acos(Math.min(1,cos))*180/Math.PI<.8,
     'authored B hand/arm snap at '+fps+'fps '+bone);
   }
  }
  previous=next;
 }
}
for(const t of [0,.125,.5,1,2,7,100,Infinity,NaN]){
 const q=expression(t,0,1);
 assert(Number.isFinite(q.maxDegrees)&&q.maxDegrees<7.5,'bounded visual motion');
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
assert(boot.includes("get('flightBody')==='alive'"),'selected B source must load for opt-in');
assert(code.includes('SkyClashV164SelectedFlight')&&
 code.includes('SkyClashV143HoverKeys')&&code.includes('SkyClashV144Arms'),
 'expression must source all three original authored animations');
assert(!boot.includes("flags.set('flightBody','alive')"),
 'user has not approved default promotion');
assert(boot.includes("flags.set('flightPreview','v156')"),'approved Q unchanged');
assert(boot.includes("e.src+='&body=175'"),'preview cache must refresh');
const v72=fs.readFileSync('js/v72-published-actions.js','utf8');
assert(v72.includes('SkyClashV100Animator?.v166FlightBodyExpression('),
 'locally assigned floating/flying should reuse the single flight expression');
console.log('PASS V175: recovered V143/V144 timing and exact V164 B motion on immutable V156 Q; safe owner/default');
