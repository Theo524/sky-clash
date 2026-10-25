/* Sky Clash V145: authored ascent and descent performances.
 * Overlay, not replacement. V144 still owns the exact neutral hover
 * silhouette, natural arms, and 4.6s whole-body idle performance.
 * No world-root translation, input changes, new pose writer, or physics.
 * World-space humanoid joint aims remain in the existing V100 owner.
 */
(function(root){
 'use strict';
 const duration=4.6;
 // Five authored performance keys per direction; the last wraps to the
 // first with the same value and velocity. Units: normalized world-facing
 // anatomical direction deltas, torso rotations in radians.
 // Rising: lift chest and knees into the updraft, hands stay down/soft.
 // Falling: slightly open arms and extend the hanging leg to balance.
 // Never collapse back into a two-legged crouch or an arm flight-guard.
 const ascend=[
 {t:0,bodyF:-.045,chestF:-.040,hipsX:-.024,spineX:-.035,chestX:-.026,neckX:.012,
  leftKnee:.080,rightKnee:.060,leftShin:.060,rightShin:.050,
  leftElbowF:.006,rightElbowF:.012,leftElbowO:.045,rightElbowO:.045,
  leftElbowY:.055,rightElbowY:.055,leftHandF:.020,rightHandF:.015,
  leftHandO:-.018,rightHandO:-.014,leftHandY:.045,rightHandY:.045},
 {t:1.15,bodyF:-.072,chestF:-.060,hipsX:-.037,spineX:-.048,chestX:-.033,neckX:.014,
  leftKnee:.155,rightKnee:.105,leftShin:.110,rightShin:.075,
  leftElbowF:.015,rightElbowF:.018,leftElbowO:.075,rightElbowO:.062,
  leftElbowY:.085,rightElbowY:.070,leftHandF:.025,rightHandF:.023,
  leftHandO:-.025,rightHandO:-.017,leftHandY:.070,rightHandY:.060},
 {t:2.30,bodyF:-.065,chestF:-.055,hipsX:-.034,spineX:-.041,chestX:-.029,neckX:.012,
  leftKnee:.140,rightKnee:.095,leftShin:.090,rightShin:.065,
  leftElbowF:.016,rightElbowF:.018,leftElbowO:.070,rightElbowO:.067,
  leftElbowY:.078,rightElbowY:.075,leftHandF:.030,rightHandF:.027,
  leftHandO:-.025,rightHandO:-.021,leftHandY:.064,rightHandY:.068},
 {t:3.45,bodyF:-.050,chestF:-.045,hipsX:-.028,spineX:-.037,chestX:-.025,neckX:.011,
  leftKnee:.095,rightKnee:.070,leftShin:.065,rightShin:.055,
  leftElbowF:.012,rightElbowF:.015,leftElbowO:.055,rightElbowO:.055,
  leftElbowY:.060,rightElbowY:.066,leftHandF:.023,rightHandF:.024,
  leftHandO:-.022,rightHandO:-.020,leftHandY:.050,rightHandY:.053},
 {t:duration,bodyF:-.045,chestF:-.040,hipsX:-.024,spineX:-.035,chestX:-.026,neckX:.012,
  leftKnee:.080,rightKnee:.060,leftShin:.060,rightShin:.050,
  leftElbowF:.006,rightElbowF:.012,leftElbowO:.045,rightElbowO:.045,
  leftElbowY:.055,rightElbowY:.055,leftHandF:.020,rightHandF:.015,
  leftHandO:-.018,rightHandO:-.014,leftHandY:.045,rightHandY:.045}
 ];
 const descend=[
 {t:0,bodyF:.038,chestF:.026,hipsX:.012,spineX:.017,chestX:.008,neckX:-.010,
  leftKnee:-.070,rightKnee:-.015,leftShin:-.070,rightShin:-.060,
  leftElbowF:-.006,rightElbowF:-.013,leftElbowO:.060,rightElbowO:.070,
  leftElbowY:.030,rightElbowY:.038,leftHandF:.065,rightHandF:.060,
  leftHandO:-.055,rightHandO:-.055,leftHandY:.025,rightHandY:.030},
 {t:1.15,bodyF:.072,chestF:.053,hipsX:.019,spineX:.034,chestX:.025,neckX:-.016,
  leftKnee:-.115,rightKnee:-.035,leftShin:-.100,rightShin:-.075,
  leftElbowF:-.015,rightElbowF:-.025,leftElbowO:.125,rightElbowO:.115,
  leftElbowY:.050,rightElbowY:.056,leftHandF:.105,rightHandF:.085,
  leftHandO:-.085,rightHandO:-.075,leftHandY:.045,rightHandY:.048},
 {t:2.30,bodyF:.085,chestF:.064,hipsX:.027,spineX:.038,chestX:.030,neckX:-.018,
  leftKnee:-.145,rightKnee:-.045,leftShin:-.125,rightShin:-.092,
  leftElbowF:-.022,rightElbowF:-.029,leftElbowO:.138,rightElbowO:.140,
  leftElbowY:.060,rightElbowY:.061,leftHandF:.125,rightHandF:.120,
  leftHandO:-.085,rightHandO:-.080,leftHandY:.057,rightHandY:.055},
 {t:3.45,bodyF:.058,chestF:.042,hipsX:.020,spineX:.028,chestX:.020,neckX:-.014,
  leftKnee:-.095,rightKnee:-.028,leftShin:-.090,rightShin:-.075,
  leftElbowF:-.014,rightElbowF:-.022,leftElbowO:.093,rightElbowO:.100,
  leftElbowY:.042,rightElbowY:.050,leftHandF:.092,rightHandF:.095,
  leftHandO:-.068,rightHandO:-.073,leftHandY:.035,rightHandY:.039},
 {t:duration,bodyF:.038,chestF:.026,hipsX:.012,spineX:.017,chestX:.008,neckX:-.010,
  leftKnee:-.070,rightKnee:-.015,leftShin:-.070,rightShin:-.060,
  leftElbowF:-.006,rightElbowF:-.013,leftElbowO:.060,rightElbowO:.070,
  leftElbowY:.030,rightElbowY:.038,leftHandF:.065,rightHandF:.060,
  leftHandO:-.055,rightHandO:-.055,leftHandY:.025,rightHandY:.030}
 ];
 const channels=Object.keys(ascend[0]).filter(k=>k!=='t');
 function sample(keys,time){
  const t=((Number.isFinite(time)?time:0)%duration+duration)%duration;
  let i=0;while(i<keys.length-2&&keys[i+1].t<=t)i++;
  const a=keys[i],b=keys[i+1],
    prev=keys[(i+keys.length-2)%(keys.length-1)],
    next=keys[(i+2)%(keys.length-1)],
    pt=prev.t>=a.t?prev.t-duration:prev.t,
    nt=next.t<=b.t?next.t+duration:next.t;
  const h=b.t-a.t,u=(t-a.t)/h,u2=u*u,u3=u2*u,out={};
  for(const k of channels){
   const m0=(b[k]-prev[k])/(b.t-pt),m1=(next[k]-a[k])/(nt-a.t);
   const value=(2*u3-3*u2+1)*a[k]+(u3-2*u2+u)*h*m0+
    (-2*u3+3*u2)*b[k]+(u3-u2)*h*m1;
   out[k]=Math.max(Math.min(a[k],b[k],prev[k],next[k]),
     Math.min(Math.max(a[k],b[k],prev[k],next[k]),value));
  }
  return out;
 }
 // rise/drop weights are smooth-curved, mutually exclusive; sourced from
 // the V100 smoothed physical vertical velocity, not from button presses.
 const clamp01=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
 function performance(rise=0,drop=0,age=0){
  const up=sample(ascend,age),down=sample(descend,age);
  const a=clamp01(rise),d=clamp01(drop),out={};
  for(const k of channels)out[k]=up[k]*a+down[k]*d;
  return out;
 }
 const api=Object.freeze({version:145,duration,channels,ascend,descend,sample,performance});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV145Vertical=api;
})(typeof window!=='undefined'?window:globalThis);
