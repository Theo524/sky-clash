/* V74: Make the real Mixamo walk feel planted, not like two dances
 * running together. Compare new gait and ?walkStyle=original head-to-head.
 */
const assert=require('assert'),THREE=require('../js/vendor/three.min.js');
const fs=require('fs'),path=require('path');
const V71=require('../js/v71-mixamo-gameplay.js');
const V72=require('../js/v72-walk-arms.js');
const base=path.join(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
const registry=read('assets/animations/gameplay/actions-v1.json');
const style=registry.characters.kairo_venn.walk;
assert(style.torsoStability>.5&&style.torsoStability<1);
assert(style.shoulderSwing<.7&&style.elbowSwing>=.7&&style.wristSwing>.6);
const legs=V71.decode(THREE,read('assets/animations/gameplay/kairo-walk-v1.json'));
const arms=V72.decode(THREE,read('assets/animations/gameplay/kairo-walk-arms-v1.json'));
global.SkyClashGameplayMotions={action:style};
function build(original){
 const scene=new THREE.Group(),nodes={};
 const add=(name,p,pos)=>{
  const n=new THREE.Bone();n.name=name;n.position.set(...pos);
  p.add(n);nodes[name]=n;return n;
 };
 const hips=add('hips',scene,[0,1.05,0]),spine=add('spine',hips,[0,.15,0]);
 const chest=add('chest',spine,[0,.15,0]),upperChest=add('upperChest',chest,[0,.12,0]);
 for(const side of ['left','right']){
  const x=side==='left'?.14:-.14,sg=Math.sign(x);
  const shoulder=add(side+'Shoulder',upperChest,[x,0,0]);
  const arm=add(side+'UpperArm',shoulder,[sg*.12,-.03,0]);
  const low=add(side+'LowerArm',arm,[sg*.23,0,0]);
  add(side+'Hand',low,[sg*.21,0,0]);
  const leg=add(side+'UpperLeg',hips,[x,-.06,0]);
  const knee=add(side+'LowerLeg',leg,[0,-.43,0]);
  add(side+'Foot',knee,[0,-.41,0]);
 }
 const rig={legacyAxes:true,vrm:{
  scene,humanoid:{getNormalizedBoneNode:n=>nodes[n]||null},
  update(){this.ticks=(this.ticks||0)+1;}}};
 const fighter={
  vrmRig:rig,hp:100,vel:new THREE.Vector3(0,0,3.4),
  flying:false,launched:false,spiked:false,downT:0,stun:0,dashing:false,
  sprinting:false,slamming:false,punchT:0,animate(){
   const e=new THREE.Euler(.22,.31,.17,'YXZ');
   hips.quaternion.setFromEuler(e);
   spine.rotation.set(.11,0,.12);
   chest.rotation.set(.1,0,.14);
   for(const side of ['left','right']){
    nodes[side+'UpperArm'].quaternion.identity();
    nodes[side+'LowerArm'].quaternion.identity();
    nodes[side+'Hand'].quaternion.identity();
    nodes[side+'UpperLeg'].quaternion.identity();
    nodes[side+'LowerLeg'].quaternion.identity();
    nodes[side+'Foot'].quaternion.identity();
   }
  }
 };
 const s71={action:style,originalWalkStyle:original,weight:0};
 const s72={originalWalkStyle:original,frames:0};
 V71.attach(THREE,fighter,legs,s71);
 V72.attach(THREE,fighter,arms,s72);
 const qSamples={arms:[],knees:[]};
 for(let i=0;i<95;i++){
  fighter.animate(1/60);
  if(i>35){
   qSamples.arms.push(nodes.leftUpperArm.quaternion.clone());
   qSamples.knees.push(nodes.leftLowerLeg.quaternion.clone());
  }
 }
 return {fighter,nodes,s71,s72,samples:qSamples};
}
const calm=build(false),original=build(true);
const eCalm=new THREE.Euler().setFromQuaternion(calm.nodes.hips.quaternion,'YXZ');
const eOriginal=new THREE.Euler().setFromQuaternion(original.nodes.hips.quaternion,'YXZ');
assert(Math.abs(eCalm.y-eOriginal.y)<.003,'V74 must preserve walking facing/turning');
assert(Math.abs(eCalm.x)<Math.abs(eOriginal.x)*.55,'Less old procedural pitch when walking');
assert(Math.abs(eCalm.z)<Math.abs(eOriginal.z)*.55,'Less old procedural side-to-side body roll');
// V75: measure cyclic swing AROUND the natural lowered walk stance,
 // not the absolute angle to the T-pose. The latter would reward unnaturally
 // outstretched arms and penalise a correct athletic lowered shoulder.
const swingRange=(set)=>{
 let max=0;
 for(let i=0;i<set.length;i++)for(let j=i+1;j<set.length;j++)
  max=Math.max(max,set[i].angleTo(set[j]));
 return max;
};
const calmSwing=swingRange(calm.samples.arms),oldSwing=swingRange(original.samples.arms);
assert(calmSwing<oldSwing*.85,'Upper-arm cyclic swing should be visibly reduced');
assert(calmSwing>.02,'Recorded arm movement is still visibly present');
assert(calm.nodes.leftLowerLeg.quaternion.angleTo(original.nodes.leftLowerLeg.quaternion)<.0001,
 'V74 must not alter recorded Mixamo knees');
assert(calm.samples.knees[5].angleTo(calm.samples.knees[27])>.03,
 'The new grounded walk still has leg movement');
assert(calm.s71.weight>.9&&calm.s72.frames>20);
assert(!calm.s71.error&&!calm.s72.error);
// While stopped/attacking we never override the combat torso or arms.
calm.fighter.punchT=.45;calm.fighter.animate(1/60);
assert(Math.abs(new THREE.Euler().setFromQuaternion(calm.nodes.hips.quaternion,'YXZ').x-.22)<.001,
 'Combat cannot be affected by V74 idle/gait stabilization');
console.log('PASS: V74 3D walk: reduced dancing arm swings and torso roll, preserved knee gait, facing, and combat');
