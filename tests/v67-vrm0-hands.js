// V67 regression: real Boy TBB glTF VRM0 bind finger measurements, not
// an arbitrary test mannequin. Native front is -Z; avatar flips to +Z.
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const THREE=require('../js/vendor/three.min.js');
const Fists=require('../js/v67-vrm0-hands.js');
const dir=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(dir,'src/30-character-models.js'),'utf8');
const init=fs.readFileSync(path.join(dir,'src/95-game.js'),'utf8');
const boot=fs.readFileSync(path.join(dir,'js/v66-game-boot.js'),'utf8');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
assert(html.includes('js/v67-vrm0-hands.js?v=670'),'hand code must precede startup');
assert(/js\/v66-game-boot\.js\?v=\d{3,}/.test(html),'Game boot script version should remain valid');
assert(boot.includes("get('hands')!=='original'"),'must support full rollback');
assert(src.includes('SkyClashVRM0Hands.configure(THREE, bone)'));
assert(src.includes("if (this.vroidHandPose) b[p + 'Hand'].quaternion.multiply(this.vroidHandPose[p]);"));
assert.strictEqual((init.match(/vroidHands:/g)||[]).length,2,'Kairo and rival use new hand rig, Rin does not');
const bones=new Map();
const make=n=>{const b=new THREE.Bone();b.name=n;bones.set(n,b);return b;};
for(const side of ['left','right']){
 for(const name of ['Index','Middle','Ring','Little'])
  for(const part of ['Proximal','Intermediate','Distal'])make(side+name+part);
 for(const part of ['ThumbProximal','ThumbIntermediate','ThumbDistal'])make(side+part);
}
const sign={left:-1,right:1};
const axes=Fists.configure(THREE,name=>bones.get(name));
assert(axes.applied>=30,'should bend all four fingers on both hands');
for(const side of ['left','right']){
 // Real Boy TBB model measurements: middle segment grows +/-X in VRM0.
 const indexOffset=side==='left'?-0.04339218:0.04339218;
 const original=new THREE.Vector3(indexOffset,0,0.00084301);
 const wrist=axes[side];
 const rotated=original.clone().applyQuaternion(wrist);
 assert(rotated.z<-.041,side+' VRM0 knuckles must aim to native -Z/front');
 // The root's VRM0 180° Y correction then points fists toward world +Z.
 const facing=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
 assert(rotated.clone().applyQuaternion(facing).z>.041);
 for(const part of ['Proximal','Intermediate','Distal']){
  const joint=bones.get(side+'Index'+part);
  const e=new THREE.Euler().setFromQuaternion(joint.quaternion);
  assert(Math.sign(e.y)===sign[side],side+' curl must be mirrored on local Y');
  assert(Math.abs(e.z)<1e-6,'VRM0 fingers must NOT fold about legacy Z');
 }
 for(const part of ['ThumbProximal','ThumbIntermediate','ThumbDistal']){
  const thumb=bones.get(side+part);
  assert(thumb.quaternion.angleTo(new THREE.Quaternion())<1e-6,'preserve natural VRoid thumb, avoid double-twisting it');
 }
}
console.log('PASS: V67 real Boy TBB VRM0 mirrored finger axes, forward fists and natural thumb bones; no Rin regression');
