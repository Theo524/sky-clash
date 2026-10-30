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
assert(html.includes('js/studio-live-bridge.js?v=2'));
assert(studio.includes("window.location.assign('index.html?studioPlaytest=local&scene=dojo')"));
assert(studio.includes('LiveBridge.save(result.pack)'));
assert(studio.includes('GameExporter.bake(THREE,fbx,'));
assert(studio.includes('if(actionFighter!==\'kairo\')'));
assert(boot.includes("get('studioPlaytest')==='local'"));
assert(boot.includes('js/studio-live-bridge.js?v=2'));
assert(runtimeSource.includes('await bridge.load()'));
assert(runtimeSource.includes('Object.assign(actions,localActions)'));
assert(runtimeSource.includes("status.localPlaytest.state='fallback'"));
assert(runtimeSource.includes('studioLocalMovesStatus'));
assert(index.includes('&studioLocal=5'));
assert(boot.includes('js/v100-pose-authority.js?v=1561'));
assert(boot.includes("?'&studioLocal=3':''"));
assert(boot.includes('js/v72-published-actions.js?v=823'));
assert(!runtimeSource.includes("get('punchBody')"));
assert(runtimeSource.includes('const fullBodyPunch=groundedPunch'));
assert(runtimeSource.includes("['punch1','punch2','punch3','overhand','uppercut']"));
assert(runtimeSource.includes('!fullBodyPunch&&(i===0||i>=14)'));
assert(runtimeSource.includes('const contact=localPunch&&entry.sampleSupport?entry:localPlant'));
assert(runtimeSource.includes("supportFoot('left',state.clock,contact,state.localStrikeFeet)"));
assert(runtimeSource.includes("supportFoot('right',state.clock,contact,state.localStrikeFeet)"));
// A 2.5s Mixamo clip with 1× authoring speed must progress only .55
// source seconds during a .55s combat beat, not 2.5 seconds.
const localPunch={seconds:2.5,attackImpact:1.25,speed:1};
const sourceBegin=runtime.localPunchClock(localPunch,0,.55);
const sourceEnd=runtime.localPunchClock(localPunch,.55,.55);
assert(Math.abs(sourceEnd-sourceBegin-.55)<1e-9,'Mixamo punch accelerated');
assert(Math.abs(runtime.localPunchClock({...localPunch,speed:.5},.55,.55)-
 runtime.localPunchClock({...localPunch,speed:.5},0,.55)-.275)<1e-9);
assert.equal(runtime.choose({...({hp:100,vel:{x:0,z:0},punchT:.3,punchSide:0,attackKind:'punch'})},
 {punch1:{},punch2:{}}),'punch2','Cross should use the assigned punch2 consistently');
assert(studio.includes('if(result.missing.length||result.unsupported.length)'));
assert(runtimeSource.includes('Inspect loaded Mixamo clips'));
assert(read('js/v72-studio-game-export.js').includes('footContacts'));
assert(runtimeSource.includes('status.localPlaytest.slots.includes(entry.slot)'));
assert(html.includes('animation-studio.js?v=832&fix=87&studioLocal=2'));
assert(!read('assets/animations/gameplay/studio-actions-v1.json').includes('local-apply-to-game-test'));
// The named editor moves must be used by actual special-attack kinds
// when and ONLY when that slot was explicitly applied in the local pack.
const priorStatus=globalThis.SkyClashPublishedActions;
const fighter={hp:100,vel:{x:0,z:0},punchT:.3,punchSide:1,attackSerial:3};
const available={punch3:{},kick:{},uppercut:{},meteor:{}};
globalThis.SkyClashPublishedActions={localPlaytest:{state:'ready',slots:['uppercut','meteor']}};
assert.equal(runtime.choose({...fighter,attackKind:'skyUppercut'},available),'uppercut');
assert.equal(runtime.choose({...fighter,attackKind:'skyKick'},available),'meteor');
globalThis.SkyClashPublishedActions={localPlaytest:{state:'off',slots:[]}};
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
