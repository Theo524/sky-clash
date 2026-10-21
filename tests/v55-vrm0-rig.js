'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');const root=path.resolve(__dirname,'..');
const THREE=require(path.join(root,'js/vendor/three.min.js'));const V3=THREE.Vector3;
const s=fs.readFileSync(root+'/src/30-character-models.js','utf8');const clip=s.slice(s.indexOf('const _q = new THREE.Quaternion()'),s.indexOf('// decode the embedded model'));
const damp=(a,t)=>1-Math.exp(-a*t),clamp=(n,l,h)=>Math.max(l,Math.min(n,h));
const VRMRig=new Function('THREE','V3','AnimLayer','damp','clamp','groundAt',clip+';return VRMRig')(THREE,V3,function Unsafe(){throw Error('VRM0 unsafe animation instanced')},damp,clamp,()=>0);
function node(parent,name,pos){const n=new THREE.Group();n.name=name;if(pos)n.position.set(...pos);parent.add(n);return n;}
const raw=new THREE.Group();raw.rotation.y=Math.PI; // rotateVRM0(display)
const bones={};bones.hips=node(raw,'hips',[0,1.027,0]);bones.spine=node(bones.hips,'spine',[0,.055,0]);bones.chest=node(bones.spine,'chest',[0,.116,0]);bones.upperChest=node(bones.chest,'upperChest',[0,.08,0]);bones.neck=node(bones.upperChest,'neck',[0,.11,0]);bones.head=node(bones.neck,'head',[0,.1,0]);
for(const side of ['left','right']){
 const sg=side==='left'?-1:1;
 bones[side+'UpperArm']=node(bones.upperChest,side+'UpperArm',[sg*.12,0,0]);bones[side+'LowerArm']=node(bones[side+'UpperArm'],side+'LowerArm',[sg*.38,0,0]);bones[side+'Hand']=node(bones[side+'LowerArm'],side+'Hand',[sg*.3,0,0]);
 bones[side+'UpperLeg']=node(bones.hips,side+'UpperLeg',[sg*.085,-.044,.005]);bones[side+'LowerLeg']=node(bones[side+'UpperLeg'],side+'LowerLeg',[0,-.46,0]);bones[side+'Foot']=node(bones[side+'LowerLeg'],side+'Foot',[0,-.46,.025]);bones[side+'Toes']=node(bones[side+'Foot'],side+'Toes',[0,-.09,-.1]);
}
const g=()=>new THREE.Group();const model={root:g(),body:g(),spine:g(),head:g(),parts:[],arms:[],legs:[]};
for(const sg of [-1,1]){const a={side:sg,sh:g(),el:g(),fist:g()};a.sh.rotation.x=-.7;a.el.rotation.x=-1.35;model.arms.push(a);const l={side:sg,hip:g(),knee:g(),foot:g()};l.hip.rotation.x=.1;l.knee.rotation.x=.19;model.legs.push(l);}
model.body.position.y=1.04;
const fighter={model,name:'Rin',characterId:'rin_sable',flying:false,launched:false,spiked:false,downT:0,vel:new V3(0,0,0),t:0,awakened:false,stun:0,punchT:0,charging:false};
const vrm={humanoid:{getNormalizedBoneNode:n=>bones[n]||null},scene:raw,expressionManager:null,update(){}};
const rig=new VRMRig(fighter,vrm,{legacyAxes:true,scale:1.075});
assert.equal(rig.anim,null,'VRM0 never instantiates uncalibrated Mixamo layer');
for(let i=0;i<40;i++){fighter.t+=1/60;rig.update(1/60)}
const shoulder=bones.leftUpperArm.getWorldPosition(new V3()),elbow=bones.leftLowerArm.getWorldPosition(new V3());
const shoulderR=bones.rightUpperArm.getWorldPosition(new V3()),elbowR=bones.rightLowerArm.getWorldPosition(new V3());
assert(elbow.y<shoulder.y-.07,`left arm should fold down: ${elbow.y-shoulder.y}`);
assert(elbowR.y<shoulderR.y-.07,`right arm should fold down: ${elbowR.y-shoulderR.y}`);
const heights=['leftFoot','rightFoot'].map(k=>bones[k].getWorldPosition(new V3()).y);
assert(heights.every(x=>x>0.02),`feet must clear ground: ${heights}`);
assert(Math.abs(heights[0]-heights[1])<.1);
assert(Number.isFinite(raw.position.y));
console.log('V55 VRM0 actual humanoid rig: correct both elbow direction, both feet above terrain, no unsafe clip layer PASS',heights.map(x=>+x.toFixed(3)));
