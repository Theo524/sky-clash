/* V110: prevent imported jump/fall world-yaw contamination.
 * The single existing V100 writer constrains LOCAL torso twist relative
 * to the last APPROVED visible standing/walking/running facing, while
 * preserving authored bend/lean, leg/guard joints and gameplay root turn.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const rad=Math.PI/180;
const yAxis=new THREE.Vector3(0,1,0);
const xAxis=new THREE.Vector3(1,0,0);
function twistAngle(a,b){
 return V100.axialTwist(THREE,a).angleTo(V100.axialTwist(THREE,b));
}
function swing(q){
 return q.clone().multiply(V100.axialTwist(THREE,q).clone().invert());
}
for(const groundYaw of [-165,-60,-43,0,45,175]){
 for(const sourceOffset of [-95,-45,-12,0,13,45,100]){
  const ground=new THREE.Quaternion().setFromAxisAngle(yAxis,groundYaw*rad);
  const tilt=new THREE.Quaternion().setFromAxisAngle(xAxis,.31);
  const target=tilt.clone().multiply(
    new THREE.Quaternion().setFromAxisAngle(yAxis,(groundYaw+sourceOffset)*rad)
  ).normalize();
  const untouched=target.clone(),originalSwing=swing(target);
  const output=V100.stabilizeFacing(THREE,target,ground,.035);
  assert(twistAngle(target,ground)<=.035001,
   'yaw cannot drift away from actual approved takeoff facing');
  assert(swing(target).angleTo(originalSwing)<.00001,
   'real forward lean must not be erased by yaw stabilization');
  assert(output.residual<=.035001);
  assert(Math.abs(output.source-Math.abs(sourceOffset)*rad)<.0001);
  assert(untouched.angleTo(target)<=Math.abs(sourceOffset)*rad+.001,
   'no spurious tumbling or rotation beyond source yaw difference');
  const bodyRoot=new THREE.Quaternion().setFromAxisAngle(yAxis,73*rad);
  const beforeWorld=bodyRoot.clone().multiply(target);
  const rotatedRoot=new THREE.Quaternion().setFromAxisAngle(yAxis,(73+50)*rad);
  const afterWorld=rotatedRoot.clone().multiply(target);
  const expected=rotatedRoot.clone().multiply(bodyRoot.clone().invert());
  assert(beforeWorld.clone().premultiply(expected).angleTo(afterWorld)<.0001,
   'gameplay facing may still turn the entire rig normally while airborne');
 }
}
// The actual source captures have an unrequested yaw baseline. Make that
// difference explicit so the fix does not mask an invented diagnosis.
const UE5=JSON.parse(read('assets/animations/gameplay/v86-ue5-converted-actions.json'));
const STUDIO=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
const V72=require('../js/v72-published-actions.js');
const jump=V72.decode(THREE,UE5.motions.find(m=>m.slot==='jump'));
const fall=V72.decode(THREE,UE5.motions.find(m=>m.slot==='fallingIdle'));
const idle=V72.decode(THREE,STUDIO.motions.find(m=>m.slot==='idle'));
const sample=clip=>{const out=Array.from({length:20},()=>new THREE.Quaternion());clip.sample(.18,out,false);return out};
const j=sample(jump),i=sample(idle),f=sample(fall);
assert(twistAngle(j[0],i[0])>.14,
 'imported UE5 jumping hips have a different local axial baseline to the approved idle');
assert(twistAngle(j[1],i[1])>.14,
 'the spine adds its own additional yaw before the chest/neck');
assert(twistAngle(f[0],i[0])<twistAngle(j[0],i[0]),
 'falling source turns back toward approved grounded yaw');
const owner=read('js/v100-pose-authority.js'),
 boot=read('js/v66-game-boot.js'),html=read('index.html');
assert(owner.includes("params.get('jumpFacing')==='locked'"));
assert(owner.includes("st.airFacingPose=visible.slice(0,6).map(q=>q.clone())"));
assert(owner.includes("if(facingLock){")&&
 owner.includes("const correction=stabilizeFacing(THREE,bone.quaternion,"),
 'facing correction must occur AFTER leg/guard retarget within the one final owner');
assert(owner.includes("target.copy(swing).multiply(restrained).normalize()"));
assert(owner.includes("st.airFacingPose=[];"));
assert(boot.includes("e.src+='&facing=110'"));
assert(boot.includes('AIR FACING: V110 aligned'));
assert(/SKY CLASH · BUILD V11[0-5]/.test(html));
assert(/js\/v66-game-boot\.js\?v=1520&fix=11[1-6]/.test(html));
assert(/BUILD V11[0-5]/.test(read('animation-studio.html')));
console.log('PASS V110: source jump/spine yaw mismatch verified; takeoff-relative yaw correction preserves bend, lean and arbitrary player root turns');
