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
 // One collision-clock plan for a single landing pose writer. The physics
 // surface contact is elapsed=0, not arbitrary Mixamo frame zero.
 function landingPlan(elapsed,impactSpeed){
  const t=clamp(elapsed,0,.48);
  const force=clamp((impactSpeed-4)/12,0,1);
  return Object.freeze({
   sourceTime:.30+(.28+.07*force)*smooth(t/.195),
   recover:smooth((t-.20)/.255),
   arms:smooth(t/.30),
   phase:t<.085?'contact':t<.22?'absorb':t<.455?'recover':'settled'
  });
 }
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
    maxWristExcursion:0,clipsUsed:[],launchLegs:[],launchCarry:0,
    jumpAge:0,launchSpeed:0,launchGait:'stationary',groundWasRun:false,
    restPose:[],landingRest:[],impactSpeed:0,contactSerial:0};
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
   st.launchLegs=[];st.launchCarry=0;st.jumpAge=0;
   st.launchSpeed=0;st.launchGait='stationary';st.groundWasRun=false;
   st.restPose=[];st.landingRest=[];st.impactSpeed=0;st.contactSerial=0;
   st.fingerNodes=[];st.fingerRest=[];
   for(const side of ['left','right'])for(const finger of FINGERS)
    for(const segment of SEGMENTS){
     const n=get(side+finger+segment);
     if(n){st.fingerNodes.push(n);st.fingerRest.push(n.quaternion.clone());}
    }
  }
  function begin(next,visible,fighter){
   const previous=st.phase;
   st.phase=next;st.elapsed=0;st.exitElapsed=0;
   // V103: a running takeoff MUST inherit the last actually displayed
   // walking/running stride. Never keep cycling walk/run legs while airborne.
   // Capture just once from ground -> jump; the fall phase keeps that
   // momentum context without grabbing the incoming fall clip as a new base.
   if(next==='jump'&&previous!=='jump'&&previous!=='fall'){
    const speed=Math.hypot(fighter.vel?.x||0,fighter.vel?.z||0);
    st.launchSpeed=speed;
    // V71 resets v80AnalogRun as soon as jumping=true. Read the last
    // confirmed GROUNDED gait instead of a flag already cleared by V71.
    st.launchGait=st.groundWasRun?'run':speed>1.3?'walk':'stationary';
    const amount=smooth((speed-1.3)/(6.2-1.3));
    st.launchCarry=speed>1.3?.15+.17*amount:0;
    st.launchLegs=st.launchCarry>0?
      visible.slice(14,20).map(q=>q.clone()):[];
    st.jumpAge=0;
   }
   if(next==='landing'){
    st.launchLegs=[];st.launchCarry=0;st.jumpAge=0;
    // Snapshot the last approved grounded stance, never an uncalibrated
    // local T-pose. The source landing clip cannot be trusted as an idle.
    st.landingRest=(st.restPose.length===BONES.length?
      st.restPose:visible).map(q=>q.clone());
    st.impactSpeed=Math.max(0,Number(fighter.v105ImpactSpeed)||0);
    st.contactSerial=fighter.v105ContactSerial||0;
    status.contactSerial=st.contactSerial;
    status.impactSpeed=st.impactSpeed;
   }
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
  function retarget(clip,seconds,weight,next,dt){
   const rig=st.rig,scene=rig.vrm.scene;
   clip.sample(seconds,st.samples,false);
   // One matrix-world refresh per frame, not once for each humanoid bone.
   scene.updateMatrixWorld(true);
   scene.getWorldQuaternion(qScene);
   const fromSide=new THREE.Vector3(clip.side[0],0,clip.side[1]).normalize();
   const cross=fromSide.z*st.side.x-fromSide.x*st.side.z;
   const dot=fromSide.x*st.side.x+fromSide.z*st.side.z;
   qSourceBasis.setFromAxisAngle(axisY,
     Math.atan2(cross,dot)+(clip.yaw||0)*Math.PI/180);
   qBasisInv.copy(qSourceBasis).invert();
   const wristLimit=.44;  // V100 rollback: recorded source with bounded wrists.
   // V101 opt-in: the UE5 jump moves BOTH arms straight forward. That is
   // authored in the clip, not a second animator overriding it. Keep
   // Kairo's last *approved* guard as the arm baseline and take only a
   // gentle fraction of the recorded counter-swing; the knees, hips,
   // torso and recorded jump timing are unchanged.
   const params=new URLSearchParams(root.location?.search||'');
   const compactArms=params.get('jumpArms')==='compact'&&
     (next==='jump'||next==='fall');
   // V102 isolated fix: the jump-up and falling-idle source clips disagree
   // about knee/ankle orientation at the apex. There is already exactly
   // one final VRM pose owner, but the source DISCONTINUITY still produces
   // a visible leg flick. Limit each visible bone's per-frame angular change
   // against the actual last displayed V100 pose, never the procedural rig
   // that gets rewritten beneath the final owner on every update.
   const steadyLegs=params.get('airLegs')==='steady'&&
     (next==='jump'||next==='fall');
   const contactLanding=params.get('landingLab')==='contact'&&next==='landing'&&
      st.landingRest.length===BONES.length;
   const contactPlan=contactLanding?landingPlan(st.elapsed,st.impactSpeed):null;
   if(contactPlan){
    status.landingPhase=contactPlan.phase;
    status.landingRecovery=Math.round(contactPlan.recover*100);
   }
   const carryJump=params.get('movingJump')==='carry'&&
     steadyLegs&&st.launchCarry>0&&st.launchLegs.length===6&&
     (next==='jump'||next==='fall');
   const armCap={6:.11,7:.17,8:.22,9:.085,10:.11,11:.17,12:.22,13:.085};
   status.armStyle=compactArms?'V101 compact guard':next==='landing'?
     contactLanding?'V105 recovery to approved guard':
     'V100 recorded landing':'V100 recorded jump/fall arms';
   for(let i=0;i<BONES.length;i++){
    const node=st.nodes[i];
    if(!node?.parent)continue;
    qMapped.copy(qSourceBasis).multiply(st.samples[i])
      .multiply(qBasisInv).normalize();
    qWanted.copy(qScene).multiply(qMapped).multiply(st.bind[i]).normalize();
    node.parent.getWorldQuaternion(qParent);
    qTarget.copy(qParent).invert().multiply(qWanted).normalize();
    // One physically readable airborne stance: elbows stay separated near
    // the ribs, wrists stay aligned with Kairo's existing fighting guard.
    // A ~18% recorded counter-swing prevents a frozen upper body without
    // allowing the clip's forward two-hand thrust.
    if(compactArms&&i>=6&&i<=13){
     const anchor=st.armAnchor[i],distance=anchor.angleTo(qTarget);
     const amount=Math.min(distance*.18,armCap[i]);
     if(distance>1e-5){
      qTmp.copy(qTarget);
      qTarget.copy(anchor).slerp(qTmp,amount/distance).normalize();
     }else qTarget.copy(anchor);
     status.maxJumpArmDeviation=Math.max(status.maxJumpArmDeviation||0,amount);
    // V100 rollback: the raw source arm motion remains available
    // simply by removing &jumpArms=compact from the test URL.
    }else if(next==='jump'||next==='fall'){
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
    if(carryJump&&i>=14){
     // Velocity-aware *static* launch-stride inheritance: ~15%-32% of
     // the last grounded leg pose, decreasing toward the apex/descent.
     // Preserves actual left/right lead leg from the approved V95 gait.
     // No synthetic stride loop, pelvis translation, or foot-direction
     // inversion (the V93 mistake) is introduced.
     const fade=1-.88*smooth((st.jumpAge-.10)/.70);
     const carry=st.launchCarry*fade;
     qTmp.copy(qTarget);
     qTarget.slerpQuaternions(qTmp,st.launchLegs[i-14],carry).normalize();
     status.movingJumpWeight=carry;
    }
    if(contactLanding){
     // Keep contact, absorption and recovery phases on ONE clock.
     const recover=contactPlan.recover;
     if(i>=6&&i<=13){
      // Do not reintroduce the old landing clip's wide, crossing arms.
      // Return from the visible airborne V101 guard into the V97 guard.
      const armRecover=contactPlan.arms;
      qTmp.copy(st.landingRest[i]);
      qTarget.slerp(qTmp,armRecover);
     }else{
      const foot=i===16||i===19;
      // At foot contact, ankles should be approximately planted; source
      // ankle flailing is attenuated while knees absorb the collision.
      const soleStability=foot?.70:0;
      const blendToRest=soleStability+(1-soleStability)*recover;
      qTmp.copy(st.landingRest[i]);
      qTarget.slerp(qTmp,blendToRest);
     }

    }
    if(contactLanding&&st.elapsed<.15){
     // Even a good contact recording can start far from the *actual*
     // last visible falling pose. Never let retargeting teleport a knee,
     // hip, ankle or shoulder on its first collision frame. Bound the
     // final local quaternion against V100's prior visible pose, and only
     // during the contact entry (not late recovery into approved idle).
     const maxStep=12*Math.max(0,dt);
     const delta=st.prev[i].angleTo(qTarget);
     if(delta>maxStep&&maxStep>0){
      qTmp.copy(qTarget);
      qTarget.copy(st.prev[i]).slerp(qTmp,maxStep/delta).normalize();
      status.landingJointClamps=(status.landingJointClamps||0)+1;
     }
    }
    if(steadyLegs&&i>=14){
     // Limit 180 deg/s thigh, 240 deg/s knee, 180 deg/s ankle. The
     // original clips still drive the targets, but cannot twitch across
     // a large frame-to-frame source difference. No physics/IK changes.
     const rate=i===15||i===18?4.19:3.14;
     const maxStep=Math.max(0,dt)*rate;
     const delta=st.prev[i].angleTo(qTarget);
     if(delta>maxStep&&maxStep>0){
      qTmp.copy(qTarget);
      qTarget.copy(st.prev[i]).slerp(qTmp,maxStep/delta).normalize();
      status.legStepClamps=(status.legStepClamps||0)+1;
     }
     const finalAngle=st.prev[i].angleTo(qTarget);
     status.maxLegStepDeg=Math.max(status.maxLegStepDeg||0,
       finalAngle*180/Math.PI);
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
     // A punch, guard, knockback, Boost or deliberate flight MUST take
     // authority immediately: don't keep blending the old jump over it.
     const interrupted=this.hp<=0||this.stun>0||this.downT>0||
       this.launched||this.spiked||this.punchT>0||this.blastT>0||
       this.superHitT>0||this.slamming||this.charging||
       this.blockHeld||this.blocking||this.dashing||this.sprinting||
       (this.acro&&this.acro.type!=='landing');
     if(interrupted){
      st.phase=null;st.wristAnchor=[];st.armAnchor=[];
      st.launchLegs=[];st.launchCarry=0;st.jumpAge=0;
      // The previous visible pose is now the interrupting combat/fly
      // controller, not the last V100 jumping frame.
      for(let i=0;i<BONES.length;i++)
       st.prev[i].copy(st.nodes[i].quaternion);
      status.active='yielded-to-combat-or-flight';return;
     }
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
      if(w>=1){st.phase=null;st.wristAnchor=[];st.armAnchor=[];
       st.launchLegs=[];st.launchCarry=0;st.jumpAge=0;}
     }else{
      status.active='grounded-owners-preserved';
      // Crucial for V102: V100 is still attached while the older approved
      // grounded idle/walk controllers run. Capture their LAST VISIBLE pose
      // every frame; otherwise st.prev remains the original rig setup pose
      // from the very first frame, causing a large leg snap at takeoff.
      for(let i=0;i<BONES.length;i++)
       st.prev[i].copy(st.nodes[i].quaternion);
      // Capture only a settled *approved* grounded stance. Never replace
      // it with a running stride, procedural airborne pose or impact.
      if(Math.hypot(this.vel?.x||0,this.vel?.z||0)<.35&&
         !(this.landingMotionT>0)&&!(this.jumping||this.flying)&&
         !(this.punchT>0||this.blockHeld||this.blocking||this.charging)&&
         this.hp>0){
        st.restPose=st.nodes.map(n=>n.quaternion.clone());
      }
      st.groundWasRun=!!this.v80AnalogRun&&!this.jumping&&!this.flying;
      status.movingJumpWeight=0;
     }
     return;
    }
    const visible=before||st.nodes.map(n=>n.quaternion.clone());
    if(st.phase!==state)begin(state,visible,this);
    st.elapsed+=safe;
    if(state==='jump'||state==='fall')st.jumpAge+=safe;
    const clips=root.SkyClashPublishedActions.motionClips;
    const contactLanding=new URLSearchParams(root.location?.search||'')
      .get('landingLab')==='contact'&&state==='landing'&&
      !!clips.fallingToLanding;
    const slot=contactLanding?'fallingToLanding':clipFor(state),clip=clips[slot];
    if(!clip)throw Error('V100 missing recorded pose '+slot);
    const seconds=contactLanding?
      // Collision contact is time=0. Use the authored planted-ankle and
      // knee-absorption section at its native 30 Hz sampling rate, without
      // compressing a 1.1s standing sequence into a 0.48s collision.
      landingPlan(st.elapsed,st.impactSpeed).sourceTime:
      state==='jump'?
      Math.min(clip.seconds*.96,st.elapsed*1.18):
      state==='fall'?
      Math.min(clip.seconds*.86,.05+st.elapsed*.91):
      // Source landing contains a proper knee fold and recovery; map to
      // the physics' 0.48s contact window without holding a frozen pose.
      clip.seconds*smooth(st.elapsed/.48);
    const blend=state==='jump'?.12:state==='fall'?.14:
      contactLanding?.085:.10;
    retarget(clip,seconds,smooth(st.elapsed/blend),state,safe);
    st.prev=st.nodes.map(n=>n.quaternion.clone());
    st.frames++;
    status.active=state;status.frames=st.frames;
    status.movingJump=new URLSearchParams(root.location?.search||'')
      .get('movingJump')==='carry'&&st.launchCarry>0&&
      (state==='jump'||state==='fall')?
      'V103 '+st.launchGait+' takeoff '+st.launchSpeed.toFixed(1):
      'V102 standing baseline';
    status.landingStyle=state==='landing'?
       contactLanding?'V105 contact / absorb / recover':'V100 recorded':
       'not-landing';
    status.legStyle=new URLSearchParams(root.location?.search||'')
      .get('airLegs')==='steady'&&(state==='jump'||state==='fall')?
      'V102 frame-bounded knees and ankles':state==='landing'?
      'V100 landing unchanged':'V100 recorded legs';
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
    owner:'none',frames:0,wristClamps:0,legStepClamps:0,maxLegStepDeg:0,
    landingStyle:'not-landing',landingPhase:'off',landingRecovery:0,
    impactSpeed:0,contactSerial:0,landingJointClamps:0,error:null};
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
 const api={version:100,BONES,clipFor,landingPlan,stateOf,ownsAir,attach,start};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV100Animator=api;
})(typeof window!=='undefined'?window:globalThis);
