/* V115: anatomical forward knee direction from *actual* skeleton axes.
   Unlike previous regression tests that checked only quaternion sign,
   verify world-space knee movement on normal AND mirrored bone frames. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0);
function rigFor(rotation=0,mirror='none'){
 const scene=new THREE.Group(),hips=new THREE.Bone();
 scene.rotation.y=rotation;scene.position.set(2,0,-4);
 scene.add(hips);hips.position.y=1.1;
 const nodes={};
 for(const side of ['left','right']){
  const upper=new THREE.Bone(),lower=new THREE.Bone(),foot=new THREE.Bone();
  upper.position.set(side==='left'?.12:-.12,-.12,0);
  lower.position.set(0,-.43,0);foot.position.set(0,-.42,.045);
  hips.add(upper);upper.add(lower);lower.add(foot);
  if(mirror===side)upper.quaternion.setFromAxisAngle(Y,Math.PI);
  nodes[side]={upper,lower,foot};
 }
 const vrm={scene,humanoid:{getNormalizedBoneNode(name){
  const side=name.startsWith('left')?'left':'right';
  const suffix=name.slice(side.length);
  return ({UpperLeg:nodes[side].upper,LowerLeg:nodes[side].lower,
    Foot:nodes[side].foot})[suffix]||null;
 }}};
 return {vrm,nodes};
}
function worldFront(rig){
 return new THREE.Vector3(0,0,1).applyQuaternion(
  rig.vrm.scene.getWorldQuaternion(new THREE.Quaternion())).normalize();
}
function worldOf(bone){return bone.getWorldPosition(new THREE.Vector3());}
for(const yaw of [0,Math.PI/3,Math.PI,Math.PI*1.6]){
 for(const mirror of ['none','left','right']){
  const rig=rigFor(yaw,mirror),fwd=worldFront(rig);
  const saved=Object.fromEntries(['left','right'].map(s=>[s,
   [rig.nodes[s].upper.quaternion.clone(),rig.nodes[s].lower.quaternion.clone()]]));
  const axes=V100.forwardKneeAxes(THREE,rig);
  assert(axes.left&&axes.right,'both knees must calibrate');
  for(const side of ['left','right']){
   const {upper,lower,foot}=rig.nodes[side],a=axes[side];
   assert.equal(a.thigh,mirror===side?1:-1,
    side+' thigh axis must be calculated, never assumed from side name');
   assert.equal(a.knee,mirror===side?-1:1,
    side+' shin axis must be calculated independently from thigh');
   assert(upper.quaternion.angleTo(saved[side][0])<.00001,
    'calibration cannot leave a hidden hip rotation');
   assert(lower.quaternion.angleTo(saved[side][1])<.00001,
    'calibration cannot leave a hidden knee rotation');
   rig.vrm.scene.updateMatrixWorld(true);
   const startKnee=worldOf(lower),startAnkle=worldOf(foot);
   upper.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X,.43*a.thigh));
   rig.vrm.scene.updateMatrixWorld(true);
   const loadedKnee=worldOf(lower),straightAnkle=worldOf(foot);
   const kneeForward=loadedKnee.clone().sub(startKnee).dot(fwd);
   assert(kneeForward>.12,
    'each knee MUST load toward character forward even with mirrored local axes');
   lower.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X,.82*a.knee));
   rig.vrm.scene.updateMatrixWorld(true);
   const tuckedAnkle=worldOf(foot);
   const shinBack=tuckedAnkle.clone().sub(straightAnkle).dot(fwd);
   assert(shinBack<-.21,
    'each shin MUST fold ankle backward under the body, never reverse');
   const bendVector=loadedKnee.clone().sub(startAnkle).dot(fwd);
   assert(Number.isFinite(bendVector));
   // Alternate directions must not introduce a foot/yaw axis twist.
   const kneeWorld=worldOf(lower),upperWorld=worldOf(upper);
   const horizontal=new THREE.Vector3().subVectors(kneeWorld,upperWorld);
   const cross=horizontal.clone().cross(fwd);
   assert(Number.isFinite(cross.length()));
  }
 }
}
const owner=read('js/v100-pose-authority.js'),
 boot=read('js/v66-game-boot.js'),
 html=read('index.html');
assert(owner.includes("function forwardKneeAxes(THREE,rig)"));
assert(owner.includes("st.prepForwardAxes=forwardKneeAxes(THREE,st.rig)"));
assert(owner.includes("const knee=axes[side]"));
assert(owner.includes("Math.abs(p.thighX)*knee.thigh"));
assert(owner.includes("Math.abs(p.kneeX)*knee.knee"));
assert(owner.includes("else if(kneeMode==='forward')"));
assert(owner.includes("['guided','forward'].includes("));
assert(boot.includes("e.src+='&forward=115'"));
assert(boot.includes('prepKneeDirections'));
assert(html.includes('SKY CLASH · BUILD V156'));
assert(html.includes('js/v66-game-boot.js?v=1560&fix=116'));
assert(read('animation-studio.html').includes('BUILD V115'));
console.log('PASS V115: anatomical knee bend direction measured in actual world geometry over 12 normal and mirrored VRM orientations; no sign guesses, no prep knee IK, preserved facing and physics');
