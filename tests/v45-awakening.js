const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const THREE=require('../js/vendor/three.min.js');
const V3=THREE.Vector3,TAU=Math.PI*2,scene=new THREE.Scene();
const damp=(r,dt)=>1-Math.exp(-r*dt),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth01=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const foundation=fs.readFileSync(path.join(root,'src/00-foundation.js'),'utf8');
const TUNING=new Function('return '+foundation.match(/const TUNING = (\{[\s\S]*?\n\});/)[1])();
const calls={ignition:0,charged:0,burst:0,vanish:0};
const Settings={get:()=>false},tex={glow:new THREE.Texture(),smoke:new THREE.Texture(),star:new THREE.Texture()};
const Effects={sprite:()=>new THREE.Sprite(new THREE.SpriteMaterial()),dust(){},sprintTrail(){},auraSpark(){},bodyAura(){},groundSlam(){},
 chargePressure(){},awakenIgnition(){calls.ignition++},awakenCharge(){calls.charged++},awakenBurst(){calls.burst++},vanish(){calls.vanish++}};
const Spectacle={dashStart(){},dashWake(){},flightWake(){}};
const Sound={play(){}},CameraRig={shake(){}},Combat={projectiles:[]};
const Game={player:null,enemy:null,training:false,callout(){},hitStop(){}};
const buildFighterModel=()=>({root:new THREE.Group(),blob:new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial())});
const yawFromDir=(x,z)=>Math.atan2(x,z),lerpAngle=(a,b,t)=>a+(b-a)*t;
const src=fs.readFileSync(path.join(root,'src/45-fighter-controller.js'),'utf8');
const Fighter=new Function('THREE','V3','TUNING','TAU','scene','Settings','Effects','Sound','Spectacle','Game','Combat','CameraRig','TEX','ARENA_RADIUS','CEILING','groundAt','buildFighterModel','damp','clamp','smooth01','yawFromDir','lerpAngle',src+';return Fighter')(
 THREE,V3,TUNING,TAU,scene,Settings,Effects,Sound,Spectacle,Game,Combat,CameraRig,tex,62,34,()=>0,buildFighterModel,damp,clamp,smooth01,yawFromDir,lerpAngle);
const pal={aura:0x66aaff,ki:0x66aaff},f=new Fighter('Hero',pal,new V3(0,0,4)),foe=new Fighter('Rival',pal,new V3(0,0,-4));Game.player=f;Game.enemy=foe;
f.animate=()=>{};foe.animate=()=>{};
assert.equal(f.tryAwaken(),false,'AWAKEN should be meter-gated');
f.gainAwaken(35);assert.equal(f.awakenGauge,35);
f.gainAwaken(89);assert.equal(f.awakenGauge,100);
assert.equal(f.tryAwaken(),true);assert.equal(calls.ignition,1);
assert(f.awakenChargeT>2 && !f.awakened && f.awakenGauge===100,'charge sequence must precede buff');
assert.equal(f.tryAwaken(),false,'cannot stack transformations');
for(let i=0;i<12;i++) f.update(0.05);
assert(f.awakenChargeT>0 && !f.awakened && f.awakenChargeProgress>0.20 && f.awakenChargeProgress<0.5);
assert(calls.charged>2,'charge effects must persist during transformation');
for(let i=0;i<40;i++) f.update(0.05);
assert(f.awakened && f.awakenGauge===0 && calls.burst===1,'buff must only begin on release');
f.gainAwaken(60);assert.equal(f.awakenGauge,0,'gauge cannot be earned while awakened');
f.guardCounterWindow=TUNING.defensiveVanishWindow;f.guardHitBy=foe;f.energy=13;
assert(f.tryVanish(foe),'blocked-hit dodge must function at discounted ki cost');
assert.equal(calls.vanish,1);assert(f.vanishT>0 && f.guardCounterWindow===0);
assert(f.pos.distanceTo(foe.pos)>1.0,'teleport must move behind foe');
assert(f.energy>=0,'ki cannot go negative');
// Test actual articulated VFX creation/cleanup with simulated human joints.
const visSrc=fs.readFileSync(path.join(root,'src/50-vfx.js'),'utf8');
const renderScene=new THREE.Scene();
const Fx=new Function('THREE','V3','scene','TEX','Settings','TAU','groundAt','STAGE_R','CameraRig','Game','clamp','smooth01','canvasTex','makeRng',visSrc+';return Effects')(
 THREE,V3,renderScene,tex,{get:k=>k==='quality'?'low':false},TAU,()=>0,19,CameraRig,Game,clamp,smooth01,
 ()=>new THREE.Texture(),seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296));
const fake=new V3(0,0,0),boneNames=['hips','spine','chest','neck','head','leftShoulder','leftUpperArm','leftLowerArm','leftHand','rightShoulder','rightUpperArm','rightLowerArm','rightHand','leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot'];
const nodes=Object.fromEntries(boneNames.map((n,i)=>[n,{getWorldPosition(v){return v.set((n.startsWith('left')?-.4:n.startsWith('right')?.4:0),i%5*.32,0)}}]));
const rig={vrm:{scene:{updateMatrixWorld(){}},humanoid:{getNormalizedBoneNode:n=>nodes[n]}}};
const fxF={vrmRig:rig};
Fx.vanish(new V3(0,1.55,0),new V3(3,1.55,0),0x44aaff,true,fxF);
assert(renderScene.children.length>10,'articulated afterimages should be visibly composed of multiple segments');
for(let i=0;i<40;i++) Fx.update(0.03);
assert.equal(renderScene.children.length,0,'vanish pieces must fully clean up');
Fx.awakenCharge({hp:100,flying:true,pal,pos:new V3(),center:new V3(0,1.2,0),vrmRig:rig},.65);
for(let i=0;i<40;i++) Fx.update(0.03);
assert.equal(renderScene.children.length,0,'power VFX must fully clean up');
console.log('V45: meter charge -> power-up -> awakening, discounted guarded-hit escape, articulated vanish and FX cleanup PASS');
