/* Sky Clash V153 — forward-pressure streamlined full-body flight.
 * Strong FREE forward input pitches the whole visible Kairo body forward
 * through the ONE V100 pose owner, never the gameplay physics root.
 * V152 calm hover/relaxed arms and V150 guard/Boost/jumps are untouched.
 */
(function(root){
 'use strict';
 const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
 const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
 const damp=(rate,dt)=>1-Math.exp(-rate*clamp(Number.isFinite(dt)?dt:0,0,.06));
 const maxDegrees=62; // from vertical: forceful and streamlined, not fully prone
 function createState(){return {effort:0,target:0,pitchDegrees:0};}
 function step(previous,intent,horizontalSpeed,dt){
  const state=previous||createState(),forward=clamp(intent?.forward||0,0,1),
   side=Math.abs(clamp(intent?.side||0,-1,1)),lock=!!intent?.lock,
   speed=clamp(Number.isFinite(horizontalSpeed)?horizontalSpeed:0,0,100);
  // Lean requires genuine strong FORWARD travel, not free backwards turn,
  // opponent lock-on movement or no-input momentum. Joystick engagement
  // matters more than raw speed; speed prevents a hard pitch while stopped.
  const pressure=smooth((forward-.12)/.88),
   moving=smooth((speed-.65)/3.9);
  state.target=lock?0:pressure*moving*(1-.68*smooth(side));
  state.effort+=(state.target-state.effort)*
   damp(state.target>state.effort?4.7:6.8,dt);
  state.pitchDegrees=maxDegrees*state.effort;
  return state;
 }
 function performance(pose,state){
  if(!pose)return pose;
  const weight=clamp(state?.effort||0,0,1);
  return {...pose,profile:'V153 streamlined whole-body forward flight',
   streamlineWeight:weight,
   streamlineTarget:clamp(state?.target||0,0,1),
   streamlineDegrees:maxDegrees*weight};
 }
 const api=Object.freeze({version:153,maxDegrees,createState,step,performance});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV153Streamline=api;
})(typeof window!=='undefined'?window:globalThis);
