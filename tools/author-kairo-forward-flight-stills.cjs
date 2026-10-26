/* Kairo real VRM assistant-only static pose study.
 * Manual world-axis directions bake to exact local 20-bone quaternions.
 * Runs strictly in Pose Lab, no game flight or physics code touched.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const candidates=[
 {id:'e-uncurl-knee',body:39,upper:-9,neck:-32,head:-7,
  leftThigh:-28,leftKnee:-56,rightThigh:-8,rightKnee:6,leftArm:-34,rightArm:-31,leftElbow:12,rightElbow:14},
 {id:'f-athletic-flight',body:45,upper:-10,neck:-33,head:-11,
  leftThigh:-38,leftKnee:-59,rightThigh:-12,rightKnee:7,leftArm:-47,rightArm:-38,leftElbow:15,rightElbow:19},
 {id:'g-strong-head-up',body:43,upper:-13,neck:-41,head:-4,
  leftThigh:-36,leftKnee:-62,rightThigh:-14,rightKnee:9,leftArm:-41,rightArm:-36,leftElbow:11,rightElbow:15},
 {id:'h-low-straight-cruise',body:48,upper:-9,neck:-38,head:-13,
  leftThigh:-40,leftKnee:-64,rightThigh:-10,rightKnee:5,leftArm:-43,rightArm:-29,leftElbow:17,rightElbow:12}
];
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader-webgl','--enable-webgl'
 ]});
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
 const errs=[];page.on('pageerror',e=>errs.push(String(e)));
 const out=path.resolve('visual-review-output','kairo-real-flight-candidates');
 fs.mkdirSync(out,{recursive:true});
 try{
  await page.goto('http://127.0.0.1:'+(process.env.VISUAL_PORT||8765)+'/pose-lab.html',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SkyClashPoseLab?.ready,null,{timeout:180000});
  await page.click('#loadHover');
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Loaded exact V152'),null,{timeout:15000});
  await page.locator('#showJoints').uncheck();
  const v152=await page.evaluate(()=>window.SkyClashPoseLab.motion);
  const base={sha:v152.modelSha256,bones:v152.bones.length,
   metrics:await page.evaluate(()=>window.SkyClashPoseLab.flightGeometry)};
  assert.equal(base.bones,20,'Must use actual 20-bone Kairo VRM');
  assert.equal(v152.keyframes.length,2);
  const reports=[];
  for(const a of candidates){
   const rotations=[
    {bone:'hips',axis:'right',degrees:a.body},
    {bone:'spine',axis:'right',degrees:a.upper*.52},
    {bone:'chest',axis:'right',degrees:a.upper*.48},
    // This is the missing head direction: make the head a separate
    // intentional pose, not a vertical continuation of Kairo's torso.
    {bone:'neck',axis:'right',degrees:a.neck},
    {bone:'head',axis:'right',degrees:a.head},
    // The V152 hover's left knee is already deeply tucked (~96 degrees).
    // Untuck the *existing* hover skeleton instead of bending it further.
    {bone:'leftUpperLeg',axis:'right',degrees:a.leftThigh},
    {bone:'leftLowerLeg',axis:'right',degrees:a.leftKnee},
    {bone:'rightUpperLeg',axis:'right',degrees:a.rightThigh},
    {bone:'rightLowerLeg',axis:'right',degrees:a.rightKnee},
    // Arms must sweep behind the ribs rather than hang vertically,
    // with forearms articulated separately from upper arms.
    {bone:'leftUpperArm',axis:'right',degrees:a.leftArm},
    {bone:'rightUpperArm',axis:'right',degrees:a.rightArm},
    {bone:'leftLowerArm',axis:'right',degrees:a.leftElbow},
    {bone:'rightLowerArm',axis:'right',degrees:a.rightElbow}
   ];
   const result=await page.evaluate(({id,rotations})=>
    window.SkyClashPoseLab.authorWorldPose({
     name:id+' – whole-body cruise target',time:1.2,rotations}),{id:a.id,rotations});
   assert.equal(result.data.modelSha256,base.sha);
   assert.equal(result.data.keyframes.length,2);
   assert.notDeepEqual(result.data.keyframes[0].quaternions,
    result.data.keyframes[1].quaternions);
   assert.notDeepEqual(result.data.keyframes[0].quaternions[4],
    result.data.keyframes[1].quaternions[4],
    'Neck must be authored independently');
   assert.notDeepEqual(result.data.keyframes[0].quaternions[5],
    result.data.keyframes[1].quaternions[5],
    'Head must be authored independently');
   fs.writeFileSync(path.join(out,a.id+'.pose.json'),JSON.stringify(result.data,null,2));
   for(const side of ['side','front','back']){
    await page.click('[data-view="'+side+'"]');
    await page.waitForTimeout(95);
    await page.locator('#modelView').screenshot({path:path.join(out,a.id+'-'+side+'.png'),
     animations:'disabled'});
   }
   reports.push({id:a.id,control:a,metrics:result.metrics,
    quats20:result.data.bones.length});
  }
  assert.equal(errs.length,0,'Browser errors: '+errs.join('; '));
  fs.writeFileSync(path.join(out,'real-vrm-measurements.json'),
   JSON.stringify({baseline:base,source:'actual Kairo VRM0 / actual V152 captured hover',
    candidates:reports,visuallyApproved:false,gameChanged:false},null,2));
  const count=fs.readdirSync(out).filter(x=>x.endsWith('.png')).length;
  assert.equal(count,12);
  console.log('PASS Kairo real-VRM authored head/chest/leg candidates',JSON.stringify({
   headMetrics:reports.map(x=>({id:x.id,headVsTorso:x.metrics.headVsTorsoAngle,
    trunk:x.metrics.trunkPitch,face:x.metrics.facialAxisToHorizontal})),
   screenshots:count
  }));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
