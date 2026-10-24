/* V109: two independent opt-in fixes, with strict static-landing rollback. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
for(const speed of [0,4.8,6.2]){
 const old=V100.prepPose(.095,speed);
 const fresh=V100.prepPose(.14-.04*Math.min(1,speed/6.2),speed,true);
 assert(fresh.kneeX>old.kneeX*1.38,
  'readable knee preload must be more apparent than V108 at every speed');
 assert(fresh.duration>=.099&&fresh.duration<=.14);
 assert(fresh.kneeX<.29,'no superhero/exaggerated knee crouch');
 assert(Math.abs(fresh.hipsY)<.056,'short weight load, not a deep squat');
 assert(fresh.bend<=1,'bounded source expression');
 for(const fps of [30,60,120]){
  let prev=V100.prepPose(0,speed,true);
  const n=Math.ceil(fresh.duration*fps);
  for(let i=1;i<=n;i++){
   const p=V100.prepPose(Math.min(fresh.duration,i/fps),speed,true);
   for(const key of ['hipsY','hipsX','thighX','kneeX','ankleX','spineX','chestX','neckX']){
    assert(Math.abs(p[key]-prev[key])<.16,
     'no new 30/60/120fps joint snap in '+key);
   }
   assert(p.bend>=prev.bend-1e-7,'preload must not reverse mid-compression');
   prev=p;
  }
 }
}
for(const speed of [5,14]){
 for(const time of [0,.05,.10,.15,.205,.3,.48]){
  const original=V100.landingPlan(time,speed);
  const staticVersion=V100.landingPlan(time,speed,.48);
  assert.deepEqual(staticVersion,original,'static V106 landing must remain exactly identical');
  const flowing=V100.landingPlan(time*(".205"/.48),speed,.205);
  assert(Math.abs(flowing.sourceTime-original.sourceTime)<1e-9,
   'moving landing should reuse EXACT same authored contact arc, only shorter');
  assert(Math.abs(flowing.recover-original.recover)<1e-9,
   'moving recovery keeps the same knee-to-guard chronology');
 }
}
const formerMoving=6.2*(.48+.17),
 contactFlowDistance=6.2*(.205*.52+.09);
assert(contactFlowDistance<formerMoving*.35,
 'touchdown braking plus quicker gait should eliminate metres of idle-pose glide');
const physics=read('src/45-fighter-controller.js'),
 owner=read('js/v100-pose-authority.js'),
 boot=read('js/v66-game-boot.js'),
 html=read('index.html');
assert(physics.includes("window.location?.search?.includes('jumpPrep=readable')"));
assert(physics.includes("this.v108JumpPrepDuration=duration;this.v108JumpPrepT=duration"));
assert(physics.includes("this.v109LandingDuration=flow?.205:.48;"));
assert(physics.includes("if(flow){this.vel.x*=.52;this.vel.z*=.52;}"));
assert(physics.includes('hspeed>1.3&&!this.sprinting&&!this.dashing'));
assert(physics.includes('this.v109LandingSpeed=flow?hspeed:0'));
assert(owner.includes("get('landingMove')==='flow'"));
assert(owner.includes("st.movingFlow=flowFlag&&(fighter.v109LandingSpeed||0)>1.3"));
assert(owner.includes('st.movingFlow&&st.phase===\'landing\'?.090:.17'));
assert(owner.includes('landingPlan(st.elapsed,st.impactSpeed,st.landingDuration)'));
assert(owner.includes("const readable=new URLSearchParams(root.location?.search||'')"));
assert(boot.includes("e.src+='&groundflow=109'"));
assert(boot.includes("V109 readable")&&boot.includes('movingFlow'));
assert(html.includes('SKY CLASH · BUILD V109'));
assert(html.includes('js/v66-game-boot.js?v=820&fix=110'));
assert(read('animation-studio.html').includes('BUILD V109'));
console.log('PASS V109: restrained but visible 30/60/120fps standing preload, source-equivalent shorter moving contact, isolated physics damping and immutable V106 standing landing');
