/* V67: Boy TBB / VRoid VRM0 hands.
 * The VRoid fingers grow along +/-X in the source bind pose, not +/-Y.
 * Bend them about their local Y axes toward the native front (-Z), and
 * counter-turn the resting wrists so the knuckles face forward during
 * Sky Clash's procedural guard instead of pointing at the ground/back.
 * Deliberately NOT applied to Rin or VRM1 models.
 */
(function(root){
 'use strict';
 const VERSION='67.0';
 const CURLS={Proximal:1.12,Intermediate:1.20,Distal:.55};
 function configure(THREE, bone){
  if(!THREE?.Quaternion||typeof bone!=='function')throw Error('VRM0 hand pose needs Three.js and humanoid bone lookup');
  const Y=new THREE.Vector3(0,1,0);
  let applied=0;
  for(const side of ['left','right']){
   // Boy TBB source VRM0: left fingers point -X, right fingers +X,
   // while the model's FRONT is -Z. This mirror sign folds both forward.
   const sign=side==='left'?-1:1;
   for(const finger of ['Index','Middle','Ring','Little']){
    for(const [segment,angle] of Object.entries(CURLS)){
     const n=bone(side+finger+segment);
     if(!n)continue;
     n.quaternion.setFromAxisAngle(Y,sign*angle);
     applied++;
    }
   }
   // Unlike the earlier generic setup, preserve VRoid's own natural thumb
   // bone rotations. Piling forced thumb twists on a native VRM0 hand makes
   // it cross behind the palm.
   for(const part of ['ThumbMetacarpal','ThumbProximal','ThumbIntermediate','ThumbDistal']){
    const n=bone(side+part);
    if(n){n.quaternion.identity();applied++;}
   }
  }
  return {
   version:VERSION,applied,
   left:new THREE.Quaternion().setFromAxisAngle(Y,-Math.PI/2),
   right:new THREE.Quaternion().setFromAxisAngle(Y,Math.PI/2)
  };
 }
 const api={configure,version:VERSION};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashVRM0Hands=api;
})(typeof window!=='undefined'?window:globalThis);
