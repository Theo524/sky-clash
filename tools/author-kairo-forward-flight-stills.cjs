/* Kairo real VRM assistant-only static pose study.
 * Manual world-axis directions bake to exact local 20-bone quaternions.
 * Runs strictly in Pose Lab, no game flight or physics code touched.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const candidates=[
 {id:'i-calmer-cruise',body:40,upper:-7,neck:-35,head:-9,thighDown:.67,shinDown:.32,armDown:.60,forearmDown:.88},
 {id:'j-curved-athlete',body:46,upper:-9,neck:-42,head:-12,thighDown:.57,shinDown:.23,armDown:.55,forearmDown:.88},
 // Stronger articulated silhouettes. V152 and i/j remain the unchanged comparison.
 {id:'k-gaze-led-cruise',body:45,upper:-12,neck:-36,head:-17,thighDown:.92,thighBack:.75,shinDown:.16,armDown:.76,armBack:.36,forearmDown:.46,forearmBack:.89},
 {id:'l-forward-power',body:50,upper:-10,neck:-45,head:-11,thighDown:1.08,thighBack:.67,shinDown:.12,armDown:.80,armBack:.27,forearmDown:.38,forearmBack:.91},
 // Actual front-view anatomy: Kairo's LEFT normalized joints are at +X.
 // Independent left/right anatomical segment aims: a wider, readable
 // front/back silhouette without twisting the hips or shoulders.
 {id:'m-spaced-athlete',body:46,upper:-11,neck:-38,head:-13,
  limbAims:[
   [.27,-.93,-.72],[-.25,-.87,-.76], // hips -> knees
   [.33,-.30,-.94],[-.31,-.36,-.92], // knees -> feet
   [.49,-.77,-.34],[-.50,-.79,-.34], // shoulders -> elbows
   [.27,-.41,-.86],[-.27,-.35,-.91]  // elbows -> hands
  ]},
 {id:'n-open-power',body:49,upper:-10,neck:-44,head:-11,
  limbAims:[
   [.33,-1.02,-.67],[-.29,-.90,-.77],
   [.38,-.20,-.96],[-.35,-.30,-.92],
   [.56,-.77,-.28],[-.52,-.80,-.31],
   [.29,-.36,-.88],[-.29,-.33,-.91]
  ]},
 // Compact elbow hinge: shoulder->elbow trails, elbow->wrist folds
 // forward toward the hips. This is NOT a reversed rearward forearm.
 // Athletic/skydive REFERENCES for flow only; humanoid directions are
 // authored and verified on Kairo's actual normalized model.
 {id:'o-elbow-corrected',body:46,upper:-11,neck:-38,head:-13,
  elbowForward:true,limbAims:[
   [.15,-.94,-.72],[-.13,-.88,-.76],
   [.12,-.24,-.95],[-.12,-.29,-.94],
   [.20,-.85,-.47],[-.21,-.85,-.46],
   [.07,-.91,.18],[-.07,-.88,.18]
  ]},
 {id:'p-compact-power',body:49,upper:-10,neck:-44,head:-11,
  elbowForward:true,limbAims:[
   [.18,-1.0,-.67],[-.16,-.92,-.73],
   [.10,-.17,-.94],[-.09,-.26,-.93],
   [.24,-.86,-.43],[-.23,-.87,-.42],
   [.05,-.92,.17],[-.04,-.92,.17]
  ]},
 // Second reference-guided correction: forearms still trail behind the
 // body, but bend FORWARD relative to rearward upper arms, avoiding both
 // the earlier inverted hook and the first attempt's hanging hands.
 {id:'q-trailing-athlete',body:46,upper:-11,neck:-38,head:-13,
  naturalElbow:true,limbAims:[
   [.15,-.94,-.72],[-.13,-.88,-.76],
   [.12,-.24,-.95],[-.12,-.29,-.94],
   [.18,-.59,-.83],[-.18,-.61,-.81],
   [.08,-.95,-.28],[-.08,-.93,-.29]
  ]},
 {id:'r-clean-power',body:49,upper:-10,neck:-44,head:-11,
  naturalElbow:true,limbAims:[
   [.18,-1.0,-.67],[-.16,-.92,-.73],
   [.10,-.17,-.94],[-.09,-.26,-.93],
   [.20,-.62,-.79],[-.18,-.63,-.79],
   [.05,-.95,-.29],[-.05,-.94,-.30]
  ]},
 // Player feedback on real in-game film: Q arms droop and the two legs
 // appear almost stacked. These replace only arms/legs on the established
 // Q torso/head, with the elbow hinge direction preserved.
 {id:'s-lifted-athlete',body:46,upper:-11,neck:-38,head:-13,
  naturalElbow:true,limbAims:[
   [.24,-.90,-.59],[-.21,-.89,-.65],
   [.27,-.14,-.98],[-.24,-.20,-.95],
   [.23,-.42,-.91],[-.21,-.40,-.90],
   [.06,-.89,-.37],[-.07,-.86,-.40]
  ]},
 {id:'t-swept-cruise',body:46,upper:-11,neck:-38,head:-13,
  naturalElbow:true,limbAims:[
   [.22,-.96,-.53],[-.20,-.87,-.65],
   [.24,-.11,-.98],[-.23,-.17,-.97],
   [.24,-.50,-.83],[-.23,-.45,-.87],
   [.06,-.86,-.24],[-.06,-.87,-.30]
  ]}
];
// CI can capture just the comparison set while keeping historical studies
// reproducible. Missing or invalid IDs should fail, never silently skip.
const requested=(process.env.VISUAL_CANDIDATES||'').split(',').map(s=>s.trim()).filter(Boolean);
const studyCandidates=requested.length?candidates.filter(c=>requested.includes(c.id)):candidates;
if(requested.length && (studyCandidates.length!==requested.length ||
 new Set(requested).size!==requested.length)){
 throw Error('Unknown or duplicate VISUAL_CANDIDATES selector');
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader-webgl','--enable-webgl'
 ]});
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
 const errs=[];page.on('pageerror',e=>errs.push(String(e)));
 const out=path.resolve('visual-review-output','kairo-real-flight-candidates');
 fs.mkdirSync(out,{recursive:true});
 try{
  await page.goto('http://127.0.0.1:'+(process.env.VISUAL_PORT||8765)+'/pose-lab.html',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SkyClashPoseLab?.ready,null,{timeout:180000});
  await page.click('#loadHover');
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Loaded exact V152'),null,{timeout:15000});
  await page.locator('#showJoints').uncheck();
  const v152=await page.evaluate(()=>window.SkyClashPoseLab.motion);
  const base={sha:v152.modelSha256,bones:v152.bones.length,
   metrics:await page.evaluate(()=>window.SkyClashPoseLab.flightGeometry)};
  assert.equal(base.bones,20,'Must use actual 20-bone Kairo VRM');
  assert.equal(v152.keyframes.length,2);
  // Save the unmodified original from identical cameras for honest A/B review.
  for(const side of ['side','front','back']){
   await page.click('[data-view="'+side+'"]');
   await page.waitForTimeout(95);
   await page.locator('#modelView').screenshot({path:path.join(out,'v152-hover-'+side+'.png'),animations:'disabled'});
  }
  const reports=[];
  for(const a of studyCandidates){
   const rotations=[
    {bone:'hips',axis:'right',degrees:a.body},
    {bone:'spine',axis:'right',degrees:a.upper*.52},
    {bone:'chest',axis:'right',degrees:a.upper*.48},
    // This is the missing head direction: make the head a separate
    // intentional pose, not a vertical continuation of Kairo's torso.
    {bone:'neck',axis:'right',degrees:a.neck},
    {bone:'head',axis:'right',degrees:a.head},
    {bone:'upperChest',axis:'right',degrees:-2}
   ];
   // Verified by real side-view renders: Kairo visibly faces +Z in Pose Lab;
   // therefore legs and arms must trail into -Z, not cross in front.
   // Target actual limb SEGMENTS on the true VRM, not guessed Euler axes.
   const aim=(bone,child,down,back,side=0)=>({
    bone,child,worldDirection:[side,-down,-back]});
   const segmentPairs=[
    ['leftUpperLeg','leftLowerLeg'],['rightUpperLeg','rightLowerLeg'],
    ['leftLowerLeg','leftFoot'],['rightLowerLeg','rightFoot'],
    ['leftUpperArm','leftLowerArm'],['rightUpperArm','rightLowerArm'],
    ['leftLowerArm','leftHand'],['rightLowerArm','rightHand']
   ];
   const aims=a.limbAims?
    segmentPairs.map(([bone,child],i)=>({
     bone,child,worldDirection:a.limbAims[i]
    })):[
     aim('leftUpperLeg','leftLowerLeg',a.thighDown,a.thighBack??.88,-.05),
     aim('rightUpperLeg','rightLowerLeg',a.thighDown+.08,(a.thighBack??.88)-.04,.05),
     aim('leftLowerLeg','leftFoot',Math.max(.06,a.shinDown-.12),.98),
     aim('rightLowerLeg','rightFoot',Math.max(.09,a.shinDown-.06),.98),
     aim('leftUpperArm','leftLowerArm',a.armDown+.18,a.armBack??.43,-.49),
     aim('rightUpperArm','rightLowerArm',a.armDown+.20,a.armBack??.43,.49),
     aim('leftLowerArm','leftHand',a.forearmDown-.14,a.forearmBack??.62,-.07),
     aim('rightLowerArm','rightHand',a.forearmDown-.12,(a.forearmBack??.65)-.01,.07)
    ];
   const result=await page.evaluate(({id,rotations,aims})=>
    window.SkyClashPoseLab.authorWorldPose({
     name:id+' – gaze and trailing limbs',time:1.2,rotations,aims}),{id:a.id,rotations,aims});
   assert.equal(result.data.modelSha256,base.sha);
   assert.equal(result.data.keyframes.length,2);
   assert.notDeepEqual(result.data.keyframes[0].quaternions,
    result.data.keyframes[1].quaternions);
   assert.notDeepEqual(result.data.keyframes[0].quaternions[4],
    result.data.keyframes[1].quaternions[4],
    'Neck must be authored independently');
   assert.notDeepEqual(result.data.keyframes[0].quaternions[5],
    result.data.keyframes[1].quaternions[5],
    'Head must be authored independently');
   fs.writeFileSync(path.join(out,a.id+'.pose.json'),JSON.stringify(result.data,null,2));
   for(const side of ['side','front','back']){
    await page.click('[data-view="'+side+'"]');
    await page.waitForTimeout(95);
    await page.locator('#modelView').screenshot({path:path.join(out,a.id+'-'+side+'.png'),
     animations:'disabled'});
   }
   reports.push({id:a.id,control:a,metrics:result.metrics,
    quats20:result.data.bones.length});
   if(a.limbAims){
    const m=result.metrics;
    console.log('REAL_KAIRO_LIMB_QA '+JSON.stringify({
      id:a.id,spacing:m.limbSpacing,signedHinge:m.elbowSagittalSign,
      leftElbow:m.leftElbow,
      rightElbow:m.rightElbow,knees:[m.leftKnee,m.rightKnee],
      ankles:[m.limbLandmarks?.leftFoot,m.limbLandmarks?.rightFoot],
      hands:[m.limbLandmarks?.leftHand,m.limbLandmarks?.rightHand]
    }));
    assert(m.limbSpacing?.knee>0.10,'Candidate must have visible knee separation');
    assert(m.limbSpacing?.ankle>0.12,'Candidate feet still overlap');
    assert(m.limbSpacing?.wrist>0.20,'Candidate wrists still cross');
    assert(m.leftElbow>15&&m.rightElbow>15,'Arms must have visible elbow bend');
    if(a.elbowForward||a.naturalElbow){
     // +Z is calibrated forward for the actual Kairo VRM. A natural
     // elbow need not point the wrist fully ahead of the elbow; it must
     // bend IN the correct sagittal direction relative to the upper arm.
     for(const side of ['left','right']){
      const elbow=m.limbLandmarks[side+'LowerArm'];
      const wrist=m.limbLandmarks[side+'Hand'];
      assert(elbow&&wrist,'Missing real Kairo elbow/wrist');
      if(a.elbowForward){
       assert(wrist[2]>elbow[2]+.035,
        side+' first-pass wrist must fold forward of elbow');
      }
      if(a.naturalElbow){
       assert(wrist[2]>elbow[2]-.16,
        side+' forearm trails too far behind elbow');
      }
      assert(m[side+'Elbow']>=29&&m[side+'Elbow']<=48,
       side+' elbow should be softly articulated');
     }
     assert(m.elbowSagittalSign.left<-.20 &&
      m.elbowSagittalSign.right<-.20,
      'Side-view forearm hinge reverses intended human flexion');
     assert(m.limbSpacing.ankle<.60,'Legs spread too wide');
     assert(m.limbSpacing.wrist<.68,'Arms are too widely flared');
     assert(m.limbSpacing.wrist>.23,'Arms disappeared into torso');
     assert(m.leftKnee>20&&m.rightKnee>20,'Legs lost bend');
    }
   }
  }
  assert.equal(errs.length,0,'Browser errors: '+errs.join('; '));
  fs.writeFileSync(path.join(out,'real-vrm-measurements.json'),
   JSON.stringify({baseline:base,source:'actual Kairo VRM0 / actual V152 captured hover',
    candidates:reports,visuallyApproved:false,gameChanged:false},null,2));
  const count=fs.readdirSync(out).filter(x=>x.endsWith('.png')).length;
  assert.equal(count,3*(studyCandidates.length+1));
  console.log('PASS Kairo real-VRM authored head/chest/leg candidates',JSON.stringify({
   headMetrics:reports.map(x=>({id:x.id,headVsTorso:x.metrics.headVsTorsoAngle,
    trunk:x.metrics.trunkPitch,face:x.metrics.facialAxisToHorizontal})),
   screenshots:count
  }));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
