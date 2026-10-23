/* One-movement-at-a-time preview: WASD controls normal walk, Boost stays fast. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const select=require('../js/v72-published-actions.js');
const here=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(here,p),'utf8');
function fighter(changes={}){
 return {hp:100,t:1,vel:{x:0,y:0,z:4.8},
  moveIntent:{x:0,z:1},sprinting:false,skidT:0,...changes};
}
const actions={run:{},idle:{},boost:{}};
const prior=globalThis.location;
try{
 globalThis.location={search:'?movementLab=walk'};
 const f=fighter();
 assert.equal(select.choose(f,actions),null,'Full WASD must select recorded V71 WALK, never Standard Run');
 assert.equal(f.v80AnalogRun,false);
 assert.equal(select.choose(fighter({sprinting:true,vel:{x:0,y:0,z:24}}),actions),'boost',
   'Hold Boost still selects the original Boost animation');
 assert.equal(select.choose(fighter({moveIntent:{x:0,z:0},vel:{x:0,y:0,z:0}}),actions),'idle',
   'Stationary returns to approved idle');
 globalThis.location={search:''};
 assert.equal(select.choose(fighter({vel:{x:0,y:0,z:9}}),actions),'run',
   'Normal game keeps approved Standard Run behavior for rollback');
}finally{if(prior===undefined)delete globalThis.location;else globalThis.location=prior;}
const core=read('src/45-fighter-controller.js');
assert(core.includes("const normalSpeed=walkLab?4.8:TUNING.walkSpeed"),
  'Preview-only walk speed; unboosted normal game unchanged');
assert(core.includes("this===Game.player&&this.characterId==='kairo_venn'"),
  'No global change to enemy or Rin movement');
const boot=read('js/v66-game-boot.js');
assert(boot.includes("window.SkyClashMovementLab={version:88,enabled:true,targetWalkSpeed:4.8}"));
assert(!boot.includes('TUNING.walkSpeed=4.8'), 'Do not slow Boost by globally changing TUNING');
const walk=read('js/v71-mixamo-gameplay.js');
assert(walk.includes('if(walkLab)this.v80AnalogRun=false'), 'Walk legs need full control before run selection');
console.log('PASS V88: full WASD selects recorded walk only in preview; Boost/idle/live run unaffected');
