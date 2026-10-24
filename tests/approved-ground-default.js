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
// The normal game URL now integrates improved V125 jump + relaxed V130 flight.
const jumpDefaults={
 airLab:'jump',animator:'unified',jumpArms:'compact',airLegs:'steady',
 movingJump:'carry',landingLab:'contact',landingFeet:'plant',
 landingMove:'flow',jumpStyle:'expressive',jumpPrep:'push',
 jumpFeet:'hold',jumpKnees:'forward',jumpFacing:'locked'
};
for(const [name,value] of Object.entries({...jumpDefaults,jumpKnees:'anatomic',
 flightLab:'blend',flightStyle:'airborne',
 jumpPreview:'v125',flightPreview:'v131'}))
 assert.equal(run.flags.get(name),value,'V130 integrated public default: '+name);
// Scene/custom gameplay URL parameters must not remove the unified default.
const integratedScene=simulate('?scene=dojo');
assert.equal(integratedScene.flags.get('scene'),'dojo');
assert.equal(integratedScene.flags.get('jumpPreview'),'v125');
assert.equal(integratedScene.flags.get('flightPreview'),'v131');
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

assert(index.includes('js/v66-game-boot.js?v=820&fix=116&groundDefault=97&jumpDefault=125'),
 'Bump the boot cache key to prevent mobile devices using old jump defaults');
assert(boot.includes("const BUILD='V131'"));
assert(boot.includes("&organicFlight=131"));
assert(boot.includes('if(stepLab)await script(\'js/v89-grounded-step.js?v=890\')'));
assert(boot.includes('if(joystickLab)await script(\'js/v95-joystick-radius.js?v=950\')'));
assert(boot.includes("new URLSearchParams(location.search).get('animator')==='unified'"),
 'Keep V100 conditional; jump default intentionally enables it but flight remains optional');

console.log('PASS unified public URL: approved V97 ground + V125 jump + organic V131 flight, explicit A/B/legacy rollbacks.');
