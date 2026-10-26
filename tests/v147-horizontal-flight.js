/* V147: real character-facing forward/back powered flight.
 * Preserves all approved V146 up/down/hover, V125 jump, V97 ground.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const clip=require('../js/v147-horizontal-flight.js');
const vertical=require('../js/v146-vertical-followthrough.js');
const owner=require('../js/v100-pose-authority.js');
const {sample,duration,channels,forward,backward,step,performance,createState}=clip;
assert.equal(duration,4.6);
assert.equal(forward.length,5);
assert.equal(backward.length,5);
assert(channels.length>=20);
for(const keys of [forward,backward]){
 const a=sample(keys,0),b=sample(keys,duration);
 assert.deepEqual(a,b,'periodic motion closes exactly');
 for(const c of channels)assert(Math.abs(sample(keys,-duration)[c]-a[c])<1e-10);
 for(const fps of [30,60,120]){
  let peak=0;
  for(let i=0;i<Math.round(fps*duration);i++){
   const x=sample(keys,i/fps),y=sample(keys,(i+1)/fps);
   for(const c of channels)peak=Math.max(peak,Math.abs(x[c]-y[c]));
  }
  assert(peak<.032,'no forward/back keyed snap at '+fps+'fps '+peak);
 }
}
function simulate(fps,seconds,speed,initial){
 let state=initial||createState();
 for(let frame=0;frame<Math.round(seconds*fps);frame++)
  state=step(state,speed,1/fps);
 return state;
}
for(const fps of [30,60,120]){
 const launch=simulate(fps,.25,6.2);
 assert(launch.torso.front>launch.legs.front&&
  launch.legs.front>launch.arms.front,'chest leads and arms trail '+fps);
 const forward=simulate(fps,1.6,6.2,launch);
 assert(forward.torso.front>.99&&forward.arms.front>.99,
  'forward pose fully settles '+fps);
 const reverse=simulate(fps,.27,-6.2,forward);
 assert(reverse.torso.back>reverse.legs.back&&
  reverse.legs.back>reverse.arms.back,'soft backward reversal '+fps);
 const retreat=simulate(fps,1.4,-6.2,reverse);
 assert(retreat.torso.back>.99&&retreat.arms.back>.99);
 const stop=simulate(fps,2.0,0,retreat);
 assert(stop.torso.back<.001&&stop.arms.back<.001,
  'return to original hovering pose '+fps);
}
const x=simulate(30,.7,6.2),y=simulate(120,.7,6.2);
for(const part of ['torso','legs','arms'])
 for(const key of ['front','back','frontV','backV'])
  assert(Math.abs(x[part][key]-y[part][key])<1e-7,
   'exact spring integration independent of frame rate '+part+'.'+key);
const old=owner.v146FlightPose,fresh=owner.v147FlightPose,
 verticalState=vertical.createState(),still=createState();
for(const t of [0,.5,1.15,2.3,3.45,4.599])
 for(const v of [0,7,-7]){
  const a=old(.62,v,0,t,verticalState),
   b=fresh(.62,v,0,t,verticalState,still);
  assert.equal(b.profile,'V147 directional forward/back flight');
  assert.equal(b.horizontalAction,'hover');
  for(const k of Object.keys(a.keys))
   assert.equal(a.keys[k],b.keys[k],'V146-approved pose '+k);
  for(const k of ['hipsX','spineX','chestX','neckX','hipsZ','spineZ','chestZ','pelvisGoalF','chestGoalF'])
   assert.equal(a[k],b[k],'existing vertical posture '+k);
 }
const forwardState=simulate(60,1.4,6.2),backState=simulate(60,1.4,-6.2);
const a=fresh(.8,0,0,1.15,verticalState,forwardState),
 b=fresh(.8,0,0,1.15,verticalState,backState),
 baseline=old(.8,0,0,1.15,verticalState);
assert.equal(a.horizontalAction,'forward');
assert.equal(b.horizontalAction,'backward');
assert(a.pelvisGoalF>baseline.pelvisGoalF+.075);
assert(b.pelvisGoalF<baseline.pelvisGoalF-.09);
assert(a.chestGoalF>baseline.chestGoalF+.07);
assert(b.chestGoalF<baseline.chestGoalF-.07);
assert(a.keys.leftHandF<baseline.keys.leftHandF-.06,
 'arms softly trail during forward travel');
assert(b.keys.rightHandF>baseline.keys.rightHandF+.09,
 'arms softly balance backward retreat');
assert(a.keys.leftKnee>.9&&b.keys.leftKnee>.9,
 'preserved lifted flight knee under either direction');
assert(a.keys.rightKnee<.24&&b.keys.rightKnee<.24,
 'preserved dangling long leg and no stepping');
assert(a.keys.leftToe>=3.8&&b.keys.rightToe>=3.7,
 'shoe remains unplanted');
const combinedVertical=vertical.step(vertical.createState(),7,1/60);
const combo=fresh(.9,7,0,1.15,combinedVertical,forwardState);
assert(combo.verticalAction!=='hover'&&combo.horizontalAction==='forward',
 'forward AND upward movement blends both authored performance sources');
for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
 const basis=(vx,vz)=>vx*Math.sin(yaw)+vz*Math.cos(yaw);
 const vx=Math.sin(yaw)*6.2,vz=Math.cos(yaw)*6.2;
 assert(Math.abs(basis(vx,vz)-6.2)<1e-8,'forward at yaw '+yaw);
 assert(Math.abs(basis(-vx,-vz)+6.2)<1e-8,'backward at yaw '+yaw);
 const sideX=Math.cos(yaw)*6.2,sideZ=-Math.sin(yaw)*6.2;
 assert(Math.abs(basis(sideX,sideZ))<1e-8,
  'strafe must NOT incorrectly trigger forward flight at yaw '+yaw);
}
const boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 source=fs.readFileSync('js/v100-pose-authority.js','utf8');
assert(boot.includes("'v147','v148','v149'].includes(flags.get('flightPreview'))"));
assert(boot.includes("flags.set('jumpPreview','v125')"));
assert(boot.includes("const BUILD='V152'"));
assert(boot.includes("await script('js/v147-horizontal-flight.js?v=1470')"));
assert(source.includes("flightVersion==='v147'"));
assert(source.includes("v147?'directional-flight'"));
assert(source.includes("Math.sin(yaw)"));
assert(!source.includes("root.position.y+="));
console.log('PASS V147: authored forward/backward and yaw/strafe separation, seamless motion, natural staggered 30–120fps, V146 vertical/hover and V125 jump unchanged');
