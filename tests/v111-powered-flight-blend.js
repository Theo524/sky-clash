/* V111: one opt-in continuously blended powered flight owner. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const V72=require('../js/v72-published-actions.js');
const UE5=JSON.parse(read('assets/animations/gameplay/v86-ue5-converted-actions.json'));
const floating=V72.decode(THREE,UE5.motions.find(x=>x.slot==='floating'));
const flying=V72.decode(THREE,UE5.motions.find(x=>x.slot==='flying'));
assert(floating.frames>50&&flying.frames>50);
assert(floating.seconds>3&&flying.seconds>2,'use actual UE5 recorded loop clips');
assert.equal(V100.clipFor('flight'),'floating');
const nearly=(a,b,t=.00001)=>assert(Math.abs(a-b)<t);
nearly(V100.flightWeight(0),0);
nearly(V100.flightWeight(.7),0);
nearly(V100.flightWeight(6.2),1);
let last=0;
for(let i=0;i<=120;i++){
 const v=i*.1,w=V100.flightWeight(v);
 assert(w>=last-1e-8&&w<=1,'flight weight must be monotonic & bounded');
 if(i>0)assert(w-last<.06,'no abrupt threshold at 3 m/s');
 last=w;
}
for(const fps of [30,60,120]){
 let mix=0;
 for(let frame=0;frame<fps*3;frame++){
  const goal=V100.flightWeight(frame<fps?0:frame<fps*2?3.2:6.2);
  const next=V100.flightStep(mix,goal,1/fps);
  assert(next>=mix-1e-8&&next<=goal+1e-8,
   'forward acceleration should ease up to target, not overshoot');
  assert(next-mix<.20,'flight mix cannot pop at mobile frame rates');
  mix=next;
 }
 assert(mix>.98,'moving flight should eventually reach its recorded clip at '+fps+'fps');
}
const clips=[[0,0],[.5,.35],[1,1]];
for(const [time,w] of clips){
 const a=Array.from({length:20},()=>new THREE.Quaternion());
 const b=Array.from({length:20},()=>new THREE.Quaternion());
 floating.sample(time*floating.seconds,a,true);
 flying.sample(time*flying.seconds,b,true);
 for(let i=0;i<20;i++){
  assert(Number.isFinite(a[i].w)&&Number.isFinite(b[i].w),
   'source pose components must be finite');
  a[i].slerp(b[i],w).normalize();
  nearly(a[i].length(),1,1e-6);
 }
}
const owner=read('js/v100-pose-authority.js'),boot=read('js/v66-game-boot.js');
assert(owner.includes("get('flightLab')==='blend'"));
assert(owner.includes("state==='flight'?clips.flying:null"));
assert(owner.includes("clip.sample(seconds,st.samples,next==='flight')"));
assert(owner.includes("flightSource.sample(phase*flightSource.seconds,st.flightSamples,true)"));
assert(owner.includes("st.flightMix=flightStep(st.flightMix,flightWeight(speed),safe)"));
assert(owner.includes("if(next==='flight'){"));
assert(owner.includes("const maxStep=5.0*Math.max(0,dt)"));
assert(owner.includes("next==='flight'&&params.get('flightLab')==='blend'"));
assert(boot.includes("e.src+='&flight=111'"));
assert(boot.includes('FLIGHT: ')&&boot.includes('forward mix '));
const html=read('index.html');
assert(/SKY CLASH · BUILD V11[1-5]/.test(html));
assert(/js\/v66-game-boot\.js\?v=820&fix=11[2-6]/.test(html));
assert(/BUILD V11[1-5]/.test(read('animation-studio.html')));
console.log('PASS V111: real UE5 float/fly recordings, 30/60/120 FPS continuous weight, actual quaternion source blend, no threshold snap, independent rollback flags');
