/* A private SDK-native clip enters the existing V72/V81 path only when
 * explicitly registered. Exercise the actual samplers, wrapper ordering,
 * interrupts and legacy fallback against a Three.js humanoid hierarchy.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const studio=require('../js/v72-published-actions.js');
const transitions=require('../js/v81-pose-transitions.js');
const manifest=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json');
const pack={
 schema:'sky-clash.native-combat-preview.v1',status:'UNAPPROVED_PRIVATE_PREVIEW',
 characterId:'kairo_venn',modelSha256:manifest.modelSha256,
 rigSignature:manifest.rigSignature,bones:[...studio.BONES],
 clipId:'original-jab',durationSeconds:.55,impactSeconds:.24,
 frames:[0,.24,.55].map((time,index)=>({time,
  hipsPosition:index===1?[.04,.44,.15]:[.02,.45,-.01],
  quaternions:studio.BONES.map((name,i)=>new THREE.Quaternion()
   .setFromAxisAngle(new THREE.Vector3(0,1,0),index===1?(i+1)*.007:0).toArray())}))
};
const clone=x=>JSON.parse(JSON.stringify(x));
const status={};
studio.registerNativeCombatPreview(THREE,status,pack);
const sample=()=>studio.BONES.map(()=>new THREE.Quaternion());
const contact=sample();status.nativeCombatPreview.sample(.24,contact);
assert(contact.every((q,i)=>q.angleTo(new THREE.Quaternion(...pack.frames[1].quaternions[i]))<1e-7));
const mid=sample();status.nativeCombatPreview.sample(.12,mid);
assert(mid.every((q,i)=>Math.abs(q.angleTo(new THREE.Quaternion())-(i+1)*.0035)<1e-7));
assert(status.nativeCombatPreview.sampleHips(.12,new THREE.Vector3())
 .distanceTo(new THREE.Vector3(.03,.445,.07))<1e-12,
 'The local pelvis curve must use the same interpolation clock as the bones');
for(const time of [0,.55])assert.deepEqual(status.nativeCombatPreview
 .sampleHips(time,new THREE.Vector3()).toArray(),pack.frames[0].hipsPosition);
const negative=[
 p=>p.schema='mixamo-world-delta',p=>p.status='APPROVED',
 p=>p.characterId='rin_sable',p=>p.modelSha256='wrong-model',
 p=>p.rigSignature='wrong-rest-basis',p=>p.bones.reverse(),
 p=>p.durationSeconds=.54,p=>p.impactSeconds=.25,p=>p.clipId='kick',
 p=>p.frames[1].hipsPosition=[0,1],p=>p.frames[1].hipsPosition=[0,Infinity,0],
 p=>p.frames[1].hipsPosition=[100,0,0],p=>delete p.frames[1].hipsPosition,
 p=>p.frames[2].hipsPosition=[.02,.5,-.01],
 p=>p.frames[1].time=0,p=>p.frames[0].time=.01,
 p=>p.frames[2].time=.54,p=>p.frames[1].quaternions.pop(),
 p=>p.frames[1].quaternions[0]=[0,0,0,2],
 p=>p.frames[1].quaternions[0]=[0,NaN,0,1],
 p=>p.frames[2].quaternions[0]=[0,1,0,0]
];
for(const change of negative){
 const bad=clone(pack);change(bad);
 const previous=status.nativeCombatPreview;
 assert.throws(()=>studio.registerNativeCombatPreview(THREE,status,bad));
 assert.equal(status.nativeCombatPreview,previous,'Reject before replacing the valid preview');
}
// Editing the verifier's source arrays after registration cannot mutate an
// animation that the game is currently sampling.
const mutable=clone(pack),detached={};
studio.registerNativeCombatPreview(THREE,detached,mutable);
mutable.frames[1].quaternions[0]=[0,1,0,0];
mutable.frames[1].hipsPosition[0]=1;
assert(detached.nativeCombatPreview.sample(.24,sample())[0].angleTo(contact[0])<1e-7);
assert.deepEqual(detached.nativeCombatPreview.sampleHips(.24,new THREE.Vector3()).toArray(),
 pack.frames[1].hipsPosition);

const actions={};
for(const file of ['studio-actions-v1.json','v81-recorded-actions.json','v87-recorded-combat.json']){
 const data=JSON.parse(fs.readFileSync(require.resolve('../assets/animations/gameplay/'+file),'utf8'));
 for(const motion of data.motions)if(motion.character==='kairo')
  actions[motion.slot]=studio.decode(THREE,motion);
}
function fighter(overrides={},preview=false){
 const scene=new THREE.Object3D(),nodes={};
 for(let i=0;i<studio.BONES.length;i++){
  const name=studio.BONES[i],node=nodes[name]=new THREE.Object3D();
  node.name=name;node.position.y=.1;
  if(name==='leftUpperArm')node.position.x=.2;
  if(name==='rightUpperArm')node.position.x=-.2;
  (nodes[manifest.parents[i]]||scene).add(node);
 }
 const f=Object.assign({characterId:'kairo_venn',hp:100,t:0,
  vel:new THREE.Vector3(),moveIntent:new THREE.Vector3(),
  punchT:.3,attackElapsed:.24,attackTotal:.55,attackSerial:1,punchSide:1,
  attackKind:'punch',attackVariant:'',sprinting:false,skidT:0,jumping:false,
  flying:false,attackAir:false,launched:false,spiked:false,blockHeld:false,
  blocking:false,downT:0,stun:0,superHitT:0,slamming:false,
  vrmRig:{vrm:{scene,humanoid:{getNormalizedBoneNode:name=>nodes[name]},update(){}}},
  animate(){
   for(const node of Object.values(nodes))node.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),.08);
   nodes.hips.position.set(0,.1,0); // actual base writer also supplies local hip bob
  }
 },overrides);
 const local={};if(preview)studio.registerNativeCombatPreview(THREE,local,pack);
 studio.attach(THREE,f,actions,local);
 transitions.attach(THREE,f,{});
 return {f,nodes,local};
}
const active=fighter({},true);active.f.animate(1/60);
assert.equal(active.f.v72StudioPack.nativePreviewActive,true);
assert(Math.abs(active.f.v72StudioPack.nativePreviewTime-.24)<1e-12);
assert.equal(active.f.v81PoseTransitions.blend,1,'No second full-body entry blend');
assert(active.nodes.hips.position.distanceTo(new THREE.Vector3(...pack.frames[1].hipsPosition))<1e-12,
 'The authored local pelvis placement must replace procedural bob during the clip');
for(let i=0;i<studio.BONES.length;i++)
 assert(active.nodes[studio.BONES[i]].quaternion.angleTo(contact[i])<1e-7,
  'Native full-body pose must reach V81, including support legs: '+studio.BONES[i]);
const fast=fighter({attackTotal:.44,attackElapsed:.192},true);fast.f.animate(1/60);
assert(Math.abs(fast.f.v72StudioPack.nativePreviewTime-.24)<1e-12,
 'V165 tempo scales the contact and recovery together');
for(const scenario of [
 {punchT:0},{characterId:'rin_sable'},{attackAir:true},{flying:true},
 {jumping:true},{launched:true},{spiked:true},{stun:.2},{hp:0},
 {downT:.3},{superHitT:.2},{slamming:true},{blockHeld:true},
 {blocking:true},{punchSide:0},{attackKind:'hook'},{attackKind:'kick'}
]){
 const expected=fighter(scenario),actual=fighter(scenario,true);
 expected.f.animate(1/60);actual.f.animate(1/60);
 assert.equal(actual.f.v72StudioPack.nativePreviewActive,false);
 for(const name of studio.BONES)
  assert(expected.nodes[name].quaternion.angleTo(actual.nodes[name].quaternion)<1e-7,
   'Unaffected state diverged: '+JSON.stringify(scenario)+' / '+name);
 assert.deepEqual(actual.nodes.hips.position.toArray(),expected.nodes.hips.position.toArray(),
  'Native local pelvis placement leaked into an unrelated state');
}
// An actual interrupt relinquishes ownership on the very next animation
// update; recovery uses the existing V81 transition rather than lingering.
active.f.stun=.3;active.f.animate(1/60);
assert.equal(active.f.v72StudioPack.nativePreviewActive,false);
assert.equal(active.f.v72StudioPack.nativePreviewTime,null);
assert.deepEqual(active.nodes.hips.position.toArray(),[0,.1,0],
 'The base writer restores its local pelvis placement immediately on interruption');
assert.equal(active.f.v81PoseTransitions.mode,'attack'); // legacy resolver still prioritizes live punchT
active.f.stun=0;active.f.animate(1/60);
assert.equal(active.f.v72StudioPack.nativePreviewActive,false,
 'An interrupted swing must not resume when stun ends before punchT');
active.f.attackSerial++;active.f.animate(1/60);
assert.equal(active.f.v72StudioPack.nativePreviewActive,true,
 'A genuinely new attack serial may play the native jab');
active.f.stun=0;active.f.punchT=0;active.f.animate(1/60);
assert.equal(active.f.v81PoseTransitions.mode,'idle');
assert(active.f.v81PoseTransitions.blend<1,'Existing idle exit blend remains active');
console.log('PASS private native preview: validated transport, 20-bone V72→V81 application, scaled contact, interrupts and unchanged legacy states');
