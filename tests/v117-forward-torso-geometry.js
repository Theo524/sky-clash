/* V117: test real world-space torso lean rather than a signed local
 * pelvis/spine X rotation. Preserve existing V115/V116 pose variants.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pos=n=>n.getWorldPosition(new THREE.Vector3());
function poseFixture(yaw,mirror){
 const scene=new THREE.Group();scene.rotation.y=yaw;scene.position.set(3,0,-7);
 const nodes={};
 const bone=(name,parent,y)=>{
  const n=new THREE.Bone();n.name=name;n.position.y=y;
  parent.add(n);nodes[name]=n;return n;
 };
 const hips=bone('hips',scene,1);
 const spine=bone('spine',hips,.17);
 const chest=bone('chest',spine,.19);
 const upper=bone('upperChest',chest,.12);
 const neck=bone('neck',upper,.12);
 bone('head',neck,.15);
 if(mirror==='spine'||mirror==='both')
  spine.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
 if(mirror==='chest'||mirror==='both')
  chest.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
 scene.updateMatrixWorld(true);
 return {rig:{vrm:{scene,humanoid:{getNormalizedBoneNode:n=>nodes[n]||null}}},
  nodes,spineBase:spine.quaternion.clone(),chestBase:chest.quaternion.clone()};
}
function heading(scene){
 const f=new THREE.Vector3(0,0,1).applyQuaternion(
  scene.getWorldQuaternion(new THREE.Quaternion()));
 f.y=0;return f.normalize();
}
let cases=0;
for(const yaw of [0,Math.PI*.5,Math.PI,Math.PI*1.7]){
 for(const mirrored of ['none','spine','chest','both']){
  for(const fps of [30,60,120]){
   const {rig,nodes,spineBase,chestBase}=poseFixture(yaw,mirrored);
   const front=heading(rig.vrm.scene);
   const relative=()=>pos(nodes.head).sub(pos(nodes.hips)).dot(front);
   const start=relative(),status={},older=[];
   let previous=start;
   for(let frame=0;frame<=Math.ceil(.16*fps);frame++){
    const t=Math.min(.16,frame/fps);
    const p=V100.prepPose(t,0,'loaded');
    nodes.spine.quaternion.copy(spineBase);
    nodes.chest.quaternion.copy(chestBase);
    const seen=V100.worldStandingPrepTorso(THREE,rig,
     Math.abs(p.spineX),Math.abs(p.chestX),status);
    const now=relative();
    assert(Number.isFinite(seen)&&Number.isFinite(now));
    assert(now>=start-.001,
     'head cannot move backwards relative to actual humanoid forward');
    if(frame>0)assert(now>=previous-.003,
     'torso must lean forward monotonically during load');
    assert(Math.abs(now-previous)<.125,
     'torso should not snap between 30/60/120fps prep frames');
    assert(nodes.hips.quaternion.angleTo(new THREE.Quaternion())<1e-8,
     'V117 must never pitch the pelvis/back-bend the entire leg chain');
    previous=now;older.push(now);
   }
   assert(previous>start+.07,
    'whole upper body must visibly lean forwards in world space');
   assert(status.prepTorsoForwardCm>7,
    'new diagnostics must report world-space forward torso position');
   cases++;
  }
 }
}
const owner=read('js/v100-pose-authority.js');
const boot=read('js/v66-game-boot.js');
const html=read('index.html');
assert(owner.includes('function worldStandingPrepTorso(THREE,rig,'));
assert(owner.includes("const v117=v116&&new URLSearchParams"));
assert(owner.includes("worldStandingPrepTorso(THREE,this.vrmRig"));
assert(owner.includes("v117&&(i===0||i===1||i===2||i===4)"),
 'V117 must exclude uncalibrated local-X pitch for pelvis and torso');
assert(owner.includes('worldStandingPrepLegs(THREE,this.vrmRig'),
 'V117 must retain the same one-owner anatomical knee correction');
assert(boot.includes("get('jumpPreview')==='v117'")&&
 boot.includes("e.src+='&torso=117'"));
assert(html.includes('&v117=1'),'refresh boot loader on mobile');
console.log('PASS V117: '+cases+
 ' mirrored/rotated world-space forward torso profiles at 30/60/120fps; no backward whole-body pitch, monotonic lean, untouched pelvis and V116 knees');
