/* V86 Unreal/Quinn skeleton import regression, alongside original Mixamo.
 * Does NOT replace approved idle (2).fbx or Standard Run.
 */
'use strict';
const assert=require('node:assert/strict');
const THREE=require('../js/vendor/three.min.js');
const exporter=require('../js/v72-studio-game-export.js');
assert.equal(exporter.canonical('pelvis'),'hips');
assert.equal(exporter.canonical('spine_03'),'spine2');
assert.equal(exporter.canonical('upperarm_l'),'leftarm');
assert.equal(exporter.canonical('clavicle_r'),'rightshoulder');
assert.equal(exporter.canonical('thigh_r'),'rightupleg');
assert.equal(exporter.canonical('calf_l'),'leftleg');
assert.equal(exporter.canonical('lowerarm_twist_01_l'),'lowerarmtwist01l','Ignore helper bones');
assert.equal(exporter.canonical('mixamorig:LeftForeArm'),'leftforearm');
assert.equal(exporter.canonical('mixamorig:Spine2'),'spine2');
assert.equal(exporter.canonical('mixamorig:Hips'),'hips');
const spec=(isUE)=>{
 const root=new THREE.Group();root.name='test';
 const nm=isUE?['pelvis','spine_01','spine_02','spine_03','neck_01','head',
  'clavicle_l','upperarm_l','lowerarm_l','hand_l',
  'clavicle_r','upperarm_r','lowerarm_r','hand_r',
  'thigh_l','calf_l','foot_l','thigh_r','calf_r','foot_r']:
  ['mixamorig:Hips','mixamorig:Spine','mixamorig:Spine1','mixamorig:Spine2',
   'mixamorig:Neck','mixamorig:Head','mixamorig:LeftShoulder','mixamorig:LeftArm',
   'mixamorig:LeftForeArm','mixamorig:LeftHand','mixamorig:RightShoulder',
   'mixamorig:RightArm','mixamorig:RightForeArm','mixamorig:RightHand',
   'mixamorig:LeftUpLeg','mixamorig:LeftLeg','mixamorig:LeftFoot',
   'mixamorig:RightUpLeg','mixamorig:RightLeg','mixamorig:RightFoot'];
 const bones=new Map();
 for(const name of nm){const b=new THREE.Bone();b.name=name;bones.set(name,b);root.add(b);}
 bones.get(nm[6]).position.x=1;
 bones.get(nm[10]).position.x=-1;
 const arm=nm[7];
 const track=new THREE.QuaternionKeyframeTrack(arm+'.quaternion',[0,.5],
  [0,0,0,1,0,0.258819,0,0.965926]);
 root.animations=[new THREE.AnimationClip('test',.5,[track])];
 return root;
};
for(const ue of [false,true]){
 const m=exporter.bake(THREE,spec(ue),{slot:'guard',character:'kairo',
  sourceFile:ue?'UE5/Mixamo_Standing_Block_Idle.Fbx':'Mixamo/Standing Block Idle.fbx'});
 assert.equal(m.bones.length,20);
 assert.equal(m.frames,16);
 assert.equal(m.side[0],1);
 assert.equal(m.fps,30);
 assert.equal(m.encoding,'int16-le-xyzw-world-bind-delta-base64');
 const bytes=Buffer.from(m.data,'base64');
 assert.equal(bytes.length,m.frames*20*4*2);
 const arr=new Int16Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/2);
 const at=(m.frames-1)*20*4+7*4;
 assert.ok(Math.abs(arr[at+1])>3500,'Animated upper arm must change in emitted motion');
 const pack=exporter.pack([m]);
 assert.equal(pack.schema,'sky-clash.studio-gamepack.v1');
}
console.log('PASS V86: both Mixamo and UE5 Quinn skeleton exports use real 30fps world-bind samples');

const fs=require('node:fs');
const recorded=require('../js/v72-published-actions.js');
const imported=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,
 '../assets/animations/gameplay/v86-ue5-converted-actions.json'),'utf8'));
assert.equal(imported.schema,'sky-clash.studio-gamepack.v1');
assert.equal(imported.motions.length,16);
assert.equal(new Set(imported.motions.map(m=>m.slot)).size,16);
for(const m of imported.motions){
 const action=recorded.decode(THREE,m);
 assert.equal(action.frames,m.frames);
 assert.equal(action.bones.length,20);
 const a=Array.from({length:20},()=>new THREE.Quaternion());
 const b=Array.from({length:20},()=>new THREE.Quaternion());
 action.sample(0,a,false);
 action.sample(action.seconds*.5,b,false);
 assert.ok(a.every((q,i)=>Number.isFinite(q.lengthSq())&&Math.abs(q.length()-1)<.003));
 assert.ok(b.every(q=>Number.isFinite(q.lengthSq())&&Math.abs(q.length()-1)<.003));
}
const base=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,
 '../assets/animations/gameplay/studio-actions-v1.json'),'utf8'));
assert.equal(base.motions.find(m=>m.slot==='idle').sourceFile,'Movement/Adventure/idle (2).fbx');
assert.equal(base.motions.find(m=>m.slot==='run').sourceFile,'Movement/Male/standard run.fbx');
const motionBySlot=Object.fromEntries(imported.motions.map(m=>[m.slot,recorded.decode(THREE,m)]));
function fake(data={}){return Object.assign({hp:100,t:1,vel:{x:0,y:0,z:0},
 moveIntent:{x:0,z:0},sprinting:false,skidT:0},data)}
assert.equal(recorded.choose(fake({flying:true}),motionBySlot),'floating');
assert.equal(recorded.choose(fake({flying:true,vel:{x:7,y:0,z:0}}),motionBySlot),'flying');
assert.equal(recorded.choose(fake({jumping:true,vel:{x:0,y:8,z:0}}),motionBySlot),'jump');
assert.equal(recorded.choose(fake({jumping:true,vel:{x:0,y:-8,z:0},dropping:true}),motionBySlot),'fallingIdle');
assert.equal(recorded.choose(fake({landingMotionT:.3}),motionBySlot),'landing');
assert.equal(recorded.choose(fake({blockHeld:true}),motionBySlot),'guard');
console.log('PASS V86: 16 real FBX recordings decoded with source skeleton mapping; game states verified');