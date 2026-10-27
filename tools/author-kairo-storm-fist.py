"""Storm Fist choreography on the recovered measured Blender/VRM control rig.

Run capture-kairo-combat-anchor.cjs first, then this script in Blender, then
bake-kairo-storm-fist.cjs. Revision 2 reauthors the jab as well as the set.
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
# Asymmetric kung fu ready: lead fist protects the centre, rear fist chambers
# outside the ribs. The rear hand must not travel from behind the torso to a
# mirrored face guard along a straight line through the chest.
guard = {"left": hand("left", .24, .06, -.17),
         "right": hand("right", .13, -.09, -.28)}
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

def key(t, left=None, right=None, hip=(0,0,0), yaw=0, lean=0, roll=0,
        kick=None, ankle=None, wrist=(0,0), follow=(1,1)):
    return dict(t=t, left=left, right=right, hip=hip, yaw=yaw, lean=lean,
                roll=roll, kick=kick, ankle=ankle, wrist=wrist, follow=follow)

def strike(name, duration, impact, side, aim, coil, yaw, hip=(.09,0,-.07),
           lean=4, roll=0, extra=None):
    """Chamber -> outside passage -> full-body strike -> chamber recovery."""
    other = "right" if side == "left" else "left"
    def pose(t, target, y, h, le=0, ro=0, reach=0):
        d={side:target, other:guard[other]}
        twist=(65 if side=="left" else -65)*reach
        follow=(1-reach*.85 if side=="left" else 1,
                1-reach*.85 if side=="right" else 1)
        return key(t, d["left"], d["right"], h, y, le, ro,
                   wrist=(twist if side=="left" else 0,
                          twist if side=="right" else 0),follow=follow)
    contact = aim
    keys=[key(0), key(impact*.32, guard["left"], guard["right"],
                      (-.015,0,-.025)),
          pose(impact*.52, coil, -yaw*.42, (-.025,0,-.045), -2, -roll*.5),
          pose(impact*.78, coil.lerp(contact,.56), yaw*.22,
               (hip[0]*.45, hip[1]*.45, hip[2]*.8), 0,0,.50),
          pose(impact, contact, yaw, hip, lean, roll,1),
          pose(impact+.025, contact-offset(.025), yaw*.92, hip, lean, roll,.92),
          pose(impact+(duration-impact)*.45, guard[side]+offset(.035),
               yaw*.23, (hip[0]*.4,hip[1]*.4,hip[2]*.4),1,0),
          key(duration*.87, guard["left"],guard["right"],(0,0,-.015)),
          key(duration)]
    return dict(clipId=name,durationSeconds=duration,impactSeconds=impact,
                keys=keys,grounded=True) | (extra or {})

clips=[]
clips.append(strike("original-jab",.55,.24,"left",
    hand("left",.585,-.05,-.13),hand("left",.21,.10,-.18),-14,
    hip=(.22,0,-.10),lean=4))
clips.append(strike("original-cross",.55,.24,"right",
    hand("right",.60,.09,-.15),hand("right",.13,-.12,-.31),28,
    hip=(.25,-.015,-.12),lean=5))
clips.append(strike("original-hook",.68,.33,"left",
    hand("left",.38,-.13,-.02),hand("left",.27,.20,-.08),-25,
    hip=(.26,.025,-.14),lean=2,roll=-5))
clips.append(strike("original-overhand",.68,.33,"right",
    hand("right",.44,.06,-.16),hand("right",.22,-.15,.06),30,
    hip=(.28,-.025,-.15),lean=10,roll=7))

def kick_clip(name,duration,impact,style):
    side="right"; start=heads[side+"Foot"]
    # The knee folds before extension and again before the sole returns.
    chamber=heads["hips"]+offset(.20,.045,-.28)
    if style=="rising":
        contact=heads["hips"]+offset(.78,-.055,.18)
        turn=17; lean=-7; roll=-4
    elif style=="round":
        chamber=heads["hips"]+offset(.17,.25,-.34)
        contact=heads["hips"]+offset(.74,-.14,.14)
        turn=47; lean=-8; roll=-9
    else:
        contact=heads["hips"]+offset(.78,0,.09)
        turn=25; lean=-10; roll=-5
    def k(t,foot,h,y=0,le=0,ro=0):
        return key(t,guard["left"]+offset(0,-.025,.025),
            guard["right"]+offset(-.04,.025,-.015),h,y,le,ro,
            kick=side,ankle=foot)
    keys=[key(0), k(impact*.32,start+up*.025,(0,-.035,-.08),-4),
          k(impact*.70,chamber,(.025,-.07,-.10),turn*.35,-2),
          k(impact*.87,chamber.lerp(contact,.28),(.035,-.08,-.08),turn*.6,-3),
          k(impact,contact,(.055,-.08,-.06),turn,lean,roll),
          k(impact+.025,contact-offset(.025),(.055,-.08,-.06),turn,lean,roll),
          k(impact+(duration-impact)*.43,chamber,(.015,-.06,-.08),turn*.35,-2),
          k(duration*.86,start+offset(.025,0,0),(0,-.02,-.05),0),key(duration)]
    return dict(clipId=name,durationSeconds=duration,impactSeconds=impact,
        keys=keys,grounded=True,kickingSide=side)
clips.extend([kick_clip("rising-kick",.87,.41,"rising"),
              kick_clip("roundhouse",.87,.41,"round"),
              kick_clip("side-kick",.87,.41,"side")])

# Air attacks use tucked legs and torso counterbalance; flight itself retains
# its existing owner. Root pursuit/gravity remain the gameplay controller's.
clips.append(strike("sky-uppercut",.57,.29,"right",
    hand("right",.42,.075,.15),hand("right",.16,-.12,-.29),23,
    hip=(.25,0,-.04),lean=-6,extra=dict(grounded=False,air=True)))
clips.append(strike("falling-fist",.81,.53,"right",
    hand("right",.50,.05,-.48),hand("right",.21,-.13,.13),20,
    hip=(.55,0,-.52),lean=40,extra=dict(grounded=False,air=True)))
airkick=kick_clip("sky-kick",.63,.30,"side")
airkick.update(grounded=False,air=True)
clips.append(airkick)
airstrike=strike("air-strike",.87,.41,"left",
    hand("left",.62,-.04,-.10),hand("left",.20,.10,-.18),-21,
    hip=(.08,0,-.025),lean=8,extra=dict(grounded=False,air=True))
clips.append(airstrike)

# Guard is a closed breathing loop with no standing/flight replacement.
clips.append(dict(clipId="guard",durationSeconds=.60,impactSeconds=0,
    loop=True,grounded=True,keys=[
      key(0,guard["left"],guard["right"],(0,0,-.045),0,1),
      key(.30,guard["left"]+up*.009,guard["right"]+up*.007,
          (0,0,-.040),.7,.7),
      key(.60,guard["left"],guard["right"],(0,0,-.045),0,1)]))
clips.append(dict(clipId="parry",durationSeconds=.30,impactSeconds=.075,
    grounded=True,keys=[
      key(0),key(.04,guard["left"],guard["right"],(0,0,-.025)),
      key(.075,hand("left",.32,.16,-.10),guard["right"],
          (-.025,.015,-.045),-10,-2,-3,wrist=(-16,0)),
      key(.13,hand("left",.29,.19,-.08),guard["right"],
          (-.02,.01,-.04),-6,-1,-2),
      key(.23,guard["left"],guard["right"]),key(.30)]))

for name,dur,yaw,lean,roll,shift in [
    ("hit-light",.34,6,-7,0,(-.045,0,-.025)),
    ("hit-heavy",.55,11,-14,-4,(-.095,.025,-.10)),
    ("hit-left",.38,-17,-5,9,(-.035,.045,-.045)),
    ("hit-right",.38,17,-5,-9,(-.035,-.045,-.045))]:
    # Hands react with the torso without flailing; the head lags the impact.
    clips.append(dict(clipId=name,durationSeconds=dur,impactSeconds=.055,
       grounded=True,keys=[key(0,guard["left"],guard["right"]),
         key(.055,guard["left"]+offset(-.025,0,-.025),
             guard["right"]+offset(-.02,0,-.015),shift,yaw,lean,roll),
         key(dur*.43,guard["left"],guard["right"],
             tuple(v*.7 for v in shift),yaw*.65,lean*.7,roll*.65),
         key(dur*.76,guard["left"],guard["right"],(0,0,-.02)),
         key(dur,guard["left"],guard["right"])]))

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
        weights={"hips":.25,"spine":.25,"chest":.28,"upperChest":.22,
                 "neck":-.32,"head":-.40}
        for name,w in weights.items():
            basis=pb[name].bone.matrix_local.to_quaternion().inverted()
            yaw=Quaternion(basis@up,math.radians(k["yaw"]*w))
            lean=Quaternion(basis@lateral,math.radians(k["lean"]*w))
            roll=Quaternion(basis@forward,math.radians(k["roll"]*w))
            pb[name].rotation_quaternion=yaw@lean@roll
            pb[name].keyframe_insert("rotation_quaternion",frame=frame)
        for idx,side in enumerate(("left","right")):
            target=k[side] if k[side] is not None else heads[side+"Hand"]
            evaluate(frame)
            delta=world_quat("upperChest")@base_q["upperChest"].inverted()
            carried=position("upperChest")+delta@(target-base_pos["upperChest"])
            fixed=target+shift
            targets[(side,"wrist")].location=fixed.lerp(carried,k["follow"][idx])
            targets[(side,"wrist")].keyframe_insert("location",frame=frame)
            pronation_keys.append((side,k["t"],k["wrist"][idx]))
            foot=heads[side+"Foot"].copy()
            if clip.get("air") and k["t"]>0 and k["t"]<duration:
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
    # A stationary pole can cross the moving limb axis and suddenly roll a
    # perfectly connected elbow/knee by 100 degrees. Transport the measured
    # bend plane along each target's shortest arc instead. Dense control keys
    # retain the same calibrated rig, target curves and anatomical bend sign.
    for ob in poles.values(): ob.animation_data_clear()
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
                    hint=body_delta@(outward*(.14+.15*reach+clearance)-
                                      forward*(.16-.08*reach)-up*(.34-.08*reach))
                    bend=hint-current_axis*hint.dot(current_axis)
                    if bend.length<.01: bend=outward
                    bend.normalize()
                else:
                    transport=initial_axis.rotation_difference(current_axis)
                    bend=(transport@initial_bend).normalized()
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
    stepping=clip.get("grounded") and clip["clipId"] in {
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
            max_foot=max(max_foot,residual)
            max_wrist=max(max_wrist,(position(side+"Hand")-targets[(side,"wrist")].location).length)
            grounded=abs(foot_goal.z-heads[side+"Foot"].z)<.015
            feet[side]={"grounded":grounded,"ankleDrift":residual,"targetGame":to_game(foot_goal)}
            # Brief support lock at contact allows the real gameplay root to
            # approach before weight settles. Kicks lock only the support side.
            impact=clip["impactSeconds"]
            near=impact-.045<=t<=impact+.12
            if stepping:
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
    assert max_foot<.004,(clip["clipId"],"unreachable ankle",max_foot)
    assert max_wrist<.012,(clip["clipId"],"unreachable wrist",max_wrist)
    results.append({k:v for k,v in clip.items() if k!="keys"}|dict(samples=samples,
        maxSourceFootError=max_foot,maxSourceWristError=max_wrist))
    # Every action remains inspectable/reeditable as a measured Blender rig.
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/("storm-"+clip["clipId"]+".blend")))
    print("AUTHORED",clip["clipId"],len(samples),"foot",max_foot,"wrist",max_wrist)

result=dict(schema="sky-clash.kairo-storm-fist-dcc.v1",modelSha256=sha,
    rigSignature=CONTRACT["rigSignature"],anchorSha256=hashlib.sha256(anchor_bytes).hexdigest(),
    bones=bones,parents=parents,blenderVersion=bpy.app.version_string,revision="kung-fu-v2",
    sourceSpace="evaluated-Blender-world-neutral-relative-WXYZ",clips=results)
(OUT/"blender-storm-fist.json").write_text(json.dumps(result,separators=(",",":"))+"\n")
print("PASS STORM_FIST_BLENDER",len(results),"kung fu moves including reauthored jab")
