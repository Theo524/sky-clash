/* V78: targeted regressions for two real user-visible transitions:
 * 1) Start joystick walking after a published full-body idle without a
 *    one-frame arm jump to the built-in VRM stance.
 * 2) On Character jog/run has the same vertical hip movement as diagnostic,
 *    while X/Z travel stays locked and repeated frame seeking never drifts.
 */
const assert=require('assert'), fs=require('fs'), path=require('path');
const THREE=require('../js/vendor/three.min.js');
const bounce=require('../js/v78-studio-hip-bounce.js');
const game=require('../js/v72-published-actions.js');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=new THREE.Group(),parent=new THREE.Group();
parent.scale.set(1.4,2.2,.75);parent.rotation.y=.5;
const hip=new THREE.Bone();hip.position.set(0,1.1,0);source.add(hip);
source.updateMatrixWorld(true);
const firstY=hip.getWorldPosition(new THREE.Vector3()).y;
const sourceRig={wrap:source,hips:hip,previewHipBaseY:firstY};
const dst=new THREE.Group();dst.position.set(.5,0,.5);
dst.scale.set(1.4,2,1.3);
dst.rotation.y=-.3;dst.add(parent);
const vrmHip=new THREE.Bone();vrmHip.position.set(.04,.50,.07);parent.add(vrmHip);
dst.updateMatrixWorld(true);
const rest=new Map([['hips',{node:vrmHip,localPosition:vrmHip.position.clone()}]]);
const before=vrmHip.getWorldPosition(new THREE.Vector3());
assert.strictEqual(bounce.apply(THREE,sourceRig,rest).vertical,0);
hip.position.y+=.0836;source.updateMatrixWorld(true);
const a=bounce.apply(THREE,sourceRig,rest);
assert(a.applied&&Math.abs(a.vertical-.0836)<.00001,'Transfer measured +8.36cm jog peak exactly');
const after=vrmHip.getWorldPosition(new THREE.Vector3());
assert(Math.abs(after.y-before.y-.0836)<1e-5,'Character must bob the SAME height as FBX diagnostic');
assert(Math.abs(after.x-before.x)<1e-5&&Math.abs(after.z-before.z)<1e-5,'Preview must NOT drift horizontally');
bounce.apply(THREE,sourceRig,rest);
assert(after.distanceTo(vrmHip.getWorldPosition(new THREE.Vector3()))<1e-6,'Repeated frame must not accumulate root motion');
hip.position.y-=.14;source.updateMatrixWorld(true);
let result=bounce.apply(THREE,sourceRig,rest);
assert(Math.abs(result.vertical+ .0564)<.00001,'Jog downswing must follow source motion');
hip.position.y+=.0564;source.updateMatrixWorld(true);
bounce.apply(THREE,sourceRig,rest);
assert(vrmHip.position.distanceTo(rest.get('hips').localPosition)<.00001,'Returning to original frame returns hip bind position');
assert(!bounce.apply(THREE,{hips:hip},rest).applied,'Missing first-frame reference must safely disable');
const studioHTML=read('animation-studio.html'),studioJS=read('js/animation-studio.js'),
 preview=read('js/character-motion-preview.js');
assert(studioHTML.includes('js/v78-studio-hip-bounce.js?v=780'),'Load solver before the preview');
assert(studioHTML.includes('animation-studio.js?v=790'),'Refresh animation studio import');
assert(studioJS.includes('rig.previewHipBaseY=hips.getWorldPosition'),'Measure hip in post-scale world meters');
assert(preview.includes('SkyClashStudioHipBounce?.apply(T,sourceRig,current.rest)'));

// Actual published idle data and runtime transition with VRM skinned bones.
const pack=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
const idle=game.decode(THREE,pack.motions[0]),actions={idle};
const scene=new THREE.Group(),rigBone={};
const make=(n,p,xyz)=>{const b=new THREE.Bone();b.name=n;b.position.set(...xyz);p.add(b);rigBone[n]=b;return b;};
const hips=make('hips',scene,[0,1,0]),spine=make('spine',hips,[0,.14,0]),
 chest=make('chest',spine,[0,.15,0]),upper=make('upperChest',chest,[0,.15,0]),
 neck=make('neck',upper,[0,.1,0]);make('head',neck,[0,.12,0]);
for(const side of ['left','right']){
 const sign=side==='left'?1:-1,sh=make(side+'Shoulder',upper,[sign*.16,.06,0]),
 arm=make(side+'UpperArm',sh,[sign*.13,0,0]),fore=make(side+'LowerArm',arm,[sign*.25,0,0]);
 make(side+'Hand',fore,[sign*.23,0,0]);
 const leg=make(side+'UpperLeg',hips,[sign*.12,-.08,0]),knee=make(side+'LowerLeg',leg,[0,-.4,0]);
 make(side+'Foot',knee,[0,-.35,0]);
}
const fallbackArm=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-.55);
const f={hp:100,vel:new THREE.Vector3(),punchT:0,blastT:0,superHitT:0,stun:0,
 downT:0,slamming:false,dashing:false,sprinting:false,acro:false,blocking:false,blockHeld:false,
 charging:false,spiked:false,launched:false,flying:false,
 vrmRig:{vrm:{scene,humanoid:{getNormalizedBoneNode:n=>rigBone[n]||null},
 update(){}}},
 animate(){for(const n of Object.values(rigBone))n.quaternion.identity();
  // Simulate the previously exposed V76 built-in fighting stance.
  rigBone.leftUpperArm.quaternion.copy(fallbackArm);
  rigBone.rightUpperArm.quaternion.copy(fallbackArm);
 }};
const status={frames:0};
const state=game.attach(THREE,f,actions,status);
assert(state,"Actual game stack accepts the user's idle clip");
for(let i=0;i<25;i++)f.animate(1/60);
assert(state.weight>.95&&state.slot==='idle','Standing idle fully owns the pose');
const publishedArm=rigBone.leftUpperArm.quaternion.clone();
const publishedWeight=state.weight;
// First joystick frame: don't snap to fallbackArm.
f.vel.z=3.4;f.animate(1/60);
assert(state.releasingIdle,'Moving away from idle must begin a recorded pose fade');
assert(state.slot===null,'No idle action should own the locomotion slot');
assert(state.weight>publishedWeight*.6,'First walking frame must keep most of previous pose');
const firstWalkingArm=rigBone.leftUpperArm.quaternion.clone();
assert(firstWalkingArm.angleTo(publishedArm)<publishedArm.angleTo(fallbackArm)*.5,
 'First joystick frame must stay closer to the published idle than old fallback');
for(let i=0;i<25;i++)f.animate(1/60);
assert(state.weight<.06,'Old idle must release completely when moving');
f.vel.z=0;f.animate(1/60);
assert(state.slot==='idle'&&!state.releasingIdle,'Stopping must restore published idle');
f.punchT=.5;f.animate(1/60);
assert(state.slot===null&&state.weight===0,'Combat must immediately own all arm/wrist joints');
const boot=read('js/v66-game-boot.js'),gameHTML=read('index.html');
assert(boot.includes('js/v72-published-actions.js?v=790'),'Game must load new motion handoff');
assert(gameHTML.includes('js/v66-game-boot.js?v=790'),'Game HTML must refresh cache');
console.log('PASS V78: 8.36cm run hip bounce without drift + smooth published idle joystick release + full combat isolation');
