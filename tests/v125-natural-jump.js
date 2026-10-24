/* V125: verify actual world shoe-to-toe headings and knee alignment.
 * Original per-foot yaw must survive first PREP frame, excessive native
 * angles should ease inward without ankle teleport or ankle twist.
 */
'use strict';
const assert=require('node:assert/strict');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const rad=a=>a*Math.PI/180;
const up=new THREE.Vector3(0,1,0);
for(const yaw of [0,.57,Math.PI,5.2]){
 const root=new THREE.Group();root.rotation.y=yaw;
 const scene=new THREE.Group();scene.rotation.y=Math.PI;root.add(scene);
 const pelvis=new THREE.Bone();pelvis.position.y=1;scene.add(pelvis);
 const bones={};
 for(const side of ['left','right']){
  const thigh=new THREE.Bone();thigh.position.set(side==='left'?.12:-.12,-.10,0);pelvis.add(thigh);
  const knee=new THREE.Bone();knee.position.y=-.48;thigh.add(knee);
  const foot=new THREE.Bone();foot.position.set(0,-.43,.07);knee.add(foot);
  const toe=new THREE.Bone();toe.position.set(0,-.09,-.16);foot.add(toe);
  bones[side+'Foot']=foot;bones[side+'Toes']=toe;
  // Both original shoes aim to the SAME side, as in the actual
  // V123 deterministic WebGL idle film (-45 / -72 degrees).
  foot.quaternion.setFromAxisAngle(up,rad(side==='left'?45:72));
 }
 const rig={f:{model:{root}},vrm:{scene,humanoid:{
  getNormalizedBoneNode:name=>bones[name]||null
 }}};
 scene.updateMatrixWorld(true);
 const fwd=V100.realKairoForward(THREE,rig,{});
 const anchors=V100.v124IdleFootAnchors(THREE,rig);
 assert.equal(anchors.length,2);
 const positions=Object.fromEntries(anchors.map(a=>[a.side,a.point.clone()]));
 let previous={};
 function heading(side){
  scene.updateMatrixWorld(true);
  const foot=bones[side+'Foot'].getWorldPosition(new THREE.Vector3());
  const toe=bones[side+'Toes'].getWorldPosition(new THREE.Vector3());
  const dir=toe.sub(foot).setY(0).normalize();
  return Math.atan2(new THREE.Vector3().crossVectors(fwd,dir).dot(up),
   Math.max(-1,Math.min(1,fwd.dot(dir))));
 }
 const original=Object.fromEntries(['left','right'].map(side=>[side,heading(side)]));
 for(const frame of [0,1,2,3,4,5,6,7,8,9,10,11,12]){
  const elapsed=.215*frame/12;
  const target=V100.v125CoordinatedStance(THREE,fwd,anchors,elapsed,.215);
  for(const side of ['left','right']){
   assert(target.feet[side]&&target.knees[side]);
   const kneeYaw=Math.atan2(new THREE.Vector3()
    .crossVectors(fwd,target.knees[side]).dot(up),fwd.dot(target.knees[side]));
   assert(Math.abs(kneeYaw)<=.491,'no unnatural side-collapsed knee plane');
  }
  V100.v122VisibleToeHeading(THREE,rig,fwd,.20,{},anchors,target.feet);
  for(const side of ['left','right']){
   const current=heading(side);
   if(frame===0)assert(Math.abs(current-original[side])<.0001,
    'first crouch frame must retain real idle foot heading');
   if(previous[side]!==undefined)
    assert(Math.abs(current-previous[side])<rad(10),
     'standing foot must turn gradually, not twist instantly');
   assert(bones[side+'Foot'].getWorldPosition(new THREE.Vector3())
    .distanceTo(positions[side])<.000001,'planted ankle must not teleport');
   previous[side]=current;
  }
 }
 for(const side of ['left','right']){
  assert(Math.abs(heading(side))<rad(41),'native extreme heading was not moderated');
  assert(Math.abs(heading(side))<Math.abs(original[side])-rad(8),
   'crouch must improve the native foot orientation');
 }
}
console.log('PASS V125 mirrored VRM0: 45/72-degree native shoes ease into grounded knee-matched stance without shoe teleport');
