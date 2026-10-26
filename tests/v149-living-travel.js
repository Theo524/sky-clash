/* V149: verify REAL skeletal motion, not V148's static direction lean.
 * Flight-approved left raised/right long leg never becomes a walk cycle.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const clip=require('../js/v149-travel-performance.js');
const omni=require('../js/v148-full-flight.js');
const vertical=require('../js/v146-vertical-followthrough.js');
const authority=require('../js/v100-pose-authority.js');
const {sample,keys,duration,channels,performance}=clip;
assert.equal(duration,4.6);
assert(keys.length>=8&&channels.length>=23,'whole-skeleton hand-authored performance');
assert.deepEqual(sample(0),sample(duration),'exact loop closure');
function travel(v=6.2,seconds=1.5){
 let s=omni.createState();
 for(let frame=0;frame<Math.round(seconds*60);frame++)
  s=omni.step(s,0,v,0,1/60);
 return s;
}
const forward=travel(6.2),back=travel(-6.2),neutral=travel(0);
for(const fps of [30,60,120]){
 let largest=0;
 for(let frame=0;frame<Math.round(duration*fps);frame++){
  const a=sample(frame/fps),b=sample((frame+1)/fps);
  for(const key of channels)largest=Math.max(largest,Math.abs(a[key]-b[key]));
 }
 assert(largest<.057,'no phase snap at '+fps+'fps: '+largest);
}
const from=[0,.64,1.24,1.92,2.6,3.28,3.92];
const compare=(s,t)=>authority.v149FlightPose(.8,0,0,t,vertical.createState(),s);
const base=(s,t)=>authority.v148FlightPose(.8,0,0,t,vertical.createState(),s);
function checkSamples(s,which){
 const samples=from.map(t=>compare(s,t)),prev=from.map(t=>base(s,t));
 assert(samples.every(p=>p.profile==='V149 living forward/back flight'));
 const span=(selector)=>{
  const xs=samples.map(selector);return Math.max(...xs)-Math.min(...xs);
 };
 assert(span(p=>p.keys.leftKnee)>.35,which+' raised knee ACTUALLY moves over flight');
 assert(span(p=>p.keys.rightKnee)>.14,which+' hanging knee flexes, not wooden');
 assert(span(p=>p.keys.leftShin)>.30,which+' folded calf changes shape');
 assert(span(p=>p.keys.rightShin)>.20,which+' long calf breathes');
 assert(span(p=>p.pelvisGoalF)>.07,which+' pelvis animated over cycle');
 assert(span(p=>p.chestGoalF)>.07,which+' chest not stiff');
 assert(span(p=>p.keys.leftHandF)>.14,which+' arm sweeps with momentum');
 assert(span(p=>p.keys.rightHandF)>.14,which+' other wrist follows later');
 assert(samples.every(p=>p.keys.leftKnee>.69&&p.keys.leftKnee<1.55),
   which+' maintain one folded leg, not flat standing');
 assert(samples.every(p=>p.keys.rightKnee<.42&&p.keys.rightKnee>-.04),
   which+' long leg never crosses into opposite walking step');
 assert(samples.every(p=>p.keys.leftShin>.72&&p.keys.rightShin<.65),
   which+' no stiff planted/pedalling calves');
 assert(samples.every(p=>p.keys.leftToe>=3.8&&p.keys.rightToe>=3.7),
   which+' approved unplanted toe-down shoes');
 assert(samples.every(p=>p.keys.leftHandY<0&&p.keys.rightHandY<0),
   which+' both wrists still hang below elbows');
 for(let i=0;i<samples.length;i++){
  assert(Math.abs(samples[i].keys.leftKnee-prev[i].keys.leftKnee)<.34,
   'authored moving leg is controlled, no violent snap');
 }
}
checkSamples(forward,'forward');
checkSamples(back,'backward');
for(const t of from){
 const a=compare(neutral,t),b=base(neutral,t);
 for(const key of Object.keys(b.keys))
  assert.equal(a.keys[key],b.keys[key],'V148 approved stationary/strafe leg and arm '+key);
 for(const key of ['pelvisGoalF','chestGoalF','pelvisGoalS','chestGoalS',
  'hipsX','spineX','chestX','neckX','hipsZ','spineZ','chestZ'])
  assert.equal(a[key],b[key],'approved stationary torso '+key);
}
const f0=performance(forward,1.24),b0=performance(back,1.24);
assert(f0.bodyF>0&&b0.bodyF<0,
 'backward travel uses opposing chest/hip movement');
assert(f0.leftKnee>.18&&b0.leftKnee>.23,
 'both directions feature real suspended knee motion');
assert(f0.rightHandF<0&&b0.rightHandF>0,
 'hands respond differently to forward and backward travel');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
const source=fs.readFileSync('js/v100-pose-authority.js','utf8');
assert(boot.includes("flags.set('flightPreview','v151')"),
 'V149 retained by explicit flightPreview rollback after V150 release');
assert(boot.includes("flags.set('jumpPreview','v125')"));
assert(boot.includes("await script('js/v149-travel-performance.js?v=1490')"));
assert(source.includes("flightVersion==='v149'"));
assert(source.includes("if(['v148','v149'].includes(new URLSearchParams(root.location?.search||'').get('flightPreview')))"),
 'V149 MUST advance the actual direction springs each WebGL frame');
assert(source.includes('if(v148||v149){'),
 'V149 MUST expose direction telemetry in the real VRM capture');
assert(source.includes("v149?'living-travel'"));
console.log('PASS V149: real travelling knee/calf/hip/chest/wrist motion, no walk cycle, 30/60/120fps, exact approved hover and V125 jump');
