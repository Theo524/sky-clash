'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'src/92-character-workshop.js'),'utf8');
const context={console,Math,JSON};vm.createContext(context);
vm.runInContext(code+'\nthis.W=CharacterWorkshop;',context);
const W=context.W, t=W._test;
assert.strictEqual(t.DEFINITIONS.length,17);
assert.strictEqual(t.DEFAULT().stride,100);
assert.strictEqual(t.DEFAULT().cadence,100);
assert.strictEqual(t.DEFAULT().kneelift,100);
assert.strictEqual(t.parsePose({rKnee:999,rHip:-999,stride:0,unknown:8}).rKnee,65);
assert.strictEqual(t.parsePose({rKnee:999,rHip:-999,stride:0,unknown:8}).rHip,-55);
assert.strictEqual(t.parsePose({rKnee:999,rHip:-999,stride:0,unknown:8}).stride,60);
function fighter(id){return {characterId:id,runW:0,sprinting:false,punchT:0,blastT:0,charging:false,stun:0,launched:false,downT:0,flying:false,awakenChargeT:0,model:{body:{position:{y:1}}},vrmRig:null};}
function pose(){return {arm:[[0,0,0],[0,0,0]],leg:[[0,0.25,0],[0,0.25,0]],spineY:0,spineX:0,headX:0};}
const k=fighter('kairo_venn'),r=fighter('rin_sable');
t.poses.rin_sable.idle.lKnee=20;t.poses.rin_sable.idle.chestYaw=-8;
let pr=W.applyPose(r,pose());const pk=W.applyPose(k,pose());
assert(Math.abs(pr.leg[1][1]-(0.25+20*Math.PI/180))<0.0001);
assert.strictEqual(pk.leg[1][1],0.25);
assert.strictEqual(pk.spineY,0);
assert(W.allowRecorded(k));assert(!W.allowRecorded(r));
r.punchT=0.3;
assert.strictEqual(W.applyPose(r,pose()).leg[1][1],0.25,'combat stays authoritative by default');
t.takes.rin_sable=[{t:0,pose:t.parsePose({lElbow:0})},{t:2,pose:t.parsePose({lElbow:40})}];
assert.strictEqual(t.interpolate(t.takes.rin_sable,1).lElbow,20);
t.options.rin_sable.assigned='ninjaPalm';r.attackKind='ninjaPalm';r.attackElapsed=0.5;r.attackTotal=1;
assert(Math.abs(W.applyPose(r,pose()).arm[1][2]-20*Math.PI/180)<0.0001,'assigned custom move takes control');
t.options.rin_sable.assigned='none';
assert.equal(W.previewVelocity(r,0.016),null,'workshop preview does not affect gameplay');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const id of ['wsOpenTitle','wsOpenDojo','workshop','wsFighter','wsMode','wsSliders','wsSave','wsExport','wsImport','wsPlayFrames','wsAssign','wsRecorded','wsClose','wsView'])
 assert(index.includes('id="'+id+'"'),`Missing UI control: ${id}`);
assert(index.includes('js/game.js?v=560'));assert(index.includes('css/game.css?v=560'));
const chunks=fs.readdirSync(path.join(root,'src')).filter(x=>x.endsWith('.js')).sort().map(x=>fs.readFileSync(path.join(root,'src',x),'utf8')).join('');
assert.strictEqual(fs.readFileSync(path.join(root,'js/game.js'),'utf8'),chunks);
console.log('PASS V56 workshop: independent profiles, clamping, pose application, binding, timeline, deployment');
