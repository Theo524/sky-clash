/* Sky Clash V71 — permanently versioned REAL Mixamo walk for playable Kairo.
 * The file assets/animations/gameplay/kairo-walk-v1.json is baked offline from
 * the uploaded "walking - Standard Movement.fbx". No FBX runtime dependency.
 * This layer changes leg/foot visuals ONLY; gameplay owns world movement and
 * combat, and V68's working Animation Studio retargeter is untouched.
 * ?walk=procedural disables just this new animation (safe A/B rollback).
 */
(function(root){
 'use strict';
 const VERSION='71.0';
 const PATH='assets/animations/gameplay/kairo-walk-v1.json';
 const JOINTS=['leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot'];
 const EXPECT=['hips',...JOINTS];
 const MANIFEST=Object.freeze({
  'kairo.walk':Object.freeze({path:PATH,revision:1,mode:'grounded-locomotion',source:'Mixamo',fps:30,
   affects:JOINTS,hero:'kairo_venn',rollback:'?walk=procedural'})
 });
 function decode(THREE,asset){
  if(!THREE?.Quaternion||!asset||asset.schema!=='sky-clash.motion.v1'||asset.id!=='kairo.walk')
   throw Error('V71: unrecognized motion resource');
  if(asset.frames<8||asset.frames>300||asset.fps!==30||JSON.stringify(asset.bones)!==JSON.stringify(EXPECT))
   throw Error('V71: unsupported walk skeleton or sample rate');
  const binary=atob(asset.data),stride=EXPECT.length*4;
  if(binary.length!==asset.frames*stride*2)throw Error('V71: damaged walk keyframe length');
  // DataView little-endian supports browsers even on unusual hardware.
  const b=new DataView(new Uint8Array([...binary].map(c=>c.charCodeAt(0))).buffer);
  const samples=new Int16Array(asset.frames*stride);
  for(let i=0;i<samples.length;i++)samples[i]=b.getInt16(i*2,true);
  const qa=new THREE.Quaternion(),qb=new THREE.Quaternion();
  const sample=(seconds,out)=>{
   const count=asset.frames-1,phase=((seconds*asset.fps)%count+count)%count;
   const i0=Math.floor(phase),i1=Math.min(count,i0+1),t=phase-i0;
   for(let i=0;i<EXPECT.length;i++){
    const a=(i0*EXPECT.length+i)*4,c=(i1*EXPECT.length+i)*4;
    qa.set(samples[a]/32767,samples[a+1]/32767,samples[a+2]/32767,samples[a+3]/32767).normalize();
    qb.set(samples[c]/32767,samples[c+1]/32767,samples[c+2]/32767,samples[c+3]/32767).normalize();
    out[i].slerpQuaternions(qa,qb,t).normalize();
   }
   return out;
  };
  return {asset,sample,frames:asset.frames,duration:(asset.frames-1)/asset.fps,source:asset.source_sha256};
 }
 function attach(THREE,fighter,motion,status){
  if(!fighter||typeof fighter.animate!=='function'||fighter.v71Walk)return null;
  const original=fighter.animate;
  const state={clock:0,weight:0,ready:false,last:'idle',rig:null,nodes:null,bind:null,quats:EXPECT.map(()=>new THREE.Quaternion()),samples:0};
  const yaw=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
  const noYaw=new THREE.Quaternion();
  const invYaw=yaw.clone().invert();
  const sceneQ=new THREE.Quaternion(),sceneInv=new THREE.Quaternion(),
        currentQ=new THREE.Quaternion(),mapped=new THREE.Quaternion(),
        targetQ=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),wanted=new THREE.Quaternion();
  function capture(rig){
   const humanoid=rig.vrm?.humanoid,scene=rig.vrm?.scene;
   if(!humanoid||!scene)throw Error('VRM humanoid not ready');
   const get=n=>humanoid.getNormalizedBoneNode(n);
   const bones=EXPECT.map(get);
   if(bones.some(x=>!x))throw Error('Kairo VRM is missing a walking joint');
   const transient=['hips','spine','chest','upperChest',...JOINTS]
    .map(get).filter(Boolean).map(node=>({node,quat:node.quaternion.clone()}));
   // Calculate the bind pose in model/scene-local coordinates, removing all
   // existing gameplay poses before we capture it.
   for(const r of transient)r.node.quaternion.identity();
   scene.updateMatrixWorld(true);
   const inv=scene.getWorldQuaternion(sceneInv).invert().clone();
   const bind=bones.map(node=>inv.clone().multiply(node.getWorldQuaternion(new THREE.Quaternion())).normalize());
   for(const r of transient)r.node.quaternion.copy(r.quat);
   scene.updateMatrixWorld(true);
   state.rig=rig;state.nodes=bones;state.bind=bind;state.ready=true;
  }
  fighter.animate=function(dt){
   original.call(this,dt);
   if(!this.vrmRig?.vrm)return; // Game loads the model asynchronously.
   try{
    if(!state.ready||state.rig!==this.vrmRig)capture(this.vrmRig);
    const safe=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.065));
    const speed=Math.hypot(this.vel?.x||0,this.vel?.z||0);
    const canWalk=this.hp>0&&!this.flying&&!this.launched&&!this.spiked&&
     !(this.downT>0)&&!(this.punchT>0)&&!(this.stun>0)&&
     !(this.dashing||this.sprinting||this.slamming)&&speed>.75;
    const desired=canWalk?Math.min(1,Math.max(0,(speed-.75)/1.15)):0;
    state.weight+=(desired-state.weight)*(1-Math.exp(-safe*(desired>state.weight?10:13)));
    if(state.weight<.008){state.last='idle';return;}
    if(canWalk)state.clock+=safe*Math.min(1.8,Math.max(.62,speed/3.4));
    motion.sample(state.clock,state.quats);
    const scene=state.rig.vrm.scene;
    scene.updateMatrixWorld(true);
    scene.getWorldQuaternion(sceneQ);
    const basis=state.rig.legacyAxes?yaw:noYaw;
    const basisInv=state.rig.legacyAxes?invYaw:noYaw;
    // Input quaternions are source world-rest deltas, not local joint poses.
    // Recover each destination local quaternion using its *currently posed*
    // ancestor so that knee and foot motion cannot accumulate/twist.
    for(let i=1;i<EXPECT.length;i++){
     const node=state.nodes[i];if(!node?.parent)continue;
     mapped.copy(basis).multiply(state.quats[i]).multiply(basisInv).normalize();
     targetQ.copy(sceneQ).multiply(mapped).multiply(state.bind[i]).normalize();
     node.parent.getWorldQuaternion(parentQ);
     wanted.copy(parentQ).invert().multiply(targetQ).normalize();
     const angle=node.quaternion.angleTo(wanted);
     if(angle>2.7)wanted.copy(node.quaternion).slerp(wanted,2.7/angle);
     node.quaternion.slerp(wanted,state.weight);
     node.updateMatrixWorld(true);
    }
    state.rig.vrm.update(0); // Forward normalized leg bones into skinned mesh.
    state.samples++;
    state.last=canWalk?'kairo.walk':'walk-blend-out';
    status.active=state.last;status.frames=state.samples;status.weight=state.weight;
   }catch(e){
    status.error=String(e);
    console.error('V71: walking motion disabled for this fighter; procedural legs continue',e);
    fighter.animate=original;fighter.v71Walk=null;
   }
  };
  fighter.v71Walk=state;
  return state;
 }
 async function start(context=root){
  const status={version:VERSION,loaded:false,active:'loading',frames:0,weight:0,error:null,manifest:MANIFEST};
  context.SkyClashGameplayMotions=status;
  if(new URLSearchParams(context.location?.search||'').get('walk')==='procedural'){
   status.active='procedural-fallback';return status;
  }
  const THREE=context.THREE,Game=context.SkyClash?.Game;
  if(!THREE||!Game)throw Error('V71 needs initialized Sky Clash gameplay');
  try{
   const response=await context.fetch(PATH+'?v=710',{cache:'force-cache'});
   if(!response.ok)throw Error('walk asset HTTP '+response.status);
   const motion=decode(THREE,await response.json());
   const fighters=[Game.heroes?.kairo_venn,Game.enemy].filter(Boolean);
   let count=0;
   for(const fighter of fighters)if(attach(THREE,fighter,motion,status))count++;
   if(count<1)throw Error('no Kairo gameplay fighters found');
   status.loaded=true;status.active='idle';status.characters=count;
   console.info('Sky Clash V71: baked Mixamo walk activated for '+count+' fighters; '+motion.frames+' real sampled frames');
  }catch(err){status.error=String(err);status.active='procedural-fallback';
   console.warn('V71 motion failed to load; original gameplay is unaffected',err);}
  return status;
 }
 const api={version:VERSION,manifest:MANIFEST,decode,attach,start};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV71Walk=api;
})(typeof window!=='undefined'?window:globalThis);
