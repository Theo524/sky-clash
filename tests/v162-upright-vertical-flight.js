/* V162: upright, readable 20-bone real VRM vertical flight. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const owner=require('../js/v100-pose-authority.js');
const {v159VerticalIntent:intent,v162VerticalFlow:flow,
 v162UprightVerticalPose:pose,v161VerticalPose:oldPose}=owner;
assert.equal(typeof flow,'function');assert.equal(typeof pose,'function');
for(const seconds of [0,.3,3.5]){
 const neutral=pose(null,seconds,1);
 assert(neutral.joints.every(j=>j.x===0&&j.z===0),
  'no input = absolutely unchanged V156 authored Q');
}
const peak=n=>pose(Object.fromEntries(
 ['lead','spine','shoulders','arms','legs','feet'].map(k=>[k,{value:n}])),.5);
const up=peak(1),down=peak(-1);
for(const p of [up,down]){
 assert(p.joints.length===20);
 assert(p.bodyLeanDeg<5.4,'no rocket pitch when flying vertically');
 assert(p.joints.every(j=>Number.isFinite(j.x)&&Number.isFinite(j.z)));
 assert(Math.abs(p.arms)>25&&Math.abs(p.legs)>19&&Math.abs(p.feet)>10,
  'full-body silhouette, not near-invisible torso motion');
 assert(Math.abs(p.joints[7].z)>9&&Math.abs(p.joints[11].z)>9,
  'arms visibly spread in flight');
}
assert(oldPose(Object.fromEntries(
 ['lead','spine','shoulders','arms','legs','feet'].map(k=>[k,{value:1}])),.5)
 .joints.slice(0,4).reduce((a,j)=>a+j.x,0)<-20,
 'V161 had too much forward lean to remain as default');
assert(up.joints[7].x<0&&down.joints[7].x>0,
 'rise vs fall must give different upper-arm silhouettes');
assert(up.joints[15].x>0&&down.joints[15].x<0,
 'rise gathers knees, descent lengthens them');
assert(up.joints[16].x<0&&down.joints[16].x>0,
 'foot trailing visibly changes with direction');
assert(up.joints[5].x>0&&up.joints[0].x<0,
 'head gently counterbalances without large pitch');
for(const fps of [30,60,120]){
 let state=null,seconds=0,prev=pose(null,0),maxFrame=0;
 const advance=(goal,duration)=>{
  for(let i=0;i<Math.round(fps*duration);i++){
   state=flow(state,goal,1/fps);seconds+=1/fps;
   const current=pose(state,seconds,1);
   assert(current.bodyLeanDeg<5.4,'upright at any transition '+fps);
   for(let j=0;j<20;j++){
    const a=current.joints[j],b=prev.joints[j];
    maxFrame=Math.max(maxFrame,Math.abs(a.x-b.x),Math.abs(a.z-b.z));
    assert(Math.abs(a.x)<44&&Math.abs(a.z)<18,
     'bounded anatomically conservative relative joint '+j+' '+fps);
   }
   prev=current;
  }
 };
 advance(intent(1,8),.5);
 assert(state.arms.value>.75&&state.legs.value>.82&&state.feet.value>.75,
  'arms/legs must be visible promptly in ascent at '+fps);
 assert(pose(state,seconds).arms< -23);
 advance(intent(-1,-8),.5);
 assert(state.arms.value<-.4&&state.legs.value<-.48,
  'dive must not remain in previous climbing pose at '+fps);
 assert(pose(state,seconds).arms>12,'descending arms respond '+fps);
 advance(0,1.7);
 assert(pose(state,seconds).joints.every(j=>
  Math.abs(j.x)<.055&&Math.abs(j.z)<.055),'return exactly to Q '+fps);
 assert(maxFrame<10,'max 10 deg/frame during hard reversal '+fps+' '+maxFrame);
}
const source=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 capture=fs.readFileSync('tools/capture-flight-video.cjs','utf8'),
 gallery=fs.readFileSync('.github/workflows/kairo-quick-flight-stills.yml','utf8'),
 index=fs.readFileSync('index.html','utf8');
assert(source.includes("get('flightVertical')==='v162'"));
assert(source.includes("get('flightVertical')==='v161'"));
assert(source.includes('v162UprightVerticalPose(st.v162Flow,st.elapsed,entry)'));
assert(source.includes("get('flightPreview')==='v156'"));
assert(boot.includes("flags.set('flightPreview','v156')")&&
 !boot.includes("flags.set('flightVertical','v162')"));
assert(boot.includes("e.src+='&vertical=162'")&&
 index.includes('verticalUprightReady=162'));
assert(capture.includes("preview==='v162'?'v156&flightVertical=v162'"));
assert(capture.includes("preview==='v162'")&&gallery.includes('VISUAL_VERTICAL_QA'),
 "V162 remains selectable even when quick contact-sheet default advances");
console.log('PASS V162: upright <5.4deg, clear arms/knees/feet, reversible 30/60/120fps, unchanged V156');
