/* Sky Clash V100 — one final VRM pose authority for natural jumps.
 * Opt-in ?animator=unified. Physics and all approved grounded states stay
 * unchanged. While an ordinary jump/fall/landing is active, V71/V76/V72/
 * V79/V81 MUST yield: only this module writes the final recorded pose.
 *
 * This is the first scope of a unified animator, not a claim that all
 * grounded/combat states have already been consolidated.
 */
(function(root){
 'use strict';
 const BONES=['hips','spine','chest','upperChest','neck','head',
  'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
  'leftUpperLeg','leftLowerLeg','leftFoot',
  'rightUpperLeg','rightLowerLeg','rightFoot'];
 const FINGERS=['Index','Middle','Ring','Little'];
 const SEGMENTS=['Proximal','Intermediate','Distal'];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
 const clipFor=(state)=>state==='fall'?'fallingIdle':state;
 function stateOf(f){
  if(!f||f.hp<=0||f.launched||f.spiked||f.downT>0||
     f.stun>0||f.superHitT>0||f.punchT>0||f.blastT>0||
     f.slamming||f.charging||f.blockHeld||f.blocking||
     f.dashing||f.sprinting||(f.acro&&f.acro.type!=='landing'))
   return null;
  if(f.landingMotionT>0&&!f.flying)return 'landing';
  if(f.dropping)return 'fall';
  if(f.jumping)return (f.vel?.y||0)<-1.1?'fall':'jump';
  return null; // A height-based 'flying' getter is NOT a jump state.
 }
 function isPreview(context=root){
  return new URLSearchParams(context.location?.search||'').get('animator')==='unified';
 }
 function ownsAir(f,context=root){
  const clips=context.SkyClashPublishedActions?.motionClips;
  const phase=stateOf(f);
  return isPreview(context)&&
   f===context.SkyClash?.Game?.heroes?.kairo_venn&&
   !!phase&&!!clips?.[clipFor(phase)]&&
   !!context.SkyClashPoseAuthority?.ready;
 }
 function attach(THREE,f,status){
  if(!f||typeof f.animate!=='function'||f.v100PoseAuthority)return null;
  const old=f.animate;
  const st={rig:null,nodes:[],bind:[],side:null,phase:null,elapsed:0,
    exitElapsed:0,frames:0,prev:[],from:[],samples:[],
    wristAnchor:[],armAnchor:[],fingerNodes:[],fingerRest:[],
    maxWristExcursion:0,clipsUsed:[]};
  const qScene=new THREE.Quaternion(),qInvScene=new THREE.Quaternion(),
    qParent=new THREE.Quaternion(),qWanted=new THREE.Quaternion(),
    qTarget=new THREE.Quaternion(),qMapped=new THREE.Quaternion(),
    qSourceBasis=new THREE.Quaternion(),qBasisInv=new THREE.Quaternion(),
    qRaw=new THREE.Quaternion(),qTmp=new THREE.Quaternion(),
    axisY=new THREE.Vector3(0,1,0);
  function capture(rig){
   const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
   const get=n=>hum.getNormalizedBoneNode(n);
   const nodes=BONES.map(get);
   if(nodes.some(n=>!n))throw Error('V100 requires Kairo\'s complete 20-bone normalized humanoid');
   const saved=nodes.map(n=>n.quaternion.clone());
   nodes.forEach(n=>n.quaternion.identity());
   scene.updateMatrixWorld(true);
   scene.getWorldQuaternion(qInvScene).invert();
   const bind=nodes.map(n=>qInvScene.clone().multiply(
     n.getWorldQuaternion(new THREE.Quaternion())).normalize());
   const side=get('leftUpperArm').getWorldPosition(new THREE.Vector3())
    .sub(get('rightUpperArm').getWorldPosition(new THREE.Vector3()))
    .applyQuaternion(qInvScene);
   side.y=0;side.normalize();
   if(side.lengthSq()<.1)throw Error('V100 cannot determine Kairo shoulder facing');
   nodes.forEach((n,i)=>n.quaternion.copy(saved[i]));
   scene.updateMatrixWorld(true);
   st.rig=rig;st.nodes=nodes;st.bind=bind;st.side=side;
   st.samples=nodes.map(()=>new THREE.Quaternion());
   st.prev=nodes.map(n=>n.quaternion.clone());
   st.from=nodes.map(n=>n.quaternion.clone());
   st.phase=null;st.elapsed=0;st.exitElapsed=0;
   st.fingerNodes=[];st.fingerRest=[];
   for(const side of ['left','right'])for(const finger of FINGERS)
    for(const segment of SEGMENTS){
     const n=get(side+finger+segment);
     if(n){st.fingerNodes.push(n);st.fingerRest.push(n.quaternion.clone());}
    }
  }
  function begin(next,visible){
   st.phase=next;st.elapsed=0;st.exitElapsed=0;
   for(let i=0;i<BONES.length;i++)st.from[i].copy(visible[i]);
   // Keep the first grounded wrist/arm stance for the whole airborne arc.
   // A jump->fall phase change does not arbitrarily recapture the wrist.
   if(next==='jump'||next==='fall'){
    if(!st.wristAnchor.length){
     st.wristAnchor=[visible[9].clone(),visible[13].clone()];
     st.armAnchor=BONES.map((_,i)=>visible[i].clone());
    }
   }else{
    st.wristAnchor=[];st.armAnchor=[];
   }
  }
  function retarget(clip,seconds,weight,next){
   const rig=st.rig,scene=rig.vrm.scene;
   clip.sample(seconds,st.samples,false);
   const fromSide=new THREE.Vector3(clip.side[0],0,clip.side[1]).normalize();
   const cross=fromSide.z*st.side.x-fromSide.x*st.side.z;
   const dot=fromSide.x*st.side.x+fromSide.z*st.side.z;
   qSourceBasis.setFromAxisAngle(axisY,
     Math.atan2(cross,dot)+(clip.yaw||0)*Math.PI/180);
   qBasisInv.copy(qSourceBasis).invert();
   const wristLimit=.44;  // Local wrist bend relative to last visible fighting pose.
   for(let i=0;i<BONES.length;i++){
    const node=st.nodes[i];
    if(!node?.parent)continue;
    scene.updateMatrixWorld(true);
    scene.getWorldQuaternion(qScene);
    qMapped.copy(qSourceBasis).multiply(st.samples[i])
      .multiply(qBasisInv).normalize();
    qWanted.copy(qScene).multiply(qMapped).multiply(st.bind[i]).normalize();
    node.parent.getWorldQuaternion(qParent);
    qTarget.copy(qParent).invert().multiply(qWanted).normalize();
    // Never recreate the double-writer's extreme wrists or cross-body
    // elbows while following the *actual* UE5 source jump keyframes.
    if(next==='jump'||next==='fall'){
     const anchor=(i===9?st.wristAnchor[0]:i===13?st.wristAnchor[1]:
       [6,7,8,10,11,12].includes(i)?st.armAnchor[i]:null);
     const bound=i===9||i===13?wristLimit:1.34;
     if(anchor){
      const delta=anchor.angleTo(qTarget);
      if(delta>bound){
       qTmp.copy(qTarget);
       qTarget.copy(anchor).slerp(qTmp,bound/delta).normalize();
       if(i===9||i===13)status.wristClamps=(status.wristClamps||0)+1;
      }
      if(i===9||i===13)
       st.maxWristExcursion=Math.max(st.maxWristExcursion,anchor.angleTo(qTarget));
     }
    }
    // V94's receiver/target alias is never used here.
    if(weight<1){
     qRaw.copy(qTarget);
     qTarget.slerpQuaternions(st.from[i],qRaw,weight).normalize();
    }
    node.quaternion.copy(qTarget);
    node.updateMatrixWorld(true);
   }
   // V73 natural VRoid hands are the only finger source in this state.
   // No V81 artificial Y-axis curl and no independent extra-action writer.
   for(let i=0;i<st.fingerNodes.length;i++)
    st.fingerNodes[i].quaternion.copy(st.fingerRest[i]);
   rig.vrm.update(0);
  }
  f.animate=function(dt){
   const safe=clamp(Number.isFinite(dt)?dt:0,0,.065);
   const before=st.rig===this.vrmRig&&st.nodes.length?
    st.nodes.map(n=>n.quaternion.clone()):null;
   old.call(this,dt);
   if(!this.vrmRig?.vrm)return;
   try{
    if(st.rig!==this.vrmRig)capture(this.vrmRig);
    const state=ownsAir(this)?stateOf(this):null;
    if(!state){
     if(st.phase){
      st.exitElapsed+=safe;
      const w=smooth(st.exitElapsed/.17);
      for(let i=0;i<BONES.length;i++){
       const n=st.nodes[i];if(!n)continue;
       qRaw.copy(n.quaternion);
       n.quaternion.slerpQuaternions(st.prev[i],qRaw,w).normalize();
       n.updateMatrixWorld(true);
      }
      st.rig.vrm.update(0);
      status.active=w>=1?'grounded-owner':'return-to-ground';
      if(w>=1){st.phase=null;st.wristAnchor=[];st.armAnchor=[];}
     }else status.active='grounded-owners-preserved';
     return;
    }
    const visible=before||st.nodes.map(n=>n.quaternion.clone());
    if(st.phase!==state)begin(state,visible);
    st.elapsed+=safe;
    const clips=root.SkyClashPublishedActions.motionClips;
    const slot=clipFor(state),clip=clips[slot];
    if(!clip)throw Error('V100 missing recorded pose '+slot);
    const seconds=state==='jump'?
      Math.min(clip.seconds*.96,st.elapsed*1.18):
      state==='fall'?
      Math.min(clip.seconds*.86,.05+st.elapsed*.91):
      // Source landing contains a proper knee fold and recovery; map to
      // the physics' 0.48s contact window without holding a frozen pose.
      clip.seconds*smooth(st.elapsed/.48);
    const blend=state==='jump'?.12:state==='fall'?.14:.10;
    retarget(clip,seconds,smooth(st.elapsed/blend),state);
    st.prev=st.nodes.map(n=>n.quaternion.clone());
    st.frames++;
    status.active=state;status.frames=st.frames;
    status.owner='V100 single recorded '+slot+' pose';
    if(!st.clipsUsed.includes(slot))st.clipsUsed.push(slot);
    status.clipsUsed=st.clipsUsed.slice();
    status.maxWristExcursion=st.maxWristExcursion;
   }catch(err){
    status.error=String(err);status.ready=false;status.active='fallback';
    console.warn('V100 air authority failed; restore legacy motion wrappers',err);
    f.animate=old;f.v100PoseAuthority=null;
   }
  };
  f.v100PoseAuthority=st;
  return st;
 }
 function start(context=root){
  const status={version:100,ready:false,active:'not-installed',
    owner:'none',frames:0,wristClamps:0,error:null};
  context.SkyClashPoseAuthority=status;
  // Install only after V71/V76/V72/V79/V81/V89 have finished attaching.
  // Every lower recorded motion wrapper checks ownsAir() and yields.
  const f=context.SkyClash?.Game?.heroes?.kairo_venn;
  const clips=context.SkyClashPublishedActions?.motionClips;
  if(!isPreview(context)||!f||!context.THREE||
    !clips?.jump||!clips?.fallingIdle||!clips?.landing){
   status.active='not-ready';return status;
  }
  status.ready=true;
  if(!attach(context.THREE,f,status)){
   status.ready=false;status.active='not-attached';return status;
  }
  status.active='grounded-owners-preserved';
  return status;
 }
 const api={version:100,BONES,clipFor,stateOf,ownsAir,attach,start};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV100Animator=api;
})(typeof window!=='undefined'?window:globalThis);
