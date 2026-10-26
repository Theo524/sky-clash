/* V163: VRM0 baked keyframes on one V100 owner. Not aesthetic sign-off. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const keys=require('../js/v163-real-kairo-vertical-keyframes.js');
const owner=require('../js/v100-pose-authority.js');
assert.equal(keys.kind,'real-vrm0-baked-pose-lab-keyframes');
assert.equal(keys.approval,'experimental-only');
assert.equal(keys.modelSha256,'775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72');
assert.deepEqual(keys.bones,owner.BONES);
assert.deepEqual(keys.times,[0,.16,.38,.68,1.2]);
assert.deepEqual(keys.weights,[0,.28,.78,1,1]);
for(const [time,weight] of [[0,0],[.16,.28],[.38,.78],[.68,1],[1.2,1]])
 assert(Math.abs(keys.keyWeight(time)-weight)<1e-9,'exact source Pose Lab keyframe');
assert.equal(keys.keyWeight(-1),0);assert.equal(keys.keyWeight(9),1);
for(const clip of [keys.ascend,keys.descend]){
 assert.equal(clip.length,20);
 for(const q of clip){
  assert.equal(q.length,4);
  assert(q.every(Number.isFinite));
  assert(Math.abs(Math.hypot(...q)-1)<.000004,
   'baked real-VRM local quaternion must be normalized');
 }
}
const dot=(x,y)=>Math.abs(x.reduce((sum,z,i)=>sum+z*y[i],0));
assert(dot(keys.ascend[7],keys.descend[7])<.9999,'arms clearly differ up vs down');
assert(dot(keys.ascend[14],keys.descend[14])<.9999,'thighs differ up vs down');
const source=fs.readFileSync('js/v100-pose-authority.js','utf8');
const boot=fs.readFileSync('js/v66-game-boot.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const capture=fs.readFileSync('tools/capture-flight-video.cjs','utf8');
const flow=fs.readFileSync('.github/workflows/kairo-quick-flight-stills.yml','utf8');
assert(source.includes("get('flightVertical')==='v163'"));
assert(source.includes('keyframes.modelSha256!==clip.modelSha256'));
assert(source.includes('qKeyframe.fromArray(clip.hover[i]).slerp('));
assert(source.includes('qRaw.slerp(qKeyframe,upBlend)'));
assert(source.includes('qRaw.slerp(qKeyframe,downBlend)'));
assert(source.includes('v163?originalTravel*(1-.995*Math.max(upBlend,downBlend))'),
 'V163 pure vertical must not inherit forward Q cruise lean');
assert(boot.includes("await script('js/v163-real-kairo-vertical-keyframes.js?v=1630')"));
assert(boot.includes("e.src+='&vertical=163'"));
assert(boot.includes("flags.set('flightPreview','v156')"));
assert(!boot.includes("flags.set('flightVertical','v163')"));
assert(index.includes('verticalRealKeyframeReady=163'));
assert(capture.includes("preview==='v163'?'v156&flightVertical=v163'"));
assert(capture.includes("if(process.env.VISUAL_V163_QA==='1')"));
for(const stage of ['pure-rise','pure-drop','forward-rise','forward-drop'])
 assert(capture.includes("name:'"+stage+"'"),'must test '+stage);
assert(flow.includes("VISUAL_V163_QA: '1'")&&flow.includes('v156,v163'));
console.log('PASS V163 exact Kairo VRM0 data, opt-in Q preservation, pure vertical WebGL scenarios');
