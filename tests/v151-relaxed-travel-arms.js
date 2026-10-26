/* V151 Kairo free-travel arms — signed intent, gradual release, guard restore,
 * periodic authored gestures, exact V150 rollback and pose ownership safety.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const arms=require('../js/v151-travel-arms.js');
const input=require('../js/v150-joystick-flight.js');
const owner=require('../js/v100-pose-authority.js');
const vertical=require('../js/v146-vertical-followthrough.js');
const omni=require('../js/v148-full-flight.js');
assert.equal(arms.version,151);
assert.equal(arms.duration,4.6);
assert.equal(arms.keys.length,8);
for(const k of arms.channels)
 assert.equal(arms.sample(0)[k],arms.sample(arms.duration)[k],
  'authored performance must loop seamlessly: '+k);
assert.notEqual(arms.sample(1.22).leftHandF,arms.sample(3.25).leftHandF,
 'travel arms genuinely change posture during the loop');
function move(x,z,locked=false,seconds=1.6,fps=60){
 let i=input.createState(),a=arms.createState();
 for(let frame=0;frame<Math.round(seconds*fps);frame++){
  i=input.step(i,x,z,x*6.2,z*6.2,0,locked,1/fps);
  a=arms.step(a,i,1/fps);
 }
 return {i,a};
}
const idle=move(0,0),forward=move(0,1),locked=move(0,1,true),
 retreat=move(0,-1,true),strafe=move(1,0),diagonal=move(.7,.7),
 half=move(0,.55);
assert.equal(idle.a.elbow,0,'hover arm keys must remain bit-identical to V150');
assert.equal(locked.a.elbow,0,'locked-on forward stays a combat-ready guard');
assert.equal(retreat.a.hand,0,'locked retreat never relaxes away from guard');
assert.equal(strafe.a.hand,0,'free sideways travel is not forward soaring');
assert(forward.a.elbow>.96&&forward.a.hand>.96,
 'forward travel naturally lowers shoulders, elbows and hands');
assert(diagonal.a.elbow>.05&&diagonal.a.elbow<forward.a.elbow,
 'diagonal travel partially softens arm guard');
assert(half.a.elbow>.15&&half.a.elbow<forward.a.elbow,
 'partial stick yields proportionate arm pose without popping');
for(const fps of [30,60,120]){
 const f=move(0,1,false,1.6,fps);
 assert(Math.abs(f.a.elbow-forward.a.elbow)<.015&&
  Math.abs(f.a.hand-forward.a.hand)<.025,
  'free-flight release timing consistent at '+fps+' fps');
 let i=f.i,a=f.a,prev=a.hand;
 for(let j=0;j<Math.round(.25*fps);j++){
  i=input.step(i,0,1,0,6.2,0,true,1/fps);
  a=arms.step(a,i,1/fps);
 }
 assert(a.hand<prev*.23&&a.elbow<.13,
  're-enter lock-on guard without abrupt snap at '+fps+' fps');
 i=move(0,1,false,1.6,fps).i;
 a=move(0,1,false,1.6,fps).a;
 for(let j=0;j<Math.round(.75*fps);j++){
  i=input.step(i,0,0,0,0,0,false,1/fps);
  a=arms.step(a,i,1/fps);
 }
 assert(a.elbow<.10&&a.hand<.18,
  'recover naturally to V150 hover after forward input release at '+fps);
}
const v=vertical.createState(),m=omni.createState();
const p0=owner.v150FlightPose(.8,0,0,1.3,v,m,idle.i);
const p1=owner.v151FlightPose(.8,0,0,1.3,v,m,idle.i,idle.a);
for(const k of Object.keys(p0.keys))
 assert.equal(p1.keys[k],p0.keys[k],'V150 neutral must be untouched: '+k);
for(const k of ['hipsX','hipsZ','spineX','spineZ','chestX','chestZ',
 'neckX','pelvisGoalF','pelvisGoalS','chestGoalF','chestGoalS'])
 assert.equal(p1[k],p0[k],'V151 must not change body: '+k);
for(const state of [locked,retreat,strafe]){
 const old=owner.v150FlightPose(.8,0,0,1.3,v,m,state.i),
  next=owner.v151FlightPose(.8,0,0,1.3,v,m,state.i,state.a);
 for(const k of Object.keys(old.keys))
  assert.equal(next.keys[k],old.keys[k],'lock/side preserves exact guard: '+k);
}
const oldF=owner.v150FlightPose(.8,0,0,1.3,v,m,forward.i),
 newF=owner.v151FlightPose(.8,0,0,1.3,v,m,forward.i,forward.a);
const changed=Object.keys(oldF.keys).filter(k=>newF.keys[k]!==oldF.keys[k]);
assert.deepEqual(changed.sort(),arms.channels.slice().sort(),
 'V151 changes only exactly the eight arm direction channels per side');
for(const side of ['left','right']){
 assert(newF.keys[side+'ElbowY']<oldF.keys[side+'ElbowY'],
  'elbows hang lower during free forward travel: '+side);
 assert(newF.keys[side+'HandF']<oldF.keys[side+'HandF'],
  'fists stop projecting like a boxing guard: '+side);
 assert(newF.keys[side+'HandY']<oldF.keys[side+'HandY'],
  'wrists ease down toward trailing relaxed silhouette: '+side);
 assert(newF.keys[side+'ElbowO']<.45,'no wide airplane upper arms');
}
const boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 authority=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 index=fs.readFileSync('index.html','utf8');
assert(boot.includes("flags.set('flightPreview','v152'"));
assert(boot.includes("const BUILD='V153'"));
assert(boot.includes("await script('js/v151-travel-arms.js?v=1510')"));
assert(boot.includes("await script('js/v150-joystick-flight.js?v=1500')"));
assert(index.includes('release=153'));
assert(authority.includes('v151?v151FlightPose(')&&
 authority.includes('st.v151Arms=arms.step(')&&
 authority.includes("v151?'soaring-arms'"),'actual V100 final pose writer owns V151');
assert(!authority.includes('root.position.y+='),'no gameplay/physics root mutations');
console.log('PASS V151: authored lowering, 30/60/120fps easing, V150 guard/hover exact, full-body and jump ownership protected');
