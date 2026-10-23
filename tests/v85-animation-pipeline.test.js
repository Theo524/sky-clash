/* Regression tests for the V85 animation-state fix.
 * Run: node --test tests/v85-animation-pipeline.test.js
 * No browser, VRM model or external dependencies required.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const published=require('../js/v72-published-actions.js');
const transitions=require('../js/v81-pose-transitions.js');
function fighter(overrides={}){
 return {hp:100,t:0,vel:{x:0,y:0,z:0},
   moveIntent:{x:0,z:0},sprinting:false,skidT:0,
   landingMotionT:0,...overrides};
}
test('real Boost release selects grounded run-stop briefly',()=>{
 const actions={boost:{},runStop:{},idle:{}};
 const f=fighter({sprinting:true,vel:{x:19,y:0,z:0}});
 assert.equal(published.choose(f,actions),'boost');
 f.sprinting=false;f.skidT=.42;f.t=.016;
 assert.equal(published.choose(f,actions),'runStop');
 assert.ok(f._v85StopDuration>=.28&&f._v85StopDuration<=.58);
 assert.equal(transitions.stateOf(f),'boost-stop');
 f.t=.5;f.skidT=0;
 assert.notEqual(published.choose(f,actions),'runStop');
 assert.notEqual(transitions.stateOf(f),'boost-stop');
});
test('ordinary running or joystick release never plays Boost stop',()=>{
 const f=fighter({vel:{x:5,y:0,z:0},moveIntent:{x:1,z:0}});
 assert.notEqual(published.choose(f,{runStop:{},run:{},walk:{}}),'runStop');
 f.vel.x=0;f.moveIntent.x=0;
 assert.notEqual(published.choose(f,{runStop:{},idle:{}}),'runStop');
});
test('midair Boost release cannot trigger grounded stop',()=>{
 const actions={boost:{},runStop:{},idle:{}};
 const f=fighter({sprinting:true,flying:true,vel:{x:15,y:4,z:0}});
 published.choose(f,actions);
 f.sprinting=false;f.skidT=.42;f.t=.03;
 assert.notEqual(published.choose(f,actions),'runStop');
 assert.notEqual(transitions.stateOf(f),'boost-stop');
});
test('guard takes priority over active skid and recorded stop',()=>{
 const actions={boost:{},runStop:{},guard:{}};
 const f=fighter({sprinting:true,vel:{x:18,y:0,z:0}});
 published.choose(f,actions);
 f.sprinting=false;f.skidT=.42;f.t=.02;f.blockHeld=true;
 assert.equal(published.choose(f,actions),'guard');
 assert.equal(transitions.stateOf(f),'guard');
});
test('normal walk, joystick run, Boost, fall and landing remain distinct',()=>{
 assert.equal(transitions.stateOf(fighter({vel:{x:2,y:0,z:0}})),'walk');
 assert.equal(transitions.stateOf(fighter({vel:{x:6,y:0,z:0},v80AnalogRun:true})),'run');
 assert.equal(transitions.stateOf(fighter({sprinting:true})),'boost');
 assert.equal(transitions.stateOf(fighter({dropping:true,jumping:true,vel:{x:0,y:-4,z:0}})),'fall');
 assert.equal(transitions.stateOf(fighter({landingMotionT:.2})),'landing');
});
