/* Sky Clash V78 — vertical Mixamo hip travel for Animation Studio.
 *
 * Bone Diagnostic already shows the FBX hips' Y-translation during jogging:
 * the real "standard run.fbx" includes ~8.36cm peak-to-peak vertical
 * displacement in its 23 hips Translation/Y keys. V68 correctly retargets
 * rotations, but purposely locked ALL translation in On Character. That
 * removed the body's bounce even when elbows/knees animated correctly.
 *
 * Apply only the source's measured vertical hip displacement in world units
 * (FBX diagnostic and VRM preview are both normalized to about 2.35m).
 * X/Z/root travel stays locked, preserving in-place animation preview.
 * This is an absolute pose, not accumulated offset; seeking never drifts.
 */
(function(root){
 'use strict';
 function apply(THREE,source,rest){
  const dst=rest?.get('hips'),src=source?.hips;
  if(!THREE?.Vector3||!dst?.node||!dst?.localPosition||!src||
     !Number.isFinite(source.previewHipBaseY))return {applied:false,vertical:0};
  const parent=dst.node.parent;
  if(!parent)return {applied:false,vertical:0};
  source.wrap?.updateMatrixWorld(true);
  // Source hip is in the FBX rig's diagnostic STAGE world frame, already
  // scaled by setupRig to the same human-size range as the VRM preview.
  const world=src.getWorldPosition(new THREE.Vector3());
  const vertical=Math.max(-1.1,Math.min(1.1,world.y-source.previewHipBaseY));
  const parentQ=parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  const scale=parent.getWorldScale(new THREE.Vector3());
  if(![scale.x,scale.y,scale.z].every(x=>Number.isFinite(x)&&Math.abs(x)>1e-6))
   return {applied:false,vertical:0};
  const local=new THREE.Vector3(0,vertical,0).applyQuaternion(parentQ);
  local.set(local.x/scale.x,local.y/scale.y,local.z/scale.z);
  // Reset to bind position every frame: no accumulated root drift.
  dst.node.position.copy(dst.localPosition).add(local);
  dst.node.updateMatrixWorld(true);
  return {applied:true,vertical,method:'world-up-hip-y/no-horizontal-root-motion'};
 }
 const api={apply,version:'78.0'};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashStudioHipBounce=api;
})(typeof window!=='undefined'?window:globalThis);
