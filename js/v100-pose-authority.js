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
 const clipFor=(state)=>state==='fall'?'fallingIdle':
   state==='prep'?'jump':state==='flight'?'floating':state;
 // V111: one continuous hover-to-travel state, rather than a hard cut
 // from 3.6s floating to 2.6s flying when speed crosses 3m/s.
 function flightWeight(speed){return smooth((Math.max(0,speed)-.7)/5.5);}
 function flightStep(current,target,dt){
  return current+(target-current)*(1-Math.exp(-clamp(dt,0,.065)*7));
 }
 // V113 flight poses come from the approved ground guard rather than
 // another recorded full-body source. Directional effort is a small,
 // continuous layer on top of a consistent neutral fighting silhouette.
 // Only the 'controlled' profile uses this: V111 recorded is still A/B.
 function controlledFlightPose(mix,vertical=0,lateral=0){
  const forward=smooth(clamp(mix,0,1));
  const ascend=smooth(clamp(vertical/7,0,1));
  const descend=smooth(clamp(-vertical/7,0,1));
  const side=clamp(lateral/6.2,-1,1);
  return {
   mix:forward,ascend,descend,
   hipsX:.045*forward-.025*ascend+.025*descend,
   spineX:.115*forward-.045*ascend+.035*descend,
   chestX:.055*forward-.035*ascend,
   neckX:-.065*forward+.018*ascend,
   spineZ:-.045*side*(.2+.8*forward),
   leftShoulderX:-.030-.035*forward,
   rightShoulderX:-.030-.035*forward,
   leftUpperArmX:.045+.075*forward,
   rightUpperArmX:.045+.075*forward,
   leftLowerArmX:-.055-.03*forward,
   rightLowerArmX:-.055-.03*forward,
   leftThighX:-.13*forward+.10*descend-.04*ascend,
   rightThighX:-.13*forward+.10*descend-.04*ascend,
   leftKneeX:.17+.08*forward+.10*descend-.08*ascend,
   rightKneeX:.17+.08*forward+.10*descend-.08*ascend,
   leftAnkleX:-.045*forward,
   rightAnkleX:-.045*forward
  };
 }
 // V110: source jump/fall clips have a different built-in yaw baseline
 // from the approved grounded pose. Their yaw accumulates along the
 // hips/spine/chest chain, making a straight jump appear sideways.
 // Decompose each joint into local-Y twist and its independent bend/lean.
 // Only restrict EXTRA axial twist relative to the actual takeoff pose;
 // fighter/model root yaw remains entirely controlled by gameplay.
 const airFacingCaps=[.035,.035,.035,.025,.035,.035];
 function axialTwist(THREE,q){
  const twist=new THREE.Quaternion(0,q.y,0,q.w);
  return twist.lengthSq()>1e-8?twist.normalize():new THREE.Quaternion();
 }
 function stabilizeFacing(THREE,target,grounded,maxYaw){
  const sourceTwist=axialTwist(THREE,target);
  const referenceTwist=axialTwist(THREE,grounded);
  const raw=referenceTwist.angleTo(sourceTwist);
  if(raw<=maxYaw)return {source:raw,residual:raw};
  // q = swing * twist. Preserve recorded flexion/extension (swing)
  // and retain the takeoff-facing yaw with at most a tiny natural turn.
  const swing=target.clone().multiply(sourceTwist.clone().invert());
  const restrained=referenceTwist.clone().slerp(sourceTwist,maxYaw/raw);
  target.copy(swing).multiply(restrained).normalize();
  return {source:raw,residual:referenceTwist.angleTo(restrained)};
 }
 // A deliberately modest pre-jump action. At 30–120 FPS the knee fold,
 // hip sink and forward weight shift are continuous, with no arm flourish.
 // Moving takeoffs use a shallower compression than stationary ones.
 function prepPose(age,speed,readable=false){
  const moving=clamp(speed/6.2,0,1);
  const push=readable==='push',expressive=!!readable;
  // V112: static jump gets a visible two-part load/release, but moving
  // takeoff stays quick. Original subtle/readable curves are untouched.
  const duration=push?.215-.10*moving:expressive?.140-.040*moving:.095;
  const t=clamp(age,0,duration);
  const extend=push?smooth((t-duration*.82)/(duration*.18)):0;
  const bend=smooth(t/(push?duration*.66:expressive?duration*.83:.080))*
    (1-(push?.22:expressive?.23:.36)*moving)*
    (1-.14*extend);
  // Real leg shortening matters more than an animated hip offset:
  // V106 keeps the shoes on the floor and cancels much of hipsY. Nearly
  // opposite thigh/shin pitches compress the leg vertically (~6cm) with
  // little horizontal ankle drift, producing a VISIBLE grounded load.
  const legBend=push?bend*(1-.42*moving):bend;
  return {
   bend,
   hipsY:-(push?.080:expressive?.055:.036)*bend,
   hipsX:(push?.070:expressive?.052:.036)*bend,
   thighX:push?-.43*legBend:-(expressive?.165:.105)*bend,
   kneeX:push?.82*legBend:(expressive?.285:.155)*bend,
   ankleX:push?-.085*legBend:-(expressive?.066:.038)*bend,
   spineX:(push?.162:expressive?.108:.074)*bend,
   chestX:(push?.100:expressive?.068:.048)*bend,
   neckX:-(push?.039:expressive?.028:.018)*bend,
   shoulderX:push?-.055*bend:0,
   upperArmX:push?.085*bend:0,
   extend,duration
  };
 }
 // V107 is a *small authored body-performance overlay*, not another clip.
 // Separate rise/float/brace envelopes keep energy continuous across the
 // jump -> fall sample switch, with the same physics and compact guard.
 function jumpExpression(age,speed){
  const t=clamp(age,0,1.0),run=clamp(speed/6.2,0,1);
  const launch=smooth(t/.065)*(1-smooth((t-.12)/.25));
  const float=smooth((t-.16)/.20)*(1-smooth((t-.46)/.17));
  const brace=smooth((t-.43)/.20)*(1-smooth((t-.74)/.16));
  return {
   hipsX:.078*launch-.053*brace,
   spineX:-.195*launch+.085*float+.135*brace,
   chestX:-.115*launch+.075*float+.090*brace,
   neckX:.040*launch-.030*brace,
   spineZ:.048*run*(launch-brace),
   chestY:.052*run*float,
   energy:launch+float*.5+brace*.85
  };
 }
 // Small IK support-foot correction for *moving* natural landings only.
 // Works after V106 vertical sole contact, without moving physics/root.
 function steadyLandingSupport(THREE,rig,anchor,strength,status,telemetry=true){
  if(!anchor||strength<=0)return;
  const hum=rig.vrm.humanoid,scene=rig.vrm.scene;
  const hip=hum.getNormalizedBoneNode(anchor.side+'UpperLeg');
  const knee=hum.getNormalizedBoneNode(anchor.side+'LowerLeg');
  const foot=hum.getNormalizedBoneNode(anchor.side+'Foot');
  if(!hip||!knee||!foot)return;
  const at=new THREE.Vector3(),end=new THREE.Vector3(),
   curr=new THREE.Vector3(),goal=new THREE.Vector3(),
   a=new THREE.Vector3(),b=new THREE.Vector3(),
   dq=new THREE.Quaternion(),pq=new THREE.Quaternion(),local=new THREE.Quaternion();
  scene.updateMatrixWorld(true);
  foot.getWorldPosition(end);
  goal.copy(anchor.point);goal.y=end.y;
  // Never stretch across a whole running stride; preserve responsive
  // horizontal movement and yield smoothly to V95's next ground step.
  goal.sub(end);goal.y=0;
  const raw=goal.length(),reach=.22*clamp(strength,0,1);
  if(raw>reach)goal.multiplyScalar(reach/raw);
  goal.add(end);
  for(let pass=0;pass<2;pass++)for(const joint of [knee,hip]){
   scene.updateMatrixWorld(true);
   joint.getWorldPosition(at);foot.getWorldPosition(end);
   a.subVectors(end,at);b.subVectors(goal,at);
   if(a.lengthSq()<1e-7||b.lengthSq()<1e-7)continue;
   a.normalize();b.normalize();
   const cos=clamp(a.dot(b),-1,1),angle=Math.acos(cos);
   if(angle<.0002)continue;
   const limit=(joint===hip?.105:.080)*clamp(strength,0,1);
   dq.identity().slerp(new THREE.Quaternion().setFromUnitVectors(a,b),
       Math.min(1,limit/angle));
   joint.parent.getWorldQuaternion(pq);
   local.copy(pq).invert().multiply(dq).multiply(pq);
   joint.quaternion.premultiply(local).normalize();
  }
  scene.updateMatrixWorld(true);
  foot.getWorldPosition(curr);
  const slip=Math.hypot(curr.x-anchor.point.x,curr.z-anchor.point.z);
  if(telemetry){
   status.movingFootSlipCm=+(slip*100).toFixed(1);
   status.movingFootPinFrames=(status.movingFootPinFrames||0)+1;
   status.movingFootPin=anchor.side+' support';
  }
  return slip;
 }
 // V106 sole alignment: measure the *already retargeted* visible VRM bones.
 // The older procedural ground solver runs before V100 and never sees these
 // final joint orientations. Floor contact must be evaluated last.
 const soleNames=['leftFoot','leftToes','rightFoot','rightToes'];
 const soleHeight=[.15,.07,.15,.07]; // ankle and toe joint -> visible shoe underside
 function soleGaps(THREE,rig,fighter){
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  scene.updateMatrixWorld(true);
  const ground=Number(fighter.floor);
  if(!Number.isFinite(ground))return [];
  const world=new THREE.Vector3(),gaps=[];
  for(let i=0;i<soleNames.length;i++){
   const node=hum.getNormalizedBoneNode(soleNames[i]);
   if(!node)continue;
   node.getWorldPosition(world);
   gaps.push({bone:soleNames[i],gap:world.y-ground-soleHeight[i]});
  }
  return gaps;
 }
 function plantVisibleSoles(THREE,rig,fighter,status){
  if(!rig?.vrm?.scene||!fighter||fighter.flying)return;
  const gaps=soleGaps(THREE,rig,fighter);
  if(!gaps.length)return;
  // Zero the lowest sole on the collision floor. Other foot may still be
  // briefly raised by its authored swing; never force a planted ankle
  // below the terrain just to make the other foot appear grounded.
  const minGap=Math.min(...gaps.map(x=>x.gap));
  const shift=clamp(-minGap,-1.2,1.2);
  rig.vrm.scene.position.y+=shift;
  rig.footLift=(rig.footLift||0)+shift;
  rig.vrm.scene.updateMatrixWorld(true);
  const result=soleGaps(THREE,rig,fighter);
  status.soleGapCm=+(Math.min(...result.map(x=>x.gap))*100).toFixed(1);
  status.otherSoleGapCm=+(Math.max(
   ...['left','right'].map(side=>{
    const values=result.filter(x=>x.bone.startsWith(side)).map(x=>x.gap);
    return values.length?Math.min(...values):0;
   }))*100).toFixed(1);
  status.soleLastShiftCm=+(shift*100).toFixed(1);
  status.soleCorrections=(status.soleCorrections||0)+1;
  status.soleContact=Math.abs(status.soleGapCm)<2?'PLANTED':'NEEDS ADJUSTMENT';
 }
 // One collision-clock plan for a single landing pose writer. The physics
 // surface contact is elapsed=0, not arbitrary Mixamo frame zero.
 function landingPlan(elapsed,impactSpeed,duration=.48){
  // Moving-only V109 runs this existing authored contact arc faster and
  // immediately returns control to the true running gait. V106 static
  // landing retains the exact original 480ms source timing.
  const t=clamp(elapsed,0,duration)*(.48/duration);
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
  if(f.v108JumpPrepT>0&&
     ['subtle','readable','push'].includes(
      new URLSearchParams(root.location?.search||'').get('jumpPrep'))&&
     !f.flying)return 'prep';
  if(f.landingMotionT>0&&!f.flying)return 'landing';
  if(f.dropping)return 'fall';
  if(f.jumping)return (f.vel?.y||0)<-1.1?'fall':'jump';
  if(new URLSearchParams(root.location?.search||'').get('flightLab')==='blend'&&
     f.flying&&!f.sprinting)return 'flight';
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
    restPose:[],landingRest:[],impactSpeed:0,contactSerial:0,
    landingSupport:null,prepBase:[],prepHipsY:0,prepSpeed:0,
    movingFlow:false,landingDuration:.48,airFacingPose:[],
    flightMix:0,flightSamples:[],prepLastHipY:null,pushReleaseHipY:null,
    prepFeet:[],prepHipsXZ:null,prepLastHipXZ:null,pushReleaseHipXZ:null};
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
   st.landingSupport=null;st.prepBase=[];st.prepHipsY=0;st.prepSpeed=0;
   st.movingFlow=false;st.landingDuration=.48;st.airFacingPose=[];
   st.flightMix=0;st.flightSamples=BONES.map(()=>new THREE.Quaternion());
   st.prepLastHipY=null;st.pushReleaseHipY=null;st.prepFeet=[];
   st.prepHipsXZ=null;st.prepLastHipXZ=null;st.pushReleaseHipXZ=null;
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
    st.pushReleaseHipY=previous==='prep'&&
      new URLSearchParams(root.location?.search||'').get('jumpPrep')==='push'?
      st.prepLastHipY:null;
    st.pushReleaseHipXZ=previous==='prep'&&
      new URLSearchParams(root.location?.search||'').get('jumpFeet')==='hold'?
      st.prepLastHipXZ:null;
    // The facing baseline is the last actually displayed PREP/ground
    // pose, not an arbitrary neutral VRM T-pose or Mixamo source yaw.
    st.airFacingPose=visible.slice(0,6).map(q=>q.clone());
   }
   if(next==='flight'){
    // Entry is last visible jump/hover pose, not the guide-rig T-pose.
    st.flightMix=flightWeight(Math.hypot(fighter.vel?.x||0,fighter.vel?.z||0));
    st.airFacingPose=visible.slice(0,6).map(q=>q.clone());
   }
   if(next==='prep'){
    st.prepBase=visible.map(q=>q.clone());
    st.prepHipsY=st.nodes[0].position.y;
    st.prepHipsXZ=st.nodes[0].position.clone();
    st.prepSpeed=Math.hypot(fighter.vel?.x||0,fighter.vel?.z||0);
    st.prepLastHipY=null;
    st.prepFeet=[];
    if(new URLSearchParams(root.location?.search||'').get('jumpPrep')==='push'){
     st.rig.vrm.scene.updateMatrixWorld(true);
     for(const side of ['left','right']){
      const shoe=st.rig.vrm.humanoid.getNormalizedBoneNode(side+'Foot');
      if(shoe)st.prepFeet.push({side,point:shoe.getWorldPosition(new THREE.Vector3())});
     }
    }
   }
   if(next==='landing'){
    st.launchLegs=[];st.launchCarry=0;st.jumpAge=0;
    st.airFacingPose=[];
    st.landingSupport=null;
    // Use the REAL measured horizontal collision speed, not the takeoff
    // gait flag that may have cleared during the fall.
    const flowFlag=new URLSearchParams(root.location?.search||'')
      .get('landingMove')==='flow';
    st.movingFlow=flowFlag&&(fighter.v109LandingSpeed||0)>1.3;
    st.landingDuration=st.movingFlow?
      Math.max(.17,Math.min(.28,fighter.v109LandingDuration||.205)):.48;
    status.landingDuration=st.landingDuration;
    status.landingFlow=st.movingFlow?'MOVING FLOW':'STATIC V106';
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
  function retarget(clip,seconds,weight,next,dt,flightSource=null){
   const rig=st.rig,scene=rig.vrm.scene;
   clip.sample(seconds,st.samples,next==='flight');
   if(next==='flight'&&flightSource){
    const phase=seconds/clip.seconds;
    flightSource.sample(phase*flightSource.seconds,st.flightSamples,true);
    for(let i=0;i<BONES.length;i++)
     st.samples[i].slerp(st.flightSamples[i],st.flightMix).normalize();
   }
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
   const contactPlan=contactLanding?
     landingPlan(st.elapsed,st.impactSpeed,st.landingDuration):null;
   if(contactPlan){
    status.landingPhase=contactPlan.phase;
    status.landingRecovery=Math.round(contactPlan.recover*100);
   }
   const controlled=next==='flight'&&
     params.get('flightLab')==='blend'&&
     params.get('flightStyle')==='controlled';
   const flightControl=controlled?controlledFlightPose(
     st.flightMix,f.vel?.y||0,f.moveIntent?.x||0):null;
   const expressive=params.get('jumpStyle')==='expressive'&&
     (next==='jump'||next==='fall');
   const performance=expressive?jumpExpression(st.jumpAge,st.launchSpeed):null;
   status.jumpExpression=expressive?+(performance.energy*100).toFixed(0):0;
   const facingLock=((params.get('jumpFacing')==='locked'&&
     (next==='jump'||next==='fall'))||
     (next==='flight'&&params.get('flightLab')==='blend'))&&
     st.airFacingPose.length===6;
   status.airFacingStyle=facingLock?
     next==='flight'?'V111 powered flight facing':'V110 takeoff-facing torso':
     'original recorded yaw';
   status.airFacingSourceYawDeg=0;status.airFacingDriftDeg=0;
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
    if(flightControl){
     // Use a fresh, authored controlled-flight pose based on the approved
     // recorded IDLE, not the disparate floating/flying clip rotations.
     // Retarget already computed all twenty nodes, but only this single
     // final pose pass is visible. No V72/V81 competing final writers.
     const p=flightControl;
     const angles={
      0:p.hipsX,1:p.spineX,2:p.chestX,4:p.neckX,
      6:p.leftShoulderX,7:p.leftUpperArmX,8:p.leftLowerArmX,
      10:p.rightShoulderX,11:p.rightUpperArmX,12:p.rightLowerArmX,
      14:p.leftThighX,15:p.leftKneeX,16:p.leftAnkleX,
      17:p.rightThighX,18:p.rightKneeX,19:p.rightAnkleX
     };
     const source=st.restPose.length===BONES.length?
       st.restPose:st.from;
     qTarget.copy(source[i]);
     const x=angles[i]||0,z=i===1?p.spineZ:0;
     if(x||z)qTarget.multiply(qTmp.setFromEuler(
       new THREE.Euler(x,0,z,'XYZ'))).normalize();
    }
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
    // V107 enriches the source torso's launch recoil, airborne reach and
    // descent brace; never touches approved legs or compact local guard.
    if(performance&&i<=5){
     // Hips must be adjusted LAST, after the six approved local leg
     // joints are retargeted. Otherwise their parent basis changes and
     // makes V102/V103 leg quaternions differ even with the same source.
     let x=i===1?performance.spineX:
       i===2?performance.chestX:i===4?performance.neckX:0;
     let z=i===1?performance.spineZ:0;
     let y=i===2?performance.chestY:0;
     if(x||y||z){
      qTmp.setFromEuler(new THREE.Euler(x,y,z,'XYZ'));
      qTarget.multiply(qTmp).normalize();
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
    if(next==='flight'){
     // Two different recorded loops may have different phases and lengths.
     // Cap the *visible* local joint travel on 30/60/120fps devices
     // without freezing the pose or delaying combat/Boost takeover.
     const maxStep=5.0*Math.max(0,dt);
     const delta=st.prev[i].angleTo(qTarget);
     if(delta>maxStep&&maxStep>0){
      qTmp.copy(qTarget);
      qTarget.copy(st.prev[i]).slerp(qTmp,maxStep/delta).normalize();
      status.flightJointClamps=(status.flightJointClamps||0)+1;
     }
     status.flightMaxStepDeg=Math.max(status.flightMaxStepDeg||0,
       st.prev[i].angleTo(qTarget)*180/Math.PI);
    }
    node.quaternion.copy(qTarget);
    node.updateMatrixWorld(true);
   }
   if(performance){
    const hips=st.nodes[0];
    qTmp.setFromAxisAngle(new THREE.Vector3(1,0,0),performance.hipsX);
    hips.quaternion.multiply(qTmp).normalize();
    hips.updateMatrixWorld(true);
   }
   if(facingLock){
    // Finish retargeting ALL 20 bones *before* correcting imported torso
    // yaw. Computing downstream joints under an already altered parent
    // would rewrite their original compact-guard and approved leg locals.
    // Instead, leave their source quaternions completely intact and
    // rotate only the six upper-body ancestors once at the final stage.
    // Legitimate player turns still come from the gameplay root transform.
    for(let i=0;i<6;i++){
     const bone=st.nodes[i];
     const correction=stabilizeFacing(THREE,bone.quaternion,
       st.airFacingPose[i],airFacingCaps[i]);
     bone.updateMatrixWorld(true);
     status.airFacingSourceYawDeg+=correction.source*180/Math.PI;
     status.airFacingDriftDeg+=correction.residual*180/Math.PI;
    }
   }
   // V73 natural VRoid hands are the only finger source in this state.
   // No V81 artificial Y-axis curl and no independent extra-action writer.
   for(let i=0;i<st.fingerNodes.length;i++)
    st.fingerNodes[i].quaternion.copy(st.fingerRest[i]);
   rig.vrm.update(0);
   if(next==='landing'&&params.get('landingLab')==='contact'&&
      params.get('landingFeet')==='plant'){
    plantVisibleSoles(THREE,rig,f,status);
    if((params.get('landingMove')==='pin'&&st.launchSpeed>1.3)||
       (params.get('landingMove')==='flow'&&st.movingFlow)){
     if(!st.landingSupport){
      // The support foot is whichever *visible* ankle/toe sole is closest
      // to the floor at the collision event. Never alternate arbitrarily.
      const gaps=soleGaps(THREE,rig,f);
      const source=gaps.reduce((best,x)=>!best||x.gap<best.gap?x:best,null);
      if(source){
       const side=source.bone.startsWith('left')?'left':'right';
       const foot=rig.vrm.humanoid.getNormalizedBoneNode(side+'Foot');
       if(foot)st.landingSupport={side,point:foot.getWorldPosition(new THREE.Vector3())};
      }
     }else{
      const strength=1-smooth((st.elapsed-.025)/
        (st.movingFlow?.105:.23));
      if(strength>.001){
       steadyLandingSupport(THREE,rig,st.landingSupport,strength,status);
       // IK may rotate toes downward. Apply V106 vertical support *last*.
       plantVisibleSoles(THREE,rig,f,status);
      }
     }
    }
   }
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
      st.airFacingPose=[];
      // The previous visible pose is now the interrupting combat/fly
      // controller, not the last V100 jumping frame.
      for(let i=0;i<BONES.length;i++)
       st.prev[i].copy(st.nodes[i].quaternion);
      status.active='yielded-to-combat-or-flight';return;
     }
     if(st.phase){
      st.exitElapsed+=safe;
      // Grounded idle/walk/run take over as soon as the foot has carried
      // the collision. The 170ms stationary crossfade is preserved.
      const duration=st.movingFlow&&st.phase==='landing'?.090:.17;
      const w=smooth(st.exitElapsed/duration);
      for(let i=0;i<BONES.length;i++){
       const n=st.nodes[i];if(!n)continue;
       qRaw.copy(n.quaternion);
       n.quaternion.slerpQuaternions(st.prev[i],qRaw,w).normalize();
       n.updateMatrixWorld(true);
      }
      st.rig.vrm.update(0);
      if(new URLSearchParams(root.location?.search||'').get('landingFeet')==='plant'&&
         st.phase==='landing')
       plantVisibleSoles(THREE,st.rig,this,status);
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
    if(state==='prep'){
     const duration=this.v108JumpPrepDuration||.095;
     const elapsed=clamp(duration-(this.v108JumpPrepT||0),0,duration);
     const profile=new URLSearchParams(root.location?.search||'')
       .get('jumpPrep');
     const readable=profile==='push'?'push':profile==='readable';
     const p=prepPose(elapsed,st.prepSpeed,readable);
     const rotX=new THREE.Quaternion(),xAxis=new THREE.Vector3(1,0,0);
     for(let i=0;i<BONES.length;i++){
      const n=st.nodes[i];
      n.quaternion.copy(st.prepBase[i]);
      const angle=i===0?p.hipsX:
       i===1?p.spineX:i===2?p.chestX:i===4?p.neckX:
       i===14||i===17?p.thighX:
       i===15||i===18?p.kneeX:
       i===16||i===19?p.ankleX:
       i===6||i===10?p.shoulderX:
       i===7||i===11?p.upperArmX:0;
      if(angle)n.quaternion.multiply(rotX.setFromAxisAngle(xAxis,angle)).normalize();
      n.updateMatrixWorld(true);
     }
     if(profile==='push'&&new URLSearchParams(root.location?.search||'')
       .get('jumpFeet')==='hold'&&st.prepHipsXZ){
      st.nodes[0].position.x=st.prepHipsXZ.x;
      st.nodes[0].position.z=st.prepHipsXZ.z;
     }
     st.nodes[0].position.y=st.prepHipsY+p.hipsY/(this.vrmRig.scale||1);
     st.prepLastHipY=st.nodes[0].position.y;
     this.vrmRig.vrm.update(0);
     if(profile==='push'){
      // Both shoes should stay exactly where they were when the boxer
      // loaded weight. Knee flex alone can drift the VRM ankles sideways
      // because the original approved pose is not a perfect neutral bind.
      // Very small post-pose two-joint IK brings them back without
      // touching horizontal gameplay motion, as during moving landing.
      let largest=0;
      for(const anchor of st.prepFeet){
       const slip=steadyLandingSupport(THREE,this.vrmRig,anchor,1,status,false);
       if(Number.isFinite(slip))largest=Math.max(largest,slip);
      }
      if(new URLSearchParams(root.location?.search||'')
        .get('jumpFeet')==='hold'&&st.prepFeet.length){
       // World-space dual-foot correction: the approved leg fold
       // may move both ankles together despite two-joint IK.
       // Translate only the VISUAL pelvis within 10cm so the average
       // shoe position remains anchored; gameplay/root never moves.
       const shift=new THREE.Vector3(),pos=new THREE.Vector3(),
         inverse=new THREE.Quaternion();
       let hits=0;
       this.vrmRig.vrm.scene.updateMatrixWorld(true);
       for(const anchor of st.prepFeet){
        const shoe=this.vrmRig.vrm.humanoid.getNormalizedBoneNode(
          anchor.side+'Foot');
        if(!shoe)continue;
        shoe.getWorldPosition(pos);
        shift.x+=anchor.point.x-pos.x;
        shift.z+=anchor.point.z-pos.z;
        hits++;
       }
       if(hits){
        shift.multiplyScalar(1/hits);
        shift.clampLength(0,.11);
        st.nodes[0].parent.getWorldQuaternion(inverse);
        shift.applyQuaternion(inverse.invert());
        st.nodes[0].position.x+=shift.x;
        st.nodes[0].position.z+=shift.z;
       }
       this.vrmRig.vrm.scene.updateMatrixWorld(true);
       let worst=0;
       for(const anchor of st.prepFeet){
        const shoe=this.vrmRig.vrm.humanoid.getNormalizedBoneNode(
          anchor.side+'Foot');
        if(!shoe)continue;
        shoe.getWorldPosition(pos);
        worst=Math.max(worst,
          Math.hypot(anchor.point.x-pos.x,anchor.point.z-pos.z));
       }
       status.prepFootSlipCm=+(worst*100).toFixed(1);
       st.prepLastHipXZ=st.nodes[0].position.clone();
      }else status.prepFootSlipCm=+(largest*100).toFixed(1);
      this.vrmRig.vrm.update(0);
     }
     // The normal pre-recording floor solver is bypassed in this 95ms
     // interval; correct visible shoes AFTER the final crouched pose.
     plantVisibleSoles(THREE,this.vrmRig,this,status);
     for(let i=0;i<BONES.length;i++)
      st.prev[i].copy(st.nodes[i].quaternion);
     status.active='prep';status.jumpPrep=Math.round(p.bend*100);
     status.pushExtension=Math.round(p.extend*100);
     status.pushDurationMs=Math.round(p.duration*1000);
     status.frames=++st.frames;
     return;
    }
    if(state==='jump'||state==='fall')st.jumpAge+=safe;
    const clips=root.SkyClashPublishedActions.motionClips;
    if(state==='flight'){
     const speed=Math.hypot(this.vel?.x||0,this.vel?.z||0);
     st.flightMix=flightStep(st.flightMix,flightWeight(speed),safe);
     status.flightStyle=new URLSearchParams(root.location?.search||'')
       .get('flightStyle')==='controlled'?
       'V113 authored controlled':'V111 continuous hover / travel';
     status.flightSpeed=+speed.toFixed(2);
     status.flightBlend=Math.round(st.flightMix*100);
    }
    const contactLanding=new URLSearchParams(root.location?.search||'')
      .get('landingLab')==='contact'&&state==='landing'&&
      !!clips.fallingToLanding;
    const slot=contactLanding?'fallingToLanding':clipFor(state),clip=clips[slot];
    if(!clip)throw Error('V100 missing recorded pose '+slot);
    const seconds=contactLanding?
      // Collision contact is time=0. Use the authored planted-ankle and
      // knee-absorption section at its native 30 Hz sampling rate, without
      // compressing a 1.1s standing sequence into a 0.48s collision.
      landingPlan(st.elapsed,st.impactSpeed,st.landingDuration).sourceTime:
      state==='flight'?
      (st.elapsed%clip.seconds):
      state==='jump'?
      Math.min(clip.seconds*.96,st.elapsed*1.18):
      state==='fall'?
      Math.min(clip.seconds*.86,.05+st.elapsed*.91):
      // Source landing contains a proper knee fold and recovery; map to
      // the physics' 0.48s contact window without holding a frozen pose.
      clip.seconds*smooth(st.elapsed/.48);
    const blend=state==='jump'?.12:state==='fall'?.14:
      state==='flight'?.22:
      contactLanding?(st.movingFlow?.055:.085):.10;
    retarget(clip,seconds,smooth(st.elapsed/blend),state,safe,
      state==='flight'?clips.flying:null);
    if(state==='jump'&&st.pushReleaseHipY!==null){
     // Release the actual planted crouch into vertical takeoff, instead
     // of popping back to procedural idle hip height on frame one.
     const hips=st.nodes[0],neutral=hips.position.y;
     const w=smooth(st.elapsed/.12);
     hips.position.y=st.pushReleaseHipY+(neutral-st.pushReleaseHipY)*w;
     if(st.pushReleaseHipXZ){
      hips.position.x=st.pushReleaseHipXZ.x+
        (hips.position.x-st.pushReleaseHipXZ.x)*w;
      hips.position.z=st.pushReleaseHipXZ.z+
        (hips.position.z-st.pushReleaseHipXZ.z)*w;
     }
     hips.updateMatrixWorld(true);
     status.pushRelease=Math.round(w*100);
     if(st.elapsed>=.12){st.pushReleaseHipY=null;st.pushReleaseHipXZ=null;}
    }
    st.prev=st.nodes.map(n=>n.quaternion.clone());
    st.frames++;
    status.active=state;status.frames=st.frames;
    status.movingJump=new URLSearchParams(root.location?.search||'')
      .get('movingJump')==='carry'&&st.launchCarry>0&&
      (state==='jump'||state==='fall')?
      'V103 '+st.launchGait+' takeoff '+st.launchSpeed.toFixed(1):
      'V102 standing baseline';
    status.landingStyle=state==='landing'?
       contactLanding?(st.movingFlow?'V109 short step handoff':
        'V105 contact / absorb / recover'):'V100 recorded':
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
    impactSpeed:0,contactSerial:0,landingJointClamps:0,
    jumpExpression:0,jumpPrep:0,pushExtension:0,pushDurationMs:0,
    prepFootSlipCm:0,
    pushRelease:0,flightStyle:'legacy switch',
    flightSpeed:0,flightBlend:0,flightJointClamps:0,
    flightMaxStepDeg:0,airFacingStyle:'original recorded yaw',
    airFacingSourceYawDeg:0,airFacingDriftDeg:0,landingDuration:.48,
    landingFlow:'STATIC V106',movingFootPin:'off',movingFootSlipCm:0,
    movingFootPinFrames:0,
    soleGapCm:null,otherSoleGapCm:null,soleLastShiftCm:0,
    soleCorrections:0,soleContact:'not-tested',error:null};
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
 const api={version:100,BONES,clipFor,flightWeight,flightStep,controlledFlightPose,
    prepPose,landingPlan,jumpExpression,
    axialTwist,stabilizeFacing,steadyLandingSupport,
    soleGaps,plantVisibleSoles,stateOf,ownsAir,attach,start};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV100Animator=api;
})(typeof window!=='undefined'?window:globalThis);
