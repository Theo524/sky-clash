/* Read-only Kairo animation joint writer trace; real shipped modules on a
 * parented Three.js test rig, not a real-VRM visual or skin collision test.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
const fixture=path.join(__dirname,'v100-single-pose-authority.js');
const source=fs.readFileSync(fixture,'utf8'),cut=source.indexOf('function check(){');
const marker=" globalThis.SkyClash={Game:{player:f,heroes:{kairo_venn:f}}};";
assert(cut>0&&source.slice(0,cut).includes(marker),'Existing V100 fixture changed');
const stages=['V76 upper body','V72 recorded','V79 via V72','V81 transitions','V100 air'];
const qMethods=['copy','set','identity','setFromEuler','setFromAxisAngle','setFromRotationMatrix','setFromUnitVectors','slerp','slerpQuaternions','multiply','premultiply','multiplyQuaternions','normalize'];
const vMethods=['copy','set','add','sub','lerp','lerpVectors','multiplyScalar'];
function trace(){
 let owner=null,phase=null,number=0,observed=new Map();
 function mutation(bone,kind){
  if(!phase||!owner)return;
  if(!observed.has(owner))observed.set(owner,{rotation:0,position:0,bones:new Set()});
  const item=observed.get(owner);item[kind]++;item.bones.add(bone);
 }
 function patch(value,bone,kind,names){
  for(const name of names){
   const original=value?.[name];if(typeof original!=='function')continue;
   Object.defineProperty(value,name,{configurable:true,value:function(...args){
    mutation(bone,kind);return original.apply(this,args);
   }});
  }
 }
 return {
  install(f,bones){
   for(const [name,b] of Object.entries(bones)){
    patch(b.quaternion,name,'rotation',qMethods);
    patch(b.position,name,'position',vMethods);
   }
   let current=f.animate;
   Object.defineProperty(f,'animate',{configurable:true,get(){return current;},set(fn){
    assert(number<stages.length,'Unexpected new animation wrapper');
    const label=stages[number++];
    current=function(...args){
     const prior=owner;owner=label;
     try{return fn.apply(this,args)}finally{owner=prior;}
    };
   }});
  },
  run(label,fn){
   phase=label;observed=new Map();
   try{fn()}finally{phase=null;}
   return Object.fromEntries([...observed].map(([k,v])=>[k,{
    rotation:v.rotation,position:v.position,bones:[...v.bones].sort()
   }]));
  },
  registrations(){return number}
 };
}
const audit=trace(),prelude=source.slice(0,cut).replace(marker,' audit.install(f,bones);\n'+marker);
const {setup,V100}=new Function('require','__dirname','audit',prelude+'\nreturn {setup,V100};')
 (createRequire(fixture),path.dirname(fixture),audit);
const flags='?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored'+
 '&airLab=jump&animator=unified&jumpArms=compact&airLegs=steady'+
 '&jumpPreview=v125&flightPreview=v156&flightLab=blend&flightStyle=airborne';
const harness=setup(flags),f=harness.f;
assert.equal(audit.registrations(),5,'Expected V76, V72, V79, V81 and V100');
const results=[];
function check(state,frames,prepare,expected){
 prepare();
 if(expected!==undefined)assert.equal(V100.stateOf(f),expected,state+' state changed');
 const writers=audit.run(state,()=>harness.step(frames));
 results.push({state,claimed:V100.ownsAir(f),writers});
}
check('idle',10,()=>{},null);
check('ground move',10,()=>{f.vel.x=3;f.moveIntent.x=1;},null);
check('attack',6,()=>{f.vel.x=0;f.moveIntent.x=0;f.punchT=.22;},null);
check('guard',6,()=>{f.punchT=0;f.blockHeld=true;},null);
check('jump',10,()=>{f.blockHeld=false;f.pos.y=1.2;f.jumping=true;f.vel.y=10;},'jump');
check('fall',10,()=>{f.vel.y=-6;},'fall');
check('landing',10,()=>{f.pos.y=0;f.jumping=false;f.vel.y=0;f.landingMotionT=.48;},'landing');
check('flight',10,()=>{f.pos.y=2;f.landingMotionT=0;f.vel.y=0;f.sprinting=false;},'flight');
check('air Boost',6,()=>{f.sprinting=true;},null);
check('ground recovery',10,()=>{f.pos.y=0;f.sprinting=false;f.vel.x=0;},null);
const writes=(r,s)=>(r.writers[s]?.rotation||0)+(r.writers[s]?.position||0);
for(const state of ['jump','fall','landing','flight']){
 const row=results.find(r=>r.state===state);
 assert(row.claimed,state+' must be owned by V100');
 assert(writes(row,'V100 air')>0,state+' V100 did not write humanoid');
 for(const old of stages.slice(0,-1))
  assert.equal(writes(row,old),0,state+' has competing older writer '+old);
}
assert(results.some(r=>writes(r,'V76 upper body')>0),'Ground upper-body path missing');
assert(results.some(r=>writes(r,'V81 transitions')>0),'Ground transition path missing');
assert(!harness.authority.error&&!harness.upperStatus.error&&!harness.primaryStatus.error);
for(const r of results)console.log('AUDIT '+r.state+' | V100='+r.claimed+' | '+
 stages.filter(s=>writes(r,s)).map(s=>s+':'+writes(r,s)).join(' | '));
if(process.env.ANIMATION_WRITER_TRACE_JSON==='1')
 console.log(JSON.stringify({measurement:'bone quaternion/position method calls, not final world-space transforms',
  fixture:'parented Three.js humanoid using real V76/V72/V79/V81/V100 implementations',results},null,2));
console.log('PASS scoped nested Kairo writer attribution');
