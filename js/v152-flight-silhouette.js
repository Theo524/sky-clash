/* V152 — calm Kairo hover and truly trailing free-flight arms.
 * Separate authored overlay: V151/V150 rollbacks stay byte-for-byte
 * unchanged, V100 is still the sole visible VRM bone pose writer.
 * No Fighter.animate wrapper, physics, root motion or game input changes.
 */
(function(root){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=x=>{const a=clamp(x,0,1);return a*a*(3-2*a);};
const damp=(k,dt)=>1-Math.exp(-k*clamp(Number.isFinite(dt)?dt:0,0,.06));
const duration=4.6;
// World-facing target DIRECTION for actual VRM0 arm solver.
// Both upper arms slope BELOW and BEHIND the shoulder, with low trailing
// elbows and forearms angled back behind the hips, not fists by the ribs.
// Staggered left/right timing retains a human, non-mirrored flow.
const keys=[
 {t:0,
  leftElbowF:-.56,leftElbowO:.46,leftElbowY:-.86,
  rightElbowF:-.49,rightElbowO:.39,rightElbowY:-.92,
  leftHandF:-.58,leftHandO:-.06,leftHandY:-.75,
  rightHandF:-.68,rightHandO:-.09,rightHandY:-.73},
 {t:.64,
  leftElbowF:-.60,leftElbowO:.47,leftElbowY:-.84,
  rightElbowF:-.51,rightElbowO:.40,rightElbowY:-.90,
  leftHandF:-.64,leftHandO:-.08,leftHandY:-.72,
  rightHandF:-.62,rightHandO:-.07,rightHandY:-.77},
 {t:1.24,
  leftElbowF:-.65,leftElbowO:.45,leftElbowY:-.83,
  rightElbowF:-.53,rightElbowO:.42,rightElbowY:-.89,
  leftHandF:-.70,leftHandO:-.08,leftHandY:-.68,
  rightHandF:-.60,rightHandO:-.06,rightHandY:-.77},
 {t:1.92,
  leftElbowF:-.61,leftElbowO:.45,leftElbowY:-.86,
  rightElbowF:-.58,rightElbowO:.43,rightElbowY:-.87,
  leftHandF:-.66,leftHandO:-.07,leftHandY:-.72,
  rightHandF:-.67,rightHandO:-.09,rightHandY:-.72},
 {t:2.60,
  leftElbowF:-.53,leftElbowO:.43,leftElbowY:-.89,
  rightElbowF:-.62,rightElbowO:.43,rightElbowY:-.85,
  leftHandF:-.58,leftHandO:-.05,leftHandY:-.77,
  rightHandF:-.71,rightHandO:-.10,rightHandY:-.69},
 {t:3.28,
  leftElbowF:-.51,leftElbowO:.41,leftElbowY:-.90,
  rightElbowF:-.64,rightElbowO:.44,rightElbowY:-.83,
  leftHandF:-.57,leftHandO:-.04,leftHandY:-.79,
  rightHandF:-.73,rightHandO:-.11,rightHandY:-.67},
 {t:3.92,
  leftElbowF:-.54,leftElbowO:.43,leftElbowY:-.88,
  rightElbowF:-.57,rightElbowO:.42,rightElbowY:-.87,
  leftHandF:-.59,leftHandO:-.05,leftHandY:-.76,
  rightHandF:-.69,rightHandO:-.09,rightHandY:-.72}
];
keys.push({...keys[0],t:duration});
const channels=Object.keys(keys[0]).filter(k=>k!=='t');
function sample(age){
 const time=((Number.isFinite(age)?age:0)%duration+duration)%duration;
 let i=0;while(i<keys.length-2&&keys[i+1].t<=time)i++;
 const a=keys[i],b=keys[i+1],prev=keys[(i+keys.length-2)%(keys.length-1)],
  next=keys[(i+2)%(keys.length-1)];
 const prevT=prev.t>=a.t?prev.t-duration:prev.t,
  nextT=next.t<=b.t?next.t+duration:next.t,
  span=b.t-a.t,t=(time-a.t)/span,t2=t*t,t3=t2*t,out={};
 for(const channel of channels){
  const start=(b[channel]-prev[channel])/(b.t-prevT),
   end=(next[channel]-a[channel])/(nextT-a.t),
   value=(2*t3-3*t2+1)*a[channel]+(t3-2*t2+t)*span*start+
     (-2*t3+3*t2)*b[channel]+(t3-t2)*span*end;
  out[channel]=clamp(value,
   Math.min(a[channel],b[channel],prev[channel],next[channel]),
   Math.max(a[channel],b[channel],prev[channel],next[channel]));
 }
 return out;
}
function createState(){return {quiet:0,elbow:0,hand:0,quietTarget:0,travelTarget:0};}
function step(previous,input,verticalVelocity,horizontalVelocity,dt){
 const s=previous||createState(),stick=clamp(input?.stick||0,0,1),
  speed=clamp(horizontalVelocity||0,0,100),
  vertical=Math.abs(verticalVelocity||0),locked=!!input?.lock,
  front=clamp(input?.forward||0,0,1),
  side=Math.abs(clamp(input?.side||0,-1,1));
 // "Normal flying stance" is calm: hold the same suspended knee/arm
 // silhouette and reduce unnecessary keyed bob/sway to ~8% of prior.
 // Dampen transitions instead of toggling poses at a velocity threshold.
 const movement=Math.max(stick,clamp(speed/6.2,0,1)),
  idle=(1-smooth((movement-.035)/.30))*
    (1-smooth((vertical-.22)/1.6)),
  travel=(locked?0:smooth((front-.12)/.75))*
    (1-.55*smooth(side))*smooth((speed-.55)/2.2);
 s.quiet+=(idle-s.quiet)*damp(idle>s.quiet?4.0:9.0,dt);
 s.elbow+=(travel-s.elbow)*damp(travel<s.elbow?9.5:5.1,dt);
 s.hand+=(travel-s.hand)*damp(travel<s.hand?8.5:3.7,dt);
 s.quietTarget=idle;s.travelTarget=travel;
 return s;
}
function compose(p,quietAnchor,state,age){
 if(!p||!p.keys||!quietAnchor?.keys)return p;
 const quiet=.93*clamp(state?.quiet||0,0,1),
  keys={...p.keys};
 // Blend ALL animated hover channels and pelvis/chest goals toward a
 // FIXED APPROVED V144 base. A small 7% existing breathing remains.
 // Never alter powered travel/ascend/retreat when quiet=0.
 for(const k of Object.keys(quietAnchor.keys)){
  if(Number.isFinite(keys[k])&&Number.isFinite(quietAnchor.keys[k]))
   keys[k]+=(quietAnchor.keys[k]-keys[k])*quiet;
 }
 const fields=['pelvisGoalF','pelvisGoalS','chestGoalF','chestGoalS',
  'hipsX','spineX','chestX','neckX','hipsZ','spineZ','chestZ'];
 const goal={...p,keys};
 for(const k of fields){
  if(Number.isFinite(p[k]))
   goal[k]=p[k]+((Number.isFinite(quietAnchor[k])?quietAnchor[k]:0)-p[k])*quiet;
 }
 // Important: V151 moved hands down a little, but kept the same silhouette.
 // V152 *aims the arm bones BEHIND Kairo*, visible in side view, with
 // separate elbow/hand ease and a real looping 7-key animation.
 const travel=sample(age);
 for(const k of channels){
  const weight=clamp(k.includes('Elbow')?state?.elbow||0:state?.hand||0,0,1);
  keys[k]+=(travel[k]-keys[k])*weight;
 }
 return {...goal,keys,profile:'V152 calm hover and trailing travel arms',
  quietFlightWeight:+quiet.toFixed(4),
  trailingElbowWeight:state?.elbow||0,trailingHandWeight:state?.hand||0,
  trailingPose:state?.elbow>.32?'travel-arms-back':'calm-hover-or-guard'};
}
const api=Object.freeze({version:152,duration,keys,channels,
 createState,step,sample,compose});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.SkyClashV152Silhouette=api;
})(typeof window!=='undefined'?window:globalThis);
