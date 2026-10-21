const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),THREE=require(path.join(root,'js/vendor/three.min.js'));
const V3=THREE.Vector3,TAU=Math.PI*2,scene=new THREE.Scene();
const damp=(r,dt)=>1-Math.exp(-r*dt),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth01=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const foundation=fs.readFileSync(root+'/src/00-foundation.js','utf8');
const TUNING=new Function('return '+foundation.match(/const TUNING = (\{[\s\S]*?\n\});/)[1])();
const events=[];
const Game={player:null,enemy:null,training:true,callout:s=>events.push(s),hitStop(){}};
const Settings={get:k=>false};
const Effects={sprite:()=>new THREE.Sprite(new THREE.SpriteMaterial()),dust(){},sprintTrail(){},auraSpark(){},bodyAura(){},groundSlam(){},chargePressure(){},chargeFracture(){},chargeSpark(){},chargeFull(){},awakenIgnition(){},awakenCharge(){},awakenBurst(){},vanish(){},ring(){},flash(){},sparks(){}};
const Spectacle={dashStart(){},dashWake(){},flightWake(){},swing(){}};
const CameraRig={shake(){}};
const buildFighterModel=()=>({root:new THREE.Group(),blob:new THREE.Group()});
const yawFromDir=(x,z)=>Math.atan2(x,z),lerpAngle=(a,b,t)=>a+(b-a)*t;
const fighterSrc=fs.readFileSync(root+'/src/45-fighter-controller.js','utf8');
const Fighter=new Function('THREE','V3','TUNING','TAU','scene','Settings','Effects','Sound','Spectacle','Game','Combat','CameraRig','TEX','ARENA_RADIUS','CEILING','groundAt','buildFighterModel','damp','clamp','smooth01','yawFromDir','lerpAngle',fighterSrc+';return Fighter')(
 THREE,V3,TUNING,TAU,scene,Settings,Effects,{play(){}},Spectacle,Game,{projectiles:[]},CameraRig,{glow:new THREE.Texture()},62,34,()=>0,buildFighterModel,damp,clamp,smooth01,yawFromDir,lerpAngle);
const f=new Fighter('tester',{ki:0x44aaff,aura:0xffffff},new V3());f.animate=()=>{}; Game.player=f;
assert.equal(f.stamina,100);assert(f.startRun());f.sprintHeld=true;f.moveIntent.set(0,0,1);
let steps=0;
while(!f.exhausted&&steps<1000){f.update(.016);steps++}
assert(f.exhausted,'boost should eventually exhaust regardless of KI refills');assert(steps<500);
assert(!f.sprinting,'exhaustion stops sprint');assert(!f.startRun(),'cannot restart while exhausted');
assert(f.stamina<=0.001);
let recovery=0;
while(f.exhausted&&recovery<1000){f.energy=100;f.update(.016);recovery++}
assert(!f.exhausted && f.stamina>=TUNING.staminaExhaustThreshold,'recover over threshold');
assert(f.startRun(),'rested fighter can sprint again');
f.sprinting=false;f.sprintHeld=false;f.moveIntent.set(0,0,0);f.dashCd=0;f.stun=0;f.energy=100;
f.update(2);
const before=f.stamina;assert(f.tryDash(new V3(0,0,1),0));assert.equal(f.stamina,before-TUNING.staminaDash);
const f2=new Fighter('aerial',{ki:0x44aaff,aura:0xffffff},new V3(0,7,0));f2.animate=()=>{};f2.moveIntent.set(0,0,1);f2.vert=.25;
for(let n=0;n<120;n++){f2.update(1/60);assert(Number.isFinite(f2.vel.x+f2.vel.y+f2.vel.z));assert(Number.isFinite(f2.pos.y));}
assert(f2.flying);
// Baked clip offsets/durations and quaternions are usable.
const animSrc=fs.readFileSync(root+'/src/40-recorded-animations.js','utf8');
const clipSrc=animSrc.slice(0,animSrc.indexOf('/* Drives one VRM fighter'));
const Anim=new Function('THREE','V3','clamp',clipSrc+';return Anim;')(THREE,V3,clamp);
for(const nm of ['qStandIdle','qGuardIdle','qGuardStep','qAirFloat','qOverhand']){
 const c=Anim.clip(nm);assert(c&&c.n>15&&c.d>0);
 const p=Anim.sample(nm,c.d*.5,true,Anim.pose());
 for(const q of p.q){const l=q.lengthSq();assert(l>0.90&&l<1.1,nm+' has a valid normalized quaternion')}
}
const html=fs.readFileSync(root+'/index.html','utf8');
for(const id of ['pSt','eSt','pStBar','eStBar'])assert(html.includes('id="'+id+'"'));
console.log('V47 stamina exhaustion / recovery / dash cost / flight / five retargeted clips and HUD passed.',{sprintSeconds:+(steps*.016).toFixed(2),restSeconds:+(recovery*.016).toFixed(2)});
// Third-beat variety: two consecutive four-hit chains must not repeat exactly.
const combatSrc=fs.readFileSync(root+'/src/60-combat.js','utf8');
const Comb=new Function('THREE','V3','TUNING','TAU','scene','Settings','Effects','Sound','Spectacle','Game','CameraRig','TEX','RivalAI','ARENA_RADIUS','groundAt','clamp','smooth01',combatSrc+';return Combat')(
 THREE,V3,TUNING,TAU,scene,Settings,Effects,{play(){}},Spectacle,Game,CameraRig,{glow:new THREE.Texture()},{dodge(){return false}},62,()=>0,clamp,smooth01);
const enemy={pos:new V3(0,0,2.1),hp:100};
const variants=[];
for(let combo=0;combo<2;combo++){
 for(let stage=0;stage<4;stage++){
   f.stun=f.meleeCd=f.punchT=f.downT=0;f.launched=false;f.t+=0.3;
   Comb.melee(f,enemy);
   if(stage===2)variants.push(f.attackVariant);
 }
}
assert.deepEqual(variants,['hook','overhand'],'third combo beat should vary by chain');
console.log('V47 alternating martial-arts combo third beats passed.',variants);
