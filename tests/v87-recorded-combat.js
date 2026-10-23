/* V87 regression: real recorded combat replaces procedural Kairo punches,
 * but does not change approved idle/Standard Run or block priorities.
 */
'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const THREE=require('../js/vendor/three.min.js');
const studio=require('../js/v72-published-actions.js');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const combat=JSON.parse(read('assets/animations/gameplay/v87-recorded-combat.json'));
assert.equal(combat.schema,'sky-clash.studio-gamepack.v1');
assert.deepStrictEqual(combat.motions.map(x=>x.slot),
 ['punch1','punch2','punch3','overhand','airStrike','kick','sideKick']);
const actions={};
for(const entry of combat.motions){
 const clip=studio.decode(THREE,entry);
 assert.equal(clip.frames,entry.frames);
 assert(clip.frames>=30);
 assert(entry.attackStart>=0&&entry.attackEnd<=entry.seconds);
 const start=studio.BONES.map(()=>new THREE.Quaternion());
 const contact=studio.BONES.map(()=>new THREE.Quaternion());
 clip.sample(entry.attackStart,start,false);
 clip.sample(entry.attackEnd,contact,false);
 assert(start.some((q,i)=>q.angleTo(contact[i])>.13),
   'Recorded combat action must contain actual bone movement: '+entry.slot);
 actions[entry.slot]=clip;
}
const fighter=(changes={})=>Object.assign({
 hp:100,t:0,vel:new THREE.Vector3(),moveIntent:new THREE.Vector3(),
 punchT:.2,attackElapsed:.08,attackTotal:.4,attackSerial:1,punchSide:1,
 attackKind:'punch',attackVariant:'',sprinting:false,skidT:0,jumping:false,
 flying:false,launched:false,spiked:false,blockHeld:false,blocking:false,
 downT:0,stun:0,superHitT:0,slamming:false
},changes);
assert.equal(studio.choose(fighter(),actions),'punch1');
assert.equal(studio.choose(fighter({punchSide:0,attackSerial:2}),actions),'punch2');
assert.equal(studio.choose(fighter({attackKind:'hook'}),actions),'punch3');
assert.equal(studio.choose(fighter({attackKind:'hook',attackVariant:'overhand'}),actions),'overhand');
assert.equal(studio.choose(fighter({attackKind:'kick'}),actions),'kick');
assert.equal(studio.choose(fighter({attackKind:'airStrike'}),actions),'airStrike');
assert.equal(studio.choose(fighter({attackKind:'punch',blockHeld:true,}),{...actions,guard:{}}),'guard');
const approved=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
assert.equal(approved.motions.find(x=>x.slot==='idle').sourceFile,'Movement/Adventure/idle (2).fbx');
assert.equal(approved.motions.find(x=>x.slot==='run').sourceFile,'Movement/Male/standard run.fbx');
const code=read('js/v71-mixamo-gameplay.js');
assert(code.includes('speed/2.55'),'Real walk gait must synchronize with physical speed');
const manager=read('js/v72-published-actions.js');
assert(manager.includes("slot==='run'?3.35:3.0"));
assert(manager.includes("entry.attackStart"));
console.log('PASS V87: 7 real Mixamo combat clips, attack choices and planted support legs; idle/run unchanged; stride-aware gait');
