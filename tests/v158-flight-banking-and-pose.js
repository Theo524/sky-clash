/* V158 bank and Q silhouette safety, real WebGL visual evidence separate.
 * New preview is never an independent Fighter.animate writer.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const V100=require('../js/v100-pose-authority.js');
const {v158BankIntent:intent,v158BankStep:step}=V100;
assert.equal(typeof intent,'function');
assert.equal(typeof step,'function');
for(const v of [0,.25,.75,1]){
 assert.equal(intent(0,0,0),0,'neutral cruise stays identical to Q');
 const a=intent(v,0,0),b=intent(-v,0,0);
 assert(Math.abs(a+b)<1e-12,'left and right joystick inputs mirror');
 assert(a>=0&&a<=1,'input sign/bounds');
}
for(const f of [30,60,120]){
 let x=0,dt=1/f;
 for(let i=0;i<Math.round(.38*f);i++)x=step(x,intent(1,4.8,1),dt);
 assert(x>.78,'player must SEE a strong right turn at '+f+'fps: '+x);
 let previous=x;
 for(let i=0;i<Math.round(.5*f);i++){
  x=step(x,intent(-1,-4.8,-1),dt);
  assert(Math.abs(x-previous)<.26,'no snap during hard reversal '+f);
  previous=x;
 }
 assert(x<-.50,'clear left reversal '+f+'fps: '+x);
 for(let i=0;i<Math.round(1.2*f);i++)x=step(x,0,dt);
 assert(Math.abs(x)<.02,'full return to neutral at '+f+'fps');
}
assert(intent(0,0,0)===0);
assert(intent(100,100,100)<=1&&intent(-100,-100,-100)>=-1);
assert(step(.5,.9,0)===.5);
const source=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 boot=fs.readFileSync('js/v66-game-boot.js','utf8');
assert(source.includes('bankMode===\'v158\''),'V158 must be explicitly requested');
assert(source.includes("bankMode==='v158'?23:13"),'larger banking needs clear player-visible amplitude');
assert(source.includes("get('flightPreview')==='v156'"),'bank layers accepted exact V156 pose only');
assert(boot.includes("e.src+='&bank=158'"),'cache bust for new V158 preview');
assert(boot.includes("flags.set('flightPreview','v156')"),'original game default unchanged');
assert(boot.includes("await script('js/v158-real-vrm-flight.js?v=1580')"),
 'the exact V158 pose clip must load only on requested preview');
require('../js/v156-real-vrm-flight.js');
require('../js/v158-real-vrm-flight.js');
const original=globalThis.SkyClashV156AuthoredFlight;
const improved=globalThis.SkyClashV158AuthoredFlight;
assert(original&&improved&&original.modelSha256===improved.modelSha256,
 'baked exact VRM0 model identity');
assert.equal(improved.id,'u-balanced-trail');
assert.deepEqual(improved.bones,original.bones);
assert.deepEqual(improved.hover,original.hover,'original V152 hover remains EXACT');
assert.equal(improved.cruise.length,20);
for(let i=0;i<20;i++){
 const q=improved.cruise[i];
 assert(q.length===4&&Math.abs(q.reduce((n,v)=>n+v*v,0)-1)<.003,
  'real normalized Kairo quaternion '+improved.bones[i]);
 if(i<=6||i===9||i===10||i===13||i===16||i===19)
  assert.deepEqual(q,original.cruise[i],
   'preserve accepted Q torso/head/shoulder/wrist/shoes '+improved.bones[i]);
}
assert.notDeepEqual(improved.cruise[7],original.cruise[7],'left upper arm must improve');
assert.notDeepEqual(improved.cruise[8],original.cruise[8],'left forearm must improve');
assert.notDeepEqual(improved.cruise[14],original.cruise[14],'left thigh separation must change');
assert(!boot.includes("flags.set('flightPreview','v158')"),
 'new limbs are not allowed as an unreviewed default');
console.log('PASS V158: player-visible symmetric bank, 30/60/120 fps smooth reversals, untouched Q cruise and default');
