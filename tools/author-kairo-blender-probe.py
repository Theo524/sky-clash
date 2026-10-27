"""Offline Blender import/author/export proof on the SAME real Kairo VRM0.
Test-only minimal left-upper-arm probe (NOT a jab or authored combat move).
Uses built-in Blender glTF import. No game, model, mesh or VRM is overwritten.
Usage: blender -b --factory-startup --python tools/author-kairo-blender-probe.py
"""
import bpy, math, json, pathlib, hashlib, struct, shutil, tempfile
from mathutils import Quaternion, Vector
ROOT=pathlib.Path.cwd()
SOURCE=ROOT/"assets/characters/kairo.vrm"
OUT=ROOT/"visual-review-output/kairo-combat-foundation"
OUT.mkdir(parents=True,exist_ok=True)
SHA=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert SHA=="775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72"
MAGIC,version,length=struct.unpack("<III",SOURCE.read_bytes()[:12])
assert MAGIC==0x46546c67 and version==2 and length==SOURCE.stat().st_size,\
    "Real Kairo VRM0 must be a valid glTF binary (GLB version 2)"
data=SOURCE.read_bytes()
jsonlen,jsonkind=struct.unpack("<II",data[12:20])
assert jsonkind==0x4E4F534A
glb=json.loads(data[20:20+jsonlen].decode("utf-8"))
vrm=glb.get("extensions",{}).get("VRM",{})
human=vrm.get("humanoid",{}).get("humanBones",[])
boneToNode={x["bone"]:x["node"] for x in human}
assert len(boneToNode)>=20
rawName=glb["nodes"][boneToNode["leftUpperArm"]]["name"]
assert rawName=="J_Bip_L_UpperArm",f"Unexpected source humanoid mapping: {rawName}"
# Blender's built-in glTF importer expects .glb, not the VRM file extension.
# A temporary byte-identical filename suffices; the source is never modified.
with tempfile.TemporaryDirectory(prefix="kairo-vrm-gltf-") as tmp:
    temp=pathlib.Path(tmp)/"kairo.glb"
    shutil.copyfile(SOURCE,temp)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(temp))
    rigs=[ob for ob in bpy.data.objects if ob.type=="ARMATURE" and rawName in ob.pose.bones]
    assert len(rigs)==1,(
      f"Expected exactly one original armature with {rawName}; candidates: "+
      str([(o.name,len(o.pose.bones)) for o in bpy.data.objects if o.type=='ARMATURE']))
    rig=rigs[0]
    pb=rig.pose.bones[rawName]
    # Strict source-binding; do not silently retarget by mirrored or approximate name.
    source20=["hips","spine","chest","upperChest","neck","head",
      "leftShoulder","leftUpperArm","leftLowerArm","leftHand",
      "rightShoulder","rightUpperArm","rightLowerArm","rightHand",
      "leftUpperLeg","leftLowerLeg","leftFoot",
      "rightUpperLeg","rightLowerLeg","rightFoot"]
    originalNames=[glb["nodes"][boneToNode[b]]["name"] for b in source20]
    missing=[name for name in originalNames if name not in rig.pose.bones]
    assert not missing,f"Not an import of Kairo's actual original rig: {missing}"
    bpy.context.view_layer.objects.active=rig
    rig.select_set(True)
    bpy.context.scene.render.fps=60
    pb.rotation_mode="QUATERNION"
    pb.rotation_quaternion=Quaternion((1,0,0,0))
    pb.keyframe_insert(data_path="rotation_quaternion",frame=1)
    pb.rotation_quaternion=Quaternion(Vector((0,0,1)),math.radians(18))
    pb.keyframe_insert(data_path="rotation_quaternion",frame=13)
    pb.rotation_quaternion=Quaternion((1,0,0,0))
    pb.keyframe_insert(data_path="rotation_quaternion",frame=25)
    # Save native .blend reference in output artifact for validation, not game publishing.
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"kairo-minimal-probe.blend"))
    frames=[]
    for frame in (1,13,25):
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        # Bone space has a different basis from glTF or VRM normalized locals.
        # Bake an actual armature/world-space quaternion delta from the
        # Blender evaluated POSE vs its exact imported REST matrix.
        # No direct Blender quaternion is copied to game normalized joints.
        restQ=(rig.matrix_world @ pb.bone.matrix_local).to_quaternion().normalized()
        poseQ=(rig.matrix_world @ pb.matrix).to_quaternion().normalized()
        delta=(poseQ @ restQ.inverted()).normalized()
        frames.append({"frame":frame,"time":(frame-1)/60,
          "blenderWorldDeltaWXYZ":[float(x) for x in delta],
          "angleDegrees":math.degrees(delta.angle)})
    assert frames[0]["angleDegrees"]<0.001,frames
    assert 15<frames[1]["angleDegrees"]<21,frames
    assert frames[2]["angleDegrees"]<0.001,frames
    payload={
     "schema":"sky-clash.blender-to-vrm0-world-delta-probe.v1",
     "status":"TEST_ONLY_NOT_COMBAT_ANIMATION",
     "modelSha256":SHA,"sourceRigFormat":"real Kairo VRM0 GLB with VRM humanoid mappings",
     "sourceBone":rawName,"targetNormalizedBone":"leftUpperArm",
     "blenderVersion":".".join(map(str,bpy.app.version[:3])),
     "sourceNodeIndex":boneToNode["leftUpperArm"],
     "sourceBoneNames":originalNames,
     "sourceSpace":"Blender-world-Z-up quaternion delta; WXYZ; calculated from evaluated pose x inverse rest",
     "conversion":"Transform delta to VRM scene Y-up via X rotation -90 degrees, conjugate by current VRM scene world quaternion, apply to target normalized world pose then solve parent-local quaternion.",
     "frames":frames,
     "notes":[
      "This exercises only a tiny deliberately noncombat arm probe.",
      "No 20-bone foot-planting/IK, character-specific stance replacement, fingers or combat animation is validated.",
      "Native Blender action has no game root translation; source real Kairo VRM model and accepted idle are unchanged."
     ]
    }
    (OUT/"blender-original-rig-probe.json").write_text(json.dumps(payload,indent=2)+"\n")
    print("PASS BLENDER REAL KAIRO RIG IMPORT "+json.dumps({
      "version":payload["blenderVersion"],"armature":rig.name,
      "originalHumanoidBonesFound":len(originalNames),
      "keyAngles":[round(f["angleDegrees"],4) for f in frames]}))
