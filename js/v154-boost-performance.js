/* V154 Kairo Boost performance data. Does NOT write VRM bones or wrap
 * Fighter.animate: V72 is the existing sole Boost pose writer.
 * Ground: phase-synchronised blend of two already decoded, licensed clips.
 * Air: authored streamlined world-space targets consumed by V72 via V100's
 * existing geometry helpers while V100 yields the Boost state.
 */
(function(root){
 'use strict';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:0));
 const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
 const damp=(rate,dt)=>1-Math.exp(-rate*clamp(dt,0,.065));
 function createState(){return {ground:0,air:0,groundTarget:0,airTarget:0,phase:0};}
 function step(s,f,dt){
  s=s||createState();
  const active=!!(f?.sprinting&&f?.hp>0&&!(f.stun>0)&&
    !(f.punchT>0)&&!(f.blocking||f.blockHeld||f.charging||f.launched||f.spiked));
  const airborne=!!f?.flying;
  const horizontal=Math.hypot(f?.vel?.x||0,f?.vel?.z||0);
  // No extended boost pose if releasing the button or barely moving.
  const speedWeight=smooth((horizontal-2)/9);
  s.groundTarget=active&&!airborne?speedWeight:0;
  s.airTarget=active&&airborne?speedWeight:0;
  s.ground+=(s.groundTarget-s.ground)*damp(s.groundTarget>s.ground?8:14,dt);
  s.air+=(s.airTarget-s.air)*damp(s.airTarget>s.air?5.2:12,dt);
  s.phase=(s.phase+clamp(dt,0,.065))%100;
  return s;
 }
 function groundMix(s){return .62*clamp(s?.ground||0,0,1);}
 function boostRate(speed){
  // Less accelerated than a frantic 18-key sprite loop; visually
  // deliberate, not a leg-pedalling flicker at high movement speeds.
  return clamp(.94+.24*smooth((speed-6)/17),.90,1.18);
 }
 // Existing V100 world-space solvers use these visible WORLD directions.
 // A substantially inclined spine/pelvis + swept-back forearms/legs reads
 // like airborne energy propulsion rather than running in empty space.
 const keys=Object.freeze({
  leftKnee:.03,rightKnee:-.10,leftShin:.17,rightShin:.22,
  leftToe:1.2,rightToe:1.2,
  leftElbowF:-.92,leftElbowO:.28,leftElbowY:-.24,
  rightElbowF:-.86,rightElbowO:.32,rightElbowY:-.31,
  leftHandF:-.92,leftHandO:-.055,leftHandY:-.20,
  rightHandF:-.90,rightHandO:-.072,rightHandY:-.28
 });
 function airPose(s,f){
  const weight=clamp(s?.air||0,0,1);
  return {
   profile:'V153 streamlined whole-body forward flight',
   // Reuse the V153 pelvis/spine world solver, without inventing local
   // VRM joint axes or touching the collision/gameplay transform.
   streamlineWeight:weight,
   age:f?.t||0,mix:clamp(Math.hypot(f?.vel?.x||0,f?.vel?.z||0)/23,0,1),
   bank:clamp((f?._dashSide||0)*.16,-.15,.15),
   pelvisGoalF:0,chestGoalF:0,pelvisGoalS:0,chestGoalS:0,
   rise:clamp((f?.vel?.y||0)/12,0,1),
   descend:clamp(-(f?.vel?.y||0)/12,0,1),
   keys,
   boostVisual:'V154 authored aerial streamline',boostWeight:weight
  };
 }
 const api=Object.freeze({version:154,createState,step,groundMix,boostRate,airPose,keys});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV154Boost=api;
})(typeof window!=='undefined'?window:globalThis);
