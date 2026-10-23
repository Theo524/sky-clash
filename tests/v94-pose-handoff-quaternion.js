/* V94 regression: measure the ACTUAL normalized VRM forearm quaternion
 * on each idle->walk->idle frame, not merely the controller state name.
 * Three.js slerpQuaternions target/receiver alias previously held the
 * old pose then teleported the last 171 degrees into the next clip.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('../js/vendor/three.min.js');
const V81=require('../js/v81-pose-transitions.js');
const names=['hips','spine','chest','upperChest','neck','head',
 'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
 'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
 'leftUpperLeg','leftLowerLeg','leftFoot',
 'rightUpperLeg','rightLowerLeg','rightFoot'];
const ref=new THREE.Quaternion();
const target=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),2.98);
function simulate(url){
 const oldLocation=globalThis.location;
 globalThis.location={search:url};
 try{
  const scene=new THREE.Group(),nodes={};
  for(const name of names){const n=new THREE.Bone();n.name=name;scene.add(n);nodes[name]=n;}
  const rig={vrm:{scene,humanoid:{getNormalizedBoneNode:name=>nodes[name]||null},
    update(){} }};
  const f={hp:100,vrmRig:rig,vel:{x:0,y:0,z:0},moveIntent:{x:0,z:0},
   v80AnalogRun:false,
   animate(){
    const pose=this.vel.z>1?target:ref;
    // Simulate conflicting old idle/arm locomotion sources with the
    // real 171-degree elbow discrepancy found in the recordings.
    for(const n of names)nodes[n].quaternion.copy(pose);
   }};
  const status={version:81,active:'waiting'};
  assert(V81.attach(THREE,f,status));
  const angle=()=>ref.angleTo(nodes.rightLowerArm.quaternion);
  f.animate(1/60);assert(angle()<1e-5);
  f.vel.z=4.8;
  const start=[];
  for(let i=0;i<18;i++){f.animate(1/60);start.push(angle());}
  assert(start.every(x=>Number.isFinite(x)));
  const endWalk=start.at(-1);
  f.vel.z=0;
  const stop=[];
  for(let i=0;i<18;i++){f.animate(1/60);stop.push(angle());}
  return {start,stop,endWalk,endIdle:stop.at(-1),status};
 }finally{
  if(oldLocation===undefined)delete globalThis.location;
  else globalThis.location=oldLocation;
 }
}
const fixed=simulate('?movementLab=step&stance=handoff&head=original');
const old=simulate('?movementLab=step&head=original');
assert(old.start[0]<.001,'reproduce previous frozen first walking frame');
assert(fixed.start[0]>.025&&fixed.start[0]<.4,
 'first intermediate forearm must be between standing and walking, never frozen');
assert(fixed.start[2]>fixed.start[0],
 'forearm should move progressively toward the walking clip');
assert(Math.abs(fixed.endWalk-2.98)<.01,
 'after the handoff ends the recorded walking target must be fully reached');
assert(fixed.stop[0]<2.94&&fixed.stop[0]>2.5,
 'walking-to-idle must ALSO interpolate on its first frame');
assert(fixed.endIdle<.01,'stop reaches original approved idle pose');
const maxDelta=(values)=>Math.max(...values.slice(1).map((v,i)=>Math.abs(v-values[i])));
assert(maxDelta(fixed.start)<.6,
 'no single frame can jump across the entire 171-degree source mismatch');
assert(maxDelta(fixed.stop)<.6,
 'stop must not teleport forearm back to standing pose');
// Confirm no asset changes: keep approved idle, Standard Run, V89 first step.
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const motions=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json')).motions;
assert.equal(motions.find(m=>m.slot==='idle').sourceFile,'Movement/Adventure/idle (2).fbx');
assert.equal(motions.find(m=>m.slot==='run').sourceFile,'Movement/Male/standard run.fbx');
assert(read('js/v66-game-boot.js').includes("get('stance')==='handoff'"));
assert(read('js/v66-game-boot.js').includes("e.src+='&fix=94'"));
assert(read('js/v66-game-boot.js').includes("if(stepLab)window.SkyClashWalkStep.start(window)"));
console.log('PASS V94: real VRM forearm starts, advances and completes smoothly in both directions; old frozen case reproduced; approved motions untouched.');
