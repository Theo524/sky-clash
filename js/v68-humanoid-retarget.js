/* Sky Clash V68 — forward-aligned Mixamo FBX -> VRM humanoid preview.
 * The FBX diagnostic pose is authoritative. Its WORLD REST DELTAS are
 * transferred to the VRM world rest, after one BODY-FORWARD correction.
 *
 * Do NOT use source/target hips' bone quaternions as a global basis: Mixamo
 * bone roll and VRM normalized bone roll differ, and that rotates real elbow,
 * knee and wrist motion onto arbitrary axes (the V58-67 glitch).
 *
 * This adapter preserves the same motion in world space and reconstructs
 * each target joint's local quaternion from its *actual animated parent*.
 * Only the rig preview is affected, not gameplay or original FBX tracks.
 */
(function(root){
 'use strict';
 const VERSION='68.0';
 function create(THREE){
  if(!THREE?.Quaternion)throw Error('Retarget requires Three.js');
  const UP=new THREE.Vector3(0,1,0);
  const srcQ=new THREE.Quaternion(),restInv=new THREE.Quaternion(),rotation=new THREE.Quaternion(),
        wanted=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),local=new THREE.Quaternion();
  const sourceSide=new THREE.Vector3(),targetSide=new THREE.Vector3();
  function shoulderSide(left,right,out){
   if(!left||!right)return false;
   out.copy(left).sub(right);out.y=0;
   if(!Number.isFinite(out.lengthSq())||out.lengthSq()<1e-7)return false;
   out.normalize();return true;
  }
  // Anatomical L-R shoulder positions define each model's horizontal facing.
  // Their direction is stable even if a Mixamo joint has a 180-degree bone roll.
  function faceCorrection(sourcePoints,targetRest,yawDeg=0){
   const a=sourcePoints?.get('leftshoulder')||sourcePoints?.get('leftarm'),
         b=sourcePoints?.get('rightshoulder')||sourcePoints?.get('rightarm');
   const c=targetRest?.get('leftshoulder')?.position||targetRest?.get('leftarm')?.position,
         d=targetRest?.get('rightshoulder')?.position||targetRest?.get('rightarm')?.position;
   const ok=shoulderSide(a,b,sourceSide)&&shoulderSide(c,d,targetSide);
   if(!ok)throw Error('Cannot determine anatomical shoulder orientation for retargeting');
   // Three.js +Y rotation: (x,z) -> (cos*x+sin*z,-sin*x+cos*z).
   const cross=sourceSide.z*targetSide.x-sourceSide.x*targetSide.z;
   const dot=sourceSide.x*targetSide.x+sourceSide.z*targetSide.z;
   const yaw=Math.atan2(cross,dot)+(Number(yawDeg)||0)*Math.PI/180;
   return new THREE.Quaternion().setFromAxisAngle(UP,yaw);
  }
  function sample(rig,rest,targets,yawDeg=0){
   if(!rig?.bones||!rig?.restWorld||!rig?.restPoints||!rest)throw Error('Missing FBX/VRM bind pose for preview');
   // Restore every target local bind transform — source clips never stack
   // onto previous poses (seeking/restarting is deterministic).
   for(const r of rest.values())r.node.quaternion.copy(r.local);
   const hips=rest.get('hips');
   if(!hips)throw Error('VRM model has no humanoid hips');
   hips.node.updateMatrixWorld(true);
   const basis=faceCorrection(rig.restPoints,rest,yawDeg);
   const basisInv=basis.clone().invert();
   let applied=0, skipped=0, maximum=0;
   for(const [src] of targets){
    // Copy hip ROTATION as well: attacks and acrobatics often animate the
    // pelvis. Position/root travel is still locked by never copying position.
    const rec=rest.get(src),bone=rig.bones.get(src),bind=rig.restWorld.get(src);
    if(!rec||!bone||!bind){skipped++;continue;}
    // Mixamo FBX world-space delta (current * inverse(bind)).
    bone.getWorldQuaternion(srcQ);
    rotation.copy(srcQ).multiply(restInv.copy(bind).invert()).normalize();
    // Retarget only the facing basis. Don't rotate deltas by the hips' bone roll.
    wanted.copy(basis).multiply(rotation).multiply(basisInv).multiply(rec.world).normalize();
    const node=rec.node,par=node.parent;
    if(!par){skipped++;continue;}
    par.getWorldQuaternion(parentQ);
    local.copy(parentQ).invert().multiply(wanted).normalize();
    // Physical safety cap measured from this model's bind pose. It prevents
    // extreme clipping from malformed source tracks, not ordinary joint bends.
    const limit=src==='hips'?Math.PI:
      src.includes('forearm')||src.includes('hand')?2.65:
      src.includes('arm')||src.includes('shoulder')?2.45:
      src.includes('leg')||src.includes('foot')?2.4:1.9;
    const angle=rec.local.angleTo(local);
    maximum=Math.max(maximum,angle);
    if(angle>limit)local.copy(rec.local).slerp(local,limit/angle);
    if(![local.x,local.y,local.z,local.w].every(Number.isFinite)){skipped++;continue;}
    node.quaternion.copy(local);
    node.updateMatrixWorld(true);
    applied++;
   }
   return {applied,skipped,maximum,method:'world-rest-delta/shoulder-forward',version:VERSION};
  }
  return {sample,faceCorrection,version:VERSION};
 }
 const api={create,version:VERSION};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashHumanoidRetarget=api;
})(typeof window!=='undefined'?window:globalThis);
