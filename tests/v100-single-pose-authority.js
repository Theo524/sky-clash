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
function steadyAirLegRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact';
 function run(steady){
  const u=setup(url+(steady?'&airLegs=steady':''));
  u.step(130);
  const standing=u.pose(),counts=u.count();
  u.f.pos.y=1.2;u.f.jumping=true;u.f.vel.y=14;
  let biggest=0;
  const phases=[];
  for(let frame=0;frame<48;frame++){
   // Mirror the actual rise/apex/fall velocity timeline at ~60fps.
   u.f.vel.y=14-(frame+1)*34/60;
   const before=u.pose();
   u.step(1);
   const now=u.pose();
   const delta=Math.max(...[14,15,16,17,18,19].map(i=>
     before[i].angleTo(now[i])*180/Math.PI));
   biggest=Math.max(biggest,delta);
   phases.push({frame,phase:u.authority.active,delta});
   assert.equal(u.authority.active,frame<26?'jump':'fall',
    'velocity determines one transition at the actual apex');
   assert.deepEqual(u.count(),counts,
    'no second controller may write knees or ankles in the air');
   if(steady){
    const cap=Math.max(4.19,3.14)*180/Math.PI/60;
    assert(delta<=cap+.025,
     'jump/fall knee or ankle exceeded V102 visible angular cap: '+delta);
   }
  }
  assert.equal(u.authority.active,'fall');
  const airPose=u.pose();
  const peak=u.authority.maxLegStepDeg||0;
  const clamps=u.authority.legStepClamps||0;
  u.f.pos.y=0;u.f.jumping=false;u.f.vel.y=0;
  u.f.landingMotionT=.48;u.step(20);
  const landing=u.pose();
  assert.equal(u.authority.active,'landing');
  assert.equal(u.authority.legStyle,'V100 landing unchanged');
  return {u,standing,airPose,landing,biggest,peak,clamps,phases};
 }
 const steady=run(true),original=run(false);
 assert(steady.clamps>0,
  'actual UE5 source disagreement must exercise the V102 angular limiter');
 assert(steady.biggest<=4.03,'visible thighs/knees/feet must stay below ~4 deg/frame');
 assert(steady.biggest<original.biggest,
  'V102 must measurably reduce actual source leg twitch: '+JSON.stringify({
   stable:steady.biggest,unmodified:original.biggest}));
 // The first-leg-joint smoothing must never alter the accepted V101 guard,
 // torso or head while in the air.
 for(const i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13]){
  assert(steady.airPose[i].angleTo(original.airPose[i])<.0001,
   'V102 must not change approved guard/torso/head: '+V100.BONES[i]);
 }
 // The authored V100 landing is fully restored after its standard .1 s
 // blend, regardless of the final fall pose that entered it.
 for(let i=0;i<V100.BONES.length;i++)
  assert(steady.landing[i].angleTo(original.landing[i])<.001,
   'V102 must not change the original landing: '+V100.BONES[i]);
 const boot=read('js/v66-game-boot.js'),html=read('index.html');
 assert(boot.includes("e.src+='&legs=102'"));
 assert(boot.includes('AIR LEGS: ')&&boot.includes('LAND: V100 UNCHANGED'));
 assert(/SKY CLASH · BUILD V(10[2-9]|11[0-5])/.test(html));
 assert(/js[/]v66-game-boot[.]js[?]v=820&fix=(10[3-9]|11[0-6])/.test(html));
 assert(/BUILD V(10[2-9]|11[0-5])/.test(read('animation-studio.html')));
 console.log('PASS V102: one owner, measured real 60fps UE5 rise/fall knee/ankle cap ('+
  steady.biggest.toFixed(2)+' vs '+original.biggest.toFixed(2)+
  ' degrees/frame), V101 arms and V100 landing unchanged');
}
function movingTakeoffRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady';
 function run({speed=0,mode='stand',carry=false}){
  const u=setup(url+(carry?'&movingJump=carry':''));
  u.step(130);
  // For a true normal joystick run, use the actual APPROVED Standard Run
  // recording. V95 outer-radius run is not the separate Boost/sprint button.
  u.f.v95JoystickRun=mode==='run';
  u.f.v89Step.mode=mode==='stand'?'idle':'walk';
  u.f.moveIntent.z=mode==='stand'?0:1;
  u.f.vel.z=speed;
  if(mode==='walk'){
   // V71 owns walk legs in the live game. Synthetic standalone harness
   // does not attach V71, so seed a clearly asymmetrical last visible
   // walk stride in the two actual normalized hip/knee bones.
   u.bones.leftUpperLeg.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),.17);
   u.bones.rightUpperLeg.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-.17);
   u.bones.leftLowerLeg.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),.23);
  }
  u.step(mode==='run'?14:4);
  assert(mode!=='run'||u.primaryStatus.active==='run','V95 should select genuine approved run');
  const before=u.pose(),counts=u.count();
  // Simulate the real V71 wrapper clearing this flag on the first jump
  // frame: V103 must have remembered the LAST GROUNDED run mode.
  if(mode==='run')u.f.v80AnalogRun=false;
  u.f.pos.y=1.2;u.f.jumping=true;u.f.vel.y=14;
  u.step(16);
  const mid=u.pose();
  assert.equal(u.authority.active,'jump');
  assert.deepEqual(u.count(),counts,'no original controller continues animating legs midair');
  const weight=u.authority.movingJumpWeight||0;
  const title=u.authority.movingJump;
  if(!carry||mode==='stand')assert(weight===0,'standing and old V102 must not inherit stride');
  else{
   assert(weight>.04&&weight<.33,'moving jump must inherit just a modest takeoff stride');
   assert(title.includes(mode),'diagnostic must show walk vs standard run source');
  }
  u.f.vel.y=-7;u.step(25);
  const falling=u.pose();
  assert.equal(u.authority.active,'fall');
  const tailWeight=u.authority.movingJumpWeight||0;
  u.f.pos.y=0;u.f.jumping=false;u.f.vel.y=0;u.f.landingMotionT=.48;
  u.step(22);
  const landing=u.pose();
  assert.equal(u.authority.active,'landing');
  assert.equal(u.authority.legStyle,'V100 landing unchanged');
  return {u,before,mid,falling,landing,weight,tailWeight};
 }
 const standOld=run({}),standFlag=run({carry:true});
 for(const i of Array.from({length:20},(_,i)=>i)){
  assert(standOld.mid[i].angleTo(standFlag.mid[i])<.0001,
   'V103 must preserve APPROVED standing jump on '+V100.BONES[i]);
  assert(standOld.falling[i].angleTo(standFlag.falling[i])<.0001,
   'V103 must preserve APPROVED standing descent on '+V100.BONES[i]);
 }
 for(const [speed,mode]of [[4.8,'walk'],[6.2,'run']]){
  const old=run({speed,mode}),fresh=run({speed,mode,carry:true});
  let changed=0;
  for(const i of [14,15,16,17,18,19])
   changed=Math.max(changed,old.mid[i].angleTo(fresh.mid[i]));
  assert(changed>.006,
    mode+' must actually inherit a different launch stride from V102');
  for(const i of Array.from({length:14},(_,i)=>i)){
   assert(old.mid[i].angleTo(fresh.mid[i])<.0001,
    mode+' must preserve approved compact arms/body: '+V100.BONES[i]);
   assert(old.falling[i].angleTo(fresh.falling[i])<.0001,
    mode+' must preserve approved arms during descent: '+V100.BONES[i]);
  }
  for(let i=0;i<20;i++)
   assert(old.landing[i].angleTo(fresh.landing[i])<.001,
    'landing must be 100% identical between modes: '+V100.BONES[i]);
  assert(fresh.tailWeight<fresh.weight,
   mode+' airborne stride inheritance must decay without a second stride loop');
  assert(!fresh.u.authority.error);
 }
 // A fast Boost jump is a special move, and deliberately retains its old
 // separate controller. This PR handles V95 normal run, not Boost flight.
 const boost=setup(url+'&movingJump=carry');
 boost.step(130);boost.f.sprinting=true;boost.f.pos.y=1.2;boost.f.jumping=true;
 assert.equal(V100.ownsAir(boost.f),false,'Boost must not silently become a normal run jump');
 const boot=read('js/v66-game-boot.js');
 assert(boot.includes("e.src+='&moving=103'"));
 assert(boot.includes('TAKEOFF: ')&&boot.includes('LAND: V100 UNCHANGED'));
 assert(/SKY CLASH · BUILD V(10[3-9]|11[0-5])/.test(read('index.html')));
 assert(/js[/]v66-game-boot[.]js[?]v=820&fix=(10[4-9]|11[0-6])/.test(read('index.html')));
 assert(/BUILD V(10[3-9]|11[0-5])/.test(read('animation-studio.html')));
 console.log('PASS V103: unchanged standing jump, separate moving walk and approved Standard Run takeoff carry; compact guard, fall ownership, landing and Boost preserved');
}
function contactLandingRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry';
 function run(withContact,impactSpeed=14){
  const u=setup(url+(withContact?'&landingLab=contact':''));
  u.step(130);
  const grounded=u.pose();
  u.f.pos.y=1.2;u.f.jumping=true;u.f.vel.y=14;
  u.step(24);
  u.f.vel.y=-10;u.step(17);
  const fall=u.pose(),counters=u.count();
  u.f.pos.y=0;u.f.jumping=false;u.f.vel.y=0;u.f.landingMotionT=.48;
  u.f.v105ContactSerial=1;u.f.v105ImpactSpeed=impactSpeed;
  const poses=[];
  for(let frame=0;frame<28;frame++){
   const before=u.pose();u.step(1);
   const now=u.pose();
   const delta=Math.max(...now.map((q,i)=>q.angleTo(before[i])));
   poses.push({pose:now,delta,phase:u.authority.landingPhase,
    recovery:u.authority.landingRecovery});
   assert.equal(u.authority.active,'landing');
   assert.deepEqual(u.count(),counters,
    'a second VRM animator must never overwrite the landing pose');
  }
  assert.equal(u.authority.contactSerial,1);
  assert.equal(u.authority.impactSpeed,impactSpeed);
  return {u,grounded,fall,poses,last:u.pose()};
 }
 const legacy=run(false),contact=run(true),light=run(true,5);
 assert.equal(contact.u.authority.landingStyle,'V105 contact / absorb / recover');
 assert.equal(legacy.u.authority.landingStyle,'V100 recorded');
 assert(contact.u.authority.clipsUsed.includes('fallingToLanding'),
  'V105 must use the existing Mixamo falling-to-landing recording');
 assert(!legacy.u.authority.clipsUsed.includes('fallingToLanding'),
  'rollback stays with the old standing-land recording');
 assert(contact.poses.some(p=>p.phase==='contact'));
 assert(contact.poses.some(p=>p.phase==='absorb'));
 assert(contact.poses.some(p=>p.phase==='recover'));
 assert(contact.poses.at(-1).recovery>=99,'collision contact must finish at approved guard');
 assert(contact.poses[0].delta<.48,
  'the first contact frame must crossfade FROM the actual falling pose');
 let bent=0;
 for(let i=14;i<20;i++)
  bent=Math.max(bent,contact.poses[11].pose[i].angleTo(contact.grounded[i]));
 assert(bent>.1,'knees and hips must visibly absorb the contact, not freeze');
 for(let i=0;i<20;i++){
  assert(contact.last[i].angleTo(contact.grounded[i])<.006,
   'recovery should reach Kairo approved grounded pose: '+V100.BONES[i]);
 }
 assert(contact.poses[0].delta<legacy.poses[0].delta+.25,
  'new contact blending cannot create a worse initial full-body snap');
 // Different actual floor impact speeds change the contact-source
 // absorption depth but cannot change the final approved idle pose.
 assert(V100.landingPlan(.17,14).sourceTime>
   V100.landingPlan(.17,5).sourceTime+.025);
 for(let i=0;i<20;i++)
  assert(light.last[i].angleTo(contact.last[i])<.006,
   'different impact strengths must still recover to identical V97 stance');
 // The V105 flag does not touch the approved stand/move jumping states.
 function jumpOnly(contact){
  const u=setup(url+(contact?'&landingLab=contact':''));
  u.step(130);u.f.pos.y=1.2;u.f.jumping=true;u.f.vel.y=14;u.step(19);
  const rising=u.pose();u.f.vel.y=-6;u.step(18);
  return {rising,falling:u.pose()};
 }
 const oldJump=jumpOnly(false),newJump=jumpOnly(true);
 for(let i=0;i<20;i++){
  assert(oldJump.rising[i].angleTo(newJump.rising[i])<.0001,
   'accepted rising pose changed: '+V100.BONES[i]);
  assert(oldJump.falling[i].angleTo(newJump.falling[i])<.0001,
   'accepted falling pose changed: '+V100.BONES[i]);
 }
 const interrupted=setup(url+'&landingLab=contact');
 interrupted.step(130);
 interrupted.f.pos.y=0;interrupted.f.landingMotionT=.48;
 interrupted.f.v105ImpactSpeed=10;interrupted.f.v105ContactSerial=2;
 interrupted.step(7);interrupted.f.blockHeld=true;interrupted.step(1);
 assert.equal(interrupted.authority.active,'yielded-to-combat-or-flight',
  'guard must instantly interrupt V105 landing');
 assert(!contact.u.authority.error&&!legacy.u.authority.error);
 console.log('PASS V105: real Mixamo landing contact, knee absorption, return to approved guard, no second writer, combat priority and unchanged V102/V103 jumps');
}
function visibleLandingFootRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact';
 const run=(plant)=>{
  const u=setup(url+(plant?'&landingFeet=plant':''));
  u.f.floor=0;
  u.step(130);
  u.f.pos.y=1.2;u.f.jumping=true;u.f.vel.y=14;u.step(24);
  const rise=u.pose();
  u.f.vel.y=-10;u.step(17);
  const fall=u.pose(),count=u.count();
  u.f.pos.y=0;u.f.jumping=false;u.f.vel.y=0;
  u.f.landingMotionT=.48;u.f.v105ImpactSpeed=14;
  const gaps=[],poses=[];
  for(let frame=0;frame<28;frame++){
   u.step();
   assert.equal(u.authority.active,'landing');
   assert.deepEqual(u.count(),count,'contact solver cannot introduce an old animation writer');
   poses.push(u.pose());
   const floor=V100.soleGaps(THREE,u.f.vrmRig,u.f);
   gaps.push(Math.min(...floor.map(x=>x.gap)));
   if(plant){
    assert(Math.abs(gaps.at(-1))<.021,
     'visible final VRM ankle must contact floor after retarget at frame '+frame+
     ': '+gaps.at(-1));
    assert.equal(u.authority.soleContact,'PLANTED');
   }
  }
  return {u,rise,fall,gaps,poses};
 };
 const old=run(false),planted=run(true);
 for(let i=0;i<20;i++){
  assert(old.rise[i].angleTo(planted.rise[i])<.0001,
   'V106 must NOT modify approved takeoff: '+V100.BONES[i]);
  assert(old.fall[i].angleTo(planted.fall[i])<.0001,
   'V106 must NOT modify approved descent: '+V100.BONES[i]);
  for(const frame of [0,5,11,21,27])
   assert(old.poses[frame][i].angleTo(planted.poses[frame][i])<.001,
    'V106 must not modify even rejected V105 landing source bones: '+V100.BONES[i]);
 }
 assert(old.gaps.some(g=>Math.abs(g)>.04),
  'the previous source must reproduce the reported lack of visible contact');
 assert(planted.gaps.every(g=>Math.abs(g)<.021),
  'V106 must produce consistent contact for the entire authored landing');
 assert(planted.u.authority.soleCorrections>=28);
 assert(!planted.u.authority.error);
 console.log('PASS V106 full motion stack: every recorded landing frame finishes with actual world-space foot-ground contact, no change to quaternion animations');
}
function expressiveJumpRegression(){
 const base='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant';
 function run(creative,speed=0){
  const u=setup(base+(creative?'&jumpStyle=expressive':''));
  u.step(130);
  u.f.vel.z=speed;
  u.f.moveIntent.z=speed>0?1:0;
  u.step(5);
  const grounded=u.pose(),counts=u.count();
  u.f.pos.y=1.2;u.f.jumping=true;u.f.vel.y=14;
  u.step(14);
  const rise=u.pose(),energy=u.authority.jumpExpression;
  u.f.vel.y=-10;u.step(19);
  const fall=u.pose();
  assert.deepEqual(u.count(),counts,
   'expressive jump must still use only the sole V100 pose writer');
  u.f.pos.y=0;u.f.vel.y=0;u.f.jumping=false;
  u.f.landingMotionT=.48;u.step(25);
  return {u,grounded,rise,fall,land:u.pose(),energy};
 }
 for(const speed of [0,4.8,6.2]){
  const old=run(false,speed),fresh=run(true,speed);
  assert(fresh.energy>15,'standing and moving launch need visible body energy');
  assert.equal(old.energy,0);
  for(const i of [6,7,8,9,10,11,12,13,14,15,16,17,18,19]){
   assert(old.rise[i].angleTo(fresh.rise[i])<.0001,
    'V107 must preserve V101 guard and V102/V103 local legs: '+V100.BONES[i]);
   assert(old.fall[i].angleTo(fresh.fall[i])<.0001,
    'V107 cannot change approved guard/legs during descent: '+V100.BONES[i]);
   assert(old.land[i].angleTo(fresh.land[i])<.0001,
    'V107 cannot change any V106 landing bone: '+V100.BONES[i]);
  }
  let difference=0;
  for(const i of [0,1,2,3,4,5])
   difference=Math.max(difference,old.rise[i].angleTo(fresh.rise[i]));
  assert(difference>.03,'the expressive option must visibly change upper body');
  assert(!fresh.u.authority.error);
 }
}
function movingLandingSupportRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant';
 function run(speed,pin){
  const u=setup(url+(pin?'&landingMove=pin':''));
  u.f.floor=0;u.step(130);
  u.f.vel.z=speed;u.f.moveIntent.z=speed>0?1:0;
  u.step(5);
  u.f.pos.y=1.2;u.f.jumping=true;u.f.vel.y=14;u.step(18);
  const rising=u.pose();
  u.f.vel.y=-8;u.step(20);
  const falling=u.pose(),count=u.count();
  u.f.pos.y=0;u.f.jumping=false;u.f.landingMotionT=.48;
  const poses=[],gaps=[];
  for(let j=0;j<18;j++){
   u.f.vrmRig.vrm.scene.position.z+=speed/60;
   u.step(1);
   poses.push(u.pose());
   gaps.push(Math.min(...V100.soleGaps(THREE,u.f.vrmRig,u.f).map(x=>x.gap)));
   assert.deepEqual(u.count(),count,'moving support cannot add another animator');
  }
  return {u,rising,falling,poses,gaps};
 }
 for(const speed of [0,4.8,6.2]){
  const old=run(speed,false),fresh=run(speed,true);
  for(let i=0;i<20;i++){
   assert(old.rising[i].angleTo(fresh.rising[i])<1e-5,
    'moving pin cannot change jump: '+V100.BONES[i]);
   assert(old.falling[i].angleTo(fresh.falling[i])<1e-5,
    'moving pin cannot change fall: '+V100.BONES[i]);
  }
  assert(fresh.gaps.every(g=>Math.abs(g)<.021),
   'V106 visible vertical contact remains planted during V107 support IK');
  if(speed===0){
   assert.equal(fresh.u.authority.movingFootPinFrames,0,
    'approved stationary landing is exactly unchanged');
   for(let j=0;j<18;j++)for(let i=0;i<20;i++)
    assert(old.poses[j][i].angleTo(fresh.poses[j][i])<1e-5,
     'V107 must preserve approved static landing bone '+V100.BONES[i]);
  }else{
   assert(fresh.u.authority.movingFootPinFrames>0,
    'walking/running landing must engage post-retarget support IK');
   for(const i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13])
    assert(old.poses[5][i].angleTo(fresh.poses[5][i])<1e-5,
     'moving foot pin must leave approved upper-body + guard untouched: '+V100.BONES[i]);
   // Support IK adjusts hip/knee joints. Subsequent world-space source
   // retargets may also adjust child ankle LOCAL rotations: those cannot
   // be asserted quaternion-identical, only physically planted.
   assert(fresh.u.authority.movingFootSlipCm>=0);
  }
  assert(!fresh.u.authority.error);
 }
}
function subtleGroundedPrepRegression(){
 const base='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=pin&jumpStyle=expressive';
 for(const speed of [0,4.8,6.2]){
  const u=setup(base+'&jumpPrep=subtle');
  u.f.floor=0;u.step(130);
  u.f.vel.z=speed;u.f.moveIntent.z=speed>0?1:0;u.step(6);
  const grounded=u.pose(),writers=u.count();
  u.f.v108JumpPrepT=.095;u.f.v108JumpPrepDuration=.095;
  const dev=[];
  for(let frame=0;frame<5;frame++){
   u.f.v108JumpPrepT=.095-(frame+1)/60;
   const before=u.pose();u.step(1);
   assert.equal(V100.stateOf(u.f),'prep');
   assert.equal(V100.ownsAir(u.f),true,
    'prep must be under the same final V100 owner as rising/falling');
   assert.equal(u.authority.active,'prep');
   assert.deepEqual(u.count(),writers,'no old recorded owner may draw over the grounded bend');
   const pose=u.pose();
   dev.push(pose[15].angleTo(grounded[15]));
   for(const i of [6,7,8,9,10,11,12,13])
    assert(pose[i].angleTo(grounded[i])<.0001,
     'prep cannot lower or cross the approved fighting guard: '+V100.BONES[i]);
   assert(pose[15].angleTo(before[15])<.075,
    'knee must not twitch between short grounded preparation frames');
   const gaps=V100.soleGaps(THREE,u.f.vrmRig,u.f);
   assert(Math.abs(Math.min(...gaps.map(g=>g.gap)))<.021,
    'feet must stay grounded while preparing, not jump early');
  }
  assert(dev[4]>.065,'pre-jump knee bend must be visible rather than absent');
  assert(dev[4]<.16,'pre-jump knee bend must remain small and believable');
  assert(u.authority.jumpPrep>30,
    'diagnostic must report an active grounded knee load');
  // The buffered physics impulse fires ONCE only after the short prep.
  u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
  u.step(1);
  assert.equal(u.authority.active,'jump');
  assert.deepEqual(u.count(),writers,
   'launch must continue directly through same single pose owner');
  assert.equal(V100.stateOf(u.f),'jump');
  assert(!u.authority.error);
 }
 // The option never changes the original instant V107 jump route if unset.
 const original=setup(base);
 original.step(130);
 original.f.pos.y=1.2;original.f.jumping=true;original.f.vel.y=14;
 assert.equal(V100.stateOf(original.f),'jump');
 original.step(1);
 assert.equal(original.authority.active,'jump');
 console.log('PASS V108 full V100 stack: visible grounded 95ms knee/hip load, protected fighter guard, planted soles, one owner and instant original rollback');
}
function readablePrepAndMovingFlowRegression(){
 const base='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&jumpStyle=expressive';
 function runPrep(speed,profile){
  const u=setup(base+'&jumpPrep='+profile);
  u.f.floor=0;u.step(130);
  u.f.vel.z=speed;u.f.moveIntent.z=speed>0?1:0;u.step(5);
  const initial=u.pose(),counts=u.count(),duration=profile==='readable'?.14-.04*Math.min(1,speed/6.2):.095;
  u.f.v108JumpPrepT=duration;u.f.v108JumpPrepDuration=duration;
  const knee=[];let maxFirst=.0;
  const steps=Math.ceil(duration*60)-1;
  for(let i=0;i<steps;i++){
   const before=u.pose();u.f.v108JumpPrepT=Math.max(.0001,duration-(i+1)/60);
   u.step();
   assert.equal(u.authority.active,'prep');
   assert.deepEqual(u.count(),counts,'V109 preloading must remain in one VRM owner');
   knee.push(u.pose()[15].angleTo(initial[15]));
   maxFirst=Math.max(maxFirst,u.pose()[15].angleTo(before[15]));
   assert(Math.abs(Math.min(...V100.soleGaps(THREE,u.f.vrmRig,u.f).map(x=>x.gap)))<.022,
    'physical feet must stay planted during readable preload');
   for(const k of [6,7,8,9,10,11,12,13])
    assert(u.pose()[k].angleTo(initial[k])<.0001,
     'guard cannot swing or drop during weight load: '+V100.BONES[k]);
  }
  const preJump=u.pose();
  u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
  u.step();
  assert.equal(u.authority.active,'jump');
  assert(!u.authority.error);
  return {knee:Math.max(...knee),maxFirst,preJump};
 }
 for(const speed of [0,4.8,6.2]){
  const subtle=runPrep(speed,'subtle'),readable=runPrep(speed,'readable');
  assert(readable.knee>subtle.knee+.045,
   'the user must be able to SEE the bigger grounded knee compression');
  assert(readable.knee<.32,'prep still restrained, not a theatrical deep crouch');
  assert(readable.maxFirst<.14,'new pose cannot pop more than 8 degrees/frame');
 }
 function runLanding(speed,flow){
  const u=setup(base+(flow?'&landingMove=flow':'&landingMove=pin'));
  u.f.floor=0;u.step(130);
  u.f.vel.z=speed;u.f.moveIntent.z=speed>0?1:0;u.step(5);
  u.f.pos.y=1.2;u.f.jumping=true;u.f.vel.y=14;u.step(23);
  u.f.vel.y=-9;u.step(18);
  const falling=u.pose(),counts=u.count();
  u.f.pos.y=0;u.f.jumping=false;u.f.vel.y=0;u.f.v105ImpactSpeed=14;
  u.f.v109LandingSpeed=flow?speed:0;
  u.f.v109LandingDuration=flow&&speed>1.3?.205:.48;
  const duration=u.f.v109LandingDuration;
  u.f.landingMotionT=duration;
  const poses=[],world=[];
  const frames=Math.floor((duration-1e-6)*60);
  for(let i=0;i<frames;i++){
   u.f.landingMotionT=Math.max(.0001,duration-i/60);
   u.f.vrmRig.vrm.scene.position.z+=speed/60;
   u.step();
   assert.equal(u.authority.active,'landing');
   assert.deepEqual(u.count(),counts,'no second owner during quicker moving contact');
   poses.push(u.pose());
   world.push(Math.min(...V100.soleGaps(THREE,u.f.vrmRig,u.f).map(x=>x.gap)));
  }
  const style=u.authority.landingStyle,durationUsed=u.authority.landingDuration;
  u.f.landingMotionT=0;
  for(let i=0;i<8;i++)u.step();
  return {u,falling,poses,world,style,durationUsed};
 }
 for(const speed of [0,4.8,6.2]){
  const legacy=runLanding(speed,false),fresh=runLanding(speed,true);
  for(let i=0;i<20;i++)
   assert(legacy.falling[i].angleTo(fresh.falling[i])<.0001,
    'V109 may not modify any accepted jump or fall joint: '+V100.BONES[i]);
  assert(fresh.world.every(v=>Math.abs(v)<.025),'contacted foot must still touch floor');
  if(speed===0){
   assert.equal(fresh.style,'V105 contact / absorb / recover');
   assert.equal(fresh.durationUsed,.48);
   for(const frame of [0,4,8,12,17,25])for(let i=0;i<20;i++)
    assert(fresh.poses[frame][i].angleTo(legacy.poses[frame][i])<.0001,
     'approved standing landing cannot change on V109: '+V100.BONES[i]);
  }else{
   assert.equal(fresh.style,'V109 short step handoff');
   assert.equal(fresh.durationUsed,.205);
   assert(legacy.poses.length>fresh.poses.length*2,
    'moving grounded idle-pose duration should be shortened by over half');
   assert(fresh.u.authority.movingFootPinFrames>0,
    'support foot must be corrected during the short moving contact');
   assert(fresh.u.authority.active==='grounded-owner'||
     fresh.u.authority.active==='grounded-owners-preserved',
     'normal stride must retake control early after moving touchdown');
  }
  assert(!fresh.u.authority.error);
 }
 console.log('PASS V109 full V100 stack: visibly stronger standing knee load, planted prep feet and guard, stationary landing unchanged, walking/running landing hands off to gait sooner');
}
function airFacingAlignmentRegression(){
 const base='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=readable';
 function simulate(speed,locked){
  const u=setup(base+(locked?'&jumpFacing=locked':''));
  u.step(130);
  u.f.vel.z=speed;u.f.moveIntent.z=speed?1:0;u.step(7);
  const stance=u.pose(),writers=u.count();
  u.f.v108JumpPrepT=.105;u.f.v108JumpPrepDuration=.105;
  for(let n=0;n<5;n++){
   u.f.v108JumpPrepT=.105-(n+1)/60;
   u.step();
  }
  const prep=u.pose();
  u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
  u.step(15);
  assert.equal(u.authority.active,'jump');
  assert.deepEqual(u.count(),writers,'facing calibration cannot add another animation writer');
  const rise=u.pose(),riseStyle=u.authority.airFacingStyle,
   riseRaw=u.authority.airFacingSourceYawDeg,
   riseDrift=u.authority.airFacingDriftDeg;
  u.f.vel.y=-8;u.step(24);
  assert.equal(u.authority.active,'fall');
  const fall=u.pose(),fallStyle=u.authority.airFacingStyle,
   fallRaw=u.authority.airFacingSourceYawDeg,
   fallDrift=u.authority.airFacingDriftDeg;
  u.f.pos.y=0;u.f.jumping=false;u.f.vel.y=0;
  u.f.landingMotionT=.48;u.f.v105ImpactSpeed=12;
  u.step(28);
  assert.equal(u.authority.active,'landing');
  return {u,stance,prep,rise,fall,land:u.pose(),
   riseStyle,fallStyle,riseRaw,riseDrift,fallRaw,fallDrift};
 }
 for(const speed of [0,4.8,6.2]){
  const old=simulate(speed,false),fresh=simulate(speed,true);
  assert.equal(old.riseStyle,'original recorded yaw');
  assert.equal(fresh.riseStyle,'V110 takeoff-facing torso');
  assert.equal(fresh.fallStyle,'V110 takeoff-facing torso');
  assert(fresh.riseRaw>fresh.riseDrift+.08,
   'raw sampled jump torso must have an unrequested yaw that is measurably removed');
  assert(fresh.riseDrift<12,
   'total local torso yaw drift across hips/head must stay under twelve degrees');
  assert(fresh.fallDrift<12,'fall source must not reintroduce lateral torso rotation');
  for(let k=0;k<20;k++){
   assert(old.prep[k].angleTo(fresh.prep[k])<.0001,
    'approved V109 pre-jump knee load may not change: '+V100.BONES[k]);
   assert(old.land[k].angleTo(fresh.land[k])<.002,
    'approved standing landing end pose may not change: '+V100.BONES[k]);
  }
  for(const k of [6,7,8,9,10,11,12,13,14,15,16,17,18,19]){
   assert(old.rise[k].angleTo(fresh.rise[k])<.0001,
    'V110 leaves compact guard and six leg source angles unchanged: '+V100.BONES[k]);
   assert(old.fall[k].angleTo(fresh.fall[k])<.0001,
    'V110 leaves falling guard and leg source angles unchanged: '+V100.BONES[k]);
  }
  let altered=0;
  for(const k of [0,1,2,3,4,5])
   altered=Math.max(altered,old.rise[k].angleTo(fresh.rise[k]));
  assert(altered>.07,'V110 must visibly correct source body yaw, not merely label the HUD');
  assert(!fresh.u.authority.error);
 }
 console.log('PASS V110 full competing animation stack: grounded prep, compact guard and leg angles unchanged; yaw aligned during real jump/fall; approved final landing preserved');
}
function continuousFlightRegression(){
 const base='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=readable&jumpFacing=locked';
 const u=setup(base+'&flightLab=blend');
 u.step(130);
 const approved=u.pose(),writers=u.count();
 // Jump stays in original V110 single owner's real jump/fall path.
 u.f.pos.y=1.2;u.f.jumping=true;u.f.vel.y=12;
 u.step(14);assert.equal(u.authority.active,'jump');
 const jumping=u.pose();
 u.f.jumping=false;u.f.vel.y=0;u.f.vel.z=0;u.f.pos.y=5;
 u.step(20);
 assert.equal(u.authority.active,'flight');
 assert.equal(u.authority.flightStyle,'V111 continuous hover / travel');
 assert(u.authority.flightBlend<=3,'hover should stay on true floating recording');
 assert.deepEqual(u.count(),writers,'all earlier recorded owners yield while V111 powers hover');
 const hover=u.pose();
 const motion=[];
 for(const speed of [1,2.8,3.2,4.5,6.2]){
  u.f.vel.z=speed;
  const prior=u.pose();
  u.step(1);
  motion.push({speed,mix:u.authority.flightBlend,pose:u.pose()});
  const now=u.pose();
  for(let i=0;i<20;i++)assert(prior[i].angleTo(now[i])<.091,
   'hover to flight must not snap a joint: '+V100.BONES[i]);
 }
 assert(motion[1].mix<motion[2].mix,
  '3 m/s speed threshold must be a SMOOTH, not hard, blend');
 assert(motion[0].mix<motion[4].mix,'increasing flight speed should increase forward flight weight');
 u.step(60);
 assert(u.authority.flightBlend>90,'normal moving flight must reach real flying pose');
 const fly=u.pose();
 let distance=0;
 for(let i=0;i<20;i++)distance=Math.max(distance,hover[i].angleTo(fly[i]));
 assert(distance>.05,'forward flight must visibly differ from standing hover');
 // Not hovering merely because the fighter is above terrain.
 u.f.dropping=true;u.f.jumping=false;u.f.vel.y=-5;
 u.step(3);
 assert.equal(u.authority.active,'fall',
  'deliberate drop must play gravity falling, not powered flight');
 assert.deepEqual(u.count(),writers,'fall returns to same owner');
 u.f.dropping=false;u.f.punchT=.25;
 u.step(1);
 assert.equal(u.authority.active,'yielded-to-combat-or-flight',
  'air combat overrides flight immediately');
 assert(!u.authority.error);
 // Without the experimental flag the original V72/V81 hover recorder
 // must remain responsible and V100 must not take over flight.
 const original=setup(base);
 original.step(130);
 original.f.pos.y=5;original.f.jumping=false;
 original.step(20);
 assert.equal(original.authority.active,'grounded-owners-preserved');
 assert.equal(original.primaryStatus.active,'floating');
 assert(!original.authority.error);
 console.log('PASS V111 full stack: smooth true hover-to-travel, no hard 3m/s cut, one owner, jump/drop/combat priority, original flight rollback');
}
function visibleStandingPushOffRegression(){
 const base='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpFacing=locked&flightLab=blend';
 function exercise(speed,profile){
  const u=setup(base+'&jumpPrep='+profile);
  u.f.floor=0;u.step(130);
  u.f.vel.z=speed;u.f.moveIntent.z=speed>0?1:0;u.step(6);
  // Match the real ground-contact baseline before comparing world heights:
  // V106 keeps the *shoe sole* (not ankle skeleton joint) on the floor.
  V100.plantVisibleSoles(THREE,u.f.vrmRig,u.f,{});
  u.f.vrmRig.vrm.scene.updateMatrixWorld(true);
  const origin=u.bones.hips.getWorldPosition(new THREE.Vector3()).y;
  const rest=u.pose(),writers=u.count(),foot0=u.bones.leftFoot.getWorldPosition(new THREE.Vector3());
  const duration=profile==='push'?.215-.10*Math.min(1,speed/6.2):
      .14-.04*Math.min(1,speed/6.2);
  u.f.v108JumpPrepT=duration;u.f.v108JumpPrepDuration=duration;
  let deepest=0,footTravel=0;
  const n=Math.ceil(duration*60)-1;
  for(let j=1;j<=n;j++){
   u.f.v108JumpPrepT=Math.max(.0001,duration-j/60);
   u.step(1);
   assert.equal(u.authority.active,'prep');
   assert.deepEqual(u.count(),writers,'push must be drawn by the same sole pose authority');
   u.f.vrmRig.vrm.scene.updateMatrixWorld(true);
   const h=u.bones.hips.getWorldPosition(new THREE.Vector3()).y;
   deepest=Math.max(deepest,origin-h);
   const foot=u.bones.leftFoot.getWorldPosition(new THREE.Vector3());
   footTravel=Math.max(footTravel,Math.hypot(foot.x-foot0.x,foot.z-foot0.z));
   const gaps=V100.soleGaps(THREE,u.f.vrmRig,u.f);
   assert(Math.abs(Math.min(...gaps.map(g=>g.gap)))<.021,
     'the actual visible footwear must remain on floor during push preparation');
   for(const k of [8,9,12,13])assert(u.pose()[k].angleTo(rest[k])<.0001,
     'wrist and elbow guard remain approved, not windmilling');
  }
  assert(!u.authority.error);
  const prep=u.pose();
  u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
  u.step(1);
  assert.equal(u.authority.active,'jump');
  assert.deepEqual(u.count(),writers,'one final pose writer continues on takeoff');
  assert(!u.authority.error);
  return {u,deepest,footTravel,prep,duration};
 }
 const before=exercise(0,'readable'),after=exercise(0,'push'),
  moving=exercise(6.2,'push');
 assert(after.deepest>.035,
   'standing real mesh hips must visibly move DOWN at least 3.5cm even with sole correction');
 assert(after.deepest>before.deepest+.017,
   'push profile must physically lower the visible body noticeably more than V109');
 assert(after.footTravel<.08,'standing shoes cannot drift far horizontally to fake knee compression');
 assert(after.duration>.20,'stationary standing load stays visibly present for ~210ms');
 assert(moving.duration<.12,'moving jump responds rapidly and does not stop for a static squat');
 assert(moving.deepest<after.deepest*.65,
   'walking/running takeoff must remain noticeably shallower than static');
 assert(after.u.authority.pushRelease>0,'physical jump begins with smooth release of loaded hip');
 assert(after.prep[15].angleTo(before.prep[15])>.15,
   'actual last visible knee quaternion should differ meaningfully from V109');
 console.log('PASS V112 full recorded rig: planted feet with real stationary hip dip, restrained moving prep, unchanged guard and smooth one-owner jump handoff');
}
function controlledFlightFootHoldRegression(){
 const base='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFacing=locked&flightLab=blend';
 function controlled(flag){
  const u=setup(base+(flag?'&flightStyle=controlled':''));
  u.step(130);
  const counts=u.count(),ground=u.pose();
  u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
  u.step(25);assert.equal(u.authority.active,'jump');
  u.f.jumping=false;u.f.pos.y=5;u.f.vel.y=0;u.f.vel.z=0;
  u.step(35);
  assert.equal(u.authority.active,'flight');
  const hover=u.pose(),hoverStyle=u.authority.flightStyle;
  const sequence=[];
  for(const speed of [0,2,3.2,4.5,6.2]){
   u.f.vel.z=speed;
   const before=u.pose();
   u.step(1);
   assert.deepEqual(u.count(),counts,
    'flying must have one final pose writer with no recorded controller clash');
   const after=u.pose();
   for(let j=0;j<20;j++)assert(before[j].angleTo(after[j])<.10,
    'hover/travel flight local bone snap: '+V100.BONES[j]);
   sequence.push(after);
  }
  u.f.vel.z=6.2;u.step(60);
  const cruise=u.pose();
  u.f.vel.y=7;u.step(25);
  const ascend=u.pose();
  u.f.vel.y=-7;u.step(25);
  const descend=u.pose();
  u.f.dropping=true;u.f.vel.y=-7;u.step(2);
  assert.equal(u.authority.active,'fall');
  u.f.dropping=false;u.f.punchT=.25;u.step();
  assert.equal(u.authority.active,'yielded-to-combat-or-flight');
  assert(!u.authority.error);
  return {u,ground,hover,cruise,ascend,descend,hoverStyle};
 }
 const authored=controlled(true),recorded=controlled(false);
 assert.equal(authored.hoverStyle,'V113 authored controlled');
 assert.equal(recorded.hoverStyle,'V111 continuous hover / travel');
 let differences=0;
 for(let i=0;i<20;i++)differences=Math.max(differences,
   authored.hover[i].angleTo(recorded.hover[i]));
 assert(differences>.12,'controlled hover must not be the same prerecorded pose');
 assert(authored.cruise[1].angleTo(authored.hover[1])>.045,
  'travel torso must gradually differ from quiet hovering');
 assert(authored.descend[15].angleTo(authored.ascend[15])>.055,
  'ascending and descending knees should prepare for different forces');
 for(const i of [6,7,8,9,10,11,12,13,14,15,16,17,18,19])
  assert(authored.ground[i].angleTo(recorded.ground[i])<.0001,
    'controlled flight cannot change approved grounded idle baseline');
 function prep(held){
  const u=setup(base+(held?'&jumpFeet=hold':''));
  u.f.floor=0;u.step(130);
  V100.plantVisibleSoles(THREE,u.f.vrmRig,u.f,{});
  u.f.vrmRig.vrm.scene.updateMatrixWorld(true);
  const hipsY=u.bones.hips.getWorldPosition(new THREE.Vector3()).y,
        anchors=['left','right'].map(side=>
          u.bones[side+'Foot'].getWorldPosition(new THREE.Vector3()));
  u.f.v108JumpPrepT=.215;u.f.v108JumpPrepDuration=.215;
  let drift=0,deepest=0,soleError=0;
  for(let i=1;i<=12;i++){
   u.f.v108JumpPrepT=Math.max(.0001,.215-i/60);
   u.step(1);
   assert.equal(u.authority.active,'prep');
   u.f.vrmRig.vrm.scene.updateMatrixWorld(true);
   deepest=Math.max(deepest,
     hipsY-u.bones.hips.getWorldPosition(new THREE.Vector3()).y);
   for(const [j,side]of ['left','right'].entries()){
    const p=u.bones[side+'Foot'].getWorldPosition(new THREE.Vector3());
    drift=Math.max(drift,
      Math.hypot(p.x-anchors[j].x,p.z-anchors[j].z));
   }
   soleError=Math.max(soleError,Math.abs(Math.min(...V100.soleGaps(
     THREE,u.f.vrmRig,u.f).map(v=>v.gap))));
  }
  assert(soleError<.022,'shoe outsole must remain on physical floor');
  const last=u.pose();
  u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
  u.step(1);
  assert.equal(u.authority.active,'jump');
  assert(!u.authority.error);
  return {u,drift,deepest,last};
 }
 const held=prep(true),original=prep(false);
 assert(held.drift<.045,'both feet must stay within 4.5cm of initial world position');
 assert(held.drift<=original.drift+.003,
  'additional anchor must not worsen existing V112 foot stability');
 assert(held.deepest>.035,'stabilizing feet cannot erase approved visible standing body load');
 assert(Math.abs(held.deepest-original.deepest)<.020,
  'foot hold must not make jump preload visibly taller/shorter');
 for(const i of [6,7,8,9,10,11,12,13])
  assert(held.last[i].angleTo(original.last[i])<.0001,
    'optional foot hold cannot change upper-body jump expression');
 assert(held.u.authority.pushRelease>0,'held foot pose releases smoothly into jump');
 console.log('PASS V113 full stack: separate authored controlled hover/travel/vertical flight, one owner, immediate fall/combat, feet anchored with retained body preload');
}
function guidedKneesAirborneStyleRegression(){
 const base='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFeet=hold&jumpFacing=locked&flightLab=blend';
 function jump(guided){
  const u=setup(base+(guided?'&jumpKnees=guided':''));
  u.f.floor=0;u.step(130);
  V100.plantVisibleSoles(THREE,u.f.vrmRig,u.f,{});
  const ground=u.pose(),writers=u.count();
  u.f.v108JumpPrepT=.215;u.f.v108JumpPrepDuration=.215;
  const last=[],shoes=[];
  for(let frame=1;frame<=12;frame++){
   u.f.v108JumpPrepT=Math.max(.0001,.215-frame/60);
   u.step();
   assert.equal(u.authority.active,'prep');
   assert.deepEqual(u.count(),writers,'only one pose owner during prep');
   const pose=u.pose();
   last.push(pose);
   for(const i of [15,18]){
    const local=ground[i].clone().invert().multiply(pose[i]);
    assert(local.x>-.045,
     'left/right knees must remain in the same authored hinge bend plane');
   }
   const gaps=V100.soleGaps(THREE,u.f.vrmRig,u.f);
   shoes.push(Math.abs(Math.min(...gaps.map(x=>x.gap))));
  }
  assert(Math.max(...shoes)<.023,'standing planted outsole cannot leave the floor');
  const preLaunch=u.pose();
  u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
  const rise=[];
  for(let n=0;n<5;n++){u.step();rise.push(u.pose());}
  assert.equal(u.authority.active,'jump');
  assert(!u.authority.error);
  assert.deepEqual(u.count(),writers,'guarded takeoff remains one final owner');
  return {u,ground,preLaunch,rise,last,shoes};
 }
 const guided=jump(true),original=jump(false);
 for(const i of [6,7,8,9,10,11,12,13]){
  assert(guided.preLaunch[i].angleTo(original.preLaunch[i])<.0001,
   'guiding knees may not move approved boxer arms');
 }
 for(const i of [15,18]){
  const first=guided.rise[0][i].angleTo(guided.preLaunch[i]);
  assert(first<.085,'first airborne knee must not flip at impulse');
  for(let j=1;j<4;j++)
   assert(guided.rise[j][i].angleTo(guided.rise[j-1][i])<.085,
    'guided knee must not snap in first 4 launch frames');
  assert(guided.rise[3][i].angleTo(guided.preLaunch[i])<.105,
   'retain authored bend until both shoes have cleared the ground');
 }
 assert(guided.u.authority.guidedLaunchBlend<=8,
  'after 5 launch frames the original recorded knee motion should be only gently blending in');
 function fly(style){
  const u=setup(base+'&flightStyle='+style);
  u.step(130);const floor=u.pose(),counts=u.count();
  u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
  u.step(20);
  u.f.jumping=false;u.f.pos.y=5;u.f.vel.y=0;u.f.vel.z=0;
  u.step(36);
  assert.equal(u.authority.active,'flight');
  const hover=u.pose(),hoverName=u.authority.flightStyle;
  u.f.vel.z=6.2;u.step(75);
  const cruise=u.pose();
  u.f.vel.y=7;u.step(20);const rise=u.pose();
  u.f.vel.y=-7;u.step(20);const descend=u.pose();
  u.f.dropping=true;u.step(1);
  assert.equal(u.authority.active,'fall');
  assert.deepEqual(u.count(),counts,'flight/fall use only one final pose owner');
  u.f.dropping=false;u.f.punchT=.20;u.step();
  assert.equal(u.authority.active,'yielded-to-combat-or-flight');
  // Combat handoff correctly resumes the previous V81 writer, so its
  // frame count is allowed to increase AFTER the exclusive air phase.
  assert(!u.authority.error);
  return {u,floor,hover,hoverName,cruise,rise,descend};
 }
 const air=fly('airborne'),groundLike=fly('controlled');
 assert.equal(air.hoverName,'V114 true hover / cruise');
 assert.equal(groundLike.hoverName,'V113 authored controlled');
 for(const i of [6,7,8,9,10,11,12,13,14,15,16,17,18,19])
  assert(air.floor[i].angleTo(groundLike.floor[i])<.0001,
   'new airborne pose cannot change approved ground idle');
 for(const i of [7,11,14,15,17,18])
  assert(air.hover[i].angleTo(groundLike.hover[i])>.09,
   'hover must no longer look identical to grounded fighting idle: '+V100.BONES[i]);
 for(const i of [1,2,14,17])
  assert(air.cruise[i].angleTo(air.hover[i])>.09,
   'moving in the air must not stand motionless: '+V100.BONES[i]);
 assert(air.rise[15].angleTo(air.descend[15])>.08,
  'flight ascent and descent need distinct knee response');
 console.log('PASS V114 full VRM stack: both knee bends safe at release, four no-snap jump frames, planted soles, truly airborne hover/cruise, immediate gravity/combat handoff');
}
function worldCorrectStandingKneesRegression(){
 const base='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFeet=hold&jumpKnees=forward&jumpFacing=locked&flightLab=blend&flightStyle=airborne';
 const u=setup(base),rig=u.f.vrmRig;
 u.f.floor=0;u.step(130);
 V100.plantVisibleSoles(THREE,rig,u.f,{});
 rig.vrm.scene.updateMatrixWorld(true);
 const world=n=>u.bones[n].getWorldPosition(new THREE.Vector3());
 const fwd=new THREE.Vector3(0,0,1)
  .applyQuaternion(rig.vrm.scene.getWorldQuaternion(new THREE.Quaternion()));
 fwd.y=0;fwd.normalize();
 const kneeRel=side=>world(side+'LowerLeg').sub(world(side+'UpperLeg')).dot(fwd);
 const shinRel=side=>world(side+'Foot').sub(world(side+'LowerLeg')).dot(fwd);
 const kneeStart=['left','right'].map(kneeRel),
       shinStart=['left','right'].map(shinRel);
 const armsStart=u.pose(),owners=u.count();
 u.f.v108JumpPrepT=.215;u.f.v108JumpPrepDuration=.215;
 const bendTimeline=[];
 for(let frame=1;frame<=12;frame++){
  u.f.v108JumpPrepT=Math.max(.0001,.215-frame/60);
  u.step();
  assert.equal(u.authority.active,'prep');
  assert.deepEqual(u.count(),owners,'forward knee prep has only one final writer');
  for(const s of ['left','right']){
   assert(kneeRel(s)>kneeStart[s==='left'?0:1]-.006,
    'kneecap cannot travel backward in actual VRM forward during preparation: '+s);
  }
  bendTimeline.push(['left','right'].map(kneeRel));
  assert(Math.abs(Math.min(...V100.soleGaps(THREE,rig,u.f).map(v=>v.gap)))<.022,
    'both legs may fold, soles remain planted on the floor');
 }
 const end=u.pose();
 for(const [i,s] of ['left','right'].entries()){
  assert(kneeRel(s)-kneeStart[i]>.065,
   'standing '+s+' knee must visibly bend FORWARD relative to thigh');
  assert(shinRel(s)-shinStart[i]<-.035,
   'standing '+s+' shin must fold back, not knee-hyperextend');
 }
 assert(u.authority.prepKneeDirections.includes('L:T')&&
  u.authority.prepKneeDirections.includes('R:T'),
  'real run must report measured signs for both hips and knees');
 for(const idx of [6,7,8,9,10,11,12,13])
  assert(end[idx].angleTo(armsStart[idx])<.17,
   'preserve approved compact guard while bending correct knees');
 u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
 const takeoff=[];
 for(let i=0;i<6;i++){u.step();takeoff.push(u.pose());}
 assert.equal(u.authority.active,'jump');
 for(const leg of [15,18]){
  assert(takeoff[0][leg].angleTo(end[leg])<.085,
    'first airborne shin must retain the forward bent prep pose');
  for(let i=1;i<5;i++)assert(takeoff[i][leg].angleTo(takeoff[i-1][leg])<.085,
   'shin cannot reverse suddenly through first 5 airborne frames');
 }
 assert(!u.authority.error);
 console.log('PASS V115 full VRM rig: both actual kneecaps travel FORWARD, shins fold back, soles planted, safe launch and unchanged fighting guard');
}
// V116: exercise the *full historical wrapper chain* and the new
// world-geometric standing crouch; do not mistake helper-only tests for
// a full V100/frame handoff test.
function readableWorldStandingJumpRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFeet=hold&jumpKnees=anatomic&jumpFacing=locked';
 const u=setup(url),rig=u.f.vrmRig;
 u.f.floor=0;u.step(130);
 V100.plantVisibleSoles(THREE,rig,u.f,{});
 rig.vrm.scene.updateMatrixWorld(true);
 const positions=n=>u.bones[n].getWorldPosition(new THREE.Vector3());
 const forward=new THREE.Vector3(0,0,1).applyQuaternion(
  rig.vrm.scene.getWorldQuaternion(new THREE.Quaternion())).normalize();
 forward.y=0;forward.normalize();
 const kneeBend=side=>{
  const hip=positions(side+'UpperLeg'),knee=positions(side+'LowerLeg'),
   ankle=positions(side+'Foot'),line=ankle.clone().sub(hip);
  const t=Math.max(0,Math.min(1,knee.clone().sub(hip).dot(line)/
   Math.max(.00001,line.lengthSq())));
  return knee.sub(hip.addScaledVector(line,t)).dot(forward);
 };
 const initialPose=u.pose(),baseKnee=['left','right'].map(kneeBend),
  baselineFoot=['left','right'].map(s=>positions(s+'Foot')),
  owners=u.count(),states=[];
 u.f.v108JumpPrepDuration=.215;u.f.v108JumpPrepT=.215;
 for(let frame=1;frame<=12;frame++){
  u.f.v108JumpPrepT=Math.max(.0001,.215-frame/60);
  u.step();
  assert.equal(u.authority.active,'prep');
  assert.deepEqual(u.count(),owners,'V116 must be the same ONE final air writer');
  const geometry=['left','right'].map(kneeBend);
  geometry.forEach((v,i)=>assert(v>=baseKnee[i]-.045,
   'V116 knee must not bend backward even at early prep frame'));
  states.push(geometry);
  const minGap=Math.min(...V100.soleGaps(THREE,rig,u.f).map(x=>x.gap));
  assert(Math.abs(minGap)<.024,'at least one sole must remain touching floor');
 }
 for(const [i,side] of ['left','right'].entries()){
  assert(kneeBend(side)>.07,
   'loaded '+side+' knee must project forward of entire hip-ankle line');
  assert(kneeBend(side)>baseKnee[i]+.085,
   'new crouch must visibly improve over the idle leg');
  const footTravel=positions(side+'Foot').clone().sub(baselineFoot[i]);
  footTravel.y=0;
  assert(footTravel.length()<.15,
   'standing shoe must not skate while loading knees: '+side);
 }
 assert(u.authority.prepWorldKneeCm>7,
  'V116 must measure actual anatomically forward knee geometry');
 assert(u.authority.prepKneeDirections==='V116 world-space anatomy');
 const final=u.pose();
 for(let i=6;i<=13;i++)assert(final[i].angleTo(initialPose[i])<.22,
  'V116 must preserve approved guard and not throw hands forward');
 // Releasing into UE5 jump must blend from the CURRENT crouched leg pose.
 u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
 u.step();const airborne=u.pose();
 for(const i of [14,15,16,17,18,19])assert(
  airborne[i].angleTo(final[i])<.12,'no abrupt first-frame knee/foot flip');
 assert(!u.authority.error);
 console.log('PASS V116 full real Three.js V100 stack: forward anatomical crouch, planted soles, compact approved guard, smooth takeoff and no competing writer');
}
// V117: run the actual V71/V76/V72/V79/V81 + V100 WRAPPER CHAIN.
// A world-space helper test alone cannot catch another controller's effect
// or a misplaced hips rotation after the visual shoe-ground correction.
function forwardWholeBodyJumpRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFeet=hold&jumpKnees=anatomic&jumpFacing=locked&jumpPreview=v117';
 const u=setup(url),rig=u.f.vrmRig;
 u.f.floor=0;u.step(130);
 V100.plantVisibleSoles(THREE,rig,u.f,{});
 const forward=new THREE.Vector3(0,0,1).applyQuaternion(
  rig.vrm.scene.getWorldQuaternion(new THREE.Quaternion()));
 forward.y=0;forward.normalize();
 const wp=n=>u.bones[n].getWorldPosition(new THREE.Vector3());
 const projected=()=>wp('head').sub(wp('hips')).dot(forward);
 const kneeOffset=s=>{
  const hip=wp(s+'UpperLeg'),knee=wp(s+'LowerLeg'),
    foot=wp(s+'Foot'),line=foot.clone().sub(hip);
  const t=Math.max(0,Math.min(1,knee.clone().sub(hip).dot(line)/
    Math.max(.00001,line.lengthSq())));
  return knee.sub(hip.addScaledVector(line,t)).dot(forward);
 };
 const neutral=u.pose(),originalForward=projected(),
  kneeStart=['left','right'].map(kneeOffset),owners=u.count();
 u.f.v108JumpPrepDuration=.215;u.f.v108JumpPrepT=.215;
 let prior=originalForward;
 for(let frame=1;frame<=12;frame++){
  u.f.v108JumpPrepT=Math.max(.0001,.215-frame/60);
  u.step();
  assert.equal(u.authority.active,'prep');
  assert.deepEqual(u.count(),owners,
   'V117 remains one final Kairo pose owner, no extra Mixamo writer');
  const now=projected();
  assert(now>=originalForward-.008,
   'V117 upper body must never pitch backward past its standing pose');
  // V112 deliberately begins knee/torso EXTENSION in the final ~18%
  // of the 215ms buffered prep. Forward loading is monotone until then;
  // a smooth return toward neutral in the release is physically correct.
  if(frame<=10)assert(now>=prior-.008,
   'V117 loading torso must move forwards before the push-off');
  if(frame>10)assert(Math.abs(now-prior)<.075,
   'V117 push-off extension must not snap the whole body backwards');
  prior=now;
  const minGap=Math.min(...V100.soleGaps(THREE,rig,u.f).map(x=>x.gap));
  assert(Math.abs(minGap)<.025,'loaded shoe must stay on ground');
 }
 const loaded=u.pose();
 assert(projected()>originalForward+.055,
  'V117 head must visibly travel FORWARD rather than arch backwards');
 assert(loaded[0].angleTo(neutral[0])<.024,
  'the pelvis must NOT rotate the thighs backward during prep');
 for(const [i,side]of ['left','right'].entries())
  assert(kneeOffset(side)>kneeStart[i]+.07&&kneeOffset(side)>.05,
   side+' whole knee must fold in correct physical direction');
 assert(u.authority.prepTorsoForwardCm>5);
 assert.equal(u.authority.prepKneeDirections,'V117 forward torso + knees');
 for(let i=6;i<=13;i++)
  assert(loaded[i].angleTo(neutral[i])<.22,
   'approved V101 guard must remain compact');
 u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
 u.step();const firstAir=u.pose();
 for(const i of [14,15,16,17,18,19])
  assert(firstAir[i].angleTo(loaded[i])<.12,
   'V117 legs must hand off smoothly at takeoff');
 assert(!u.authority.error);
 console.log('PASS V117 full VRM stack: grounded forward torso and knees, unchanged pelvis/guard, planted soles, single writer, smooth jump takeoff');
}
// V118 full-controller regression on the ACTUAL Kairo rig hierarchy:
// fighter model +Z -> VRM0 scene corrected by PI -> native feet -Z.
// V116/V117 sampled the child scene +Z (backward), not model +Z.
function correctedActualVRM0ForwardJumpRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFeet=hold&jumpKnees=anatomic&jumpFacing=locked&jumpPreview=v118';
 const u=setup(url),rig=u.f.vrmRig;
 const root=new THREE.Group();root.rotation.y=.75;
 root.add(rig.vrm.scene);rig.vrm.scene.rotation.y=Math.PI;
 u.f.model={root};rig.f=u.f;rig.legacyAxes=true;
 for(const side of ['left','right']){
  const toes=new THREE.Bone();
  toes.name=side+'Toes';toes.position.set(0,-.09,-.16);
  u.bones[side+'Foot'].add(toes);u.bones[toes.name]=toes;
 }
 root.updateMatrixWorld(true);
 u.f.floor=0;u.step(130);
 V100.plantVisibleSoles(THREE,rig,u.f,{});
 const world=n=>u.bones[n].getWorldPosition(new THREE.Vector3());
 const gameForward=new THREE.Vector3(0,0,1).applyQuaternion(
  root.getWorldQuaternion(new THREE.Quaternion())).normalize();
 const WRONG=new THREE.Vector3(0,0,1).applyQuaternion(
  rig.vrm.scene.getWorldQuaternion(new THREE.Quaternion())).normalize();
 assert(WRONG.dot(gameForward)<-.99,
  'mock must reproduce the actual VRM0 corrected-scene 180deg mismatch');
 const front=()=>world('head').sub(world('hips')).dot(gameForward);
 const knee=side=>{
  const hip=world(side+'UpperLeg'),joint=world(side+'LowerLeg'),
   ankle=world(side+'Foot'),line=ankle.clone().sub(hip);
  const t=Math.max(0,Math.min(1,joint.clone().sub(hip).dot(line)/
   Math.max(1e-8,line.lengthSq())));
  return joint.sub(hip.addScaledVector(line,t)).dot(gameForward);
 };
 const startFront=front(),kneeStart=['left','right'].map(knee),
  owners=u.count(),approvedPose=u.pose();
 const target=V100.realKairoForward(THREE,rig,{});
 assert(target.dot(gameForward)>.995,
  'real toe direction must calibrate to gameplay model forward, not scene');
 u.f.v108JumpPrepDuration=.215;u.f.v108JumpPrepT=.215;
 let peakFront=startFront,peakKnee=-Infinity;
 for(let i=1;i<=12;i++){
  u.f.v108JumpPrepT=Math.max(.0001,.215-i/60);
  u.step();
  assert.equal(u.authority.active,'prep');
  assert.deepEqual(u.count(),owners,'no historical Mixamo layer gains prep ownership');
  peakFront=Math.max(peakFront,front());
  peakKnee=Math.max(peakKnee,Math.min(knee('left'),knee('right')));
  if(i<=10)assert(front()>=startFront-.008,
   'VRM0 upper body must not arch backward during the load');
  const minGap=Math.min(...V100.soleGaps(THREE,rig,u.f).map(x=>x.gap));
  assert(Math.abs(minGap)<.025,'at least one actual visible sole stays planted');
 }
 assert(peakFront>startFront+.055,
  'VRM0 upper-body loading MUST shift toward actual toes, not scene +Z');
 assert(peakKnee>.065,
  'VRM0 real-facing kneecaps must advance past the hip-ankle line');
 for(const [i,side]of ['left','right'].entries())
  assert(knee(side)>kneeStart[i]+.07,
   side+' kneecap must not bend toward Kairo back');
 assert(u.authority.prepSceneVsBodyDot<-.99,
  'diagnostic must reveal reversed VRM0 child-scene forward');
 assert(u.authority.prepForwardSource.startsWith('fighter-root'),
  'V118 must follow Kairo model facing even with animated toe yaw');
 assert.equal(u.authority.prepKneeDirections,'V118 true VRM0 front');
 const loaded=u.pose();
 assert(loaded[0].angleTo(approvedPose[0])<.024,'no unintended pelvis twist');
 for(let i=6;i<=13;i++)
  assert(loaded[i].angleTo(approvedPose[i])<.22,'compact guard remains approved');
 u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
 u.step();const airborne=u.pose();
 for(const i of [14,15,16,17,18,19])
  assert(airborne[i].angleTo(loaded[i])<.12,'smooth V118 into V102 airborne handoff');
 assert(!u.authority.error);
 console.log('PASS V118 REAL VRM0 corrected scene full controller stack: BOTH toes and body advance in gameplay forward, one owner, planted soles, unchanged guard and jump handoff');
}
// V119 integrates native VRM0 toes into the ONE V100 final-pose owner.
 // Real game has +Z fighter model and PI-rotated VRM0 -Z native toes.
 // Track world toe tip, heel contact, knees and stable approved hands.
function softerNaturalVRM0JumpRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFeet=hold&jumpKnees=anatomic&jumpFacing=locked&jumpPreview=v119';
 const u=setup(url),rig=u.f.vrmRig;
 const root=new THREE.Group();root.rotation.y=.7;
 root.add(rig.vrm.scene);rig.vrm.scene.rotation.y=Math.PI;
 u.f.model={root};rig.f=u.f;rig.legacyAxes=true;
 const toes={};
 for(const side of ['left','right']){
  const toe=new THREE.Bone();toe.position.set(0,-.09,-.16);
  toe.name=side+'Toes';u.bones[side+'Foot'].add(toe);
  const tip=new THREE.Object3D();tip.position.set(0,0,-.08);toe.add(tip);
  u.bones[toe.name]=toe;toes[side]={toe,tip};
 }
 root.updateMatrixWorld(true);
 u.f.floor=0;u.step(130);
 V100.plantVisibleSoles(THREE,rig,u.f,{});
 const wp=n=>n.getWorldPosition(new THREE.Vector3());
 const originalToes={};
 for(const side of ['left','right']){
  const x=toes[side];
  originalToes[side]={height:wp(x.tip).y,
   toeQ:x.toe.quaternion.clone()};
 }
 const approvedPose=u.pose(),owners=u.count();
 const originalYaw=['left','right'].map(s=>
  u.bones[s+'Foot'].getWorldQuaternion(new THREE.Quaternion()));
 const forward=V100.realKairoForward(THREE,rig,{});
 const torsoOffset=()=>wp(u.bones.head).sub(wp(u.bones.hips)).dot(forward);
 const originalTorso=torsoOffset();
 u.f.v108JumpPrepDuration=.215;u.f.v108JumpPrepT=.215;
 let maxToeRise=0,maxYaw=0,maxLean=0,maxKnee=0;
 for(let frame=1;frame<=12;frame++){
  u.f.v108JumpPrepT=Math.max(.0001,.215-frame/60);
  u.step();
  assert.equal(u.authority.active,'prep');
  assert.deepEqual(u.count(),owners,'V119 cannot add a new animator');
  const gaps=V100.soleGaps(THREE,rig,u.f);
  assert(Math.abs(Math.min(...gaps.map(x=>x.gap)))<.03,
   'shoe/toe floor contact must remain stable');
  maxLean=Math.max(maxLean,torsoOffset()-originalTorso);
  for(const [i,side] of ['left','right'].entries()){
   const {toe,tip}=toes[side],saved=originalToes[side];
   maxToeRise=Math.max(maxToeRise,wp(tip).y-saved.height);
   const footQ=u.bones[side+'Foot'].getWorldQuaternion(new THREE.Quaternion());
   maxYaw=Math.max(maxYaw,footQ.angleTo(originalYaw[i]));
   assert(toe.quaternion.angleTo(saved.toeQ)<.15,
    'native toe curl must not overrotate');
   const hip=wp(u.bones[side+'UpperLeg']),
    knee=wp(u.bones[side+'LowerLeg']),
    ankle=wp(u.bones[side+'Foot']),line=ankle.clone().sub(hip);
   const t=Math.max(0,Math.min(1,knee.clone().sub(hip).dot(line)/
    Math.max(1e-8,line.lengthSq())));
   const bent=knee.sub(hip.addScaledVector(line,t)).dot(forward);
   maxKnee=Math.max(maxKnee,bent);
  }
 }
 assert(u.authority.prepToeJoints===2,'both actual VRM0 toe bones flex');
 assert(maxYaw>.022&&maxYaw<.14,'outward toe/foot turnout is small and visible');
 assert(maxToeRise>.001,'toe tips flex upwards during foot load');
 assert(maxLean>.05,'staggered spine/chest still move toward physical front');
 assert(maxKnee>.06,'V118 correct knee direction must be retained');
 assert.equal(u.authority.prepKneeDirections,'V119 soft V118 crouch');
 const finalPose=u.pose();
 assert(finalPose[0].angleTo(approvedPose[0])<.024,
  'V119 never rotates the whole pelvis backwards');
 for(let i=6;i<=13;i++)assert(finalPose[i].angleTo(approvedPose[i])<.22,
  'V101 compact guard must remain unchanged');
 // At release prep-only toe curl is restored; ground movement and
 // incoming airborne should not inherit a permanent toe correction.
 u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
 u.step();
 const airborne=u.pose();
 for(const side of ['left','right']){
  assert(toes[side].toe.quaternion.angleTo(originalToes[side].toeQ)<1e-5,
   'native toes must return to their prep-entry orientation on jump');
 }
 for(const i of [14,15,16,17,18,19])
  assert(airborne[i].angleTo(finalPose[i])<.12,
   'V119 must not snap at leg takeoff');
 assert(!u.authority.error);
 console.log('PASS V119 full Kairo VRM0 + historical mixamo stack: springy native toes, outward feet, forward knees/torso, grounded soles, approved guard and smooth takeoff');
}
// V119 toe curls are PREP-only. If guard/Boost interrupts before
// begin(next='jump'), they must not persist on the combat skeleton.
function v119CombatToeInterruptRegression(){
 const u=setup('?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFeet=hold&jumpKnees=anatomic&jumpFacing=locked&jumpPreview=v119');
 const rig=u.f.vrmRig,root=new THREE.Group();
 root.add(rig.vrm.scene);rig.vrm.scene.rotation.y=Math.PI;
 u.f.model={root};rig.f=u.f;
 const saved={};
 for(const side of ['left','right']){
  const toe=new THREE.Bone();toe.position.set(0,-.09,-.16);
  u.bones[side+'Foot'].add(toe);u.bones[side+'Toes']=toe;
  saved[side]=toe.quaternion.clone();
 }
 u.step(130);u.f.floor=0;
 u.f.v108JumpPrepDuration=.215;u.f.v108JumpPrepT=.215;
 for(let i=1;i<=8;i++){
  u.f.v108JumpPrepT=.215-i/60;u.step();
  assert.equal(u.authority.active,'prep');
 }
 for(const side of ['left','right'])
  assert(u.bones[side+'Toes'].quaternion.angleTo(saved[side])>.025,
   'V119 forefoot must be active just before interrupt');
 u.f.blockHeld=true;u.step();
 assert.equal(u.authority.active,'yielded-to-combat-or-flight',
  'combat must immediately preempt the jump writer');
 for(const side of ['left','right'])
  assert(u.bones[side+'Toes'].quaternion.angleTo(saved[side])<1e-6,
   'V119 toe bend must be restored before combat owns the rig');
 console.log('PASS V119 combat interrupt: dynamic native toes cleaned up immediately without another bone writer');
}
// V120: end-to-end historical controller stack, not just a helper.
 // Compare V119 (approved feet/knees) with V120 at IDENTICAL jump times:
 // legs, root, wrists and physics must match; real arms must move.
function fluidStandingJumpArmsRegression(){
 const base='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFeet=hold&jumpKnees=anatomic&jumpFacing=locked&jumpPreview=';
 function run(preview){
  const u=setup(base+preview),rig=u.f.vrmRig;
  const root=new THREE.Group();root.rotation.y=.7;
  root.add(rig.vrm.scene);rig.vrm.scene.rotation.y=Math.PI;
  u.f.model={root};rig.f=u.f;rig.legacyAxes=true;
  for(const side of ['left','right']){
   const toe=new THREE.Bone();toe.position.set(0,-.09,-.16);
   u.bones[side+'Foot'].add(toe);u.bones[side+'Toes']=toe;
  }
  root.updateMatrixWorld(true);
  u.f.floor=0;u.step(130);V100.plantVisibleSoles(THREE,rig,u.f,{});
  const ground=u.pose(),writers=u.count();
  u.f.v108JumpPrepDuration=.215;u.f.v108JumpPrepT=.215;
  const prep=[];
  for(let k=1;k<=12;k++){
   u.f.v108JumpPrepT=Math.max(.0001,.215-k/60);u.step();
   if(k===8||k===12)prep.push(u.pose());
   assert.equal(u.authority.active,'prep');
   assert.deepEqual(u.count(),writers,'old Mixamo layer cannot write during prep');
  }
  const finalPrep=u.pose();
  u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
  const ascent=[];
  for(let k=1;k<=19;k++){
   u.step();
   if([1,4,9,14,19].includes(k))ascent.push(u.pose());
   assert.equal(u.authority.active,'jump');
   assert.deepEqual(u.count(),writers,'old recorded writers must yield during ascent');
  }
  return {u,ground,prep,finalPrep,ascent};
 }
 const previous=run('v119'),candidate=run('v120');
 for(const [label,parts]of [['ground',[previous.ground,candidate.ground]],
  ['prep',[previous.finalPrep,candidate.finalPrep]],
  ...previous.ascent.map((pose,i)=>['ascent-'+i,[pose,candidate.ascent[i]]])]){
  const [old,next]=parts;
  for(const i of [0,1,2,3,4,5,14,15,16,17,18,19])
   assert(old[i].angleTo(next[i])<.001,
    'V120 may not alter corrected V118 torso/legs: '+label+'/'+V100.BONES[i]);
  for(const i of [9,13])
   assert(old[i].angleTo(next[i])<.001,
    'V120 must retain V101 compact wrist pose: '+label+'/'+V100.BONES[i]);
 }
 let prepChange=0,maxRiseChange=0;
 for(let i=6;i<=12;i++)if([6,7,8,10,11,12].includes(i)){
  prepChange=Math.max(prepChange,previous.prep[0][i].angleTo(candidate.prep[0][i]));
  for(let k=1;k<4;k++)maxRiseChange=Math.max(maxRiseChange,
   previous.ascent[k][i].angleTo(candidate.ascent[k][i]));
 }
 assert(prepChange>.012,'V120 arms must recoil during crouch');
 assert(maxRiseChange>.065,'V120 arms must actually swing during upward jump');
 assert(maxRiseChange<.35,'V120 arms must not swing wildly/cross');
 assert.equal(candidate.u.authority.armStyle,'V120 fluid compact ascent');
 assert(candidate.u.authority.jumpArmDrive>=0);
 assert.equal(candidate.u.authority.jumpArmWorldJoints,6);
 assert(!candidate.u.authority.error);
 console.log('PASS V120 full V100/Mixamo chain: visible prep+ascent arm swing, unchanged V119 toe/knee/pelvis, compact wrists, and zero competing controllers');
}
// V121: the real takeoff should not instantly square BOTH thighs and
// feet forward. Compare actual V120 and V121 multi-wrapper poses on the
// correct rotated VRM0 scene, including a MOVING legacy regression.
function stanceHeadingAcrossTakeoffRegression(){
 const url='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFeet=hold&jumpKnees=anatomic&jumpFacing=locked&jumpPreview=';
 function scenario(mode,version){
  const u=setup(url+version),rig=u.f.vrmRig,root=new THREE.Group();
  root.rotation.y=.75;root.add(rig.vrm.scene);
  rig.vrm.scene.rotation.y=Math.PI;u.f.model={root};rig.f=u.f;
  for(const side of ['left','right']){
   const toe=new THREE.Bone();toe.position.set(0,-.09,-.16);
   u.bones[side+'Foot'].add(toe);u.bones[side+'Toes']=toe;
  }
  root.updateMatrixWorld(true);u.f.floor=0;u.step(130);
  V100.plantVisibleSoles(THREE,rig,u.f,{});
  const initial=u.pose(),writers=u.count();
  const speed=mode==='moving'?3.2:0;
  u.f.vel.z=speed;
  u.f.v108JumpPrepSpeed=speed;
  u.f.v108JumpPrepDuration=.215-.10*Math.min(1,speed/6.2);
  u.f.v108JumpPrepT=u.f.v108JumpPrepDuration;
  const duration=u.f.v108JumpPrepDuration;
  for(let k=1;k<=12;k++){
   u.f.v108JumpPrepT=Math.max(.0001,duration-k*duration/12);
   u.step();
   assert.equal(u.authority.active,'prep');
   assert.deepEqual(u.count(),writers);
  }
  const crouched=u.pose(),sole={};
  for(const side of ['left','right'])
   sole[side]=u.bones[side+'Foot'].getWorldQuaternion(new THREE.Quaternion());
  const knees={};
  for(const side of ['left','right'])
   knees[side]=u.bones[side+'UpperLeg'].getWorldQuaternion(new THREE.Quaternion());
  u.f.v108JumpPrepT=0;u.f.jumping=true;u.f.pos.y=1.2;u.f.vel.y=14;
  const first=[];
  for(let k=1;k<=18;k++){
   u.step();
   if([1,4,7,10,14,18].includes(k)){
    first.push({pose:u.pose(),feet:Object.fromEntries(['left','right'].map(side=>
      [side,u.bones[side+'Foot'].getWorldQuaternion(new THREE.Quaternion())])),
      thighs:Object.fromEntries(['left','right'].map(side=>
      [side,u.bones[side+'UpperLeg'].getWorldQuaternion(new THREE.Quaternion())])),
      headingHold:u.authority.takeoffStanceHold||0});
   }
   assert.equal(u.authority.active,'jump');
   assert.deepEqual(u.count(),writers);
  }
  assert(!u.authority.error);
  return {u,initial,crouched,sole,knees,first};
 }
 const old=scenario('stationary','v120'),fresh=scenario('stationary','v121');
 // V121 changes ONLY the lower-body heading in PREP and early ascent,
 // not the approved torso, compact hands, arm rhythm or pelvis.
 for(const i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13])
  assert(fresh.crouched[i].angleTo(old.crouched[i])<.0005,
   'V121 must preserve approved jump arm/torso/pelvis: '+V100.BONES[i]);
 for(let k=0;k<fresh.first.length;k++)
  for(const i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13])
   assert(fresh.first[k].pose[i].angleTo(old.first[k].pose[i])<.001,
    'V121 ascent must preserve approved whole body/guard '+V100.BONES[i]);
 for(const side of ['left','right']){
  const oldThigh=old.crouched[side==='left'?14:17];
  const newThigh=fresh.crouched[side==='left'?14:17];
  assert(newThigh.angleTo(oldThigh)>.04,
   side+' loaded thigh must have visible outward anatomical heading');
  assert(fresh.sole[side].angleTo(old.sole[side])>.035,
   side+' toe-out foot stance must survive PREP end instead of returning neutral');
  assert(fresh.first[0].feet[side].angleTo(fresh.sole[side])<.1,
   side+' shoe must not suddenly square forward on the very first launch frame');
  assert(fresh.first[0].thighs[side].angleTo(fresh.knees[side])<.12,
   side+' femur must not suddenly rotate at the first impulse');
 }
 assert(fresh.first[0].headingHold>90);
 assert(fresh.first[3].headingHold<fresh.first[1].headingHold,
  'loaded stance must gradually give way to recorded flight');
 assert(fresh.first.at(-1).headingHold===0,
  'normal airborne pose must return fully by end of 275ms release');
 // Moving jumps DO NOT inherit this stationary fix; they keep V103 run
 // inheritance and V109 moving landing. Compare all 20 joint quats.
 const mOld=scenario('moving','v120'),mNew=scenario('moving','v121');
 for(const i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]){
  assert(mOld.crouched[i].angleTo(mNew.crouched[i])<.0001,
   'moving jump ground must remain identical: '+V100.BONES[i]);
  for(let k=0;k<mOld.first.length;k++)
   assert(mOld.first[k].pose[i].angleTo(mNew.first[k].pose[i])<.0001,
    'moving jump ascent must remain identical: '+V100.BONES[i]);
 }
 console.log('PASS V121 full V100/Mixamo: outward thigh+shoe through grounded handoff, smooth first 275ms, unchanged upper body and moving jump rollback');
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
 assert(/SKY CLASH · BUILD V(10[1-9]|11[0-5])/.test(html));
 assert(!html.includes('V58'));
 assert(!studio.includes('V83')&&!studio.includes('V82 · DIRECT ASSIGN')&&!studio.includes('RIG LAB V60'));
 assert(/js[/]v66-game-boot[.]js[?]v=820&fix=(10[2-9]|11[0-6])/.test(html));
 assert(boot.includes('SkyClashBuild=Object.freeze'));
 assert(boot.includes('GROUND: ')&&boot.includes('JUMP: ')&&boot.includes('LAND: '));
 assert(boot.includes("e.src+='&arms=101'"),'new V100 animator URL must cache-refresh for jump test');
 console.log('PASS V101: approved compact guard stays intact; current build labels are consistent.');
}
try{
 check();
 compactGuardRegression();
 steadyAirLegRegression();
 movingTakeoffRegression();
 contactLandingRegression();
 visibleLandingFootRegression();
 expressiveJumpRegression();
 movingLandingSupportRegression();
 subtleGroundedPrepRegression();
 readablePrepAndMovingFlowRegression();
 airFacingAlignmentRegression();
 continuousFlightRegression();
 visibleStandingPushOffRegression();
 controlledFlightFootHoldRegression();
 guidedKneesAirborneStyleRegression();
 worldCorrectStandingKneesRegression();
 readableWorldStandingJumpRegression();
 forwardWholeBodyJumpRegression();
 correctedActualVRM0ForwardJumpRegression();
 softerNaturalVRM0JumpRegression();
 v119CombatToeInterruptRegression();
 fluidStandingJumpArmsRegression();
 stanceHeadingAcrossTakeoffRegression();
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
