/* V123 expressiveness envelope and actual mirrored VRM0 world-space
 * rising body. Never affect fall, landing, Boost, moving jump or wrists.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const p=V100.v123Expression;
for(const fps of [30,60,120]){
 const prep=[...Array(Math.ceil(.215*fps)+1)].map((_,i)=>p('prep',Math.min(.215,i/fps),.215));
 assert(prep[0].energy===0);
 assert(prep.at(-1).energy>.99);
 assert(prep.at(-1).spineGain>1.15&&prep.at(-1).chestGain>1.1);
 assert(prep.at(-1).legGain<1.1&&prep.at(-1).hipDip<.018);
 assert(prep.some(x=>x.armUpper>.065),'crouch must show recoiling arms');
 assert(prep.at(-1).armUpper<.001,'prep recoil neutral before takeoff');
 const rise=[...Array(Math.ceil(.72*fps)+1)].map((_,i)=>p('jump',Math.min(.72,i/fps)));
 assert(rise[0].energy===0);
 assert(rise.some(x=>x.spine>.13&&x.chest>.1),'strong open chest at takeoff');
 assert(rise.some(x=>x.thigh>.08&&x.shin>.09),'expressive midrise knee gather');
 assert(rise.some(x=>x.armUpper>.27&&x.armLower>.15),
  'new V123 arm reach must be plainly visible');
 assert(rise.at(-1).energy===0&&rise.at(-1).thigh===0,
  'settle before the approved fall begins');
 assert(p('fall',.13).energy===0&&p('landing',.03).energy===0,
  'never re-author approved descent and contact');
}
let cases=0;
const at=n=>n.getWorldPosition(new THREE.Vector3());
for(const yaw of [0,.65,Math.PI,5.1]){
 const root=new THREE.Group();root.rotation.y=yaw;
 const scene=new THREE.Group();scene.rotation.y=Math.PI;root.add(scene);
 const hips=new THREE.Bone();hips.position.y=1;scene.add(hips);
 const spine=new THREE.Bone();spine.position.y=.21;hips.add(spine);
 const chest=new THREE.Bone();chest.position.y=.17;spine.add(chest);
 const upperChest=new THREE.Bone();upperChest.position.y=.13;chest.add(upperChest);
 const neck=new THREE.Bone();neck.position.y=.12;upperChest.add(neck);
 const bones={spine,chest,upperChest,neck};
 for(const side of ['left','right']){
  const hip=new THREE.Bone();hip.position.set(side==='left'?.12:-.12,-.12,0);
  hips.add(hip);bones[side+'UpperLeg']=hip;
  const knee=new THREE.Bone();knee.position.set(0,-.45,.03);
  hip.add(knee);bones[side+'LowerLeg']=knee;
  const foot=new THREE.Bone();foot.position.set(0,-.42,-.01);
  knee.add(foot);bones[side+'Foot']=foot;
 }
 const rig={f:{model:{root}},vrm:{scene,humanoid:{getNormalizedBoneNode:n=>bones[n]||null}}};
 const forward=V100.realKairoForward(THREE,rig,{});
 const start=Object.fromEntries(Object.entries(bones).map(([k,n])=>[k,n.quaternion.clone()]));
 const m=p('jump',.2),status={};
 V100.v123WorldRise(THREE,rig,forward,m,status);
 assert(status.v123RiseJoints===6,'2 spine + 2 thigh + 2 shin world joints');
 for(const k of ['spine','chest','leftUpperLeg','rightUpperLeg','leftLowerLeg','rightLowerLeg']){
  const d=bones[k].quaternion.angleTo(start[k]);
  assert(d>.025&&d<.3,'natural visible, bounded '+k+' angular change: '+d);
 }
 // No root, toe or wrist changes. World rig facing only.
 assert(root.rotation.y===yaw);
 const stable=Object.fromEntries(Object.entries(bones).map(([k,n])=>[k,n.quaternion.clone()]));
 for(const [k,n] of Object.entries(bones))n.quaternion.copy(start[k]);
 V100.v123WorldRise(THREE,rig,forward,m,{});
 for(const [k,n] of Object.entries(bones))
  assert(n.quaternion.angleTo(stable[k])<1e-6,'no pose accumulation '+k);
 cases++;
}
const code=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(code.includes("const v123Ascent=next==='jump'&&params.get('jumpPreview')==='v123'&&"));
assert(code.includes("v123WorldRise(THREE,rig,forward,v123Arc,status)"));
assert(code.includes("if(v122Stance){\n      v122VisibleToeHeading("));
assert(code.includes("const fade=smooth((st.elapsed-.060)/.170)"));
assert(boot.includes("e.src+='&expressiveArc=123'"));
console.log('PASS V123: expressive 30/60/120fps PREP/TAKEOFF/RISE only and '+cases+' correct native-VRM0 world-space torso/tuck headings');
