"""Blender IK control-rig calibration on real Kairo VRM0 joint locations.
The imported VRM0 shin BONE TAIL is ~0.72 units from its ankle joint.
Therefore NEVER run 2-bone IK on original glTF armature bone lengths.
Instead author IK on a separate, temporary control armature built from the
ACTUAL hip/knee/ankle/foot joint HEAD positions in the real imported Kairo VRM.
Only evaluated control-rig world quaternion DELTAS are exported. No game edits.
"""
import bpy, math, json, pathlib, hashlib, struct, tempfile, shutil
from mathutils import Quaternion, Vector

ROOT=pathlib.Path.cwd()
OUT=ROOT/"visual-review-output/kairo-combat-foundation"
OUT.mkdir(parents=True,exist_ok=True)
MODEL=ROOT/"assets/characters/kairo.vrm"
CONTRACT=json.loads((ROOT/"docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json").read_text())
SHA=hashlib.sha256(MODEL.read_bytes()).hexdigest()
assert SHA==CONTRACT["modelSha256"]
data=MODEL.read_bytes()
magic,version,count=struct.unpack("<III",data[:12])
assert magic==0x46546c67 and version==2 and count==len(data)
ln,typ=struct.unpack("<II",data[12:20]);assert typ==0x4e4f534a
glb=json.loads(data[20:20+ln])
rawNames={b["bone"]:glb["nodes"][b["node"]]["name"]
          for b in glb["extensions"]["VRM"]["humanoid"]["humanBones"]}
bones=CONTRACT["bones"]
assert len(bones)==20 and all(k in rawNames for k in bones)

with tempfile.TemporaryDirectory(prefix="kairo-ik-proxy-") as tmp:
    work=pathlib.Path(tmp)/"kairo.glb"
    shutil.copyfile(MODEL,work)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(work))
    originals=[o for o in bpy.data.objects if o.type=="ARMATURE" and
      all(rawNames[k] in o.pose.bones for k in bones)]
    assert len(originals)==1,"Real Kairo mapped imported armature not found"
    orig=originals[0]
    scene=bpy.context.scene
    scene.render.fps=60
    scene.frame_set(1)
    bpy.context.view_layer.update()
    opb={k:orig.pose.bones[rawNames[k]] for k in bones}
    def joint(k):return (orig.matrix_world @ opb[k].head).copy()
    # Validate actual raw joint-head positions; never infer 'ankle' from
    # GLTF shin.tail, which was shown to point the wrong way in real Kairo.
    joints={k:joint(k) for k in ['hips','leftUpperLeg','leftLowerLeg','leftFoot',
      'rightUpperLeg','rightLowerLeg','rightFoot']}
    for side in ('left','right'):
        femur=(joints[side+'UpperLeg']-joints[side+'LowerLeg']).length
        tibia=(joints[side+'LowerLeg']-joints[side+'Foot']).length
        assert .08<femur<1.2 and .08<tibia<1.2,(side,femur,tibia)
        print("KAIRO_VERIFIED_IK_CONTROL_LINKS "+json.dumps({
          'side':side,'thighLength':femur,'shinLength':tibia,
          'importedGlTFShinBoneLength':opb[side+'LowerLeg'].bone.length,
          'importedShinTailToActualAnkle':
             (opb[side+'LowerLeg'].tail-opb[side+'Foot'].head).length}))
    control=bpy.data.armatures.new('SKY_KAIRO_IK_ONLY_CONTROL_DATA')
    rig=bpy.data.objects.new('SKY_KAIRO_IK_ONLY_CONTROL',control)
    scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active=rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    ed=control.edit_bones
    pelvis=ed.new('IK_PELVIS')
    pelvis.head=joints['hips']
    pelvis.tail=joints['hips']+Vector((0,0,.12))
    for side in ('left','right'):
        a=ed.new(side+'_THIGH')
        a.head=joints[side+'UpperLeg']
        a.tail=joints[side+'LowerLeg']
        a.parent=pelvis
        a.use_connect=False
        b=ed.new(side+'_SHIN')
        b.head=joints[side+'LowerLeg']
        b.tail=joints[side+'Foot']
        b.parent=a
        b.use_connect=True
        c=ed.new(side+'_SOLE')
        c.head=joints[side+'Foot']
        # Foot visual end follows original source foot bone tip,
        # not raw shin tail.
        footTip=(orig.matrix_world @ opb[side+'Foot'].tail)
        if (footTip-c.head).length<.03:
            footTip=c.head+Vector((0,-.1,0))
        c.tail=footTip
        c.parent=b
        c.use_connect=True
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.view_layer.update()
    targets={}
    for side in ('left','right'):
        ankle=joints[side+'Foot']
        marker=bpy.data.objects.new('SKY_FOOT_IK_ANCHOR_'+side,None)
        scene.collection.objects.link(marker)
        marker.location=ankle
        shin=rig.pose.bones[side+'_SHIN']
        ik=shin.constraints.new("IK")
        ik.target=marker
        ik.chain_count=2
        ik.iterations=150
        ik.use_stretch=False
        foot=rig.pose.bones[side+'_SOLE']
        orient=bpy.data.objects.new('SKY_SOLE_ORIENT_ANCHOR_'+side,None)
        scene.collection.objects.link(orient)
        orient.rotation_mode='QUATERNION'
        orient.rotation_quaternion=(
            rig.matrix_world @ foot.matrix).to_quaternion().normalized()
        footConstraint=foot.constraints.new('COPY_ROTATION')
        footConstraint.target=orient
        footConstraint.target_space='WORLD'
        footConstraint.owner_space='WORLD'
        targets[side]={'ankle':ankle.copy(),
          'soleRotation':orient.rotation_quaternion.copy()}
    # Calibration rig has 3D joint-head lengths that agree with the real
    # original VRM. A tiny fixed pelvis height shift supplies reach slack
    # for yaw with both ankles fixed; game does NOT receive this translation.
    # Frame 1 is a measured baseline and exported world deltas are relative.
    pelvisPose=rig.pose.bones['IK_PELVIS']
    pelvisPose.rotation_mode='QUATERNION'
    qRest=pelvisPose.bone.matrix_local.to_quaternion().normalized()
    downWorld=Vector((0,0,-.032))
    pelvisPose.location=qRest.inverted() @ downWorld
    pelvisPose.keyframe_insert('location',frame=1)
    pelvisPose.keyframe_insert('location',frame=25)
    zLocal=qRest.inverted() @ Vector((0,0,1))
    moments=[(1,0),(4,1.8),(7,3.6),(10,5.2),
             (13,6),(16,5.2),(19,3.6),(22,1.8),(25,0)]
    for frame,degrees in moments:
        pelvisPose.rotation_quaternion=Quaternion(zLocal,math.radians(degrees))
        pelvisPose.keyframe_insert('rotation_quaternion',frame=frame)
    scene.frame_set(1)
    bpy.context.view_layer.update()
    mapping={
      'hips':'IK_PELVIS',
      'leftUpperLeg':'left_THIGH','leftLowerLeg':'left_SHIN','leftFoot':'left_SOLE',
      'rightUpperLeg':'right_THIGH','rightLowerLeg':'right_SHIN','rightFoot':'right_SOLE'
    }
    reference={name:(rig.matrix_world @ rig.pose.bones[pose].matrix)
      .to_quaternion().normalized() for name,pose in mapping.items()}
    spineReference=Quaternion()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'kairo-ik-foot-lock-test-only.blend'))
    rows=[]
    maxFootError,maxSoleDegrees=0.,0.
    for frame,degrees in moments:
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        quats=[]
        for name in bones:
            if name in mapping:
                pb=rig.pose.bones[mapping[name]]
                q=(rig.matrix_world @ pb.matrix).to_quaternion().normalized()
                dq=(q @ reference[name].inverted()).normalized()
            elif name=='spine':
                dq=Quaternion(Vector((0,0,1)),math.radians(-.35*degrees))
            else:
                dq=Quaternion((1,0,0,0))
            quats.append([float(v) for v in dq])
        frameIK={}
        for side in ('left','right'):
            foot=(rig.matrix_world @ rig.pose.bones[side+'_SHIN'].tail).copy()
            err=(foot-targets[side]['ankle']).length
            soleQ=(rig.matrix_world @ rig.pose.bones[side+'_SOLE'].matrix).to_quaternion().normalized()
            soleErr=math.degrees(soleQ.rotation_difference(targets[side]['soleRotation']).angle)
            maxFootError=max(maxFootError,err)
            maxSoleDegrees=max(maxSoleDegrees,soleErr)
            frameIK[side]={'ankleWorld':list(foot),
              'ankleTargetWorld':list(targets[side]['ankle']),
              'ankleError':err,'soleAngularErrorDegrees':soleErr}
        rows.append({'frame':frame,'timeSeconds':(frame-1)/60,
          'hipAuthorDegrees':degrees,'deltasWXYZ':quats,'blenderIK':frameIK})
    print('KAIRO_CONTROL_IK_DIAGNOSTIC '+json.dumps({
      'maxAnkleError':maxFootError,'maxSoleErrorDegrees':maxSoleDegrees,
      'frameIK':[(r['frame'],r['blenderIK']) for r in rows]}))
    assert maxFootError<.0025,(
      'Calibrated control IK must pin both original-geometry ankle targets: '+str(maxFootError))
    assert maxSoleDegrees<.15,(
      'Calibrated source sole world-orientation constraint failed: '+str(maxSoleDegrees))
    assert all(abs(q[0]-1)<1e-5 and all(abs(v)<1e-5 for v in q[1:])
               for q in rows[0]['deltasWXYZ']), 'Frame1 must map to actual accepted game idle'
    result={'schema':'sky-clash.blender-stationary-foot-ik-probe.v1',
      'status':'SOURCE_IK_ONLY_TARGET_RUNTIME_UNVERIFIED',
      'modelSha256':SHA,'rigSignature':CONTRACT['rigSignature'],
      'blenderVersion':'.'.join(map(str,bpy.app.version[:3])),
      'sourceSpace':'evaluated-Blender-control-rig-world-frame1-relative-WXYZ',
      'bones':bones,'parents':CONTRACT['parents'],
      'sourceBoneNames':[rawNames[name] for name in bones],
      'constraintType':'Kairo-joint-head-calibrated Blender control rig; 2-chain ankle IK and world sole orientation',
      'calibrationPelvisOffsetWorld':[0,0,-.032],
      'maxSourceAnkleError':maxFootError,
      'maxSourceSoleAngularErrorDegrees':maxSoleDegrees,
      'frames':rows,
      'limitations':[
        'Separate control rig from measured actual Kairo joint heads; glTF bone-tail lengths are not valid IK segments',
        'The temporary Blender pelvis calibration translation is NOT exported to game',
        'Baked WORLD quaternion deltas at native game rig may still need additional real-VRM positional IK',
        'This is engineering calibration, not approved gameplay movement or an original jab'
      ]}
    (OUT/'blender-foot-ik-source.json').write_text(json.dumps(result,indent=2)+'\n')
    print('PASS KAIRO_BLENDER_SOURCE_ANKLE_IK '+json.dumps({
      'frames':len(rows),'maxAnkleError':maxFootError,
      'maxSoleAngleDegrees':maxSoleDegrees,
      'hipPeakDegrees':rows[4]['hipAuthorDegrees']
    }))
