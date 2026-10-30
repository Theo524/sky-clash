/* Real-Kairo VRM animation writer audit, executed only by Playwright CI.
 * Intercepts boot JavaScript in memory; no files in the game are changed.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const base=(process.env.PLAYTEST_BASE_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const out=path.resolve('visual-review-output/real-vrm-writers');
const bones=[...require('../docs/KAIRO-RIG-CONTRACT.v1.json').targetBoneNames,'leftToes','rightToes'];
const hook=fs.readFileSync(path.join(__dirname,'real-vrm-writer-hook.cjs'),'utf8');
const boot=fs.readFileSync(path.join(root,'js/v66-game-boot.js'),'utf8');
const marker="  await script('js/game.js?v=1530&startup=104&stormFist=3');";
assert(boot.includes(marker),'Boot instrument anchor changed');
const modified=boot.replace(marker,marker+'\n'+hook);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
fs.mkdirSync(out,{recursive:true});
async function run(browser,variant){
 const context=await browser.newContext({viewport:{width:960,height:640}});
 const page=await context.newPage(),errors=[];let intercepted=0;
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/js/v66-game-boot.js*',async route=>{
  intercepted++;await route.fulfill({status:200,contentType:'application/javascript',body:modified});
 });
 try{
  const query=variant==='storm-v3'?'?scene=dojo&combatAnim=storm-fist-v3':'?scene=dojo';
  const response=await page.goto(base+'index.html'+query,{waitUntil:'domcontentloaded',timeout:45000});
  assert(response.ok(),'Cannot load index.html');
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPoseAuthority?.ready&&window.__skyWriterAudit?.installed&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
   null,{timeout:180000});
  const result=await page.evaluate(({bones,variant})=>{
   const sky=window.SkyClash,g=sky.Game,p=g.player,e=g.enemy,trace=window.__skyWriterAudit;
   const vrm=p.vrmRig.vrm,canvas=document.querySelector('canvas');
   const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
   if(!window.SKY_V66_REAL_KAIRO||!gl||!vrm.humanoid||
      p.characterId!=='kairo_venn')throw Error('Not actual Kairo/WebGL');
   if(trace.registrations.length<5)throw Error('Insufficient instrumented wrappers '+trace.registrations);
   trace.attachBones(bones);
   g.enterDojo();g.update=()=>{};sky.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;g.mode='dojo';g.dojoRival=true;g.training=true;
   const dt=1/60,states=[],height=p.floor,air=window.SkyClashV100Animator;
   const reset=()=>{
    p.hp=100;p.stun=0;p.downT=0;p.launched=false;p.spiked=false;
    p.slamming=false;p.dashing=false;p.charging=false;p.blocking=false;
    p.blockHeld=false;p.punchT=0;p.blastT=0;p.superHitT=0;p.attackAir=false;
    p.jumping=false;p.dropping=false;p.sprinting=false;
    p.v108JumpPrepT=0;p.landingMotionT=0;p.vert=0;
    p.vel.set(0,0,0);p.moveIntent.set(0,0,0);p.pos.y=height;
    p.model.root.position.y=height;
   };
   function sample(label,frames,configure){
    reset();configure();trace.begin(label);
    for(let i=0;i<frames;i++){p.t=(p.t||0)+dt;p.animate(dt);}
    const reads=trace.end();
    states.push({...reads,pose:window.SkyClashPoseAuthority.active,
     owned:!!air.ownsAir(p),native:!!p.v72StudioPack?.nativePreviewActive,
     nativeClip:p.v72StudioPack?.nativeClipId||null});
   }
   sample('idle',12,()=>{});
   sample('ground-walk',12,()=>{p.vel.z=3;p.moveIntent.z=1;});
   sample('ground-run',12,()=>{p.vel.z=6;p.moveIntent.z=1;p.v80AnalogRun=true;});
   sample('jump',12,()=>{p.jumping=true;p.pos.y=height+.9;p.vel.y=8;});
   sample('fall',12,()=>{p.jumping=true;p.pos.y=height+1.8;p.vel.y=-8;});
   sample('landing',12,()=>{p.landingMotionT=.4;});
   sample('v156-cruise',16,()=>{p.pos.y=height+2;p.vel.z=5;p.moveIntent.z=1;});
   sample('v156-hover',12,()=>{p.pos.y=height+2;});
   sample('air-boost',12,()=>{p.pos.y=height+2;p.sprinting=true;p.vel.z=6;});
   sample('guard',12,()=>{p.blockHeld=true;});
   sample('attack',12,()=>{
    p.attackKind='punch';p.punchSide=1;p.punchT=.24;p.attackElapsed=.08;
    p.attackTotal=.45;p.attackSerial=(p.attackSerial||0)+1;
   });
   sample('real-melee',12,()=>{
    p.lastMelee=-20;p.meleeCd=0;p.attackSerial=0;p.comboCycle=0;p.combo=0;
    p.t=12;e.hp=100;e.stun=0;e.invulnT=0;
    e.pos.set(p.pos.x,p.floor,p.pos.z+1.45);
    sky.Combat.melee(p,e,variant==='storm-v3');
   });
   sample('ground-return',12,()=>{});
   return {variant,realVRM:true,webGL:true,registered:trace.registrations,
    model:window.HERO_VRM_URL||null,bones:trace.nodes,states,
    nativeLoaded:window.SkyClashPublishedActions?.nativePlaytest?.state||null,
    nativeRevision:window.SkyClashPublishedActions?.nativeCombatSet?.revision||null};
  },{bones,variant});
  console.log('AUDIT REGISTRATION',variant,JSON.stringify(result.registered));
  console.log('AUDIT NATIVE PACK',variant,result.nativeLoaded,result.nativeRevision);
  for(const sample of result.states)console.log('AUDIT STATE',variant,sample.phase,
   'finalV100='+bones.slice(0,20).filter(b=>sample.lastWriter[b]==='v100-pose-authority.js').length,
   'native='+sample.native,'clip='+sample.nativeClip);
  fs.writeFileSync(path.join(out,variant+'.json'),JSON.stringify(result,null,2));
  assert.equal(intercepted,1,'Did not intercept exactly one game boot');
  assert(result.bones.length===22,'Missing full normalized bone set');
  for(const name of ['jump','fall','landing','v156-cruise','v156-hover']){
   const state=result.states.find(x=>x.phase===name);
   assert(state.owned,'Expected V100 to own '+name+'; got '+state.pose);
   for(const bone of bones.slice(0,20))
    assert.equal(state.lastWriter[bone],'v100-pose-authority.js',
     name+' final tracked writer changed on '+bone);
  }
  for(const sample of result.states){
   assert(sample.totalChanges>0,'No measured joint changes in '+sample.phase);
   console.log('REAL KAIRO',variant,sample.phase,
    'pose='+sample.pose,'owners='+sample.stages.map(s=>s.name+':'+s.changed).join(','));
  }
  if(variant==='storm-v3'){
   assert.equal(result.nativeRevision,'storm-fist-v3',
    'Storm Fist V3 review pack must actually load');
   const melee=result.states.find(s=>s.phase==='real-melee');
   assert(melee?.native&&melee.nativeClip,
    'Actual melee API must activate a real Storm Fist native clip');
  }
  assert(!errors.length,'Page errors: '+errors.join(' | '));
  fs.writeFileSync(path.join(out,variant+'.json'),JSON.stringify(result,null,2));
  return {variant,registered:result.registered,
   states:result.states.map(s=>({phase:s.phase,pose:s.pose,owned:s.owned,
    changed:s.totalChanges,lastWriter:s.lastWriter})),
   nativeLoaded:result.nativeLoaded,nativeRevision:result.nativeRevision};
 }finally{await context.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage','--no-sandbox'
 ]});
 try{
  const results=[];
  for(const variant of ['default','storm-v3'])results.push(await run(browser,variant));
  const summary={source:'Real Kairo normalized VRM in headless WebGL Chromium',
   note:'Method-based mutation attribution, not direct component assignments or visual approval',
   sha256:{model:hash('assets/characters/kairo.vrm'),boot:hash('js/v66-game-boot.js')},
   results};
  fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));
  console.log('PASS Real Kairo VRM writer trace',JSON.stringify(results.map(r=>r.variant)));
 }finally{await browser.close();}
})().catch(error=>{console.error('KAIRO VRM WRITER AUDIT FAILURE',error.stack||error);process.exitCode=1;});
