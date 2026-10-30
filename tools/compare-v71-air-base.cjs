/* Reversible developer-only V71 early base-yield A/B on actual Kairo VRM.
 * The proposed change is served in memory by Playwright, NEVER in the game.
 * V71 already skips its gait during air; this tests skipping the underlying
 * Fighter.animate() base call which can have other necessary side effects.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const base=(process.env.PLAYTEST_BASE_URL||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const out=path.resolve(process.env.V71_AB_OUTPUT||'visual-review-output/v71-air-base-ab');
const joints=require('../docs/KAIRO-RIG-CONTRACT.v1.json').targetBoneNames;
const source=fs.readFileSync(path.join(root,'js/v71-mixamo-gameplay.js'),'utf8');
const anchor=/(fighter\.animate=function\(dt\)\{\s*)original\.call\(this,dt\);/;
assert(anchor.test(source),'V71 base call moved; reconsider opt-in A/B patch');
const patch=[
 "$1if(new URLSearchParams(root.location?.search||'').get('v71AirAB')==='skip'&&root.SkyClashV100Animator?.ownsAir(this)){",
 "    window.__v71AirAB.skipped++;",
 "    state.weight=0;state.last='ab-skipped-base';return;",
 "   }",
 "   original.call(this,dt);"
].join('\n');
const candidate="window.__v71AirAB={skipped:0};\n"+source.replace(anchor,patch);
assert(candidate.includes("ab-skipped-base"),'Missing opt-in candidate');
const phases=[
 {name:'idle',n:20,h:0},{name:'walk',n:28,h:0,vz:3},
 {name:'run',n:22,h:0,vz:6,run:true},
 {name:'jump',n:20,h:1.1,vy:9,jump:true},
 {name:'fall',n:20,h:2,vy:-7,jump:true},
 {name:'landing',n:22,h:0,landing:.48},
 {name:'ground-recover',n:20,h:0},
 {name:'hover',n:20,h:2},{name:'cruise',n:24,h:2,vz:5},
 {name:'brake',n:16,h:2},{name:'boost',n:18,h:2,vz:6,boost:true},
 {name:'guard',n:16,h:0,guard:true},{name:'attack',n:16,h:0,attack:true},
 {name:'ground-return',n:20,h:0}
];
const fpsValues=[30,60,120];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
fs.mkdirSync(out,{recursive:true});
async function capture(browser,fps,variant){
 const context=await browser.newContext({viewport:{width:960,height:640},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 let intercepted=0;
 page.on('pageerror',e=>errors.push(String(e)));
 if(variant==='skip-base')
  await page.route('**/js/v71-mixamo-gameplay.js*',async route=>{
   intercepted++;await route.fulfill({status:200,contentType:'application/javascript',body:candidate});
  });
 try{
  const url=base+'index.html?scene=dojo'+(variant==='skip-base'?'&v71AirAB=skip':'');
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  assert(response.ok(),'Game HTTP not OK');
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPoseAuthority?.ready&&window.SkyClashGameplayMotions?.loaded&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
   null,{timeout:180000});
  const result=await page.evaluate(({joints,phases,fps})=>{
   const sky=window.SkyClash,game=sky.Game,f=game.player,vrm=f.vrmRig.vrm,
    human=vrm.humanoid,T=window.THREE,dt=1/fps;
   const canvas=document.querySelector('canvas');
   const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
   if(!gl||!window.SKY_V66_REAL_KAIRO||f.characterId!=='kairo_venn')
    throw Error('A/B requires exact real Kairo WebGL model');
   const nodes=joints.map(n=>human.getNormalizedBoneNode(n));
   if(nodes.some(n=>!n))throw Error('Missing Kairo bone');
   game.enterDojo();game.update=()=>{};sky.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;game.mode='dojo';game.training=true;
   f.reset();f.t=12;
   const floor=f.floor;
   f.pos.set(0,floor,0);f.model.root.position.set(0,floor,0);
   f.vel.set(0,0,0);f.moveIntent.set(0,0,0);
   f.facing=0;f.model.root.rotation.y=0;
   const frames=[],api=window.SkyClashV100Animator;
   for(const phase of phases){
    f.hp=100;f.stun=0;f.downT=0;f.launched=false;f.spiked=false;
    f.slamming=false;f.dashing=false;f.charging=false;f.blocking=false;
    f.blockHeld=!!phase.guard;f.sprinting=!!phase.boost;
    f.jumping=!!phase.jump;f.dropping=false;f.v108JumpPrepT=0;
    f.punchT=0;f.superHitT=0;f.blastT=0;f.attackAir=false;
    f.landingMotionT=phase.landing||0;f.vert=0;
    f.v80AnalogRun=!!phase.run;f.v95JoystickRun=!!phase.run;
    f.vel.set(0,phase.vy||0,phase.vz||0);
    f.moveIntent.set(0,0,phase.vz?1:0);
    f.pos.y=floor+phase.h;f.model.root.position.y=f.pos.y;
    if(phase.attack){
     f.punchT=.32;f.attackKind='punch';f.punchSide=1;
     f.attackElapsed=.02;f.attackTotal=.42;f.attackSerial=(f.attackSerial||0)+1;
    }
    for(let i=0;i<phase.n;i++){
     if(phase.landing)f.landingMotionT=Math.max(0,phase.landing-i*dt);
     f.t+=dt;f.animate(dt);
     vrm.scene.updateMatrixWorld(true);
     const point=name=>human.getNormalizedBoneNode(name).getWorldPosition(new T.Vector3()).toArray();
     frames.push({phase:phase.name,frame:i,owner:window.SkyClashPoseAuthority?.active,
      ownsAir:!!api.ownsAir(f),q:nodes.map(n=>n.quaternion.toArray()),
      positions:nodes.map(n=>n.position.toArray()),
      landmarks:['head','leftHand','rightHand','leftFoot','rightFoot','hips'].map(point),
      guide:[f.model.root.position.toArray(),f.model.body.quaternion.toArray()],
      v71:f.v71Walk?.last||null});
    }
   }
   return {fps,frames,skipped:window.__v71AirAB?.skipped||0,
    v71Ready:window.SkyClashGameplayMotions?.loaded||false,
    model:window.HERO_VRM_URL||null};
  },{joints,phases,fps});
  assert(result.v71Ready,'V71 unavailable');
  assert(!errors.length,'Browser errors '+errors.slice(0,3).join(';'));
  if(variant==='skip-base'){
   assert.equal(intercepted,1,'Candidate not served in memory');
   assert(result.skipped>10,'Candidate branch never executed');
  }else assert.equal(intercepted,0,'Baseline must be original');
  fs.writeFileSync(path.join(out,variant+'-'+fps+'.json'),JSON.stringify(result));
  console.log('V71 CAPTURE',variant,fps,'frames='+result.frames.length,'skips='+result.skipped);
  return result;
 }finally{await context.close();}
}
function angle(a,b){
 const na=Math.hypot(...a)||1,nb=Math.hypot(...b)||1;
 const dot=a.reduce((s,v,i)=>s+v*b[i],0)/(na*nb);
 return 2*Math.acos(Math.min(1,Math.abs(dot)))*180/Math.PI;
}
function distanceCm(a,b){return Math.hypot(...a.map((x,i)=>x-b[i]))*100;}
function compare(a,b){
 assert.equal(a.frames.length,b.frames.length);
 const report={fps:a.fps,totalFrames:a.frames.length,earlyYieldCalls:b.skipped,
  phases:{},ownerMismatches:0};
 for(let i=0;i<a.frames.length;i++){
  const x=a.frames[i],y=b.frames[i];
  assert.equal(x.phase,y.phase);assert.equal(x.frame,y.frame);
  const r=report.phases[x.phase]||(report.phases[x.phase]={
   frames:0,airFrames:0,maxDegrees:0,worstBone:null,
   maxWorldCm:0,maxJointPositionCm:0,maxGuideCm:0,
   maxGuideBodyDeg:0,ownerMismatches:0});
  r.frames++;if(x.ownsAir)r.airFrames++;
  if(x.ownsAir!==y.ownsAir||x.owner!==y.owner){
   r.ownerMismatches++;report.ownerMismatches++;
  }
  for(let bone=0;bone<joints.length;bone++){
   const v=angle(x.q[bone],y.q[bone]);
   if(v>r.maxDegrees){r.maxDegrees=v;r.worstBone=joints[bone];}
   r.maxJointPositionCm=Math.max(r.maxJointPositionCm,
    distanceCm(x.positions[bone],y.positions[bone]));
  }
  for(let k=0;k<x.landmarks.length;k++)
   r.maxWorldCm=Math.max(r.maxWorldCm,
    distanceCm(x.landmarks[k],y.landmarks[k]));
  r.maxGuideCm=Math.max(r.maxGuideCm,
   distanceCm(x.guide[0],y.guide[0]));
  r.maxGuideBodyDeg=Math.max(r.maxGuideBodyDeg,
   angle(x.guide[1],y.guide[1]));
 }
 const all=Object.values(report.phases);
 report.maxDegrees=Math.max(...all.map(x=>x.maxDegrees));
 report.maxWorldCm=Math.max(...all.map(x=>x.maxWorldCm));
 report.maxJointPositionCm=Math.max(...all.map(x=>x.maxJointPositionCm));
 report.maxGuideBodyDeg=Math.max(...all.map(x=>x.maxGuideBodyDeg));
 const air=['jump','fall','landing','hover','cruise','brake'];
 const ground=['idle','walk','run','ground-recover','boost','guard','attack','ground-return'];
 report.airMaxDegrees=Math.max(...air.map(x=>report.phases[x].maxDegrees));
 report.groundMaxDegrees=Math.max(...ground.map(x=>report.phases[x].maxDegrees));
 report.airSampleCount=air.reduce((n,x)=>n+report.phases[x].airFrames,0);
 report.safeToExploreFurther=report.ownerMismatches===0&&report.maxDegrees<1&&
  report.maxWorldCm<1&&report.maxJointPositionCm<1&&report.maxGuideBodyDeg<1;
 return report;
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage','--no-sandbox'
 ]});
 try{
  const results=[];
  for(const fps of fpsValues){
   const normal=await capture(browser,fps,'baseline');
   const early=await capture(browser,fps,'skip-base');
   const summary=compare(normal,early);results.push(summary);
   for(const [name,row] of Object.entries(summary.phases))
    console.log('V71 PHASE',fps,name,'maxDeg='+row.maxDegrees.toFixed(3),
     'worldCm='+row.maxWorldCm.toFixed(3),
     'guideBodyDeg='+row.maxGuideBodyDeg.toFixed(3),
     'ownersDifferent='+row.ownerMismatches);
   console.log('V71 RESULT',fps,'maxDeg='+summary.maxDegrees.toFixed(3),
    'airDeg='+summary.airMaxDegrees.toFixed(3),
    'groundDeg='+summary.groundMaxDegrees.toFixed(3),
    'worldCm='+summary.maxWorldCm.toFixed(3),
    'guideBodyDeg='+summary.maxGuideBodyDeg.toFixed(3),
    'plausible='+summary.safeToExploreFurther);
  }
  const report={tested:'V71 skip underlying base when V100 owns air',
   neverShipped:true,rig:'exact Kairo VRM/WebGL',
   caveat:'Controlled Fighter.animate simulation, not full player input or aesthetic approval',
   assets:{kairoSha256:sha('assets/characters/kairo.vrm'),
    v71Sha256:sha('js/v71-mixamo-gameplay.js'),
    v100Sha256:sha('js/v100-pose-authority.js')},
   results,decision:results.every(r=>r.safeToExploreFurther)?
    'NUMERICALLY CLOSE — further gameplay review required, no promotion':
    'NOT EQUIVALENT — preserve existing V71/base call'};
  fs.writeFileSync(path.join(out,'comparison.json'),JSON.stringify(report,null,2));
  console.log('V71 DECISION',report.decision);
  console.log('PASS isolated real-Kairo V71 base-call A/B comparison completed');
 }finally{await browser.close();}
})().catch(e=>{console.error('V71 A/B FAILED',e.stack||e);process.exitCode=1;});
