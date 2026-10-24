/* V122: explicit VISIBLE toe heading, not merely foot quaternion delta.
 * Real-world VRM0 facing is PI-rotated, feet are mirrored, gameplay yaw
 * varies. Validate actual foot->toe vector in ROOT forward coordinates.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const deg=x=>x*180/Math.PI;
const world=n=>n.getWorldPosition(new THREE.Vector3());
let cases=0;
for(const yaw of [0,.7,Math.PI,5.11]){
 for(const fps of [30,60,120]){
  const root=new THREE.Group();root.rotation.y=yaw;
  const scene=new THREE.Group();scene.rotation.y=Math.PI;root.add(scene);
  const hips=new THREE.Bone();hips.position.y=1;scene.add(hips);
  const bones={};
  for(const side of ['left','right']){
   const thigh=new THREE.Bone();hips.add(thigh);
   thigh.position.set(side==='left'?.11:-.11,-.15,0);
   const shin=new THREE.Bone();thigh.add(shin);
   shin.position.set(0,-.4,-.05);
   const foot=new THREE.Bone();shin.add(foot);foot.position.set(0,-.43,-.01);
   const toe=new THREE.Bone();foot.add(toe);toe.position.set(0,-.09,-.16);
   bones[side]={foot,toe};
  }
  const rig={f:{model:{root}},vrm:{scene,humanoid:{
   getNormalizedBoneNode(n){
    const side=n.startsWith('left')?'left':'right';
    return bones[side]?.[n.slice(side.length).toLowerCase()]||null;
   }
  }}};
  const forward=V100.realKairoForward(THREE,rig,{});
  const right=new THREE.Vector3(1,0,0).applyQuaternion(
   root.getWorldQuaternion(new THREE.Quaternion()));
  const base={};
  for(const side of ['left','right'])
   base[side]=bones[side].foot.quaternion.clone();
  const actualOut=(side)=>{
   scene.updateMatrixWorld(true);
   const {foot,toe}=bones[side];
   const direction=world(toe).sub(world(foot)).setY(0).normalize();
   return deg(Math.atan2(direction.dot(right),direction.dot(forward)))*
    (side==='left'?-1:1);
  };
  const neutral=actualOut('left');
  assert(Math.abs(neutral)<.1,'rig must start facing physically forward');
  let prev=0;
  for(let frame=0;frame<=Math.ceil(.215*fps);frame++){
   const age=Math.min(.215,frame/fps);
   const w=V100.v121LaunchStance(age,.215).ready;
   for(const side of ['left','right'])
    bones[side].foot.quaternion.copy(base[side]);
   const status={};
   if(w>0)V100.v122VisibleToeHeading(THREE,rig,forward,.20*w,status);
   for(const side of ['left','right']){
    const measured=actualOut(side);
    assert(Math.abs(measured-deg(.20*w))<.45,
     side+' REAL toe must have an anatomically outward 11.5 degree heading: '+measured);
    assert(measured>=prev-1,'no snap back to dead straight');
   }
   prev=actualOut('left');
   if(w>.99){
    assert(status.visibleFootCorrections===2);
    assert(status.visibleToeHeadingDeg>10.5&&status.visibleToeHeadingDeg<12.3);
   }
  }
  cases++;
 }
}
const owner=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(owner.includes("const v122=v116&&new URLSearchParams"));
assert(owner.includes("v122VisibleToeHeading(THREE,this.vrmRig,actualForward"));
assert(owner.includes("const v122Takeoff=params.get('jumpPreview')==='v122'&&st.launchSpeed<1.3"));
assert(owner.includes("const fade=smooth((st.elapsed-.060)/.170)"),
 'V115-V120 regression handoff untouched');
assert(owner.includes("const v121Fade=v121Takeoff?smooth((st.elapsed-.070)/.205):fade"),
 'V121 stays as an independent rollback');
assert(boot.includes("e.src+='&visibleToeHeading=122'"));
console.log('PASS V122: '+cases+' real THREE native VRM0 facing/yaw/FPS rigs: BOTH actual toe directions ~11.5deg outward, no straight feet, no rollbacks broken');
