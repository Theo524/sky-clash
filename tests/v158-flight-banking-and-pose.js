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
 assert.equal(a,-b,'left and right joystick inputs mirror');
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
console.log('PASS V158: player-visible symmetric bank, 30/60/120 fps smooth reversals, untouched Q cruise and default');
