const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const THREE=require('../js/vendor/three.min.js');
const V3=THREE.Vector3,scene=new THREE.Scene(),TAU=Math.PI*2;
const Settings={get:k=>k==='quality'?'medium':false};
const tex={glow:new THREE.Texture(),smoke:new THREE.Texture(),star:new THREE.Texture()};
const canvasTex=()=>new THREE.Texture();
const smooth01=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t)};
const src=fs.readFileSync(path.join(__dirname,'../src/50-vfx.js'),'utf8');
const Effects=new Function('THREE','V3','scene','TEX','Settings','TAU','groundAt','STAGE_R','CameraRig','Game','clamp','smooth01','canvasTex','makeRng',src+';return Effects')(
 THREE,V3,scene,tex,Settings,TAU,()=>0.35,19,{shake(){}},{player:null,callout(){}},(v,a,b)=>Math.max(a,Math.min(b,v)),smooth01,
 canvasTex,(seed)=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296)
);
const f={hp:100,flying:false,pos:new V3(0,0.35,0),pal:{aura:0x66ccff,ki:0x66ccff},center:new V3(0,1.55,0),forward:()=>new V3(0,0,1)};
Effects.chargePressure(f,0.2);
const pressureCount=scene.children.length;
assert(pressureCount>0 && pressureCount<8,'Pressure phase should be restrained');
Effects.chargeFracture(f,.95);
const chunkCount=scene.children.filter(o=>o.geometry?.type==='ExtrudeGeometry').length;
assert(chunkCount>=10 && chunkCount<=15,'Fracture should lift irregular stone plates, not a few lines');
Effects.bodyAura(f,true);const auraCount=scene.children.filter(o=>o.isSprite).length;
assert(auraCount>15,'Burst should emit multiple character-attached wisps');
Effects.vanish(new V3(0,1.55,0),new V3(4,1.55,0),f.pal.aura,false);
assert(scene.children.length>chunkCount);
for(let k=0;k<100;k++) Effects.update(.04);
assert.equal(scene.children.length,0,'All transient effects must self-clean');
const js=fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
assert(html.includes('Sky Clash V51') && html.includes('data-setting="cameraDist"'));
assert(html.includes('js/game.js?v=51'));
assert(js.includes('lvl >= 0.90') && js.includes('Effects.chargePressure'));
assert(js.includes('this.vrm.scene.updateMatrixWorld(true)'));
assert(!js.includes('const sz = (0.34 + 0.82 * lvc)'));
console.log('V44 VFX geometry, controlled pressure, late fracture, aura, vanish and cleanup PASS');
