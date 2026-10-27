/* Native Storm Fist contract and the real V72 -> V81 hierarchy: transport
 * must be atomic, original jab exact, canonical clocks and interrupts safe. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const studio=require('../js/v72-published-actions.js');
const transitions=require('../js/v81-pose-transitions.js');
const manifest=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json');
const jab=require('../assets/animations/kairo/original-jab-playtest.v1.json');
const timings={'original-cross':[.55,.24],'original-hook':[.68,.33],
 'original-overhand':[.68,.33],'rising-kick':[.87,.41],'air-strike':[.87,.41],
 'sky-uppercut':[.57,.29],'sky-kick':[.63,.30],'falling-fist':[.81,.53],
 guard:[.60,0],parry:[.30,.075],'hit-light':[.34,.055],'hit-heavy':[.55,.055],
 'hit-left':[.38,.055],'hit-right':[.38,.055]};
const clone=v=>JSON.parse(JSON.stringify(v));
function fixture(){return {schema:'sky-clash.native-combat-set.v1',status:'EXPERIMENTAL_PLAYTEST',
 characterId:'kairo_venn',modelSha256:manifest.modelSha256,rigSignature:manifest.rigSignature,
 bones:studio.BONES,clips:[jab,...Object.entries(timings).map(([clipId,[durationSeconds,impactSeconds]])=>({
  clipId,durationSeconds,impactSeconds,loop:clipId==='guard',frames:jab.frames.map(f=>({...clone(f),
   time:f.time===.55?durationSeconds:f.time*durationSeconds/.55}))}))]};}
const file=require('node:path').resolve(__dirname,'../assets/animations/kairo/storm-fist.v1.json');
const pack=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):fixture();
const status={};studio.registerNativeCombatSet(THREE,status,pack);
assert.deepEqual(pack.clips.find(c=>c.clipId==='original-jab'),jab,'Published jab preserved exactly');
for(const [id,[duration,impact]] of Object.entries(timings)){
 const clip=status.nativeCombatSet.clips[id];assert.equal(clip.durationSeconds,duration,id);
 assert.equal(clip.impactSeconds,impact,id);
}
for(const corrupt of [p=>p.modelSha256='wrong',p=>p.clips.pop(),p=>p.clips.push(p.clips[0]),
 p=>p.clips[1].frames[1].quaternions[0]=[0,0,0,2],p=>p.clips[1].frames[1].time=-1]){
 const p=clone(pack),previous=status.nativeCombatSet;corrupt(p);
 assert.throws(()=>studio.registerNativeCombatSet(THREE,status,p));assert.equal(status.nativeCombatSet,previous);
}
const actions={};for(const entry of require('../assets/animations/gameplay/studio-actions-v1.json').motions)
 if(entry.character==='kairo')actions[entry.slot]=studio.decode(THREE,entry);
function fighter(characterId='kairo_venn'){
 const scene=new THREE.Object3D(),nodes={};
 for(let i=0;i<studio.BONES.length;i++){
  const node=nodes[studio.BONES[i]]=new THREE.Object3D();node.position.y=.1;
  if(studio.BONES[i]==='leftUpperArm')node.position.x=.2;
  if(studio.BONES[i]==='rightUpperArm')node.position.x=-.2;
  (nodes[manifest.parents[i]]||scene).add(node);
 }
 const f={characterId,hp:100,t:0,vel:new THREE.Vector3(),moveIntent:new THREE.Vector3(),
  punchT:0,attackElapsed:0,attackTotal:.55,attackSerial:0,punchSide:1,attackKind:'punch',
  stun:0,downT:0,superHitT:0,jumping:false,flying:false,attackAir:false,blocking:false,blockHeld:false,
  vrmRig:{vrm:{scene,humanoid:{getNormalizedBoneNode:name=>nodes[name]},update(){}}},
  animate(){for(const node of Object.values(nodes))node.quaternion.identity();nodes.hips.position.set(0,.1,0);}};
 studio.attach(THREE,f,actions,status);transitions.attach(THREE,f,{});return {f,nodes};
}
const cases=[['original-jab','punch',1,false],['original-cross','punch',0,false],
 ['original-hook','hook',1,false],['original-overhand','hook',1,false,'overhand'],
 ['rising-kick','kick',0,false],['air-strike','airStrike',0,true],
 ['sky-uppercut','skyUppercut',0,true],['sky-kick','skyKick',0,true],['falling-fist','fallingFist',0,true]];
assert.equal(studio.nativeAttackId({attackKind:'kick',attackAir:false,
 moveIntent:{x:1,z:0},forward:()=>({x:0,z:1})}),'roundhouse');
assert.equal(studio.nativeAttackId({attackKind:'kick',attackAir:false,
 moveIntent:{x:0,z:1},forward:()=>({x:0,z:1})}),'side-kick');
assert.equal(studio.nativeAttackId({attackKind:'kick',attackAir:true,
 moveIntent:{x:0,z:1},forward:()=>({x:0,z:1})}),'air-strike');
for(const fps of [30,60,120]){
 const {f}=fighter();f.animate(1/fps);
 for(const [id,kind,side,air,variant] of cases){
  const clip=status.nativeCombatSet.clips[id];
  Object.assign(f,{punchT:clip.durationSeconds,attackTotal:clip.durationSeconds*.8,
   attackElapsed:clip.impactSeconds*.8,attackKind:kind,punchSide:side,attackAir:air,
   flying:air,attackVariant:variant,attackSerial:f.attackSerial+1});
  f.animate(1/fps);assert.equal(f.v72StudioPack.nativeClipId,id);
  assert(Math.abs(f.v72StudioPack.nativePreviewTime-clip.impactSeconds)<1e-10,'Scaled canonical contact '+id);
  assert.equal(f.v81PoseTransitions.blend,1,'No competing full-body fade '+id);
 }
 f.stun=.2;f.nativeCombatReaction={clipId:'hit-heavy',at:f.t,serial:1};f.animate(1/fps);
 assert.equal(f.v72StudioPack.nativeClipId,'hit-heavy');
 f.stun=0;f.animate(1/fps);assert.equal(f.v72StudioPack.nativePreviewActive,false,'Interrupted swing cannot resume');
 Object.assign(f,{punchT:0,attackAir:false,flying:false,blockHeld:true,blocking:true,blockT:.2});f.animate(1/fps);
 assert.equal(f.v72StudioPack.nativeClipId,'guard');
 f.nativeCombatParry={at:f.t,serial:1};f.animate(1/fps);assert.equal(f.v72StudioPack.nativeClipId,'parry');
 f.blockHeld=f.blocking=false;f.animate(1/fps);assert.equal(f.v72StudioPack.nativePreviewActive,false);
 const rin=fighter('rin_sable').f;Object.assign(rin,{punchT:.55,attackElapsed:.24});rin.animate(1/fps);
 assert.equal(rin.v72StudioPack.nativePreviewActive,false,'Kairo clips must not apply to Rin');
}
async function testLoader(){
 const base=require('../assets/animations/gameplay/studio-actions-v1.json');
 async function load(search,fail=false){
  const requests=[];
  const context={THREE,location:{search},console:{warn(){}},
   SkyClash:{Game:{heroes:{kairo_venn:{animate(){}}}}},
   fetch:async url=>{
    requests.push(url);
    if(url.startsWith('assets/animations/kairo/storm-fist.v1.json'))
     return {ok:!fail,status:fail?404:200,json:async()=>clone(pack)};
    if(url==='assets/animations/gameplay/studio-actions-v1.json')return {ok:true,json:async()=>base};
    return {ok:false,status:404};
   }};
  return {status:await studio.start(context),requests};
 }
 const ready=await load('?combatAnim=storm-fist-v1');
 assert.equal(ready.status.nativePlaytest.state,'ready');assert(ready.status.nativeCombatSet);
 assert(!ready.requests.some(url=>url.includes('original-jab-playtest')));
 const fallback=await load('?combatAnim=storm-fist-v1',true);
 assert(fallback.status.ready);assert.equal(fallback.status.nativePlaytest.state,'fallback');
 assert(!fallback.status.nativeCombatSet);
 const normal=await load('');assert(!normal.requests.some(url=>url.includes('storm-fist')));
}
testLoader().then(()=>console.log('PASS native Storm Fist set: atomic rig validation, preserved jab, canonical contacts, full V72/V81 sequence, guard/parry/reactions, cancellation and Rin isolation at 30/60/120Hz')).catch(e=>{console.error(e);process.exitCode=1;});
