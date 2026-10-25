/* Sky Clash V142 — authored, cyclic, RIG-SPACE hover animation.
 * DATA rather than a procedural sine-wave / another Fighter.animate wrapper.
 * Targets are world-facing joint directions, not VRM0 local Euler guesses.
 * The existing V100 pose authority samples them and resolves Kairo's
 * normalized humanoid in the ONE final airborne pose pass.
 * This clip has NO world/root translation: flight physics remains the owner.
 */
(function(root){
 'use strict';
 const duration=4.6;
 // Each hand-authored row is a FULL character performance key:
 // pelvic/chest counter-motion; asymmetric knees and trailing calves;
 // dangling toes; elbows opening away from ribs; soft wrists under elbows.
 // Left/right rhythms deliberately overlap rather than mirror.
 // Angular torso values are radians. Limb directions are dimensionless
 // normalized world-forward/world-out/world-up vectors in the V100 IK.
 const keys=[
  {t:0.00, hipsX:-.016,spineX:-.020,chestX:-.014,neckX:.014,hipsZ:.006,spineZ:.004,chestZ:-.004,
   leftKnee:.54,rightKnee:.31,leftShin:.53,rightShin:.43,leftToe:3.2,rightToe:3.4,
   leftElbowF:.20,leftElbowO:.43,leftElbowY:-.88,rightElbowF:.11,rightElbowO:.38,rightElbowY:-.91,
   leftHandF:.26,leftHandO:-.09,leftHandY:-.83,rightHandF:.20,rightHandO:-.09,rightHandY:-.88},
  {t:.58, hipsX:-.007,spineX:-.015,chestX:-.008,neckX:.014,hipsZ:.011,spineZ:-.005,chestZ:-.008,
   leftKnee:.62,rightKnee:.30,leftShin:.57,rightShin:.42,leftToe:3.6,rightToe:3.1,
   leftElbowF:.22,leftElbowO:.46,leftElbowY:-.86,rightElbowF:.11,rightElbowO:.36,rightElbowY:-.93,
   leftHandF:.29,leftHandO:-.10,leftHandY:-.82,rightHandF:.18,rightHandO:-.08,rightHandY:-.87},
  {t:1.17,hipsX:.001,spineX:-.006,chestX:-.001,neckX:.009,hipsZ:.011,spineZ:-.007,chestZ:-.012,
   leftKnee:.59,rightKnee:.34,leftShin:.53,rightShin:.46,leftToe:3.3,rightToe:3.4,
   leftElbowF:.19,leftElbowO:.43,leftElbowY:-.89,rightElbowF:.15,rightElbowO:.40,rightElbowY:-.88,
   leftHandF:.26,leftHandO:-.09,leftHandY:-.85,rightHandF:.22,rightHandO:-.08,rightHandY:-.84},
  {t:1.76,hipsX:.004,spineX:.002,chestX:.005,neckX:.006,hipsZ:.004,spineZ:-.001,chestZ:-.006,
   leftKnee:.51,rightKnee:.42,leftShin:.48,rightShin:.54,leftToe:3.0,rightToe:3.7,
   leftElbowF:.17,leftElbowO:.39,leftElbowY:-.92,rightElbowF:.18,rightElbowO:.43,rightElbowY:-.85,
   leftHandF:.22,leftHandO:-.08,leftHandY:-.87,rightHandF:.26,rightHandO:-.09,rightHandY:-.82},
  {t:2.40,hipsX:-.004,spineX:-.004,chestX:.002,neckX:.011,hipsZ:-.005,spineZ:.006,chestZ:.004,
   leftKnee:.46,rightKnee:.45,leftShin:.46,rightShin:.56,leftToe:3.4,rightToe:3.8,
   leftElbowF:.17,leftElbowO:.40,leftElbowY:-.90,rightElbowF:.19,rightElbowO:.45,rightElbowY:-.84,
   leftHandF:.22,leftHandO:-.08,leftHandY:-.86,rightHandF:.27,rightHandO:-.10,rightHandY:-.81},
  {t:2.99,hipsX:-.014,spineX:-.014,chestX:-.009,neckX:.016,hipsZ:-.010,spineZ:.009,chestZ:.008,
   leftKnee:.48,rightKnee:.39,leftShin:.47,rightShin:.50,leftToe:3.6,rightToe:3.5,
   leftElbowF:.19,leftElbowO:.42,leftElbowY:-.88,rightElbowF:.15,rightElbowO:.43,rightElbowY:-.86,
   leftHandF:.25,leftHandO:-.09,leftHandY:-.84,rightHandF:.24,rightHandO:-.09,rightHandY:-.84},
  {t:3.61,hipsX:-.020,spineX:-.024,chestX:-.016,neckX:.017,hipsZ:-.003,spineZ:.008,chestZ:.003,
   leftKnee:.53,rightKnee:.33,leftShin:.52,rightShin:.45,leftToe:3.3,rightToe:3.3,
   leftElbowF:.20,leftElbowO:.44,leftElbowY:-.87,rightElbowF:.12,rightElbowO:.40,rightElbowY:-.89,
   leftHandF:.27,leftHandO:-.10,leftHandY:-.82,rightHandF:.21,rightHandO:-.09,rightHandY:-.86},
  {t:4.12,hipsX:-.019,spineX:-.024,chestX:-.018,neckX:.016,hipsZ:.003,spineZ:.006,chestZ:0,
   leftKnee:.55,rightKnee:.31,leftShin:.53,rightShin:.44,leftToe:3.1,rightToe:3.4,
   leftElbowF:.21,leftElbowO:.44,leftElbowY:-.87,rightElbowF:.11,rightElbowO:.39,rightElbowY:-.90,
   leftHandF:.27,leftHandO:-.09,leftHandY:-.83,rightHandF:.20,rightHandO:-.09,rightHandY:-.87},
  {t:duration, hipsX:-.016,spineX:-.020,chestX:-.014,neckX:.014,hipsZ:.006,spineZ:.004,chestZ:-.004,
   leftKnee:.54,rightKnee:.31,leftShin:.53,rightShin:.43,leftToe:3.2,rightToe:3.4,
   leftElbowF:.20,leftElbowO:.43,leftElbowY:-.88,rightElbowF:.11,rightElbowO:.38,rightElbowY:-.91,
   leftHandF:.26,leftHandO:-.09,leftHandY:-.83,rightHandF:.20,rightHandO:-.09,rightHandY:-.88}
 ];
 const channels=Object.keys(keys[0]).filter(k=>k!=='t');
 const interpolate=(v0,v1,m0,m1,u,h)=>{
  const u2=u*u,u3=u2*u;
  return (2*u3-3*u2+1)*v0+(u3-2*u2+u)*h*m0+
   (-2*u3+3*u2)*v1+(u3-u2)*h*m1;
 };
 // Periodic cubic Hermite sampling produces zero positional and tangent
 // seams, unlike a chain of smoothsteps that pauses at every pose key.
 function sample(time){
  const t=((Number.isFinite(time)?time:0)%duration+duration)%duration;
  let i=0;while(i<keys.length-2&&keys[i+1].t<=t)i++;
  const a=keys[i],b=keys[i+1],previous=keys[(i+keys.length-2)%(keys.length-1)],
   next=keys[(i+2)%(keys.length-1)];
  const pt=previous.t>=a.t?previous.t-duration:previous.t,
   nt=next.t<=b.t?next.t+duration:next.t;
  const h=b.t-a.t,u=(t-a.t)/h,pose={};
  for(const c of channels){
   const m0=(b[c]-previous[c])/(b.t-pt);
   const m1=(next[c]-a[c])/(nt-a.t);
   // Avoid spline overshoot exceeding authored envelope on joint goals.
   pose[c]=Math.max(Math.min(a[c],b[c],previous[c],next[c]),
    Math.min(Math.max(a[c],b[c],previous[c],next[c]),
     interpolate(a[c],b[c],m0,m1,u,h)));
  }
  return pose;
 }
 const api=Object.freeze({version:142,duration,keys,channels,sample});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV142HoverKeys=api;
})(typeof window!=='undefined'?window:globalThis);
