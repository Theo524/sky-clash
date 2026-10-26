/* Sky Clash V153: actual forward-pressure BODY pitch, not only arms.
 * Calm hover, signed lock-on guard, jump & gameplay physics remain unchanged.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const control=require('../js/v150-joystick-flight.js');
const calm=require('../js/v152-flight-silhouette.js');
const streamline=require('../js/v153-streamlined-flight.js');
const owner=require('../js/v100-pose-authority.js');
const vertical=require('../js/v146-vertical-followthrough.js');
const omni=require('../js/v148-full-flight.js');
assert.equal(streamline.version,153);
assert.equal(streamline.maxDegrees,62);
function flight(x,z,locked=false,seconds=1.6,fps=60,speed=null){
 let intent=control.createState(),pose=streamline.createState(),quiet=calm.createState();
 const magnitude=Math.hypot(x,z),velocity=speed??magnitude*6.2;
 for(let i=0;i<Math.round(seconds*fps);i++){
  intent=control.step(intent,x,z,x*velocity/(magnitude||1),z*velocity/(magnitude||1),
    0,locked,1/fps);
  quiet=calm.step(quiet,intent,0,velocity,1/fps);
  pose=streamline.step(pose,intent,velocity,1/fps);
 }
 return {intent,pose,quiet};
}
const still=flight(0,0),slow=flight(0,.30),mid=flight(0,.60),
 full=flight(0,1),lockedForward=flight(0,1,true),
 retreat=flight(0,-1,true),lockedSide=flight(1,0,true),
 diagon=flight(.72,.72),freeBack=flight(0,-1,false),
 stalled=flight(0,1,false,1.6,60,0);
assert.equal(still.pose.effort,0,'calm hover must stay upright');
assert.equal(stalled.pose.effort,0,'cannot snap horizontal while stopped');
assert(slow.pose.pitchDegrees<12,'gentle forward stays near upright');
assert(mid.pose.pitchDegrees>15&&mid.pose.pitchDegrees<46,
 'moderate joystick shifts entire body into partial incline');
assert(full.pose.pitchDegrees>60&&full.pose.pitchDegrees<=62,
 'hard forward input gets visually near-horizontal body, not 15deg');
assert(diagon.pose.pitchDegrees<full.pose.pitchDegrees*.75,
 'diagonal flying should bank/lean rather than dive');
for(const value of [lockedForward,retreat,lockedSide,freeBack])
 assert.equal(value.pose.effort,0,'lock guard or free backward must not streamline');
for(const fps of [30,60,120]){
 const f=flight(0,1,false,1.6,fps);
 assert(Math.abs(f.pose.pitchDegrees-full.pose.pitchDegrees)<.3,
  'frame-independent whole-body pitch '+fps);
 let state=f.pose,intent=f.intent;
 for(let i=0;i<Math.round(.45*fps);i++){
  intent=control.step(intent,0,0,0,0,0,false,1/fps);
  state=streamline.step(state,intent,0,1/fps);
 }
 assert(state.pitchDegrees<7,'smooth recovery from hard forward '+fps);
}
const v=vertical.createState(),h=omni.createState();
const p152=owner.v152FlightPose(.8,0,0,1.4,v,h,still.intent,still.quiet);
const p153=owner.v153FlightPose(.8,0,0,1.4,v,h,still.intent,still.quiet,still.pose);
assert.equal(p153.streamlineWeight,0);
for(const key of Object.keys(p152.keys))
 assert.equal(p153.keys[key],p152.keys[key],'approved V152 hover preserved '+key);
for(const opts of [lockedForward,retreat,lockedSide]){
 const base=owner.v152FlightPose(.8,0,0,1.4,v,h,opts.intent,opts.quiet),
  next=owner.v153FlightPose(.8,0,0,1.4,v,h,opts.intent,opts.quiet,opts.pose);
 for(const k of Object.keys(base.keys))
  assert.equal(next.keys[k],base.keys[k],'lock-on exact V152 guard '+k);
 assert.equal(next.streamlineWeight,0);
}
const fast=owner.v153FlightPose(.8,0,0,1.4,v,h,full.intent,full.quiet,full.pose);
assert(fast.streamlineWeight>.99&&fast.streamlineDegrees>60);
const source=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 index=fs.readFileSync('index.html','utf8');
assert(source.includes('const streamline=clamp(pose?.streamlineWeight||0,0,1)'),
 'VRM real Kairo world leg and torso solvers must use physical streamline weight');
assert(source.includes('streamline>.001?1.50:.42')&&
 source.includes('streamline>.001?1.45:.42'),
 'world-space pelvis and chest corrections must allow 62-degree target');
assert(source.includes('-.95*streamline')&&source.includes('1.10*streamline'),
 'BOTH upper and lower legs must align rearward, not hang like upright hover');
assert(source.includes('v153?v153FlightPose(')&&
 source.includes('st.v153Motion=stream.step(')&&
 source.includes("v153?'streamlined'"),'V100 sole Kairo VRM writer');
assert(boot.includes("flags.set('flightPreview','v156')"));
assert(boot.includes("const BUILD='V156'"));
assert(boot.includes("await script('js/v153-streamlined-flight.js?v=1530')"));
assert(index.includes('release=156'));
assert(!source.includes('root.position.y+='));
console.log('PASS V153: hovering calm, 62deg strong flight body tilt, trailing legs, guarded lock-on, 30/60/120fps');
