/* V65: original anime fighter model on the V64/V63 native humanoid. */
const assert=require('assert');
const THREE=require('../js/vendor/three.min.js');
const Anime=require('../assets/characters/master/anime-kairo.js');
const Master=require('../assets/characters/master/model.js');
const bones=new Map(),root=new THREE.Group();
root.scale.setScalar(.01);
function bone(name,parent,x,y,z){
 const b=new THREE.Bone();b.name='mixamorig:'+name;b.position.set(x,y,z);
 (parent||root).add(b);bones.set(name.toLowerCase(),b);return b;
}
const hips=bone('Hips',null,0,0,0);
const spine=bone('Spine',hips,0,14,0);
const spine1=bone('Spine1',spine,0,15,0);
const spine2=bone('Spine2',spine1,0,15,0);
const neck=bone('Neck',spine2,0,18,0);
const head=bone('Head',neck,0,10,0);bone('HeadTop_End',head,0,22,0);
for(const side of ['Left','Right']){
 const sign=side==='Left'?1:-1;
 const sh=bone(side+'Shoulder',spine2,sign*15,0,0);
 const arm=bone(side+'Arm',sh,sign*8,-6,0);
 const elbow=bone(side+'ForeArm',arm,sign*16,-21,17);
 const hand=bone(side+'Hand',elbow,-sign*14,25,15);
 ['Index','Middle','Ring','Pinky'].forEach((f,i)=>bone(side+'Hand'+f+'1',hand,(i-1.5)*2,-7,3));
 const upper=bone(side+'UpLeg',hips,sign*14,-8,0);
 const knee=bone(side+'Leg',upper,0,-43,0);
 const foot=bone(side+'Foot',knee,0,-41,0);
 bone(side+'ToeBase',foot,0,-7,10);
}
assert(Anime.check(bones).valid);
assert(Master.check(bones).valid);
const kairo=Anime.create(THREE,bones,root);
assert.strictEqual(kairo.source,'anime-original-native-bones');
assert.strictEqual(kairo.variant,'kairo');
assert(kairo.parts.length>=70,'new anime skin should have detailed facial/clothing pieces');
const skinned=kairo.parts.filter(x=>x.isSkinnedMesh);
assert(skinned.length>=14,'skinned elbows, torso and knees must deform on real bones');
for(const m of skinned){
 assert.strictEqual(m.skeleton.bones.length,2);
 const wi=m.geometry.getAttribute('skinWeight'),ind=m.geometry.getAttribute('skinIndex');
 assert(wi&&ind&&wi.count===ind.count);
 for(let i=0;i<wi.count;i+=Math.max(1,Math.floor(wi.count/11))){
  assert(Math.abs(wi.getX(i)+wi.getY(i)-1)<1e-5);
 }
}
assert(kairo.parts.some(x=>x.name==='V65_anime-eye'),'face and large eyes are authored');
assert(kairo.parts.some(x=>x.name==='V65_spiky-crown'),'spiky anime hair is authored');
assert(kairo.parts.some(x=>x.name==='V65_scarf-tail-right'),'scarf is authored');
assert(kairo.parts.some(x=>x.name==='V65_skin_upper-arm-left'),'elbow skin is authored');
root.updateMatrixWorld(true);
const glove=kairo.parts.find(x=>x.name==='V65_boxing-glove'&&x.parent===bones.get('lefthand'));
assert(glove,'glove must attach to native animated hand');
const before=glove.getWorldPosition(new THREE.Vector3());
bones.get('leftarm').rotation.x+=.65;root.updateMatrixWorld(true);
const after=glove.getWorldPosition(new THREE.Vector3());
assert(before.distanceTo(after)>.04,'anime glove follows Mixamo arm rotation');
assert(kairo.parts.every(x=>x.parent),'all skin components remain connected');
kairo.setVisible(false);assert(kairo.parts.every(x=>!x.visible));
kairo.setVisible(true);assert(kairo.parts.every(x=>x.visible));
const rival=Anime.create(THREE,bones,root,{rival:true});
assert.strictEqual(rival.variant,'rival');
const hairA=kairo.parts.find(x=>x.name==='V65_hair-cap');
const hairB=rival.parts.find(x=>x.name==='V65_hair-cap');
assert.notStrictEqual(hairA.material.color.getHex(),hairB.material.color.getHex(),'rival must look different');
rival.dispose();kairo.dispose();
assert(kairo.parts.every(x=>!x.parent));
assert(rival.parts.every(x=>!x.parent));
console.log('PASS: V65 independent anime fighters, native mesh deformation, correct moving hands, editable reversible skin and distinct rival');
