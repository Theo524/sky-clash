/* Sky Clash V72 — Fix V71 walk's procedural/recorded animation split.
 * V71 already drives Kairo's Mixamo legs. V72 adds the *matching real FBX*
 * shoulders, elbows and wrists on the same clock, using the same world-rest
 * delta technique as Animation Studio's successful V68 character preview.
 * Combat still has priority. ?walk=procedural or ?arms=procedural reverts.
 */
(function(root){
 'use strict';
 const PATH='assets/animations/gameplay/kairo-walk-arms-v1.json';
 const NAMES=['leftShoulder','leftUpperArm','leftLowerArm','leftHand',
              'rightShoulder','rightUpperArm','rightLowerArm','rightHand'];
 function decode(THREE,asset){
  if(!asset||asset.schema!=='sky-clash.motion.v1'||asset.id!=='kairo.walk-arms'||
     asset.frames!==32||asset.fps!==30||
     JSON.stringify(asset.bones)!==JSON.stringify(NAMES))
   throw Error('V72: unrecognized Mixamo arm recording');
  const binary=atob(asset.data),stride=NAMES.length*4;
  if(binary.length!==asset.frames*stride*2)throw Error('V72: damaged arm keyframes');
  const view=new DataView(new Uint8Array(Array.from(binary,c=>c.charCodeAt(0))).buffer);
  const data=new Int16Array(asset.frames*stride);
  for(let i=0;i<data.length;i++)data[i]=view.getInt16(i*2,true);
  const a=new THREE.Quaternion(),b=new THREE.Quaternion();
  function sample(seconds,out){
   const count=asset.frames-1;
   const phase=((seconds*asset.fps)%count+count)%count;
   const i0=Math.floor(phase),i1=Math.min(count,i0+1),mix=phase-i0;
   for(let i=0;i<NAMES.length;i++){
    const x=(i0*NAMES.length+i)*4,y=(i1*NAMES.length+i)*4;
    a.set(data[x]/32767,data[x+1]/32767,data[x+2]/32767,data[x+3]/32767).normalize();
    b.set(data[y]/32767,data[y+1]/32767,data[y+2]/32767,data[y+3]/32767).normalize();
    out[i].slerpQuaternions(a,b,mix).normalize();
   }
   return out;
  }
  // V75: the source FBX walk is centred around arms DOWN, not its T-pose.
  // Calculate its mean quaternion for each joint over one complete gait
  // cycle. V74 unintentionally attenuated toward identity (T-pose), lifting
  // both arms out to the sides as it tried to reduce dancing/swing.
  const center=NAMES.map(()=>new THREE.Quaternion());
  const frame=NAMES.map(()=>new THREE.Quaternion());
  const reference=NAMES.map(()=>new THREE.Quaternion());
  sample(0,reference);
  for(let i=0;i<NAMES.length;i++){
   let x=0,y=0,z=0,w=0;
   for(let f=0;f<asset.frames-1;f++){
    sample(f/asset.fps,frame);
    const q=frame[i],sign=q.dot(reference[i])<0?-1:1;
    x+=sign*q.x;y+=sign*q.y;z+=sign*q.z;w+=sign*q.w;
   }
   center[i].set(x,y,z,w).normalize();
  }
  return {sample,asset,names:NAMES,center};
 }
 function attach(THREE,fighter,motion,status){
  if(!fighter?.v71Walk||fighter.v72WalkArms||typeof fighter.animate!=='function')return null;
  const old=fighter.animate;
  const qScene=new THREE.Quaternion(),qInvScene=new THREE.Quaternion(),
    parentQ=new THREE.Quaternion(),target=new THREE.Quaternion(),worldTarget=new THREE.Quaternion(),
    transformed=new THREE.Quaternion(),zero=new THREE.Quaternion(),
    turn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
  const invTurn=turn.clone().invert();
  const state={rig:null,bones:null,bind:null,samples:NAMES.map(()=>new THREE.Quaternion()),frames:0};
  function capture(rig){
   const H=rig.vrm.humanoid,rootNode=rig.vrm.scene,get=n=>H.getNormalizedBoneNode(n);
   const bones=NAMES.map(get);
   if(bones.some(x=>!x))throw Error('V72: Kairo VRM missing recorded Mixamo arm bones');
   // Capture the same zero-pose reference as the Studio: unanimated
   // normalized humanoid bones, *not* the old procedural guard.
   const nodes=['hips','spine','chest','upperChest','neck',...NAMES]
     .map(get).filter(Boolean);
   const stored=nodes.map(n=>n.quaternion.clone());
   for(const n of nodes)n.quaternion.identity();
   rootNode.updateMatrixWorld(true);
   const inverse=rootNode.getWorldQuaternion(qInvScene).invert().clone();
   const bind=bones.map(node=>inverse.clone()
     .multiply(node.getWorldQuaternion(new THREE.Quaternion())).normalize());
   for(let i=0;i<nodes.length;i++)nodes[i].quaternion.copy(stored[i]);
   rootNode.updateMatrixWorld(true);
   state.rig=rig;state.bones=bones;state.bind=bind;
  }
  fighter.animate=function(dt){
   old.call(this,dt);
   const walk=this.v71Walk,rig=this.vrmRig;
   if(!walk||!rig?.vrm||walk.weight<.008)return;
   // Attacks must win immediately; recorded walk arms should never
   // obscure punches/kicks, even while V71's legs are blending out.
   if(this.punchT>0||this.blastT>0||this.superHitT>0||this.stun>0||
      this.flying||this.launched||this.spiked||this.dashing||this.sprinting||
      this.hp<=0)return;
   try{
    if(state.rig!==rig)capture(rig);
    motion.sample(walk.clock,state.samples);
    const scene=rig.vrm.scene;
    scene.updateMatrixWorld(true);
    scene.getWorldQuaternion(qScene);
    const basis=rig.legacyAxes?turn:zero,basisInv=rig.legacyAxes?invTurn:zero;
    // Per joint: source-world rest delta -> destination-world bind ->
    // local rotation relative to its currently animated parent.
    for(let i=0;i<NAMES.length;i++){
     const node=state.bones[i];
     transformed.copy(basis).multiply(state.samples[i]).multiply(basisInv).normalize();
     if(!status.originalWalkStyle&&motion.center?.[i]){
      // V75: fade *only gait variation* around the FBX's naturally lowered
      // arm pose. Do NOT slerp toward the identity rest quaternion: that
      // would pull the arms back toward the VRM's outstretched T-pose.
      const style=root.SkyClashGameplayMotions?.action;
      const gain=(i%4===0||i%4===1)?(style?.shoulderSwing??.55):
       i%4===2?(style?.elbowSwing??.80):(style?.wristSwing??.74);
      const centered=new THREE.Quaternion().copy(basis)
       .multiply(motion.center[i]).multiply(basisInv).normalize();
      transformed.copy(centered).slerp(transformed,Math.max(0,Math.min(1,gain)));
     }
     worldTarget.copy(qScene).multiply(transformed).multiply(state.bind[i]).normalize();
     node.parent.getWorldQuaternion(parentQ);
     target.copy(parentQ).invert().multiply(worldTarget).normalize();
     // Prevent pathological retarget rotations while preserving the
     // natural two-bone guard sampled by Mixamo.
     const angle=node.quaternion.angleTo(target);
     if(angle>2.6)target.copy(node.quaternion).slerp(target,2.6/angle);
     node.quaternion.slerp(target,Math.min(1,walk.weight));
     node.updateMatrixWorld(true);
    }
    rig.vrm.update(0);
    state.frames++;
    status.active='kairo.walk-arms';status.frames=state.frames;
   }catch(e){
    status.error=String(e);
    console.error('V72: upper body restored to procedural fallback',e);
    fighter.animate=old;fighter.v72WalkArms=null;
   }
  };
  fighter.v72WalkArms=state;
  return state;
 }
 async function start(context=root){
  const status={version:74,ready:false,active:'loading',error:null,frames:0,
   originalWalkStyle:new URLSearchParams(context.location?.search||'').get('walkStyle')==='original'};
  context.SkyClashWalkArms=status;
  const query=new URLSearchParams(context.location?.search||'');
  if(query.get('walk')==='procedural'||query.get('arms')==='procedural'){
   status.active='procedural-fallback';return status;
  }
  try{
   const THREE=context.THREE,Game=context.SkyClash?.Game;
   if(!THREE||!Game)throw Error('V72 game not ready');
   const response=await context.fetch(PATH+'?v=720');
   if(!response.ok)throw Error('V72 arm asset HTTP '+response.status);
   const motion=decode(THREE,await response.json());
   let attached=0;
   for(const fighter of [Game.heroes?.kairo_venn,Game.enemy])
    if(attach(THREE,fighter,motion,status))attached++;
   if(!attached)throw Error('V71 walk must initialise before V72 arms');
   status.ready=true;status.active='ready';status.characters=attached;
  }catch(e){status.error=String(e);status.active='procedural-fallback';
   console.warn('V72 arm walk unavailable; original V71 movement preserved',e);}
  return status;
 }
 const api={decode,attach,start,NAMES};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV72Arms=api;
})(typeof window!=='undefined'?window:globalThis);
