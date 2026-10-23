/* V90 idle stance preview: preserve exact approved clip, bridge the actual
 * displayed pose into the first step and back after a complete foot settle.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const lib=require('../js/v89-grounded-step.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function fighter(){return {
 hp:100,vel:{x:0,y:0,z:0},moveIntent:{x:0,z:0},
 sprinting:false,jumping:false,flying:false,launched:false,
 spiked:false,dashing:false,blocking:false,blockHeld:false,
 stun:0,downT:0,punchT:0,blastT:0,superHitT:0,charging:false,slamming:false
};}
const originalLocation=globalThis.location;
const dt=1/60;
try{
 globalThis.location={search:'?movementLab=step&stance=match'};
 const a=fighter();
 assert.equal(lib.plan(a,dt).mode,'idle');
 a.moveIntent.z=1;
 assert.equal(lib.plan(a,dt).mode,'anticipate');
 assert.equal(a.v89Step.scale,0,'starts at actual stationary idle');
 for(let i=0;i<9;i++)lib.plan(a,dt);
 assert.equal(a.v89Step.mode,'first-step');
 assert(a.v89Step.scale<1,'first step does not teleport into full speed');
 for(let i=0;i<25;i++)lib.plan(a,dt);
 assert.equal(a.v89Step.mode,'walk');
 a.vel.z=3.0;a.moveIntent.z=0;
 for(let i=0;i<17;i++)lib.plan(a,dt);
 assert.equal(a.v89Step.mode,'settle',
  'idle must wait while fighter is still physically moving');
 assert.equal(a.v89Step.slowElapsed,0);
 a.vel.z=.29;
 for(let i=0;i<9;i++)lib.plan(a,dt);
 assert.equal(a.v89Step.mode,'settle','do not snap to idle halfway through the planted return');
 assert(a.v89Step.slowElapsed>.12&&a.v89Step.slowElapsed<.22);
 for(let i=0;i<8;i++)lib.plan(a,dt);
 assert.equal(a.v89Step.mode,'idle','complete the matched pose before resuming original idle');

 const bone=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);
 const neutral=new THREE.Quaternion();
 const pose=[{quaternion:bone.clone()}];
 assert.equal(lib.matchPose(pose,[neutral],0),0);
 assert(pose[0].quaternion.angleTo(neutral)<.0001,'first matched frame is exactly the prior visual pose');
 pose[0].quaternion.copy(bone);
 assert.equal(lib.matchPose(pose,[neutral],1),1);
 assert(pose[0].quaternion.angleTo(bone)<.0001,'last matched frame is new pose');
 pose[0].quaternion.copy(bone);
 lib.matchPose(pose,[neutral],.5);
 assert(pose[0].quaternion.angleTo(neutral)>.6&&
        pose[0].quaternion.angleTo(neutral)<.95,'intermediate stance blends smoothly');

 // Old V89 remains unchanged when stance preview is not requested.
 globalThis.location={search:'?movementLab=step'};
 const b=fighter(); b.moveIntent.z=1;
 for(let i=0;i<40;i++)lib.plan(b,dt);
 b.moveIntent.z=0;b.vel.z=.25;
 for(let i=0;i<15;i++)lib.plan(b,dt);
 assert.equal(b.v89Step.mode,'idle','normal V89 keeps its previous stop timing');
}finally{
 if(originalLocation===undefined)delete globalThis.location;
 else globalThis.location=originalLocation;
}
const assets=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
assert.equal(assets.motions.find(m=>m.slot==='idle').sourceFile,'Movement/Adventure/idle (2).fbx');
assert.equal(assets.motions.find(m=>m.slot==='run').sourceFile,'Movement/Male/standard run.fbx');
const boot=read('js/v66-game-boot.js');
assert(boot.includes("if(stepLab)await script('js/v89-grounded-step.js?v=890')"));
assert(boot.includes("get('stance')==='match'?'&fix=90':'&fix=89'"));
assert(boot.includes("'&stance=90'"));
const step=read('js/v89-grounded-step.js');
assert(step.includes('st.launchPose=st.lastVisible'));
assert(step.includes('st.stopPose=st.lastVisible'));
assert(step.includes('st.lastVisible=st.stanceNodes.map'));
assert(step.includes("g.slowElapsed||0"));
console.log('PASS V90: exact last-seen-stance bridge, no pop on first step / stop, approved idle and run unchanged, V89 rollback intact');
