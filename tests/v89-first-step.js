/* V89: staged idle > weight transfer > first contact > walk > settle.
 * Unit checks are not claims of visual quality; user checks actual Kairo.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lib=require('../js/v89-grounded-step.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const fresh=()=>({
 hp:100,pos:{y:0},floor:0,vel:{x:0,y:0,z:0},
 moveIntent:{x:0,z:0},sprinting:false,jumping:false,flying:false,
 launched:false,spiked:false,dashing:false,blockHeld:false,blocking:false,
 stun:0,punchT:0,downT:0
});
const f=fresh(),frame=1/60;
let s=lib.plan(f,frame);
assert.equal(s.mode,'idle');
assert.equal(s.scale,0);
f.moveIntent.z=1;
s=lib.plan(f,frame);
assert.equal(s.mode,'anticipate');
assert.equal(s.scale,0,'first frames shift weight without sliding the root');
for(let i=0;i<4;i++)lib.plan(f,frame);
assert.equal(s.mode,'anticipate');
for(let i=0;i<3;i++)lib.plan(f,frame);
assert.equal(s.mode,'first-step');
assert(s.scale<.1,'leading foot begins before full travel');
for(let i=0;i<7;i++)lib.plan(f,frame);
assert.equal(s.mode,'first-step');
assert(s.scale>0&&s.scale<1,'first stride progressively releases horizontal travel');
for(let i=0;i<18;i++)lib.plan(f,frame);
assert.equal(s.mode,'walk');
assert.equal(s.scale,1);
f.vel.z=4;f.moveIntent.z=0;
lib.plan(f,frame);
assert.equal(s.mode,'settle');
assert.equal(s.scale,0,'walk release begins braking');
for(let i=0;i<18;i++)lib.plan(f,frame);
assert.equal(s.mode,'settle','do not return to idle while fighter still moves');
f.vel.z=.12;lib.plan(f,frame);
assert.equal(s.mode,'idle','settle completes after slowing down');
const interrupted=fresh();interrupted.moveIntent.z=1;
lib.plan(interrupted,frame);interrupted.sprinting=true;
assert.equal(lib.plan(interrupted,frame).mode,'inactive','Boost bypasses walking choreography');
interrupted.sprinting=false;interrupted.jumping=true;
assert.equal(lib.plan(interrupted,frame).mode,'inactive','jumping bypasses walking choreography');
const src=read('src/45-fighter-controller.js');
assert(src.includes('window.SkyClashWalkStep.plan(this,dt)'), 'physics must use the same step clock');
assert(src.includes('target.x*=step.scale;target.z*=step.scale'), 'no world sliding during anticipation');
assert(src.includes("groundedStop?16:rate"),'quick deceleration to grounded stance');
const boot=read('js/v66-game-boot.js');
assert(boot.includes("if(stepLab)await script('js/v89-grounded-step.js?v=890')"));
assert(boot.includes('if(stepLab)window.SkyClashWalkStep.start(window)'));
const walk=read('js/v71-mixamo-gameplay.js');
assert(walk.includes("const activation=prepared"),'visual foot cycle must share stepping state');
const published=read('assets/animations/gameplay/studio-actions-v1.json');
const manifest=JSON.parse(published);
assert.equal(manifest.motions.find(x=>x.slot==='idle').sourceFile,
 'Movement/Adventure/idle (2).fbx');
assert.equal(manifest.motions.find(x=>x.slot==='run').sourceFile,
 'Movement/Male/standard run.fbx');
console.log('PASS V89: shared first-step timing, physics gating, settle, Boost/jump exclusion, untouched approved assets');
