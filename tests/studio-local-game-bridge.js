/* Local Studio game bridge: pure policy plus editor wiring guard. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const bridge=require('../js/studio-live-bridge.js');
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
assert(!bridge.supportedSlots.includes('idle4'));
const html=read('animation-studio.html'),studio=read('js/animation-studio.js');
const boot=read('js/v66-game-boot.js'),runtime=read('js/v72-published-actions.js');
const index=read('index.html');
assert(html.includes('id="applyGameMoves"')&&html.includes('id="clearAppliedGameMoves"'));
assert(html.includes('js/studio-live-bridge.js?v=1'));
assert(studio.includes("window.location.assign('index.html?studioPlaytest=local&scene=dojo')"));
assert(studio.includes('LiveBridge.save(result.pack)'));
assert(studio.includes('GameExporter.bake(THREE,fbx,'));
assert(studio.includes('if(actionFighter!==\'kairo\')'));
assert(boot.includes("get('studioPlaytest')==='local'"));
assert(boot.includes('js/studio-live-bridge.js?v=1'));
assert(runtime.includes('await bridge.load()'));
assert(runtime.includes('Object.assign(actions,localActions)'));
assert(runtime.includes("status.localPlaytest.state='fallback'"));
assert(runtime.includes('studioLocalMovesStatus'));
assert(index.includes('&studioLocal=1'));
assert(html.includes('animation-studio.js?v=830&fix=86&studioLocal=1'));
assert(!read('assets/animations/gameplay/studio-actions-v1.json').includes('local-apply-to-game-test'));
console.log('PASS local Kairo editor-to-playable bridge: valid exported bones, opt-in only, clear controls and fallback');
