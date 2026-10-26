/* V151 — Kairo's free-forward flight RELAXES its combat arm guard.
 * Authored 4.6s world-space arm silhouettes blend through ONE existing
 * V100 flight pose writer. No new Fighter.animate wrapper, no VRM writer,
 * no gameplay yaw, root, collision or physics change.
 * V150 remains byte-identical when there is no free forward travel.
 * Lock-on forward, retreat and strafe regain the combat-ready posture.
 */
(function(root){
 'use strict';
 const duration=4.6;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
 const damp=(rate,dt)=>1-Math.exp(-rate*clamp(dt,0,.06));
 // Directions are relative to Kairo's real, normalized VRM world axes:
 // F forward, O outward from shoulder, Y up. Both elbows fall BELOW
 // shoulders and drift a little behind; curved forearms stay soft,
 // low and different on each side, never stiff T-pose/airplane wings.
 // These are hand-authored poses rather than a stationary additive offset.
 const keys=[
  {t:0,
   leftElbowF:-.08,leftElbowO:.31,leftElbowY:-1.02,
   rightElbowF:-.11,rightElbowO:.27,rightElbowY:-1.01,
   leftHandF:.08,leftHandO:-.11,leftHandY:-.99,
   rightHandF:.11,rightHandO:-.09,rightHandY:-1.00},
  {t:.64,
   leftElbowF:-.06,leftElbowO:.32,leftElbowY:-1.03,
   rightElbowF:-.15,rightElbowO:.26,rightElbowY:-1.02,
   leftHandF:.12,leftHandO:-.12,leftHandY:-.97,
   rightHandF:.06,rightHandO:-.08,rightHandY:-1.01},
  {t:1.24,
   leftElbowF:.00,leftElbowO:.34,leftElbowY:-1.01,
   rightElbowF:-.14,rightElbowO:.28,rightElbowY:-1.04,
   leftHandF:.16,leftHandO:-.12,leftHandY:-.96,
   rightHandF:.07,rightHandO:-.07,rightHandY:-1.00},
  {t:1.92,
   leftElbowF:-.04,leftElbowO:.33,leftElbowY:-1.02,
   rightElbowF:-.09,rightElbowO:.30,rightElbowY:-1.02,
   leftHandF:.12,leftHandO:-.11,leftHandY:-.98,
   rightHandF:.13,rightHandO:-.10,rightHandY:-.98},
  {t:2.60,
   leftElbowF:-.12,leftElbowO:.30,leftElbowY:-1.04,
   rightElbowF:-.05,rightElbowO:.33,rightElbowY:-1.01,
   leftHandF:.06,leftHandO:-.09,leftHandY:-1.00,
   rightHandF:.17,rightHandO:-.13,rightHandY:-.96},
  {t:3.28,
   leftElbowF:-.15,leftElbowO:.28,leftElbowY:-1.02,
   rightElbowF:-.03,rightElbowO:.33,rightElbowY:-1.01,
   leftHandF:.04,leftHandO:-.07,leftHandY:-1.01,
   rightHandF:.17,rightHandO:-.14,rightHandY:-.96},
  {t:3.92,
   leftElbowF:-.12,leftElbowO:.29,leftElbowY:-1.02,
   rightElbowF:-.07,rightElbowO:.29,rightElbowY:-1.03,
   leftHandF:.05,leftHandO:-.09,leftHandY:-1.00,
   rightHandF:.13,rightHandO:-.11,rightHandY:-.98}
 ];
 keys.push({...keys[0],t:duration});
 const channels=Object.keys(keys[0]).filter(k=>k!=='t');
 function sample(age){
  const t=((Number.isFinite(age)?age:0)%duration+duration)%duration;
  let i=0;while(i<keys.length-2&&keys[i+1].t<=t)i++;
  const a=keys[i],b=keys[i+1],prior=keys[(i+keys.length-2)%(keys.length-1)],
   next=keys[(i+2)%(keys.length-1)],
   pt=prior.t>=a.t?prior.t-duration:prior.t,
   nt=next.t<=b.t?next.t+duration:next.t,
   h=b.t-a.t,u=(t-a.t)/h,u2=u*u,u3=u2*u,out={};
  for(const channel of channels){
   const m0=(b[channel]-prior[channel])/(b.t-pt),
    m1=(next[channel]-a[channel])/(nt-a.t);
   const value=(2*u3-3*u2+1)*a[channel]+
    (u3-2*u2+u)*h*m0+(-2*u3+3*u2)*b[channel]+
    (u3-u2)*h*m1;
   out[channel]=clamp(value,
    Math.min(a[channel],b[channel],prior[channel],next[channel]),
    Math.max(a[channel],b[channel],prior[channel],next[channel]));
  }
  return out;
 }
 function createState(){return {elbow:0,hand:0,goal:0,locked:false};}
 function step(previous,intent,dt){
  const s=previous||createState(),f=clamp(intent?.forward||0,0,1),
   side=Math.abs(clamp(intent?.side||0,-1,1)),
   locked=!!intent?.lock,
   // Travel arm release only for travel INTO Kairo's facing direction;
   // locked retreat/strafe keep the original V150 combat arm geometry.
   goal=locked?0:smooth((f-.12)/.80)*(1-.75*smooth(side));
  s.elbow+=(goal-s.elbow)*damp(locked?10.5:4.8,dt);
  s.hand+=(goal-s.hand)*damp(locked?9.5:3.25,dt);
  s.goal=goal;s.locked=locked;
  return s;
 }
 function performance(state,age,baseKeys){
  const result={};
  if(!state||!baseKeys)return result;
  const pose=sample(age);
  for(const key of channels){
   if(!Object.prototype.hasOwnProperty.call(baseKeys,key))continue;
   const weight=clamp(/Elbow/.test(key)?state.elbow:state.hand,0,1);
   result[key]=(pose[key]-baseKeys[key])*weight;
  }
  return result;
 }
 const api=Object.freeze({version:151,duration,keys,channels,createState,
  step,sample,performance});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV151TravelArms=api;
})(typeof window!=='undefined'?window:globalThis);
