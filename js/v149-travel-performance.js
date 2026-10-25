/* V149 — authored, continually moving forward/back flying performance.
 * Critical design: not a held lean and not a running/pedalling cycle.
 * Kairo preserves one lifted, curled leg and one longer dangling leg,
 * while those joints change depth and flex through a slow buoyant flight
 * performance. Torso, shoulders, hands and calves trail at distinct beats.
 * Layer on V148 omnidirectional motion INSIDE single V100 final pose owner.
 */
(function(root){
'use strict';
const base=root.SkyClashV148AllFlight||
 (typeof module!=='undefined'&&module.exports?require('./v148-full-flight.js'):null);
if(!base)throw Error('V149 authored travel needs V148 directional flight');
const duration=4.6;
// Seven full authored snapshots, plus matching periodic end key.
// Values are offsets from the V148 forward/back pose. The knees are
// *not* mirrored or swapped: left keeps its suspended folded shape,
// right remains extended and floating without ground contact.
const keys=[
 {t:0,          leftKnee:-.08,rightKnee:.020,leftShin:-.10,rightShin:.00,
  hipsX:-.018,spineX:-.025,chestX:-.018,neckX:.009,
  bodyF:-.025,chestF:-.020,bodyS:-.025,chestS:.018,
  hipsZ:-.010,spineZ:.012,chestZ:.009,
  leftElbowF:.038,rightElbowF:-.025,leftElbowO:.005,rightElbowO:-.012,
  leftHandF:.050,rightHandF:-.033,leftHandO:-.012,rightHandO:.012},
 {t:.64,       leftKnee:.115,rightKnee:.055,leftShin:-.025,rightShin:.060,
  hipsX:.015,spineX:.012,chestX:-.008,neckX:.004,
  bodyF:.015,chestF:-.010,bodyS:-.060,chestS:.045,
  hipsZ:-.022,spineZ:.025,chestZ:.016,
  leftElbowF:.012,rightElbowF:-.040,leftElbowO:.033,rightElbowO:-.016,
  leftHandF:.025,rightHandF:-.078,leftHandO:-.035,rightHandO:.020},
 {t:1.24,      leftKnee:.190,rightKnee:.145,leftShin:.175,rightShin:.165,
  hipsX:.052,spineX:.038,chestX:.025,neckX:-.014,
  bodyF:.065,chestF:.035,bodyS:-.030,chestS:.005,
  hipsZ:-.014,spineZ:.008,chestZ:.002,
  leftElbowF:-.055,rightElbowF:-.075,leftElbowO:.060,rightElbowO:.018,
  leftHandF:-.065,rightHandF:-.122,leftHandO:-.041,rightHandO:.032},
 {t:1.92,      leftKnee:.160,rightKnee:.205,leftShin:.245,rightShin:.260,
  hipsX:.041,spineX:.046,chestX:.038,neckX:-.018,
  bodyF:.052,chestF:.075,bodyS:.025,chestS:-.034,
  hipsZ:.010,spineZ:-.020,chestZ:-.016,
  leftElbowF:-.055,rightElbowF:.018,leftElbowO:.020,rightElbowO:.048,
  leftHandF:-.072,rightHandF:-.014,leftHandO:-.025,rightHandO:-.013},
 {t:2.60,      leftKnee:-.080,rightKnee:.140,leftShin:.090,rightShin:.155,
  hipsX:-.005,spineX:.018,chestX:.039,neckX:-.008,
  bodyF:-.006,chestF:.070,bodyS:.075,chestS:-.055,
  hipsZ:.025,spineZ:-.034,chestZ:-.020,
  leftElbowF:-.004,rightElbowF:.062,leftElbowO:-.008,rightElbowO:.060,
  leftHandF:.018,rightHandF:.082,leftHandO:.020,rightHandO:-.041},
 {t:3.28,      leftKnee:-.170,rightKnee:.035,leftShin:-.110,rightShin:-.018,
  hipsX:-.034,spineX:-.028,chestX:.002,neckX:.012,
  bodyF:-.055,chestF:-.005,bodyS:.025,chestS:-.024,
  hipsZ:.014,spineZ:-.014,chestZ:-.011,
  leftElbowF:.072,rightElbowF:.040,leftElbowO:-.018,rightElbowO:.025,
  leftHandF:.112,rightHandF:.065,leftHandO:.032,rightHandO:-.018},
 {t:3.92,      leftKnee:-.120,rightKnee:-.005,leftShin:-.165,rightShin:-.040,
  hipsX:-.035,spineX:-.043,chestX:-.036,neckX:.020,
  bodyF:-.045,chestF:-.052,bodyS:-.015,chestS:.013,
  hipsZ:-.003,spineZ:.009,chestZ:.007,
  leftElbowF:.080,rightElbowF:-.005,leftElbowO:-.014,rightElbowO:-.010,
  leftHandF:.115,rightHandF:-.015,leftHandO:.018,rightHandO:.013},
 {t:duration,  leftKnee:-.08,rightKnee:.020,leftShin:-.10,rightShin:.00,
  hipsX:-.018,spineX:-.025,chestX:-.018,neckX:.009,
  bodyF:-.025,chestF:-.020,bodyS:-.025,chestS:.018,
  hipsZ:-.010,spineZ:.012,chestZ:.009,
  leftElbowF:.038,rightElbowF:-.025,leftElbowO:.005,rightElbowO:-.012,
  leftHandF:.050,rightHandF:-.033,leftHandO:-.012,rightHandO:.012}
];
const channels=Object.keys(keys[0]).filter(k=>k!=='t');
function sample(time){
 const t=((Number.isFinite(time)?time:0)%duration+duration)%duration;
 let i=0;while(i<keys.length-2&&keys[i+1].t<=t)i++;
 const a=keys[i],b=keys[i+1],
  prev=keys[(i+keys.length-2)%(keys.length-1)],
  next=keys[(i+2)%(keys.length-1)],
  pt=prev.t>=a.t?prev.t-duration:prev.t,
  nt=next.t<=b.t?next.t+duration:next.t,
  h=b.t-a.t,u=(t-a.t)/h,u2=u*u,u3=u2*u,out={};
 for(const k of channels){
  const m0=(b[k]-prev[k])/(b.t-pt),
   m1=(next[k]-a[k])/(nt-a.t);
  const value=(2*u3-3*u2+1)*a[k]+(u3-2*u2+u)*h*m0+
    (-2*u3+3*u2)*b[k]+(u3-u2)*h*m1;
  out[k]=Math.max(Math.min(a[k],b[k],prev[k],next[k]),
   Math.min(Math.max(a[k],b[k],prev[k],next[k]),value));
 }
 return out;
}
function performance(state,age){
 const p=sample(age),parts=state?.parts||{},
  front=parts.torso?.f||0,back=parts.torso?.b||0,
  frontLeg=parts.legs?.f||0,backLeg=parts.legs?.b||0,
  frontArm=parts.arms?.f||0,backArm=parts.arms?.b||0,
  out={};
 // Motions are timed to the same physical flight, but BACKWARD
 // shifts chest and hips in the opposite direction; knees still
 // undulate without an alternating running/pedalling pattern.
 const group=k=>/Knee|Shin|Toe/.test(k)?'legs':
  /Elbow|Hand/.test(k)?'arms':'torso';
 for(const k of channels){
  const g=group(k),weight=g==='legs'?frontLeg+backLeg:
   g==='arms'?frontArm+backArm:front+back;
  const backwards=g==='torso'&&(/bodyF|chestF|hipsX|spineX|chestX/.test(k));
  // Forearms follow farther behind the chest: the real Kairo render
  // showed subtle wrist keys disappearing into the existing V148 pose.
  out[k]=p[k]*weight*(g==='arms'?1.46:1)*
   (backwards&&back>front?-.75:1);
 }
 // Backward retreat: lead with hips, keep a loose, open opposite arm;
 // this is NOT playing a forward stroke in reverse.
 out.rightHandF+=.065*backArm;
 out.leftElbowO+=.036*backArm;
 out.leftKnee+=.052*backLeg;
 out.rightKnee+=.025*backLeg;
 return out;
}
const api=Object.freeze({version:149,duration,keys,channels,sample,performance});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.SkyClashV149Travel=api;
})(typeof window!=='undefined'?window:globalThis);
