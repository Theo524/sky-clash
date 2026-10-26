/* V126 powered-flight visual QA using Kairo's actual VRM0/WebGL pose stack.
 * Produces repeatable 24fps front/side/back MP4s AND same-clock A/B composites.
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

const output=path.resolve('visual-review-output','flight-videos');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'sky-clash-flight-'));
const port=process.env.VISUAL_PORT||'8765';
const fps=Number(process.env.VISUAL_VIDEO_FPS||'24');
if(!Number.isInteger(fps)||fps<12||fps>30)
 throw new Error('Capture fps must be 12–30');
const versions=(process.env.VISUAL_PREVIEWS||'v137,v138').split(',')
 .map(s=>s.trim()).filter(Boolean);
if(!versions.length||versions.length>3||versions.some(s=>!/^v\d{3}$/.test(s))
 ||new Set(versions).size!==versions.length)
 throw new Error('Provide 1–3 distinct safe preview IDs like v119,v120');

const views={front:0,side:Math.PI/2,back:Math.PI};
const count=60;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uri=preview=>'http://127.0.0.1:'+port+
 '/index.html?flightPreview='+(preview==='v157'?'v156&flightBank=v157':preview);
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
 // 60 samples, 2.5s at 24fps; hover/cruise/turn/rise/fall/brake,
 // then Boost interrupt and settle. Only pose velocity is prescribed:
 // no animation modifies Kairo's real gameplay physics.
 const common={elapsed:i/fps,height:2,forward:0,side:0,vertical:0};
 if(i<4)return {...common,name:'ground',height:0};
 if(i<12)return {...common,name:'hover'};
 if(i<20)return {...common,name:'accelerate',forward:6.2*(i-12)/7};
 if(i<26)return {...common,name:'cruise',forward:6.2};
 if(i<31)return {...common,name:'strafe-left',forward:4,side:-5};
 if(i<36)return {...common,name:'strafe-right',forward:4,side:5};
 if(i<42)return {...common,name:'backward',forward:-6.2};
 if(i<46)return {...common,name:'ascend',forward:3,vertical:7};
 if(i<50)return {...common,name:'descend',forward:3,vertical:-7};
 if(i<54)return {...common,name:'brake',forward:6.2*(53-i)/4};
 if(i<57)return {...common,name:'boost',forward:6.2};
 return {...common,name:'recover'};
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
  console.log('FLIGHT VIDEO LOAD',preview,uri(preview));
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
  await page.evaluate(mode=>{
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
   // The dojo spawns Kairo near its +Z outer wall. A real V95
   // running jump travels >11m in two seconds, so footage would be
   // occluded by arena walls even though the pose itself was correct.
   // Move only the disposable QA fighter to center court FIRST; then
   // continue physically translating and following the real root.
   const qaOffset=-20;
   g.__videoStartZ=g.player.model.root.position.z+qaOffset;
   g.__videoPosZ=g.player.pos.z+qaOffset;
   g.player.model.root.position.z=g.__videoStartZ;
   g.player.pos.z=g.__videoPosZ;
   g.__videoMode=mode;
   g.__videoFrame=0;
   g.__videoCam=yaw=>{
    const center=g.player.model.root.getWorldPosition(new window.THREE.Vector3());
    center.y+=1.08;
    const distance=2.9; // V129: real 3D elbows/hands readable on QA film
    s.camera.position.set(center.x+Math.sin(yaw)*distance,
     center.y+.65,center.z+Math.cos(yaw)*distance);
    s.camera.lookAt(center);s.camera.updateMatrixWorld(true);
   };
   g.__videoCam(0);
   // Real game rendering remains active; physics is deterministic and frozen.
   // Reuse the regular canvas instead of injecting a parallel WebGL scene.
  },'standing');
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
    p.t=(p.t||0)+1/fps;
    p.facing=0;p.model.root.rotation.y=0;
    p.vel.x=stage.side;p.vel.y=stage.vertical;p.vel.z=stage.forward;
    // Real camera lock decision drives V150's distinct retreat animation.
    g.lockOn=stage.name==='backward'||stage.name==='strafe-left'||
      stage.name==='strafe-right';
    g.CameraRigLockForReview=g.lockOn;
    p.moveIntent.set(stage.side?Math.sign(stage.side):0,0,
      stage.forward?Math.sign(stage.forward):0);
    p.v95JoystickRun=false;
    p.v89Step=p.v89Step||{mode:'idle',scale:0};
    p.v89Step.mode='idle';p.v89Step.scale=0;
    p.blockHeld=false;p.blocking=false;p.dashing=false;
    p.sprinting=stage.name==='boost';
    p.jumping=false;p.dropping=false;p.v108JumpPrepT=0;p.landingMotionT=0;
    p.pos.y=p.floor+stage.height;
    p.model.root.position.y=g.__videoGroundY+stage.height;
    p.model.root.position.z=g.__videoStartZ;
    p.pos.z=g.__videoPosZ;
    if(i===0)for(let k=0;k<90;k++)p.animate(1/fps);
    else p.animate(1/fps);
    const owner=window.SkyClashPoseAuthority;
    const h=p.vrmRig.vrm.humanoid;
    const point=n=>{
     const b=h.getNormalizedBoneNode(n);
     if(!b)return null;
     const v=b.getWorldPosition(new window.THREE.Vector3());
     return [v.x,v.y,v.z].map(x=>+x.toFixed(4));
    };
    return {frame:i,stage:stage.name,elapsed:stage.elapsed,
     horizontalSpeed:Math.hypot(p.vel.x,p.vel.z),
     verticalSpeed:p.vel.y,lateralSpeed:p.vel.x,
     pose:owner.active,flightStyle:owner.flightStyle,
     flightBlend:owner.flightBlend||0,
     flightBankDegrees:owner.flightBankDegrees??0,
     flightBankTarget:owner.flightBankTarget??0,
     flightBankLateral:owner.flightBankLateral??0,
     flightBankTurnRate:owner.flightBankTurnRate??0,
     inputStrength:owner.flightInputStrength??null,
     lockedRetreat:owner.flightRetreatLocked??null,
     inputForward:owner.flightInputForward??null,
     travelArmBlend:owner.flightTravelArmBlend??null,
     travelHandBlend:owner.flightTravelHandBlend??null,
     travelArmMode:owner.flightTravelArmMode||null,
     quietHover:owner.flightQuietHover??null,
     trailingElbow:owner.flightTrailingElbow??null,
     trailingHand:owner.flightTrailingHand??null,
     trailingPose:owner.flightTrailingPose||null,
     streamlineWeight:owner.flightStreamlineWeight??null,
     streamlineTarget:owner.flightStreamlineTarget??null,
     streamlineDegrees:owner.flightStreamlineDegrees??null,
     horizontalPoseMode:owner.flightHorizontalMode??null,
     smoothedVertical:owner.flightSmoothedVertical||0,
     smoothedLateral:owner.flightSmoothedLateral||0,
     airFacingDriftDeg:owner.airFacingDriftDeg||0,
     flightMaxStepDeg:owner.flightMaxStepDeg||0,
     flightKneeFacing:owner.flightKneeFacing||'not-tested',
     flightGuardFacing:owner.flightGuardFacing||'not-tested',
     flightRelaxedSilhouette:owner.flightRelaxedSilhouette||'not-tested',
     flightOrganicSilhouette:owner.flightOrganicSilhouette||'not-tested',
     flightBuoyantSilhouette:owner.flightBuoyantSilhouette||'not-tested',
     flightWeightlessSilhouette:owner.flightWeightlessSilhouette||'not-tested',
     flightNaturalSilhouette:owner.flightNaturalSilhouette||'not-tested',
     flightFullBodySilhouette:owner.flightFullBodySilhouette||'not-tested',
     flightHolisticSilhouette:owner.flightHolisticSilhouette||'not-tested',
     flightSereneSilhouette:owner.flightSereneSilhouette||'not-tested',
     leftSerene:owner.flightSereneWorld?.left||null,
     rightSerene:owner.flightSereneWorld?.right||null,
     flightPelvisBalanceWorld:owner.flightPelvisBalanceWorld||null,
     leftHolistic:owner.flightHolisticWorld?.left||null,
     rightHolistic:owner.flightHolisticWorld?.right||null,
     flightTorsoWorld:owner.flightTorsoWorld||null,
     leftFullBody:owner.flightFullBodyWorld?.left||null,
     rightFullBody:owner.flightFullBodyWorld?.right||null,
     leftToeDropCm:owner.flightKneeWorld?.left?.toeDropCm??null,
     rightToeDropCm:owner.flightKneeWorld?.right?.toeDropCm??null,
     leftKneeBendDeg:owner.flightKneeWorld?.left?.kneeBendDeg??null,
     rightKneeBendDeg:owner.flightKneeWorld?.right?.kneeBendDeg??null,
     leftNatural:owner.flightNaturalWorld?.left||null,
     rightNatural:owner.flightNaturalWorld?.right||null,
     leftWeightless:owner.flightWeightlessWorld?.left||null,
     rightWeightless:owner.flightWeightlessWorld?.right||null,
     leftBuoyant:owner.flightBuoyantWorld?.left||null,
     rightBuoyant:owner.flightBuoyantWorld?.right||null,
     leftOrganic:owner.flightOrganicWorld?.left||null,
     rightOrganic:owner.flightOrganicWorld?.right||null,
     leftRelaxed:owner.flightRelaxedWorld?.left||null,
     rightRelaxed:owner.flightRelaxedWorld?.right||null,
     leftGuard:owner.flightGuardWorld?.left||null,
     rightGuard:owner.flightGuardWorld?.right||null,
     leftKneeForwardCm:owner.flightKneeWorld?.left?.kneeForwardCm??null,
     rightKneeForwardCm:owner.flightKneeWorld?.right?.kneeForwardCm??null,
     leftShinBackCm:owner.flightKneeWorld?.left?.shinBackCm??null,
     rightShinBackCm:owner.flightKneeWorld?.right?.shinBackCm??null,
     leftHand:point('leftHand'),rightHand:point('rightHand'),
     leftElbow:point('leftLowerArm'),rightElbow:point('rightLowerArm'),
     leftKnee:point('leftLowerLeg'),rightKnee:point('rightLowerLeg'),
     leftFoot:point('leftFoot'),rightFoot:point('rightFoot'),
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
   if(i%12===0)console.log('FLIGHT VIDEO FRAME',preview,i,count,
    datum.stage,datum.pose,datum.flightBlend);
  }
  if(page.isClosed())throw Error('Browser closed before all motion frames');
  if(timeline.length!==count||Object.values(dirs).some(d=>readdir(d).length!==count))
   throw Error('Incomplete video frames');
  const flight=timeline.filter(t=>t.stage!=='ground'&&t.stage!=='boost');
  if(flight.some(t=>t.pose!=='flight')||flight.length<45||
    timeline.filter(t=>t.stage==='boost').some(t=>t.pose==='flight'))
   throw Error('Missing true flight state or Boost handoff, observed: '+
    timeline.map(t=>t.stage+':'+t.pose).join(' '));
  if(!flight.some(t=>t.flightBlend>90))
   throw Error('Flight speed blend never reached forward cruising');
  if(!flight.some(t=>t.leftKnee&&t.rightKnee&&t.leftHand&&t.rightHand))
   throw Error('Kairo VRM bones missing from recorded flight telemetry');
  if(preview==='v128'||preview==='v129'){
   // Frame 20+ is well beyond the ~260ms flight-entry blend. Checking
   // REAL WebGL VRM0 geometry closes the failure path of V127's fake
   // forward-knee result on an idealized synthetic bone tree.
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&
    t.pose==='flight');
   if(settled.length<15||settled.some(t=>
     t.flightKneeFacing!=='FORWARD'||
     !(t.leftKneeForwardCm>0&&t.rightKneeForwardCm>0&&
       t.leftShinBackCm>0&&t.rightShinBackCm>0)))
    throw Error('V128 ACTUAL-Kairo backward shin in settled flight: '+
     JSON.stringify(settled.map(t=>[t.frame,t.flightKneeFacing,
      t.leftKneeForwardCm,t.rightKneeForwardCm,
      t.leftShinBackCm,t.rightShinBackCm])));
  }
  if(preview==='v129'){
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&t.pose==='flight');
   if(settled.length<15||settled.some(t=>
    t.flightGuardFacing!=='READY'||!t.leftGuard||!t.rightGuard||
    [t.leftGuard,t.rightGuard].some(g=>
      !(g.elbowAheadCm>2&&g.handAheadCm>2&&
        g.handAboveElbowCm>0&&g.elbowOutCm>0&&
        g.handBelowChestCm<42))))
    throw Error('V129 REAL KAIRO hands not guarded: '+JSON.stringify(
     settled.map(t=>[t.frame,t.flightGuardFacing,t.leftGuard,t.rightGuard])));
  }
  if(preview==='v130'){
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&t.pose==='flight');
   if(settled.length<15||settled.some(t=>
    t.flightRelaxedSilhouette!=='RELAXED'||!t.leftRelaxed||!t.rightRelaxed||
    [t.leftRelaxed,t.rightRelaxed].some(g=>
     !(g.elbowAheadCm>-5&&g.handAheadCm>0&&
      g.handAboveElbowCm<0&&g.elbowOutCm>3&&
      g.handBelowChestCm>15&&g.handBelowChestCm<75))))
    throw Error('V130 real Kairo relaxed hover failed: '+JSON.stringify(
     settled.map(t=>[t.frame,t.flightRelaxedSilhouette,t.leftRelaxed,t.rightRelaxed])));
  }
  if(preview==='v131'){
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&t.pose==='flight');
   if(settled.length<15||settled.some(t=>t.flightOrganicSilhouette!=='ORGANIC'||
    !t.leftOrganic||!t.rightOrganic))
    throw Error('V131 real Kairo organic flight geometry failed');
  }
  if(preview==='v132'){
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&t.pose==='flight');
   if(settled.length<15||settled.some(t=>t.flightBuoyantSilhouette!=='BUOYANT'||
     !t.leftBuoyant||!t.rightBuoyant))
    throw Error('V132 Kairo buoyant flight silhouette failed video geometry');
  }
  if(preview==='v133'){
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&t.pose==='flight');
   if(settled.length<15||settled.some(t=>t.flightWeightlessSilhouette!=='FLOATING'||
     !t.leftWeightless||!t.rightWeightless))
     throw Error('V133 real-Kairo continuous video arm silhouette failed');
  }
  if(preview==='v134'){
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&t.pose==='flight');
   if(settled.length<15||settled.some(t=>
     t.flightNaturalSilhouette!=='NATURAL'||!t.leftNatural||!t.rightNatural||
     [t.leftNatural,t.rightNatural].some(g=>g.elbowOutCm>=14||g.handOutCm>=24)))
    throw Error('V134 real Kairo has winged arms during continuous flying');
  }
  if(preview==='v135'){
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&t.pose==='flight');
   if(settled.length<15||settled.some(t=>
     t.flightNaturalSilhouette!=='NATURAL'||t.rightKneeBendDeg==null||
     t.rightKneeBendDeg<25||t.rightKneeBendDeg>60))
    throw Error('V135 continuous flight trailing knee must bend softly without losing V134 arms');
  }
  if(preview==='v136'){
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&t.pose==='flight');
   if(settled.length<15||settled.some(t=>
    t.flightFullBodySilhouette!=='COHERENT'||
    !t.flightTorsoWorld||t.flightTorsoWorld.residualTiltDeg>12||
    t.leftToeDropCm==null||t.leftToeDropCm<4||
    t.rightToeDropCm==null||t.rightToeDropCm<4))
    throw Error('V136 real continuous Kairo full-body flight is crouched/flat-footed');
  }
  if(preview==='v137'){
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&t.pose==='flight');
   if(settled.length<15||settled.some(t=>
    t.flightHolisticSilhouette!=='SUSPENDED'||
    !t.flightPelvisBalanceWorld||t.flightPelvisBalanceWorld.residualTiltDeg>12||
    !t.flightTorsoWorld||t.flightTorsoWorld.residualTiltDeg>12||
    t.leftToeDropCm==null||t.leftToeDropCm<4||
    t.rightToeDropCm==null||t.rightToeDropCm<4))
    throw Error('V137 real continuous Kairo motion is not balanced in its entire pelvis/spine/limbs');
  }
  if(preview==='v138'){
   const settled=timeline.filter(t=>t.frame>=20&&t.frame<=47&&t.pose==='flight');
   if(settled.length<15||settled.some(t=>
      t.flightSereneSilhouette!=='RELAXED'||
      !t.leftSerene||!t.rightSerene||
      t.leftSerene.handAheadCm>=12||t.rightSerene.handAheadCm>=12||
      t.leftToeDropCm==null||t.leftToeDropCm<11||
      t.rightToeDropCm==null||t.rightToeDropCm<11||
      t.leftKneeBendDeg==null||t.leftKneeBendDeg>43||
      t.rightKneeBendDeg==null||t.rightKneeBendDeg>43))
      throw Error('V138 filmed full-body hover must have hanging relaxed arms and softly flexed legs');
  }
  if(preview==='v157'){
    const left=timeline.filter(t=>t.stage==='strafe-left');
    const right=timeline.filter(t=>t.stage==='strafe-right');
    const cruise=timeline.filter(t=>t.stage==='cruise');
    const bank=t=>t.flightBankDegrees;
    if(left.length!==5||right.length!==5||
       !left.some(t=>bank(t)<-3)||
       !right.some(t=>bank(t)>3)||
       !cruise.every(t=>Math.abs(bank(t))<.2)||
       [...left,...right].some(t=>Math.abs(bank(t))>13.1))
     throw Error('V157 real Kairo bank direction or Q cruise incorrect: '+
       JSON.stringify({left:left.map(bank),right:right.map(bank),cruise:cruise.map(bank)}));
    if(![...left,...right].every(t=>t.flightStyle?.includes('V157')))
     throw Error('V157 real game flight owner missing on steering frames');
    console.log('REAL KAIRO V157 BANK QA',JSON.stringify({
     left:left.map(bank),right:right.map(bank),cruise:cruise.map(bank)}));
   }
   if(pages.length)console.warn('FLIGHT VIDEO JS WARNINGS',preview,pages.slice(0,8));
  for(const [view,folder] of Object.entries(dirs)){
   const dest=path.join(output,preview+'-'+view+'.mp4');
   encode(folder,dest);
   if(fs.statSync(dest).size<10000)
    throw Error('Empty/unusable MP4 '+dest);
  }
  console.log('FLIGHT VIDEO ENCODED',preview,'frames='+count);
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
   note:'deterministic powered-flight pose/velocity input, not phone gameplay',
   captures:reports},null,2));
 // Remove the 200+ intermediate JPEGs. Only small MP4s and a JSON
 // report are uploaded as GitHub Actions artifacts.
 fs.rmSync(scratch,{recursive:true,force:true});
 console.log('FLIGHT VIDEO PASS',JSON.stringify({
  versions,fps,frames:count,outputs:readdir(output)}));
})().catch(e=>{console.error('FLIGHT VIDEO FAILURE',e.stack||e);process.exitCode=1});
