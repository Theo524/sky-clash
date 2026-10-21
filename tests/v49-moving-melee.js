// Hit-confirm tests simulate the live movement branch and delayed contact frames,
// not just checking for hard-coded strings or generous range constants.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const THREE=require(path.join(root,'js/vendor/three.min.js'));
const V3=THREE.Vector3,TAU=Math.PI*2,scene=new THREE.Scene();
const damp=(r,dt)=>1-Math.exp(-r*dt),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth01=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const wrapAngle=a=>{a=(a+Math.PI)%TAU;if(a<0)a+=TAU;return a-Math.PI;};
const yawFromDir=(x,z)=>Math.atan2(x,z),lerpAngle=(a,b,t)=>a+wrapAngle(b-a)*t;
const fd=fs.readFileSync(root+'/src/00-foundation.js','utf8');
const TUNING=new Function('return '+fd.match(/const TUNING = (\{[\s\S]*?\n\});/)[1])();
const Game={player:null,enemy:null,mode:'battle',training:false,dojoRival:true,callout(){},hitStop(){},onPlayerHit(){},onGuardBreak(){}};
const Settings={get:()=>false};
const Effects={sprite:()=>new THREE.Sprite(new THREE.SpriteMaterial()),dust(){},sprintTrail(){},auraSpark(){},bodyAura(){},groundSlam(){},chargePressure(){},chargeFracture(){},chargeSpark(){},chargeFull(){},awakenIgnition(){},awakenCharge(){},awakenBurst(){},vanish(){},ring(){},flash(){},sparks(){},impact(){},kickImpact(){},launchTrail(){}};
const Spectacle={dashStart(){},dashWake(){},flightWake(){},swing(){},contact(){},muzzle(){},wake(){},explosion(){}};
const CameraRig={shake(){}};
const Sound={play(){}};
const Combat={projectiles:[]};
const models=()=>({root:new THREE.Group(),blob:new THREE.Group()});
const fighterSrc=fs.readFileSync(root+'/src/45-fighter-controller.js','utf8');
const Fighter=new Function('THREE','V3','TUNING','TAU','scene','Settings','Effects','Sound','Spectacle','Game','Combat','CameraRig','TEX','ARENA_RADIUS','CEILING','groundAt','buildFighterModel','damp','clamp','smooth01','yawFromDir','lerpAngle',fighterSrc+';return Fighter')(
 THREE,V3,TUNING,TAU,scene,Settings,Effects,Sound,Spectacle,Game,Combat,CameraRig,{glow:new THREE.Texture()},62,34,()=>0,models,damp,clamp,smooth01,yawFromDir,lerpAngle);
const combatSrc=fs.readFileSync(root+'/src/60-combat.js','utf8');
const Comb=new Function('THREE','V3','TUNING','TAU','scene','Settings','Effects','Sound','Spectacle','Game','CameraRig','TEX','RivalAI','ARENA_RADIUS','groundAt','clamp','smooth01','Dojo','yawFromDir','lerpAngle',combatSrc+';return Combat')(
 THREE,V3,TUNING,TAU,scene,Settings,Effects,Sound,Spectacle,Game,CameraRig,{glow:new THREE.Texture()},{dodge(){return false}},62,()=>0,clamp,smooth01,{hitMelee(){return false},hitBlast(){return false}},yawFromDir,lerpAngle);
Object.assign(Combat,Comb);
function runCase(label,{attacker=[0,0,0],enemy=[0,0,3.2],foeVel=[0,0,0],move=[0,0,0],stage=0,dt=1/120}){
 const me=new Fighter('Kairo',{ki:0x44aaff,aura:0xffffff},new V3(...attacker));
 const foe=new Fighter('Rival',{ki:0xff6600,aura:0xffffff},new V3(...enemy));
 me.animate=foe.animate=()=>{};me.facing=0;me.t=5;
 me.moveIntent.set(...move);foe.vel.set(...foeVel);
 Game.player=me;Game.enemy=foe;
 me.combo=stage; me.lastMelee=me.t; me.energy=100;
 const start=me.pos.clone();
 Combat.melee(me,foe);
 const contactedAt=me.kickPend.t;
 let health=foe.hp;
 for(let i=0;i<Math.ceil(0.184/dt);i++){
   // In flight tests the opponent actively rises or slides during anticipation.
   foe.pos.addScaledVector(new V3(...foeVel),dt);
   me.update(dt);
   if(foe.hp<health)health=foe.hp;
 }
 const travelled=Math.hypot(me.pos.x-start.x,me.pos.z-start.z);
 return {hit:health<100,hp:health,travelled,started:contactedAt,center:me.pos.toArray(),foe:foe.pos.toArray(),budget:me.attackTravelBudget};
}
const retreat=runCase('retreat',{enemy:[0,0,3.35],foeVel:[0,0,3.8],move:[0,0,1]});
const strafe=runCase('strafe',{enemy:[0,0,3.25],foeVel:[4.5,0,0],move:[1,0,0.15]});
const aerial=runCase('flight',{attacker:[0,6,0],enemy:[0,8.0,3.1],foeVel:[2.6,0.8,0],move:[0,0,0.6]});
const rising=runCase('rising',{attacker:[0,0,0],enemy:[0,2.0,2.8],foeVel:[0,0,0],move:[0,0,0.5]});
const far=runCase('far',{enemy:[0,0,12],foeVel:[0,0,0],move:[0,0,0]});
const sideMiss=runCase('sideMiss',{enemy:[10,0,1],move:[1,0,0]});
for(const [name,res] of Object.entries({retreat,strafe,aerial,rising}))assert(res.hit,`${name}: reachable moving attack missed ${JSON.stringify(res)}`);
for(const [name,res] of Object.entries({far,sideMiss}))assert(!res.hit,`${name}: should not auto-hit distant opponent ${JSON.stringify(res)}`);
for(const [name,res] of Object.entries({retreat,strafe,aerial,rising,far,sideMiss}))
 assert(res.travelled <= res.budget + 0.4 || name==='far' || name==='sideMiss',`${name}: pursuit moved beyond budget ${JSON.stringify(res)}`);
for (const dt of [1/60,1/30]) {
  for (const [name,opts] of Object.entries({
    retreat:{enemy:[0,0,3.35],foeVel:[0,0,3.8],move:[0,0,1]},
    strafe:{enemy:[0,0,3.25],foeVel:[4.5,0,0],move:[1,0,0.15]},
    aerial:{attacker:[0,6,0],enemy:[0,8.0,3.1],foeVel:[2.6,0.8,0],move:[0,0,0.6]},
    rising:{attacker:[0,0,0],enemy:[0,2.0,2.8],move:[0,0,0.5]}
  })) { const result=runCase(name,{...opts,dt}); assert(result.hit,`${name} missed at ${Math.round(1/dt)}fps: ${JSON.stringify(result)}`); }
}
console.log('V49 moving melee tests passed: retreat, strafe, aerial, rising, far/side limits at 120/60/30 fps.');
