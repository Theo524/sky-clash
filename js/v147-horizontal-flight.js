/* Sky Clash V147: authored forward/back powered flight performance.
 * Designed on the approved V146 hover/vertical flight. These are 3D
 * character joint targets, NOT character-root or camera movement.
 * Physics, facing, V125 jump, V97 ground, combat, Boost stay unchanged.
 */
(function(root){
 'use strict';
 const duration=4.6;
 // Deliberately opposing poses, NOT reverse playback of forward flight:
 // Kairo faces the opponent during backward travel, his weight shifts
 // gently behind his pelvis, and his loose arms balance the motion.
 // The forward pose has a modest confident chest lead and forearm trail.
 const forward=[
 {t:0,bodyF:.058,chestF:.066,hipsX:.012,spineX:.020,chestX:.013,neckX:-.008,
  leftKnee:.005,rightKnee:-.006,leftShin:.008,rightShin:.008,
  leftElbowF:-.010,rightElbowF:-.005,leftElbowO:.012,rightElbowO:.006,
  leftElbowY:-.007,rightElbowY:-.012,leftHandF:-.035,rightHandF:-.027,
  leftHandO:-.006,rightHandO:-.006,leftHandY:-.012,rightHandY:-.014},
 {t:1.15,bodyF:.092,chestF:.096,hipsX:.027,spineX:.030,chestX:.023,neckX:-.016,
  leftKnee:.047,rightKnee:-.015,leftShin:.038,rightShin:.025,
  leftElbowF:-.028,rightElbowF:-.020,leftElbowO:.033,rightElbowO:.023,
  leftElbowY:-.025,rightElbowY:-.023,leftHandF:-.072,rightHandF:-.060,
  leftHandO:-.018,rightHandO:-.011,leftHandY:-.025,rightHandY:-.025},
 {t:2.30,bodyF:.082,chestF:.085,hipsX:.024,spineX:.027,chestX:.018,neckX:-.015,
  leftKnee:.034,rightKnee:-.010,leftShin:.034,rightShin:.022,
  leftElbowF:-.018,rightElbowF:-.023,leftElbowO:.028,rightElbowO:.030,
  leftElbowY:-.021,rightElbowY:-.022,leftHandF:-.060,rightHandF:-.070,
  leftHandO:-.013,rightHandO:-.016,leftHandY:-.021,rightHandY:-.025},
 {t:3.45,bodyF:.065,chestF:.070,hipsX:.016,spineX:.022,chestX:.014,neckX:-.009,
  leftKnee:.016,rightKnee:-.006,leftShin:.016,rightShin:.016,
  leftElbowF:-.012,rightElbowF:-.009,leftElbowO:.021,rightElbowO:.016,
  leftElbowY:-.015,rightElbowY:-.015,leftHandF:-.047,rightHandF:-.038,
  leftHandO:-.012,rightHandO:-.007,leftHandY:-.017,rightHandY:-.021},
 {t:duration,bodyF:.058,chestF:.066,hipsX:.012,spineX:.020,chestX:.013,neckX:-.008,
  leftKnee:.005,rightKnee:-.006,leftShin:.008,rightShin:.008,
  leftElbowF:-.010,rightElbowF:-.005,leftElbowO:.012,rightElbowO:.006,
  leftElbowY:-.007,rightElbowY:-.012,leftHandF:-.035,rightHandF:-.027,
  leftHandO:-.006,rightHandO:-.006,leftHandY:-.012,rightHandY:-.014}
 ];
 const backward=[
 {t:0,bodyF:-.080,chestF:-.066,hipsX:-.027,spineX:-.028,chestX:-.019,neckX:.016,
  leftKnee:.060,rightKnee:.007,leftShin:.046,rightShin:-.014,
  leftElbowF:.045,rightElbowF:.036,leftElbowO:.035,rightElbowO:.025,
  leftElbowY:.024,rightElbowY:.024,leftHandF:.075,rightHandF:.064,
  leftHandO:-.022,rightHandO:-.017,leftHandY:.022,rightHandY:.019},
 {t:1.15,bodyF:-.118,chestF:-.092,hipsX:-.040,spineX:-.042,chestX:-.028,neckX:.025,
  leftKnee:.115,rightKnee:.017,leftShin:.094,rightShin:-.032,
  leftElbowF:.070,rightElbowF:.059,leftElbowO:.065,rightElbowO:.055,
  leftElbowY:.041,rightElbowY:.035,leftHandF:.112,rightHandF:.102,
  leftHandO:-.043,rightHandO:-.037,leftHandY:.037,rightHandY:.029},
 {t:2.30,bodyF:-.113,chestF:-.096,hipsX:-.038,spineX:-.040,chestX:-.026,neckX:.024,
  leftKnee:.100,rightKnee:.013,leftShin:.076,rightShin:-.026,
  leftElbowF:.065,rightElbowF:.072,leftElbowO:.063,rightElbowO:.065,
  leftElbowY:.039,rightElbowY:.038,leftHandF:.100,rightHandF:.115,
  leftHandO:-.037,rightHandO:-.046,leftHandY:.030,rightHandY:.038},
 {t:3.45,bodyF:-.088,chestF:-.074,hipsX:-.030,spineX:-.031,chestX:-.022,neckX:.018,
  leftKnee:.069,rightKnee:.009,leftShin:.055,rightShin:-.020,
  leftElbowF:.053,rightElbowF:.045,leftElbowO:.045,rightElbowO:.042,
  leftElbowY:.028,rightElbowY:.029,leftHandF:.083,rightHandF:.078,
  leftHandO:-.026,rightHandO:-.028,leftHandY:.025,rightHandY:.025},
 {t:duration,bodyF:-.080,chestF:-.066,hipsX:-.027,spineX:-.028,chestX:-.019,neckX:.016,
  leftKnee:.060,rightKnee:.007,leftShin:.046,rightShin:-.014,
  leftElbowF:.045,rightElbowF:.036,leftElbowO:.035,rightElbowO:.025,
  leftElbowY:.024,rightElbowY:.024,leftHandF:.075,rightHandF:.064,
  leftHandO:-.022,rightHandO:-.017,leftHandY:.022,rightHandY:.019}
 ];
 const channels=Object.keys(forward[0]).filter(k=>k!=='t');
 function sample(keys,age){
  const t=((Number.isFinite(age)?age:0)%duration+duration)%duration;
  let i=0;while(i<keys.length-2&&keys[i+1].t<=t)i++;
  const a=keys[i],b=keys[i+1],
   prev=keys[(i+keys.length-2)%(keys.length-1)],
   next=keys[(i+2)%(keys.length-1)],
   pt=prev.t>=a.t?prev.t-duration:prev.t,
   nt=next.t<=b.t?next.t+duration:next.t,h=b.t-a.t,
   u=(t-a.t)/h,u2=u*u,u3=u2*u,out={};
  for(const k of channels){
   const m0=(b[k]-prev[k])/(b.t-pt),
    m1=(next[k]-a[k])/(nt-a.t);
   const v=(2*u3-3*u2+1)*a[k]+(u3-2*u2+u)*h*m0+
     (-2*u3+3*u2)*b[k]+(u3-u2)*h*m1;
   out[k]=Math.max(Math.min(a[k],b[k],prev[k],next[k]),
     Math.min(Math.max(a[k],b[k],prev[k],next[k]),v));
  }
  return out;
 }
 // Smooth independent direction effort; do not use total horizontal
 // speed, because retreat must not look like running forward in mid-air.
 const vertical=root.SkyClashV146Vertical||
  (typeof module!=='undefined'&&module.exports?
   require('./v146-vertical-followthrough.js'):null);
 if(!vertical)throw Error('V147 requires V146 spring library');
 const springs={
  torso:{omega:11.5},legs:{omega:8.4},arms:{omega:6.1}
 };
 const groupFor=k=>/Knee$|Shin$/.test(k)?'legs':
  /Elbow|Hand/.test(k)?'arms':'torso';
 const ease=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t)};
 function createState(){
  return {torso:{front:0,back:0,frontV:0,backV:0},
   legs:{front:0,back:0,frontV:0,backV:0},
   arms:{front:0,back:0,frontV:0,backV:0}};
 }
 function step(state,signedForward,dt){
  const s=state||createState(),v=Number.isFinite(signedForward)?signedForward:0,
   front=ease(Math.max(0,(v-.18)/6.02)),
   back=ease(Math.max(0,(-v-.18)/6.02));
  for(const name of Object.keys(springs)){
   const p=s[name],o=springs[name].omega;
   [p.front,p.frontV]=vertical.spring(p.front,p.frontV,front,dt,o);
   [p.back,p.backV]=vertical.spring(p.back,p.backV,back,dt,o);
   p.front=Math.max(0,Math.min(1,p.front));
   p.back=Math.max(0,Math.min(1,p.back));
  }
  return s;
 }
 function performance(state,age){
  const front=sample(forward,age),back=sample(backward,age),out={};
  for(const k of channels){
   const name=groupFor(k),p=state?.[name]||{},
    wF=p.front||0,wB=p.back||0;
   out[k]=front[k]*wF+back[k]*wB;
  }
  // Momentum accent at launch/reverse. The sign comes from the change
  // of directional weight, not a guessed input or world-root animation.
  const t=state?.torso||{},arms=state?.arms||{},
   kick=Math.max(-2,Math.min(2,(t.frontV||0)-(t.backV||0))),
   handKick=Math.max(-2,Math.min(2,(arms.frontV||0)-(arms.backV||0)));
  out.bodyF+=.010*kick;
  out.chestF+=.007*kick;
  out.leftHandF-=.016*handKick;
  out.rightHandF-=.014*handKick;
  return out;
 }
 const api=Object.freeze({version:147,duration,channels,forward,backward,sample,createState,step,performance});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV147Horizontal=api;
})(typeof window!=='undefined'?window:globalThis);
