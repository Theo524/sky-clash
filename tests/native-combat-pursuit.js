/* Exercise the real movement controller. A validated native set alone may
 * calibrate new strikes; default combat, original jab and Rin stay exact. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(__dirname,'v49-moving-melee.js'),'utf8');
// Reuse the existing real Fighter/Combat fixture without rerunning its suite.
const fixture=source.slice(0,source.indexOf('const retreat=runCase('));
const previousWindow=global.window,previousFeel=global.AnimeFeelV165;
global.AnimeFeelV165={enabled:false};
const {Fighter,Game,Combat}=new Function('require','__dirname',fixture+';return {Fighter,Game,Combat};')(require,__dirname);
const THREE=require('../js/vendor/three.min.js');
function run({mode='off',stage=1,characterId='kairo_venn',fps=60,falling=false,visible=false}={}){
 global.window={location:{search:mode==='set'?'?combatAnim=storm-fist-v1':mode==='jab'?'?combatAnim=blender-jab-v1':''},
  SkyClashPublishedActions:mode==='set'||mode==='kungfu'?{nativeCombatSet:{reauthoredJab:mode==='kungfu'}}:
   mode==='jab'?{nativeCombatPreview:{}}:{}};
 const me=new Fighter('Kairo',{ki:0x44aaff,aura:0xffffff},new THREE.Vector3(0,falling?3:0,0),characterId);
 const foe=new Fighter('Rival',{ki:0xff6600,aura:0xffffff},new THREE.Vector3(0,0,2.5));
 me.animate=foe.animate=()=>{};me.facing=0;me.t=foe.t=12;me.combo=stage;me.lastMelee=12;
 Game.player=me;Game.enemy=foe;
 if(falling){
  foe.meteorWindow=1;me.comboFollow={target:foe,phase:3,until:20};
  if(visible){
   const rig=(f,bone,height)=>({vrm:{scene:{updateMatrixWorld(){}},humanoid:{getNormalizedBoneNode:n=>n===bone?{
    getWorldPosition:v=>v.set(f.pos.x,f.pos.y+height,f.pos.z)}:null}}});
   me.vrmRig=rig(me,'rightHand',1.4);foe.vrmRig=rig(foe,'upperChest',.4);
  }
 }
 Combat.melee(me,foe);
 const timing={total:me.attackTotal,contact:me.kickPend.t,kind:me.attackKind},trace=[];
 const dt=1/fps,until=falling?.12:timing.contact-dt*.1;
 for(let i=0;i<Math.floor(until/dt);i++){
  me.update(dt);trace.push({pos:me.pos.toArray(),vel:me.vel.toArray(),pending:me.kickPend?.t||0});
 }
 return {timing,trace,budget:me.attackTravelBudget,travel:me.pos.distanceTo(me.attackOrigin),
  resetEvents:()=>{me.nativeCombatReaction={at:2};me.nativeCombatParry={at:3};me.reset();
   return [me.nativeCombatReaction,me.nativeCombatParry];}};
}
try{
 for(const fps of [30,60,120]){
  const baseline=run({fps}),jabOnly=run({fps,mode:'jab'}),native=run({fps,mode:'set'});
  assert.deepEqual(jabOnly.trace,baseline.trace,'The published jab-only flag must retain baseline pursuit');
  assert.deepEqual(native.timing,baseline.timing,'No gameplay clock change');
  assert(native.trace.at(-1).pos[2]>baseline.trace.at(-1).pos[2]+.1,'New cross must physically approach nearer');
  assert(native.travel<native.budget,'Approach stays inside the existing travel budget');
  assert.deepEqual(run({fps,stage:0,mode:'set'}).trace,run({fps,stage:0}).trace,
   'Original jab trajectory must remain identical');
  assert(run({fps,stage:0,mode:'kungfu'}).trace.at(-1).pos[2]>
   run({fps,stage:0}).trace.at(-1).pos[2]+.1,'Reauthored kung fu jab approaches its actual striking reach');
  assert.deepEqual(run({fps,characterId:'rin_sable',mode:'set'}).trace,
   run({fps,characterId:'rin_sable'}).trace,'Rin pursuit must remain identical');
  const noMesh=run({fps,mode:'set',falling:true}),visible=run({fps,mode:'set',falling:true,visible:true});
  assert.deepEqual(noMesh.timing,visible.timing,'Vertical aim cannot alter contact timing');
  assert(visible.trace.at(-1).vel[1]<noMesh.trace.at(-1).vel[1],
   'Falling Fist must physically aim its visible wrist toward the target chest');
  assert(visible.trace.every(f=>Math.abs(f.vel[1])<=35),'Existing dive speed cap stays authoritative');
  assert.deepEqual(native.resetEvents(),[null,null],'Rematch clears old native reaction/parry timestamps');
 }
 console.log('PASS native pursuit: new-set approach only, original jab/default/Rin exact, bounded travel and visible dive alignment at 30/60/120Hz');
}finally{
 if(previousWindow===undefined)delete global.window;else global.window=previousWindow;
 if(previousFeel===undefined)delete global.AnimeFeelV165;else global.AnimeFeelV165=previousFeel;
}
