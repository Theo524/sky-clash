/* V93: actual humanoid frames must stay continuous with one locomotion owner,
 * WASD stays walk and outer JOYSTICK radius triggers approved Standard Run.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V93=require('../js/v93-grounded-locomotion.js');
const V71=require('../js/v71-mixamo-gameplay.js');
const V76=require('../js/v76-upper-body.js');
const V72=require('../js/v72-published-actions.js');
const read=p=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',p),'utf8'));
const pack=read('assets/animations/gameplay/studio-actions-v1.json');
const bySlot=Object.fromEntries(pack.motions.map(m=>[m.slot,m]));
assert.equal(bySlot.idle.sourceFile,'Movement/Adventure/idle (2).fbx');
assert.equal(bySlot.run.sourceFile,'Movement/Male/standard run.fbx');
const clips={
 idle:V72.decode(THREE,bySlot.idle),run:V72.decode(THREE,bySlot.run),
 legs:V71.decode(THREE,read('assets/animations/gameplay/kairo-walk-v1.json')),
 arms:V76.decode(THREE,read('assets/animations/gameplay/kairo-walk-arms-v1.json'))
};
const bones={},scene=new THREE.Group();
function node(name,parent,x=0,y=0,z=0){
 const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);
 parent.add(b);bones[name]=b;return b;
}
const hips=node('hips',scene,0,1,0),spine=node('spine',hips,0,.16),
 chest=node('chest',spine,0,.17),upper=node('upperChest',chest,0,.1),
 neck=node('neck',upper,0,.09);node('head',neck,0,.12);
for(const side of ['left','right']){
 const sign=side==='left'?1:-1;
 const sh=node(side+'Shoulder',upper,sign*.15,.07);
 const ua=node(side+'UpperArm',sh,sign*.13,-.035);
 const la=node(side+'LowerArm',ua,sign*.27,-.01);
 node(side+'Hand',la,sign*.24);
 const ul=node(side+'UpperLeg',hips,sign*.10,-.13);
 const ll=node(side+'LowerLeg',ul,0,-.44);
 node(side+'Foot',ll,0,-.40,.05);
}
assert.equal(V93.BONES.length,20);
const rig={legacyAxes:true,vrm:{
 scene,humanoid:{getNormalizedBoneNode:n=>bones[n]||null},update(){}
}};
const f={hp:100,vrmRig:rig,vel:new THREE.Vector3(),moveIntent:new THREE.Vector3(),
 v89Step:{mode:'idle',scale:0},v93AnalogRun:false,v80AnalogRun:false,
 sprinting:false,jumping:false,flying:false,dropping:false,launched:false,
 spiked:false,dashing:false,blockHeld:false,blocking:false,
 charging:false,slamming:false,stun:0,downT:0,punchT:0,
 blastT:0,superHitT:0,landingMotionT:0,acro:null,
 animate(){/* procedural rig writes still precede the single owner */
  for(const b of Object.values(bones))b.quaternion.identity();
 }};
const status={ready:true,frames:0,active:'waiting',error:null};
assert(V93.attach(THREE,f,clips,status));
function snap(){return V93.BONES.map(n=>bones[n].getWorldQuaternion(new THREE.Quaternion()));}
let worst=0,frames=0;
function tick(mode,count,speed,radius){
 f.v89Step.mode=mode;f.v89Step.scale=mode==='anticipate'?0:1;
 f.moveIntent.z=speed?1:0;f.vel.z=speed;
 f.v93AnalogRun=radius>=.91;
 for(let j=0;j<count;j++){
  const prior=snap();f.animate(1/60);
  assert(!status.error,'pose retarget must not throw: '+status.error);
  assert(V93.BONES.every(n=>Number.isFinite(bones[n].quaternion.w)));
  // world transforms can rotate more than locals due to accumulated
  // hierarchical movement. Record diagnostics, but don't hide a bad pose
  // behind stage assertions alone.
  const now=snap(),max=Math.max(...prior.map((q,i)=>q.angleTo(now[i])));
  worst=Math.max(max,worst);
  frames++;
 }
}
tick('idle',90,0,0);
const idlePose=snap();
tick('anticipate',8,0,0);
tick('first-step',15,1.4,0);
tick('walk',35,4.8,0);
assert.equal(status.active,'walk');
assert(f.v93SingleLocomotion.runWeight<.02,'WASD full input remains walk without physical stick');
tick('walk',35,6.9,1);
assert.equal(status.active,'standard-run','joystick at outer radius selects Standard Run');
assert(f.v93SingleLocomotion.runWeight>.75);
tick('walk',25,4.8,0);
assert(f.v93SingleLocomotion.runWeight<.35,'inner joystick releases run');
tick('settle',25,.12,0);
tick('idle',95,0,0);
assert.equal(status.active,'approved-idle');
const returnPose=snap();
assert(returnPose.every((q,i)=>q.angleTo(idlePose[i])<.60),
 'standing returns to the same approved idle family, not raised boxing arms');
assert(worst<1.1,'no single-frame full-body teleport in grounded motion');
assert(status.frames===frames,'one owner sampled every frame');
assert(!f.v76UpperBody,'second fighting-idle writer was not attached');
assert(!f.v71Walk,'second walk-leg writer was not attached');
const boot=fs.readFileSync(path.join(__dirname,'..','js/v66-game-boot.js'),'utf8');
assert(boot.includes("if(!singleLab)await window.SkyClashV71Walk.start(window)"));
assert(boot.includes("if(!singleLab)await window.SkyClashV76UpperBody.start(window)"));
assert(boot.includes("await window.SkyClashV93Grounded.start(window)"));
assert(boot.indexOf("SkyClashV93Grounded.start(window)")<
 boot.indexOf("SkyClashWalkStep.start(window)"),
 'V89 authored foot placement comes after one grounded VRM pose owner');
const published=fs.readFileSync(path.join(__dirname,'..','js/v72-published-actions.js'),'utf8');
assert(published.includes("get('stance')==='single'"),'V72 yields locomotion slots');
const engine=fs.readFileSync(path.join(__dirname,'..','src/95-game.js'),'utf8');
assert(engine.includes("p.v93StickRadius=Math.min(1,Math.hypot(Input._stick"));
assert(engine.includes("p.v93AnalogRun=p.v93StickRadius>(p.v93AnalogRun?.79:.91)"));
console.log('PASS V93: single-bone owner, original idle/run, joystick outer radius running, WASD walk, real skeleton transitions; worst frame '+(worst*180/Math.PI).toFixed(1)+'deg');
