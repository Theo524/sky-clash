/* V91: continuous Kairo idle -> weight shift -> step -> walk -> settle -> idle.
 * Dedicated ?movementLab=step&stance=continuous experiment only.
 *
 * Fixes the V90 bug: that mode started its return-to-idle bridge only after
 * the other recorded-action layers had already crossed their speed thresholds.
 * V91 catches each transition BEFORE the underlying controllers can visibly
 * replace the pose. No source Mixamo clips or gameplay attacks are modified.
 */
(function(root){
 'use strict';
 const BONES=['hips','spine','chest','upperChest','neck','head',
  'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
  'leftUpperLeg','leftLowerLeg','leftFoot',
  'rightUpperLeg','rightLowerLeg','rightFoot'];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
 const stageSeconds=Object.freeze({
  idle:.25,anticipate:.12,'first-step':.28,walk:.24,settle:.30
 });
 // Source quats represent the last actual visible pose. The target is
 // always the fully animated live destination, NOT a hard-coded T-pose or
 // the first frame of another clip. Use separate quaternion objects:
 // Three.js slerpQuaternions mutates its receiver.
 function solveBone(THREE,last,from,target,blend,maxAngle){
  const desired=new THREE.Quaternion().slerpQuaternions(from,target,clamp(blend,0,1));
  const angle=last.angleTo(desired);
  const limited=angle>maxAngle;
  if(limited)desired.copy(last).slerp(desired,maxAngle/angle);
  return {quaternion:desired,rawAngle:angle,limited};
 }
 function attach(THREE,f){
  if(!f||typeof f.animate!=='function'||f.v91StanceContinuity)return null;
  const previous=f.animate;
  const st={rig:null,nodes:[],last:[],from:[],stage:null,clock:0,
   frames:0,clamped:0,maxAngle:0,transitions:0};
  const snapshot=()=>st.nodes.map(node=>node?.quaternion.clone()||null);
  f.animate=function(dt){
   // The underlying animation stack writes its intended pose ONCE.
   // Capture what the player saw before it runs so speed-threshold changes
   // cannot expose a different idle/walk pose during the same frame.
   const before=st.rig===this.vrmRig&&st.last.length?st.last:null;
   previous.call(this,dt);
   const rig=this.vrmRig,stage=this.v89Step?.mode;
   if(!rig?.vrm||!stage)return;
   if(stage==='inactive'){
    st.rig=null;st.last=[];st.from=[];st.stage=null;
    return;
   }
   try{
    if(st.rig!==rig){
     st.rig=rig;
     st.nodes=BONES.map(name=>rig.vrm.humanoid.getNormalizedBoneNode(name));
     st.last=snapshot();st.from=snapshot();st.clock=0;st.stage=stage;
     return;
    }
    const safe=clamp(Number.isFinite(dt)?dt:0,0,.065);
    if(stage!==st.stage){
     st.from=before?.map(q=>q?.clone()||null)||snapshot();
     st.stage=stage;st.clock=0;st.transitions++;
    }
    st.clock+=safe;
    const blend=smooth(st.clock/(stageSeconds[stage]||.24));
    const desired=st.nodes.map(node=>node?.quaternion.clone()||null);
    // The angular cap prevents a hidden controller from snapping elbows,
    // knees, head or hips even if its state flips halfway through a stride.
    // 7rad/s torso, 9rad/s limbs; allow full natural gait velocity.
    let worst=0,clamped=0;
    for(let i=0;i<st.nodes.length;i++){
     const n=st.nodes[i],last=before?.[i],from=st.from[i],dest=desired[i];
     if(!n||!last||!from||!dest)continue;
     const speed=i<6?6.5:i<14?8:9;
     const maxAngle=Math.max(.006,safe*speed);
     const value=solveBone(THREE,last,from,dest,blend,maxAngle);
     n.quaternion.copy(value.quaternion).normalize();
     worst=Math.max(worst,last.angleTo(n.quaternion));
     if(value.limited)clamped++;
    }
    rig.vrm.update(0);
    st.last=snapshot();
    st.frames++;st.maxAngle=worst;st.clamped=clamped;
    if(root.SkyClashMovementLab){
     root.SkyClashMovementLab.stanceStage=stage;
     root.SkyClashMovementLab.maxAngularStep=worst;
     root.SkyClashMovementLab.poseClamps=clamped;
     root.SkyClashMovementLab.poseTransitions=st.transitions;
    }
   }catch(err){
    console.error('V91 idle continuity unavailable; preserving V89 animation',err);
    if(root.SkyClashMovementLab)root.SkyClashMovementLab.error=String(err);
    this.animate=previous;this.v91StanceContinuity=null;
   }
  };
  f.v91StanceContinuity=st;
  return st;
 }
 function start(context=root){
  const status={version:91,ready:false,characters:0};
  context.SkyClashV91=status;
  if(!context.THREE||!context.SkyClash?.Game)return status;
  const hero=context.SkyClash.Game.heroes?.kairo_venn;
  if(hero&&attach(context.THREE,hero))status.characters++;
  status.ready=status.characters>0;
  return status;
 }
 const api={BONES,solveBone,stageSeconds,start,attach};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV91Stance=api;
})(typeof window!=='undefined'?window:globalThis);
