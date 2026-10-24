/* V114: stable hinge planes and truly airborne poses. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const F=V100.airborneFlightPose;
assert.equal(typeof F,'function');
assert.equal(typeof V100.guidedPrepFeet,'function');
const hover=F(0,0,0),cruise=F(1,0,0),
 rise=F(.25,8,0),descend=F(.25,-8,0),
 left=F(.6,0,-6.2),right=F(.6,0,6.2);
const v113=V100.controlledFlightPose(0,0,0);
assert(hover.leftKneeX>.50&&hover.rightKneeX>.40,
 'actual hover must suspend both knees, not stand upright like ground idle');
assert(Math.abs(hover.leftKneeX-hover.rightKneeX)>.11,
 'unequal suspended knees must break static planted-floor symmetry');
assert(Math.abs(hover.leftThighX)>.24,
 'hover thigh must not look like an upright standing leg');
assert(Math.abs(hover.leftKneeX-v113.leftKneeX)>.40,
 'new hover silhouette must differ visually from failed V113 idle-like flight');
assert(hover.leftUpperArmX>v113.leftUpperArmX+.15,
 'hover balancing guard must differ from stationary floor arms');
assert(cruise.spineX>hover.spineX+.20,
 'forward flying torso must look visibly aerodynamic vs hovering');
assert(cruise.leftThighX<hover.leftThighX-.13,
 'cruising legs must trail rather than walking upright in the air');
assert(cruise.rightThighX<hover.rightThighX-.25,
 'both cruising legs must change toward airborne travel');
assert(cruise.leftKneeX<hover.leftKneeX-.18,
 'cruise leg posture must not remain in hovering knee fold');
assert(rise.leftKneeX<hover.leftKneeX&&
 descend.leftKneeX>hover.leftKneeX,
 'rise extends knees while descent cushions them');
assert(left.spineZ*right.spineZ<0,'left/right air turns bank in opposite directions');
assert(Math.abs(left.spineZ)<.07,'controlled bank stays subtle');
for(const fps of [30,60,120]){
 let current=0,prior=F(0,0,0);
 for(let frame=0;frame<fps*4;frame++){
  const time=frame/fps;
  const speed=time<1?0:time<2?3.0:time<3?6.2:1.0;
  current=V100.flightStep(current,V100.flightWeight(speed),1/fps);
  const next=F(current,0,0);
  for(const key of ['hipsX','spineX','chestX','neckX','spineZ',
   'leftShoulderX','rightShoulderX','leftUpperArmX','rightUpperArmX',
   'leftThighX','rightThighX','leftKneeX','rightKneeX']){
   assert(Number.isFinite(next[key]));
   assert(Math.abs(next[key]-prior[key])<.105,
    'hover/cruise must flow without 30fps visible snap: '+key);
  }
  prior=next;
 }
}
const owner=read('js/v100-pose-authority.js'),boot=read('js/v66-game-boot.js'),
 html=read('index.html');
assert(owner.includes("params.get('flightStyle')==='airborne'"));
assert(owner.includes("params.get('jumpKnees')==='guided'")||
 owner.includes(".get('jumpKnees')==='guided'"));
assert(owner.includes("if(st.guidedLaunchLegs.length===6&&next==='jump'&&i>=14)"));
assert(owner.includes('const fade=smooth((st.elapsed-.060)/.170)'));
assert(owner.includes("const lower=joint===knee?0:-lim"));
assert(owner.includes("joint.quaternion.multiply(q.setFromAxisAngle(axis,change))"));
assert(owner.includes("largest=guidedPrepFeet(THREE,this.vrmRig,st.prepFeet,status)"));
assert(boot.includes("e.src+='&airborne=114'"));
assert(boot.includes("V114 airborne loading"));
assert(/SKY CLASH · BUILD V11[45]/.test(html));
assert(/js\/v66-game-boot\.js\?v=820&fix=11[56]/.test(html));
assert(/BUILD V11[45]/.test(read('animation-studio.html')));
console.log('PASS V114: clearly airborne hover and cruise, directional rise/descent, 30/60/120 FPS fluidity, hinge-only knee guidance and protected launch transition');
