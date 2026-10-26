/* V146: actual velocity-responsive, critically damped, expressive
 * VRM0 skeletal ascent and descent with approved V144 hover untouched.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const track=require('../js/v146-vertical-followthrough.js');
const owner=require('../js/v100-pose-authority.js');
const old=owner.v144FlightPose;
const fresh=owner.v146FlightPose;
assert.equal(typeof fresh,'function');
assert.equal(track.version,146);
const EPS=1e-7;
function checkHover(){
 const zero=track.createState();
 for(const time of [0,.4,.87,1.15,2.3,3.4,4.599])
  for(const speed of [0,2.1]){
   const a=old(speed,0,0,time),b=fresh(speed,0,0,time,zero);
   assert.equal(b.profile,'V146 expressive vertical follow-through');
   assert.equal(b.verticalAction,'hover');
   assert.equal(b.verticalActionStrength,0);
   for(const key of Object.keys(a.keys))
    assert.equal(a.keys[key],b.keys[key],'approved V144 body/arms/legs '+key);
   for(const key of ['hipsX','spineX','chestX','neckX','hipsZ','spineZ','chestZ','pelvisGoalF','chestGoalF'])
    assert.equal(a[key],b[key],'approved V144 torso '+key);
  }
}
checkHover();
function simulate(fps,seconds,velocity,start=null){
 let state=start||track.createState();
 for(let i=0;i<Math.round(seconds*fps);i++)state=track.step(state,velocity,1/fps);
 return state;
}
for(const fps of [30,60,120]){
 const start=simulate(fps,.25,7);
 assert(start.torso.up>start.legs.up&&start.legs.up>start.arms.up,
  'hips lead, knees then wrists with natural follow-through at '+fps);
 assert(start.arms.up>0);
 const rise=simulate(fps,1.15,7);
 assert(rise.torso.up>.99&&rise.legs.up>.985&&rise.arms.up>.96,
  'settles to full ascent despite staggered timing at '+fps);
 const reverse=simulate(fps,.27,-7,rise);
 assert(reverse.torso.drop>reverse.legs.drop&&reverse.legs.drop>reverse.arms.drop,
  'reversal legs and arms follow torso, no snap '+fps);
 const down=simulate(fps,1.5,-7,reverse);
 assert(down.torso.drop>.99&&down.arms.drop>.97,'settles to descent at '+fps);
 const stop=simulate(fps,2.0,0,down);
 assert(stop.torso.up<.001&&stop.torso.drop<.001&&stop.arms.drop<.005,
  'returns gracefully to V144 hover at '+fps);
}
const near=(a,b,t)=>Math.abs(a-b)<t;
const s30=simulate(30,.6,7),s120=simulate(120,.6,7);
for(const group of ['torso','legs','arms'])for(const k of ['up','drop','upV','dropV'])
 assert(near(s30[group][k],s120[group][k],EPS),
 'exact frame-rate-independent spring '+group+'.'+k);
const rise=simulate(60,1.6,7),fall=simulate(60,1.6,-7);
const up=fresh(0,7,0,2.3,rise),down=fresh(0,-7,0,2.3,fall);
const neutral=old(0,0,0,2.3);
assert(up.verticalAction==='ascending'&&down.verticalAction==='descending');
assert(up.pelvisGoalF<neutral.pelvisGoalF-.075,'clearly legible ascent counterlean');
assert(down.pelvisGoalF>neutral.pelvisGoalF+.085,'clearly legible descent counterlean');
assert(up.keys.leftKnee>neutral.keys.leftKnee+.13,'rise gathers lead knee');
assert(down.keys.leftKnee<neutral.keys.leftKnee-.16,'descent extends lead knee');
assert(up.keys.leftShin>.98&&down.keys.leftShin>.95,'approved curled calf protected');
assert(up.keys.rightKnee<.32&&down.keys.rightKnee<.30,'long hanging leg protected');
assert(up.keys.leftToe>=3.8&&down.keys.leftToe>=3.8,'unplanted toes preserved');
assert(up.keys.leftElbowO>neutral.keys.leftElbowO,
 'rising shoulders have readable expression');
assert(down.keys.rightElbowO>neutral.keys.rightElbowO+.12,
 'falling arms open gently for balance');
assert(down.keys.rightHandY<0&&up.keys.leftHandY<0,'hands still hang naturally');
for(const velocity of [-7,-4,-1,0,1,4,7]){
 let state=track.createState();
 for(let i=0;i<150;i++)state=track.step(state,velocity,1/60);
 const pose=fresh(0,velocity,0,1.15,state);
 assert(Object.values(pose.keys).every(Number.isFinite),'finite VRM joint target');
 assert(pose.keys.leftKnee>.74&&pose.keys.rightKnee<.35,'flight silhouette at '+velocity);
}
let impulse=simulate(60,1.2,7);
for(let i=0;i<90;i++){
 impulse=track.step(impulse,-7,1/60);
 for(const group of ['torso','legs','arms'])for(const k of ['up','drop']){
  assert(impulse[group][k]>=0&&impulse[group][k]<=1,'stable bounded limb spring');
 }
 const motion=track.performance(impulse,i/60);
 assert(Object.values(motion).every(Number.isFinite),'finite smooth motion during reversal');
}
const boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 authority=fs.readFileSync('js/v100-pose-authority.js','utf8');
assert(boot.includes("'v146','v147','v148','v149'].includes(flags.get('flightPreview'))"));
assert(boot.includes("flags.set('jumpPreview','v125')"));
assert(boot.includes("const BUILD='V156'"));
assert(boot.includes("await script('js/v146-vertical-followthrough.js?v=1460')"));
assert(authority.includes("flightVersion==='v146'"));
assert(authority.includes("v146?'expressive-vertical'"));
console.log('PASS V146 staged expressive ascent/descent, smooth 30/60/120 fps and reversals; V144 hover, V125 jump, and physics preserved');
