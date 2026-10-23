/* V81: test source-accurate published Mixamo guard / superfast Boost /
 * upright landing and exclusive state ownership in the real adapter.
 * Also protect flight-down vs deliberate falling and smoothing fingers.
 */
const assert=require('assert'),fs=require('fs'),path=require('path');
const THREE=require('../js/vendor/three.min.js');
const published=require('../js/v72-published-actions.js');
const transition=require('../js/v81-pose-transitions.js');
const extras=require('../js/v79-extra-actions.js');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('assets/animations/gameplay/v81-recorded-actions.json'));
assert.strictEqual(data.schema,'sky-clash.studio-gamepack.v1');
assert.strictEqual(data.revision,1);
assert.deepStrictEqual(data.motions.map(x=>x.slot),['guard','boost','landing']);
const expected={
 guard:['Magic/Standing Block Idle.fbx',84,'e30915530accb636'],
 boost:['Magic/Standing Sprint Forward.fbx',18,'6b22be2dbc2ec003'],
 landing:['Magic/Standing Land To Standing Idle.fbx',34,'c60ce5544b177a76']
};
const actions={};
for(const clip of data.motions){
 assert.deepStrictEqual([clip.sourceFile,clip.frames,clip.sourceId],expected[clip.slot]);
 assert.deepStrictEqual(clip.bones,published.BONES);
 assert.strictEqual(Buffer.from(clip.data,'base64').length,clip.frames*20*4*2);
 actions[clip.slot]=published.decode(THREE,clip);
 const q=()=>Array.from({length:20},()=>new THREE.Quaternion());
 const a=q(),b=q();
 actions[clip.slot].sample(0,a,true);
 actions[clip.slot].sample(Math.min(.26,clip.seconds*.47),b,true);
 assert(a.some((v,i)=>v.angleTo(b[i])>.02),clip.slot+' must contain actual keyframe movement');
}
const old=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
assert.strictEqual(old.motions[0].sourceFile,'Movement/Adventure/idle (2).fbx',
 'The approved custom idle must remain completely intact');
assert.strictEqual(old.motions[1].sourceFile,'Movement/Male/standard run.fbx');
for(const clip of old.motions)actions[clip.slot]=published.decode(THREE,clip);
const base=(over={})=>Object.assign({
 hp:100,vel:new THREE.Vector3(),moveIntent:new THREE.Vector3(),
 jumping:false,flying:false,dropping:false,blockHeld:false,blocking:false,
 sprinting:false,dashing:false,slamming:false,charging:false,
 launched:false,spiked:false,downT:0,punchT:0,blastT:0,stun:0,
 superHitT:0,acro:null,landingMotionT:0
},over);
assert.strictEqual(published.choose(base(),actions),'idle');
assert.strictEqual(published.choose(base({blockHeld:true}),actions),'guard');
assert.strictEqual(published.choose(base({sprinting:true,vel:new THREE.Vector3(0,0,25)}),actions),'boost');
assert.strictEqual(published.choose(base({landingMotionT:.25}),actions),'landing');
assert.strictEqual(published.choose(base({flying:true,vel:new THREE.Vector3(0,-7,0)}),actions),null,
 'Flying downward is NOT an unpowered falling animation');
assert.strictEqual(published.choose(base({flying:true,dropping:true}),actions),null,
 'Falling idle remains owned exclusively by falling transition scheduler');
const fallingIdle={fallingIdle:{seconds:.8},fallToRoll:{seconds:1.7}};
const fly=base({flying:true,vel:new THREE.Vector3(0,-7,0)});
assert.strictEqual(extras.choose(fly,fallingIdle,.033),null,
 'Controlled Fly Down with negative velocity must stay a powered flight pose');
fly.dropping=true;
assert.strictEqual(extras.choose(fly,fallingIdle,.033),'fallingIdle',
 'Only genuine gravity fall from a flight cancel gets falling idle');
const scene=new THREE.Group(),nodes={};
function bone(name,p,xyz){
 const n=new THREE.Bone();n.name=name;n.position.set(...xyz);
 p.add(n);nodes[name]=n;return n;
}
const hip=bone('hips',scene,[0,1,0]),spine=bone('spine',hip,[0,.15,0]),
 chest=bone('chest',spine,[0,.13,0]),uchest=bone('upperChest',chest,[0,.1,0]),
 neck=bone('neck',uchest,[0,.1,0]);bone('head',neck,[0,.12,0]);
for(const side of ['left','right']){
 const v=side==='left'?1:-1;
 const sh=bone(side+'Shoulder',uchest,[v*.15,.03,0]);
 const arm=bone(side+'UpperArm',sh,[v*.12,0,0]);
 const fore=bone(side+'LowerArm',arm,[v*.24,0,0]);
 const hand=bone(side+'Hand',fore,[v*.2,0,0]);
 for(const finger of ['Index','Middle','Ring','Little']){
  const a=bone(side+finger+'Proximal',hand,[0,0,0]),
   b=bone(side+finger+'Intermediate',a,[0,0,0]);
  bone(side+finger+'Distal',b,[0,0,0]);
 }
 const up=bone(side+'UpperLeg',hip,[v*.12,-.1,0]),
  down=bone(side+'LowerLeg',up,[0,-.4,0]);
 bone(side+'Foot',down,[0,-.4,0]);
}
const rig={legacyAxes:true,vrm:{scene,
 humanoid:{getNormalizedBoneNode:n=>nodes[n]||null},
 update(){this.renders=(this.renders||0)+1;}}};
const fighter=base({
 vrmRig:rig,animate(){
  this.original=(this.original||0)+1;
  for(const b of Object.values(nodes))b.quaternion.identity();
  // Old procedural pose intentionally reaches toward a stiff T-pose.
  nodes.leftUpperArm.rotation.z=-.6;nodes.rightUpperArm.rotation.z=.6;
 }
});
const adapterStatus={frames:0,error:null};
const adapter=published.attach(THREE,fighter,actions,adapterStatus);
assert(adapter,'published full-body recorded action controller is attached');
const lastStatus={frames:0,error:null},owner=transition.attach(THREE,fighter,lastStatus);
assert(owner,'V81 last pose owner attached');
const frame=()=>fighter.animate(1/60);
for(let i=0;i<25;i++)frame();
assert.strictEqual(adapter.slot,'idle');
assert.strictEqual(lastStatus.active,'idle');
assert(owner.handGrip<.05,"Approved standing idle keeps the user's native hands");
fighter.blockHeld=true;
for(let i=0;i<22;i++)frame();
assert.strictEqual(adapter.slot,'guard','Guard must be a genuine Mixamo recording');
assert.strictEqual(lastStatus.active,'guard');
const guardCurl=nodes.leftIndexProximal.quaternion.angleTo(new THREE.Quaternion());
assert(guardCurl>.6,'Guard fingers MUST form a fist, not rigid open VRM palms');
fighter.blockHeld=false;
fighter.sprinting=true;fighter.vel.z=23;fighter.moveIntent.z=1;
for(let i=0;i<21;i++)frame();
assert.strictEqual(adapter.slot,'boost','Super-speed Boost has a separate recorded Mixamo clip');
assert.strictEqual(lastStatus.active,'boost');
assert(owner.handGrip>.65,'Boost arms keep compact natural fist shape');
fighter.sprinting=false;fighter.vel.z=0;fighter.moveIntent.z=0;
for(let i=0;i<22;i++)frame();
assert.strictEqual(adapter.slot,'idle');
fighter.flying=true;fighter.vel.y=0;
for(let i=0;i<18;i++)frame();
assert.strictEqual(lastStatus.active,'flight');
assert(owner.handGrip>.30&&owner.handGrip<.62,'Hovering palms are softly curled rather than robot straight');
fighter.vel.y=-5;
frame();
assert.strictEqual(lastStatus.active,'flight','Fly Down stays controlled hovering pose');
fighter.dropping=true;
frame();
assert.strictEqual(lastStatus.active,'fall','Double-tap hover release is a distinct falling state');
fighter.dropping=false;fighter.flying=false;fighter.vel.y=0;
fighter.landingMotionT=.48;
for(let i=0;i<19;i++)frame();
assert.strictEqual(adapter.slot,'landing','Normal grounded landing uses source recording');
assert.strictEqual(lastStatus.active,'landing');
fighter.punchT=.3;
frame();
assert.strictEqual(lastStatus.active,'attack');
assert.strictEqual(adapter.slot,null,'Attacks retain priority over landing');
assert(fighter.original>100&&rig.vrm.renders>100,'Real game VRM skin is updated');
assert(!adapterStatus.error&&!lastStatus.error);
const src=read('src/45-fighter-controller.js'),input=read('src/95-game.js'),
 boot=read('js/v66-game-boot.js');
assert(src.includes('dropFromFlight()'),'Flight must have explicit user-triggered exit');
assert(src.includes('this.dropping&&this.canFly'),'Flight exit must be real gravity, not freeze');
assert(src.includes('landingMotionT=.48'),'Actual landing state lasts long enough to see');
assert(src.includes('Math.max(TUNING.skidTime,0.42)'),'Ground Boost braking must be visible');
assert(input.includes('p.dropFromFlight?.()'),'Double-tap Fly Up must exit hover');
assert(boot.includes('SkyClashV81Transitions.start(window)'));
console.log('PASS V81: recorded guard, Boost and landing + smooth state ownership, fists, controlled Fly Down vs real falling, attack exclusion and existing idle/run');
