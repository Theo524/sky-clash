/* Sky Clash Kairo Pose Lab v1.
 * Standalone authoring tool for the REAL Kairo normalized VRM0 skeleton.
 * Nothing here is imported by game.js or v66-game-boot.js. No live posing,
 * game root edits, timing hacks or competing Fighter.animate wrapper.
 */
(()=>{
'use strict';
const T=window.THREE,$=id=>document.getElementById(id);
const NAMES=['hips','spine','chest','upperChest','neck','head',
 'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
 'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
 'leftUpperLeg','leftLowerLeg','leftFoot',
 'rightUpperLeg','rightLowerLeg','rightFoot'];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const RAD=Math.PI/180,DEG=180/Math.PI;
let model=null,sha=null,nodes=[],base=[],keys=[],duration=1.2,
 time=0,selected='spine',playing=false,compare=false,ready=false;
const history=[],markers=[],markerPick=[];
let yaw=0,pitch=.14,zoom=4.35,down=null,last=0;
const status=(msg,error=false)=>{$('status').textContent=msg;$('status').classList.toggle('warning',error);};
function copyKeys(){return JSON.stringify(keys);}
function remember(){history.push(JSON.stringify({keys,duration}));if(history.length>35)history.shift();}
function clone(a){return JSON.parse(JSON.stringify(a));}
const scene=new T.Scene();scene.background=new T.Color(0x141f35);
const camera=new T.PerspectiveCamera(38,1,.04,100);
const renderer=new T.WebGLRenderer({canvas:$('modelView'),antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.outputColorSpace=T.SRGBColorSpace;renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
scene.add(new T.HemisphereLight(0xc7e0ff,0x32415b,2.2));
const light=new T.DirectionalLight(0xffffff,2.4);light.position.set(-3,6,4);scene.add(light);
const rim=new T.DirectionalLight(0x91b9ff,1.1);rim.position.set(4,4,-4);scene.add(rim);
const grid=new T.GridHelper(7,28,0x395c87,0x233956);grid.position.y=-.015;scene.add(grid);
const floor=new T.Mesh(new T.CircleGeometry(2.8,44),
 new T.MeshStandardMaterial({color:0x1e2c40,roughness:.92}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.027;scene.add(floor);
const guide=new T.Group();scene.add(guide);
const ray=new T.Raycaster(),pointer=new T.Vector2(),
 q1=new T.Quaternion(),q2=new T.Quaternion(),q3=new T.Quaternion(),eu=new T.Euler();
function hashToHex(bytes){return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
function namesOf(){return nodes.map(n=>n.name);}
function getNode(name){return nodes.find(n=>n.name===name)?.node||null;}
function angles(){
 const hip=getNode('hips'),neck=getNode('neck');
 const pt=n=>getNode(n)?.getWorldPosition(new T.Vector3())||null;
 const knee=side=>{
  const h=pt(side+'UpperLeg'),k=pt(side+'LowerLeg'),a=pt(side+'Foot');
  if(!h||!k||!a)return null;
  const x=k.clone().sub(h).normalize(),y=a.clone().sub(k).normalize();
  return +Math.acos(clamp(x.dot(y),-1,1))*DEG;
 };
 let torso=null;
 if(hip&&neck){
  const v=neck.getWorldPosition(new T.Vector3()).sub(hip.getWorldPosition(new T.Vector3()));
  torso=Math.atan2(Math.hypot(v.x,v.z),v.y)*DEG;
 }
 return {torso,leftKnee:knee('left'),rightKnee:knee('right')};
}
function poseRest(){
 if(!ready)return;
 nodes.forEach((b,i)=>b.node.quaternion.copy(base[i]));
 model.vrm.update(0);
 model.vrm.scene.updateMatrixWorld(true);
}
function rawFrame(label=''){
 return {time:+time.toFixed(3),name:label,
  quaternions:nodes.map(({node})=>node.quaternion.toArray().map(v=>+v.toFixed(7)))};
}
function apply(timeSeconds=time){
 if(!ready||compare)return;
 time=clamp(timeSeconds,0,duration);
 let lo=keys[0],hi=keys[keys.length-1];
 for(let i=0;i<keys.length;i++){
  if(keys[i].time<=time+1e-6)lo=keys[i];
  if(keys[i].time>=time-1e-6){hi=keys[i];break;}
 }
 const weight=hi.time===lo.time?0:clamp((time-lo.time)/(hi.time-lo.time),0,1);
 nodes.forEach(({node},i)=>{
  q1.fromArray(lo.quaternions[i]).normalize();
  q2.fromArray(hi.quaternions[i]).normalize();
  node.quaternion.slerpQuaternions(q1,q2,weight).normalize();
 });
 model.vrm.update(0);model.vrm.scene.updateMatrixWorld(true);
 updateReport();
}
function updateReport(){
 if(!ready)return;
 const a=angles(),v=n=>n===null?'n/a':n.toFixed(1)+'°';
 const kL=a.leftKnee,kR=a.rightKnee;
 $('report').textContent='Pelvis→neck: '+v(a.torso)+
  ' from upright\nLeft knee: '+v(kL)+' bend\nRight knee: '+v(kR)+
  ' bend\n'+((kL!==null&&kL<6)||(kR!==null&&kR<6)?
   '⚠ Very straight knee: inspect side view.':'Check knees and hip rotation from side view.');
 $('report').style.whiteSpace='pre-line';
}
function refreshSliders(){
 if(!ready)return;
 const bone=getNode(selected),i=nodes.findIndex(n=>n.name===selected);if(!bone||i<0)return;
 q1.copy(base[i]).invert().multiply(bone.quaternion);
 eu.setFromQuaternion(q1,'XYZ');
 for(const [id,v]of [['x',eu.x],['y',eu.y],['z',eu.z]]){
  const value=clamp(Math.round(v*DEG),-130,130);
  $(id).value=String(value);$(id+'Value').textContent=value+'°';
 }
}
function updateTime(){
 $('timeline').value=String(Math.round(time/duration*1000));
 $('time').textContent=time.toFixed(2)+'s';
 const f=keys.find(k=>Math.abs(k.time-time)<.007);
 $('note').value=f?.name||'';
 $('deleteKey').disabled=keys.length<=1||!f;
}
function updateMarkers(){
 const el=$('markers');el.replaceChildren();
 keys.forEach(f=>{
  const b=document.createElement('button');b.type='button';
  b.textContent=f.time.toFixed(2)+'s'+(f.name?' · '+f.name:'');
  b.classList.toggle('current',Math.abs(time-f.time)<.007);
  b.onclick=()=>seek(f.time);el.append(b);
 });
}
function seek(t){
 playing=false;$('play').textContent='▶ Play';compare=false;
 $('compare').textContent='Compare rest pose (A/B)';
 time=clamp(t,0,duration);apply(time);refreshSliders();updateTime();updateMarkers();
}
function keyAt(t){return keys.find(f=>Math.abs(f.time-t)<.007);}
function ensureKey(){
 let f=keyAt(time);
 if(f)return f;
 remember();
 f=rawFrame('');
 keys.push(f);keys.sort((a,b)=>a.time-b.time);
 updateMarkers();return f;
}
function saveKey(){
 if(!ready)return;
 const key=keyAt(time);if(!key){ensureKey();}
 else {remember();key.quaternions=rawFrame(key.name).quaternions;}
 const k=keyAt(time);k.name=$('note').value.trim().slice(0,55);
 updateMarkers();updateTime();status('Keyframe saved at '+time.toFixed(2)+'s. This is only in the editor.');
}
function setAxis(id){
 if(!ready||compare)return;
 if(playing){playing=false;$('play').textContent='▶ Play';}
 const k=ensureKey(),i=nodes.findIndex(n=>n.name===selected);if(i<0)return;
 remember();
 const x=Number($('x').value)*RAD,y=Number($('y').value)*RAD,z=Number($('z').value)*RAD;
 q1.copy(base[i]);
 q2.setFromEuler(new T.Euler(x,y,z,'XYZ'));
 q1.multiply(q2).normalize();
 k.quaternions[i]=q1.toArray().map(v=>+v.toFixed(7));
 apply(time);for(const a of ['x','y','z'])$(a+'Value').textContent=$(a).value+'°';
 updateMarkers();updateTime();
}
function undo(){
 if(!ready||!history.length)return;
 const last=JSON.parse(history.pop());
 duration=last.duration;keys=last.keys;$('duration').value=duration;
 seek(Math.min(time,duration));status('Reverted one editor change.');
}
function saveBlob(file,textOrBlob,mime='application/json'){
 const blob=textOrBlob instanceof Blob?textOrBlob:new Blob([textOrBlob],{type:mime});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=file;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function exportData(){
 if(!ready)return null;
 return {schema:'sky-clash.pose-lab.v1',version:1,
  fighter:'kairo_venn',modelPath:'assets/characters/kairo.vrm',
  modelSha256:sha,rig:'vrm0-normalized-bones',unit:'local quaternion xyzw',
  source:'hand-authored on real Kairo VRM0 in isolated Pose Lab; NOT gameplay-approved',
  bones:namesOf(),duration,interpolation:'quaternion-slerp',
  keyframes:clone(keys)};
}
/* Assistant-only authoring method: rotate normalized joints around an
 * explicit WORLD-space axis, then bake their exact LOCAL quaternions once.
 * Unlike gameplay's V100 solver this runs only in isolated Pose Lab and
 * never executes on the live character.
 */
function authorWorldPose(spec){
 if(!ready||!model)throw Error('Kairo VRM is not ready');
 const t=Number(spec?.time),name=String(spec?.name||'Candidate').slice(0,55);
 if(!Number.isFinite(t)||t<=0||t>duration)
  throw Error('Target time must be within (0, clip duration]');
 const reference=keys[0];
 if(!reference?.quaternions?.length||reference.quaternions.length!==nodes.length)
  throw Error('Load a verified real Kairo reference pose before authoring');
 const axes={right:new T.Vector3(1,0,0),
  up:new T.Vector3(0,1,0),forward:new T.Vector3(0,0,1)};
 const ops=spec?.rotations||[];
 if(!Array.isArray(ops)||ops.length>25)throw Error('Invalid joint operations');
 if(ops.some(o=>!nodes.some(n=>n.name===o.bone)||!axes[o.axis]||
  !Number.isFinite(o.degrees)||Math.abs(o.degrees)>90))
  throw Error('Uncalibrated bone/axis/rotation request');
 playing=false;compare=false;
 nodes.forEach((b,i)=>b.node.quaternion.fromArray(reference.quaternions[i]).normalize());
 model.vrm.update(0);model.vrm.scene.updateMatrixWorld(true);
 for(const o of ops){
  const node=getNode(o.bone);
  const parentW=node.parent.getWorldQuaternion(new T.Quaternion());
  const deltaWorld=new T.Quaternion().setFromAxisAngle(axes[o.axis],o.degrees*RAD);
  const localDelta=parentW.clone().invert().multiply(deltaWorld).multiply(parentW);
  node.quaternion.premultiply(localDelta).normalize();
  model.vrm.update(0);model.vrm.scene.updateMatrixWorld(true);
 }
 time=t;
 const frame=rawFrame(name);
 // Keep exact V152 starting key; replace only authoring candidates at t.
 keys=keys.filter(k=>Math.abs(k.time-t)>.001&&k.time<t-.001);
 keys.push(frame);keys.sort((a,b)=>a.time-b.time);
 apply(t);refreshSliders();updateTime();updateMarkers();
 return {data:exportData(),metrics:flightGeometry(),name};
}
function flightGeometry(){
 if(!ready)return null;
 model.vrm.update(0);model.vrm.scene.updateMatrixWorld(true);
 const point=n=>getNode(n)?.getWorldPosition(new T.Vector3())||null,
  trunkA=point('hips'),trunkB=point('neck'),
  neck=point('neck'),head=point('head');
 const direction=a=>a?.lengthSq()>1e-8?a.clone().normalize():null;
 const trunk=trunkA&&trunkB?direction(trunkB.sub(trunkA)):null;
 const neckline=neck&&head?direction(head.clone().sub(neck)):null;
 const headNode=getNode('head');
 const face=headNode?
  new T.Vector3(0,0,1).applyQuaternion(headNode.getWorldQuaternion(new T.Quaternion())).normalize():null;
 const deg=v=>v===null?null:+v.toFixed(2);
 const pitch=v=>v?Math.atan2(v.z,v.y)*DEG:null;
 return {...angles(),
  trunkPitch:deg(pitch(trunk)),
  headSegmentPitch:deg(pitch(neckline)),
  facialAxisToHorizontal:face?deg(Math.atan2(face.y,Math.hypot(face.x,face.z))*DEG):null,
  headVsTorsoAngle:trunk&&neckline?deg(trunk.angleTo(neckline)*DEG):null,
  chestPosition:point('chest')?.toArray().map(v=>+v.toFixed(4)),
  noseDirection:face?.toArray().map(v=>+v.toFixed(4))
 };
}
function validFile(data){
 if(data?.schema!=='sky-clash.pose-lab.v1'||data?.version!==1||
  data.modelSha256!==sha||data.fighter!=='kairo_venn'||
  data.unit!=='local quaternion xyzw'||JSON.stringify(data.bones)!==JSON.stringify(namesOf()))
  throw Error('This file does not match the exact verified Kairo VRM and normalized rig.');
 if(!Number.isFinite(data.duration)||data.duration<.3||data.duration>12)
  throw Error('Invalid clip duration.');
 if(!Array.isArray(data.keyframes)||data.keyframes.length<1||data.keyframes.length>60)
  throw Error('Animation needs 1–60 valid keyframes.');
 let previous=-1;
 for(const frame of data.keyframes){
  if(!Number.isFinite(frame.time)||frame.time<0||frame.time>data.duration||
    frame.time<=previous+.0005)throw Error('Keyframes must be ordered and have distinct valid times.');
  previous=frame.time;
  if(typeof frame.name!=='string'||frame.name.length>55||
   !Array.isArray(frame.quaternions)||frame.quaternions.length!==nodes.length)
   throw Error('Invalid keyframe label or bone count.');
  for(const q of frame.quaternions){
   if(!Array.isArray(q)||q.length!==4||q.some(n=>!Number.isFinite(n)||Math.abs(n)>1.001)||
     Math.abs(Math.hypot(...q)-1)>.004)throw Error('Invalid VRM joint quaternion.');
  }
 }
}
function view(angle){
 yaw=angle;pitch=.14;cameraPose();
}
function cameraPose(){
 const radius=zoom;camera.position.set(Math.sin(yaw)*radius*Math.cos(pitch),
  1.25+radius*Math.sin(pitch),Math.cos(yaw)*radius*Math.cos(pitch));
 camera.lookAt(0,1.24,0);
}
function layout(){
 const rect=$('modelView').getBoundingClientRect(),w=Math.max(220,Math.floor(rect.width)),
 h=Math.max(220,Math.floor(rect.height));if(renderer.domElement.width!==Math.round(w*renderer.getPixelRatio())||
 renderer.domElement.height!==Math.round(h*renderer.getPixelRatio())){
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 }
}
function updateJoints(){
 if(!ready)return;
 for(const {name,mesh} of markers){
  const node=getNode(name);
  mesh.position.copy(node.getWorldPosition(new T.Vector3()));
  mesh.material.color.set(name===selected?0xffd98b:0x5ab4fd);
  mesh.visible=$('showJoints').checked;
 }
}
function pick(x,y){
 const rect=$('modelView').getBoundingClientRect();
 pointer.x=(x-rect.left)/rect.width*2-1;
 pointer.y=-(y-rect.top)/rect.height*2+1;
 ray.setFromCamera(pointer,camera);
 const hits=ray.intersectObjects(markerPick,false);
 if(hits.length){
  selected=hits[0].object.userData.bone;
  $('bone').value=selected;refreshSliders();
 }
}
function render(ts){
 if(last&&playing&&ready&&!compare){
  time+=Math.min(.07,(ts-last)/1000);
  if(time>duration)time=time%duration;
  apply(time);refreshSliders();updateTime();updateMarkers();
 }
 last=ts;
 if(ready){model.vrm.update(0);model.vrm.scene.updateMatrixWorld(true);updateJoints();}
 layout();renderer.render(scene,camera);
 requestAnimationFrame(render);
}
async function load(){
 try{
  if(!T||!window.VRMKit)throw Error('Three.js or VRMKit failed to load.');
  const path='assets/characters/kairo.vrm';
  const response=await fetch(path,{cache:'force-cache'});
  if(!response.ok)throw Error('Could not load '+path+' (HTTP '+response.status+').');
  const bytes=await response.arrayBuffer();
  sha=hashToHex(await crypto.subtle.digest('SHA-256',bytes));
  const {GLTFLoader,VRMLoaderPlugin,VRMUtils}=window.VRMKit;
  const loader=new GLTFLoader();loader.register(p=>new VRMLoaderPlugin(p));
  const gltf=await new Promise((resolve,reject)=>loader.parse(bytes,'',resolve,reject));
  const vrm=gltf.userData.vrm;if(!vrm?.humanoid)throw Error('Invalid VRM humanoid.');
  if(VRMUtils.rotateVRM0)VRMUtils.rotateVRM0(vrm);
  scene.add(vrm.scene);
  const bbox=new T.Box3().setFromObject(vrm.scene),height=bbox.getSize(new T.Vector3()).y;
  if(!Number.isFinite(height)||height<=.01)throw Error('Model has invalid bounds.');
  const scale=clamp(2.35/height,.1,5);
  vrm.scene.scale.multiplyScalar(scale);vrm.scene.position.y-=bbox.min.y*scale;
  vrm.scene.updateMatrixWorld(true);
  nodes=NAMES.map(name=>({name,node:vrm.humanoid.getNormalizedBoneNode(name)})).filter(x=>!!x.node);
  if(nodes.length<18||!nodes.some(n=>n.name==='hips')||!nodes.some(n=>n.name==='neck'))
   throw Error('This Kairo VRM is missing required normalized humanoid joints.');
  base=nodes.map(x=>x.node.quaternion.clone());model={vrm};
  for(const b of nodes){
   const option=document.createElement('option');option.textContent=b.name;
   option.value=b.name;$('bone').append(option);
   const marker=new T.Mesh(new T.SphereGeometry(.045,10,8),
    new T.MeshBasicMaterial({color:0x5ab4fd,depthTest:false,transparent:true,opacity:.85}));
   marker.userData.bone=b.name;marker.renderOrder=10;guide.add(marker);
   markers.push({name:b.name,mesh:marker});markerPick.push(marker);
  }
  selected=namesOf().includes('spine')?'spine':nodes[0].name;$('bone').value=selected;
  ready=true;poseRest();time=0;keys=[rawFrame('Start')];
  time=duration;keys.push(rawFrame('End'));time=0;
  apply(0);refreshSliders();updateMarkers();updateTime();
  status('Real Kairo VRM0 loaded • '+nodes.length+' normalized bones • SHA-256 '+sha.slice(0,12)+'…');
  window.SkyClashPoseLab={get ready(){return ready;},get modelHash(){return sha;},
   get keyframeCount(){return keys.length;},get motion(){return exportData();},
   get metrics(){return angles();},get flightGeometry(){return flightGeometry();},
   authorWorldPose,seek};
 }catch(err){status('Pose Lab could not load: '+(err?.message||err),true);console.error(err);}
}
for(const b of document.querySelectorAll('[data-view]')){
 b.addEventListener('click',()=>view({front:0,side:Math.PI/2,back:Math.PI}[b.dataset.view]));
}
$('bone').addEventListener('change',()=>{selected=$('bone').value;refreshSliders();});
for(const id of ['x','y','z'])$(id).addEventListener('input',()=>setAxis(id));
$('timeline').addEventListener('input',()=>seek(Number($('timeline').value)/1000*duration));
$('play').addEventListener('click',()=>{if(!ready)return;compare=false;
 playing=!playing;$('play').textContent=playing?'❚❚ Pause':'▶ Play';
 $('compare').textContent='Compare rest pose (A/B)';});
$('addKey').addEventListener('click',saveKey);
$('saveKey').addEventListener('click',saveKey);
$('deleteKey').addEventListener('click',()=>{
 if(!ready||keys.length<=1||!keyAt(time))return;
 remember();keys=keys.filter(k=>Math.abs(k.time-time)>=.007);seek(time);
});
$('resetBone').addEventListener('click',()=>{
 if(!ready||compare)return;
 const k=ensureKey(),i=nodes.findIndex(n=>n.name===selected);
 remember();k.quaternions[i]=base[i].toArray();apply(time);refreshSliders();
});
$('undo').addEventListener('click',undo);
$('duration').addEventListener('change',()=>{
 if(!ready)return;
 const seconds=Number($('duration').value);
 if(!Number.isFinite(seconds)||seconds<.3||seconds>12){
  $('duration').value=duration;return;
 }
 remember();const ratio=seconds/duration;keys.forEach(k=>k.time=+(k.time*ratio).toFixed(4));
 time*=ratio;duration=seconds;seek(time);
});
$('loadHover').addEventListener('click',async()=>{
 if(!ready)return;
 try{
  const response=await fetch('assets/animations/reference/kairo-v152-hover.pose.json',
   {cache:'no-cache'});
  if(!response.ok)throw Error('V152 captured reference not published yet (HTTP '+response.status+').');
  const data=await response.json();validFile(data);
  remember();keys=clone(data.keyframes);duration=data.duration;
  $('duration').value=String(duration);seek(0);
  status('Loaded exact V152 in-game hover joint pose. Now pose only the movement you want to change.');
 }catch(err){status('Cannot load V152 reference: '+err.message,true);}
});
$('resetAll').addEventListener('click',()=>{
 if(!ready||!confirm('Clear ALL keyframes and start a blank rest-pose clip?'))return;
 remember();playing=false;compare=false;poseRest();time=0;keys=[rawFrame('Start')];
 time=duration;keys.push(rawFrame('End'));seek(0);
});
$('compare').addEventListener('click',()=>{
 if(!ready)return;
 playing=false;$('play').textContent='▶ Play';compare=!compare;
 if(compare){poseRest();$('compare').textContent='Show edited pose';}
 else{$('compare').textContent='Compare rest pose (A/B)';apply(time);refreshSliders();}
});
$('snapshot').addEventListener('click',()=>{
 if(!ready)return;
 layout();renderer.render(scene,camera);
 renderer.domElement.toBlob(blob=>{
  if(blob)saveBlob('kairo-pose-'+time.toFixed(2).replace('.','-')+'.png',blob);
  else status('Browser could not capture PNG.',true);
 },'image/png');
});
$('export').addEventListener('click',()=>{
 if(!ready)return;
 saveBlob('kairo-pose-keyframes-v1.json',JSON.stringify(exportData(),null,2));
 status('Exported exact Kairo quaternion keyframes. They are not installed into the game.');
});
$('import').addEventListener('click',()=>{$('fileImport').click();});
$('fileImport').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';
 if(!file||!ready)return;
 try{
  if(file.size>500000)throw Error('Pose JSON exceeds 500 KB.');
  const data=JSON.parse(await file.text());validFile(data);
  remember();keys=clone(data.keyframes);duration=data.duration;
  $('duration').value=String(duration);seek(0);
  status('Imported '+keys.length+' Kairo frames for the exact matching VRM.');
 }catch(err){status('Import rejected: '+err.message,true);}
});
$('modelView').addEventListener('pointerdown',e=>{
 down={x:e.clientX,y:e.clientY,yaw,pitch,drag:false};
 $('modelView').setPointerCapture(e.pointerId);
});
$('modelView').addEventListener('pointermove',e=>{
 if(!down)return;
 const dx=e.clientX-down.x,dy=e.clientY-down.y;
 if(Math.hypot(dx,dy)>5)down.drag=true;
 if(down.drag){yaw=down.yaw+dx*.008;
  pitch=clamp(down.pitch+dy*.006,-.58,.85);cameraPose();}
});
$('modelView').addEventListener('pointerup',e=>{
 if(down&&!down.drag&&ready)pick(e.clientX,e.clientY);down=null;
});
$('modelView').addEventListener('pointercancel',()=>{down=null;});
$('modelView').addEventListener('wheel',e=>{
 e.preventDefault();zoom=clamp(zoom+e.deltaY*.004,2.1,8);cameraPose();
},{passive:false});
window.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){
  e.preventDefault();undo();
 }
});
cameraPose();requestAnimationFrame(render);load();
})();