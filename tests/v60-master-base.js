const assert=require('assert');
const THREE=require('../js/vendor/three.min.js');
const Master=require('../assets/characters/master/model.js');
const b=new Map();const root=new THREE.Group();
function a(name,parent,x,y,z,ry=0,rz=0){const n=new THREE.Bone();n.name='mixamorig:'+name;n.position.set(x,y,z);n.rotation.set(0,ry,rz);(parent||root).add(n);b.set(name.toLowerCase(),n);return n;}
const hips=a('Hips',null,0,100,0), spine=a('Spine',hips,0,10,0),spine1=a('Spine1',spine,0,10,0),spine2=a('Spine2',spine1,0,10,0),neck=a('Neck',spine2,0,17,0),head=a('Head',neck,0,9,2);a('HeadTop_End',head,0,22,5);
for(let side of ['Left','Right']){const sign=side==='Left'?1:-1;const should=a(side+'Shoulder',spine2,sign*5,11,0,0,sign*-Math.PI/2),arm=a(side+'Arm',should,0,11,0),fore=a(side+'ForeArm',arm,0,28,0),hand=a(side+'Hand',fore,0,28,0);for(let [i,f] of ['Index','Middle','Ring','Pinky'].entries())a(side+'Hand'+f+'1',hand,(i-1.5)*2,8,0);const upper=a(side+'UpLeg',hips,sign*8,-7,0,0,Math.PI),leg=a(side+'Leg',upper,0,44,0),foot=a(side+'Foot',leg,0,44,0);a(side+'ToeBase',foot,0,13,0);}
assert(Master.check(b).valid);const body=Master.create(THREE,b,root);assert.strictEqual(body.source,'native-mixamo-bones');assert(body.parts.length>50);assert(body.parts.some(m=>m.isSkinnedMesh));assert(!body.parts.some(x=>/robot|mech/i.test(x.name)));root.updateMatrixWorld(true);
for(const mesh of body.parts){const p=mesh.getWorldPosition(new THREE.Vector3());assert(Number.isFinite(p.x+p.y+p.z));assert(mesh.parent.isBone||mesh.isSkinnedMesh);}
// Every weighted limb section uses the original bone transforms and normalised two-bone skin weights.
const skinSections=body.parts.filter(x=>x.isSkinnedMesh);assert(skinSections.length>=12);
for(const m of skinSections){
  assert.strictEqual(m.skeleton.bones.length,2);
  const gi=m.geometry.getAttribute('skinIndex'),gw=m.geometry.getAttribute('skinWeight');
  assert(gi&&gw&&gi.count===m.geometry.getAttribute('position').count);
  for(let i=0;i<gw.count;i+=Math.max(1,Math.floor(gw.count/25))){
    assert(Math.abs(gw.getX(i)+gw.getY(i)-1)<1e-5);
    assert([0,1].includes(gi.getX(i))&&[0,1].includes(gi.getY(i)));
  }
}
const before=b.get('lefthand').children.filter(o=>o.isMesh).map(m=>m.getWorldPosition(new THREE.Vector3()));const leftarm=b.get('leftarm');leftarm.rotation.z+=.6;root.updateMatrixWorld(true);const after=b.get('lefthand').children.filter(o=>o.isMesh).map(m=>m.getWorldPosition(new THREE.Vector3()));assert(before.length>0);assert(before.some((p,i)=>p.distanceTo(after[i])>.1),'meshes must move WITH original Mixamo bone');
body.setVisible(false);assert(body.parts.every(x=>!x.visible));body.setVisible(true);assert(body.parts.every(x=>x.visible));body.dispose();assert(body.parts.every(x=>!x.parent));
console.log('PASS: native master skeleton driven, native joint attachments and '+skinSections.length+' smoothly weighted sections; '+body.parts.length+' pieces, arms animate, visibility and cleanup work.');
