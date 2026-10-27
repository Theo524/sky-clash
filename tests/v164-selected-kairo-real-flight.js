/* V164: exact authenticated source pose projects, no artistic extrapolation. */
'use strict';
const a=require('node:assert/strict'),fs=require('node:fs');
const path='js/v164-selected-kairo-real-flight.js';
a(fs.existsSync(path),'Build selected VRM0 data from Actions artifacts first');
const data=require('../'+path),k=data.clips;
a.equal(data.schema,'sky-clash.selected-kairo-real-poses.v164');
a.equal(data.modelSha256,'775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72');
a.equal(data.defaultPromoted,false);
a.equal(data.bones.length,20);a.equal(data.duration,2);
a.equal(k.arms.frames.length,21);
a.equal(k.ascending.frames.length,25);
a.equal(k.descending.frames.length,25);
a.equal(k.arms.run,40418975917);
a.equal(k.ascending.run,40421353502);
a.equal(k.descending.run,40425774416);
for(const group of [k.arms,k.ascending,k.descending]){
 a(group.frames.every(f=>Number.isFinite(f.time)&&f.quaternions.length===20));
 for(const f of group.frames)for(const q of f.quaternions){
  a.equal(q.length,4);a(q.every(Number.isFinite));
  a(Math.abs(Math.hypot(...q)-1)<.003);
 }
}
for(const side of [k.ascending,k.descending])for(let i=0;i<20;i++){
 const p=k.arms.frames[0].quaternions[i],q=side.frames[0].quaternions[i];
 a(Math.abs(p.reduce((s,v,j)=>s+v*q[j],0))>.999995,
  'selected B pose differs on joint '+i);
}
const pose=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
a(pose.includes("get('flightVertical')==='v164'"),'opt-in pose owner');
a(pose.includes('SkyClashV164SelectedFlight'),'full real VRM track owner');
a(boot.includes('js/v164-selected-kairo-real-flight.js?v=1640'));
a(boot.includes("flags.set('flightPreview','v156')"),'approved default Q');
a(!boot.includes("flags.set('flightVertical','v164')"),'no automatic activation');
console.log('PASS selected B/B/B/B real-Kairo 71 exact keyframes; sole V100 opt-in owner');
