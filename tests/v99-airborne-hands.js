/* V99 jump-hand regression: real V76 + V72 + V81 on one nested
 * THREE.Bone Kairo. Preserve all approved locomotion and jump body motion.
 * The test checks joints, not only the animation state-machine labels.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V76=require('../js/v76-upper-body.js');
const V72=require('../js/v72-published-actions.js');
const V81=require('../js/v81-pose-transitions.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const approved=Object.fromEntries(JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'))
 .motions.map(m=>[m.slot,m]));
const ue=Object.fromEntries(JSON.parse(read('assets/animations/gameplay/v86-ue5-converted-actions.json'))
 .motions.map(m=>[m.slot,m]));
assert.equal(approved.idle.sourceFile,'Movement/Adventure/idle (2).fbx');
assert.equal(approved.run.sourceFile,'Movement/Male/standard run.fbx');
assert.equal(ue.jump.sourceFile,'Mixamo_jump_up_mixamo_Motion.Fbx');
assert.equal(ue.fallingIdle.sourceFile,'Mixamo_falling_idle_mixamo_Motion.Fbx');
const actions=Object.fromEntries(['idle','run'].map(n=>[n,V72.decode(THREE,approved[n])]));
for(const k of ['jump','fallingIdle','landing','floating','flying','guard'])
 actions[k]=V72.decode(THREE,ue[k]);
const oldIdle=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-fighting-idle-v1.json')));
const walk=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-walk-arms-v1.json')));
const old={location:globalThis.location,SkyClash:globalThis.SkyClash,
 SkyClashMovementLab:globalThis.SkyClashMovementLab,
 SkyClashUpperBody:globalThis.SkyClashUpperBody,
 SkyClashPublishedActions:globalThis.SkyClashPublishedActions};
function create(mode){
 globalThis.location={search:'?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump'+(mode==='stable'?'&airHands=stable':'')};
 const scene=new THREE.Group(),bones={};
 const add=(n,p,x=0,y=0,z=0)=>{const b=new THREE.Bone();b.name=n;b.position.set(x,y,z);p.add(b);bones[n]=b;return b;};
 const hips=add('hips',scene,0,1),spine=add('spine',hips,0,.17),chest=add('chest',spine,0,.19),
  upper=add('upperChest',chest,0,.10),neck=add('neck',upper,0,.08);
 add('head',neck,0,.11);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const shoulder=add(side+'Shoulder',upper,sign*.15,.04);
  const arm=add(side+'UpperArm',shoulder,sign*.15,-.025);
  const elbow=add(side+'LowerArm',arm,sign*.25);
  const hand=add(side+'Hand',elbow,sign*.22);
  for(const finger of ['Index','Middle','Ring','Little']){
   let p=hand;
   for(const seg of ['Proximal','Intermediate','Distal'])p=add(side+finger+seg,p);
  }
  const thigh=add(side+'UpperLeg',hips,sign*.11,-.12),calf=add(side+'LowerLeg',thigh,0,-.42);
  add(side+'Foot',calf,0,-.43,.09);
 }
 const rig={legacyAxes:true,vrm:{scene,humanoid:{getNormalizedBoneNode:n=>bones[n]||null},update(){}}};
 const f={hp:100,t:0,name:'Kairo Venn',characterId:'kairo_venn',vrmRig:rig,
  pos:new THREE.Vector3(),vel:new THREE.Vector3(),
  moveIntent:new THREE.Vector3(),v89Step:{mode:'idle',scale:0},v71Walk:{weight:0,clock:0},
  v95JoystickRun:false,v80AnalogRun:false,jumping:false,dropping:false,
  sprinting:false,launched:false,spiked:false,dashing:false,
  blockHeld:false,blocking:false,charging:false,slamming:false,
  stun:0,downT:0,punchT:0,blastT:0,superHitT:0,landingMotionT:0,acro:null,
  animate(){}
 };
 Object.defineProperty(f,'flying',{get(){return f.pos.y>.25}});
 const s76={ready:true,frames:0,originalWalkStyle:false},
  s72={ready:true,approvedIdle:actions.idle,frames:0,active:'none'},s81={active:'waiting',airWristClamps:0};
 globalThis.SkyClash={Game:{player:f,heroes:{kairo_venn:f}}};
 globalThis.SkyClashMovementLab={version:89,enabled:true,joystickRun:true};
 globalThis.SkyClashUpperBody=s76;
 globalThis.SkyClashPublishedActions=s72;
 assert(V76.attach(THREE,f,oldIdle,walk,s76));
 assert(V72.attach(THREE,f,actions,s72));
 assert(V81.attach(THREE,f,s81));
 const tick=(n=1)=>{for(let j=0;j<n;j++){f.t+=1/60;f.v71Walk.clock+=1/60;f.animate(1/60);}};
 const wrists=()=>['leftHand','rightHand'].map(n=>bones[n].quaternion.clone());
 const arms=()=>V76.BONES.map(n=>bones[n].quaternion.clone());
 return {f,bones,s76,s72,s81,tick,wrists,arms};
}
function run(mode){
 const a=create(mode);a.tick(130);
 assert.equal(a.s76.idleSource,'approved-idle (2)');
 const standing=a.wrists();
 a.f.pos.y=1.2;a.f.jumping=true;a.f.vel.y=11;
 a.tick(34);
 assert.equal(a.s72.active,'jump');
 assert.equal(a.s81.active,'jump');
 const jump=a.wrists(),jumpArms=a.arms(),jumpFinger=a.bones.leftIndexProximal.quaternion.clone();
 const jumpDeviation=Math.max(...jump.map((q,i)=>q.angleTo(standing[i])));
 if(mode==='stable'){
  assert.equal(a.s81.airHands,'V99 native fingers + steady wrists');
  assert(jumpDeviation<=.481,'hand must stay within approved local wrist excursion');
  assert(jumpFinger.angleTo(new THREE.Quaternion())<1e-5,
   'V73 native fingers must remain native through jump');
  assert(a.s81.airWristClamps>0,'large UE5 source wrist divergence was exercised');
 }else{
  assert(jumpFinger.angleTo(new THREE.Quaternion())>.25,
   'reproduce V81 forced jumping finger curl under old V98');
 }
 a.f.vel.y=-7;a.tick(38);
 assert.equal(a.s72.active,'fallingIdle');
 assert.equal(a.s81.active,'fall');
 if(mode==='stable'){
  assert(Math.max(...a.wrists().map((q,i)=>q.angleTo(standing[i])))<=.481,
   'descent must retain stabilized wrist anchor instead of switching midair');
  assert(a.bones.rightIndexProximal.quaternion.angleTo(new THREE.Quaternion())<1e-5,
   'native fingers remain untouched through true gravity fall');
 }
 a.f.pos.y=0;a.f.jumping=false;a.f.vel.y=0;a.f.landingMotionT=.48;
 a.tick(15);
 assert.equal(a.s81.active,'landing');
 if(mode==='stable')assert.equal(a.s81.airHands,'normal',
  'landing recorded animation must regain authority');
 a.f.landingMotionT=0;a.f.blockHeld=true;a.tick(30);
 assert.equal(a.s81.active,'guard');
 assert(a.bones.leftIndexProximal.quaternion.angleTo(new THREE.Quaternion())>.5,
  'guard finger curl must remain available, unaffected by jump-only experiment');
 a.f.blockHeld=false;a.tick(130);
 assert(a.bones.leftIndexProximal.quaternion.angleTo(new THREE.Quaternion())<.01,
  'native idle fingers must recover');
 assert(!a.s76.error&&!a.s72.error&&!a.s81.error);
 return {jumpArms,jumpDeviation};
}
try{
 const stable=run('stable');
 const original=run('original');
 // Preserve recorded arm choreography: no shoulder or elbow is changed
 // by the V99 jump-only wrist and finger override.
 for(let i=0;i<V76.BONES.length;i++){
  if(V76.BONES[i].endsWith('Hand'))continue;
  assert(stable.jumpArms[i].angleTo(original.jumpArms[i])<1e-4,
    'V99 must not alter recorded shoulders/elbows: '+V76.BONES[i]);
 }
 assert(original.jumpDeviation>stable.jumpDeviation+.08,
  'the unmodified UE5 jump wrist mismatch must be measurably reduced');
 const boot=read('js/v66-game-boot.js');
 assert(boot.includes("e.src+='&hands=99'"));
 assert(boot.includes("e.src+='&arm=97'"));
 assert(boot.includes("e.src+='&fix=94'"));
 assert(boot.includes('js/v95-joystick-radius.js?v=950'));
 assert(read('index.html').includes('js/v66-game-boot.js?v=820&fix=99'));
 console.log('PASS V99: real Kairo V76/V72/V81 jump and fall keep native fingers and bounded wrists; approved arms/landing/guard intact');
}finally{
 for(const [k,v]of Object.entries(old)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
}
