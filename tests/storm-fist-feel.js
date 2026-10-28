/* Exercise the real combat/controller path; the V3 feel profile must never
 * alter baseline or Rin, create a whiff-confirm, or replay an old contact. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const prior={window:global.window,feel:global.AnimeFeelV165};
const windowState={location:{search:''},SkyClashPublishedActions:{nativeCombatSet:null}};
global.window=windowState;
const feel=new Function('window','URLSearchParams',
 fs.readFileSync('src/15-anime-feel-v165.js','utf8')+';return AnimeFeelV165;')(windowState,URLSearchParams);
global.AnimeFeelV165=feel;
const base=fs.readFileSync('tests/v49-moving-melee.js','utf8');
const fixture=base.slice(0,base.indexOf('const retreat=runCase('));
const {Fighter,Combat,Game,Effects,Sound,Spectacle,CameraRig}=new Function('require','__dirname',
 fixture+';return {Fighter,Combat,Game,Effects,Sound,Spectacle,CameraRig};')(require,__dirname);
const THREE=require('../js/vendor/three.min.js');
let feedback=[],stops=[];
Object.assign(Effects,{stormImpact(){feedback.push('storm');},impact(){feedback.push('legacy');},
 kickImpact(){feedback.push('legacy-kick');}});
Object.assign(Spectacle,{contactPoint:(a,b)=>b.center});
Object.assign(CameraRig,{strike(){},soundPan(){return 0;}});
Object.assign(Sound,{stormSwing(){},stormImpact(){}});
Game.hitStop=t=>stops.push(t);
function pair(revision,characterId='kairo_venn',distance=1.45){
 windowState.SkyClashPublishedActions.nativeCombatSet=revision?{revision}:null;
 const a=new Fighter('Kairo',{ki:0x44aaff,aura:0xffffff},new THREE.Vector3(0,0,0),characterId);
 const b=new Fighter('Rival',{ki:0xff6600,aura:0xffffff},new THREE.Vector3(0,0,distance),'kairo_venn');
 a.animate=b.animate=()=>{};a.facing=0;b.facing=Math.PI;a.t=b.t=12;a.lastMelee=12;
 Game.player=a;Game.enemy=b;feedback=[];stops=[];return [a,b];
}
function timing(revision,characterId){const [a,b]=pair(revision,characterId);Combat.melee(a,b);
 return [a.attackTotal,a.kickPend.t,a.meleeCd];}
try{
 assert.deepEqual(timing(null),timing('kung-fu-v2'),'Prior set keeps existing clock');
 assert.deepEqual(timing(null,'rin_sable'),timing('storm-fist-v3','rin_sable'),'Rin remains exact');
 assert.deepEqual(timing('storm-fist-v3'),[.55*.76,.24*.76,.55*.76]);
 for(const fps of [30,60,120]){
  const dt=1/fps,[a,b]=pair('storm-fist-v3');Combat.melee(a,b);
  const serial=a.attackSerial;
  while(a.attackElapsed<a.attackTotal*.60)a.update(dt);
  assert(b.hp<100,'The actual delayed strike connected');
  assert.equal(a.stormHitSerial,serial);
  Combat.melee(a,b,true);assert.equal(a.attackSerial,serial,'Contact alone does not skip recoil');
  while(a.attackElapsed<a.attackTotal*.78)a.update(dt);
  assert(feel.stormCanLink(a));
  Combat.melee(a,b);assert.equal(a.attackSerial,serial,'Unbuffered call cannot cancel recovery');
  Combat.melee(a,b,true);assert.equal(a.attackSerial,serial+1,'Buffered confirmed strike links');
  assert.equal(a.attackTotal,.55*.88,'Next cross has its own rhythm');
  assert(!feel.stormCanLink(a),'Previous hit cannot confirm the next attack');
  assert.deepEqual(feedback,['storm'],'Each contact emits one compact impact');
  assert.deepEqual(stops,[.026],'Jab has a brief deliberate hit-stop');
  const [miss,far]=pair('storm-fist-v3','kairo_venn',20);Combat.melee(miss,far);
  while(miss.attackElapsed<miss.attackTotal*.80)miss.update(dt);
  const missSerial=miss.attackSerial;Combat.melee(miss,far,true);
  assert.equal(miss.attackSerial,missSerial,'Whiff retains full recovery');
  assert.equal(far.hp,100);assert.deepEqual(feedback,[]);
  const [kick,victim]=pair('storm-fist-v3');kick.combo=3;Combat.melee(kick,victim);
  while(kick.kickPend)kick.update(dt);
  assert.deepEqual(feedback,['storm'],'Kick does not stack legacy impact bursts');
  assert.deepEqual(stops,[.066]);
  let remaining=.026,simulated=0;
  for(let i=0;i<fps;i++){simulated+=feel.stormStopStep(dt,remaining);remaining=Math.max(0,remaining-dt);}
  assert(Math.abs(simulated-(1-.026*.92))<1e-9,'Stop duration is independent of refresh rate');
 }
 console.log('PASS Storm Fist V3: scoped rhythm, input-confirmed links, whiff recovery, single impact and 30/60/120Hz hit-stop');
}finally{
 if(prior.window===undefined)delete global.window;else global.window=prior.window;
 if(prior.feel===undefined)delete global.AnimeFeelV165;else global.AnimeFeelV165=prior.feel;
}
