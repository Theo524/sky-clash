/* Capture a REAL V152 Kairo VRM normalized flight pose from the shipped
 * animation pipeline for import as a Pose Lab editing baseline. No game edits.
 * CI artifact must be inspected before committing into the reference pack.
 */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const names=['hips','spine','chest','upperChest','neck','head',
 'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
 'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
 'leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot'];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-webgl']});
 const page=await browser.newPage({viewport:{width:960,height:640}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:8765/index.html?flightPreview=v152',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPoseAuthority?.ready&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,null,{timeout:180000});
  const result=await page.evaluate(names=>{
   const g=window.SkyClash.Game,gp=g.player,s=window.SkyClash;
   g.enterDojo();g.introT=0;g.update=()=>{};s.CameraRig.update=()=>{};
   const floor=gp.floor,p=gp.pos,model=gp.model;
   gp.facing=0;model.root.rotation.y=0;gp.vel.set(0,0,0);
   gp.blockHeld=false;gp.blocking=false;gp.dashing=false;
   gp.jumping=false;gp.dropping=false;gp.sprinting=false;
   gp.charging=false;gp.punchT=0;gp.pos.y=floor+2;model.root.position.y=floor+2;
   gp.moveIntent.set(0,0,0);g.lockOn=false;
   for(let i=0;i<140;i++){gp.t=(gp.t||0)+1/60;gp.animate(1/60);}
   const vrm=gp.vrmRig.vrm;vrm.update(0);
   const bones=names.filter(x=>!!vrm.humanoid.getNormalizedBoneNode(x));
   const quaternions=bones.map(x=>vrm.humanoid.getNormalizedBoneNode(x)
    .quaternion.toArray().map(v=>+v.toFixed(7)));
   const h=vrm.humanoid,THREE=window.THREE;
   const get=n=>h.getNormalizedBoneNode(n)?.getWorldPosition(new THREE.Vector3());
   const knee=side=>{
    const hip=get(side+'UpperLeg'),k=get(side+'LowerLeg'),ankle=get(side+'Foot');
    return hip&&k&&ankle?
      Math.acos(THREE.MathUtils.clamp(k.clone().sub(hip).normalize()
       .dot(ankle.clone().sub(k).normalize()),-1,1))*180/Math.PI:null;
   };
   return {bones,quaternions,
    sourcePose:window.SkyClashPoseAuthority?.flightAuthoredClip||null,
    sourceState:window.SkyClashPoseAuthority?.active||null,
    leftKnee:knee('left'),rightKnee:knee('right')};
  },names);
  if(result.sourceState!=='flight'||result.bones.length!==20||
   result.quaternions.some(q=>Math.abs(Math.hypot(...q)-1)>.004)||
   errors.length)throw Error('Real V152 capture invalid: '+JSON.stringify({result,errors}));
  const model=fs.readFileSync('assets/characters/kairo.vrm');
  const file={schema:'sky-clash.pose-lab.v1',version:1,fighter:'kairo_venn',
   modelPath:'assets/characters/kairo.vrm',
   modelSha256:crypto.createHash('sha256').update(model).digest('hex'),
   rig:'vrm0-normalized-bones',unit:'local quaternion xyzw',
   source:'real Kairo V152 game hover / captured from V100 runtime on true VRM; editor reference only',
   bones:result.bones,duration:1.2,interpolation:'quaternion-slerp',
   keyframes:[
    {time:0,name:'V152 approved calm hover baseline',quaternions:result.quaternions},
    {time:1.2,name:'V152 approved calm hover baseline',quaternions:result.quaternions}
   ]};
  const folder=path.resolve('visual-review-output','pose-lab-reference');
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'kairo-v152-hover.pose.json'),JSON.stringify(file,null,2));
  fs.writeFileSync(path.join(folder,'capture-report.json'),JSON.stringify({
   ...result,modelSha256:file.modelSha256,realVRM:true,ready:true},null,2));
  console.log('PASS real V152 Kairo flight reference',JSON.stringify({
   source:result.sourcePose,leftKnee:result.leftKnee,
   rightKnee:result.rightKnee,bones:result.bones.length,
   fingerprint:file.modelSha256}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
