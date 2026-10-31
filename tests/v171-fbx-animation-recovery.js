'use strict';
// Synthetic FBX 7500 fixture only: no Rokoko/Mixamo vendor assets in GitHub.
// Covers compressed keys, Maya absolute-time takes and empty base models.
const assert=require('node:assert/strict'),fs=require('node:fs'),
 zlib=require('node:zlib');
const recovery=require('../js/v171-fbx-animation-recovery.js');
const TICK=46186158000n;
function property(value){
 if(typeof value==='string'){
  const b=Buffer.from(value),h=Buffer.alloc(5);
  h.write('S');h.writeUInt32LE(b.length,1);return Buffer.concat([h,b]);
 }
 if(typeof value==='number'||typeof value==='bigint'){
  const b=Buffer.alloc(9);b.write('L');b.writeBigInt64LE(BigInt(value),1);return b;
 }
 const isTime=value.type==='times';
 const bytes=Buffer.alloc(value.values.length*(isTime?8:4));
 value.values.forEach((x,i)=>isTime?bytes.writeBigInt64LE(BigInt(x),i*8):bytes.writeFloatLE(x,i*4));
 const compressed=zlib.deflateSync(bytes),header=Buffer.alloc(13);
 header.write(isTime?'l':'f');header.writeUInt32LE(value.values.length,1);
 header.writeUInt32LE(1,5);header.writeUInt32LE(compressed.length,9);
 return Buffer.concat([header,compressed]);
}
function binaryNode(name,props,children=[],start=0){
 const tag=Buffer.from(name),values=Buffer.concat(props.map(property));
 let cursor=start+25+tag.length+values.length;const members=[];
 for(const c of children){
  const b=binaryNode(c[0],c[1],c[2]||[],cursor);
  members.push(b);cursor+=b.length;
 }
 const trailer=children.length?Buffer.alloc(25):Buffer.alloc(0);
 const header=Buffer.alloc(25);
 header.writeBigUInt64LE(BigInt(cursor+trailer.length));
 header.writeBigUInt64LE(BigInt(props.length),8);
 header.writeBigUInt64LE(BigInt(values.length),16);
 header.writeUInt8(tag.length,24);
 return Buffer.concat([header,tag,values,...members,trailer]);
}
function fixture(animated=true){
 const MODEL=1000,STACK=2000,LAYER=3000,NODE=4000;
 const objects=[['Model',[MODEL,'mixamorig:Hips\0\x01Model','LimbNode']],
  ['AnimationStack',[STACK,'clip\0\x01AnimStack','']],
  ['AnimationLayer',[LAYER,'Layer\0\x01AnimLayer','']]];
 const links=[['C',['OO',LAYER,STACK]]];
 if(animated){
  objects.push(['AnimationCurveNode',[NODE,'R\0\x01AnimCurveNode','']]);
  links.push(['C',['OO',NODE,LAYER]],['C',['OP',NODE,MODEL,'Lcl Rotation']]);
  for(let i=0;i<3;i++){
   const id=5000+i,axis='XYZ'[i];
   objects.push(['AnimationCurve',[id,'\0\x01AnimCurve',''],[
    ['KeyTime',[{type:'times',values:[8n*TICK,9n*TICK]}]],
    ['KeyValueFloat',[{type:'values',values:i===0?[0,90]:[0,0]}]]
   ]]);
   links.push(['C',['OP',id,NODE,'d|'+axis]]);
  }
 }
 const magic=Buffer.from('Kaydara FBX Binary  \0\x1a\0'),
  version=Buffer.alloc(4);version.writeUInt32LE(7500);
 const header=Buffer.concat([magic,version]),nodes=[];
 let cursor=header.length;
 for(const child of [['Objects',[],objects],['Connections',[],links]]){
  const b=binaryNode(child[0],child[1],child[2],cursor);
  nodes.push(b);cursor+=b.length;
 }
 return Buffer.concat([header,...nodes,Buffer.alloc(160)]);
}
class Euler{set(x,y,z,order){Object.assign(this,{x,y,z,order});return this;}}
class Quaternion{
 setFromEuler(e){
  const c1=Math.cos(e.x/2),c2=Math.cos(e.y/2),c3=Math.cos(e.z/2),
   s1=Math.sin(e.x/2),s2=Math.sin(e.y/2),s3=Math.sin(e.z/2);
  Object.assign(this,{x:s1*c2*c3+c1*s2*s3,y:c1*s2*c3-s1*c2*s3,
   z:c1*c2*s3+s1*s2*c3,w:c1*c2*c3-s1*s2*s3});
  return this;
 }
 clone(){return Object.assign(new Quaternion(),this);}
 invert(){this.x=-this.x;this.y=-this.y;this.z=-this.z;return this;}
 multiply(q){
  const {x,y,z,w}=this;
  Object.assign(this,{x:x*q.w+w*q.x+y*q.z-z*q.y,
   y:y*q.w+w*q.y+z*q.x-x*q.z,z:z*q.w+w*q.z+x*q.y-y*q.x,
   w:w*q.w-x*q.x-y*q.y-z*q.z});return this;
 }
 premultiply(q){return Object.assign(this,q.clone().multiply(this.clone()));}
 normalize(){const d=Math.hypot(this.x,this.y,this.z,this.w)||1;
  this.x/=d;this.y/=d;this.z/=d;this.w/=d;return this;}
}
class Track{constructor(name,times,values){Object.assign(this,{name,times,values});}}
class Clip{constructor(name,duration,tracks){Object.assign(this,{name,duration,tracks});}}
const THREE={Euler,Quaternion,QuaternionKeyframeTrack:Track,
 VectorKeyframeTrack:Track,AnimationClip:Clip};
const asArray=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
const bone={ID:1000,name:'mixamorigHips',isBone:true,userData:{},
 position:{toArray:()=>[0,0,0]}};
function fbx(){return {animations:[],traverse(cb){cb(bone);}};}
(async()=>{
 const original=asArray(fixture()),data=recovery.inspect(original);
 assert.equal(data.curveCount,3);assert.equal(data.stackCount,1);
 const result=fbx(),report=await recovery.recover(THREE,original,result);
 assert.equal(report.recovered,true);
 assert.equal(report.tracks,1);
 assert.equal(report.bones,1);
 assert.equal(result.animations[0].duration,1,
  'Nonzero Maya take time should play immediately, not 8s into the clip');
 const q=result.animations[0].tracks[0];
 assert.equal(q.name,'mixamorigHips.quaternion');
 assert.equal(q.times[0],0);assert.equal(q.times.at(-1),1);
 assert(Math.abs(q.values[0])<1e-6);
 assert(Math.abs(q.values.at(-4)-Math.SQRT1_2)<1e-4,
  'Recovered source keyframes must actually rotate the bone');
 const base=fbx();
 assert.equal((await recovery.recover(THREE,asArray(fixture(false)),base)).recovered,false,
  'A static Arnold base mesh must not fabricate animation');
 assert.equal(base.animations.length,0);
 assert(recovery.playable(result));
 const html=fs.readFileSync('animation-studio.html','utf8'),
  studio=fs.readFileSync('js/animation-studio.js','utf8');
 assert(html.includes('js/v171-fbx-animation-recovery.js?v=1710'));
 assert.equal((studio.match(/await parseStudioFBX\(/g)||[]).length,4,
  'Recover source curves in thumbnail, 3D viewer, GIF and Apply to Game');
 assert(studio.includes("if(item.source==='rokoko'"),
  'Rokoko/Maya takes with source start offsets must align to t=0');
 console.log('PASS V171 Studio FBX recovery: real compressed keyframes, time shift, static model, four playback/export paths');
})().catch(error=>{console.error(error);process.exitCode=1;});
