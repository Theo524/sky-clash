/* Three DESCENDING motion choices on PLAYER-CHOSEN B stance + B arm flow.
 * Exact real Kairo VRM0 authored motion, no gameplay/production changes.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const dest=path.resolve('visual-review-output','kairo-b-descending-choices');
fs.mkdirSync(dest,{recursive:true});
const MODEL_SHA='775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72';
const choices=[{id:'A',name:'Featherlight sink',strength:.32},
 {id:'B',name:'Natural settle',strength:.65},
 {id:'C',name:'Soft braking',strength:1}];
const aim=(bone,child,x,y,z)=>({bone,child,worldDirection:[x,y,z]});
const arms=phase=>{
 const spread=phase==='wide'?.46:phase==='close'?.33:.38;
 const down=phase==='wide'?-0.75:phase==='close'?-0.86:-0.8;
 const back=phase==='wide'?-.15:phase==='close'?-.055:-.10;
 const sx=phase==='wide'?.15:phase==='close'?.08:.11;
 const fy=phase==='wide'?-.90:phase==='close'?-.96:-.93;
 const fz=phase==='wide'?.19:phase==='close'?.07:.12;
 return [
  aim('leftUpperArm','leftLowerArm',spread,down,back),
  aim('rightUpperArm','rightLowerArm',-spread,down,back),
  aim('leftLowerArm','leftHand',sx,fy,fz),
  aim('rightLowerArm','rightHand',-sx,fy,fz)
 ];
};
const animationTarget=[
 {bone:'leftUpperLeg',axis:'right',degrees:5},
 {bone:'rightUpperLeg',axis:'right',degrees:4},
 {bone:'leftLowerLeg',axis:'right',degrees:-5},
 {bone:'rightLowerLeg',axis:'right',degrees:-4},
 {bone:'leftFoot',axis:'right',degrees:-2},
 {bone:'rightFoot',axis:'right',degrees:-2},
 {bone:'spine',axis:'right',degrees:.8},
 {bone:'chest',axis:'right',degrees:1},
 {bone:'neck',axis:'right',degrees:-.8}
];
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader-webgl','--enable-webgl']});
 const page=await browser.newPage({viewport:{width:1220,height:850},deviceScaleFactor:1});
 const errs=[];page.on('pageerror',e=>errs.push(String(e)));
 const report={source:'Real Kairo VRM0 Pose Lab',modelSha256:MODEL_SHA,
  playerSelection:{stance:'B',armMotion:'B Natural'},
  visuallyApproved:false,gameChanged:false,choices:[]};
 try{
  await page.goto('http://127.0.0.1:'+(process.env.VISUAL_PORT||8765)+
    '/pose-lab.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SkyClashPoseLab?.ready,null,{timeout:180000});
  await page.locator('#showJoints').uncheck();
  const reset=async()=>{
   await page.click('#loadHover');
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Loaded exact V152'),
     null,{timeout:20000});
   const d=await page.evaluate(()=>window.SkyClashPoseLab.motion);
   assert.equal(d.modelSha256,MODEL_SHA);
   assert.equal(d.bones.length,20);
  };
  const bake=async(phase,rotations=[])=>{
   await reset();
   const a=await page.evaluate(spec=>window.SkyClashPoseLab.authorWorldPose(spec),{
    name:'B standing hover + '+phase,time:1,rotations,
    aims:arms(phase==='descend'?'close':phase)
   });
   assert.equal(a.data.keyframes.at(-1).quaternions.length,20);
   return {quaternions:a.data.keyframes.at(-1).quaternions,metrics:a.metrics};
  };
  const neutral=await bake('base');
  const wide=await bake('wide');
  const close=await bake('close');
  const sink=await bake('descend',animationTarget);
  report.baseGeometry=neutral.metrics;report.descendGeometry=sink.metrics;
  // Confirm the descent comes from B, not from a different vertical pose.
  assert(Math.abs(sink.metrics.torso-neutral.metrics.torso)<9,
    'Descent torso too far from B standing hover');
  assert(sink.metrics.leftKnee>5&&sink.metrics.rightKnee>5,
    'Kairo legs must not lock while descending');
  await reset();
  await page.locator('#fileImport').setInputFiles({
   name:'B-anchor.pose.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({
    ...(await page.evaluate(()=>window.SkyClashPoseLab.motion)),
    keyframes:[{time:0,name:'Chosen B standing hover',quaternions:neutral.quaternions}]
   }))
  });
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Imported 1'),
   null,{timeout:15000});
  for(const view of ['front','side']){
   await page.click('[data-view="'+view+'"]');
   await page.waitForTimeout(100);
   await page.locator('#modelView').screenshot({path:path.join(dest,'neutral-B-'+view+'.png')});
  }
  for(const choice of choices){
   const clip=await page.evaluate(({neutral,wide,close,sink,choice})=>{
    const lab=window.SkyClashPoseLab,THREE=window.THREE;
    const frames=[],T=2;
    const a=new THREE.Quaternion(),b=new THREE.Quaternion();
    const lerp=(p,q,w)=>a.fromArray(p).slerp(b.fromArray(q),
     Math.max(0,Math.min(1,w))).normalize().toArray().map(x=>+x.toFixed(7));
    const arms=new Set([7,8,9,11,12,13]);
    function clamp(v){return Math.max(0,Math.min(1,v));}
    const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
    for(let i=0;i<=24;i++){
     const t=i/12;
     const descent=t<.22?0:t<.90?ease((t-.22)/.68):
       t<1.40?1:t<1.96?1-ease((t-1.4)/.56):0;
     const pose=neutral.map((base,j)=>{
      let q=base;
      if(arms.has(j)){
       let lag=[7,11].includes(j)?0:[8,12].includes(j)?.4:.8;
       if(j>=11)lag+=.08;
       const phase=(Math.sin(2*Math.PI*t/2-lag)+Math.sin(lag))*.54;
       q=lerp(base,(phase>=0?wide:close)[j],Math.abs(phase));
      }
      return lerp(q,sink[j],descent*choice.strength);
     });
     frames.push({time:+t.toFixed(7),name:'B stance + '+choice.name,quaternions:pose});
    }
    return {...lab.motion,source:'Player-selected B stance and B arm flow; real Kairo keyframed '+choice.name,
     duration:2,interpolation:'quaternion-slerp',keyframes:frames};
   },{neutral:neutral.quaternions,wide:wide.quaternions,
       close:close.quaternions,sink:sink.quaternions,choice});
   assert(clip.keyframes.length===25);
   assert(clip.keyframes.every(f=>f.quaternions.length===20&&
    f.quaternions.every(q=>q.length===4&&q.every(Number.isFinite)&&
     Math.abs(Math.hypot(...q)-1)<.003)));
   // All share the exact same neutral B pose, only descent amplitude varies.
   for(let i=0;i<20;i++)assert(
    Math.abs(clip.keyframes[0].quaternions[i].reduce((sum,n,j)=>
      sum+n*neutral.quaternions[i][j],0))>.999995,'Not selected B anchor');
   const file='B-descend-'+choice.id+'.pose.json';
   fs.writeFileSync(path.join(dest,file),JSON.stringify(clip,null,2));
   await page.locator('#fileImport').setInputFiles({
    name:file,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(clip))
   });
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Imported 25'),
     null,{timeout:20000});
   const folder=path.join(dest,'frames-'+choice.id);fs.mkdirSync(folder,{recursive:true});
   const stats=[];
   for(let i=0;i<12;i++){
    const second=i/6;
    const metrics=await page.evaluate(t=>{
     window.SkyClashPoseLab.seek(t);
     return window.SkyClashPoseLab.flightGeometry;
    },second);
    assert(Math.abs(metrics.torso-neutral.metrics.torso)<9,
     'Descent changed standing hover torso too much');
    stats.push({time:second,torso:metrics.torso,knees:[metrics.leftKnee,metrics.rightKnee],
      elbows:[metrics.leftElbow,metrics.rightElbow],
      wristSpread:metrics.limbSpacing.wrist});
    await page.click('[data-view="front"]');await page.waitForTimeout(35);
    await page.locator('#modelView').screenshot({
     path:path.join(folder,String(i).padStart(2,'0')+'.png'),animations:'disabled'});
   }
   await page.evaluate(()=>window.SkyClashPoseLab.seek(1));
   await page.click('[data-view="side"]');await page.waitForTimeout(110);
   await page.locator('#modelView').screenshot({path:path.join(dest,'B-descend-'+choice.id+'-side.png')});
   report.choices.push({id:choice.id,name:choice.name,strength:choice.strength,stats});
   console.log('DESCEND_CHOICE '+JSON.stringify({id:choice.id,selected:'B+B',
    torsoRange:[Math.min(...stats.map(s=>s.torso)),Math.max(...stats.map(s=>s.torso))],
    wristRange:[Math.min(...stats.map(s=>s.wristSpread)),Math.max(...stats.map(s=>s.wristSpread))],
    kneesAtPeak:stats[6].knees}));
  }
  assert.deepEqual(errs,[],'browser errors');
  report.completed=true;
  fs.writeFileSync(path.join(dest,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS actual real-Kairo B-base animated descend options A/B/C, 36 front frames + 3 side');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
