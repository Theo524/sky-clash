/* V73: Run actual VRMRig constructor and wrist update slices from source.
 * Unlike a static string check, this exercises the exact production pose code
 * with THREE quaternions and both hand chains, detecting 90° wrist mistakes.
 */
const assert=require('assert');
const fs=require('fs'),path=require('path');
const THREE=require('../js/vendor/three.min.js');
const legacy=require('../js/v67-vrm0-hands.js');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('src/30-character-models.js'),startup=read('js/v66-game-boot.js'),game=read('src/95-game.js');
const begin=src.indexOf('    this.studioHands = !!opts.studioHands;');
const end=src.indexOf('    this.blinkT = 2;',begin);
assert(begin>0&&end>begin,'V73 VRM hand constructor must be present');
const ctor=new Function('THREE','V3','bone','opts','window',src.slice(begin,end));
const start=src.indexOf('    m.arms.forEach((a, i) => {',end);
const after=src.indexOf('    m.legs.forEach((l, i) => {',start);
assert(start>0&&after>start,'V73 actual wrist motion code is present');
const updateWrist=new Function('m','b',src.slice(start,after));
const SIDES=['left','right'],FINGERS=['Index','Middle','Ring','Little'],
 SEGMENTS=['Proximal','Intermediate','Distal'];
function setup(opts){
 const fingers=new Map(),b={};
 for(const side of SIDES){
  b[side+'UpperArm']={quaternion:new THREE.Quaternion()};
  b[side+'LowerArm']={quaternion:new THREE.Quaternion()};
  b[side+'Hand']={quaternion:new THREE.Quaternion()};
  for(const f of FINGERS)for(const s of SEGMENTS)
   fingers.set(side+f+s,{quaternion:new THREE.Quaternion()});
  for(const s of ['ThumbMetacarpal','ThumbProximal','ThumbIntermediate','ThumbDistal'])
   fingers.set(side+s,{quaternion:new THREE.Quaternion()});
 }
 const axes=new THREE.Vector3(0,0,1),left=-Math.PI/2,right=Math.PI/2;
 const rig={cL:new THREE.Quaternion().setFromAxisAngle(axes,left),
   cR:new THREE.Quaternion().setFromAxisAngle(axes,right)};
 rig.cLi=rig.cL.clone().invert();rig.cRi=rig.cR.clone().invert();
 ctor.call(rig,THREE,THREE.Vector3,n=>fingers.get(n),opts,
  {SkyClashVRM0Hands:legacy});
 const part=()=>({sh:{quaternion:new THREE.Quaternion()},
   el:{quaternion:new THREE.Quaternion()},fist:{quaternion:new THREE.Quaternion()}});
 const model={arms:[part(),part()]};
 updateWrist.call(rig,model,b);
 return {rig,model,b,fingers};
}
// New Kairo mode: NO forced V67 wrist counter-rotations, and fingers/
// thumbs stay in the exact native VRM bind pose used by the successful Studio.
const clean=setup({studioHands:true,vroidHands:true});
assert(clean.rig.studioHands&&(!clean.rig.vroidHandPose));
for(const [name,part] of clean.fingers)
 assert(part.quaternion.angleTo(new THREE.Quaternion())<1e-6,
  name+' must match the original Studio VRM rest pose');
for(const side of SIDES)
 assert(clean.b[side+'Hand'].quaternion.angleTo(new THREE.Quaternion())<1e-6,
  side+' wrist must not contain an extra fixed 90 degree rotation');
// Genuine procedural attacks can rotate wrists without adding a constant twist.
clean.model.arms[1].fist.quaternion.setFromAxisAngle(
 new THREE.Vector3(1,0,0),.25);
updateWrist.call(clean.rig,clean.model,clean.b);
assert(Math.abs(clean.b.leftHand.quaternion.angleTo(new THREE.Quaternion())-.25)<.001,
 'In native mode procedural wrist rotation remains small, no 90° bias');
// Rollback: ?hands=legacy recreates the older 90° wrist and clenched fingers.
const old=setup({studioHands:false,vroidHands:true});
assert(old.rig.vroidHandPose?.applied>16,'legacy hand feature still available');
assert(Math.abs(old.b.leftHand.quaternion.angleTo(new THREE.Quaternion())-Math.PI/2)<.001);
assert(Math.abs(old.b.rightHand.quaternion.angleTo(new THREE.Quaternion())-Math.PI/2)<.001);
assert(old.fingers.get('leftIndexProximal').quaternion.angleTo(new THREE.Quaternion())>.9);
// Rin/old VRMs retain their old pose and aren't silently changed.
const rin=setup({studioHands:false,vroidHands:false});
assert(!rin.rig.vroidHandPose);
assert(rin.fingers.get('rightIndexProximal').quaternion.angleTo(new THREE.Quaternion())>.9);
assert.strictEqual((game.match(/studioHands:!!window\.SKY_V66_REAL_KAIRO/g)||[]).length,2,
 'Only the Kairo and Kairo-derived rival VRMs may use the new native hands');
assert(startup.includes("handMode!=='legacy'&&handMode!=='original'"),'User must have rollback');
assert(/await script\('js\/game\.js\?v=\d{3,}(?:&startup=\d+)?'\)/.test(startup),'Live game must load rebuilt source');
assert(/js\/v66-game-boot\.js\?v=\d{3,}/.test(read('index.html')),'Page must load new bootstrap');
console.log('PASS: V73 native VRM fingers/thumbs, neutral game wrists, procedural wrist action, old hand rollback, Rin isolation and live startup');
