/* V91 catches exact-frame abrupt changes from the multiple animation owners.
 * Validates the visual output, not merely whether a state name was selected.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const lib=require('../js/v91-stance-continuity.js');
const q=(r=0,axis=new THREE.Vector3(0,0,1))=>
 new THREE.Quaternion().setFromAxisAngle(axis,r);
const source=q(),target=q(Math.PI*.75);
const capped=lib.solveBone(THREE,source,source,target,1,.09);
assert.equal(capped.limited,true);
assert(Math.abs(source.angleTo(capped.quaternion)-.09)<1e-5,
 'angular limiter must advance rather than freeze on quaternion alias');
const free=lib.solveBone(THREE,source,source,target,.1,10);
assert(!free.limited);
assert(Math.abs(source.angleTo(free.quaternion)-Math.PI*.075)<1e-5);

const bones=Object.fromEntries(lib.BONES.map(n=>[n,new THREE.Bone()]));
const rig={vrm:{
 humanoid:{getNormalizedBoneNode:name=>bones[name]},
 update(){ /* no WebGL required to exercise skeletal continuity */ }
}};
const f={vrmRig:rig,v89Step:{mode:'idle'},animate(dt){
 // Simulate the old published idle and walking controllers: intentional
 // large discontinuities on the SAME frame as transitions.
 const angle=this.v89Step.mode==='walk'?2.8:
    this.v89Step.mode==='first-step'?1.45:
    this.v89Step.mode==='settle'?2.2:
    this.v89Step.mode==='idle'?0:0.38;
 for(const bone of Object.values(bones))
  bone.quaternion.copy(q(angle));
}};
const state=lib.attach(THREE,f);
assert(state);
function tick(stage){
 f.v89Step.mode=stage;
 const before=lib.BONES.map(n=>bones[n].quaternion.clone());
 f.animate(1/60);
 const distance=lib.BONES.map((n,i)=>before[i].angleTo(bones[n].quaternion));
 return Math.max(...distance);
}
assert(tick('idle')<1e-6);
for(const stage of ['anticipate','first-step','walk','settle','idle']){
 const motion=tick(stage);
 assert(motion<=9/60+1e-5,'teleport in '+stage+': '+motion);
 for(let i=0;i<25;i++){
  const d=tick(stage);
  assert(d<=9/60+1e-5,'late snap in '+stage+': '+d);
 }
}
assert(state.transitions===5,'must track actual stage transitions');
assert(state.frames>100,'real frame samples checked');
assert(state.clamped>=0);
// Don't alter approved source clips or previous V89 behavior.
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const originals=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
assert.equal(originals.motions.find(m=>m.slot==='idle').sourceFile,'Movement/Adventure/idle (2).fbx');
assert.equal(originals.motions.find(m=>m.slot==='run').sourceFile,'Movement/Male/standard run.fbx');
const boot=read('js/v66-game-boot.js');
assert(boot.includes("['match','continuous'].includes"));
assert(boot.includes("await script('js/v91-stance-continuity.js?v=910')"));
assert(boot.includes('if(stepLab)window.SkyClashWalkStep.start(window)'));
assert(boot.indexOf('window.SkyClashWalkStep.start(window)')<
 boot.indexOf('window.SkyClashV91Stance.start(window)'),'continuity has final pose ownership');
const step=read('js/v89-grounded-step.js');
assert(step.includes("get('stance')==='legacy90'"),
 'V90 blend is only enabled in explicit legacy mode, not on the previous broken URL');
assert(boot.includes("get('stance')==='legacy90'"),'keep old V90 solely as an explicit rollback');
console.log('PASS V91: no frame above skeletal angular limit when older animation layers teleport; untouched idle/run; V89 regression available');
