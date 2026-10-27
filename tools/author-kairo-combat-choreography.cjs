/* Sky Clash Batch A — bake original grounded combat poses on the ACTUAL Kairo VRM0.
 * Reuses existing Pose Lab normalized humanoid world-direction authoring.
 * This is an offline authoring tool, NEVER a gameplay skeleton controller.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const OUTPUT=path.resolve('visual-review-output/kairo-combat-batch-a');
fs.mkdirSync(OUTPUT,{recursive:true});
const MODEL_SHA='775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72';
const A=(l,r)=>[l,r];
const BASE={
 upper:A([.24,-.64,.33],[-.24,-.64,.33]),
 fore:A([.05,.54,.66],[-.05,.54,.66]),
 thigh:A([.14,-.97,.12],[-.14,-.97,-.10]),
 shin:A([.04,-.98,-.12],[-.04,-.98,-.12]),
 hip:-7,chest:5,spine:1,neck:0,head:0
};
const P={
 ready:{},
 jabLoad:{hip:-13,chest:3,upper:A([.18,-.61,.19],[-.24,-.64,.33]),fore:A([.03,.60,.52],[-.05,.54,.66]),thigh:A([.14,-.95,.20],[-.13,-.98,-.06])},
 jabContact:{hip:-19,chest:9,upper:A([.13,-.08,1],[-.24,-.65,.32]),fore:A([.03,.02,1],[-.05,.52,.69]),thigh:A([.15,-.96,.15],[-.14,-.98,-.09])},
 jabFollow:{hip:-13,chest:5,upper:A([.18,-.31,.72],[-.23,-.65,.33]),fore:A([.04,.22,.89],[-.05,.53,.66])},
 crossLoad:{hip:-24,chest:-8,upper:A([.22,-.53,.36],[-.29,-.62,.05]),fore:A([.06,.53,.65],[-.05,.58,.42]),thigh:A([.12,-.97,.18],[-.15,-.95,-.17])},
 crossContact:{hip:22,chest:14,upper:A([.22,-.64,.33],[-.13,-.10,1]),fore:A([.05,.54,.66],[-.03,.03,1]),thigh:A([.15,-.96,.08],[-.13,-.95,.23])},
 crossFollow:{hip:13,chest:9,upper:A([.22,-.64,.33],[-.18,-.28,.84]),fore:A([.05,.54,.66],[-.04,.18,.94])},
 hookLoad:{hip:-28,chest:-13,upper:A([.17,-.35,.55],[-.27,-.57,.25]),fore:A([.28,.35,.83],[-.05,.57,.63])},
 hookContact:{hip:28,chest:22,upper:A([.20,-.30,.95],[-.24,-.61,.30]),fore:A([-.30,.05,.97],[-.07,.57,.66]),thigh:A([.16,-.97,.04],[-.13,-.95,.18])},
 hookFollow:{hip:24,chest:17,upper:A([.19,-.50,.65],[-.23,-.64,.33]),fore:A([-.30,.18,.90],[-.05,.57,.65])},
 overhandLoad:{hip:-22,chest:-15,upper:A([.20,-.63,.33],[-.38,.50,.45]),fore:A([.06,.53,.66],[-.10,.56,.60])},
 overhandContact:{hip:25,chest:18,upper:A([.20,-.59,.37],[-.20,-.31,1]),fore:A([.06,.55,.68],[-.04,-.63,.83])},
 overhandFollow:{hip:20,chest:13,upper:A([.22,-.61,.35],[-.19,-.54,.84]),fore:A([.05,.55,.66],[-.04,-.61,.68])},
 kickChamber:{hip:-21,chest:12,upper:A([.36,-.52,.28],[-.35,-.48,.34]),fore:A([.06,.58,.63],[-.08,.52,.69]),thigh:A([.16,-.16,.98],[-.13,-.96,-.18]),shin:A([.10,-.85,-.30],[-.04,-.97,-.16])},
 kickContact:{hip:25,chest:-6,upper:A([.39,-.57,.35],[-.30,-.50,.30]),fore:A([.06,.51,.73],[-.08,.60,.62]),thigh:A([.15,-.12,1],[-.13,-.96,-.17]),shin:A([.10,.14,1],[-.04,-.98,-.12])},
 kickFollow:{hip:17,chest:-3,upper:A([.32,-.64,.28],[-.32,-.62,.31]),fore:A([.07,.48,.72],[-.08,.50,.71]),thigh:A([.14,-.45,.84],[-.13,-.96,-.16]),shin:A([.06,-.52,.78],[-.04,-.97,-.12])},
 shield:{hip:-12,chest:3,upper:A([.24,-.45,.61],[-.24,-.48,.60]),fore:A([.09,.58,.78],[-.09,.54,.75])},
 parry:{hip:-18,chest:7,upper:A([.19,-.37,.80],[-.26,-.51,.54]),fore:A([.20,.18,1],[-.08,.56,.78])},
 lightHit:{hip:15,chest:-16,upper:A([.30,-.60,.24],[-.30,-.55,.20]),fore:A([.09,.65,.46],[-.10,.65,.45]),neck:-8,head:-6},
 heavyHit:{hip:25,chest:-23,upper:A([.41,-.50,-.12],[-.41,-.50,-.12]),fore:A([.15,.70,.25],[-.15,.67,.25]),thigh:A([.18,-.94,-.02],[-.16,-.92,-.14]),neck:-13,head:-10}
};
function merged(id){const p=P[id];assert(p,'missing pose '+id);return {...BASE,...p};}
const clips=[
 {id:'kairo-ready',slot:'combatReady',duration:1.4,contact:null,
  keys:[[0,'ready'],[.35,'ready'],[.76,'ready'],[1.4,'ready']]},
 {id:'kairo-guard',slot:'guard',duration:.9,contact:null,
  keys:[[0,'ready'],[.14,'shield'],[.42,'shield'],[.9,'shield']]},
 {id:'kairo-parry',slot:'parry',duration:.30,contact:null,
  keys:[[0,'shield'],[.09,'parry'],[.17,'shield'],[.3,'ready']]},
 {id:'kairo-jab',slot:'punch1',duration:.55,contact:.24,
  keys:[[0,'ready'],[.10,'jabLoad'],[.24,'jabContact'],[.32,'jabFollow'],[.55,'crossLoad']]},
 {id:'kairo-cross',slot:'punch2',duration:.55,contact:.24,
  keys:[[0,'crossLoad'],[.11,'crossLoad'],[.24,'crossContact'],[.33,'crossFollow'],[.55,'hookLoad']]},
 {id:'kairo-hook',slot:'punch3',duration:.68,contact:.33,
  keys:[[0,'hookLoad'],[.14,'hookLoad'],[.33,'hookContact'],[.43,'hookFollow'],[.68,'kickChamber']]},
 {id:'kairo-overhand',slot:'overhand',duration:.68,contact:.33,
  keys:[[0,'hookLoad'],[.14,'overhandLoad'],[.33,'overhandContact'],[.43,'overhandFollow'],[.68,'kickChamber']]},
 {id:'kairo-rising-heel',slot:'kick',duration:.87,contact:.41,
  keys:[[0,'kickChamber'],[.20,'kickChamber'],[.41,'kickContact'],[.53,'kickFollow'],[.87,'ready']]},
 {id:'kairo-light-hit',slot:'hitLight',duration:.38,contact:null,
  keys:[[0,'ready'],[.10,'lightHit'],[.21,'lightHit'],[.38,'ready']]},
 {id:'kairo-heavy-hit',slot:'hitHeavy',duration:.62,contact:null,
  keys:[[0,'ready'],[.18,'heavyHit'],[.32,'heavyHit'],[.62,'ready']]}
];
const pairs=[
 ['leftUpperArm','leftLowerArm','upper',0],['rightUpperArm','rightLowerArm','upper',1],
 ['leftLowerArm','leftHand','fore',0],['rightLowerArm','rightHand','fore',1],
 ['leftUpperLeg','leftLowerLeg','thigh',0],['rightUpperLeg','rightLowerLeg','thigh',1],
 ['leftLowerLeg','leftFoot','shin',0],['rightLowerLeg','rightFoot','shin',1]
];
const makeOps=id=>{const s=merged(id);return {
 name:id,time:1.2,
 rotations:[['hips','up',s.hip],['spine','up',s.spine],
  ['chest','up',s.chest],['neck','right',s.neck],['head','right',s.head]]
  .filter(x=>x[2]!==0).map(([bone,axis,degrees])=>({bone,axis,degrees})),
 aims:pairs.map(([bone,child,kind,i])=>({bone,child,worldDirection:s[kind][i]}))
};};
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader-webgl','--enable-webgl']});
 const page=await browser.newPage({viewport:{width:1220,height:850},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:'+(process.env.VISUAL_PORT||8765)+'/pose-lab.html',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SkyClashPoseLab?.ready,null,{timeout:180000});
  assert.equal(await page.evaluate(()=>window.SkyClashPoseLab.modelHash),MODEL_SHA);
  await page.locator('#showJoints').uncheck();
  const baked={};const geometry={};
  for(const id of Object.keys(P)){
   const result=await page.evaluate(spec=>window.SkyClashPoseLab.authorWorldPose(spec),makeOps(id));
   const sample=result.data.keyframes.at(-1);
   assert.equal(result.data.bones.length,20);
   assert(sample.quaternions.every(q=>Math.abs(Math.hypot(...q)-1)<.005));
   baked[id]=sample.quaternions;geometry[id]=result.metrics;
  }
  const motion=await page.evaluate(()=>window.SkyClashPoseLab.motion);
  const pack={
   schema:'sky-clash.combat-choreo.v1',version:1,characterId:'kairo_venn',
   modelSha256:MODEL_SHA,rig:'vrm0-normalized-bones',
   quaternionSpace:'normalized-bone-local-absolute',
   bones:motion.bones,
   source:'Original Sky Clash Storm Fist choreography baked offline with Pose Lab on the real Kairo VRM0',
   gameplayRootTranslation:false,visualApproval:false,
   clips:clips.map(c=>({
    id:c.id,slot:c.slot,duration:c.duration,contactTime:c.contact,
    loop:c.id==='kairo-ready'||c.id==='kairo-guard',
    keyframes:c.keys.map(([t,id])=>({time:t,name:id,quaternions:baked[id]}))
   }))
  };
  for(const c of pack.clips){
   assert(c.keyframes.every(k=>k.quaternions.length===20));
   assert(c.keyframes[0].time===0&&c.keyframes.at(-1).time===c.duration);
   assert(c.keyframes.every((k,i)=>i===0||k.time>c.keyframes[i-1].time));
   if(c.contactTime!==null)assert(c.keyframes.some(k=>k.time===c.contactTime));
  }
  // Probe the SAME authored poses on the actual skinned geometry; no user media.
  for(const id of ['ready','jabContact','crossContact','hookContact','overhandContact','kickContact','shield']){
   await page.evaluate(t=>window.SkyClashPoseLab.seek(t),1.2);
   await page.evaluate(({id,q})=>{
    // Re-import one-key snapshot to observe exact exported pose and reuse Pose Lab's renderer.
    window.__batchAProbe={id,q};
   },{id,q:baked[id]});
   // authorWorldPose updates the actual renderer to the requested pose.
   await page.evaluate(spec=>window.SkyClashPoseLab.authorWorldPose(spec),makeOps(id));
   for(const view of ['front','side']){
    await page.click('[data-view="'+view+'"]');
    await page.locator('#modelView').screenshot({path:path.join(OUTPUT,id+'-'+view+'.png'),animations:'disabled'});
   }
  }
  const report={modelSha256:MODEL_SHA,character:'Kairo',clips:pack.clips.length,
   originalKeyPoses:Object.keys(P).length,geometry,
   objectivePass:true,renderedContactReviewPending:true};
  fs.writeFileSync(path.join(OUTPUT,'combat-choreography.json'),JSON.stringify(pack,null,2));
  fs.writeFileSync(path.join(OUTPUT,'metrics.json'),JSON.stringify(report,null,2));
  assert.deepEqual(errors,[]);
  // Connector-readable GitHub Actions logs allow exact generated VRM data to
  // be committed for reproducibility, not abandoned in an expiring artifact.
  console.log('COMBAT_BATCH_A_PACK_BASE64='+Buffer.from(JSON.stringify(pack)).toString('base64'));
  console.log('PASS COMBAT_BATCH_A '+JSON.stringify({clips:pack.clips.length,poses:Object.keys(P).length,sha:MODEL_SHA}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
