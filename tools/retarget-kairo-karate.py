"""Retarget CMU karate full-body motion to the *existing* measured Kairo IK rig.

The source BVH is only used offline. No extra gameplay animation owner, no
Mixamo asset and no raw CMU file is checked into the game.
CMU subject 135 takes: 04 front, 07 roundhouse, 11 side.
https://mocap.cs.cmu.edu/ - credited motion freely includable in games.
"""
import os
import math
from pathlib import Path
from mathutils import Vector, Quaternion

CMU_KICKS = (
    ("rising-kick", "135_04.bvh", 812),
    ("roundhouse", "135_07.bvh", 772),
    ("side-kick", "135_11.bvh", 608),
)

class BVHNode:
    def __init__(self, name, parent):
        self.name, self.parent = name, parent
        self.offset, self.channels, self.start = Vector((0,0,0)), [], 0

def parse_bvh(path):
    """Unmodified cmu-mocap BVH in Y-up with Z,Y,X rotation channels."""
    lines = Path(path).read_text().splitlines()
    nodes, stack, channels = [], [], 0
    motion_start = -1
    for i, raw in enumerate(lines):
        a = raw.strip().split()
        if not a: continue
        if a[0] == 'MOTION':
            motion_start = i
            break
        if a[0] in ('ROOT', 'JOINT'):
            nodes.append(BVHNode(a[1], stack[-1] if stack else None))
        elif a[:2] == ['End', 'Site']:
            nodes.append(BVHNode('End_' + str(len(nodes)), stack[-1] if stack else None))
        elif a[0] == '{':
            stack.append(len(nodes)-1)
        elif a[0] == '}':
            stack.pop()
        elif a[0] == 'OFFSET':
            nodes[-1].offset = Vector(tuple(map(float,a[1:4])))
        elif a[0] == 'CHANNELS':
            nodes[-1].channels = a[2:]
            nodes[-1].start = channels
            channels += int(a[1])
    assert motion_start > 0 and not stack
    n = int(lines[motion_start+1].split(':')[1])
    dt = float(lines[motion_start+2].split(':')[1])
    data = [tuple(map(float,line.split())) for line in lines[motion_start+3:] if line.strip()]
    assert len(data) == n and all(len(f)==channels for f in data)
    names = {n.name:i for i,n in enumerate(nodes)}
    return nodes, names, data, dt

def frame_pose(nodes, names, row):
    wpos, wrot = [], []
    axes = {'X':Vector((1,0,0)),'Y':Vector((0,1,0)),'Z':Vector((0,0,1))}
    for node in nodes:
        values = row[node.start:node.start+len(node.channels)]
        q = Quaternion()
        trans = node.offset.copy()
        for channel,value in zip(node.channels,values):
            if channel.endswith('position'):
                trans['XYZ'.index(channel[0])] += value
            elif channel.endswith('rotation'):
                q @= Quaternion(axes[channel[0]],math.radians(value))
        if node.parent is None:
            wpos.append(trans)
            wrot.append(q)
        else:
            wpos.append(wpos[node.parent] + wrot[node.parent] @ trans)
            wrot.append(wrot[node.parent] @ q)
    return {name:wpos[i] for name,i in names.items()}

def clamp(v, a, b):
    return min(b,max(a,v))

def smooth(v):
    v=clamp(v,0,1)
    return v*v*(3-2*v)

def horizontal(v):
    out=v.copy();out.y=0
    return out.normalized() if out.length>1e-7 else Vector((0,0,-1))

def angle_about_up(a,b):
    a,b=horizontal(a),horizontal(b)
    return math.degrees(math.atan2(Vector((0,1,0)).dot(a.cross(b)),a.dot(b)))

def mapped(v,fwd,side,scale):
    """CMU actor 3D delta -> Kairo measured game-facing Blender world delta."""
    return offset(v.dot(fwd)*scale,v.dot(side)*scale,v.y*scale)

def vector_components(v):
    return (v.dot(forward),v.dot(lateral),v.dot(up))

def source_mocap_clip(name,file,peak,source_dir):
    nodes,names,frames,dt=parse_bvh(Path(source_dir)/file)
    fps=1/dt
    assert 115<fps<125,(file,fps)
    duration,contact=.87,.41
    # Motion reference: the striking instant is not a guessed BVH frame.
    # Identify its actual high, extended, opponent-directed right foot.  The
    # old hard-coded markers (notably trial 135_11 frame 608) aligned "impact"
    # to the *recoil*, so the leg folded when the hit effect was playing.
    # Keep the manually located frame as a narrow event-local search seed;
    # never scan the entire multi-technique file and pick an unrelated kick.
    seed=frame_pose(nodes,names,frames[peak])
    direction=horizontal(seed['RightFoot']-seed['Hips'])
    seed_leg=((seed['RightUpLeg']-seed['RightLeg']).length+
              (seed['RightLeg']-seed['RightFoot']).length)
    candidates=[]
    for j in range(max(0,peak-round(fps*.34)),
                   min(len(frames),peak+round(fps*.20)+1)):
        pose=frame_pose(nodes,names,frames[j])
        thigh=pose['RightLeg']-pose['RightUpLeg']
        shin=pose['RightFoot']-pose['RightLeg']
        extension=(thigh+shin).length/max(.001,thigh.length+shin.length)
        lift=(pose['RightFoot'].y-pose['LeftFoot'].y)/seed_leg
        reach=(pose['RightFoot']-pose['RightUpLeg']).dot(direction)/seed_leg
        # Require a raised striking shoe; a fully straight *standing* leg
        # must not win the event selection.  Use the actual thrust direction
        # and leg extension, not an attractive but biomechanically wrong arc.
        if lift>.15 and extension>.48:
            score=reach+.20*extension+.10*min(1.4,lift)
            candidates.append((score,j,lift,extension,reach))
    assert candidates,(file,'No identifiable raised, extended human kick')
    # A centred five-frame window suppresses isolated mocap marker jitter.
    rough=max(candidates)[1]
    ranking={item[1]:item for item in candidates}
    neighbour=[ranking[j] for j in range(rough-2,rough+3) if j in ranking]
    selected=max(neighbour,key=lambda x:x[0])
    impact_frame=selected[1]
    # Preserve the actor's genuine approach and re-chamber, but register the
    # *recorded extension* with the game's hit instant.  The 0.87s clip is
    # assembled as a continuous, piecewise-linear sampling of real captured
    # frames; no fabricated knee or ankle trajectory is introduced.
    source_begin=max(0,impact_frame-round(fps*contact))
    source_end=min(len(frames)-1,impact_frame+round(fps*(duration-contact)))
    first=frame_pose(nodes,names,frames[source_begin])
    at_hit=frame_pose(nodes,names,frames[impact_frame])
    print('KARATE_REFERENCE_STRIKE',name,'seed',peak,'capturedContact',impact_frame,
          'correctionFrames',impact_frame-peak,'liftLegLengths',round(selected[2],3),
          'extensionRatio',round(selected[3],3),
          'forwardReachLegLengths',round(selected[4],3),
          'sourceWindow',source_begin,source_end)
    assert all(k in names for k in (
        'Hips','Spine1','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg',
        'LeftFoot','RightFoot','LeftArm','RightArm','LeftHand','RightHand',
        'LeftForeArm','RightForeArm','LeftToeBase','RightToeBase'))
    source_leg=((first['RightUpLeg']-first['RightLeg']).length+
                (first['RightLeg']-first['RightFoot']).length)
    target_leg=((heads['rightUpperLeg']-heads['rightLowerLeg']).length+
                (heads['rightLowerLeg']-heads['rightFoot']).length)
    scale=target_leg/source_leg
    assert .025<scale<.11,(file,scale)
    # Retarget in the frame of the captured PLANTED foot, not the moving
    # pelvis. Subtracting the travel of the actor's hips from the striking
    # foot while separately clamping pelvis travel removed most of the
    # authentic extension and counterweight transfer.
    initial_support_to_pelvis=first['Hips']-first['LeftFoot']
    support_leg=(heads['leftUpperLeg']-heads['leftLowerLeg']).length + (
        heads['leftLowerLeg']-heads['leftFoot']).length
    # Explicitly face the mocap kick's horizontal foot trajectory toward
    # Kairo's opponent. No historical VRM+Z / Blender-Y facing guess.
    actor_forward=horizontal(at_hit['RightFoot']-at_hit['Hips'])
    actor_side=Vector((0,1,0)).cross(actor_forward).normalized()
    def tr(delta): return mapped(delta,actor_forward,actor_side,scale)
    def dir_(a,b):
        v=tr(a-b)
        return v.normalized() if v.length>.001 else offset(.5,0,0)

    pelvis_axis0=first['RightUpLeg']-first['LeftUpLeg']
    upper_axis0=first['RightArm']-first['LeftArm']
    # Spine1 is a short near-pelvis segment: its tiny 3D tilt is a poor,
    # noisy proxy for the entire torso. Derive body pitch and roll from the
    # recorded Hips-to-Neck axis instead (and only fall back on available
    # upper body nodes for BVH naming variants). This couples the chest,
    # pelvis and head to the actual performer's whole-body counterbalance.
    torso_marker=next((n for n in ('Neck','Neck1','Head','Spine1')
                       if n in names),None)
    assert torso_marker
    torso0=first[torso_marker]-first['Hips']
    result=[]
    previous_elbow_planes={}
    for i in range(53):
        t=round(min(duration,i/60),7)
        # Piecewise linear time map: actual human extension exactly on hit,
        # and unmodified filmed movement on either side of that event.
        source_frame=(source_begin+(impact_frame-source_begin)*t/contact
                      if t<=contact else
                      impact_frame+(source_end-impact_frame)*
                      (t-contact)/(duration-contact))
        source_frame=clamp(source_frame,0,len(frames)-1)
        lo=int(source_frame); hi=min(lo+1,len(frames)-1)
        pa=frame_pose(nodes,names,frames[lo])
        pb=frame_pose(nodes,names,frames[hi])
        blend=source_frame-lo
        p={k:pa[k].lerp(pb[k],blend) for k in pa}
        # Smooth in/out of Kairo's OWN existing guard, avoiding a hard-cut from
        # his game stance to the actor's arbitrary opening pose.
        strength=smooth(t/.11)*smooth((duration-t)/.15)
        # The real support-foot/pelvis relationship contains the actor's
        # weight shift. Keep it in world space as the Kairo gameplay root is
        # in-place, then project onto the reach of Kairo's measured support leg.
        hip_delta=tr((p['Hips']-p['LeftFoot'])-initial_support_to_pelvis)
        hf,hl,hz=vector_components(hip_delta)
        hip=(clamp(hf*strength,-.16,.16),
             clamp(hl*strength,-.14,.14),
             clamp(hz*strength,-.12,.04))
        if name in ('roundhouse','side-kick'):
            hip=(hip[0],hip[1],min(hip[2],-.025*strength))
        hip_t=offset(*hip)
        hips_yaw=clamp(angle_about_up(pelvis_axis0,p['RightUpLeg']-p['LeftUpLeg']),-105,105)*strength
        # A turn moves the support HIP SOCKET around the pelvis, not only
        # its translation. Solve the planted leg against that rotated socket
        # in the same global basis used by the DCC, with IK bend clearance.
        pelvis_q=Quaternion(up,math.radians(hips_yaw))
        support_joint=(heads['hips']+hip_t+
                       pelvis_q@(heads['leftUpperLeg']-heads['hips']))
        support_span=heads['leftFoot']-support_joint
        if support_span.length>support_leg*.953:
            hip_t+=(heads['leftFoot']-support_span.normalized()*
                    (support_leg*.953))-support_joint
            hip=vector_components(hip_t)
        chest_yaw=clamp(angle_about_up(upper_axis0,p['RightArm']-p['LeftArm']),-120,120)*strength
        torso=p[torso_marker]-p['Hips']
        lean=clamp(math.degrees(math.atan2(torso.dot(actor_forward),
                      max(.001,torso.y)))-
                   math.degrees(math.atan2(torso0.dot(actor_forward),
                      max(.001,torso0.y))),-42,42)*strength
        roll=clamp(math.degrees(math.atan2(torso.dot(actor_side),
                      max(.001,torso.y)))-
                   math.degrees(math.atan2(torso0.dot(actor_side),
                      max(.001,torso0.y))),-32,32)*strength
        foot_targets={}
        foot_angles={}
        knee_hints={}
        elbow_hints={}
        hand_targets={}
        for side in ('left','right'):
            label=side.capitalize()
            # Reproduce the captured foot trajectory relative to the SAME
            # actual planted shoe used for the pelvis. Keep Kairo's left sole
            # planted; turning is expressed by the captured toe orientation.
            # This is true source FK motion, not an animated foot-offset arc.
            foot=tr((p[label+'Foot']-p['LeftFoot'])-
                    (first[label+'Foot']-first['LeftFoot']))
            target=(heads['leftFoot'].copy() if side=='left' else
                    heads['rightFoot']+foot*strength)
            if side=='right':
                # Enforce Kairo's actual thigh + shin reach as a kinematic
                # limit. IK should NEVER be asked to extend a non-existent
                # third leg segment when actor proportions differ.
                joint=(heads['hips']+hip_t+
                       pelvis_q@(heads['rightUpperLeg']-heads['hips']))
                # The kick leg is a TWO-BONE human chain, not a foot
                # spline with an arbitrary IK pole. Reconstruct both segments
                # from the actual captured femur and tibia directions, then
                # scale EACH segment to Kairo's measured limb lengths. In
                # particular this preserves the captured knee chamber across
                # turning kicks and avoids a knee inversion when the planted
                # source foot slides or steps. IK below merely fits the foot
                # and the captured knee plane to the same measured skeleton.
                source_thigh=tr(p['RightLeg']-p['RightUpLeg'])
                source_shin=tr(p['RightFoot']-p['RightLeg'])
                assert source_thigh.length>.001 and source_shin.length>.001
                thigh_length=(heads['rightLowerLeg']-
                              heads['rightUpperLeg']).length
                shin_length=(heads['rightFoot']-
                             heads['rightLowerLeg']).length
                fk_knee=joint+source_thigh.normalized()*thigh_length
                fk_ankle=fk_knee+source_shin.normalized()*shin_length
                target=heads['rightFoot'].lerp(fk_ankle,strength)
                length=(heads['rightUpperLeg']-heads['rightLowerLeg']).length + (
                         heads['rightLowerLeg']-heads['rightFoot']).length
                span=target-joint
                if span.length>length*.955:
                    target=joint+span.normalized()*(length*.955)
            foot_targets[side]=target
            toe_now=p[label+'ToeBase']-p[label+'Foot']
            toe_0=first[label+'ToeBase']-first[label+'Foot']
            # The planted shoe is the pivot axis in Mawashi/Yoko.
            # 110 degrees truncated genuine heel turns into knee/hip torque.
            foot_yaw=clamp(angle_about_up(toe_0,toe_now),-155,155)*strength
            pitch=clamp(math.degrees(math.atan2(toe_now.y,max(.01,horizontal(toe_now).length)))-
                        math.degrees(math.atan2(toe_0.y,max(.01,horizontal(toe_0).length))),-42,45)*strength
            foot_angles[side]=(foot_yaw,pitch,0)
            # Transfer the actual captured knee BEND PLANE. A thigh vector
            # is not an IK pole: projecting it into the hip/ankle plane
            # erases the martial artist's knee-chamber and turning intent.
            upper=tr(p[label+'UpLeg']-p['LeftFoot'])
            knee=tr(p[label+'Leg']-p['LeftFoot'])
            ankle=tr(p[label+'Foot']-p['LeftFoot'])
            axis=(ankle-upper).normalized()
            bend=(knee-upper)-axis*(knee-upper).dot(axis)
            knee_hints[side]=(bend.normalized()*.75 if bend.length>.001
                              else offset(.0,.45,-.25))
            # Recover arm counterbalance from captured shoulder/elbow/wrist
            # geometry while retaining the outward guard clearance on the
            # stylised, narrower Kairo torso.
            shoulder=tr(p[label+'Arm']-p['LeftFoot'])
            elbow=tr(p[label+'ForeArm']-p['LeftFoot'])
            wrist_source=tr(p[label+'Hand']-p['LeftFoot'])
            arm_axis=(wrist_source-shoulder).normalized()
            pole=(elbow-shoulder)-arm_axis*(elbow-shoulder).dot(arm_axis)
            safe=(offset(-.14,.29,-.31) if side=='left'
                  else offset(-.18,-.33,-.29)).normalized()
            # A hemisphere sign flip at 90 degrees produces a violent
            # upper-arm snap. Use only the captured tangential pole swing,
            # preserve Kairo's outside-elbow hemisphere, and low-pass the
            # source signal at the measured 60 Hz authoring sample rate.
            if pole.length>.001:
                captured=pole.normalized()
                tangent=captured-safe*captured.dot(safe)
                desired=(safe+tangent*.20).normalized()
            else:
                desired=safe
            previous=previous_elbow_planes.get(side,safe)
            stable=previous.lerp(desired,.27).normalized()
            previous_elbow_planes[side]=stable
            elbow_hints[side]=stable*.75
            wrist=tr((p[label+'Hand']-p['Spine1'])-
                     (first[label+'Hand']-first['Spine1']))+hip_t
            # Hands should follow the actor's counterbalancing changes but
            # start/end at the approved Kairo guard positions.
            # Hip displacement is included once in the target's world frame.
            # Preserve the ACTOR's arm counter-sweep rhythm, but attenuate
            # its reach so the hands do not punch through Kairo's ribs.
            hand_goal=guard[side]+wrist*strength*.48
            # Anatomical guard clearance: if the actor swings a wrist across
            # the sternum, remap that reach to Kairo's near-side silhouette
            # rather than threading the sleeve through his narrower ribs.
            outward=1 if side=='left' else -1
            torso=heads['upperChest']+hip_t
            signed_side=(hand_goal-torso).dot(lateral)*outward
            if signed_side<.16:
                hand_goal+=lateral*(outward*(.16-signed_side))
            # Different human/VRM arm proportions: preserve the actor's
            # hand-direction counterbalance without hyperextending Kairo's
            # elbows. The measured shoulder-to-wrist link is ~0.55 m.
            shoulder=heads[side+'UpperArm']+hip_t
            reach=(heads[side+'UpperArm']-heads[side+'LowerArm']).length + (
                   heads[side+'LowerArm']-heads[side+'Hand']).length
            delta=hand_goal-shoulder
            if delta.length>reach*.85:
                hand_goal=shoulder+delta.normalized()*(reach*.85)
            hand_targets[side]=hand_goal
        result.append(key(t,hand_targets['left'],hand_targets['right'],
            hip=hip,yaw=chest_yaw,hips_yaw=hips_yaw,
            lean=lean,roll=roll,feet=foot_targets,foot_angles=foot_angles,
            knees=knee_hints,elbows=elbow_hints))
    result.append(key(duration,guard['left'],guard['right'],
                      feet={'left':heads['leftFoot'].copy(),
                            'right':heads['rightFoot'].copy()}))
    # Human reference acceptance evidence, one sample each at chamber,
    # full extension, and re-chamber.  This is joint-level data from the
    # captured actor, not an unsupported visual "looks better" assertion.
    def captured_phase(seconds):
        frame=(source_begin+(impact_frame-source_begin)*seconds/contact
               if seconds<=contact else impact_frame+(source_end-impact_frame)*
               (seconds-contact)/(duration-contact))
        pose=frame_pose(nodes,names,frames[round(clamp(frame,0,len(frames)-1))])
        hip=pose['RightUpLeg'];knee=pose['RightLeg'];foot=pose['RightFoot']
        leg=(knee-hip).length+(foot-knee).length
        return dict(kneeHeight=round((knee.y-pose['LeftFoot'].y)/leg,3),
            footHeight=round((foot.y-pose['LeftFoot'].y)/leg,3),
            extension=round((foot-hip).length/leg,3),
            forwardReach=round((foot-hip).dot(actor_forward)/leg,3))
    print('KARATE_CAPTURED_PHASES',name,
          'chamber',captured_phase(.22),'impact',captured_phase(contact),
          'rechamber',captured_phase(.60))
    print('AUTHENTIC_KARATE_RETARGET',name,'fps',round(fps,2),
          'scale',round(scale,5),'measured strike',impact_frame,'keys',len(result))
    return dict(clipId=name,durationSeconds=duration,impactSeconds=contact,
        keys=result,grounded=True,air=False,kickingSide='right',
        explicitFeet=True,supportWindows={
            'left':[(0,.10),(.30,.50),(.82,.87)],
            'right':[(0,.06),(.82,.87)]})

def make_authentic_karate_clips():
    source_dir=os.environ.get('KAIRO_KARATE_BVH_DIR')
    assert source_dir and Path(source_dir).is_dir(), 'Reference BVH source not supplied'
    return [source_mocap_clip(name,file,peak,source_dir) for name,file,peak in CMU_KICKS]
