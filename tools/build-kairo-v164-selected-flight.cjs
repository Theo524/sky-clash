/* Rebuild the player-selected V164 Kairo asset from PERMANENT
 * repository-local Pose Lab keyframes, not expiring Action artifacts.
 * All 71 quaternion/time keys were verified against the deployed
 * V164 module before being archived; metadata labels were recreated.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=process.env.KAIRO_SELECTED_SOURCE||'assets/animations/kairo/selected/v164';
const output='js/v164-selected-kairo-real-flight.js';
const expectedSha='775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72';
const refs=[
 ['arms','arm','B-B-animation.pose.json',21,40418975917,12697736565],
 ['ascending','ascending','B-ascend-B.pose.json',25,40421353502,12698076236],
 ['descending','descending','B-descend-B.pose.json',25,40425774416,12699498850]
];
const clips={};
for(const [id,dir,file,count,run,artifact] of refs){
 const p=path.join(root,dir,file);
 if(!fs.existsSync(p))throw Error('Cannot build from real Kairo source: '+p);
 const raw=JSON.parse(fs.readFileSync(p,'utf8'));
 assert.equal(raw.schema,'sky-clash.pose-lab.v1');
 assert.equal(raw.fighter,'kairo_venn');
 assert.equal(raw.modelSha256,expectedSha);
 assert.equal(raw.bones.length,20);
 assert.equal(raw.keyframes.length,count);
 assert.equal(raw.duration,2);
 for(let i=0;i<raw.keyframes.length;i++){
  const frame=raw.keyframes[i];
  if(i)assert(frame.time>raw.keyframes[i-1].time,'monotonic times');
  assert.equal(frame.quaternions.length,20);
  for(const q of frame.quaternions){
   assert.equal(q.length,4);
   assert(q.every(Number.isFinite));
   assert(Math.abs(Math.hypot(...q)-1)<.003);
  }
 }
 clips[id]={run,artifact,sourceFile:file,frames:raw.keyframes.map(f=>({
  time:f.time,quaternions:f.quaternions}))};
 if(clips.arms&&id!=='arms')for(let bone=0;bone<20;bone++){
  const a=clips.arms.frames[0].quaternions[bone];
  const b=clips[id].frames[0].quaternions[bone];
  assert(Math.abs(a.reduce((n,v,i)=>n+v*b[i],0))>.999995,
    'B+B+B+B must start at the same REAL Kairo stance bone '+bone);
 }
}
const a=JSON.parse(fs.readFileSync(path.join(root,'arm','B-B-animation.pose.json'),'utf8'));
const asset={
 schema:'sky-clash.selected-kairo-real-poses.v164',
 modelSha256:expectedSha,
 approval:'player selected B arm stance, B natural sway, B balanced ascent, B natural settling descent',
 defaultPromoted:false,
 bones:a.bones,
 duration:2,
 clips
};
const source=`/* Generated from three EXACT original real Kairo Pose Lab clip JSON files.
 * PLAYER CHOSE B stance + B arm movement + B rise + B fall.
 * Repository-local real-Kairo source projects are under assets/animations/kairo/selected/v164.
 * Original archived authoring runs: 40418975917, 40421353502, 40425774416.
 * Do not hand-edit these model-bound complete normalized quaternion keys.
 * Select via ?flightVertical=v164 only; no default change.
 */
(function(root){'use strict';
 const data=${JSON.stringify(asset)};
 if(typeof module!=='undefined'&&module.exports)module.exports=data;
 root.SkyClashV164SelectedFlight=data;
})(typeof window!=='undefined'?window:globalThis);
`;
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,source);
console.log('PASS V164 generated '+source.length+' bytes; 71 exact full 20-bone real-VRM keyframes; saved '+output);
