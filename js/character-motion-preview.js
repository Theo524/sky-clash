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
 const mapper=root.SkyClashHumanoidRetarget?.create(T);
 if(!mapper)throw Error('V68 VRM retargeter failed to load; reload Animation Studio');
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
 function readRest(vrm){
  vrm.scene.updateMatrixWorld(true);const rest=new Map();
  for(const [src,key] of map){
   const node=bone(vrm,key);if(!node)continue;
   const world=node.getWorldQuaternion(new T.Quaternion());
   rest.set(src,{node,local:node.quaternion.clone(),world,position:node.getWorldPosition(new T.Vector3())});
  }
  for(const required of ['hips','leftarm','rightarm','leftforearm','rightforearm','lefthand','righthand','leftupleg','rightupleg']){
   if(!rest.has(required))throw Error('The VRM is missing a normalized '+required+' bone. Try another valid humanoid model.');
  }
  return rest;
 }
 async function load(fighter){
  if(current?.fighter===fighter)return current;
  if(loadPromise&&loaded===fighter)return loadPromise;
  const myKey=++loadKey;loaded=fighter;
  loadPromise=(async()=>{
   const candidate=fighter==='kairo' ? await root.SkyClashCharacterStore?.resolve() : null;
   if(fighter==='kairo'&&!candidate)throw Error('Kairo model missing from assets/characters/kairo.vrm on GitHub Pages.');
   const url=fighter==='rin'?'assets/rin.vrm':candidate.url;
   const resp=await fetch(url);if(!resp.ok)throw Error('Cannot load '+fighter+' model: '+resp.status);
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
  if(!current||!sourceRig)return {applied:0};
  const report=mapper.sample(sourceRig,current.rest,map,adjustYaw);
  if(report.applied<10)throw Error('Only '+report.applied+' VRM joints moved; check Mixamo humanoid track bindings');
  // VRM copies normalized humanoid motion to the actual skinned mesh bones.
  current.vrm.update(0);
  current.lastReport=report;
  return report;
 }
 function render(){resizeIfNeeded();renderer.render(scene,camera);}
 let lastSize='';function resizeIfNeeded(){const r=canvas.getBoundingClientRect(),size=Math.floor(r.width)+'x'+Math.floor(r.height);if(size!==lastSize){lastSize=size;resize();}}
 function orbit(dx){yaw+=dx*.011;cameraPose();}
 function zoomBy(d){zoom=Math.max(3,Math.min(8,zoom+d*.003));cameraPose();}
 return {load,sample,render,orbit,zoomBy,hasModel:()=>!!current,who:()=>current?.fighter,
    report:()=>current?.lastReport||null};
}
root.SkyClashCharacterMotionPreview={create};
})(typeof window!=='undefined'?window:globalThis);
