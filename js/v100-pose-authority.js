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
 // V114: dedicated airborne silhouettes, not grounded-idle offsets.
 function airborneFlightPose(mix,vertical=0,lateral=0){
  const travel=smooth(clamp(mix,0,1)),rise=smooth(clamp(vertical/7,0,1));
  const descend=smooth(clamp(-vertical/7,0,1));
  const bank=clamp(lateral/6.2,-1,1);
  return {
   mix:travel,rise,descend,
   hipsX:.065+.115*travel-.040*rise+.040*descend,
   spineX:-.025+.245*travel-.045*rise+.045*descend,
   chestX:-.025+.105*travel-.035*rise,
   neckX:.035-.105*travel+.025*rise,
   spineZ:-.065*bank*(.35+.65*travel),
   leftShoulderX:-.175+.040*travel,rightShoulderX:-.155+.040*travel,
   leftUpperArmX:.255+.145*travel,rightUpperArmX:.225+.145*travel,
   leftLowerArmX:-.245+.050*travel,rightLowerArmX:-.215+.050*travel,
   leftThighX:-.275-.155*travel-.040*rise+.070*descend,
   rightThighX:-.105-.285*travel-.040*rise+.070*descend,
   leftKneeX:.62-.20*travel-.11*rise+.12*descend,
   rightKneeX:.47-.09*travel-.11*rise+.12*descend,
   leftAnkleX:-.110+.060*travel,rightAnkleX:-.075+.040*travel
  };
 }

 // V126 design revision: close-combat levitation, NOT Superman travel.
 // Small arena movement at ~0–6.2u/s is not a high-speed flight dash:
 // Kairo should stay upright and face the opponent throughout normal
 // hovering, strafing, ascending, and cruising. A strong horizontal
 // profile belongs to the separately owned Boost/fast-dash state.
 // All offsets remain in the EXISTING V100 final pose composition.
 // Use only a muted suspended-knee/guard silhouette from V114, NOT its
 // excessive accumulated hips+spine+chest travel pitch.
 function v126FlightPose(mix,vertical=0,lateral=0,age=0){
  const travel=smooth(clamp(mix,0,1));
  const rise=smooth(clamp(vertical/7,0,1));
  const drop=smooth(clamp(-vertical/7,0,1));
  const bank=clamp(lateral/6.2,-1,1);
  const hover=1-.75*travel;
  const wave=Math.sin(Math.max(0,age)*2.1);
  const follow=Math.sin(Math.max(0,age)*2.1-.60);
  return {
   profile:'V126 upright combat levitation',mix:travel,rise,descend:drop,
   // Hips+spine+chest total ≈ 0.15 rad at full cruise, not the
   // ≈0.48 rad from the V114 cascade. Head remains facing opponent.
   hipsX:.042+.040*travel-.014*rise+.017*drop,
   spineX:-.015+.070*travel-.018*rise+.014*drop+
    .006*hover*wave,
   chestX:-.022+.035*travel-.009*rise+.009*drop+
    .004*hover*follow,
   neckX:.025-.040*travel+.008*rise,
   // Bank gently when strafing; Kairo needn't roll across the arena.
   spineZ:-.052*bank*(.33+.67*travel),
   chestZ:-.020*bank*(.33+.67*travel),
   // Relaxed, offset fighting guard: no airplane wings, frozen T-pose,
   // or both fists thrust ahead. Small delayed shoulder/arm response.
   leftShoulderX:-.155+.020*travel+.007*hover*follow-.010*bank,
   rightShoulderX:-.135+.020*travel-.007*hover*follow+.010*bank,
   leftUpperArmX:.235+.045*travel-.019*rise+.014*drop-
    .018*bank+.008*hover*follow,
   rightUpperArmX:.205+.045*travel-.019*rise+.014*drop+
    .018*bank-.008*hover*follow,
   leftLowerArmX:-.220+.018*travel,
   rightLowerArmX:-.200+.018*travel,
   // Floating boots: one knee gently higher, ankles pointing naturally
   // downward. Don't kick both legs far behind like fast traversal.
   leftThighX:-.205-.040*travel-.020*rise+.018*drop,
   rightThighX:-.100-.035*travel-.020*rise+.018*drop,
   leftKneeX:.485-.065*travel-.045*rise+.070*drop,
   rightKneeX:.340-.035*travel-.045*rise+.070*drop,
   leftAnkleX:-.100-.012*travel,
   rightAnkleX:-.065-.010*travel
  };
 }
 // V127: stationary pose must read as being SUSPENDED, not grounded
 // idle with a Y-offset. Retain V126's calm hover breathing and vertical
 // fight-ready facing, but shift the lower body's actual silhouette.
 // On normalized VRM0 the two legs have independent authored fold,
 // enough forward thigh lift to separate the knees from standing lines,
 // shin recovery beneath those knees, and hanging toes. The guard floats
 // slightly away from the ribs without opening to T-pose or propeller arms.
 // Values are local angular targets, NOT claims of measured world bend.
 function v127SuspendedFlightPose(mix,vertical=0,lateral=0,age=0){
  const base=v126FlightPose(mix,vertical,lateral,age);
  const travel=base.mix,rise=base.rise,drop=base.descend;
  const bank=clamp(lateral/6.2,-1,1);
  const hover=1-.65*travel;
  const pulse=Math.sin(Math.max(0,age)*2.1-.42);
  return {
   ...base,profile:'V127 suspended combat hover',
   // Keep V126's selected hover bob/timing; only articulate the rig.
   // Subtle pelvis and opposing chest curves, NO forward prone pose.
   hipsX:.073+.024*travel-.012*rise+.018*drop,
   hipsZ:.019+.008*bank+.004*hover*pulse,
   spineX:-.026+.057*travel-.015*rise+.015*drop+
    .006*hover*Math.sin(Math.max(0,age)*2.1),
   chestX:-.026+.028*travel-.010*rise+.012*drop-
    .003*hover*pulse,
   chestZ:base.chestZ-.013-.007*bank,
   neckX:.030-.040*travel+.006*rise,
   // Guard remains ready to punch, but elbows float slightly away from
   // ribs; mirrored Z offsets avoid parallel, planted-looking arms.
   leftShoulderX:-.175+.014*travel+.008*hover*pulse-.009*bank,
   rightShoulderX:-.148+.016*travel-.007*hover*pulse+.009*bank,
   leftUpperArmX:.226+.027*travel-.015*rise+.010*drop-.018*bank,
   rightUpperArmX:.191+.025*travel-.015*rise+.010*drop+.018*bank,
   leftUpperArmZ:.105-.010*travel,
   rightUpperArmZ:-.092+.008*travel,
   leftLowerArmX:-.257+.018*travel,
   rightLowerArmX:-.233+.016*travel,
   // One visibly raised knee and a secondary loose suspended leg.
   // Bend at BOTH joints (not just the shin or a fake hip translation).
   leftThighX:-.625-.030*travel-.040*rise+.027*drop,
   rightThighX:-.248-.025*travel-.025*rise+.020*drop,
   leftKneeX:1.060-.085*travel-.065*rise+.088*drop,
   rightKneeX:.535-.039*travel-.047*rise+.073*drop,
   // Feet relax below raised knees; no floor plant, toe curl or step.
   leftAnkleX:-.160-.015*travel+.020*rise,
   rightAnkleX:-.075-.012*travel+.017*rise
  };
 }

 // V128: solve the flight knee from ACTUAL hip/knee/ankle vectors in world
 // space. Kairo's normalized VRM0 joint rotations are not a validated bind
 // pose: V127's identical local-X assumptions can bend one knee backward.
 // The target is a gently raised knee in front of the true gameplay +Z,
 // with the shin dropping back under it. This is a single final V100
 // writer pass, never a competing controller or physics/IK/root motion.
 function v128FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v127SuspendedFlightPose(mix,vertical,lateral,age);
  return {...p,profile:'V128 world-validated suspended knees',
   // Disable V127's uncalibrated local X on these six bones. The
   // world-space final pass below is authoritative for their silhouette.
   leftThighX:0,rightThighX:0,
   leftKneeX:0,rightKneeX:0,
   leftAnkleX:0,rightAnkleX:0};
 }
 function v128CorrectFlightLegs(THREE,rig,forward,pose,strength=1,
                              previous=null,dt=1/60,status=null){
  const hum=rig?.vrm?.humanoid,scene=rig?.vrm?.scene;
  if(!hum||!scene||!forward||strength<=0)return null;
  const f=forward.clone();f.y=0;
  if(f.lengthSq()<1e-8)return null;
  f.normalize();
  const up=new THREE.Vector3(0,1,0);
  const right=new THREE.Vector3().crossVectors(up,f).normalize();
  const down=up.clone().negate();
  const qWorld=new THREE.Quaternion(),q=new THREE.Quaternion(),
   p0=new THREE.Vector3(),p1=new THREE.Vector3(),
   current=new THREE.Vector3(),target=new THREE.Vector3(),
   axis=new THREE.Vector3();
  const results={};
  function aim(joint,end,goal,maxAngle,priorIndex){
   if(!joint||!end)return false;
   scene.updateMatrixWorld(true);
   joint.getWorldPosition(p0);end.getWorldPosition(p1);
   current.subVectors(p1,p0);
   if(current.lengthSq()<1e-8)return false;
   current.normalize();target.copy(goal).normalize();
   const angle=Math.acos(clamp(current.dot(target),-1,1));
   axis.crossVectors(current,target);
   if(axis.lengthSq()<1e-9||angle<1e-5)return false;
   axis.normalize();
   // A real joint's WORLD quaternion, not global +X or a guessed
   // mirrored VRM0 knee axis, establishes the local hinge plane.
   joint.getWorldQuaternion(qWorld);
   axis.applyQuaternion(qWorld.invert()).normalize();
   const old=joint.quaternion.clone();
   joint.quaternion.multiply(q.setFromAxisAngle(axis,
    Math.min(angle,maxAngle)*clamp(strength,0,1))).normalize();
   if(previous?.[priorIndex]&&dt>0){
    const limit=5*Math.max(0,dt);
    const delta=previous[priorIndex].angleTo(joint.quaternion);
    if(delta>limit&&limit>0){
     const proposed=joint.quaternion.clone();
     // V131: save the desired orientation BEFORE resetting to last
     // visible frame. Old self-aliased slerp stopped the leg halfway.
     joint.quaternion.copy(previous[priorIndex]).slerp(
      proposed,limit/delta).normalize();
    }
   }
   return !old.equals(joint.quaternion);
  }
  for(const side of ['left','right']){
   const sign=side==='left'?1:-1;
   const thigh=hum.getNormalizedBoneNode(side+'UpperLeg');
   const shin=hum.getNormalizedBoneNode(side+'LowerLeg');
   const ankle=hum.getNormalizedBoneNode(side+'Foot');
   const toe=hum.getNormalizedBoneNode(side+'Toes');
   if(!thigh||!shin||!ankle)continue;
   const index=side==='left'?14:17;
   // V153: keep knees and ankles BEHIND the torso when pitching forward.
   const streamline=clamp(pose?.streamlineWeight||0,0,1);
   const curved=clamp(pose?.flightCurve||0,0,1);
   // Slight asynchronous knee drift, only for relaxed V130; the V128
   // calibrated forward-bending anatomy and ankle heading stay intact.
   const keyed=['V142 authored skeletal hover clip','V143 living hover performance','V144 relaxed floating arms','V145 directed vertical flight','V146 expressive vertical follow-through','V147 directional forward/back flight','V148 full-body omni flight','V149 living forward/back flight','V150 joystick-responsive flight',
   'V151 natural free-flight arms',
   'V152 calm hover and trailing travel arms',
    'V153 streamlined whole-body forward flight'].includes(pose?.profile)&&pose.keys;
   const suspended=pose?.profile==='V141 suspended silhouette';
   const reference=pose?.profile==='V140 reference-balanced hover';
   const serene=pose?.profile==='V138 calm anime levitation';
   const holistic=pose?.profile==='V137 director-led freeflight';
   const fullHover=pose?.profile==='V136 coherent full-body hover';
   const softTrailingKnee=pose?.profile==='V135 soft trailing knee';
   const naturalHover=pose?.profile==='V134 natural weightless hover';
   const weightless=pose?.profile==='V133 weightless flight';
   const buoyant=pose?.profile==='V132 buoyant natural flight';
   const natural=pose?.profile==='V131 organic suspended flight';
   const relaxed=pose?.profile==='V130 relaxed suspended flight';
   const sway=(suspended||reference||serene||holistic||fullHover||softTrailingKnee||naturalHover||weightless||buoyant||natural||relaxed)?Math.sin(Math.max(0,pose.age)*1.30+
    (side==='left'?.30:2.05)):0;
   // V131 must not look like a ground crouch: lead thigh travels
   // clearly FORWARD toward horizontal, while the other leg hangs
   // nearly down. Both shins return toward gravity, never cross.
   // V133 uses phase-offset counter-drift across BOTH legs. This is
   // actual bone-space change of silhouette, not an invisible root bob.
   const flow=clamp(pose?.mix||0,0,1);
   // V134 filmed feedback: V133's leg still draws a seated pedal stroke.
   // Keep a softer forward lift but let the shoe dangle BELOW the hip.
   // V135: actual V134 3-view footage and knee measurements show
   // right leg nearly fully extended while left stays buoyantly folded.
   // Bend ONLY the trailing right leg with an offset delayed pulse.
   // The admired V134 lead leg, arms and torso stay untouched.
   // V136: the real side-view V135 movie resembles a seated walker.
   // Angles are directions, NOT degrees: modest thigh lift and a
   // comfortably trailing shin place each ankle BEHIND its knee, rather
   // than directly beneath a raised thigh like a chair/cycle pose.
   // V137 visual gallery: V136 still resembles a hovering walking
   // stride. Let the thighs hang closer to the pelvis instead of
   // planting a forward-stepping knee; let the calves carry the curl.
   // V138 filmed V137 looked like a walking frame frozen in midair.
   // Anime levitation reference: both thighs mostly point down, knees
   // give slightly, and trailing calves curl softly, NEVER stride.
   // Small offsets/desynchronized sways, not a repeated leg-pedalling loop.
   const forwardKnee=keyed?pose.keys[side+'Knee']:
    suspended?
    (side==='left'?.285+.047*sway+.017*flow:
     .21+.031*sway+.014*flow):
    reference?
    (side==='left'?.265+.055*sway+.018*flow:
     .115+.040*sway+.012*flow):
    serene?
    (side==='left'?.13+.034*sway+.026*flow:
     .065+.026*sway+.010*flow):
    holistic?
    (side==='left'?.16+.080*sway+.035*flow:
     .035+.050*sway-.010*flow):
    fullHover?
    (side==='left'?.35+.085*sway+.05*flow:
     .15+.060*sway-.015*flow):
    softTrailingKnee?
    (side==='left'?.91+.23*sway+.07*flow:
     .54+.105*sway-.025*flow):
    naturalHover?
    (side==='left'?.91+.23*sway+.07*flow:
     .24+.16*sway-.035*flow):
    weightless?
    (side==='left'?1.35+.38*sway+.18*flow:
     .46+.26*sway-.12*flow):
    buoyant?(side==='left'?1.31+.070*sway:.29+.040*sway):
    natural?(side==='left'?1.92+.045*sway:.38+.025*sway):
    (side==='left'?.86:.38)+.042*sway;
   const foldBack=keyed?pose.keys[side+'Shin']:
    suspended?
    (side==='left'?.38+.032*sway:
     .36+.027*sway):
    reference?
    (side==='left'?.34+.030*sway:.31+.026*sway):
    serene?
    (side==='left'?.25+.026*sway:
     .24+.026*sway):
    holistic?
    (side==='left'?.55+.045*sway:
     .46+.044*sway):
    fullHover?
    (side==='left'?.47+.055*sway:
     .36+.050*sway):
    softTrailingKnee?
    (side==='left'?.10+.034*sway:.19+.038*sway):
    naturalHover?
    (side==='left'?.10:.11)+.034*sway:
    weightless?
    (side==='left'?.16:.21)+.075*sway:
    buoyant?(side==='left'?.29:.16)+.030*sway:
    natural?(side==='left'?.44:.20)+.015*sway:
    (side==='left'?.43:.24)+.020*sway;
   const rise=pose?.rise||0,drop=pose?.descend||0;
   // Distinct thigh and shin target directions produce a knee genuinely
   // FRONT of the hip-to-ankle support line on either mirrored leg.
   target.copy(down).multiplyScalar(1-.72*streamline).addScaledVector(f,
      (forwardKnee+.06*rise-.03*drop)*(1-streamline)-.95*streamline)
    .addScaledVector(right,sign*(keyed?.065:(suspended||reference||serene)?
      .045+.018*Math.sin(Math.max(0,pose.age)*1.0+
       (side==='left'?0:1.6)):
      holistic?.055+.025*Math.sin(
      Math.max(0,pose.age)*1.12+(side==='left'?0:1.8)):
      fullHover?
      .065+.025*Math.sin(Math.max(0,pose.age)*1.12+
       (side==='left'?0:1.8)):
      (softTrailingKnee||naturalHover)?
      .075+.035*Math.sin(Math.max(0,pose.age)*1.12+(side==='left'?0:2.1)):
      weightless?
      .10+.055*Math.sin(Math.max(0,pose.age)*1.12+(side==='left'?0:2.1)):
      (buoyant||natural)?.035:.075)).normalize();
   if(curved>.001){
    const pulse=Math.sin(Math.max(0,pose?.age||0)*1.02+(side==='left'?.35:1.65));
    const curvedThigh=down.clone().multiplyScalar(side==='left'?.92:.85)
     .addScaledVector(f,(side==='left'?-.57:-.71)+.045*pulse)
     .addScaledVector(right,sign*.10).normalize();
    target.lerp(curvedThigh,curved).normalize();
   }
   aim(thigh,shin,target,streamline>.01?1.52:.85,index);
   target.copy(down).multiplyScalar(1-.68*streamline).addScaledVector(f,
      -foldBack+.025*rise-.04*drop-1.10*streamline)
    .addScaledVector(right,-sign*(keyed?.015:(suspended||reference||serene)?.012:
      holistic?.015:fullHover?.018:
      (softTrailingKnee||naturalHover)?.025:
      weightless?.045:
      (buoyant||natural)?.015:.018)).normalize();
   if(curved>.001){
    const pulse=Math.sin(Math.max(0,pose?.age||0)*1.02+(side==='left'?-0.45:.9));
    const curvedShin=down.clone().multiplyScalar(side==='left'?.28:.34)
     .addScaledVector(f,(side==='left'?-1.03:-.94)+.030*pulse)
     .addScaledVector(right,-sign*.045).normalize();
    target.lerp(curvedShin,curved).normalize();
   }
   aim(shin,ankle,target,streamline>.01?1.52:1.13,index+1);
   // Toe-down relative to its EXISTING world horizontal heading:
   // don't force an unverified VRM0 shoe yaw to gameplay +Z.
   if(toe){
    scene.updateMatrixWorld(true);
    ankle.getWorldPosition(p0);toe.getWorldPosition(p1);
    target.subVectors(p1,p0);
    const horizontal=Math.hypot(target.x,target.z);
    if(horizontal>.025){
     // V136: unplant feet visually. VRM0 stock shoes stay flat in
     // V135, reading like stepping on an invisible ground plane.
     // Only the coherent new flight profile gets dangling toes.
     // Actual V138 back-view VRM movie: the shoes STILL project like
     // grounded walking feet. Aim the toes DOWN while retaining their
     // calibrated horizontal heading (never force global +Z toe yaw).
     target.y=-horizontal*(keyed?pose.keys[side+'Toe']:suspended?2.9:(reference||serene)?1.80:(holistic||fullHover)?.65:.29);
     aim(ankle,toe,target,keyed?1.0:suspended?.93:(reference||serene)?.84:
      (holistic||fullHover)?.52:.32,index+2);
    }
   }
   scene.updateMatrixWorld(true);
   const hipP=thigh.getWorldPosition(new THREE.Vector3());
   const kneeP=shin.getWorldPosition(new THREE.Vector3());
   const ankleP=ankle.getWorldPosition(new THREE.Vector3());
   const hToA=ankleP.clone().sub(hipP);
   const projection=clamp(kneeP.clone().sub(hipP).dot(hToA)/
    Math.max(1e-8,hToA.lengthSq()),0,1);
   const clearance=kneeP.clone().sub(hipP.addScaledVector(
    hToA,projection)).dot(f);
   results[side]={kneeForwardCm:+(clearance*100).toFixed(2),
    kneeHipForwardCm:+(kneeP.clone().sub(
      thigh.getWorldPosition(new THREE.Vector3())).dot(f)*100).toFixed(2),
    shinBackCm:+(kneeP.clone().sub(ankleP).dot(f)*100).toFixed(2),
    hipToKneeDropCm:+((thigh.getWorldPosition(new THREE.Vector3()).y-
     kneeP.y)*100).toFixed(1),
    kneeAboveAnkleCm:+((kneeP.y-ankleP.y)*100).toFixed(1),
    toeDropCm:toe?+((ankleP.y-toe.getWorldPosition(new THREE.Vector3()).y)*
     100).toFixed(1):null,
    kneeBendDeg:+(Math.acos(clamp(
     kneeP.clone().sub(thigh.getWorldPosition(new THREE.Vector3()))
      .normalize().dot(ankleP.clone().sub(kneeP).normalize()),-1,1))
      *180/Math.PI).toFixed(1)};
  }
  if(status){
   status.flightKneeWorld=results;
   status.flightKneeFacing=(results.left?.kneeForwardCm||0)>0&&
    (results.right?.kneeForwardCm||0)>0&&
    (results.left?.shinBackCm||0)>0&&
    (results.right?.shinBackCm||0)>0?'FORWARD':'NEEDS REVIEW';
  }
  return results;
 }

 // V129: verified V126/V127 front/side/back VRM0 footage shows the
 // original local-X arm pose has one hand DANGLING forward near the hip
 // and the opposite arm trailing behind. Its low, separated hands read
 // as a walking cycle despite flight. Keep V128's knee solver unchanged
 // and use real 3D visible upper arm, elbow and hand positions to draw a
 // compact asymmetric HOVER GUARD: elbows in front of the ribs, hands
 // above and ahead of elbows, chest facing gameplay +Z.
 // The pose owner and flight/root physics remain identical to V128.
 function v129FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v128FlightPose(mix,vertical,lateral,age);
  return {...p,profile:'V129 world-aimed levitation guard',
   // Don't apply V127's unverified authored arm axes underneath the
   // geometry solver: use the rest pose, then world-target real limbs.
   leftShoulderX:0,rightShoulderX:0,
   leftUpperArmX:0,rightUpperArmX:0,
   leftUpperArmZ:0,rightUpperArmZ:0,
   leftLowerArmX:0,rightLowerArmX:0};
 }
 function v129CorrectFlightGuard(THREE,rig,forward,pose,strength=1,
                                previous=null,dt=1/60,status=null,style='guard'){
  const hum=rig?.vrm?.humanoid,scene=rig?.vrm?.scene;
  if(!hum||!scene||!forward||strength<=0)return null;
  const f=forward.clone();f.y=0;if(f.lengthSq()<1e-8)return null;
  f.normalize();
  const up=new THREE.Vector3(0,1,0);
  const lShoulder=hum.getNormalizedBoneNode('leftShoulder');
  const rShoulder=hum.getNormalizedBoneNode('rightShoulder');
  if(!lShoulder||!rShoulder)return null;
  scene.updateMatrixWorld(true);
  const across=lShoulder.getWorldPosition(new THREE.Vector3())
   .sub(rShoulder.getWorldPosition(new THREE.Vector3()));
  across.y=0;if(across.lengthSq()<.001)return null;
  across.normalize();
  const qWorld=new THREE.Quaternion(),dq=new THREE.Quaternion();
  const a=new THREE.Vector3(),b=new THREE.Vector3(),dir=new THREE.Vector3(),
   axis=new THREE.Vector3(),goal=new THREE.Vector3();
  function aim(joint,end,target,limit,index){
   scene.updateMatrixWorld(true);
   joint.getWorldPosition(a);end.getWorldPosition(b);
   dir.subVectors(b,a);if(dir.lengthSq()<1e-8)return;
   dir.normalize();goal.copy(target).normalize();
   const angle=Math.acos(clamp(dir.dot(goal),-1,1));
   axis.crossVectors(dir,goal);if(axis.lengthSq()<1e-9||angle<.00001)return;
   axis.normalize();
   joint.getWorldQuaternion(qWorld);
   axis.applyQuaternion(qWorld.invert()).normalize();
   joint.quaternion.multiply(dq.setFromAxisAngle(axis,
    Math.min(angle,limit)*clamp(strength,0,1))).normalize();
   if(previous?.[index]&&dt>0){
    const maxStep=5*Math.max(0,dt);
    const change=previous[index].angleTo(joint.quaternion);
    if(change>maxStep&&maxStep>0){
     // Copy intended target BEFORE resetting joint quaternion, otherwise
     // a self-aliased slerp silently traps both arms in the old pose.
     const proposed=joint.quaternion.clone();
     joint.quaternion.copy(previous[index]).slerp(
       proposed,maxStep/change).normalize();
    }
   }
  }
  const result={};
  const drift=clamp(pose?.mix||0,0,1);
  const relaxed=style==='relaxed';
  const organic=style==='organic';
  const buoyant=style==='buoyant';
  const weightless=style==='weightless';
  const naturalHover=style==='natural-hover';
  const fullHover=style==='full-hover';
  const holistic=style==='holistic-hover';
  const serene=style==='serene-hover';
  const reference=style==='reference-hover';
  const suspended=style==='suspended-hover';
  const keyed=(style==='organic-flight'||style==='authored-hover'||style==='living-hover'||style==='natural-arms'||style==='vertical-flight'||style==='expressive-vertical'||style==='directional-flight'||style==='omni-flight'||style==='living-travel'||style==='joystick-flight'||style==='soaring-arms'||style==='quiet-travel'||style==='streamlined')&&pose?.keys;
  const time=Math.max(0,pose?.age||0);
  for(const side of ['left','right']){
   const left=side==='left',out=across.clone().multiplyScalar(left?1:-1);
   const shoulder=hum.getNormalizedBoneNode(side+'Shoulder');
   const upper=hum.getNormalizedBoneNode(side+'UpperArm');
   const lower=hum.getNormalizedBoneNode(side+'LowerArm');
   const hand=hum.getNormalizedBoneNode(side+'Hand');
   const chest=hum.getNormalizedBoneNode('chest');
   if(!shoulder||!upper||!lower||!hand)continue;
   // Make BOTH elbows face the opponent, and keep their lateral
   // separation. The lead hand is slightly higher for an asymmetric,
   // fighter-ready float without two stiff fists in front of the face.
   // V130: ordinary flight is NOT a guard. Float with gravity-soft arms,
   // visible space under the armpits and staggered loose elbows. Unequal
   // low-frequency cycles avoid a mirrored puppet or walking-arm swing.
   const phase=time*1.72+(left?0:1.05);
   // V133: free-flight arms FLOAT AWAY from the ribs, not the stiff
   // waist-level straight arms visible in V132. Per-side delayed waves
   // have enough reach to produce a visible silhouette change on video.
   const levitate=Math.sin(time*1.24+(left?.2:2.05));
   const lag=Math.sin(time*1.24+(left?-.75:1.1));
   // V134 real footage: opening the upper arms 16cm away from the
   // torso produced airplane wings. Keep loose elbows near Kairo's
   // waist with gentle unsynchronized buoyant follow-through instead.
   const slow=Math.sin(time*1.18+(left?.1:1.95));
   const offset=Math.sin(time*1.18+(left?-.65:1.05));
   // V136: lower arms are no longer a straight continuation of the
   // upper arms. Small elbow gap and a gentle, distinct forearm curve
   // echo the hanging trailing feet rather than a boxer/puppet.
   const armsSway=Math.sin(time*1.32+(left?.3:2.1));
   const handsLag=Math.sin(time*1.32+(left?-.65:1.12));
   // V138: non-negotiable visual design: let both arms hang *down*.
   // Prior V130–V137 elbows and hands point ahead like a zombie walk.
   // Tiny independent drift only; arm silhouette stays relaxed in all
   // views, rather than a combat guard or outstretched airplane wings.
   const sereneArm=Math.sin(time*1.05+(left?.2:1.85));
   const sereneHand=Math.sin(time*1.05+(left?-.55:1.05));
   const elbowGoal=keyed?
    f.clone().multiplyScalar(pose.keys[side+'ElbowF']+drift*.02)
     .addScaledVector(out,pose.keys[side+'ElbowO'])
     .addScaledVector(up,pose.keys[side+'ElbowY']).normalize():
    suspended?
    f.clone().multiplyScalar((left?.11:.075)+.026*sereneArm+.014*drift)
     .addScaledVector(out,(left?.31:.25)+.016*sereneArm)
     .addScaledVector(up,-.91+.016*sereneArm).normalize():
    reference?
    f.clone().multiplyScalar((left?.08:.06)+.022*sereneArm+.013*drift)
     .addScaledVector(out,(left?.24:.20)+.016*sereneArm)
     .addScaledVector(up,-.95+.014*sereneArm).normalize():
    serene?
    f.clone().multiplyScalar((left?.038:.022)+.017*sereneArm+.012*drift)
     .addScaledVector(out,(left?.18:.15)+.015*sereneArm)
     .addScaledVector(up,-.977+.010*sereneArm).normalize():
    holistic?
    f.clone().multiplyScalar((left?.105:.070)+.040*armsSway+.025*drift)
     .addScaledVector(out,(left?.39:.35)+.025*armsSway)
     .addScaledVector(up,-.85+.020*armsSway).normalize():
    fullHover?
    f.clone().multiplyScalar((left?.16:.10)+.040*armsSway+.035*drift)
     .addScaledVector(out,(left?.39:.36)+.04*armsSway)
     .addScaledVector(up,-.81+.023*armsSway).normalize():
    naturalHover?
    f.clone().multiplyScalar((left?.11:.055)+.055*slow+.06*drift)
     .addScaledVector(out,(left?.37:.34)+.055*slow)
     .addScaledVector(up,-.86+.035*slow).normalize():
    weightless?
    f.clone().multiplyScalar((left?.13:.06)+.05*levitate+.08*drift)
     .addScaledVector(out,(left?.55:.46)+.115*levitate)
     .addScaledVector(up,-.75+.065*levitate).normalize():
    buoyant?
    f.clone().multiplyScalar((left?.15:.11)+.038*Math.sin(phase-.3)+.027*drift)
     .addScaledVector(out,(left?.38:.35)+.027*Math.sin(phase))
     .addScaledVector(up,-.86+.022*Math.sin(phase-.8)).normalize():
    organic?
    f.clone().multiplyScalar((left?.22:.15)+.025*Math.sin(phase-.3)+.05*drift)
     .addScaledVector(out,(left?.40:.36)+.020*Math.sin(phase))
     .addScaledVector(up,-.82+.020*Math.sin(phase-.8)).normalize():
    relaxed?
    f.clone().multiplyScalar((left?.13:.10)+.025*Math.sin(phase-.5)+.03*drift)
     .addScaledVector(out,(left?.36:.33)+.018*Math.sin(phase))
     .addScaledVector(up,-.91+.017*Math.sin(phase-.8)).normalize():
    f.clone().multiplyScalar((left?.70:.63)+.06*drift)
     .addScaledVector(out,left?.40:.44)
     .addScaledVector(up,left?-.57:-.64).normalize();
   // Source VRM0 arms can point behind Kairo in the recorded-rest
   // pose. Allow enough geometric reach to face forward, but respect
   // the exact same per-frame visible 5rad/s joint limiter.
   aim(upper,lower,elbowGoal,Math.PI,left?7:11);
   // Offset leading and trailing hands by intent: hanging naturally,
   // not two matching forearms projecting like a zombie walk.
   const handGoal=keyed?
    f.clone().multiplyScalar(pose.keys[side+'HandF']+drift*.02)
     .addScaledVector(out,pose.keys[side+'HandO'])
     .addScaledVector(up,pose.keys[side+'HandY']).normalize():
    suspended?
    f.clone().multiplyScalar((left?.21:.16)+.032*sereneHand+.019*drift)
     .addScaledVector(out,(left?-.15:-.12)+.012*sereneHand)
     .addScaledVector(up,-.85+.020*sereneHand).normalize():
    reference?
    f.clone().multiplyScalar((left?.16:.12)+.035*sereneHand+.02*drift)
     .addScaledVector(out,(left?-.11:-.09)+.013*sereneHand)
     .addScaledVector(up,-.92+.018*sereneHand).normalize():
    serene?
    f.clone().multiplyScalar((left?.085:.075)+.025*sereneHand+.020*drift)
     .addScaledVector(out,(left?-.09:-.075)+.011*sereneHand)
     .addScaledVector(up,-.96+.012*sereneHand).normalize():
    holistic?
    f.clone().multiplyScalar((left?.43:.285)+.048*handsLag+.030*drift)
     .addScaledVector(out,(left?-.095:-.055)+.015*handsLag)
     .addScaledVector(up,(left?-.755:-.815)+.026*handsLag).normalize():
    fullHover?
    f.clone().multiplyScalar((left?.57:.47)+.055*handsLag+.045*drift)
     .addScaledVector(out,(left?-.045:-.025)+.02*handsLag)
     .addScaledVector(up,-.71+.038*handsLag).normalize():
    naturalHover?
    f.clone().multiplyScalar((left?.22:.15)+.075*offset+.03*drift)
     .addScaledVector(out,(left?.14:.12)+.055*offset)
     .addScaledVector(up,-.68+.047*offset).normalize():
    weightless?
    f.clone().multiplyScalar((left?.21:.16)+.09*lag+.05*drift)
     .addScaledVector(out,(left?.31:.28)+.10*lag)
     .addScaledVector(up,-.61+.060*lag).normalize():
    buoyant?
    f.clone().multiplyScalar((left?.44:.38)+.045*Math.sin(phase-.5))
     .addScaledVector(out,(left?-.11:-.07)+.022*Math.sin(phase-.6))
     .addScaledVector(up,-.77+.025*Math.sin(phase-.9)).normalize():
    organic?
    f.clone().multiplyScalar((left?.69:.58)+.030*Math.sin(phase-.5))
     .addScaledVector(out,(left?-.14:-.10)+.020*Math.sin(phase-.6))
     .addScaledVector(up,-.57+.022*Math.sin(phase-.9)).normalize():
    relaxed?
    f.clone().multiplyScalar((left?.22:.16)+.035*Math.sin(phase-.35))
     .addScaledVector(out,(left?-.055:-.035)+.025*Math.sin(phase-.6))
     .addScaledVector(up,-.82+.025*Math.sin(phase-.9)).normalize():
    f.clone().multiplyScalar((left?.75:.70)+.04*drift)
     .addScaledVector(out,left?-.47:-.47)
     .addScaledVector(up,left?.70:.59).normalize();
   aim(lower,hand,handGoal,Math.PI,left?8:12);
   scene.updateMatrixWorld(true);
   const sh=upper.getWorldPosition(new THREE.Vector3());
   const el=lower.getWorldPosition(new THREE.Vector3());
   const ha=hand.getWorldPosition(new THREE.Vector3());
   const chestPoint=chest?.getWorldPosition(new THREE.Vector3())||sh;
   result[side]={
    elbowAheadCm:+(el.clone().sub(sh).dot(f)*100).toFixed(1),
    handAheadCm:+(ha.clone().sub(el).dot(f)*100).toFixed(1),
    handAboveElbowCm:+((ha.y-el.y)*100).toFixed(1),
    elbowOutCm:+(el.clone().sub(sh).dot(out)*100).toFixed(1),
    handBelowChestCm:+((chestPoint.y-ha.y)*100).toFixed(1),
    handOutCm:+(ha.clone().sub(sh).dot(out)*100).toFixed(1)
   };
  }
  if(status){
   if(keyed){
    status.flightAuthoredWorld=result;
    status.flightAuthoredClip=style==='organic-flight'?'V155 arched organic forward flight':
     style==='streamlined'?'V153 whole-body forward flight':
      style==='quiet-travel'?'V152 calm hover and trailing arms':
     style==='soaring-arms'?'V151 relaxed authored travel arms':
      style==='joystick-flight'?'V150 joystick-responsive flight':
      style==='living-travel'?'V149 expressive moving flight legs':
     style==='omni-flight'?'V148 full-body omnidirectional flight':
     style==='directional-flight'?'V147 forward/back authored performance':
     style==='expressive-vertical'?'V146 expressive vertical follow-through':
     style==='vertical-flight'?'V145 upward and downward keyed flight':
     style==='natural-arms'?'V144 natural floating forearms':
     style==='living-hover'?'V143 4.6s living hover':'V142 4.6s keyed hover';
    status.flightAuthoredPhase=+(pose.authoredClock||0).toFixed(3);
   }
   if(suspended){
    status.flightSuspendedWorld=result;
    status.flightSuspendedSilhouette=['left','right'].every(side=>
     result[side]?.elbowOutCm>3&&result[side]?.elbowOutCm<17&&
     result[side]?.handAheadCm<18&&
     result[side]?.handAboveElbowCm< -14&&
     result[side]?.handBelowChestCm>16)?'RELAXED':'NEEDS REVIEW';
   }else if(reference){
    status.flightReferenceWorld=result;
    status.flightReferenceSilhouette=['left','right'].every(side=>
     result[side]?.elbowOutCm>3&&result[side]?.elbowOutCm<15&&
     result[side]?.handAheadCm<16&&
     result[side]?.handBelowChestCm>15)?'RELAXED':'NEEDS REVIEW';
   }else if(serene){
    status.flightSereneWorld=result;
    // No forward-reaching hands or winged elbows, with slight elbow flex.
    // Numeric test supplements actual 3-view WebGL art review.
    status.flightSereneSilhouette=['left','right'].every(side=>
     result[side]?.elbowOutCm>1&&result[side]?.elbowOutCm<10&&
     result[side]?.handAheadCm>-6&&result[side]?.handAheadCm<12&&
     result[side]?.handAboveElbowCm< -20&&
     result[side]?.handAboveElbowCm> -38&&
     result[side]?.handBelowChestCm>23&&
     result[side]?.handOutCm> -4&&result[side]?.handOutCm<14)?
     'RELAXED':'NEEDS REVIEW';
   }else if(holistic){
    status.flightHolisticWorld=result;
    status.flightHolisticSilhouette=['left','right'].every(side=>
     result[side]?.elbowOutCm>5&&result[side]?.elbowOutCm<16&&
     result[side]?.handOutCm>-2&&result[side]?.handOutCm<22&&
     result[side]?.handAheadCm>4&&
     result[side]?.handAboveElbowCm<0&&
     result[side]?.handAboveElbowCm>-28&&
     result[side]?.handBelowChestCm>14)?
     'SUSPENDED':'NEEDS REVIEW';
   }else if(fullHover){
    status.flightFullBodyWorld=result;
    status.flightFullBodySilhouette=['left','right'].every(side=>
     result[side]?.elbowOutCm>5&&result[side]?.elbowOutCm<17&&
     result[side]?.handOutCm>1&&result[side]?.handOutCm<24&&
     result[side]?.handAheadCm>8&&result[side]?.handAboveElbowCm<0&&
     result[side]?.handAboveElbowCm>-26&&
     result[side]?.handBelowChestCm>12)?
     'COHERENT':'NEEDS REVIEW';
   }else if(naturalHover){
    status.flightNaturalWorld=result;
    status.flightNaturalSilhouette=['left','right'].every(side=>
     result[side]?.elbowOutCm>5&&result[side]?.elbowOutCm<14&&
     result[side]?.handOutCm>5&&result[side]?.handOutCm<24&&
     result[side]?.handAboveElbowCm<0&&
     result[side]?.handAboveElbowCm>-30&&
     result[side]?.handBelowChestCm>13)?
     'NATURAL':'NEEDS REVIEW';
   }else if(weightless){
    status.flightWeightlessWorld=result;
    status.flightWeightlessSilhouette=['left','right'].every(side=>
     result[side]?.elbowOutCm>8&&
     result[side]?.handAheadCm>-6&&
     result[side]?.handAboveElbowCm<0&&
     result[side]?.handAboveElbowCm>-29&&
     result[side]?.handBelowChestCm>10)?
     'FLOATING':'NEEDS REVIEW';
   }else if(buoyant){
    status.flightBuoyantWorld=result;
    status.flightBuoyantSilhouette=['left','right'].every(side=>
     result[side]?.elbowAheadCm>-3&&
     result[side]?.handAheadCm>8&&
     result[side]?.handAheadCm<18&&
     result[side]?.handAboveElbowCm< -18&&
     result[side]?.handAboveElbowCm> -29&&
     result[side]?.elbowOutCm>4&&
     result[side]?.handBelowChestCm>18)?
     'BUOYANT':'NEEDS REVIEW';
   }else if(organic){
    status.flightOrganicWorld=result;
    status.flightOrganicSilhouette=['left','right'].every(side=>
     result[side]?.elbowAheadCm>-3&&result[side]?.handAheadCm>7&&
     result[side]?.handAboveElbowCm<0&&
     result[side]?.handAboveElbowCm>-24&&
     result[side]?.elbowOutCm>4&&
     result[side]?.handBelowChestCm>13)?
     'ORGANIC':'NEEDS REVIEW';
   }else if(relaxed){
    status.flightRelaxedWorld=result;
    status.flightRelaxedSilhouette=['left','right'].every(side=>
     result[side]?.elbowAheadCm>-5&&result[side]?.handAheadCm>0&&
     result[side]?.handAboveElbowCm<0&&result[side]?.elbowOutCm>3&&
     result[side]?.handBelowChestCm>15)?
     'RELAXED':'NEEDS REVIEW';
   }else{
    status.flightGuardWorld=result;
    status.flightGuardFacing=['left','right'].every(side=>
     result[side]?.elbowAheadCm>2&&result[side]?.handAheadCm>2&&
     result[side]?.handAboveElbowCm>0&&result[side]?.elbowOutCm>0)?
     'READY':'NEEDS REVIEW';
   }
  }
  return result;
 }
 // V130: calmly airborne rather than combat-guarded. Preserve Kairo's
 // visible V128 corrected legs and V127 subtle bob/torso; remove ALL
 // hardcoded VRM0 arm angle guesses. Existing world-target solver places
 // hands low and loose near the waist, not high ahead of elbows.
 function v130FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v128FlightPose(mix,vertical,lateral,age);
  return {...p,profile:'V130 relaxed suspended flight',age,
   leftShoulderX:0,rightShoulderX:0,
   leftUpperArmX:0,rightUpperArmX:0,
   leftUpperArmZ:0,rightUpperArmZ:0,
   leftLowerArmX:0,rightLowerArmX:0};
 }
 // V131: non-boxing free float rebuilt from visible rig anatomy.
 // Contrasting leg silhouettes (one knee softly lifted, one hanging),
 // a quiet open chest, gravity-soft BUT bent arms, and delayed left/right
 // motion. Root movement, jump and grounded ownership are unchanged.
 function v131FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v130FlightPose(mix,vertical,lateral,age);
  const travel=p.mix||0,rise=p.rise||0,drop=p.descend||0;
  return {...p,profile:'V131 organic suspended flight',
   hipsX:.018+.014*travel-.012*rise+.014*drop,
   spineX:-.052+.027*travel-.010*rise+.010*drop+
    .006*Math.sin(age*1.45),
   chestX:-.038+.013*travel-.008*rise,
   neckX:.012-.015*travel+.003*rise};
 }
 // V132: V131 is demonstrably better than V130, but the *real* VRM
 // front/side/back clips still show a bicycle-like seated leg and
 // hands projected far ahead, like reaching. Softer V131's one raised
 // thigh (without making both knees into a crouch), let the trailing
 // foot hang, and keep the forearms nearer the waist. All changes
 // remain inside the authoritative final flight pose, not jump/combat.
 function v132FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v131FlightPose(mix,vertical,lateral,age);
  const travel=p.mix||0,rise=p.rise||0,drop=p.descend||0;
  return {...p,profile:'V132 buoyant natural flight',
   hipsX:.010+.016*travel-.011*rise+.012*drop,
   spineX:-.038+.024*travel-.012*rise+.009*drop+
    .009*Math.sin(age*1.45),
   chestX:-.026+.010*travel-.008*rise};
 }
 // V133: visible full-body weightlessness. The last two revisions
 // only tweaked static knee and hand targets; real side/back WebGL
 // review showed virtually identical pose across hover, cruise, strafe,
 // ascend and descend. Build directional effort + delayed counter-motion
 // across pelvis/chest/neck in the SAME pose authority. No physics/root
 // change, no combat guard, no jump or touchdown modification.
 function v133FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v132FlightPose(mix,vertical,lateral,age);
  const travel=p.mix||0,rise=p.rise||0,drop=p.descend||0;
  const bank=clamp(lateral/6.2,-1,1);
  const time=Math.max(0,age);
  const sway=Math.sin(time*1.24+.35);
  const delayed=Math.sin(time*1.24-.62);
  return {...p,profile:'V133 weightless flight',
   // Upright at rest, subtly tipped into travel, buoyant on ascent.
   hipsX:.015+.028*travel-.020*rise+.014*drop+.010*sway,
   spineX:-.058+.105*travel-.028*rise+.016*drop+
    .027*delayed,
   chestX:-.028+.040*travel-.015*rise+.008*drop+
    .024*Math.sin(time*1.24-1.14),
   // Torso and pelvis counterbalance strafe rather than one stiff block.
   hipsZ:.014+.019*sway+.018*bank,
   spineZ:-.040*bank+.028*delayed,
   chestZ:-.017*bank-.014*delayed,
   neckX:.028-.080*travel+.016*rise-.010*delayed};
 }
 // V134: visual, not only geometry, review of the V133 recordings
 // showed near-winged arms and a cycling knee. Retain the useful
 // directional pelvis/chest lag from V133 with a softer breathing
 // amplitude, and let anatomically measured legs descend more naturally.
 function v134FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v133FlightPose(mix,vertical,lateral,age);
  const travel=p.mix||0,rise=p.rise||0,drop=p.descend||0;
  const bank=clamp(lateral/6.2,-1,1);
  const time=Math.max(0,age);
  return {...p,profile:'V134 natural weightless hover',
   hipsX:.012+.025*travel-.016*rise+.013*drop+
    .009*Math.sin(time*1.18+.2),
   spineX:-.049+.087*travel-.021*rise+.014*drop+
    .025*Math.sin(time*1.18-.55),
   chestX:-.025+.034*travel-.012*rise+.009*drop+
    .017*Math.sin(time*1.18-1.1),
   hipsZ:.012+.014*Math.sin(time*1.18+.45)+.012*bank,
   spineZ:-.037*bank+.019*Math.sin(time*1.18-.5),
   chestZ:-.016*bank-.012*Math.sin(time*1.18-.5),
   neckX:.020-.070*travel+.013*rise};
 }
 // V135: small evidence-based correction to ONLY the trailing knee
 // in V134's acclaimed weightless hover. Keep V134's torso, arms,
 // directional float, jump and combat intact.
 function v135FlightPose(mix,vertical=0,lateral=0,age=0){
  return {...v134FlightPose(mix,vertical,lateral,age),
   profile:'V135 soft trailing knee'};
 }
 // V136: one BODY director, before downstream arm/leg aims.
 // The VRM0 approved ground bind has a forward-hunched resting trunk.
 // Repeated V129-V135 numeric spineX tweaks add offsets to THAT hunch
 // instead of aligning the WHOLE torso. Aim the actual 3D spine->neck
 // vector towards vertical with a small travel pitch and lateral bank;
 // then let arms/legs solve in the corrected world basis. No new
 // animation writer, no gameplay root/pelvis translation.
 function v136CorrectSuspendedTorso(THREE,rig,forward,pose,strength=1,
                                   previous=null,dt=1/60,status=null){
  const hum=rig?.vrm?.humanoid,scene=rig?.vrm?.scene;
  if(!hum||!scene||!forward)return null;
  const spine=hum.getNormalizedBoneNode('spine');
  const neck=hum.getNormalizedBoneNode('neck');
  const hips=hum.getNormalizedBoneNode('hips');
  if(!spine||!neck||!hips)return null;
  const f=forward.clone();f.y=0;
  if(f.lengthSq()<1e-8)return null;
  f.normalize();
  const up=new THREE.Vector3(0,1,0),
   across=new THREE.Vector3().crossVectors(up,f).normalize();
  const travel=clamp(pose?.mix||0,0,1);
  const bank=clamp(pose?.bank||0,-1,1);
  // V143's independently keyed upper-chest counterbalance remains
  // anatomically vertical while still moving visibly under its pelvis.
  const animated=pose?.profile==='V143 living hover performance'||
   pose?.profile==='V144 relaxed floating arms'||
   pose?.profile==='V145 directed vertical flight'||
   pose?.profile==='V146 expressive vertical follow-through'||
   pose?.profile==='V147 directional forward/back flight'||
   pose?.profile==='V148 full-body omni flight'||
   pose?.profile==='V149 living forward/back flight'||
    (pose?.profile==='V150 joystick-responsive flight'||
     pose?.profile==='V151 natural free-flight arms'||
     pose?.profile==='V152 calm hover and trailing travel arms'||
      pose?.profile==='V153 streamlined whole-body forward flight'||
      pose?.profile==='V155 arched organic forward flight');
  const streamline=clamp(pose?.streamlineWeight||0,0,1),
   normalForward=.025+.045*travel+(animated?(pose.chestGoalF||0):0),
   // Head slightly raised relative to chest, even when fully streamlined.
   chestForward=Math.tan(Math.atan(normalForward)+streamline*
    ((pose?.flightCurveChestAngle??1.00)-Math.atan(normalForward)));
  const goal=up.clone().addScaledVector(f,chestForward)
   .addScaledVector(across,.030*bank+
    (animated?(pose.chestGoalS||0):0)).normalize();
  scene.updateMatrixWorld(true);
  const from=spine.getWorldPosition(new THREE.Vector3());
  const to=neck.getWorldPosition(new THREE.Vector3());
  const axis=to.sub(from).normalize();
  const raw=Math.acos(clamp(axis.dot(goal),-1,1));
  const cross=new THREE.Vector3().crossVectors(axis,goal);
  const q=new THREE.Quaternion();
  if(cross.lengthSq()>1e-8&&raw>1e-5){
   cross.normalize();
   const world=spine.getWorldQuaternion(new THREE.Quaternion());
   cross.applyQuaternion(world.invert()).normalize();
   spine.quaternion.multiply(q.setFromAxisAngle(cross,
    Math.min(raw,streamline>.001?1.45:.42)*clamp(strength,0,1))).normalize();
   if(previous?.[1]&&dt>0){
    const maxStep=5*Math.max(0,dt);
    const dist=previous[1].angleTo(spine.quaternion);
    if(dist>maxStep&&maxStep>0){
     const proposed=spine.quaternion.clone();
     spine.quaternion.copy(previous[1]).slerp(
      proposed,maxStep/dist).normalize();
    }
   }
  }
  scene.updateMatrixWorld(true);
  const updatedAxis=neck.getWorldPosition(new THREE.Vector3())
   .sub(spine.getWorldPosition(new THREE.Vector3())).normalize();
  const residual=Math.acos(clamp(updatedAxis.dot(goal),-1,1));
  if(status){
   status.flightTorsoWorld={
    sourceTiltDeg:+(raw*180/Math.PI).toFixed(1),
    residualTiltDeg:+(residual*180/Math.PI).toFixed(1),
    pitchedForwardCm:+(updatedAxis.dot(f)*100).toFixed(1),
    chestUpCm:+(updatedAxis.y*100).toFixed(1)};
  }
  return status?.flightTorsoWorld||{
   sourceTiltDeg:raw*180/Math.PI,residualTiltDeg:residual*180/Math.PI};
 }
 // V136 explicitly authors a complete, mutually compatible silhouette:
 // vertical chest/head, free shoulders/forearms, below-hip trailing feet.
 // Midair breathing is handled by the torso and arm writers against
 // actual VRM 3D geometry, NOT local axis guesses.
 function v136FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v135FlightPose(mix,vertical,lateral,age);
  const travel=p.mix||0,rise=p.rise||0,drop=p.descend||0;
  const bank=clamp(lateral/6.2,-1,1);
  const slow=Math.sin(age*1.25+.5);
  return {...p,profile:'V136 coherent full-body hover',age,bank,
   hipsX:.006+.016*travel-.010*rise+.008*drop,
   spineX:-.018+.018*travel-.008*rise+.013*slow,
   chestX:-.012+.015*travel-.006*rise+.008*slow,
   neckX:.005-.012*travel+.006*rise,
   hipsZ:.006+.012*bank+.008*slow,
   spineZ:-.026*bank-.010*slow,
   chestZ:-.011*bank-.006*slow};
 }
 // V137: the real side/back V136 footage exposes the *real* body
 // fault: aligning spine->neck had near-zero input (1–6 degrees),
 // because the actual hunch resides between PELVIS and neck. Aim the
 // complete pelvis-to-neck vector rather than a tiny spine-local span.
 // Do this BEFORE the finer V136 spine / corrected legs / loose arms.
 // Rotation lives in the sole V100 flight pose authority. No root motion.
 function v137CorrectPelvisBalance(THREE,rig,forward,pose,strength=1,
                                  previous=null,dt=1/60,status=null){
  const hum=rig?.vrm?.humanoid,scene=rig?.vrm?.scene;
  if(!hum||!scene||!forward)return null;
  const pelvis=hum.getNormalizedBoneNode('hips');
  const neck=hum.getNormalizedBoneNode('neck');
  if(!pelvis||!neck)return null;
  const f=forward.clone();f.y=0;
  if(f.lengthSq()<1e-8)return null;
  f.normalize();
  const up=new THREE.Vector3(0,1,0);
  const side=new THREE.Vector3().crossVectors(up,f).normalize();
  const travel=clamp(pose?.mix||0,0,1),bank=clamp(pose?.bank||0,-1,1);
  // V143 moves Kairo's pelvis/chest axis around a gently varying
  // world-facing target: breathing and counterweight without root bob.
  // All historical profiles use IDENTICAL old correction goals.
  const animated=pose?.profile==='V143 living hover performance'||
   pose?.profile==='V144 relaxed floating arms'||
   pose?.profile==='V145 directed vertical flight'||
   pose?.profile==='V146 expressive vertical follow-through'||
   pose?.profile==='V147 directional forward/back flight'||
   pose?.profile==='V148 full-body omni flight'||
   pose?.profile==='V149 living forward/back flight'||
    (pose?.profile==='V150 joystick-responsive flight'||
     pose?.profile==='V151 natural free-flight arms'||
     pose?.profile==='V152 calm hover and trailing travel arms'||
      pose?.profile==='V153 streamlined whole-body forward flight'||
      pose?.profile==='V155 arched organic forward flight');
  const streamline=clamp(pose?.streamlineWeight||0,0,1),
   normalForward=-.045+.080*travel+(animated?(pose.pelvisGoalF||0):0),
   // 62deg from vertical at hard forward input, root/collision unchanged.
   pelvisForward=Math.tan(Math.atan(normalForward)+streamline*
    ((pose?.flightCurvePelvisAngle??1.0821)-Math.atan(normalForward)));
  const desired=up.clone()
   .addScaledVector(f,pelvisForward)
   .addScaledVector(side,.018*bank+
    (animated?(pose.pelvisGoalS||0):0)).normalize();
  scene.updateMatrixWorld(true);
  const from=pelvis.getWorldPosition(new THREE.Vector3());
  const to=neck.getWorldPosition(new THREE.Vector3());
  const axis=to.sub(from).normalize();
  const raw=Math.acos(clamp(axis.dot(desired),-1,1));
  const crossed=new THREE.Vector3().crossVectors(axis,desired);
  if(crossed.lengthSq()>1e-8&&raw>1e-5){
   crossed.normalize();
   const world=pelvis.getWorldQuaternion(new THREE.Quaternion());
   crossed.applyQuaternion(world.invert()).normalize();
   const delta=new THREE.Quaternion().setFromAxisAngle(crossed,
    Math.min(raw,streamline>.001?1.50:.42)*clamp(strength,0,1));
   pelvis.quaternion.multiply(delta).normalize();
   if(previous?.[0]&&dt>0){
    const max=5*Math.max(0,dt);
    const angular=previous[0].angleTo(pelvis.quaternion);
    if(angular>max&&max>0){
     const proposed=pelvis.quaternion.clone();
     pelvis.quaternion.copy(previous[0]).slerp(proposed,max/angular).normalize();
    }
   }
  }
  scene.updateMatrixWorld(true);
  const corrected=neck.getWorldPosition(new THREE.Vector3())
   .sub(pelvis.getWorldPosition(new THREE.Vector3())).normalize();
  const residual=Math.acos(clamp(corrected.dot(desired),-1,1));
  const answer={initialTiltDeg:+(raw*180/Math.PI).toFixed(1),
   residualTiltDeg:+(residual*180/Math.PI).toFixed(1),
   pelvisNeckForwardCm:+(corrected.dot(f)*100).toFixed(1)};
  if(status)status.flightPelvisBalanceWorld=answer;
  return answer;
 }
 // V137 preserves the improved world-spine director, but fixes whole
 // pelvis/head alignment and makes legs softly trail rather than step.
 function v137FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v136FlightPose(mix,vertical,lateral,age);
  const slow=Math.sin(Math.max(0,age)*1.25+.3);
  return {...p,profile:'V137 director-led freeflight',
   hipsX:.001+.015*(p.mix||0)+.008*slow,
   spineX:-.012+.013*(p.mix||0)+.010*slow,
   chestX:-.018+.013*(p.mix||0)+.007*slow,
   neckX:.012-.013*(p.mix||0)};
 }
 // V138 motion plan: calm character-first hover, rather than
 // repeated exaggerated lunging of knees and arms. Use the exact same
 // V137 full-pelvis and spine alignment solvers; those are necessary to
 // keep imported VRM0 bind pose from pitching the entire character.
 // The differences are WHOLE-BODY targets: neutral torso and head,
 // long relaxed downward arms, nearly vertical independent lower limbs.
 // Gentle slow breathing and travel lean stay inside the same owner.
 function v138FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v137FlightPose(mix,vertical,lateral,age);
  const flow=p.mix||0,rise=p.rise||0,drop=p.descend||0;
  const bank=clamp(lateral/6.2,-1,1);
  const slow=Math.sin(Math.max(0,age)*1.05+.35);
  const lag=Math.sin(Math.max(0,age)*1.05-.45);
  return {...p,profile:'V138 calm anime levitation',
   hipsX:-.002+.012*flow-.008*rise+.009*drop+.006*slow,
   spineX:-.011+.021*flow-.007*rise+.007*lag,
   chestX:-.017+.012*flow+.006*slow,
   neckX:.012-.015*flow,
   hipsZ:.006+.009*bank+.005*slow,
   spineZ:-.024*bank+.008*lag,
   chestZ:-.008*bank+.004*slow};
 }
 // V140 reference-led calm hovering rather than stepping or crouching.
 function v140FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v138FlightPose(mix,vertical,lateral,age);
  const flow=p.mix||0,rise=p.rise||0,drop=p.descend||0,
   slow=Math.sin(Math.max(0,age)*1.15+.2);
  return {...p,profile:'V140 reference-balanced hover',
   hipsX:.002+.013*flow-.013*rise+.010*drop+.006*slow,
   spineX:-.015+.017*flow-.009*rise+.007*drop+
    .009*Math.sin(age*1.15-.3),
   chestX:-.014+.013*flow+.006*Math.sin(age*1.15-.7),
   neckX:.011-.016*flow};
 }
 // V141: real V140 films still read as standing despite green numbers.
 // Trial: more balanced world-knee flex, relaxed arms and visible shoe drop.
 // This remains inside V100 flight authority with no physics/root changes.
 function v141FlightPose(mix,vertical=0,lateral=0,age=0){
  const p=v140FlightPose(mix,vertical,lateral,age);
  const flow=p.mix||0,rise=p.rise||0,drop=p.descend||0;
  const slow=Math.sin(Math.max(0,age)*1.18+.22);
  return {...p,profile:'V141 suspended silhouette',
   hipsX:.001+.011*flow-.014*rise+.010*drop+.007*slow,
   spineX:-.009+.013*flow-.008*rise+.006*drop+
    .008*Math.sin(Math.max(0,age)*1.18-.65),
   chestX:-.009+.012*flow+.007*Math.sin(Math.max(0,age)*1.18-1.15),
   neckX:.020-.016*flow};
 }
 // V142 is a genuine multi-pose 4.6s keyed performance, NOT a sine-wave
 // correction of a standing frame. Data resides separately for review and
 // can be re-authored without accumulating more procedural body owners.
 // Every anatomical target is solved against real Kairo VRM0 world axes.
 function v142FlightPose(mix,vertical=0,lateral=0,age=0){
  const clip=root.SkyClashV142HoverKeys||
   (typeof module!=='undefined'&&module.exports?
    require('./v142-hover-keyframes.js'):null);
  if(!clip)throw Error('V142 authored hover clip is missing');
  const keys=clip.sample(age),p=v141FlightPose(mix,vertical,lateral,age);
  const flow=p.mix||0,rise=p.rise||0,drop=p.descend||0;
  const bank=clamp(lateral/6.2,-1,1);
  return {...p,profile:'V142 authored skeletal hover clip',
   keys,authoredClock:((age%clip.duration)+clip.duration)%clip.duration,
   hipsX:keys.hipsX+.016*flow-.010*rise+.014*drop,
   spineX:keys.spineX+.019*flow-.009*rise+.014*drop,
   chestX:keys.chestX+.014*flow-.006*rise+.009*drop,
   neckX:keys.neckX-.012*flow,
   hipsZ:keys.hipsZ+.014*bank,
   spineZ:keys.spineZ-.026*bank,
   chestZ:keys.chestZ-.013*bank};
 }
 // V143: retained V142's visibly approved one-up/one-down flight
 // silhouette. A second independently authored 4.6s performance track
 // supplies delayed motion to pelvis, chest, limbs and relaxed hands.
 // Unlike world-root bobbing, this actually animates the visible rig.
 function v143FlightPose(mix,vertical=0,lateral=0,age=0){
  const clip=root.SkyClashV143HoverKeys||
   (typeof module!=='undefined'&&module.exports?
    require('./v143-hover-performance.js'):null);
  if(!clip)throw Error('V143 living hover performance is missing');
  const k=clip.sample(age),p=v142FlightPose(mix,vertical,lateral,age);
  return {...p,profile:'V143 living hover performance',keys:k,
   authoredClock:((age%clip.duration)+clip.duration)%clip.duration,
   pelvisGoalF:k.bodyF,pelvisGoalS:k.bodyS,
   chestGoalF:k.chestF,chestGoalS:k.chestS,
   hipsX:p.hipsX+(k.hipsX-p.keys.hipsX),
   spineX:p.spineX+(k.spineX-p.keys.spineX),
   chestX:p.chestX+(k.chestX-p.keys.chestX),
   neckX:p.neckX+(k.neckX-p.keys.neckX),
   hipsZ:p.hipsZ+(k.hipsZ-p.keys.hipsZ),
   spineZ:p.spineZ+(k.spineZ-p.keys.spineZ),
   chestZ:p.chestZ+(k.chestZ-p.keys.chestZ)};
 }
 // V144 does not change V143's accepted pelvis, chest, legs or
 // overall floating stance. It only substitutes hand-authored upper-arm
 // and forearm goals inside the existing world-space V100 flight pass.
 // Hands curl gently forward and inward, creating a natural elbow bend.
 function v144FlightPose(mix,vertical=0,lateral=0,age=0){
  const clip=root.SkyClashV144Arms||
   (typeof module!=='undefined'&&module.exports?
    require('./v144-relaxed-arms.js'):null);
  if(!clip)throw Error('V144 authored floating arms are missing');
  const p=v143FlightPose(mix,vertical,lateral,age);
  return {...p,profile:'V144 relaxed floating arms',
   keys:{...p.keys,...clip.sample(age)}};
 }
 // V145: actual vertical velocity directs separate authored up/down
 // performances, layered over V144's player-approved natural hover.
 // A stationary hover samples V144 exactly. Rises gently gather the
 // legs and open the shoulders; descents trail the limbs and counter-
 // lean. Keys remain in Kairo's normalized world-space anatomical aims,
 // and root height/flight acceleration still belong ONLY to gameplay.
 function v145FlightPose(mix,vertical=0,lateral=0,age=0){
  const clip=root.SkyClashV145Vertical||
   (typeof module!=='undefined'&&module.exports?
    require('./v145-vertical-flight.js'):null);
  if(!clip)throw Error('V145 directed vertical animation is missing');
  const p=v144FlightPose(mix,vertical,lateral,age);
  const rise=p.rise||0,drop=p.descend||0;
  const o=clip.performance(rise,drop,age),keys={...p.keys};
  for(const [k,v] of Object.entries(o))
   if(Object.prototype.hasOwnProperty.call(keys,k))keys[k]+=v;
  return {...p,profile:'V145 directed vertical flight',
   keys,verticalAction:rise>drop?'ascending':drop>rise?'descending':'hover',
   verticalActionStrength:Math.max(rise,drop),
   pelvisGoalF:p.pelvisGoalF+o.bodyF,
   chestGoalF:p.chestGoalF+o.chestF,
   hipsX:p.hipsX+o.hipsX,spineX:p.spineX+o.spineX,
   chestX:p.chestX+o.chestX,neckX:p.neckX+o.neckX};
 }
 // V146: the approved V144 hover plus smooth velocity-driven
 // full-body rise/descent. No added controller or world/root translation.
 function v146FlightPose(mix,vertical=0,lateral=0,age=0,motion=null){
  const clip=root.SkyClashV146Vertical||
   (typeof module!=='undefined'&&module.exports?
    require('./v146-vertical-followthrough.js'):null);
  if(!clip)throw Error('Missing V146 flight choreography');
  const p=v144FlightPose(mix,vertical,lateral,age),
   o=clip.performance(motion,age),keys={...p.keys};
  for(const [k,value] of Object.entries(o))
   if(Object.prototype.hasOwnProperty.call(keys,k))keys[k]+=value;
  const lead=motion?.torso||{},weight=Math.max(lead.up||0,lead.drop||0);
  return {...p,profile:'V146 expressive vertical follow-through',
   keys,verticalAction:(lead.up||0)>.008&&(lead.up||0)>(lead.drop||0)?
    'ascending':(lead.drop||0)>.008?'descending':'hover',
   verticalActionStrength:weight,
   verticalActionTorso:weight,
   verticalActionLegs:Math.max(motion?.legs?.up||0,motion?.legs?.drop||0),
   verticalActionArms:Math.max(motion?.arms?.up||0,motion?.arms?.drop||0),
   pelvisGoalF:p.pelvisGoalF+o.bodyF,chestGoalF:p.chestGoalF+o.chestF,
   hipsX:p.hipsX+o.hipsX,spineX:p.spineX+o.spineX,
   chestX:p.chestX+o.chestX,neckX:p.neckX+o.neckX};
 }
 // V147: signed character-facing horizontal velocity drives distinct
 // forward and backward hand-authored 3D bone performances, layered on
 // the existing V146 vertical/hover system without changing game physics.
 function v147FlightPose(mix,vertical=0,lateral=0,age=0,vMotion=null,hMotion=null){
  const clip=root.SkyClashV147Horizontal||
   (typeof module!=='undefined'&&module.exports?
    require('./v147-horizontal-flight.js'):null);
  if(!clip)throw Error('V147 directional flight source missing');
  const p=v146FlightPose(mix,vertical,lateral,age,vMotion),
   o=clip.performance(hMotion,age),keys={...p.keys};
  for(const [k,value] of Object.entries(o))
   if(Object.prototype.hasOwnProperty.call(keys,k))keys[k]+=value;
  const lead=hMotion?.torso||{},front=lead.front||0,back=lead.back||0;
  return {...p,profile:'V147 directional forward/back flight',keys,
   horizontalAction:front>.01&&front>=back?'forward':
    back>.01?'backward':'hover',
   horizontalActionStrength:Math.max(front,back),
   horizontalActionTorso:Math.max(front,back),
   horizontalActionLegs:Math.max(hMotion?.legs?.front||0,hMotion?.legs?.back||0),
   horizontalActionArms:Math.max(hMotion?.arms?.front||0,hMotion?.arms?.back||0),
   pelvisGoalF:p.pelvisGoalF+o.bodyF,
   chestGoalF:p.chestGoalF+o.chestF,
   hipsX:p.hipsX+o.hipsX,spineX:p.spineX+o.spineX,
   chestX:p.chestX+o.chestX,neckX:p.neckX+o.neckX};
 }
 // V148: simultaneous forward/back/strafe/diagonal, turning,
 // acceleration, braking and fast-flight bone choreography.
 // Layered ON V146 vertical/hover; don't reuse V147's stiff directional
 // deltas. Only V100 writes Kairo's final anatomical VRM0 bone pose.
 function v148FlightPose(mix,vertical=0,lateral=0,age=0,vMotion=null,hMotion=null){
  const clip=root.SkyClashV148AllFlight||
   (typeof module!=='undefined'&&module.exports?
    require('./v148-full-flight.js'):null);
  if(!clip)throw Error('V148 omni-directional authored data missing');
  const p=v146FlightPose(mix,vertical,lateral,age,vMotion),
   values=clip.performance(hMotion,age),keys={...p.keys};
  for(const [k,value] of Object.entries(values))
   if(Object.prototype.hasOwnProperty.call(keys,k))keys[k]+=value;
  const torso=hMotion?.parts?.torso||{},
   l=torso.l||0,r=torso.r||0,f=torso.f||0,b=torso.b||0;
  const horizontalStrength=Math.max(f,b,l,r);
  return {...p,profile:'V148 full-body omni flight',keys,
   omniMode:horizontalStrength<.01?'hover':
    (f>b&&f>Math.max(l,r)*.25?'forward':
     b>f&&b>Math.max(l,r)*.25?'backward':'sideways'),
   omniForward:f-b,omniSide:r-l,omniWeight:horizontalStrength,
   omniTurn:torso.turn||0,omniFast:torso.fast||0,
   omniLaunch:hMotion?.launch||0,omniBrake:hMotion?.brake||0,
   omniTorsoWeight:horizontalStrength,
   omniArmWeight:Math.max(hMotion?.parts?.arms?.f||0,
    hMotion?.parts?.arms?.b||0,hMotion?.parts?.arms?.l||0,
    hMotion?.parts?.arms?.r||0),
   pelvisGoalF:p.pelvisGoalF+(values.bodyF||0),
   pelvisGoalS:(p.pelvisGoalS||0)+(values.bodyS||0),
   chestGoalF:p.chestGoalF+(values.chestF||0),
   chestGoalS:(p.chestGoalS||0)+(values.chestS||0),
   hipsX:p.hipsX+(values.hipsX||0),
   spineX:p.spineX+(values.spineX||0),
   chestX:p.chestX+(values.chestX||0),
   neckX:p.neckX+(values.neckX||0),
   hipsZ:p.hipsZ+(values.hipsZ||0),
   spineZ:p.spineZ+(values.spineZ||0),
   chestZ:p.chestZ+(values.chestZ||0)};
 }
 // V149 keeps the entire V148 omni, turn and boost choreography.
 // Only forward/back travel introduces a moving full-skeleton keyed
 // performance so Kairo's knees, shins, hips, chest, hands and elbows
 // actually change SHAPE across a 4.6-second periodic flying passage.
 function v149FlightPose(mix,vertical=0,lateral=0,age=0,vMotion=null,hMotion=null){
  const clip=root.SkyClashV149Travel||
   (typeof module!=='undefined'&&module.exports?
    require('./v149-travel-performance.js'):null);
  if(!clip)throw Error('V149 changing skeletal travel clip missing');
  const p=v148FlightPose(mix,vertical,lateral,age,vMotion,hMotion),
   o=clip.performance(hMotion,age),keys={...p.keys};
  for(const [k,value] of Object.entries(o))
   if(Object.prototype.hasOwnProperty.call(keys,k))keys[k]+=value;
  return {...p,profile:'V149 living forward/back flight',keys,
   pelvisGoalF:p.pelvisGoalF+(o.bodyF||0),
   pelvisGoalS:p.pelvisGoalS+(o.bodyS||0),
   chestGoalF:p.chestGoalF+(o.chestF||0),
   chestGoalS:p.chestGoalS+(o.chestS||0),
   hipsX:p.hipsX+(o.hipsX||0),spineX:p.spineX+(o.spineX||0),
   chestX:p.chestX+(o.chestX||0),neckX:p.neckX+(o.neckX||0),
   hipsZ:p.hipsZ+(o.hipsZ||0),spineZ:p.spineZ+(o.spineZ||0),
   chestZ:p.chestZ+(o.chestZ||0),
   travelPerformancePhase:((age%clip.duration)+clip.duration)%clip.duration};
 }
 // V150: joystick-controlled body effort is composed INSIDE V100.
 function v150FlightPose(mix,vertical=0,lateral=0,age=0,vMotion=null,hMotion=null,intent=null){
  const clip=root.SkyClashV150Flight||
   (typeof module!=='undefined'&&module.exports?require('./v150-joystick-flight.js'):null);
  if(!clip)throw Error('V150 input flight clip missing');
  const p=v149FlightPose(mix,vertical,lateral,age,vMotion,hMotion),
   o=clip.performance(intent,age),keys={...p.keys};
  for(const [k,value] of Object.entries(o))
   if(Object.prototype.hasOwnProperty.call(keys,k))keys[k]+=value;
  return {...p,profile:'V150 joystick-responsive flight',keys,
   inputStrength:intent?.stick||0,inputLocked:!!intent?.lock,
   inputForward:intent?.forward||0,inputRetreat:intent?.retreat||0,
   pelvisGoalF:p.pelvisGoalF+(o.bodyF||0),
   pelvisGoalS:p.pelvisGoalS+(o.bodyS||0),
   chestGoalF:p.chestGoalF+(o.chestF||0),
   chestGoalS:p.chestGoalS+(o.chestS||0),
   hipsX:p.hipsX+(o.hipsX||0),spineX:p.spineX+(o.spineX||0),
   chestX:p.chestX+(o.chestX||0),neckX:p.neckX+(o.neckX||0),
   hipsZ:p.hipsZ+(o.hipsZ||0),spineZ:p.spineZ+(o.spineZ||0),
   chestZ:p.chestZ+(o.chestZ||0)};
 }
 // V151: the boxing guard eases down ONLY in free forward travel.
 // World-space arm targets stay inside V100's sole final VRM pose writer.
 function v151FlightPose(mix,vertical=0,lateral=0,age=0,
     vMotion=null,hMotion=null,intent=null,armState=null){
  const clip=root.SkyClashV151TravelArms||
   (typeof module!=='undefined'&&module.exports?
    require('./v151-travel-arms.js'):null);
  if(!clip)throw Error('V151 relaxed travel arms missing');
  const p=v150FlightPose(mix,vertical,lateral,age,vMotion,hMotion,intent),
    o=clip.performance(armState,age,p.keys),keys={...p.keys};
  for(const [k,value] of Object.entries(o))
   if(Object.prototype.hasOwnProperty.call(keys,k))keys[k]+=value;
  return {...p,profile:'V151 natural free-flight arms',keys,
   travelArmsElbow:armState?.elbow||0,
   travelArmsHand:armState?.hand||0,
   travelArmsMode:(armState?.elbow||0)>.15?'relaxed-forward':'guard-or-hover'};
 }
 // V152: separate quiet hover / obviously trailing forward arms.
 // Bypass the subtly changed V151 arm keys; use V150 body and approved
 // V144 frozen hover as anchors inside the SAME sole pose owner.
 function v152FlightPose(mix,vertical=0,lateral=0,age=0,
   vMotion=null,hMotion=null,intent=null,state=null){
  const clip=root.SkyClashV152Silhouette||
   (typeof module!=='undefined'&&module.exports?
    require('./v152-flight-silhouette.js'):null);
  if(!clip)throw Error('V152 quiet hover and travel performance missing');
  const p=v150FlightPose(mix,vertical,lateral,age,vMotion,hMotion,intent),
   anchor=v144FlightPose(0,0,0,0);
  return clip.compose(p,anchor,state,age);
 }
 // V153: joystick pressure tilts the entire free-flight silhouette.
 // Only V100 writes visible Kairo bones; no physics or game root edits.
 function v153FlightPose(mix,vertical=0,lateral=0,age=0,
   vMotion=null,hMotion=null,intent=null,calm=null,stream=null){
  const clip=root.SkyClashV153Streamline||
   (typeof module!=='undefined'&&module.exports?
    require('./v153-streamlined-flight.js'):null);
  if(!clip)throw Error('V153 streamlined flight clip missing');
  return clip.performance(v152FlightPose(mix,vertical,lateral,age,
    vMotion,hMotion,intent,calm),stream);
 }
 // V155 organic pose still belongs to only V100 normal-flight owner.
 function v155FlightPose(mix,vertical=0,lateral=0,age=0,
   vMotion=null,hMotion=null,intent=null,calm=null,stream=null){
  const organic=root.SkyClashV155Organic||
    (typeof module!=='undefined'&&module.exports?
      require('./v155-organic-flight.js'):null);
  if(!organic)throw Error('V155 organic flight motion missing');
  return organic.flightPose(v153FlightPose(mix,vertical,lateral,age,
    vMotion,hMotion,intent,calm,stream),stream);
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
  const push=readable==='push',loaded=readable==='loaded',
   pushLike=push||loaded,expressive=!!readable;
  // V112: static jump gets a visible two-part load/release, but moving
  // takeoff stays quick. Original subtle/readable curves are untouched.
  const duration=pushLike?.215-.10*moving:expressive?.140-.040*moving:.095;
  const t=clamp(age,0,duration);
  const extend=pushLike?smooth((t-duration*.82)/(duration*.18)):0;
  const bend=smooth(t/(pushLike?duration*.66:expressive?duration*.83:.080))*
    (1-(pushLike?.22:expressive?.23:.36)*moving)*
    (1-.14*extend);
  // Real leg shortening matters more than an animated hip offset:
  // V106 keeps the shoes on the floor and cancels much of hipsY. Nearly
  // opposite thigh/shin pitches compress the leg vertically (~6cm) with
  // little horizontal ankle drift, producing a VISIBLE grounded load.
  const legBend=pushLike?bend*(1-.42*moving):bend;
  return {
   bend,
   hipsY:-(loaded?.110:pushLike?.080:expressive?.055:.036)*bend,
   hipsX:(loaded?.092:pushLike?.070:expressive?.052:.036)*bend,
   thighX:loaded?-.55*legBend:pushLike?-.43*legBend:-(expressive?.165:.105)*bend,
   kneeX:loaded?1.08*legBend:pushLike?.82*legBend:(expressive?.285:.155)*bend,
   ankleX:loaded?0:pushLike?-.085*legBend:-(expressive?.066:.038)*bend,
   spineX:(loaded?.205:pushLike?.162:expressive?.108:.074)*bend,
   chestX:(loaded?.128:pushLike?.100:expressive?.068:.048)*bend,
   neckX:-(pushLike?.039:expressive?.028:.018)*bend,
   shoulderX:loaded?-.072*bend:pushLike?-.055*bend:0,
   upperArmX:pushLike?.085*bend:0,
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
 // V114 knee-plane guidance: a constrained X-axis hinge rather than
 // V112/V113 3D CCD that could flip one shin backwards at takeoff.
 // Knee adjustment can only deepen the authored forward bend.
 function guidedPrepFeet(THREE,rig,anchors,status){
  const hum=rig.vrm.humanoid,scene=rig.vrm.scene;
  const pos=new THREE.Vector3(),test=new THREE.Vector3(),
    delta=new THREE.Vector3(),q=new THREE.Quaternion(),
    axis=new THREE.Vector3(1,0,0);
  let worst=0;
  for(const anchor of anchors){
   const thigh=hum.getNormalizedBoneNode(anchor.side+'UpperLeg');
   const knee=hum.getNormalizedBoneNode(anchor.side+'LowerLeg');
   const foot=hum.getNormalizedBoneNode(anchor.side+'Foot');
   if(!thigh||!knee||!foot)continue;
   for(let pass=0;pass<3;pass++){
    for(const [joint,lim] of [[thigh,.035],[knee,.025]]){
     scene.updateMatrixWorld(true);foot.getWorldPosition(pos);
     delta.set(anchor.point.x-pos.x,0,anchor.point.z-pos.z);
     if(delta.lengthSq()<.000002)continue;
     joint.quaternion.multiply(q.setFromAxisAngle(axis,.002)).normalize();
     scene.updateMatrixWorld(true);foot.getWorldPosition(test);
     const jx=(test.x-pos.x)/.002,jz=(test.z-pos.z)/.002;
     joint.quaternion.multiply(q.setFromAxisAngle(axis,-.002)).normalize();
     const denom=jx*jx+jz*jz;
     if(denom<1e-8)continue;
     const lower=joint===knee?0:-lim;
     const change=clamp((delta.x*jx+delta.z*jz)/denom,lower,lim);
     joint.quaternion.multiply(q.setFromAxisAngle(axis,change)).normalize();
    }
   }
   scene.updateMatrixWorld(true);foot.getWorldPosition(pos);
   worst=Math.max(worst,Math.hypot(anchor.point.x-pos.x,anchor.point.z-pos.z));
  }
  status.prepHingeSlipCm=+(worst*100).toFixed(1);
  return worst;
 }
 // V115: calibrate EACH LEG from actual normalized VRM world geometry.
 // Retargeted bones are not guaranteed to share an X rotation sign.
 // A positive thigh load MUST bring the knee forward (+Z for VRM1);
 // a positive shin fold MUST draw the foot backward relative to the knee.
 // The signs are measured on the actual skeleton, never guessed from
 // a screenshot or from the left/right bone names.
 function forwardKneeAxes(THREE,rig){
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  const forward=new THREE.Vector3(0,0,1),
    worldQ=new THREE.Quaternion(),pos=new THREE.Vector3(),
    moved=new THREE.Vector3(),axis=new THREE.Vector3(1,0,0),
    deltaQ=new THREE.Quaternion().setFromAxisAngle(axis,.075);
  scene.updateMatrixWorld(true);
  scene.getWorldQuaternion(worldQ);
  forward.applyQuaternion(worldQ);forward.y=0;
  if(forward.lengthSq()<1e-5)forward.set(0,0,1);
  forward.normalize();
  const signs={};
  for(const side of ['left','right']){
   const upper=hum.getNormalizedBoneNode(side+'UpperLeg');
   const lower=hum.getNormalizedBoneNode(side+'LowerLeg');
   const foot=hum.getNormalizedBoneNode(side+'Foot');
   if(!upper||!lower||!foot){signs[side]={thigh:-1,knee:1};continue;}
   function response(joint,end){
    scene.updateMatrixWorld(true);
    end.getWorldPosition(pos);
    const saved=joint.quaternion.clone();
    joint.quaternion.multiply(deltaQ).normalize();
    scene.updateMatrixWorld(true);
    end.getWorldPosition(moved);
    joint.quaternion.copy(saved);
    scene.updateMatrixWorld(true);
    return moved.sub(pos).dot(forward);
   }
   const kneeForward=response(upper,lower);
   const footForward=response(lower,foot);
   signs[side]={
    thigh:kneeForward>=0?1:-1,
    knee:footForward<=0?1:-1,
    kneeResponse:kneeForward,footResponse:footForward
   };
  }
  return signs;
 }
 // V118: use model-root +Z as the true BODY facing, not temporary toe yaw.
 // The real Kairo GLB proves native toes -Z; rotateVRM0 flips the scene.
 // The observed toe direction is diagnostic only, never a torso steering input.
 // V118: actual Kairo GLB is VRM0; both toe bones face native -Z.
 // rotateVRM0 rotates the VRM scene by 180 degrees, so scene.world +Z
 // is BACKWARD relative to the gameplay-facing fighter parent.
 // V116/V117 wrongly used that reversed scene axis.
 function realKairoForward(THREE,rig,status){
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  scene.updateMatrixWorld(true);
  const parent=rig.f?.model?.root||scene.parent||scene;
  const gameplay=new THREE.Vector3(0,0,1).applyQuaternion(
   parent.getWorldQuaternion(new THREE.Quaternion()));
  gameplay.y=0;
  if(gameplay.lengthSq()<1e-8)gameplay.set(0,0,1);
  gameplay.normalize();
  const toeFacing=new THREE.Vector3(),tmp=new THREE.Vector3(),
   heel=new THREE.Vector3();
  let observed=0;
  for(const side of ['left','right']){
   const foot=hum.getNormalizedBoneNode(side+'Foot');
   const toe=hum.getNormalizedBoneNode(side+'Toes');
   if(!foot||!toe)continue;
   foot.getWorldPosition(heel);toe.getWorldPosition(tmp);
   tmp.sub(heel);tmp.y=0;
   if(tmp.lengthSq()<.0004)continue;
   toeFacing.add(tmp.normalize());observed++;
  }
  // Actual feet are allowed to yaw during idle. They establish the
  // MODEL'S 180-degree parity but must not steer the entire torso/legs
  // sideways in the middle of a pose. Gameplay model.root always owns
  // the stable character facing for the crouch.
  const selected=gameplay;
  let source='fighter-root';
  if(observed===2&&toeFacing.lengthSq()>2.25){
   toeFacing.normalize();
   const agreement=toeFacing.dot(gameplay);
   source=agreement>.25?'fighter-root/toes-confirmed':
    'fighter-root/toe-heading-disagrees';
  }
  const sceneForward=new THREE.Vector3(0,0,1).applyQuaternion(
   scene.getWorldQuaternion(new THREE.Quaternion()));
  sceneForward.y=0;
  if(sceneForward.lengthSq()>1e-8)sceneForward.normalize();
  if(status){
   status.prepForwardSource=source;
   status.prepSceneVsBodyDot=+sceneForward.dot(selected).toFixed(3);
   status.prepToeVsBodyDot=observed===2&&toeFacing.lengthSq()>1e-8?
    +toeFacing.clone().normalize().dot(gameplay).toFixed(3):null;
  }
  return selected.clone();
 }
 // V116: a standing jump must be a real crouch, not a signed local-X
 // guess. Rotate each THIGH so its actual knee moves toward visible +forward,
 // and each SHIN so the ankle folds back underneath it. Both operations
 // derive their own world-space axis from the live VRM limb geometry.
 // The rotation is converted into that joint's current local frame; mirrored
 // humanoid axes and root yaw cannot reverse the knee. One existing V100
 // pose owner remains responsible for the final pose, no new wrapper/IK.
 function worldStandingPrepLegs(THREE,rig,thighAngle,shinAngle,anchors,status,gameForward=null,kneeDirections=null){
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  scene.updateMatrixWorld(true);
  const facing=gameForward?.clone()||new THREE.Vector3(0,0,1).applyQuaternion(
   scene.getWorldQuaternion(new THREE.Quaternion()));
  facing.y=0;
  if(facing.lengthSq()<1e-6)return 0;
  facing.normalize();
  const pointA=new THREE.Vector3(),pointB=new THREE.Vector3(),
   dir=new THREE.Vector3(),axis=new THREE.Vector3(),
   current=new THREE.Quaternion(),delta=new THREE.Quaternion(),
   parentQ=new THREE.Quaternion();
  function aim(joint,end,worldDirection,angle){
   if(angle<=0)return;
   scene.updateMatrixWorld(true);
   joint.getWorldPosition(pointA);end.getWorldPosition(pointB);
   dir.subVectors(pointB,pointA).normalize();
   axis.crossVectors(dir,worldDirection);
   if(axis.lengthSq()<1e-8)return;
   axis.normalize();
   joint.getWorldQuaternion(current);
   axis.applyQuaternion(current.invert()).normalize();
   joint.quaternion.multiply(delta.setFromAxisAngle(axis,angle)).normalize();
  }
  let lowest=Infinity;
  for(const side of ['left','right']){
   const upper=hum.getNormalizedBoneNode(side+'UpperLeg');
   const knee=hum.getNormalizedBoneNode(side+'LowerLeg');
   const foot=hum.getNormalizedBoneNode(side+'Foot');
   if(!upper||!knee||!foot)continue;
   const kneeFacing=kneeDirections?.[side]||facing;
   aim(upper,knee,kneeFacing,clamp(thighAngle,0,.62));
   aim(knee,foot,kneeFacing.clone().negate(),clamp(shinAngle,0,1.18));
   // Preserve each shoe's actual PREP-ENTRY world orientation; shin
   // flexion must not rotate toes up or down through the floor.
   const anchor=anchors?.find(a=>a.side===side);
   if(anchor?.rotation){
    scene.updateMatrixWorld(true);
    foot.parent.getWorldQuaternion(parentQ);
    foot.quaternion.copy(parentQ.invert().multiply(anchor.rotation)).normalize();
   }
   scene.updateMatrixWorld(true);
   const hipP=upper.getWorldPosition(new THREE.Vector3());
   const kneeP=knee.getWorldPosition(new THREE.Vector3());
   const ankleP=foot.getWorldPosition(new THREE.Vector3());
   // Positive means the knee lies FORWARD of the hip-to-ankle line.
   // This is the anatomical check missing from V115's derivative test.
   const hToA=ankleP.clone().sub(hipP);
   const t=clamp(kneeP.clone().sub(hipP).dot(hToA)/
    Math.max(1e-8,hToA.lengthSq()),0,1);
   const offset=kneeP.sub(hipP.addScaledVector(hToA,t)).dot(kneeFacing);
   lowest=Math.min(lowest,offset);
  }
  if(Number.isFinite(lowest)&&status)
   status.prepWorldKneeCm=+(lowest*100).toFixed(1);
  return Number.isFinite(lowest)?lowest:0;
 }
 // V117: V116 measured the legs in world space but left the TORSO's
 // local +X hips/spine/chest pitch unchecked. On the actual humanoid,
 // local-X and visible forward aren't interchangeable. Calibrate torso
 // bend through real 3D spine/chest joint positions and world-facing.
 // Keep the pelvis's old rotation OUT of this candidate so the legs
 // don't inherit another backward pitch. Still one V100 pose owner.
 function worldStandingPrepTorso(THREE,rig,spineLoad,chestLoad,status,gameForward=null){
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  scene.updateMatrixWorld(true);
  const forward=gameForward?.clone()||new THREE.Vector3(0,0,1).applyQuaternion(
   scene.getWorldQuaternion(new THREE.Quaternion()));
  forward.y=0;
  if(forward.lengthSq()<1e-8)return 0;
  forward.normalize();
  const pointA=new THREE.Vector3(),pointB=new THREE.Vector3(),
   limb=new THREE.Vector3(),axis=new THREE.Vector3(),
   worldQ=new THREE.Quaternion(),delta=new THREE.Quaternion();
  function pitchForward(name,target,amount){
   const joint=hum.getNormalizedBoneNode(name);
   const end=hum.getNormalizedBoneNode(target);
   if(!joint||!end||amount<=0)return;
   scene.updateMatrixWorld(true);
   joint.getWorldPosition(pointA);end.getWorldPosition(pointB);
   limb.subVectors(pointB,pointA).normalize();
   // The axis comes from actual limb positions, never a local X sign.
   axis.crossVectors(limb,forward);
   if(axis.lengthSq()<1e-8)return;
   axis.normalize();
   joint.getWorldQuaternion(worldQ);
   axis.applyQuaternion(worldQ.invert()).normalize();
   joint.quaternion.multiply(delta.setFromAxisAngle(axis,amount)).normalize();
  }
  pitchForward('spine','upperChest',clamp(spineLoad,0,.30));
  pitchForward('chest','neck',clamp(chestLoad,0,.17));
  scene.updateMatrixWorld(true);
  const hips=hum.getNormalizedBoneNode('hips');
  const head=hum.getNormalizedBoneNode('head');
  if(!hips||!head)return 0;
  const projected=head.getWorldPosition(new THREE.Vector3())
   .sub(hips.getWorldPosition(new THREE.Vector3())).dot(forward);
  if(status)status.prepTorsoForwardCm=+(projected*100).toFixed(1);
  return projected;
 }
 // V119: softer human jump compression (standing PREP only).
 // Phases deliberately cascade: knee/pelvis load, spine follows, chest
 // follows last, then the ankle/toe springs recover before release.
 // No extra controller and no changes to the physical 215ms jump timer.
 function v119Spring(age,duration){
  const u=clamp(age/Math.max(.001,duration),0,1);
  const load=smooth(u/.68),unwind=smooth((u-.79)/.21);
  const spring=load*(1-unwind);
  return {
   spineGain:.83+.17*smooth((u-.06)/.46),
   chestGain:.65+.35*smooth((u-.15)/.55),
   hipDip:.010*spring,
   turnout:.060*spring,
   toeFlex:.080*spring,
   spring,unwind
  };
 }
 // V119: the V118 ankle/foot world orientation is deliberately held so
 // the soles stay on the floor. A FOOT YAW adds a small natural outward
 // turnout, and the native VRM0 TOE bone flexes separately as the boxer
 // loads the forefoot. Both are restored from the actual prep-entry bind
 // each frame; no accumulated pose drift or local +X guessing.
 function softPrepToes(THREE,rig,anchors,forward,motion,status){
  if(!anchors?.length||!forward)return;
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  const up=new THREE.Vector3(0,1,0),parentQ=new THREE.Quaternion(),
   desired=new THREE.Quaternion(),yawQ=new THREE.Quaternion(),
   toeQ=new THREE.Quaternion(),axis=new THREE.Vector3(),
   toeDir=new THREE.Vector3(),worldToeQ=new THREE.Quaternion(),
   footP=new THREE.Vector3(),toeP=new THREE.Vector3(),curlQ=new THREE.Quaternion();
  let animated=0;
  for(const anchor of anchors){
   const side=anchor.side,foot=hum.getNormalizedBoneNode(side+'Foot');
   const toe=hum.getNormalizedBoneNode(side+'Toes');
   if(!foot||!anchor.rotation)continue;
   scene.updateMatrixWorld(true);
   foot.parent.getWorldQuaternion(parentQ);
   // +Y yaw sends visible +Z toward +X; actual left foot is at -X.
   const turnout=side==='left'?-motion.turnout:motion.turnout;
   yawQ.setFromAxisAngle(up,turnout);
   desired.copy(yawQ).multiply(anchor.rotation);
   foot.quaternion.copy(parentQ.invert().multiply(desired)).normalize();
   if(!toe||!anchor.toeRotation)continue;
   toe.quaternion.copy(anchor.toeRotation);
   scene.updateMatrixWorld(true);
   toe.getWorldPosition(toeP);foot.getWorldPosition(footP);
   toeDir.subVectors(toeP,footP);toeDir.y=0;
   if(toeDir.lengthSq()<1e-7)continue;
   toeDir.normalize();
   // Axis x toe direction -> +Y, so the forefoot flexes UP, not through
   // the floor. Convert that WORLD hinge axis to the actual toe local frame.
   axis.crossVectors(toeDir,up).normalize();
   toe.getWorldQuaternion(worldToeQ);
   axis.applyQuaternion(worldToeQ.invert()).normalize();
   toe.quaternion.multiply(curlQ.setFromAxisAngle(axis,motion.toeFlex)).normalize();
   animated++;
  }
  if(status){
   status.prepToeFlexDeg=+(motion.toeFlex*180/Math.PI).toFixed(1);
   status.prepFootTurnDeg=+(motion.turnout*180/Math.PI).toFixed(1);
   status.prepToeJoints=animated;
  }
  scene.updateMatrixWorld(true);
 }
 // V121: real foot AND upper-leg orientation should come from the
 // same athletic crouch through the FIRST takeoff frames. V119's toe-out
 // spring relaxed to zero before the physics trigger, so the visible
 // feet/thighs suddenly pointed ahead even though the crouch was good.
 // Keep a very small outward whole-leg/foot heading through push-off.
 // Do NOT hold toe curl: toes straighten naturally while extending.
 function v121LaunchStance(age,duration){
  const u=clamp(age/Math.max(.001,duration),0,1);
  const w=smooth(u/.69);
  return Object.freeze({thighYaw:.068*w,footYaw:.060*w,
   ready:w,heelSpring:smooth((u-.72)/.28)});
 }
 function v121OutwardThighs(THREE,rig,amount,status){
  if(!rig?.vrm?.scene||amount<=0)return;
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  const up=new THREE.Vector3(0,1,0),axis=new THREE.Vector3(),
   qWorld=new THREE.Quaternion(),dq=new THREE.Quaternion();
  let n=0;
  for(const side of ['left','right']){
   const thigh=hum.getNormalizedBoneNode(side+'UpperLeg');
   if(!thigh)continue;
   scene.updateMatrixWorld(true);
   thigh.getWorldQuaternion(qWorld);
   axis.copy(up).applyQuaternion(qWorld.invert()).normalize();
   thigh.quaternion.multiply(dq.setFromAxisAngle(axis,
    (side==='left'?-1:1)*amount)).normalize();
   n++;
  }
  if(status){
   status.takeoffThighOutDeg=+(amount*180/Math.PI).toFixed(1);
   status.takeoffThighJoints=n;
  }
  scene.updateMatrixWorld(true);
 }
 // V122: aim the REAL shoe-to-toe direction. A 3.4deg local foot
 // rotation measured in V121 was barely visible; the on-screen toe
 // vector is the necessary biomechanical ground truth.
 function v122VisibleToeHeading(THREE,rig,forward,angle,status,anchors=null,headingTargets=null){
  if(!rig?.vrm?.scene||!forward||angle<=0)return;
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  const up=new THREE.Vector3(0,1,0),fwd=forward.clone();
  fwd.y=0;if(fwd.lengthSq()<1e-8)return;fwd.normalize();
  const footP=new THREE.Vector3(),toeP=new THREE.Vector3(),
   dir=new THREE.Vector3(),desired=new THREE.Vector3(),
   cross=new THREE.Vector3(),qParent=new THREE.Quaternion(),
   qFoot=new THREE.Quaternion(),qTurn=new THREE.Quaternion();
  let count=0,lowest=Infinity;
  for(const side of ['left','right']){
   const foot=hum.getNormalizedBoneNode(side+'Foot');
   const toe=hum.getNormalizedBoneNode(side+'Toes');
   if(!foot||!toe)continue;
   scene.updateMatrixWorld(true);
   foot.getWorldPosition(footP);toe.getWorldPosition(toeP);
   dir.subVectors(toeP,footP);dir.y=0;
   if(dir.lengthSq()<1e-8)continue;dir.normalize();
   // V124: the actor's LAST VISIBLE idle direction, for EACH foot,
   // is more authoritative than a fixed post-button crouch angle.
   const entry=anchors?.find(a=>a.side===side&&a.toeDirection);
   if(headingTargets?.[side])desired.copy(headingTargets[side]);
   else if(entry)desired.copy(entry.toeDirection);
   else desired.copy(fwd).applyAxisAngle(up,(side==='left'?-1:1)*angle);
   const yaw=Math.atan2(cross.crossVectors(dir,desired).dot(up),
    clamp(dir.dot(desired),-1,1));
   // Ease the correction in with crouch loading. The native VRM0
   // foot can start far from game-facing; a 25deg clamp left real
   // shoes at >22deg in the full V100 rig despite an 11deg target.
   // Interpolate over the approved 215ms prep, not on the first frame.
   // Mirrored VRM0 normalized feet may start with very different
   // source-clip yaw (the real V100 harness measured +48°/-68°).
   // The heading goal is a world toe vector, not a 54° maximum
   // quaternion delta. Ease any large correction over the 215ms
   // preload, and never rotate more than 95° in one whole load.
   const bounded=clamp(yaw,-1.66,1.66)*smooth(angle/.20);
   foot.parent.getWorldQuaternion(qParent);
   foot.getWorldQuaternion(qFoot);
   qTurn.setFromAxisAngle(up,bounded).multiply(qFoot);
   foot.quaternion.copy(qParent.invert().multiply(qTurn)).normalize();
   scene.updateMatrixWorld(true);
   foot.getWorldPosition(footP);toe.getWorldPosition(toeP);
   dir.subVectors(toeP,footP);dir.y=0;dir.normalize();
   const signed=Math.atan2(cross.crossVectors(fwd,dir).dot(up),
    clamp(fwd.dot(dir),-1,1));
   lowest=Math.min(lowest,(side==='left'?-signed:signed));count++;
  }
  if(status){
   status.visibleToeHeadingDeg=Number.isFinite(lowest)?
    +(lowest*180/Math.PI).toFixed(1):null;
   status.visibleFootCorrections=count;
  }
  scene.updateMatrixWorld(true);
 }
 // V124: sample the REAL idle sole anchors BEFORE old.call() re-poses
 // Kairo for the first buffered-jump frame. Preserve individual shoe
 // positions and native toe headings, not a squared 11.5-degree template.
 function v124IdleFootAnchors(THREE,rig){
  if(!rig?.vrm?.scene)return [];
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  scene.updateMatrixWorld(true);
  const anchors=[];
  for(const side of ['left','right']){
   const foot=hum.getNormalizedBoneNode(side+'Foot'),
    toe=hum.getNormalizedBoneNode(side+'Toes');
   if(!foot||!toe)continue;
   const point=foot.getWorldPosition(new THREE.Vector3()),
    direction=toe.getWorldPosition(new THREE.Vector3()).sub(point).setY(0);
   if(direction.lengthSq()<1e-7)continue;
   anchors.push({side,point,rotation:foot.getWorldQuaternion(
    new THREE.Quaternion()),toeRotation:toe.quaternion.clone(),
    toeDirection:direction.normalize()});
  }
  return anchors;
 }
 // V125: the actual idle toes measured in V123's WebGL film face
 // ~45 and ~72 degrees to the same side. V124 inherits them perfectly
 // but the older fixed outward-thigh yaw still loads both knees ahead:
 // an apparent ankle twist. During the grounded 215ms anticipation,
 // gradually settle each shoe toward an individualized <=34 degree
 // oblique direction and direct its own KNEE into that same plane.
 // Never hard-reset to symmetric toes. Positions remain V124 anchored.
 function v125CoordinatedStance(THREE,forward,anchors,age,duration=.215){
  const feet={},knees={},up=new THREE.Vector3(0,1,0);
  if(!forward||!anchors?.length)return {feet,knees};
  const f=forward.clone().setY(0);
  if(f.lengthSq()<1e-8)return {feet,knees};
  f.normalize();
  const u=clamp(age/Math.max(.001,duration),0,1);
  const pivot=smooth((u-.10)/.90);
  for(const anchor of anchors){
   if(!anchor?.toeDirection)continue;
   const toe=anchor.toeDirection.clone().setY(0);
   if(toe.lengthSq()<1e-8)continue;toe.normalize();
   const yaw=Math.atan2(new THREE.Vector3().crossVectors(f,toe).dot(up),
    clamp(f.dot(toe),-1,1));
   // Up to ~34 degrees of gradual forefoot pivot in a load,
   // not V122's instantaneous stand->parallel-foot replacement.
   const target=yaw+clamp(clamp(yaw,-.59,.59)-yaw,-.59,.59)*pivot;
   feet[anchor.side]=f.clone().applyAxisAngle(up,target);
   // An oblique leg can bend naturally; keep thigh/knee and forefoot
   // within 6 degrees at normal end load without hip over-rotation.
   knees[anchor.side]=f.clone().applyAxisAngle(up,clamp(target,-.49,.49));
  }
  return {feet,knees};
 }
 // V120: measured, small athletic arm counter-swing during standing
 // jump preparation and rise. V101 compact guard is still the baseline;
 // these are final V100 pose adjustments, not a second bone controller.
 function v120ArmTiming(phase,seconds,duration=.215){
  const t=Math.max(0,seconds);
  if(phase==='prep'){
   const u=clamp(t/Math.max(.001,duration),0,1);
   const recoil=smooth(u/.70)*(1-smooth((u-.76)/.24));
   return {upper:.056*recoil,lower:.042*recoil,
    shoulder:.020*recoil,phase:'recoil',energy:recoil};
  }
  if(phase==='jump'){
   const sweep=smooth(t/.135)*(1-smooth((t-.19)/.36));
   return {upper:.205*sweep,lower:.118*sweep,
    shoulder:.060*sweep,phase:'ascent',energy:sweep};
  }
  return {upper:0,lower:0,shoulder:0,phase:'settle',energy:0};
 }
 function worldJumpArms(THREE,rig,forward,motion,status){
  if(!rig?.vrm?.scene||!forward||!motion)return;
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  scene.updateMatrixWorld(true);
  const up=new THREE.Vector3(0,1,0);
  const left=hum.getNormalizedBoneNode('leftShoulder');
  const right=hum.getNormalizedBoneNode('rightShoulder');
  if(!left||!right)return;
  const out=left.getWorldPosition(new THREE.Vector3())
   .sub(right.getWorldPosition(new THREE.Vector3()));
  out.y=0;if(out.lengthSq()<1e-8)return;
  out.normalize();
  const p0=new THREE.Vector3(),p1=new THREE.Vector3(),
   current=new THREE.Vector3(),axis=new THREE.Vector3(),
   worldQ=new THREE.Quaternion(),dq=new THREE.Quaternion(),
   desired=new THREE.Vector3();
  let count=0;
  function aim(jointName,endName,target,amount){
   if(amount<=1e-5)return;
   const joint=hum.getNormalizedBoneNode(jointName);
   const end=hum.getNormalizedBoneNode(endName);
   if(!joint||!end)return;
   scene.updateMatrixWorld(true);
   joint.getWorldPosition(p0);end.getWorldPosition(p1);
   current.subVectors(p1,p0);
   if(current.lengthSq()<1e-8)return;
   current.normalize();
   axis.crossVectors(current,target);
   if(axis.lengthSq()<1e-8)return;
   axis.normalize();
   joint.getWorldQuaternion(worldQ);
   axis.applyQuaternion(worldQ.invert()).normalize();
   joint.quaternion.multiply(dq.setFromAxisAngle(axis,amount)).normalize();
   count++;
  }
  for(const side of ['left','right']){
   const amplitude=side==='left'?.92:1;
   const lateral=out.clone().multiplyScalar(side==='left'?1:-1);
   const prep=motion.phase==='recoil';
   desired.copy(forward).multiplyScalar(prep?-.12:.62)
    .addScaledVector(up,prep?-.52:.74)
    .addScaledVector(lateral,.35).normalize();
   aim(side+'Shoulder',side+'UpperArm',desired,motion.shoulder*amplitude);
   aim(side+'UpperArm',side+'LowerArm',desired,motion.upper*amplitude);
   desired.copy(forward).multiplyScalar(prep?.18:.62)
    .addScaledVector(up,prep?.38:.40)
    .addScaledVector(lateral,.42).normalize();
   aim(side+'LowerArm',side+'Hand',desired,motion.lower*amplitude);
  }
  if(status){
   status.jumpArmMotion=motion.phase;
   status.jumpArmDrive=Math.round(motion.energy*100);
   status.jumpArmWorldJoints=count;
  }
 }
 // V123: the user's descent and landing are expressive enough. This
 // continuous new envelope affects ONLY crouch + standing ascent.
 function v123Expression(phase,age,duration=.215){
  const t=Math.max(0,age);
  if(phase==='prep'){
   const u=clamp(t/Math.max(.001,duration),0,1);
   const load=smooth(u/.74),recoil=load*(1-smooth((u-.77)/.23));
   return {energy:load,spineGain:1+.17*load,chestGain:1+.14*load,
    legGain:1,hipDip:.015*load,
    armUpper:.095*recoil,armLower:.065*recoil,
    armShoulder:.026*recoil,phase:'recoil'};
  }
  if(phase==='jump'){
   const launch=smooth(t/.11)*(1-smooth((t-.17)/.20));
   const follow=smooth((t-.095)/.13)*(1-smooth((t-.38)/.16));
   const reach=smooth(t/.12)*(1-smooth((t-.30)/.30));
   return {launch,follow,reach,
    spine:.19*launch+.085*follow,chest:.145*launch+.06*follow,
    // Retain recorded V122 legs through the whole air sequence. A
    // first V123 prototype moved both shin world frames directly,
    // and V102's safe angular limiter carried the offset into FALL.
    // Stronger V123 grounded knee load supplies leg extension.
    thigh:0,shin:0,
    armUpper:.295*reach,armLower:.165*reach,
    armShoulder:.082*reach,
    energy:Math.max(launch,follow,reach),phase:'ascent'};
  }
  return {launch:0,tuck:0,reach:0,spine:0,chest:0,
   thigh:0,shin:0,armUpper:0,armLower:0,armShoulder:0,
   energy:0,phase:'settle'};
 }
 function v123WorldRise(THREE,rig,forward,arc,status){
  if(!rig?.vrm?.scene||!forward||!arc||arc.energy<.00001)return;
  const scene=rig.vrm.scene,hum=rig.vrm.humanoid;
  const up=new THREE.Vector3(0,1,0),f=forward.clone();
  f.y=0;if(f.lengthSq()<1e-8)return;f.normalize();
  const p0=new THREE.Vector3(),p1=new THREE.Vector3(),
   limb=new THREE.Vector3(),target=new THREE.Vector3(),
   axis=new THREE.Vector3(),qWorld=new THREE.Quaternion(),
   delta=new THREE.Quaternion();
  let count=0;
  function aim(name,endName,goal,amount){
   if(amount<1e-6)return;
   const joint=hum.getNormalizedBoneNode(name),end=hum.getNormalizedBoneNode(endName);
   if(!joint||!end)return;
   scene.updateMatrixWorld(true);
   joint.getWorldPosition(p0);end.getWorldPosition(p1);
   limb.subVectors(p1,p0);
   if(limb.lengthSq()<1e-8)return;limb.normalize();
   target.copy(goal).normalize();
   axis.crossVectors(limb,target);
   if(axis.lengthSq()<1e-8)return;axis.normalize();
   joint.getWorldQuaternion(qWorld);
   axis.applyQuaternion(qWorld.invert()).normalize();
   joint.quaternion.multiply(delta.setFromAxisAngle(axis,amount)).normalize();
   count++;
  }
  // Authored chest expansion only. Do not alter normalized leg
  // directions while V102 steadily advances V122's recorded takeoff:
  // any world shin overlay would carry angular lag into approved fall.
  aim('spine','upperChest',up.clone().addScaledVector(f,-.25),arc.spine);
  aim('chest','neck',up.clone().addScaledVector(f,-.32),arc.chest);
  if(status){status.v123RiseJoints=count;
   status.v123RiseEnergy=Math.round(arc.energy*100);}
  scene.updateMatrixWorld(true);
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
 // V157: bounded steering target + frame-rate independent easing.
 // No model-root/physics changes and no extra animation writer.
 function v157BankIntent(localSide,yawRate,forwardSpeed){
  const side=clamp((Number.isFinite(localSide)?localSide:0)/5.5,-1,1);
  const turn=(Number.isFinite(forwardSpeed)&&forwardSpeed>1.8)?
   clamp((Number.isFinite(yawRate)?yawRate:0)/2.6,-1,1):0;
  return clamp(side*.88+turn*.52,-1,1);
 }
 function v157BankStep(current,target,dt){
  const age=clamp(Number.isFinite(dt)?dt:0,0,.065);
  const goal=clamp(Number.isFinite(target)?target:0,-1,1);
  // Crossing through zero is slower than leaning farther in one direction.
  // This keeps a 180-degree left/right input reversal below ~3 deg/frame.
  const tau=current*goal<0?.27:Math.abs(goal)>Math.abs(current)?.16:.24;
  return clamp(current+(goal-current)*(1-Math.exp(-age/tau)),-1,1);
 }
 // V158 responsive banking: the original V157 was almost invisible in
 // player gameplay despite showing ~6 degrees on automated strafe clips.
 // Raw joystick intent leads, then actual sideways motion and turn rate
 // confirm the bank; all values are character-relative and signed.
 function v158BankIntent(intentSide,velocitySide,yawRate){
  const joy=clamp(Number.isFinite(intentSide)?intentSide:0,-1,1);
  const slide=clamp((Number.isFinite(velocitySide)?velocitySide:0)/5,-1,1);
  const turn=clamp((Number.isFinite(yawRate)?yawRate:0)/1.9,-1,1);
  return clamp(joy*.78+slide*.64+turn*.75,-1,1);
 }
 function v158BankStep(current,target,dt){
  const age=clamp(Number.isFinite(dt)?dt:0,0,.065);
  const goal=clamp(Number.isFinite(target)?target:0,-1,1);
  const tau=current*goal<0?.24:Math.abs(goal)>Math.abs(current)?.13:.20;
  return clamp(current+(goal-current)*(1-Math.exp(-age/tau)),-1,1);
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
    flightMix:0,flightVelocityY:0,flightSide:0,flightSamples:[],
    prepLastHipY:null,pushReleaseHipY:null,
    prepFeet:[],prepHipsXZ:null,prepLastHipXZ:null,pushReleaseHipXZ:null,
    guidedLaunchLegs:[],prepForwardAxes:null,
    v157Bank:0,v157Facing:null};
  const axisBank=new THREE.Vector3(0,0,1);
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
   st.flightMix=0;st.flightVelocityY=0;st.flightSide=0;
   st.v157Bank=0;st.v157Facing=null;
   st.v146Motion=null;st.v147Motion=null;st.v148Motion=null;st.v150Motion=null;
   st.v151Arms=null;st.v152Motion=null;st.v153Motion=null;
   st.flightSamples=BONES.map(()=>new THREE.Quaternion());
   st.prepLastHipY=null;st.pushReleaseHipY=null;st.prepFeet=[];
   st.prepHipsXZ=null;st.prepLastHipXZ=null;st.pushReleaseHipXZ=null;
   st.guidedLaunchLegs=[];st.prepForwardAxes=null;
   st.fingerNodes=[];st.fingerRest=[];
   for(const side of ['left','right'])for(const finger of FINGERS)
    for(const segment of SEGMENTS){
     const n=get(side+finger+segment);
     if(n){st.fingerNodes.push(n);st.fingerRest.push(n.quaternion.clone());}
    }
  }
  function begin(next,visible,fighter,entryFeet=null,entryHips=null){
   const previous=st.phase;
   st.phase=next;st.elapsed=0;st.exitElapsed=0;
   // V103: a running takeoff MUST inherit the last actually displayed
   // walking/running stride. Never keep cycling walk/run legs while airborne.
   // Capture just once from ground -> jump; the fall phase keeps that
   // momentum context without grabbing the incoming fall clip as a new base.
   if(previous==='prep'&&next!=='prep'&&st.prepFeet.length){
    // Restore just the PREP-only toe curl when handing off to recorded
    // jump, Boost or another pose owner. No residual toe rotation.
    for(const anchor of st.prepFeet){
     const toe=st.rig.vrm.humanoid.getNormalizedBoneNode(anchor.side+'Toes');
     if(toe&&anchor.toeRotation)toe.quaternion.copy(anchor.toeRotation);
    }
   }
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
    const kneeChoice=new URLSearchParams(root.location?.search||'')
      .get('jumpKnees');
    const guided=previous==='prep'&&
      (['guided','forward'].includes(kneeChoice)||
       kneeChoice==='anatomic')&&st.launchSpeed<1.3;
    st.guidedLaunchLegs=guided?visible.slice(14,20).map(q=>q.clone()):[];
    // The facing baseline is the last actually displayed PREP/ground
    // pose, not an arbitrary neutral VRM T-pose or Mixamo source yaw.
    st.airFacingPose=visible.slice(0,6).map(q=>q.clone());
   }
   if(next==='flight'){
    st.v151Arms=null;st.v152Motion=null;st.v153Motion=null;
     st.v150Motion=null;
    st.v148Motion=null;
    st.v147Motion=null;
    st.v146Motion=null;
    // Entry is last visible jump/hover pose, not the guide-rig T-pose.
    st.flightMix=flightWeight(Math.hypot(fighter.vel?.x||0,fighter.vel?.z||0));
    // The first flight pose starts from the actual input, while later
    // abrupt vertical/side reversals flow through damped pose effort.
    st.flightVelocityY=fighter.vel?.y||0;
    const yaw=fighter.facing||0;
    st.flightSide=(fighter.vel?.x||0)*Math.cos(yaw)-
     (fighter.vel?.z||0)*Math.sin(yaw);
    st.airFacingPose=visible.slice(0,6).map(q=>q.clone());
    st.v157Bank=0;st.v157Facing=yaw;
   }
   if(next==='prep'){
    st.prepBase=visible.map(q=>q.clone());
    st.prepHipsY=st.nodes[0].position.y;
    st.prepHipsXZ=st.nodes[0].position.clone();
    st.prepSpeed=Math.hypot(fighter.vel?.x||0,fighter.vel?.z||0);
    st.prepLastHipY=null;
    st.prepForwardAxes=null;
    if(['forward','anatomic'].includes(
       new URLSearchParams(root.location?.search||'').get('jumpKnees')))
     st.prepForwardAxes=forwardKneeAxes(THREE,st.rig);
    st.prepFeet=[];
    if(new URLSearchParams(root.location?.search||'').get('jumpPrep')==='push'){
     if(entryFeet?.length===2){
      st.prepFeet=entryFeet;
      if(entryHips){st.prepHipsY=entryHips.y;st.prepHipsXZ=entryHips.clone();}
      status.idleFootAnchorsCaptured=2;
     }else{
      st.rig.vrm.scene.updateMatrixWorld(true);
      for(const side of ['left','right']){
       const shoe=st.rig.vrm.humanoid.getNormalizedBoneNode(side+'Foot');
       if(shoe){
        const toe=st.rig.vrm.humanoid.getNormalizedBoneNode(side+'Toes');
        st.prepFeet.push({side,
         point:shoe.getWorldPosition(new THREE.Vector3()),
         rotation:shoe.getWorldQuaternion(new THREE.Quaternion()),
         toeRotation:toe?.quaternion.clone()||null});
       }
      }
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
   // Read strafe in character-relative coordinates, not global world X.
   const yaw=f.facing||0;
   const localSide=(f.vel?.x||0)*Math.cos(yaw)-
      (f.vel?.z||0)*Math.sin(yaw);
   const airborne=next==='flight'&&
     params.get('flightLab')==='blend'&&
     params.get('flightStyle')==='airborne';
   const flightVersion=params.get('flightPreview');
   const v155=airborne&&flightVersion==='v155';
   const v153=airborne&&flightVersion==='v153';
   const v152=airborne&&flightVersion==='v152';
   const v151=airborne&&flightVersion==='v151';
   const v150=airborne&&flightVersion==='v150';
   const v149=airborne&&flightVersion==='v149';
   const v148=airborne&&flightVersion==='v148';
   const v147=airborne&&flightVersion==='v147';
   const v146=airborne&&flightVersion==='v146';
   const v145=airborne&&flightVersion==='v145';
   const v144=airborne&&flightVersion==='v144';
   const v143=airborne&&flightVersion==='v143';
   const v142=airborne&&flightVersion==='v142';
   const v141=airborne&&flightVersion==='v141';
   const v140=airborne&&flightVersion==='v140';
   const v138=airborne&&flightVersion==='v138';
   const v137=airborne&&flightVersion==='v137';
   const v136=airborne&&flightVersion==='v136';
   const v135=airborne&&flightVersion==='v135';
   const v134=airborne&&flightVersion==='v134';
   const v133=airborne&&flightVersion==='v133';
   const v132=airborne&&flightVersion==='v132';
   const v131=airborne&&flightVersion==='v131';
   const v130=airborne&&flightVersion==='v130';
   const v129=airborne&&flightVersion==='v129';
   const v128=airborne&&flightVersion==='v128';
   const v127=airborne&&flightVersion==='v127';
   const v126=airborne&&flightVersion==='v126';
   const flightControl=v155?v155FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed,
     st.v146Motion,st.v148Motion,st.v150Motion,st.v152Motion,st.v153Motion):
    v153?v153FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed,
     st.v146Motion,st.v148Motion,st.v150Motion,st.v152Motion,st.v153Motion):
    v152?v152FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed,
     st.v146Motion,st.v148Motion,st.v150Motion,st.v152Motion):
    v151?v151FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed,
     st.v146Motion,st.v148Motion,st.v150Motion,st.v151Arms):
    v150?v150FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed,
     st.v146Motion,st.v148Motion,st.v150Motion):
     v149?v149FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed,
     st.v146Motion,st.v148Motion):
     v148?v148FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed,
     st.v146Motion,st.v148Motion):
     v147?v147FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed,
     st.v146Motion,st.v147Motion):
     v146?v146FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed,st.v146Motion):
     v145?v145FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v144?v144FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v143?v143FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v142?v142FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v141?v141FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v140?v140FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v138?v138FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v137?v137FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v136?v136FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v135?v135FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v134?v134FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v133?v133FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v132?v132FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v131?v131FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v130?v130FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v129?v129FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v128?v128FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v127?v127SuspendedFlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     v126?v126FlightPose(st.flightMix,
     st.flightVelocityY,st.flightSide,st.elapsed):
     airborne?airborneFlightPose(st.flightMix,f.vel?.y||0,localSide):
     controlled?controlledFlightPose(st.flightMix,f.vel?.y||0,localSide):null;
   // QA and debug HUD read the *actual* velocity-derived airborne mode.
   // This is pose telemetry only: jump and physics state remain untouched.
   if((v145||v146||v147||v148||v149||v150||v151||v152||v153||v155)&&flightControl){
    status.flightVerticalMode=flightControl.verticalAction;
    status.flightVerticalWeight=+flightControl.verticalActionStrength.toFixed(3);
    if(v146||v147||v148||v149||v150||v151||v152||v153||v155){
     status.flightVerticalTorso=+flightControl.verticalActionTorso.toFixed(3);
     status.flightVerticalLegs=+flightControl.verticalActionLegs.toFixed(3);
     status.flightVerticalArms=+flightControl.verticalActionArms.toFixed(3);
    }
    if(v147){
     status.flightHorizontalMode=flightControl.horizontalAction;
     status.flightHorizontalWeight=+flightControl.horizontalActionStrength.toFixed(3);
     status.flightHorizontalTorso=+flightControl.horizontalActionTorso.toFixed(3);
     status.flightHorizontalLegs=+flightControl.horizontalActionLegs.toFixed(3);
     status.flightHorizontalArms=+flightControl.horizontalActionArms.toFixed(3);
    }
    if(v148||v149){
     status.flightHorizontalMode=flightControl.omniMode;
     status.flightHorizontalWeight=+flightControl.omniWeight.toFixed(3);
     status.flightHorizontalTurn=+flightControl.omniTurn.toFixed(3);
     status.flightHorizontalFast=+flightControl.omniFast.toFixed(3);
     status.flightHorizontalLaunch=+flightControl.omniLaunch.toFixed(3);
     status.flightHorizontalBrake=+flightControl.omniBrake.toFixed(3);
     status.flightHorizontalSide=+flightControl.omniSide.toFixed(3);
     if(v149)status.flightTravelPhase=+flightControl.travelPerformancePhase.toFixed(3);
    }
    if(v150||v151||v152||v153||v155){
     status.flightHorizontalMode=flightControl.omniMode;
     status.flightHorizontalWeight=+flightControl.omniWeight.toFixed(3);
     status.flightHorizontalTurn=+flightControl.omniTurn.toFixed(3);
     status.flightHorizontalFast=+flightControl.omniFast.toFixed(3);
     status.flightHorizontalLaunch=+flightControl.omniLaunch.toFixed(3);
     status.flightHorizontalBrake=+flightControl.omniBrake.toFixed(3);
     status.flightHorizontalSide=+flightControl.omniSide.toFixed(3);
     status.flightTravelPhase=+flightControl.travelPerformancePhase.toFixed(3);
     status.flightInputStrength=+flightControl.inputStrength.toFixed(3);
     status.flightRetreatLocked=flightControl.inputLocked;
     status.flightInputForward=+flightControl.inputForward.toFixed(3);
      if(v152||v153||v155){
       status.flightQuietHover=flightControl.quietFlightWeight;
       status.flightTrailingElbow=+flightControl.trailingElbowWeight.toFixed(3);
       status.flightTrailingHand=+flightControl.trailingHandWeight.toFixed(3);
       status.flightTrailingPose=flightControl.trailingPose;
       if(v153||v155){
        status.flightStreamlineWeight=+flightControl.streamlineWeight.toFixed(3);
        status.flightStreamlineTarget=+flightControl.streamlineTarget.toFixed(3);
        status.flightStreamlineDegrees=+flightControl.streamlineDegrees.toFixed(1);
       }
      }
      if(v151){
       status.flightTravelArmBlend=+flightControl.travelArmsElbow.toFixed(3);
       status.flightTravelHandBlend=+flightControl.travelArmsHand.toFixed(3);
       status.flightTravelArmMode=flightControl.travelArmsMode;
      }
    }
   }
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
   // Preserve V120's independently testable standing-only arm gate.
   const v120Ascent=compactArms&&next==='jump'&&
     params.get('jumpPreview')==='v120'&&st.launchSpeed<1.3;
   const v121Ascent=compactArms&&next==='jump'&&
     params.get('jumpPreview')==='v121'&&st.launchSpeed<1.3;
   const v122Ascent=compactArms&&next==='jump'&&
     params.get('jumpPreview')==='v122'&&st.launchSpeed<1.3;
   const v123Ascent=next==='jump'&&params.get('jumpPreview')==='v123'&&
     st.launchSpeed<1.3;
   const v124Ascent=next==='jump'&&params.get('jumpPreview')==='v124'&&
     st.launchSpeed<1.3;
   const v125Ascent=next==='jump'&&params.get('jumpPreview')==='v125'&&
     st.launchSpeed<1.3;
   const v123Arc=v123Ascent||v124Ascent||v125Ascent?
     v123Expression('jump',st.jumpAge):null;
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
     const x=angles[i]||0,z=i===0?(p.hipsZ||0):
       i===1?p.spineZ:i===2?(p.chestZ||0):
       i===7?(p.leftUpperArmZ||0):
       i===11?(p.rightUpperArmZ||0):0;
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
    if(st.guidedLaunchLegs.length===6&&next==='jump'&&i>=14){
     // Do not snap or reverse a shin immediately after standing push.
     // Gradually transfer from the last grounded knee/ankle orientations
     // to V102's original clip only after the feet have lifted.
     // V121: blend the **captured** leg heading from the loaded crouch.
     // The last PREP frame includes the V121 outward thigh and foot
     // turnout; release slowly into recorded midair legs as Kairo rises.
     // Older previews keep V115-V120's historical 60–230ms transfer.
     const v121Takeoff=params.get('jumpPreview')==='v121'&&st.launchSpeed<1.3;
     const fade=smooth((st.elapsed-.060)/.170);
     const v121Fade=v121Takeoff?smooth((st.elapsed-.070)/.205):fade;
     const v122Takeoff=params.get('jumpPreview')==='v122'&&st.launchSpeed<1.3;
     const v123Takeoff=['v123','v124','v125'].includes(params.get('jumpPreview'))&&
      st.launchSpeed<1.3;
     const v122Fade=(v122Takeoff||v123Takeoff)?
      smooth((st.elapsed-.080)/.210):v121Fade;
     if(v121Takeoff||v122Takeoff||v123Takeoff)
      status.takeoffStanceHold=Math.round((1-v122Fade)*100);
     qRaw.copy(qTarget);
     qTarget.copy(st.guidedLaunchLegs[i-14]).slerp(qRaw,v122Fade).normalize();
     status.guidedLaunchBlend=Math.round(fade*100);
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
     // V129 forearms are posed by the FINAL world-geometry pass. If the
     // legacy flight clip FIRST eases them back to rest and the final
     // guard THEN eases them forward, the two 5rad/s limits cancel out:
     // a hand stays dangling forever. Hold exactly the PREVIOUS visible
     // arm quaternion here, letting only the final real-world solver
     // advance those four joints with the original 5rad/s budget.
     // All other flight joints retain the historical V111 limiter.
     if((v129||v130||v131||v132||v133||v134||v135||v136||v137||v138||v140||v141||v142||v143||v144||v145||v146||v147||v148||v149||v150||v151||v152||v153||v155)&&[7,8,11,12].includes(i))qTarget.copy(st.prev[i]);
     else{
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
    }
    node.quaternion.copy(qTarget);
    node.updateMatrixWorld(true);
   }
   // V120 applied only after recorded V101 guard retarget. Keep the
   // final-arm pose and its wrist safety cap in this ONE V100 owner.
   if(v120Ascent||v121Ascent||v122Ascent||v123Ascent||v124Ascent||v125Ascent){
    const forward=realKairoForward(THREE,rig,status);
    if(v123Ascent||v124Ascent||v125Ascent){
     v123WorldRise(THREE,rig,forward,v123Arc,status);
     if(compactArms)worldJumpArms(THREE,rig,forward,{
      upper:v123Arc.armUpper,lower:v123Arc.armLower,
      shoulder:v123Arc.armShoulder,energy:v123Arc.energy,
      phase:'ascent'},status);
     status.armStyle='V123 expressive ascent';
    }else{
     // Preserve the exact independently tested V120 world-forward
     // call path, rather than replacing its original guard baseline.
     worldJumpArms(THREE,rig,realKairoForward(THREE,rig,status),
      v120ArmTiming('jump',st.jumpAge),status);
     status.armStyle='V120 fluid compact ascent';
    }
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
   if(v128||v129||v130||v131||v132||v133||v134||v135||v136||v137||v138||v140||v141||v142||v143||v144||v145||v146||v147||v148||v149||v150||v151||v152||v153||v155){
    // Stabilized from the REAL game-model facing, including VRM0's native
    // -Z parity; no extra Fighter.animate layer or invisible guide rig.
    const forward=realKairoForward(THREE,rig,null);
    if(v137||v138||v140||v141||v142||v143||v144||v145||v146||v147||v148||v149||v150||v151||v152||v153||v155)v137CorrectPelvisBalance(THREE,rig,forward,flightControl,
     smooth(st.elapsed/.32),st.prev,dt,status);
    if(v136||v137||v138||v140||v141||v142||v143||v144||v145||v146||v147||v148||v149||v150||v151||v152||v153||v155)v136CorrectSuspendedTorso(THREE,rig,forward,flightControl,
     smooth(st.elapsed/.30),st.prev,dt,status);
    v128CorrectFlightLegs(THREE,rig,forward,flightControl,
     smooth(st.elapsed/.26),st.prev,dt,status);
    if(v129||v130||v131||v132||v133||v134||v135||v136||v137||v138||v140||v141||v142||v143||v144||v145||v146||v147||v148||v149||v150||v151||v152||v153||v155)v129CorrectFlightGuard(THREE,rig,forward,flightControl,
      smooth(st.elapsed/.32),st.prev,dt,status,
      v155?'organic-flight':v153?'streamlined':v152?'quiet-travel':v151?'soaring-arms':v150?'joystick-flight':v149?'living-travel':v148?'omni-flight':v147?'directional-flight':v146?'expressive-vertical':v145?'vertical-flight':v144?'natural-arms':v143?'living-hover':v142?'authored-hover':v141?'suspended-hover':v140?'reference-hover':v138?'serene-hover':v137?'holistic-hover':v136?'full-hover':
      (v135||v134)?'natural-hover':
      v133?'weightless':v132?'buoyant':v131?'organic':
      v130?'relaxed':'guard');
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
  // V156: exact normalized 20-bone keyframe snapshots from the real
  // Kairo VRM. Executed ONLY inside the existing V100 final flight owner,
  // after its old retarget, never as an extra Fighter.animate wrapper.
  function applyAuthoredCruise(dt){
   const clip=root.SkyClashV156AuthoredFlight;
   if(!clip||clip.modelSha256!==
      '775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72'||
      clip.bones?.join('|')!==BONES.join('|')||
      clip.hover?.length!==BONES.length||
      clip.cruise?.length!==BONES.length){
    throw Error('V156 authored flight requires exact Kairo VRM0 joint clip');
   }
   // The last actually visible pose is the entry key, not a guessed bind
   // stance. 0.72s smooth entry; velocity produces a continuous hover ->
   // cruise blend, with no per-frame procedural bone aiming.
   const entry=smooth(st.elapsed/(clip.blendSeconds||.72));
   // Only intentional FORWARD input enters the authored cruise shape.
   // Strafing, hovering and reversing keep the V152 reference hover;
   // Boost/combat are independently owned and always yield V100.
   const yaw=f.facing||0;
   const signedForward=(f.vel?.x||0)*Math.sin(yaw)+
      (f.vel?.z||0)*Math.cos(yaw);
   const travel=smooth(st.flightMix)*
      smooth((signedForward-.45)/5.75);
   for(let i=0;i<BONES.length;i++){
    qRaw.fromArray(clip.hover[i]).slerp(qTmp.fromArray(clip.cruise[i]),travel);
    qTarget.copy(st.from[i]).slerp(qRaw,entry).normalize();
    st.nodes[i].quaternion.copy(qTarget);
   }
   // V157 optional bank, inside the SAME V100 final VRM pose owner.
   // Hips roll the complete authored Q silhouette; the head counters
   // just enough to keep Kairo's travel gaze. Elbows/knees stay authored.
   const bankMode=new URLSearchParams(root.location?.search||'')
    .get('flightBank');
   const bankEnabled=bankMode==='v157'||bankMode==='v158';
   if(bankEnabled){
    const x=f.vel?.x||0,z=f.vel?.z||0;
    const side=x*Math.cos(yaw)-z*Math.sin(yaw);
    const previous=st.v157Facing;
    let delta=previous==null?0:
      Math.atan2(Math.sin(yaw-previous),Math.cos(yaw-previous));
    if(Math.abs(delta)>.65)delta=0; // lock-on snap is not steering
    const yawRate=dt>0?clamp(delta/dt,-4,4):0;
    const intentX=f.moveIntent?.x||0,intentZ=f.moveIntent?.z||0;
    const inputSide=intentX*Math.cos(yaw)-intentZ*Math.sin(yaw);
    const drive=bankMode==='v158'?
     v158BankIntent(inputSide,side,yawRate):
     v157BankIntent(side,yawRate,signedForward);
    st.v157Bank=bankMode==='v158'?
     v158BankStep(st.v157Bank,drive,dt):
     v157BankStep(st.v157Bank,drive,dt);
    st.v157Facing=yaw;
    // 23 degrees is intentional: at the normal gameplay camera distance
    // V157's 6-7 degree left bank was not perceptible to the player.
    const bankDeg=(bankMode==='v158'?23:13)*st.v157Bank*entry;
    const roll=(i,degrees)=>{
     if(Math.abs(degrees)<.00001)return;
     qTarget.setFromAxisAngle(axisBank,degrees*Math.PI/180);
     st.nodes[i].quaternion.premultiply(qTarget).normalize();
    };
    roll(0,-bankDeg);      // right input: lower the right shoulder
    roll(2,-bankDeg*.10);  // slight chest weight-shift
    roll(4,bankDeg*.12);   // neck counter-rotation
    roll(5,bankDeg*.25);   // head keeps looking toward travel
    status.flightBankDegrees=+bankDeg.toFixed(2);
    status.flightBankTarget=+drive.toFixed(3);
    status.flightBankTurnRate=+yawRate.toFixed(3);
    status.flightBankLateral=+side.toFixed(3);
   }else{
    status.flightBankDegrees=0;
    status.flightBankTarget=0;
   }
   st.rig.vrm.update(0);
   status.flightStyle=bankEnabled?
    (bankMode==='v158'?'V158 visible responsive flight banking':
     'V157 V156 flight with responsive bank'):
    'V156 real-VRM authored Q forward flight';
   status.flightAuthoredBlend=+entry.toFixed(3);
   status.flightAuthoredTravel=+travel.toFixed(3);
   status.flightAuthoredBones=BONES.length;
  }
  f.animate=function(dt){
   const safe=clamp(Number.isFinite(dt)?dt:0,0,.065);
   const before=st.rig===this.vrmRig&&st.nodes.length?
    st.nodes.map(n=>n.quaternion.clone()):null;
   const v124Entry=['v124','v125'].includes(new URLSearchParams(root.location?.search||'')
    .get('jumpPreview'))&&this.v108JumpPrepT>0&&
    st.phase!=='prep'&&Math.hypot(this.vel?.x||0,this.vel?.z||0)<1.3;
   const entryFeet=v124Entry?v124IdleFootAnchors(THREE,this.vrmRig):null;
   const entryHips=v124Entry&&st.nodes[0]?.position.clone()||null;
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
      // V119: combat, Boost, knockback or flight may interrupt before
      // begin(next) gets a chance to restore toe entry quaternions.
      // Restore only toes (our exclusively opt-in prep articulation);
      // never overwrite the newly-owned combat/Boost FOOT rotations.
      if(st.phase==='prep'&&new URLSearchParams(root.location?.search||'')
         .get('jumpPreview')==='v119'||new URLSearchParams(root.location?.search||'')
         .get('jumpPreview')==='v120'||new URLSearchParams(root.location?.search||'')
         .get('jumpPreview')==='v121'||new URLSearchParams(root.location?.search||'')
         .get('jumpPreview')==='v122'||new URLSearchParams(root.location?.search||'')
         .get('jumpPreview')==='v123'||new URLSearchParams(root.location?.search||'')
         .get('jumpPreview')==='v124'||new URLSearchParams(root.location?.search||'')
         .get('jumpPreview')==='v125'){
       for(const anchor of st.prepFeet){
        const toe=st.rig.vrm.humanoid.getNormalizedBoneNode(anchor.side+'Toes');
        if(toe&&anchor.toeRotation)toe.quaternion.copy(anchor.toeRotation);
       }
      }
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
    if(st.phase!==state)begin(state,visible,this,
     state==='prep'?entryFeet:null,state==='prep'?entryHips:null);
    st.elapsed+=safe;
    if(state==='prep'){
     const duration=this.v108JumpPrepDuration||.095;
     const elapsed=clamp(duration-(this.v108JumpPrepT||0),0,duration);
     const profile=new URLSearchParams(root.location?.search||'')
       .get('jumpPrep');
     const kneeProfile=new URLSearchParams(root.location?.search||'')
       .get('jumpKnees');
     // Anatomic V116 remains a STANDING-only opt-in; inherited walk/run
     // takeoff uses the untouched V115 forward-calibrated pose.
     const v116=profile==='push'&&kneeProfile==='anatomic'&&
       st.prepSpeed<1.3;
      // V115/V116 A/Bs keep their exact former authored pose paths.
      // Preserve the V117 opt-in expression for independent A/B rollback.
      const v117=v116&&new URLSearchParams(root.location?.search||'')
       .get('jumpPreview')==='v117';
      const v118Original=v116&&new URLSearchParams(root.location?.search||'')
       .get('jumpPreview')==='v118';
      const v119=v116&&new URLSearchParams(root.location?.search||'')
       .get('jumpPreview')==='v119';
      const v120=v116&&new URLSearchParams(root.location?.search||'')
       .get('jumpPreview')==='v120';
      const v121=v116&&new URLSearchParams(root.location?.search||'')
       .get('jumpPreview')==='v121';
      const v122=v116&&new URLSearchParams(root.location?.search||'')
       .get('jumpPreview')==='v122';
      const v123=v116&&new URLSearchParams(root.location?.search||'')
       .get('jumpPreview')==='v123';
      const v124=v116&&new URLSearchParams(root.location?.search||'')
       .get('jumpPreview')==='v124';
      const v125=v116&&new URLSearchParams(root.location?.search||'')
       .get('jumpPreview')==='v125';
      const v122Stance=v122||v123||v124||v125;
      const v121Stance=v121||v122Stance;
      const v120Arms=v120||v121Stance;
      const v119Springed=v119||v120Arms;
      const v118=v118Original||v119Springed;
      const v117Torso=v117||v118;
     // Keep V109's historic A/B profile selection unchanged. V116
     // overrides the sampled PREP POSE only inside its opt-in branch.
     const originalReadable=profile==='push'?'push':profile==='readable';
     const readable=v116?'loaded':originalReadable;
     const p=prepPose(elapsed,st.prepSpeed,readable);
     const spring=v119Springed?v119Spring(elapsed,p.duration):null;
     const stance=v121Stance?v121LaunchStance(elapsed,p.duration):null;
     const v123Load=(v123||v124||v125)?v123Expression('prep',elapsed,p.duration):null;
     const rotX=new THREE.Quaternion(),xAxis=new THREE.Vector3(1,0,0);
     const axes=profile==='push'&&
      ['forward','anatomic'].includes(kneeProfile)?
      st.prepForwardAxes:null;
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
      // The original V112 assumed identical local X signs for both VRM
      // thighs/knees. Use measured world-forward bend for each joint.
      let bendAngle=(v116&&i>=14&&i<=19)||
       (v117&&(i===0||i===1||i===2||i===4))||
       (v118&&(i===0||i===1||i===2||i===4))?0:angle;
      if(!v116&&axes&&i>=14&&i<=19){
       const side=i<=16?'left':'right';
       const knee=axes[side];
       if(knee){
        if(i===14||i===17)bendAngle=Math.abs(p.thighX)*knee.thigh;
        else if(i===15||i===18)bendAngle=Math.abs(p.kneeX)*knee.knee;
        else bendAngle=p.ankleX*knee.knee; // same axis as shin, small boot release
       }
      }
      if(bendAngle)n.quaternion.multiply(rotX.setFromAxisAngle(xAxis,bendAngle)).normalize();
      n.updateMatrixWorld(true);
     }
     const actualForward=v118?realKairoForward(THREE,this.vrmRig,status):null;
     const v125Stance=v125?v125CoordinatedStance(THREE,actualForward,
       st.prepFeet,elapsed,p.duration):null;
     if(v117Torso){
      worldStandingPrepTorso(THREE,this.vrmRig,
       Math.abs(p.spineX)*(spring?.spineGain??1)*(v123Load?.spineGain??1),
       Math.abs(p.chestX)*(spring?.chestGain??1)*(v123Load?.chestGain??1),
       status,actualForward);
     }
     if(v116){
      // The user's V122 planted stance and foot directions are GOOD.
      // Expressive V123 pushes by deepening torso/pelvis coil and
      // releasing the unchanged accepted knees; avoid accumulating
      // a new V102-leg angular clamp lag into the approved FALL.
      worldStandingPrepLegs(THREE,this.vrmRig,Math.abs(p.thighX),
       Math.abs(p.kneeX),st.prepFeet,status,actualForward,
       v125Stance?.knees||null);
     }
     // Rotate the REAL thigh about world-up only after its correct V118
     // world-forward knee fold. This changes heading, NOT knee flexion.
     if(v121)v121OutwardThighs(THREE,this.vrmRig,stance.thighYaw,status);
     else if(v122Stance&&!v125)v121OutwardThighs(THREE,this.vrmRig,
       stance.thighYaw*1.5,status);
     if(profile==='push'&&new URLSearchParams(root.location?.search||'')
       .get('jumpFeet')==='hold'&&st.prepHipsXZ){
      st.nodes[0].position.x=st.prepHipsXZ.x;
      st.nodes[0].position.z=st.prepHipsXZ.z;
     }
     st.nodes[0].position.y=st.prepHipsY+
      (p.hipsY-(spring?.hipDip||0)-(v123Load?.hipDip||0))/(this.vrmRig.scale||1);
     st.prepLastHipY=st.nodes[0].position.y;
     this.vrmRig.vrm.update(0);
     if(profile==='push'){
      // Both shoes should stay exactly where they were when the boxer
      // loaded weight. Knee flex alone can drift the VRM ankles sideways
      // because the original approved pose is not a perfect neutral bind.
      // Very small post-pose two-joint IK brings them back without
      // touching horizontal gameplay motion, as during moving landing.
      let largest=0;
      const kneeMode=new URLSearchParams(root.location?.search||'')
        .get('jumpKnees');
      if(kneeMode==='guided')
       largest=guidedPrepFeet(THREE,this.vrmRig,st.prepFeet,status);
      // V115 forward: no knee-solving IK at all. The dual-foot visual
      // pelvis anchor below handles any shared horizontal foot shift.
      // This ensures no hidden IK rotation can undo the measured bend.
      else if(kneeMode==='forward'){
       status.prepHingeSlipCm=0;
       status.prepKneeDirections=st.prepForwardAxes?
        ['left','right'].map(s=>s[0].toUpperCase()+
        ':T'+(st.prepForwardAxes[s].thigh>0?'+':'-')+
        ' K'+(st.prepForwardAxes[s].knee>0?'+':'-')).join(' '):'not-calibrated';
      }
      else if(kneeMode==='anatomic'){
       status.prepHingeSlipCm=0;
       status.prepKneeDirections=v125?'V125 knees track measured shoes':
         v124?'V124 idle-to-crouch feet preserved':
         v123?'V123 expressive loaded crouch':
         v122?'V122 visible toe-out crouch':
         v121?'V121 heading-preserved crouch':
         v120?'V120 fluid V119 crouch':
        v119?'V119 soft V118 crouch':
        v118?'V118 true VRM0 front':
        v117?'V117 forward torso + knees':
        v116?'V116 world-space anatomy':'V115 calibrated moving prep';
      }
      else for(const anchor of st.prepFeet){
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
     // V119 forefoot spring is composed AFTER the V118 knee/body pose and
     // old support correction, but BEFORE final sole-floor calibration.
     // Only the opt-in standing-jump path ever touches normalized toe bones.
     if(v119Springed){
      const toeMotion=v121?{...spring,turnout:stance.footYaw}:spring;
      softPrepToes(THREE,this.vrmRig,st.prepFeet,actualForward,
       v125?{...spring,turnout:0}:
       v122Stance?{...spring,turnout:stance.footYaw}:toeMotion,status);
      this.vrmRig.vrm.update(0);
     }
     if(v122Stance){
      v122VisibleToeHeading(THREE,this.vrmRig,actualForward,
       v125 ? .20 : .20*stance.ready,status,
       (v124||v125)?st.prepFeet:null,v125Stance?.feet||null);
      this.vrmRig.vrm.update(0);
     }
     if(v120Arms){
      worldJumpArms(THREE,this.vrmRig,actualForward,
       (v123||v124||v125)?{upper:v123Load.armUpper,lower:v123Load.armLower,
        shoulder:v123Load.armShoulder,energy:v123Load.energy,
        phase:'recoil'}:v120ArmTiming('prep',elapsed,p.duration),status);
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
     if(['v126','v127','v128','v129','v130','v131','v132','v133','v134','v135','v136','v137','v138','v140','v141','v142','v143','v144','v145','v146','v147','v148','v149','v150','v151','v152','v153','v155'].includes(new URLSearchParams(root.location?.search||'')
       .get('flightPreview'))){
      const yaw=this.facing||0;
      const side=(this.vel?.x||0)*Math.cos(yaw)-
       (this.vel?.z||0)*Math.sin(yaw);
      st.flightVelocityY=flightStep(st.flightVelocityY,this.vel?.y||0,safe);
      st.flightSide=flightStep(st.flightSide,side,safe);
      status.flightSmoothedVertical=+st.flightVelocityY.toFixed(2);
      status.flightSmoothedLateral=+st.flightSide.toFixed(2);
      if(['v146','v147','v148','v149','v150','v151','v152','v153','v155'].includes(new URLSearchParams(root.location?.search||'').get('flightPreview'))){
       const clip=root.SkyClashV146Vertical;
       if(!clip)throw Error('V146 vertical follow-through not loaded');
       st.v146Motion=clip.step(st.v146Motion,st.flightVelocityY,safe);
      }
      if(new URLSearchParams(root.location?.search||'').get('flightPreview')==='v147'){
       const clip=root.SkyClashV147Horizontal;
       if(!clip)throw Error('V147 directional performance unavailable');
       const signedForward=(this.vel?.x||0)*Math.sin(yaw)+
         (this.vel?.z||0)*Math.cos(yaw);
       st.v147Motion=clip.step(st.v147Motion,signedForward,safe);
       status.flightSignedForward=+signedForward.toFixed(2);
      }
      if(['v148','v149'].includes(new URLSearchParams(root.location?.search||'').get('flightPreview'))){
       const clip=root.SkyClashV148AllFlight;
       if(!clip)throw Error('V148 omnibus authored motion unavailable');
       st.v148Motion=clip.step(st.v148Motion,this.vel?.x||0,
        this.vel?.z||0,yaw,safe,this.sprinting);
       status.flightSignedForward=+st.v148Motion.signedForward.toFixed(2);
       status.flightSignedSide=+st.v148Motion.signedSide.toFixed(2);
      }
      if(['v150','v151','v152','v153','v155'].includes(new URLSearchParams(root.location?.search||'').get('flightPreview'))){
        const omni=root.SkyClashV148AllFlight,input=root.SkyClashV150Flight;
       if(!omni||!input)throw Error('V150 sources not loaded');
       st.v148Motion=omni.step(st.v148Motion,this.vel?.x||0,
        this.vel?.z||0,yaw,safe,this.sprinting);
       const actor=root.SkyClash?.Game?.player===this,
        locked=actor&&!!root.SkyClash?.CameraRig?.isLockActive?.();
       st.v150Motion=input.step(st.v150Motion,
        actor?(this.moveIntent?.x||0):0,
        actor?(this.moveIntent?.z||0):0,
        this.vel?.x||0,this.vel?.z||0,yaw,locked,safe);
       status.flightSignedForward=+st.v148Motion.signedForward.toFixed(2);
       status.flightSignedSide=+st.v148Motion.signedSide.toFixed(2);
        if(['v152','v153','v155'].includes(new URLSearchParams(root.location?.search||'').get('flightPreview'))){
          const clip=root.SkyClashV152Silhouette;
          if(!clip)throw Error('V152 visual flight clip unavailable');
          st.v152Motion=clip.step(st.v152Motion,st.v150Motion,
            this.vel?.y||0,Math.hypot(this.vel?.x||0,this.vel?.z||0),safe);
          if(['v153','v155'].includes(new URLSearchParams(root.location?.search||'').get('flightPreview'))){
           const stream=root.SkyClashV153Streamline;
           if(!stream)throw Error('V153 streamline clip unavailable');
           st.v153Motion=stream.step(st.v153Motion,st.v150Motion,
             Math.hypot(this.vel?.x||0,this.vel?.z||0),safe);
          }
         }
         if(new URLSearchParams(root.location?.search||'').get('flightPreview')==='v151'){
         const arms=root.SkyClashV151TravelArms;
         if(!arms)throw Error('V151 authored travel-arm clip unavailable');
         st.v151Arms=arms.step(st.v151Arms,st.v150Motion,safe);
        }
      }
     }
     const choice=new URLSearchParams(root.location?.search||'')
       .get('flightStyle');
     status.flightStyle=choice==='airborne'?
       (new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v155'?'V155 bent organic arched forward flight':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v153'?'V153 forceful streamlined forward flight':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v152'?'V152 calm hover and clear trailing free-flight arms':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v151'?'V151 relaxed travel arms and V150 full-body flight':
          new URLSearchParams(root.location?.search||'')
          .get('flightPreview')==='v150'?'V150 joystick-responsive full-body flight':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v149'?'V149 living full-body forward/back flight':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v148'?'V148 authored complete full-body flight':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v147'?'V147 authored forward and backward flight':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v146'?'V146 expressive vertical follow-through':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v145'?'V145 authored ascending and descending flight':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v144'?'V144 relaxed floating arms':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v143'?'V143 living 4.6s hover animation':
         new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v142'?'V142 authored 4.6s hover clip':
          new URLSearchParams(root.location?.search||'')
          .get('flightPreview')==='v141'?'V141 suspended silhouette experiment':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v140'?'V140 reference-balanced anime hover':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v138'?'V138 calm anime levitation':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v137'?'V137 natural pelvis-balanced freeflight':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v136'?'V136 coherent whole-body hover':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v135'?'V135 soft trailing knee':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v134'?'V134 naturally suspended flight':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v133'?'V133 weightless animated flight':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v132'?'V132 buoyant float':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v131'?'V131 organic hover':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v130'?'V130 relaxed animated levitation':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v129'?'V129 forward hover guard':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v128'?'V128 corrected world-space knees':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v127'?'V127 suspended combat hover':
        new URLSearchParams(root.location?.search||'')
         .get('flightPreview')==='v126'?'V126 expressive hover / cruise':
         'V114 true hover / cruise'):
       choice==='controlled'?'V113 authored controlled':
       'V111 continuous hover / travel';
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
    if(state==='flight'&&new URLSearchParams(root.location?.search||'')
       .get('flightPreview')==='v156'){
     applyAuthoredCruise(safe);
    }
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
    prepFootSlipCm:0,prepHingeSlipCm:0,prepWorldKneeCm:0,
    prepTorsoForwardCm:0,prepToeFlexDeg:0,prepFootTurnDeg:0,
    prepToeJoints:0,takeoffThighOutDeg:0,takeoffThighJoints:0,
    takeoffStanceHold:0,visibleToeHeadingDeg:null,visibleFootCorrections:0,
    v123RiseJoints:0,v123RiseEnergy:0,
    idleFootAnchorsCaptured:0,
    jumpArmMotion:'original compact',
    jumpArmDrive:0,jumpArmWorldJoints:0,prepForwardSource:'unverified',
    prepSceneVsBodyDot:null,prepToeVsBodyDot:null,
    prepKneeDirections:'uncalibrated',
    guidedLaunchBlend:0,
    pushRelease:0,flightStyle:'legacy switch',
    flightSpeed:0,flightBlend:0,flightSmoothedVertical:0,
    flightSmoothedLateral:0,flightReferenceWorld:null,
   flightReferenceSilhouette:'not-tested',flightSuspendedWorld:null,
   flightSuspendedSilhouette:'not-tested',flightSereneWorld:null,
   flightSereneSilhouette:'not-tested',flightHolisticWorld:null,
   flightHolisticSilhouette:'not-tested',flightPelvisBalanceWorld:null,
   flightFullBodyWorld:null,
   flightFullBodySilhouette:'not-tested',flightTorsoWorld:null,
    flightTravelArmBlend:0,flightTravelHandBlend:0,
    flightTravelArmMode:'guard-or-hover',
   flightQuietHover:0,flightTrailingElbow:0,flightTrailingHand:0,
   flightTrailingPose:'calm-hover-or-guard',
   flightStreamlineWeight:0,flightStreamlineTarget:0,flightStreamlineDegrees:0,
   flightNaturalWorld:null,
   flightNaturalSilhouette:'not-tested',flightWeightlessWorld:null,
   flightWeightlessSilhouette:'not-tested',flightBuoyantWorld:null,
   flightBuoyantSilhouette:'not-tested',flightOrganicWorld:null,
   flightOrganicSilhouette:'not-tested',flightRelaxedWorld:null,
    flightRelaxedSilhouette:'not-tested',flightGuardWorld:null,
    flightGuardFacing:'not-tested',flightKneeWorld:null,
    flightKneeFacing:'not-tested',flightJointClamps:0,
    flightMaxStepDeg:0,flightBankDegrees:0,flightBankTarget:0,
    flightBankTurnRate:0,flightBankLateral:0,airFacingStyle:'original recorded yaw',
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
 const api={version:100,BONES,clipFor,flightWeight,flightStep,
    v157BankIntent,v157BankStep,v158BankIntent,v158BankStep,
    controlledFlightPose,airborneFlightPose,v126FlightPose,v127SuspendedFlightPose,
    v128FlightPose,v128CorrectFlightLegs,v129FlightPose,v129CorrectFlightGuard,
    v130FlightPose,v131FlightPose,v132FlightPose,v133FlightPose,
    v134FlightPose,v135FlightPose,v136FlightPose,
    v136CorrectSuspendedTorso,v137FlightPose,v137CorrectPelvisBalance,
    v138FlightPose,v140FlightPose,v141FlightPose,v142FlightPose,v143FlightPose,v144FlightPose,v145FlightPose,v146FlightPose,v147FlightPose,v148FlightPose,v149FlightPose,v150FlightPose,v151FlightPose,v152FlightPose,v153FlightPose,v155FlightPose,
    guidedPrepFeet,forwardKneeAxes,
    realKairoForward,worldStandingPrepLegs,worldStandingPrepTorso,
    v119Spring,softPrepToes,v121LaunchStance,v121OutwardThighs,
    v122VisibleToeHeading,v123Expression,v123WorldRise,v124IdleFootAnchors,
    v125CoordinatedStance,
    v120ArmTiming,worldJumpArms,
    prepPose,landingPlan,jumpExpression,
    axialTwist,stabilizeFacing,steadyLandingSupport,
    soleGaps,plantVisibleSoles,stateOf,ownsAir,attach,start};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV100Animator=api;
})(typeof window!=='undefined'?window:globalThis);
