/* V95: physical joystick radius must select Standard Run only at the rim.
 * Retain V94's real quaternion pose handoff; never change Mixamo bone axes.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const analog=require('../js/v95-joystick-radius.js');
const actions=require('../js/v72-published-actions.js');
const trans=require('../js/v81-pose-transitions.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const previousLoc=globalThis.location,previousGame=globalThis.SkyClash,
      previousLab=globalThis.SkyClashMovementLab;
try{
 const params='?movementLab=step&stance=handoff&joystickRun=on&head=original';
 globalThis.location={search:params};
 globalThis.SkyClashMovementLab={version:89,enabled:true,joystickRun:true};
 assert.equal(analog.ENTER,.92);
 assert.equal(analog.EXIT,.80);
 assert.equal(analog.physicalRadius({x:.6,y:.8}),1);
 assert.equal(analog.physicalRadius({x:0,y:0}),0);
 assert.equal(analog.decide(false,.7),false);
 assert.equal(analog.decide(false,.91),false);
 assert.equal(analog.decide(false,.92),true);
 assert.equal(analog.decide(true,.83),true);
 assert.equal(analog.decide(true,.79),false);
 assert.equal(analog.decide(true,0),false);
 assert.equal(analog.decide(true,1,false),false);

 const f={hp:100,t:0,skidT:0,_v82WasBoost:false,
  vel:{x:0,y:0,z:6.2},moveIntent:{x:0,z:1},
  v89Step:{mode:'walk'},v95JoystickRun:false,v80AnalogRun:false,
  sprinting:false,jumping:false,flying:false,launched:false,spiked:false,
  dashing:false,blockHeld:false,blocking:false,charging:false,slamming:false,
  stun:0,downT:0,punchT:0,blastT:0,superHitT:0,landingMotionT:0,acro:null};
 globalThis.SkyClash={Game:{player:f,heroes:{kairo_venn:f}}};
 const slots={idle:{},run:{},boost:{},punch1:{}};
 assert.equal(actions.choose(f,slots),null,
   'Keyboard-only input remains the original V94 walking gait');
 f.v95JoystickRun=true;
 assert.equal(actions.choose(f,slots),'run','outer radius selects approved Standard Run');
 assert.equal(f.v80AnalogRun,true,'run must exclude competing walk-leg layer');
 f.v89Step.mode='first-step';
 assert.equal(actions.choose(f,slots),null,
   'approved V89 first step must finish before full body run starts');
 f.v89Step.mode='walk';f.v95JoystickRun=false;
 assert.equal(actions.choose(f,slots),null,'retreat from rim returns to walking');
 assert.equal(f.v80AnalogRun,false);
 f.v95JoystickRun=true;f.sprinting=true;
 assert.equal(actions.choose(f,slots),'boost',
  'holding Boost uses its own sprint animation, never Standard Run');
 f.sprinting=false;
 f.jumping=true;
 assert.equal(actions.choose(f,slots),null,
  'airborne does not continue full-radius grounded running');
 f.jumping=false;

 // Exact V94 THREE.Bone interpolation while WALK becomes RUN then WALK.
 // The old bug froze intermediate quaternions; this verifies that the
 // actual rendered upper arm rotates progressively in both directions.
 const names=['hips','spine','chest','upperChest','neck','head',
  'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
  'leftUpperLeg','leftLowerLeg','leftFoot',
  'rightUpperLeg','rightLowerLeg','rightFoot'];
 const scene=new THREE.Group(),nodes={};
 for(const name of names){nodes[name]=new THREE.Bone();scene.add(nodes[name]);}
 const vrm={scene,humanoid:{getNormalizedBoneNode:name=>nodes[name]||null},update(){}};
 const walkQ=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),.35);
 const runQ=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),1.8);
 const animated={hp:100,vrmRig:{vrm},vel:{x:0,y:0,z:4.8},
  moveIntent:{x:0,z:1},v80AnalogRun:false,
  animate(){for(const b of Object.values(nodes))
    b.quaternion.copy(this.v80AnalogRun?runQ:walkQ);}
 };
 const status={active:'waiting'};
 trans.attach(THREE,animated,status);
 const angle=q=>walkQ.angleTo(q);
 for(let i=0;i<20;i++)animated.animate(1/60);
 assert(angle(nodes.rightLowerArm.quaternion)<1e-4);
 animated.v80AnalogRun=true;animated.vel.z=6.2;
 const go=[];
 for(let i=0;i<16;i++){animated.animate(1/60);go.push(angle(nodes.rightLowerArm.quaternion));}
 assert(go[0]>.015&&go[0]<.35,'walk to run first frame interpolates, no teleport');
 assert(go[4]>go[0]&&go[4]<1.45,'walk to run progresses through real intermediate bone poses');
 assert(Math.abs(go.at(-1)-1.45)<.02,'run reaches the approved clip target');
 animated.v80AnalogRun=false;animated.vel.z=4.8;
 const back=[];
 for(let i=0;i<16;i++){animated.animate(1/60);back.push(angle(nodes.rightLowerArm.quaternion));}
 assert(back[0]<1.45&&back[0]>1,'run to walk first frame interpolates');
 assert(back[4]<back[0]&&back[4]>.1,'run to walk progresses rather than snaps');
 assert(back.at(-1)<.02);
 for(const arr of [go,back])
  assert(arr.slice(1).every((x,i)=>Math.abs(x-arr[i])<.35),
    'no single-frame jump during either walk/run transition');
 const original=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json')).motions;
 assert.equal(original.find(m=>m.slot==='idle').sourceFile,'Movement/Adventure/idle (2).fbx');
 assert.equal(original.find(m=>m.slot==='run').sourceFile,'Movement/Male/standard run.fbx');
 assert.equal(original.find(m=>m.slot==='run').frames,23);
 const input=read('src/95-game.js');
 assert(input.includes('SkyClashV95Joystick.physicalRadius(Input._stick)'),
  'physical joystick only; WASD must never look like outer-radius input');
 const physics=read('src/45-fighter-controller.js');
 assert(physics.includes('const normalSpeed=walkLab?4.8:TUNING.walkSpeed'));
 assert(physics.includes("this.v95JoystickRun&&!this.sprinting&&!this.flying?6.2:normalSpeed"));
 assert(read('js/v71-mixamo-gameplay.js').includes('this.v95JoystickRun&&'),
  'walking leg layer must yield to approved full-body run');
 const boot=read('js/v66-game-boot.js');
 assert(boot.includes("const joystickLab=handoffLab&&"));
 assert(boot.includes("if(joystickLab)await script('js/v95-joystick-radius.js?v=950')"));
 assert(boot.includes("e.src+='&fix=94'"),'must keep V94 exact pose blend');
 assert(boot.includes('if(stepLab)window.SkyClashWalkStep.start(window)'),
  'must keep approved V89 first-step foot contact');
 console.log('PASS V95: actual stick-radius hysteresis, WASD walk, original run/Boost, first step, real walk-to-run-to-walk quaternion handoff');
}finally{
 if(previousLoc===undefined)delete globalThis.location;else globalThis.location=previousLoc;
 if(previousGame===undefined)delete globalThis.SkyClash;else globalThis.SkyClash=previousGame;
 if(previousLab===undefined)delete globalThis.SkyClashMovementLab;else globalThis.SkyClashMovementLab=previousLab;
}
