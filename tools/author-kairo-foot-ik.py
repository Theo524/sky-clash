"""Isolated foot-plant IK feasibility probe on Kairo's ORIGINAL VRM0 in Blender.
Not a gameplay animation, not an approved full-body retarget.
Bake evaluated Blender world/rest rotations from a two-leg stationary target IK.
"""
import bpy, json, math, pathlib, shutil, struct, tempfile, hashlib
from mathutils import Quaternion, Vector
ROOT=pathlib.Path.cwd()
OUT=ROOT/"visual-review-output/kairo-combat-foundation"
OUT.mkdir(parents=True, exist_ok=True)
MODEL=ROOT/"assets/characters/kairo.vrm"
MANIFEST=json.loads((ROOT/"docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json").read_text())
MODEL_SHA=hashlib.sha256(MODEL.read_bytes()).hexdigest()
assert MODEL_SHA==MANIFEST["modelSha256"]
data=MODEL.read_bytes()
magic,version,byte_count=struct.unpack("<III",data[:12])
assert magic==0x46546c67 and version==2 and len(data)==byte_count
n,typ=struct.unpack("<II",data[12:20])
assert typ==0x4e4f534a
glb=json.loads(data[20:20+n])
mapping={b["bone"]:glb["nodes"][b["node"]]["name"]
         for b in glb["extensions"]["VRM"]["humanoid"]["humanBones"]}
bones=MANIFEST["bones"]
assert len(bones)==20 and all(name in mapping for name in bones)
with tempfile.TemporaryDirectory(prefix="kairo-foot-ik-") as tmp:
    source=pathlib.Path(tmp)/"kairo.glb"
    shutil.copyfile(MODEL,source)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    rigs=[o for o in bpy.data.objects if o.type=="ARMATURE"
          and all(mapping[name] in o.pose.bones for name in bones)]
    assert len(rigs)==1,"Kairo original 20 bone mapping not found"
    rig=rigs[0]
    scene=bpy.context.scene
    scene.render.fps=60
    bpy.context.view_layer.objects.active=rig
    rig.select_set(True)
    pb={name:rig.pose.bones[mapping[name]] for name in bones}
    for p in pb.values():
        p.rotation_mode="QUATERNION"
    scene.frame_set(1)
    bpy.context.view_layer.update()
    # IMPORTANT: the imported VRM GLB does NOT use the Blender shin.tail
    # as its ankle! Measured shin.tail is ~0.72 units from foot.head.
    # IK must follow the actual foot bone and pin its end-effector, while
    # also asking the solver to preserve sole orientation.
    anchors={}
    for side in ["left","right"]:
        shin=pb[side+"LowerLeg"]
        foot=pb[side+"Foot"]
        ankle=(rig.matrix_world @ foot.head).copy()
        foot_tip=(rig.matrix_world @ foot.tail).copy()
        foot_matrix=(rig.matrix_world @ foot.matrix).copy()
        print("KAIRO_REAL_FOOT_CHAIN_GEOMETRY "+json.dumps({
          "side":side,
          "thighLength":float(pb[side+"UpperLeg"].bone.length),
          "shinLength":float(shin.bone.length),
          "footLength":float(foot.bone.length),
          "shinTailAnkleSeparation":float((shin.tail-foot.head).length),
          "ankle":list(ankle),"footTip":list(foot_tip)}))
        marker=bpy.data.objects.new("SKY_TEST_"+side+"_FOOT_END",None)
        scene.collection.objects.link(marker)
        marker.location=foot_tip
        marker.rotation_mode="QUATERNION"
        marker.rotation_quaternion=foot_matrix.to_quaternion()
        ik=foot.constraints.new("IK")
        ik.target=marker
        ik.chain_count=3   # foot -> shin -> thigh, NOT shin.tail
        ik.iterations=160
        ik.use_stretch=False
        ik.use_rotation=True
        anchors[side]={"ankle":ankle,"tip":foot_tip,
                       "soleRotation":foot_matrix.to_quaternion()}
    bpy.context.view_layer.update()
    # Explicit hip and upper body weighting samples. No model/root translation;
    # only 20 mapped joints will travel through the future converter.
    moments=[(1,0),(4,1.8),(7,3.6),(10,5.2),
             (13,6.0),(16,5.2),(19,3.6),(22,1.8),(25,0)]
    hips=pb["hips"];upper=pb["spine"]
    for frame,angle in moments:
        hips.rotation_quaternion=Quaternion(Vector((0,0,1)),math.radians(angle))
        hips.keyframe_insert(data_path="rotation_quaternion",frame=frame)
        upper.rotation_quaternion=Quaternion(Vector((0,0,1)),math.radians(-angle*.35))
        upper.keyframe_insert(data_path="rotation_quaternion",frame=frame)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"kairo-ik-foot-lock-test-only.blend"))
    scene.frame_set(1)
    bpy.context.view_layer.update()
    # Capture evaluated SOURCE reference once. Blender's authored IK can
    # have a useful flexed rest, but frame 1 must map to Kairo's CURRENT
    # approved game standing, not the imported VRM0 T-pose or flex rig.
    referenceWorld={
      name:(rig.matrix_world @ pb[name].matrix).to_quaternion().normalized()
      for name in bones
    }
    frames=[]
    maxSourceAnkleError=0.0
    maxSourceSoleError=0.0
    maxKneeAngle=0.0
    for frame,angle in moments:
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        deltas=[]
        for name in bones:
            p=pb[name]
            posed=(rig.matrix_world @ p.matrix).to_quaternion().normalized()
            delta=(posed @ referenceWorld[name].inverted()).normalized()
            deltas.append([float(v) for v in delta])
        anchorsNow={}
        for side in ["left","right"]:
            ankle=(rig.matrix_world @ pb[side+"Foot"].head)
            err=(ankle-anchors[side]["ankle"]).length
            sole=(rig.matrix_world @ pb[side+"Foot"].matrix).to_quaternion().normalized()
            soleAngle=math.degrees(sole.rotation_difference(anchors[side]["soleRotation"]).angle)
            maxSourceAnkleError=max(maxSourceAnkleError,err)
            maxSourceSoleError=max(maxSourceSoleError,soleAngle)
            anchorsNow[side]={"ankleWorld":list(ankle),
              "ankleTargetWorld":list(anchors[side]["ankle"]),
              "ankleError":err,"soleAngularErrorDegrees":soleAngle}
        frames.append({"frame":frame,"timeSeconds":(frame-1)/60,
          "hipAuthorDegrees":angle,"deltasWXYZ":deltas,
          "blenderIK":anchorsNow})
    assert all(abs(frames[0]["deltasWXYZ"][i][0]-1)<0.00001 and
               max(abs(v) for v in frames[0]["deltasWXYZ"][i][1:])<0.00001
               for i in range(len(bones))),"Source reference first pose is not neutral"
    assert maxSourceAnkleError<0.0025,(
      "Blender two-leg ankle IK failed to hold both targets: "+str(maxSourceAnkleError))
    assert maxSourceSoleError<.15,(
      "Blender foot orientation lock failed: "+str(maxSourceSoleError))
    assert len(frames)==9 and len(frames[4]["deltasWXYZ"])==20
    assert frames[4]["hipAuthorDegrees"]>=5.5
    payload={"schema":"sky-clash.blender-stationary-foot-ik-probe.v1",
      "status":"SOURCE_IK_ONLY_TARGET_RUNTIME_UNVERIFIED",
      "modelSha256":MODEL_SHA,"rigSignature":MANIFEST["rigSignature"],
      "blenderVersion":".".join(map(str,bpy.app.version[:3])),
      "sourceSpace":"evaluated-Blender-world-posed-reference-relative-WXYZ",
      "ikEndEffector":"foot.tail with chain foot -> shin -> thigh",
      "bones":bones,"parents":MANIFEST["parents"],
      "sourceBoneNames":[mapping[name] for name in bones],
      "constraintType":"Blender 3-bone foot-tail IK with fixed world position and orientation",
      "maxSourceAnkleError":maxSourceAnkleError,
      "maxSourceSoleAngularErrorDegrees":maxSourceSoleError,
      "frames":frames,
      "limitations":[
        "Blender target locks do not automatically mean VRM normalized geometry is planted",
        "Blender IK holds actual foot end effector; frame-1 source-relative delta must be identity",
        "Only rotational hip shift, not physical hip translation, has been authored",
        "No game clip or fighters were modified; no professional combat motion is claimed",
        "Source is glTF import of original VRM0, and game applies normalized world baseline-relative deltas"
      ]}
    (OUT/"blender-foot-ik-source.json").write_text(json.dumps(payload,indent=2)+"\n")
    print("PASS KAIRO_BLENDER_SOURCE_ANKLE_IK "+json.dumps({
      "frames":len(frames),"maxAnkleError":maxSourceAnkleError,
      "maxSoleAngleDegrees":maxSourceSoleError,
      "hipPeakDegrees":frames[4]["hipAuthorDegrees"]
    }))
