/* V77 user-selected Animation Studio idle, published without replacing walk.
 * Production asset is copied from the actual uploaded Kairo Studio JSON.
 * Exercise 301-frame loop, source checksum, real runtime retarget and
 * priority over procedural idle but NEVER over active combat/air states.
 */
const assert=require('assert'),fs=require('fs'),path=require('path');
const {createHash}=require('crypto');
const THREE=require('../js/vendor/three.min.js');
const published=require('../js/v72-published-actions.js');
const root=path.join(__dirname,'..');
const pack=JSON.parse(fs.readFileSync(path.join(root,'assets/animations/gameplay/studio-actions-v1.json'),'utf8'));
assert.strictEqual(pack.schema,'sky-clash.studio-gamepack.v1');
assert.strictEqual(pack.revision,1);
assert.strictEqual(pack.motions.length,1,'Publish ONLY the selected idle; preserve installed walk/run/jump');
const entry=pack.motions[0];
assert.strictEqual(entry.character,'kairo');
assert.strictEqual(entry.slot,'idle');
assert.strictEqual(entry.sourceFile,'Movement/Adventure/idle (2).fbx');
assert.strictEqual(entry.frames,301);
assert.strictEqual(entry.fps,30);
assert.strictEqual(entry.seconds,10);
assert.strictEqual(entry.speed,1);
assert.strictEqual(entry.yaw,0);
const bytes=Buffer.from(entry.data,'base64');
assert.strictEqual(bytes.length,301*20*4*2);
assert.strictEqual(createHash('sha256').update(bytes).digest('hex'),
 'b77a87d0e288ac239b5edad60667600fd1722e54fa6241746c1156524b26b172',
 'The permanent published idle must exactly match the uploaded motion samples');
assert.deepStrictEqual(entry.bones,published.BONES,'No unsupported bones or hidden remapping');
const motion=published.decode(THREE,entry);
const output=()=>entry.bones.map(()=>new THREE.Quaternion());
const a=output(),b=output(),c=output();
motion.sample(0,a,true);motion.sample(2.5,b,true);motion.sample(10,c,true);
for(let i=0;i<a.length;i++){
 assert(a[i].angleTo(c[i])<.0001,entry.bones[i]+' looping must be seamless');
 assert(Math.abs(a[i].length()-1)<.001,'All quaternions must be normalized');
}
assert(a[9].angleTo(b[9])>.005,'Imported 10-second idle should actually animate hands');
const idleOnly={idle:motion};
function f(overrides={}){
 return Object.assign({hp:100,vel:new THREE.Vector3(),punchT:0,blastT:0,stun:0,
 flying:false,launched:false,spiked:false,dashing:false,sprinting:false,
 charging:false,blocking:false,blockHeld:false,slamming:false,downT:0,
 superHitT:0,acro:false},overrides);
}
assert.strictEqual(published.choose(f(),idleOnly),'idle');
for(const v of [
 {vel:new THREE.Vector3(0,0,2)},
 {stun:.3},{punchT:.3},{blastT:.3},{flying:true},{launched:true},
 {spiked:true},{dashing:true},{sprinting:true},{charging:true},
 {blocking:true},{blockHeld:true},{downT:1},{slamming:true},{superHitT:.2},
 {acro:true},{hp:0}
]){
 assert.strictEqual(published.choose(f(v),idleOnly),null,
  'Do not overwrite game combat/movement with unsupported idle: '+JSON.stringify(v));
}
// Ensure a normalized VRM copy can actually render the uploaded full body.
function fakeFighter(){
 const scene=new THREE.Group(),nodes={};
 const add=(n,parent,xyz)=>{const bone=new THREE.Bone();bone.name=n;bone.position.set(...xyz);
  parent.add(bone);nodes[n]=bone;return bone;};
 const hips=add('hips',scene,[0,1,0]),spine=add('spine',hips,[0,.14,0]);
 const chest=add('chest',spine,[0,.15,0]),upper=add('upperChest',chest,[0,.15,0]);
 const neck=add('neck',upper,[0,.1,0]);add('head',neck,[0,.1,0]);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const shoulder=add(side+'Shoulder',upper,[sign*.18,.08,0]);
  const arm=add(side+'UpperArm',shoulder,[sign*.12,-.04,0]);
  const fore=add(side+'LowerArm',arm,[sign*.26,0,0]);add(side+'Hand',fore,[sign*.2,0,0]);
  const upLeg=add(side+'UpperLeg',hips,[sign*.12,-.1,0]);
  const lowLeg=add(side+'LowerLeg',upLeg,[0,-.38,0]);
  add(side+'Foot',lowLeg,[0,-.39,0]);
 }
 const rig={legacyAxes:true,vrm:{scene,humanoid:{getNormalizedBoneNode:n=>nodes[n]||null},
  update(){this.skinUpdates=(this.skinUpdates||0)+1;}}};
 const fighter={...f(),vrmRig:rig,animate(){this.originalFrames=(this.originalFrames||0)+1;
   for(const bone of Object.values(nodes))bone.quaternion.identity();}};
 return {fighter,rig,nodes};
}
const {fighter,rig,nodes}=fakeFighter(),status={active:'none',frames:0};
const handle=published.attach(THREE,fighter,idleOnly,status);
assert(handle,'Publish idle should attach to real Kairo');
for(let i=0;i<24;i++)fighter.animate(1/60);
assert.strictEqual(status.active,'idle');
assert.strictEqual(status.frames,24);
assert(rig.vrm.skinUpdates>=24,'Real VRM skinned mesh must receive idle frames');
assert(nodes.leftLowerArm.quaternion.angleTo(new THREE.Quaternion())>.02,'Idle elbows must move the fighter skeleton');
assert(fighter.originalFrames===24,'Keep original engine runtime');
const frames=status.frames;
fighter.punchT=.3;fighter.animate(1/60);
assert.strictEqual(status.frames,frames,'Punch has priority over the published idle');
assert.strictEqual(handle.weight,0);
fighter.punchT=0;fighter.vel.z=3;
fighter.animate(1/60);
assert.strictEqual(handle.slot,null,'Walking must use already-published V71 recording, not idle');
fighter.vel.z=0;
fighter.animate(1/60);
assert.strictEqual(handle.slot,'idle','Return to the user's chosen recorded idle on stopping');
const game=fs.readFileSync(path.join(root,'js/v66-game-boot.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(game.includes("js/v72-published-actions.js?v=770"));
assert(html.includes('js/v66-game-boot.js?v=770'));
console.log('PASS: published exact 301-frame user idle, seamless 10s loop, skinned Kairo, jump/punch/block exclusion, preserved gameplay walks');
