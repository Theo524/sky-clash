/* V157 banking tests: real V100 owner API, 30/60/120fps steering,
 * symmetry, neutral forward Q, yaw/strafe transitions and hard clamps.
 * Does NOT authorize visual acceptance; browser WebGL test is separate.
 */
'use strict';
const assert=require('node:assert/strict');
const V100=require('../js/v100-pose-authority.js');
const {v157BankIntent:intent,v157BankStep:step}=V100;
assert.equal(typeof intent,'function');
assert.equal(typeof step,'function');
const eps=1e-9;
for(const speed of [0,2,6]){
 assert.equal(intent(0,0,speed),0,'straight travel must not bank');
 for(const side of [1,2,4,7,100]){
  assert(Math.abs(intent(side,0,speed)+intent(-side,0,speed))<eps,
   'mirror left/right intent');
  assert(intent(side,0,speed)>0,'right input must lean right');
 }
}
assert.equal(intent(0,2,0),0,'do not bank in-place camera turning');
assert(intent(0,1.6,5)>0,'forward right-turn must bank right');
assert(intent(0,-1.6,5)<0,'forward left-turn must bank left');
assert(intent(0,0,8)===0,'cruise is exact V156 authored baseline');
assert(intent(1e9,1e9,12)<=1&&intent(-1e9,-1e9,12)>=-1,
 'strafing plus turning must never over-bank');
for(const fps of [30,60,120]){
 let x=0;
 const advance=(seconds,target)=>{
  for(let i=0;i<Math.round(fps*seconds);i++){
   const before=x;x=step(x,target,1/fps);
   assert(Number.isFinite(x)&&Math.abs(x)<=1+eps,'bank must be finite and bounded');
   assert(Math.abs(x-before)<=.2,'no single-frame roll pop at '+fps);
  }
  return x;
 };
 assert.equal(advance(.4,0),0,'zero input produces zero rotation');
 const right=advance(.55,intent(5,0,5));
 assert(right>.6&&right<1,'must settle into noticeable athletic right bank '+fps);
 const left=advance(.9,intent(-5,0,5));
 assert(left<-.6&&left>-1,'reverse bank must cross center without snap '+fps);
 const recenter=advance(1.3,0);
 assert(Math.abs(recenter)<.012,'bank must release cleanly at '+fps);
}
assert.equal(step(.5,.8,0),.5,'zero dt never teleports pose');
assert.equal(step(.5,0,1/60)<.5,true,'release always moves toward neutral');
const owner=require('node:fs').readFileSync('js/v100-pose-authority.js','utf8');
const boot=require('node:fs').readFileSync('js/v66-game-boot.js','utf8');
const index=require('node:fs').readFileSync('index.html','utf8');
assert(owner.includes("get('flightBank');")&&
 owner.includes("bankMode==='v157'||bankMode==='v158'"),
 'only explicitly requested V157 or V158 should bank');
assert(owner.includes("get('flightPreview')==='v156'"),
 'bank must operate only on accepted V156 flight');
assert(owner.includes('roll(0,-bankDeg)')&&owner.includes('roll(5,bankDeg*.25)'),
 'natural body bank must preserve head counterbalance');
assert(boot.includes("e.src+='&bank=157'"),'new preview must bust cached V100');
assert(boot.includes("flags.set('flightPreview','v156')"),
 'default game must stay accepted V156 until user approval');
assert(index.includes('bankPreviewReady=157'),
 'public game boot cache must be refreshed for V157 opt-in');
assert(!owner.includes('root.position.z+='),
 'banking must never touch flight physics/root');
console.log('PASS V157: symmetric bounded left/right banking, 30/60/120fps reversals, neutral Q cruise, yaw steering and owner-safe opt-in');
