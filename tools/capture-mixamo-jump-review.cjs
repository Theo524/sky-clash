/* Real Kairo / normal Training visual review. No separate lab UI or
 * animation controller is installed; this script runs only in CI. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const base='http://127.0.0.1:'+(process.env.VISUAL_PORT||'8765')+'/';
const out=path.resolve('visual-review-output/kairo-source-jumps');
fs.mkdirSync(out,{recursive:true});
const phases=[8,19,28,36,44,52,59,66,79,96];
const html=['<!doctype html><html><head><meta charset="utf-8"><title>Real Kairo Mixamo jump review</title>',
'<style>body{background:#101720;color:#eff4fc;font:14px system-ui;margin:24px}',
'h1{font-size:23px}h2{margin-top:40px}.frames{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}',
'figure{margin:0;background:#202c3b;padding:10px}img{width:100%;display:block}figcaption{margin:8px 0;font-size:13px}</style></head><body>',
'<h1>Sky Clash: actual normal-game Mixamo jumps</h1>',
'<p>Real Kairo VRM · physical Fighter.update at 60 Hz · normal Training · no custom jump controller, debug pose or manual animation slot injection. This is for visual evaluation, not proof of aesthetic quality.</p>'];
async function run(){
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage',
  '--disable-features=Vulkan','--no-sandbox']});
 const results=[];
 try{
  for(const moving of [false,true]){
   const name=moving?'moving':'standing';
   const page=await browser.newPage({viewport:{width:1080,height:720},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(base+'index.html?scene=dojo',{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
     window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid&&
     window.SkyClashPublishedActions?.jumpSequence?.active,
     null,{timeout:180000});
   const setup=await page.evaluate(moving=>{
    const game=window.SkyClash.Game,p=game.player;
    game.enterDojo();game.introT=0;game.update=()=>{};
    window.SkyClash.CameraRig.update=()=>{};
    window.requestAnimationFrame; // keep real WebGL render loop alive
    const title=document.getElementById('titleScreen');
    if(title){title.classList.remove('show');title.setAttribute('aria-hidden','true');
     title.style.setProperty('display','none','important');}
    document.querySelectorAll('.title-screen,.menu-overlay,.loading-overlay').forEach(el=>
      el.style.setProperty('display','none','important'));
    for(const key of ['stun','downT','slamLagT','punchT','blastT','landingMotionT',
      'v108JumpPrepT','v108JumpPrepDuration'])p[key]=0;
    p.hp=100;p.blockHeld=false;p.blocking=false;p.acro=null;
    p.sprinting=false;p.dashing=false;p.jumping=false;p.dropping=false;p.vert=0;
    p.pos.y=p.floor;p.pos.x=0;p.pos.z=0;
    p.facing=0;p.model.root.rotation.y=0;
    p.vel.set(moving?5:0,0,0);
    p.moveIntent.set(moving?1:0,0,0);
    p.v72StudioPack.slot=null;p.v72StudioPack.clock=0;
    p.v72StudioPack.cleanJump=null;
    window.__jumpVisual={current:0};
    return {started:p.tryJump(),realVRM:!!p.vrmRig?.vrm?.humanoid};
   },moving);
   if(!setup.started||!setup.realVRM)throw Error('No real Kairo physical jump '+name);
   html.push('<h2>'+name+' jump</h2><div class="frames">');
   for(const frame of phases){
    const data=await page.evaluate(frame=>{
     const game=window.SkyClash.Game,p=game.player;
     for(let i=window.__jumpVisual.current;i<=frame;i++)p.update(1/60);
     window.__jumpVisual.current=frame+1;
     return {frame,slot:p.v72StudioPack.slot,clock:+p.v72StudioPack.clock.toFixed(3),
      height:+(p.pos.y-p.floor).toFixed(3),vy:+p.vel.y.toFixed(3),
      sourcePhase:p.v72StudioPack.cleanJump?.phase||null};
    },frame);
    for(const [view,yaw]of[['front',0],['side',Math.PI/2]]){
     await page.evaluate(yaw=>{
      const s=window.SkyClash,g=s.Game,p=g.player;
      const target=p.model.root.getWorldPosition(new window.THREE.Vector3());
      target.y+=1.12;
      s.camera.position.set(target.x+Math.sin(yaw)*3.6,target.y+.75,
       target.z+Math.cos(yaw)*3.6);
      s.camera.lookAt(target);s.camera.updateMatrixWorld(true);
     },yaw);
     await page.waitForTimeout(115);
     const filename=name+'-frame-'+String(frame).padStart(3,'0')+'-'+view+'.png';
     await page.screenshot({path:path.join(out,filename),
       animations:'disabled',timeout:30000});
     html.push('<figure><img src="'+filename+'"><figcaption>'+view+
      ' · frame '+frame+' · '+data.slot+' '+data.clock+'s · height '+data.height+
      'm · vy '+data.vy+'m/s</figcaption></figure>');
    }
    results.push({trial:name,...data});
   }
   html.push('</div>');
   if(errors.length)throw Error('Browser error during '+name+': '+errors.join('; '));
   await page.close();
  }
  html.push('</body></html>');
  fs.writeFileSync(path.join(out,'review.html'),html.join('\n'));
  fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(results,null,2));
  console.log('Captured '+(results.length*2)+' real-Kairo normal-physics WebGL PNGs in '+out);
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
