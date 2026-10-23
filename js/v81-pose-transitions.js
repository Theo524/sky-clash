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
 function stateOf(f){
  if(f.hp<=0||f.downT>0||f.spiked||f.launched)return 'damage';
  if(f.punchT>0||f.blastT>0||f.superHitT>0||f.slamming)return 'attack';
  if(f.blockHeld||f.blocking)return 'guard';
  if(f.dropping)return 'fall';
  if(f.jumping)return f.vel?.y<0?'fall':'jump';
  if(f.flying)return f.sprinting?'flight-boost':'flight';
  if(f.dashing)return 'dash';
  if(f.sprinting)return 'boost';
  if(f.landingMotionT>0)return 'landing';
  const speed=Math.hypot(f.vel?.x||0,f.vel?.z||0);
  if(speed>.8)return f.v80AnalogRun?'run':'walk';
  return 'idle';
 }
 const combat=state=>state==='attack'||state==='damage';
 function attach(THREE,f,status){
  if(!f||typeof f.animate!=='function'||f.v81PoseTransitions)return null;
  const old=f.animate;
  const st={rig:null,mode:null,elapsed:1,blend:1,nodes:[],
   previous:[],fingerNodes:[],fingerRest:[],handGrip:0,frames:0};
  const y=new THREE.Vector3(0,1,0),extra=new THREE.Quaternion();
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
  }
  f.animate=function(dt){
   const rig=this.vrmRig,safe=clamp(Number.isFinite(dt)?dt:0,0,.065);
   const before=rig?.vrm&&st.rig===rig?st.nodes.map((node,i)=>
    node?node.quaternion.clone():st.previous[i].clone()):null;
   old.call(this,dt);
   if(!this.vrmRig?.vrm)return;
   try{
    if(st.rig!==this.vrmRig)capture(this.vrmRig);
    const next=stateOf(this);
    if(st.mode!==next){
     st.mode=next;st.elapsed=0;st.blend=0;
     // The outgoing pose is whatever the player actually SAW on the last
     // frame, not the procedural pose under the incoming Mixamo layer.
     if(before&&before.length===st.previous.length)
      st.previous.forEach((q,i)=>q.copy(before[i]));
     else st.nodes.forEach((node,i)=>{if(node)st.previous[i].copy(node.quaternion)});
    }
    st.elapsed+=safe;
    // Faster transitions into combat; no masking strike/contact frames.
    const seconds=next==='landing'?.23:
      next==='guard'?.16:next==='fall'?.20:.18;
    st.blend=combat(next)?1:clamp(st.elapsed/seconds,0,1);
    const w=st.blend*st.blend*(3-2*st.blend);
    if(w<1)for(let i=0;i<st.nodes.length;i++){
     const node=st.nodes[i];
     if(node)node.quaternion.slerpQuaternions(st.previous[i],node.quaternion,w);
    }
    // Neutral hands remain exactly as the user's approved idle.
    // Floating opens them only PARTIALLY, so they don't become robot palms;
    // recorded guard and Boost use compact natural-looking fists.
    const grip=next==='guard'?.94:next==='boost'?.76:
      next==='flight'||next==='flight-boost'?.46:
      next==='jump'||next==='fall'?.52:next==='landing'?.40:0;
    st.handGrip+=(grip-st.handGrip)*(1-Math.exp(-safe*13));
    for(let i=0;i<st.fingerNodes.length;i++){
     const {node,sign,angle}=st.fingerNodes[i];
     extra.setFromAxisAngle(y,sign*angle*st.handGrip);
     node.quaternion.copy(st.fingerRest[i]).multiply(extra);
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
