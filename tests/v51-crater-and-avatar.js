const THREE=require('../js/vendor/three.min.js'), assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const src=n=>fs.readFileSync(path.resolve(__dirname,'../src/',n),'utf8');
const tex=new THREE.Texture();const scene=new THREE.Scene();
const V3=THREE.Vector3,TAU=Math.PI*2;
const Effects=new Function('THREE','V3','scene','TEX','Settings','TAU','groundAt','STAGE_R','CameraRig','Game','clamp','smooth01','canvasTex','makeRng',src('50-vfx.js')+';return Effects')(
 THREE,V3,scene,{glow:tex,smoke:tex,star:tex,blob:tex}, {get:k=>k==='quality'?'medium':false},TAU,()=>0,19,{shake(){}},{player:null,callout(){}},(v,a,b)=>Math.max(a,Math.min(b,v)),x=>x*x*(3-2*x),()=>tex,()=>Math.random);
Effects.meteorCrater(new V3(0,0,0),0xbbaaee,false);
const first=scene.children.length;
assert(first>=55 && first<100,'landing spawns grounded plates/chunks/dust');
Effects.meteorCrater(new V3(0,0,0),0xbbaaee,true);
assert(scene.children.length>first,'Falling Fist produces its own debris');
for(let i=0;i<150;i++)Effects.update(.025);
assert.equal(scene.children.length,0,'all crater effects clean up');
const srcM=src('30-character-models.js');
// Stub normal map/material and texture dependencies, using genuine Three.js geometries.
const noop=()=>new THREE.Texture();
const models=new Function('THREE','V3','TAU','TEX','toon','OUTLINE_MAT','OUTLINE_THIN','createAura','canvasTex','TOON_RAMP',srcM.slice(0,srcM.indexOf('const ID_Q'))+';return {buildFighterModel,PALETTES};')(
 THREE,V3,TAU,{blob:tex},c=>new THREE.MeshStandardMaterial({color:c}),new THREE.MeshBasicMaterial(),new THREE.MeshBasicMaterial(),()=>({group:new THREE.Group(),set(){},level:0}),noop,tex);
const m=models.buildFighterModel(models.PALETTES.ninja);assert(m.parts.length>70);
let masks=0;m.root.traverse(o=>{if(o.isMesh&&o.material?.name==='ninjaMask')masks++});
assert.equal(m.spikes.every(x=>!x.visible),true,'Ninja hood hides Kairo style hair spikes');
console.log('V51: real Three.js ninja geometry, crater 2-stage geometry, transient VFX cleanup passed');
