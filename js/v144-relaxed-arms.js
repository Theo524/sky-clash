/* Sky Clash V144 — authored relaxed flight-arm performance.
 * V143 approved torso/legs are NOT modified. This clip directs upper
 * arms and forearms in Kairo's real world-facing normalized VRM rig.
 * Both arms hang low with visible soft elbow flex, and each hand trails
 * its elbow rather than pointing along the same rigid vertical line.
 * World root, gravity, V125 jumping and V97 ground are unaffected.
 */
(function(root){
 'use strict';
 const duration=4.6;
 // Each pose is a real key, not a per-joint oscillation generator.
 // Values encode the relative elbow/hand bone direction as world
 // forward (F), outward (O), and upward (Y) before normalization.
 // Lower wrists should stay BELOW elbows, close to the waist.
 const keys=[
  {t:0,
   leftElbowF:.19,leftElbowO:.40,leftElbowY:-.90,
   rightElbowF:.12,rightElbowO:.36,rightElbowY:-.92,
   leftHandF:.50,leftHandO:-.26,leftHandY:-.79,
   rightHandF:.44,rightHandO:-.20,rightHandY:-.84},
  {t:.58,
   leftElbowF:.27,leftElbowO:.43,leftElbowY:-.87,
   rightElbowF:.12,rightElbowO:.36,rightElbowY:-.92,
   leftHandF:.57,leftHandO:-.28,leftHandY:-.76,
   rightHandF:.43,rightHandO:-.20,rightHandY:-.84},
  {t:1.17,
   leftElbowF:.33,leftElbowO:.45,leftElbowY:-.84,
   rightElbowF:.14,rightElbowO:.37,rightElbowY:-.91,
   leftHandF:.62,leftHandO:-.28,leftHandY:-.72,
   rightHandF:.40,rightHandO:-.19,rightHandY:-.84},
  {t:1.76,
   leftElbowF:.27,leftElbowO:.43,leftElbowY:-.86,
   rightElbowF:.19,rightElbowO:.40,rightElbowY:-.89,
   leftHandF:.55,leftHandO:-.28,leftHandY:-.75,
   rightHandF:.49,rightHandO:-.22,rightHandY:-.80},
  {t:2.40,
   leftElbowF:.17,leftElbowO:.40,leftElbowY:-.91,
   rightElbowF:.25,rightElbowO:.44,rightElbowY:-.86,
   leftHandF:.44,leftHandO:-.26,leftHandY:-.82,
   rightHandF:.58,rightHandO:-.26,rightHandY:-.75},
  {t:2.99,
   leftElbowF:.13,leftElbowO:.39,leftElbowY:-.92,
   rightElbowF:.30,rightElbowO:.45,rightElbowY:-.84,
   leftHandF:.41,leftHandO:-.25,leftHandY:-.84,
   rightHandF:.64,rightHandO:-.28,rightHandY:-.72},
  {t:3.61,
   leftElbowF:.17,leftElbowO:.40,leftElbowY:-.91,
   rightElbowF:.22,rightElbowO:.40,rightElbowY:-.89,
   leftHandF:.46,leftHandO:-.25,leftHandY:-.81,
   rightHandF:.55,rightHandO:-.25,rightHandY:-.79},
  {t:4.12,
   leftElbowF:.19,leftElbowO:.41,leftElbowY:-.90,
   rightElbowF:.15,rightElbowO:.37,rightElbowY:-.91,
   leftHandF:.50,leftHandO:-.26,leftHandY:-.79,
   rightHandF:.47,rightHandO:-.22,rightHandY:-.83}
 ];
 keys.push({...keys[0],t:duration});
 const channels=Object.keys(keys[0]).filter(k=>k!=='t');
 // Loop-safe piecewise cubic Hermite: smooth at every keyed boundary,
 // with neighbor clamping against interpolation overshoot.
 function sample(age){
  const time=((Number.isFinite(age)?age:0)%duration+duration)%duration;
  let i=0;while(i<keys.length-2&&keys[i+1].t<=time)i++;
  const a=keys[i],b=keys[i+1],
    prior=keys[(i+keys.length-2)%(keys.length-1)],
    next=keys[(i+2)%(keys.length-1)];
  const pt=prior.t>=a.t?prior.t-duration:prior.t,
   nt=next.t<=b.t?next.t+duration:next.t;
  const h=b.t-a.t,u=(time-a.t)/h,u2=u*u,u3=u2*u,result={};
  for(const channel of channels){
   const before=(b[channel]-prior[channel])/(b.t-pt),
    after=(next[channel]-a[channel])/(nt-a.t);
   const value=(2*u3-3*u2+1)*a[channel]+
    (u3-2*u2+u)*h*before+
    (-2*u3+3*u2)*b[channel]+(u3-u2)*h*after;
   result[channel]=Math.max(
    Math.min(a[channel],b[channel],prior[channel],next[channel]),
    Math.min(Math.max(a[channel],b[channel],prior[channel],next[channel]),value));
  }
  return result;
 }
 const api=Object.freeze({version:144,duration,keys,channels,sample});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV144Arms=api;
})(typeof window!=='undefined'?window:globalThis);
