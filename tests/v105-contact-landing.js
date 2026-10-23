/* V105 actual impact-driven landing timeline: no second animation owner. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const authority=require('../js/v100-pose-authority.js');
const ue5=JSON.parse(read('assets/animations/gameplay/v86-ue5-converted-actions.json'));
const clips=Object.fromEntries(ue5.motions.map(e=>[e.slot,e]));
assert(clips.fallingToLanding,'source catalog contains authored fall-to-contact recording');
assert.equal(clips.fallingToLanding.sourceFile,'Mixamo_falling_to_landing_mixamo_Motion.Fbx');
assert.equal(clips.fallingToLanding.fps,30);
assert(clips.fallingToLanding.seconds>1,'complete recording is not a tiny synthetic pose');
assert(read('js/v72-published-actions.js').includes("'landing','fallingToLanding','runStop'"),
 'UE5 sample must be available in the SAME existing V72 decoded motion set');
assert(read('src/45-fighter-controller.js').includes('const v105PreContactVy=this.vel.y;'));
assert(read('src/45-fighter-controller.js').includes('this.v105ImpactSpeed=Math.max(0,-v105PreContactVy);'));
assert(read('src/45-fighter-controller.js').includes("this.characterId==='kairo_venn'"));
assert(read('src/45-fighter-controller.js').includes('this.v105ContactSerial='));
const api=authority.landingPlan;
for(const fps of [30,60,120]){
 let last=api(0,14);
 assert.equal(last.phase,'contact');
 assert.equal(last.recover,0);
 for(let i=1;i<=Math.ceil(.48*fps);i++){
  const now=api(Math.min(.48,i/fps),14);
  assert(now.sourceTime>=last.sourceTime-.000001,'recorded knee-absorption clock cannot reverse');
  assert(now.recover>=last.recover-.000001,'recovery weight cannot flicker');
  assert(now.arms>=last.arms-.000001,'guard restoration must be monotonic');
  assert(now.sourceTime<clips.fallingToLanding.seconds);
  last=now;
 }
 assert.equal(last.recover,1,'full V97 guard must be restored');
 assert.equal(last.phase,'settled');
 assert.equal(last.arms,1,'both approved arms fully restored');
}
assert(api(.05,12).phase==='contact');
assert(api(.14,12).phase==='absorb');
assert(api(.30,12).phase==='recover');
assert(api(.47,12).phase==='settled');
assert(api(.17,16).sourceTime>api(.17,4).sourceTime,
 'harder physical landing absorbs more of the authored knee-bend motion');
assert.equal(api(.48,5).recover,api(.48,16).recover,
 'impact strength may not change final standing pose');
const boot=read('js/v66-game-boot.js');
assert(boot.includes("e.src+='&landing=105'"),
 'compiled game, motion decoder and owner must all refresh atomically');
assert(boot.includes("src.includes('js/game.js')")&&
 boot.includes("src.includes('v72-published-actions')")&&
 boot.includes("src.includes('v100-pose-authority')"));
assert(boot.includes('LAND: V100 UNCHANGED')&&boot.includes('V105 CONTACT PREPARING'),
 'rollback and opt-in test status remain visibly distinguishable');
const html=read('index.html');
assert(html.includes('SKY CLASH · BUILD V105'));
assert(html.includes('js/v66-game-boot.js?v=820&fix=106'));
assert(read('animation-studio.html').includes('BUILD V105'));
console.log('PASS V105: real 30Hz falling/contact Mixamo clip, impact-sensitive monotonic 30/60/120fps recovery, preserved V100 rollback and coordinated cache');
