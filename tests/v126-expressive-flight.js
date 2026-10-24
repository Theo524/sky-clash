/* V126: independent, reversible powered flight pose quality / continuity. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const V100=require('../js/v100-pose-authority.js');
const F=V100.v126FlightPose;
assert.equal(typeof F,'function');
const hover=F(0,0,0,0),travel=F(1,0,0,0);
const rise=F(.7,7,0,0),drop=F(.7,-7,0,0);
const bankL=F(.7,0,-6.2,0),bankR=F(.7,0,6.2,0);
const legacyHover=V100.airborneFlightPose(0,0,0);
const legacyTravel=V100.airborneFlightPose(1,0,0);
assert(hover.leftKneeX>.5&&hover.rightKneeX>.4,
 'hover must show suspended asymmetrical knees, not idle planted feet');
assert(Math.abs(hover.leftKneeX-hover.rightKneeX)>.12);
assert(travel.spineX>hover.spineX+.27,
 'cruising should lead with a purposeful, readable torso');
assert(travel.spineX>legacyTravel.spineX+.065);
assert(hover.leftUpperArmX>=legacyHover.leftUpperArmX-.015,
 'preserve the compact fight-ready hover');
assert(travel.leftKneeX<hover.leftKneeX-.20,
 'rear legs should lengthen behind accelerating torso');
assert(rise.leftKneeX<drop.leftKneeX,
 'rise extends suspended limbs, descending collects them');
assert(bankL.spineZ*bankR.spineZ<0&&bankL.chestZ*bankR.chestZ<0,
 'turning should use opposite signs without chest/spine bank disagreement');
assert(Math.abs(bankL.spineZ)<.09&&Math.abs(bankR.chestZ)<.04,
 'bank must be athletic, not an uncontrollable full-body roll');
for(const fps of [30,60,120]){
 const dt=1/fps;
 let mix=0,vertical=0,lateral=0,last=F(0,0,0,0);
 let maxStep=0;
 for(let frame=0;frame<fps*6;frame++){
  const t=frame*dt;
  // Hover -> accelerate -> strafe left -> reverse right ->
  // ascend -> descend -> decelerate back into compact guard.
  const sp=t<.8?0:t<1.8?6.2:t<4.7?5.0:0;
  const targetVertical=t<2.4?0:t<3.0?7:t<4?-7:0;
  const targetSide=t<1.8?0:t<2.5?-6.2:t<3.3?6.2:0;
  mix=V100.flightStep(mix,V100.flightWeight(sp),dt);
  vertical=V100.flightStep(vertical,targetVertical,dt);
  lateral=V100.flightStep(lateral,targetSide,dt);
  const now=F(mix,vertical,lateral,t);
  for(const name of [
   'hipsX','spineX','chestX','neckX','spineZ','chestZ',
   'leftUpperArmX','rightUpperArmX','leftLowerArmX','rightLowerArmX',
   'leftThighX','rightThighX','leftKneeX','rightKneeX',
   'leftAnkleX','rightAnkleX']){
   assert(Number.isFinite(now[name]),name+' must remain finite');
   const step=Math.abs(now[name]-last[name]);
   maxStep=Math.max(maxStep,step);
   assert(step<.115,'30/60/120fps flight pose change is too abrupt: '+name+': '+step);
  }
  last=now;
 }
 assert(mix<.005,'body effort should return smoothly to hover after stopping');
 assert(maxStep>.01,'dynamic directional pose should not stay frozen');
}
const owner=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(owner.includes("params.get('flightPreview')==='v126'"));
assert(owner.includes('st.flightVelocityY=flightStep('));
assert(owner.includes('st.flightSide=flightStep('));
assert(owner.includes('v126?v126FlightPose('));
assert(owner.includes('const maxStep=5.0*Math.max(0,dt)'),
 'V111 last-visible flight quaternion limiter remains intact');
assert(boot.includes('const flightShortcut='));
assert(boot.includes("flags.set('flightStyle','airborne')"));
assert(boot.includes("e.src+='&expressiveFlight=126'"));
console.log('PASS V126: real Kairo flight blend compatibility, 30/60/120 FPS continuous directional intent, readable asymmetrical hover, bank, rise, cruise, descend and return');
