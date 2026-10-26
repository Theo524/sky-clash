/* V150 — joystick-driven flight effort within the existing V100 pose owner.
 * No new animate wrapper, root rotation, controller, collision or physics.
 * Local directional effort comes from *input*; velocity only informs start/
 * brake follow-through. V149's drifting knee/leg performance stays underneath.
 * Free-camera backwards input is a TURN (not a retreat); actual opponent
 * lock-on is the only time to use the backward combat counterbalance.
 */
(function(root){
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const smooth=n=>{const x=clamp(n,0,1);return x*x*(3-2*x);};
 const damp=(rate,dt)=>1-Math.exp(-rate*clamp(dt,0,.06));
 function createState(){
  return {forward:0,retreat:0,side:0,legF:0,legB:0,legSide:0,
   armF:0,armB:0,armSide:0,launch:0,brake:0,
   speed:0,lock:false,stick:0};
 }
 function step(previous,intentX,intentZ,velocityX,velocityZ,yaw,locked,dt){
  const s=previous||createState(),a=Number.isFinite(yaw)?yaw:0,
   x=Number.isFinite(intentX)?intentX:0,
   z=Number.isFinite(intentZ)?intentZ:0,
   vx=Number.isFinite(velocityX)?velocityX:0,
   vz=Number.isFinite(velocityZ)?velocityZ:0,
   h=clamp(Number.isFinite(dt)?dt:0,0,.06),
   magnitude=clamp(Math.hypot(x,z),0,1),
   localForward=x*Math.sin(a)+z*Math.cos(a),
   localSide=x*Math.cos(a)-z*Math.sin(a),
   effort=magnitude<.055?0:smooth((magnitude-.055)/.945),
   front=effort*smooth(localForward/Math.max(magnitude,.0001)),
   // Combat retreat is deliberately impossible in free camera.
   back=locked?effort*smooth(-localForward/Math.max(magnitude,.0001)):0,
   side=effort*clamp(localSide/Math.max(magnitude,.0001),-1,1),
   speed=Math.hypot(vx,vz),
   change=h>0?(speed-s.speed)/h:0;
  // Rate-limited, with the chest responding before the dangling feet and
  // loose forearms. 30/60/120 fps result in comparable physical timing.
  s.forward+=(front-s.forward)*damp(11,h);
  s.retreat+=(back-s.retreat)*damp(11,h);
  s.side+=(side-s.side)*damp(10,h);
  s.legF+=(front-s.legF)*damp(7.1,h);
  s.legB+=(back-s.legB)*damp(7.1,h);
  s.legSide+=(side-s.legSide)*damp(6.8,h);
  s.armF+=(front-s.armF)*damp(5.4,h);
  s.armB+=(back-s.armB)*damp(5.4,h);
  s.armSide+=(side-s.armSide)*damp(5.2,h);
  // Momentum is ONLY visual, and vanishes when the stick is released.
  const launch=effort*clamp(change/28,0,.7),
   brake=effort*clamp(-change/28,0,.6);
  s.launch+=(launch-s.launch)*damp(7,h);
  s.brake+=(brake-s.brake)*damp(6,h);
  s.speed=speed;s.lock=!!locked;s.stick=magnitude;
  return s;
 }
 function performance(s,age=0){
  if(!s)return {bodyF:0,chestF:0};
  const f=s.forward||0,b=s.retreat||0,side=s.side||0,
   lf=s.legF||0,lb=s.legB||0,ls=s.legSide||0,
   af=s.armF||0,ab=s.armB||0,as=s.armSide||0,
   pulse=Math.sin(age*1.32),lag=Math.sin(age*1.32-.85),
   launch=s.launch||0,brake=s.brake||0;
  // At full stick, these incremental forward lean goals raise the V149
  // forward hover to an athletic roughly 10–15 degree tendency rather
  // than rigidly tilting the physics root or forcing a Superman dive.
  return {
   bodyF:.073*f-.047*b+.019*launch-.018*brake,
   chestF:.084*f-.035*b+.024*launch-.015*brake,
   bodyS:.025*side,chestS:-.020*side,
   hipsX:.026*f-.020*b+.008*launch,
   spineX:.030*f-.016*b+.010*launch-.008*brake,
   chestX:.022*f-.009*b+.007*launch,
   neckX:-.017*f+.008*b,
   hipsZ:.010*side,spineZ:.015*side,chestZ:.009*side,
   // Both legs stay suspended with V149's bent/long silhouette; knees
   // and shins lag the torso and subtly counter-drift in the air.
   leftKnee:.045*lf+.022*lb+.012*ls+.019*lf*pulse,
   rightKnee:.016*lf+.021*lb-.009*ls+.013*lf*lag,
   leftShin:.068*lf+.042*lb+.013*ls+.025*lf*lag,
   rightShin:.048*lf+.028*lb-.010*ls+.016*lf*pulse,
   leftElbowF:-.052*af+.053*ab+.014*as+.016*af*lag,
   rightElbowF:-.064*af+.034*ab-.018*as+.013*af*pulse,
   leftHandF:-.085*af+.060*ab+.024*as+.020*af*lag,
   rightHandF:-.074*af+.051*ab-.022*as+.017*af*pulse,
   leftElbowO:.018*af+.027*ab+.025*as,
   rightElbowO:.025*af+.021*ab-.023*as,
   leftHandO:.011*af-.017*ab-.014*as,
   rightHandO:.013*af-.014*ab+.018*as
  };
 }
 const api=Object.freeze({version:150,createState,step,performance});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV150Flight=api;
})(typeof window!=='undefined'?window:globalThis);
