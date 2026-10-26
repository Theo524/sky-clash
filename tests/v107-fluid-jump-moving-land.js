/* V107: two independent preview flags. No extra pose writer, no physics edits. */
'use strict';
const assert=require('node:assert/strict');
const THREE=require('../js/vendor/three.min.js');
const fs=require('node:fs'),path=require('node:path');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const measure=p=>Math.abs(p.hipsX)+Math.abs(p.spineX)+Math.abs(p.chestX)+
 Math.abs(p.neckX)+Math.abs(p.spineZ)+Math.abs(p.chestY);
for(const speed of [0,4.8,6.2]){
 for(const fps of [30,60,120]){
  let previous=V100.jumpExpression(0,speed);
  assert(measure(previous)<1e-6,'the first jump frame cannot teleport the torso');
  let largest=0;
  for(let i=1;i<=fps;i++){
   const t=i/fps,p=V100.jumpExpression(t,speed);
   const mags=Object.entries(p).filter(([k])=>k!=='energy').map(([,v])=>Math.abs(v));
   assert(Math.max(...mags)<.24,'body offset stays within an anatomically modest 14 degrees');
   for(const key of ['hipsX','spineX','chestX','neckX','spineZ','chestY'])
    assert(Math.abs(p[key]-previous[key])<.16,
      'jump torso must be continuous even at 30fps: '+key);
   largest=Math.max(largest,measure(p));previous=p;
  }
  assert(largest>.19,'V107 should create actually noticeable body expression');
  assert(measure(V100.jumpExpression(1,speed))<1e-5,
   'jump energy must settle before the original landing controller takes over');
 }
}
assert.equal(V100.jumpExpression(.2,0).spineZ,0,
 'static jump must not invent sideways running momentum');
assert(Math.abs(V100.jumpExpression(.2,6.2).spineZ)>.01,
 'moving jump needs direction-aware body motion, not a copy of static pose');

function makeFootRig(){
 const root=new THREE.Group(),scene=new THREE.Group();root.add(scene);
 const bones={};
 function joint(name,parent,x=0,y=0,z=0){
  const n=new THREE.Bone();n.position.set(x,y,z);n.name=name;parent.add(n);bones[name]=n;return n;
 }
 const pelvis=joint('hips',scene,0,1.28);
 for(const side of ['left','right']){
  const hip=joint(side+'UpperLeg',pelvis,side==='left'?-.1:.1,-.13);
  const knee=joint(side+'LowerLeg',hip,0,-.42);
  joint(side+'Foot',knee,0,-.42);
 }
 const rig={vrm:{scene,humanoid:{getNormalizedBoneNode:n=>bones[n]||null}}};
 scene.updateMatrixWorld(true);
 return {root,rig,bones};
}
for(const speed of [4.8,6.2]){
 const k=makeFootRig(),side='left',foot=k.bones.leftFoot;
 const anchor={side,point:foot.getWorldPosition(new THREE.Vector3()).clone()};
 const rootBefore=k.root.position.clone();
 k.root.position.z+=speed/60;
 k.root.updateMatrixWorld(true);
 const displaced=foot.getWorldPosition(new THREE.Vector3());
 const beforeXZ=Math.hypot(displaced.x-anchor.point.x,displaced.z-anchor.point.z);
 const status={};
 V100.steadyLandingSupport(THREE,k.rig,anchor,1,status);
 const after=foot.getWorldPosition(new THREE.Vector3());
 const afterXZ=Math.hypot(after.x-anchor.point.x,after.z-anchor.point.z);
 assert(afterXZ<beforeXZ-.002,
  'moving landing support IK should reduce *actual world-space* shoe skid at '+speed);
 assert.equal(status.movingFootPinFrames,1);
 assert.equal(status.movingFootPin,'left support');
 assert(Math.abs(status.movingFootSlipCm/100-afterXZ)<.012);
 assert(k.root.position.distanceTo(rootBefore)<.3&&
  Math.abs(k.root.position.z-speed/60)<1e-6,
  'correction may not move gameplay root, physics or hitbox');
 assert(k.bones.rightUpperLeg.quaternion.angleTo(new THREE.Quaternion())<1e-5,
  'the free leg should never be frozen by support IK');
}
const owner=read('js/v100-pose-authority.js'),boot=read('js/v66-game-boot.js');
assert(owner.includes("params.get('jumpStyle')==='expressive'"));
assert(owner.includes("params.get('landingMove')==='pin'&&st.launchSpeed>1.3"));
assert(owner.includes('plantVisibleSoles(THREE,rig,f,status)'));
assert(boot.includes("e.src+='&performance=107'"));
assert(boot.includes('MOVING PLANT: ')&&boot.includes('JUMP BODY: '));
const html=read('index.html');
assert(/SKY CLASH · BUILD V(10[7-9]|11[0-5])/.test(html));
assert(/js\/v66-game-boot\.js\?v=1520&fix=(?:10[8-9]|11[0-6])/.test(html));
assert(/BUILD V(10[7-9]|11[0-5])/.test(read('animation-studio.html')));
console.log('PASS V107: fluid non-teleporting 30/60/120fps torso, stronger moving momentum, real world-space support-foot IK without changing physics or free leg');
