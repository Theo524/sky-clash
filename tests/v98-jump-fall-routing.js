/* V98: the height-based 'flying' getter must not hide actual
 * recorded jump/fall motions during ordinary airborne physics.
 * Opt-in ?airLab=jump only: V94/V95/V97 locomotion remains untouched.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const published=require('../js/v72-published-actions.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const originalLocation=globalThis.location;
const pack=JSON.parse(read('assets/animations/gameplay/v86-ue5-converted-actions.json'));
const entries=Object.fromEntries(pack.motions.map(m=>[m.slot,m]));
assert.equal(entries.jump.sourceFile,'Mixamo_jump_up_mixamo_Motion.Fbx');
assert.equal(entries.fallingIdle.sourceFile,'Mixamo_falling_idle_mixamo_Motion.Fbx');
assert.equal(entries.landing.sourceFile,'Mixamo_Standing_Land_To_Standing_Idle_mixamo_Motion.Fbx');
const actions=Object.fromEntries(['jump','fallingIdle','floating','flying','landing','guard']
 .map(slot=>[slot,published.decode(THREE,entries[slot])]));
// Exercise the real height-based getter instead of faking a "flying" boolean.
// This is why prior choose() tests missed the conflict on live Kairo.
function fighter(){
 const f={hp:100,t:0,vel:{x:0,y:14,z:0},pos:{y:0},floor:0,
  moveIntent:{x:0,z:0},jumping:false,dropping:false,launched:false,spiked:false,
  sprinting:false,acro:null,landingMotionT:0,skidT:0};
 Object.defineProperty(f,'flying',{get(){return f.pos.y>f.floor+.25}});
 return f;
}
function useLab(on){
 globalThis.location={search:on?'?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump':
  '?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored'};
}
try{
 const f=fighter();
 f.jumping=true;f.pos.y=.8;
 assert(f.flying,'Kairo physically airborne even though only jumping');
 useLab(false);
 assert.equal(published.choose(f,actions),'floating',
  'reproduce old jump hidden by height-based flying');
 useLab(true);
 assert.equal(published.choose(f,actions),'jump',
  'recorded jump-up must take priority on actual takeoff');
 f.vel.y=0;
 assert.equal(published.choose(f,actions),'jump',
  'apex deadband should not flash the hovering pose');
 f.vel.y=-.9;
 assert.equal(published.choose(f,actions),'fallingIdle',
  'gravity descent must use the recorded falling pose');
 f.vel.y=-8;
 assert.equal(published.choose(f,actions),'fallingIdle');
 // Deliberate double-tap fly cancel must be gravity falling, even with
 // jumping=false and height-based flying=true.
 f.jumping=false;f.dropping=true;f.vel.y=-5;
 assert.equal(published.choose(f,actions),'fallingIdle',
  'fly-cancel is a gravity fall, not controlled hovering');
 // A deliberate hover or powered flight is preserved, as are flips.
 f.dropping=false;f.vel.y=0;
 assert.equal(published.choose(f,actions),'floating');
 f.vel.x=6;
 assert.equal(published.choose(f,actions),'flying');
 f.vel.x=0;f.jumping=true;f.acro={type:'flip'};f.vel.y=10;
 assert.equal(published.choose(f,actions),'floating',
  'special acrobatics keep the preexisting authority');
 f.acro=null;f.jumping=false;f.pos.y=0;f.vel.y=0;
 f.landingMotionT=.48;
 assert.equal(published.choose(f,actions),'landing',
  'at physical ground contact recorded landing gets priority');
 f.landingMotionT=0;f.pos.y=.8;f.launched=true;
 assert.equal(published.choose(f,actions),null,
  'damage/knockback must not become ordinary falling');
 f.launched=false;f.blockHeld=true;
 assert.equal(published.choose(f,actions),'guard',
  'combat guard must retain priority over jump/fall');
 f.blockHeld=false;f.jumping=true;
 const withoutFall={...actions,fallingIdle:null};
 f.vel.y=-4;
 assert.equal(published.choose(f,withoutFall),null,
  'missing motion asset must not fabricate a fallback flying pose');
 const approved=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json')).motions;
 assert.equal(approved.find(m=>m.slot==='idle').sourceFile,'Movement/Adventure/idle (2).fbx');
 assert.equal(approved.find(m=>m.slot==='run').sourceFile,'Movement/Male/standard run.fbx');
 const boot=read('js/v66-game-boot.js');
 assert(boot.includes("e.src+='&air=98'"),'opt-in must bust the V72 JS cache');
 assert(boot.includes("e.src+='&arm=97'"),'approved arm anchor must be preserved');
 assert(boot.includes("e.src+='&fix=94'"),'approved V94 handoff must be preserved');
 assert(boot.includes('js/v95-joystick-radius.js?v=950'),'approved V95 joystick stays installed');
 const bootVersion=read('index.html').match(/js[/]v66-game-boot[.]js[?]v=1520&fix=([0-9]+)/);
 assert(bootVersion&&Number(bootVersion[1])>=98,
  'GitHub Pages needs a refreshed boot cache revision');
 console.log('PASS V98: real height-trigger jump/fall routing and landing/flight/combat precedence; V94/V95/V97 intact');
}finally{
 if(originalLocation===undefined)delete globalThis.location;
 else globalThis.location=originalLocation;
}
