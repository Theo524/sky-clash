/* V68: retarget real humanoid bend directions despite different bone rolls.
 * Run: node tests/v68-humanoid-retarget.js
 */
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const THREE=require('../js/vendor/three.min.js');
const Motion=require('../js/v68-humanoid-retarget.js');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const EPS=.0001;
function b(name,parent,xyz,roll=0){
 const n=new THREE.Bone();n.name=name;n.position.set(...xyz);
 n.rotation.x=roll;(parent||new THREE.Group()).add(n);return n;
}
// Mixamo source: +Z facing; lower-arm bones can have unexpected local rolls.
const sourceRoot=new THREE.Group(),hip=b('hips',sourceRoot,[0,0,0]),spine=b('spine',hip,[0,.26,0]);
const src={hips:hip,spine,
 leftshoulder:b('leftshoulder',spine,[+.24,.36,0],Math.PI/3),
 rightshoulder:b('rightshoulder',spine,[-.24,.36,0],-Math.PI/3)};
src.leftarm=b('leftarm',src.leftshoulder,[+.13,0,0],.18);
src.leftforearm=b('leftforearm',src.leftarm,[+.34,0,0],-.4);
src.lefthand=b('lefthand',src.leftforearm,[+.28,0,0],.4);
src.rightarm=b('rightarm',src.rightshoulder,[-.13,0,0],-.16);
src.rightforearm=b('rightforearm',src.rightarm,[-.34,0,0],.23);
src.righthand=b('righthand',src.rightforearm,[-.28,0,0],-.15);
sourceRoot.updateMatrixWorld(true);
const keys=Object.keys(src),rig={bones:new Map(Object.entries(src)),
 restWorld:new Map(),restPoints:new Map()};
for(const [key,node] of Object.entries(src)){
 rig.restWorld.set(key,node.getWorldQuaternion(new THREE.Quaternion()));
 rig.restPoints.set(key,node.getWorldPosition(new THREE.Vector3()));
}
// VRM0 raw rests facing -Z before the library's corrective 180° yaw,
// and its native bone quaternions are NOT the Mixamo ones.
const targetRoot=new THREE.Group();targetRoot.rotation.y=Math.PI;
const tHip=b('hips',targetRoot,[0,0,0]),tSpine=b('spine',tHip,[0,.25,0]);
const tgt={hips:tHip,spine:tSpine,
 leftshoulder:b('leftshoulder',tSpine,[-.22,.33,0]),
 rightshoulder:b('rightshoulder',tSpine,[+.22,.33,0])};
tgt.leftarm=b('leftarm',tgt.leftshoulder,[-.14,0,0]);
tgt.leftforearm=b('leftforearm',tgt.leftarm,[-.27,0,0]);
tgt.lefthand=b('lefthand',tgt.leftforearm,[-.23,0,0]);
tgt.rightarm=b('rightarm',tgt.rightshoulder,[+.14,0,0]);
tgt.rightforearm=b('rightforearm',tgt.rightarm,[+.27,0,0]);
tgt.righthand=b('righthand',tgt.rightforearm,[+.23,0,0]);
targetRoot.updateMatrixWorld(true);
const rest=new Map();
for(const [key,node] of Object.entries(tgt)){
 rest.set(key,{node,local:node.quaternion.clone(),world:node.getWorldQuaternion(new THREE.Quaternion()),
  position:node.getWorldPosition(new THREE.Vector3())});
}
const driver=Motion.create(THREE),mapping=keys.map(k=>[k,k]);
const facing=driver.faceCorrection(rig.restPoints,rest);
assert(facing.angleTo(new THREE.Quaternion())<EPS,'shoulder anatomical forward must not be inverted by bone roll');
// At rest all target joints stay at their bind pose, even if source shoulder
// bones are rolled 60 degrees.
let report=driver.sample(rig,rest,mapping);
assert(report.applied>=8);
for(const rec of rest.values())assert(rec.local.angleTo(rec.node.quaternion)<EPS,'bind pose must remain stable at time 0');
// Play source punches, bending shoulders/elbows in source local coordinates.
src.leftarm.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-.65));
src.leftforearm.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-.85));
src.rightarm.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),+.45));
sourceRoot.updateMatrixWorld(true);
report=driver.sample(rig,rest,mapping);
assert(report.applied>=8,'upper arms and elbows must be driven, not skipped');
for(const key of ['leftarm','leftforearm','rightarm']){
 const bSrc=src[key],bDst=tgt[key],rSrc=rig.restWorld.get(key),rDst=rest.get(key).world;
 const delta=bSrc.getWorldQuaternion(new THREE.Quaternion()).multiply(rSrc.clone().invert());
 const expected=delta.multiply(rDst);
 const actual=bDst.getWorldQuaternion(new THREE.Quaternion());
 assert(actual.angleTo(expected)<EPS,key+' must match FBX world movement, without mirrored elbow bend');
}
const first=tgt.leftforearm.quaternion.clone();
driver.sample(rig,rest,mapping);
assert(first.angleTo(tgt.leftforearm.quaternion)<EPS,'repeated animation frames must not accumulate rotation drift');
src.leftarm.quaternion.copy(rig.restWorld.get('leftarm')); // not meaningful because parent differs; restore source manually below
src.leftarm.rotation.x=.18;src.leftarm.rotation.y=0;src.leftarm.rotation.z=0;
src.leftforearm.rotation.set(-.4,0,0);src.rightarm.rotation.set(-.16,0,0);
sourceRoot.updateMatrixWorld(true);
driver.sample(rig,rest,mapping);
for(const rec of rest.values())assert(rec.local.angleTo(rec.node.quaternion)<EPS,'returning to original FBX pose must restore VRM bind pose');
const studio=read('js/animation-studio.js'),preview=read('js/character-motion-preview.js'),page=read('animation-studio.html'),game=read('index.html');
assert(studio.includes('restPoints'),'source FBX must preserve shoulder positions');
assert(preview.includes('SkyClashHumanoidRetarget?.create(T)'), 'VRM preview must use new solver');
assert(page.includes('js/v68-humanoid-retarget.js?v=680'),'solver must load before preview');
for(const html of [page,game])assert(!/installPicker|Import VRM/.test(html),'remove VRM import controls');
console.log('PASS: V68 source/target T-poses, foreign bone roll, mirrored VRM0 root, elbow drive, deterministic frame seek and no VRM importer');
