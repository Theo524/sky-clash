/* V163 lab-only: author REAL Kairo VRM0 vertical pose KEYFRAMES in Pose Lab.
 * Writes independent SHA-verified local quaternion JSON tracks and actual
 * front/side/back WebGL screenshots. NEVER edits live gameplay or approved Q.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const out=path.resolve('visual-review-output','kairo-vertical-keyframes');
fs.mkdirSync(out,{recursive:true});
const MODEL_SHA='775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72';
const views=['front','side','back'];
const aiming=(bone,child,x,y,z)=>({bone,child,worldDirection:[x,y,z]});
const variations=[
 {
  id:'ascending-controlled',
  // Pure vertical control should not transform Kairo into a horizontal
  // Superman pose. Chest/neck counter-rotate by only a few world degrees.
  rotations:[
   {bone:'chest',axis:'right',degrees:-2},
   {bone:'neck',axis:'right',degrees:1},
   {bone:'head',axis:'right',degrees:1}
  ],
  aims:[
   aiming('leftUpperArm','leftLowerArm',.55,-.64,-.27),
   aiming('rightUpperArm','rightLowerArm',-.52,-.68,-.25),
   aiming('leftLowerArm','leftHand',.09,-.60,.22),
   aiming('rightLowerArm','rightHand',-.09,-.61,.22),
   aiming('leftUpperLeg','leftLowerLeg',.20,-.55,.62),
   aiming('rightUpperLeg','rightLowerLeg',-.17,-.82,.24),
   aiming('leftLowerLeg','leftFoot',.08,-.85,-.30),
   aiming('rightLowerLeg','rightFoot',-.08,-.90,-.30)
  ]
 },
 {
  id:'descending-controlled',
  rotations:[
   {bone:'chest',axis:'right',degrees:1.5},
   {bone:'neck',axis:'right',degrees:-1},
   {bone:'head',axis:'right',degrees:-1}
  ],
  aims:[
   aiming('leftUpperArm','leftLowerArm',.54,-.63,.08),
   aiming('rightUpperArm','rightLowerArm',-.52,-.64,.09),
   aiming('leftLowerArm','leftHand',.10,-.67,.23),
   aiming('rightLowerArm','rightHand',-.10,-.67,.23),
   aiming('leftUpperLeg','leftLowerLeg',.19,-.80,.28),
   aiming('rightUpperLeg','rightLowerLeg',-.18,-.82,.26),
   aiming('leftLowerLeg','leftFoot',.10,-.94,-.25),
   aiming('rightLowerLeg','rightFoot',-.10,-.93,-.25)
  ]
 },
 {
  id:'ascending-open',
  rotations:[{bone:'chest',axis:'right',degrees:-2},
   {bone:'neck',axis:'right',degrees:1},
   {bone:'head',axis:'right',degrees:1}],
  aims:[
   aiming('leftUpperArm','leftLowerArm',.64,-.66,-.19),
   aiming('rightUpperArm','rightLowerArm',-.59,-.69,-.18),
   aiming('leftLowerArm','leftHand',.10,-.66,.20),
   aiming('rightLowerArm','rightHand',-.10,-.64,.22),
   aiming('leftUpperLeg','leftLowerLeg',.23,-.48,.65),
   aiming('rightUpperLeg','rightLowerLeg',-.18,-.72,.29),
   aiming('leftLowerLeg','leftFoot',.06,-.85,-.33),
   aiming('rightLowerLeg','rightFoot',-.07,-.88,-.33)
  ]
 },
 {
  id:'descending-brake',
  rotations:[{bone:'chest',axis:'right',degrees:1.5},
   {bone:'neck',axis:'right',degrees:-1},
   {bone:'head',axis:'right',degrees:-1}],
  aims:[
   aiming('leftUpperArm','leftLowerArm',.70,-.47,.12),
   aiming('rightUpperArm','rightLowerArm',-.68,-.47,.13),
   aiming('leftLowerArm','leftHand',.13,-.58,.30),
   aiming('rightLowerArm','rightHand',-.13,-.58,.30),
   aiming('leftUpperLeg','leftLowerLeg',.22,-.74,.32),
   aiming('rightUpperLeg','rightLowerLeg',-.19,-.76,.30),
   aiming('leftLowerLeg','leftFoot',.12,-.94,-.26),
   aiming('rightLowerLeg','rightFoot',-.11,-.93,-.27)
  ]
 }
];
function numberOk(x){return typeof x==='number'&&Number.isFinite(x);}
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader-webgl','--enable-webgl'
 ]});
 const page=await browser.newPage({viewport:{width:1220,height:850},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',err=>errors.push(String(err)));
 const report={modelSha256:MODEL_SHA,realVRM:true,source:'Pose Lab on published Kairo VRM0',
  visualApproval:false,gameChanged:false,candidates:[]};
 try{
  await page.goto('http://127.0.0.1:'+(process.env.VISUAL_PORT||8765)+
   '/pose-lab.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SkyClashPoseLab?.ready,null,{timeout:180000});
  await page.locator('#showJoints').uncheck();
  async function loadBaseline(){
   await page.click('#loadHover');
   await page.waitForFunction(()=>
    document.querySelector('#status')?.textContent.includes('Loaded exact V152'),null,{timeout:20000});
   const motion=await page.evaluate(()=>window.SkyClashPoseLab.motion);
   assert.equal(motion.modelSha256,MODEL_SHA,'published Kairo model changed');
   assert.equal(motion.bones.length,20,'normalized real 20-bone rig');
   return motion;
  }
  const baseline=await loadBaseline();
  report.baseline=await page.evaluate(()=>window.SkyClashPoseLab.flightGeometry);
  report.hoverEqualsLibrary=JSON.stringify(baseline.keyframes[0].quaternions)===
   JSON.stringify(JSON.parse(fs.readFileSync(
    'assets/animations/kairo/flight-library.v1.json','utf8')).poseVariants.v156.hover);
  assert(report.hoverEqualsLibrary,'MUST start from exact Q/V156 hover, never cruise');
  for(const v of views){
   await page.click('[data-view="'+v+'"]');
   await page.waitForTimeout(100);
   await page.locator('#modelView').screenshot({path:path.join(out,'hover-'+v+'.png'),
    animations:'disabled'});
  }
  // Each generated frame is baked by Pose Lab on the real model, not
  // a runtime local Euler guess. The intermediate keys interpolate from
  // baseline to authored 100% pose and shape anticipation/settle.
  for(const candidate of variations){
   await loadBaseline();
   const authored=await page.evaluate(spec=>
    window.SkyClashPoseLab.authorWorldPose(spec),{
      time:1.2,name:candidate.id+' full pose',
      rotations:candidate.rotations,aims:candidate.aims});
   const full=authored.data.keyframes.at(-1).quaternions;
   const clip=await page.evaluate(({full,id})=>{
    const lab=window.SkyClashPoseLab;
    const baseline=lab.motion.keyframes[0].quaternions;
    const T=window.THREE,qa=new T.Quaternion(),qb=new T.Quaternion();
    const at=(t,w,name)=>({
      time:t,name,
      quaternions:baseline.map((a,i)=>{
       qa.fromArray(a);qb.fromArray(full[i]);
       return new T.Quaternion().slerpQuaternions(qa,qb,w).normalize()
        .toArray().map(x=>+x.toFixed(7));
      })
    });
    return {...lab.motion,source:'Real Kairo VRM0 manually targeted joint directions'+
      '; Pose Lab baked exact local quaternions, NOT gameplay approved',
      keyframes:[
       at(0,0,id+' start hover'),
       at(.16,.28,id+' anticipation'),
       at(.38,.78,id+' lift / descend'),
       at(.68,1,id+' full pose'),
       at(1.2,1,id+' hold')
      ]};
   },{full,id:candidate.id});
   assert.equal(clip.keyframes.length,5);
   assert.equal(clip.modelSha256,MODEL_SHA);
   assert(clip.keyframes.every(k=>k.quaternions.length===20&&k.quaternions.every(
    q=>q.length===4&&q.every(numberOk)&&Math.abs(Math.hypot(...q)-1)<.003)));
   // Quaternions are normalized by Three.js when baked, which may
   // shift the seventh decimal. Compare rotations, not exact text bytes.
   for(let j=0;j<20;j++){
    const a=clip.keyframes[0].quaternions[j],b=baseline.keyframes[0].quaternions[j];
    const dot=Math.abs(a.reduce((sum,v,k)=>sum+v*b[k],0));
    assert(dot>.999998,'entry pose differs from exact Q hover joint '+j);
   }
   // True keyframed clip JSON is written for future V100 sampling.
   const fileName=candidate.id+'.pose.json';
   fs.writeFileSync(path.join(out,fileName),JSON.stringify(clip,null,2));
   // Re-import exactly as a future editor/project would; screenshots show
   // actual interpolated 20-bone Kairo skin at 0.16, 0.38, 0.68 and hold.
   await page.locator('#fileImport').setInputFiles({
    name:fileName,mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(clip))
   });
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Imported 5'),
    null,{timeout:20000});
   const samples=[];
   // Compare the meaningful deformation and the target hold. Other
   // keyframes remain in the exported JSON for timeline inspection.
   for(const [stamp,time] of [['transition',.38],['peak',.68]]){
    const sample=await page.evaluate(t=>{
     window.SkyClashPoseLab.seek(t);
     return {metrics:window.SkyClashPoseLab.flightGeometry,
      frames:window.SkyClashPoseLab.motion.keyframes.length};
    },time);
    assert.equal(sample.frames,5);
    assert(sample.metrics&&numberOk(sample.metrics.torso),'real-body geometry missing');
    for(const view of views){
     await page.click('[data-view="'+view+'"]');
     await page.waitForTimeout(90);
     await page.locator('#modelView').screenshot({path:path.join(out,
      candidate.id+'-'+stamp+'-'+view+'.png'),animations:'disabled'});
    }
    samples.push({stage:stamp,time,geometry:sample.metrics});
   }
   const peak=samples.find(x=>x.stage==='peak').geometry;
   // Wide sanity gates only. These DO NOT rate the appearance.
   assert(peak.limbSpacing?.wrist!==null&&peak.limbSpacing?.ankle!==null);
   assert(peak.leftElbow>5&&peak.rightElbow>5,'inverted/stiff elbows');
   assert(peak.leftKnee>5&&peak.rightKnee>5,'inverted/stiff knees');
   assert(Math.abs(peak.torso-report.baseline.torso)<16,
     'vertical direction must not turn the whole body into a forward plank');
   report.candidates.push({id:candidate.id,
    qa:{boneCount:20,poses:5,modelSha256:clip.modelSha256,
      torsoDelta:peak.torso-report.baseline.torso},
    operations:candidate,samples});
   console.log('VERTICAL_KEYFRAME_CANDIDATE '+JSON.stringify({
    id:candidate.id,torso:peak.torso,baseline:report.baseline.torso,
    arms:[peak.leftElbow,peak.rightElbow],knees:[peak.leftKnee,peak.rightKnee],
    spacing:peak.limbSpacing,sagittalHinge:peak.elbowSagittalSign}));
  }
  assert.deepEqual(errors,[],'Pose Lab browser exceptions');
  report.completed=true;
  fs.writeFileSync(path.join(out,'real-kairo-vertical-pose-study.json'),JSON.stringify(report,null,2));
  const shots=fs.readdirSync(out).filter(x=>x.endsWith('.png')).length;
  assert.equal(shots,3+variations.length*2*3,'all real-VRM views produced');
  console.log('PASS Real Kairo 20-bone vertical keyframes, 4 candidates, 27 WebGL images '+shots);
 }finally{await browser.close();}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
