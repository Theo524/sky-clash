/* V154 Boost — data-only authored pose, one existing V72 Boost writer.
 * Target tests cover 30/60/120 FPS, transition and gameplay isolation.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const boost=require('../js/v154-boost-performance.js');
assert.equal(boost.version,154);
function sim(fps,flying,seconds=1.4){
 const s=boost.createState(),f={
  characterId:'kairo_venn',hp:100,sprinting:true,stun:0,
  punchT:0,charging:false,blockHeld:false,blocking:false,
  flying,vel:{x:0,y:0,z:22},t:0
 };
 for(let i=0;i<Math.round(seconds*fps);i++){
  f.t=i/fps;boost.step(s,f,1/fps);
 }
 return {s,f};
}
for(const fps of [30,60,120]){
 const ground=sim(fps,false),air=sim(fps,true);
 assert(ground.s.ground>.99&&ground.s.air===0);
 assert(air.s.air>.99&&air.s.ground===0);
 assert(boost.groundMix(ground.s)>.6&&boost.groundMix(ground.s)<.63);
 assert(boost.boostRate(22)>1&&boost.boostRate(22)<1.20);
 const pose=boost.airPose(air.s,air.f);
 assert.equal(pose.profile,'V153 streamlined whole-body forward flight');
 assert(pose.streamlineWeight>.99&&pose.keys.leftElbowF<-.8&&
  pose.keys.rightHandF<-.8);
 assert(pose.keys.leftShin>=0&&pose.keys.rightShin>=0);
 // Immediately drop sprint: target gone, smoothly return to earlier
 // owner. No latent animation when stunted, blocking or knocked down.
 ground.f.sprinting=false;air.f.sprinting=false;
 for(let i=0;i<Math.round(.5*fps);i++){
  boost.step(ground.s,ground.f,1/fps);
  boost.step(air.s,air.f,1/fps);
 }
 assert(ground.s.ground<.003&&air.s.air<.004,
  'released Boost must settle in half a second, '+fps);
}
const s=boost.createState(),f={hp:100,sprinting:true,
 flying:false,vel:{x:0,y:0,z:18},blockHeld:true};
boost.step(s,f,1/60);
assert.equal(s.ground,0,'block state cannot energize Boost pose');
assert.equal(boost.groundMix(null),0);
const owner=fs.readFileSync('js/v72-published-actions.js','utf8'),
 boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 core=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 registry=fs.readFileSync('src/05-character-registry.js','utf8');
assert(owner.includes("this.characterId==='kairo_venn'"));
assert(owner.includes("boostMode==='v154'?root.SkyClashV154Boost"),
 'preserve explicit V154 rollback when V155 is enabled');
assert(owner.includes('v154Run:BONES.map'));
assert(owner.includes('run.sample(phase*dstSpan,state.v154Run,true)'));
assert(owner.includes('owner.v137CorrectPelvisBalance(')&&
 owner.includes('owner.v136CorrectSuspendedTorso(')&&
 owner.includes('owner.v128CorrectFlightLegs(')&&
 owner.includes('owner.v129CorrectFlightGuard('));
assert(!boost.toString?.includes?.('fighter.animate ='));
assert(!fs.readFileSync('js/v154-boost-performance.js','utf8').includes('fighter.animate='));
assert(core.includes('if(f.dropping)return')&&
 core.includes('if(f.jumping)return'));
assert(boot.includes("await script('js/v154-boost-performance.js?v=1540')"));
assert(registry.includes('doubleJump: false')&&registry.includes('doubleJump: true'));
console.log('PASS V154: phase-aligned grounded sprint, streamlined air Boost, 30/60/120fps, Kairo-only rollback');
