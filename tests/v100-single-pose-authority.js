/* V100: real full layer stack on a parented Three.js humanoid.
 * Verify exactly one recorded writer controls an air frame, actual sourced
 * knee and shoulder movement survives, and grounded V97 still returns.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V76=require('../js/v76-upper-body.js');
const V72=require('../js/v72-published-actions.js');
const V81=require('../js/v81-pose-transitions.js');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const base=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
const ue5=JSON.parse(read('assets/animations/gameplay/v86-ue5-converted-actions.json'));
const sources=Object.fromEntries([...base.motions,...ue5.motions].map(m=>[m.slot,m]));
const actions=Object.fromEntries(Object.entries(sources).map(([n,e])=>[n,V72.decode(THREE,e)]));
const oldIdle=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-fighting-idle-v1.json')));
const walk=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-walk-arms-v1.json')));
const globals=['THREE','SkyClash','SkyClashMovementLab','SkyClashUpperBody','SkyClashPublishedActions',
 'SkyClashPoseTransitions','SkyClashPoseAuthority','location'];
const saved=Object.fromEntries(globals.map(n=>[n,globalThis[n]]));
function setup(url){
 globalThis.location={search:url};
 globalThis.THREE=THREE;
 const scene=new THREE.Group(),bones={};
 function bone(n,parent,x=0,y=0,z=0){
  const b=new THREE.Bone();b.name=n;b.position.set(x,y,z);
  parent.add(b);bones[n]=b;return b;
 }
 const hips=bone('hips',scene,0,1);
 const spine=bone('spine',hips,0,.17),chest=bone('chest',spine,0,.19),
  upper=bone('upperChest',chest,0,.10),neck=bone('neck',upper,0,.08);
 bone('head',neck,0,.11);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const sh=bone(side+'Shoulder',upper,sign*.15,.04);
  const arm=bone(side+'UpperArm',sh,sign*.15,-.025);
  const low=bone(side+'LowerArm',arm,sign*.25);
  const hand=bone(side+'Hand',low,sign*.22);
  for(const finger of ['Index','Middle','Ring','Little']){
   let p=hand;
   for(const seg of ['Proximal','Intermediate','Distal'])
    p=bone(side+finger+seg,p);
  }
  const hip=bone(side+'UpperLeg',hips,sign*.11,-.12);
  const knee=bone(side+'LowerLeg',hip,0,-.42);
  bone(side+'Foot',knee,0,-.43,.09);
 }
 const rig={legacyAxes:true,vrm:{scene,humanoid:{getNormalizedBoneNode:n=>bones[n]||null},update(){}}};
 const f={hp:100,t:0,name:'Kairo Venn',characterId:'kairo_venn',
  vrmRig:rig,pos:new THREE.Vector3(),vel:new THREE.Vector3(),
  moveIntent:new THREE.Vector3(),v89Step:{mode:'idle',scale:0},
  v71Walk:{weight:0,clock:0},v80AnalogRun:false,
  sprinting:false,jumping:false,dropping:false,
  launched:false,spiked:false,dashing:false,
  blockHeld:false,blocking:false,charging:false,slamming:false,
  stun:0,downT:0,punchT:0,blastT:0,superHitT:0,
  landingMotionT:0,acro:null,animate(){}
 };
 Object.defineProperty(f,'flying',{get(){return f.pos.y>.25;}});
 globalThis.SkyClash={Game:{player:f,heroes:{kairo_venn:f}}};
 globalThis.SkyClashMovementLab={version:89,enabled:true,joystickRun:true};
 const upperStatus={ready:true,originalWalkStyle:false},
  primaryStatus={ready:true,approvedIdle:actions.idle,motionClips:actions},
  extrasStatus={ready:true},transitionStatus={ready:true};
 globalThis.SkyClashUpperBody=upperStatus;
 globalThis.SkyClashPublishedActions=primaryStatus;
 assert(V76.attach(THREE,f,oldIdle,walk,upperStatus));
 assert(V72.attach(THREE,f,actions,primaryStatus));
 // Simulate V79 competing optional fall action using the same V72 wrapper:
 assert(V72.attach(THREE,f,{fallingIdle:actions.fallingIdle},extrasStatus,
  {marker:'v79ExtraPack',choose:()=>f.jumping&&f.vel.y<0?'fallingIdle':null}));
 assert(V81.attach(THREE,f,transitionStatus));
 globalThis.SkyClashPoseTransitions=transitionStatus;
 const authority=V100.start(globalThis);
 assert.equal(authority.ready,true,'unified animator must attach last');
 const pose=()=>V100.BONES.map(n=>bones[n].quaternion.clone());
 const count=()=>({
  upper:f.v76UpperBody.samples,primary:f.v72StudioPack.frames,
  extra:f.v79ExtraPack.frames,transition:f.v81PoseTransitions.frames});
 const step=(n=1)=>{
  for(let i=0;i<n;i++){f.t+=1/60;f.v71Walk.clock+=1/60;f.animate(1/60);}
 };
 const wrist=()=>['leftHand','rightHand'].map(n=>bones[n].quaternion.clone());
 return {f,bones,authority,upperStatus,primaryStatus,extrasStatus,
  transitionStatus,pose,count,step,wrist};
}
function check(){
 const u=setup('?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified');
 const {f,bones,authority}=u;
 assert.equal(V100.stateOf(f),null);
 assert.equal(V100.ownsAir(f),false);
 u.step(130);
 assert.equal(u.upperStatus.idleSource,'approved-idle (2)');
 const approvedIdle=u.pose(),idleWrists=u.wrist();
 f.pos.y=1.2;f.jumping=true;f.vel.y=14;
 assert.equal(V100.stateOf(f),'jump');
 assert.equal(V100.ownsAir(f),true);
 const before=u.count();
 u.step(15);
 const now=u.count();
 assert.deepEqual(now,before,'all four prior recorders must yield during takeoff');
 assert.equal(authority.active,'jump');
 assert.equal(authority.owner,'V100 single recorded jump pose');
 const peak=u.pose();
 assert(peak[15].angleTo(approvedIdle[15])>.06||
   peak[18].angleTo(approvedIdle[18])>.06,
   'recorded takeoff must animate real hip/leg bones');
 assert(peak[8].angleTo(approvedIdle[8])>.05,
   'recorded takeoff must animate real elbows');
 assert(Math.max(...u.wrist().map((q,i)=>q.angleTo(idleWrists[i])))<.45,
   'air wrists bounded to the actual pre-jump pose');
 assert(bones.leftIndexProximal.quaternion.angleTo(new THREE.Quaternion())<1e-5,
   'native VRoid fingers remain neutral, not curled by V81');
 f.vel.y=-5;
 assert.equal(V100.stateOf(f),'fall');
 u.step(12);
 assert.equal(authority.active,'fall');
 assert.deepEqual(u.count(),before,'fall must retain exclusive air ownership');
 assert(authority.clipsUsed.includes('fallingIdle'));
 f.pos.y=0;f.jumping=false;f.vel.y=0;f.landingMotionT=.48;
 assert.equal(V100.stateOf(f),'landing');
 u.step(20);
 assert.equal(authority.active,'landing');
 assert.deepEqual(u.count(),before,'landing must not be overwritten by V76/V72/V81/V79');
 assert(authority.clipsUsed.includes('landing'));
 f.landingMotionT=0;
 u.step(16);
 assert.equal(authority.active,'grounded-owners-preserved');
 assert(u.count().primary>before.primary,
   'grounded approved idle recorder resumes after landing');
 u.step(130);
 const regained=u.pose();
 assert(regained[8].angleTo(approvedIdle[8])<.35,
   'left forearm must recover to approved V97 idle');
 assert(regained[12].angleTo(approvedIdle[12])<.35,
   'right forearm must recover to approved V97 idle');
 assert(!authority.error&&!u.upperStatus.error&&!u.primaryStatus.error);
 f.pos.y=1.1;f.jumping=true;f.vel.y=10;u.step(6);
 f.blockHeld=true;
 const preCombat=u.count();
 u.step(1);
 assert.equal(V100.stateOf(f),null);
 assert.equal(V100.ownsAir(f),false);
 assert.equal(authority.active,'yielded-to-combat-or-flight');
 assert.equal(u.transitionStatus.active,'guard');
 assert(u.count().transition>preCombat.transition,
   'guard immediately regains ordinary transition authority');
 f.blockHeld=false;f.jumping=false;f.dropping=false;f.vel.y=0;
 u.step(12);
 f.pos.y=2;
 assert.equal(V100.stateOf(f),null,
   'height-only controlled hovering must never be misclassified as a jump');
 assert.equal(V100.ownsAir(f),false);
 u.step(10);
 assert.notEqual(authority.active,'jump');
 assert(u.count().transition>preCombat.transition,
   'controlled flight still uses the older approved controller');
 assert(!authority.error);
 console.log('PASS V100: exclusive real-jump/fall/land recorded owner, natural native fingers, bounded wrists, torso/knees, instant combat, approved idle and hover');
}
function compactGuardRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified';
 const run=flag=>{
  const u=setup(url+(flag?'&jumpArms=compact':''));
  u.step(130);
  const idle=u.pose();
  u.f.pos.y=1.2;u.f.jumping=true;u.f.vel.y=14;
  const counts=u.count();
  u.step(18);
  assert.deepEqual(u.count(),counts,
   'no old upper-body owner may write while unified jumping');
  const jump=u.pose();
  assert.equal(u.authority.active,'jump');
  if(flag)assert.equal(u.authority.armStyle,'V101 compact guard',
   'user must be able to tell which air-arm profile is active');
  else assert.equal(u.authority.armStyle,'V100 recorded jump/fall arms');
  u.f.vel.y=-8;u.step(14);
  assert.equal(u.authority.active,'fall');
  const fall=u.pose();
  u.f.pos.y=0;u.f.jumping=false;u.f.vel.y=0;u.f.landingMotionT=.48;
  u.step(15);
  const land=u.pose();
  assert.equal(u.authority.armStyle,'V100 recorded landing',
   'the landing is intentionally unchanged in this small experiment');
  return {idle,jump,fall,land,authority:u.authority};
 };
 const fixed=run(true),original=run(false);
 const limits={6:.11,7:.17,8:.22,9:.085,10:.11,11:.17,12:.22,13:.085};
 let saved=0;
 for(let i=6;i<=13;i++){
  const dist=fixed.jump[i].angleTo(fixed.idle[i]);
  const prior=original.jump[i].angleTo(original.idle[i]);
  assert(dist<=limits[i]+.005,'jump guard bone '+i+' left last approved local pose');
  const fallDist=fixed.fall[i].angleTo(fixed.idle[i]);
  assert(fallDist<=limits[i]+.005,'fall guard bone '+i+' returned to two-arm reach');
  saved=Math.max(saved,prior-dist);
 }
 assert(saved>.18,'the old recorded source must show the reported large arm reach');
 // No hidden changes to lower-body jump, torso, head, or recorded landing.
 for(const i of [0,1,2,3,4,5,14,15,16,17,18,19]){
  assert(fixed.jump[i].angleTo(original.jump[i])<1e-4,
   'recorded lower-body/head/torso movement changed unexpectedly: '+i);
  assert(fixed.fall[i].angleTo(original.fall[i])<1e-4,
   'recorded falling legs/head/torso movement changed unexpectedly: '+i);
 }
 for(let i=0;i<V100.BONES.length;i++)
  assert(fixed.land[i].angleTo(original.land[i])<.001,
   'landing source must be unchanged: '+V100.BONES[i]);
 const html=read('index.html'),studio=read('animation-studio.html'),boot=read('js/v66-game-boot.js');
 assert(html.includes('SKY CLASH · BUILD V101'));
 assert(!html.includes('V58'));
 assert(!studio.includes('V83')&&!studio.includes('V82 · DIRECT ASSIGN')&&!studio.includes('RIG LAB V60'));
 assert(html.includes('js/v66-game-boot.js?v=820&fix=102'));
 assert(boot.includes('SkyClashBuild=Object.freeze'));
 assert(boot.includes('GROUND: ')&&boot.includes('JUMP: ')&&boot.includes('LAND: '));
 assert(boot.includes("e.src+='&arms=101'"),'new V100 animator URL must cache-refresh for jump test');
 console.log('PASS V101: compact guard eliminates two-arm forward reach without changing jump legs, fall torso, landing or approved stance; build labels all match.');
}
try{
 check();
 compactGuardRegression();
 const boot=read('js/v66-game-boot.js');
 assert(boot.includes('js/v100-pose-authority.js?v=1000'));
 assert(boot.includes('SkyClashV100Animator.start(window)'));
 const files=['js/v71-mixamo-gameplay.js','js/v76-upper-body.js',
  'js/v72-published-actions.js','js/v81-pose-transitions.js'];
 for(const f of files)assert(read(f).includes('SkyClashV100Animator?.ownsAir(this)'),
  f+' must explicitly yield during unified air');
 const index=read('index.html');
 assert(/js[/]v66-game-boot[.]js[?]v=820&fix=(10[1-9]|1[1-9][0-9])/.test(index),
  'entrypoint must advance so V100 cooperative versions actually load');
 assert(boot.includes("e.src+='&poseOwner=100'"),
  'all old airborne controller files must be cache-busted together');
 for(const name of ['v71-mixamo-gameplay','v76-upper-body',
  'v72-published-actions','v81-pose-transitions'])
  assert(boot.includes("'"+name+"'"),name+' missing owner cache version');
 const refs=Object.fromEntries(base.motions.map(m=>[m.slot,m.sourceFile]));
 assert.equal(refs.idle,'Movement/Adventure/idle (2).fbx');
 assert.equal(refs.run,'Movement/Male/standard run.fbx');
}finally{
 for(const [k,v]of Object.entries(saved)){
  if(v===undefined)delete globalThis[k];else globalThis[k]=v;
 }
}
