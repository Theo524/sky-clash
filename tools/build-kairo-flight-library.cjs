#!/usr/bin/env node
/* Canonical Kairo real-VRM normal-flight clip adapter generator.
 * Write: node tools/build-kairo-flight-library.cjs --write
 * Verify: node tools/build-kairo-flight-library.cjs --check
 * Never adds an animation writer, changes physics, Boost, or V100.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),at=p=>path.join(root,p);
const source='assets/animations/kairo/flight-library.v1.json';
const library=JSON.parse(fs.readFileSync(at(source),'utf8'));
const boneNames=["hips","spine","chest","upperChest","neck","head","leftShoulder","leftUpperArm","leftLowerArm","leftHand","rightShoulder","rightUpperArm","rightLowerArm","rightHand","leftUpperLeg","leftLowerLeg","leftFoot","rightUpperLeg","rightLowerLeg","rightFoot"];
const modelSha='775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72';
function ensure(ok,msg){if(!ok)throw Error('Kairo flight pose library: '+msg);}
ensure(library.schema==='sky-clash.kairo-flight-library.v1','schema mismatch');
ensure(library.modelSha256===modelSha,'model mismatch');
ensure(crypto.createHash('sha256').update(fs.readFileSync(at('assets/characters/kairo.vrm'))).digest('hex')===modelSha,'actual VRM asset hash mismatch');
ensure(JSON.stringify(library.bones)===JSON.stringify(boneNames),'20-bone order changed');
ensure(library.acceptedForward==='v156','approved Q default changed');
ensure(JSON.stringify(Object.keys(library.poseVariants).sort())===JSON.stringify(['v156','v158']),'unreviewed new variant');
const targets=[['v156','js/v156-real-vrm-flight.js','SkyClashV156AuthoredFlight','q-trailing-athlete','accepted-forward-only'],
 ['v158','js/v158-real-vrm-flight.js','SkyClashV158AuthoredFlight','u-balanced-trail','experimental-limbs-not-player-approved']];
function render(name,globalName,pose){
 const data={format:'sky-clash.real-vrm-flight.v1',id:pose.id,modelSha256:library.modelSha256,
  bones:library.bones,hover:pose.hover,cruise:pose.cruise,
  blendSeconds:pose.blendSeconds,source:pose.source};
 if(Object.prototype.hasOwnProperty.call(pose,'visuallyApproved'))
  data.visuallyApproved=pose.visuallyApproved;
 return '/* GENERATED from '+source+' by tools/build-kairo-flight-library.cjs.\n'+
  ' * Same exact real Kairo normalized 20-joint data as the original clip.\n'+
  ' * Never edit by hand or introduce a new animation writer here.\n */\n'+
  '(function(root){\'use strict\';\n'+
  ' const data='+JSON.stringify(data,null,2)+';\n'+
  ' Object.freeze(data.bones);Object.freeze(data);\n'+
  ' root.'+globalName+'=data;\n'+
  '})(typeof window!==\'undefined\'?window:globalThis);\n';
}
const mode=process.argv.slice(2);
ensure(mode.length===1&&['--write','--check'].includes(mode[0]),'choose --check or --write');
for(const [id,file,globalName,clipId,status] of targets){
 const p=library.poseVariants[id];
 ensure(p&&p.id===clipId&&p.runtimeGlobal===globalName&&p.release===id&&p.status===status,'pose identity '+id);
 ensure(p.blendSeconds===.72&&typeof p.source==='string'&&!!p.source,'timing or provenance '+id);
 if(id==='v158')ensure(p.visuallyApproved===false,'do not approve experimental limbs implicitly');
 for(const field of ['hover','cruise']){
  ensure(Array.isArray(p[field])&&p[field].length===boneNames.length,'missing keyframe '+id+'.'+field);
  for(const [index,quat] of p[field].entries())
   ensure(Array.isArray(quat)&&quat.length===4&&quat.every(Number.isFinite)&&
    Math.abs(Math.hypot(...quat)-1)<.003,'bad normalized quat '+id+'.'+field+' '+boneNames[index]);
 }
 const output=render(id,globalName,p);
 if(mode[0]==='--write'){fs.writeFileSync(at(file),output);console.log('GENERATED '+file);}
 else ensure(fs.existsSync(at(file))&&fs.readFileSync(at(file),'utf8')===output,'outdated generated adapter '+file);
}
ensure(JSON.stringify(library.poseVariants.v156.hover)===
 JSON.stringify(library.poseVariants.v158.hover),'experiment changed accepted hover');
console.log('PASS real Kairo central authored clips, model hash, generated adapters '+mode[0]);
