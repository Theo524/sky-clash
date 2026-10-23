/* V76: regression for single idle/walking pose owner on a real VRM-style
 * normalized skeleton. The older bugs appeared at MOVEMENT HANDOFFS,
 * not while looping a single clip, so exercise both directions and attacks.
 */
const assert=require('assert'),THREE=require('../js/vendor/three.min.js');
const fs=require('fs'),path=require('path');
const V76=require('../js/v76-upper-body.js');
const ROOT=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const idle=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-fighting-idle-v1.json')));
const walk=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-walk-arms-v1.json')));
const I=new THREE.Quaternion();
assert.strictEqual(idle.asset.source,'boxing/Fighting Idle.fbx');
assert.strictEqual(idle.asset.frames,100);
assert.strictEqual(walk.asset.frames,32);
assert.deepStrictEqual(idle.asset.bones,walk.asset.bones);
assert.deepStrictEqual(idle.asset.bones,V76.BONES);
function testRig(){
 const scene=new THREE.Group(),map={};
 const make=(name,parent,pos)=>{
  const n=new THREE.Bone();n.name=name;n.position.set(...pos);
  parent.add(n);map[name]=n;return n;
 };
 const hips=make('hips',scene,[0,1,0]),spine=make('spine',hips,[0,.17,0]),
  chest=make('chest',spine,[0,.18,0]),uChest=make('upperChest',chest,[0,.1,0]);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const sh=make(side+'Shoulder',uChest,[sign*.15,.05,0]);
  const arm=make(side+'UpperArm',sh,[sign*.12,-.04,0]);
  const elbow=make(side+'LowerArm',arm,[sign*.29,-.01,0]);
  make(side+'Hand',elbow,[sign*.25,0,0]);
 }
 const rig={legacyAxes:true,vrm:{
  scene,humanoid:{getNormalizedBoneNode:n=>map[n]||null},
  update(){this.ticks=(this.ticks||0)+1;}}};
 const f={hp:100,vel:new THREE.Vector3(),vrmRig:rig,
  punchT:0,blastT:0,superHitT:0,stun:0,downT:0,
  flying:false,launched:false,spiked:false,dashing:false,
  sprinting:false,slamming:false,charging:false,blocking:false,
  v71Walk:{weight:0,clock:0},
  animate(){
   this.base=(this.base||0)+1;
   // Simulate the old procedural stance, which V76 MUST overwrite in both
   // standing and moving states instead of allowing it back at idle.
   for(const side of ['left','right']){
    map[side+'Shoulder'].quaternion.identity();
    map[side+'UpperArm'].quaternion.setFromAxisAngle(new THREE.Vector3(0,0,1),.24);
    map[side+'LowerArm'].quaternion.identity();
    map[side+'Hand'].quaternion.identity();
   }
  }};
 return {f,rig,map};
}
const status={mode:'loading',frames:0,originalWalkStyle:false};
const {f,rig,map}=testRig();
assert(V76.attach(THREE,f,idle,walk,status),'Unified controller installed once');
const frame=()=>f.animate(1/60);
for(let i=0;i<32;i++)frame();
assert(status.mode==='fighting-idle','Zero movement must run real Mixamo idle');
assert(status.frames===32,'Real clip must update every idle frame');
const pose=(n)=>map[n].quaternion.clone();
const idleUpper=pose('leftUpperArm'),idleElbow=pose('rightLowerArm');
assert(idleUpper.angleTo(I)>.20,'Idle upper arm must be driven by recorded pose, not T-pose');
assert(idleElbow.angleTo(I)>.20,'Idle fighting elbows must not remain procedural straight');
const idleBlend=f.v76UpperBody.transition;
assert(idleBlend>.99,'Idle clip must own the rig after initial smooth fade');
// Transition into walk through the same joint owner, not a second wrapper.
for(let i=0;i<24;i++){
 f.v71Walk.weight=Math.min(1,(i+1)/12);
 f.v71Walk.clock+=1/60;
 frame();
}
assert(status.mode==='walking');
const walkingUpper=pose('leftUpperArm');
assert(walkingUpper.angleTo(idleUpper)>.10,'Walking must differ from fighting idle');
assert(rig.vrm.ticks===56,'Mesh receives both idle and walking normalized bone updates');
// Transition from walk back to idle. The recorded idle must REMAIN active
// at zero walking blend; this was the V71–75 regression.
for(let i=0;i<28;i++){f.v71Walk.weight=Math.max(0,1-(i+1)/12);frame();}
assert(status.mode==='fighting-idle','Stopping must resume recorded fighting idle');
assert(f.v76UpperBody.transition>.99);
const stopped=pose('leftUpperArm');
assert(stopped.angleTo(walkingUpper)>.10,'Stop must not freeze the walk shoulder');
// V79: jumping/controlled flight must not snap arms into the procedural
// airborne guard on the very first frame.
f.jumping=true;frame();
assert.strictEqual(f.v76UpperBody.mode,'controlled-air');
assert(f.v76UpperBody.airWeight>.8);
const jumpPose=pose('leftUpperArm');
assert(jumpPose.angleTo(stopped)<.3,'Starting a jump should keep most of the grounded stance');
for(let i=0;i<9;i++)frame();
assert(f.v76UpperBody.airWeight>=.31&&f.v76UpperBody.airWeight<.7,
 'Hovering keeps some grounded Mixamo elbow bend instead of returning to rigid procedural arms');
f.jumping=false;frame();
assert(f.v76UpperBody.transition>0&&f.v76UpperBody.transition<.15,'Landing smoothly resumes the grounded pose');
for(let i=0;i<20;i++)frame();
const count=status.frames;
// Attacks should always win immediately, including arm/hand and wrist bones.
f.punchT=.3;frame();
assert.strictEqual(status.frames,count,'Recorded upper body must yield to attacks');
assert.strictEqual(f.v76UpperBody.transition,0,'Recover with eased return to recorded idle');
assert(map.leftUpperArm.quaternion.angleTo(new THREE.Quaternion().setFromAxisAngle(
 new THREE.Vector3(0,0,1),.24))<.0001,'Attack must use original combat pose');
f.punchT=0;
frame();
assert(f.v76UpperBody.transition>0&&f.v76UpperBody.transition<.25,
 'Returning to fighting idle must be blended, not snap instantly');
for(let i=0;i<27;i++)frame();
assert(status.mode==='fighting-idle'&&f.v76UpperBody.transition>.99);
assert(!status.error);
const boot=read('js/v66-game-boot.js'),page=read('index.html');
assert(boot.includes('SkyClashV76UpperBody.start(window)'));
assert(boot.includes('SkyClashPublishedGamePack.start(window)'),
 'User-published Studio actions still override only their assigned slots');
assert(!/^[ \t]*await window\.SkyClashV72Arms\.start\(window\);$/m.test(
 boot.slice(0,boot.indexOf("upperMode==='legacy'"))),
 'Do not attach two simultaneous default upper-body animators');
assert(/js\/v66-game-boot\.js\?v=\d{3,}/.test(page),'Keep versioned gameplay bootstrap');
console.log('PASS V76: full Mixamo fighting idle + walking, continuous ownership, skinned wrists, attack priority, eased recovery and no idle fallback');
