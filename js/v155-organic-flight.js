/* Sky Clash V155 — organic Kairo flight performance and Boost data.
 * Repairs the straight-plank V153: hips lead the flight, chest arches up,
 * one knee stays softly tucked, two shins bend behind the moving body,
 * and bent asymmetric arms have quiet individual follow-through.
 *
 * This module NEVER touches a VRM node, fighter root or game physics.
 * V100 sole normal-flight owner / V72 sole Boost owner consume its targets.
 */
(function(root){
 'use strict';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:0));
 const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
 const damp=(rate,dt)=>1-Math.exp(-rate*clamp(dt,0,.065));
 const blend=(a,b,w)=>a+(b-a)*w;
 const version=155;
 const arch=Object.freeze({pelvisRadians:.88,spineRadians:.59});
 function organic(pose,weight,time){
  const w=clamp(weight,0,1),phase=Number.isFinite(time)?time:0,
   left=Math.sin(phase*1.13+.5),right=Math.sin(phase*.91+1.85);
  const source=pose?.keys||{},keys={...source};
  // Exact quiet-hover preservation: do not add even default limb channels
  // while blend weight is zero (otherwise the old clip's geometry changes).
  if(w===0)return {...pose,keys,
   profile:'V155 arched organic forward flight',
   streamlineWeight:0,flightCurve:0,
   flightCurvePelvisAngle:arch.pelvisRadians,
   flightCurveChestAngle:arch.spineRadians,
   streamlineDegrees:0,flightKneeStyle:'original'};
  // Arms follow the swept-back motion, but NOT as parallel rigid rods.
  // Elbows drop by the rib cage and forearms bend further down/back.
  const arm={
   leftElbowF:-.61+.037*left,leftElbowO:.24+.016*left,
   leftElbowY:-.46+.035*left,
   leftHandF:-.72+.034*Math.sin(phase*.94-.45),
   leftHandO:.07,leftHandY:-.27+.020*left,
   rightElbowF:-.52+.033*right,rightElbowO:.32,
   rightElbowY:-.49+.028*right,
   rightHandF:-.77+.033*Math.sin(phase*.97+.75),
   rightHandO:.10,rightHandY:-.22+.028*right,
   // Unequal thigh and shin targets keep real knees visibly bent;
   // V100 world-solver final curved vector addresses shape, not local axes.
   leftKnee:-.10,rightKnee:-.21,leftShin:.22,rightShin:.26,
   leftToe:.64,rightToe:.79
  };
  for(const [k,value] of Object.entries(arm))
   keys[k]=blend(Number.isFinite(source[k])?source[k]:value,value,w);
  return {...pose,keys,
   profile:'V155 arched organic forward flight',
   streamlineWeight:w,flightCurve:w,
   flightCurvePelvisAngle:arch.pelvisRadians,
   flightCurveChestAngle:arch.spineRadians,
   streamlineDegrees:arch.pelvisRadians*180/Math.PI*w,
   flightKneeStyle:w>.005?'bent-and-trailing':'original'};
 }
 function flightPose(pose,state){
  return organic(pose,clamp(state?.effort||0,0,1),pose?.age||0);
 }
 function createState(){return {ground:0,air:0,groundTarget:0,airTarget:0};}
 function step(state,f,dt){
  const s=state||createState(),active=!!(f?.sprinting&&f?.hp>0&&
   !(f.stun>0||f.punchT>0||f.blocking||f.blockHeld||f.charging||
    f.launched||f.spiked)),horizontal=Math.hypot(f?.vel?.x||0,f?.vel?.z||0),
   moving=smooth((horizontal-1.1)/6.5),flying=!!f?.flying;
  s.groundTarget=active&&!flying?moving:0;
  s.airTarget=active&&flying?moving:0;
  s.ground+=(s.groundTarget-s.ground)*damp(s.groundTarget>s.ground?11:14,dt);
  s.air+=(s.airTarget-s.air)*damp(s.airTarget>s.air?6:12,dt);
  return s;
 }
 function groundMix(s){return clamp(s?.ground||0,0,1);}
 function boostRate(speed){return blend(.95,1.12,smooth((speed-4)/19));}
 function airPose(s,f){
  const w=clamp(s?.air||0,0,1),speed=Math.hypot(f?.vel?.x||0,f?.vel?.z||0);
  const basic={mix:clamp(speed/24,0,1),bank:0,age:f?.t||0,
   rise:clamp((f?.vel?.y||0)/12,0,1),
   descend:clamp(-(f?.vel?.y||0)/12,0,1),
   pelvisGoalF:0,chestGoalF:0,pelvisGoalS:0,chestGoalS:0,
   keys:{
    leftKnee:.14,rightKnee:-.05,leftShin:.27,rightShin:.28,
    leftToe:.75,rightToe:.75,
    leftElbowF:-.37,leftElbowO:.24,leftElbowY:-.53,
    rightElbowF:-.29,rightElbowO:.27,rightElbowY:-.55,
    leftHandF:-.57,leftHandO:.08,leftHandY:-.35,
    rightHandF:-.54,rightHandO:.11,rightHandY:-.31
   }};
  return {...organic(basic,w,f?.t||0),
    boostVisual:'V155 bent streamlined acceleration',boostWeight:w};
 }
 const api=Object.freeze({version,arch,organic,flightPose,createState,step,groundMix,boostRate,airPose});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV155Organic=api;
})(typeof window!=='undefined'?window:globalThis);
