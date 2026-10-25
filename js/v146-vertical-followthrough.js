/* Sky Clash V146 — expressive vertical-flight follow-through.
 * Visual performance only. No changes to physics, input, model root,
 * approved V144 hover, V125 jump, V97 locomotion or combat.
 * The V145 authored rise/descend clips supply anatomical direction.
 * Three independent exact critically-damped responses make hips/chest
 * lead, legs gather next, and elbows/wrists settle last.
 */
(function(root){
 'use strict';
 const source=root.SkyClashV145Vertical||
  (typeof module!=='undefined'&&module.exports?
   require('./v145-vertical-flight.js'):null);
 if(!source)throw Error('V146 expressive vertical flight requires V145 authored curves');
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const ease=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
 const channels=source.channels;
 const groups={
  torso:{omega:12.0,scale:1.38},
  legs:{omega:8.5,scale:1.42},
  arms:{omega:6.4,scale:1.55}
 };
 const legChannels=/Knee$|Shin$|Toe$/;
 const armChannels=/Elbow|Hand/;
 function groupFor(key){
  return legChannels.test(key)?'legs':
   armChannels.test(key)?'arms':'torso';
 }
 function createState(){
  return {torso:{up:0,drop:0,upV:0,dropV:0},
   legs:{up:0,drop:0,upV:0,dropV:0},
   arms:{up:0,drop:0,upV:0,dropV:0}};
 }
 // Exact critically-damped spring response per dt: unlike repeatedly
 // smoothing keyframe Euler values, this is frame-rate independent,
 // continuously differentiable, and has NO uncontrolled overshoot.
 function spring(x,v,target,dt,omega){
  const h=clamp(Number.isFinite(dt)?dt:0,0,.065);
  const d=x-target,e=Math.exp(-omega*h),m=v+omega*d;
  return [target+(d+m*h)*e,(v-omega*m*h)*e];
 }
 function step(state,velocity,dt){
  if(!state)state=createState();
  const speed=Number.isFinite(velocity)?velocity:0;
  // Minimum threshold prevents tiny floating-point values from
  // assigning a 'descending' animation to stationary hover.
  const up=ease(speed>0.12?(speed-.12)/6.88:0);
  const drop=ease(speed<-.12?(-speed-.12)/6.88:0);
  for(const name of Object.keys(groups)){
   const group=state[name],omega=groups[name].omega;
   [group.up,group.upV]=spring(group.up,group.upV,up,dt,omega);
   [group.drop,group.dropV]=spring(group.drop,group.dropV,drop,dt,omega);
   group.up=clamp(group.up,0,1);
   group.drop=clamp(group.drop,0,1);
  }
  return state;
 }
 function performance(state,age){
  const up=source.sample(source.ascend,age),
   down=source.sample(source.descend,age);
  const values={};
  for(const channel of channels){
   const name=groupFor(channel),p=state?.[name],
    weightUp=clamp(p?.up||0,0,1),weightDown=clamp(p?.drop||0,0,1);
   values[channel]=(up[channel]*weightUp+down[channel]*weightDown)*
    groups[name].scale;
  }
  // Transition accents are proportional to the rate of pose CHANGE.
  // Chest reacts to lift/brake, hands trail late as if weightless.
  // These fade completely on sustained ascent/descent and hover.
  const torso=state?.torso||{},arms=state?.arms||{},legs=state?.legs||{};
  const tKick=clamp((torso.upV||0)-(torso.dropV||0),-2.5,2.5);
  const aKick=clamp((arms.upV||0)-(arms.dropV||0),-2,2);
  const lKick=clamp((legs.upV||0)-(legs.dropV||0),-2,2);
  values.bodyF-=.015*tKick;
  values.chestF-=.012*tKick;
  values.spineX-=.006*tKick;
  values.leftElbowO-=.018*aKick;
  values.rightElbowO-=.016*aKick;
  values.leftHandF-=.018*aKick;
  values.rightHandF-=.014*aKick;
  values.leftKnee+=.024*lKick;
  values.leftShin+=.014*lKick;
  return values;
 }
 const api=Object.freeze({version:146,groups,channels,createState,spring,step,performance});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV146Vertical=api;
})(typeof window!=='undefined'?window:globalThis);
