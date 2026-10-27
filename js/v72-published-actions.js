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
 const NATIVE_PLAYTEST='assets/animations/kairo/original-jab-playtest.v1.json';
 const NATIVE_SET='assets/animations/kairo/storm-fist.v1.json';
 const COMBAT_SLOTS=new Set(['punch1','punch2','punch3','overhand','airStrike','kick','sideKick']);
 // Safe rollback: ?ue5=off restores all earlier published Studio motions.
 const UE5_ACTIVE=new Set(['guard','jump','landing','fallingToLanding','runStop',
  'floating','flying','fallingIdle']);

 const BONES=['hips','spine','chest','upperChest','neck','head',
  'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
  'leftUpperLeg','leftLowerLeg','leftFoot',
  'rightUpperLeg','rightLowerLeg','rightFoot'];
 const LOOP=new Set(['idle','walk','run','guard','boost','floating','flying','fallingIdle']);
 // Private authoring transport, registered explicitly by the browser verifier.
 // No asset is fetched or enabled by normal gameplay. These are SDK-native
 // LOCAL ABSOLUTE rotations, never Mixamo world-rest deltas.
 const NATIVE_MODEL='775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72';
 const NATIVE_RIG='94130ff7e42ab6fb207fec21078b41b64f824052259ab85ae233ee770ee4ef72';
 function decodeNativeCombatPreview(THREE,pack){
  if(pack?.schema!=='sky-clash.native-combat-preview.v1'||
     pack.status!=='UNAPPROVED_PRIVATE_PREVIEW'||
     pack.characterId!=='kairo_venn'||pack.modelSha256!==NATIVE_MODEL||
     pack.rigSignature!==NATIVE_RIG||pack.clipId!=='original-jab'||
     pack.durationSeconds!==.55||pack.impactSeconds!==.24||
     JSON.stringify(pack.bones)!==JSON.stringify(BONES)||
     !Array.isArray(pack.frames)||pack.frames.length<3||pack.frames.length>1000)
   throw Error('Invalid private native combat preview identity or format');
  return decodeNativeClip(THREE,pack,true);
 }
 function decodeNativeClip(THREE,pack,recover=false){
  const duration=pack.durationSeconds;
  if(typeof pack.clipId!=='string'||!Number.isFinite(duration)||duration<=0||duration>3||
     !Number.isFinite(pack.impactSeconds)||pack.impactSeconds<0||pack.impactSeconds>duration||
     !Array.isArray(pack.frames)||pack.frames.length<3||pack.frames.length>1000)
   throw Error('Invalid native combat clip');
  const frames=pack.frames.map((frame,index)=>{
   if(!Number.isFinite(frame.time)||frame.time<0||frame.time>duration||
      index>0&&frame.time<=pack.frames[index-1].time||
      !Array.isArray(frame.hipsPosition)||frame.hipsPosition.length!==3||
      !frame.hipsPosition.every(v=>Number.isFinite(v)&&Math.abs(v)<10)||
      !Array.isArray(frame.quaternions)||frame.quaternions.length!==BONES.length)
    throw Error('Invalid native combat frame');
   const support=frame.support;
   if(support&&(!['left','right'].every(side=>typeof support[side]==='boolean')))
    throw Error('Invalid native support contacts');
   return {time:frame.time,hipsPosition:new THREE.Vector3().fromArray(frame.hipsPosition),
    support:support?{left:support.left,right:support.right}:null,
    quaternions:frame.quaternions.map(q=>{
     if(!Array.isArray(q)||q.length!==4||!q.every(Number.isFinite)||
        Math.abs(Math.hypot(...q)-1)>1e-5)
      throw Error('Invalid native combat quaternion');
     return new THREE.Quaternion(...q).normalize();
    })};
  });
  if(frames[0].time!==0||frames[frames.length-1].time!==duration||
     recover&&(frames[0].hipsPosition.distanceTo(frames[frames.length-1].hipsPosition)>1e-6||
       frames[0].quaternions.some((q,i)=>q.angleTo(frames[frames.length-1].quaternions[i])>1e-5)))
   throw Error('Native combat clip has invalid entry or recovery');
  function bracket(seconds){
   const t=Math.max(0,Math.min(duration,seconds));
   let lo=0,hi=frames.length-1;
   while(lo<hi){const mid=(lo+hi)>>1;if(frames[mid].time<t)lo=mid+1;else hi=mid;}
   hi=lo;lo=Math.max(0,hi-1);
   const a=frames[lo],b=frames[hi],weight=hi===lo?0:(t-a.time)/(b.time-a.time);
   return {a,b,weight};
  }
  return {clipId:pack.clipId,durationSeconds:duration,impactSeconds:pack.impactSeconds,
   loop:pack.loop===true,
   sampleSupport(seconds){const {a,b,weight}=bracket(seconds);return (weight<.5?a:b).support;},
   sampleHips(seconds,out){
    const {a,b,weight}=bracket(seconds);
    if(weight<=0)return out.copy(a.hipsPosition);
    if(weight>=1)return out.copy(b.hipsPosition);
    return out.lerpVectors(a.hipsPosition,b.hipsPosition,weight);
   },
   sample(seconds,out){
    const {a,b,weight}=bracket(seconds);
    for(let i=0;i<BONES.length;i++)
     out[i].slerpQuaternions(a.quaternions[i],b.quaternions[i],weight).normalize();
    return out;
   }};
 }
 const NATIVE_CLIPS=new Set(['original-jab','original-cross','original-hook','original-overhand',
  'rising-kick','roundhouse','side-kick','air-strike','sky-uppercut','sky-kick','falling-fist',
  'guard','parry','hit-light','hit-heavy','hit-left','hit-right']);
 function registerNativeCombatSet(THREE,status,pack){
  if(pack?.schema!=='sky-clash.native-combat-set.v1'||pack.status!=='EXPERIMENTAL_PLAYTEST'||
     pack.characterId!=='kairo_venn'||pack.modelSha256!==NATIVE_MODEL||pack.rigSignature!==NATIVE_RIG||
     JSON.stringify(pack.bones)!==JSON.stringify(BONES)||!Array.isArray(pack.clips)||
     !pack.clips.length||pack.clips.length>NATIVE_CLIPS.size)
   throw Error('Invalid native Storm Fist set identity');
  const clips={};
  for(const clip of pack.clips){
   if(!NATIVE_CLIPS.has(clip.clipId)||clips[clip.clipId])throw Error('Invalid or duplicate native clip');
   clips[clip.clipId]=decodeNativeClip(THREE,clip,clip.clipId==='original-jab');
  }
  for(const id of ['original-jab','original-cross','original-hook','original-overhand','rising-kick',
      'air-strike','sky-uppercut','sky-kick','falling-fist','guard','parry',
      'hit-light','hit-heavy','hit-left','hit-right'])
   if(!clips[id])throw Error('Incomplete native Storm Fist set: '+id);
  status.nativeCombatSet={clips};
  return Object.keys(clips);
 }
 function nativeAttackId(f){
  const kind=f.attackKind;
  if(kind==='skyUppercut')return 'sky-uppercut';
  if(kind==='skyKick')return 'sky-kick';
  if(kind==='fallingFist')return 'falling-fist';
  if(kind==='airStrike')return 'air-strike';
  if(kind==='sideKick')return 'side-kick';
  if(kind==='roundhouse')return 'roundhouse';
  if(kind==='kick'){
   if(f.attackAir)return 'air-strike';
   const move=f.moveIntent;
   if(move&&Math.hypot(move.x||0,move.z||0)>.55&&typeof f.forward==='function'){
    const forward=f.forward(),ahead=move.x*forward.x+move.z*forward.z,
     lateral=forward.z*move.x-forward.x*move.z;
    // Existing directional intent changes choreography only. All three
    // finishers retain the same canonical launcher clock and game rules.
    if(Math.abs(lateral)>.45&&Math.abs(lateral)>Math.abs(ahead)*.7)return 'roundhouse';
    if(ahead>.45)return 'side-kick';
   }
   return 'rising-kick';
  }
  if(kind==='hook')return f.attackVariant==='overhand'?'original-overhand':'original-hook';
  if(kind==='punch')return f.punchSide===1?'original-jab':'original-cross';
  return null;
 }

 function registerNativeCombatPreview(THREE,status,pack){
  // Validate/copy before changing the current preview, including its arrays.
  const decoded=decodeNativeCombatPreview(THREE,pack);
  status.nativeCombatPreview=decoded;
  return {clipId:decoded.clipId,durationSeconds:.55,impactSeconds:.24};
 }
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
   // V98 opt-in: "flying" measures height above terrain, not intentional
   // flight. During an ordinary hop it becomes true almost immediately,
   // hiding the recorded jumping-up / falling clips under floating.
   // Route genuine jump ascent, apex, gravity descent and deliberate
   // fly-cancel BEFORE checking height-based flight. Do not alter physics,
   // acrobatics, combat or the default (non-lab) animation pipeline.
   if(new URLSearchParams(root.location?.search||'').get('airLab')==='jump'){
    if(fighter.dropping)return actions.fallingIdle?'fallingIdle':null;
    if(fighter.jumping&&fighter.acro?.type!=='flip'){
     const vy=fighter.vel?.y||0;
     // Small apex deadband avoids a single frame of hovering between clips.
     if(vy>=-.7)return actions.jump?'jump':null;
     return actions.fallingIdle?'fallingIdle':null;
    }
   }
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
   if(['walk','step'].includes(new URLSearchParams(root.location?.search||'').get('movementLab'))){
    // V95: outer radius is a true analog RUN, not Boost; keyboard keeps
    // walking. Reuse the existing published Standard Run retargeter and
    // preserve V94's exact idle-to-walk pose crossfade.
    const radiusLab=!!root.SkyClashMovementLab?.joystickRun&&
      fighter===root.SkyClash?.Game?.heroes?.kairo_venn;
    const runReady=!!(radiusLab&&fighter.v95JoystickRun&&
      fighter.v89Step?.mode==='walk'&&speed>3&&actions.run);
    fighter.v80AnalogRun=runReady;
    if(runReady)return 'run';
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
    nativePreviewActive:false,nativePreviewTime:null,nativeClipId:null,
    nativeKey:null,nativeEntry:null,nativeEntryHips:null,nativeAge:0,nativeFeet:{},
    nativeEpoch:null,nativeAttackSerial:null,nativeAttackClip:null,
    nativeSupportCorrection:0,
    nativePreviewSerial:null,nativePreviewCancelled:false,
    samples:BONES.map(()=>new THREE.Quaternion()),
    v154Run:BONES.map(()=>new THREE.Quaternion()),v154Motion:null,frames:0};
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
  // Contact correction belongs to this same full-body owner. The authored
  // bend plane is retained while a marked support sole stays in world space;
  // no physics root, velocity, hit volume or gameplay clock is changed.
  function supportFoot(side,time,clip){
   const contacts=clip.sampleSupport(time);
   if(!contacts)return;
   const upper=state.bones[side==='left'?14:17],lower=state.bones[side==='left'?15:18],
    foot=state.bones[side==='left'?16:19];
   if(!upper||!lower||!foot)return;
   const planted=contacts[side];
   const a=upper.getWorldPosition(new THREE.Vector3()),b=lower.getWorldPosition(new THREE.Vector3()),
    c=foot.getWorldPosition(new THREE.Vector3());
   let contact=state.nativeFeet[side];
   if(planted){
    if(!contact)contact=state.nativeFeet[side]={point:c.clone(),weight:1};
    contact.weight=1;
   }else{
    if(!contact)return;
    contact.weight*=Math.exp(-Math.max(0,state.nativeFrameDt||0)*45);
    if(contact.weight<.01){delete state.nativeFeet[side];return;}
   }
   const goal=c.clone().lerp(contact.point,contact.weight),axis=goal.clone().sub(a),l1=a.distanceTo(b),l2=b.distanceTo(c);
   const distance=axis.length();if(distance<1e-5||l1<1e-5||l2<1e-5)return;
   axis.divideScalar(distance);
   const d=Math.max(Math.abs(l1-l2)+.001,Math.min(distance,(l1+l2)*.998));
   const x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));
   const bend=b.clone().sub(a).addScaledVector(axis,-b.clone().sub(a).dot(axis));
   if(bend.lengthSq()<1e-8)return;
   const knee=a.clone().addScaledVector(axis,x).addScaledVector(bend.normalize(),h);
   const sole=foot.getWorldQuaternion(new THREE.Quaternion());
   function aim(node,from,to){
    if(from.lengthSq()<1e-10||to.lengthSq()<1e-10)return;
    const delta=new THREE.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
    const world=node.getWorldQuaternion(new THREE.Quaternion()).premultiply(delta);
    const parent=node.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    node.quaternion.copy(parent.multiply(world)).normalize();node.updateMatrixWorld(true);
   }
   aim(upper,b.clone().sub(a),knee.clone().sub(a));
   const kb=lower.getWorldPosition(new THREE.Vector3()),fc=foot.getWorldPosition(new THREE.Vector3());
   aim(lower,fc.sub(kb),a.clone().addScaledVector(axis,d).sub(kb));
   foot.quaternion.copy(foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(sole)).normalize();
   foot.updateMatrixWorld(true);
   state.nativeSupportCorrection=Math.max(state.nativeSupportCorrection,c.distanceTo(foot.getWorldPosition(new THREE.Vector3())));
  }
  fighter.animate=function(dt){
   // Fighter instances survive rematches/dojo resets. A reset discards old
   // world contact anchors and animation events even if guarding resumes
   // before another idle frame has been drawn.
   if(state.nativeEpoch!==this.nativeCombatEpoch){
    state.nativeEpoch=this.nativeCombatEpoch;state.nativeKey=null;
    state.nativeFeet={};state.nativeEntry=null;state.nativeEntryHips=null;
    state.nativePreviewActive=false;state.nativeAttackSerial=null;state.nativeAttackClip=null;
   }
   const priorNative=state.nativePreviewActive;
   const outgoing=(priorNative||status.nativeCombatSet)&&state.bones?state.bones.map(n=>n?n.quaternion.clone():null):null;
   const outgoingHips=(priorNative||status.nativeCombatSet)&&state.bones?.[0]?state.bones[0].position.clone():null;
   state.nativePreviewActive=false;state.nativePreviewTime=null;state.nativeClipId=null;
   state.nativeSupportCorrection=0;
   state.nativeFrameDt=Math.max(0,Math.min(.065,Number.isFinite(dt)?dt:0));
   const previewSerial=Number(this.attackSerial||0);
   if(!(this.punchT>0)||state.nativePreviewSerial!==previewSerial){
    state.nativePreviewSerial=previewSerial;state.nativePreviewCancelled=false;
   }
   const nativeBlocked=this.hp<=0||this.attackAir||this.flying||this.jumping||
     this.launched||this.spiked||this.stun>0||this.downT>0||
     this.superHitT>0||this.slamming||this.blockHeld||this.blocking;
   // Damage/guard/air interruption relinquishes this particular swing for
   // good. Its gameplay punchT may outlive the stun; it must not resurrect
   // an already canceled source clip when that stun wears off.
   if((status.nativeCombatPreview||status.nativeCombatSet)&&!options.choose&&
      this.characterId==='kairo_venn'&&this.punchT>0&&
      (status.nativeCombatSet?(this.hp<=0||this.launched||this.spiked||this.stun>0||
       this.downT>0||this.superHitT>0||this.slamming||this.blockHeld||this.blocking):nativeBlocked))
    state.nativePreviewCancelled=true;
   old.call(this,dt);
   // Also applies to the V79 optional-action wrapper, which reuses
   // this attach() function. One authoritative pose during air.
   if(root.SkyClashV100Animator?.ownsAir(this))return;
   if(!this.vrmRig?.vrm)return;
   try{
    if(state.rig!==this.vrmRig)capture(this.vrmRig);
    const slot=options.choose?options.choose(this,actions,dt):choose(this,actions);
    const set=!options.choose&&this.characterId==='kairo_venn'?status.nativeCombatSet:null;
    let native=status.nativeCombatPreview,nativeTime=null,nativeKey=null,nativeMode='attack';
    const nativeJab=native&&!options.choose&&this.characterId==='kairo_venn'&&
      this.hp>0&&this.punchT>0&&this.attackKind==='punch'&&this.punchSide===1&&
      !state.nativePreviewCancelled&&!nativeBlocked;
    if(set&&this.hp>0&&!this.downT&&!this.launched&&!this.spiked&&!this.slamming&&!this.superHitT){
     const reaction=this.nativeCombatReaction,parry=this.nativeCombatParry;
     if(this.stun>0&&reaction){
      native=set.clips[reaction.clipId]||set.clips['hit-light'];nativeMode='damage';
      nativeTime=Math.min(native.durationSeconds,Math.max(0,(this.t||0)-reaction.at));
      nativeKey='reaction:'+reaction.serial;
     }else if(this.stun<=0&&(this.blockHeld||this.blocking)){
      const parryAge=parry?Math.max(0,(this.t||0)-parry.at):Infinity;
      const isParry=parryAge<set.clips.parry.durationSeconds;
      native=set.clips[isParry?'parry':'guard'];nativeMode='guard';
      nativeTime=isParry?parryAge:native.loop?Math.max(0,this.blockT||0)%native.durationSeconds:
       Math.min(native.durationSeconds,Math.max(0,this.blockT||0));
      nativeKey=isParry?'parry:'+parry.serial:'guard';
     }else if(this.punchT>0&&this.stun<=0&&!state.nativePreviewCancelled){
      // Choose a directional finisher once per genuine attack. Steering
      // during its recovery must not jump to another authored clip.
      const attackSerial=Number(this.attackSerial||0);
      if(state.nativeAttackSerial!==attackSerial){
       state.nativeAttackSerial=attackSerial;state.nativeAttackClip=nativeAttackId(this);
      }
      native=set.clips[state.nativeAttackClip];
      if(native){
       nativeTime=Math.max(0,Math.min(1,(this.attackElapsed||0)/Math.max(.001,this.attackTotal||native.durationSeconds)))*native.durationSeconds;
       nativeKey='attack:'+Number(this.attackSerial||0);
      }
     }
    }
    if(nativeJab&&nativeTime===null){
     native=status.nativeCombatPreview;
     nativeTime=Math.max(0,Math.min(1,(this.attackElapsed||0)/Math.max(.001,this.attackTotal||.55)))*native.durationSeconds;
     nativeKey='jab:'+Number(this.attackSerial||0);
    }
    if(native&&nativeTime!==null){
     // All native states enter through the recovered V72 sampler. V81
     // retains fingers/exit transitions and yields its duplicate body fade.
     if(state.nativeKey!==nativeKey){
      state.nativeKey=nativeKey;state.nativeAge=0;state.nativeFeet={};
      state.nativeEntry=outgoing;state.nativeEntryHips=outgoingHips;
     }
     state.nativeAge+=Math.max(0,Math.min(.065,Number.isFinite(dt)?dt:0));
     state.nativePreviewTime=nativeTime;state.nativeClipId=native.clipId;
     native.sample(nativeTime,state.samples);
     // A short handoff retains the actual outgoing pose across chained
     // attacks and aerial/guard entries. It ends before canonical contact.
     const fade=set&&native.clipId!=='original-jab'&&state.nativeEntry?
      Math.min(1,state.nativeAge/(nativeMode==='damage'?.035:.065)):1;
     const blend=fade*fade*(3-2*fade);
     for(let i=0;i<BONES.length;i++){
      const node=state.bones[i];if(!node)continue;
      node.quaternion.copy(state.samples[i]);
      if(blend<1&&state.nativeEntry[i])node.quaternion.slerpQuaternions(state.nativeEntry[i],state.samples[i],blend).normalize();
     }
     native.sampleHips(nativeTime,state.bones[0].position);
     if(blend<1&&state.nativeEntryHips)state.bones[0].position.lerpVectors(state.nativeEntryHips,state.bones[0].position.clone(),blend);
     state.rig.vrm.scene.updateMatrixWorld(true);
     if(set&&native.clipId!=='original-jab'&&nativeMode!=='damage'&&
       !(this.attackAir||this.flying||this.jumping)){
      supportFoot('left',nativeTime,native);supportFoot('right',nativeTime,native);
     }
     state.nativePreviewActive=true;
     state.slot=slot;state.clock=nativeTime;state.weight=1;
     state.releasingIdle=false;state.releasingExtra=false;state.releaseEntry=null;
     state.rig.vrm.update(0);state.frames++;
     status.active=set?'native-storm-fist:'+native.clipId:'native-private-original-jab';
     status.nativeClipId=native.clipId;status.frames=state.frames;
     return;
    }
    state.nativeKey=null;state.nativeFeet={};state.nativeEntry=null;state.nativeEntryHips=null;
    const speed=Math.hypot(this.vel?.x||0,this.vel?.z||0);
    // V154 reuses this EXISTING V72 final Boost writer; no new animation
    // wrapper and no gameplay root/velocity changes. Kairo preview only.
    const boostMode=new URLSearchParams(root.location?.search||'').get('boostPreview');
    const boostClip=!options.choose&&this.characterId==='kairo_venn'?
      boostMode==='v155'?root.SkyClashV155Organic:
      boostMode==='v154'?root.SkyClashV154Boost:null:null;
    if(boostClip)state.v154Motion=boostClip.step(state.v154Motion,this,dt);
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
       // V95: the approved Standard Run has a ~0.73s source loop.
       // Do not accelerate it to 2.3x for this controlled joystick gait;
       // this previously made Kairo's legs pedal unnaturally fast.
       const analogRun=slot==='run'&&root.SkyClashMovementLab?.joystickRun&&
         this===root.SkyClash?.Game?.heroes?.kairo_venn;
       rate*=analogRun?Math.max(1.05,Math.min(1.55,travel/4.5)):
         v87?Math.max(.65,Math.min(slot==='run'?3.35:3.0,
         travel/(slot==='run'?2.7:2.45))):
         Math.max(.55,Math.min(1.9,travel/3.4));
      }
      if(slot==='boost')rate*=boostClip?boostClip.boostRate(speed):
        Math.max(.8,Math.min(1.5,speed/21));
      if(slot==='landing')rate*=2.1; // play the genuine landing within the physics recovery
      if(slot==='runStop'&&new URLSearchParams(root.location?.search||'')
        .get('animationV85')!=='legacy')
       rate*=entry.seconds/Math.max(.68,this._v85StopDuration||.70);
      state.clock+=elapsed*rate;
     }
     entry.sample(state.clock,state.samples,LOOP.has(slot)||!!options.loopSlots?.includes(slot));
     if(boostClip&&slot==='boost'&&actions.run&&state.v154Motion?.ground>.001){
      // 18-frame old sprint had frantic lower-body pedalling. Retain its
      // real attack-speed upper-body drive but phase-align 62% of the
      // approved Standard Run's weight-bearing footwork at full Boost.
      const run=actions.run,srcSpan=Math.max(.05,entry.seconds-1/entry.fps),
       dstSpan=Math.max(.05,run.seconds-1/run.fps),
       phase=((state.clock/srcSpan)%1+1)%1;
      run.sample(phase*dstSpan,state.v154Run,true);
      const blend=boostClip.groundMix(state.v154Motion);
      for(let i=0;i<BONES.length;i++){
       const influence=boostMode==='v155'?blend:
        i>=14?blend:i<=5?blend*.58:blend*.43;
       state.samples[i].slerp(state.v154Run[i],influence).normalize();
      }
     }
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
     // V92: the approved idle arms are now owned by V76 throughout
     // standing, first-step and walking. V72 still owns the approved
     // hips/spine/head/legs. Do not let TWO different idle sources
     // overwrite the wrists/shoulders during the same frame.
     // V97: when V76 uses the same approved idle, it is the sole
     // idle-arm writer. Do not overlay independently clocked idle arms.
     const armMode=new URLSearchParams(root.location?.search||'');
     const unified=armMode.get('stance')==='unified'||
       armMode.get('idleArms')==='anchored';
     if(unified&&!options.choose&&entry.slot==='idle'&&i>=6&&i<=13&&
        root.SkyClashUpperBody?.ready&&status.approvedIdle)continue;
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
    if(boostClip&&this.sprinting&&this.flying&&state.v154Motion?.air>.015){
     const owner=root.SkyClashV100Animator,rig=state.rig;
     if(owner?.v137CorrectPelvisBalance&&owner?.v136CorrectSuspendedTorso&&
       owner?.v128CorrectFlightLegs&&owner?.v129CorrectFlightGuard){
      const forward=owner.realKairoForward(THREE,rig,null),
       pose=boostClip.airPose(state.v154Motion,this),
       strength=Math.min(1,pose.boostWeight*1.15);
      // Visual geometry is corrected once INSIDE the existing V72
      // Boost owner; V100 yields combat/Boost as before.
      owner.v137CorrectPelvisBalance(THREE,rig,forward,pose,strength);
      owner.v136CorrectSuspendedTorso(THREE,rig,forward,pose,strength);
      owner.v128CorrectFlightLegs(THREE,rig,forward,pose,strength);
      owner.v129CorrectFlightGuard(THREE,rig,forward,pose,strength,
        null,Math.max(0,dt),null,boostMode==='v155'?'organic-flight':'streamlined');
     }
    }
    if(boostClip){
     status.v154GroundMix=+boostClip.groundMix(state.v154Motion).toFixed(3);
     status.v154AirStreamline=+(state.v154Motion?.air||0).toFixed(3);
     status.v154Source=slot==='boost'?(boostMode==='v155'?
        'approved Standard Run entirely, athletic Boost cadence':
        'baked-boost + approved-run blended'):
       this.sprinting&&this.flying?(boostMode==='v155'?
        'arched bent-body flight with folded knees':'baked-flight + authored streamline'):'none';
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
 async function loadNativeCombatPlaytest(context,status){
  if(!status.ready||!status.nativePlaytest.requested)return;
  const state=status.nativePlaytest;
  const fullSet=state.mode==='storm-fist-v1',path=fullSet?NATIVE_SET:NATIVE_PLAYTEST;
  state.state='loading';state.source=path;
  const Controller=context.AbortController||root.AbortController;
  const controller=Controller?new Controller():null;
  const schedule=context.setTimeout||setTimeout,cancel=context.clearTimeout||clearTimeout;
  let timer;
  try{
   // Bound both the fetch and JSON body read. A missing experiment must
   // never prevent the normal game from releasing its startup gate.
   const deadline=new Promise((resolve,reject)=>{
    timer=schedule(()=>{
     controller?.abort();reject(Error('Experimental jab request timed out'));
    },5000);
   });
   const request=(async()=>{
    const response=await context.fetch(path+'?v='+(fullSet?'storm-fist-v1':'blender-jab-v1'),{
     cache:'no-cache',...(controller?{signal:controller.signal}:{})});
    if(!response.ok)throw Error('Experimental jab HTTP '+response.status);
    return response.json();
   })();
   const pack=await Promise.race([request,deadline]);
   if(fullSet)state.clips=registerNativeCombatSet(context.THREE,status,pack);
   else registerNativeCombatPreview(context.THREE,status,pack);
   state.state='ready';state.clipId=pack.clipId;
  }catch(error){
   // Keep this error separate from the base animation pack's readiness.
   // No partially decoded native clip is installed on failure.
   state.state='fallback';state.error=String(error);
   (context.console||console).warn('Experimental jab unavailable; original combat retained',error);
  }finally{if(timer!==undefined)cancel(timer);}
 }
 async function start(context=root){
  const flags=new URLSearchParams(context.location?.search||'');
  const mode=flags.get('combatAnim');
  const requested=mode==='blender-jab-v1'||mode==='storm-fist-v1';
  const status={ready:false,active:'none',frames:0,error:null,source:PATH,
   nativePlaytest:{requested,mode,state:requested?'unavailable':'off'}};
  status.registerNativeCombatPreview=pack=>registerNativeCombatPreview(context.THREE,status,pack);
  status.clearNativeCombatPreview=()=>{status.nativeCombatPreview=null;};
  status.registerNativeCombatSet=pack=>registerNativeCombatSet(context.THREE,status,pack);
  status.clearNativeCombatSet=()=>{status.nativeCombatSet=null;};
  context.SkyClashPublishedActions=status;
  if(flags.get('studioActions')==='off'){
   if(requested)status.nativePlaytest.state='disabled';
   return status;
  }
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
   // Pass the actual approved idle recording (NOT the old fighting-idle
   // fallback) to the continuous V76 upper-body owner for the V92 lab.
   // This is the same clip already used by V72 for torso and legs.
   if(actions.idle)status.approvedIdle=actions.idle;
   // V100 reuses these exact decoded UE5/approved clips without a second
   // asset loader or another wrapper that fights over the same bones.
   status.motionClips=actions;
   if(!Object.keys(actions).length)return status;
   const fighters=[context.SkyClash?.Game?.heroes?.kairo_venn,context.SkyClash?.Game?.enemy];
   let count=0;
   for(const f of fighters)if(attach(context.THREE,f,actions,status))count++;
   if(count){
    status.ready=true;status.actions=Object.keys(actions);status.characters=count;
    await loadNativeCombatPlaytest(context,status);
   }
  }catch(err){status.error=String(err);console.warn('Published Studio pack skipped; V71 walk remains',err);}
  return status;
 }
 const api={decode,choose,attach,start,BONES,decodeNativeCombatPreview,registerNativeCombatPreview,registerNativeCombatSet,nativeAttackId};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashPublishedGamePack=api;
})(typeof window!=='undefined'?window:globalThis);
