/* Local Studio game bridge: pure policy plus editor wiring guard. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const bridge=require('../js/studio-live-bridge.js');
const runtime=require('../js/v72-published-actions.js');
const original=require('../assets/animations/gameplay/studio-actions-v1.json');
const entry=original.motions.find(m=>m.slot==='idle'&&m.character==='kairo');
const pack={schema:original.schema,revision:original.revision,motions:[{...entry,slot:'punch1'}]};
assert.deepEqual(bridge.validate(pack),['punch1']);
for(const bad of [
 {...pack,revision:2},
 {...pack,motions:[]},
 {...pack,motions:[pack.motions[0],pack.motions[0]]},
 {...pack,motions:[{...pack.motions[0],character:'rin'}]},
 {...pack,motions:[{...pack.motions[0],slot:'idle4'}]},
 {...pack,motions:[{...pack.motions[0],encoding:'unsupported'}]}
])assert.throws(()=>bridge.validate(bad));
assert(bridge.supportedSlots.includes('punch1'));
assert(bridge.supportedSlots.includes('kick'));
for(const slot of ['floating','flying','fallingIdle','landing','boost','guard']){
 assert(bridge.supportedSlots.includes(slot),slot+' missing from local playtest');
 assert.deepEqual(bridge.validate({...pack,motions:[{...entry,slot}]}),[slot]);
}
const airOwner=read('js/v100-pose-authority.js');
assert(airOwner.includes("get('studioPlaytest')!=='local'"));
assert(airOwner.includes('local.slots.includes(slot)'));
assert(!bridge.supportedSlots.includes('idle4'));
const html=read('animation-studio.html'),studio=read('js/animation-studio.js');
const boot=read('js/v66-game-boot.js'),runtimeSource=read('js/v72-published-actions.js');
const index=read('index.html');
assert(html.includes('id="applyGameMoves"')&&html.includes('id="clearAppliedGameMoves"'));
assert(html.includes('id="exportPunchSources"'));
assert(studio.includes('exportAssignedPunchSources'));
assert(studio.includes("item.zipEntry.async('uint8array')"));
assert(studio.includes("item.file.arrayBuffer()"));
assert(html.includes('js/studio-live-bridge.js?v=3'));
assert(studio.includes("window.location.assign('index.html?studioPlaytest=local&scene=dojo')"));
assert(studio.includes('LiveBridge.save(result.pack)'));
assert(studio.includes('GameExporter.bake(THREE,fbx,'));
assert(studio.includes('if(actionFighter!==\'kairo\')'));
assert(boot.includes("get('studioPlaytest')==='local'"));
assert(boot.includes('js/studio-live-bridge.js?v=3'));
assert(runtimeSource.includes('await bridge.load()'));
assert(runtimeSource.includes('Object.assign(actions,localActions)'));
assert(runtimeSource.includes("status.localPlaytest.state='fallback'"));
assert(runtimeSource.includes('studioLocalMovesStatus'));
assert(index.includes('&studioLocal=10'));
assert(boot.includes('js/v100-pose-authority.js?v=1561'));
assert(boot.includes("?'&studioLocal=3':''"));
assert(boot.includes('js/v72-published-actions.js?v=828'));
assert(!runtimeSource.includes("get('punchBody')"));
assert(runtimeSource.includes('const fullBodyPunch=groundedPunch'));
assert(runtimeSource.includes("['punch1','punch2','punch3','overhand','uppercut']"));
assert(runtimeSource.includes('!fullBodyPunch&&(i===0||i>=14)'));
assert(runtimeSource.includes('if(!localPunch||entry.sampleSupport)'));
assert(runtimeSource.includes("const selective=localPunch&&entry.slot!=='punch1'"));
assert(runtimeSource.includes("if(selective&&!initialSupport?.[side])continue"));
assert(runtimeSource.includes('entry.sampleSupport(localPunchClock(entry,this.attackElapsed||0,'));
assert(runtimeSource.includes('const contacts=localPunch?entry:localPlant'));
assert(runtimeSource.includes("supportFoot('left',state.clock,contacts,state.localStrikeFeet)"));
assert(runtimeSource.includes("supportFoot('right',state.clock,contacts,state.localStrikeFeet)"));
// A 2.5s Mixamo clip with 1× authoring speed must progress only .55
// source seconds during a .55s combat beat, not 2.5 seconds.
const localPunch={seconds:2.5,attackImpact:1.25,speed:1};
const sourceBegin=runtime.localPunchClock(localPunch,0,.55);
const sourceEnd=runtime.localPunchClock(localPunch,.55,.55);
assert(Math.abs(sourceEnd-sourceBegin-.55)<1e-9,'Mixamo punch accelerated');
assert(Math.abs(runtime.localPunchClock({...localPunch,speed:.5},.55,.55)-
 runtime.localPunchClock({...localPunch,speed:.5},0,.55)-.275)<1e-9);
// The user's Roundhouse Kick is a 2.5s real Mixamo source. At 1× the
// local 0.87s gameplay action must cover 0.87 SOURCE seconds, not 2.5s.
const roundhouse={slot:'kick',seconds:2.5,kickImpact:.87,speed:1};
const kickStart=runtime.localKickClock(roundhouse,0,.87);
const kickEnd=runtime.localKickClock(roundhouse,.87,.87);
assert(Math.abs(kickEnd-kickStart-.87)<1e-8,'Local Mixamo roundhouse accelerated');
assert(Math.abs(runtime.localKickClock(roundhouse,.41,.87)-.87)<1e-8,
 'Recorded kick should align with the original gameplay contact');
assert(Math.abs(runtime.localKickClock({...roundhouse,speed:.5},.87,.87)-
 runtime.localKickClock({...roundhouse,speed:.5},0,.87)-.435)<1e-8);
// Detect real leg-rotation motion, not the source's idle lead-in.
const kickFrames=76,kickStride=20*4,kickData=new Int16Array(kickFrames*kickStride);
for(let i=0;i<kickFrames;i++){
 for(let b=0;b<20;b++)kickData[i*kickStride+b*4+3]=32767;
 const angle=1.2*Math.max(0,1-Math.abs(i-26)/4);
 for(const bone of [17,18]){
  kickData[i*kickStride+bone*4]=Math.round(Math.sin(angle/2)*32767);
  kickData[i*kickStride+bone*4+3]=Math.round(Math.cos(angle/2)*32767);
 }
}
const detectedKick=runtime.recordedKickImpact(
 {slot:'kick',frames:kickFrames,fps:30,seconds:2.5,bones:runtime.BONES},kickData);
assert(detectedKick>.70&&detectedKick<1.03,'Roundhouse contact must follow its leg-drive peak');
// The user's Combo Punch is almost 3 seconds and has multiple source
// strikes. A one-hit gameplay slot must pick the FIRST substantial beat,
// not enter mid-way through the third punch. Do not alter Punch1.
const combo={slot:'punch2',seconds:2.97,speed:1,
 attackImpact:1.8,attackBeats:[.833,1.8,2.267]};
assert(Math.abs(runtime.localPunchClock(combo,.55*.45,.55)-.833)<.0001);
const opening={...combo,slot:'punch1',attackImpact:.633};
assert(Math.abs(runtime.localPunchClock(opening,.55*.45,.55)-.633)<.0001,
 'The working first Mixamo punch must remain unchanged');
// Check the actual beat detector against original-format (non-keyframed)
// synthetic quaternion input. Two distinct arm bursts stay separate.
const frames=96,stride=20*4,encoded=new Int16Array(frames*stride);
for(let i=0;i<frames;i++){
 for(let b=0;b<20;b++)encoded[i*stride+b*4+3]=32767;
 const pulse=at=>Math.max(0,1-Math.abs(i-at)/4);
 const angle=.9*pulse(20)+1.2*pulse(61);
 for(const b of [7,11]){
  encoded[i*stride+b*4]=Math.round(Math.sin(angle/2)*32767);
  encoded[i*stride+b*4+3]=Math.round(Math.cos(angle/2)*32767);
 }
}
const beats=runtime.recordedPunchBeats({frames,fps:30,seconds:95/30,bones:runtime.BONES},encoded);
assert(beats.length>=2&&beats[0]<1&&beats[beats.length-1]>1.6,
 'Multi-hit Mixamo clip should expose separated recorded punches');
assert(runtimeSource.includes('const visibleBefore=status.localPlaytest?.state'));
assert(runtimeSource.includes("entry.slot!=='punch1'?visibleBefore:null"));
assert(runtimeSource.includes('state.localEntryAge/.085'));
assert(runtimeSource.includes('node.quaternion.slerpQuaternions(state.localEntryPose[i],applied,handoffEase)'));
assert.equal(runtime.choose({...({hp:100,vel:{x:0,z:0},punchT:.3,punchSide:0,attackKind:'punch'})},
 {punch1:{},punch2:{}}),'punch2','Cross should use the assigned punch2 consistently');
assert(studio.includes('if(result.missing.length||result.unsupported.length)'));
assert(runtimeSource.includes('Inspect loaded Mixamo clips'));
assert(runtimeSource.includes('Copy animation report'));
assert(runtimeSource.includes("get('flightBody')==='alive'"));
assert(runtimeSource.includes("status.localPlaytest.slots.includes(entry.slot)"));
assert(runtimeSource.includes('root.SkyClashV100Animator?.v166FlightBodyExpression('));
assert(runtimeSource.includes("status.localPlaytest.flightBodyOwner=flightExpression?'V72 Studio flight':'unavailable'"));
assert(boot.includes("params.get('flightBody')==='alive'"));
assert(boot.includes("e.src+='&body=167'"));
assert(!boot.includes("flags.set('studioPlaytest','local')"),
 'Never auto-publish local punches into ordinary game URLs');
assert(read('js/v72-studio-game-export.js').includes('footContacts'));
assert(runtimeSource.includes('status.localPlaytest.slots.includes(entry.slot)'));
assert(html.includes('animation-studio.js?v=834&fix=87&studioLocal=2'));
assert(!read('assets/animations/gameplay/studio-actions-v1.json').includes('local-apply-to-game-test'));
// The named editor moves must be used by actual special-attack kinds
// when and ONLY when that slot was explicitly applied in the local pack.
const priorStatus=globalThis.SkyClashPublishedActions;
const fighter={hp:100,vel:{x:0,z:0},punchT:.3,punchSide:1,attackSerial:3};
const available={punch3:{},kick:{},uppercut:{},meteor:{}};
globalThis.SkyClashPublishedActions={localPlaytest:{state:'ready',slots:['uppercut','meteor']}};
assert.equal(runtime.choose({...fighter,attackKind:'skyUppercut'},available),'uppercut');
assert.equal(runtime.choose({...fighter,attackKind:'skyKick'},available),'meteor');
// The third Kairo combo beat alternates hook/overhand EVERY new combo.
// When Studio punch3 is assigned, no repeat may use published overhand.
const withOverhand={punch1:{},punch2:{},punch3:{},overhand:{},kick:{}};
globalThis.SkyClashPublishedActions={localPlaytest:{state:'ready',slots:['punch3','kick']}};
for(const variant of ['hook','overhand','hook','overhand','hook']){
 assert.equal(runtime.choose({...fighter,attackKind:'hook',attackVariant:variant,
  attackSerial:(fighter.attackSerial||0)+1},withOverhand),'punch3',
  'Repeated third beat must consistently use Studio punch3, not published overhand');
}
globalThis.SkyClashPublishedActions={localPlaytest:{state:'off',slots:[]}};
assert.equal(runtime.choose({...fighter,attackKind:'hook',attackVariant:'overhand'},
 withOverhand),'overhand','Published overhand routing must remain unchanged');
assert.equal(runtime.choose({...fighter,attackKind:'skyUppercut'},available),'punch3');
assert.equal(runtime.choose({...fighter,attackKind:'skyKick'},available),'kick');
if(priorStatus===undefined)delete globalThis.SkyClashPublishedActions;
else globalThis.SkyClashPublishedActions=priorStatus;
// Exercise the actual V100 owner decision, not merely the URL wiring.
const owner=require('../js/v100-pose-authority.js');
const oldLocation=globalThis.location;
const localLocation={search:'?animator=unified&studioPlaytest=local&flightLab=blend'};
globalThis.location=localLocation;
try{
 const hero={hp:100,jumping:true,vel:{x:0,y:4,z:0}};
 const local={state:'ready',slots:['jump']};
 const ctx={location:localLocation,SkyClash:{Game:{heroes:{kairo_venn:hero}}},
  SkyClashPublishedActions:{localPlaytest:local,
   motionClips:{jump:{},fallingIdle:{},landing:{},flying:{},floating:{}}},
  SkyClashPoseAuthority:{ready:true}};
 assert.equal(owner.localStudioAirSlot(hero,ctx),'jump');
 assert.equal(owner.ownsAir(hero,ctx),false,'Assigned jump must yield to Studio');
 local.slots=['flying'];
 assert.equal(owner.ownsAir(hero,ctx),true,'Unassigned jump keeps V100');
 hero.jumping=false;hero.flying=true;hero.vel.x=4;
 assert.equal(owner.localStudioAirSlot(hero,ctx),'flying');
 assert.equal(owner.ownsAir(hero,ctx),false,'Assigned travel flight must be visible');
 local.slots=['floating'];
 assert.equal(owner.ownsAir(hero,ctx),true,'Hover slot must not replace travel flight');
 hero.vel.x=0;
 assert.equal(owner.localStudioAirSlot(hero,ctx),'floating');
 assert.equal(owner.ownsAir(hero,ctx),false,'Assigned hover must be visible');
 localLocation.search='?animator=unified&flightLab=blend';
 assert.equal(owner.localStudioAirSlot(hero,ctx),null,'Normal game ignores local clips');
 assert.equal(owner.ownsAir(hero,ctx),true,'Public flight remains V100');
}finally{
 if(oldLocation===undefined)delete globalThis.location;
 else globalThis.location=oldLocation;
}
console.log('PASS local Kairo editor-to-playable bridge: valid exported bones, opt-in only, clear controls and fallback');
