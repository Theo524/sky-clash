/* V150: joystick-driven animated effort, no new physics or pose writer. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const clip=require('../js/v150-joystick-flight.js');
const owner=require('../js/v100-pose-authority.js');
const vertical=require('../js/v146-vertical-followthrough.js');
const omni=require('../js/v148-full-flight.js');
assert.equal(clip.version,150);
function move(x,z,locked=false,duration=1.4,fps=60,vx=x*6.2,vz=z*6.2){
 let s=clip.createState();
 for(let k=0;k<Math.round(duration*fps);k++)
  s=clip.step(s,x,z,vx,vz,0,locked,1/fps);
 return s;
}
const idle=move(0,0),forward=move(0,1),backLocked=move(0,-1,true),
 backFree=move(0,-1,false),right=move(1,0,true);
assert(forward.forward>.97&&forward.retreat<.01,'full forward stick leans forward');
assert(backLocked.retreat>.97,'only opponent lock-on authorizes retreat pose');
assert.equal(backFree.retreat,0,'free camera backwards input must TURN, never retreat');
assert(Math.abs(right.side)>.97,'signed strafe creates bank when locked');
assert(Object.values(clip.performance(idle,1.2)).every(v=>v===0),
 'no joystick input must preserve approved hover bit-for-bit');
const f=clip.performance(forward,1.2),
 b=clip.performance(backLocked,1.2),
 side=clip.performance(right,1.2);
assert(f.bodyF>.06&&f.chestF>.075,'hip and chest lean forward together');
assert(b.bodyF<0&&b.chestF<0,'locked retreat counterbalances');
assert(side.bodyS>.02&&side.chestS<-.015,'sideways bank');
assert(f.leftKnee>0&&f.leftShin>0&&f.leftHandF<0,
 'visible floating legs and trailing wrists contribute to forward travel');
const rising=clip.createState();
for(let k=0;k<9;k++)
 clip.step(rising,0,1,0,6.2,0,false,1/60);
assert(rising.forward>rising.legF&&rising.legF>rising.armF,
 'torso, then legs, then forearms react');
for(const fps of [30,60,120]){
 let s=move(0,1,false,1.1,fps),a=clip.performance(s,1.3);
 for(let k=0;k<Math.round(.34*fps);k++)s=clip.step(s,0,0,0,0,0,false,1/fps);
 assert(s.forward<.10&&s.legF<.16&&s.armF<.22,
  'recover to hover after stick release at '+fps);
 let z=clip.createState();
 for(let k=0;k<Math.round(.8*fps);k++)
  z=clip.step(z,0,1,0,6.2,0,false,1/fps);
 assert(Math.abs(clip.performance(z,1.2).bodyF-a.bodyF)<.03,
  'consistent timing at '+fps+'fps');
}
const neutralOmni=omni.createState();
const poseOld=owner.v149FlightPose(.8,0,0,1.3,vertical.createState(),neutralOmni);
const poseNew=owner.v150FlightPose(.8,0,0,1.3,vertical.createState(),neutralOmni,idle);
for(const key of Object.keys(poseOld.keys))
 assert.equal(poseNew.keys[key],poseOld.keys[key],
  'approved V149 idle body and V144 hover preserved: '+key);
for(const key of ['pelvisGoalF','pelvisGoalS','chestGoalF','chestGoalS','hipsX','hipsZ','spineX','spineZ','chestX','chestZ','neckX'])
 assert.equal(poseNew[key],poseOld[key],'approved V149 neutral torso: '+key);
const withForward=owner.v150FlightPose(.8,0,0,1.3,vertical.createState(),neutralOmni,forward);
assert(withForward.pelvisGoalF>poseOld.pelvisGoalF+.06&&
 withForward.chestGoalF>poseOld.chestGoalF+.07,'V100 actually composes full-body lean');
assert(withForward.keys.leftKnee>poseOld.keys.leftKnee,'suspended knee participates');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 authority=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 src=fs.readFileSync('src/45-fighter-controller.js','utf8'),
 built=fs.readFileSync('js/game.js','utf8');
assert(boot.includes("const BUILD='V153'"),'V151 release includes the V150 body system');
assert(boot.includes("flags.set('flightPreview','v152'"),
 'plain playable Sky Clash URL advances to V151 with V150 body underneath');
assert(boot.includes("await script('js/v150-joystick-flight.js?v=1500')"),
 'opt-in V150 loader present');
assert(authority.includes("if(['v146','v147','v148','v149','v150','v151','v152','v153'].includes"),
 'vertical follow-through must run in V149 and V150 real game loop');
assert(authority.includes("st.v150Motion=input.step("),
 'input overlay must advance in real runtime, not only isolated unit test');
assert(authority.includes("v150?'joystick-flight'"),
 'existing flight arm solver retains sole visible pose authority');
assert(!authority.includes('root.position.y+='),'no root bob/physics mutation');
assert(src.includes("const boost150 = this.characterId === 'kairo_venn'"));
assert(built.includes("const boost150 = this.characterId === 'kairo_venn'"),
 'generated playable bundle contains approved Kairo-only Boost preview');
assert(built.includes('0.29 + 0.08 * this.flightSpeedBlend'),
 'Boost is moderately leaned without horizontal Superman pitch');
console.log('PASS V150: joystick effort, free/lock retreat, legs/arms, controlled Boost, hover exact, 30/60/120fps');
