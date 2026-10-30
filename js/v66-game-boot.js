/* Sky Clash V66 game boot. Select the real Kairo VRM before the engine
 * constructs its fighters; this prevents an old mannequin from attaching
 * while the correct character loads. No binary is sent off-device.
 */
(async function(){
 'use strict';
 // Approved ground and previously tested V115 jump are independent
 // presets. Previously only V97 was promoted, so the plain game opened
 // with old jumping even though the full V115 preview worked correctly.
 // Normalize BEFORE physics or animation modules read location.search.
 // Keep explicit movementLab choices and any air/jump A/B URL untouched.
 function approvedGroundQuery(search){
  const flags=new URLSearchParams(search||'');
  if(flags.has('movementLab'))return null;
  // V156 public release: unchanged V97 ground + V125 jump; replace only
  // normal Kairo flight with baked 20-joint real-VRM Q cruise and hover.
  // Explicit historical animation comparisons still opt out of promotion.
  const requested=['jumpPreview','flightPreview','jumpMode','jumpPrep',
   'jumpKnees','airLab','animator','flightLab','flightStyle','jumpArms',
   'airLegs','landingLab','movingJump'].some(key=>flags.has(key));
  if(!requested){
   flags.set('jumpPreview','v125');
   flags.set('flightPreview','v156');
  }
  const flightShortcut=['v114','v126','v127','v128','v129','v130','v131','v132','v133','v134','v135','v136','v137','v138','v140','v141','v142','v143','v144','v145','v146','v147','v148','v149'].includes(flags.get('flightPreview'))||['v150','v151','v152','v153','v155','v156'].includes(flags.get('flightPreview'));
  if(flightShortcut&&!flags.has('jumpPreview'))flags.set('jumpPreview','v125');
  flags.set('movementLab','step');
  if(!flags.has('stance'))flags.set('stance','handoff');
  if(!flags.has('joystickRun'))flags.set('joystickRun','on');
  if(!flags.has('idleArms'))flags.set('idleArms','anchored');
  // A partial A/B jump URL must not silently become a different V115
  // experiment. jumpMode=legacy explicitly disables this default preset.
  const airOptions=['airLab','animator','jumpArms','airLegs',
   'movingJump','landingLab','landingFeet','landingMove','jumpStyle',
   'jumpPrep','jumpFeet','jumpKnees','jumpFacing','jumpMode',
   'flightLab','flightStyle'];
  if(!airOptions.some(name=>flags.has(name))){
   const jumpDefaults={
    airLab:'jump',animator:'unified',jumpArms:'compact',
    airLegs:'steady',movingJump:'carry',landingLab:'contact',
    landingFeet:'plant',landingMove:'flow',jumpStyle:'expressive',
    jumpPrep:'push',jumpFeet:'hold',
    // All opt-in historical jumps preserve their chosen knee profile.
    // The public root now resolves directly to V125.
    jumpKnees:['v116','v117','v118','v119','v120','v121','v122','v123','v124','v125'].includes(flags.get('jumpPreview'))?
     'anatomic':'forward',
    jumpFacing:'locked'
   };
   for(const [name,value] of Object.entries(jumpDefaults))
    flags.set(name,value);
  }
  // V156 is default for the plain link; past flight preview URLs stay
  // available as independent comparisons with the same V125 jump.
  if(flightShortcut){
   if(!flags.has('flightLab'))flags.set('flightLab','blend');
   if(!flags.has('flightStyle'))flags.set('flightStyle','airborne');
  }
  return flags.toString();
 }
 const defaultGround=approvedGroundQuery(location.search);
 if(defaultGround!==null){
  window.history.replaceState(window.history.state,'',
   location.pathname+'?'+defaultGround+location.hash);
 }
 const store=window.SkyClashCharacterStore;
 // One public release identity. V71/V76/V97 are historical component
 // revisions, NOT the currently deployed game build number.
 const BUILD='V156';
  // V149 and earlier remain explicit flightPreview rollback modes.
  const modernFlight=['v150','v151','v152','v153','v155'].includes(new URLSearchParams(location.search).get('flightPreview'));
  const v151Preview=new URLSearchParams(location.search).get('flightPreview')==='v151';
  const v152Preview=new URLSearchParams(location.search).get('flightPreview')==='v152';
  const v153Preview=new URLSearchParams(location.search).get('flightPreview')==='v153';
  const v155Preview=new URLSearchParams(location.search).get('flightPreview')==='v155';
 window.SkyClashBuild=Object.freeze({version:BUILD,number:156,
  preview:new URLSearchParams(location.search).get('jumpArms')==='compact'?
   'compact-jump-guard':'existing-animation'});
 function script(src){
  // One immutable query snapshot per module load; defaults were normalized above.
  const params=new URLSearchParams(location.search);
  return new Promise((resolve,reject)=>{
   const e=document.createElement('script');e.src=src+((src.includes('v71-mixamo-gameplay')||src.includes('v76-upper-body')||src.includes('v72-published-actions')||src.includes('v81-pose-transitions')||src.includes('v79-extra-actions')||(['walk','step'].includes(params.get('movementLab'))&&src.includes('js/game.js')))?(params.get('movementLab')==='step'?(params.get('stance')==='unified'?'&fix=92':['match','continuous'].includes(params.get('stance'))?'&fix=91':params.get('stance')==='legacy90'?'&fix=90':'&fix=89'):params.get('movementLab')==='walk'?'&fix=88':'&fix=87'):'')+
    (src.includes('v89-grounded-step')?
   (params.get('stance')==='unified'?'&stance=92':['match','continuous'].includes(params.get('stance'))?'&stance=91':
    params.get('stance')==='legacy90'?'&stance=90':''):'');if(src.includes('v81-pose-transitions')&&
      params.get('stance')==='handoff')
     e.src+='&fix=94';
   if(params.get('joystickRun')==='on'&&
      params.get('stance')==='handoff'&&
      (src.includes('js/game.js')||src.includes('v71-mixamo-gameplay')||
       src.includes('v72-published-actions')))e.src+='&jrun=95';
   if(src.includes('v79-extra-actions')&&
      params.get('idleArms')==='steady')
     e.src+='&idle=96';
   if(src.includes('v79-extra-actions')&&
      params.get('idleArms')==='anchored')
     e.src+='&idle=97';
   if(['v76-upper-body','v72-published-actions'].some(k=>src.includes(k))&&
      params.get('idleArms')==='anchored')
     e.src+='&arm=97';
   if(src.includes('v72-published-actions')&&
      params.get('airLab')==='jump')
     e.src+='&air=98';
   if(src.includes('v81-pose-transitions')&&
      params.get('airHands')==='stable')
     e.src+='&hands=99';
   // V100 needs the NEW cooperative versions of every former air-pose
   // writer. A refreshed boot script alone is insufficient when the old
   // V71/V76/V72/V81 URLs remain cached by GitHub Pages or the browser.
   if(params.get('animator')==='unified'&&
      ['v71-mixamo-gameplay','v76-upper-body','v72-published-actions',
       'v81-pose-transitions'].some(k=>src.includes(k)))
     e.src+='&poseOwner=100';
   if(src.includes('v100-pose-authority')&&
      params.get('jumpArms')==='compact')
     e.src+='&arms=101';
   if(src.includes('v100-pose-authority')&&
      params.get('airLegs')==='steady')
     e.src+='&legs=102';
   if(src.includes('v100-pose-authority')&&
      params.get('movingJump')==='carry')
     e.src+='&moving=103';
   // All V105 pieces (collision bundle, UE5 clip exposure, final owner)
   // must refresh together, or only part of the landing graph updates.
   if(params.get('landingLab')==='contact'&&
      (src.includes('js/game.js')||src.includes('v72-published-actions')||
       src.includes('v100-pose-authority')))
     e.src+='&landing=105';
   if(params.get('landingLab')==='contact'&&
      params.get('landingFeet')==='plant'&&
      (src.includes('js/game.js')||src.includes('v100-pose-authority')))
     e.src+='&soles=106';
   if(src.includes('v100-pose-authority')&&
      (params.get('jumpStyle')==='expressive'||
       params.get('landingMove')==='pin'))
     e.src+='&performance=107';
   // V108 collision-to-air transition is both a physics input buffer
   // (compiled js/game.js) and a final-pose state (V100).
   if(params.get('jumpPrep')==='subtle'&&
      (src.includes('js/game.js')||src.includes('v100-pose-authority')))
     e.src+='&anticipation=108';
   if((params.get('jumpPrep')==='readable'||
       params.get('landingMove')==='flow')&&
      (src.includes('js/game.js')||src.includes('v100-pose-authority')))
     e.src+='&groundflow=109';
   if(src.includes('v100-pose-authority')&&
      params.get('jumpFacing')==='locked')
     e.src+='&facing=110';
   if(src.includes('v100-pose-authority')&&
      params.get('flightLab')==='blend')
     e.src+='&flight=111';
   if(params.get('jumpPrep')==='push'&&
      (src.includes('js/game.js')||src.includes('v100-pose-authority')))
     e.src+='&push=112';
   if(src.includes('v100-pose-authority')&&
      (params.get('flightStyle')==='controlled'||
       params.get('jumpFeet')==='hold'))
     e.src+='&controlled=113';
   if(src.includes('v100-pose-authority')&&
      (params.get('jumpKnees')==='guided'||
       params.get('flightStyle')==='airborne'))
     e.src+='&airborne=114';
   if(src.includes('v100-pose-authority')&&
      params.get('jumpKnees')==='forward')
     e.src+='&forward=115';
   // New V116 candidate loads ONLY when requested. The published V115
   // remains byte-for-byte selectable with jumpKnees=forward.
   if(src.includes('v100-pose-authority')&&
      params.get('jumpKnees')==='anatomic')
     e.src+='&anatomic=116';
   if(src.includes('v100-pose-authority')&&
      params.get('jumpPreview')==='v117')
     e.src+='&torso=117';
   if(src.includes('v100-pose-authority')&&
      params.get('jumpPreview')==='v118')
     e.src+='&vrmFacing=118';
   if(src.includes('v100-pose-authority')&&
      params.get('jumpPreview')==='v119')
     e.src+='&toeSpring=119';
   if(src.includes('v100-pose-authority')&&
      params.get('jumpPreview')==='v120')
     e.src+='&fluidArms=120';
    if(src.includes('v100-pose-authority')&&
       params.get('jumpPreview')==='v121')
      e.src+='&takeoffHeading=121';
    if(src.includes('v100-pose-authority')&&
       params.get('jumpPreview')==='v122')
      e.src+='&visibleToeHeading=122';
    if(src.includes('v100-pose-authority')&&
       params.get('jumpPreview')==='v123')
      e.src+='&expressiveArc=123';
    if(src.includes('v100-pose-authority')&&params.get('jumpPreview')==='v124')e.src+='&idleFeet=124';
    if(src.includes('v100-pose-authority')&&params.get('jumpPreview')==='v125')e.src+='&coordinatedFeet=125';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v126')e.src+='&expressiveFlight=126';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v127')e.src+='&suspendedFlight=127';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v128')e.src+='&worldKneeFlight=128';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v129')e.src+='&worldGuardFlight=129';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v130')e.src+='&relaxedFlight=130';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v131')e.src+='&organicFlight=131';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v132')e.src+='&buoyantFlight=132';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v133')e.src+='&weightlessFlight=133';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v134')e.src+='&naturalFlight=134';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v135')e.src+='&softKneeFlight=135';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v136')e.src+='&wholeBodyFlight=136';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v137')e.src+='&balancedFlight=137';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v138')e.src+='&sereneFlight=138';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v140')e.src+='&referenceFlight=140';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v141')e.src+='&suspendedFlight=141';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v142')e.src+='&authoredFlight=142';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v143')e.src+='&livingFlight=143';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v144')e.src+='&naturalArms=144';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v145')e.src+='&verticalFlight=145';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v146')e.src+='&verticalFollow=146';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v147')e.src+='&directionalFlight=147';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v148')e.src+='&allFlight=148';
    if(src.includes('v100-pose-authority')&&params.get('flightPreview')==='v149')e.src+='&livingTravel=149';
    if(src.includes('v100-pose-authority')&&modernFlight)e.src+='&joystickFlight=150';
    if(src.includes('v100-pose-authority')&&v151Preview)e.src+='&freeTravelArms=151';
    if(src.includes('v100-pose-authority')&&(v152Preview||v153Preview||v155Preview))e.src+='&quietHover=152';
    if(src.includes('v100-pose-authority')&&(v153Preview||v155Preview))e.src+='&streamlined=153';
   // Only the opt-in banking preview needs the new V100 JavaScript cache.
   // The published V156 flight version is still the unchanged default.
   if(src.includes('v100-pose-authority')&&
      params.get('flightBank')==='v157')
     e.src+='&bank=157';
   if(src.includes('v100-pose-authority')&&
      params.get('flightBank')==='v158')
     e.src+='&bank=158';
    if(src.includes('v100-pose-authority')&&
       params.get('flightVertical')==='v159')
      e.src+='&vertical=159';
    if(src.includes('v100-pose-authority')&&
       params.get('flightVertical')==='v160')
      e.src+='&vertical=160';
    if(src.includes('v100-pose-authority')&&
       params.get('flightVertical')==='v161')
      e.src+='&vertical=161';
    if(src.includes('v100-pose-authority')&&
       params.get('flightVertical')==='v162')
      e.src+='&vertical=162';
    if(src.includes('v100-pose-authority')&&
       params.get('flightVertical')==='v163')
      e.src+='&vertical=163';
    if(src.includes('v100-pose-authority')&&
       params.get('flightVertical')==='v164')
      e.src+='&vertical=164';
    // Preview-only cache identity: published V156 Q still uses the old
    // approved loader URL, with no new pose activated by default.
    if(src.includes('v100-pose-authority')&&
       params.get('flightBody')==='alive')
      e.src+='&body=166';
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
  // Game.init and its RAF start before the optional animation recordings
  // finish loading. Keep Kairo's VRM meshes hidden until fully composed.
  window.SKY_V104_STARTUP_GATE=true;
  window.SKY_V104_ANIMATIONS_READY=false;
  await script('js/game.js?v=1530&startup=104&stormFist=3');
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
  // V154 is an opt-in Kairo Boost *motion data* overlay; V72 remains
  // the sole visible Boost action writer. V153 old Boost stays selectable.
  const boostMode=new URLSearchParams(location.search).get('boostPreview');
  if(boostMode==='v154')await script('js/v154-boost-performance.js?v=1540');
  // Shared V155 authored shape feeds either existing owner, never both.
  if(v155Preview||boostMode==='v155')
   await script('js/v155-organic-flight.js?v=1550');
  // The local action pack is loaded ONLY on explicit editor playtest URLs.
  if(new URLSearchParams(location.search).get('studioPlaytest')==='local')
   await script('js/studio-live-bridge.js?v=2');
  await script('js/v72-published-actions.js?v=826&jabPlaytest=1&stormFist=3'+
   (boostMode==='v155'?'&boostMotion=155':boostMode==='v154'?'&boostMotion=154':'')+
   (new URLSearchParams(location.search).get('studioPlaytest')==='local'?'&studioLocal=3':''));
  await window.SkyClashPublishedGamePack.start(window);
  await script('js/v79-extra-actions.js?v=810');
  await window.SkyClashV79ExtraActions.start(window);
  // Final pose owner runs after all optional Move layers. This keeps
  // whole-body transitions smooth instead of exposing old procedural arms.
  await script('js/v81-pose-transitions.js?v=810&jabPlaytest=1&stormFist=3');
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
   // V142-V149 are cumulative rollback stages; V150+ load the full stack.
   const flightPreview=new URLSearchParams(location.search).get('flightPreview');
   const legacyFlightStage=/^v14[2-9]$/.test(flightPreview)?
    Number(flightPreview.slice(1)):0;
   if(modernFlight||legacyFlightStage>=142)
    await script('js/v142-hover-keyframes.js?v=1420');
   if(modernFlight||legacyFlightStage>=143)
    await script('js/v143-hover-performance.js?v=1430');
   if(modernFlight||legacyFlightStage>=144)
    await script('js/v144-relaxed-arms.js?v=1440');
   if(modernFlight||legacyFlightStage>=145)
    await script('js/v145-vertical-flight.js?v=1450');
   if(modernFlight||legacyFlightStage>=146)
    await script('js/v146-vertical-followthrough.js?v=1460');
   if(modernFlight||legacyFlightStage>=147)
    await script('js/v147-horizontal-flight.js?v=1470');
   if(modernFlight||legacyFlightStage>=148)
    await script('js/v148-full-flight.js?v=1480');
   if(modernFlight||legacyFlightStage>=149)
    await script('js/v149-travel-performance.js?v=1490');
   if(modernFlight)
    await script('js/v150-joystick-flight.js?v=1500');
   if(v151Preview)
    await script('js/v151-travel-arms.js?v=1510');
   if(v152Preview||v153Preview||v155Preview)
    await script('js/v152-flight-silhouette.js?v=1520');
   if(v153Preview||v155Preview)
    await script('js/v153-streamlined-flight.js?v=1530');
   if(flightPreview==='v156')
    await script('js/v156-real-vrm-flight.js?v=1560');
   if(new URLSearchParams(location.search).get('flightPose')==='v158')
    await script('js/v158-real-vrm-flight.js?v=1580');
   if(new URLSearchParams(location.search).get('flightVertical')==='v163')
    await script('js/v163-real-kairo-vertical-keyframes.js?v=1630');
   if(new URLSearchParams(location.search).get('flightVertical')==='v164')
    await script('js/v164-selected-kairo-real-flight.js?v=1640');
   await script('js/v100-pose-authority.js?v=1561');
   window.SkyClashV100Animator.start(window);
  }
  // Release the model/recording startup barrier ONLY after all wrappers
  // have been installed. Late VRMs have their own 18-frame pose gate.
  window.SKY_V104_ANIMATIONS_READY=true;
  window.SkyClashLoadScreen?.animationsFinished?.();
  if(walkLab){
   // Native <details> is keyboard/touch friendly and starts collapsed
   // on narrow/mobile screens. Version + current action remain visible.
   const label=document.createElement('details');
   label.id='walkLabStatus';
   label.className='sky-lab-panel';
   const heading=document.createElement('summary');
   heading.id='walkLabSummary';
   heading.textContent='BUILD '+BUILD+' · Loading… ▾';
   const detail=document.createElement('pre');
   detail.id='walkLabDetails';
   detail.textContent='Animation controllers initializing…';
   label.append(heading,detail);
   label.open=!window.matchMedia?.('(max-width: 760px), (pointer: coarse)')?.matches;
   label.addEventListener('pointerdown',event=>event.stopPropagation());
   label.addEventListener('touchstart',event=>event.stopPropagation(),{passive:true});
   document.body.appendChild(label);
   window.setInterval(()=>{
    const g=window.SkyClash?.Game,p=g?.player;
    const v=p?Math.hypot(p.vel?.x||0,p.vel?.z||0):0;
    const walk=window.SkyClashGameplayMotions?.weight||0;
    const mode=p?.sprinting?'BOOST':p?.v80AnalogRun?'RUN':'WALK / IDLE';
    const step=p?.v89Step?.mode||'idle';
    const flags=new URLSearchParams(location.search);
    const unifiedAir=flags.get('animator')==='unified';
    const compactAir=flags.get('jumpArms')==='compact';
    const steadyLegs=flags.get('airLegs')==='steady';
    const movingJump=flags.get('movingJump')==='carry';
    const contactLanding=flags.get('landingLab')==='contact';
    const finalSoles=contactLanding&&flags.get('landingFeet')==='plant';
    const expressive=flags.get('jumpStyle')==='expressive';
    const movingPin=finalSoles&&flags.get('landingMove')==='pin';
    const subtlePrep=['subtle','readable','push'].includes(flags.get('jumpPrep'));
    const pushPrep=flags.get('jumpPrep')==='push';
    const readablePrep=flags.get('jumpPrep')==='readable';
    const movingFlow=finalSoles&&flags.get('landingMove')==='flow';
    const facingLocked=flags.get('jumpFacing')==='locked';
    const flightBlendLab=flags.get('flightLab')==='blend';
    const controlledFlight=['controlled','airborne'].includes(flags.get('flightStyle'));
    const guidedKnees=['guided','forward','anatomic'].includes(flags.get('jumpKnees'));
    const anatomicKnees=flags.get('jumpKnees')==='anatomic';
    const forwardKnees=flags.get('jumpKnees')==='forward';
    const stationaryFeet=flags.get('jumpFeet')==='hold';
    const airOwner=window.SkyClashPoseAuthority;
    const airMode=unifiedAir?
      airOwner?.ready?(compactAir?'V101 COMPACT GUARD':'V100 RECORDED ARMS')+
        ' ('+(airOwner.active||'ready')+')':
      'UNAVAILABLE ('+(airOwner?.active||'loading')+')':'LEGACY';
    const groundMode=anchoredArmLab?'V97 APPROVED':
      joystickLab?'V95 JOYSTICK':handoffLab?'V94 HANDOFF':
      stepLab?'V89 STEP':'DEFAULT';
    // Do not enlarge mobile panel automatically as the game state changes.
    heading.textContent=BUILD+' · '+(p?.v108JumpPrepT>0?'PREP':p?.jumping?'JUMP':
      flightBlendLab&&p?.flying&&!p?.dropping&&!p?.sprinting?'FLIGHT':p?.landingMotionT>0?
      'LANDING':p?.v80AnalogRun?'RUN':v>1.3?'WALK':'IDLE')+
      (label.open?' ▲':' ▾');
    detail.textContent=stepLab?
     'SKY CLASH · BUILD '+BUILD+'\n'+
     'GROUND: '+groundMode+' | JUMP: '+airMode+'\n'+
     'AIR LEGS: '+(steadyLegs&&airOwner?.ready?
       'V102 STEADY | MAX '+(airOwner.maxLegStepDeg||0).toFixed(1)+
       '°/FRAME | corrected '+(airOwner.legStepClamps||0):
       steadyLegs?'UNAVAILABLE':'V100 ORIGINAL')+'\n'+
     'TAKEOFF: '+(movingJump&&airOwner?.ready?
       airOwner.movingJump||'V103 PREPARING':
       movingJump?'UNAVAILABLE':'V102 ORIGINAL')+
       ' | mix: '+Math.round((airOwner?.movingJumpWeight||0)*100)+'%\n'+
     (subtlePrep?'ANTICIPATION: '+(pushPrep?'V112 load & push':
       readablePrep?'V109 readable':'V108 subtle')+
       ' · knee load '+
       (airOwner?.jumpPrep||0)+'% · remaining '+
       Math.round((p?.v108JumpPrepT||0)*1000)+'ms'+
       (pushPrep?' | load '+(airOwner?.pushDurationMs||0)+'ms'+
         ' | release '+(airOwner?.pushRelease||0)+'%'+
         (stationaryFeet?' | shoe shift '+
         (airOwner?.prepFootSlipCm||0)+'cm'+
         (guidedKnees?' | '+
          (anatomicKnees?
            (airOwner?.prepKneeDirections||'V116 world knees')+
             ' | knee '+(airOwner?.prepWorldKneeCm||0)+'cm'+
             (flags.get('jumpPreview')==='v118'?
              ' | forward '+(airOwner?.prepForwardSource||'unknown')+
              ' | scene dot '+(airOwner?.prepSceneVsBodyDot??'?'):''):
           forwardKnees?(airOwner?.prepKneeDirections||'forward bend'):
           'hinge-guided'):''):''):'')+'\n':'')+
     (expressive?'JUMP BODY: V107 expressive · energy '+
       (airOwner?.jumpExpression||0)+'%\n':'')+
     (flightBlendLab?'FLIGHT: '+(airOwner?.flightStyle||
       (flags.get('flightStyle')==='airborne'?'V114 airborne loading':
        controlledFlight?'V113 controlled loading':'loading'))+
       ' | speed '+(airOwner?.flightSpeed||0)+' | forward mix '+
       (airOwner?.flightBlend||0)+'%\n':'')+
     (facingLocked?'AIR FACING: V110 aligned | before '+
       Math.round(airOwner?.airFacingSourceYawDeg||0)+'°'+
       ' | after '+Math.round(airOwner?.airFacingDriftDeg||0)+'°\n':'')+
     (contactLanding?
      'LAND: '+(airOwner?.ready?
        airOwner.landingStyle+' · '+(airOwner.landingPhase||'ready')+
        ' · impact '+(airOwner.impactSpeed||0).toFixed(1):
        'V105 CONTACT PREPARING')+'\n'+
      (finalSoles?'SOLE: '+(airOwner?.soleContact||'not-tested')+
        ' | lowest gap '+(airOwner?.soleGapCm??'?')+'cm'+
        ' | other '+(airOwner?.otherSoleGapCm??'?')+'cm'+
        ' | corrections '+(airOwner?.soleCorrections||0)+'\n':'')+
      ((movingPin||movingFlow)?'MOVING PLANT: '+(airOwner?.movingFootPin||'waiting')+
       ' | slip '+(airOwner?.movingFootSlipCm||0)+'cm'+
       ' | pinned frames '+(airOwner?.movingFootPinFrames||0)+
       (movingFlow?' | landing '+
         Math.round((airOwner?.landingDuration||.48)*1000)+'ms':'')+'\n':''):
      'LAND: V100 UNCHANGED · MOVING-JUMP TEST ONLY\n')+
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
  // Don't strand the opening screen if an optional action pack fails.
  // The engine's native fallback is still a playable fighter.
  window.SKY_V104_ANIMATIONS_READY=true;
  window.SkyClashLoadScreen?.animationsFinished?.();
  console.error('Sky Clash V66 boot failed',err);
  const status=document.getElementById('bootStatus');
  if(status)status.textContent='Could not start game: '+err.message;
 }
 if(!selected)console.warn('V68: assets/characters/kairo.vrm is missing; procedural fallback remains active');
})();
