/* V160: full-body climb/dive spring; numerical checks are not visual sign-off. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const owner=require('../js/v100-pose-authority.js');
const {v159VerticalIntent:intent,v160VerticalStep:step}=owner;
assert.equal(typeof step,'function');
assert.deepEqual(step(null,0,0),{value:0,velocity:0});
assert.deepEqual(step(null,0,1/60),{value:0,velocity:0},
 'neutral preserves exact original Q');
for(const fps of [30,60,120]){
 const dt=1/fps;
 let lead=null,torso=null,limbs=null;
 const move=(target,seconds)=>{
  for(let i=0;i<Math.round(fps*seconds);i++){
   const before=[lead?.value||0,torso?.value||0,limbs?.value||0];
   lead=step(lead,target,dt,16);
   torso=step(torso,lead.value,dt,13);
   limbs=step(limbs,torso.value,dt,12);
   for(const [index,p] of [lead,torso,limbs].entries()){
    assert(Number.isFinite(p.value)&&Number.isFinite(p.velocity),
      'finite spring '+fps);
    assert(Math.abs(p.value)<=1.00001,'bounded pose '+fps);
    assert(Math.abs(p.value-before[index])<.16,
      'no 30/60/120fps pitch or joint popping '+fps);
   }
  }
 };
 move(intent(1,8),.5);
 assert(lead.value>.95&&torso.value>.89&&limbs.value>.60,
  'readable, delayed ascent '+fps);
 assert(lead.value>torso.value&&torso.value>limbs.value,
  'hips must lead body, arms and legs '+fps);
 move(intent(-1,-8),.8);
 assert(lead.value<-.98&&torso.value<-.94&&limbs.value<-.70,
  'fluid dive reversal '+fps);
 move(0,1.5);
 assert(Math.max(Math.abs(lead.value),Math.abs(torso.value),
  Math.abs(limbs.value))<.002,'must return to unchanged Q neutral '+fps);
}
assert.deepEqual(step({value:.42,velocity:-.7},1,0),
 {value:.42,velocity:-.7});
assert(Math.abs(step({value:0,velocity:0},Infinity,.016).value)<1e-12);
const source=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
const capture=fs.readFileSync('tools/capture-flight-video.cjs','utf8');
const gallery=fs.readFileSync('.github/workflows/kairo-quick-flight-stills.yml','utf8');
assert(source.includes("get('flightVertical')==='v160'"),'opt in only');
for(const bone of [0,1,2,3,4,5,6,7,8,10,11,12,14,15,16,17,18,19])
 assert(source.includes('rotate('+bone+','),'articulated bone '+bone);
assert(source.includes('rotatePitch(0,-pitchDeg)')&&
 source.includes("get('flightVertical')==='v159'"),'V159 stays available');
assert(source.includes("get('flightPreview')==='v156'"),
 'approved V156 owner preserved');
assert(boot.includes("flags.set('flightPreview','v156')"));
assert(!boot.includes("flags.set('flightVertical','v160')"),
 'unreviewed V160 must not silently publish');
assert(boot.includes("e.src+='&vertical=160'"),'fresh JS');
assert(capture.includes("preview==='v160'?'v156&flightVertical=v160'"));
assert(gallery.includes("VISUAL_VERTICAL_QA: '1'")&&
 gallery.includes("v156,v160"),'real VRM A/B vertical stills');
console.log('PASS V160: soft full-body rise, dive, reversal and neutral at 30/60/120fps');
