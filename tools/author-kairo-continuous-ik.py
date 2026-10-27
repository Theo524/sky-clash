"""Offline full-duration foot IK bake on the actual imported Kairo armature.
Reads the Blender scene produced by author-kairo-foot-ik.py; does NOT
create or deploy a gameplay clip, change Kairo's idle, or replace his model.
Exports 25 source frames at 60 Hz over an ORIGINAL 0.4s calibration turn.
"""
import bpy, json, math, pathlib, hashlib
from mathutils import Quaternion, Vector

ROOT=pathlib.Path.cwd()
OUT=ROOT/"visual-review-output/kairo-combat-foundation"
MODEL=ROOT/"assets/characters/kairo.vrm"
MANIFEST=json.loads((ROOT/"docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json").read_text())
SHA=hashlib.sha256(MODEL.read_bytes()).hexdigest()
assert SHA==MANIFEST["modelSha256"]
prior=json.loads((OUT/"blender-foot-ik-source.json").read_text())
assert prior["modelSha256"]==SHA and prior["rigSignature"]==MANIFEST["rigSignature"]
assert prior["status"]=="SOURCE_IK_ONLY_TARGET_RUNTIME_UNVERIFIED"

# This is the constrained Blender control rig already fitted to Kairo's
# true thigh/knee/ankle JOINT HEAD locations by the preceding CI step.
bpy.ops.wm.open_mainfile(filepath=str(OUT/"kairo-ik-foot-lock-test-only.blend"))
scene=bpy.context.scene
rig=bpy.data.objects.get("SKY_KAIRO_IK_ONLY_CONTROL")
assert rig is not None and rig.type=="ARMATURE"
assert bpy.data.objects.get("Armature") is not None, "Original Kairo GLB must remain loaded"
assert scene.render.fps==60
bones=MANIFEST["bones"]
mapped={
 "hips":"IK_PELVIS",
 "leftUpperLeg":"left_THIGH","leftLowerLeg":"left_SHIN","leftFoot":"left_SOLE",
 "rightUpperLeg":"right_THIGH","rightLowerLeg":"right_SHIN","rightFoot":"right_SOLE"
}
for name in mapped.values():
    assert name in rig.pose.bones
scene.frame_set(1)
bpy.context.view_layer.update()
pose=rig.pose.bones
worldMatrix=lambda name: rig.matrix_world @ pose[name].matrix
worldHead=lambda name: rig.matrix_world @ pose[name].head
worldTail=lambda name: rig.matrix_world @ pose[name].tail
reference={bone:worldMatrix(mapping).to_quaternion().normalized()
           for bone,mapping in mapped.items()}
foots={side:worldTail(side+"_SHIN").copy() for side in ("left","right")}
soles={side:worldMatrix(side+"_SOLE").to_quaternion().normalized()
       for side in ("left","right")}
source_frames=[]
worstAnkle=0.
worstSole=0.
maxKneeStep=0.
minBendDirectionDot=1.
prevKnees=None
baselineKneeSide={}
def knee_bend(side):
    hip=worldHead(side+"_THIGH")
    knee=worldHead(side+"_SHIN")
    ankle=worldTail(side+"_SHIN")
    ab=ankle-hip
    ratio=(knee-hip).dot(ab)/max(ab.length_squared,1.e-12)
    deviation=knee-(hip+ab*ratio)
    return deviation,hip,knee,ankle
for side in ("left","right"):
    bend,*_=knee_bend(side)
    baselineKneeSide[side]=bend.normalized() if bend.length>1.e-5 else None
for frame in range(1,26):
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    angle=(pose["IK_PELVIS"].rotation_quaternion).angle
    quat=[]
    for bone in bones:
        if bone in mapped:
            q=worldMatrix(mapped[bone]).to_quaternion().normalized()
            delta=(q @ reference[bone].inverted()).normalized()
        elif bone=="spine":
            # Use the same chest counter-rotation as the nine-sample source,
            # interpolated from the actual authored hip keyframes.
            pelvisWorld=worldMatrix("IK_PELVIS").to_quaternion().normalized()
            hBase=reference["hips"]
            phi=math.degrees((pelvisWorld @ hBase.inverted()).angle)
            # The source author curve is positive 0..6 degrees.
            delta=Quaternion(Vector((0,0,1)),math.radians(-.35*phi))
        else:
            delta=Quaternion((1,0,0,0))
        quat.append([float(v) for v in delta])
    locks={}
    kneeState={}
    for side in ("left","right"):
        foot=worldTail(side+"_SHIN")
        err=(foot-foots[side]).length
        sole=worldMatrix(side+"_SOLE").to_quaternion().normalized()
        soleErr=math.degrees(sole.rotation_difference(soles[side]).angle)
        bend,hip,knee,ankle=knee_bend(side)
        d=baselineKneeSide[side]
        dot=float(bend.normalized().dot(d)) if d and bend.length>1.e-5 else None
        if dot is not None:minBendDirectionDot=min(minBendDirectionDot,dot)
        worstAnkle=max(worstAnkle,err)
        worstSole=max(worstSole,soleErr)
        locks[side]={"footPositionWorld":list(foot),"ankleError":err,
         "soleOrientationErrorDegrees":soleErr}
        kneeState[side]={"kneeWorld":list(knee),"hipWorld":list(hip),
         "ankleWorld":list(ankle),"kneeBendDirectionDot":dot}
    if prevKnees is not None:
        maxKneeStep=max(maxKneeStep,max(
           (Vector(kneeState[side]["kneeWorld"])-
            Vector(prevKnees[side]["kneeWorld"])).length for side in ("left","right")))
    prevKnees=kneeState
    source_frames.append({"frame":frame,"timeSeconds":(frame-1)/60,
        "deltasWXYZ":quat,"sourceIK":locks,"sourceKnee":kneeState})
# Hard source bounds must not be diluted merely to get a CI pass.
assert len(source_frames)==25
assert worstAnkle<.0025,("Source ankle target lost",worstAnkle)
assert worstSole<.15,("Source shoe twisted",worstSole)
assert maxKneeStep<.08,("Blender source knee position snapped",maxKneeStep)
assert minBendDirectionDot>.5,("Source knee bend reversed",minBendDirectionDot)
identity=lambda q: abs(abs(q[0])-1)<.00001 and all(abs(v)<.00001 for v in q[1:])
assert all(identity(q) for q in source_frames[0]["deltasWXYZ"]), "Neutral start changed"
assert all(identity(q) for q in source_frames[-1]["deltasWXYZ"]), "Neutral recovery changed"
payload={
 "schema":"sky-clash.kairo-blender-continuous-ik-source.v1",
 "status":"TEST_ONLY_SOURCE_IK_BAKE",
 "modelSha256":SHA,
 "rigSignature":MANIFEST["rigSignature"],
 "blenderVersion":".".join(str(x) for x in bpy.app.version[:3]),
 "sourceFps":60,
 "durationSeconds":.4,
 "sourceSpace":"evaluated-Blender-control-rig-world-frame1-relative-WXYZ",
 "bones":bones,"parents":MANIFEST["parents"],
 "sourceBoneNames":prior["sourceBoneNames"],
 "frameCount":25,
 "sourceMaxAnkleError":worstAnkle,
 "sourceMaxSoleErrorDegrees":worstSole,
 "sourceMaxKneeStep":maxKneeStep,
 "sourceMinKneeDirectionDot":minBendDirectionDot,
 "samples":source_frames,
 "limitations":[
   "Control rig calibrated to real VRM joint heads; this is NOT a jab",
   "Offline IK nine-key authoring sampled at 25 frames; no production motion capture",
   "No Blender pelvis offset is transferred to gameplay",
   "A continuous game rendering pass with real Fighter.animate, movement and collision is still required",
   "Knee bending direction on the target skeleton must be validated independently"
 ]
}
(OUT/"blender-continuous-foot-ik-source.json").write_text(json.dumps(payload,indent=2)+"\n")
print("PASS KAIRO_BLENDER_CONTINUOUS_IK_SOURCE "+json.dumps({
 "frames":25,"sourceFps":60,"ankleMax":worstAnkle,"soleMax":worstSole,
 "sourceKneeStepMax":maxKneeStep,"sourceKneeBendDotMin":minBendDirectionDot
}))
