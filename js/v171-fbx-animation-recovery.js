/* Studio-only FBX recovery for valid animation curves missed by the r158 loader.
 * Read only standard binary FBX Objects/Connections/key arrays, not meshes.
 * Never alter original ZIPs, assignments, or published game assets. */
(function(root){
 'use strict';
 const TICKS=46186158000,MAX_BYTES=48*1024*1024,MAX_FRAMES=4500;
 function inspect(buffer){
  const bytes=new Uint8Array(buffer),v=new DataView(buffer);
  if(bytes.byteLength<40||bytes.byteLength>MAX_BYTES||
    new TextDecoder().decode(bytes.subarray(0,18))!=='Kaydara FBX Binary')return null;
  const version=v.getUint32(23,true);
  if(version<7500)return null; // older headers are handled by the normal loader
  const decoder=new TextDecoder();
  function node(pos){
   if(pos+25>bytes.length)return null;
   const end=Number(v.getBigUint64(pos,true));
   if(!end)return null;
   const count=Number(v.getBigUint64(pos+8,true)),nameLen=v.getUint8(pos+24);
   if(end>bytes.length||end<=pos+25||count>32||pos+25+nameLen>end)
    throw Error('Malformed FBX object header');
   const name=decoder.decode(bytes.subarray(pos+25,pos+25+nameLen));
   let p=pos+25+nameLen;const props=[];
   for(let i=0;i<count;i++){
    const kind=String.fromCharCode(v.getUint8(p++));let val;
    switch(kind){
     case 'S':case 'R':{
      const n=v.getUint32(p,true);p+=4;
      if(p+n>end)throw Error('Malformed FBX property length');
      val=kind==='S'?decoder.decode(bytes.subarray(p,p+n)):null;p+=n;break;
     }
     case 'L':val=Number(v.getBigInt64(p,true));p+=8;break;
     case 'I':val=v.getInt32(p,true);p+=4;break;
     case 'D':val=v.getFloat64(p,true);p+=8;break;
     case 'F':val=v.getFloat32(p,true);p+=4;break;
     case 'Y':val=v.getInt16(p,true);p+=2;break;
     case 'C':val=!!v.getUint8(p++);break;
     case 'l':case 'i':case 'f':case 'd':case 'b':{
      const length=v.getUint32(p,true),encoding=v.getUint32(p+4,true),size=v.getUint32(p+8,true);
      p+=12;if(p+size>end||length>1000000)throw Error('Unsafe FBX keyframe array');
      val={kind,length,encoding,offset:p,size};p+=size;break;
     }
     default:throw Error('Unsupported FBX binary property '+kind);
    }
    props.push(val);
   }
   return {name,props,childrenStart:p,end};
  }
  function children(parent){
   const out=[];let offset=parent?parent.childrenStart:27;
   const end=parent?parent.end:bytes.length-160;
   while(offset+25<=end){
    const item=node(offset);if(!item)break;
    if(item.end>end)throw Error('FBX node escapes parent');
    out.push(item);offset=item.end;
   }
   return out;
  }
  const top=children(null),objects=top.find(x=>x.name==='Objects'),links=top.find(x=>x.name==='Connections');
  if(!objects||!links)return null;
  const models=new Map(),curves=new Map(),curveNodes=new Map(),stacks=new Set(),layers=new Set();
  for(const item of children(objects)){
   const id=item.props[0];if(!Number.isSafeInteger(id))continue;
   if(item.name==='Model'){
    const props={},p70=children(item).find(x=>x.name==='Properties70');
    if(p70)for(const prop of children(p70))if(prop.name==='P'&&typeof prop.props[0]==='string')
     props[prop.props[0]]=prop.props.slice(4).filter(x=>typeof x==='number');
    models.set(id,{name:String(item.props[1]||'').split('\0')[0],props});
   }else if(item.name==='AnimationCurveNode'){
    curveNodes.set(id,{type:String(item.props[1]||'').split('\0')[0],axes:{}});
   }else if(item.name==='AnimationCurve'){
    const data={};for(const c of children(item))
     if(c.name==='KeyTime'||c.name==='KeyValueFloat')data[c.name]=c.props[0];
    if(data.KeyTime&&data.KeyValueFloat)curves.set(id,data);
   }else if(item.name==='AnimationLayer')layers.add(id);
   else if(item.name==='AnimationStack')stacks.add(id);
  }
  const owners=new Map(),active=new Set();
  for(const link of children(links)){
   if(link.name!=='C')continue;
   const [rel,from,to,axis]=link.props;
   if(rel==='OP'&&curves.has(from)&&curveNodes.has(to)){
    const key=String(axis||'').split('|').pop().toLowerCase();
    if(['x','y','z'].includes(key))curveNodes.get(to).axes[key]=curves.get(from);
   }else if(rel==='OP'&&curveNodes.has(from)&&models.has(to))owners.set(from,to);
   else if(rel==='OO'&&curveNodes.has(from)&&layers.has(to))active.add(from);
  }
  return {models,curveNodes,owners,active,curveCount:curves.size,stackCount:stacks.size,
   async array(desc){
    if(!desc||!['l','f','d'].includes(desc.kind))return null;
    let arr=bytes.subarray(desc.offset,desc.offset+desc.size);
    if(desc.encoding===1){
     if(typeof DecompressionStream==='undefined')
      throw Error('FBX zlib support unavailable in this browser');
     arr=new Uint8Array(await new Response(new Blob([arr]).stream()
      .pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    }else if(desc.encoding!==0)throw Error('Unknown FBX array compression');
    const width=desc.kind==='l'?8:desc.kind==='d'?8:4;
    if(arr.length<desc.length*width)throw Error('Truncated FBX keyframe array');
    const dv=new DataView(arr.buffer,arr.byteOffset,arr.byteLength),out=[];
    for(let i=0;i<desc.length;i++)out.push(desc.kind==='l'?
     Number(dv.getBigInt64(i*8,true))/TICKS:
     desc.kind==='d'?dv.getFloat64(i*8,true):dv.getFloat32(i*4,true));
    return out;
   }};
 }
 function playable(fbx){
  return !!fbx?.animations?.some(c=>c.tracks?.length&&
   Number.isFinite(c.duration)&&c.duration>.001);
 }
 async function recover(THREE,buffer,fbx){
  if(playable(fbx))return {recovered:false,tracks:fbx.animations.length};
  const data=inspect(buffer);
  if(!data||!data.curveCount||!data.stackCount)return {recovered:false,tracks:0};
  const byID=new Map(),byName=new Map();
  fbx.traverse(obj=>{
   if(!obj.isBone)return;
   if(Number.isSafeInteger(obj.ID))byID.set(obj.ID,obj);
   byName.set(obj.name.replace(/[^a-z0-9]/gi,'').toLowerCase(),obj);
  });
  const grouped=new Map();
  for(const [id,curveNode] of data.curveNodes){
   if(!data.active.has(id)||!['R','T'].includes(curveNode.type)||
      !Object.keys(curveNode.axes).length)continue;
   const modelID=data.owners.get(id),model=data.models.get(modelID);
   if(!model)continue;
   const bone=byID.get(modelID)||
    byName.get(model.name.replace(/[^a-z0-9]/gi,'').toLowerCase());
   if(!bone)continue;
   if(!grouped.has(bone))grouped.set(bone,{model,curves:{}});
   grouped.get(bone).curves[curveNode.type]=curveNode.axes;
  }
  if(!grouped.size)return {recovered:false,tracks:0};
  const decoded=new Map();
  async function axis(c){
   if(decoded.has(c))return decoded.get(c);
   const [times,values]=await Promise.all([data.array(c.KeyTime),data.array(c.KeyValueFloat)]);
   if(!times?.length||times.length!==values?.length)throw Error('Invalid FBX animation keyframes');
   const keys={times,values};decoded.set(c,keys);return keys;
  }
  const animations=new Map(),times=[];
  for(const [bone,group] of grouped){
   const entry={model:group.model,bone,R:{},T:{}};
   for(const type of ['R','T'])for(const [name,curve] of Object.entries(group.curves[type]||{})){
    entry[type][name]=await axis(curve);
    times.push(entry[type][name].times[0],entry[type][name].times.at(-1));
   }
   animations.set(bone,entry);
  }
  const start=Math.min(...times),end=Math.max(...times),length=end-start;
  if(!Number.isFinite(length)||length<=.001||length>150)return {recovered:false,tracks:0};
  const frames=Math.min(MAX_FRAMES,Math.ceil(length*30)+1),
   dt=length/Math.max(1,frames-1),tracks=[];
  function at(keys,t,fallback){
   if(!keys)return fallback;
   const {times,values}=keys;
   if(t<=times[0])return values[0];
   if(t>=times.at(-1))return values.at(-1);
   let lo=0,hi=times.length-1;
   while(hi-lo>1){const mid=(lo+hi)>>1;if(times[mid]>t)hi=mid;else lo=mid;}
   const d=times[hi]-times[lo];
   return d>0?values[lo]+(values[hi]-values[lo])*(t-times[lo])/d:values[lo];
  }
  const euler=new THREE.Euler(),q=new THREE.Quaternion(),
   qPre=new THREE.Quaternion(),qPost=new THREE.Quaternion(),temp=new THREE.Euler();
  for(const entry of animations.values()){
   const {bone,model,R,T}=entry,name=bone.name,props=model.props;
   const pre=props.PreRotation||[0,0,0],post=props.PostRotation||[0,0,0];
   const order=bone.userData?.transformData?.eulerOrder||'XYZ';
   const preRot=qPre.setFromEuler(temp.set(...pre.map(x=>x*Math.PI/180),order)).clone();
   const postRot=qPost.setFromEuler(temp.set(...post.map(x=>x*Math.PI/180),order)).invert().clone();
   if(Object.keys(R).length){
    const values=[],keyTimes=[];
    for(let i=0;i<frames;i++){
     const t=start+i*dt;keyTimes.push(i*dt);
     q.setFromEuler(euler.set(at(R.x,t,0)*Math.PI/180,at(R.y,t,0)*Math.PI/180,
      at(R.z,t,0)*Math.PI/180,order));
     q.premultiply(preRot).multiply(postRot).normalize();
     values.push(q.x,q.y,q.z,q.w);
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(name+'.quaternion',keyTimes,values));
   }
   if(Object.keys(T).length){
    const rest=props['Lcl Translation']||bone.position.toArray(),values=[],keyTimes=[];
    for(let i=0;i<frames;i++){
     const t=start+i*dt;keyTimes.push(i*dt);
     values.push(at(T.x,t,rest[0]),at(T.y,t,rest[1]),at(T.z,t,rest[2]));
    }
    tracks.push(new THREE.VectorKeyframeTrack(name+'.position',keyTimes,values));
   }
  }
  if(!tracks.length)return {recovered:false,tracks:0};
  fbx.animations=[new THREE.AnimationClip('Recovered FBX motion',length,tracks)];
  return {recovered:true,tracks:tracks.length,bones:grouped.size,seconds:length};
 }
 const api={inspect,playable,recover};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashFBXAnimationRecovery=api;
})(typeof window!=='undefined'?window:globalThis);
