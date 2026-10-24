/* V120 arm trajectory geometry: compact measured-world counter-swing and
 * fluid ascent in ACTUAL corrected VRM0-oriented Three.js hierarchy.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const pi=Math.PI,world=n=>n.getWorldPosition(new THREE.Vector3());
const first=V100.v120ArmTiming('prep',0),mid=V100.v120ArmTiming('prep',.145),
 release=V100.v120ArmTiming('prep',.215),
 early=V100.v120ArmTiming('jump',0),
 thrust=V100.v120ArmTiming('jump',.16),
 settle=V100.v120ArmTiming('jump',.60);
assert(first.energy===0&&release.energy===0&&early.energy===0&&settle.energy===0,
 'Arms must reset smoothly at start/end and before falling');
assert(mid.energy>.9&&thrust.energy>.95,'Arms must actually animate in both phases');
assert(thrust.upper>mid.upper*3,'Arms must rise visibly more than small prep recoil');
assert(thrust.upper<.23&&thrust.lower<.13&&thrust.shoulder<.07,
 'Bound arm effort to natural compact-guard ranges');

function fixture(yaw){
 const root=new THREE.Group();root.rotation.y=yaw;
 const scene=new THREE.Group();scene.rotation.y=pi;root.add(scene);
 const spine=new THREE.Bone();scene.add(spine);spine.position.y=1.1;
 const bones={};
 const link=(name,parent,x,y,z)=>{
  const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);
  parent.add(b);bones[name]=b;return b;
 };
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const sh=link(side+'Shoulder',spine,sign*.16,.06,.025);
  const up=link(side+'UpperArm',sh,sign*.15,-.025,0);
  const lo=link(side+'LowerArm',up,sign*.28,-.15,.09);
  link(side+'Hand',lo,sign*.20,-.10,.14);
 }
 root.updateMatrixWorld(true);
 return {rig:{vrm:{scene,humanoid:{getNormalizedBoneNode:n=>bones[n]||null}}},
  root,bones};
}
let cases=0;
for(const yaw of [0,pi/3,pi,pi*1.72]){
 for(const fps of [30,60,120]){
  const {rig,root,bones}=fixture(yaw);
  const fwd=new THREE.Vector3(0,0,1).applyQuaternion(
   root.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const rest=Object.fromEntries(Object.entries(bones).map(([k,v])=>[k,v.quaternion.clone()]));
  let maxStep=0,last=null,maxDifference=0;
  for(const phase of ['prep','jump']){
   const duration=phase==='prep'?.215:.60;
   for(let frame=0;frame<=Math.ceil(duration*fps);frame++){
    const t=Math.min(duration,frame/fps),motion=V100.v120ArmTiming(phase,t);
    for(const [name,q] of Object.entries(rest))bones[name].quaternion.copy(q);
    const status={};
    V100.worldJumpArms(THREE,rig,fwd,motion,status);
    if(motion.energy>.1)assert(status.jumpArmWorldJoints===6,
     'Both real upper arms and forearms plus shoulders must animate');
    rig.vrm.scene.updateMatrixWorld(true);
    const q=bones.leftUpperArm.quaternion.clone();
    const dev=q.angleTo(rest.leftUpperArm);
    maxDifference=Math.max(maxDifference,dev);
    assert(dev<.25,'upper arm may not overextend or throw punches');
    assert(bones.leftHand.quaternion.angleTo(rest.leftHand)<1e-6 &&
     bones.rightHand.quaternion.angleTo(rest.rightHand)<1e-6,
     'V120 must never bend/mutate wrists or fingers');
    const handGap=world(bones.leftHand).distanceTo(world(bones.rightHand));
    assert(handGap>.22,'Hands must never press/cross together');
    if(last)maxStep=Math.max(maxStep,q.angleTo(last));
    last=q;
   }
   last=null;
  }
  assert(maxDifference>.11,'V120 must visibly move the arm from its baseline');
  assert(maxStep<.13,'No abrupt frame-step (30/60/120 fps)');
  for(const phase of ['prep','jump']){
   for(const [name,q] of Object.entries(rest))bones[name].quaternion.copy(q);
   V100.worldJumpArms(THREE,rig,fwd,V100.v120ArmTiming(phase,phase==='prep'?.215:.60),{});
   for(const [name,q] of Object.entries(rest))
    assert(bones[name].quaternion.angleTo(q)<1e-6,
     'End of arm cycle must return to original compact stance');
  }
  cases++;
 }
}
const code=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(code.includes("const v120=v116&&new URLSearchParams"));
assert(code.includes("v120ArmTiming('prep',elapsed,p.duration)"));
assert(code.includes("v120ArmTiming('jump',st.jumpAge)"));
assert(code.includes("params.get('jumpPreview')==='v120'&&st.launchSpeed<1.3"),
 'Moving jump must retain existing approved V119/V103 arms');
assert(code.includes('worldJumpArms(THREE,rig,realKairoForward'),
 'Apply arm motion only in existing V100 final bone writer');
assert(boot.includes("e.src+='&fluidArms=120'"),'Distinct mobile cache key');
console.log('PASS V120: '+cases+' real Three.js VRM0 corrected headings at 30/60/120fps, moving guard arms, neutral wrist, separated hands and no snaps');
