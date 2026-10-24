/* V106 world-space sole contact. This tests actual parented THREE bones,
 * unlike earlier landing tests that only compared local bone quaternions.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function rigAt(sceneY,withToes=true,floor=0,secondFootLift=0){
 const parent=new THREE.Group();
 parent.rotation.y=.42;parent.position.set(2,0,-3);
 const scene=new THREE.Group();scene.position.y=sceneY;
 scene.scale.setScalar(.85);parent.add(scene);
 const bones={};
 function bone(name,host,x=0,y=0,z=0){
  const node=new THREE.Bone();node.name=name;node.position.set(x,y,z);
  host.add(node);bones[name]=node;return node;
 }
 const hips=bone('hips',scene,0,1.30);
 for(const side of ['left','right']){
  const h=bone(side+'UpperLeg',hips,side==='left'?-.1:.1,-.14);
  const knee=bone(side+'LowerLeg',h,0,-.42);
  const foot=bone(side+'Foot',knee,0,-.43);
  if(withToes)bone(side+'Toes',foot,0,-.07,.13);
 }
 if(secondFootLift)bones.rightUpperLeg.quaternion.setFromAxisAngle(
  new THREE.Vector3(1,0,0),secondFootLift);
 const fighter={floor,flying:false};
 const rig={footLift:0,vrm:{scene,humanoid:{getNormalizedBoneNode:n=>bones[n]||null}}};
 const status={soleCorrections:0};
 return {rig,fighter,status,bones,parent};
}
function contact(k){
 const gaps=V100.soleGaps(THREE,k.rig,k.fighter);
 assert(gaps.length===4||gaps.length===2,'must inspect visible feet/toes');
 return gaps;
}
for(const withToes of [true,false]){
 for(const y of [.6,-.35,.1]){
  const k=rigAt(y,withToes);
  const start=contact(k),gap=Math.min(...start.map(x=>x.gap));
  const q=k.bones.leftFoot.quaternion.clone(),oldY=k.rig.vrm.scene.position.y;
  V100.plantVisibleSoles(THREE,k.rig,k.fighter,k.status);
  const final=contact(k);
  assert(Math.abs(Math.min(...final.map(x=>x.gap)))<.0001,
   'a VISIBLY retargeted shoe must touch the physical floor');
  assert(final.every(x=>x.gap>=-.0001),
   'no foot or toe may be driven underground');
  assert.equal(k.status.soleContact,'PLANTED');
  assert(Math.abs(k.status.soleGapCm)<.1);
  assert(Math.abs(k.rig.vrm.scene.position.y-oldY+gap)<.0001,
   'world-space vertical offset must equal measured sole clearance');
  assert(Math.abs(k.rig.footLift+gap)<.0001,
   'footLift bookkeeping must follow actual displayed scene translation');
  assert(k.bones.leftFoot.quaternion.angleTo(q)<.00001,
   'floor contact must not change authored jump/landing rotations');
  const settledY=k.rig.vrm.scene.position.y;
  for(let i=0;i<60;i++)V100.plantVisibleSoles(THREE,k.rig,k.fighter,k.status);
  assert(Math.abs(k.rig.vrm.scene.position.y-settledY)<.0001,
   'continuous ground anchoring must not drift over time');
  assert.equal(k.status.soleCorrections,61);
 }
}
{
 const k=rigAt(.25,true,.30,.35);
 V100.plantVisibleSoles(THREE,k.rig,k.fighter,k.status);
 const gaps=contact(k);
 assert(gaps.every(x=>x.gap>=-.0001),
  'both feet must remain above sloped/support-floor level');
 assert(Math.min(...gaps.map(x=>x.gap))<.0001,
  'at least one weight-bearing sole touches the ground');
 assert(k.status.otherSoleGapCm>=-.1);
}
{
 const k=rigAt(.42);
 const initial=contact(k).map(x=>x.gap);
 k.fighter.flying=true;
 V100.plantVisibleSoles(THREE,k.rig,k.fighter,k.status);
 assert.deepEqual(contact(k).map(x=>x.gap),initial,
  'airborne V102/V103 jumps must NEVER be grounded by this solver');
 assert.equal(k.status.soleCorrections,0);
}
const script=read('js/v100-pose-authority.js'),
 visual=read('src/30-character-models.js'),
 boot=read('js/v66-game-boot.js');
assert(script.includes("params.get('landingFeet')==='plant'"));
assert(script.includes("next==='landing'&&params.get('landingLab')==='contact'"));
assert(script.includes("st.phase==='landing')\n       plantVisibleSoles"));
assert(visual.includes('const v106FinalSoles='));
assert(visual.includes('if (!v106FinalSoles&&!v108FinalPrep&&!this.f.flying'));
assert(visual.includes('} else if (!v106FinalSoles&&!v108FinalPrep&&this.footLift)'));
assert(boot.includes("e.src+='&soles=106'"));
assert(boot.includes("SOLE: ")&&boot.includes('lowest gap'));
const html=read('index.html');
assert(/SKY CLASH · BUILD V(10[6-9]|11[0-2])/.test(html));
assert(/js\/v66-game-boot\.js\?v=820&fix=(?:10[7-9]|11[0-2])/.test(html));
assert(/BUILD V(10[6-9]|11[0-2])/.test(read('animation-studio.html')));
console.log('PASS V106: visible retargeted soles touch real world floor (including toes), no penetration, 60-frame drift-free contact, no airborne changes or competing procedural ground solver');
