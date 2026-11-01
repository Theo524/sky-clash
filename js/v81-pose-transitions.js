/* V81: single final pose-transition owner, after the recorded animation
 * layers. A pose MUST be blended with the last VISUALLY APPLIED pose, not
 * an old procedural guard/T-pose briefly exposed between controllers.
 * Physics never changes: this operates exclusively on VRM humanoid bones.
 *
 * Stable transitions: approved idle -> walk -> standard run -> recorded Boost,
 * block, jump, hover, falling and recorded landing; combat stays responsive.
 * Per-state finger closure addresses straight/open VRoid fingers without
 * reintroducing V67's permanent 90-degree wrist twist.
 * ?poseTransitions=off restores the old visual pipeline.
 */
(function(root){
 'use strict';
 const names=['hips','spine','chest','upperChest','neck','head',
  'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
  'leftUpperLeg','leftLowerLeg','leftFoot',
  'rightUpperLeg','rightLowerLeg','rightFoot'];
 const fingers=['Index','Middle','Ring','Little'];
 const segments=[['Proximal',1.08],['Intermediate',1.13],['Distal',.55]];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 // Studio clips are authored poses. V81 blends their handoff but must
 // not reinterpret a player's recorded limb movement afterward.
 function appliedStudioSlot(f,slot){
  const local=root.SkyClashPublishedActions?.localPlaytest;
  return !!(f===root.SkyClash?.Game?.heroes?.kairo_venn&&
   new URLSearchParams(root.location?.search||'').get('studioPlaytest')==='local'&&
   local?.state==='ready'&&local.slots.includes(slot));
 }
 function stateOf(f){
  if(f.hp<=0||f.downT>0||f.spiked||f.launched)return 'damage';
  // Native reactions must have a real state boundary on stun exit. Treating
  // them as an already-running walk exposed the legacy arms in one frame.
  if(f.stun>0&&f.nativeCombatReaction&&f.v72StudioPack?.nativePreviewActive)return 'damage';
  if(f.punchT>0||f.blastT>0||f.superHitT>0||f.slamming)return 'attack';
  if(f.blockHeld||f.blocking)return 'guard';
  // Match the Studio landing owner on the first collision frame while
  // the old drop/jump flag is still clearing.
  if(appliedStudioSlot(f,'landing')&&f.landingMotionT>0&&
     !f.flying&&!f.sprinting&&!f.dashing)return 'landing';
  if(f.dropping)return 'fall';
  if(f.jumping)return f.vel?.y<0?'fall':'jump';
  if(f.flying)return f.sprinting?'flight-boost':'flight';
  if(f.dashing)return 'dash';
  if(f.sprinting)return 'boost';
  if(f.landingMotionT>0)return 'landing';
  // A grounded Boost stop is distinct from a new run/walk cycle.
  if((f.t||0)<(f._v82BoostStopEnd||-1)&&
     Math.hypot(f.moveIntent?.x||0,f.moveIntent?.z||0)<.8)
   return 'boost-stop';
  const speed=Math.hypot(f.vel?.x||0,f.vel?.z||0);
  if(speed>.8)return f.v80AnalogRun?'run':'walk';
  return 'idle';
 }
 const combat=state=>state==='attack'||state==='damage';
 function attach(THREE,f,status){
  if(!f||typeof f.animate!=='function'||f.v81PoseTransitions)return null;
  const old=f.animate;
  const st={rig:null,mode:null,elapsed:1,blend:1,nodes:[],
   previous:[],fingerNodes:[],fingerRest:[],handGrip:0,frames:0,
    airWristAnchor:null,previousHips:null,nativeRelease:false};
  const y=new THREE.Vector3(0,1,0),extra=new THREE.Quaternion(),airTarget=new THREE.Quaternion(),
   headWorld=new THREE.Quaternion(),parentWorld=new THREE.Quaternion(),
   euler=new THREE.Euler();
  function capture(rig){
   const humanoid=rig.vrm?.humanoid;if(!humanoid)throw Error('V81: normalized humanoid required');
   st.nodes=names.map(n=>humanoid.getNormalizedBoneNode(n));
   st.previous=st.nodes.map(node=>node?node.quaternion.clone():new THREE.Quaternion());
   st.fingerNodes=[];st.fingerRest=[];
   for(const side of ['left','right']){
    const sign=side==='left'?-1:1;
    for(const finger of fingers)for(const [segment,angle] of segments){
     const node=humanoid.getNormalizedBoneNode(side+finger+segment);
     if(node){
      st.fingerNodes.push({node,sign,angle});
      st.fingerRest.push(node.quaternion.clone());
     }
    }
   }
   st.rig=rig;st.mode=null;st.elapsed=1;st.blend=1;
    st.airWristAnchor=null;
  }
  f.animate=function(dt){
   const rig=this.vrmRig,safe=clamp(Number.isFinite(dt)?dt:0,0,.065);
   const before=rig?.vrm&&st.rig===rig?st.nodes.map((node,i)=>
    node?node.quaternion.clone():st.previous[i].clone()):null;
   const stormV3=root.SkyClashPublishedActions?.nativeCombatSet?.revision==='storm-fist-v3';
   const wasNative=!!this.v72StudioPack?.nativePreviewActive;
   const beforeHips=stormV3&&st.nodes[0]?st.nodes[0].position.clone():null;
   old.call(this,dt);
   // V100 owns whole-body jump/fall/landing fades and neutral fingers.
   // Do not also perform V81's full-skeleton crossfade or finger curls.
   if(root.SkyClashV100Animator?.ownsAir(this))return;
   if(!this.vrmRig?.vrm)return;
   try{
    if(st.rig!==this.vrmRig)capture(this.vrmRig);
    const next=stateOf(this);
    // The 20 normalized VRM joints of a local Studio fall/landing are
    // already authored by V72. No second 60-75ms full-body blend,
    // artificial finger grip, or wrist constraint may overwrite them.
    // The transition controller remains intact for every other state.
    if((next==='fall'&&appliedStudioSlot(this,'fallingIdle'))||
       (next==='landing'&&appliedStudioSlot(this,'landing'))){
     st.mode=null;st.airWristAnchor=null;st.handGrip=0;
     st.nativeRelease=false;st.previousHips=null;
     for(let i=0;i<st.fingerNodes.length;i++)
      st.fingerNodes[i].node.quaternion.copy(st.fingerRest[i]);
     this.vrmRig.vrm.update(0);
     status.active=next;status.transition=1;
     status.airHands=next==='fall'?'Studio Falling Idle wrists preserved':
      'Studio Landing original hands preserved';
     status.frames=++st.frames;
     return;
    }
    // V99 opt-in: V73's native Kairo fingers are already correct in the
    // approved standing pose. V81's global Y-axis grip plus an independently
    // retargeted UE5 jump wrist can form the pinched-hand gesture.
    // During a real jump/fall, anchor both local wrist orientations to the
    // LAST actually rendered grounded pose (not a T pose) and allow only
    // a natural limited wrist excursion. Recorded shoulders, elbows, torso,
    // legs, facial expressions and all physics remain owned as before.
    const params=new URLSearchParams(root.location?.search||'');
    const authoredFall=next==='fall'&&appliedStudioSlot(this,'fallingIdle');
    const authoredLanding=next==='landing'&&appliedStudioSlot(this,'landing');
    // V99's fixed wrist limit was intended for the published fall.
    // It visibly rewrites the wrists of a Studio-assigned Falling Idle.
    const stabilize=params.get('airLab')==='jump'&&params.get('airHands')==='stable'&&
      this===root.SkyClash?.Game?.heroes?.kairo_venn&&!authoredFall;
    const naturalAir=next==='jump'||next==='fall';
    if(stabilize&&naturalAir){
      if(!st.airWristAnchor){
        const source=before&&before.length===st.nodes.length?before:st.previous;
        st.airWristAnchor=[9,13].map(i=>source[i].clone());
      }
    }else st.airWristAnchor=null;
    if(st.mode!==next){
     st.mode=next;st.elapsed=0;st.blend=0;
     st.nativeRelease=stormV3&&wasNative;
     st.previousHips=st.nativeRelease?beforeHips:null;
     // The outgoing pose is whatever the player actually SAW on the last
     // frame, not the procedural pose under the incoming Mixamo layer.
     if(before&&before.length===st.previous.length)
      st.previous.forEach((q,i)=>q.copy(before[i]));
     else st.nodes.forEach((node,i)=>{if(node)st.previous[i].copy(node.quaternion)});
    }
    st.elapsed+=safe;
    // Faster transitions into combat; no masking strike/contact frames.
    // Studio landing includes its own impact and recovery. Don't hide
    // the first .23s behind another crossfade.
    // Show the authored Studio fall sooner, but still soften the switch
    // from flight during its first 60ms; public fall remains 200ms.
    const seconds=next==='landing'?(authoredLanding?.075:.23):
      next==='guard'?.16:next==='boost-stop'?.14:
      next==='fall'?(authoredFall?.06:.20):.18;
    // V87: strikes should enter fast but not snap in one frame from
    // the preceding stance; damage reactions remain instantaneous.
    // The private native jab already contains its authored entry/recovery.
    // Keep V81's fingers and exit transition, but do not time-warp that
    // full-body entry with a second blend. Normal gameplay never registers
    // this preview and takes the existing transition path unchanged.
    const nativeAttack=this.v72StudioPack?.nativePreviewActive;
    st.blend=next==='damage'||nativeAttack?1:
      clamp(st.elapsed/(next==='attack'?.075:seconds),0,1);
    const w=st.blend*st.blend*(3-2*st.blend);
    if(w<1)for(let i=0;i<st.nodes.length;i++){
     const node=st.nodes[i];
     if(!node)continue;
     // V94 handoff lab: Three.js slerpQuaternions() writes into its
     // receiver before reading the target. Passing node.quaternion as
     // BOTH receiver and target makes the new clip pose disappear until
     // the last frame, then snap into view. Hold the target separately.
     if(authoredFall||authoredLanding||
        new URLSearchParams(root.location?.search||'')
        .get('stance')==='handoff'||stormV3){
      const incoming=node.quaternion.clone();
      node.quaternion.slerpQuaternions(st.previous[i],incoming,w).normalize();
     }else{
      node.quaternion.slerpQuaternions(st.previous[i],node.quaternion,w);
     }
    }
    // Native pelvis translation must fade with its pose, or a correctly
    // blended leg still snaps at the hips on combat exit. V100 retains air.
    if(stormV3&&st.nativeRelease&&st.previousHips&&w<1&&st.nodes[0]){
     const incoming=st.nodes[0].position.clone();
     st.nodes[0].position.lerpVectors(st.previousHips,incoming,w);
    }
    // Neutral hands remain exactly as the user's approved idle.
    // Floating opens them only PARTIALLY, so they don't become robot palms;
    // recorded guard and Boost use compact natural-looking fists.
    const grip=next==='attack'?.9:next==='guard'?.94:next==='boost'?.76:next==='boost-stop'?.55:
      next==='flight'||next==='flight-boost'?.46:
      next==='jump'||next==='fall'?.52:next==='landing'?.40:0;
    // Source-controlled jump/fall uses the V73 VRoid native fingers;
    // never overlay V81's artificial pinching/curl on these two states.
    // Keep original Kairo finger rests for player-assigned clips.
    // The old hard-coded .52 falling / .40 landing fist distorted the
    // Studio action even after its 20 recorded bones were correctly owned.
    const fingerTarget=authoredFall||authoredLanding||
     stabilize&&naturalAir?0:grip;
    st.handGrip+=(fingerTarget-st.handGrip)*(1-Math.exp(-safe*13));
    for(let i=0;i<st.fingerNodes.length;i++){
     const {node,sign,angle}=st.fingerNodes[i];
     extra.setFromAxisAngle(y,sign*angle*st.handGrip);
     node.quaternion.copy(st.fingerRest[i]).multiply(extra);
    }
    if(stabilize&&naturalAir&&st.airWristAnchor){
      const maxWristTurn=.48; // ~27.5 deg relative to last visible wrist
      for(let j=0;j<2;j++){
        const node=st.nodes[j?13:9],anchor=st.airWristAnchor[j];
        if(!node||!anchor)continue;
        const deviation=anchor.angleTo(node.quaternion);
        if(deviation>maxWristTurn){
          airTarget.copy(node.quaternion);
          node.quaternion.copy(anchor).slerp(airTarget,maxWristTurn/deviation).normalize();
          status.airWristClamps=(status.airWristClamps||0)+1;
        }
      }
    }
    status.airHands=authoredFall?'Studio Falling Idle wrists preserved':
      stabilize&&naturalAir?'V99 native fingers + steady wrists':'normal';
    // Clip changes shouldn't tilt Kairo's gaze toward the floor while
    // locomoting. Constrain *world* head pitch, not its local pitch (which
    // inherits hips + spine tilt). Original Studio idle, attacks and guard
    // are entirely untouched by this horizon correction.
    if((next==='walk'||next==='run'||next==='boost')&&
       new URLSearchParams(root.location?.search||'').get('head')!=='original'){
      const head=st.nodes[5];
      if(head?.parent){
       const scene=this.vrmRig.vrm.scene;
       scene.updateMatrixWorld(true);
       head.getWorldQuaternion(headWorld);
       // World-space Euler limits fail as Kairo turns. Limit the gaze
       // relative to his own VRM root/facing (while keeping yaw intact).
       const v85=new URLSearchParams(root.location?.search||'')
          .get('animationV85')!=='legacy';
       if(v85){
        scene.getWorldQuaternion(parentWorld);
        headWorld.premultiply(parentWorld.invert());
       }
       euler.setFromQuaternion(headWorld,'YXZ');
       euler.x=clamp(euler.x,-.055,.075);
       euler.z=clamp(euler.z,-.08,.08);
       headWorld.setFromEuler(euler);
       if(v85){
        scene.getWorldQuaternion(parentWorld);
        headWorld.premultiply(parentWorld);
       }
       head.parent.getWorldQuaternion(parentWorld);
       head.quaternion.copy(parentWorld.invert().multiply(headWorld)).normalize();
      }
    }
    this.vrmRig.vrm.update(0);
    status.active=next;status.frames=++st.frames;status.transition=w;
   }catch(err){
    status.error=String(err);
    console.warn('V81 transition failed, leaving recorded base motions intact',err);
    f.animate=old;f.v81PoseTransitions=null;
   }
  };
  f.v81PoseTransitions=st;
  return st;
 }
 function start(context=root){
  const status={version:81,active:'waiting',characters:0,frames:0,error:null};
  context.SkyClashPoseTransitions=status;
  if(new URLSearchParams(context.location?.search||'').get('poseTransitions')==='off'){
   status.active='disabled';return status;
  }
  const THREE=context.THREE,g=context.SkyClash?.Game;
  for(const fighter of [g?.heroes?.kairo_venn,g?.enemy]){
   if(fighter?.vrmRig||fighter?.characterId==='kairo_venn')
    if(attach(THREE,fighter,status))status.characters++;
  }
  status.active=status.characters?'ready':'no-vrm-fighters';
  return status;
 }
 const api={start,attach,stateOf,version:81};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV81Transitions=api;
})(typeof window!=='undefined'?window:globalThis);
