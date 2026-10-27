"""Actual Kairo Blender VRM0 20-joint transfer probe; NOT a combat animation.
Two source action windows: torso/arms, then pelvis/legs.
Only evaluated rest-relative Blender world quaternions are exported.
"""
import bpy, math, json, pathlib, hashlib, struct, tempfile, shutil
from mathutils import Quaternion, Vector

ROOT=pathlib.Path.cwd()
OUT=ROOT/"visual-review-output/kairo-combat-foundation"
OUT.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/"assets/characters/kairo.vrm"
MANIFEST=json.loads((ROOT/"docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json").read_text())
SHA=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert SHA==MANIFEST["modelSha256"]
data=SOURCE.read_bytes()
magic,version,size=struct.unpack("<III",data[:12])
assert magic==0x46546c67 and version==2 and size==len(data)
jsonlen,typ=struct.unpack("<II",data[12:20])
assert typ==0x4e4f534a
glb=json.loads(data[20:20+jsonlen])
human=glb["extensions"]["VRM"]["humanoid"]["humanBones"]
namesByBone={item["bone"]:glb["nodes"][item["node"]]["name"] for item in human}
names=MANIFEST["bones"]
assert len(names)==20 and all(n in namesByBone for n in names)
# Deliberately simple calibration motions; these are NOT production keyframes.
# local quaternion axis and angle in Blender's imported bone pose basis
UPPER={
 "spine":((0,0,1),3.5),
 "chest":((0,1,0),-2.0),
 "leftShoulder":((0,0,1),5.0),
 "leftUpperArm":((0,0,1),11.0),
 "leftLowerArm":((0,1,0),-17.0),
 "leftHand":((0,0,1),4.0),
 "rightUpperArm":((0,0,1),-5.0),
 "rightLowerArm":((0,1,0),6.0)
}
LOWER={
 "hips":((0,0,1),3.0),
 "leftUpperLeg":((0,1,0),5.0),
 "leftLowerLeg":((0,1,0),-7.0),
 "leftFoot":((0,1,0),2.0),
 "rightUpperLeg":((0,1,0),-6.0),
 "rightLowerLeg":((0,1,0),8.0),
 "rightFoot":((0,1,0),-2.0)
}
with tempfile.TemporaryDirectory(prefix="kairo-connected-vrm-") as temp:
    temporary=pathlib.Path(temp)/"kairo.glb"
    shutil.copyfile(SOURCE,temporary)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(temporary))
    armatures=[o for o in bpy.data.objects if o.type=="ARMATURE"
               and all(namesByBone[n] in o.pose.bones for n in names)]
    assert len(armatures)==1, "Expected exact original 20 Kairo armature bones"
    rig=armatures[0]
    bpy.context.view_layer.objects.active=rig
    rig.select_set(True)
    bpy.context.scene.render.fps=60
    for name in names:
        rig.pose.bones[namesByBone[name]].rotation_mode="QUATERNION"
    for frame,angles in [(1,{}),(13,UPPER),(25,{}),
                         (31,{}),(43,LOWER),(55,{})]:
        for name in names:
            pb=rig.pose.bones[namesByBone[name]]
            axis,angle=angles.get(name,((0,0,1),0))
            pb.rotation_quaternion=Quaternion(Vector(axis),math.radians(angle))
            pb.keyframe_insert(data_path="rotation_quaternion",frame=frame)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"kairo-connected-joints-test-only.blend"))
    profiles=[]
    for label,frames in [("torso-arms",[1,7,13,19,25]),
                         ("pelvis-legs",[31,37,43,49,55])]:
        poses=[]
        for frame in frames:
            bpy.context.scene.frame_set(frame)
            bpy.context.view_layer.update()
            deltas=[]
            for name in names:
                pb=rig.pose.bones[namesByBone[name]]
                rest=(rig.matrix_world @ pb.bone.matrix_local).to_quaternion().normalized()
                pose=(rig.matrix_world @ pb.matrix).to_quaternion().normalized()
                delta=(pose @ rest.inverted()).normalized()
                deltas.append([float(i) for i in delta])
            poses.append({"frame":frame,"deltasWXYZ":deltas})
        profiles.append({"name":label,"frames":poses})
    # Parent transforms are intentionally included in the evaluated world
    # deltas. The browser must solve all 20 normalized local joints in
    # hierarchical order rather than apply Blender bone-local rotations.
    payload={
      "schema":"sky-clash.blender-connected-joints-probe.v1",
      "status":"TEST_ONLY_NO_FOOT_IK_NO_COMBAT",
      "modelSha256":SHA,"rigSignature":MANIFEST["rigSignature"],
      "sourceSpace":"evaluated-Blender-world-rest-relative-WXYZ",
      "bones":names,
      "sourceBoneNames":[namesByBone[n] for n in names],
      "parents":MANIFEST["parents"],
      "blenderVersion":".".join(map(str,bpy.app.version[:3])),
      "profiles":profiles,
      "limits":[
       "Upper-only test demands stationary feet; lower test measures foot drift and makes no foot-lock claim",
       "This is NOT a character combat animation, inverse-kinematics rig or retarget of source positions",
       "The accepted dynamic standing pose is captured live by the game; Blender does not replace it"
      ]
    }
    assert [x["name"] for x in profiles]==["torso-arms","pelvis-legs"]
    assert len(profiles[0]["frames"][2]["deltasWXYZ"])==20
    (OUT/"blender-connected-joints-source.json").write_text(json.dumps(payload,indent=2)+"\n")
    print("PASS BLENDER_REAL_KAIRO_CONNECTED_SOURCE "+
          json.dumps({"joints":20,"blender":payload["blenderVersion"],
          "profiles":[p["name"] for p in profiles]}))
