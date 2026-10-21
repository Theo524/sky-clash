const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const THREE=require(path.join(root,'js/vendor/three.min.js'));
const V3=THREE.Vector3,TAU=Math.PI*2,scene=new THREE.Scene();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),damp=(r,dt)=>1-Math.exp(-r*dt);
const smooth01=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const wrapAngle=a=>{a=(a+Math.PI)%TAU;if(a<0)a+=TAU;return a-Math.PI};
const yawFromDir=(x,z)=>Math.atan2(x,z),lerpAngle=(a,b,t)=>a+wrapAngle(b-a)*t;
const fd=fs.readFileSync(root+'/src/00-foundation.js','utf8');
const TUNING=new Function('return '+fd.match(/const TUNING = (\{[\s\S]*?\n\});/)[1])();
const CharacterRegistry=new Function(fs.readFileSync(root+'/src/05-character-registry.js','utf8')+';return CharacterRegistry;')();
const calls=[];
const Game={mode:'fight',training:false,dojoRival:true,player:null,enemy:null,callout:(...args)=>calls.push(args),hitStop:()=>{},onPlayerHit:()=>{},onGuardBreak:()=>{}};
const Settings={get:()=>false},noop=()=>{};
const tex=new THREE.Texture(),TEX={glow:tex,smoke:tex};
const Effects={sprite:()=>new THREE.Sprite(new THREE.SpriteMaterial()),dust:noop,sprintTrail:noop,auraSpark:noop,bodyAura:noop,groundSlam:noop,meteorCrater:(...args)=>calls.push(['crater',...args]),chargePressure:noop,chargeFracture:noop,chargeSpark:noop,chargeFull:noop,awakenIgnition:noop,awakenCharge:noop,awakenBurst:noop,vanish:noop,ring:noop,flash:noop,sparks:noop,impact:noop,kickImpact:noop,launchTrail:noop,trail:noop};
const Spectacle={dashStart:noop,dashWake:noop,flightWake:noop,swing:noop,contact:noop,muzzle:noop,wake:noop,explosion:noop};
const CameraRig={shake:noop};const Sound={play:noop};const Combat={projectiles:[]};
const Fighter=new Function('THREE','V3','TUNING','TAU','scene','Settings','Effects','Sound','Spectacle','Game','Combat','CameraRig','TEX','ARENA_RADIUS','CEILING','groundAt','buildFighterModel','damp','clamp','smooth01','yawFromDir','lerpAngle','CharacterRegistry',fs.readFileSync(root+'/src/45-fighter-controller.js','utf8')+';return Fighter')(
 THREE,V3,TUNING,TAU,scene,Settings,Effects,Sound,Spectacle,Game,Combat,CameraRig,TEX,62,34,()=>0,()=>({root:new THREE.Group(),blob:new THREE.Group()}),damp,clamp,smooth01,yawFromDir,lerpAngle,CharacterRegistry);
const actual=new Function('THREE','V3','TUNING','TAU','scene','Settings','Effects','Sound','Spectacle','Game','CameraRig','TEX','RivalAI','ARENA_RADIUS','groundAt','clamp','smooth01','Dojo','yawFromDir','lerpAngle',fs.readFileSync(root+'/src/60-combat.js','utf8')+';return Combat')(
 THREE,V3,TUNING,TAU,scene,Settings,Effects,Sound,Spectacle,Game,CameraRig,TEX,{dodge:()=>false},62,()=>0,clamp,smooth01,{hitMelee:()=>false,hitBlast:()=>false},yawFromDir,lerpAngle);
Object.assign(Combat,actual);
const run=(a,b,s,dt)=>{for(let i=0;i<Math.ceil(s/dt);i++){a.update(dt);b.update(dt)}};
function make(){const a=new Fighter('Kairo',{ki:0x55ccee,aura:0xffee44},new V3(0,0,0));const b=new Fighter('Rival',{ki:0xff9944,aura:0xff6644},new V3(0,0,2.05));a.animate=b.animate=noop;a.facing=0;b.facing=Math.PI;a.t=b.t=5;Game.player=a;Game.enemy=b;return [a,b]}
function free(a,b,dt){let n=0;while((a.meleeCd>.001||a.punchT>.001||a.kickPend)&&n++<180)run(a,b,dt,dt);assert(n<180,'attack never recovered')}
for(const dt of [1/120,1/60,1/30]){
 const [a,b]=make();a.combo=3;a.lastMelee=a.t;Combat.melee(a,b);free(a,b,dt);
 assert.equal(a.comboFollow?.phase,1);
 Combat.melee(a,b);free(a,b,dt);assert.equal(a.comboFollow?.phase,2);
 Combat.melee(a,b);run(a,b,.34,dt);assert(b.spiked,'meteor kick must spike');
 let n=0;while(b.spiked&&n++<190)run(a,b,dt,dt);
 assert(n<190,'victim must collide with floor');
 assert.equal(a.comboFollow?.phase,3,'landed opponent opens Falling Fist');
 assert(calls.some(x=>x[0]==='crater'&&x[3]===false),'landing crater');
 const hp=b.hp;free(a,b,dt);Combat.melee(a,b);
 assert.equal(a.attackKind,'fallingFist','new press uses grounded finisher');
 run(a,b,.57,dt);
 assert(b.hp<hp,`Falling Fist should physically land at ${dt}; dist=${a.pos.distanceTo(b.pos)} a=${a.pos.toArray()} b=${b.pos.toArray()}`);
 assert(calls.some(x=>x[0]==='crater'&&x[3]===true),'second crater');
 assert(!a.comboFollow,'follow-up consumed');
}
// Ninja is a different fighter with hard mobility restrictions.
assert.equal(CharacterRegistry.can('kairo_venn','flight'),true);
assert.equal(CharacterRegistry.can('rin_sable','flight'),false);
assert.equal(CharacterRegistry.can('rin_sable','doubleJump'),true);
const ninja=new Fighter('Rin',{ki:0xa898ff,aura:0xa898ff},new V3(0,0,0),'rin_sable');
ninja.animate=noop;Game.player=ninja;Game.enemy=make()[1];Game.player=ninja;
assert.equal(ninja.canFly,false);assert(ninja.tryJump());assert(ninja.jumpsUsed===1);
run(ninja,Game.enemy,.16,1/60);assert(ninja.tryJump(),'double jump works while airborne');assert(ninja.jumpsUsed===2);assert(!ninja.tryJump(),'no third jump');
run(ninja,Game.enemy,2.5,1/60);assert(ninja.pos.y===0,'ninja lands; no infinite fly');
assert.equal(ninja.jumpsUsed,0,'landing resets jumps');
assert(ninja.tryJump());ninja.sprinting=true;ninja.sprintHeld=true;
run(ninja,Game.enemy,2.0,1/60);assert.equal(ninja.pos.y,0,'Boost cannot give Rin indefinite flight');
ninja.sprinting=false;ninja.sprintHeld=false;
ninja.energy=100;
Combat.blast(ninja,Game.enemy,'facing',.99);
assert.equal(Combat.projectiles.length,3,'full ninja charge throws a three-shuriken volley');
for(let i=0;i<60;i++)Combat.update(1/60);
Combat.clear();
assert(fs.readFileSync(root+'/index.html','utf8').includes('data-hero="rin_sable"'));
console.log('V51: ground finisher at 120/60/30fps; dual character registry; no flight, double jump, shuriken volley passed');

// V53-specific distinct ninja melee stages; Kairo's ground/sky chain above remains intact.
const nin=new Fighter('Rin',{ki:0x9988ee,aura:0xa898ff},new V3(0,0,0),'rin_sable');
const spar=new Fighter('Partner',{ki:0xeedddd,aura:0xffddcc},new V3(0,0,2),'kairo_venn');
nin.animate=spar.animate=noop;Game.player=nin;Game.enemy=spar;
const identity=['ninjaPalm','ninjaElbow','ninjaSpin','ninjaRising'];
for (let i=0;i<4;i++) {
  nin.combo=i;nin.lastMelee=nin.t;nin.meleeCd=0;nin.punchT=0;nin.kickPend=null;
  spar.pos.set(0,0,2);spar.launched=false;spar.spiked=false;spar.downT=0;spar.stun=0;
  Combat.melee(nin,spar);
  assert.equal(nin.attackKind,identity[i],`unique ninja combo beat ${i}`);
  if(i===2) {
    run(nin,spar,0.37,1/60);
    assert(!spar.launched,"ninja spinning heel is NOT Kairo's launcher");
  }
}
console.log('V53: ninja has four unique attack phases, with a non-launching heel strike');
