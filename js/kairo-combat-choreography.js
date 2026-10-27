/* Sky Clash Batch A: exact Pose Lab NORMALIZED LOCAL clips, not Mixamo world deltas.
 * Decoder and sampler only. Existing V72 attachment remains the final combat writer.
 */
(function(root){
 'use strict';
 const BONES=['hips','spine','chest','upperChest','neck','head',
  'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
  'leftUpperLeg','leftLowerLeg','leftFoot',
  'rightUpperLeg','rightLowerLeg','rightFoot'];
 const SHA='775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72';
 const activeSlots=new Set(['punch1','punch2','punch3','overhand','kick']);
 function decodePack(THREE,pack){
  if(!pack||pack.schema!=='sky-clash.combat-choreo.v1'||pack.version!==1||
   pack.characterId!=='kairo_venn'||pack.modelSha256!==SHA||
   pack.rig!=='vrm0-normalized-bones'||
   pack.quaternionSpace!=='normalized-bone-local-absolute'||
   pack.gameplayRootTranslation!==false||JSON.stringify(pack.bones)!==JSON.stringify(BONES)||
   !Array.isArray(pack.clips)||pack.clips.length<5||pack.clips.length>32)
    throw Error('Combat Pose Lab asset is not compatible with the exact Kairo normalized VRM0');
  const actions={};
  for(const clip of pack.clips){
   if(!clip||!/^kairo-[a-z0-9-]+$/.test(clip.id)||
    typeof clip.slot!=='string'||Object.hasOwn(actions,clip.slot)||
    !Number.isFinite(clip.duration)||clip.duration<.16||clip.duration>3||
    !Array.isArray(clip.keyframes)||clip.keyframes.length<3||clip.keyframes.length>60)
    throw Error('Invalid Kairo authored combat clip header');
   let prev=-1;
   for(const k of clip.keyframes){
    if(!Number.isFinite(k.time)||k.time<=prev+.00001||k.time>clip.duration+.00001||
     !Array.isArray(k.quaternions)||k.quaternions.length!==BONES.length)
     throw Error('Malformed Kairo combat keyframe');
    for(const q of k.quaternions)if(!Array.isArray(q)||q.length!==4||
     q.some(v=>!Number.isFinite(v)||Math.abs(v)>1.00001)||
     Math.abs(Math.hypot(...q)-1)>.005)throw Error('Malformed local joint quaternion');
    prev=k.time;
   }
   if(Math.abs(clip.keyframes[0].time)>.00001||
    Math.abs(prev-clip.duration)>.00001||
    !(clip.contactTime===null||(Number.isFinite(clip.contactTime)&&
      clip.contactTime>.02&&clip.contactTime<clip.duration-.02&&
      clip.keyframes.some(k=>Math.abs(k.time-clip.contactTime)<.00001))))
     throw Error('Authored attack contact or entry/exit time missing');
   const frames=clip.keyframes.map(k=>({
    time:k.time,name:k.name,
    q:k.quaternions.map(a=>new THREE.Quaternion(...a).normalize())
   }));
   const sampler={
    id:clip.id,slot:clip.slot,characterId:'kairo_venn',
    localAbsolute:true,seconds:clip.duration,duration:clip.duration,
    contactTime:clip.contactTime,loop:!!clip.loop,sourceSha256:SHA,
    sample(seconds,out,loop=false){
     let t=Math.max(0,Math.min(clip.duration,Number.isFinite(seconds)?seconds:0));
     // Combat guard holds the authored final shield rather than snapping to first stance.
     if(loop&&clip.loop&&clip.slot==='combatReady')t=((t%clip.duration)+clip.duration)%clip.duration;
     let b=1;
     while(b<frames.length-1&&frames[b].time<t)b++;
     const a=b-1,f0=frames[a],f1=frames[b],
      w=Math.max(0,Math.min(1,(t-f0.time)/(f1.time-f0.time)));
     if(!out||out.length!==BONES.length)throw Error('Expected 20 output joint quaternions');
     for(let i=0;i<BONES.length;i++)out[i].slerpQuaternions(f0.q[i],f1.q[i],w).normalize();
     return out;
    }
   };
   actions[clip.slot]=sampler;
  }
  for(const name of activeSlots)if(!actions[name])throw Error('Missing first-four chain authored slot '+name);
  return actions;
 }
 const api={decodePack,BONES,SHA,activeSlots};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashKairoCombatChoreo=api;
})(typeof window!=='undefined'?window:globalThis);
