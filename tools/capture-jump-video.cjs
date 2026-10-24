/* Temporal visual QA for the REAL Kairo VRM in Sky Clash.
 * Produces repeatable 24fps front/side MP4s AND same-clock A/B composites.
 * Virtual animation time advances at fixed 1/fps while browser render
 * time is irrelevant; screenshots are source frames, ffmpeg encodes video.
 * This is an offscreen developer workflow. It never changes gameplay files.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');

const output=path.resolve('visual-review-output','videos');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'sky-clash-motion-'));
const port=process.env.VISUAL_PORT||'8765';
const fps=Number(process.env.VISUAL_VIDEO_FPS||'24');
if(!Number.isInteger(fps)||fps<12||fps>30)
 throw new Error('Capture fps must be 12–30');
const versions=(process.env.VISUAL_PREVIEWS||'v119,v120').split(',')
 .map(s=>s.trim()).filter(Boolean);
if(!versions.length||versions.length>3||versions.some(s=>!/^v\d{3}$/.test(s))
 ||new Set(versions).size!==versions.length)
 throw new Error('Provide 1–3 distinct safe preview IDs like v119,v120');

const views={front:0,side:Math.PI/2};
const count=48;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uri=preview=>'http://127.0.0.1:'+port+
 '/index.html?jumpPreview='+preview;
const readdir=p=>fs.readdirSync(p);
fs.mkdirSync(output,{recursive:true});
function ffmpeg(...args){
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],
  {stdio:'inherit',timeout:150000});
}
function encode(frames,out){
 ffmpeg('-framerate',String(fps),'-start_number','0','-i',
  path.join(frames,'%03d.jpg'),'-c:v','libx264','-preset','veryfast',
  '-crf','25','-pix_fmt','yuv420p','-movflags','+faststart',out);
}
function compose(left,right,dest,labels){
 const draw=(text,x)=>'drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'+
 ':text='+text+':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.6'+
 ':boxborderw=9:x='+x+':y=15';
 // Use input order, not string parsing from filenames. Filenames contain
 // only whitelisted preview IDs.
 ffmpeg('-i',left,'-i',right,'-filter_complex',
  '[0:v]'+draw(labels[0],'20')+'[a];'+
  '[1:v]'+draw(labels[1],'20')+'[b];'+
  '[a][b]hstack=inputs=2[v]',
  '-map','[v]','-an','-c:v','libx264','-crf','26',
  '-preset','veryfast','-pix_fmt','yuv420p',
  '-movflags','+faststart',dest);
}
function motionDescriptor(i){
 // Physically meaningful 2.0 second film strip, matched by index for
 // comparison across preview versions and camera angles.
 if(i<5)return {name:'idle',elapsed:0,height:0};
 if(i<11)return {name:'prep',elapsed:.215*(i-5)/6,height:0};
 if(i<32){
  const t=(i-11)/fps;
  return {name:'jump',elapsed:t,
   height:Math.max(.04,14*t-12.5*t*t)};
 }
 if(i<40){
  const t=(i-32)/7;
  return {name:'fall',elapsed:t,
   height:Math.max(.06,1.45*(1-t)),vel:-6-6*t};
 }
 return {name:'landing',elapsed:(i-40)/fps,height:0};
}
async function capture(browser,preview){
 const context=await browser.newContext({viewport:{width:960,height:640},
  deviceScaleFactor:1});
 const page=await context.newPage();
 const pages=[];
 page.on('pageerror',e=>pages.push(String(e).slice(0,700)));
 page.on('console',m=>{if(m.type()==='error'&&pages.length<12)
  pages.push(m.text().slice(0,700));});
 try{
  console.log('VIDEO LOAD',preview,uri(preview));
  await page.goto(uri(preview),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>!!(
    window.SKY_V104_ANIMATIONS_READY&&
    window.SkyClashPoseAuthority?.ready&&
    window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid&&
    window.SkyClash?.Game?.player?.vrmRig?.vrm?.scene
  ),null,{timeout:180000});
  const info=await page.evaluate(()=>{
   const g=window.SkyClash.Game,vrm=g.player.vrmRig.vrm;
   const canvas=document.querySelector('canvas');
   const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
   return {realVRM:!!vrm?.humanoid&&
    !!vrm.humanoid.getNormalizedBoneNode('leftUpperArm')&&
    !!vrm.humanoid.getNormalizedBoneNode('rightFoot'),
    webgl:!!gl,canvasSize:[canvas?.width||0,canvas?.height||0]};
  });
  if(!info.realVRM||!info.webgl)
   throw new Error('Missing actual Kairo VRM/WebGL — cannot record substitute');
  await page.evaluate(()=>{
   const s=window.SkyClash,g=s.Game;
   g.enterDojo();
   const title=document.getElementById('titleScreen');
   if(title){title.style.setProperty('display','none','important');
    title.classList.remove('show');}
   for(const el of document.querySelectorAll(
    '.title-screen,.menu-overlay,.loading-overlay,[data-screen="title"]'))
    el.style.setProperty('display','none','important');
   g.showPlayUI(true);g.introT=0;
   // The game's debug HUD overlays Kairo's waist, knees and hands
   // in small screenshots. Hide ONLY DOM overlays in this disposable
   // headless capture page; preserve the actual WebGL canvas and its
   // ancestor layout so the physical model is unobstructed in video.
   const canvas=document.querySelector('canvas');
   if(!canvas)throw new Error('Cannot create video without gameplay canvas');
   for(const el of document.body.querySelectorAll('*')){
    if(el===canvas||el.contains(canvas))continue;
    el.style.setProperty('visibility','hidden','important');
   }
   g.player.blockHeld=false;g.player.blocking=false;
   g.player.facing=0;g.player.model.root.rotation.y=0;
   g.update=()=>{};s.CameraRig.update=()=>{};
   g.__videoGroundY=g.player.model.root.position.y;
   g.__videoFrame=0;
   g.__videoCam=yaw=>{
    const center=g.player.model.root.getWorldPosition(new window.THREE.Vector3());
    center.y+=1.08;
    s.camera.position.set(center.x+Math.sin(yaw)*3.35,
     center.y+.8,center.z+Math.cos(yaw)*3.35);
    s.camera.lookAt(center);s.camera.updateMatrixWorld(true);
   };
   g.__videoCam(0);
   // Real game rendering remains active; physics is deterministic and frozen.
   // Reuse the regular canvas instead of injecting a parallel WebGL scene.
  });
  const qa=await page.evaluate(()=>{
   const g=window.SkyClash.Game,t=document.getElementById('titleScreen'),
    c=document.querySelector('canvas');
   return {playing:g.state==='playing',
    titleHidden:!t||getComputedStyle(t).display==='none',
    canvasVisible:!!c&&getComputedStyle(c).visibility!=='hidden'&&
     c.getBoundingClientRect().width>100};
  });
  if(!qa.playing||!qa.titleHidden||!qa.canvasVisible)
   throw Error('Visual capture must display WebGL Kairo without title/UI overlay');

  // Give model loaders and UI one stable RAF, then start a new fixed-time
  // sequence. One step is exactly 1/24 s, not screenshot wall time.
  await sleep(150);
  const dirs={};
  for(const view of Object.keys(views)){
   const folder=path.join(scratch,preview,view);
   fs.mkdirSync(folder,{recursive:true});dirs[view]=folder;
  }
  const timeline=[];
  for(let i=0;i<count;i++){
   const stage=motionDescriptor(i);
   const datum=await page.evaluate(({i,stage,fps})=>{
    const g=window.SkyClash.Game,p=g.player;
    p.facing=0;p.model.root.rotation.y=0;
    p.vel.x=p.vel.z=0;p.sprinting=false;p.blockHeld=false;
    p.v108JumpPrepDuration=.215;
    p.landingMotionT=0;
    if(stage.name==='idle'){
     p.v108JumpPrepT=0;p.jumping=false;p.dropping=false;
     p.pos.y=p.floor;p.vel.y=0;
     p.model.root.position.y=g.__videoGroundY;
     if(i===0)for(let k=0;k<90;k++)p.animate(1/fps);
     else p.animate(1/fps);
    }else if(stage.name==='prep'){
     p.jumping=false;p.dropping=false;p.vel.y=0;
     p.pos.y=p.floor;p.model.root.position.y=g.__videoGroundY;
     p.v108JumpPrepT=Math.max(.0001,.215-stage.elapsed);
     p.animate(1/fps);
    }else if(stage.name==='jump'){
     p.v108JumpPrepT=0;p.jumping=true;p.dropping=false;
     p.pos.y=p.floor+stage.height;
     p.model.root.position.y=g.__videoGroundY+stage.height;
     p.vel.y=14-25*stage.elapsed;
     p.animate(1/fps);
    }else if(stage.name==='fall'){
     p.v108JumpPrepT=0;p.jumping=false;p.dropping=true;
     p.pos.y=p.floor+stage.height;
     p.model.root.position.y=g.__videoGroundY+stage.height;
     p.vel.y=stage.vel;p.animate(1/fps);
    }else{
     p.v108JumpPrepT=0;p.jumping=false;p.dropping=false;
     p.pos.y=p.floor;p.vel.y=0;
     p.model.root.position.y=g.__videoGroundY;
     p.landingMotionT=.36-stage.elapsed;
     p.animate(1/fps);
    }
    const owner=window.SkyClashPoseAuthority;
    const h=p.vrmRig.vrm.humanoid;
    const point=n=>{
     const b=h.getNormalizedBoneNode(n);
     if(!b)return null;
     const v=b.getWorldPosition(new window.THREE.Vector3());
     return [v.x,v.y,v.z].map(x=>+x.toFixed(4));
    };
    return {frame:i,stage:stage.name,elapsed:stage.elapsed,
     pose:owner.active,armStyle:owner.armStyle,
     armDrive:owner.jumpArmDrive,
     leftHand:point('leftHand'),rightHand:point('rightHand'),
     leftElbow:point('leftLowerArm'),rightElbow:point('rightLowerArm'),
     leftToe:point('leftToes'),rightToe:point('rightToes')};
   },{i,stage,fps});
   timeline.push(datum);
   for(const [view,yaw] of Object.entries(views)){
    await page.evaluate(yaw=>window.SkyClash.Game.__videoCam(yaw),yaw);
    // Screenshot captures are expensive under SwiftShader. The game pose
    // stays FROZEN, so their latency cannot alter the source animation age.
    await page.evaluate(()=>new Promise(requestAnimationFrame));
    await page.screenshot({path:path.join(dirs[view],
     String(i).padStart(3,'0')+'.jpg'),type:'jpeg',
     quality:83,animations:'disabled',timeout:30000});
   }
   if(i%12===0)console.log('VIDEO FRAME',preview,i,count,
    datum.stage,datum.pose,datum.armDrive);
  }
  if(page.isClosed())throw Error('Browser closed before all motion frames');
  if(timeline.length!==count||Object.values(dirs).some(d=>readdir(d).length!==count))
   throw Error('Incomplete video frames');
  const distinct=new Set(timeline.map(t=>t.pose));
  if(!distinct.has('prep')||!distinct.has('jump'))
   throw Error('Video did not exercise real unified prep and jump pose owner: '+[...distinct]);
  if(pages.length)console.warn('VIDEO JS WARNINGS',preview,pages.slice(0,8));
  for(const [view,folder] of Object.entries(dirs)){
   const dest=path.join(output,preview+'-'+view+'.mp4');
   encode(folder,dest);
   if(fs.statSync(dest).size<10000)
    throw Error('Empty/unusable MP4 '+dest);
  }
  console.log('VIDEO ENCODED',preview,'frames='+count);
  return {preview,info,frameRate:fps,frames:count,timeline,
   files:Object.keys(dirs).map(view=>preview+'-'+view+'.mp4')};
 }finally{
  await context.close();
 }
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage',
  '--disable-features=Vulkan','--no-sandbox'
 ]});
 const reports=[];
 try{
  for(const preview of versions)
   reports.push(await capture(browser,preview));
 }finally{await browser.close();}
 if(versions.length===2){
  for(const view of Object.keys(views)){
   compose(path.join(output,versions[0]+'-'+view+'.mp4'),
    path.join(output,versions[1]+'-'+view+'.mp4'),
    path.join(output,versions.join('-vs-')+'-'+view+'.mp4'),
    versions);
  }
 }
 fs.writeFileSync(path.join(output,'motion-metrics.json'),
  JSON.stringify({source:'real Kairo VRM WebGL pose stack',
   note:'deterministic pose-clock frame recordings, not phone captures',
   captures:reports},null,2));
 // Remove the 200+ intermediate JPEGs. Only small MP4s and a JSON
 // report are uploaded as GitHub Actions artifacts.
 fs.rmSync(scratch,{recursive:true,force:true});
 console.log('VIDEO PASS',JSON.stringify({
  versions,fps,frames:count,outputs:readdir(output)}));
})().catch(e=>{console.error('VIDEO FAILURE',e.stack||e);process.exitCode=1});
