/* Sky Clash V57 / Animation Studio.
 * FBX and ZIP import stays entirely in the user's browser. Three.js and FBXLoader
 * are imported as an isolated r158 ES module — the live game's renderer is never touched.
 * Preview stick figure uses bone world transforms, NOT the unreliable VRM0 retargeting.
 */
import * as THREE from 'three';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/FBXLoader.js';

const Core=window.SkyClashStudioCore;
const $=id=>document.getElementById(id);
const loader=new FBXLoader();
const PAGE_SIZE=16;
const MAX_FILES=500;
const MAX_FBX_BYTES=30*1024*1024;
const MAX_ZIP_BYTES=350*1024*1024;
const STATE_KEY='skyClashV57AnimationSelections';
const imported=[];
const seen=new Set();
let current=null, page=0, filtering=[], cancelled=false, indexing=false;
let isPlaying=true, rate=1, currentT=0, mainRig=null, selectedLoadToken=0;
const workQueue=[];let busy=false;
let activeHovered=null, activeFrames=[];
const fps=7;
let lastSwap=0;

function marksLoad(){try{const raw=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');return raw&&typeof raw==='object'?raw:{}}catch{return {}}}
let marks=marksLoad();
function saveMarks(){try{localStorage.setItem(STATE_KEY,JSON.stringify(marks))}catch(e){setStatus('Browser storage unavailable. Export your selections to keep them.')}}
function mark(item,key,force){if(!item)return;const m=Core.marksFor(marks,item.id);m[key]=typeof force==='boolean'?force:!m[key];marks[item.id]=m;saveMarks();updateSelectionUI();refreshGrid();}
function setStatus(msg){$('loadStatus').textContent=msg;}
function progress(p){const el=$('loadProgress');el.style.display=p==null?'none':'block';if(p!=null)el.firstElementChild.style.width=Math.round(Math.max(0,Math.min(100,p)))+'%';}
const delay=()=>new Promise(ok=>requestAnimationFrame(ok));
const niceSec=t=>Number.isFinite(t)?t.toFixed(2)+'s':'—';
const shortName=x=>x.length>36?x.slice(0,33)+'…':x;

function addEntry({file,zipEntry,origin,name,size,crc}){
 if(imported.length>=MAX_FILES)return false;
 if(!/\.fbx$/i.test(name))return false;
 const id=Core.makeId(origin,name,size,crc);
 if(seen.has(id))return false;
 seen.add(id);
 const clip={id,origin,fileName:name,name:Core.displayName(name),size,crc,category:Core.category(name),file,zipEntry,frames:null,card:null,error:null,duration:null,boneCount:null,prepared:false};
 imported.push(clip);
 return true;
}
async function importFiles(files){
 if(!files.length)return;
 if(indexing){setStatus('Finish the current ZIP import first, or stop preview processing.');return;}
 indexing=true;cancelled=false;
 let added=0,skipped=0;
 $('cancelLoad').hidden=false;
 for(const file of files){
  if(cancelled)break;
  try{
   if(/\.fbx$/i.test(file.name)){
     if(file.size>MAX_FBX_BYTES){skipped++;continue;}
     if(addEntry({file,origin:'Loose FBX',name:file.name,size:file.size,crc:file.lastModified}))added++;
   }else if(/\.zip$/i.test(file.name)){
     if(file.size>MAX_ZIP_BYTES){setStatus(file.name+' is too large to unpack safely in your browser.');skipped++;continue;}
     setStatus('Reading '+file.name+'…');await delay();
     const zip=await window.JSZip.loadAsync(file,{checkCRC32:false});
     const entries=Object.values(zip.files).filter(e=>!e.dir&&/\.fbx$/i.test(e.name));
     for(const ent of entries){
       if(imported.length>=MAX_FILES){skipped+=entries.length;break;}
       const size=ent._data?.uncompressedSize||0;
       if(size>MAX_FBX_BYTES){skipped++;continue;}
       if(addEntry({zipEntry:ent,origin:file.name,name:ent.name,size,crc:ent._data?.crc32||''}))added++;
     }
   }else skipped++;
  }catch(e){console.warn('Could not open',file.name,e);setStatus('Could not read '+file.name+': '+e.message);skipped++;}
  await delay();
 }
 indexing=false;$('cancelLoad').hidden=true;
 setStatus('Imported '+added+' animations'+(skipped?' · '+skipped+' skipped':'')+'. Browse the moving previews below.');
 page=0;applyFilter();
}
async function bufferFor(item){
 if(item.file)return await item.file.arrayBuffer();
 if(item.zipEntry){const bytes=await item.zipEntry.async('uint8array');return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);}
 throw Error('File not available in this browser session');
}
function norm(name){return String(name).split(':').pop().replace(/[^a-zA-Z0-9]/g,'').toLowerCase().replace(/^mixamorig\d*/,'');}
const BONE_CHAINS=[
 ['hips','spine','spine1','spine2','neck','head'],
 ['spine2','leftshoulder','leftarm','leftforearm','lefthand'],
 ['spine2','rightshoulder','rightarm','rightforearm','righthand'],
 ['hips','leftupleg','leftleg','leftfoot','lefttoebase'],
 ['hips','rightupleg','rightleg','rightfoot','righttoebase']
];
const v1=new THREE.Vector3(),v2=new THREE.Vector3(),v3=new THREE.Vector3();
function makeStage(canvas,thumb){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x101a29);
 const camera=new THREE.PerspectiveCamera(37,1,0.02,200);
 const rigCenter=new THREE.Group();scene.add(rigCenter);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(2.3,48),new THREE.MeshBasicMaterial({color:0x203549,transparent:true,opacity:.65,depthWrite:false}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);
 const grid=new THREE.GridHelper(4,18,0x354f67,0x253348);grid.position.y=-.01;scene.add(grid);
 scene.add(new THREE.HemisphereLight(0xc2eeff,0x354259,2));
 const renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:!thumb,preserveDrawingBuffer:thumb,powerPreference:'low-power'});
 renderer.setPixelRatio(thumb?1:Math.min(1.75,window.devicePixelRatio||1));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 const stage={scene,camera,renderer,rigCenter,thumb,yaw:.22,zoom:thumb?4.6:5.2,radius:2.4,loaded:null};
 resizeStage(stage);return stage;
}
function resizeStage(stage){
 const width=stage.thumb?176:Math.max(240,Math.floor(stage.renderer.domElement.clientWidth||540));
 const height=stage.thumb?126:Math.max(200,Math.floor(stage.renderer.domElement.clientHeight||340));
 stage.renderer.setSize(width,height,false);stage.camera.aspect=width/height;stage.camera.updateProjectionMatrix();
 cameraPose(stage);
}
function cameraPose(stage){const {camera,yaw,zoom}=stage;camera.position.set(Math.sin(yaw)*zoom,1.3+zoom*.18,Math.cos(yaw)*zoom);camera.lookAt(0,1.17,0);}
function cleanupRig(stage){
 if(!stage.loaded)return;
 const rig=stage.loaded;rig.mixer?.stopAllAction();stage.rigCenter.remove(rig.wrap);
 rig.wrap.traverse(o=>{if(o.geometry&&o.userData.studioOwned)o.geometry.dispose();if(o.material&&o.userData.studioOwned){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});
 stage.loaded=null;
}
function poseRig(stage,time,allowTravel=false){
 const rig=stage.loaded;if(!rig)return;
 rig.mixer.setTime(Math.max(0,time));
 if(rig.hips&&!allowTravel){rig.hips.position.x=rig.initialHipX;rig.hips.position.z=rig.initialHipZ;}
 rig.wrap.updateMatrixWorld(true);
 for(const seg of rig.segments){
   seg.from.getWorldPosition(v1);seg.to.getWorldPosition(v2);
   rig.wrap.worldToLocal(v1);rig.wrap.worldToLocal(v2);
   const len=Math.max(.001,v1.distanceTo(v2));
   seg.mesh.position.copy(v1).add(v2).multiplyScalar(.5);
   seg.mesh.quaternion.setFromUnitVectors(rig.yAxis,v3.copy(v2).sub(v1).normalize());
   seg.mesh.scale.set(seg.width,len,seg.width);
 }
 for(const joint of rig.joints){joint.bone.getWorldPosition(v1);rig.wrap.worldToLocal(v1);joint.mesh.position.copy(v1);}
 rig.wrap.updateMatrixWorld(true);
}
function setupRig(stage,fbx){
 cleanupRig(stage);
 const clip=fbx.animations?.find(c=>Number.isFinite(c.duration)&&c.duration>0.001);
 if(!clip)throw Error('This FBX has no playable animation track');
 const wrap=new THREE.Group();stage.rigCenter.add(wrap);wrap.add(fbx);
 // Source FBX meshes are not required (Mixamo exports are often 'Without Skin').
 // Keeping a consistent diagnostic mannequin makes every clip comparable.
 fbx.traverse(o=>{if(o.isMesh||o.isLine)o.visible=false;});
 const bones=new Map();fbx.traverse(o=>{if(o.isBone){const key=norm(o.name);if(key&&!bones.has(key))bones.set(key,o);}});
 if(bones.size<8){stage.rigCenter.remove(wrap);throw Error('Cannot locate a Mixamo humanoid skeleton in this FBX');}
 const mixer=new THREE.AnimationMixer(fbx);mixer.clipAction(clip).play();mixer.setTime(0);
 const hips=bones.get('hips');const initialHipX=hips?.position.x||0,initialHipZ=hips?.position.z||0;
 wrap.updateMatrixWorld(true);
 const pts=[...bones.values()].filter(b=>!(/thumb|index|middle|ring|pinky|toeend/i).test(norm(b.name))).map(b=>b.getWorldPosition(new THREE.Vector3()));
 const lo=Math.min(...pts.map(v=>v.y)),hi=Math.max(...pts.map(v=>v.y));
 const rigHeight=hi-lo;
 if(!Number.isFinite(rigHeight)||rigHeight<.01||rigHeight>100000){stage.rigCenter.remove(wrap);throw Error('Humanoid rig bounds are invalid');}
 const s=2.33/rigHeight;fbx.scale.multiplyScalar(s);
 wrap.updateMatrixWorld(true);
 const newLow=Math.min(...pts.map((p,i)=>[...bones.values()].filter(b=>!(/thumb|index|middle|ring|pinky|toeend/i).test(norm(b.name)))[i].getWorldPosition(new THREE.Vector3()).y));
 fbx.position.y+=.045-newLow;
 wrap.updateMatrixWorld(true);
 const mats={body:new THREE.MeshStandardMaterial({color:0x9de5d4,metalness:.12,roughness:.65}),left:new THREE.MeshStandardMaterial({color:0xd0b7ff,metalness:.10,roughness:.7}),right:new THREE.MeshStandardMaterial({color:0xa6deff,metalness:.1,roughness:.7}),head:new THREE.MeshStandardMaterial({color:0xf8cda2,metalness:.1,roughness:.65})};
 const segmentGeometry=new THREE.CylinderGeometry(1,1,1,8,1);
 const jointGeo=new THREE.SphereGeometry(1,10,8);
 const segments=[],joints=[];
 const traced=new Set();
 for(const chain of BONE_CHAINS){for(let i=1;i<chain.length;i++){
   const from=bones.get(chain[i-1]),to=bones.get(chain[i]);if(!from||!to)continue;
   const key=chain[i-1]+'-'+chain[i];if(traced.has(key))continue;traced.add(key);
   const mat=chain[i].startsWith('left')?mats.left:chain[i].startsWith('right')?mats.right:mats.body;
   const mesh=new THREE.Mesh(segmentGeometry,mat);mesh.userData.studioOwned=false;wrap.add(mesh);
   segments.push({from,to,mesh,width:chain[i].includes('leg')?.075:chain[i].includes('arm')?.068:.088});
 }}
 for(const key of ['hips','spine2','head','leftshoulder','rightshoulder','leftarm','rightarm','leftforearm','rightforearm','lefthand','righthand','leftupleg','rightupleg','leftleg','rightleg','leftfoot','rightfoot']){
   const bone=bones.get(key);if(!bone)continue;
   const mat=key==='head'?mats.head:key.startsWith('left')?mats.left:key.startsWith('right')?mats.right:mats.body;
   const mesh=new THREE.Mesh(jointGeo,mat);mesh.scale.setScalar(key==='head'?.155:key==='hips'?.11:.07);wrap.add(mesh);joints.push({bone,mesh});
 }
 if(!segments.length){stage.rigCenter.remove(wrap);throw Error('Bone hierarchy not recognized');}
 const rig={wrap,fbx,mixer,clip,bones,hips,initialHipX,initialHipZ,segments,joints,yAxis:new THREE.Vector3(0,1,0),geometries:[segmentGeometry,jointGeo],materials:Object.values(mats)};
 stage.loaded=rig;poseRig(stage,0,false);
 return rig;
}
function disposeSetup(stage){if(!stage?.loaded)return;const r=stage.loaded;cleanupRig(stage);for(const g of r.geometries)g.dispose();for(const m of r.materials)m.dispose();}
function render(stage){stage.renderer.render(stage.scene,stage.camera);}
const mainStage=makeStage($('viewer'),false);
const thumbCanvas=document.createElement('canvas');thumbCanvas.width=176;thumbCanvas.height=126;
const thumbStage=makeStage(thumbCanvas,true);
function loadingOverlay(str){$('viewerOverlay').textContent=str;$('viewerOverlay').hidden=false;}
function hideOverlay(){$('viewerOverlay').hidden=true;}

function visiblePage(){return filtering.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);}
function enqueueThumbnail(item){if(item.prepared||item.error||workQueue.includes(item)||cancelled)return;workQueue.push(item);processQueue();}
async function processQueue(){
 if(busy)return;busy=true;
 while(workQueue.length){
  const item=workQueue.shift();
  if(cancelled){workQueue.length=0;break;}
  if(!item||item.prepared||item.error)continue;
  if(!visiblePage().includes(item))continue;
  try{
   await delay();
   const input=await bufferFor(item);
   const object=loader.parse(input,'');
   const rig=setupRig(thumbStage,object);
   item.duration=rig.clip.duration;item.boneCount=rig.bones.size;
   const nFrames=8,frames=[];
   for(let i=0;i<nFrames;i++){
     const t=rig.clip.duration*(i+.22)/nFrames;
     poseRig(thumbStage,t,false);render(thumbStage);
     frames.push(thumbCanvas.toDataURL('image/webp',.65));
   }
   item.frames=frames;item.prepared=true;
   disposeSetup(thumbStage);
  }catch(e){console.warn('FBX preview failed:',item.fileName,e);item.error=e?.message||'Preview failed';disposeSetup(thumbStage);}
  updateCard(item);updateStats();
  await delay();
 }
 busy=false;
}
const observer=new IntersectionObserver(entries=>{
 for(const x of entries)if(x.isIntersecting){const item=x.target.__item;if(item)enqueueThumbnail(item);}
},{root:null,rootMargin:'260px',threshold:0.01});
function updateCard(item){const card=item.card;if(!card||!card.isConnected)return;
 const img=card.querySelector('img');if(item.frames?.length){img.src=item.frames[0];img.classList.remove('is-pending');}
 const err=card.querySelector('.clip-failure');if(err)err.textContent=item.error?'Preview failed: '+shortName(item.error):'';
 const meta=card.querySelector('.clip-meta');if(meta)meta.lastElementChild.textContent=item.duration?niceSec(item.duration):item.error?'Unavailable':'Processing…';
}
function updateStats(){const done=imported.filter(x=>x.prepared).length,errors=imported.filter(x=>x.error).length;
 $('processedCount').textContent=imported.length?`${done} ready · ${errors} need attention`:'';
 const pending=imported.length-done-errors;
 progress(pending&&imported.length?100*(done+errors)/imported.length:null);
}
function refreshGrid(){
 const grid=$('clipGrid');grid.querySelectorAll('.clip-card').forEach(c=>observer.unobserve(c));grid.textContent='';
 const pageClips=visiblePage();
 for(const item of pageClips){
  const b=document.createElement('button');b.type='button';b.className='clip-card'+(item===current?' is-selected':'');b.draggable=true;b.__item=item;
  const img=document.createElement('img');img.className='clip-image is-pending';img.alt='Preview of '+item.name;img.loading='lazy';
  // Built-in placeholder rather than fetching thumbnails from external CDNs.
  img.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="176" height="126"><rect width="176" height="126" fill="#172337"/><path d="M73 32l17 11 19-11 M90 43l-3 32-14 27 M87 75l17 27" fill="none" stroke="#6395a4" stroke-width="8" stroke-linecap="round"/><circle cx="90" cy="20" r="11" fill="#6395a4"/></svg>');
  const sym=document.createElement('span');sym.className='preview-symbol';sym.textContent='▶ LOOP';
  const details=document.createElement('div');details.className='clip-details';
  const name=document.createElement('span');name.className='clip-name';name.textContent=item.name;
  const meta=document.createElement('div');meta.className='clip-meta';
  const ct=document.createElement('span');ct.textContent=item.category;
  const sec=document.createElement('span');sec.textContent=item.duration?niceSec(item.duration):item.error?'Unavailable':'Processing…';meta.append(ct,sec);
  const tags=document.createElement('div');tags.className='clip-labels';
  const m=Core.marksFor(marks,item.id);
  for(const [key,label] of [['kairo','KAIRO'],['rin','RIN'],['saved','★']])if(m[key]){const labelEl=document.createElement('span');labelEl.textContent=label;labelEl.className=key;tags.appendChild(labelEl);}
  details.append(name,meta,tags);const err=document.createElement('div');err.className='clip-failure';
  b.append(img,sym,details,err);
  b.addEventListener('click',()=>select(item));
  b.addEventListener('dragstart',e=>{e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/plain',item.id);});
  item.card=b;grid.appendChild(b);updateCard(item);observer.observe(b);
 }
 $('emptyLibrary').hidden=imported.length>0;
 $('pageControls').hidden=filtering.length<=PAGE_SIZE;
 $('pageInfo').textContent=`Page ${page+1} of ${Math.max(1,Math.ceil(filtering.length/PAGE_SIZE))}`;
 $('prevPage').disabled=page===0;$('nextPage').disabled=(page+1)*PAGE_SIZE>=filtering.length;
 $('clipCount').textContent=filtering.length;
}
function applyFilter(){const q=$('search').value,category=$('category').value,tag=$('tagFilter').value;filtering=imported.filter(i=>Core.match(i,q,category,tag,marks));page=Math.min(page,Math.max(0,Math.ceil(filtering.length/PAGE_SIZE)-1));refreshGrid();updateStats();}

async function select(item){
 current=item;currentT=0;isPlaying=true;
 const token=++selectedLoadToken;
 refreshGrid();updateSelectionUI();
 $('selectedTitle').textContent=item.name;
 $('selectedMeta').textContent=`${item.origin} · ${item.fileName} · ${(item.size/1024/1024).toFixed(1)} MB`;
 loadingOverlay('Loading 3D motion…');$('playPause').disabled=true;$('restart').disabled=true;$('scrub').disabled=true;
 try{
   await delay();const bytes=await bufferFor(item);if(token!==selectedLoadToken)return;
   const fbx=loader.parse(bytes,'');if(token!==selectedLoadToken)return;
   const rig=setupRig(mainStage,fbx);
   mainRig=rig;item.duration=rig.clip.duration;item.boneCount=rig.bones.size;
   $('scrub').value=0;$('scrub').disabled=false;$('playPause').disabled=false;$('restart').disabled=false;$('playPause').textContent='Ⅱ Pause';hideOverlay();
   $('selectedStatus').textContent=`${niceSec(rig.clip.duration)} · ${rig.bones.size} animated bones · Original FBX motion (not VRM-retargeted).`;
   updateCard(item);
 }catch(e){console.warn(e);if(token===selectedLoadToken){loadingOverlay('Could not preview this FBX: '+(e?.message||'Unknown error'));$('selectedStatus').textContent='Try another clip. The game itself is unaffected.';mainRig=null;}}
}
function renderLoop(now){
 requestAnimationFrame(renderLoop);
 const dt=Math.min(.08,Math.max(0,(now-(renderLoop.last||now))/1000));renderLoop.last=now;
 if(current&&mainRig){const dur=mainRig.clip.duration;
  if(isPlaying)currentT=(currentT+dt*rate)%dur;
  poseRig(mainStage,currentT,$('rootMotion').checked);
  $('scrub').value=Math.round(1000*currentT/dur);
  $('timing').textContent=`${currentT.toFixed(1)} / ${dur.toFixed(1)}s`;
 }
 render(mainStage);
 if(now-lastSwap>1000/fps){lastSwap=now;
   for(const item of visiblePage()){const card=item.card;
    if(card?.isConnected&&item.frames?.length&&card.getBoundingClientRect().bottom>0&&card.getBoundingClientRect().top<innerHeight){
      const img=card.querySelector('img');img.src=item.frames[Math.floor(now/1000*fps)%item.frames.length];
    }
   }
 }
}
requestAnimationFrame(renderLoop);

function updateSelectionUI(){
 const selectedMarks=Core.marksFor(marks,current?.id);
 for(const [key,btn] of [['kairo','markKairo'],['rin','markRin'],['saved','markSaved']]){
  $(btn).disabled=!current;$(btn).classList.toggle('marked',!!selectedMarks[key]);
  $(btn).textContent=(selectedMarks[key]?'✓ ':'＋ ')+(key==='saved'?'Shortlist':key==='rin'?'Rin':'Kairo');
 }
 for(const [k,id] of [['kairo','listKairo'],['rin','listRin']]){
  const list=$(id);list.textContent='';for(const clip of imported.filter(item=>Core.marksFor(marks,item.id)[k]).slice(0,30)){
   const b=document.createElement('button');b.type='button';b.textContent=shortName(clip.name);b.title='Preview '+clip.name;b.addEventListener('click',()=>select(clip));list.appendChild(b);
  }
 }
 const n=imported.filter(item=>{const m=Core.marksFor(marks,item.id);return m.kairo||m.rin||m.saved;}).length;
 $('selectionCount').textContent=n+' selected';
}
function saveSelection(){
 const selected=imported.filter(item=>{const m=Core.marksFor(marks,item.id);return m.kairo||m.rin||m.saved;}).map(item=>({name:item.name,sourceFile:item.fileName,sourceArchive:item.origin,size:item.size,category:item.category,duration:item.duration,rigBones:item.boneCount,assigned:Core.marksFor(marks,item.id)}));
 if(!selected.length){setStatus('Mark some animations for Kairo, Rin or your shortlist first.');return;}
 const payload={format:'sky-clash-animation-selection',version:1,createdAt:new Date().toISOString(),note:'This file is a shortlist. Import source FBX files to bake and retarget for game use.',animations:selected};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.download='sky-clash-animation-selections.json';a.href=url;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 setStatus('Your selection JSON was exported. Keep it with the source FBX ZIPs.');
}

// File import events
$('fileInput').addEventListener('change',async e=>{await importFiles([...e.target.files]);e.target.value='';});
for(const id of ['chooseTop','chooseInside'])$(id).addEventListener('click',e=>{e.stopPropagation();$('fileInput').click();});
const zone=$('dropzone');zone.addEventListener('click',e=>{if(e.target.closest('button'))return;$('fileInput').click();});
zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('fileInput').click();}});
for(const name of ['dragenter','dragover']){
 document.addEventListener(name,e=>{if(e.dataTransfer?.types.includes('Files'))e.preventDefault();});
 zone.addEventListener(name,e=>{e.preventDefault();zone.classList.add('dragover');});
}
for(const name of ['dragleave','drop'])zone.addEventListener(name,e=>{e.preventDefault();zone.classList.remove('dragover');});
zone.addEventListener('drop',e=>importFiles([...e.dataTransfer.files]));
// File drops work over the entire page, except the assignment bins.
document.addEventListener('drop',e=>{if(e.dataTransfer?.files.length&&!e.target.closest('.assign')){e.preventDefault();if(!zone.contains(e.target))importFiles([...e.dataTransfer.files]);}});
$('cancelLoad').addEventListener('click',()=>{cancelled=true;workQueue.length=0;setStatus('Stopped thumbnail processing. Imported files remain available.');$('cancelLoad').hidden=true;progress(null);});
for(const id of ['search','category','tagFilter'])$(id).addEventListener(id==='search'?'input':'change',()=>{page=0;applyFilter();});
$('prevPage').addEventListener('click',()=>{page=Math.max(0,page-1);refreshGrid();});$('nextPage').addEventListener('click',()=>{page++;refreshGrid();});
$('playPause').addEventListener('click',()=>{isPlaying=!isPlaying;$('playPause').textContent=isPlaying?'Ⅱ Pause':'▶ Play';});
$('restart').addEventListener('click',()=>{currentT=0;isPlaying=true;$('playPause').textContent='Ⅱ Pause';});
$('scrub').addEventListener('input',e=>{if(mainRig){currentT=(Number(e.target.value)/1000)*mainRig.clip.duration;isPlaying=false;$('playPause').textContent='▶ Play';}});
$('speed').addEventListener('change',e=>{rate=Number(e.target.value)||1;});
for(const [button,key] of [['markKairo','kairo'],['markRin','rin'],['markSaved','saved']])$(button).addEventListener('click',()=>mark(current,key));
for(const k of ['kairo','rin']){
 const bin=$('bin'+k[0].toUpperCase()+k.slice(1));
 bin.addEventListener('dragover',e=>{e.preventDefault();bin.classList.add('dragover');});
 bin.addEventListener('dragleave',()=>bin.classList.remove('dragover'));
 bin.addEventListener('drop',e=>{e.preventDefault();bin.classList.remove('dragover');const id=e.dataTransfer.getData('text/plain');const item=imported.find(i=>i.id===id);if(item)mark(item,k,true);});
}
$('exportList').addEventListener('click',saveSelection);
$('clearMarks').addEventListener('click',()=>{if(!confirm('Clear this browser’s Kairo/Rin/shortlist marks?'))return;marks={};saveMarks();updateSelectionUI();applyFilter();});
// Camera orbit (mouse and touch); this changes only the dedicated 3D preview.
const canvas=$('viewer');let pointer=null;
canvas.addEventListener('pointerdown',e=>{pointer={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;mainStage.yaw+=(e.clientX-pointer.x)*.011;pointer.x=e.clientX;cameraPose(mainStage);});
canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();mainStage.zoom=Math.max(2.7,Math.min(8.5,mainStage.zoom+e.deltaY*.003));cameraPose(mainStage);},{passive:false});
window.addEventListener('resize',()=>resizeStage(mainStage));
window.addEventListener('keydown',e=>{if(!current||e.target.matches('input,select,textarea'))return;if(e.code==='Space'){e.preventDefault();$('playPause').click();}});
applyFilter();updateSelectionUI();
setStatus('Preview engine ready. Add FBX files or ZIP packs to start your animation wall.');
