/* Browser-rendered visual QA for Kairo's REAL VRM.
 * GitHub Actions runs a software-WebGL Chromium against the actual website,
 * captures front/side views at frozen jump phases and uploads PNGs/metrics.
 * No browser credentials, screenshots, game modification or user device needed.
 * This is a developer visual aid; target-phone appearance can still differ.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const out=path.resolve('visual-review-output');
fs.mkdirSync(out,{recursive:true});
const port=process.env.VISUAL_PORT||'8765';
const previews=(process.env.VISUAL_PREVIEWS||'v119,v120').split(',')
 .filter(x=>/^v\d{3}$/.test(x));
const phases=[
 ['idle',null,500],
 ['load',.12,500],
 ['compressed',.18,500],
 ['takeoff','takeoff',90],
 ['rising','rising',170],
 ['apex','apex',330]
];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function previewUrl(preview){return 'http://127.0.0.1:'+port+'/index.html?jumpPreview='+preview;}
async function run(){
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage',
  '--disable-features=Vulkan','--no-sandbox'
 ]});
 const output=[];
 try{
  for(const preview of previews){
   const page=await browser.newPage({viewport:{width:1152,height:768},
     deviceScaleFactor:1});
   page.on('pageerror',error=>console.warn('PAGE ERROR',preview,String(error)));
   page.on('console',m=>{if(m.type()==='error')
    console.warn('CONSOLE ERROR',preview,m.text().slice(0,350));});
   console.log('VISUAL opening',previewUrl(preview));
   await page.goto(previewUrl(preview),{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>!!(window.SKY_V104_ANIMATIONS_READY&&
    window.SkyClashPoseAuthority?.ready&&
    window.SkyClash?.Game?.player?.vrmRig?.vrm?.scene),
    {timeout:180000});
   // The REAL decoded 16MB Kairo is essential. Never substitute the
   // procedural avatar and call it a successful screenshot.
   const meta=await page.evaluate(()=>{
    const s=window.SkyClash,vrm=s.Game.player.vrmRig.vrm;
    const canvas=document.querySelector('canvas');
    const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
    return {realVRM:!!vrm?.humanoid,
     nodeCount:vrm?.scene?.children?.length??0,
     hasLeftArm:!!vrm?.humanoid?.getNormalizedBoneNode('leftUpperArm'),
     webGL:!!gl,glRenderer:gl?.getParameter(gl.RENDERER)||'none',
     imageWidth:canvas?.width||0,imageHeight:canvas?.height||0};
   });
   console.log('VISUAL MODEL',preview,JSON.stringify(meta));
   if(!meta.realVRM||!meta.hasLeftArm||!meta.webGL)
    throw new Error('Could not verify REAL Kairo WebGL render for '+preview);
   await page.evaluate(()=>{
    const s=window.SkyClash,g=s.Game;
    g.enterDojo();
    g.introT=0;
    g.player.blockHeld=false;g.player.blocking=false;
    g.player.facing=0;g.player.model.root.rotation.y=0;
    // Pose is advanced by the REAL animation chain but physics/input is
    // frozen, so screenshots show a repeatable deterministic silhouette.
    g.update=dt=>g.player.animate(dt);
    s.CameraRig.rig.pitch=.17;
    s.CameraRig.rig.yaw=0;
    document.querySelectorAll('.sky-lab-panel').forEach(n=>n.style.display='none');
   });
   await sleep(1200);
   for(const [name,t,settle] of phases){
    await page.evaluate(({t,name})=>{
     const g=window.SkyClash.Game,p=g.player;
     p.facing=0;p.model.root.rotation.y=0;
     p.vel.x=p.vel.z=0;p.sprinting=false;p.dashing=false;
     p.v108JumpPrepDuration=.215;
     if(name==='idle'){
      p.v108JumpPrepT=0;p.jumping=false;p.vel.y=0;
      p.pos.y=p.floor;
     }else if(typeof t==='number'){
      p.v108JumpPrepT=Math.max(.0001,.215-t);
      p.jumping=false;p.vel.y=0;p.pos.y=p.floor;
     }else{
      p.v108JumpPrepT=0;p.jumping=true;
      p.pos.y=p.floor+1.1;p.vel.y=name==='apex'?1.5:13;
     }
    },{t,name});
    await sleep(settle);
    for(const [view,yaw] of [['front',0],['side',Math.PI/2]]){
     await page.evaluate(yaw=>{const c=window.SkyClash.CameraRig;
      c.rig.yaw=yaw;c.rig.pitch=.17;c.update(0,true);},yaw);
     await sleep(80);
     const filename=preview+'-'+name+'-'+view+'.png';
     await page.screenshot({path:path.join(out,filename),
      animations:'disabled',timeout:25000});
    }
    const measurement=await page.evaluate(()=>{
     const p=window.SkyClash.Game.player,h=p.vrmRig.vrm.humanoid;
     const bone=n=>h.getNormalizedBoneNode(n);
     const world=n=>{const b=bone(n);if(!b)return null;
      const v=b.getWorldPosition(new window.THREE.Vector3());
      return [v.x,v.y,v.z].map(a=>+a.toFixed(4));};
     return {phase:window.SkyClashPoseAuthority?.active,
      armStyle:window.SkyClashPoseAuthority?.armStyle,
      armDrive:window.SkyClashPoseAuthority?.jumpArmDrive,
      knee:window.SkyClashPoseAuthority?.prepWorldKneeCm,
      prep:window.SkyClashPoseAuthority?.jumpPrep,
      leftWrist:world('leftHand'),rightWrist:world('rightHand'),
      leftElbow:world('leftLowerArm'),rightElbow:world('rightLowerArm'),
      leftShoulder:world('leftUpperArm'),
      rightShoulder:world('rightUpperArm')};
    });
    console.log('VISUAL CAPTURE',preview,name,JSON.stringify(measurement));
    output.push({preview,name,measurement});
   }
   await page.close();
  }
  fs.writeFileSync(path.join(out,'measurements.json'),
   JSON.stringify({date:new Date().toISOString(),results:output},null,2));
 }finally{await browser.close();}
 console.log('VISUAL PASS wrote '+output.length*2+
  ' real WebGL PNG frames and '+output.length+' bone snapshots');
}
run().catch(e=>{console.error('VISUAL FAILURE',e.stack||String(e));process.exitCode=1;});
