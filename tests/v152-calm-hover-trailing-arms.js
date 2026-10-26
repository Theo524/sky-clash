/* V152 — calm hover, clear rearward arm silhouette, no pose-owner conflict.
 * Real VRM WebGL capture is separate; this test checks geometric goals,
 * 30/60/120 fps timing, stable hover and V150/V151 rollback invariants.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const flight=require('../js/v152-flight-silhouette.js');
const input=require('../js/v150-joystick-flight.js');
const owner=require('../js/v100-pose-authority.js');
const v146=require('../js/v146-vertical-followthrough.js');
const v148=require('../js/v148-full-flight.js');
assert.equal(flight.version,152);
assert.equal(flight.keys.length,8);
for(const channel of flight.channels)
 assert(Math.abs(flight.sample(0)[channel]-flight.sample(4.6)[channel])<1e-10,
  'continuous authored loop: '+channel);
assert(Math.abs(flight.sample(1.2).leftHandF-flight.sample(3.2).leftHandF)>.03,
 'rearward arms animate, not a held static pose');
function scenario(x,z,locked=false,seconds=1.8,fps=60,vy=0){
 let state=flight.createState(),v150=input.createState();
 const mag=Math.hypot(x,z);
 for(let k=0;k<Math.round(seconds*fps);k++){
  v150=input.step(v150,x,z,x*6.2,z*6.2,0,locked,1/fps);
  state=flight.step(state,v150,vy,mag*6.2,1/fps);
 }
 return {state,v150};
}
const idle=scenario(0,0),forward=scenario(0,1),
 retreat=scenario(0,-1,true),lock=scenario(0,1,true),side=scenario(1,0,true),
 climb=scenario(0,0,false,1.8,60,6);
assert(idle.state.quiet>.99,'idle settles to steady hover');
assert(idle.state.elbow===0&&idle.state.hand===0,'hover not held in travel pose');
assert(forward.state.quiet<.01,'moving forward must not suppress living body performance');
assert(forward.state.elbow>.99&&forward.state.hand>.99,
 'true forward flight releases the arms into a different silhouette');
assert(lock.state.elbow<.001&&retreat.state.elbow<.001&&side.state.elbow<.001,
 'all lock-on directions preserve exact V150 guard');
assert(climb.state.quiet<.01,'climbing flight stays free to animate vertically');
const v=v146.createState(),h=v148.createState();
const testPose=(age,scenario)=>owner.v152FlightPose(.72,0,0,age,v,h,scenario.v150,scenario.state);
const baseHover=owner.v150FlightPose(.72,0,0,1.3,v,h,idle.v150);
const qHover=testPose(1.3,idle),approved=owner.v144FlightPose(0,0,0,0);
const lowMotion=['hipsX','spineX','chestX','neckX','pelvisGoalF','chestGoalF'];
for(const k of lowMotion)
 assert(Math.abs(qHover[k]-approved[k])<=
  Math.abs(baseHover[k]-approved[k])*.075+1e-8,
  'normal hover must suppress exaggerated ' +k);
const late=testPose(3.2,idle),early=testPose(1.3,idle);
const beforeLate=owner.v150FlightPose(.72,0,0,3.2,v,h,idle.v150);
for(const k of ['leftKnee','leftShin','leftHandF','rightHandY']){
 assert(Math.abs(late.keys[k]-early.keys[k])<
   Math.abs(beforeLate.keys[k]-baseHover.keys[k])*.085+.0002,
   'idle knee/arm keys should hold still instead of swinging wildly: '+k);
}
const oldF=owner.v150FlightPose(.72,0,0,1.3,v,h,forward.v150);
const newF=testPose(1.3,forward);
for(const k of ['hipsX','spineX','chestX','neckX','hipsZ','spineZ','chestZ',
 'pelvisGoalF','pelvisGoalS','chestGoalF','chestGoalS',
 'leftKnee','rightKnee','leftShin','rightShin','leftToe','rightToe'])
 assert.equal(newF.keys[k]??newF[k],oldF.keys[k]??oldF[k],
  'forward travel body/legs remain exactly V150: '+k);
const changed=Object.keys(oldF.keys).filter(k=>newF.keys[k]!==oldF.keys[k]);
assert.deepEqual(changed.sort(),flight.channels.slice().sort(),
 'only real elbow and hand directional bone goals change during travel');
for(const side of ['left','right']){
 assert(newF.keys[side+'ElbowF']<-.42&&newF.keys[side+'HandF']<-.45,
  'rearward elbows and hands must clearly trail, not look like V151: '+side);
 assert(newF.keys[side+'HandF']<oldF.keys[side+'HandF']-.75,
  'must be a large visually measurable silhouette change, not 5 cm: '+side);
 assert(newF.keys[side+'ElbowO']<.52,'no outstretched airplane wings');
}
for(const opts of [lock,retreat,side]){
 const original=owner.v150FlightPose(.72,0,0,1.3,v,h,opts.v150);
 const now=testPose(1.3,opts);
 for(const k of Object.keys(original.keys))
  assert.equal(now.keys[k],original.keys[k],'locked flight retains V150 guard '+k);
}
for(const fps of [30,60,120]){
 const a=scenario(0,1,false,1.8,fps);
 assert(Math.abs(a.state.elbow-forward.state.elbow)<.004&&
  Math.abs(a.state.hand-forward.state.hand)<.012,'consistent natural arm ease '+fps);
 const q=scenario(0,0,false,1.8,fps);
 assert(Math.abs(q.state.quiet-idle.state.quiet)<.004,'steady hover consistent '+fps);
 // Forward -> hover, then hover -> locked guard. No abrupt jumps:
 let arm=a.state,i=a.v150;
 for(let frame=0;frame<Math.round(1.3*fps);frame++){
  i=input.step(i,0,0,0,0,0,false,1/fps);
  arm=flight.step(arm,i,0,0,1/fps);
 }
 assert(arm.quiet>.98&&arm.elbow<.01&&arm.hand<.02,
  'no leftover travel arms or snap during calm hover recovery '+fps);
}
const boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 pose=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 index=fs.readFileSync('index.html','utf8');
assert(boot.includes("flags.set('flightPreview','v156')"));
assert(boot.includes("const BUILD='V156'"));
assert(boot.includes("await script('js/v152-flight-silhouette.js?v=1520')"));
assert(boot.includes("await script('js/v150-joystick-flight.js?v=1500')"));
assert(index.includes('release=156'));
assert(pose.includes("v152?v152FlightPose(")&&
 pose.includes("st.v152Motion=clip.step(")&&
 pose.includes("v152?'quiet-travel'"),
 'existing V100 must be the only flight bone writer');
assert(!pose.includes('root.position.y+='));
console.log('PASS V152: quiet stable hover, real trailing arms, combat guard preservation, 30/60/120fps seamless easing, no root mutations');
