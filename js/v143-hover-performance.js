/* Sky Clash V143: hand-authored secondary WHOLE-BODY flight performance.
 * Nine artist-directed keyed poses overlay the accepted V142 silhouette.
 * Kairo keeps one folded knee and one hanging leg while pelvis/chest
 * shift, upper arms follow and wrists arrive late. This is a deterministic
 * skeletal animation sampled by the EXISTING V100 flight pose owner.
 * No root translation, extra frame callback, foot IK, or physics edit.
 */
(function(root){
 'use strict';
 const base=root.SkyClashV142HoverKeys||
  (typeof module!=='undefined'&&module.exports?
   require('./v142-hover-keyframes.js'):null);
 if(!base)throw Error('V143 requires V142 approved flight keyframes');
 const duration=base.duration;
 // Front-facing goal values are in world-space directions, NOT guessed
 // VRM0 local axes. Angles in radians. Each key is authored independently.
 // Pelvis leads, chest follows, elbows drift and hands settle last.
 const keys=[
 {t:0,bodyF:0,bodyS:0,chestF:0,chestS:0,
  hipsX:0,spineX:0,chestX:0,neckX:0,hipsZ:0,spineZ:0,chestZ:0,
  leftKnee:0,rightKnee:0,leftShin:0,rightShin:0,
  leftElbowF:0,leftElbowO:0,leftElbowY:0,rightElbowF:0,rightElbowO:0,rightElbowY:0,
  leftHandF:0,leftHandO:0,leftHandY:0,rightHandF:0,rightHandO:0,rightHandY:0},
 {t:.58,bodyF:.015,bodyS:.014,chestF:-.009,chestS:-.015,
  hipsX:-.006,spineX:-.003,chestX:-.004,neckX:.001,hipsZ:.004,spineZ:-.007,chestZ:-.004,
  leftKnee:.010,rightKnee:-.007,leftShin:-.03,rightShin:.012,
  leftElbowF:.045,leftElbowO:.035,leftElbowY:.020,rightElbowF:-.022,rightElbowO:-.010,rightElbowY:-.005,
  leftHandF:.040,leftHandO:-.012,leftHandY:.016,rightHandF:-.010,rightHandO:.002,rightHandY:-.004},
 {t:1.17,bodyF:.065,bodyS:.031,chestF:.016,chestS:-.019,
  hipsX:.004,spineX:-.014,chestX:.003,neckX:-.004,hipsZ:.014,spineZ:-.015,chestZ:-.012,
  leftKnee:.035,rightKnee:-.015,leftShin:-.05,rightShin:.025,
  leftElbowF:.100,leftElbowO:.080,leftElbowY:.040,rightElbowF:-.044,rightElbowO:-.025,rightElbowY:-.010,
  leftHandF:.100,leftHandO:-.045,leftHandY:.032,rightHandF:-.045,rightHandO:.018,rightHandY:-.016},
 {t:1.76,bodyF:.050,bodyS:.022,chestF:.038,chestS:-.008,
  hipsX:.011,spineX:-.006,chestX:.015,neckX:-.009,hipsZ:.011,spineZ:-.006,chestZ:-.012,
  leftKnee:.050,rightKnee:.005,leftShin:-.07,rightShin:.045,
  leftElbowF:.085,leftElbowO:.070,leftElbowY:.025,rightElbowF:-.005,rightElbowO:.005,rightElbowY:.010,
  leftHandF:.090,leftHandO:-.035,leftHandY:.020,rightHandF:-.010,rightHandO:.010,rightHandY:.004},
 {t:2.40,bodyF:-.005,bodyS:-.020,chestF:.052,chestS:.017,
  hipsX:.006,spineX:.013,chestX:.015,neckX:-.003,hipsZ:-.010,spineZ:.014,chestZ:.001,
  leftKnee:.055,rightKnee:.030,leftShin:.015,rightShin:.008,
  leftElbowF:.020,leftElbowO:0,leftElbowY:-.015,rightElbowF:.060,rightElbowO:.055,rightElbowY:.035,
  leftHandF:.030,leftHandO:.012,leftHandY:-.017,rightHandF:.060,rightHandO:-.018,rightHandY:.020},
 {t:2.99,bodyF:-.050,bodyS:-.038,chestF:.018,chestS:.030,
  hipsX:-.013,spineX:.016,chestX:-.002,neckX:.004,hipsZ:-.015,spineZ:.025,chestZ:.014,
  leftKnee:.015,rightKnee:.020,leftShin:.050,rightShin:-.025,
  leftElbowF:-.045,leftElbowO:-.035,leftElbowY:-.035,rightElbowF:.095,rightElbowO:.070,rightElbowY:.040,
  leftHandF:-.050,leftHandO:.034,leftHandY:-.038,rightHandF:.110,rightHandO:-.050,rightHandY:.046},
 {t:3.61,bodyF:-.040,bodyS:-.021,chestF:-.015,chestS:.020,
  hipsX:-.008,spineX:.007,chestX:-.015,neckX:.008,hipsZ:-.008,spineZ:.010,chestZ:.013,
  leftKnee:-.020,rightKnee:-.008,leftShin:.015,rightShin:-.020,
  leftElbowF:-.045,leftElbowO:-.015,leftElbowY:-.015,rightElbowF:.030,rightElbowO:.020,rightElbowY:.010,
  leftHandF:-.050,leftHandO:.012,leftHandY:-.015,rightHandF:.050,rightHandO:-.023,rightHandY:.015},
 {t:4.12,bodyF:-.012,bodyS:-.004,chestF:-.012,chestS:.006,
  hipsX:-.002,spineX:-.002,chestX:-.006,neckX:.004,hipsZ:.002,spineZ:0,chestZ:.003,
  leftKnee:-.008,rightKnee:0,leftShin:-.008,rightShin:-.006,
  leftElbowF:-.005,leftElbowO:0,leftElbowY:0,rightElbowF:.008,rightElbowO:0,rightElbowY:0,
  leftHandF:-.010,leftHandO:.003,leftHandY:.002,rightHandF:.008,rightHandO:-.004,rightHandY:0}
 ];
 // The final pose is exactly the first pose for a seamless loop.
 keys.push({...keys[0],t:duration});
 const channels=Object.keys(keys[0]).filter(c=>c!=='t');
 function sample(time){
  const t=((Number.isFinite(time)?time:0)%duration+duration)%duration;
  let i=0;while(i<keys.length-2&&keys[i+1].t<=t)i++;
  const a=keys[i],b=keys[i+1],
   before=keys[(i+keys.length-2)%(keys.length-1)],
   after=keys[(i+2)%(keys.length-1)];
  const pTime=before.t>=a.t?before.t-duration:before.t,
   nTime=after.t<=b.t?after.t+duration:after.t;
  const h=b.t-a.t,u=(t-a.t)/h,u2=u*u,u3=u2*u;
  const source=base.sample(time),delta={};
  for(const c of channels){
   const m0=(b[c]-before[c])/(b.t-pTime),
    m1=(after[c]-a[c])/(nTime-a.t);
   // Cubic Hermite with neighbor-safe overshoot bound.
   const v=(2*u3-3*u2+1)*a[c]+(u3-2*u2+u)*h*m0+
    (-2*u3+3*u2)*b[c]+(u3-u2)*h*m1;
   delta[c]=Math.max(Math.min(before[c],a[c],b[c],after[c]),
     Math.min(Math.max(before[c],a[c],b[c],after[c]),v));
   if(Object.prototype.hasOwnProperty.call(source,c))source[c]+=delta[c];
  }
  // Normalized real-world posture goals for pelvis and chest solvers.
  source.bodyF=delta.bodyF;
  source.bodyS=delta.bodyS;
  source.chestF=delta.chestF;
  source.chestS=delta.chestS;
  return source;
 }
 const api=Object.freeze({version:143,duration,keys,channels,sample});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV143HoverKeys=api;
})(typeof window!=='undefined'?window:globalThis);
