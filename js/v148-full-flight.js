/* Sky Clash V148 — ONE coordinated full-body flight choreography.
 * Public V147's forward/back-only travel looked rigid. This is an
 * intentionally more expressive 3D skeletal performance for ALL axes:
 * forward, retreat, left/right strafe, diagonals, turning/banking,
 * launch/brake and entering/leaving fast flight.
 *
 * Hand-authored timed poses feed the EXISTING V100 final VRM0 pose owner.
 * No new render/update loop, root motion, physics or camera overrides.
 * Neutral flight remains V146/V144 EXACTLY.
 */
(function(root){
 'use strict';
 const prior=root.SkyClashV147Horizontal||
  (typeof module!=='undefined'&&module.exports?
    require('./v147-horizontal-flight.js'):null);
 const springSource=root.SkyClashV146Vertical||
  (typeof module!=='undefined'&&module.exports?
    require('./v146-vertical-followthrough.js'):null);
 if(!prior||!springSource)throw Error('V148 needs V147 and V146 flight libraries');
 const duration=4.6;
 // Direction templates encode Kairo's visible choreography in 3D:
 // dynamic pelvis/chest opposition, drifting shoulders, knees, shins,
 // elbows and curved wrists. These are artistic joint GOALS, not feet-
 // locking, root rotations or input commands.
 const directions={
  forward:{
   bodyF:.105,chestF:.138,hipsX:.025,spineX:.035,chestX:.024,neckX:-.016,
   leftKnee:.045,rightKnee:-.016,leftShin:.028,rightShin:.010,
   leftElbowF:-.078,rightElbowF:-.060,leftElbowO:.065,rightElbowO:.045,
   leftElbowY:-.038,rightElbowY:-.022,leftHandF:-.140,rightHandF:-.113,
   leftHandO:.026,rightHandO:.013,leftHandY:-.035,rightHandY:-.020},
  backward:{
   bodyF:-.150,chestF:-.128,hipsX:-.045,spineX:-.042,chestX:-.029,neckX:.025,
   leftKnee:.073,rightKnee:.018,leftShin:.069,rightShin:-.035,
   leftElbowF:.112,rightElbowF:.078,leftElbowO:.085,rightElbowO:.065,
   leftElbowY:.038,rightElbowY:.026,leftHandF:.155,rightHandF:.120,
   leftHandO:-.072,rightHandO:-.060,leftHandY:.036,rightHandY:.023},
  left:{
   bodyS:-.125,chestS:.090,hipsZ:.043,spineZ:-.063,chestZ:-.047,
   leftKnee:.055,rightKnee:-.029,leftShin:.065,rightShin:-.015,
   leftElbowF:.040,rightElbowF:-.058,leftElbowO:.128,rightElbowO:.055,
   leftElbowY:.052,rightElbowY:-.027,leftHandF:.072,rightHandF:-.085,
   leftHandO:-.095,rightHandO:.027,leftHandY:.050,rightHandY:-.022},
  right:{
   bodyS:.125,chestS:-.090,hipsZ:-.043,spineZ:.063,chestZ:.047,
   leftKnee:-.021,rightKnee:.045,leftShin:-.027,rightShin:.024,
   leftElbowF:-.055,rightElbowF:.045,leftElbowO:.055,rightElbowO:.164,
   leftElbowY:-.025,rightElbowY:.052,leftHandF:-.082,rightHandF:.070,
   leftHandO:.029,rightHandO:-.090,leftHandY:-.021,rightHandY:.050}
 };
 const turnPose={
  bodyS:.038,chestS:-.055,hipsZ:-.016,spineZ:.044,chestZ:.031,
  leftElbowF:-.018,rightElbowF:.042,
  leftElbowO:.034,rightElbowO:.085,
  leftElbowY:-.012,rightElbowY:.025,
  leftHandF:-.032,rightHandF:.080,
  leftHandO:-.020,rightHandO:-.046,
  leftHandY:-.010,rightHandY:.026,
  leftKnee:-.014,rightKnee:.018
 };
 const momentumPose={
  bodyF:.048,chestF:.060,hipsX:.018,spineX:.024,chestX:.018,
  leftKnee:.026,rightKnee:-.010,leftShin:.030,
  leftElbowF:-.045,rightElbowF:-.038,
  leftHandF:-.071,rightHandF:-.065
 };
 // 6 manually selected beats, not a monotonous fixed direction pose.
 // Pelvis starts each change, chest follows, shoulders and hands lag
 // via a second set of temporal springs below.
 const beats=[
  {t:0,torso:.55,legs:.58,arms:.50,twist:-.25},
  {t:.64,torso:.90,legs:.75,arms:.57,twist:.35},
  {t:1.45,torso:1.12,legs:1.00,arms:.81,twist:.65},
  {t:2.22,torso:.94,legs:1.20,arms:1.15,twist:.12},
  {t:3.28,torso:.73,legs:.91,arms:1.23,twist:-.65},
  {t:3.90,torso:.60,legs:.69,arms:.76,twist:-.35},
  {t:duration,torso:.55,legs:.58,arms:.50,twist:-.25}
 ];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
 const group=k=>/Knee$|Shin$|Toe$/.test(k)?'legs':
  /Elbow|Hand/.test(k)?'arms':'torso';
 const groups={torso:12.3,legs:8.1,arms:5.6};
 function interpolate(keys,time){
  const t=((Number.isFinite(time)?time:0)%duration+duration)%duration;
  let i=0;while(i<keys.length-2&&keys[i+1].t<=t)i++;
  const a=keys[i],b=keys[i+1],
   prev=keys[(i+keys.length-2)%(keys.length-1)],
   next=keys[(i+2)%(keys.length-1)],
   pt=prev.t>=a.t?prev.t-duration:prev.t,
   nt=next.t<=b.t?next.t+duration:next.t,
   h=b.t-a.t,u=(t-a.t)/h,u2=u*u,u3=u2*u,out={};
  for(const k of Object.keys(a).filter(k=>k!=='t')){
   const m0=(b[k]-prev[k])/(b.t-pt),
    m1=(next[k]-a[k])/(nt-a.t);
   const x=(2*u3-3*u2+1)*a[k]+(u3-2*u2+u)*h*m0+
    (-2*u3+3*u2)*b[k]+(u3-u2)*h*m1;
   out[k]=clamp(x,Math.min(a[k],b[k],prev[k],next[k]),
    Math.max(a[k],b[k],prev[k],next[k]));
  }
  return out;
 }
 function createState(){
  const s={};
  for(const part of Object.keys(groups))
   s[part]={f:0,b:0,l:0,r:0,turn:0,fast:0,
    fV:0,bV:0,lV:0,rV:0,turnV:0,fastV:0};
  return {parts:s,lastYaw:null,velocityForward:0,velocitySide:0,
   velocityForwardV:0,velocitySideV:0,
   launch:0,brake:0,launchV:0,brakeV:0,turnRate:0,signedForward:0,
   signedSide:0,worldSpeed:0};
 }
 function step(state,velocityX,velocityZ,yaw,dt,sprinting=false){
  const s=state||createState(),y=Number.isFinite(yaw)?yaw:0,
   f=(Number.isFinite(velocityX)?velocityX:0)*Math.sin(y)+
    (Number.isFinite(velocityZ)?velocityZ:0)*Math.cos(y),
   side=(Number.isFinite(velocityX)?velocityX:0)*Math.cos(y)-
    (Number.isFinite(velocityZ)?velocityZ:0)*Math.sin(y),
   h=clamp(Number.isFinite(dt)?dt:0,0,.065),
   speed=Math.hypot(f,side);
  let delta=s.lastYaw===null?0:y-s.lastYaw;
  delta=Math.atan2(Math.sin(delta),Math.cos(delta));
  s.lastYaw=y;
  // The facing angle belongs entirely to the fighter/game, and the
  // apparent turn follows its physical angular velocity.
  const turn=clamp(delta/Math.max(h,.0001)/4.2,-1,1);
  const signedF=smooth(Math.max(0,(f-.12)/5.68)),
   signedB=smooth(Math.max(0,(-f-.12)/5.68)),
   signedL=smooth(Math.max(0,(-side-.12)/5.68)),
   signedR=smooth(Math.max(0,(side-.12)/5.68)),
   fast=smooth(Math.max(0,(speed-6.0)/5.5));
  for(const part of Object.keys(groups)){
   const p=s.parts[part],omega=groups[part],
    targets={f:signedF,b:signedB,l:signedL,r:signedR,
     turn,fast:sprinting?0:fast};
   for(const k of Object.keys(targets)){
    [p[k],p[k+'V']]=springSource.spring(p[k],p[k+'V'],targets[k],h,omega);
    p[k]=clamp(p[k],k==='turn'?-1:0,1);
   }
  }
  // Body anticipates speeding up, arms ease out of braking and fast
  // flight without any root motion/velocity changes.
  const prevSpeed=Math.hypot(s.velocityForward,s.velocitySide),
   opposing=f*s.velocityForward+side*s.velocitySide< -1,
   speedDelta=clamp((speed-prevSpeed)/Math.max(h,.0001)/16,-1,1);
  [s.launch,s.launchV]=springSource.spring(s.launch,s.launchV,
   Math.max(0,speedDelta),h,10);
  [s.brake,s.brakeV]=springSource.spring(s.brake,s.brakeV,
   Math.max(0,-speedDelta,opposing?1:0),h,8);
  // Velocity memory is filtered for visual response only.
  [s.velocityForward,s.velocityForwardV]=springSource.spring(
   s.velocityForward,s.velocityForwardV,f,h,18);
  [s.velocitySide,s.velocitySideV]=springSource.spring(
   s.velocitySide,s.velocitySideV,side,h,18);
  s.signedForward=f;s.signedSide=side;s.worldSpeed=speed;s.turnRate=turn;
  return s;
 }
 function performance(state,age){
  const pose=interpolate(beats,age),out={};
  const parts=state?.parts||{};
  for(const [name,profile] of Object.entries(directions)){
   const key={forward:'f',backward:'b',left:'l',right:'r'}[name];
   for(const [joint,v] of Object.entries(profile)){
    const groupName=group(joint),p=parts[groupName]||{},weight=p[key]||0;
    const limbBeat=pose[groupName];
    const value=v*limbBeat*weight;
    out[joint]=(out[joint]||0)+value;
   }
  }
  const torso=parts.torso||{},legs=parts.legs||{},arms=parts.arms||{};
  const turn=torso.turn||0,fast=torso.fast||0;
  const motionTwist=pose.twist;
  for(const [joint,v] of Object.entries(turnPose)){
   const p=parts[group(joint)]||{},w=p.turn||0;
   out[joint]=(out[joint]||0)+v*w*(.8+pose[group(joint)]*.28);
  }
  // Actual turn bank transfers through pelvis -> chest -> limbs.
  out.hipsZ=(out.hipsZ||0)-.013*turn*motionTwist;
  out.spineZ=(out.spineZ||0)+.025*turn*motionTwist;
  out.chestZ=(out.chestZ||0)+.024*turn*motionTwist;
  // Forward fast-flight anticipation. No effects during normal hover.
  out.bodyF=(out.bodyF||0)+.065*fast;
  out.chestF=(out.chestF||0)+.082*fast;
  out.leftHandF=(out.leftHandF||0)-.046*(arms.fast||0);
  out.rightHandF=(out.rightHandF||0)-.045*(arms.fast||0);
  // Launch and brake accents, tapered by spring envelopes. A diagonal
  // blends f/r and b/l naturally; it isn't a special animation that
  // snaps over another one.
  const lead=clamp((state?.launch||0)-(state?.brake||0),-1,1);
  for(const [joint,v] of Object.entries(momentumPose)){
   const p=parts[group(joint)]||{},response=p.f||p.b||p.l||p.r||0;
   out[joint]=(out[joint]||0)+v*lead*clamp(response+.16,0,1);
  }
  // No stance modifications when stationary.
  return out;
 }
 const api=Object.freeze({version:148,duration,directions,turnPose,momentumPose,
  beats,interpolate,createState,step,performance});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV148AllFlight=api;
})(typeof window!=='undefined'?window:globalThis);
