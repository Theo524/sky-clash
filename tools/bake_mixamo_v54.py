"""Sky Clash V54: FBX animation channel baker.
Extract selected, licensed Mixamo X-Bot-style animations and retarget their
world-space bind-pose rotation deltas to the game's VRM-normalized 22-bone rig.
No FBX model/mesh is shipped. FBX rights remain with the respective licensors.
"""
from pathlib import Path
import zipfile,sys,math,json,zlib,base64, hashlib, numpy as np
from scipy.spatial.transform import Rotation as R
sys.path.insert(0,str(Path(__file__).parent))
from inspect_mixamo_fbx import parse

ROOT=Path(__file__).resolve().parents[1]
DATA=Path('/mnt/data')
BONES=['hips','spine','chest','upperChest','neck','head','leftShoulder','leftUpperArm','leftLowerArm','leftHand','rightShoulder','rightUpperArm','rightLowerArm','rightHand','leftUpperLeg','leftLowerLeg','leftFoot','leftToes','rightUpperLeg','rightLowerLeg','rightFoot','rightToes']
MAP={'hips':'Hips','spine':'Spine','chest':'Spine1','upperChest':'Spine2','neck':'Neck','head':'Head','leftShoulder':'LeftShoulder','leftUpperArm':'LeftArm','leftLowerArm':'LeftForeArm','leftHand':'LeftHand','rightShoulder':'RightShoulder','rightUpperArm':'RightArm','rightLowerArm':'RightForeArm','rightHand':'RightHand','leftUpperLeg':'LeftUpLeg','leftLowerLeg':'LeftLeg','leftFoot':'LeftFoot','leftToes':'LeftToeBase','rightUpperLeg':'RightUpLeg','rightLowerLeg':'RightLeg','rightFoot':'RightFoot','rightToes':'RightToeBase'}
# Unambiguous animation source paths, deliberately not relying on UI hover titles.
SOURCES={
 'mxKJab':('boxing.zip','boxing/Lead Jab.fbx'),
 'mxKJabCross':('boxing.zip','boxing/Jab Cross.fbx'),
 'mxKCrossAlt':('boxing.zip','boxing/Jab Cross (1).fbx'),
 'mxKHook':('boxing.zip','boxing/Hook.fbx'),
 'mxKCombo':('boxing.zip','boxing/Punch Combo.fbx'),
 'mxKComboAlt':('boxing.zip','boxing/Combo Punch.fbx'),
 'mxKBodyCross':('boxing.zip','boxing/Body Jab Cross.fbx'),
 'mxKElbow':('boxing.zip','boxing/Elbow Punch.fbx'),
 'mxKIdle':('boxing.zip','boxing/Fighting Idle.fbx'),
 'mxKDodge':('boxing.zip','boxing/Dodging.fbx'),
 'mxKStepBack':('boxing.zip','boxing/Step Backward.fbx'),
 'mxKHit':('boxing.zip','boxing/Hit Reaction.fbx'),
 'mxKUpperHit':('boxing.zip','boxing/Receive Uppercut To The Face.fbx'),
 'mxRRoundhouse':('kicking.zip','kicking/Roundhouse Kick.fbx'),
 'mxRSideKick':('kicking.zip','kicking/Side Kick.fbx'),
 'mxRSweep':('kicking.zip','kicking/Leg Sweep.fbx'),
 'mxRSpinFlip':('kicking.zip','kicking/Spin Flip Kick.fbx'),
 'mxRFlipKick':('kicking.zip','kicking/Flip Kick.fbx'),
 'mxRKick':('kicking.zip','kicking/Kicking.fbx'),
 'mxRDoubleKick':('kicking.zip','kicking/Inverted Double Kick To Kip Up.fbx'),
 'mxRNinjaIdle':('ninja.zip','ninja/Ninja Idle.fbx'),
 'mxRNinjaIdleAlt':('ninja.zip','ninja/Ninja Idle (1).fbx'),
 'mxRSneak':('ninja.zip','ninja/Sneak Walk.fbx'),
 'mxRDodgeArc':('ninja.zip','ninja/Running Arc.fbx'),
 'mxRBackward':('ninja.zip','ninja/Running Backward.fbx'),
 'mxRCapoSweep':('Capoeira Pack.zip','rasteira 1.fbx'),
 'mxRCapoSpin':('Capoeira Pack.zip','armada.fbx'),
 'mxRCapoStep':('Capoeira Pack.zip','esquiva 2.fbx'),
}
FPS=30
TICK=46186158000.0

def props(model):
 p=model.first('Properties70')
 return {x.props[0]:x.props[4:] for x in p.children if x.name=='P'} if p else {}
def vec(d,k,default=(0,0,0)):
 v=d.get(k,default)
 return np.asarray((list(v)+list(default))[:3],dtype=float)
def rotate(vals):
 # FBX Euler channels are EXTRINSIC XYZ. Intrinsic 'XYZ' produces a
 # ~106-degree bind-pose error on both Mixamo shoulders and twists limbs.
 return R.from_euler('xyz',vals,degrees=True)

def bake(raw,name):
 ver,root=parse(raw)
 objects=next(n for n in root if n.name=='Objects')
 cs=next(n for n in root if n.name=='Connections')
 models={n.props[0]:n for n in objects.children if n.name=='Model'}
 byname={n.props[1].split('\0')[0].split(':')[-1]:n.props[0] for n in models.values()}
 nodes={n.props[0]:n for n in objects.children if n.name in ('AnimationCurveNode','AnimationCurve')}
 children={}
 parents={}
 links={}
 for n in cs.children:
  v=n.props
  if len(v)<3:continue
  typ,child,parent=v[:3]
  if typ=='OO' and child in models and parent in models:parents[child]=parent
  if typ=='OP' and child in nodes:links.setdefault(parent,[]).append((child,v[3] if len(v)>3 else ''))
 rotations={}; translations={}
 # CurveNode -> Model on Lcl Rotation, Curve -> CurveNode on d|X,Y,Z
 for mid, v in links.items():
  if mid not in models:continue
  for nodeid,prop in v:
   if nodeid not in nodes or nodes[nodeid].name!='AnimationCurveNode':continue
   if prop not in ('Lcl Rotation','Lcl Translation'):continue
   xyz={}
   for ci,key in links.get(nodeid,[]):
    if ci not in nodes or nodes[ci].name!='AnimationCurve':continue
    kn=nodes[ci].first('KeyTime');kv=nodes[ci].first('KeyValueFloat')
    if kn and kv and kn.props and kv.props and isinstance(kn.props[0],list):xyz[key[-1]]=(np.asarray(kn.props[0],float)/TICK,np.asarray(kv.props[0],float))
   if xyz:(rotations if prop=='Lcl Rotation' else translations)[mid]=xyz
 if not rotations:raise ValueError('FBX contains no Lcl Rotation animation curves')
 # Duration determined from the relevant bone tracks, avoiding stray curves
 sel=[byname[m] for m in MAP.values() if m in byname]
 active=[t for idx in sel for xyz in rotations.get(idx,{}).values() for t in xyz[0]]
 if not active:raise ValueError('No humanoid channels found')
 mint,maxt=float(min(active)),float(max(active))
 dur=maxt-mint
 if dur<0.09 or dur>15:raise ValueError(f'Unusual animation duration {dur:.3f}s')
 nf=max(3, round(dur*FPS)+1)
 times=np.linspace(mint,maxt,nf)
 needed=set(sel)
 def addparent(m):
  while m in parents and parents[m] not in needed:
   m=parents[m];needed.add(m)
 for x in list(needed):addparent(x)
 needed={m for m in needed if m in models}
 propss={mid:props(models[mid]) for mid in needed}
 base={mid:rotate(vec(p,'PreRotation')) * rotate(vec(p,'Lcl Rotation')) for mid,p in propss.items()}
 rest={}
 def worldrest(mid):
  if mid not in rest:rest[mid]=(worldrest(parents[mid]) if mid in parents and parents[mid] in needed else R.identity())*base[mid]
  return rest[mid]
 for mid in needed:worldrest(mid)
 # Catch the exact V54 corruption: SciPy's intrinsic XYZ yields a ~106-degree
 # mismatch between shoulder rest matrices and the FBX's actual BindPose.
 # FBX's rotation channels must be interpreted using EXTRINSIC xyz instead.
 poses=[n for n in objects.children if n.name=='Pose' and any(x=='BindPose' for x in n.props)]
 if poses:
  bind={}
  for child in poses[0].children:
   if child.name!='PoseNode': continue
   bn=child.first('Node'); mat=child.first('Matrix')
   if bn and mat and len(mat.props[0])==16:
    # FBX stores matrices in column-major form.
    bind[bn.props[0]]=R.from_matrix(np.array(mat.props[0],dtype=float).reshape(4,4)[:3,:3].T)
  for part in ('Hips','LeftShoulder','RightShoulder','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftUpLeg','RightUpLeg'):
   mid=byname.get(part)
   if mid in bind and mid in rest:
    err=math.degrees((bind[mid].inv()*rest[mid]).magnitude())
    if err>1.0: raise ValueError(f'Mixamo bind-pose mismatch on {part}: {err:.2f} degrees')
 curves={}
 for mid in needed:
  rd=propss[mid]; axes=rotations.get(mid,{})
  vals=[]
  for i,k in enumerate('XYZ'):
   val=axes.get(k)
   vals.append(np.interp(times,val[0],val[1]) if val else np.full(nf,vec(rd,'Lcl Rotation')[i]))
  curves[mid]=rotate(np.stack(vals,axis=-1))
 pre={mid:rotate(vec(propss[mid],'PreRotation')) for mid in needed}
 world={}
 def worldanim(mid):
  if mid not in world:
   parent=worldanim(parents[mid]) if mid in parents and parents[mid] in needed else R.identity()
   world[mid]=parent*pre[mid]*curves[mid]
  return world[mid]
 for mid in needed:worldanim(mid)
 frames=np.zeros((nf,91),np.int16)
 # An FBX motion may start sideways, turning 70-90 degrees, or even with a
 # rolled pelvis (some Ninja idles). Game facing is controlled by the fighter,
 # not by the source clip. Neutralize the source's initial pelvis orientation
 # once, then preserve ALL relative turns, leans and spins during playback.
 # This also avoids double yaw against lock-on combat steering.
 sourceHips=byname.get('Hips')
 neutral= (world[sourceHips][0]*worldrest(sourceHips).inv()).inv() if sourceHips in world else R.identity()
 for bi,bone in enumerate(BONES):
  key=MAP[bone];mid=byname.get(key)
  if mid in needed:
   q=(neutral*world[mid]*worldrest(mid).inv()).as_quat()
   # continuity prevents sudden SLERP reversals across 180 deg
   for j in range(1,len(q)):
    if np.dot(q[j-1],q[j])<0:q[j]*=-1
  else:q=np.tile([0,0,0,1],(nf,1))
  frames[:,bi*4:bi*4+4]=np.clip(np.rint(q*32767),-32767,32767).astype(np.int16)
 # Root motion is baked for reference, but gameplay drives horizontal displacement
 # and attack layers explicitly choose noH to prevent double movement.
 hipid=byname.get('Hips')
 if hipid in translations:
  xyz=translations[hipid]
  tbase=vec(propss[hipid],'Lcl Translation')
  ht=max(50,abs(tbase[1]))
  offsets=[]
  for i,k in enumerate('XYZ'):
   val=xyz.get(k)
   offsets.append((np.interp(times,val[0],val[1]) if val else np.full(nf,tbase[i]))-tbase[i])
  h=np.stack(offsets,axis=1)/ht
  frames[:,88:91]=np.clip(np.rint(h*10000),-32767,32767).astype(np.int16)
 # rough energy check to detect unusable or rigid clips
 qs=frames[:,:88].astype(float).reshape(nf,22,4)/32767
 dif=np.abs(np.diff(qs,axis=0)).mean()
 if dif<0.00001:raise ValueError('Missing animation movement')
 return frames,{'source':name,'d':round((nf-1)/FPS,4),'n':nf,'p0':0,'imp':round(max(.07,min(.35,dur*.29)),3),'fps':FPS,'motion':float(round(dif,5))}

def main():
 allframes=[];clips={};info=[]
 for name,(archive,file) in SOURCES.items():
  with zipfile.ZipFile(DATA/archive) as z:fbx=z.read(file)
  try:fr,meta=bake(fbx,file)
  except Exception as exc:
   print('SKIP',name,file,repr(exc));continue
  meta['o']=sum(len(x) for x in allframes)*91
  allframes.append(fr);clips[name]=meta
  print(f'{name:<19} {meta["n"]:3d} frames {meta["d"]:4.2f}s {meta["motion"]} {file}')
  info.append({'id':name,'source':f'{archive}/{file}','duration_seconds':meta['d'],'frames':meta['n'],'sha256':hashlib.sha256(fbx).hexdigest()})
 flat=np.concatenate(allframes,axis=0).astype('<i2');data=base64.b64encode(flat.tobytes()).decode('ascii')
 code="""/* Sky Clash V54 — select Mixamo movement clips (offline baked, no FBX models).\n * Real recorded FBX keyframes retargeted to normalized VRM world-delta rotations.\n * Only clips actually used by the two fighters are loaded; no runtime FBX parser.\n * In-game character locomotion/physics remain authoritative.\n */\nconst SkyClashMixamo = (() => {\n  const meta = """+json.dumps(clips,separators=(',',':'))+";\n  const raw = '"+data+"';\n  let data = null;\n  const stride = 91, NB = 22;\n  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();\n  function load() {\n    if (!data) { const bin = atob(raw), b = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) b[i]=bin.charCodeAt(i); data=new Int16Array(b.buffer); }\n    return data;\n  }\n  function sample(name, t, loop, out) {\n    const c=meta[name], data=load(); if (!c) throw new Error('Unknown baked motion: '+name);\n    let f=t*30; if(loop){f%=(c.n-1);if(f<0)f+=c.n-1;}else f=clamp(f,0,c.n-1);\n    const i0=Math.floor(f), i1=Math.min(c.n-1,i0+1),u=f-i0,k=1/32767;\n    const a=c.o+i0*stride,b=c.o+i1*stride;\n    for(let j=0;j<NB;j++){const x=a+j*4,y=b+j*4;\n      qa.set(data[x]*k,data[x+1]*k,data[x+2]*k,data[x+3]*k).normalize();\n      qb.set(data[y]*k,data[y+1]*k,data[y+2]*k,data[y+3]*k).normalize();\n      out.q[j].slerpQuaternions(qa,qb,u).normalize();\n    }\n    out.h.set(data[a+88]+(data[b+88]-data[a+88])*u,data[a+89]+(data[b+89]-data[a+89])*u,data[a+90]+(data[b+90]-data[a+90])*u).multiplyScalar(1e-4);\n    return out;\n  }\n  // Register as additional clips without altering V53's reliable fallbacks.\n  const oldSample=Anim.sample,oldClip=Anim.clip;\n  Anim.sample=(name,t,loop,out)=>meta[name]?sample(name,t,loop,out):oldSample(name,t,loop,out);\n  Anim.clip=name=>meta[name]||oldClip(name);\n  return {clips:meta,has:name=>!!meta[name],sample};\n})();\n"""
 outfile=ROOT/'src/41-mixamo-animations.js';outfile.write_text(code,encoding='utf-8');(ROOT/'docs/V54-ANIMATION-SOURCES.json').write_text(json.dumps(info,indent=2))
 print('BAKED',len(clips),'clips',len(data),'base64 bytes',outfile)
if __name__=='__main__':main()
