/* V72 — Export real FBX keyframes from Animation Studio into a versioned
 * GAME MOTION PACK (not just a browser-local assignment map).
 *
 * This generates a standalone JSON resource with compact quaternion samples,
 * source clip IDs, per-slot settings, and the Mixamo shoulder reference needed
 * to reproduce V68's correct world-rest retargeting. Original FBX bytes and
 * images are not placed in the pack. Publishing to GitHub requires an
 * intentional user commit, not a client-side anonymous upload.
 */
(function(root){
 'use strict';
 const MAP=[
 ['hips','hips'],['spine','spine'],['spine1','chest'],['spine2','upperChest'],
 ['neck','neck'],['head','head'],['leftshoulder','leftShoulder'],
 ['leftarm','leftUpperArm'],['leftforearm','leftLowerArm'],['lefthand','leftHand'],
 ['rightshoulder','rightShoulder'],['rightarm','rightUpperArm'],
 ['rightforearm','rightLowerArm'],['righthand','rightHand'],
 ['leftupleg','leftUpperLeg'],['leftleg','leftLowerLeg'],['leftfoot','leftFoot'],
 ['rightupleg','rightUpperLeg'],['rightleg','rightLowerLeg'],['rightfoot','rightFoot']
 ];
 // V86 UE5 Quinn Z-up FBX aliases. Three.js FBXLoader already handles
 // source coordinate conversion to Y-up, so the existing WORLD bind-delta
 // retarget remains intact; twist/IK helper bones must not override joints.
 const UE5_ALIASES=Object.freeze({
  pelvis:'hips',spine01:'spine',spine02:'spine1',spine03:'spine2',
  neck01:'neck',head:'head',
  claviclel:'leftshoulder',upperarml:'leftarm',lowerarml:'leftforearm',handl:'lefthand',
  clavicler:'rightshoulder',upperarmr:'rightarm',lowerarmr:'rightforearm',handr:'righthand',
  thighl:'leftupleg',calfl:'leftleg',footl:'leftfoot',
  thighr:'rightupleg',calfr:'rightleg',footr:'rightfoot'
 });
 function canonical(name){
  const key=norm(name);
  return UE5_ALIASES[key]||key;
 }
 const FPS=30,MAX_FRAMES=420,MAX_CLIPS=50;
 function norm(n){return String(n).split(':').pop().replace(/[^a-z0-9]/gi,'').toLowerCase().replace(/^mixamorig\d*/,'');}
 function encode(bytes){
  // Chunked Uint8Array avoids stack limits on long Mixamo animation sets.
  let binary='';
  for(let i=0;i<bytes.length;i+=8192)
   binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
 }
 function bake(THREE,fbx,opts={}){
  const clip=fbx.animations?.find(c=>c.duration>.05&&Number.isFinite(c.duration));
  if(!clip)throw Error('No playable FBX animation');
  if(clip.duration>MAX_FRAMES/FPS)throw Error('Motion longer than 14 seconds; choose a shorter clip');
  const bones=new Map();
  fbx.traverse(node=>{
   if(!node.isBone)return;
   const key=canonical(node.name);
   if(!bones.has(key))bones.set(key,node);
  });
  if(!bones.has('hips')||!bones.has('leftarm')||!bones.has('rightarm'))
   throw Error('FBX does not contain a Mixamo humanoid skeleton');
  fbx.updateMatrixWorld(true);
  const original=new Map(),world=new THREE.Quaternion();
  for(const [src] of MAP){
   const bone=bones.get(src);if(bone)original.set(src,bone.getWorldQuaternion(new THREE.Quaternion()).invert());
  }
  const left=bones.get('leftshoulder')||bones.get('leftarm'),
        right=bones.get('rightshoulder')||bones.get('rightarm');
  const leftP=left.getWorldPosition(new THREE.Vector3()),
        rightP=right.getWorldPosition(new THREE.Vector3());
  const side=leftP.sub(rightP);side.y=0;
  if(side.lengthSq()<1e-8)throw Error('Cannot identify the source character facing direction');
  side.normalize();
  const mixer=new THREE.AnimationMixer(fbx);
  // Export exact terminal keyframe: the default LoopRepeat mode jumps to
  // frame zero at t==duration, corrupting one-shot punches and kicks.
  const action=mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce,1);
  action.clampWhenFinished=true;
  action.play();
  const frames=Math.max(3,Math.min(MAX_FRAMES,Math.round(clip.duration*FPS)+1));
  const values=new Int16Array(frames*MAP.length*4);
  const current=new THREE.Quaternion(),q=new THREE.Quaternion();
  for(let frame=0;frame<frames;frame++){
   mixer.setTime(clip.duration*frame/(frames-1));
   fbx.updateMatrixWorld(true);
   for(let i=0;i<MAP.length;i++){
    const [src]=MAP[i],bone=bones.get(src),inv=original.get(src);
    if(bone&&inv)q.copy(bone.getWorldQuaternion(current)).multiply(inv).normalize();
    else q.identity();
    // SLERP continuity even when rotations pass 180 degrees.
    if(frame>0){
     const prior=(frame-1)*MAP.length*4+i*4;
     if(values[prior]*q.x+values[prior+1]*q.y+values[prior+2]*q.z+values[prior+3]*q.w<0)
      q.set(-q.x,-q.y,-q.z,-q.w);
    }
    const at=frame*MAP.length*4+i*4;
    for(const [j,v] of [q.x,q.y,q.z,q.w].entries())
     values[at+j]=Math.max(-32767,Math.min(32767,Math.round(v*32767)));
   }
  }
  mixer.stopAllAction();
  const bytes=new Uint8Array(values.length*2),view=new DataView(bytes.buffer);
  for(let i=0;i<values.length;i++)view.setInt16(i*2,values[i],true);
  return {
   slot:opts.slot,character:opts.character||'kairo',
   sourceArchive:opts.sourceArchive||'',sourceFile:opts.sourceFile||'',
   sourceId:opts.sourceId||'',fps:FPS,frames,seconds:(frames-1)/FPS,
   speed:Math.max(.25,Math.min(2,Number(opts.speed)||1)),
   yaw:Math.max(-180,Math.min(180,Number(opts.yaw)||0)),
   bones:MAP.map(x=>x[1]),side:[side.x,side.z],
   encoding:'int16-le-xyzw-world-bind-delta-base64',
   data:encode(bytes)
  };
 }
 function pack(motions){
  if(!Array.isArray(motions)||!motions.length||motions.length>MAX_CLIPS)
   throw Error('Select 1 to '+MAX_CLIPS+' assigned animations first');
  for(const m of motions){
   if(!m||!m.data||!m.slot||!['kairo','rin'].includes(m.character))
    throw Error('Invalid game animation slot');
  }
  return {schema:'sky-clash.studio-gamepack.v1',revision:1,
   note:'Optimized motion samples for Sky Clash; no source FBX models or meshes. Commit the pack explicitly to publish.',
   generated:new Date().toISOString(),motions};
 }
 const api={bake,pack,MAP,FPS,canonical,UE5_ALIASES};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashGamePackExporter=api;
})(typeof window!=='undefined'?window:globalThis);
