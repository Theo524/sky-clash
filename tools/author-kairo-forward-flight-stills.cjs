/* Kairo real VRM assistant-only static pose study.
 * Manual world-axis directions bake to exact local 20-bone quaternions.
 * Runs strictly in Pose Lab, no game flight or physics code touched.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const candidates=[
 {id:'i-calmer-cruise',body:40,upper:-7,neck:-35,head:-9,thighDown:.67,shinDown:.32,armDown:.60,forearmDown:.88},
 {id:'j-curved-athlete',body:46,upper:-9,neck:-42,head:-12,thighDown:.57,shinDown:.23,armDown:.55,forearmDown:.88},
 {id:'k-gaze-led-cruise',body:45,upper:-12,neck:-36,head:-17,thighDown:.60,shinDown:.27,armDown:.67,forearmDown:.92},
 {id:'l-forward-power',body:50,upper:-10,neck:-45,head:-11,thighDown:.46,shinDown:.17,armDown:.55,forearmDown:.85}
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
    {bone:'upperChest',axis:'right',degrees:-2}
   ];
   // Verified by real side-view renders: Kairo visibly faces +Z in Pose Lab;
   // therefore legs and arms must trail into -Z, not cross in front.
   // Target actual limb SEGMENTS on the true VRM, not guessed Euler axes.
   const aim=(bone,child,down,back,side=0)=>({
    bone,child,worldDirection:[side,-down,-back]});
   const aims=[
    aim('leftUpperLeg','leftLowerLeg',a.thighDown,.88,-.05),
    aim('rightUpperLeg','rightLowerLeg',a.thighDown+.08,.84,.05),
    aim('leftLowerLeg','leftFoot',a.shinDown,.97),
    aim('rightLowerLeg','rightFoot',a.shinDown+.05,.96),
    aim('leftUpperArm','leftLowerArm',a.armDown,.86,-.14),
    aim('rightUpperArm','rightLowerArm',a.armDown+.04,.83,.14),
    aim('leftLowerArm','leftHand',a.forearmDown,.36,-.08),
    aim('rightLowerArm','rightHand',a.forearmDown+.02,.30,.08)
   ];
   const result=await page.evaluate(({id,rotations,aims})=>
    window.SkyClashPoseLab.authorWorldPose({
     name:id+' – gaze and trailing limbs',time:1.2,rotations,aims}),{id:a.id,rotations,aims});
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
