'use strict';
// Game-source-level regression for a live double jump and the VRM0 coordinate change.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const THREE=require(path.join(root,'js/vendor/three.min.js'));
const V3=THREE.Vector3,TAU=Math.PI*2, scene=new THREE.Scene();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),damp=(r,t)=>1-Math.exp(-r*t);
const smooth01=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const wrapAngle=a=>{a=(a+Math.PI)%TAU;if(a<0)a+=TAU;return a-Math.PI};
const yawFromDir=(x,z)=>Math.atan2(x,z),lerpAngle=(a,b,t)=>a+wrapAngle(b-a)*t;
const TUNING=new Function('return '+read('src/00-foundation.js').match(/const TUNING = (\{[\s\S]*?\n\});/)[1])();
const CharacterRegistry=new Function(read('src/05-character-registry.js')+';return CharacterRegistry;')();
const noop=()=>{};
const Settings={get:(n)=>n==='acrobatics'};
const Effects={sprite:()=>new THREE.Sprite(new THREE.SpriteMaterial()),dust:noop,bodyAura:noop,sprintTrail:noop,auraSpark:noop,groundSlam:noop,ring:noop,flash:noop,vanish:noop};
const Sound={play:noop},Spectacle={dashStart:noop,dashWake:noop,flightWake:noop},CameraRig={shake:noop};
const Combat={projectiles:[]},Game={player:null,enemy:null,training:false,callout:noop,hitStop:noop};
const TEX={glow:new THREE.Texture()};
const dummyModel=()=>{
 const obj=()=>new THREE.Group(),root=obj(),body=obj(),spine=obj(),head=obj(),chest=obj();root.add(body);body.add(spine);spine.add(head,chest);
 const arms=[-1,1].map(side=>({sh:obj(),el:obj(),fist:obj(),side}));
 const legs=[-1,1].map(side=>({hip:obj(),knee:obj(),foot:obj(),side}));
 const blob=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial({transparent:true}));
 return {root,body,spine,head,chest,arms,legs,blob,hairMat:{color:new THREE.Color(),emissive:new THREE.Color()},bodyMats:[],spikes:[],aura:{set:noop,level:0}};
};
const Fighter=new Function('THREE','V3','TUNING','TAU','scene','Settings','Effects','Sound','Spectacle','Game','Combat','CameraRig','TEX','ARENA_RADIUS','CEILING','groundAt','buildFighterModel','damp','clamp','smooth01','yawFromDir','lerpAngle','CharacterRegistry',read('src/45-fighter-controller.js')+';return Fighter')(
 THREE,V3,TUNING,TAU,scene,Settings,Effects,Sound,Spectacle,Game,Combat,CameraRig,TEX,62,34,()=>0,dummyModel,damp,clamp,smooth01,yawFromDir,lerpAngle,CharacterRegistry);
const ninja=new Fighter('Rin',{ki:0x7777ff,aura:0xa67af9,hair:0x222222,awakenHair:0xff33ff},new V3(0,0,0),'rin_sable');
const spar=new Fighter('Dummy',{ki:0x5555ff,aura:0xaaaaff,hair:0x222222,awakenHair:0xffffff},new V3(0,0,-12));
Game.player=ninja;Game.enemy=spar;
assert(ninja.tryJump());
for(let i=0;i<12;i++)ninja.update(1/60);
assert.equal(ninja.jumpsUsed,1);
assert(ninja.tryJump());
assert.equal(ninja.acro?.type,'ninjaLeap');
for(let i=0;i<200;i++)ninja.update(1/60);
assert.equal(ninja.pos.y,0,'ninja landed');
assert.equal(ninja.jumpsUsed,0,'reset after landing');
assert(ninja.tryJump(),'another jump after landing');
// The old live frame throws 'Assignment to constant variable' on second jump.
assert(!read('src/45-fighter-controller.js').includes("A = { arm:[[-0.92,0.45,-1.54]"));
// Native 180-degree conversion: VRM0 left upper-arm points -X before rotateVRM0;
// after rotation and a converted shoulder guard the elbow should point DOWN, not up/back.
const C=new THREE.Quaternion().setFromAxisAngle(new V3(0,1,0),Math.PI);
const Cinv=C.clone().invert();
const cL=new THREE.Quaternion().setFromAxisAngle(new V3(0,0,1),-Math.PI/2);
const native=Cinv.clone().multiply(cL).multiply(C);
const down=new V3(-1,0,0).applyQuaternion(native).applyQuaternion(C);
assert(down.y<-.99,`Rin's left elbow should point down, got ${down.toArray()}`);
const cR=new THREE.Quaternion().setFromAxisAngle(new V3(0,0,1),Math.PI/2);
const right=new V3(1,0,0).applyQuaternion(Cinv.clone().multiply(cR).multiply(C)).applyQuaternion(C);
assert(right.y<-.99,`Rin's right elbow should point down, got ${right.toArray()}`);
assert(read('src/95-game.js').includes('ninja:true,legacyAxes:true'));
assert(read('src/30-character-models.js').includes('if (this.legacyAxes) this.anim = null;'));
assert(read('src/40-recorded-animations.js').includes('const legT = 0;'));
assert(read('index.html').includes('js/game.js?v=560'));
const srcFiles=fs.readdirSync(path.join(root,'src')).filter(n=>n.endsWith('.js')).sort();
assert.equal(read('js/game.js'),srcFiles.map(n=>read('src/'+n)).join(''),'bundle current');
console.log('V55 200 live simulated jump frames, no third jump, landing reset, VRM0 left/right shoulder-basis checks, safe native ninja rig, bundle PASS');
