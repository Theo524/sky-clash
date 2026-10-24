/* V113 controlled authored flight and more exact foot-anchored V112 prep. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const F=V100.controlledFlightPose;
assert.equal(typeof F,'function');
for(const fps of [30,60,120]){
 let mix=0,old=F(0,0,0);
 for(let frame=0;frame<fps*4;frame++){
  const elapsed=frame/fps;
  const goal=V100.flightWeight(elapsed<1?0:elapsed<2?3.5:6.2);
  mix=V100.flightStep(mix,goal,1/fps);
  const next=F(mix,0,0);
  for(const key of ['hipsX','spineX','chestX','neckX','spineZ',
   'leftShoulderX','rightShoulderX','leftUpperArmX','rightUpperArmX',
   'leftThighX','rightThighX','leftKneeX','rightKneeX']){
   assert(Number.isFinite(next[key]));
   assert(Math.abs(next[key]-old[key])<.06,
    'controlled flight must not snap on mobile: '+key);
  }
  old=next;
 }
}
const hover=F(0,0,0),cruise=F(1,0,0),rise=F(.2,8,0),
 drop=F(.2,-8,0),turnL=F(.7,0,-6),turnR=F(.7,0,6);
assert(hover.leftKneeX>.10&&hover.leftKneeX<.23,'neutral hover keeps athletic relaxed knee bend');
assert(cruise.spineX>hover.spineX+.09,'travel leans torso forward but not horizontally');
assert(cruise.spineX<.20,'controlled profile must remain compact and upright enough to fight');
assert(cruise.leftUpperArmX>hover.leftUpperArmX,
 'moving flight has small authored arm reaction');
assert(rise.leftKneeX<hover.leftKneeX,'ascending naturally straightens legs');
assert(drop.leftKneeX>hover.leftKneeX,'descending braces knees for landing');
assert(turnL.spineZ*turnR.spineZ<0,'left/right turns bank in opposite directions');
assert(Math.abs(turnL.spineZ)<.06&&Math.abs(turnR.spineZ)<.06,
 'controlled turns must bank only slightly');
for(const pose of [hover,cruise,rise,drop,turnL,turnR]){
 assert(Math.abs(pose.leftThighX-pose.rightThighX)<1e-6,
  'controlled flight has symmetric non-crossing thighs');
 assert(Math.abs(pose.leftKneeX-pose.rightKneeX)<1e-6,
  'controlled flight legs must not cross or kick');
}
const owner=read('js/v100-pose-authority.js'),
 boot=read('js/v66-game-boot.js'),
 html=read('index.html');
assert(owner.includes("params.get('flightStyle')==='controlled'"));
assert(owner.includes('const flightControl=controlled?controlledFlightPose('));
assert(owner.includes('st.restPose.length===BONES.length'));
assert(owner.includes("status.flightStyle=new URLSearchParams"));
assert(owner.includes("'V113 authored controlled':'V111 continuous hover / travel'"));
assert(owner.includes("get('jumpFeet')==='hold'"));
assert(owner.includes('st.prepFeet.length'));
assert(owner.includes('shift.clampLength(0,.11)'));
assert(owner.includes('st.pushReleaseHipXZ=previous===\'prep\''));
assert(owner.includes('if(st.pushReleaseHipXZ){'));
assert(boot.includes("e.src+='&controlled=113'"));
assert(boot.includes('shoe shift '));
assert(/SKY CLASH · BUILD V11[34]/.test(html));
assert(/js\/v66-game-boot\.js\?v=820&fix=11[45]/.test(html));
assert(/BUILD V11[34]/.test(read('animation-studio.html')));
console.log('PASS V113: 30/60/120fps controlled combat hover, forward travel, ascend, descend, subtle lateral turn; optional double-foot hold and smooth XZ takeoff release');
