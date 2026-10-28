/* PR #146 source-motion audit ONLY: render V87's already-recorded Mixamo
 * rotations on the REAL Kairo VRM, through the existing V72 animation owner.
 * This script neither modifies the game nor activates Storm Fist v3 in live play.
 *
 * Deliberately label this "V87 on Kairo", not "original FBX": the compact
 * recording has no animated root translation, FK skeleton or contact tracks.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');

const OUT=path.resolve(process.env.KAIRO_V87_AUDIT_OUTPUT||
  'visual-review-output/v87-on-real-kairo');
const URL=(process.env.PLAYTEST_BASE_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const FPS=30;
const VIEW={
  front:[1.2,1.55,-5.0],
  side:[5.0,1.55,.15],
};
const entries=[
  {name:'side-kick',slot:'sideKick',kind:'sideKick',id:'mxRSideKick'},
  {name:'roundhouse',slot:'kick',kind:'spinKick',id:'mxRRoundhouse'},
];
const packed=JSON.parse(fs.readFileSync(
  'assets/animations/gameplay/v87-recorded-combat.json','utf8'));
const slots=Object.fromEntries(packed.motions.map(m=>[m.slot,m]));
for(const c of entries){
  const m=slots[c.slot];
  assert(m&&m.sourceId===c.id&&m.character==='kairo','Wrong V87 source');
  assert(m.encoding==='int16-le-xyzw-world-bind-delta-base64');
  assert.equal(Buffer.from(m.data,'base64').length,m.frames*20*4*2);
}
fs.mkdirSync(OUT,{recursive:true});

function movie(directory,basename,rate){
  const video=path.join(OUT,basename+'.mp4');
  const args=['-hide_banner','-loglevel','error','-y','-framerate',String(FPS),
    '-i',path.join(directory,'frame-%04d.jpg')];
  if(rate===.5)args.push('-vf','setpts=2.0*PTS','-r',String(FPS));
  args.push('-c:v','libx264','-crf','21','-pix_fmt','yuv420p',
    '-movflags','+faststart',video);
  execFileSync('ffmpeg',args);
  return video;
}

async function main(){
  const browser=await chromium.launch({headless:true,
    args:['--no-sandbox','--enable-webgl','--use-gl=angle',
      '--use-angle=swiftshader','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:960,height:720}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const report={source:'V87 already recorded Mixamo world-bind-delta rotations',
    warning:'Not raw source FBX; no root translations or source skeleton preserved.',
    nativeStormFistEnabled:false,model:'assets/characters/kairo.vrm',
    fps:FPS,motions:[],errors};
  try{
    const res=await page.goto(URL+'?recordedCombat=on',
      {waitUntil:'domcontentloaded',timeout:180000});
    assert(res.ok(),'Local game did not load');
    await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
      window.SkyClashPublishedActions?.ready&&
      window.SkyClashPublishedActions?.combatClips?.includes('sideKick')&&
      window.SkyClashPublishedActions?.combatClips?.includes('kick')&&
      window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
      null,{timeout:180000});
    await page.locator('#trainBtn').click();
    await page.waitForFunction(()=>
      !document.getElementById('titleScreen').classList.contains('show'));
    await page.evaluate(()=>{
      const s=window.SkyClash,g=s.Game,p=g.player,e=g.enemy;
      assertKairo();
      function assertKairo(){
        if(p.characterId!=='kairo_venn')throw Error('Wrong character');
        if(window.SkyClashPublishedActions.nativeCombatSet)
          throw Error('Native experiment unexpectedly enabled');
      }
      g.update=()=>{};
      s.CameraRig.update=()=>{};
      window.requestAnimationFrame=()=>0;
      const canvas=document.querySelector('canvas');
      if(!(canvas.getContext('webgl2')||canvas.getContext('webgl')))
        throw Error('Actual WebGL is unavailable');
      e.vrmRig.vrm.scene.visible=false;
      for(const id of ['controls','walkLabStatus','dojoTools','combatHUD']){
        const element=document.getElementById(id);
        if(element)element.style.display='none';
      }
      const label=document.createElement('div');label.id='v87AuditLabel';
      label.style.cssText='position:fixed;top:14px;left:14px;z-index:99999;'+
        'pointer-events:none;background:#081423d9;color:white;'+
        'font:19px monospace;padding:10px 14px;border-radius:5px';
      document.body.appendChild(label);
      window.__v87Audit={s,g,p,e,render:()=>g.loop(g._last||0)};
    });
    for(const c of entries){
      const m=slots[c.slot];
      const duration=(m.attackEnd-m.attackStart);
      const totalFrames=Math.ceil(duration*FPS)+1;
      const obs=[];
      await page.evaluate(({kind})=>{
        const {p,e,s}=window.__v87Audit;
        p.reset();e.reset();
        p.pos.set(0,p.floor,0);p.spawn.copy(p.pos);
        p.vel.set(0,0,0);p.moveIntent.set(0,0,0);
        p.facing=0;p.t=12;p.stun=0;p.blockHeld=false;p.blocking=false;
        p.attackAir=false;p.launched=false;p.spiked=false;p.jumping=false;
        p.flying=false;p.downT=0;p.acro=null;p.punchT=0;
        for(let n=0;n<90;n++)p.animate(1/60);
        p.attackKind=kind;p.attackSerial=123;
        p.punchT=9;p.attackElapsed=0;p.attackTotal=1;
        p.v72StudioPack.weight=1;
        s.CameraRig.update=()=>{};
      },{kind:c.kind});
      for(let f=0;f<totalFrames;f++){
        const seconds=Math.min(duration,f/FPS);
        const sample=await page.evaluate(({seconds,duration,slot,name})=>{
          const q=window.__v87Audit,{p,s}=q,T=window.THREE;
          p.punchT=9;p.attackElapsed=seconds;p.attackTotal=duration;
          // V72's recorded-body owner applies the V87 full-body rotations.
          p.v72StudioPack.weight=1;
          p.animate(1/30);
          s.scene?.updateMatrixWorld?.(true);
          const h=p.vrmRig.vrm.humanoid,where=bone=>
            h.getNormalizedBoneNode(bone).getWorldPosition(new T.Vector3()).toArray();
          if(p.v72StudioPack.slot!==slot)
            throw Error('Expected V87 '+slot+'; got '+p.v72StudioPack.slot);
          document.getElementById('v87AuditLabel').textContent=
            'V87 '+name+' | REAL KAIRO | '+seconds.toFixed(2)+'s';
          return {t:seconds,slot:p.v72StudioPack.slot,
            hips:where('hips'),rightKnee:where('rightLowerLeg'),
            rightFoot:where('rightFoot'),leftFoot:where('leftFoot'),
            leftKnee:where('leftLowerLeg'),leftHand:where('leftHand'),
            rightHand:where('rightHand')};
        },{seconds,duration,slot:c.slot,name:c.name});
        obs.push(sample);
        for(const [view,offset] of Object.entries(VIEW)){
          await page.evaluate(({offset})=>{
            const q=window.__v87Audit,{p,s,T}=q,cam=s.camera;
            cam.position.set(p.pos.x+offset[0],p.pos.y+offset[1],
              p.pos.z+offset[2]);
            cam.lookAt(p.pos.x,p.pos.y+1.03,p.pos.z);
            cam.fov=39;cam.updateProjectionMatrix();
            q.render();
          },{offset});
          const dir=path.join(OUT,c.name+'-'+view+'-frames');
          fs.mkdirSync(dir,{recursive:true});
          await page.screenshot({path:path.join(dir,
            'frame-'+String(f).padStart(4,'0')+'.jpg'),type:'jpeg',quality:89});
        }
      }
      for(const view of Object.keys(VIEW)){
        const dir=path.join(OUT,c.name+'-'+view+'-frames');
        movie(dir,c.name+'-v87-on-kairo-'+view+'-normal',1);
        movie(dir,c.name+'-v87-on-kairo-'+view+'-half-speed',.5);
        fs.rmSync(dir,{recursive:true,force:true});
      }
      report.motions.push({name:c.name,slot:c.slot,sourceId:m.sourceId,
        sourceFile:m.sourceFile,sourceFrames:m.frames,sourceSeconds:m.seconds,
        sampledWindow:{start:m.attackStart,end:m.attackEnd},
        sampleFrames:obs.length,
        note:'V87 runtime trims original clip to attackStart..attackEnd',
        observations:obs});
    }
    assert.equal(errors.length,0,'Game reported browser errors');
    fs.writeFileSync(path.join(OUT,'v87-kairo-audit.json'),
      JSON.stringify(report,null,2)+'\n');
    console.log('PASS: isolated real-Kairo V87 side-kick/roundhouse comparison');
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
