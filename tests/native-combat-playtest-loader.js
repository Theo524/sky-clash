/* The public experiment is opt-in, bounded and nonfatal to the base game. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const studio=require('../js/v72-published-actions.js');
const native=require('../assets/animations/kairo/original-jab-playtest.v1.json');
const base=require('../assets/animations/gameplay/studio-actions-v1.json');
const path='assets/animations/kairo/original-jab-playtest.v1.json';
const clone=x=>JSON.parse(JSON.stringify(x));
function context(search='',nativeFetch){
 const calls=[],warnings=[],timers=[];
 const out={THREE,AbortController,location:{search},console:{warn:(...args)=>warnings.push(args)},
  SkyClash:{Game:{heroes:{kairo_venn:{animate(){}}}}},
  setTimeout:(callback,ms)=>{timers.push(ms);return setTimeout(callback,5);},clearTimeout,
  fetch:async(url,options)=>{
   calls.push({url,options});
   if(url.startsWith(path))return nativeFetch?nativeFetch(url,options):
    {ok:true,status:200,json:async()=>clone(native)};
   if(url==='assets/animations/gameplay/studio-actions-v1.json')
    return {ok:true,status:200,json:async()=>({schema:base.schema,revision:base.revision,
     motions:[base.motions.find(m=>m.slot==='idle')]})};
   return {ok:false,status:404};
  }};
 return {out,calls,warnings,timers};
}
async function main(){
 // The tracked file is the actual validated clip, never a placeholder.
 const decoded=studio.decodeNativeCombatPreview(THREE,native);
 assert.equal(decoded.clipId,'original-jab');assert.equal(native.frames.length,35);
 assert.equal(native.playtest.experimental,true);
 assert.equal(native.playtest.approval,'pending-player-visual-review');
 assert(native.frames.every(frame=>!Object.hasOwn(frame,'feet')),
  'Do not ship generated trajectory diagnostics with the runtime asset');

 for(const query of ['', '?combatAnim=kairo-a1','?combatAnim=unknown']){
  const test=context(query),status=await studio.start(test.out);
  assert(status.ready);assert.equal(status.error,null);
  assert.equal(status.nativePlaytest.requested,false);
  assert.equal(status.nativePlaytest.state,'off');assert(!status.nativeCombatPreview);
  assert(!test.calls.some(call=>call.url.startsWith(path)));
  assert.deepEqual(test.timers,[]);
 }
 const enabled=context('?combatAnim=blender-jab-v1');
 const ready=await studio.start(enabled.out);
 assert(ready.ready&&ready.nativeCombatPreview);
 assert.equal(ready.nativePlaytest.state,'ready');
 assert.equal(ready.nativePlaytest.clipId,'original-jab');
 assert.deepEqual(enabled.timers,[5000]);
 const request=enabled.calls.find(call=>call.url.startsWith(path));
 assert.equal(request.options.cache,'no-cache');assert(request.options.signal instanceof AbortSignal);

 const failures=[
  ()=>({ok:false,status:404}),
  ()=>Promise.reject(Error('offline')),
  ()=>({ok:true,status:200,json:async()=>{throw SyntaxError('bad JSON');}}),
  ()=>({ok:true,status:200,json:async()=>({...native,modelSha256:'wrong model'})}),
  ()=>new Promise(()=>{}),
  ()=>({ok:true,status:200,json:()=>new Promise(()=>{})})
 ];
 for(const fail of failures){
  const test=context('?combatAnim=blender-jab-v1',fail);
  const status=await studio.start(test.out);
  assert(status.ready,'Failed experiment disabled the base animation pack');
  assert.equal(status.error,null,'Do not replace base error state with optional asset failure');
  assert.equal(status.nativePlaytest.state,'fallback');assert(status.nativePlaytest.error);
  assert(!status.nativeCombatPreview,'Bad/unavailable clip was partially installed');
  assert.equal(test.warnings.length,1);assert.equal(test.calls.filter(c=>c.url.startsWith(path)).length,1);
 }
 const timeout=context('?combatAnim=blender-jab-v1',()=>new Promise(()=>{}));
 await studio.start(timeout.out);
 assert(timeout.calls.find(c=>c.url.startsWith(path)).options.signal.aborted,
  'Timed-out request must release its network work');

 const disabled=context('?combatAnim=blender-jab-v1&studioActions=off');
 const off=await studio.start(disabled.out);
 assert.equal(off.ready,false);assert.equal(off.nativePlaytest.state,'disabled');
 assert.equal(disabled.calls.length,0);

 // The startup awaits the optional registration before returning readiness
 // to the outer boot gate. There is no late installation after timeout.
 let finish;
 const late=context('?combatAnim=blender-jab-v1',()=>new Promise(resolve=>{finish=resolve;}));
 const fallback=await studio.start(late.out);
 finish({ok:true,status:200,json:async()=>clone(native)});
 await new Promise(resolve=>setTimeout(resolve,0));
 assert(!fallback.nativeCombatPreview);assert.equal(fallback.nativePlaytest.state,'fallback');
 const boot=fs.readFileSync(require.resolve('../js/v66-game-boot.js'),'utf8');
 assert(boot.includes('js/v72-published-actions.js?v=822&jabPlaytest=1'));
 assert(boot.includes('js/v81-pose-transitions.js?v=810&jabPlaytest=1'));
 assert(fs.readFileSync(require.resolve('../index.html'),'utf8').includes('selectedBFlightReady=164&jabPlaytest=1'));
 console.log('PASS experimental jab loading: opt-in only, cached clients refreshed, bounded fetch/body read, invalid/offline/timeout fallback');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
