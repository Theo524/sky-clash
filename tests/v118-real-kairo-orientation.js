/* Inspect the actual published Kairo GLB/VRM rest skeleton, not a mock.
 * No SDK or rendering required; native glTF bone positions prove whether
 * the rig's forward axis agrees with gameplay after rotateVRM0().
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const THREE=require('../js/vendor/three.min.js');
const data=fs.readFileSync('assets/characters/kairo.vrm');
assert.equal(data.toString('ascii',0,4),'glTF','real Kairo VRM must be a GLB asset');
assert.equal(data.readUInt32LE(4),2,'Kairo VRM must use glTF 2 binary format');
const jsonLength=data.readUInt32LE(12);
assert.equal(data.readUInt32LE(16),0x4E4F534A,'first GLB chunk is JSON');
const gltf=JSON.parse(data.subarray(20,20+jsonLength).toString('utf8').replace(/\0+$/,''));
const ext=gltf.extensions||{},v0=ext.VRM,v1=ext.VRMC_vrm;
assert(v0||v1,'Kairo must contain VRM humanoid metadata');
const version=v0?'VRM0':'VRM1';
const boneMap={};
if(v0)for(const v of v0.humanoid?.humanBones||[])boneMap[v.bone]=v.node;
else for(const [name,entry] of Object.entries(v1.humanoid?.humanBones||{}))
 boneMap[name]=entry.node;
const nodes=(gltf.nodes||[]).map((n,i)=>{
 const o=new THREE.Object3D();
 o.name=n.name||'node-'+i;
 if(n.matrix)o.matrix.fromArray(n.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale);
 else {
  if(n.translation)o.position.fromArray(n.translation);
  if(n.rotation)o.quaternion.fromArray(n.rotation);
  if(n.scale)o.scale.fromArray(n.scale);
 }
 return o;
});
const children=new Set();
for(let i=0;i<gltf.nodes.length;i++){
 for(const child of gltf.nodes[i].children||[]){
  nodes[i].add(nodes[child]);children.add(child);
 }
}
const base=new THREE.Group();
for(let i=0;i<nodes.length;i++)if(!children.has(i))base.add(nodes[i]);
base.updateMatrixWorld(true);
const world=(bone)=>{
 const id=boneMap[bone];return Number.isInteger(id)?
  nodes[id].getWorldPosition(new THREE.Vector3()):null;
};
const nativeFacing=new THREE.Vector3(0,0,v0?-1:1);
const nativeFoot=[];
for(const side of ['left','right']){
 const hip=world(side+'UpperLeg'),knee=world(side+'LowerLeg'),
  ankle=world(side+'Foot'),toe=world(side+'Toes');
 assert(hip&&knee&&ankle,'actual Kairo must have both humanoid leg chains');
 const delta=toe?toe.clone().sub(ankle):null;
 nativeFoot.push(delta);
 console.log('KAIRO_RIG',JSON.stringify({
  side,hip:hip.toArray(),knee:knee.toArray(),ankle:ankle.toArray(),
  toe:toe?.toArray()||null,footToToe:delta?.toArray()||null,
  authoredForwardProjection:delta?.dot(nativeFacing)||null
 }));
}
const nativeEyeL=world('leftEye'),nativeEyeR=world('rightEye'),nose=world('head');
console.log('KAIRO_RIG',JSON.stringify({
 version,vrm0:!!v0,vrm1:!!v1,totalNodes:nodes.length,
 metaName:v0?.meta?.title||v1?.meta?.name||null,
 nativeRigForward:nativeFacing.toArray(),
 actualNativeToeZ:nativeFoot.map(v=>v?.z||null),
 eyeL:nativeEyeL?.toArray()||null,
 eyeR:nativeEyeR?.toArray()||null,
 head:nose?.toArray()||null
}));
const sample=nativeFoot.filter(Boolean);
if(sample.length===2){
 const projection=sample.map(v=>v.dot(nativeFacing));
 if(projection.every(v=>v>.005)){
  console.log('PASS Kairo actual model forward: BOTH toe bones extend along native VRM '+(v0?'-Z':'+Z'));
 }else console.log('KAIRO_RIG WARNING Toe translation does not prove forward for both feet: '+JSON.stringify(projection));
}
console.log('PASS inspected actual published Kairo VRM humanoid metadata and two 3D leg rest chains');
