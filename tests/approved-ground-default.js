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
assert(!/\banimator\s*['"]|\bflightLab\s*['"]|\bjumpPrep\s*['"]/.test(prelude),
 'Ground default must never force experimental airborne settings');

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
for(const key of ['animator','airLab','jumpArms','jumpPrep','flightLab',
 'flightStyle','landingLab','jumpKnees'])assert.equal(run.flags.has(key),false,
 'Never silently turn on unapproved preview '+key);

run=simulate('?scene=dojo&flightStyle=airborne&jumpArms=compact','#playing');
assert.equal(run.flags.get('scene'),'dojo');
assert.equal(run.flags.get('flightStyle'),'airborne');
assert.equal(run.flags.get('jumpArms'),'compact');
assert.equal(run.flags.get('movementLab'),'step');
assert.equal(run.location.hash,'#playing');

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

assert(index.includes('js/v66-game-boot.js?v=820&fix=116&groundDefault=97'),
 'Bump the boot script cache to prevent mobile devices using old startup code');
assert(boot.includes('if(stepLab)await script(\'js/v89-grounded-step.js?v=890\')'));
assert(boot.includes('if(joystickLab)await script(\'js/v95-joystick-radius.js?v=950\')'));
assert(boot.includes("new URLSearchParams(location.search).get('animator')==='unified'"),
 'Keep V100 opt-in; ground defaults must not turn on flight/jump controllers');

console.log('PASS approved V97 walking/run/arms defaults, preservation of explicit variants, legacy rollback, and opt-in air behavior.');
