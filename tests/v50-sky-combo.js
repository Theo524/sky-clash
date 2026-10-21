const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const THREE = require(path.join(root, 'js/vendor/three.min.js'));
const V3 = THREE.Vector3, TAU = Math.PI * 2, scene = new THREE.Scene();
const damp = (r,dt)=>1-Math.exp(-r*dt), clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth01=x=>{x=clamp(x,0,1); return x*x*(3-2*x)};
const wrapAngle=a=>{a=(a+Math.PI)%TAU;if(a<0)a+=TAU;return a-Math.PI;};
const yawFromDir=(x,z)=>Math.atan2(x,z),lerpAngle=(a,b,t)=>a+wrapAngle(b-a)*t;
const fd=fs.readFileSync(root+'/src/00-foundation.js','utf8');
const TUNING=new Function('return '+fd.match(/const TUNING = (\{[\s\S]*?\n\});/)[1])();
const callouts=[];
const Game={player:null,enemy:null,mode:'battle',training:false,dojoRival:true,callout(...x){callouts.push(x)},hitStop(){},onPlayerHit(){},onGuardBreak(){}};
const Settings={get:()=>false};
const noop=()=>{};
const Effects={sprite:()=>new THREE.Sprite(new THREE.SpriteMaterial()),dust:noop,sprintTrail:noop,auraSpark:noop,bodyAura:noop,groundSlam:noop,chargePressure:noop,chargeFracture:noop,chargeSpark:noop,chargeFull:noop,awakenIgnition:noop,awakenCharge:noop,awakenBurst:noop,vanish:noop,ring:noop,flash:noop,sparks:noop,impact:noop,kickImpact:noop,launchTrail:noop};
const Spectacle={dashStart:noop,dashWake:noop,flightWake:noop,swing:noop,contact:noop,muzzle:noop,wake:noop,explosion:noop};
const CameraRig={shake:noop}; const Sound={play:noop}; const Combat={projectiles:[]};
const models=()=>({root:new THREE.Group(),blob:new THREE.Group()});
const Fighter=new Function('THREE','V3','TUNING','TAU','scene','Settings','Effects','Sound','Spectacle','Game','Combat','CameraRig','TEX','ARENA_RADIUS','CEILING','groundAt','buildFighterModel','damp','clamp','smooth01','yawFromDir','lerpAngle',fs.readFileSync(root+'/src/45-fighter-controller.js','utf8')+';return Fighter')(
THREE,V3,TUNING,TAU,scene,Settings,Effects,Sound,Spectacle,Game,Combat,CameraRig,{glow:new THREE.Texture()},62,34,()=>0,models,damp,clamp,smooth01,yawFromDir,lerpAngle);
const Comb=new Function('THREE','V3','TUNING','TAU','scene','Settings','Effects','Sound','Spectacle','Game','CameraRig','TEX','RivalAI','ARENA_RADIUS','groundAt','clamp','smooth01','Dojo','yawFromDir','lerpAngle',fs.readFileSync(root+'/src/60-combat.js','utf8')+';return Combat')(
THREE,V3,TUNING,TAU,scene,Settings,Effects,Sound,Spectacle,Game,CameraRig,{glow:new THREE.Texture()},{dodge:()=>false},62,()=>0,clamp,smooth01,{hitMelee:()=>false,hitBlast:()=>false},yawFromDir,lerpAngle);
Object.assign(Combat,Comb);
function simulate(step,me,foe,dt){for(let i=0;i<Math.ceil(step/dt);i++){me.update(dt);foe.update(dt)}}
function makePair(z=2.05) {
 const me=new Fighter('Kairo',{ki:0x44aaff,aura:0xffffff},new V3(0,0,0));
 const foe=new Fighter('Rival',{ki:0xff6600,aura:0xffffff},new V3(0,0,z));
 me.animate=foe.animate=noop;me.facing=0;foe.facing=Math.PI;me.t=foe.t=5;
 me.moveIntent.set(0,0,0.5);foe.moveIntent.set(0,0,0);
 Game.player=me; Game.enemy=foe;
 return [me,foe];
}
function awaitFree(me,foe,dt){let n=0;while((me.meleeCd>0.001 || me.punchT>0.001 || me.kickPend)&&n++<400){simulate(dt,me,foe,dt)}assert(n<400,'attack never recovered')}
for(const dt of [1/120,1/60,1/30]){
  const [me,foe]=makePair();me.combo=3;me.lastMelee=me.t;
  Combat.melee(me,foe);assert.equal(me.attackKind,'kick','last base beat remains rising kick');
  awaitFree(me,foe,dt);
  assert(foe.launched,`launcher must send opponent airborne at ${dt}`);
  assert.equal(me.comboFollow?.phase,1,'successful launcher offers an uppercut');
  const hp1=foe.hp;
  Combat.melee(me,foe);
  assert.equal(me.attackKind,'skyUppercut','next Melee should pursue with vertical fist');
  assert.equal(me.comboFollow,null,'follow window is consumed by an attempted move');
  awaitFree(me,foe,dt);
  assert(foe.hp<hp1,`sky uppercut should connect after actual physical pursuit at ${dt} meY=${me.pos.y} foeY=${foe.pos.y}`);
  assert.equal(me.comboFollow?.phase,2,`uppercut hit unlocks kick at ${dt}`);
  const hp2=foe.hp;
  Combat.melee(me,foe);
  assert.equal(me.attackKind,'skyKick','third air strike should be the kick');
  simulate(0.33,me,foe,dt);
  assert(foe.hp<hp2,`meteor kick needs to land at ${dt} me=${me.pos.toArray()} foe=${foe.pos.toArray()}`);
  assert(foe.spiked,`meteor kick should smash target downward at ${dt}`);
  assert.equal(me.comboFollow,null,'air finisher consumes follow window');
}
// Missed launch must not enable a follow-up; distant targets remain unhittable.
const [farMe,farFoe]=makePair(15);
farMe.combo=3;farMe.lastMelee=farMe.t;Combat.melee(farMe,farFoe);
simulate(1.1,farMe,farFoe,1/60);assert.equal(farMe.comboFollow,null);assert.equal(farFoe.hp,100);
// Defensive hit interrupts the opportunity rather than granting free immunity.
const [hurtMe,hurtFoe]=makePair();hurtMe.comboFollow={target:hurtFoe,phase:1,until:hurtMe.t+1};hurtFoe.launched=true;
hurtMe.stun=0.25;hurtMe.update(1/60);assert.equal(hurtMe.comboFollow,null);
console.log('V50 sky-combo: uppercut chase -> meteor kick, bounded range, interruption at 120/60/30 fps passed.');
