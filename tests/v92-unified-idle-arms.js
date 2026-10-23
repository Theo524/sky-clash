/* V92: validate the actual approved idle controls all 8 arm bones.
 * Prior V76 fighting-idle is up to 171 degrees away at the right elbow,
 * exposing an "arms suddenly up" pose when V72 published idle faded out.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V76=require('../js/v76-upper-body.js');
const V72=require('../js/v72-published-actions.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pack=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
const approvedEntry=pack.motions.find(m=>m.slot==='idle');
assert.equal(approvedEntry.sourceFile,'Movement/Adventure/idle (2).fbx');
assert.equal(pack.motions.find(m=>m.slot==='run').sourceFile,'Movement/Male/standard run.fbx');
const approved=V72.decode(THREE,approvedEntry);
const oldIdle=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-fighting-idle-v1.json')));
const walk=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-walk-arms-v1.json')));
const arms=V76.BONES;
const a=V72.BONES.map(()=>new THREE.Quaternion()),b=arms.map(()=>new THREE.Quaternion());
approved.sample(0,a,true);
oldIdle.sample(0,b);
const elbows=arms.map((n,i)=>({bone:n,d:a[V72.BONES.indexOf(n)].angleTo(b[i])}));
assert(elbows.find(x=>x.bone==='rightLowerArm').d>2.5,
 'must reproduce the broken ~171-degree competing idle forearm');
function make(){
 const scene=new THREE.Group(),bones={};
 function bone(n,parent,xyz){
  const x=new THREE.Bone();x.name=n;x.position.set(...xyz);parent.add(x);bones[n]=x;return x;
 }
 const hips=bone('hips',scene,[0,1,0]);
 const spine=bone('spine',hips,[0,.18,0]);
 const chest=bone('chest',spine,[0,.18,0]);
 const upperChest=bone('upperChest',chest,[0,.08,0]);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const shoulder=bone(side+'Shoulder',upperChest,[sign*.13,.05,0]);
  const upper=bone(side+'UpperArm',shoulder,[sign*.12,0,0]);
  const lower=bone(side+'LowerArm',upper,[sign*.28,0,0]);
  bone(side+'Hand',lower,[sign*.23,0,0]);
 }
 const rig={legacyAxes:true,vrm:{scene,humanoid:{
  getNormalizedBoneNode:n=>bones[n]||null
 },update(){}}};
 const fighter={hp:100,vrmRig:rig,vel:new THREE.Vector3(),
  flying:false,jumping:false,launched:false,spiked:false,dashing:false,
  sprinting:false,slamming:false,punchT:0,blastT:0,superHitT:0,
  stun:0,downT:0,charging:false,blocking:false,blockHeld:false,
  v71Walk:{weight:0,clock:0},animate(){}};
 return {bones,fighter};
}
const originalLocation=globalThis.location;
const originalActions=globalThis.SkyClashPublishedActions;
try{
 globalThis.location={search:'?movementLab=step&stance=unified'};
 globalThis.SkyClashPublishedActions={ready:true,approvedIdle:approved};
 const {bones,fighter}=make(),status={originalWalkStyle:false,frames:0};
 V76.attach(THREE,fighter,oldIdle,walk,status);
 for(let i=0;i<60;i++)fighter.animate(1/60);
 assert.equal(status.idleSource,'approved-idle (2)');
 const unifiedPose=arms.map(n=>bones[n].getWorldQuaternion(new THREE.Quaternion()));
 for(let i=0;i<30;i++){
  fighter.v71Walk.weight=Math.min(1,(i+1)/24);
  fighter.v71Walk.clock+=1/60;
  fighter.animate(1/60);
 }
 assert.equal(status.idleSource,'approved-idle (2)',
  'approved idle should remain the source all the way into walking');
 for(let i=0;i<28;i++){
  fighter.v71Walk.weight=Math.max(0,1-(i+1)/24);
  fighter.animate(1/60);
 }
 assert.equal(status.idleSource,'approved-idle (2)',
  'approved idle must return without exposing fighting-idle under the fade');
 const back=arms.map(n=>bones[n].getWorldQuaternion(new THREE.Quaternion()));
 assert(back.every((q,i)=>q.angleTo(unifiedPose[i])<.35),
  're-enter the same approved standing posture after walking');
 const visible=read('js/v72-published-actions.js');
 assert(visible.includes("entry.slot==='idle'&&i>=6&&i<=13"),
  'only V76 may write idle arm joints in unified preview');
 assert(visible.includes('status.approvedIdle=actions.idle'),
  'V76 must use the exact same approved source as V72');
 assert(read('js/v76-upper-body.js').includes("status.idleSource='approved-idle (2)'"));
 const normal=make(),legacyStatus={originalWalkStyle:false};
 globalThis.location={search:'?movementLab=step'};
 V76.attach(THREE,normal.fighter,oldIdle,walk,legacyStatus);
 for(let i=0;i<40;i++)normal.fighter.animate(1/60);
 assert.equal(legacyStatus.idleSource,'legacy-fighting-idle',
  'old preview behavior remains available for A/B comparison');
 assert(arms.some(n=>normal.bones[n].getWorldQuaternion(new THREE.Quaternion())
   .angleTo(bones[n].getWorldQuaternion(new THREE.Quaternion()))>.45),
  'unified source actually changes the overly raised idle arms');
}finally{
 if(originalLocation===undefined)delete globalThis.location;
 else globalThis.location=originalLocation;
 if(originalActions===undefined)delete globalThis.SkyClashPublishedActions;
 else globalThis.SkyClashPublishedActions=originalActions;
}
const boot=read('js/v66-game-boot.js');
assert(boot.includes("get('stance')==='unified'"));
assert(boot.includes("src.includes('v76-upper-body')"));
assert(boot.includes("if(continuousLab)"));
console.log('PASS V92: one approved idle source for hips/torso and every arm; no old 171-degree exposed forearm; V89/V91 preserved');
