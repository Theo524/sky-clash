/* V96: random idle gestures must not raise hands during joystick movement.
 * This uses the real V79 chooser across 90 seconds of simulated gameplay,
 * plus the published source keyframes showing Adventure Idle's arm lift.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const extra=require('../js/v79-extra-actions.js');
const adapter=require('../js/v72-published-actions.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const actions={idle3:{seconds:3.25},idleAdventure:{seconds:4},
 idle4:{seconds:2.56},idle5:{seconds:2.25},fallingIdle:{seconds:1}};
function fighter(){
 return {name:'Kairo Venn',hp:100,t:0,vel:{x:0,y:0,z:.18},
  moveIntent:{x:0,z:.12},pos:{y:0},floor:0,
  sprinting:false,flying:false,jumping:false,dropping:false,
  launched:false,spiked:false,slamming:false,downT:0,
  punchT:0,blastT:0,superHitT:0,stun:0,
  blocking:false,blockHeld:false,dashing:false,
  charging:false,landingMotionT:0,acro:null};
}
const prevLoc=globalThis.location,prevGame=globalThis.SkyClash,
 prevPub=globalThis.SkyClashPublishedActions;
try{
 const original=fighter();
 globalThis.SkyClash={Game:{heroes:{kairo_venn:original},player:original}};
 globalThis.location={search:'?movementLab=step&stance=handoff&joystickRun=on'};
 const offered=new Set();
 for(let i=0;i<1800;i++){
  original.t+=.08;
  const slot=extra.choose(original,actions,.08);
  if(slot?.startsWith('idle'))offered.add(slot);
 }
 assert(offered.size>0,
  'reproduce random optional idle while the thumbstick is barely tilted');

 const steady=fighter();
 globalThis.SkyClash={Game:{heroes:{kairo_venn:steady},player:steady}};
 globalThis.location={search:'?movementLab=step&stance=handoff&joystickRun=on&idleArms=steady'};
 for(let i=0;i<1800;i++){
  steady.t+=.08;
  assert.equal(extra.choose(steady,actions,.08),null,
   'no unsolicited raising of hands during low-radius steering');
 }
 // It must also remain steady when standing still. The approved
 // original idle (2) still runs in V72; only V79 variants are disabled.
 steady.vel.z=0;steady.moveIntent.z=0;
 for(let i=0;i<1100;i++)
  assert.equal(extra.choose(steady,actions,.08),null,
   'no unsolicited idle gesture even after waiting for the timer');

 // Air/falling motions are NOT deactivated by the arm fix.
 steady.jumping=true;steady.dropping=true;steady.vel.y=-4;
 assert.equal(extra.choose(steady,actions,.04),'fallingIdle',
  'falling action remains playable');
 for(let i=0;i<12;i++)
  assert.equal(extra.choose(steady,actions,.04),'fallingIdle',
   'non-idle timed actions must not be cancelled each frame');
 steady.dropping=false;steady.jumping=false;steady.vel.y=0;
 assert.equal(extra.choose(steady,actions,.04),null,
  'fall action ends normally when Kairo becomes grounded');

 const pack=JSON.parse(read('assets/animations/gameplay/extra-actions-v1.json'));
 const raising=pack.motions.find(m=>m.slot==='idleAdventure');
 assert(raising&&raising.frames>60);
 const clip=adapter.decode(THREE,raising);
 const bones=adapter.BONES;
 const at0=bones.map(()=>new THREE.Quaternion()),
  sample=bones.map(()=>new THREE.Quaternion());
 clip.sample(0,at0,false);
 let maxShoulder=0;
 for(let n=0;n<raising.frames;n+=2){
  clip.sample(n/30,sample,false);
  for(const side of ['leftShoulder','rightShoulder']){
   const idx=bones.indexOf(side);
   maxShoulder=Math.max(maxShoulder,at0[idx].angleTo(sample[idx]));
  }
 }
 assert(maxShoulder>1.2,
  'Adventure Idle must reproduce the high-arm source (>68deg from its rest)');
 const approved=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json')).motions;
 assert.equal(approved.find(m=>m.slot==='idle').sourceFile,
  'Movement/Adventure/idle (2).fbx');
 assert.equal(approved.find(m=>m.slot==='run').sourceFile,
  'Movement/Male/standard run.fbx');
 const boot=read('js/v66-game-boot.js');
 assert(boot.includes("e.src+='&idle=96'"),
  'new optional gesture layer must refresh browser cache');
 assert(boot.includes("const steadyArmLab=joystickLab&&"));
 assert(boot.includes("if(joystickLab)await script('js/v95-joystick-radius.js?v=950')"),
  'unchanged V95 physical thumbstick detection');
 assert(boot.includes("e.src+='&fix=94'"),
  'unchanged V94 interpolation fix');
 const originalInput=read('src/95-game.js');
 assert(originalInput.includes('SkyClashV95Joystick.physicalRadius(Input._stick)'));
 console.log('PASS V96: reproduced random Adventure Idle; disabled only Kairo idle variants during joystick preview, preserved approved idle/run, air/fall, V94 and V95');
}finally{
 if(prevLoc===undefined)delete globalThis.location;else globalThis.location=prevLoc;
 if(prevGame===undefined)delete globalThis.SkyClash;else globalThis.SkyClash=prevGame;
 if(prevPub===undefined)delete globalThis.SkyClashPublishedActions;else globalThis.SkyClashPublishedActions=prevPub;
}
