/* Batch A exact Kairo authored local-rig clip acceptance.
 * No browser, rendering workflow, gameplay edits or new animation writer.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const authored=require('../js/kairo-combat-choreography.js');
const published=require('../js/v72-published-actions.js');
const ROOT=path.join(__dirname,'..');
const text=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const pack=JSON.parse(text('assets/animations/combat/kairo/storm-fist-batch-a.pose.json'));
assert.equal(pack.schema,'sky-clash.combat-choreo.v1');
assert.equal(pack.characterId,'kairo_venn');
assert.equal(pack.modelSha256,authored.SHA);
assert.deepEqual(pack.bones,published.BONES);
assert.equal(pack.gameplayRootTranslation,false,'Physics, pursuit and hitboxes own translation');
assert.equal(pack.visualApproval,false,'First-pass clips must not be mistaken for player approval');
const clips=authored.decodePack(THREE,pack);
const state={characterId:'kairo_venn',hp:100,vel:new THREE.Vector3(),
 moveIntent:new THREE.Vector3(),punchT:0,stun:0,downT:0,
 blockHeld:false,blocking:false,launched:false,spiked:false};
assert.equal(authored.select(state,'idle'),'combatReady');
assert.equal(authored.select({...state,vel:new THREE.Vector3(0,0,4)},'walk'),null);
assert.equal(authored.select({...state,punchT:.4,attackAir:false},'punch1'),'punch1');
assert.equal(authored.select({...state,punchT:.4,attackAir:true},'punch1'),null);
assert.equal(authored.select({...state,blockHeld:true},'guard'),'guard');
assert.equal(authored.select({...state,blockHeld:true,riposteT:1.02},'guard'),'parry');
assert.equal(authored.select({...state,stun:.3,hitFlash:.15},'hit'),'hitLight');
assert.equal(authored.select({...state,stun:.3,hitFlash:.2},'hit'),'hitHeavy');
assert.equal(authored.select({...state,stun:.3,brokenT:.4},'hit'),'hitHeavy');
assert.equal(authored.select({...state,launched:true},'idle'),null);
assert.equal(authored.select({...state,flying:true},'floating'),null);
assert.equal(authored.select({...state,sprinting:true},'boost'),null);
assert.equal(authored.select({...state,characterId:'rin_sable'},'idle'),null);
const stages=[
 ['punch1',.55,.24],['punch2',.55,.24],
 ['punch3',.68,.33],['overhand',.68,.33],['kick',.87,.41]
];
for(const [slot,duration,contact] of stages){
 const raw=pack.clips.find(x=>x.slot===slot),c=clips[slot];
 assert.equal(c.duration,duration);
 assert.equal(c.contactTime,contact);
 assert(raw.keyframes.some(k=>k.time===contact));
 const pose=()=>authored.BONES.map(()=>new THREE.Quaternion());
 const a=pose(),b=pose(),finish=pose();
 c.sample(0,a);c.sample(contact,b);c.sample(duration,finish);
 assert(a.some((q,i)=>q.angleTo(b[i])>.2),'contact silhouette must change at '+slot);
 assert(finish.every(q=>Math.abs(q.length()-1)<1e-5));
 // A V165-scaled game clock must still sample EXACTLY the same contact pose.
 const tempo={punch1:.82,punch2:.84,punch3:.89,overhand:.89,kick:.94}[slot];
 const atScaled=c.duration*((contact*tempo)/(duration*tempo));
 assert(Math.abs(atScaled-contact)<1e-8);
 const v165=pose();c.sample(atScaled,v165);
 assert(v165.every((q,i)=>q.angleTo(b[i])<1e-5));
 for(const fps of [30,60,120]){
  let prior=null;
  for(let t=0;t<=duration+1/fps;t+=1/fps){
   const tmp=pose();c.sample(Math.min(t,duration),tmp);
   assert(tmp.every(q=>Number.isFinite(q.length())&&Math.abs(q.length()-1)<1e-4));
   if(prior)assert(tmp.every((q,i)=>q.angleTo(prior[i])<2.15),
    slot+' discontinuity at '+fps+'fps');
   prior=tmp;
  }
 }
}
assert.equal(pack.clips.length,10);
for(const slot of ['combatReady','guard','parry','hitLight','hitHeavy'])assert(clips[slot]);
assert.throws(()=>authored.decodePack(THREE,{...pack,modelSha256:'bad'}),/compatible/);
const invalid=JSON.parse(JSON.stringify(pack));invalid.clips[3].keyframes[1].quaternions[0]=[0,0,0,0];
assert.throws(()=>authored.decodePack(THREE,invalid),/Malformed/);
// Simulate the existing V72 final writer with a visible 20-bone normalized rig.
function dummyFighter(characterId='kairo_venn'){
 const scene=new THREE.Group(),nodes={};
 const bone=(n,p,x=0,y=0,z=0)=>{const o=new THREE.Bone();o.position.set(x,y,z);p.add(o);nodes[n]=o;return o;};
 const hip=bone('hips',scene,0,1,0),spine=bone('spine',hip,0,.16),
  chest=bone('chest',spine,0,.15),upper=bone('upperChest',chest,0,.13),
  neck=bone('neck',upper,0,.1);bone('head',neck,0,.13);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const shoulder=bone(side+'Shoulder',upper,sign*.19,.02);
  const arm=bone(side+'UpperArm',shoulder,sign*.13);
  const elbow=bone(side+'LowerArm',arm,sign*.23);
  bone(side+'Hand',elbow,sign*.19);
  const leg=bone(side+'UpperLeg',hip,sign*.14,-.09),
   knee=bone(side+'LowerLeg',leg,0,-.43);
  bone(side+'Foot',knee,0,-.42);
 }
 const rig={vrm:{scene,humanoid:{getNormalizedBoneNode:n=>nodes[n]||null},
  update(){this.ticks=(this.ticks||0)+1;}}};
 const f={
  characterId,vrmRig:rig,hp:100,stun:0,downT:0,launched:false,spiked:false,
  charging:false,blockHeld:false,blocking:false,sprinting:false,dashing:false,
  jumping:false,flying:false,attackAir:false,superHitT:0,slamming:false,
  vel:new THREE.Vector3(),moveIntent:new THREE.Vector3(),punchT:.40,
  attackTotal:.55,attackElapsed:.24,attackKind:'punch',attackSerial:1,punchSide:1,
  animate(){this.base=(this.base||0)+1;for(const n of Object.values(nodes))n.quaternion.identity();}
 };
 return {f,nodes};
}
const v87=JSON.parse(text('assets/animations/gameplay/v87-recorded-combat.json'));
const old={};
for(const entry of v87.motions)old[entry.slot]=published.decode(THREE,entry);
const {f,nodes}=dummyFighter(),status={frames:0,error:null};
// Test the same selection callback installed in the experimental browser.
global.SkyClashKairoCombatChoreo=authored;
published.attach(THREE,f,old,status,{kairoCombat:clips});
f.animate(1/60);
assert.equal(status.active,'punch1');
assert.equal(f.v72StudioPack.slot,'punch1');
f.punchT=0;f.attackElapsed=0;f.vel.set(0,0,0);f.moveIntent.set(0,0,0);
for(let i=0;i<28;i++)f.animate(1/60);
assert.equal(f.v72StudioPack.slot,'combatReady');
assert(!status.error);
f.blockHeld=true;f.blocking=true;for(let i=0;i<15;i++)f.animate(1/60);
assert.equal(f.v72StudioPack.slot,'guard');
const shield=authored.BONES.map(()=>new THREE.Quaternion());
clips.guard.sample(.24,shield);
assert(nodes.leftUpperArm.quaternion.angleTo(shield[7])<.22,
 'native authored shield must play, not freeze due to missing Mixamo speed');
f.riposteT=1.14;for(let i=0;i<9;i++)f.animate(1/60);
assert.equal(f.v72StudioPack.slot,'parry');
f.blockHeld=false;f.blocking=false;f.riposteT=0;f.stun=.4;f.hitFlash=.2;
for(let i=0;i<4;i++)f.animate(1/60);
assert.equal(f.v72StudioPack.slot,'hitHeavy');
f.stun=0;f.hitFlash=0;f.punchT=.4;f.attackElapsed=.24;f.attackTotal=.55;
f.animate(1/60);
const sample=authored.BONES.map(()=>new THREE.Quaternion());
clips.punch1.sample(.24,sample);
for(const n of ['hips','leftUpperArm','leftLowerArm','rightUpperArm','leftUpperLeg']){
 const i=authored.BONES.indexOf(n);
 assert(nodes[n].quaternion.angleTo(sample[i])<.001,
  'Existing V72 owner must apply exact locally-authored joint '+n);
}
assert.equal(f.base,1);
assert(!status.error);
// Rin remains on historical animation mapping; never inject Kairo-only local poses.
const rin=dummyFighter('rin_sable'),rinStatus={frames:0,error:null};
published.attach(THREE,rin.f,old,rinStatus,{kairoCombat:clips});
rin.f.animate(1/60);
assert(!rinStatus.error&&rinStatus.frames===1);
assert(rin.nodes.leftUpperArm.quaternion.angleTo(sample[7])>.01,
 'Rin must not inherit Kairo authored local skeleton pose');
const oldBoot=text('js/v66-game-boot.js');
assert(oldBoot.includes("get('combatAnim')==='kairo-a1'"));
assert(oldBoot.includes('SkyClashPublishedGamePack.start(window)'));
const current=text('js/v72-published-actions.js');
assert(current.includes('if(entry.localAbsolute)')&&current.includes('options.kairoCombat'));
assert(current.includes('SkyClashV100Animator?.ownsAir(this)'));
assert(!current.includes('fighter.animate = function(dt, extra)'),'No extra nested writer');
for(const protectedPath of [
 'assets/animations/kairo/selected/v164/arm/B-B-animation.pose.json',
 'assets/animations/kairo/selected/v164/ascending/B-ascend-B.pose.json',
 'assets/animations/kairo/selected/v164/descending/B-descend-B.pose.json']){
 assert(fs.statSync(path.join(ROOT,protectedPath)).size>10000);
}
console.log('PASS Batch A: 10 Kairo Pose Lab clips, contact markers and V165, 30/60/120fps, native V72 actor guard/parry/hurt/ready, Rin isolated and protected flight');
