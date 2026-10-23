/* Sky Clash V72 — optional published Animation Studio game motion pack.
 *
 * Publish a JSON exported with "Export for Game" to
 * assets/animations/gameplay/studio-actions-v1.json on GitHub.
 * The game loads it automatically for Kairo and his matching rival;
 * no browser IndexedDB or FBXLoader is needed during combat.
 *
 * Uses V68's anatomical shoulder-facing basis + world REST deltas, not the
 * flawed procedural VRM arm-rotation retarget. Physics stays authoritative.
 * Optional: missing pack is fine; V71+V72 Mixamo walk remains playable.
 * ?studioActions=off skips this layer for A/B testing.
 */
(function(root){
 'use strict';
 const PATH='assets/animations/gameplay/studio-actions-v1.json';
 const OVERRIDES='assets/animations/gameplay/v81-recorded-actions.json';
 const UE5_PACK='assets/animations/gameplay/v86-ue5-converted-actions.json';
 const COMBAT_PACK='assets/animations/gameplay/v87-recorded-combat.json';
 const COMBAT_SLOTS=new Set(['punch1','punch2','punch3','overhand','airStrike','kick','sideKick']);
 // Safe rollback: ?ue5=off restores all earlier published Studio motions.
 const UE5_ACTIVE=new Set(['guard','jump','landing','runStop',
  'floating','flying','fallingIdle']);

 const BONES=['hips','spine','chest','upperChest','neck','head',
  'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
  'leftUpperLeg','leftLowerLeg','leftFoot',
  'rightUpperLeg','rightLowerLeg','rightFoot'];
 const LOOP=new Set(['idle','walk','run','guard','boost','floating','flying','fallingIdle']);
 function decode(THREE,entry){
  if(!entry||entry.character!=='kairo'||entry.frames<3||entry.frames>420||
    entry.fps!==30||JSON.stringify(entry.bones)!==JSON.stringify(BONES)||
    !entry.data||!Array.isArray(entry.side)||entry.side.length!==2||
    !(entry.speed>=.25&&entry.speed<=2)||!(entry.yaw>=-180&&entry.yaw<=180))
   throw Error('Invalid Studio action pack entry');
  const binary=atob(entry.data),stride=BONES.length*4;
  if(binary.length!==entry.frames*stride*2)throw Error('Damaged Studio game motion');
  const bytes=new Uint8Array(Array.from(binary,c=>c.charCodeAt(0)));
  const view=new DataView(bytes.buffer),d=new Int16Array(entry.frames*stride);
  for(let i=0;i<d.length;i++)d[i]=view.getInt16(i*2,true);
  const qa=new THREE.Quaternion(),qb=new THREE.Quaternion();
  return {
   ...entry,
   sample(seconds,out,loop){
    let frame=seconds*entry.fps,last=entry.frames-1;
    frame=loop?((frame%last)+last)%last:Math.max(0,Math.min(last,frame));
    const a=Math.floor(frame),b=Math.min(last,a+1),u=frame-a;
    for(let i=0;i<BONES.length;i++){
     const ia=(a*BONES.length+i)*4,ib=(b*BONES.length+i)*4;
     qa.set(d[ia]/32767,d[ia+1]/32767,d[ia+2]/32767,d[ia+3]/32767).normalize();
     qb.set(d[ib]/32767,d[ib+1]/32767,d[ib+2]/32767,d[ib+3]/32767).normalize();
     out[i].slerpQuaternions(qa,qb,u).normalize();
    }
    return out;
   }
  };
 }
 function choose(fighter,actions){
  if(fighter.hp<=0)return null;
  const speed=Math.hypot(fighter.vel?.x||0,fighter.vel?.z||0);
  const airborne=!!(fighter.jumping||fighter.flying||fighter.launched||fighter.spiked);
  // Record the Boost release before airborne, landing, guard or acrobatics
  // can return early. A stop gesture is armed only for a REAL grounded Boost
  // skid, never for ordinary joystick running or a midair release.
  const releasedBoost=!!fighter._v82WasBoost&&!fighter.sprinting;
  fighter._v82WasBoost=!!fighter.sprinting;
  if(releasedBoost&&!airborne&&(fighter.skidT||0)>0){
   // Let the physical skid finish first, then allow a short grounded
   // settling/follow-through beat. The existing test requires a visible
   // stop past 0.6s (but not 0.9s) after release.
   fighter._v85StopDuration=Math.max(.68,Math.min(.76,fighter.skidT+.28));
   fighter._v82BoostStopEnd=(fighter.t||0)+fighter._v85StopDuration;
  }
  // V77: choose ONLY an expressly published slot in the active gameplay
  // state. In particular, an idle-only Studio export must NEVER play during
  // a jump, kick, dash, block, knockdown or stun. Before this fix those
  // branches fell through to "idle" if no matching action was exported.
  if((fighter.stun||0)>0)return actions.hit?'hit':null;
  if(fighter.downT>0||fighter.slamming||fighter.superHitT>0)return null;
  // Native Mixamo blocking controls both forearms and wrists, rather
  // than a pair of procedural diagonal, straight-fingered robot arms.
  if(fighter.blockHeld||fighter.blocking)return actions.guard?'guard':null;
  if((fighter.punchT||0)>0){
   const kind=String(fighter.attackKind||'').toLowerCase();
   // V87: use the recorded strike matching each real combat beat instead
   // of looping the same procedural punch for every combination.
   if(kind.includes('airstrike')||kind.includes('elbow'))
    return actions.airStrike?'airStrike':actions.punch1?'punch1':null;
   if(kind.includes('sidekick'))return actions.sideKick?'sideKick':actions.kick?'kick':null;
   if(kind.includes('kick')||kind.includes('spin'))
    return actions.kick?'kick':actions.meteor?'meteor':null;
   if(kind.includes('hook')||kind.includes('upper'))
    return fighter.attackVariant==='overhand'&&actions.overhand?'overhand':
      actions.punch3?'punch3':actions.uppercut?'uppercut':null;
   const serial=Number(fighter.attackSerial||0);
   return (fighter.punchSide===1&&actions.punch1?'punch1':null)||
      (serial%2===0&&actions.punch2?'punch2':null)||
      (actions.punch1?'punch1':actions.punch2?'punch2':null);
  }
  if((fighter.blastT||0)>0)return actions.superblast?'superblast':null;
  if(fighter.charging)return actions.charge?'charge':null;
  // V82: a jump is an actual TAKEOFF animation, not a loop playing
  // throughout flight. Selecting acro before airborne used to suppress it.
  // Controlled Fly Down stays flight; falling is owned by Falling Idle.
  if(airborne){
   if(fighter.launched||fighter.spiked)return null;
   // Controlled flight is NOT an uncontrolled gravity fall.
   if(fighter.flying){
    const fast=Math.hypot(fighter.vel?.x||0,fighter.vel?.z||0)>3;
    if(fast&&actions.flying)return 'flying';
    return actions.floating?'floating':null;
   }
   if(fighter.jumping&&(fighter.vel?.y||0)>0&&
      fighter.acro?.type!=='flip')return actions.jump?'jump':null;
   // Non-powered gravity descent only (includes double-tap fly cancel).
   if((fighter.dropping||fighter.jumping&&(fighter.vel?.y||0)<-1)&&
      actions.fallingIdle)return 'fallingIdle';
   return null;
  }
  // Recorded landing takes priority over the old procedural landing acro.
  if(fighter.landingMotionT>0&&!fighter.sprinting)return actions.landing?'landing':null;
  if(fighter.acro&&fighter.acro.type!=='landing')return null;
  if(fighter.dashing)return actions.dodge?'dodge':null;
  const stick=Math.hypot(fighter.moveIntent?.x||0,fighter.moveIntent?.z||0);
  if(!fighter.sprinting&&actions.runStop&&!airborne&&
     (fighter.t||0)<(fighter._v82BoostStopEnd||-1)&&stick<.8)
   return 'runStop';
  // V80: ordinary full-radius joystick running is NOT Boost. Boost is
  // exclusively the explicit sprint button and uses its own faster pose,
  // trail and skid FX. No normal-run clip during boost or midair.
  if(fighter.sprinting){
   fighter.v80AnalogRun=false;
   // Boost is NOT normal joystick running; use a dedicated genuine Mixamo
   // high-speed forward-sprint cycle on the ground.
   return actions.boost?'boost':null;
  }
  if(speed>.75){
   // V88 walk lab: a full WASD press is a WALK, not an implicit
   // Standard Run. Keep the approved Standard Run asset untouched.
   if(new URLSearchParams(root.location?.search||'').get('movementLab')==='walk'){
    fighter.v80AnalogRun=false;
    return actions.walk?'walk':null; // V71 owns recorded walking legs.
   }
   const stick=Math.hypot(fighter.moveIntent?.x||0,fighter.moveIntent?.z||0);
   const full=stick>(fighter.v80AnalogRun?.68:.86);
   fighter.v80AnalogRun=!!(actions.run&&full&&speed>3);
   if(fighter.v80AnalogRun)return 'run';
   return actions.walk?'walk':null;
  }
  fighter.v80AnalogRun=false;
  return actions.idle?'idle':null;
 }
 function attach(THREE,fighter,actions,status,options={}){
  const marker=options.marker||'v72StudioPack';
  if(!fighter||typeof fighter.animate!=='function'||fighter[marker])return null;
  const old=fighter.animate;
  const state={rig:null,bones:null,bind:null,targetSide:null,slot:null,clock:0,weight:0,
    releasingIdle:false,releasingExtra:false,releaseEntry:null,
    samples:BONES.map(()=>new THREE.Quaternion()),frames:0};
  const sceneQ=new THREE.Quaternion(),inverseSceneQ=new THREE.Quaternion(),
        parentQ=new THREE.Quaternion(),target=new THREE.Quaternion(),wanted=new THREE.Quaternion(),
        qBasis=new THREE.Quaternion(),qBasisInv=new THREE.Quaternion(),
        mapped=new THREE.Quaternion(),unitY=new THREE.Vector3(0,1,0);
  function capture(rig){
   const humanoid=rig.vrm.humanoid,scene=rig.vrm.scene,get=n=>humanoid.getNormalizedBoneNode(n);
   const bones=BONES.map(get);
   const all=[...new Set(BONES.map(get).filter(Boolean))];
   const saved=all.map(node=>node.quaternion.clone());
   for(const node of all)node.quaternion.identity();
   scene.updateMatrixWorld(true);
   scene.getWorldQuaternion(inverseSceneQ).invert();
   const bind=bones.map(node=>node?
     inverseSceneQ.clone().multiply(node.getWorldQuaternion(new THREE.Quaternion())).normalize():null);
   const l=get('leftUpperArm'),r=get('rightUpperArm');
   if(!l||!r||!get('hips'))throw Error('Studio pack cannot retarget a nonhumanoid Kairo');
   const left=l.getWorldPosition(new THREE.Vector3()),right=r.getWorldPosition(new THREE.Vector3());
   const side=left.sub(right).applyQuaternion(inverseSceneQ);side.y=0;side.normalize();
   if(side.lengthSq()<.1)throw Error('Target character shoulders cannot determine facing');
   for(let i=0;i<all.length;i++)all[i].quaternion.copy(saved[i]);
   scene.updateMatrixWorld(true);
   state.rig=rig;state.bones=bones;state.bind=bind;state.targetSide=side;
  }
  fighter.animate=function(dt){
   old.call(this,dt);
   if(!this.vrmRig?.vrm)return;
   try{
    if(state.rig!==this.vrmRig)capture(this.vrmRig);
    const slot=options.choose?options.choose(this,actions,dt):choose(this,actions);
    const speed=Math.hypot(this.vel?.x||0,this.vel?.z||0);
    // V78: this layer is drawn AFTER V76's idle->walk pose. Previously an
    // idle-only pack was removed in ONE FRAME as soon as speed exceeded .75:
    // the exposed V76 (different) idle made the arms briefly jump upwards.
    // Cross-fade the published idle OUT over ~0.2s when starting to walk;
    // never keep an idle overlay during attack/air/block/stun.
    const safeAir=!!(this.jumping||this.flying)&&
      !(this.launched||this.spiked||this.dashing||
        this.punchT>0||this.blastT>0||this.stun>0||this.downT>0||
        this.superHitT>0||this.charging||this.blockHeld||this.blocking||
        this.slamming||this.acro);
    const safeWalk=slot===null&&this.hp>0&&
      (safeAir||(speed>.75&&
      !(this.launched||this.spiked||this.dashing||this.sprinting||
        this.punchT>0||this.blastT>0||this.stun>0||this.downT>0||
        this.superHitT>0||this.charging||this.blockHeld||this.blocking||
        this.slamming||this.acro)));
    if(options.choose){
     // Optional V79 action layer. Its independent one-shot motions fade out
     // into the existing locomotion/idle animations, rather than snapping.
     const hardCancel=this.punchT>0||this.blastT>0||this.stun>0||
       this.hp<=0||this.blocking||this.blockHeld;
     if(slot!==state.slot){
      if(!slot&&state.slot&&!hardCancel&&state.weight>.01){
       state.releaseEntry=actions[state.slot];state.releasingExtra=true;
       state.slot=null;
      }else{
       state.slot=slot;state.clock=0;state.weight=0;
       state.releasingExtra=false;state.releaseEntry=null;
      }
     }
     if(state.releasingExtra&&hardCancel){
      state.releasingExtra=false;state.weight=0;state.releaseEntry=null;
     }
    }else if(slot!==state.slot){
     if(slot==='idle'){
      state.slot=slot;state.clock=0;state.weight=0;state.releasingIdle=false;
     }else if(state.slot==='idle'&&safeWalk&&actions.idle){
      state.slot=null;state.releasingIdle=true;
      // Retain the LAST published idle keyframe and fade its influence.
     }else{
      state.slot=slot;state.clock=0;
      // V85: V81 is the final crossfade owner for the primary gameplay
      // states. Do not double-blend the recorded pose with procedural arms.
      state.weight=options.choose||new URLSearchParams(root.location?.search||'')
        .get('animationV85')==='legacy'?0:1;
      state.releasingIdle=false;
     }
    }
    if(state.releasingIdle&&!safeWalk){
     state.releasingIdle=false;state.weight=0;
    }
    const entry=slot?actions[slot]:options.choose?
      (state.releasingExtra?state.releaseEntry:null):(state.releasingIdle?actions.idle:null);
    if(!entry){state.weight=0;return;}
    const elapsed=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.065));
    if(state.releasingIdle||state.releasingExtra){
     state.weight*=Math.exp(-elapsed*(state.releasingExtra?12:15));
     if(state.weight<.005){state.weight=0;state.releasingIdle=false;
      state.releasingExtra=false;state.releaseEntry=null;return;}
    }else{
     state.weight+=(1-state.weight)*(1-Math.exp(-elapsed*11));
     if((this.punchT||0)>0){
      const progress=Math.max(0,Math.min(1,
       (this.attackElapsed||0)/Math.max(.07,this.attackTotal||.4)));
      // V87: real punches usually include a long idle lead-in/recovery.
      // Play their *contact window* over the gameplay strike, not the
      // entire 2-3 second file squeezed into a split second.
      const from=Number.isFinite(entry.attackStart)?entry.attackStart:0;
      const to=Number.isFinite(entry.attackEnd)?entry.attackEnd:entry.seconds;
      state.clock=from+(Math.max(from,Math.min(to,entry.seconds))-from)*progress;
     }else{
      let rate=entry.speed;
      if(slot==='walk'||slot==='run'){
       const travel=Math.hypot(this.vel?.x||0,this.vel?.z||0);
       // Match foot cycles to actual world speed. The previous 1.9x cap
       // leaves Kairo gliding at ~9 world units/sec on full joystick.
       const v87=new URLSearchParams(root.location?.search||'').get('gait')!=='legacy';
       rate*=v87?Math.max(.65,Math.min(slot==='run'?3.35:3.0,
         travel/(slot==='run'?2.7:2.45))):
         Math.max(.55,Math.min(1.9,travel/3.4));
      }
      if(slot==='boost')rate*=Math.max(.8,Math.min(1.5,
        Math.hypot(this.vel?.x||0,this.vel?.z||0)/21));
      if(slot==='landing')rate*=2.1; // play the genuine landing within the physics recovery
      if(slot==='runStop'&&new URLSearchParams(root.location?.search||'')
        .get('animationV85')!=='legacy')
       rate*=entry.seconds/Math.max(.68,this._v85StopDuration||.70);
      state.clock+=elapsed*rate;
     }
     entry.sample(state.clock,state.samples,LOOP.has(slot)||!!options.loopSlots?.includes(slot));
    }
    const sideSrc=new THREE.Vector3(entry.side[0],0,entry.side[1]).normalize();
    const sideDst=state.targetSide;
    const cross=sideSrc.z*sideDst.x-sideSrc.x*sideDst.z;
    const dot=sideSrc.x*sideDst.x+sideSrc.z*sideDst.z;
    qBasis.setFromAxisAngle(unitY,Math.atan2(cross,dot)+entry.yaw*Math.PI/180);
    qBasisInv.copy(qBasis).invert();
    const scene=state.rig.vrm.scene;
    scene.updateMatrixWorld(true);scene.getWorldQuaternion(sceneQ);
    for(let i=0;i<BONES.length;i++){
     // Keep recorded boxing strikes above the belt so support feet stay
     // planted, but allow real kicks to animate both legs and the torso.
     if(COMBAT_SLOTS.has(entry.slot)&&
        !['kick','sideKick'].includes(entry.slot)&&
        (i===0||i>=14))continue;
     // V80: the 0.9-second Mixamo run-to-stop file contains airborne
     // root/foot shapes when played without FBX translation. Let the
     // existing ground-contact/skid controller own the hips, knees and feet;
     // this optional clip only supplies its braking upper-body gesture.
     if((entry.slot==='runStop'&&(i===0||i>=14))||
        (!options.choose&&entry.slot==='guard'&&(i===0||i>=14))||
        (!options.choose&&entry.slot==='landing'&&i===0))continue;
     const node=state.bones[i],bind=state.bind[i];if(!node||!bind||!node.parent)continue;
     mapped.copy(qBasis).multiply(state.samples[i]).multiply(qBasisInv);
     wanted.copy(sceneQ).multiply(mapped).multiply(bind).normalize();
     node.parent.getWorldQuaternion(parentQ);
     target.copy(parentQ).invert().multiply(wanted).normalize();
     const angle=node.quaternion.angleTo(target),limit=i===0?Math.PI:2.7;
     if(angle>limit)target.copy(node.quaternion).slerp(target,limit/angle);
     node.quaternion.slerp(target,state.weight);
     node.updateMatrixWorld(true);
    }
    state.rig.vrm.update(0);
    state.frames++;
    status.active=state.releasingExtra?'extra-blend-out':
      state.releasingIdle?'idle-blend-to-walk':slot;
    status.frames=state.frames;
   }catch(err){
    status.error=String(err);console.error('Studio game pack disabled for fighter',err);
    fighter.animate=old;fighter[marker]=null;
   }
  };
  fighter[marker]=state;
  return state;
 }
 async function start(context=root){
  const status={ready:false,active:'none',frames:0,error:null,source:PATH};
  context.SkyClashPublishedActions=status;
  if(new URLSearchParams(context.location?.search||'').get('studioActions')==='off')return status;
  try{
   const response=await context.fetch(PATH,{cache:'no-cache'});
   if(response.status===404)return status; // Optional until the user publishes a pack.
   if(!response.ok)throw Error('Published motion pack HTTP '+response.status);
   const pack=await response.json();
   if(pack?.schema!=='sky-clash.studio-gamepack.v1'||pack.revision!==1||
      !Array.isArray(pack.motions)||pack.motions.length>50)throw Error('Invalid Studio game pack');
   const actions={};
   for(const entry of pack.motions){
    if(entry.character!=='kairo')continue; // Rin runtime mapping later.
    if(!['idle','walk','run','jump','runStop','dodge','punch1','punch2','punch3',
          'uppercut','kick','meteor','charge','superblast','hit'].includes(entry.slot))continue;
    actions[entry.slot]=decode(context.THREE,entry);
   }
   // V81: user-supplied Magic pack, offline-baked into true
   // 30fps normalized Mixamo quaternion clips. It is independent of their
   // approved custom idle/run and retains fallback if an asset is unavailable.
   try{
    const recorded=await context.fetch(OVERRIDES+'?v=810',{cache:'force-cache'});
    if(recorded.ok){
     const pack2=await recorded.json();
     if(pack2?.schema==='sky-clash.studio-gamepack.v1'&&pack2.revision===1&&
        Array.isArray(pack2.motions)){
      for(const entry of pack2.motions)if(
       entry.character==='kairo'&&['boost','guard','landing'].includes(entry.slot))
       actions[entry.slot]=decode(context.THREE,entry);
     }
    }
   }catch(e){console.warn('V81 recorded combat/boost poses unavailable',e);}
   // V86 adds genuine, offline-baked UE5/Quinn Mixamo motions. The source
   // FBX uses Z-up and pelvis/spine_01 naming; all joints are mapped into
   // the SAME Y-up, world-bind-delta format as the older standard Mixamo
   // library. Never replace the approved idle, Standard Run, or Boost.
   if(new URLSearchParams(context.location?.search||'').get('ue5')!=='off'){
    try{
     const response=await context.fetch(UE5_PACK+'?v=860',{cache:'no-cache'});
     if(response.ok){
      const pack3=await response.json();
      if(pack3?.schema==='sky-clash.studio-gamepack.v1'&&pack3.revision===1&&
         Array.isArray(pack3.motions)&&pack3.motions.length===16){
       const extras={};
       for(const entry of pack3.motions){
        if(entry.character!=='kairo')continue;
        const motion=decode(context.THREE,entry);
        extras[entry.slot]=motion;
        if(UE5_ACTIVE.has(entry.slot))actions[entry.slot]=motion;
       }
       status.ue5Available=Object.keys(extras);
       status.ue5Installed=[...UE5_ACTIVE].filter(name=>!!extras[name]);
      }
     }
    }catch(e){status.ue5Error=String(e);console.warn('V86 UE5 motions unavailable; original animations retained',e);}
   }
   // V87: independent recorded punch/kick pack, using already licensed
   // motions in the game's original Mixamo library. Failure preserves the
   // previous combat fallback and never blocks player controls.
   if(new URLSearchParams(context.location?.search||'').get('recordedCombat')!=='off'){
    try{
     const response=await context.fetch(COMBAT_PACK+'?v=870',{cache:'no-cache'});
     if(response.ok){
      const combat=await response.json();
      if(combat?.schema==='sky-clash.studio-gamepack.v1'&&
         Array.isArray(combat.motions)&&combat.motions.length===7){
       for(const entry of combat.motions)
        if(COMBAT_SLOTS.has(entry.slot)&&entry.character==='kairo')
         actions[entry.slot]=decode(context.THREE,entry);
       status.combatClips=[...COMBAT_SLOTS].filter(slot=>!!actions[slot]);
      }
     }
    }catch(e){status.combatError=String(e);console.warn('V87 recorded combat unavailable',e);}
   }
   if(!Object.keys(actions).length)return status;
   const fighters=[context.SkyClash?.Game?.heroes?.kairo_venn,context.SkyClash?.Game?.enemy];
   let count=0;
   for(const f of fighters)if(attach(context.THREE,f,actions,status))count++;
   if(count){status.ready=true;status.actions=Object.keys(actions);status.characters=count;}
  }catch(err){status.error=String(err);console.warn('Published Studio pack skipped; V71 walk remains',err);}
  return status;
 }
 const api={decode,choose,attach,start,BONES};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashPublishedGamePack=api;
})(typeof window!=='undefined'?window:globalThis);
