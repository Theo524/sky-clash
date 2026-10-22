/* V71 regression: authored game motion, source SHA and real leg playback.
 * node tests/v71-permanent-game-walk.js
 */
const assert=require('assert');
const THREE=require('../js/vendor/three.min.js');
const fs=require('fs');
const path=require('path');
const M=require('../js/v71-mixamo-gameplay.js');
const root=path.join(__dirname,'..');
const asset=JSON.parse(fs.readFileSync(path.join(root,'assets/animations/gameplay/kairo-walk-v1.json'),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(root,'assets/animations/gameplay/actions-v1.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'js/v66-game-boot.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.strictEqual(registry.schema,'sky-clash.game-actions.v1');
assert.strictEqual(registry.version,1);
assert.strictEqual(registry.characters.kairo_venn.walk.asset,'assets/animations/gameplay/kairo-walk-v1.json');
assert(registry.characters.kairo_venn.walk.blendOutSeconds>0);
assert.strictEqual(asset.id,'kairo.walk');
assert.strictEqual(asset.source,'Movement/Standard/walking - Standard Movement.fbx');
assert.strictEqual(asset.source_sha256,'e9e7c3446f79f526d66ff61bb2a6e8cdaf1721dc5cb3da63d79c3d09b2979f0b');
assert.strictEqual(asset.frames,32);
assert.deepStrictEqual(asset.bones,['hips','leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot']);
assert(index.includes('js/v66-game-boot.js?v=710'),'page loads V71 boot');
assert(source.includes("await script('js/v71-mixamo-gameplay.js?v=710')"));
assert(source.includes('SkyClashV71Walk.start(window)'));
assert(M.manifest['kairo.walk'].revision===1);
assert(M.manifest['kairo.walk'].mode==='grounded-locomotion');
const motion=M.decode(THREE,asset);
const sample=()=>Array.from({length:7},()=>new THREE.Quaternion());
const before=sample(),after=sample(),loop=sample();
motion.sample(.05,before);motion.sample(.50,after);
motion.sample(.05+motion.duration,loop);
assert(before[2].angleTo(after[2])>.12,'Knee must bend during the true Mixamo walk, not remain robotic');
assert(before[5].angleTo(after[5])>.25,'Both knees should animate with distinct recorded stride phases');
for(let i=0;i<7;i++){
 assert(before[i].angleTo(loop[i])<.0001,'Loop should join precisely');
 assert(Math.abs(before[i].length()-1)<.001,'No invalid motion quaternion');
}
function fake(){
 const scene=new THREE.Group();
 const humanoid={},create=(name,parent,p)=>{
  const bone=new THREE.Bone();bone.name=name;bone.position.set(...p);
  parent.add(bone);humanoid[name]=bone;return bone;
 };
 const hips=create('hips',scene,[0,1.0,0]);
 const spine=create('spine',hips,[0,.2,0]);
 const chest=create('chest',spine,[0,.2,0]);
 create('upperChest',chest,[0,.1,0]);
 for(const side of ['left','right']){
  const x=side==='left'?.12:-.12;
  const upper=create(side+'UpperLeg',hips,[x,-.07,0]);
  const lower=create(side+'LowerLeg',upper,[0,-.43,0]);
  create(side+'Foot',lower,[0,-.42,0]);
 }
 const rig={legacyAxes:true,vrm:{scene,humanoid:{getNormalizedBoneNode:name=>humanoid[name]||null},
  update(){this.ticks=(this.ticks||0)+1;}}};
 const fighter={vel:new THREE.Vector3(),hp:100,flying:false,launched:false,
  spiked:false,punchT:0,stun:0,downT:0,dashing:false,sprinting:false,slamming:false,
  vrmRig:rig,animate(){this.procedural=(this.procedural||0)+1;
   // Baseline guard/walk animation continues to drive body/arms as before.
   humanoid.leftUpperLeg.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),.07);
   humanoid.rightUpperLeg.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-.07);
   rig.vrm.update(0);
  }};
 return {fighter,humanoid,rig,scene};
}
const status={active:'idle',frames:0,weight:0,error:null,action:registry.characters.kairo_venn.walk};
const {fighter,humanoid,rig,scene}=fake();
M.attach(THREE,fighter,motion,status);
assert(fighter.v71Walk,'Walk motion should attach to real fighter');
fighter.vel.z=3.4;
for(let i=0;i<36;i++)fighter.animate(1/60);
const kneeA=humanoid.leftLowerLeg.quaternion.clone(),rightA=humanoid.rightLowerLeg.quaternion.clone();
for(let i=0;i<12;i++)fighter.animate(1/60);
const kneeB=humanoid.leftLowerLeg.quaternion.clone();
assert(kneeA.angleTo(kneeB)>.02,'Real VRM knee should visibly bend across frames');
assert(rightA.angleTo(new THREE.Quaternion())>.05,'Other knee is animated');
assert(rig.vrm.ticks>36,'Skinned VRM must receive updated normalized bones');
assert(fighter.procedural===48,'Original gameplay animation must continue to run');
assert(fighter.v71Walk.weight>.7,'Motion should be blended in when walking');
assert(status.active==='kairo.walk');
scene.rotation.y=1.1;
fighter.animate(1/60);
for(const bone of [humanoid.leftUpperLeg,humanoid.leftLowerLeg,humanoid.leftFoot])
 assert([bone.quaternion.x,bone.quaternion.y,bone.quaternion.z,bone.quaternion.w].every(Number.isFinite));
fighter.vel.set(0,0,0);
for(let i=0;i<38;i++)fighter.animate(1/60);
assert(fighter.v71Walk.weight<.02,'Return smoothly to procedural standing pose');
assert(!status.error,'No runtime playback exception');
async function startTest(){
 const standIn={THREE,SkyClash:{Game:{heroes:{kairo_venn:fake().fighter},enemy:fake().fighter}},
   location:{search:'?walk=procedural'},fetch:async()=>{throw Error('Rollback should not fetch anything');}};
 const rollback=await M.start(standIn);
 assert.strictEqual(rollback.active,'procedural-fallback');
 const app={THREE,SkyClash:{Game:{heroes:{kairo_venn:fake().fighter},enemy:fake().fighter}},
   location:{search:''},fetch:async url=>({ok:true,json:async()=>url.includes('actions-v1')?registry:asset})};
 const boot=await M.start(app);
 assert(boot.loaded&&boot.characters===2,'Versioned action automatically ships to hero and rival');
 assert.strictEqual(boot.registryVersion,1,'Runtime must use permanent action registry');
 console.log('PASS: V71 real Mixamo source, quantized leg cycles, both knees, VRM0 root turning, blend-out, rollback and live Kairo/rival registry');
}
startTest().catch(e=>{console.error(e);process.exitCode=1});
