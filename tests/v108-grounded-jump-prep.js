/* V108: tiny grounded pre-jump anticipation, not exaggerated or a second animator. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
for(const speed of [0,4.8,6.2]){
 for(const fps of [30,60,120]){
  let previous=V100.prepPose(0,speed);
  assert.equal(previous.bend,0,'no jump-pose teleport on input');
  for(let i=1;i<=Math.ceil(.095*fps);i++){
   const t=Math.min(.095,i/fps),next=V100.prepPose(t,speed);
   assert(next.bend>=previous.bend-1e-7,'knee compression must be monotonic');
   assert(next.bend<=1,'never exceed natural full weight shift');
   assert(Math.abs(next.kneeX)<=.155,'knee flex must be restrained (<9°)');
   assert(Math.abs(next.hipsY)<=.036,'pelvis drop must stay <=3.6 cm');
   assert(Math.abs(next.spineX)<=.074,'subtle torso load under 4.3°');
   for(const k of ['hipsY','hipsX','thighX','kneeX','ankleX','spineX','chestX','neckX'])
    assert(Math.abs(next[k]-previous[k])<.095,
     'no sudden joint movement at '+fps+'fps: '+k);
   previous=next;
  }
  assert(previous.bend>.55,'visible knee preload must finish before physics jump');
 }
}
assert(V100.prepPose(.095,0).bend>V100.prepPose(.095,6.2).bend,
 'moving jump needs a shallower load than static, not an exaggerated crouch');
const physics=read('src/45-fighter-controller.js'),
 owner=read('js/v100-pose-authority.js'),
 rig=read('src/30-character-models.js'),
 boot=read('js/v66-game-boot.js'),
 html=read('index.html');
assert(physics.includes("this.v108JumpPrepDuration=duration;this.v108JumpPrepT=duration;"),
 'actual input event must start 95ms buffered action');
assert(physics.includes("this.jumping=false;this.vel.y=0;"),
 'physics impulse must not happen at the beginning of the visual crouch');
assert(physics.includes("if(this.v108JumpPrepT>0)target.y=0;"),
 'holding jump/Up must NOT turn anticipation into immediate powered flight');
assert(physics.includes("this.vel.y=this.v108JumpPrepLaunchVy;"),
 'real original upward velocity resumes at release');
assert(physics.includes("if(this.v108JumpPrepT===0){"),'buffered jump must release once');
assert(physics.includes('if(cancel){this.v108JumpPrepT=0;'),
 'damage/dash/guard cancels buffered jump without surprise delayed hop');
assert(physics.includes("this.characterId==='kairo_venn'&&this.canFly"),
 'other characters and flight jumps must stay unchanged');
assert(physics.includes("this.pos.y<=this.floor+.025&&!this.sprinting"),
 'only ordinary grounded jump gets preparation');
assert(owner.includes("state==='prep'"));
assert(owner.includes("['subtle','readable','push'].includes("));
assert(owner.includes('plantVisibleSoles(THREE,this.vrmRig,this,status);'),
 'visible shoes must stay planted after the single final pose write');
assert(owner.includes("st.prepBase=visible.map(q=>q.clone());"));
assert(owner.includes("const p=prepPose(elapsed,st.prepSpeed,readable);"));
assert(rig.includes('const v108FinalPrep='));
assert(rig.includes('!v106FinalSoles&&!v108FinalPrep&&!this.f.flying'),
 'old procedural foot solver must yield only during new preview');
assert(boot.includes("e.src+='&anticipation=108'"),
 'physics and pose owner must refresh together in real game');
assert(boot.includes("V108 subtle")&&boot.includes("V109 readable"));
assert(boot.includes("'PREP'"));
assert(/SKY CLASH · BUILD V(10[8-9]|11[0-4])/.test(html));
assert(/js\/v66-game-boot\.js\?v=820&fix=(?:109|11[0-5])/.test(html));
assert(/BUILD V(10[8-9]|11[0-4])/.test(read('animation-studio.html')));
console.log('PASS V108: 30/60/120fps shallow 95ms grounded preparation, no other-character/flight effects, exact buffered original impulse and sole-grounded pose owner');
