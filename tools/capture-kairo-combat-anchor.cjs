/* Capture the real settled gameplay skeleton for offline DCC authoring.
 * This measured frame is an authoring reference, never a new idle clip.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const contract=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json');
const OUT=path.resolve('visual-review-output/kairo-combat-foundation');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox',
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+(process.env.VISUAL_PORT||8765)+'/index.html');
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,null,{timeout:180000});
  const anchor=await page.evaluate(({bones,parents})=>{
   const s=window.SkyClash,g=s.Game,T=window.THREE;
   g.enterDojo();g.update=()=>{};s.CameraRig.update=()=>{};
   const p=g.player;p.reset();p.pos.set(0,p.floor,0);p.vel.set(0,0,0);
   p.moveIntent.set(0,0,0);p.facing=0;p.blockHeld=false;p.blocking=false;
   p.t=12;p.attackSerial=0;p.punchT=0;p.stun=0;
   for(let i=0;i<90;i++)p.animate(1/60);
   const vrm=p.vrmRig.vrm,scene=vrm.scene,h=vrm.humanoid;
   scene.updateMatrixWorld(true);
   const inverse=scene.matrixWorld.clone().invert();
   const invRotation=scene.getWorldQuaternion(new T.Quaternion()).invert();
   const joints=bones.map((name,i)=>{
    const node=h.getNormalizedBoneNode(name);
    return {name,parent:parents[i],
     position:node.getWorldPosition(new T.Vector3()).applyMatrix4(inverse).toArray(),
     worldQuaternion:invRotation.clone().multiply(
      node.getWorldQuaternion(new T.Quaternion())).normalize().toArray(),
     localQuaternion:node.quaternion.toArray(),localPosition:node.position.toArray()};
   });
   const canvas=document.querySelector('canvas');
   const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
   return {schema:'sky-clash.kairo-combat-anchor.v1',characterId:p.characterId,
    space:'vrm-scene-relative-Y-up',bones,parents,joints,
    forward:p.forward().applyQuaternion(invRotation).normalize().toArray(),
    rootScale:scene.getWorldScale(new T.Vector3()).toArray(),
    realWebGL:!!gl,referenceOnly:true,clock:p.t};
  },contract);
  assert.equal(anchor.characterId,'kairo_venn');assert(anchor.realWebGL);
  anchor.modelSha256=crypto.createHash('sha256').update(fs.readFileSync('assets/characters/kairo.vrm')).digest('hex');
  assert.equal(anchor.modelSha256,contract.modelSha256);
  anchor.rigSignature=contract.rigSignature;
  fs.mkdirSync(OUT,{recursive:true});
  fs.writeFileSync(path.join(OUT,'kairo-combat-anchor.json'),JSON.stringify(anchor,null,2)+'\n');
  console.log('Captured actual game-idle anchor: '+anchor.joints.length+' joints; reference only');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
