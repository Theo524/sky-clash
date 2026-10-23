/* Sky Clash V66 game boot. Select the real Kairo VRM before the engine
 * constructs its fighters; this prevents an old mannequin from attaching
 * while the correct character loads. No binary is sent off-device.
 */
(async function(){
 'use strict';
 const store=window.SkyClashCharacterStore;
 function script(src){
  return new Promise((resolve,reject)=>{
   const e=document.createElement('script');e.src=src+((src.includes('v71-mixamo-gameplay')||src.includes('v76-upper-body')||src.includes('v72-published-actions')||src.includes('v81-pose-transitions')||src.includes('v79-extra-actions')||(['walk','step'].includes(new URLSearchParams(location.search).get('movementLab'))&&src.includes('js/game.js')))?(new URLSearchParams(location.search).get('movementLab')==='step'?(new URLSearchParams(location.search).get('stance')==='unified'?'&fix=92':['match','continuous'].includes(new URLSearchParams(location.search).get('stance'))?'&fix=91':new URLSearchParams(location.search).get('stance')==='legacy90'?'&fix=90':'&fix=89'):new URLSearchParams(location.search).get('movementLab')==='walk'?'&fix=88':'&fix=87'):'')+
    (src.includes('v89-grounded-step')?
   (new URLSearchParams(location.search).get('stance')==='unified'?'&stance=92':['match','continuous'].includes(new URLSearchParams(location.search).get('stance'))?'&stance=91':
    new URLSearchParams(location.search).get('stance')==='legacy90'?'&stance=90':''):'');if(src.includes('v81-pose-transitions')&&
      new URLSearchParams(location.search).get('stance')==='handoff')
     e.src+='&fix=94';
   if(new URLSearchParams(location.search).get('joystickRun')==='on'&&
      new URLSearchParams(location.search).get('stance')==='handoff'&&
      (src.includes('js/game.js')||src.includes('v71-mixamo-gameplay')||
       src.includes('v72-published-actions')))e.src+='&jrun=95';
   if(src.includes('v79-extra-actions')&&
      new URLSearchParams(location.search).get('idleArms')==='steady')
     e.src+='&idle=96';
   if(src.includes('v79-extra-actions')&&
      new URLSearchParams(location.search).get('idleArms')==='anchored')
     e.src+='&idle=97';
   if(['v76-upper-body','v72-published-actions'].some(k=>src.includes(k))&&
      new URLSearchParams(location.search).get('idleArms')==='anchored')
     e.src+='&arm=97';
   if(src.includes('v72-published-actions')&&
      new URLSearchParams(location.search).get('airLab')==='jump')
     e.src+='&air=98';
   if(src.includes('v81-pose-transitions')&&
      new URLSearchParams(location.search).get('airHands')==='stable')
     e.src+='&hands=99';
   e.async=false;
   e.onload=resolve;e.onerror=()=>reject(Error('Could not load '+src));document.body.appendChild(e);
  });
 }
 let selected=null;
 try{selected=await store.resolve();}catch(e){console.warn('Kairo VRM selection unavailable',e);}
 window.SKY_V66_REAL_KAIRO=!!selected;
 // Roll back only V67 hand orientation without changing the character.
 const handMode=new URLSearchParams(location.search).get('hands');
 // Studio-native hands are the new default. ?hands=legacy compares the
 // previous V67 twisted-wrist/forced-fingers version, no other changes.
 window.SKY_V73_NATIVE_HANDS=handMode!=='legacy'&&handMode!=='original';
 window.SKY_V67_FIST_CORRECTION=handMode!=='original';
 window.HERO_VRM_URL=selected?.url||null;
 window.HERO_VRM_B64=null;
 try{
  // V89 step planner must exist before the physics module is initialized.
  const stepLab=new URLSearchParams(location.search).get('movementLab')==='step';
  const stanceLab=stepLab&&new URLSearchParams(location.search).get('stance')==='legacy90';
  const unifiedLab=stepLab&&new URLSearchParams(location.search).get('stance')==='unified';
  const handoffLab=stepLab&&new URLSearchParams(location.search).get('stance')==='handoff';
  const joystickLab=handoffLab&&new URLSearchParams(location.search)
   .get('joystickRun')==='on';
  const steadyArmLab=joystickLab&&new URLSearchParams(location.search)
   .get('idleArms')==='steady';
  const anchoredArmLab=joystickLab&&new URLSearchParams(location.search)
   .get('idleArms')==='anchored';
  const continuousLab=stepLab&&['match','continuous','unified'].includes(new URLSearchParams(location.search).get('stance'));
  if(stepLab)await script('js/v89-grounded-step.js?v=890');
  if(joystickLab)await script('js/v95-joystick-radius.js?v=950');
  await script('js/game.js?v=820');
  // Isolated V88 walk evaluation. Original live game settings are untouched
  // unless the user explicitly opens ?movementLab=walk.
  const walkLab=['walk','step'].includes(new URLSearchParams(location.search).get('movementLab'));
  if(walkLab&&window.SkyClash?.TUNING){
   if(stepLab)window.SkyClashMovementLab={version:89,enabled:true,targetWalkSpeed:4.8,joystickRun:joystickLab};
   else window.SkyClashMovementLab={version:88,enabled:true,targetWalkSpeed:4.8};
  }
  await script('js/v62-playable-master.js?v=660');
  await script('js/v63-recorded-motion.js?v=640');
  await script('js/v71-mixamo-gameplay.js?v=820');
  await window.SkyClashV71Walk.start(window);
  // V76: exactly ONE controller owns both standing and walking arms.
  // The old V72 walk-only arm layer is available solely for A/B rollback.
  const upperMode=new URLSearchParams(location.search).get('upper');
  if(upperMode==='legacy'){
   await script('js/v72-walk-arms.js?v=750');
   await window.SkyClashV72Arms.start(window);
  }else if(upperMode!=='procedural'){
   await script('js/v76-upper-body.js?v=820');
   await window.SkyClashV76UpperBody.start(window);
  }
  await script('js/v72-published-actions.js?v=820');
  await window.SkyClashPublishedGamePack.start(window);
  await script('js/v79-extra-actions.js?v=810');
  await window.SkyClashV79ExtraActions.start(window);
  // Final pose owner runs after all optional Move layers. This keeps
  // whole-body transitions smooth instead of exposing old procedural arms.
  await script('js/v81-pose-transitions.js?v=810');
  window.SkyClashV81Transitions.start(window);
  // Apply authored stepping and brief support-foot corrections LAST, after
  // the previously existing pose-transition owner. Ordinary game is intact.
  if(stepLab)window.SkyClashWalkStep.start(window);
  // V91 observes the final V89-rendered pose and bounds individual joint
  // changes across EVERY grounded idle/step/walk/settle state boundary.
  // The previous V90 mode stays available for comparison but is not used.
  if(continuousLab){
   await script('js/v91-stance-continuity.js?v=910');
   window.SkyClashV91Stance.start(window);
  }
  // V100 unified air owner is installed LAST after every legacy layer.
  // The old wrappers yield only during natural jump/fall/landing states.
  if(new URLSearchParams(location.search).get('animator')==='unified'){
   await script('js/v100-pose-authority.js?v=1000');
   window.SkyClashV100Animator.start(window);
  }
  if(walkLab){
   const label=document.createElement('div');
   label.id='walkLabStatus';
   Object.assign(label.style,{position:'fixed',bottom:'18px',left:'18px',
    background:'rgba(9,18,30,.92)',color:'#e2f7ff',border:'1px solid #7097a7',
    padding:'9px 12px',font:'12px/1.45 monospace',borderRadius:'9px',
    zIndex:'99999',pointerEvents:'none',whiteSpace:'pre-line'});
   label.textContent=stepLab?'FIRST-STEP LAB V89 — preparing fighter…':'WALK TEST V88 — preparing fighter…';
   document.body.appendChild(label);
   window.setInterval(()=>{
    const g=window.SkyClash?.Game,p=g?.player;
    const v=p?Math.hypot(p.vel?.x||0,p.vel?.z||0):0;
    const walk=window.SkyClashGameplayMotions?.weight||0;
    const mode=p?.sprinting?'BOOST':p?.v80AnalogRun?'RUN':'WALK / IDLE';
    const step=p?.v89Step?.mode||'idle';
    label.textContent=stepLab?
     (anchoredArmLab?'APPROVED IDLE ARMS · V97\n':steadyArmLab?'STEADY ARMS · V96\n':joystickLab?'JOYSTICK WALK / RUN · V95\n':handoffLab?'POSE BLEND REPAIR · V94\n':unifiedLab?'UNIFIED IDLE ARMS · V92\n':continuousLab?'IDLE / WALK CONTINUITY · V91\n':stanceLab?'IDLE STANCE MATCH · V90\n':'FIRST-STEP LAB · V89\n')+
     'Idle > weight shift > first step > walk > settle\n'+
     'Stage: '+step+' | Speed: '+v.toFixed(2)+' | Walk: '+Math.round(walk*100)+'%\n'+
     'Support corrections: '+(window.SkyClashMovementLab?.pinCorrections||0)+
     (handoffLab?' | Actual pose blend: '+Math.round(100*(window.SkyClashPoseTransitions?.transition||0))+'%':'')+
     (steadyArmLab?' | Random idle gestures: OFF':'')+
     (new URLSearchParams(location.search).get('airHands')==='stable'?
       '\nAir hands: '+(window.SkyClashPoseTransitions?.airHands||'loading')+
       ' | wrist clamps: '+(window.SkyClashPoseTransitions?.airWristClamps||0):'')+
     (anchoredArmLab?' | Arm source: '+
      (window.SkyClashUpperBody?.idleSource||'loading')+
      ' | Arm anchor: '+(window.SkyClashUpperBody?.anchoredIdle?'ON':'loading'):'')+
     (joystickLab?'\nStick: '+Math.round((p?.v95StickRadius||0)*100)+'% | Run: '+
       (p?.v80AnalogRun?'YES':'no')+' | Boost: '+(p?.sprinting?'YES':'no'):'')+
     (stanceLab?' | Stance match: '+Math.round((window.SkyClashMovementLab?.stanceBlend??1)*100)+'%':'')+
     (unifiedLab?' | Arm source: '+(window.SkyClashUpperBody?.idleSource||'loading'):'')+
     (continuousLab?' | Max joint/frame: '+((window.SkyClashMovementLab?.maxAngularStep||0)*180/Math.PI).toFixed(1)+'°'+
       ' | corrected: '+(window.SkyClashMovementLab?.poseClamps||0):''):
     'MOVEMENT LAB · V88\nWASD = WALK  |  Boost = original\n'+
     'Speed: '+v.toFixed(1)+'  Motion: '+mode+'  Walk blend: '+Math.round(walk*100)+'%';
   },180);
  }
  console.info('Sky Clash V66 model source:',selected?.source||'procedural fallback');
 }catch(err){
  console.error('Sky Clash V66 boot failed',err);
  const status=document.getElementById('bootStatus');
  if(status)status.textContent='Could not start game: '+err.message;
 }
 if(!selected)console.warn('V68: assets/characters/kairo.vrm is missing; procedural fallback remains active');
})();
