/* V127: genuinely suspended mini-arena combat hover, not idle raised on Y. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('../js/vendor/three.min.js');
const V100=require('../js/v100-pose-authority.js');
const F=V100.v127SuspendedFlightPose;
assert.equal(typeof F,'function');
const old=V100.v126FlightPose;
const neutral=F(0,0,0,0),travel=F(1,0,0,0),
 rise=F(.5,7,0,.6),fall=F(.5,-7,0,.6);
const left=F(.6,0,-6.2,1),right=F(.6,0,6.2,1);
const pitch=p=>p.hipsX+p.spineX+p.chestX;
assert(neutral.profile==='V127 suspended combat hover');
assert(Math.abs(pitch(neutral))<.14&&Math.abs(pitch(travel))<.22,
 'upright levitating fighter must not turn into horizontal superhero flight');
assert(neutral.leftThighX<old(0).leftThighX-.3,
 'high knee needs genuinely lifted full thigh, not just shin flex');
assert(neutral.leftKneeX>old(0).leftKneeX+.5,
 'raised leg shin must fold considerably more than V126');
assert(neutral.rightThighX<old(0).rightThighX-.13,
 'second leg must also hang off-balance rather than standing');
assert(neutral.rightKneeX>old(0).rightKneeX+.18,
 'secondary knee must not remain standing straight');
assert(neutral.leftKneeX-neutral.rightKneeX>.45,
 'knees must have a conspicuously different suspended bend');
assert(neutral.leftUpperArmZ>.07&&neutral.rightUpperArmZ<-.07,
 'both elbows should float away from the idle guard, mirrored safely');
assert(neutral.hipsZ>.012&&neutral.chestZ<-.012,
 'pelvis/chest should counterpose into a subtly off-vertical body line');
assert(travel.leftThighX>-1&&travel.rightThighX>-.4,
 'full-speed normal flight may not throw both legs behind the body');
assert(rise.leftKneeX<fall.leftKneeX&&rise.rightKneeX<fall.rightKneeX,
 'rising legs extend slightly, descending gently recovers suspension');
assert(left.spineZ*right.spineZ<0,
 'strafe reversals must bank opposite ways, still opponent-facing');
assert(Math.abs(left.spineZ)<.07,
 'no airplane rolling during close combat');

// Evaluate actual 3D segment positions under independently parented
// mirrored synthetic humanoid legs, not only the numeric angle values.
// The VRM0 rig requires separate real-WebGL visual verification.
function skeleton(p){
 const scene=new THREE.Group(), hips=new THREE.Bone();
 scene.add(hips);hips.position.y=1.4;
 const result={};
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const u=new THREE.Bone(),k=new THREE.Bone(),a=new THREE.Bone(),
    toe=new THREE.Bone();
  u.position.set(sign*.12,-.13,0);hips.add(u);
  k.position.set(0,-.44,0);u.add(k);
  a.position.set(0,-.44,.045);k.add(a);
  toe.position.set(0,-.025,.19);a.add(toe);
  u.rotation.x=p[side+'ThighX'];
  k.rotation.x=p[side+'KneeX'];
  a.rotation.x=p[side+'AnkleX'];
  result[side]={u,k,a,toe};
 }
 scene.updateMatrixWorld(true);
 const point=n=>n.getWorldPosition(new THREE.Vector3());
 return Object.fromEntries(Object.entries(result).map(([side,b])=>[
  side,Object.fromEntries(Object.entries(b).map(([part,node])=>[part,point(node)]))
 ]));
}
const a=skeleton(neutral),b=skeleton(old(0));
const leftKneeRise=a.left.k.y-b.left.k.y;
const rightKneeRise=a.right.k.y-b.right.k.y;
assert(leftKneeRise>.045&&rightKneeRise>.008,
 'knee positions must visibly lift relative to the V126 standing-looking pose');
assert(a.left.k.z-a.left.u.z>.23,
 'left floating knee should move forward clearly in projected side silhouette');
assert(a.left.k.y-a.right.k.y>.04,
 'offset leg heights distinguish suspension from a standing foot stance');
assert(a.left.toe.y<a.left.a.y-.045&&a.right.toe.y<a.right.a.y-.045,
 'visible toes should hang below ankles instead of reading as floor-flat');
assert(a.left.a.y!==a.right.a.y,
 'feet must not make a fake matching grounded support line');
for(const fps of [30,60,120]){
 let mix=0,vy=0,lateral=0,prev=F(0,0,0,0),maxStep=0;
 const dt=1/fps;
 for(let i=0;i<fps*6;i++){
  const t=i*dt;
  const speed=t<.75?0:t<2?6.2:t<5?3:0;
  const targetY=t<2?0:t<3?7:t<4?-7:0;
  const targetSide=t<2?0:t<3?-6.2:t<4?6.2:0;
  mix=V100.flightStep(mix,V100.flightWeight(speed),dt);
  vy=V100.flightStep(vy,targetY,dt);
  lateral=V100.flightStep(lateral,targetSide,dt);
  const now=F(mix,vy,lateral,t);
  for(const name of [
   'hipsX','hipsZ','spineX','chestX','chestZ','neckX',
   'leftUpperArmX','rightUpperArmX','leftUpperArmZ','rightUpperArmZ',
   'leftThighX','rightThighX','leftKneeX','rightKneeX',
   'leftAnkleX','rightAnkleX']){
   const d=Math.abs(now[name]-prev[name]);
   assert(Number.isFinite(d)&&d<.09,name+' snapped at '+fps+' fps, '+d);
   maxStep=Math.max(maxStep,d);
  }
  prev=now;
 }
 assert(maxStep>.002,'flight silhouette must react smoothly to steering');
}
const owner=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(owner.includes("flightVersion==='v127'"));
assert(owner.includes('v127?v127SuspendedFlightPose('));
assert(owner.includes("if(['v126','v127'].includes("));
assert(owner.includes('const maxStep=5.0*Math.max(0,dt)'),
 'old per-frame flight angular limiter must survive');
assert(boot.includes("['v114','v126','v127']"));
assert(boot.includes("e.src+='&suspendedFlight=127'"));
assert(boot.includes("flags.set('flightStyle','airborne')"));
console.log('PASS V127: 3D suspended segment silhouettes, hanging toes, compact guard, 30/60/120fps and version-isolated powered flight');
