/* V121: real VRM0-facing lower-body takeoff keeps outward loaded
 * thigh+shoe heading through the first push instead of straightening.
 * All clips/controllers, movement, physics, and guard stay unchanged.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const rad=x=>x*Math.PI/180;
const pose=V100.v121LaunchStance;
for(const fps of [30,60,120]){
 let prev=0;
 for(let frame=0;frame<=Math.ceil(.215*fps);frame++){
  const a=Math.min(.215,frame/fps),p=pose(a,.215);
  assert(Number.isFinite(p.thighYaw)&&Number.isFinite(p.footYaw));
  assert(p.thighYaw>=prev-.000001,'no abrupt narrowing of stance in prep');
  assert(p.thighYaw<rad(4.1)&&p.footYaw<rad(3.6));
  if(a>=.18)assert(p.footYaw>.045&&p.thighYaw>.052,
   'outward stance should not disappear before takeoff');
  prev=p.thighYaw;
 }
}
for(const yaw of [0,Math.PI*.5,Math.PI,Math.PI*1.65]){
 const root=new THREE.Group();root.rotation.y=yaw;
 const scene=new THREE.Group();scene.rotation.y=Math.PI;root.add(scene);
 const hips=new THREE.Bone();hips.position.y=1;scene.add(hips);
 const bones={};
 for(const side of ['left','right']){
  const t=new THREE.Bone(),k=new THREE.Bone(),shoe=new THREE.Bone();
  t.position.set(side==='left'?.12:-.12,-.10,0);
  k.position.set(0,-.42,-.06);
  shoe.position.set(0,-.42,-.02);
  hips.add(t);t.add(k);k.add(shoe);bones[side+'UpperLeg']=t;
  bones[side+'LowerLeg']=k;bones[side+'Foot']=shoe;
 }
 const rig={vrm:{scene,humanoid:{
  getNormalizedBoneNode:n=>bones[n]||null
 }}};
 const origin=Object.fromEntries(['left','right'].map(side=>
  [side,bones[side+'UpperLeg'].quaternion.clone()]));
 const f=pose(.215,.215);
 const status={};
 V100.v121OutwardThighs(THREE,rig,f.thighYaw,status);
 assert.equal(status.takeoffThighJoints,2);
 const first={};
 for(const side of ['left','right']){
  const joint=bones[side+'UpperLeg'],rest=origin[side];
  assert(Math.abs(joint.quaternion.angleTo(rest)-f.thighYaw)<1e-5,
   'actual VRM leg yaw must equal measured anatomical turnout');
  first[side]=joint.quaternion.clone();
  joint.quaternion.copy(rest);
 }
 // Re-apply ONCE to the reset PAIR; re-applying for each side would
 // double-turn the other leg and test a pose that gameplay never uses.
 V100.v121OutwardThighs(THREE,rig,f.thighYaw,{});
 for(const side of ['left','right'])
  assert(first[side].angleTo(bones[side+'UpperLeg'].quaternion)<1e-5,
   'same starting VRM pair must have the same outward yaw');
}
const owner=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(owner.includes("const v121=v116&&new URLSearchParams"));
assert(owner.includes("if(v121)v121OutwardThighs("));
assert(owner.includes("v121?{...spring,turnout:stance.footYaw}:spring"));
assert(owner.includes("const v121Takeoff=params.get('jumpPreview')==='v121'&&st.launchSpeed<1.3"));
assert(owner.includes("const fade=smooth((st.elapsed-.060)/.170)")&&
 owner.includes("const v121Fade=v121Takeoff?smooth((st.elapsed-.070)/.205):fade"),
 'old V115-V120 transfer timing must stay untouched');
assert(owner.includes("params.get('jumpPreview')==='v120'&&st.launchSpeed<1.3")&&
 owner.includes("params.get('jumpPreview')==='v121'&&st.launchSpeed<1.3"),
 'V121 must retain existing athletic arms with independent gate');
assert(boot.includes("e.src+='&takeoffHeading=121'"));
console.log('PASS V121: VRM0 mirrored/outward thighs at four yaw angles, 30/60/120fps stance held through prep, legacy rollbacks untouched');
