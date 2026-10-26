/* V130 expedited ACTUAL Kairo VRM0/WebGL relaxed hover pose capture.
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

const output=path.resolve('visual-review-output','flight-guard-stills');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'sky-clash-flight-'));
const port=process.env.VISUAL_PORT||'8765';
const fps=Number(process.env.VISUAL_VIDEO_FPS||'24');
if(!Number.isInteger(fps)||fps<12||fps>30)
 throw new Error('Capture fps must be 12–30');
const versions=(process.env.VISUAL_PREVIEWS||'v138,v141').split(',')
 .map(s=>s.trim()).filter(Boolean);
if(!versions.length||versions.length>3||versions.some(s=>!/^v\d{3}$/.test(s))
 ||new Set(versions).size!==versions.length)
 throw new Error('Provide 1–3 distinct safe preview IDs like v119,v120');

const BOOST_REVIEW=process.env.VISUAL_BOOST_REVIEW==='1';
const views={front:0,side:Math.PI/2,back:Math.PI};
const count=13;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uri=preview=>'http://127.0.0.1:'+port+
 '/index.html?flightPreview='+(BOOST_REVIEW?'v153':preview)+
 (BOOST_REVIEW&&preview==='v154'?'&boostPreview=v154':'');
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
 if(BOOST_REVIEW){
  const common={elapsed:i*45/fps,height:2,forward:0,side:0,vertical:0};
  if(i===0||i===10||i===12)return {...common,name:'hover'};
  if(i===1)return {...common,name:'cruise',forward:6.2};
  if(i===2||i===3)return {...common,name:'boost-ground',height:.015,forward:18};
  if(i===4||i===5||i===7||i===11)return {...common,name:'boost-air',forward:22};
  if(i===6)return {...common,name:'boost-diagonal',forward:18,side:7};
  if(i===8)return {...common,name:'air-recover',forward:5};
  return {...common,name:'ground-run',height:.015,forward:5.4};
 }
 // Pose-gallery stages: 45 fixed animation steps PER stage so
 // hands have fully settled. These 13 photos are not a continuous
 // 13-frame physics film; the normal full film remains separately tested.
 const common={elapsed:i*45/fps,height:2,forward:0,side:0,vertical:0};
 if(i===0||i===1||i===12)return {...common,name:'hover'};
 if(i===2)return {...common,name:'cruise',forward:6.2};
 if(i===3)return {...common,name:'strafe-left',forward:3,side:-5};
 if(i===4)return {...common,name:'strafe-right',forward:3,side:5};
 if(i===5)return {...common,name:'ascend',forward:3,vertical:7};
 if(i===6)return {...common,name:'descend',forward:3,vertical:-7};
 if(i===7)return {...common,name:'backward',forward:-6.2};
 if(i===8)return {...common,name:'diagonal',forward:4.4,side:4.4};
 if(i===9)return {...common,name:'fast',forward:11.5};
 if(i===10)return {...common,name:'turn-left',forward:2};
 return {...common,name:'turn-right',forward:2};
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
    // Lock on specifically for combat retreat and strafing; forward
    // exploration should use free-camera movement in V150.
    g.lockOn=stage.name==='backward'||stage.name==='strafe-left'||
      stage.name==='strafe-right'||stage.name==='diagonal';
    p.moveIntent.set(stage.side?Math.sign(stage.side):0,0,
      Math.sign(stage.forward));
    p.v95JoystickRun=false;
    p.v89Step=p.v89Step||{mode:'idle',scale:0};
    p.v89Step.mode='idle';p.v89Step.scale=0;
    p.blockHeld=false;p.blocking=false;p.dashing=false;
    p.sprinting=stage.name==='boost'||stage.name.startsWith('boost-');
    p.jumping=false;p.dropping=false;p.v108JumpPrepT=0;p.landingMotionT=0;
    p.pos.y=p.floor+stage.height;
    p.model.root.position.y=g.__videoGroundY+stage.height;
    p.model.root.position.z=g.__videoStartZ;
    p.pos.z=g.__videoPosZ;
    for(let k=0;k<(i===0?90:45);k++){
     if(stage.name==='turn-left'||stage.name==='turn-right'){
      p.facing+=(stage.name==='turn-left'?-1:1)*.055;
      p.model.root.rotation.y=p.facing;
     }
     p.animate(1/fps);
    }
    const owner=window.SkyClashPoseAuthority;
    const boost=window.SkyClashPublishedActions;
    const h=p.vrmRig.vrm.humanoid;
    const point=n=>{
     const b=h.getNormalizedBoneNode(n);
     if(!b)return null;
     const v=b.getWorldPosition(new window.THREE.Vector3());
     return [v.x,v.y,v.z].map(x=>+x.toFixed(4));
    };
    const hip=h.getNormalizedBoneNode('hips')?.getWorldPosition(new window.THREE.Vector3()),
     neck=h.getNormalizedBoneNode('neck')?.getWorldPosition(new window.THREE.Vector3());
    const wholeBodyPitch=hip&&neck?Math.atan2(neck.z-hip.z,
      neck.y-hip.y)*180/Math.PI:null;
    return {frame:i,stage:stage.name,elapsed:stage.elapsed,
     boosted:!!p.sprinting,wholeBodyPitch:wholeBodyPitch===null?null:+wholeBodyPitch.toFixed(1),
     boostGroundMix:boost.v154GroundMix??0,
     boostAirStreamline:boost.v154AirStreamline??0,
     boostAction:boost.active||null,
     horizontalSpeed:Math.hypot(p.vel.x,p.vel.z),
     verticalSpeed:p.vel.y,lateralSpeed:p.vel.x,
     pose:owner.active,flightStyle:owner.flightStyle,
     flightBlend:owner.flightBlend||0,
     smoothedVertical:owner.flightSmoothedVertical||0,
     verticalPoseMode:owner.flightVerticalMode||null,
     verticalPoseWeight:owner.flightVerticalWeight??null,
     verticalPoseTorso:owner.flightVerticalTorso??null,
     verticalPoseLegs:owner.flightVerticalLegs??null,
     verticalPoseArms:owner.flightVerticalArms??null,
     horizontalPoseMode:owner.flightHorizontalMode||null,
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
     horizontalPoseWeight:owner.flightHorizontalWeight??null,
     horizontalPoseTorso:owner.flightHorizontalTorso??null,
     horizontalPoseLegs:owner.flightHorizontalLegs??null,
     horizontalPoseArms:owner.flightHorizontalArms??null,
     signedForward:owner.flightSignedForward??null,
     signedSide:owner.flightSignedSide??null,
     horizontalPoseSide:owner.flightHorizontalSide??null,
     horizontalPoseTurn:owner.flightHorizontalTurn??null,
     horizontalPoseFast:owner.flightHorizontalFast??null,
     horizontalPoseLaunch:owner.flightHorizontalLaunch??null,
     horizontalPoseBrake:owner.flightHorizontalBrake??null,
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
     flightReferenceSilhouette:owner.flightReferenceSilhouette||'not-tested',
     flightSuspendedSilhouette:owner.flightSuspendedSilhouette||'not-tested',
     flightAuthoredClip:owner.flightAuthoredClip||null,
     flightAuthoredPhase:owner.flightAuthoredPhase??null,
     leftAuthored:owner.flightAuthoredWorld?.left||null,
     rightAuthored:owner.flightAuthoredWorld?.right||null,
     leftSuspended:owner.flightSuspendedWorld?.left||null,
     rightSuspended:owner.flightSuspendedWorld?.right||null,
     leftReference:owner.flightReferenceWorld?.left||null,
     rightReference:owner.flightReferenceWorld?.right||null,
     leftSerene:owner.flightSereneWorld?.left||null,
     rightSerene:owner.flightSereneWorld?.right||null,
     flightPelvisBalanceWorld:owner.flightPelvisBalanceWorld||null,
     leftHolistic:owner.flightHolisticWorld?.left||null,
     rightHolistic:owner.flightHolisticWorld?.right||null,
     flightTorsoWorld:owner.flightTorsoWorld||null,
     leftFullBody:owner.flightFullBodyWorld?.left||null,
     rightFullBody:owner.flightFullBodyWorld?.right||null,
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
     leftKneeDropCm:owner.flightKneeWorld?.left?.hipToKneeDropCm??null,
     leftKneeBendDeg:owner.flightKneeWorld?.left?.kneeBendDeg??null,
     leftToeDropCm:owner.flightKneeWorld?.left?.toeDropCm??null,
     rightToeDropCm:owner.flightKneeWorld?.right?.toeDropCm??null,
     rightKneeBendDeg:owner.flightKneeWorld?.right?.kneeBendDeg??null,
     rightKneeDropCm:owner.flightKneeWorld?.right?.hipToKneeDropCm??null,
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
  if(!BOOST_REVIEW&&(timeline.length!==count||timeline.some(t=>t.pose!=='flight')))
   throw Error('Every quick guard photo must be real powered flight');
  if(preview==='v129'){
   for(const t of timeline){
    const left=t.leftGuard,right=t.rightGuard;
    if(t.flightGuardFacing!=='READY'||!left||!right||
       [left,right].some(g=>g.elbowAheadCm<=2||
         g.handAheadCm<=2||g.handAboveElbowCm<=0||
         g.elbowOutCm<=0||g.handBelowChestCm>=42))
     throw Error('V129 actual Kairo dangling hand in stage '+
      t.stage+': '+JSON.stringify([left,right]));
   }
  }
  if(preview==='v130'){
   for(const t of timeline){
    const left=t.leftRelaxed,right=t.rightRelaxed;
    if(t.flightRelaxedSilhouette!=='RELAXED'||!left||!right||
       [left,right].some(g=>g.elbowAheadCm<=-5||
        g.handAheadCm<=0||g.handAboveElbowCm>=0||
        g.elbowOutCm<=3||g.handBelowChestCm<=15||
        g.handBelowChestCm>=75))
     throw Error('V130 actual Kairo floating arms are not relaxed in '+
      t.stage+': '+JSON.stringify([left,right]));
   }
  }
  if(preview==='v131'){
   for(const t of timeline){
    const left=t.leftOrganic,right=t.rightOrganic;
    if(t.flightOrganicSilhouette!=='ORGANIC'||!left||!right||
       [left,right].some(g=>g.elbowAheadCm<=-3||
        g.handAheadCm<=7||g.handAboveElbowCm>=0||
        g.handAboveElbowCm<=-24||g.elbowOutCm<=4||
        g.handBelowChestCm<=13)||
       t.leftKneeDropCm===null||t.rightKneeDropCm===null||
       !(t.rightKneeDropCm-t.leftKneeDropCm>8))
     throw Error('V131 actual Kairo lacks balanced floating silhouette in '+
      t.stage+': '+JSON.stringify(t));
   }
  }
  if(preview==='v132'){
   for(const t of timeline){
    const left=t.leftBuoyant,right=t.rightBuoyant;
    if(t.flightBuoyantSilhouette!=='BUOYANT'||!left||!right||
       [left,right].some(g=>g.elbowAheadCm<=-3||
         g.handAheadCm<=8||g.handAheadCm>=18||
         g.handAboveElbowCm>=-18||g.handAboveElbowCm<=-29||
         g.elbowOutCm<=4||g.handBelowChestCm<=18)||
       t.leftKneeDropCm===null||t.rightKneeDropCm===null||
       !(t.rightKneeDropCm-t.leftKneeDropCm>6))
      throw Error('V132 actual Kairo buoyant hover is not well formed in '+
       t.stage+': '+JSON.stringify(t));
   }
  }
  if(preview==='v133'){
   for(const t of timeline){
    if(t.flightWeightlessSilhouette!=='FLOATING'||
       !t.leftWeightless||!t.rightWeightless)
      throw Error('V133 must have BOTH open drifting arms on actual Kairo: '+
       JSON.stringify(t));
   }
   // The exact recurring failure of V128–V132: eight nearly identical
   // stationary body poses despite different motion input. Reject a
   // V133 recording if elbows, hands and knees did not visibly move.
   const range=values=>Math.max(...values)-Math.min(...values);
   const armMotion=range(timeline.map(t=>t.leftWeightless.elbowOutCm));
   const kneeMotion=range(timeline.map(t=>t.leftKneeDropCm));
   const handMotion=range(timeline.map(t=>t.leftWeightless.handAheadCm));
   if(!(armMotion>1.5&&kneeMotion>2&&handMotion>1.5))
    throw Error('V133 is another frozen hover: '+
      JSON.stringify({armMotion,kneeMotion,handMotion}));
   console.log('REAL KAiro V133 visible motion CM',
    JSON.stringify({armMotion,kneeMotion,handMotion}));
  }
  if(preview==='v134'){
   const range=xs=>Math.max(...xs)-Math.min(...xs);
   for(const t of timeline){
    const gs=[t.leftNatural,t.rightNatural];
    if(t.flightNaturalSilhouette!=='NATURAL'||
       gs.some(g=>!g||g.elbowOutCm<=5||g.elbowOutCm>=14||
        g.handOutCm>=24||g.handBelowChestCm<=13))
      throw Error('V134 actual VRM frame has airplane-arm or stiff guard: '+
       JSON.stringify(t));
   }
   const elbowMotion=range(timeline.map(t=>t.leftNatural.elbowOutCm));
   const kneeMotion=range(timeline.map(t=>t.leftKneeDropCm));
   if(!(elbowMotion>1.0&&kneeMotion>1.5))
    throw Error('V134 has regressed to a static hover: '+
     JSON.stringify({elbowMotion,kneeMotion}));
   console.log('V134 VERIFIED REAL-VRM MOTION CM',
    JSON.stringify({elbowMotion,kneeMotion}));
  }
  if(preview==='v135'){
   for(const frame of timeline){
    if(frame.flightNaturalSilhouette!=='NATURAL'||
       frame.leftKneeBendDeg===null||frame.rightKneeBendDeg===null||
       frame.rightKneeBendDeg<25||frame.rightKneeBendDeg>60||
       !frame.leftNatural||!frame.rightNatural)
      throw Error('V135 real-Kairo trailing knee or approved arms failed: '+
       JSON.stringify(frame));
   }
  }
  if(preview==='v136'){
   for(const t of timeline){
    const arms=[t.leftFullBody,t.rightFullBody];
    if(t.flightFullBodySilhouette!=='COHERENT'||
       !t.flightTorsoWorld||t.flightTorsoWorld.residualTiltDeg>12||
       arms.some(a=>!a||a.elbowOutCm<5||a.elbowOutCm>17||
        a.handAheadCm<8||a.handBelowChestCm<12)||
       t.leftToeDropCm===null||t.rightToeDropCm===null)
      throw Error('V136 real Kairo does not show coherent whole-body flight: '+
       JSON.stringify(t));
   }
  }
  if(preview==='v137'){
   for(const t of timeline){
    const arms=[t.leftHolistic,t.rightHolistic];
    if(t.flightHolisticSilhouette!=='SUSPENDED'||
       !t.flightPelvisBalanceWorld||
       t.flightPelvisBalanceWorld.residualTiltDeg>12||
       !t.flightTorsoWorld||t.flightTorsoWorld.residualTiltDeg>12||
       arms.some(a=>!a||a.elbowOutCm<5||a.elbowOutCm>16||
        a.handAheadCm<4||a.handBelowChestCm<14)||
       t.leftShinBackCm<9||t.rightShinBackCm<9||
       t.leftToeDropCm<4||t.rightToeDropCm<4)
     throw Error('V137 real Kairo entire-body flight not balanced: '+
       JSON.stringify(t));
   }
  }
  if(preview==='v138'){
   for(const t of timeline){
    const arms=[t.leftSerene,t.rightSerene];
    if(t.flightSereneSilhouette!=='RELAXED'||
       !t.flightPelvisBalanceWorld||t.flightPelvisBalanceWorld.residualTiltDeg>13||
       arms.some(a=>!a||a.elbowOutCm<1||a.elbowOutCm>10||
        a.handAheadCm>12||a.handBelowChestCm<23)||
       t.leftToeDropCm==null||t.rightToeDropCm==null||
       t.leftToeDropCm<11||t.rightToeDropCm<11||
       t.leftKneeBendDeg==null||t.rightKneeBendDeg==null||
       t.leftKneeBendDeg<10||t.rightKneeBendDeg<10||
       t.leftKneeBendDeg>43||t.rightKneeBendDeg>43)
     throw Error('V138 actual Kairo failed reference-like serene hover: '+
       JSON.stringify(t));
   }
  }
  if(preview==='v141'){
   for(const m of timeline){
    if(m.flightSuspendedSilhouette!=='RELAXED'||
       !m.leftSuspended||!m.rightSuspended||
       m.leftKneeBendDeg<19||m.leftKneeBendDeg>53||
       m.rightKneeBendDeg<18||m.rightKneeBendDeg>53||
       m.leftToeDropCm<10||m.rightToeDropCm<10)
      throw Error('V141 real Kairo geometry failed; visual art review still required: '+JSON.stringify(m));
   }
  }
  if(preview==='v140'){
   for(const m of timeline){
    if(m.flightReferenceSilhouette!=='RELAXED'||
       !m.leftReference||!m.rightReference||
       m.leftKneeBendDeg<14||m.leftKneeBendDeg>49||
       m.rightKneeBendDeg<13||m.rightKneeBendDeg>49)
      throw Error('V140 real Kairo reference-balanced flight did not meet whole silhouette: '+JSON.stringify(m));
   }
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
 if(versions.includes('v134')&&versions.includes('v135')){
  const a=reports.find(x=>x.preview==='v134').timeline;
  const b=reports.find(x=>x.preview==='v135').timeline;
  let softened=0;
  for(let i=0;i<b.length;i++){
   const bendImprovement=b[i].rightKneeBendDeg-a[i].rightKneeBendDeg;
   if(bendImprovement>4)softened++;
   if(Math.abs(b[i].leftKneeBendDeg-a[i].leftKneeBendDeg)>1.0)
    throw Error('V135 must not alter approved V134 lead knee: '+
     JSON.stringify({before:a[i],after:b[i]}));
   for(const side of ['leftNatural','rightNatural']){
    if(Math.abs(b[i][side].handOutCm-a[i][side].handOutCm)>1.0)
     throw Error('V135 cannot change approved V134 arms: '+side);
   }
  }
  if(softened<6)throw Error('V135 trailing leg not visibly softer in >=6/8 frames: '+softened);
  console.log('PASS actual Kairo V135 softer right knee across '+softened+'/8 flight views with V134 arms and lead knee preserved');
 }
 if(versions.includes('v136')&&versions.includes('v137')){
  const old=reports.find(c=>c.preview==='v136').timeline;
  const next=reports.find(c=>c.preview==='v137').timeline;
  let improved=0;
  for(let i=0;i<next.length;i++){
   const a=old[i],b=next[i];
   // The V136 video proves toe drop is already correct; V137 fixes
   // the WHOLE pelvis-to-neck line and removes the midair stepping
   // thigh placement. Verify that change, not a toe gain repeated.
   const lessStep=(a.leftKneeForwardCm-b.leftKneeForwardCm);
   if(lessStep>3&&b.flightPelvisBalanceWorld&&
      b.flightPelvisBalanceWorld.residualTiltDeg<12)improved++;
  }
  if(improved<6)throw Error('V137 still reads as a stepping walker instead of a floating body: '+
   improved+' / 8');
  console.log('PASS V137 real-VRM 3-view pelvis + thigh silhouette improved in',
    improved+'/8 flight stages');
 }
 if(versions.includes('v137')&&versions.includes('v138')){
  const old=reports.find(c=>c.preview==='v137').timeline;
  const fresh=reports.find(c=>c.preview==='v138').timeline;
  let improved=0;
  for(let i=0;i<fresh.length;i++){
   const a=old[i],b=fresh[i];
   const oldReach=(a.leftHolistic.handAheadCm+a.rightHolistic.handAheadCm)/2;
   const newReach=(b.leftSerene.handAheadCm+b.rightSerene.handAheadCm)/2;
   if(oldReach-newReach>5)improved++;
  }
  if(improved<6)
   throw Error('V138 hands still visibly reach forward in real Kairo '+improved+'/8');
  console.log('PASS real Kairo V138 downward relaxed arm silhouette in',
   improved,'of 8 stages');
 }
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
