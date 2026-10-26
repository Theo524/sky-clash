/* V161 full-body flight: actual bone-target contract and frame safety. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=require('../js/v100-pose-authority.js');
const {v159VerticalIntent:intent,v161VerticalFlow:flow,v161VerticalPose:pose}=api;
assert.equal(typeof flow,'function');assert.equal(typeof pose,'function');
for(const p of [pose(null,0,1),pose(null,3.8,1),pose(null,3.8,0)]){
 assert.equal(p.joints.length,20);
 assert(p.joints.every(j=>j.x===0&&j.z===0),'unchanged V156 neutral');
}
const end=value=>pose(Object.fromEntries(
 ['lead','spine','shoulders','arms','legs','feet'].map(k=>[k,{value}])),.5,1);
const up=end(1),down=end(-1);
for(const p of [up,down])for(let i=0;i<20;i++){
 assert(Number.isFinite(p.joints[i].x)&&Number.isFinite(p.joints[i].z));
 assert(Math.abs(p.joints[i].x)+Math.abs(p.joints[i].z)>.15,
  'all 20 joints participate: '+i);
}
assert(up.joints[14].x<0&&up.joints[15].x>0&&up.joints[16].x<0,
 'upward flight gathers legs/points shoes');
assert(down.joints[14].x>0&&down.joints[15].x<0&&down.joints[16].x>0,
 'downward flight lengthens trailing legs');
assert(up.joints[7].z>0&&up.joints[11].z<0,'arms spread into upward airflow');
assert(up.joints[0].x<0&&up.joints[5].x>0,'head counterbalances pelvis');
for(const fps of [30,60,120]){
 let st=null,elapsed=0,old=pose(null,0,1),maximum=0;
 const step=(goal,seconds)=>{
  for(let frame=0;frame<Math.round(fps*seconds);frame++){
   st=flow(st,goal,1/fps);elapsed+=1/fps;
   const p=pose(st,elapsed,1);
   for(let i=0;i<20;i++){
    maximum=Math.max(maximum,Math.abs(p.joints[i].x-old.joints[i].x),
     Math.abs(p.joints[i].z-old.joints[i].z));
    assert(Math.abs(p.joints[i].x)<30&&Math.abs(p.joints[i].z)<13,
     'joint safely bounded at '+fps+'fps');
   }
   old=p;
  }
 };
 step(intent(1,8),.65);
 assert(st.lead.value>.95&&st.spine.value>.85);
 assert(st.arms.value>.45&&st.legs.value>.7&&st.feet.value>.4,
  'full-body ascent responds at '+fps+'fps');
 assert(st.lead.value>st.spine.value&&st.spine.value>st.arms.value,
  'pelvis leads limbs rather than moving as a rigid plank');
 step(intent(-1,-8),.9);
 assert(st.lead.value<-.95&&st.legs.value<-.8,'dive reversal '+fps);
 step(0,1.6);
 assert(pose(st,elapsed,1).joints.every(j=>
  Math.abs(j.x)<.05&&Math.abs(j.z)<.05),'return to Q neutral '+fps);
 assert(maximum<7,'no frame-to-frame snap '+fps+' '+maximum);
}
const source=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const capture=fs.readFileSync('tools/capture-flight-video.cjs','utf8');
const gallery=fs.readFileSync('.github/workflows/kairo-quick-flight-stills.yml','utf8');
assert(source.includes("get('flightVertical')==='v161'"));
assert(source.includes("get('flightVertical')==='v160'"));
assert(source.includes('const pose=v161VerticalPose(st.v161Flow,st.elapsed,entry)'));
assert(source.includes("get('flightPreview')==='v156'"));
assert(boot.includes("flags.set('flightPreview','v156')"));
assert(!boot.includes("flags.set('flightVertical','v161')"));
assert(boot.includes("e.src+='&vertical=161'")&&index.includes('verticalBodyFlowReady=161'));
assert(capture.includes("preview==='v161'?'v156&flightVertical=v161'"));
assert(capture.includes("preview==='v161'")&&
 gallery.includes("VISUAL_VERTICAL_QA: '1'"));
console.log('PASS V161: 20 real-VRM flight joints, ascent/dive, reversals and neutral at 30/60/120fps');
