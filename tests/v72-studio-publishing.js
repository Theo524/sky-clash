/* V72: live Mixamo walk arms and authored Studio game-pack regressions. */
const assert=require('assert'),fs=require('fs'),path=require('path');
const THREE=require('../js/vendor/three.min.js');
const arm=require('../js/v72-walk-arms.js');
const writer=require('../js/v72-studio-game-export.js');
const published=require('../js/v72-published-actions.js');
const ROOT=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const data=JSON.parse(read('assets/animations/gameplay/kairo-walk-arms-v1.json'));
assert.strictEqual(data.schema,'sky-clash.motion.v1');
assert.strictEqual(data.id,'kairo.walk-arms');
assert.strictEqual(data.source_sha256,'e9e7c3446f79f526d66ff61bb2a6e8cdaf1721dc5cb3da63d79c3d09b2979f0b');
const walkArms=arm.decode(THREE,data),q=()=>Array.from({length:8},()=>new THREE.Quaternion());
let first=q(),second=q();walkArms.sample(.1,first);walkArms.sample(.6,second);
assert(first[2].angleTo(second[2])>.12,'Real Mixamo elbow has recorded movement');
assert(first[6].angleTo(second[6])>.12,'Both elbows move during walking');
// A simulated normalized VRM humanoid should follow sampled bones without
// affecting gameplay movement or hijacking attacks.
function fighter(){
 const scene=new THREE.Group(),map={};
 const b=(name,parent,x,y,z)=>{const n=new THREE.Bone();n.name=name;n.position.set(x,y,z);parent.add(n);map[name]=n;return n;};
 const hip=b('hips',scene,0,1,0),spine=b('spine',hip,0,.13,0),
  chest=b('chest',spine,0,.15,0),upperChest=b('upperChest',chest,0,.13,0);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const sh=b(side+'Shoulder',upperChest,.18*sign,.01,0);
  const up=b(side+'UpperArm',sh,.12*sign,-.04,0);
  const low=b(side+'LowerArm',up,.27*sign,0,0);
  b(side+'Hand',low,.23*sign,0,0);
 }
 const rig={legacyAxes:true,vrm:{scene,humanoid:{getNormalizedBoneNode:n=>map[n]||null},update(){this.ticks=(this.ticks||0)+1;}}};
 const f={vrmRig:rig,v71Walk:{clock:0,weight:1},vel:new THREE.Vector3(0,0,3.4),
  hp:100,punchT:0,stun:0,flying:false,launched:false,spiked:false,
  dashing:false,sprinting:false,animate(){this.base=(this.base||0)+1;
   for(const n of ['leftUpperArm','rightUpperArm'])map[n].rotation.set(0,0,.035);
  }};
 return {f,map,rig};
}
const {f,map,rig}=fighter(),status={active:'none'};
assert(arm.attach(THREE,f,walkArms,status));
f.v71Walk.clock=.10;f.animate(1/60);
const a=map.leftLowerArm.quaternion.clone(),ra=map.rightLowerArm.quaternion.clone();
f.v71Walk.clock=.60;f.animate(1/60);
assert(a.angleTo(map.leftLowerArm.quaternion)>.035,'Native left elbow keeps a visible recorded Mixamo rhythm');
assert(ra.angleTo(map.rightLowerArm.quaternion)>.035,'Native right elbow keeps a visible recorded Mixamo rhythm');
assert(rig.vrm.ticks===2,'Kairo skinned mesh updated twice');
assert(f.base===2,'Original game animator still updates');
const oldCount=status.frames;
f.punchT=.5;f.animate(1/60);
assert.strictEqual(status.frames,oldCount,'Recorded walk arms must yield immediately to attacks');
assert(!status.error);

// Verify the Studio EXPORT contains actual baked quaternion tracks, not just
// clip names and localStorage assignments.
const root=new THREE.Group(),hips=new THREE.Bone();hips.name='Hips';root.add(hips);
const lSh=new THREE.Bone();lSh.name='LeftShoulder';lSh.position.x=.25;hips.add(lSh);
const lArm=new THREE.Bone();lArm.name='LeftArm';lArm.position.x=.16;lSh.add(lArm);
const rSh=new THREE.Bone();rSh.name='RightShoulder';rSh.position.x=-.25;hips.add(rSh);
const rArm=new THREE.Bone();rArm.name='RightArm';rArm.position.x=-.16;rSh.add(rArm);
const track=new THREE.QuaternionKeyframeTrack('LeftArm.quaternion',[0,1],
 [0,0,0,1,0,Math.sin(.36),0,Math.cos(.36)]);
root.animations=[new THREE.AnimationClip('test walk',1,[track])];
const exported=writer.bake(THREE,root,{character:'kairo',slot:'walk',
 sourceArchive:'Movement.zip',sourceFile:'walking.fbx',speed:1.2,yaw:15});
assert.strictEqual(exported.frames,31);
assert.strictEqual(exported.sourceFile,'walking.fbx');
assert.strictEqual(exported.slot,'walk');
assert.strictEqual(exported.bones.length,published.BONES.length);
assert(exported.data.length>1000,'Packed JSON must contain real keyframes');
const pack=writer.pack([exported]);
assert.strictEqual(pack.schema,'sky-clash.studio-gamepack.v1');
const runtime=published.decode(THREE,exported);
const sample=()=>Array.from({length:runtime.bones.length},()=>new THREE.Quaternion());
let start=sample(),end=sample();runtime.sample(0,start,false);runtime.sample(1,end,false);
const idx=runtime.bones.indexOf('leftUpperArm');
assert(start[idx].angleTo(end[idx])>.5,'Actual left arm movement survived encode/decode');
assert(published.choose({hp:100,vel:new THREE.Vector3(0,0,4),punchT:0}, {walk:runtime})==='walk');
assert(published.choose({hp:100,vel:new THREE.Vector3(0,0,4),punchT:.4,attackKind:'kick'},{walk:runtime,kick:runtime})==='kick');
const boot=read('js/v66-game-boot.js'),html=read('animation-studio.html');
assert(boot.includes('SkyClashV76UpperBody.start(window)'),
 'Default game must use one recorded upper-body controller for idle and walk');
assert(boot.includes("upperMode==='legacy'")&&boot.includes('SkyClashV72Arms.start(window)'),
 'Legacy walk-only arm path remains a manual rollback');
assert(boot.includes('SkyClashPublishedGamePack.start(window)'));
assert(html.includes('id="exportGamePack"'));
assert(html.includes('js/v72-studio-game-export.js?v=720'));
assert(read('js/animation-studio.js').includes('GameExporter.bake(THREE,fbx,'));
assert(read('js/v72-published-actions.js').includes('assets/animations/gameplay/studio-actions-v1.json'));
console.log('PASS: V72 natural Mixamo elbows/wrists, attack-priority, real Studio FBX keyframe export and published-game decode');
