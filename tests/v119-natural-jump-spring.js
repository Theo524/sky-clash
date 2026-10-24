/* V119 toe articulation / body-cascade contract. Actual THREE bones,
 * native VRM0 -Z toes, rotated VRM scene, several gameplay headings.
 * In particular, NO guessing which local +/-X axis means toe flex.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const world=n=>n.getWorldPosition(new THREE.Vector3());
const rad=(n)=>n*Math.PI/180;
const duration=.215;
const early=V100.v119Spring(0,duration);
const half=V100.v119Spring(.110,duration);
const peak=V100.v119Spring(.155,duration);
const late=V100.v119Spring(.195,duration);
const end=V100.v119Spring(duration,duration);
assert.equal(early.toeFlex,0);
assert.equal(end.toeFlex,0);
assert.equal(end.turnout,0);
assert.equal(end.hipDip,0);
assert(peak.toeFlex>.065&&peak.toeFlex<.09);
assert(peak.turnout>.04&&peak.turnout<.07);
assert(peak.hipDip>.007&&peak.hipDip<.012);
assert(half.spineGain>half.chestGain,
 'spine must lead chest to avoid rigid all-at-once forward tilting');
assert(peak.spineGain>.97&&peak.chestGain>.94);
assert(late.toeFlex<peak.toeFlex,'forefoot spring releases before takeoff');

let cases=0;
for(const yaw of [0,.7,Math.PI,5.15]){
 for(const fps of [30,60,120]){
  const root=new THREE.Group();root.rotation.y=yaw;
  const scene=new THREE.Group();scene.rotation.y=Math.PI;
  root.add(scene);
  const hip=new THREE.Bone();scene.add(hip);hip.position.y=1;
  const bones={};
  for(const side of ['left','right']){
   const shin=new THREE.Bone();hip.add(shin);
   shin.position.set(side==='left'?.10:-.10,-.55,0);
   const foot=new THREE.Bone();shin.add(foot);
   foot.position.set(0,-.30,0);
   const toe=new THREE.Bone();foot.add(toe);
   toe.position.set(0,-.09,-.16);
   const tip=new THREE.Object3D();tip.position.set(0,0,-.08);toe.add(tip);
   bones[side]={foot,toe,tip};
  }
  const rig={f:{model:{root}},legacyAxes:true,vrm:{
   scene,humanoid:{getNormalizedBoneNode:name=>{
    const side=name.startsWith('left')?'left':'right';
    return bones[side]?.[name.slice(side.length).toLowerCase()]||null;
   }}}};
  scene.updateMatrixWorld(true);
  const forward=V100.realKairoForward(THREE,rig,{});
  const anchors=[];
  const baseline={},forwardTip={};
  for(const side of ['left','right']){
   const {foot,toe,tip}=bones[side];
   anchors.push({side,point:world(foot),
    rotation:foot.getWorldQuaternion(new THREE.Quaternion()),
    toeRotation:toe.quaternion.clone()});
   baseline[side]={toeHeight:world(tip).y,
    toeQuat:toe.quaternion.clone(),footQuat:foot.getWorldQuaternion(new THREE.Quaternion()),
    dir:world(toe).sub(world(foot)).setY(0).normalize()};
  }
  let maxToeStep=0,lastQ=null,maxRise=0,maxTurn=0;
  for(let frame=0;frame<=Math.ceil(duration*fps);frame++){
   const t=Math.min(duration,frame/fps);
   const spring=V100.v119Spring(t,duration);
   const status={};
   V100.softPrepToes(THREE,rig,anchors,forward,spring,status);
   assert.equal(status.prepToeJoints,2,'use BOTH actual toe joints');
   scene.updateMatrixWorld(true);
   for(const side of ['left','right']){
    const {foot,toe,tip}=bones[side],base=baseline[side];
    const rise=world(tip).y-base.toeHeight;
    const toeDiff=toe.quaternion.angleTo(base.toeQuat);
    const footDiff=foot.getWorldQuaternion(new THREE.Quaternion()).angleTo(base.footQuat);
    assert(rise>=-.001&&rise<.018,
     'toe tip must rise slightly, never dig into the ground');
    assert(footDiff<rad(5),
     'feet may turn outward a few degrees, never twist sideways excessively');
    assert(toeDiff<rad(6.5),'toe flex must remain gentle');
    const now=toe.quaternion.clone();
    if(side==='left'){
     if(lastQ)maxToeStep=Math.max(maxToeStep,now.angleTo(lastQ));
     lastQ=now;
    }
    maxRise=Math.max(maxRise,rise);
    maxTurn=Math.max(maxTurn,footDiff);
   }
   // Every frame is derived from the ENTRY QUATERNION. A second call
   // must have no effect (no accumulated twist or toe curl).
   const first=bones.left.toe.quaternion.clone();
   V100.softPrepToes(THREE,rig,anchors,forward,spring,{});
   assert(first.angleTo(bones.left.toe.quaternion)<1e-6,
    'toe curl must not accumulate on consecutive frames');
  }
  assert(maxRise>.002,'forefoot must articulate visibly');
  assert(maxTurn>rad(1.9),'toe/foot facing must not stay unnaturally straight');
  assert(maxToeStep<rad(4),'no frame-rate-dependent toe snaps');
  for(const side of ['left','right']){
   const {foot,toe}=bones[side],anchor=anchors.find(a=>a.side===side);
   assert(toe.quaternion.angleTo(anchor.toeRotation)<1e-6,
    'toe must settle back into original pose before launch');
   assert(foot.getWorldQuaternion(new THREE.Quaternion())
     .angleTo(anchor.rotation)<1e-6,
    'foot heading must return before handoff');
  }
  cases++;
 }
}
const owner=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(owner.includes("const v119=v116&&new URLSearchParams"));
assert(owner.includes("softPrepToes(THREE,this.vrmRig,st.prepFeet"));
assert(owner.includes("st.prepSpeed<1.3"),'only standing jump');
assert(owner.includes("if(previous==='prep'&&next!=='prep'&&st.prepFeet.length)"),
 'toe curl must be restored at airborne handoff');
assert(boot.includes("e.src+='&toeSpring=119'"),
 'separate V119 cache needed on phones');
console.log('PASS V119: '+cases+' real Three.js VRM0-facing foot/toe springs at 30/60/120Hz, small outward foot angle, gentle toe-up flex, zero drift and neutral takeoff, same V100 writer');
