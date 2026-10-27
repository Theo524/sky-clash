"""Author an isolated Blender jab on the measured, already-posed game rig.

Capture kairo-combat-anchor.json first. Unlike the old T-pose probe this
control armature has the same joint heads, hierarchy, and initial bent limbs
as the actual settled game pose. World-neutral-relative deltas are meaningful
only together with that exact anchor; this is not a production game clip.
"""
import bpy
import hashlib
import json
import math
import pathlib
from mathutils import Quaternion, Vector

ROOT = pathlib.Path.cwd()
OUT = ROOT / "visual-review-output/kairo-combat-foundation"
MODEL = ROOT / "assets/characters/kairo.vrm"
CONTRACT = json.loads((ROOT / "docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json").read_text())
ANCHOR_PATH = OUT / "kairo-combat-anchor.json"
anchor_bytes = ANCHOR_PATH.read_bytes()
anchor = json.loads(anchor_bytes)
sha = hashlib.sha256(MODEL.read_bytes()).hexdigest()
assert anchor["schema"] == "sky-clash.kairo-combat-anchor.v1"
assert sha == anchor["modelSha256"] == CONTRACT["modelSha256"]
assert anchor["rigSignature"] == CONTRACT["rigSignature"]
bones = CONTRACT["bones"]
parents = CONTRACT["parents"]
assert anchor["bones"] == bones and anchor["parents"] == parents
joints = {j["name"]: j for j in anchor["joints"]}
assert set(joints) == set(bones)
# Right-handed model frame (X, Y-up) -> Blender (X, -Z, Y-up).
# VRM0 has a PI facing correction: model +Z is not gameplay forward.
def to_blender(xyz):
    x, y, z = xyz
    return Vector((x, -z, y))
def to_game(v):
    return [float(v.x), float(v.z), float(-v.y)]
heads = {name: to_blender(joints[name]["position"]) for name in bones}

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 60
scene.frame_start = 1
scene.frame_end = 34
rig_data = bpy.data.armatures.new("Kairo_Measured_Game_Jab_Control")
rig = bpy.data.objects.new("Kairo_Measured_Game_Jab_Control", rig_data)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
primary = {
    "hips": "spine", "spine": "chest", "chest": "upperChest",
    "upperChest": "neck", "neck": "head",
    "leftShoulder": "leftUpperArm", "rightShoulder": "rightUpperArm",
    "leftUpperArm": "leftLowerArm", "rightUpperArm": "rightLowerArm",
    "leftLowerArm": "leftHand", "rightLowerArm": "rightHand",
    "leftUpperLeg": "leftLowerLeg", "rightUpperLeg": "rightLowerLeg",
    "leftLowerLeg": "leftFoot", "rightLowerLeg": "rightFoot"
}
for name, parent in zip(bones, parents):
    bone = rig_data.edit_bones.new(name)
    bone.head = heads[name]
    if name in primary:
        bone.tail = heads[primary[name]]
    elif name.endswith("Foot"):
        bone.tail = bone.head + Vector((0, -.11, 0))
    elif name.endswith("Hand"):
        parent_name = parents[bones.index(name)]
        direction = (heads[name] - heads[parent_name]).normalized()
        bone.tail = bone.head + direction * .10
    else:
        bone.tail = bone.head + Vector((0, 0, .10))
    assert (bone.tail - bone.head).length > .001, (name, "Degenerate measured bone")
    if parent:
        bone.parent = rig_data.edit_bones[parent]
        bone.use_connect = (bone.head - bone.parent.tail).length < 1e-6
bpy.ops.object.mode_set(mode="OBJECT")
bpy.context.view_layer.update()
pb = rig.pose.bones
for bone in pb:
    bone.rotation_mode = "QUATERNION"

def evaluate(frame=1):
    scene.frame_set(int(frame), subframe=frame - int(frame))
    bpy.context.view_layer.update()

def position(name):
    return (rig.matrix_world @ pb[name].matrix).translation.copy()

def world_quat(name):
    return (rig.matrix_world @ pb[name].matrix).to_quaternion().normalized()

def empty(name, location):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    obj.location = location
    return obj

# Calibrate each pole to the measured knee/elbow, rather than guessing
# glTF bone roll or accepting Blender's default bend plane.
targets = {}
poles = {}
source_constraints = []
for side in ("left", "right"):
    for kind, upper_name, lower_name, end_name in (
        ("wrist", side + "UpperArm", side + "LowerArm", side + "Hand"),
        ("ankle", side + "UpperLeg", side + "LowerLeg", side + "Foot")
    ):
        a, b, c = (heads[n] for n in (upper_name, lower_name, end_name))
        axis = (c - a).normalized()
        bend = (b - a) - axis * (b - a).dot(axis)
        assert bend.length > .0001, (side, kind, "Measured limb has ambiguous bend")
        pole_pos = b + bend.normalized() * .5
        target = empty("Kairo_" + side + "_" + kind + "_target", c)
        pole = empty("Kairo_" + side + "_" + kind + "_pole", pole_pos)
        ik = pb[lower_name].constraints.new("IK")
        ik.target = target
        ik.pole_target = pole
        ik.chain_count = 2
        ik.iterations = 200
        ik.use_stretch = False
        # Find the pole roll from actual evaluated joint position. A fixed
        # +/-90deg is wrong for imported/native normalized bone roll.
        def error(angle):
            ik.pole_angle = angle
            evaluate()
            return (position(lower_name) - b).length_squared
        candidates = [(-math.pi + 2 * math.pi * n / 72) for n in range(72)]
        best = min(candidates, key=error)
        low, high = best - math.pi / 36, best + math.pi / 36
        for _ in range(22):
            x = low + (high - low) / 3
            y = high - (high - low) / 3
            if error(x) < error(y):
                high = y
            else:
                low = x
        ik.pole_angle = (low + high) / 2
        evaluate()
        assert (position(lower_name) - b).length < .0003, (side, kind, "Pole calibration changed original bend")
        targets[(side, kind)] = target
        poles[(side, kind)] = pole
        source_constraints.append({"side": side, "kind": kind, "poleAngle": ik.pole_angle})
        if kind == "ankle":
            orient = empty("Kairo_" + side + "_sole_orientation", heads[end_name])
            orient.rotation_mode = "QUATERNION"
            orient.rotation_quaternion = world_quat(end_name)
            constraint = pb[end_name].constraints.new("COPY_ROTATION")
            constraint.target = orient
            constraint.target_space = "WORLD"
            constraint.owner_space = "WORLD"
evaluate()
base_positions = {name: position(name) for name in bones}
base_quats = {name: world_quat(name) for name in bones}
base_foot = {side: position(side + "Foot") for side in ("left", "right")}
base_sole = {side: world_quat(side + "Foot") for side in ("left", "right")}
max_initial_position_error = max((base_positions[n] - heads[n]).length for n in bones)
assert max_initial_position_error < .0004, ("IK changed measured starting pose", max_initial_position_error)

# Original wrist-target choreography. Elbows/poles, hips, spine, head and
# the opposite guard are authored together; no game-side Euler overlay.
# Gameplay forward is captured in this exact model frame; never infer it
# from glTF axes. VRM0 facing correction normally makes it model -Z.
assert len(anchor["forward"]) == 3
forward = to_blender(anchor["forward"]).normalized()
assert abs(forward.z) < 1e-5, "Expected grounded horizontal attack direction"
up = Vector((0, 0, 1))
left_shoulder = heads["leftUpperArm"]
right_shoulder = heads["rightUpperArm"]
left_length = (heads["leftUpperArm"] - heads["leftLowerArm"]).length + (heads["leftLowerArm"] - heads["leftHand"]).length
right_length = (heads["rightUpperArm"] - heads["rightLowerArm"]).length + (heads["rightLowerArm"] - heads["rightHand"]).length
left_guard = left_shoulder + Vector((-left_shoulder.x * .28, 0, -.08)) + forward * .17
right_guard = right_shoulder + Vector((-right_shoulder.x * .20, 0, -.07)) + forward * .13
contact = left_shoulder + Vector((-left_shoulder.x * .26, 0, -.025)) + forward * (left_length * .92)
# frame, left target, right target, body-drive multiplier.
keys = [
    (1., heads["leftHand"], heads["rightHand"], 0.),
    (4., heads["leftHand"].lerp(left_guard, .25), heads["rightHand"].lerp(right_guard, .25), -.12),
    (8., heads["leftHand"].lerp(left_guard, .78) + forward * -.025, heads["rightHand"].lerp(right_guard, .78), -.40),
    (11., left_guard + forward * -.045, right_guard, -.60),
    (13., left_guard + forward * .035, right_guard, .10),
    (15.4, contact, right_guard + up * .025, 1.),
    (16.5, contact + forward * -.035, right_guard + up * .025, .82),
    (20., left_guard + forward * .025, right_guard, .22),
    (25., heads["leftHand"].lerp(left_guard, .80), heads["rightHand"].lerp(right_guard, .80), 0.),
    (34., heads["leftHand"], heads["rightHand"], 0.)
]
# A short authored step carries the BODY into range. Root gameplay physics
# remains external: this displacement is a recoverable visual pelvis motion.
# Each tuple is pelvis progress, lead-foot step progress, swing height.
step_keys = {
    1.: (0., 0., 0.), 4.: (0., 0., 0.),
    8.: (.10, .05, .025), 11.: (.50, .65, .05),
    13.: (.90, 1., 0.), 15.4: (1., 1., 0.),
    16.5: (.98, 1., 0.), 20.: (.80, 1., 0.),
    25.: (.42, .50, .05), 34.: (0., 0., 0.)
}
pelvis_advance = .35
pelvis_drop = .18
lead_step_length = .30
lean_weights = {"spine": 3., "chest": 4., "upperChest": 3., "neck": -4., "head": -3.}
# Choose hip drive so the lead shoulder advances along ACTUAL forward.
lead_yaw = 1. if up.cross(left_shoulder - heads["hips"]).dot(forward) > 0 else -1.
body_weights = {"hips": 4., "spine": 2., "chest": 4., "upperChest": 3., "neck": -6., "head": -5.}
for frame, left, right, drive in keys:
    step_progress, foot_progress, swing_height = step_keys[frame]
    pelvis_shift = forward * (pelvis_advance * step_progress) - up * (pelvis_drop * step_progress)
    hips_basis = pb["hips"].bone.matrix_local.to_quaternion().inverted()
    pb["hips"].location = hips_basis @ pelvis_shift
    pb["hips"].keyframe_insert("location", frame=frame)
    lead_target = targets[("left", "ankle")]
    lead_target.location = heads["leftFoot"] + forward * (lead_step_length * foot_progress) + up * swing_height
    lead_target.keyframe_insert("location", frame=frame)
    for side, target_pos in (("left", left), ("right", right)):
        obj = targets[(side, "wrist")]
        # Carry the wrist target with the moving body, plus the small reach
        # from forward ribcage inclination. Do not stretch the arm bones.
        obj.location = target_pos + pelvis_shift + forward * (.06 * step_progress)
        obj.keyframe_insert("location", frame=frame)
    for name, degrees in body_weights.items():
        # Rotation axis expressed in the control bone's measured rest basis.
        axis = pb[name].bone.matrix_local.to_quaternion().inverted() @ up
        yaw = Quaternion(axis, math.radians(degrees * lead_yaw * drive))
        lean_axis = pb[name].bone.matrix_local.to_quaternion().inverted() @ up.cross(forward)
        lean = Quaternion(lean_axis, math.radians(lean_weights.get(name, 0.) * step_progress))
        pb[name].rotation_quaternion = yaw @ lean
        pb[name].keyframe_insert("rotation_quaternion", frame=frame)
for ob in [rig, *targets.values()]:
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type = "AUTO_CLAMPED"
                kp.handle_right_type = "AUTO_CLAMPED"
evaluate(1)
# Baseline taken AFTER constrained evaluation; it has the same measured
# heads as the actual game sample, not the old imported VRM T-pose.
base_quats = {name: world_quat(name) for name in bones}
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "kairo-original-jab-review-only.blend"))
frames = []
max_foot = 0.
max_sole = 0.
max_wrist = 0.
max_foot_displacement = 0.
max_leg_extension = 0.
for frame in sorted([float(i) for i in range(1, 35)] + [15.4]):
    evaluate(frame)
    deltas = []
    for name in bones:
        delta = (world_quat(name) @ base_quats[name].inverted()).normalized()
        deltas.append([float(x) for x in delta])
    feet = {}
    wrists = {}
    for side in ("left", "right"):
        ankle_target = targets[(side, "ankle")].location
        drift = (position(side + "Foot") - ankle_target).length
        displacement = (position(side + "Foot") - base_foot[side]).length
        max_foot_displacement = max(max_foot_displacement, displacement)
        upper = position(side + "UpperLeg")
        lower = position(side + "LowerLeg")
        ankle = position(side + "Foot")
        leg_length = (heads[side + "UpperLeg"] - heads[side + "LowerLeg"]).length + (heads[side + "LowerLeg"] - heads[side + "Foot"]).length
        extension = (ankle - upper).length / leg_length
        max_leg_extension = max(max_leg_extension, extension)
        angle = math.degrees(world_quat(side + "Foot").rotation_difference(base_sole[side]).angle)
        max_foot = max(max_foot, drift)
        max_sole = max(max_sole, angle)
        feet[side] = {"ankleDrift": drift, "soleAngleDegrees": angle,
            "targetGame": to_game(ankle_target), "displacement": displacement,
            "intent": "lead-step-and-recover" if side == "left" else "planted-rear-support",
            "grounded": abs(ankle_target.z - base_foot[side].z) < .002,
            "legExtensionRatio": extension}
        wrist = position(side + "Hand")
        target = targets[(side, "wrist")].location
        residual = (wrist - target).length
        max_wrist = max(max_wrist, residual)
        wrists[side] = {"IKResidual": residual, "world": list(wrist), "target": list(target)}
    frames.append({"frame": frame, "timeSeconds": (frame - 1) / 60,
        "phase": "contact" if abs(frame - 15.4) < 1e-8 else "blocking",
        "deltasWXYZ": deltas, "feet": feet, "wrists": wrists,
        "pelvisOffsetGame": to_game(position("hips") - base_positions["hips"]),
        "jointPositionsGame": {name: to_game(position(name)) for name in bones}})
ident = lambda q: abs(abs(q[0]) - 1) < 1e-5 and all(abs(x) < 1e-5 for x in q[1:])
assert len(frames) == 35
assert all(ident(q) for q in frames[0]["deltasWXYZ"])
assert all(ident(q) for q in frames[-1]["deltasWXYZ"])
assert max_foot < .003, ("Source foot anchors lost", max_foot)
assert max_sole < .15, ("Source sole changed", max_sole)
assert max_wrist < .004, ("Source wrist target unreachable", max_wrist)
assert max_leg_extension < .999, ("Support leg at full extension", max_leg_extension)
assert all((Vector(frames[-1]["jointPositionsGame"][name]) - Vector(to_game(base_positions[name]))).length < .0004 for name in bones), "Full body must return to original stance"
contact_frame = next(x for x in frames if x["phase"] == "contact")
contact_wrist = contact_frame["jointPositionsGame"]["leftHand"]
forward_reach = (Vector(contact_wrist) - Vector(joints["leftUpperArm"]["position"])).dot(Vector(anchor["forward"]).normalized())
assert forward_reach > left_length * .80, ("Jab does not reach forward", forward_reach)
result = {"schema": "sky-clash.kairo-original-jab-dcc-blockout.v1",
    "status": "UNAPPROVED_OFFLINE_CHOREOGRAPHY", "fighter": "kairo_venn",
    "modelSha256": sha, "rigSignature": CONTRACT["rigSignature"],
    "anchorSha256": hashlib.sha256(anchor_bytes).hexdigest(),
    "modelForward": anchor["forward"],
    "sourceSpace": "evaluated-Blender-world-neutral-relative-WXYZ",
    "bones": bones, "parents": parents,
    "blenderVersion": ".".join(map(str, bpy.app.version[:3])),
    "impactSeconds": .24, "durationSeconds": .55, "sourceFrames": 35,
    "poseKeys": [{"frame": k[0], "leftWristTargetGame": to_game(k[1]),
        "rightWristTargetGame": to_game(k[2]), "bodyDrive": k[3]} for k in keys],
    "calibration": {"source": "actual measured game idle; no T-pose", "poleSolves": source_constraints,
        "maxInitialJointPositionError": max_initial_position_error},
    "baselineJointPositionsGame": {name: to_game(base_positions[name]) for name in bones},
    "maxSourceFootDrift": max_foot, "maxSourceSoleDegrees": max_sole,
    "maxSourceFootDisplacement": max_foot_displacement,
    "maxSourceSupportFootDrift": max(x["feet"]["right"]["displacement"] for x in frames),
    "maxSourceLegExtensionRatio": max_leg_extension,
    "pelvisMotion": {"forwardUnits": pelvis_advance, "dropUnits": pelvis_drop,
        "leadFootStepUnits": lead_step_length, "space": "model-relative-recoverable-visual-only"},
    "maxWristIKTargetError": max_wrist, "forwardReachAtContact": forward_reach,
    "samples": frames,
    "limitations": ["Original Blender IK blockout; visual merit NOT approved",
        "Requires exact captured anchor, not an arbitrary new idle phase",
        "No runtime game animation, approved standing or flight assets changed",
        "Contact timing authored; collision and final owner integration require separate checks"]}
(OUT / "blender-original-jab-blockout.json").write_text(json.dumps(result, indent=2) + "\n")
print("PASS CALIBRATED_KAIRO_JAB_BLENDER " + json.dumps({
    "frames": len(frames), "forwardReach": forward_reach,
    "maxFootDrift": max_foot, "maxFootDisplacement": max_foot_displacement,
    "maxLegExtensionRatio": max_leg_extension, "maxWristIKError": max_wrist,
    "baselineError": max_initial_position_error, "artApproved": False}))
