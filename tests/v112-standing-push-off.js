/* V112: visible grounded anticipation, not cosmetic hip translation. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const V100=require('../js/v100-pose-authority.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const close=(a,b,eps=1e-9)=>assert(Math.abs(a-b)<eps);
for(const speed of [0,4.8,6.2]){
 const moving=Math.min(1,speed/6.2);
 const duration=.215-.10*moving;
 let previous=V100.prepPose(0,speed,'push');
 close(previous.bend,0);
 close(previous.shoulderX,0);
 const snapMax={thigh:0,knee:0,hip:0};
 for(const fps of [30,60,120]){
  previous=V100.prepPose(0,speed,'push');
  for(let k=1;k<=Math.ceil(duration*fps);k++){
   const p=V100.prepPose(Math.min(duration,k/fps),speed,'push');
   assert(p.bend>=0&&p.bend<=1,'bounded load');
   assert(p.duration>=.114&&p.duration<=.216,'no excess input delay');
   const thigh=Math.abs(p.thighX-previous.thighX);
   const knee=Math.abs(p.kneeX-previous.kneeX);
   const hip=Math.abs(p.hipsY-previous.hipsY);
   snapMax.thigh=Math.max(snapMax.thigh,thigh);
   snapMax.knee=Math.max(snapMax.knee,knee);
   snapMax.hip=Math.max(snapMax.hip,hip);
   assert(thigh<.28&&knee<.53&&hip<.036,
    'avoid sudden excessive 30fps knee/hip motion');
   for(const name of ['hipsX','spineX','chestX','neckX','shoulderX','upperArmX'])
    assert(Math.abs(p[name]-previous[name])<.10,'torso/arms should not snap: '+name);
   previous=p;
  }
 }
 const loaded=V100.prepPose(duration*.76,speed,'push');
 const beginRelease=V100.prepPose(duration*.84,speed,'push');
 const released=V100.prepPose(duration,speed,'push');
 const old=V100.prepPose(duration*.76,speed,true);
 assert(loaded.kneeX>old.kneeX*(speed===0?2.3:1.05),
  'standing load must be substantially more leg-compressed than V109');
 assert(released.kneeX<loaded.kneeX*.90,
  'short pre-impulse extension must start BEFORE feet leave floor');
 assert(beginRelease.bend<=loaded.bend+.00001);
 const legDrop=.42*(1-Math.cos(loaded.thighX))+
     .43*(1-Math.cos(loaded.thighX+loaded.kneeX));
 const horizontalShift=Math.abs(.42*Math.sin(loaded.thighX)+
     .43*Math.sin(loaded.thighX+loaded.kneeX));
 if(speed===0){
  assert(duration>.20,'standing preload needs roughly 13+ sixty-hertz frames');
  assert(legDrop>.062,'standing body must truly LOWER by over 6cm with planted feet');
  assert(horizontalShift<.028,'shoes should not slide across floor during knee compression');
  assert(Math.abs(loaded.shoulderX)>.035,'arm load must be perceptible');
 }
 if(speed>=6.2){
  assert(duration<.12,'moving jump keeps fast input response');
  assert(legDrop<.032,'moving run-up remains shallower than standing prep');
 }
 assert(loaded.kneeX<.83,'natural athletic knee bend, not dramatic superhero crouch');
 assert(loaded.hipsY>-.081,'no exaggerated fake pelvis translation');
}
// Earlier test-approved profiles remain numerically identical.
for(const speed of [0,4.8,6.2]){
 const m=Math.min(1,speed/6.2);
 for(const t of [0,.02,.06,.08,.12,.14]){
  for(const [profile,readable,duration] of [['subtle',false,.095],['readable',true,.14-.04*m]]){
   const p=V100.prepPose(t,speed,readable);
   const bend=(x)=>{const a=Math.max(0,Math.min(1,x));return a*a*(3-2*a);};
   const expected=bend(Math.min(t,duration)/(readable?duration*.83:.08))*
     (1-(readable?.23:.36)*m);
   close(p.bend,expected);
   close(p.kneeX,p.bend*(readable?.285:.155));
   close(p.shoulderX,0);close(p.upperArmX,0);
  }
 }
}
const physics=read('src/45-fighter-controller.js'),
 owner=read('js/v100-pose-authority.js'),
 rig=read('src/30-character-models.js'),
 boot=read('js/v66-game-boot.js');
assert(physics.includes("window.location?.search?.includes('jumpPrep=push')"));
assert(physics.includes("const duration=push?.215-.10*Math.min(1,speed/6.2):"));
assert(physics.includes('this.v108JumpPrepLaunchVy=this.vel.y'));
assert(physics.includes('this.jumping=false;this.vel.y=0'));
assert(physics.includes('this.vel.y=this.v108JumpPrepLaunchVy'));
assert(owner.includes("const push=readable==='push'"));
assert(owner.includes("st.pushReleaseHipY=previous==='prep'"));
assert(owner.includes("st.prepLastHipY=st.nodes[0].position.y"));
assert(owner.includes("if(state==='jump'&&st.pushReleaseHipY!==null)"));
assert(owner.includes("hips.position.y=st.pushReleaseHipY+"));
assert(rig.includes("window.location?.search?.includes('jumpPrep=push')"));
assert(boot.includes("e.src+='&push=112'"));
assert(boot.includes('V112 load & push'));
assert(read('index.html').match(/SKY CLASH · BUILD V11[2-5]/));
assert(read('index.html').match(/js\/v66-game-boot\.js\?v=1530&fix=11[3-6]/));
assert(read('animation-studio.html').match(/BUILD V11[2-5]/));
console.log('PASS V112: real 6cm+ stationary leg shortening, planted shoe horizontal stability, pre-jump release, unchanged V108/V109 and fast moving jump at 30/60/120fps');
