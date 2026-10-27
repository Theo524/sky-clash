/* Smoke the published entry point: no test registration or bone injection. */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=(process.env.PLAYTEST_BASE_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox',
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 try{
  for(const mode of ['default','jab','fallback']){
   const page=await browser.newPage({viewport:{width:800,height:600}});
   const errors=[],requests=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('request',r=>{if(r.url().includes('original-jab-playtest'))requests.push(r.url());});
   if(mode==='fallback')await page.route('**/original-jab-playtest.v1.json*',route=>
    route.fulfill({status:404,contentType:'application/json',body:'{}'}));
   try{
    const url=base+(mode==='default'?'':'?combatAnim=blender-jab-v1');
    const response=await page.goto(url,{waitUntil:'domcontentloaded'});
    assert(response.ok(),'Entry page unavailable');
    await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
     window.SkyClashPublishedActions?.ready&&
     window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid&&
     window.SkyClash?.Game?.enemy?.vrmRig?.vrm?.humanoid,null,{timeout:180000});
    await page.locator('#trainBtn').click();
    await page.waitForFunction(()=>!document.getElementById('titleScreen').classList.contains('show'));
    const report=await page.evaluate(({mode})=>{
     const s=window.SkyClash,g=s.Game,p=g.player,e=g.enemy,T=window.THREE;
     const status=window.SkyClashPublishedActions;
     const canvas=document.querySelector('canvas');
     if(!(canvas.getContext('webgl2')||canvas.getContext('webgl')))throw Error('WebGL unavailable');
     g.update=()=>{};s.CameraRig.update=()=>{};window.requestAnimationFrame=()=>0;
     g.mode='dojo';g.dojoRival=true;g.introT=0;
     const checks=[];
     for(const fps of [30,60,120]){
      p.reset();e.reset();p.pos.set(0,p.floor,0);e.pos.set(0,e.floor,1.45);
      p.vel.set(0,0,0);e.vel.set(0,0,0);p.moveIntent.set(0,0,0);
      p.facing=0;e.facing=Math.PI;p.t=12;p.attackSerial=0;p.comboCycle=0;
      p.combo=0;p.meleeCd=0;p.lastMelee=-20;p.blockHeld=false;p.stun=0;
      for(let i=0;i<90;i++)p.animate(1/60);
      const idleNative=p.v72StudioPack.nativePreviewActive;
      s.Combat.melee(p,e);let nativeFrames=0;
      for(let i=0;i<Math.ceil(fps*.9);i++){
       p.update(1/fps);e.update(1/fps);
       if(p.v72StudioPack.nativePreviewActive)nativeFrames++;
       s.Effects.update(1/fps);s.Spectacle.update(1/fps);
      }
      p.blockHeld=true;for(let i=0;i<Math.ceil(fps*.3);i++)p.update(1/fps);
      const guard=!!p.blocking&&p.v72StudioPack.slot==='guard'&&!p.v72StudioPack.nativePreviewActive;
      p.blockHeld=false;for(let i=0;i<Math.ceil(fps*.4);i++)p.update(1/fps);
      const idle=p.v72StudioPack.slot==='idle'&&!p.v72StudioPack.nativePreviewActive;
      // Ordinary controller movement still runs after recovering from jab.
      const before=p.pos.clone();p.moveIntent.set(1,0,0);
      for(let i=0;i<Math.ceil(fps*.8);i++)p.update(1/fps);
      const moved=p.pos.distanceTo(before)>.05;p.moveIntent.set(0,0,0);
      checks.push({fps,nativeFrames,idleNative,damage:100-e.hp,guard,idle,moved});
     }
     return {character:p.characterId,playtest:status.nativePlaytest,
      runtimeError:g.lastRuntimeError||null,checks,
      vrmVisible:!!p.vrmRig.vrm.scene.visible,model:p.vrmRig.vrm.scene.name};
    },{mode});
    assert.equal(report.character,'kairo_venn');assert.equal(report.runtimeError,null);
    assert(report.vrmVisible,'Loaded model is hidden');
    assert.equal(report.playtest.state,mode==='jab'?'ready':mode==='fallback'?'fallback':'off');
    assert.equal(requests.length,mode==='default'?0:1);
    for(const check of report.checks){
     assert.equal(check.idleNative,false);assert(check.damage>0);
     assert(check.guard&&check.idle&&check.moved,'Guard/recovery/movement broke: '+JSON.stringify(check));
     assert.equal(check.nativeFrames>0,mode==='jab','Incorrect jab activation');
    }
    assert.deepEqual(errors,[],'Uncaught browser error');
    console.log('PASS playable entry',mode,JSON.stringify(report));
   }finally{await page.close();}
  }
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
