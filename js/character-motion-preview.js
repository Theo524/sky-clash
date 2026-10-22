/* Sky Clash V58 — isolated VRM character preview (never controls live gameplay).
 * Uses the bundled Three.js + VRMKit for original models, with numbered quaternion
 * transfers from the separate FBX preview module. No FBX or VRM files uploaded.
 */
(function(root){
'use strict';
const T=root.THREE;
function create(canvas){
 if(!T||!root.VRMKit)throw Error('Character preview libraries unavailable');
 const scene=new T.Scene();scene.background=new T.Color(0x111b2b);
 const camera=new T.PerspectiveCamera(38,1,.02,100);camera.position.set(0,2.35,5.1);camera.lookAt(0,1.2,0);
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(1.5,root.devicePixelRatio||1));renderer.outputColorSpace=T.SRGBColorSpace;
 scene.add(new T.HemisphereLight(0xd1ebff,0x303c51,2.1));
 const key=new T.DirectionalLight(0xffffff,2.3);key.position.set(-3,5,4);scene.add(key);
 const rim=new T.DirectionalLight(0x8fb7ff,1.3);rim.position.set(3,4,-4);scene.add(rim);
 const floor=new T.Mesh(new T.CircleGeometry(2.6,48),new T.MeshStandardMaterial({color:0x202f42,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.025;scene.add(floor);
 const grid=new T.GridHelper(5.1,18,0x44617a,0x2f4256);grid.position.y=-.015;scene.add(grid);
 const stage=new T.Group();scene.add(stage);
 let yaw=.22,zoom=5.1,current=null,loadKey=0,loaded=null,loadPromise=null;
 const qTmp1=new T.Quaternion(),qTmp2=new T.Quaternion(),qTmp3=new T.Quaternion(),qSrc=new T.Quaternion(),qParent=new T.Quaternion();
 const map=[
  ['hips','hips'],['spine','spine'],['spine1','chest'],['spine2','upperChest'],['neck','neck'],['head','head'],
  ['leftshoulder','leftShoulder'],['leftarm','leftUpperArm'],['leftforearm','leftLowerArm'],['lefthand','leftHand'],
  ['rightshoulder','rightShoulder'],['rightarm','rightUpperArm'],['rightforearm','rightLowerArm'],['righthand','rightHand'],
  ['leftupleg','leftUpperLeg'],['leftleg','leftLowerLeg'],['leftfoot','leftFoot'],
  ['rightupleg','rightUpperLeg'],['rightleg','rightLowerLeg'],['rightfoot','rightFoot']
 ];
 function cameraPose(){camera.position.set(Math.sin(yaw)*zoom,1.33+zoom*.18,Math.cos(yaw)*zoom);camera.lookAt(0,1.18,0);}
 function resize(){const r=canvas.getBoundingClientRect();const w=Math.max(250,Math.floor(r.width||440)),h=Math.max(220,Math.floor(r.height||350));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();cameraPose();}
 function clear(){if(current){stage.remove(current.vrm.scene);current=null;}}
 function bone(vrm,id){return vrm.humanoid?.getNormalizedBoneNode?.(id)||null;}
 function readRest(vrm){vrm.scene.updateMatrixWorld(true);const rest=new Map();for(const [src,key] of map){const node=bone(vrm,key);if(!node)continue;const world=node.getWorldQuaternion(new T.Quaternion());rest.set(src,{node,local:node.quaternion.clone(),world});}return rest;}
 async function load(fighter){
  if(current?.fighter===fighter)return current;
  if(loadPromise&&loaded===fighter)return loadPromise;
  const myKey=++loadKey;loaded=fighter;
  loadPromise=(async()=>{
   const resp=await fetch(fighter==='rin'?'assets/rin.vrm':'assets/fighter.vrm');if(!resp.ok)throw Error('Cannot load '+fighter+' model: '+resp.status);
   const bytes=await resp.arrayBuffer();
   const {GLTFLoader,VRMLoaderPlugin,VRMUtils}=root.VRMKit;
   const loader=new GLTFLoader();loader.register(p=>new VRMLoaderPlugin(p));
   const gltf=await new Promise((resolve,reject)=>loader.parse(bytes,'',resolve,reject));
   const vrm=gltf.userData.vrm;if(!vrm)throw Error('The model does not have a VRM humanoid rig');
   // Match Sky Clash's on-screen VRM0 orientation fix exactly.
   if(VRMUtils.rotateVRM0)VRMUtils.rotateVRM0(vrm);
   if(myKey!==loadKey){gltf.scene.traverse(o=>{if(o.isMesh)o.geometry?.dispose?.()});return null;}
   clear();stage.add(vrm.scene);
   const bb=new T.Box3().setFromObject(vrm.scene);const size=bb.getSize(new T.Vector3());
   if(!Number.isFinite(size.y)||size.y<=.01)throw Error('VRM bounds invalid');
   const modelScale=Math.min(5,2.35/size.y);vrm.scene.scale.multiplyScalar(modelScale);
   vrm.scene.position.y-=bb.min.y*modelScale;
   vrm.scene.updateMatrixWorld(true);
   const rest=readRest(vrm);
   current={fighter,vrm,rest,modelScale};
   return current;
  })();
  try{return await loadPromise;}catch(e){loaded=null;throw e;}finally{loadPromise=null;}
 }
 function sample(sourceRig,time,adjustYaw=0){
  if(!current||!sourceRig)return;
  const {vrm,rest}=current;
  // Always restore bind pose before applying the sampled frame; no cumulative drift.
  for(const rec of rest.values())rec.node.quaternion.copy(rec.local);
  vrm.scene.updateMatrixWorld(true);
  const srcHips=sourceRig.restWorld?.get('hips');const dstHips=rest.get('hips');
  if(!srcHips||!dstHips)return;
  const basis=dstHips.world.clone().multiply(qTmp1.copy(srcHips).invert());
  // Alternate orientation can be inspected via a user-facing yaw slider.
  basis.premultiply(qTmp2.setFromAxisAngle(new T.Vector3(0,1,0),adjustYaw*Math.PI/180));
  const basisInv=basis.clone().invert();
  for(const [src] of map){
   if(src==='hips')continue; // lock root translation/rotation for safe stationary evaluation
   const rec=rest.get(src),srcBone=sourceRig.bones.get(src),sourceRest=sourceRig.restWorld?.get(src);
   if(!rec||!srcBone||!sourceRest)continue;
   const q=srcBone.getWorldQuaternion(sourceRig.tempWorldQuat);
   const targetCurrentWorld=new T.Quaternion(q.x,q.y,q.z,q.w);
   const delta=targetCurrentWorld.multiply(qTmp2.copy(sourceRest).invert());
   const mapped=qTmp3.copy(basis).multiply(delta).multiply(basisInv);
   const worldWanted=mapped.clone().multiply(rec.world);
   const parentWorld=rec.node.parent.getWorldQuaternion(qParent);
   const localWanted=parentWorld.clone().invert().multiply(worldWanted).normalize();
   // Safety: huge retarget jumps usually mean incompatible axes. Cap relative rotation.
   const maxAngle=src.includes('arm')||src.includes('forearm')?2.3:src.includes('leg')||src.includes('foot')?1.9:1.35;
   const angle=rec.local.angleTo(localWanted);if(angle>maxAngle)localWanted.copy(rec.local).slerp(localWanted,maxAngle/angle);
   if(Number.isFinite(localWanted.x)&&Number.isFinite(localWanted.y)&&Number.isFinite(localWanted.z)&&Number.isFinite(localWanted.w))rec.node.quaternion.copy(localWanted);
   rec.node.updateMatrixWorld(true);
  }
  vrm.update(0);
 }
 function render(){resizeIfNeeded();renderer.render(scene,camera);}
 let lastSize='';function resizeIfNeeded(){const r=canvas.getBoundingClientRect(),size=Math.floor(r.width)+'x'+Math.floor(r.height);if(size!==lastSize){lastSize=size;resize();}}
 function orbit(dx){yaw+=dx*.011;cameraPose();}
 function zoomBy(d){zoom=Math.max(3,Math.min(8,zoom+d*.003));cameraPose();}
 return {load,sample,render,orbit,zoomBy,hasModel:()=>!!current,who:()=>current?.fighter};
}
root.SkyClashCharacterMotionPreview={create};
})(typeof window!=='undefined'?window:globalThis);
