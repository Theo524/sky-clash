/* Ground-default regression: exercise the REAL boot URL normalization,
 * including browser location/history behavior, before any game loader runs.
 * No WebGL is needed and no animation/physics authoring files are changed.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const boot=fs.readFileSync(path.join(root,'js/v66-game-boot.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

const first=boot.indexOf(' function approvedGroundQuery(search){');
const last=boot.indexOf(' const store=window.SkyClashCharacterStore;',first);
assert(first>0&&last>first,'Ground defaults must run before the boot loads animations');
const prelude=boot.slice(first,last);
assert(prelude.includes("jumpMode=legacy"),'Retain an explicit jump rollback');
assert(prelude.includes("'flightLab','flightStyle'"),
 'Explicit flight requests must bypass automatic jump setup');

function simulate(search,hash=''){
  const location={pathname:'/sky-clash/',search,hash};
  const history={state:{test:true},urls:[]};
  history.replaceState=(state,title,url)=>{
    assert.equal(state,history.state,'preserve browser history state');
    assert.equal(title,'');
    const next=new URL(url,'https://theo524.github.io');
    assert.equal(next.pathname,location.pathname);
    location.search=next.search;
    location.hash=next.hash;
    history.urls.push(url);
  };
  vm.runInNewContext('(function(){'+prelude+'})();',
   {window:{history},location,URLSearchParams});
  return {flags:new URLSearchParams(location.search),location,urls:history.urls};
}

let run=simulate('');
for(const [name,value] of Object.entries({
 movementLab:'step',stance:'handoff',joystickRun:'on',idleArms:'anchored'
}))assert.equal(run.flags.get(name),value,'Default '+name);
assert.equal(run.urls.length,1,'Rewrite defaults without page reload');
// Historical V115 defaults are retained for explicit comparison URLs.
// The normal game URL integrates approved V125 jump + V152 calm-hover trailing-arm responsive flight.
const jumpDefaults={
 airLab:'jump',animator:'unified',jumpArms:'compact',airLegs:'steady',
 movingJump:'carry',landingLab:'contact',landingFeet:'plant',
 landingMove:'flow',jumpStyle:'expressive',jumpPrep:'push',
 jumpFeet:'hold',jumpKnees:'forward',jumpFacing:'locked'
};
for(const [name,value] of Object.entries({...jumpDefaults,jumpKnees:'anatomic',
 flightLab:'blend',flightStyle:'airborne',
 jumpPreview:'v125',flightPreview:'v156'}))
 assert.equal(run.flags.get(name),value,'V156 integrated public default: '+name);
// Scene/custom gameplay URL parameters must not remove the unified default.
const integratedScene=simulate('?scene=dojo');
assert.equal(integratedScene.flags.get('scene'),'dojo');
assert.equal(integratedScene.flags.get('jumpPreview'),'v125');
assert.equal(integratedScene.flags.get('flightPreview'),'v156');
run=simulate('?flightPreview=v130');
assert.equal(run.flags.get('jumpPreview'),'v125');
assert.equal(run.flags.get('flightLab'),'blend');
assert.equal(run.flags.get('flightStyle'),'airborne');
run=simulate('');

// The V116 short game link inherits the exact tested V115 base,
 // changing ONLY the standing jump knee profile.
run=simulate('?jumpPreview=v116');
assert.equal(run.flags.get('jumpPreview'),'v116');
for(const [name,value] of Object.entries(jumpDefaults))
 assert.equal(run.flags.get(name),name==='jumpKnees'?'anatomic':value,
  'V116 must preserve the approved V115/ground option '+name);
for(const key of ['flightLab','flightStyle'])
 assert.equal(run.flags.has(key),false,'V116 must not enable experimental flight');

// V117 fixes the torso as well as the anatomic knee preset; the public
// default stays V115 and all flight options remain opt-in.
run=simulate('?jumpPreview=v117');
assert.equal(run.flags.get('jumpPreview'),'v117');
for(const [name,value] of Object.entries(jumpDefaults))
 assert.equal(run.flags.get(name),name==='jumpKnees'?'anatomic':value,
  'V117 must inherit approved baseline option '+name);
for(const key of ['flightLab','flightStyle'])
 assert.equal(run.flags.has(key),false,'V117 never enables experimental flight');

// V118 inherits the exact approved ground and V115 jump/landing
// presets. ONLY knee/world-front opt-in is different. Flight stays off.
run=simulate('?jumpPreview=v118');
assert.equal(run.flags.get('jumpPreview'),'v118');
for(const [key,value] of Object.entries(jumpDefaults))
 assert.equal(run.flags.get(key),key==='jumpKnees'?'anatomic':value,
  'V118 must retain existing gameplay default '+key);
for(const key of ['flightLab','flightStyle'])
 assert.equal(run.flags.has(key),false,'V118 must not enable flight experiments');

// V119 retains V118's corrected VRM0 anatomical axis; only standing
// prep toe/ankle/body softness changes, not ground, flight or moving jump.
run=simulate('?jumpPreview=v119');
assert.equal(run.flags.get('jumpPreview'),'v119');
for(const [name,value] of Object.entries(jumpDefaults))
 assert.equal(run.flags.get(name),name==='jumpKnees'?'anatomic':value,
  'V119 must inherit approved V115 ground/jump setting '+name);
for(const key of ['flightLab','flightStyle'])
 assert.equal(run.flags.has(key),false,'V119 must not enable flight');

// V120 inherits V119 feet and V118 true VRM0 facing, changing only
// PREP and ascent arms inside the existing V100 owner.
run=simulate('?jumpPreview=v120');
assert.equal(run.flags.get('jumpPreview'),'v120');
for(const [name,value] of Object.entries(jumpDefaults))
 assert.equal(run.flags.get(name),name==='jumpKnees'?'anatomic':value,
  'V120 must preserve approved ground/jump '+name);
for(const key of ['flightLab','flightStyle'])
 assert.equal(run.flags.has(key),false,'No V120 powered flight changes');

// V121 carries only standing takeoff yaw: same approved V115 ground,
 // V118 true leg forward, V119 toe spring, V120 arms and no flight.
run=simulate('?jumpPreview=v121');
assert.equal(run.flags.get('jumpPreview'),'v121');
for(const [name,value] of Object.entries(jumpDefaults))
 assert.equal(run.flags.get(name),name==='jumpKnees'?'anatomic':value,
  'V121 short link must keep approved baseline '+name);
for(const key of ['flightLab','flightStyle'])
 assert.equal(run.flags.has(key),false,'V121 must not enable flight');

// V122 restores a visible foot heading during *standing* loaded jump.
run=simulate('?jumpPreview=v122');
assert.equal(run.flags.get('jumpPreview'),'v122');
for(const [name,value] of Object.entries(jumpDefaults))
 assert.equal(run.flags.get(name),name==='jumpKnees'?'anatomic':value,
  'V122 must inherit all approved ground/jump defaults: '+name);
for(const key of ['flightLab','flightStyle'])
 assert.equal(run.flags.has(key),false,'V122 may not enable powered flight');

// V123 is opt-in and inherits the approved V122 toe heading/V115 root.
run=simulate('?jumpPreview=v123');
assert.equal(run.flags.get('jumpPreview'),'v123');
for(const [name,value] of Object.entries(jumpDefaults))
 assert.equal(run.flags.get(name),name==='jumpKnees'?'anatomic':value,
  'V123 must preserve approved baseline '+name);
for(const key of ['flightLab','flightStyle'])
 assert.equal(run.flags.has(key),false,'V123 must not enable flight');

// V124 is an opt-in idle->jump shoe-stance continuity correction.
run=simulate('?jumpPreview=v124');
assert.equal(run.flags.get('jumpPreview'),'v124');
for(const [name,value] of Object.entries(jumpDefaults))
 assert.equal(run.flags.get(name),name==='jumpKnees'?'anatomic':value,
  'V124 must preserve approved baseline '+name);
for(const key of ['flightLab','flightStyle'])
 assert.equal(run.flags.has(key),false,'V124 may not enable flight');

run=simulate('?scene=dojo&flightStyle=airborne&jumpArms=compact','#playing');
assert.equal(run.flags.get('scene'),'dojo');
assert.equal(run.flags.get('flightStyle'),'airborne');
assert.equal(run.flags.get('jumpArms'),'compact');
assert.equal(run.flags.get('movementLab'),'step');
assert.equal(run.location.hash,'#playing');

// A/B and rollback URLs must not receive V115 jump settings implicitly.
for(const query of [
 '?jumpMode=legacy','?jumpPrep=subtle','?animator=legacy',
 '?flightLab=blend','?flightStyle=controlled','?airLab=jump',
 '?jumpKnees=guided'
]){
 const variant=simulate(query);
 const explicit=new URLSearchParams(query);
 for(const [name,value] of explicit)
  assert.equal(variant.flags.get(name),value,'Preserve A/B value '+name);
 assert.equal(variant.flags.has('jumpFeet'),explicit.has('jumpFeet'),
   'Do not force the full V115 jump preset over '+query);
 assert.equal(variant.flags.get('movementLab'),'step');
}
run=simulate('?stance=continuous&joystickRun=off&idleArms=steady');
assert.equal(run.flags.get('movementLab'),'step');
assert.equal(run.flags.get('stance'),'continuous');
assert.equal(run.flags.get('joystickRun'),'off');
assert.equal(run.flags.get('idleArms'),'steady');

for(const flag of ['legacy','walk','step']){
 const old='?movementLab='+flag+'&idleArms=steady';
 run=simulate(old);
 assert.equal(run.location.search,old,'Preserve explicitly requested '+flag+' behavior');
 assert.equal(run.urls.length,0,'Do not rewrite explicit '+flag+' URLs');
}

run=simulate('?movementLab=legacy');
assert.equal(run.flags.has('joystickRun'),false,
 'Old movement rollback must not turn on V95');
assert.equal(run.flags.has('stance'),false);

assert(index.includes('js/v66-game-boot.js?v=1560&fix=116&groundDefault=97&jumpDefault=125'),
 'Bump the boot cache key to prevent mobile devices using old jump defaults');
assert(boot.includes("const BUILD='V156'"), 'Public release must identify V156');
assert(boot.includes("&suspendedFlight=141"), 'V141 rollback must remain available');
assert(boot.includes("&authoredFlight=142"), 'V142 rollback cache key must be available');
assert(boot.includes("&livingFlight=143"), 'V143 rollback remains available');
assert(boot.includes("&naturalArms=144"), 'V144 natural arm fallback must remain available');
assert(boot.includes("&verticalFlight=145"), 'V145 fallback retains its cache key');
assert(boot.includes("&verticalFollow=146"), 'V146 rollback retained');
assert(boot.includes("&directionalFlight=147"), 'V147 flight fallback retained');
assert(boot.includes("&allFlight=148"), 'V148 rollback remains available');
assert(boot.includes("&livingTravel=149"), 'V149 changing travel animation cache key');
assert(boot.includes("&referenceFlight=140"));
assert(boot.includes('if(stepLab)await script(\'js/v89-grounded-step.js?v=890\')'));
assert(boot.includes('if(joystickLab)await script(\'js/v95-joystick-radius.js?v=950\')'));
assert(boot.includes("params.get('animator')==='unified'"),
 'Keep V100 conditional; jump default intentionally enables it but flight remains optional');

console.log('PASS unified public URL: approved V97 ground + V125 jump + V156 model-authored flight, explicit V153/V152 rollbacks.');

// Execute the ACTUAL script loader in a DOM stub, not a second recreated
// routing algorithm. Guard the V156 default and selected preview cache keys
// while enforcing one query parse per script.
const scriptBegin=boot.indexOf(' function script(src){');
const scriptEnd=boot.indexOf(' let selected=null;',scriptBegin);
assert(scriptBegin>0&&scriptEnd>scriptBegin,'Isolate the live module loader');
const realScript=boot.slice(scriptBegin,scriptEnd);

async function scriptURL(search,source){
 const selected=new URLSearchParams(search);
 const loaded=[];
 let parses=0;
 class CountedParams extends URLSearchParams {
  constructor(...args){super(...args);parses++;}
 }
 const fp=selected.get('flightPreview');
 const scope={
  location:{search},URLSearchParams:CountedParams,
  modernFlight:['v150','v151','v152','v153','v155'].includes(fp),
  v151Preview:fp==='v151',v152Preview:fp==='v152',
  v153Preview:fp==='v153',v155Preview:fp==='v155',
  document:{
   createElement:()=>({src:''}),
   body:{appendChild:e=>{loaded.push(e.src);e.onload();}}
  }
 };
 const load=vm.runInNewContext(realScript+'\nscript;',scope);
 await load(source);
 assert.equal(parses,1,'A script load should parse normalized URL exactly once');
 assert.equal(loaded.length,1,'Each script() appends one module');
 return loaded[0];
}

(async()=>{
 const normal=simulate('').location.search;
 const game=await scriptURL(normal,'js/game.js?v=1530&startup=104&stormFist=3');
 for(const part of ['&fix=89','&jrun=95','&landing=105','&soles=106',
   '&groundflow=109','&push=112'])
  assert(game.includes(part),'Public game loader misses '+part);
 const air=await scriptURL(normal,'js/v100-pose-authority.js?v=1561');
 for(const part of ['&arms=101','&legs=102','&moving=103','&landing=105',
   '&soles=106','&performance=107','&groundflow=109','&facing=110',
   '&flight=111','&push=112','&controlled=113','&airborne=114',
   '&anatomic=116','&coordinatedFeet=125'])
  assert(air.includes(part),'V156 normal air loader misses '+part);
 assert.equal(await scriptURL(normal,'js/v156-real-vrm-flight.js?v=1560'),
   'js/v156-real-vrm-flight.js?v=1560','Normal Q animation asset unchanged');
 const native=await scriptURL(normal,'js/v72-published-actions.js?v=826');
 for(const part of ['&fix=89','&jrun=95','&arm=97','&air=98',
   '&poseOwner=100','&landing=105'])
  assert(native.includes(part),'Normal combat owner misses '+part);
 const v164=await scriptURL(simulate('?flightVertical=v164').location.search,
   'js/v100-pose-authority.js?v=1561');
 assert(v164.includes('&vertical=164'),'Selected V164 stays opt-in');
 const v153=await scriptURL(simulate('?flightPreview=v153').location.search,
   'js/v100-pose-authority.js?v=1561');
 for(const part of ['&joystickFlight=150','&quietHover=152','&streamlined=153'])
  assert(v153.includes(part),'Historical V153 rollback misses '+part);
 const v143=await scriptURL(simulate('?flightPreview=v143').location.search,
   'js/v100-pose-authority.js?v=1561');
 assert(v143.includes('&livingFlight=143'),'Historical V143 remains reachable');
 const walk=await scriptURL('?movementLab=walk','js/v71-mixamo-gameplay.js?v=820');
 assert(walk.includes('&fix=88'),'Historical V88 walk mode preserved');
 const handoff=await scriptURL('?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored',
   'js/v72-published-actions.js?v=826');
 assert(handoff.includes('&fix=89')&&handoff.includes('&jrun=95')&&
   handoff.includes('&arm=97'),'Explicit step and arm flags preserved');
 console.log('PASS real boot module routing: V156 normal, V164, V143/V153 rollback, V88 walk, V97 stance, query parsed once');
})().catch(error=>{console.error(error);process.exitCode=1});



// Exercise the real cumulative flight loader with a stub for the script tag.
// This catches missing/duplicated layers without modifying game animation.
const flightBegin=boot.indexOf("  if(new URLSearchParams(location.search).get('animator')==='unified'){");
const flightStop=boot.indexOf('  // Release the model/recording startup barrier',flightBegin);
assert(flightBegin>0&&flightStop>flightBegin,'Find real V100 boot section');
const flightCode=boot.slice(flightBegin,flightStop);
async function flightSequence(search){
 const flags=new URLSearchParams(search),preview=flags.get('flightPreview');
 const loaded=[];let started=0;
 const ctx={
  location:{search},URLSearchParams,
  modernFlight:['v150','v151','v152','v153','v155'].includes(preview),
  v151Preview:preview==='v151',v152Preview:preview==='v152',
  v153Preview:preview==='v153',v155Preview:preview==='v155',
  script:async name=>{loaded.push(name)},
  window:{SkyClashV100Animator:{start:()=>{started++}}}
 };
 await vm.runInNewContext('(async()=>{'+flightCode+'})()',ctx);
 assert.equal(started,flags.get('animator')==='unified'?1:0,
  'V100 final pose owner starts exactly once for unified animator');
 return loaded;
}
const historicalModules=[
 'hover-keyframes','hover-performance','relaxed-arms','vertical-flight',
 'vertical-followthrough','horizontal-flight','full-flight','travel-performance'
].map((part,i)=>'js/v'+(142+i)+'-'+part+'.js?v='+(142+i)+'0');
const ownerModule='js/v100-pose-authority.js?v=1561';
(async()=>{
 for(let stage=142;stage<=149;stage++){
  const query=simulate('?flightPreview=v'+stage).location.search;
  assert.deepEqual(await flightSequence(query),[
   ...historicalModules.slice(0,stage-141),ownerModule],
   'V'+stage+' must load historical V142..V'+stage+' only and the final owner');
 }
 const normal=simulate('').location.search;
 assert.deepEqual(await flightSequence(normal),
  ['js/v156-real-vrm-flight.js?v=1560',ownerModule],
  'V156 public default must load only the accepted source and final owner');
 for(const stage of ['v150','v151','v152','v153','v155']){
  const q=simulate('?flightPreview='+stage).location.search;
  const wanted=[...historicalModules,'js/v150-joystick-flight.js?v=1500'];
  if(stage==='v151')wanted.push('js/v151-travel-arms.js?v=1510');
  if(['v152','v153','v155'].includes(stage))
   wanted.push('js/v152-flight-silhouette.js?v=1520');
  if(['v153','v155'].includes(stage))
   wanted.push('js/v153-streamlined-flight.js?v=1530');
  wanted.push(ownerModule);
  assert.deepEqual(await flightSequence(q),wanted,
   'Modern flight preview '+stage+' must retain the full original prefix');
 }
 for(const [param,extra] of [
  ['flightVertical=v163','js/v163-real-kairo-vertical-keyframes.js?v=1630'],
  ['flightVertical=v164','js/v164-selected-kairo-real-flight.js?v=1640'],
  ['flightPose=v158','js/v158-real-vrm-flight.js?v=1580']
 ]){
  const q=simulate('?'+param).location.search;
  assert.deepEqual(await flightSequence(q),[
   'js/v156-real-vrm-flight.js?v=1560',extra,ownerModule],
   'Opt-in '+param+' should not activate historical layers');
 }
 assert.deepEqual(await flightSequence('?animator=legacy'),[],
  'Explicit legacy animator must bypass V100 flight');
 console.log('PASS real V100 boot order: eight old stages, modern variants, V156 and opt-in flight');
})().catch(e=>{console.error(e);process.exitCode=1});
