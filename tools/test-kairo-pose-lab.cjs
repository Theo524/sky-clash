/* Kairo Pose Lab WebGL acceptance: real VRM, actual joint edit, exact
 * model hash, quaternion track export/import, image and legacy game safety.
 */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader-webgl','--enable-webgl',
  '--disable-web-security=false'
 ]});
 const page=await browser.newPage({viewport:{width:1260,height:840},deviceScaleFactor:1,
  acceptDownloads:true});
 const failures=[];page.on('pageerror',e=>failures.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')failures.push(m.text());});
 try{
  const u='http://127.0.0.1:'+(process.env.VISUAL_PORT||'8765')+'/pose-lab.html';
  await page.goto(u,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SkyClashPoseLab?.ready,null,{timeout:180000});
  const first=await page.evaluate(()=>{
   const lab=window.SkyClashPoseLab;
   return {count:lab.motion.bones.length,sha:lab.modelHash,
    keyframes:lab.keyframeCount,metrics:lab.metrics,
    area:document.querySelector('#modelView').getBoundingClientRect().toJSON(),
    source:lab.motion.source};
  });
  assert(first.count>=18&&first.count<=20,'Must use real Kairo VRM normalized rig');
  assert.equal(first.sha.length,64);
  assert.equal(first.keyframes,2);
  assert(first.metrics.leftKnee!==null&&first.metrics.rightKnee!==null);
  assert(first.area.width>400&&first.area.height>400);
  assert(first.source.includes('NOT gameplay-approved'));
  const before=await page.evaluate(()=>window.SkyClashPoseLab.motion.keyframes[0].quaternions);
  await page.selectOption('#bone','leftLowerArm');
  await page.evaluate(()=>{
   const el=document.getElementById('timeline');el.value='250';
   el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.evaluate(()=>{
   const el=document.getElementById('x');el.value='41';
   el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const after=await page.evaluate(()=>{
   const lab=window.SkyClashPoseLab;
   return {motion:lab.motion,metrics:lab.metrics,stage:document.getElementById('status').textContent};
  });
  assert.equal(after.motion.keyframes.length,3);
  assert.equal(after.motion.schema,'sky-clash.pose-lab.v1');
  assert.equal(after.motion.modelSha256,first.sha);
  const idx=after.motion.bones.indexOf('leftLowerArm');
  assert(idx>=0);
  assert.notDeepEqual(after.motion.keyframes[1].quaternions[idx],before[idx],
   'Direct normalized forearm rotation must create a different, saved quaternion');
  assert(after.motion.keyframes[1].quaternions[idx].every(Number.isFinite));
  const download=page.waitForEvent('download');
  await page.click('#export');const out=await download;
  assert.equal(out.suggestedFilename(),'kairo-pose-keyframes-v1.json');
  const saved=path.resolve('visual-review-output','pose-lab');
  fs.mkdirSync(saved,{recursive:true});await out.saveAs(path.join(saved,'kairo-pose-keyframes-v1.json'));
  const data=JSON.parse(fs.readFileSync(path.join(saved,'kairo-pose-keyframes-v1.json'),'utf8'));
  assert.equal(data.keyframes.length,3);
  assert.equal(data.modelSha256,first.sha);
  await page.locator('#fileImport').setInputFiles({
   name:'kairo-reimport.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))
  });
  await page.waitForFunction(()=>document.getElementById('status')?.textContent.includes('Imported 3'));
  const snapshot=page.waitForEvent('download');
  await page.click('#snapshot');const img=await snapshot;
  assert(img.suggestedFilename().endsWith('.png'));
  await img.saveAs(path.join(saved,'kairo-pose-view.png'));
  const png=fs.readFileSync(path.join(saved,'kairo-pose-view.png'));
  assert(png.length>10000&&png[0]===137&&png[1]===80,'Real WebGL preview screenshot must be a PNG');
  await page.screenshot({path:path.join(saved,'pose-lab-screen.png'),animations:'disabled'});
  // V152 reference must be the same real game pose (not rest T-pose),
  // portable only for the exact unchanged SHA-256 Kairo model.
  await page.click('#loadHover');
  await page.waitForFunction(()=>document.getElementById('status')?.textContent.includes('Loaded exact V152'));
  const originalPose=await page.evaluate(()=>window.SkyClashPoseLab.motion);
  const resp=await page.request.get('http://127.0.0.1:'+(process.env.VISUAL_PORT||'8765')+
   '/assets/animations/reference/kairo-v152-hover.pose.json');
  assert(resp.ok(),'Real V152 reference must actually exist in checked-out game');
  const published=await resp.json();
  assert.deepEqual(originalPose.keyframes[0].quaternions,published.keyframes[0].quaternions);
  assert.equal(originalPose.modelSha256,first.sha);
  await page.click('[data-view="side"]');
  await page.locator('#showJoints').uncheck();
  await page.screenshot({path:path.join(saved,'v152-captured-pose-side.png'),animations:'disabled'});
  assert.equal(failures.length,0,'Unexpected browser errors: '+failures.join('\n'));
  fs.writeFileSync(path.join(saved,'results.json'),JSON.stringify({
   modelSha256:first.sha,bones:first.count,
   trackKeys:after.motion.keyframes.length,
   editedBone:'leftLowerArm',actualKneeMeasurements:first.metrics,
   screenshotBytes:png.length,passes:true},null,2));
  console.log('PASS Kairo real-VRM Pose Lab: 20-bone direct pose edit, 3 interpolated keyframes, SHA export/import, WebGL PNG');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
