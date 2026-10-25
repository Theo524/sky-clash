/* V148: one expressive aerial motion system for forward, backward,
 * strafe left/right, diagonals, turning/banking, acceleration, braking,
 * faster travel, and combined vertical movement. Never rewrites physics.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const clip=require('../js/v148-full-flight.js');
const vertical=require('../js/v146-vertical-followthrough.js');
const owner=require('../js/v100-pose-authority.js');
const {createState,step,performance,interpolate,beats,duration}=clip;
assert.equal(clip.version,148);
assert.equal(duration,4.6);
assert(beats.length>=6);
assert.deepEqual(interpolate(beats,0),interpolate(beats,duration));
for(const fps of [30,60,120]){
 let worst=0;
 for(let i=0;i<Math.floor(duration*fps);i++){
  const a=interpolate(beats,i/fps),
    b=interpolate(beats,(i+1)/fps);
  for(const key of ['torso','legs','arms','twist'])
   worst=Math.max(worst,Math.abs(a[key]-b[key]));
 }
 assert(worst<.052,'no abrupt keyframe jump at '+fps+'fps: '+worst);
}
function settled(vx,vz,yaw=0,secs=1.55,fps=60){
 let s=createState();
 for(let i=0;i<Math.round(secs*fps);i++)
  s=step(s,vx,vz,yaw,1/fps);
 return s;
}
const n=settled(0,0),f=settled(0,6.2),b=settled(0,-6.2),
 l=settled(-6.2,0),r=settled(6.2,0);
const baseline=owner.v146FlightPose(.75,0,0,1.45,vertical.createState()),
 pose=owner.v148FlightPose;
for(const t of [0,.64,1.45,2.22,3.28,4.59]){
 const p=pose(.75,0,0,t,vertical.createState(),n),
  old=owner.v146FlightPose(.75,0,0,t,vertical.createState());
 assert.equal(p.profile,'V148 full-body omni flight');
 assert.equal(p.omniMode,'hover');
 assert.equal(p.omniWeight,0);
 for(const key of Object.keys(old.keys))
  assert.equal(p.keys[key],old.keys[key],'user-approved neutral rig '+key);
 for(const key of ['hipsX','spineX','chestX','neckX','hipsZ','spineZ','chestZ',
  'pelvisGoalF','pelvisGoalS','chestGoalF','chestGoalS'])
  assert.equal(p[key],old[key],'neutral hover torso stays exact '+key);
}
const pf=pose(.75,0,0,1.45,vertical.createState(),f),
 pb=pose(.75,0,0,1.45,vertical.createState(),b),
 pl=pose(.75,0,0,1.45,vertical.createState(),l),
 pr=pose(.75,0,0,1.45,vertical.createState(),r);
assert.equal(pf.omniMode,'forward');
assert.equal(pb.omniMode,'backward');
assert.equal(pl.omniMode,'sideways');
assert.equal(pr.omniMode,'sideways');
assert(pf.pelvisGoalF>baseline.pelvisGoalF+.09,
 'forward motion must visibly involve real pelvis and chest');
assert(pb.pelvisGoalF<baseline.pelvisGoalF-.13,
 'backward motion counterlean '+JSON.stringify({got:pb.pelvisGoalF,baseline:baseline.pelvisGoalF,back:b.parts.torso.b,beat:clip.interpolate(beats,1.45).torso}));
assert(pf.chestGoalF>baseline.chestGoalF+.12,
 'front thrust engages spine, not only static legs');
assert(pb.chestGoalF<baseline.chestGoalF-.11,
 'backflight chest counterbalance');
assert(pf.keys.leftHandF<baseline.keys.leftHandF-.09,
 'forward arms trail visibly in time');
assert(pb.keys.leftHandF>baseline.keys.leftHandF+.10,
 'backward loose arms float ahead');
assert(pl.pelvisGoalS<baseline.pelvisGoalS-.10&&
 pr.pelvisGoalS>baseline.pelvisGoalS+.10,
 'lateral movement makes distinct full-body lean');
assert(pl.spineZ!==baseline.spineZ&&pr.spineZ!==baseline.spineZ,
 'lateral bank expressed through spine');
assert(pl.keys.leftElbowO>baseline.keys.leftElbowO+.10,
 'leading left arm dynamically opens');
assert(pr.keys.rightElbowO>baseline.keys.rightElbowO+.10,
 'leading right arm dynamically opens');
for(const p of [pf,pb,pl,pr]){
 assert(p.keys.leftKnee>.76&&p.keys.rightKnee<.35,
  'never destroy approved one-folded/one-dangling silhouette');
 assert(p.keys.leftToe>=3.8&&p.keys.rightToe>=3.7,
  'no planted flight shoes');
 assert(p.keys.leftHandY<0&&p.keys.rightHandY<0,
  'floating hands stay below elbows');
}
const diagonal=settled(4.4,4.4);
const pd=pose(.75,0,0,1.45,vertical.createState(),diagonal);
assert(pd.omniForward>.3&&pd.omniSide>.3,
 'diagonal smoothly blends both authored directions');
assert(pd.pelvisGoalF>baseline.pelvisGoalF&&
 pd.pelvisGoalS>baseline.pelvisGoalS,
 'diagonal pelvis blends forward and sideways');
const riseState=vertical.createState();
for(let i=0;i<110;i++)vertical.step(riseState,7,1/60);
const combo=pose(.75,7,0,1.45,riseState,diagonal);
assert.equal(combo.verticalAction,'ascending');
assert(combo.omniForward>.3&&combo.omniSide>.3,
 'forward/right/ascent animate simultaneously');
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 const faceX=Math.sin(yaw)*6.2,faceZ=Math.cos(yaw)*6.2;
 const x=settled(faceX,faceZ,yaw),
  y=settled(-faceX,-faceZ,yaw),
  side=settled(Math.cos(yaw)*6.2,-Math.sin(yaw)*6.2,yaw);
 assert(x.parts.torso.f>.95&&x.parts.torso.b<.005,
  'world-facing forward at yaw '+yaw);
 assert(y.parts.torso.b>.95&&y.parts.torso.f<.005,
  'world-facing retreat at yaw '+yaw);
 assert(side.parts.torso.r>.95&&side.parts.torso.f<.005,
  'sideways does not look forward at yaw '+yaw);
}
const turnState=createState();
for(let frame=0;frame<80;frame++)
 step(turnState,0,0,(frame/60)*1.8,1/60);
const pt=pose(.75,0,0,1.45,vertical.createState(),turnState);
assert(pt.omniTurn>.3,'physically yawing actor triggers full-body turn bank');
assert(Math.abs(pt.spineZ-baseline.spineZ)>.008,
 'turn shows through thorax instead of moving only camera');
for(const fps of [30,60,120]){
 let s=createState();
 for(let i=0;i<Math.round(fps*.3);i++)s=step(s,0,6.2,0,1/fps);
 assert(s.parts.torso.f>s.parts.legs.f&&s.parts.legs.f>s.parts.arms.f,
  'torso, then legs, then arms on launch at '+fps);
 for(let i=0;i<Math.round(fps*.28);i++)s=step(s,0,-6.2,0,1/fps);
 assert(s.parts.torso.b>s.parts.legs.b&&s.parts.legs.b>s.parts.arms.b,
  'all joints absorb reverse smoothly '+fps);
 for(let i=0;i<Math.round(fps*1.7);i++)s=step(s,0,0,0,1/fps);
 assert(s.parts.torso.f<.01&&s.parts.torso.b<.01&&s.parts.arms.b<.02,
  'damped braking returns to hover at '+fps);
}
const fast=settled(0,11.5),ordinary=settled(0,6.2);
assert(fast.parts.torso.fast>.9&&ordinary.parts.torso.fast<.02,
 'high-speed flight adds its own distinct torso/arm anticipation');
const pfast=pose(.75,0,0,1.45,vertical.createState(),fast);
assert(pfast.pelvisGoalF>pf.pelvisGoalF+.03,
 'speed-up intensifies body engagement');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 source=fs.readFileSync('js/v100-pose-authority.js','utf8');
assert(boot.includes("'v148','v149'].includes(flags.get('flightPreview'))"));
assert(boot.includes("flags.set('jumpPreview','v125')"));
assert(boot.includes("const BUILD='V149'"));
assert(boot.includes("await script('js/v148-full-flight.js?v=1480')"));
assert(source.includes("flightVersion==='v148'"));
assert(source.includes("v148?'omni-flight'"));
assert(!source.includes('root.position.y+='));
console.log('PASS V148: all directions, diagonal, turn, fast travel, acceleration/reversals, exact hover, unchanged V125 jump, 30/60/120fps');
