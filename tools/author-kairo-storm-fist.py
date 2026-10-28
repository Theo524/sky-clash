"""Storm Fist choreography on the recovered measured Blender/VRM control rig.

Run capture-kairo-combat-anchor.cjs first, then this script in Blender, then
bake-kairo-storm-fist.cjs. Revision 3 authors coordinated distinct full-body combat phrases.
All distances are measured rig units; wrists, knee poles and sole controls
are keyed together. This is authoring data, never a runtime pose generator.
"""
import json
import math
import pathlib

# Reuse the exact calibrated rig builder, including measured pole-angle solves.
# The historical jab stays available for rollback; its rig builder is reused.
foundation = pathlib.Path("tools/author-kairo-original-jab.py").read_text()
exec(compile(foundation.split("# Original wrist-target choreography.")[0],
             "tools/author-kairo-original-jab.py", "exec"), globals())

forward = to_blender(anchor["forward"]).normalized()
up = Vector((0, 0, 1))
lateral = up.cross(forward).normalized()
def offset(f=0, l=0, z=0):
    return forward*f + lateral*l + up*z
def hand(side, f=.19, l=0, z=-.075):
    shoulder = heads[side+"UpperArm"]
    return shoulder + offset(f, l, z)
# Distinct keyed phrases; all poses are evaluated by the recovered Blender rig.
guard = {'left':hand('left',.235,.055,-.12),'right':hand('right',.14,-.10,-.255)}

base_target = {k: ob.location.copy() for k, ob in targets.items()}
base_pole = {k: ob.location.copy() for k, ob in poles.items()}
base_q = {name: world_quat(name) for name in bones}
base_pos = {name: position(name) for name in bones}
sole_controls = {side: bpy.data.objects["Kairo_"+side+"_sole_orientation"]
                 for side in ("left", "right")}

# Wrist controls follow the solved forearms below. Locking their WORLD
# orientation to idle caused 100-176 degree wrist bends in the first set.
wrists = {}
for side in ("left", "right"):
    ob = empty("Storm_"+side+"_wrist_orientation", heads[side+"Hand"])
    ob.rotation_mode = "QUATERNION"
    ob.rotation_quaternion = base_q[side+"Hand"]
    con = pb[side+"Hand"].constraints.new("COPY_ROTATION")
    con.target = ob
    con.target_space = con.owner_space = "WORLD"
    wrists[side] = ob


def key(t,left=None,right=None,hip=(0,0,0),yaw=0,lean=0,roll=0,
        kick=None,ankle=None,wrist=(0,0),follow=(1,1),feet=None,
        foot_angles=None,knees=None,elbows=None,hips_yaw=None,shoulders=(0,0)):
    return dict(t=t,left=left,right=right,hip=hip,yaw=yaw,lean=lean,roll=roll,
        kick=kick,ankle=ankle,wrist=wrist,follow=follow,feet=feet or {},
        foot_angles=foot_angles or {},knees=knees or {},elbows=elbows or {},
        hips_yaw=hips_yaw,shoulders=shoulders)

def punch(t,side,target,hip=(0,0,0),yaw=0,hy=0,lean=0,roll=0,
          pronate=0,follow=1,other=None,feet=None,sole=None,shoulder=0):
    left=target if side=='left' else (other if other is not None else guard['left'])
    right=target if side=='right' else (other if other is not None else guard['right'])
    return key(t,left,right,hip,yaw,lean,roll,
        wrist=(pronate,0) if side=='left' else (0,-pronate),
        follow=(follow,1) if side=='left' else (1,follow),feet=feet,
        foot_angles=sole,hips_yaw=hy,
        shoulders=(shoulder,0) if side=='left' else (0,-shoulder))

def attack(id,duration,impact,keys,air=False,support=None):
    return dict(clipId=id,durationSeconds=duration,impactSeconds=impact,
        keys=keys,grounded=not air,air=air,explicitFeet=True,
        supportWindows=support or ({'left':[(impact-.055,impact+.13)],
            'right':[(0,.065),(impact+.015,duration*.74)]} if not air else {}))

# Each phrase has its own timing and path. The hips turn before the shoulders;
# compression precedes a narrow acceleration window, and the hand overshoots
# before the body unwinds. Root travel is left to the existing game controller.
L=lambda f=.0,l=.0,z=.0: heads['leftFoot']+offset(f,l,z)
R=lambda f=.0,l=.0,z=.0: heads['rightFoot']+offset(f,l,z)
clips=[]
clips.append(attack('original-jab',.55,.24,[
 key(0,guard['left'],guard['right']),
 punch(.055,'left',hand('left',.22,.065,-.13),(-.012,0,-.015),3,4,-1,
       feet={'left':L(.01,0,.022)},sole={'right':(-6,-4,0)}),
 punch(.125,'left',hand('left',.20,.08,-.14),(.008,.006,-.025),1,-7,0,
       feet={'left':L(.035,0,.035)},sole={'right':(-11,-7,0)}),
 punch(.182,'left',hand('left',.36,.035,-.04),(.12,.005,-.08),-7,-12,2,
       pronate=20,follow=.5,feet={'left':L(.04)},shoulder=-3),
 punch(.24,'left',hand('left',.625,-.025,.02),(.22,.008,-.09),-17,-13,4,
       pronate=64,follow=.02,feet={'left':L(.04)},sole={'right':(-14,-10,0)},shoulder=-8),
 punch(.263,'left',hand('left',.625,-.038,.015),(.23,.008,-.09),-20,-14,4,
       pronate=66,follow=.02,feet={'left':L(.04)},sole={'right':(-14,-10,0)},shoulder=-8),
 punch(.315,'left',hand('left',.39,.045,-.04),(.14,.008,-.075),-12,-10,2,
       pronate=27,follow=.5,feet={'left':L(.04)},sole={'right':(-8,-6,0)},shoulder=-2),
 punch(.385,'left',guard['left'],(.018,0,-.025),-3,-2,0,feet={'left':L(.025,0,.014)}),
 key(.43,guard['left'],guard['right'],(0,0,-.012)),key(.55,guard['left'],guard['right'])]))
clips.append(attack('original-cross',.55,.24,[
 key(0,guard['left'],guard['right']),
 punch(.065,'right',hand('right',.12,-.13,-.26),(-.025,.015,-.04),-7,-13,-2,
       sole={'right':(-12,-10,0)}),
 punch(.13,'right',hand('right',.16,-.14,-.22),(.018,.025,-.055),-4,13,-2,
       feet={'left':L(.015,0,.012)},sole={'right':(11,-14,0)}),
 punch(.19,'right',hand('right',.40,-.025,-.02),(.17,.03,-.09),18,29,3,
       pronate=32,follow=.35,sole={'right':(29,-18,1)},shoulder=4),
 punch(.24,'right',hand('right',.65,.065,.03),(.26,.035,-.11),39,29,7,-3,
       pronate=68,follow=.02,sole={'right':(37,-19,1)},shoulder=10),
 punch(.272,'right',hand('right',.64,.085,.02),(.27,.032,-.11),44,30,9,-4,
       pronate=69,follow=.02,sole={'right':(39,-18,1)},shoulder=10),
 punch(.33,'right',hand('right',.34,-.025,-.08),(.16,.025,-.08),26,20,4,-1,
       pronate=25,follow=.65,sole={'right':(24,-12,0)}),
 punch(.405,'right',guard['right'],(.018,.008,-.02),4,6,0,sole={'right':(6,-4,0)}),
 key(.445,guard['left'],guard['right']),key(.55,guard['left'],guard['right'])]))
# Hook: a level elbow leads around the outside, then wraps across the rival;
# the opposite hand stays high rather than mirroring the working arm.
clips.append(attack('original-hook',.68,.33,[
 key(0,guard['left'],guard['right']),
 punch(.085,'left',hand('left',.20,.13,-.13),(-.02,-.008,-.055),12,17,-3,3,
       sole={'right':(9,-6,0)}),
 punch(.17,'left',hand('left',.25,.255,-.015),(.0,-.01,-.06),14,-8,-1,2,
       feet={'left':L(.015,0,.02)},sole={'right':(-8,-8,0)}),
 punch(.255,'left',hand('left',.41,.21,.09),(.14,.012,-.085),-7,-24,2,-3,
       pronate=12,follow=.2,sole={'left':(-12,0,-1),'right':(-18,-12,0)},shoulder=-3),
 punch(.33,'left',hand('left',.49,-.135,.12),(.23,.03,-.11),-39,-28,3,-8,
       pronate=28,follow=.04,sole={'left':(-25,0,-1),'right':(-28,-13,0)},shoulder=-8),
 punch(.365,'left',hand('left',.44,-.19,.08),(.23,.03,-.105),-46,-30,4,-9,
       pronate=30,follow=.15,sole={'left':(-29,0,-1),'right':(-30,-13,0)},shoulder=-8),
 punch(.435,'left',hand('left',.31,-.02,-.07),(.12,.015,-.07),-20,-16,1,-3,
       pronate=12,follow=.75,sole={'left':(-16,0,0),'right':(-17,-8,0)}),
 key(.51,guard['left'],guard['right'],(.01,0,-.025),-3,0,0,hips_yaw=-4),
 key(.57,guard['left'],guard['right']),key(.68,guard['left'],guard['right'])]))
# Overhand: outside elbow rises during a rear-side load; a diagonal hammer
# arc drops through the opponent while the front arm protects the centre.
clips.append(attack('original-overhand',.68,.33,[
 key(0,guard['left'],guard['right']),
 punch(.10,'right',hand('right',.105,-.16,-.22),(-.025,-.005,-.07),-12,-18,-3,-5,
       sole={'right':(-12,-8,0)}),
 punch(.195,'right',hand('right',.22,-.205,.12),(.005,.01,-.045),-2,12,-2,-6,
       follow=.8,sole={'right':(10,-12,0)},shoulder=3),
 punch(.275,'right',hand('right',.46,-.09,.18),(.15,.03,-.09),22,25,5,2,
       pronate=12,follow=.2,sole={'right':(26,-15,0)},shoulder=7),
 punch(.33,'right',hand('right',.59,.09,.07),(.25,.04,-.14),38,28,14,9,
       pronate=38,follow=.03,sole={'right':(34,-18,0)},shoulder=10),
 punch(.38,'right',hand('right',.51,.14,-.08),(.24,.04,-.16),43,30,16,10,
       pronate=40,follow=.12,sole={'right':(36,-16,0)},shoulder=7),
 punch(.455,'right',hand('right',.25,-.06,-.255),(.10,.015,-.08),19,16,6,3,
       pronate=12,sole={'right':(18,-9,0)}),
 key(.53,guard['left'],guard['right'],(0,0,-.018)),key(.68,guard['left'],guard['right'])]))

# Kicks are independent authored phrases in the same control schema.
exec(compile(pathlib.Path('tools/kairo-storm-fist-kicks.py').read_text(),
             'tools/kairo-storm-fist-kicks.py','exec'),globals())
# CMU action retarget is an explicit research-only authoring mode. It never
# loads source motion in the browser or affects the shipped V3 unless baked,
# reviewed and separately merged.
import os
if os.environ.get('KAIRO_KARATE_BVH_DIR'):
    exec(compile(pathlib.Path('tools/retarget-kairo-karate.py').read_text(),
                 'tools/retarget-kairo-karate.py','exec'),globals())
    clips.extend(make_authentic_karate_clips())
else:
    clips.extend(make_storm_kicks())

clips.append(attack('sky-uppercut',.57,.29,[
 key(0,guard['left'],guard['right']),
 punch(.075,'right',hand('right',.10,-.13,-.34),(-.025,.015,-.11),-11,-15,12,-3,
       feet={'left':L(.05,0,.09),'right':R(-.04,0,.12)}),
 punch(.18,'right',hand('right',.24,-.10,-.17),(.025,.025,-.065),1,20,7,0,
       pronate=10,feet={'left':L(.08,0,.16),'right':R(-.10,0,.23)}),
 punch(.25,'right',hand('right',.42,.02,.09),(.07,.03,.015),19,27,-8,3,
       pronate=27,follow=.1,feet={'left':L(.10,0,.25),'right':R(-.13,0,.34)},shoulder=6),
 punch(.29,'right',hand('right',.44,.04,.27),(.08,.03,.04),31,27,-15,4,
       pronate=35,follow=.05,feet={'left':L(.07,0,.30),'right':R(-.14,0,.38)},shoulder=10),
 punch(.34,'right',hand('right',.36,.03,.29),(.08,.02,.045),36,29,-15,4,
       pronate=37,follow=.3,feet={'left':L(.04,0,.34),'right':R(-.16,0,.39)},shoulder=8),
 punch(.395,'right',hand('right',.28,-.14,.04),(.05,.02,.025),23,21,-7,2,
       feet={'left':L(.03,0,.24),'right':R(-.08,0,.26)}),
 punch(.475,'right',guard['right'],(.015,.005,.005),5,7,-2,0,
       feet={'left':L(.01,0,.12),'right':R(-.03,0,.14)}),key(.57,guard['left'],guard['right'])],True))
clips.append(attack('air-strike',.87,.41,[
 key(0,guard['left'],guard['right']),
 punch(.11,'left',hand('left',.18,.10,-.14),(-.025,0,-.04),14,20,-3,3,
       feet={'left':L(.09,0,.30),'right':R(-.15,0,.38)}),
 punch(.26,'left',hand('left',.22,.14,-.06),(.005,0,-.015),11,-15,-2,2,
       feet={'left':L(.13,0,.35),'right':R(-.18,0,.40)}),
 punch(.355,'left',hand('left',.42,.04,-.07),(.045,.005,0),-9,-24,3,-3,
       pronate=28,follow=.3,feet={'left':L(.15,0,.30),'right':R(-.16,0,.37)}),
 punch(.41,'left',hand('left',.64,-.03,-.09),(.07,.01,.005),-30,-25,9,-5,
       pronate=63,follow=.02,feet={'left':L(.10,0,.23),'right':R(-.10,0,.30)},shoulder=-9),
 punch(.45,'left',hand('left',.62,-.05,-.10),(.075,.01,.005),-35,-27,10,-5,
       pronate=65,follow=.08,feet={'left':L(.08,0,.23),'right':R(-.08,0,.29)},shoulder=-9),
 punch(.60,'left',guard['left'],(.015,0,-.015),-4,-6,1,
       feet={'left':L(.04,0,.15),'right':R(-.04,0,.18)}),
 key(.70,guard['left'],guard['right']),key(.87,guard['left'],guard['right'])],True))
clips.append(attack('falling-fist',.81,.53,[
 key(0,guard['left'],guard['right']),
 punch(.12,'right',hand('right',.12,-.16,-.05),(-.015,.01,-.03),-14,-18,-3,-3,
       feet={'left':L(.09,0,.22),'right':R(-.10,0,.34)}),
 punch(.29,'right',hand('right',.20,-.19,.22),(.025,.02,-.03),-4,15,1,2,
       feet={'left':L(.11,0,.26),'right':R(-.08,0,.32)},shoulder=5),
 punch(.445,'right',hand('right',.43,-.04,.04),(.20,.025,-.20),19,28,28,6,
       pronate=20,follow=.2,feet={'left':L(.02,0,.11),'right':R(-.13,0,.20)},shoulder=7),
 punch(.53,'right',hand('right',.57,.08,-.44),(.40,.03,-.44),35,30,47,10,
       pronate=46,follow=.02,feet={'left':L(.02,0,.02),'right':R(-.16,0,.06)},shoulder=10),
 punch(.575,'right',hand('right',.52,.10,-.48),(.37,.025,-.44),39,31,49,10,
       pronate=48,follow=.08,feet={'left':L(.02,0,.01),'right':R(-.14,0,.05)},shoulder=8),
 punch(.67,'right',guard['right'],(.12,.01,-.14),13,16,16,2,
       feet={'left':L(0,0,.025),'right':R(-.02,0,.04)}),
 key(.75,guard['left'],guard['right']),key(.81,guard['left'],guard['right'])],True))

clips.append(dict(clipId='guard',durationSeconds=.6,impactSeconds=0,loop=True,
    grounded=True,explicitFeet=True,supportWindows={'left':[(0,.6)],'right':[(0,.6)]},keys=[
 key(0,guard['left'],guard['right'],(0,.025,-.055),-4,4,0,hips_yaw=3,
     foot_angles={'right':(7,-4,0)}),
 key(.3,guard['left']+offset(-.005,.004,.004),guard['right'],(.003,.025,-.051),-4,3.5,0,
     hips_yaw=3,foot_angles={'right':(7,-4,0)}),
 key(.6,guard['left'],guard['right'],(0,.025,-.055),-4,4,0,hips_yaw=3,
     foot_angles={'right':(7,-4,0)})]))
clips.append(attack('parry',.30,.075,[
 key(0,guard['left'],guard['right'],(0,.025,-.04),-4,2,hips_yaw=3),
 key(.035,hand('left',.23,.10,-.08),guard['right'],(-.015,.035,-.055),-6,1,-2,hips_yaw=-1),
 key(.075,hand('left',.31,.20,-.06),guard['right']+offset(.03,0,.02),
     (-.025,.045,-.055),-17,-2,-5,wrist=(-20,0),hips_yaw=-7),
 key(.125,hand('left',.28,.215,-.07),guard['right']+offset(.045,0,.025),
     (-.01,.035,-.045),-13,-1,-3,wrist=(-15,0),hips_yaw=-8),
 key(.205,guard['left'],guard['right'],(.012,.02,-.03),2,2,0,hips_yaw=-2),
 key(.30,guard['left'],guard['right'])],support={'left':[(0,.30)],'right':[(0,.30)]}))

for name,dur,direction in [('hit-light',.34,0),('hit-heavy',.55,0),
                          ('hit-left',.38,1),('hit-right',.38,-1)]:
    heavy=name=='hit-heavy';d=direction;force=1.65 if heavy else 1
    # The pelvis yields first, chest follows, head counter-rotates. Then the
    # weight catches over a flexed leg and the guard re-forms without flailing.
    clips.append(attack(name,dur,.055,[
      key(0,guard['left'],guard['right']),
      key(.025,guard['left']+offset(-.012,0,.01),guard['right'],
          (-.018*force,d*.012,-.02*force),d*3,2,0,hips_yaw=d*7),
      key(.055,guard['left']+offset(-.03,d*.01,-.01),
          guard['right']+offset(-.025,0,-.015),(-.04*force,d*.025,-.04*force),
          8+d*13,-9*force,d*10,hips_yaw=-3+d*4),
      key(dur*.37,guard['left']+offset(-.02,0,-.015),guard['right'],
          (-.035*force,d*.03,-.055*force),10+d*17,-11*force,d*12,hips_yaw=1+d*6),
      key(dur*.65,guard['left'],guard['right'],(-.01,d*.01,-.035),d*5,-2,d*3,hips_yaw=d*3),
      key(dur,guard['left'],guard['right'])],support={'left':[(0,dur)],'right':[(0,dur)]}))

# Compact authored opponent recoils retain the same native owner during
# genuine launch/spike physics; they replace legacy flailing only in v3.
clips.append(attack('launch-recoil',.65,.07,[
 key(0,guard['left'],guard['right']),
 key(.07,guard['left']+offset(-.04,.025,.045),guard['right']+offset(-.025,-.02,.06),
     (-.035,0,-.025),9,-24,-4,hips_yaw=-3,
     feet={'left':L(.06,.025,.18),'right':R(-.06,-.025,.22)}),
 key(.19,guard['left']+offset(-.03,.035,.025),guard['right']+offset(-.035,-.02,.045),
     (-.045,.005,-.015),13,-34,-7,hips_yaw=2,
     feet={'left':L(.13,.03,.38),'right':R(-.09,-.03,.45)},
     foot_angles={'left':(-8,16,0),'right':(12,23,0)}),
 key(.39,guard['left'],guard['right']+offset(-.02,0,.02),(-.02,0,0),7,-20,-4,hips_yaw=1,
     feet={'left':L(.10,.025,.32),'right':R(-.06,-.025,.38)},
     foot_angles={'left':(-5,12,0),'right':(8,17,0)}),
 key(.65,guard['left'],guard['right'],(0,0,0),2,-9,-1,hips_yaw=0,
     feet={'left':L(.06,0,.22),'right':R(-.04,0,.28)})],True))
clips.append(attack('spike-recoil',.6,.06,[
 key(0,guard['left'],guard['right'],(-.01,0,-.01),5,-14,hips_yaw=1,
     feet={'left':L(.08,0,.25),'right':R(-.05,0,.32)}),
 key(.06,guard['left']+offset(-.05,.015,.08),guard['right']+offset(-.03,-.02,.10),
     (.025,0,-.05),-8,30,7,hips_yaw=3,
     feet={'left':L(-.03,0,.24),'right':R(-.13,-.02,.35)},
     foot_angles={'left':(-8,22,0),'right':(12,30,0)}),
 key(.18,guard['left']+offset(-.02,.025,.07),guard['right']+offset(-.02,-.02,.08),
     (.04,0,-.045),-13,40,9,hips_yaw=-2,
     feet={'left':L(-.08,.02,.26),'right':R(-.17,-.025,.39)},
     foot_angles={'left':(-6,28,0),'right':(15,34,0)}),
 key(.37,guard['left'],guard['right']+offset(-.01,0,.025),(.02,0,-.025),-6,26,4,hips_yaw=0,
     feet={'left':L(-.04,0,.21),'right':R(-.12,0,.30)}),
 key(.6,guard['left'],guard['right'],(0,0,-.01),0,14,0,hips_yaw=0,
     feet={'left':L(0,0,.12),'right':R(-.06,0,.20)})],True))

all_objects=[rig,*targets.values(),*poles.values(),*sole_controls.values(),*wrists.values()]
results=[]
for clip in clips:
    # Shared compact guard endpoints connect whole combinations without
    # dropping both fists between beats. V81 restores the unchanged standing
    # pose when combat actually ends. Revision 2 includes the revised jab.
    if not clip["clipId"].startswith("hit-"):
        for k in clip["keys"]:
            for side in ("left","right"):
                if k[side] is None: k[side]=guard[side]
    if clip['clipId'] in {'original-jab','original-cross','original-hook','original-overhand'}:
        # A recoverable step is authored with the hip drive. The old shallow
        # torso-only reach left a visible gap despite a registered hit.
        for k in clip['keys']:
            drive=max(0,k['hip'][0])
            for side,ratio in [('left',.60),('right',.45)]:
                point=k['feet'].get(side,heads[side+'Foot']).copy()
                point+=offset(drive*ratio,0,.018*min(1,drive/.2) if side=='right' else 0)
                k['feet'][side]=point
    for ob in all_objects:
        ob.animation_data_clear()
    for bone in pb:
        bone.rotation_quaternion=Quaternion()
        bone.location=(0,0,0)
    for k,ob in targets.items(): ob.location=base_target[k]
    for k,ob in poles.items(): ob.location=base_pole[k]
    for side in ("left","right"):
        sole_controls[side].rotation_quaternion=base_sole[side]
        wrists[side].rotation_quaternion=base_q[side+"Hand"]
    duration=clip["durationSeconds"]
    pronation_keys=[]
    for k in clip["keys"]:
        frame=1+k["t"]*60
        shift=offset(*k["hip"])
        pb["hips"].location=pb["hips"].bone.matrix_local.to_quaternion().inverted()@shift
        pb["hips"].keyframe_insert("location",frame=frame)
        pelvis_yaw=k['hips_yaw'] if k['hips_yaw'] is not None else k['yaw']*.4
        residual_yaw=k['yaw']-pelvis_yaw
        weights={"hips":.22,"spine":.20,"chest":.32,"upperChest":.26,
                 "neck":-.24,"head":-.32}
        yaw_angles={"hips":pelvis_yaw,"spine":residual_yaw*.28,
            "chest":residual_yaw*.38,"upperChest":residual_yaw*.34,
            "neck":-k['yaw']*.22,"head":-k['yaw']*.30}
        for name,w in weights.items():
            basis=pb[name].bone.matrix_local.to_quaternion().inverted()
            yaw=Quaternion(basis@up,math.radians(yaw_angles[name]))
            lean=Quaternion(basis@lateral,math.radians(k["lean"]*w))
            roll=Quaternion(basis@forward,math.radians(k["roll"]*w))
            pb[name].rotation_quaternion=yaw@lean@roll
            pb[name].keyframe_insert("rotation_quaternion",frame=frame)
        for idx,side in enumerate(("left","right")):
            basis=pb[side+'Shoulder'].bone.matrix_local.to_quaternion().inverted()
            pb[side+'Shoulder'].rotation_quaternion=Quaternion(basis@up,
                math.radians(k['shoulders'][idx]))
            pb[side+'Shoulder'].keyframe_insert('rotation_quaternion',frame=frame)
            target=k[side] if k[side] is not None else heads[side+"Hand"]
            evaluate(frame)
            delta=world_quat("upperChest")@base_q["upperChest"].inverted()
            carried=position("upperChest")+delta@(target-base_pos["upperChest"])
            fixed=target+shift
            targets[(side,"wrist")].location=fixed.lerp(carried,k["follow"][idx])
            targets[(side,"wrist")].keyframe_insert("location",frame=frame)
            pronation_keys.append((side,k["t"],k["wrist"][idx]))
            angles=k['foot_angles'].get(side,(0,0,0))
            sole_controls[side].rotation_quaternion=(
                Quaternion(up,math.radians(angles[0]))@
                Quaternion(lateral,math.radians(angles[1]))@
                Quaternion(forward,math.radians(angles[2]))@base_sole[side])
            sole_controls[side].keyframe_insert('rotation_quaternion',frame=frame)
            foot=k['feet'].get(side,heads[side+'Foot']).copy()
            if clip.get("air") and not clip.get('explicitFeet') and k["t"]>0 and k["t"]<duration:
                # A compact rear-leg fold, with relaxed pointed shoe.
                strength=math.sin(math.pi*k["t"]/duration)
                foot+=offset(-.09 if side=="right" else .03,0,.22*strength)
            if k["kick"]==side:
                foot=k["ankle"]
                poles[(side,"ankle")].location=heads[side+"UpperLeg"]+offset(.65,.12,.03)
            else:
                poles[(side,"ankle")].location=base_pole[(side,"ankle")]
            poles[(side,"ankle")].keyframe_insert("location",frame=frame)
            targets[(side,"ankle")].location=foot
            targets[(side,"ankle")].keyframe_insert("location",frame=frame)
            # Elbow poles retain the calibrated plane, carried gently with ribs.
            poles[(side,"wrist")].location=base_pole[(side,"wrist")]+shift*.5
            poles[(side,"wrist")].keyframe_insert("location",frame=frame)
    for ob in all_objects:
        if ob.animation_data and ob.animation_data.action:
            for fc in ob.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation="BEZIER"
                    kp.handle_left_type=kp.handle_right_type="AUTO_CLAMPED"
    times=sorted(set([round(n/60,9) for n in range(math.ceil(duration*60))]+
                     [duration,clip["impactSeconds"]]))
    def pronation_at(side,t):
        points=[(kt,angle) for s,kt,angle in pronation_keys if s==side]
        hi=next((i for i,(kt,_) in enumerate(points) if kt>=t),len(points)-1)
        lo=max(0,hi-1);ta,aa=points[lo];tb,ab=points[hi]
        ratio=max(0,min(1,(t-ta)/max(1e-9,tb-ta)))
        return aa+(ab-aa)*ratio
    def hint_at(field,side,t):
        points=clip['keys']; hi=next((i for i,k in enumerate(points) if k['t']>=t),len(points)-1)
        lo=max(0,hi-1);aa,bb=points[lo],points[hi]
        av,bv=aa[field].get(side),bb[field].get(side)
        if av is None and bv is None: return None
        if av is None: av=bv
        if bv is None: bv=av
        w=max(0,min(1,(t-aa['t'])/max(1e-9,bb['t']-aa['t'])))
        return av.lerp(bv,w*w*(3-2*w))
    # A stationary pole can cross the moving limb axis and suddenly roll a
    # perfectly connected elbow/knee by 100 degrees. Transport the measured
    # bend plane along each target's shortest arc instead. Dense control keys
    # retain the same calibrated rig, target curves and anatomical bend sign.
    for ob in poles.values(): ob.animation_data_clear()
    pole_planes={}
    for t in times:
        frame=1+t*60
        evaluate(frame)
        for side in ("left","right"):
            for kind,upper,lower,end in (
                ("wrist",side+"UpperArm",side+"LowerArm",side+"Hand"),
                ("ankle",side+"UpperLeg",side+"LowerLeg",side+"Foot")):
                initial_axis=(heads[end]-heads[upper]).normalized()
                initial_bend=heads[lower]-heads[upper]
                initial_bend-=initial_axis*initial_bend.dot(initial_axis)
                a=position(upper)
                c=targets[(side,kind)].location.copy()
                current_axis=(c-a).normalized()
                if kind=="wrist":
                    # Measured anatomical elbow outside its own ribs. Carry
                    # the bend hint with the torso; never choose a medial
                    # elbow solely from the shortest wrist-axis rotation.
                    body_delta=world_quat("upperChest")@base_q["upperChest"].inverted()
                    outward=lateral*(1 if side=="left" else -1)
                    reach=min(1,abs(pronation_at(side,t))/65)
                    clearance=.10*reach if clip["clipId"]=="falling-fist" else 0
                    hint=hint_at('elbows',side,t)
                    if hint is None:
                        hint=body_delta@(outward*(.14+.15*reach+clearance)-
                                          forward*(.16-.08*reach)-up*(.34-.08*reach))
                    else:
                        hint=body_delta@hint
                    bend=hint-current_axis*hint.dot(current_axis)
                    if bend.length<.01: bend=outward
                    bend.normalize()
                else:
                    previous_axis,previous_bend=pole_planes.get((side,kind),
                        (initial_axis,initial_bend.normalized()))
                    transported=previous_axis.rotation_difference(current_axis)@previous_bend
                    transported-=current_axis*transported.dot(current_axis)
                    transported.normalize()
                    hint=hint_at('knees',side,t)
                    if hint is None:
                        # Closed, non-kicking foot paths retain their measured
                        # initial bend reference, avoiding parallel-transport
                        # drift on a complete pelvis/foot loop.
                        bend=(initial_axis.rotation_difference(current_axis)@initial_bend).normalized()
                    else:
                        projected=hint-current_axis*hint.dot(current_axis)
                        strength=projected.length/max(.001,hint.length)
                        if projected.length<1e-6:
                            bend=transported
                        else:
                            projected.normalize()
                            # A pole hint crossing the straight leg axis has
                            # two equivalent signs. Preserve the continuous
                            # anatomical bend hemisphere, rather than rolling
                            # the thigh and shoe through 180 degrees.
                            if projected.dot(transported)<0: projected.negate()
                            weight=min(1,strength/.22)
                            weight=weight*weight*(3-2*weight)
                            bend=transported.lerp(projected,weight).normalized()
                    pole_planes[(side,kind)]=(current_axis.copy(),bend.copy())
                pole=poles[(side,kind)]
                pole.location=a+(c-a)*.45+bend*.60
                pole.keyframe_insert("location",frame=frame)
    for ob in poles.values():
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation="LINEAR"
    # Straight wrists follow the solved forearm orientation, with authored
    # pronation around the long axis. V81 retains its existing finger grip.
    for ob in wrists.values(): ob.animation_data_clear()
    for t in times:
        frame=1+t*60;evaluate(frame)
        for side in ("left","right"):
            angle=math.radians(pronation_at(side,t))
            q=world_quat(side+"LowerArm")@base_q[side+"LowerArm"].inverted()@base_q[side+"Hand"]
            direction=(position(side+"Hand")-position(side+"LowerArm")).normalized()
            wrists[side].rotation_quaternion=Quaternion(direction,angle)@q
            wrists[side].keyframe_insert("rotation_quaternion",frame=frame)
    for ob in wrists.values():
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation="LINEAR"
    # Author a traveling lead step and rear-foot exchange around the existing
    # physical approach. The gameplay root carries each lifted foot; adding
    # another forward model offset would double the stride. Explicit plant
    # windows below prevent a moving shoe from masquerading as support.
    stepping=not clip.get('explicitFeet') and clip.get("grounded") and clip["clipId"] in {
        "original-jab","original-cross","original-hook","original-overhand",
        "rising-kick","roundhouse","side-kick"}
    def step_lift(t,side):
        impact=clip["impactSeconds"]
        if clip.get("kickingSide"):
            recover_start,recover_end=(duration*.88,duration*.99)
        else:
            recover_start,recover_end=((duration*.78,duration*.98) if side=="left"
                                      else (duration*.68,duration*.91))
        recovery=(t-recover_start)/max(.001,recover_end-recover_start)
        if side!=clip.get("kickingSide") and 0<recovery<1:
            return .055*math.sin(math.pi*recovery)**2
        if side=="left":
            start,end=(0.,impact*.78)
        elif clip.get("kickingSide"):
            return 0.
        else:
            start,end=(impact*.30,impact+.055)
        phase=(t-start)/max(.001,end-start)
        return .095*math.sin(math.pi*phase)**2 if 0<phase<1 else 0.
    if stepping:
        # Cache the existing ankle curve before replacing it with dense keys.
        foot_curves={side:[] for side in ("left","right")}
        for t in times:
            evaluate(1+t*60)
            for side in foot_curves:
                foot_curves[side].append(targets[(side,"ankle")].location.copy())
        for side,points in foot_curves.items():
            ob=targets[(side,"ankle")];ob.animation_data_clear()
            for t,point in zip(times,points):
                ob.location=point+up*step_lift(t,side)
                ob.keyframe_insert("location",frame=1+t*60)
            for fc in ob.animation_data.action.fcurves:
                for kp in fc.keyframe_points: kp.interpolation="LINEAR"
    scene.frame_end=math.ceil(1+duration*60)
    evaluate(1)
    # World deltas must always use the MEASURED standing basis, including guard.
    samples=[]; max_foot=0.; max_wrist=0.
    for t in times:
        evaluate(1+t*60)
        deltas=[list((world_quat(n)@base_q[n].inverted()).normalized()) for n in bones]
        feet={}; support={}
        for side in ("left","right"):
            foot=position(side+"Foot")
            foot_goal=targets[(side,"ankle")].location
            residual=(foot-foot_goal).length
            if residual>max_foot: worst_foot=(clip['clipId'],side,round(t,4),round(residual,5))
            max_foot=max(max_foot,residual)
            max_wrist=max(max_wrist,(position(side+"Hand")-targets[(side,"wrist")].location).length)
            grounded=abs(foot_goal.z-heads[side+"Foot"].z)<.015
            feet[side]={"grounded":grounded,"ankleDrift":residual,"targetGame":to_game(foot_goal)}
            # Brief support lock at contact allows the real gameplay root to
            # approach before weight settles. Kicks lock only the support side.
            impact=clip["impactSeconds"]
            near=impact-.045<=t<=impact+.12
            if clip.get('explicitFeet'):
                support[side]=any(start-1e-8<=t<=end+1e-8 for start,end in
                    clip.get('supportWindows',{}).get(side,[]))
            elif stepping:
                plant=(t>=impact*.78 if side=="left" else
                       t<=impact*.27 or (not clip.get("kickingSide") and t>=impact+.055))
                if clip.get("kickingSide"):
                    if side=="right": plant=t<=impact*.27 or t>=duration*.86
                    elif duration*.88<t<duration*.99: plant=False
                elif side=="left" and duration*.78<t<duration*.98:
                    plant=False
                elif side=="right" and duration*.68<t<duration*.91:
                    plant=False
                support[side]=bool(grounded and plant)
            else:
                support[side]=bool(clip.get("grounded") and grounded and
                                   (clip["clipId"]=="guard" or near))
        samples.append(dict(timeSeconds=t,deltasWXYZ=deltas,
            jointPositionsGame={n:to_game(position(n)) for n in bones},
            pelvisOffsetGame=to_game(position("hips")-base_pos["hips"]),
            feet=feet,support=support))
    assert max_foot<.004,(clip["clipId"],"unreachable ankle",max_foot,worst_foot)
    assert max_wrist<.012,(clip["clipId"],"unreachable wrist",max_wrist)
    results.append({k:v for k,v in clip.items() if k!="keys"}|dict(samples=samples,
        maxSourceFootError=max_foot,maxSourceWristError=max_wrist))
    # Every action remains inspectable/reeditable as a measured Blender rig.
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/("storm-"+clip["clipId"]+".blend")))
    print("AUTHORED",clip["clipId"],len(samples),"foot",max_foot,"wrist",max_wrist)

result=dict(schema="sky-clash.kairo-storm-fist-dcc.v1",modelSha256=sha,
    rigSignature=CONTRACT["rigSignature"],anchorSha256=hashlib.sha256(anchor_bytes).hexdigest(),
    bones=bones,parents=parents,blenderVersion=bpy.app.version_string,revision="storm-fist-v3",
    sourceSpace="evaluated-Blender-world-neutral-relative-WXYZ",clips=results)
(OUT/"blender-storm-fist.json").write_text(json.dumps(result,separators=(",",":"))+"\n")
print("PASS STORM_FIST_BLENDER",len(results),"kung fu moves including reauthored jab")
