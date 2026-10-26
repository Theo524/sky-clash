/* V159 climbs and dives the real authored Kairo pose, never physics.
 * Compare pilot input, vertical velocity, 30/60/120fps and reversal.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const owner=require('../js/v100-pose-authority.js');
const {v159VerticalIntent:intent,v159VerticalStep:step}=owner;
assert.equal(typeof intent,'function');
assert.equal(typeof step,'function');
assert.equal(intent(0,0),0,'neutral original Q pose');
for(const v of [.2,.5,1]){
 assert(Math.abs(intent(v,0)+intent(-v,0))<1e-9,'mirrored climb and dive');
 assert(Math.abs(intent(0,v*7)+intent(0,-v*7))<1e-9,'mirrored vertical velocity');
 assert(intent(v,0)>0&&intent(-v,0)<0);
}
assert.equal(intent(10,999),1);assert.equal(intent(-10,-999),-1);
for(const fps of [30,60,120]){
 let x=0,last=0,dt=1/fps;
 for(let i=0;i<Math.round(.46*fps);i++){
  x=step(x,intent(1,7),dt);
  assert(x-last<.22,'climb step popped at '+fps+'fps');
  last=x;
 }
 assert(x>.88&&x<=1,'climb too small at '+fps+'fps '+x);
 for(let i=0;i<Math.round(.7*fps);i++){
  const next=step(x,intent(-1,-7),dt);
  assert(Math.abs(next-x)<.24,'dive reversal popped at '+fps);
  x=next;
 }
 assert(x<-.8,'dive reversal weak at '+fps+'fps '+x);
 for(let i=0;i<Math.round(1.3*fps);i++)x=step(x,0,dt);
 assert(Math.abs(x)<.02,'failed to return to level flight at '+fps);
}
assert.equal(step(.4,-.6,0),.4);
const source=fs.readFileSync('js/v100-pose-authority.js','utf8'),
 boot=fs.readFileSync('js/v66-game-boot.js','utf8'),
 index=fs.readFileSync('index.html','utf8');
assert(source.includes("get('flightVertical')==='v159'"),'strict preview-only');
assert(source.includes('rotatePitch(0,-pitchDeg)')&&
 source.includes('rotatePitch(5,pitchDeg*.22)'),'independent torso/head');
assert(source.includes("get('flightPreview')==='v156'"),'old Q owner');
assert(boot.includes("e.src+='&vertical=159'"),'new V100 cache');
assert(index.includes('verticalPreviewReady=159'),'public boot cache refreshed');
assert(boot.includes("flags.set('flightPreview','v156')"),'default V156 unchanged');
console.log('PASS V159: controlled rise and dive, 30/60/120fps smooth reversal, unchanged Q owner');
