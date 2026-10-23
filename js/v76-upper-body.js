/* Sky Clash V76 — one owner for Kairo's grounded upper-body pose.
 *
 * Previous game: procedural VRMRig.update wrote ALL joints every frame;
 * V72 restored the actual Mixamo walk arms only WHILE walking, then turned
 * off when standing, exposing the old, incorrectly retargeted guard.
 *
 * New: a single after-procedural layer owns normalized VRM shoulder, upper
 * arm, elbow and wrist bones for BOTH fighting idle and walking; it blends
 * real Mixamo source clips in world-rest-delta space, matching the successful
 * V68 Studio retarget. Combat/air/dash/block states explicitly yield to the
 * existing fighter controller. No fixes to arbitrary arm angles or VRM bones.
 *
 * ?upper=legacy: old walking arms / old procedural idle
 * ?upper=procedural: disable recorded upper body entirely
 * ?walkStyle=original: keep full Mixamo walk swing rather than V75 damping
 */
(function(root){
 'use strict';
 const FPS=30;
 const IDLE='assets/animations/gameplay/kairo-fighting-idle-v1.json';
 const WALK='assets/animations/gameplay/kairo-walk-arms-v1.json';
 const BONES=['leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand'];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function decode(THREE,asset){
  if(!THREE?.Quaternion||asset?.schema!=='sky-clash.motion.v1'||
     !['kairo.fighting-idle','kairo.walk-arms'].includes(asset.id)||
     asset.fps!==FPS||!Number.isInteger(asset.frames)||
     asset.frames<3||asset.frames>150||
     JSON.stringify(asset.bones)!==JSON.stringify(BONES))
   throw Error('V76: invalid versioned Mixamo upper-body motion');
  const binary=atob(asset.data||''),stride=BONES.length*4;
  if(binary.length!==asset.frames*stride*2)throw Error('V76: corrupt upper-body motion');
  const buf=new Uint8Array(binary.length);
  for(let i=0;i<buf.length;i++)buf[i]=binary.charCodeAt(i);
  const view=new DataView(buf.buffer),data=new Int16Array(asset.frames*stride);
  for(let i=0;i<data.length;i++)data[i]=view.getInt16(i*2,true);
  const a=new THREE.Quaternion(),b=new THREE.Quaternion();
  const last=asset.frames-1;
  function sample(seconds,out){
   const phase=((seconds*FPS)%last+last)%last,i0=Math.floor(phase),
     i1=Math.min(last,i0+1),mix=phase-i0;
   for(let i=0;i<BONES.length;i++){
    const p=(i0*BONES.length+i)*4,q=(i1*BONES.length+i)*4;
    a.set(data[p]/32767,data[p+1]/32767,data[p+2]/32767,data[p+3]/32767).normalize();
    b.set(data[q]/32767,data[q+1]/32767,data[q+2]/32767,data[q+3]/32767).normalize();
    out[i].slerpQuaternions(a,b,mix).normalize();
   }
   return out;
  }
  // Mean gait quaternion is a valid lowered walking stance. Attenuate ONLY
  // the periodic swing around the mean, never toward an identity T-pose.
  const center=BONES.map(()=>new THREE.Quaternion()),ref=BONES.map(()=>new THREE.Quaternion()),
    frame=BONES.map(()=>new THREE.Quaternion()),sum=BONES.map(()=>[0,0,0,0]);
  sample(0,ref);
  for(let f=0;f<last;f++){
   sample(f/FPS,frame);
   for(let j=0;j<BONES.length;j++){
    const q=frame[j],v=sum[j],sign=q.dot(ref[j])<0?-1:1;
    v[0]+=sign*q.x;v[1]+=sign*q.y;v[2]+=sign*q.z;v[3]+=sign*q.w;
   }
  }
  for(let j=0;j<BONES.length;j++)center[j].fromArray(sum[j]).normalize();
  return {asset,sample,center,seconds:last/FPS};
 }
 function attach(THREE,fighter,idle,walk,status){
  if(!fighter||typeof fighter.animate!=='function'||fighter.v76UpperBody)return null;
  const previous=fighter.animate;
  const state={rig:null,bones:null,bind:null,standClock:0,transition:0,
   mode:'waiting-for-VRM',samples:0,
   idlePose:BONES.map(()=>new THREE.Quaternion()),
   walkPose:BONES.map(()=>new THREE.Quaternion())};
  const qScene=new THREE.Quaternion(),qSceneInv=new THREE.Quaternion(),
   qParent=new THREE.Quaternion(),qWantedWorld=new THREE.Quaternion(),
   qLocal=new THREE.Quaternion(),qDelta=new THREE.Quaternion(),
   qA=new THREE.Quaternion(),qB=new THREE.Quaternion(),qCenter=new THREE.Quaternion(),
   zero=new THREE.Quaternion(),turn=new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
  const invTurn=turn.clone().invert();
  function capture(rig){
   const humanoid=rig.vrm?.humanoid,scene=rig.vrm?.scene;
   if(!humanoid||!scene)throw Error('V76: Kairo humanoid is not ready');
   const get=n=>humanoid.getNormalizedBoneNode(n);
   const bones=BONES.map(get);
   if(bones.some(x=>!x))throw Error('V76: Kairo is missing VRM upper-arm/hand joints');
   const all=[...new Set(['hips','spine','chest','upperChest','neck',...BONES].map(get).filter(Boolean))];
   const old=all.map(node=>node.quaternion.clone());
   for(const node of all)node.quaternion.identity();
   scene.updateMatrixWorld(true);
   scene.getWorldQuaternion(qSceneInv).invert();
   const bind=bones.map(node=>qSceneInv.clone()
     .multiply(node.getWorldQuaternion(new THREE.Quaternion())).normalize());
   for(let i=0;i<all.length;i++)all[i].quaternion.copy(old[i]);
   scene.updateMatrixWorld(true);
   state.rig=rig;state.bones=bones;state.bind=bind;
  }
  function eligible(f){
   return f.hp>0&&!f.flying&&!f.launched&&!f.spiked&&
    !(f.punchT>0||f.blastT>0||f.superHitT>0||f.downT>0||
      f.stun>0||f.slamming||f.dashing||f.sprinting||f.charging||
      f.blockHeld||f.blocking||f.acro);
  }
  fighter.animate=function(dt){
   // Call the original gameplay animation exactly once. It still controls
   // physics, attacks, animations outside upper body and VRM expressions.
   previous.call(this,dt);
   const rig=this.vrmRig,safe=clamp(Number.isFinite(dt)?dt:0,0,.065);
   if(!rig?.vrm){state.transition=0;return;}
   if(!eligible(this)){
    // Procedural combat takes over cleanly in this very frame. The return
    // to real grounded idle is blended after recovery, not forced instantly.
    state.transition=0;state.mode='combat-or-air';return;
   }
   try{
    if(state.rig!==rig)capture(rig);
    state.transition=clamp(state.transition+safe*6.5,0,1);
    state.standClock+=safe;
    const walking=clamp(this.v71Walk?.weight||0,0,1);
    idle.sample(state.standClock,state.idlePose);
    walk.sample(this.v71Walk?.clock||0,state.walkPose);
    const scene=rig.vrm.scene;scene.updateMatrixWorld(true);
    scene.getWorldQuaternion(qScene);
    const basis=rig.legacyAxes?turn:zero,basisInv=rig.legacyAxes?invTurn:zero;
    const style=root.SkyClashGameplayMotions?.action;
    for(let i=0;i<BONES.length;i++){
     const node=state.bones[i];if(!node?.parent)continue;
     // Fade walking swings around the SOURCE walk centre (not T pose).
     qA.copy(state.walkPose[i]);
     if(!status.originalWalkStyle&&walk.center[i]){
      const gain=(i%4===0||i%4===1)?(style?.shoulderSwing??.55):
       i%4===2?(style?.elbowSwing??.8):(style?.wristSwing??.74);
      qA.slerp(walk.center[i],1-clamp(gain,0,1));
     }
     // One continuous upper-body ownership state machine:
     // idle -> walking -> idle. No procedural stance leaks during the handoff.
     qDelta.copy(state.idlePose[i]).slerp(qA,walking).normalize();
     qB.copy(basis).multiply(qDelta).multiply(basisInv).normalize();
     qWantedWorld.copy(qScene).multiply(qB).multiply(state.bind[i]).normalize();
     node.parent.getWorldQuaternion(qParent);
     qLocal.copy(qParent).invert().multiply(qWantedWorld).normalize();
     // Respect natural anatomy and avoid sudden bad FBX spikes.
     const angle=node.quaternion.angleTo(qLocal);
     if(angle>2.7)qLocal.copy(node.quaternion).slerp(qLocal,2.7/angle);
     node.quaternion.slerp(qLocal,state.transition);
     node.updateMatrixWorld(true);
    }
    rig.vrm.update(0);
    state.samples++;state.mode=walking>.02?'walking':'fighting-idle';
    status.mode=state.mode;status.frames=state.samples;
    status.walkWeight=walking;status.transition=state.transition;
   }catch(e){
    status.error=String(e);
    console.error('V76: recording disabled; returning to original fighter pose',e);
    fighter.animate=previous;fighter.v76UpperBody=null;
   }
  };
  fighter.v76UpperBody=state;
  return state;
 }
 async function start(context=root){
  const params=new URLSearchParams(context.location?.search||'');
  const status={version:76,ready:false,mode:'loading',frames:0,error:null,
   originalWalkStyle:params.get('walkStyle')==='original'};
  context.SkyClashUpperBody=status;
  if(['legacy','procedural'].includes(params.get('upper'))){
   status.mode=params.get('upper')+'-fallback';return status;
  }
  try{
   const THREE=context.THREE,Game=context.SkyClash?.Game;
   if(!THREE||!Game)throw Error('V76: Game and Three.js required');
   const responses=await Promise.all([IDLE,WALK].map(url=>context.fetch(url+'?v=760',{cache:'force-cache'})));
   if(responses.some(r=>!r.ok))throw Error('V76: unable to fetch fighting-idle/walk asset');
   const [idle,walk]=await Promise.all(responses.map(async r=>decode(THREE,await r.json())));
   const fighters=[Game.heroes?.kairo_venn,Game.enemy].filter(Boolean);
   let count=0;
   for(const fighter of fighters)if(attach(THREE,fighter,idle,walk,status))count++;
   if(!count)throw Error('V76: no Kairo fighters to animate');
   status.ready=true;status.mode='fighting-idle';status.characters=count;
   status.assets=['kairo.fighting-idle','kairo.walk-arms'];
  }catch(e){
   status.error=String(e);status.mode='procedural-fallback';
   console.warn('V76: single upper-body controller unavailable',e);
  }
  return status;
 }
 const api={version:76,BONES,decode,attach,start};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV76UpperBody=api;
})(typeof window!=='undefined'?window:globalThis);
