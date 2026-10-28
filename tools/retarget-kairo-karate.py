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
    t0=max(0,min(len(frames)-1,round(peak-contact*fps)))
    first=frame_pose(nodes,names,frames[t0])
    at_hit=frame_pose(nodes,names,frames[peak])
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
    torso0=first['Spine1']-first['Hips']
    result=[]
    for i in range(53):
        t=round(min(duration,i/60),7)
        source_frame=clamp(t0+t*fps,0,len(frames)-1)
        lo=int(source_frame); hi=min(lo+1,len(frames)-1)
        pa=frame_pose(nodes,names,frames[lo])
        pb=frame_pose(nodes,names,frames[hi])
        blend=source_frame-lo
        p={k:pa[k].lerp(pb[k],blend) for k in pa}
        # Smooth in/out of Kairo's OWN existing guard, avoiding a hard-cut from
        # his game stance to the actor's arbitrary opening pose.
        strength=smooth(t/.11)*smooth((duration-t)/.15)
        hip_delta=tr(p['Hips']-first['Hips'])
        hf,hl,hz=vector_components(hip_delta)
        hip=(clamp(hf*strength,-.075,.08),
             clamp(hl*strength,-.06,.065),
             clamp(hz*strength,-.075,.005))
        hip_t=offset(*hip)
        hips_yaw=clamp(angle_about_up(pelvis_axis0,p['RightUpLeg']-p['LeftUpLeg']),-105,105)*strength
        chest_yaw=clamp(angle_about_up(upper_axis0,p['RightArm']-p['LeftArm']),-120,120)*strength
        actor_torso=horizontal(p['Spine1']-p['Hips'])
        lean=clamp(math.degrees(math.atan2((p['Spine1']-p['Hips']).dot(actor_forward),
                      max(.001,(p['Spine1']-p['Hips']).y)))-
                   math.degrees(math.atan2(torso0.dot(actor_forward),max(.001,torso0.y))),-42,42)*strength
        roll=clamp(math.degrees(math.atan2((p['Spine1']-p['Hips']).dot(actor_side),
                      max(.001,(p['Spine1']-p['Hips']).y)))-
                   math.degrees(math.atan2(torso0.dot(actor_side),max(.001,torso0.y))),-32,32)*strength
        foot_targets={}
        foot_angles={}
        knee_hints={}
        elbow_hints={}
        hand_targets={}
        for side in ('left','right'):
            label=side.capitalize()
            # FK motion relative to the actor's moving pelvis. The raw world
            # trajectory contains metres of performer travel which the
            # in-place Kairo melee root does NOT share.
            foot=tr((p[label+'Foot']-p['Hips'])-
                    (first[label+'Foot']-first['Hips']))+hip_t
            if side=='left':
                # The support leg must not follow the mocap actor's floor
                # drift unboundedly while Kairo's gameplay root stays planted.
                f,l,z=vector_components(foot)
                foot=offset(clamp(f,-.045,.045),clamp(l,-.035,.035),clamp(z,-.006,.018))
            target=heads[side+'Foot']+foot*strength
            if side=='right':
                # Enforce Kairo's actual thigh + shin reach as a kinematic
                # limit. IK should NEVER be asked to extend a non-existent
                # third leg segment when actor proportions differ.
                joint=heads['rightUpperLeg']+hip_t
                length=(heads['rightUpperLeg']-heads['rightLowerLeg']).length + (
                         heads['rightLowerLeg']-heads['rightFoot']).length
                span=target-joint
                if span.length>length*.91:
                    target=joint+span.normalized()*(length*.91)
            foot_targets[side]=target
            toe_now=p[label+'ToeBase']-p[label+'Foot']
            toe_0=first[label+'ToeBase']-first[label+'Foot']
            foot_yaw=clamp(angle_about_up(toe_0,toe_now),-110,110)*strength
            pitch=clamp(math.degrees(math.atan2(toe_now.y,max(.01,horizontal(toe_now).length)))-
                        math.degrees(math.atan2(toe_0.y,max(.01,horizontal(toe_0).length))),-42,45)*strength
            foot_angles[side]=(foot_yaw,pitch,0)
            knee_hints[side]=dir_(p[label+'Leg'],p[label+'UpLeg'])*.75
            elbow_hints[side]=dir_(p[label+'ForeArm'],p[label+'Arm'])*.65
            wrist=tr((p[label+'Hand']-p['Spine1'])-
                     (first[label+'Hand']-first['Spine1']))+hip_t
            # Hands should follow the actor's counterbalancing changes but
            # start/end at the approved Kairo guard positions.
            # Hip displacement is included once in the target's world frame.
            hand_targets[side]=guard[side]+wrist*strength
        result.append(key(t,hand_targets['left'],hand_targets['right'],
            hip=hip,yaw=chest_yaw,hips_yaw=hips_yaw,
            lean=lean,roll=roll,feet=foot_targets,foot_angles=foot_angles,
            knees=knee_hints,elbows=elbow_hints))
    result.append(key(duration,guard['left'],guard['right'],
                      feet={'left':heads['leftFoot'].copy(),
                            'right':heads['rightFoot'].copy()}))
    print('AUTHENTIC_KARATE_RETARGET',name,'fps',round(fps,2),
          'scale',round(scale,5),'actor peak',peak,'keys',len(result))
    return dict(clipId=name,durationSeconds=duration,impactSeconds=contact,
        keys=result,grounded=True,air=False,kickingSide='right',
        explicitFeet=True,supportWindows={
            'left':[(0,.10),(.30,.50),(.82,.87)],
            'right':[(0,.06),(.82,.87)]})

def make_authentic_karate_clips():
    source_dir=os.environ.get('KAIRO_KARATE_BVH_DIR')
    assert source_dir and Path(source_dir).is_dir(), 'Reference BVH source not supplied'
    return [source_mocap_clip(name,file,peak,source_dir) for name,file,peak in CMU_KICKS]
