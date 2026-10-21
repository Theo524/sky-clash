const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const THREE=require('../js/vendor/three.min.js');
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),skyDome=new THREE.Group();
const makeRng=seed=>()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const TEX={glow:new THREE.Texture(),cloud:new THREE.Texture(),grass:new THREE.Texture(),stone:new THREE.Texture()};
const Settings={get:()=> 'medium'};
const src=fs.readFileSync(path.join(__dirname,'../src/20-arena.js'),'utf8');
const vals=new Function('THREE','TAU','ARENA_RADIUS','V3','scene','camera','skyDome','Settings','makeRng','TEX','TOON_RAMP','toon',src+';return {Arena,groundAt,STAGE_R}')(
 THREE,Math.PI*2,62,THREE.Vector3,scene,camera,skyDome,Settings,makeRng,TEX,new THREE.Texture(),(c)=>new THREE.MeshStandardMaterial({color:c}));
vals.Arena.setQuality('medium'); vals.Arena.update(.04);
assert.equal(vals.groundAt(0,0),.35);assert.equal(vals.groundAt(25,25),0);
const pbr=scene.children.filter(x=>x.material?.type==='MeshStandardMaterial');
const instanced=scene.children.filter(x=>x.isInstancedMesh);
assert(pbr.length>20,'Rock, forest and ridge geometry should construct');
assert(instanced.length>=5,'Environment should use instancing for mobile performance');
assert(scene.children.some(x=>x.geometry?.type==='BufferGeometry' && x.material?.side===THREE.DoubleSide),'Jagged mountain geometry missing');
console.log('V44 arena generated:',scene.children.length,'objects',instanced.length,'instanced groups; ground collision preserved');
