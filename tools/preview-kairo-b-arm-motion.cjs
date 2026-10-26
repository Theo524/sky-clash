/* Player picks B: Kairo's arms slightly away from torso.
 * A/B/C MOVEMENT AMOUNT ONLY, same underlying B pose in all three.
 * Headless real VRM0 Pose Lab animations, no live game modification.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const output=path.resolve('visual-review-output','kairo-b-arm-motion');
fs.mkdirSync(output,{recursive:true});
const SHA='775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72';
const candidates=[{id:'A',name:'Quiet drift',amount:.45},
 {id:'B',name:'Natural flow',amount:1},
 {id:'C',name:'More expressive',amount:1.65}];
const aim=(bone,child,worldDirection)=>({bone,child,worldDirection});
function armAims(phase,s){
 const x=phase==='base'?.38:phase==='open'?.38+.085*s:.38-.05*s;
 const y=phase==='base'?-.80:phase==='open'?-.80+.08*s:-.80-.09*s;
 const z=phase==='base'?-.10:phase==='open'?-.10-.055*s:-.10+.05*s;
 const fx=phase==='base'?.11:phase==='open'?.11+.05*s:.11-.04*s;
 const fy=phase==='base'?-.93:phase==='open'?-.93+.03*s:-.93-.035*s;
 const fz=phase==='base'?.12:phase==='open'?.12+.14*s:.12-.10*s;
 return [
  aim('leftUpperArm','leftLowerArm',[x,y,z]),
  aim('rightUpperArm','rightLowerArm',[-x,y,z]),
  aim('leftLowerArm','leftHand',[fx,fy,fz]),
  aim('rightLowerArm','rightHand',[-fx,fy,fz])
 ];
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader-webgl','--enable-webgl']});
 const page=await browser.newPage({viewport:{width:1220,height:850},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',err=>errors.push(String(err)));
 const report={source:'Real Kairo Pose Lab',sha:SHA,gameChanged:false,
  acceptedPose:'B slightly spaced arms',visualApproval:false,candidates:[]};
 try{
  await page.goto('http://127.0.0.1:'+(process.env.VISUAL_PORT||8765)+
   '/pose-lab.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SkyClashPoseLab?.ready,null,{timeout:180000});
  await page.locator('#showJoints').uncheck();
  async function hover(){
   await page.click('#loadHover');
   await page.waitForFunction(()=>
    document.querySelector('#status')?.textContent.includes('Loaded exact V152'),
    null,{timeout:20000});
   let data=await page.evaluate(()=>window.SkyClashPoseLab.motion);
   assert.equal(data.modelSha256,SHA);
   assert.equal(data.bones.length,20);
   return data;
  }
  await hover();
  const ref=await page.evaluate(()=>window.SkyClashPoseLab.flightGeometry);
  async function bake(phase,amount){
   await hover();
   const r=await page.evaluate(aims=>
    window.SkyClashPoseLab.authorWorldPose({
     name:'Selected B arms pose',time:.9,aims}),armAims(phase,amount));
   return {pose:r.data.keyframes.at(-1).quaternions,metrics:r.metrics};
  }
  const anchor=await bake('base',1);
  report.anchor={geometry:anchor.metrics};
  await page.click('[data-view="front"]');
  await page.waitForTimeout(120);
  await page.locator('#modelView').screenshot({path:path.join(output,'chosen-B-still.png')});
  for(const opt of candidates){
   const open=await bake('open',opt.amount),close=await bake('close',opt.amount);
   for(const q of [anchor.pose,open.pose,close.pose])
    assert(q.length===20&&q.every(x=>x.length===4&&x.every(Number.isFinite)));
   // A real 20-bone quaternion track; all 3 preserve the SAME B anchor.
   // Chest, head, legs and pelvis are unchanged. Arms lead; wrists lag.
   const result=await page.evaluate(({anchor,open,close,opt})=>{
    const lab=window.SkyClashPoseLab,T=window.THREE,qa=new T.Quaternion(),qb=new T.Quaternion();
    const frames=[];
    const wrap=(a,b,m)=>qa.fromArray(a).slerp(qb.fromArray(b),m)
     .normalize().toArray().map(z=>+z.toFixed(7));
    const upper=[7,11],lower=[8,12],hands=[9,13];
    for(let k=0;k<=20;k++){
     const time=k*.1,angle=Math.PI*time;
     const qs=anchor.map((q,j)=>{
      let lag=upper.includes(j)?0:lower.includes(j)?.37:hands.includes(j)?.72:null;
      if(lag===null)return q;
      if(j>=11)lag+=.11; // barely stagger the opposite side
      const signed=(Math.sin(angle-lag)+Math.sin(lag))*.54;
      if(signed>=0)return wrap(q,open[j],Math.min(1,signed));
      return wrap(q,close[j],Math.min(1,-signed));
     });
     frames.push({time:+time.toFixed(2),name:'B '+opt.name,
       quaternions:qs});
    }
    // Source identity, model SHA and normalization all maintained.
    const old=lab.motion;
    return {...old,source:'Chosen B arms; real VRM0 authored cyclic arm movement '+opt.name,
     duration:2,interpolation:'slerp',keyframes:frames};
   },{anchor:anchor.pose,open:open.pose,close:close.pose,opt});
   assert.equal(result.keyframes.length,21);
   assert.equal(result.modelSha256,SHA);
   assert(result.keyframes.every(k=>k.quaternions.length===20&&k.quaternions.every(
    q=>q.length===4&&Math.abs(Math.hypot(...q)-1)<.002)));
   fs.writeFileSync(path.join(output,'B-'+opt.id+'-animation.pose.json'),
     JSON.stringify(result,null,2));
   // Import and evaluate the exact authored clip that a game might use.
   await page.locator('#fileImport').setInputFiles({
    name:'B-'+opt.id+'.pose.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(result))});
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Imported 21'),
    null,{timeout:20000});
   const dir=path.join(output,'frames-'+opt.id);fs.mkdirSync(dir,{recursive:true});
   const geometry=[];
   for(let i=0;i<12;i++){
    const sec=i*2/12;
    const m=await page.evaluate(t=>{
     window.SkyClashPoseLab.seek(t);
     return window.SkyClashPoseLab.flightGeometry;
    },sec);
    geometry.push({time:sec,wristSpread:m.limbSpacing.wrist,
     elbows:[m.leftElbow,m.rightElbow],torso:m.torso});
    await page.click('[data-view="front"]');
    // Single real WebGL render; no fabricated cartoon overlay.
    await page.waitForTimeout(35);
    await page.locator('#modelView').screenshot({
     path:path.join(dir,String(i).padStart(2,'0')+'.png'),
     animations:'disabled'});
    console.log('ARM_MOTION_FRAME',opt.id,i,m.limbSpacing.wrist);
   }
   const spread=geometry.map(g=>g.wristSpread);
   assert(Math.max(...spread)-Math.min(...spread)>.009,
    opt.id+' arms remained motionless');
   report.candidates.push({id:opt.id,name:opt.name,amount:opt.amount,
    geometry,rangeWristSpread:[Math.min(...spread),Math.max(...spread)],
    frames:12});
   console.log('ARM_MOTION_CANDIDATE',opt.id,JSON.stringify({
    rangeWristSpread:[Math.min(...spread),Math.max(...spread)],
    elbowRange:[Math.min(...geometry.map(x=>x.elbows[0])),
     Math.max(...geometry.map(x=>x.elbows[0]))]}));
  }
  assert.deepEqual(errors,[]);
  report.completed=true;
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS Three actual Kairo B arm animation examples; 36 real WebGL frames');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
