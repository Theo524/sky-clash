/* V75 regression: arms stay in the actual Mixamo walk's DOWN posture.
 * V74 scaled the shoulder WORLD delta toward identity (VRM T-pose).
 * Correctly scale only movement AROUND a measured source-walk mean.
 */
const assert=require('assert');
const fs=require('fs'),path=require('path');
const THREE=require('../js/vendor/three.min.js');
const Arm=require('../js/v72-walk-arms.js');
const root=path.join(__dirname,'..');
const asset=JSON.parse(fs.readFileSync(path.join(root,'assets/animations/gameplay/kairo-walk-arms-v1.json'),'utf8'));
const style=JSON.parse(fs.readFileSync(path.join(root,'assets/animations/gameplay/actions-v1.json'),'utf8')).characters.kairo_venn.walk;
const motion=Arm.decode(THREE,asset);
const ident=new THREE.Quaternion();
const rad=deg=>deg*Math.PI/180;
assert.strictEqual(motion.center.length,8,'Each source joint must have a calibrated neutral gait pose');
for(const i of [1,5]){
 const angle=motion.center[i].angleTo(ident);
 assert(angle>rad(67)&&angle<rad(92),
  'Real Mixamo '+motion.names[i]+' mean should LOWER the arm about 75°, not be T pose: '+angle*180/Math.PI);
 const wrong=ident.clone().slerp(motion.center[i],style.shoulderSwing);
 assert(wrong.angleTo(ident)<angle*.65,
  'V74 wrong identity attenuation should have visibly raised arms sideways');
}
const source=()=>Array.from({length:8},()=>new THREE.Quaternion());
const sampled=source();
let oldVar=0,newVar=0;
for(let k=0;k<asset.frames-1;k++){
 motion.sample(k/asset.fps,sampled);
 for(const i of [1,5]){
  const center=motion.center[i];
  const q=sampled[i];
  const tuned=center.clone().slerp(q,style.shoulderSwing);
  const deviation=center.angleTo(q);
  oldVar=Math.max(oldVar,deviation);
  newVar=Math.max(newVar,center.angleTo(tuned));
  assert(tuned.angleTo(center)<.25,'Calm walk must keep the naturally lowered arm');
  assert(tuned.angleTo(ident)>rad(58),'Calm walk must not return to outward T-pose');
 }
}
assert(oldVar>.08,'Walk sample must contain genuine animated variation');
assert(newVar<=oldVar*.56,'Gait swing amplitude should be attenuated 45%, not flattened to a T pose');
// Exercise the actual runtime helper on a VRM-style hierarchy, no rendering.
global.SkyClashGameplayMotions={action:style};
function fighter(){
 const scene=new THREE.Group(),nodes={};
 const add=(name,parent,pos)=>{
  const bone=new THREE.Bone();bone.name=name;bone.position.set(...pos);
  parent.add(bone);nodes[name]=bone;return bone;
 };
 const hips=add('hips',scene,[0,1,0]),spine=add('spine',hips,[0,.15,0]);
 const chest=add('chest',spine,[0,.15,0]),upper=add('upperChest',chest,[0,.12,0]);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const shoulder=add(side+'Shoulder',upper,[sign*.18,0,0]);
  const u=add(side+'UpperArm',shoulder,[sign*.12,-.04,0]);
  const low=add(side+'LowerArm',u,[sign*.27,0,0]);
  add(side+'Hand',low,[sign*.22,0,0]);
 }
 const rig={legacyAxes:true,vrm:{scene,humanoid:{getNormalizedBoneNode:n=>nodes[n]||null},
  update(){this.updates=(this.updates||0)+1;}}};
 const f={vrmRig:rig,hp:100,punchT:0,stun:0,flying:false,launched:false,
  spiked:false,dashing:false,sprinting:false,vel:new THREE.Vector3(),
  v71Walk:{clock:0,weight:1},
  animate(){for(const n of Object.values(nodes))n.quaternion.identity();}};
 return {f,nodes,rig};
}
const {f,nodes,rig}=fighter();
const state={originalWalkStyle:false,frames:0};
assert(Arm.attach(THREE,f,motion,state),'Recorded walk upper body attached to the fighter');
f.v71Walk.clock=.18;
f.animate(1/60);
const qL=nodes.leftUpperArm.getWorldQuaternion(new THREE.Quaternion());
const qR=nodes.rightUpperArm.getWorldQuaternion(new THREE.Quaternion());
const before=source();motion.sample(.18,before);
const turn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
for(const [i,actual] of [[1,qL],[5,qR]]){
 const expected=motion.center[i].clone().slerp(before[i],style.shoulderSwing);
 const mapped=turn.clone().multiply(expected).multiply(turn.clone().invert()).normalize();
 assert(actual.angleTo(mapped)<.004,
  'Actual V75 VRM '+motion.names[i]+' must use Mixamo mean-centred pose');
 assert(actual.angleTo(ident)>rad(58),'Actual playable upper arm must be down rather than sticking sideways');
}
assert(rig.vrm.updates===1,'VRM skin must receive recorded walk bones');
const frames=state.frames;
f.punchT=.4;f.animate(1/60);
assert.strictEqual(state.frames,frames,'Attacks must take precedence over walking arms');
console.log('PASS V75: source walk arms ~73–80° below rest, restored down posture, 45% smaller swing, live VRM bone matching and combat priority');
