/* Kairo self-contained flight correction — same V156 Q silhouette.
 * Artistic review belongs to the player; these checks prevent regression.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const owner=require('../js/v100-pose-authority.js');
require('../js/v156-real-vrm-flight.js');
const pose=globalThis.SkyClashV156AuthoredFlight;
const expression=owner.v166FlightBodyExpression;
assert.equal(typeof expression,'function');
assert(pose&&pose.bones.length===20);
const idle=expression(0,0,0);
assert.equal(idle.maxDegrees,0,'entry starts from approved Q');
assert(idle.joints.every(j=>j.x===0&&j.z===0));
const hover=expression(1.76,0,1),cruise=expression(1.76,1,1);
assert(hover.maxDegrees>2&&hover.maxDegrees<5.3,'flow is visible but quiet');
assert(cruise.maxDegrees<hover.maxDegrees&&cruise.maxDegrees>2,
 'forward travel softly damps, rather than freezes, the movement');
const samples=Array.from({length:1381},(_,i)=>expression(i/120,0,1));
const peak=i=>Math.max(...samples.map(s=>Math.hypot(s.joints[i].x,s.joints[i].z)));
for(const s of samples){
 assert.equal(s.joints.length,20);
 assert(s.joints.slice(0,6).every(j=>Math.hypot(j.x,j.z)<.8),
  'no pronounced torso rocking or leaning');
 assert(Math.abs(s.joints.slice(0,4).reduce((a,j)=>a+j.x,0))<.4,
  'combined torso pitch must remain calm');
 assert(s.maxDegrees<5.3,'all limb offsets are bounded');
 for(const j of s.joints){
  assert(Number.isFinite(j.x)&&Number.isFinite(j.z));
  assert(!Object.hasOwn(j,'q'),'no external selected-B quaternion dependency');
 }
}
for(const [i,min] of [[0,.25],[2,.22],[7,2.2],[8,3],
 [9,1.6],[11,2.4],[12,2.8],[13,1.6],[15,1.2],
 [18,1.0],[16,.5],[19,.5]])assert(peak(i)>min,
 'expressive Kairo joint is missing: '+pose.bones[i]);
const left=expression(1.17,0,1).joints;
const right=expression(2.99,0,1).joints;
assert(left[7].z>2&&Math.abs(left[11].z)<1,
 'left arm leads without both hands rising at once');
assert(right[11].z< -2&&Math.abs(right[7].z)<1.5,
 'right arm follows later while left settles');
for(const i of [7,11])
 assert(samples.some((s,n)=>n>5&&
  Math.abs(s.joints[i].z-samples[n-1].joints[i].z)>.00005),
  'both arms must keep flowing, not freeze');
for(const fps of [30,60,120]){
 let previous=expression(.72,0,1);
 for(let n=1;n<=fps*15;n++){
  const next=expression(.72+n/fps,0,1);
  for(let i=0;i<20;i++)assert(
   Math.hypot(previous.joints[i].x-next.joints[i].x,
    previous.joints[i].z-next.joints[i].z)<.75,
   'no sharp movement at '+fps+'fps for '+pose.bones[i]);
  previous=next;
 }
}
const atStart=expression(.001,0,1),atWrap=expression(4.601,0,1);
for(let i=0;i<20;i++)assert(
 Math.hypot(atStart.joints[i].x-atWrap.joints[i].x,
 atStart.joints[i].z-atWrap.joints[i].z)<.001,
 'loop wrap continuity '+pose.bones[i]);
for(const t of [0,1,2,7,100,Infinity,NaN]){
 const v=expression(t,0,1);
 assert(Number.isFinite(v.maxDegrees));
}
const original=pose.hover.map(q=>q.slice());
const raw=new THREE.Quaternion().fromArray(pose.hover[2]);
const chest=expression(2,0,1).joints[2];
const rotation=new THREE.Quaternion().setFromEuler(
 new THREE.Euler(chest.x*Math.PI/180,0,chest.z*Math.PI/180,'XYZ'));
assert(raw.clone().premultiply(rotation).angleTo(raw)<.015,
 'Q chest must remain nearly unchanged');
assert.deepEqual(pose.hover,original,'original V156 Q must remain immutable');
const source=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(source.includes("get('flightBody')==='alive'") &&
 source.includes('v166FlightBodyExpression(st.elapsed,travel,'),
 'keep the expression in the existing opt-in V100 pose owner');
const directExpression=source.slice(source.indexOf('function v166FlightBodyExpression('),
 source.indexOf('function attach(THREE,f,status)',source.indexOf('function v166FlightBodyExpression(')));
assert(directExpression.length>500 &&
 !directExpression.includes('SkyClashV143HoverKeys')&&
 !directExpression.includes('SkyClashV144Arms')&&
 !directExpression.includes('SkyClashV164SelectedFlight'),
 'new living flight helper must not import other animation versions');
assert(!boot.includes('legacyFlightStage>=142||authoredBody') &&
 !boot.includes("get('flightVertical')==='v164'||"),
 'living flight must not load old full-body versions');
assert(!boot.includes("flags.set('flightBody','alive')"),
 'default game must keep its approved Q');
assert(boot.includes("flags.set('flightPreview','v156')"),
 'original V156 remains the public flight stance');
assert(html.includes('directFlightFix=1') &&
 boot.includes("e.src+='&body=direct1'"),
 'refreshed boot and flight-owner URLs needed for cached GitHub Pages');
const studio=fs.readFileSync('js/v72-published-actions.js','utf8');
assert(studio.includes('SkyClashV100Animator?.v166FlightBodyExpression('),
 'local Studio flight still shares the same owner expression');
console.log('PASS direct self-contained natural Kairo flight: 20 bones, no twinning, bounded torso, 30/60/120 fps, Q untouched');
