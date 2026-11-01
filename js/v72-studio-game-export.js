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
  // A landing's hip-height displacement is essential to its crouch and
  // impact. Previously game packs contained rotations ONLY: all source
  // pelvis travel was silently discarded. Encode just a normalized,
  // visual-only vertical track, with no FBX, root motion, or physics.
  const hipY=new Int16Array(frames),hipXZ=new Int16Array(frames*2),
        sourceHips=bones.get('hips');
  const head0=bones.get('head')?.getWorldPosition(new THREE.Vector3());
  const feet0=['leftfoot','rightfoot'].map(n=>
   bones.get(n)?.getWorldPosition(new THREE.Vector3())).filter(Boolean);
  const sourceFloor=feet0.length?Math.min(...feet0.map(p=>p.y)):
   (head0?.y||1)-1.6;
  const sourceHeight=Math.max(.01,Math.abs((head0?.y||sourceFloor+1.6)-sourceFloor));
  // Use the first ANIMATED pose for the reference, not the FBX bind/T
  // pose. Otherwise a pelvis translation already present at time zero
  // becomes a false giant impact dip when the clip is applied.
  let hipBaseWorld=null;
  // Record when each source sole actually supports weight. Quaternion-only
  // retarget cannot recover these contact moments afterward. Keeping a
  // moving Mixamo foot unpinned avoids impossible two-foot IK constraints.
  const sourceFeet=[bones.get('leftfoot'),bones.get('rightfoot')];
  const soleSamples=sourceFeet.map(()=>[]);
  const current=new THREE.Quaternion(),q=new THREE.Quaternion();
  for(let frame=0;frame<frames;frame++){
   mixer.setTime(clip.duration*frame/(frames-1));
   fbx.updateMatrixWorld(true);
   const currentHip=sourceHips.getWorldPosition(new THREE.Vector3());
   if(!hipBaseWorld)hipBaseWorld=currentHip.clone();
   const deltaY=(currentHip.y-hipBaseWorld.y)/sourceHeight;
   hipY[frame]=Math.round(Math.max(-1,Math.min(1,deltaY))*32767);
   // A Mixamo landing may include forward/lateral hip travel *inside*
   // the source skeleton rather than as scene-root motion. Keeping only
   // Y erased that weight shift in-game. Preserve source X/Z relative to
   // first animated frame, scaled to the same source character height.
   hipXZ[frame*2]=Math.round(Math.max(-1,Math.min(1,
    (currentHip.x-hipBaseWorld.x)/sourceHeight))*32767);
   hipXZ[frame*2+1]=Math.round(Math.max(-1,Math.min(1,
    (currentHip.z-hipBaseWorld.z)/sourceHeight))*32767);
   for(let foot=0;foot<2;foot++)
    if(sourceFeet[foot])soleSamples[foot].push(sourceFeet[foot].getWorldPosition(new THREE.Vector3()));
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
  let footContacts;
  if(sourceFeet.every(Boolean)){
   const floor=Math.min(...soleSamples[0].map(p=>p.y),...soleSamples[1].map(p=>p.y));
   const head=bones.get('head'),headY=head?head.getWorldPosition(new THREE.Vector3()).y:floor+170;
   const height=Math.max(1,Math.abs(headY-floor));
   const lowLimit=floor+height*.055,stillLimit=height*.32;
   let contacts='';
   for(let i=0;i<frames;i++){
    let bits=0;
    for(let foot=0;foot<2;foot++){
     const positions=soleSamples[foot],a=positions[Math.max(0,i-1)],
       b=positions[Math.min(frames-1,i+1)],sample=positions[i];
     const seconds=(Math.min(frames-1,i+1)-Math.max(0,i-1))/FPS;
     const velocity=a.distanceTo(b)/Math.max(seconds,1/FPS);
     if(sample.y<=lowLimit&&velocity<=stillLimit)bits|=(1<<foot);
    }
    contacts+=String(bits);
   }
   footContacts=contacts;
  }
  const bytes=new Uint8Array(values.length*2),view=new DataView(bytes.buffer);
  for(let i=0;i<values.length;i++)view.setInt16(i*2,values[i],true);
  const hipBytes=new Uint8Array(frames*2),hipView=new DataView(hipBytes.buffer);
  for(let i=0;i<frames;i++)hipView.setInt16(i*2,hipY[i],true);
  const hipXZBytes=new Uint8Array(frames*4),hipXZView=new DataView(hipXZBytes.buffer);
  for(let i=0;i<hipXZ.length;i++)hipXZView.setInt16(i*2,hipXZ[i],true);
  return {
   slot:opts.slot,character:opts.character||'kairo',
   sourceArchive:opts.sourceArchive||'',sourceFile:opts.sourceFile||'',
   sourceId:opts.sourceId||'',fps:FPS,frames,seconds:(frames-1)/FPS,
   speed:Math.max(.25,Math.min(2,Number(opts.speed)||1)),
   yaw:Math.max(-180,Math.min(180,Number(opts.yaw)||0)),
   bones:MAP.map(x=>x[1]),side:[side.x,side.z],
   ...(footContacts?{footContacts}:{}),
   encoding:'int16-le-xyzw-world-bind-delta-base64',
   // Older browser-local packs are still valid: missing hipYTrack means
   // the old quaternion-only animation, never a synthetic crouch.
   hipYEncoding:'int16-normalized-height-delta',hipYTrack:encode(hipBytes),
   // Only Studio-owned air clips need independent in-place source travel.
   // Older packs lacking hipXZTrack decode and play exactly as before.
   ...(['landing','fallingIdle'].includes(opts.slot)?{
    hipXZEncoding:'int16-normalized-height-xz-delta',hipXZTrack:encode(hipXZBytes)}:{}),
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
