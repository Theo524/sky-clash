/* V97: Kairo's underlying V76 idle arms must exactly match the
 * published approved idle (2), even through walk->stand and run->stand.
 * Do not change V94 interpolation, V95 gait, Boost, or the 20-bone rig.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V76=require('../js/v76-upper-body.js');
const V72=require('../js/v72-published-actions.js');
const V79=require('../js/v79-extra-actions.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const motion=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json')).motions;
const idle=motion.find(m=>m.slot==='idle'),run=motion.find(m=>m.slot==='run');
assert.equal(idle.sourceFile,'Movement/Adventure/idle (2).fbx');
assert.equal(run.sourceFile,'Movement/Male/standard run.fbx');
const approved=V72.decode(THREE,idle),standardRun=V72.decode(THREE,run);
const fighting=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-fighting-idle-v1.json')));
const walk=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-walk-arms-v1.json')));
const ids=V76.BONES;
const aa=V72.BONES.map(()=>new THREE.Quaternion());
const bb=ids.map(()=>new THREE.Quaternion());
approved.sample(0,aa,true);fighting.sample(0,bb);
assert(aa[V72.BONES.indexOf('rightLowerArm')].angleTo(bb[ids.indexOf('rightLowerArm')])>2.5,
 'reproduce the 140+ degree idle forearm mismatch responsible for raised hand');
function make(){
 const scene=new THREE.Group(),bones={};
 const node=(name,parent,xyz)=>{const b=new THREE.Bone();b.name=name;
  b.position.set(...xyz);parent.add(b);bones[name]=b;return b;};
 const hips=node('hips',scene,[0,1,0]);
 const spine=node('spine',hips,[0,.17,0]);
 const chest=node('chest',spine,[0,.19,0]);
 const upperChest=node('upperChest',chest,[0,.1,0]);
 const neck=node('neck',upperChest,[0,.11,0]);
 node('head',neck,[0,.13,0]);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const shoulder=node(side+'Shoulder',upperChest,[sign*.13,.05,0]);
  const arm=node(side+'UpperArm',shoulder,[sign*.12,0,0]);
  const elbow=node(side+'LowerArm',arm,[sign*.28,0,0]);
  node(side+'Hand',elbow,[sign*.21,0,0]);
  const leg=node(side+'UpperLeg',hips,[sign*.12,-.1,0]);
  const knee=node(side+'LowerLeg',leg,[0,-.44,0]);
  node(side+'Foot',knee,[0,-.44,.05]);
 }
 const rig={legacyAxes:true,vrm:{scene,humanoid:{getNormalizedBoneNode:n=>bones[n]||null},update(){}}};
 const fighter={hp:100,vrmRig:rig,name:'Kairo Venn',
  vel:new THREE.Vector3(),moveIntent:new THREE.Vector3(),pos:new THREE.Vector3(),
  t:0,floor:0,sprinting:false,flying:false,jumping:false,dropping:false,
  launched:false,spiked:false,dashing:false,slamming:false,
  punchT:0,blastT:0,superHitT:0,downT:0,stun:0,charging:false,
  blocking:false,blockHeld:false,acro:null,landingMotionT:0,
  v71Walk:{weight:0,clock:0},animate(){}};
 return {fighter,bones};
}
function pose(m){return ids.map(n=>m.bones[n].getWorldQuaternion(new THREE.Quaternion()));}
const gap=(a,b)=>Math.max(...a.map((q,i)=>q.angleTo(b[i])));
const oldLoc=globalThis.location,oldSky=globalThis.SkyClash,
 oldPublished=globalThis.SkyClashPublishedActions;
try{
 globalThis.location={search:'?movementLab=step&stance=handoff&joystickRun=on&idleArms=matched'};
 globalThis.SkyClashPublishedActions={approvedIdle:approved};
 const matched=make(),status={originalWalkStyle:false,frames:0};
 globalThis.SkyClash={Game:{heroes:{kairo_venn:matched.fighter},player:matched.fighter}};
 V76.attach(THREE,matched.fighter,fighting,walk,status);
 for(let i=0;i<100;i++)matched.fighter.animate(1/60);
 assert.equal(status.idleSource,'approved-idle (2)');
 assert.equal(status.sourceMatch,true);
 const matchedStill=pose(matched);

 const expected=make();
 globalThis.SkyClash={Game:{heroes:{kairo_venn:expected.fighter},player:expected.fighter}};
 V72.attach(THREE,expected.fighter,{idle:approved,run:standardRun},{}, {});
 for(let i=0;i<100;i++)expected.fighter.animate(1/60);
 const expectedStill=pose(expected);
 assert(gap(matchedStill,expectedStill)<.20,
  'V76 and V72 must produce the SAME approved idle arm pose, not separate fighting arms');

 // Resume original walk from approved idle, return smoothly to exactly
 // that same shoulder/elbow/wrist stance after letting the gait settle.
 globalThis.SkyClash={Game:{heroes:{kairo_venn:matched.fighter},player:matched.fighter}};
 for(let i=0;i<45;i++){
  matched.fighter.v71Walk.weight=Math.min(1,(i+1)/26);
  matched.fighter.v71Walk.clock+=1/60;
  matched.fighter.animate(1/60);
 }
 for(let i=0;i<55;i++){
  matched.fighter.v71Walk.weight=Math.max(0,1-(i+1)/31);
  matched.fighter.animate(1/60);
 }
 assert.equal(status.idleSource,'approved-idle (2)');
 assert(gap(matchedStill,pose(matched))<.20,
  'walk→idle returns to approved stance, not raised fighting-idle');
 // Idle variants are still disabled in matched mode, including after 26s
 // without joystick movement.
 const extraActions={idle3:{seconds:3},idleAdventure:{seconds:4},
  idle4:{seconds:2.5},idle5:{seconds:2.3}};
 matched.fighter.vel.z=0;
 for(let i=0;i<600;i++)
  assert.equal(V79.choose(matched.fighter,extraActions,.08),null,
   'optional arm-raise idle must not interrupt stillness or tiny joystick input');

 const legacy=make(),legacyStatus={originalWalkStyle:false};
 globalThis.SkyClash={Game:{heroes:{kairo_venn:legacy.fighter},player:legacy.fighter}};
 globalThis.location={search:'?movementLab=step&stance=handoff&joystickRun=on&idleArms=steady'};
 V76.attach(THREE,legacy.fighter,fighting,walk,legacyStatus);
 for(let i=0;i<100;i++)legacy.fighter.animate(1/60);
 assert.equal(legacyStatus.idleSource,'legacy-fighting-idle');
 assert(gap(pose(legacy),expectedStill)>.5,
  'legacy conflict should remain demonstrably different for comparison');
}finally{
 if(oldLoc===undefined)delete globalThis.location;else globalThis.location=oldLoc;
 if(oldSky===undefined)delete globalThis.SkyClash;else globalThis.SkyClash=oldSky;
 if(oldPublished===undefined)delete globalThis.SkyClashPublishedActions;
 else globalThis.SkyClashPublishedActions=oldPublished;
}
const boot=read('js/v66-game-boot.js');
assert(boot.includes("e.src+='&arms=97'"));
assert(boot.includes("e.src+=armsParam==='matched'?'&idle=97':'&idle=96'"));
assert(boot.includes("e.src+='&fix=94'"));
assert(boot.includes("if(joystickLab)await script('js/v95-joystick-radius.js?v=950')"));
const controller=read('src/45-fighter-controller.js');
assert(controller.includes("this.v95JoystickRun&&!this.sprinting&&!this.flying?6.2:normalSpeed"),
 'V95 run physics must remain unchanged');
console.log('PASS V97: real V76 and V72 arm poses agree; walk and stop return to approved idle; V95 run/Boost untouched; optional gestures blocked');
