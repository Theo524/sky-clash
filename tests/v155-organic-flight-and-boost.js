/* V155 repairs straight-line Kairo: authored hip/chest arch, bent trailing
 * independent shins and arms, readable real run-ground Boost and air Boost.
 * Explicitly safe old V153 and V154 URL rollback, no physics change.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const original=require('../js/v153-streamlined-flight.js');
const organic=require('../js/v155-organic-flight.js');
const owner=require('../js/v100-pose-authority.js');
assert.equal(organic.version,155);
assert(organic.arch.pelvisRadians>.77&&organic.arch.pelvisRadians<.94);
assert(organic.arch.spineRadians<organic.arch.pelvisRadians-.20);
const sample={
 age:1.5,profile:'V153 streamlined whole-body forward flight',
 keys:{leftElbowF:-.68,rightElbowF:-.62,leftHandF:-.75,rightHandF:-.72,
  leftKnee:.2,rightKnee:.06,leftShin:.28,rightShin:.30}
};
const hovered=organic.flightPose(sample,{effort:0}),travel=organic.flightPose(sample,{effort:1});
assert.deepEqual(hovered.keys,sample.keys,'no change to calm V152 hover or old guard');
assert.equal(hovered.flightCurve,0);
assert.equal(travel.profile,'V155 arched organic forward flight');
assert.equal(travel.flightCurve,1);
assert(travel.keys.leftElbowY<-.4&&travel.keys.rightElbowY<-.4);
assert(travel.keys.leftHandY<-.20&&travel.keys.rightHandY<-.15,
 'hands must articulate below trailing elbows');
assert.notEqual(travel.keys.leftElbowF,travel.keys.rightElbowF,
 'air arms must not be two straight mirrored sticks');
const deg=Math.atan2(1.03,.28)-Math.atan2(.57,.92);
assert(deg*180/Math.PI>36&&deg*180/Math.PI<55,
 'thigh and shin world directions should form a genuinely bent knee');
const quiet=organic.flightPose(sample,{effort:.5});
assert(quiet.streamlineWeight===.5&&quiet.keys.leftElbowF<0);
function sim(fps,air){
 const f={hp:100,sprinting:true,flying:air,vel:{x:0,y:0,z:22},t:0},
  st=organic.createState(),forward=original.createState();
 for(let i=0;i<fps*2;i++){
  const dt=1/fps;f.t=i*dt;
  organic.step(st,f,dt);
  original.step(forward,{forward:1,side:0,lock:false},6.2,dt);
 }
 return {f,st,forward};
}
const target=sim(60,true);
assert(target.forward.effort>.999&&target.st.air>.999);
for(const fps of [30,60,120]){
 const g=sim(fps,false),a=sim(fps,true);
 assert(g.st.ground>.99&&g.st.air===0,'ground Boost '+fps);
 assert(a.st.air>.99&&a.st.ground===0,'air Boost '+fps);
 assert(organic.groundMix(g.st)>.99,
  'approved Standard Run should replace crouched old 18-frame Boost entirely');
 const ap=organic.airPose(a.st,a.f);
 assert(ap.flightCurve>.99&&ap.keys.leftElbowY<-.4);
 assert(ap.keys.rightKnee<0&&ap.keys.leftKnee<0);
 assert(Math.abs(organic.arch.spineRadians-organic.arch.pelvisRadians)>.25);
 a.f.sprinting=false;g.f.sprinting=false;
 for(let i=0;i<fps*.5;i++){
  organic.step(a.st,a.f,1/fps);organic.step(g.st,g.f,1/fps);
 }
 assert(a.st.air<.004&&g.st.ground<.004,'released Boost spring '+fps);
}
const authority=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 adapter=fs.readFileSync('js/v72-published-actions.js','utf8'),
 boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 moduleSrc=fs.readFileSync('js/v155-organic-flight.js','utf8');
assert(authority.includes("pose?.flightCurvePelvisAngle??1.0821"));
assert(authority.includes("pose?.flightCurveChestAngle??1.00"));
assert(authority.includes("target.lerp(curvedThigh,curved).normalize()"));
assert(authority.includes("target.lerp(curvedShin,curved).normalize()"));
assert(authority.includes("v155?v155FlightPose(")&&authority.includes("v155?'organic-flight'"));
assert(adapter.includes("boostMode==='v155'?root.SkyClashV155Organic"));
assert(adapter.includes("const influence=boostMode==='v155'?blend"));
assert(adapter.includes("boostMode==='v155'?'organic-flight'"));
assert(boot.includes("const v155Preview="));
assert(boot.includes("await script('js/v155-organic-flight.js?v=1550')"));
assert(boot.includes("boostMode==='v155'?'&boostMotion=155'"));
assert(boot.includes("flags.set('flightPreview','v153')"),
 'preview should leave previous V153 default alone');
assert(!/\.animate\s*=/.test(moduleSrc.replace(/\/\*[\s\S]*?\*\//g,'')),
 'V155 module may not add a competing animation writer');
assert(!/\b(?:root|model)\.position\s*=/.test(moduleSrc));
assert(typeof owner.v155FlightPose==='function');
console.log('PASS V155: genuinely bent knee, 50deg curved body, soft asymmetric elbows, full reauthored sprint, 30/60/120fps, opt-in rollback');
