/* Sky Clash V93 — one writer for grounded Kairo idle/walk/run poses.
 * Activated ONLY via ?movementLab=step&stance=single.
 *
 * Older V71, V76 and V72 locomotion layers all drove the same VRM
 * skeleton and exposed mismatched arms when their thresholds changed.
 * V93 retargets approved idle, walk legs, walk arms and approved run
 * together on ONE clocked track, ONE normalized humanoid, ONE crossfade.
 * Physics + V89 first-step/stance-foot correction retain ownership of
 * position and initial contact; Boost, guard, strikes, jump and air bypass.
 */
(function(root){
 'use strict';
 const BONES=['hips','spine','chest','upperChest','neck','head',
  'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
  'leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot'];
 const LEG=['leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot'];
 const ARMS=['leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand'];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function smoothWeight(x){return x*x*(3-2*x);}
 function nextWeight(now,to,dt,time){return now+(to-now)*(1-Math.exp(-dt/time));}
 function eligibility(f){
  return !!(f&&f.hp>0&&!f.jumping&&!f.flying&&!f.dropping&&
   !f.launched&&!f.spiked&&!f.dashing&&!f.sprinting&&
   !f.blockHeld&&!f.blocking&&!f.charging&&!f.slamming&&
   !(f.stun>0)&&!(f.downT>0)&&!(f.punchT>0)&&
   !(f.blastT>0)&&!(f.superHitT>0)&&
   !(f.landingMotionT>0)&&
   !(f.acro&&f.acro.type!=='landing'));
 }
 function computeBlend(THREE,idleQ,walkQ,runQ,walkWeight,runWeight){
  const out=idleQ.clone();
  out.slerp(walkQ,clamp(walkWeight,0,1));
  out.slerp(runQ,clamp(runWeight,0,1));
  return out.normalize();
 }
 function attach(THREE,f,clips,status){
  if(!f||typeof f.animate!=='function'||f.v93SingleLocomotion)return null;
  const old=f.animate;
  const st={rig:null,nodes:[],bind:[],targetSide:new THREE.Vector3(),
   idleClock:0,walkClock:0,runClock:0,walkWeight:0,runWeight:0,
   fade:0,frames:0,active:'waiting',error:null,
   // Align source walk arms to APPROVED idle at their first frame. The
   // two FBX clips have different starting limb orientations; raw blends
   // can cross a 180-degree quaternion hemisphere and flip the elbow.
   armOffsets:ARMS.map(()=>new THREE.Quaternion()),
   idle:BONES.map(()=>new THREE.Quaternion()),
   run:BONES.map(()=>new THREE.Quaternion()),
   legs:['hips',...LEG].map(()=>new THREE.Quaternion()),
   arms:ARMS.map(()=>new THREE.Quaternion())};
  const yaw=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI),
   unit=new THREE.Quaternion(),sceneQ=new THREE.Quaternion(),
   invScene=new THREE.Quaternion(),basisIdle=new THREE.Quaternion(),
   basisRun=new THREE.Quaternion(),inverseIdle=new THREE.Quaternion(),
   inverseRun=new THREE.Quaternion(),inverseWalk=new THREE.Quaternion(),
   wantedWorld=new THREE.Quaternion(),mapped=new THREE.Quaternion(),
   gaitDelta=new THREE.Quaternion(),tmp=new THREE.Quaternion(),
   desired=new THREE.Quaternion(),parentQ=new THREE.Quaternion();
  function capture(rig){
   const scene=rig.vrm.scene,h=rig.vrm.humanoid;
   st.nodes=BONES.map(name=>h.getNormalizedBoneNode(name));
   if(st.nodes.some(n=>!n))throw Error('V93 needs a complete VRM humanoid');
   const saved=st.nodes.map(n=>n.quaternion.clone());
   for(const n of st.nodes)n.quaternion.identity();
   scene.updateMatrixWorld(true);
   scene.getWorldQuaternion(invScene).invert();
   st.bind=st.nodes.map(n=>invScene.clone().multiply(
    n.getWorldQuaternion(new THREE.Quaternion())).normalize());
   const left=h.getNormalizedBoneNode('leftUpperArm').getWorldPosition(new THREE.Vector3());
   const right=h.getNormalizedBoneNode('rightUpperArm').getWorldPosition(new THREE.Vector3());
   st.targetSide.copy(left.sub(right).applyQuaternion(invScene)).setY(0).normalize();
   for(let i=0;i<st.nodes.length;i++)st.nodes[i].quaternion.copy(saved[i]);
   scene.updateMatrixWorld(true);
   const sideBasis=(entry,out,inverse)=>{
    const src=new THREE.Vector3(entry.side[0],0,entry.side[1]).normalize();
    const dst=st.targetSide;
    const cross=src.z*dst.x-src.x*dst.z;
    const dot=src.x*dst.x+src.z*dst.z;
    out.setFromAxisAngle(new THREE.Vector3(0,1,0),
     Math.atan2(cross,dot)+(entry.yaw||0)*Math.PI/180);
    inverse.copy(out).invert();
   };
   sideBasis(clips.idle,basisIdle,inverseIdle);
   sideBasis(clips.run,basisRun,inverseRun);
   const firstIdle=BONES.map(()=>new THREE.Quaternion());
   const firstArms=ARMS.map(()=>new THREE.Quaternion());
   clips.idle.sample(0,firstIdle,true);
   clips.arms.sample(0,firstArms);
   const walkBasis=rig.legacyAxes?yaw:unit,invW=walkBasis.clone().invert();
   for(let j=0;j<ARMS.length;j++){
    const idx=BONES.indexOf(ARMS[j]);
    const idleStart=basisIdle.clone().multiply(firstIdle[idx])
     .multiply(inverseIdle).normalize();
    const sourceStart=walkBasis.clone().multiply(firstArms[j])
     .multiply(invW).normalize();
    st.armOffsets[j].copy(idleStart)
     .multiply(sourceStart.invert()).normalize();
   }
   st.rig=rig;st.fade=0;st.walkWeight=0;st.runWeight=0;
  }
  f.animate=function(dt){
   old.call(this,dt);
   const rig=this.vrmRig;
   if(!rig?.vrm)return;
   if(!eligibility(this)){
    // Never mask a strike, hit, Boost release, jump, guard or landing.
    st.fade=0;st.active='other-action';
    return;
   }
   try{
    if(st.rig!==rig)capture(rig);
    const safe=clamp(Number.isFinite(dt)?dt:0,0,.065);
    const step=this.v89Step;
    const speed=Math.hypot(this.vel?.x||0,this.vel?.z||0);
    const moving=(Math.hypot(this.moveIntent?.x||0,this.moveIntent?.z||0)>.07||
      speed>.48);
    let aimWalk=0;
    if(moving){
     if(step?.mode==='anticipate'||step?.mode==='idle')aimWalk=0;
     else if(step?.mode==='first-step')
      aimWalk=clamp(step.scale||0,0,1);
     else if(step?.mode==='settle')
      aimWalk=clamp(speed/3.4,0,1);
     else aimWalk=1;
    }
    // One body track: arms and legs share the same grounded gait weight.
    // Returning to standing is timed by physics, not separate clip states.
    st.walkWeight=nextWeight(st.walkWeight,aimWalk,safe,.125);
    const wantRun=this.v93AnalogRun&&moving&&speed>1.3&&
      (!step||['walk','first-step'].includes(step.mode));
    st.runWeight=nextWeight(st.runWeight,wantRun?1:0,safe,.21);
    // V89 first-step keeps feet planted while position begins slowly.
    st.fade=nextWeight(st.fade,1,safe,.10);
    st.idleClock+=safe;
    if(moving&&step?.mode!=='anticipate'){
     st.walkClock+=safe*clamp(speed/2.55,.6,2.85);
     st.runClock+=safe*clamp(speed/5.6,.75,1.45);
    }
    clips.idle.sample(st.idleClock,st.idle,true);
    clips.run.sample(st.runClock,st.run,true);
    clips.legs.sample(st.walkClock,st.legs);
    clips.arms.sample(st.walkClock,st.arms);
    const scene=rig.vrm.scene;
    scene.updateMatrixWorld(true);scene.getWorldQuaternion(sceneQ);
    const walkBasis=rig.legacyAxes?yaw:unit;
    inverseWalk.copy(walkBasis).invert();
    for(let i=0;i<BONES.length;i++){
     const bone=st.nodes[i];if(!bone?.parent)continue;
     const idle=st.idle[i],run=st.run[i];
     const li=LEG.indexOf(BONES[i]),ai=ARMS.indexOf(BONES[i]);
     const walk=li>=0?st.legs[li+1]:ai>=0?st.arms[ai]:idle;
     mapped.copy(basisIdle).multiply(idle).multiply(inverseIdle).normalize();
     if(li>=0||ai>=0){
      gaitDelta.copy(walkBasis).multiply(walk).multiply(inverseWalk).normalize();
      // Arms are authored in a different Mixamo starting stance. Preserve
      // their keyed swing by applying the fixed resting-frame correction
      // BEFORE mixing against the approved idle world-rest delta.
      if(ai>=0)gaitDelta.premultiply(st.armOffsets[ai]).normalize();
     }else gaitDelta.copy(mapped);
     tmp.copy(basisRun).multiply(run).multiply(inverseRun).normalize();
     // Every pose part is blended in SOURCE WORLD-REST space, before
     // parent-dependent retargeting. No procedural or fighting-idle arms.
     desired.copy(mapped).slerp(gaitDelta,st.walkWeight).slerp(tmp,st.runWeight).normalize();
     wantedWorld.copy(sceneQ).multiply(desired).multiply(st.bind[i]).normalize();
     bone.parent.getWorldQuaternion(parentQ);
     const target=parentQ.invert().multiply(wantedWorld).normalize();
     // First module activation alone is faded from the last real pose;
     // subsequent gait handoffs have no alternate writer or pose reset.
     bone.quaternion.slerp(target,st.fade).normalize();
     bone.updateMatrixWorld(true);
    }
    rig.vrm.update(0);
    st.frames++;
    st.active=st.runWeight>.55?'standard-run':st.walkWeight>.15?'walk':'approved-idle';
    this.v80AnalogRun=st.runWeight>.45;
    if(root.SkyClashMovementLab){
     root.SkyClashMovementLab.motion=st.active;
     root.SkyClashMovementLab.sourceOwner='V93 single track';
     root.SkyClashMovementLab.walkMix=st.walkWeight;
     root.SkyClashMovementLab.runMix=st.runWeight;
    }
    status.frames=st.frames;status.active=st.active;
   }catch(err){
    st.error=String(err);status.error=String(err);
    if(root.SkyClashMovementLab)root.SkyClashMovementLab.error=String(err);
    console.error('V93 single locomotion unavailable',err);
    this.animate=old;this.v93SingleLocomotion=null;
   }
  };
  f.v93SingleLocomotion=st;
  return st;
 }
 async function start(context=root){
  const status={version:93,ready:false,active:'loading',frames:0,error:null};
  context.SkyClashV93=status;
  try{
   const urls=[
    'assets/animations/gameplay/studio-actions-v1.json?v=930',
    'assets/animations/gameplay/kairo-walk-v1.json?v=930',
    'assets/animations/gameplay/kairo-walk-arms-v1.json?v=930'
   ];
   const replies=await Promise.all(urls.map(url=>context.fetch(url,{cache:'no-cache'})));
   if(replies.some(r=>!r.ok))throw Error('V93 missing approved idle/run/walk asset');
   const [pack,legJson,armJson]=await Promise.all(replies.map(r=>r.json()));
   const source=Object.fromEntries(pack.motions.map(m=>[m.slot,m]));
   if(source.idle?.sourceFile!=='Movement/Adventure/idle (2).fbx'||
      source.run?.sourceFile!=='Movement/Male/standard run.fbx')
    throw Error('V93 requires the approved idle (2) and Standard Run');
   const THREE=context.THREE;
   const clips={
    idle:context.SkyClashPublishedGamePack.decode(THREE,source.idle),
    run:context.SkyClashPublishedGamePack.decode(THREE,source.run),
    legs:context.SkyClashV71Walk.decode(THREE,legJson),
    arms:context.SkyClashV76UpperBody.decode(THREE,armJson)
   };
   const fighter=context.SkyClash?.Game?.heroes?.kairo_venn;
   if(!attach(THREE,fighter,clips,status))throw Error('V93 no Kairo fighter');
   status.ready=true;status.sources=['approved-idle','walk-legs','walk-arms','standard-run'];
  }catch(err){status.active='failed';status.error=String(err);
   console.warn('V93 preview unavailable, original game remains playable',err);}
  return status;
 }
 const api={BONES,computeBlend,nextWeight,eligibility,attach,start};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV93Grounded=api;
})(typeof window!=='undefined'?window:globalThis);
