"""Private Kairo left jab: original Blender IK wrist-target blockout.
No game files, idle animations, or existing moves are modified.
Requires output of tools/author-kairo-foot-ik.py.
"""
import bpy,math,json,pathlib,hashlib,struct
from mathutils import Vector,Quaternion
ROOT=pathlib.Path.cwd();OUT=ROOT/"visual-review-output/kairo-combat-foundation"
MODEL=ROOT/"assets/characters/kairo.vrm"
CONTRACT=json.loads((ROOT/"docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json").read_text())
sha=hashlib.sha256(MODEL.read_bytes()).hexdigest()
assert sha==CONTRACT["modelSha256"]
data=MODEL.read_bytes();ln,kind=struct.unpack("<II",data[12:20]);assert kind==0x4e4f534a
glb=json.loads(data[20:20+ln])
mapName={b["bone"]:glb["nodes"][b["node"]]["name"]
         for b in glb["extensions"]["VRM"]["humanoid"]["humanBones"]}
bones=CONTRACT["bones"];assert len(bones)==20
bpy.ops.wm.open_mainfile(filepath=str(OUT/"kairo-ik-foot-lock-test-only.blend"))
scene=bpy.context.scene;scene.render.fps=60
orig=bpy.data.objects.get("Armature");legs=bpy.data.objects.get("SKY_KAIRO_IK_ONLY_CONTROL")
assert orig and legs and all(mapName[b] in orig.pose.bones for b in bones)
joint=lambda b:(orig.matrix_world @ orig.pose.bones[mapName[b]].head).copy()
# Independent DCC 2-bone IK chains from Kairo's ACTUAL arm joint heads.
rigData=bpy.data.armatures.new("SKY_KAIRO_JAB_DCC_RIG")
rig=bpy.data.objects.new("SKY_KAIRO_JAB_DCC",rigData)
scene.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
eds=rigData.edit_bones
body=eds.new("TORSO");body.head=joint("hips");body.tail=joint("upperChest")
if (body.tail-body.head).length<.08:body.tail=body.head+Vector((0,0,.3))
for side in ("left","right"):
    upper=eds.new(side+"_UPPER")
    upper.head=joint(side+"UpperArm");upper.tail=joint(side+"LowerArm");upper.parent=body
    lower=eds.new(side+"_LOWER")
    lower.head=joint(side+"LowerArm");lower.tail=joint(side+"Hand")
    lower.parent=upper;lower.use_connect=True
    wrist=eds.new(side+"_HAND")
    wrist.head=joint(side+"Hand");wrist.tail=wrist.head+Vector((0,.1,0))
    wrist.parent=lower;wrist.use_connect=True
bpy.ops.object.mode_set(mode="OBJECT");bpy.context.view_layer.update()
pb=rig.pose.bones
wrist0={s:(rig.matrix_world @ pb[s+"_LOWER"].tail).copy() for s in ("left","right")}
shoulder0={s:(rig.matrix_world @ pb[s+"_UPPER"].head).copy() for s in ("left","right")}
targets={}
for side in ("left","right"):
    target=bpy.data.objects.new("SKY_JAB_"+side+"_WRIST",None)
    scene.collection.objects.link(target);target.location=wrist0[side]
    ik=pb[side+"_LOWER"].constraints.new("IK")
    ik.target=target;ik.chain_count=2;ik.iterations=150;ik.use_stretch=False
    targets[side]=target
# All original artwork here lives in Blender TARGET curves, NOT in
# procedural game bone rotations. 15.4 = precisely 0.24 s after frame 1.
# key: frame, left wrist reach/forward/rise, right guard reach/forward/rise,
# torso turn degrees, hip turn degrees.
keys=[
(1,1.,0.,0.,1.,0.,0.,0.,0.),
(4,.79,.09,.04,.78,.09,.04,-2.,-.7),
(8,.74,.12,.06,.76,.11,.05,-4.,-2.),
(11,.72,.08,.05,.76,.11,.05,-6.,-3.),
(13,.71,.17,.06,.76,.11,.05,-1.,1.),
(15.4,.72,.30,.07,.76,.11,.05,8.,5.5),
(16.5,.73,.26,.065,.76,.11,.05,7.,5.),
(20,.74,.13,.055,.76,.11,.05,3.,2.),
(25,.79,.09,.04,.78,.09,.04,0.,0.),
(34,1.,0.,0.,1.,0.,0.,0.,0.)
]
# Preserve existing source pelvis height calibration but not the older
# experimental timeline keyframes; original Kairo gameplay never sees it.
legs.animation_data_clear()
pelvis=legs.pose.bones["IK_PELVIS"];pelvis.rotation_mode="QUATERNION"
pelvisAxis=pelvis.bone.matrix_local.to_quaternion().inverted() @ Vector((0,0,1))
torso=pb["TORSO"];torso.rotation_mode="QUATERNION"
torsoAxis=torso.bone.matrix_local.to_quaternion().inverted() @ Vector((0,0,1))
forward=Vector((0,1,0));up=Vector((0,0,1))
for f,ls,ld,lh,rs,rd,rh,torsoDeg,hipDeg in keys:
    for side,(scale,depth,rise) in {"left":(ls,ld,lh),"right":(rs,rd,rh)}.items():
        marker=targets[side]
        marker.location=(shoulder0[side]+(wrist0[side]-shoulder0[side])*scale+
          forward*depth+up*rise)
        marker.keyframe_insert("location",frame=f)
    torso.rotation_quaternion=Quaternion(torsoAxis,math.radians(torsoDeg))
    torso.keyframe_insert("rotation_quaternion",frame=f)
    pelvis.rotation_quaternion=Quaternion(pelvisAxis,math.radians(hipDeg))
    pelvis.keyframe_insert("rotation_quaternion",frame=f)
for ob in [rig,legs,*targets.values()]:
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation="BEZIER"
                kp.handle_left_type="AUTO_CLAMPED"
                kp.handle_right_type="AUTO_CLAMPED"
scene.frame_set(1);bpy.context.view_layer.update()
leg={
"hips":"IK_PELVIS","leftUpperLeg":"left_THIGH","leftLowerLeg":"left_SHIN",
"leftFoot":"left_SOLE","rightUpperLeg":"right_THIGH",
"rightLowerLeg":"right_SHIN","rightFoot":"right_SOLE"}
arm={
"leftUpperArm":"left_UPPER","leftLowerArm":"left_LOWER","leftHand":"left_HAND",
"rightUpperArm":"right_UPPER","rightLowerArm":"right_LOWER","rightHand":"right_HAND"}
def worldquat(name):
    if name in leg:return (legs.matrix_world @ legs.pose.bones[leg[name]].matrix).to_quaternion().normalized()
    if name in arm:return (rig.matrix_world @ pb[arm[name]].matrix).to_quaternion().normalized()
    if name in ("spine","chest","upperChest","leftShoulder","rightShoulder"):
        return (rig.matrix_world @ torso.matrix).to_quaternion().normalized()
    return Quaternion()
baseline={b:worldquat(b) for b in bones}
anchor={s:(legs.matrix_world @ legs.pose.bones[s+"_SHIN"].tail).copy() for s in ("left","right")}
sole0={s:(legs.matrix_world @ legs.pose.bones[s+"_SOLE"].matrix).to_quaternion().normalized() for s in ("left","right")}
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"kairo-original-jab-review-only.blend"))
frames=[];maxFoot=0.;maxSole=0.;maxWrist=0.
for f in sorted([float(i) for i in range(1,35)]+[15.4]):
    scene.frame_set(int(f),subframe=f-int(f));bpy.context.view_layer.update()
    quats=[]
    for b in bones:
        delta=(worldquat(b) @ baseline[b].inverted()).normalized()
        if b in ("spine","chest"):
            delta=Quaternion().slerp(delta,.4 if b=="spine" else .78)
        # Blender 32-bit quaternion interpolation can drift slightly from
        # unit length. Explicitly normalize the serialized result; never
        # weaken the real-WebGL input validation tolerance.
        delta.normalize()
        quats.append([float(x) for x in delta])
    feet={};wrists={}
    for side in ("left","right"):
        a=(legs.matrix_world @ legs.pose.bones[side+"_SHIN"].tail)
        e=(a-anchor[side]).length
        shoe=(legs.matrix_world @ legs.pose.bones[side+"_SOLE"].matrix).to_quaternion().normalized()
        r=math.degrees(shoe.rotation_difference(sole0[side]).angle)
        maxFoot=max(maxFoot,e);maxSole=max(maxSole,r)
        feet[side]={"ankleDrift":e,"soleAngleDegrees":r}
        wp=(rig.matrix_world @ pb[side+"_LOWER"].tail)
        error=(wp-targets[side].location).length
        maxWrist=max(maxWrist,error)
        wrists[side]={"IKResidual":error,"world":list(wp),"target":list(targets[side].location)}
    frames.append({"frame":f,"timeSeconds":(f-1)/60,
      "phase":"contact" if abs(f-15.4)<1e-8 else "blocking",
      "deltasWXYZ":quats,"feet":feet,"wrists":wrists})
ident=lambda q:abs(abs(q[0])-1)<1e-5 and all(abs(x)<1e-5 for x in q[1:])
assert len(frames)==35
assert any(x["phase"]=="contact" and abs(x["timeSeconds"]-.24)<1e-9 for x in frames)
assert all(ident(q) for q in frames[0]["deltasWXYZ"])
assert all(ident(q) for q in frames[-1]["deltasWXYZ"])
assert maxFoot<.003,("Source foot IK lost anchors",maxFoot)
assert maxSole<.15,("Source foot orientation changed",maxSole)
result={"schema":"sky-clash.kairo-original-jab-dcc-blockout.v1",
 "status":"UNAPPROVED_OFFLINE_CHOREOGRAPHY",
 "fighter":"kairo_venn","modelSha256":sha,"rigSignature":CONTRACT["rigSignature"],
 "sourceSpace":"evaluated-Blender-world-neutral-relative-WXYZ",
 "bones":bones,"parents":CONTRACT["parents"],
 "rawBoneNames":[mapName[b] for b in bones],
 "blenderVersion":".".join(map(str,bpy.app.version[:3])),
 "impactSeconds":.24,"durationSeconds":.55,"sourceFrames":35,
 "poseKeys":[{"frame":k[0],"torsoYaw":k[7],"pelvisYaw":k[8]} for k in keys],
 "maxSourceFootDrift":maxFoot,"maxSourceSoleDegrees":maxSole,
 "maxWristIKTargetError":maxWrist,"samples":frames,
 "limitations":["First Blender IK blockout; visual merit NOT assessed",
   "No published game animations or approved standing/flight assets changed",
   "0.032 source pelvis calibration displacement not exported to runtime",
   "DCC Blender wrist target paths are not game-procedural bone motion",
   "0.24 contact is authored timing only, not verified collision or appearance"]}
(OUT/"blender-original-jab-blockout.json").write_text(json.dumps(result,indent=2)+"\n")
print("PASS ORIGINAL_KAIRO_JAB_BLENDER_BLOCKOUT "+json.dumps({
  "frames":len(frames),"contact":.24,"maxFootDrift":maxFoot,
  "maxSoleDeg":maxSole,"maxWristIKError":maxWrist,
  "published":False,"artApproved":False}))
