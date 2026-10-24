/* V126: independent, reversible powered flight pose quality / continuity. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const V100=require('../js/v100-pose-authority.js');
const F=V100.v126FlightPose;
assert.equal(typeof F,'function');
const hover=F(0,0,0,0),cruise=F(1,0,0,0);
const rise=F(.7,7,0,0),drop=F(.7,-7,0,0);
const bankL=F(.7,0,-6.2,0),bankR=F(.7,0,6.2,0);
const legacyHover=V100.airborneFlightPose(0,0,0);
const legacyCruise=V100.airborneFlightPose(1,0,0);
// The actual requested design is Green Lantern-style combat levitation:
// upright + composed even while moving normally across a SMALL arena.
// Strong prone travel angles belong to separate Boost, never this pose.
const pitch=pose=>pose.hipsX+pose.spineX+pose.chestX;
assert(hover.leftKneeX>.43&&hover.rightKneeX>.30,
 'hover must visibly suspend a relaxed asymmetrical knee stance');
assert(Math.abs(hover.leftKneeX-hover.rightKneeX)>.12,
 'should not resemble both straight planted floor legs');
assert(Math.abs(pitch(hover))<.14,'still hovering should look naturally upright');
assert(Math.abs(pitch(cruise))<.23,
 'ordinary forward flight must stay vertical/ready to fight, not Superman-prone');
assert(Math.abs(pitch(cruise))<Math.abs(pitch(legacyCruise))*.55,
 'V126 must measurably reduce V114 horizontal body pitch');
assert(cruise.spineX>hover.spineX+.06&&cruise.spineX<.11,
 'moving should only tip the torso gently forward');
assert(cruise.leftKneeX>hover.leftKneeX-.10,
 'legs must not shoot straight backward during short-range travel');
assert(cruise.leftKneeX<hover.leftKneeX,
 'some trailing lower-leg response should signal normal movement');
assert(hover.leftUpperArmX>.18&&hover.rightUpperArmX>.17,
 'keep recognizable compact fighting readiness');
assert(cruise.leftUpperArmX<.32&&cruise.rightUpperArmX<.30,
 'do not animate both arms into a stiff forward airplane pose');
assert(rise.leftKneeX<drop.leftKneeX,
 'rise extends suspended legs subtly, descend braces gently');
assert(bankL.spineZ*bankR.spineZ<0&&bankL.chestZ*bankR.chestZ<0,
 'strafe banks symmetrically without losing target-facing torso');
assert(Math.abs(bankL.spineZ)<.056&&Math.abs(bankR.chestZ)<.025,
 'mini-arena turns must not tilt the whole fighter');
for(const t of [0,.13,.57,1.24]){
 const neutral=F(0,0,0,t);
 assert(Math.abs(pitch(neutral))<.14);
 assert(Math.abs(neutral.leftUpperArmX-F(0,0,0,0).leftUpperArmX)<.025,
  'hover life should be subtle, not an unintended swaying attack pose');
}
assert(Math.abs(legacyHover.leftKneeX-hover.leftKneeX)<.16,
 'preserve the useful relaxed V114 hover knee motif');
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
console.log('PASS V126 revised: upright Green Lantern combat hover/cruise, restrained movement lean, compact guard, 30/60/120fps smoothing and Boost isolation');
