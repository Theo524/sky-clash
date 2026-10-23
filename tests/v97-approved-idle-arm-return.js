/* V97: the real V76 + V72 + V81 Kairo controllers must agree on the
 * approved idle elbows when joystick walking/running returns to standing.
 * V94 and V95 assets and gait implementation are left completely alone.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V76=require('../js/v76-upper-body.js');
const V72=require('../js/v72-published-actions.js');
const V81=require('../js/v81-pose-transitions.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const published=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
const entries=Object.fromEntries(published.motions.map(m=>[m.slot,m]));
assert.equal(entries.idle.sourceFile,'Movement/Adventure/idle (2).fbx');
assert.equal(entries.run.sourceFile,'Movement/Male/standard run.fbx');
const idle=V72.decode(THREE,entries.idle),run=V72.decode(THREE,entries.run);
const oldIdle=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-fighting-idle-v1.json')));
const walk=V76.decode(THREE,JSON.parse(read('assets/animations/gameplay/kairo-walk-arms-v1.json')));
const armNames=V76.BONES;
const original={location:globalThis.location,SkyClash:globalThis.SkyClash,
 SkyClashPublishedActions:globalThis.SkyClashPublishedActions,
 SkyClashUpperBody:globalThis.SkyClashUpperBody,
 SkyClashMovementLab:globalThis.SkyClashMovementLab};
function build({mode='anchored',withV76=true,withV81=true}={}){
 globalThis.location={search:'?movementLab=step&stance=handoff&joystickRun=on&idleArms='+mode};
 const scene=new THREE.Group(),bone={};
 const add=(name,parent,x=0,y=0,z=0)=>{
  const n=new THREE.Bone();n.name=name;n.position.set(x,y,z);
  parent.add(n);bone[name]=n;return n;
 };
 const hips=add('hips',scene,0,1),spine=add('spine',hips,0,.17),
  chest=add('chest',spine,0,.19),upper=add('upperChest',chest,0,.10),
  neck=add('neck',upper,0,.08);
 add('head',neck,0,.11);
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const shoulder=add(side+'Shoulder',upper,sign*.15,.04);
  const arm=add(side+'UpperArm',shoulder,sign*.15,-.025);
  const elbow=add(side+'LowerArm',arm,sign*.25);
  add(side+'Hand',elbow,sign*.22);
  const thigh=add(side+'UpperLeg',hips,sign*.11,-.12);
  const calf=add(side+'LowerLeg',thigh,0,-.42);
  add(side+'Foot',calf,0,-.43,.09);
 }
 const rig={legacyAxes:true,vrm:{scene,humanoid:{getNormalizedBoneNode:n=>bone[n]||null},update(){}}};
 const f={hp:100,t:0,name:'Kairo Venn',vrmRig:rig,
  pos:new THREE.Vector3(),vel:new THREE.Vector3(),
  moveIntent:new THREE.Vector3(),v89Step:{mode:'idle',scale:0},
  v71Walk:{weight:0,clock:0},v95JoystickRun:false,v80AnalogRun:false,
  sprinting:false,jumping:false,flying:false,dropping:false,
  launched:false,spiked:false,dashing:false,blockHeld:false,blocking:false,
  charging:false,slamming:false,stun:0,downT:0,punchT:0,
  blastT:0,superHitT:0,landingMotionT:0,acro:null,
  animate(){}
 };
 const upperStatus={ready:true,frames:0,originalWalkStyle:false},
   approvedStatus={ready:true,approvedIdle:idle,frames:0,active:'none'},
   transitionStatus={active:'ready'};
 globalThis.SkyClash={Game:{player:f,heroes:{kairo_venn:f}}};
 globalThis.SkyClashUpperBody=upperStatus;
 globalThis.SkyClashPublishedActions=approvedStatus;
 globalThis.SkyClashMovementLab={version:89,enabled:true,joystickRun:true};
 if(withV76)V76.attach(THREE,f,oldIdle,walk,upperStatus);
 V72.attach(THREE,f,{idle,run,boost:run},approvedStatus);
 if(withV81)V81.attach(THREE,f,transitionStatus);
 const pose=()=>armNames.map(name=>bone[name].getWorldQuaternion(new THREE.Quaternion()));
 const tick=(n,dt=1/60)=>{
  let biggest=0;
  for(let i=0;i<n;i++){
   const before=pose();
   f.t+=dt;
   f.v71Walk.clock+=dt*1.2;
   f.animate(dt);
   for(let j=0;j<before.length;j++)
    biggest=Math.max(biggest,before[j].angleTo(pose()[j]));
  }
  return biggest;
 };
 return {f,bone,pose,tick,upperStatus,approvedStatus,transitionStatus};
}
function compare(a,b){return Math.max(...a.map((q,i)=>q.angleTo(b[i])));}
try{
 const stable=build({mode:'anchored'});
 stable.tick(130);
 assert.equal(stable.upperStatus.idleSource,'approved-idle (2)');
 assert.equal(stable.upperStatus.anchoredIdle,true);
 assert(!stable.upperStatus.error&&!stable.approvedStatus.error&&!stable.transitionStatus.error);
 const resting=stable.pose();
 // V72 alone is the reference approved idle, not V76's fighting idle.
 const source=build({mode:'anchored',withV76:false,withV81:false});
 source.tick(130);
 const idleReference=source.pose();
 const differences=resting.map((q,i)=>({
  bone:armNames[i],degrees:(q.angleTo(idleReference[i])*180/Math.PI).toFixed(1)
 }));
 const comparison={
  differences,
  modes:[stable.upperStatus.mode,stable.approvedStatus.active,stable.transitionStatus.active],
  weights:[stable.upperStatus.walkWeight,stable.upperStatus.transition],
  bindMismatch:armNames.map((n,i)=>({
   bone:n,deg:(stable.f.v76UpperBody.bind[i].angleTo(
      stable.f.v72StudioPack.bind[V72.BONES.indexOf(n)])*180/Math.PI).toFixed(1)
  })),
  localQuaternions:armNames.map((n,i)=>({bone:n,
   stable:stable.bone[n].quaternion.toArray().map(x=>+x.toFixed(2)),
   source:source.bone[n].quaternion.toArray().map(x=>+x.toFixed(2))})),
  clipSamples:armNames.slice(0,4).map((n,i)=>({name:n,
   original:stable.f.v76UpperBody.approvedSamples[i+6].toArray().map(x=>+x.toFixed(2)),
   transformed:stable.f.v76UpperBody.idlePose[i].toArray().map(x=>+x.toFixed(2)),
   published:stable.f.v72StudioPack.samples[V72.BONES.indexOf(n)].toArray().map(x=>+x.toFixed(2)),
   reference:source.f.v72StudioPack.samples[V72.BONES.indexOf(n)].toArray().map(x=>+x.toFixed(2))
  })),
  basis:stable.f.v76UpperBody.approvedBasis.toArray().map(x=>+x.toFixed(2)),
  publishedWeight:source.f.v72StudioPack.weight
 };
 assert(compare(resting,idleReference)<.30,
  'V76 approved idle vs V72 actual: '+JSON.stringify(comparison));

 // Actual stopped Kairo: test multiple run/walk/stop cycles with realistic
 // initial 4.8 walk, 6.2 outer-radius run, then no joystick.
 for(let cycle=0;cycle<4;cycle++){
  // Use the same character across modes; do not reset its bones or animations.
  globalThis.SkyClash={Game:{player:stable.f,heroes:{kairo_venn:stable.f}}};
  globalThis.SkyClashUpperBody=stable.upperStatus;
  globalThis.SkyClashPublishedActions=stable.approvedStatus;
  stable.f.moveIntent.z=.42;stable.f.vel.z=2.0;
  stable.f.v89Step.mode='walk';stable.f.v71Walk.weight=.55;
  stable.tick(20);
  stable.f.moveIntent.z=1;stable.f.vel.z=6.2;
  stable.f.v95JoystickRun=true;stable.f.v80AnalogRun=true;
  stable.f.v71Walk.weight=0;
  stable.tick(35);
  stable.f.v95JoystickRun=false;stable.f.v80AnalogRun=false;
  stable.f.moveIntent.z=.40;stable.f.vel.z=2.1;
  stable.f.v71Walk.weight=.50;
  const runRelease=stable.tick(18);
  assert(runRelease<1.0,
   'running to walking must not violently lift an elbow on a single frame');
  stable.f.moveIntent.z=0;stable.f.vel.z=.05;
  stable.f.v89Step.mode='idle';stable.f.v71Walk.weight=0;
  const stop=stable.tick(100);
  assert(stop<.90,
   'stopping must not expose a raised-arm fighting pose in one frame');
  const recovered=stable.pose();
  assert(compare(recovered,idleReference)<.34,
   'after each stop all arms return to approved idle, not Fighting Idle');
 }
 assert(stable.upperStatus.idleSource==='approved-idle (2)');
 assert(!stable.upperStatus.error&&!stable.approvedStatus.error&&!stable.transitionStatus.error);

 // Preserve original V96 (steady) and V95 gait behavior unmodified.
 const v76=read('js/v76-upper-body.js');
 assert(v76.includes("armMode.get('idleArms')==='anchored'"));
 const v72=read('js/v72-published-actions.js');
 assert(v72.includes("armMode.get('idleArms')==='anchored'"));
 const boot=read('js/v66-game-boot.js');
 assert(boot.includes("e.src+='&arm=97'"));
 assert(boot.includes("e.src+='&fix=94'"));
 assert(boot.includes("if(joystickLab)await script('js/v95-joystick-radius.js?v=950')"));
 assert(boot.includes("if(stepLab)window.SkyClashWalkStep.start(window)"));
 const input=read('src/95-game.js');
 assert(input.includes('SkyClashV95Joystick.physicalRadius(Input._stick)'));
 console.log('PASS V97: real V76/V72/V81 approved idle arm match through four walk/run/stop cycles, V94 & V95 untouched');
}finally{
 for(const [key,value]of Object.entries(original)){
  if(value===undefined)delete globalThis[key];else globalThis[key]=value;
 }
}
