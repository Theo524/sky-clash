/* Sky Clash V58 / Character Action Editor.
 * FBX and ZIP import stays entirely in the user's browser. Three.js and FBXLoader
 * are imported as an isolated r158 ES module — the live game's renderer is never touched.
 * Original FBX viewer remains authoritative; VRM retargeting is an isolated experimental preview,
 * not connected to live gameplay.
 */
import * as THREE from 'three';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/FBXLoader.js';

const Core=window.SkyClashStudioCore;
const Action=window.SkyClashActionCore;
const MotionLibrary=window.SkyClashMotionLibrary;
const GameExporter=window.SkyClashGamePackExporter;
const LiveBridge=window.SkyClashStudioLiveBridge;
const PackCatalog=window.SkyClashPackCatalog;
const GIFPreview=window.SkyClashGIFPreview;
const $=id=>document.getElementById(id);
const loader=new FBXLoader();
const PAGE_SIZE=16;
const MAX_FILES=500;
const MAX_FBX_BYTES=30*1024*1024;
const MAX_ZIP_BYTES=350*1024*1024;
const ACTION_KEY='skyClashV58ActionAssignments';
const actionData=(()=>{try{return Action.sanitize(JSON.parse(localStorage.getItem(ACTION_KEY)||'{}'))}catch{return Action.empty()}})();
let actionFighter='kairo', activeAction='idle', viewMode='character', charPreview=null, charToken=0;
const imported=[];
const seen=new Set();
const seenContent=new Set();
let current=null, page=0, filtering=[], cancelled=false, indexing=false;
let isPlaying=true, rate=1, currentT=0, mainRig=null, selectedLoadToken=0;
const workQueue=[];let busy=false,renderAllPreviews=false;
let activeHovered=null, activeFrames=[];
const fps=7;
let lastSwap=0;

function setStatus(msg){$('loadStatus').textContent=msg;}
function progress(p){const el=$('loadProgress');el.style.display=p==null?'none':'block';if(p!=null)el.firstElementChild.style.width=Math.round(Math.max(0,Math.min(100,p)))+'%';}
const delay=()=>new Promise(ok=>requestAnimationFrame(ok));
const niceSec=t=>Number.isFinite(t)?t.toFixed(2)+'s':'—';
const shortName=x=>x.length>36?x.slice(0,33)+'…':x;

function addEntry({file,zipEntry,origin,name,size,crc}){
 if(imported.length>=MAX_FILES)return false;
 if(!/\.fbx$/i.test(name))return false;
 const id=Core.makeId(origin,name,size,crc);
 const contentKey=PackCatalog?.clipKey(name,size,crc);
 if(seen.has(id)||(contentKey&&seenContent.has(contentKey)))return false;
 seen.add(id);
 if(contentKey)seenContent.add(contentKey);
 const clip={id,origin,fileName:name,name:Core.displayName(name),size,crc,category:Core.category(name),file,zipEntry,frames:null,card:null,error:null,duration:null,boneCount:null,prepared:false};
 imported.push(clip);
 return true;
}
async function importFiles(files,{restored=false}={}){
 if(!files.length)return;
 if(indexing){setStatus('Finish the current ZIP import first, or stop preview processing.');return;}
 indexing=true;cancelled=false;
 let added=0,skipped=0,saved=0;
 const cacheErrors=[];
 $('cancelLoad').hidden=false;
 for(const file of files){
  if(cancelled)break;
  let addedForFile=0;
  try{
   if(/\.fbx$/i.test(file.name)){
     if(file.size>MAX_FBX_BYTES){skipped++;continue;}
     if(addEntry({file,origin:'Loose FBX',name:file.name,size:file.size,crc:file.lastModified})){
      added++;addedForFile++;
     }
   }else if(/\.zip$/i.test(file.name)){
     if(file.size>MAX_ZIP_BYTES){setStatus(file.name+' is too large to unpack safely in your browser.');skipped++;continue;}
     setStatus((restored?'Restoring ':'Reading ')+file.name+'…');await delay();
     const zip=await window.JSZip.loadAsync(file,{checkCRC32:false});
     const entries=Object.values(zip.files).filter(e=>!e.dir&&/\.fbx$/i.test(e.name));
     for(const ent of entries){
       if(imported.length>=MAX_FILES){skipped+=entries.length;break;}
       const size=ent._data?.uncompressedSize||0;
       if(size>MAX_FBX_BYTES){skipped++;continue;}
       if(addEntry({zipEntry:ent,origin:file.name,name:ent.name,size,crc:ent._data?.crc32||''})){
        added++;addedForFile++;
       }
     }
   }else skipped++;
   // Store one compressed original ZIP rather than hundreds of unpacked FBXs.
   // Local-only IndexedDB cache is optional; a quota failure must never
   // prevent normal animation imports or change fighter action assignments.
   if(addedForFile&&!restored&&MotionLibrary){
    try{
     setStatus('Saving '+file.name+' for your next visit…');
     const result=await MotionLibrary.save(file);
     if(result.saved)saved++;
    }catch(e){
     console.warn('V69 motion cache could not save '+file.name,e);
     cacheErrors.push(file.name+': '+(e?.message||'storage unavailable'));
    }
   }
  }catch(e){
   console.warn('Could not open',file.name,e);
   skipped++;setStatus('Could not read '+file.name+': '+e.message);
  }
  await delay();
 }
 indexing=false;$('cancelLoad').hidden=true;
 const prefix=restored?'Restored ':'Imported ';
 let msg=prefix+added+' animations'+(skipped?' · '+skipped+' skipped':'')+'. ';
 msg+=restored?'Your saved FBX/ZIP packs are ready to preview.':
  saved?'Saved original packs in this browser for future visits.':'Drag a preview onto an action slot.';
 if(cacheErrors.length)msg+=' Cache not saved: '+cacheErrors.slice(0,2).join('; ')+'.';
 setStatus(msg);
 page=0;applyFilter();refreshActionSlots();
 updateSavedLibraryStatus();
}
async function updateSavedLibraryStatus(){
 const el=$('savedLibraryStatus');
 if(!el||!MotionLibrary)return;
 try{
  const data=await MotionLibrary.info();
  el.textContent=data.count
   ? 'Saved offline: '+data.count+' original pack'+(data.count===1?'':'s')+' ('+(data.bytes/1048576).toFixed(1)+' MB)'
   : 'No offline motion packs yet';
  $('clearSavedLibrary').hidden=!data.count;
 }catch(e){el.textContent='Offline library unavailable — manual imports still work';}
}
async function restoreMotionLibrary(){
 if(!MotionLibrary){setStatus('Offline motion cache unavailable. Import FBX/ZIP files to start.');return;}
 try{
  const originals=await MotionLibrary.list();
  if(originals.length)await importFiles(originals,{restored:true});
  else {
   setStatus('Animation Studio ready. Import FBX/ZIP once to save packs for future visits.');
   updateSavedLibraryStatus();
  }
 }catch(e){
  console.warn('V69 could not restore saved motion packs',e);
  setStatus('Could not reopen the offline library: '+e.message+'. Your original files are safe; you can import again.');
  updateSavedLibraryStatus();
 }
}
function explainFBXError(error){
 const detail=String(error?.message||error||'Unknown FBX error');
 if(/unknown property type/i.test(detail))
  return 'Unsupported FBX binary property. Try downloading this animation again as FBX Binary (Without Skin), or re-export via Blender to FBX 2014/2015. '+detail;
 if(/unknown format|FBX version not supported|unsupported FBX/i.test(detail))
  return 'Unsupported FBX file/version. Try a fresh FBX Binary export (not an archive renamed to .fbx). '+detail;
 if(/no playable animation track|no animation/i.test(detail))
  return 'This FBX has no playable animation data. Download the animated version (Without Skin is fine). '+detail;
 return detail;
}
async function bufferFor(item){
 let buffer;
 if(item.file)buffer=await item.file.arrayBuffer();
 else if(item.zipEntry){const bytes=await item.zipEntry.async('uint8array');buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);}
 else throw Error('File not available in this browser session');
 // V70: a trailing newline accidentally appended after the official FBX
 // footer breaks Three.js FBXLoader's footer detection on ~1 in 8 files.
 // Repair in RAM ONLY; retain untouched original ZIP/FBX in the offline library.
 const result=window.SkyClashFBXRepair?.normalize(buffer);
 if(result?.repaired)item.repaired=true;
 return result?.buffer||buffer;
}
const UNREAL_TO_MIXAMO=Object.freeze({
 pelvis:'hips',spine01:'spine',spine02:'spine1',spine03:'spine2',
 neck01:'neck',claviclel:'leftshoulder',upperarml:'leftarm',
 lowerarml:'leftforearm',handl:'lefthand',
 clavicler:'rightshoulder',upperarmr:'rightarm',
 lowerarmr:'rightforearm',handr:'righthand',
 thighl:'leftupleg',calfl:'leftleg',footl:'leftfoot',balll:'lefttoebase',
 thighr:'rightupleg',calfr:'rightleg',footr:'rightfoot',ballr:'righttoebase'
});
function norm(name){
 const n=String(name).split(':').pop().replace(/[^a-zA-Z0-9]/g,'')
  .toLowerCase().replace(/^mixamorig\d*/,'');
 return UNREAL_TO_MIXAMO[n]||n;
}
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
 const rig=stage.loaded;rig.master?.dispose();rig.mixer?.stopAllAction();stage.rigCenter.remove(rig.wrap);
 rig.wrap.traverse(o=>{if(o.geometry&&o.userData.studioOwned)o.geometry.dispose();if(o.material&&o.userData.studioOwned){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});
 stage.loaded=null;
}
function setRigDisplay(rig,mode){
 if(!rig)return;
 const on=mode==='master';
 rig.master?.setVisible(on);
 for(const s of rig.segments)s.mesh.visible=!on;
 for(const j of rig.joints)j.mesh.visible=!on;
}
function poseRig(stage,time,allowTravel=false){
 const rig=stage.loaded;if(!rig)return;
 rig.mixer.setTime(Math.max(0,time));
 if(rig.hips&&!allowTravel){rig.hips.position.x=rig.initialHipX;rig.hips.position.z=rig.initialHipZ;}
 rig.wrap.updateMatrixWorld(true);
 if(rig.segments[0]?.mesh.visible) for(const seg of rig.segments){
   seg.from.getWorldPosition(v1);seg.to.getWorldPosition(v2);
   rig.wrap.worldToLocal(v1);rig.wrap.worldToLocal(v2);
   const len=Math.max(.001,v1.distanceTo(v2));
   seg.mesh.position.copy(v1).add(v2).multiplyScalar(.5);
   seg.mesh.quaternion.setFromUnitVectors(rig.yAxis,v3.copy(v2).sub(v1).normalize());
   seg.mesh.scale.set(seg.width,len,seg.width);
 }
 if(rig.joints[0]?.mesh.visible) for(const joint of rig.joints){joint.bone.getWorldPosition(v1);rig.wrap.worldToLocal(v1);joint.mesh.position.copy(v1);}
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
 // Capture the unanimated Mixamo bind pose before the clip starts, for VRM retarget comparison.
 fbx.updateMatrixWorld(true);const restWorld=new Map(),restPoints=new Map();
 for(const [key,bone] of bones){
  restWorld.set(key,bone.getWorldQuaternion(new THREE.Quaternion()));
  restPoints.set(key,bone.getWorldPosition(new THREE.Vector3()));
 }
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
 const inspection=window.SkyClashMixamoMaster?.inspectClip(clip,bones);
 if(!inspection?.valid)throw Error('Mixamo track validation failed: '+(inspection?.warnings.join('; ')||'No valid humanoid motion'));
 const master=window.SkyClashMixamoMaster?.create(THREE,bones,fbx);
 if(!master)throw Error('Clean master model unavailable. Refresh the Animation Studio.');
 const rig={master,inspection,wrap,fbx,mixer,clip,bones,restWorld,restPoints,tempWorldQuat:new THREE.Quaternion(),hips,initialHipX,initialHipZ,segments,joints,yAxis:new THREE.Vector3(0,1,0),geometries:[segmentGeometry,jointGeo],materials:Object.values(mats)};
 stage.loaded=rig;setRigDisplay(rig,stage.thumb?'master':viewMode);poseRig(stage,0,false);
 // V78: record source FBX Y-origin after the first sampled frame AND after
 // scaling the diagnostic skeleton to 2.33m. On Character can reproduce
 // real jogging bounce without copying horizontal/root translation.
 if(hips)rig.previewHipBaseY=hips.getWorldPosition(new THREE.Vector3()).y;
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
function generateRemainingPreviews(){
 // Optional full-catalog thumbnail render. Originals stay in IndexedDB;
 // full previews are generated from FBXs on demand, not remote fake GIFs.
 cancelled=false;renderAllPreviews=true;
 for(const item of imported)if(!item.prepared&&!item.error&&!workQueue.includes(item))
  workQueue.push(item);
 updateStats();processQueue();
}
async function processQueue(){
 if(busy)return;busy=true;
 while(workQueue.length){
  const item=workQueue.shift();
  if(cancelled){workQueue.length=0;break;}
  if(!item||item.prepared||item.error)continue;
  if(!renderAllPreviews&&!visiblePage().includes(item))continue;
  try{
   await delay();
   const input=await bufferFor(item);
   const object=loader.parse(input,'');
   const rig=setupRig(thumbStage,object);setRigDisplay(rig,'master');
   item.duration=rig.clip.duration;item.boneCount=rig.bones.size;
   const nFrames=8,frames=[];
   for(let i=0;i<nFrames;i++){
     const t=rig.clip.duration*(i+.22)/nFrames;
     poseRig(thumbStage,t,false);render(thumbStage);
     frames.push(thumbCanvas.toDataURL('image/webp',.65));
   }
   item.frames=frames;item.prepared=true;
   disposeSetup(thumbStage);
   }catch(e){
    console.warn('FBX preview failed:',item.fileName,e);
    item.error=explainFBXError(e);
    disposeSetup(thumbStage);
   }
  updateCard(item);updateStats();
  await delay();
 }
 busy=false;renderAllPreviews=false;
 updateStats();
}
const observer=new IntersectionObserver(entries=>{
 for(const x of entries)if(x.isIntersecting){const item=x.target.__item;if(item)enqueueThumbnail(item);}
},{root:null,rootMargin:'260px',threshold:0.01});
function updateCard(item){const card=item.card;if(!card||!card.isConnected)return;
 const img=card.querySelector('img');if(item.frames?.length){img.src=item.frames[0];img.classList.remove('is-pending');}
 if(item.repaired&&img)img.title='V70: safe FBX footer newline removed for preview only';
 const err=card.querySelector('.clip-failure');if(err){err.textContent=item.error?'Preview failed: '+shortName(item.error):'';err.title=item.error||'';}
 const meta=card.querySelector('.clip-meta');if(meta)meta.lastElementChild.textContent=item.duration?niceSec(item.duration):item.error?'Unavailable':'Processing…';
}
function updateStats(){const done=imported.filter(x=>x.prepared).length,errors=imported.filter(x=>x.error).length;
 const pending=Math.max(0,imported.length-done-errors);
 $('processedCount').textContent=imported.length?
  `${done}/${imported.length} previews ready · ${pending} awaiting render · ${errors} errors`:'';
 const all=$('generateAllPreviews');
 if(all){all.hidden=!pending;all.disabled=renderAllPreviews;
  all.textContent=renderAllPreviews?`Rendering ${pending} remaining…`:`Render remaining ${pending} previews`;}
 const coverage=PackCatalog?.scan(imported);
 const badge=$('packCoverage'),choose=$('importMissingPacks');
 if(badge&&coverage){
  badge.textContent=coverage.loaded+'/'+coverage.expected+' clips from 4 source packs';
  badge.title=coverage.packs.map(p=>p.name+': '+p.loaded+'/'+p.count).join(' | ');
 }
 if(choose&&coverage)choose.hidden=coverage.complete;
 // Thumbnail previews are generated lazily, only as cards become visible;
 // a pending image is not missing from the user's ZIP collection.
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
  for(const f of ['kairo','rin'])for(const [key,slot] of Object.entries(actionData[f]))if(slot&&Action.findImport([item],slot)===item){const tag=document.createElement('span');tag.className=f;tag.textContent=(f==='kairo'?'K':'R')+' · '+key;tags.appendChild(tag);}
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
function applyFilter(){const q=$('search').value,category=$('category').value,tag=$('tagFilter').value;filtering=imported.filter(i=>{const matching=Core.match(i,q,category,'all',{});const assigned=Object.values(actionData).some(group=>Object.values(group).some(ref=>ref&&Action.findImport([i],ref)===i));return matching&&(tag==='all'||(tag==='assigned'&&assigned)||(tag==='unassigned'&&!assigned));});page=Math.min(page,Math.max(0,Math.ceil(filtering.length/PAGE_SIZE)-1));refreshGrid();updateStats();}

async function select(item){
 current=item;currentT=0;isPlaying=true;
 const gifButton=$('downloadPreviewGIF');if(gifButton)gifButton.disabled=false;
 const token=++selectedLoadToken;
 refreshGrid();updateSelectionUI();
 $('selectedTitle').textContent=item.name;
 $('selectedMeta').textContent=`${item.origin} · ${item.fileName} · ${(item.size/1024/1024).toFixed(1)} MB`;
 loadingOverlay('Loading 3D motion…');$('playPause').disabled=true;$('restart').disabled=true;$('scrub').disabled=true;
 try{
   await delay();const bytes=await bufferFor(item);if(token!==selectedLoadToken)return;
   const fbx=loader.parse(bytes,'');if(token!==selectedLoadToken)return;
   const rig=setupRig(mainStage,fbx);setRigDisplay(rig,viewMode);
   mainRig=rig;item.duration=rig.clip.duration;item.boneCount=rig.bones.size;
   $('scrub').value=0;$('scrub').disabled=false;$('playPause').disabled=false;$('restart').disabled=false;$('playPause').textContent='Ⅱ Pause';hideOverlay();
   $('selectedStatus').textContent=`${niceSec(rig.clip.duration)} · ${rig.inspection.animatedBones} animated bones · Native Mixamo tracks checked${item.repaired?' · FBX footer automatically repaired':''}${rig.inspection.warnings.length?' · Warning: '+rig.inspection.warnings.join('; '):' · no binding warnings'}.`;
   updateCard(item);
   if(viewMode==='character')await showCharacter();
 }catch(e){console.warn(e);if(token===selectedLoadToken){loadingOverlay('Could not preview this FBX: '+explainFBXError(e));$('selectedStatus').textContent='The original file is kept. Try another export or animation; Kairo and live combat are unaffected.';mainRig=null;}}
}
function renderLoop(now){
 requestAnimationFrame(renderLoop);
 const dt=Math.min(.08,Math.max(0,(now-(renderLoop.last||now))/1000));renderLoop.last=now;
 if(current&&mainRig){const dur=mainRig.clip.duration;
  const opts=actionData[actionFighter]?.[activeAction];
  const motionSpeed=(viewMode==='character'&&opts&&Action.findImport(imported,opts)===current)?opts.speed:1;
  if(isPlaying)currentT=(currentT+dt*rate*motionSpeed)%dur;
  poseRig(mainStage,currentT,$('rootMotion').checked);
  if(viewMode==='character'&&charPreview?.hasModel()&&charPreview.who()===actionFighter){
   try{charPreview.sample(mainRig,currentT,(opts&&Action.findImport(imported,opts)===current)?opts.yaw:0);charPreview.render();}
   catch(e){console.warn('Character preview stopped safely',e);setActionHelp('Retarget preview issue: '+e.message+' · Original animation remains available.');switchView('master');}
  }
  $('scrub').value=Math.round(1000*currentT/dur);
  $('timing').textContent=`${currentT.toFixed(1)} / ${dur.toFixed(1)}s`;
 }
 if(viewMode!=='character')render(mainStage);
 if(now-lastSwap>1000/fps){lastSwap=now;
   for(const item of visiblePage()){const card=item.card;
    if(card?.isConnected&&item.frames?.length&&card.getBoundingClientRect().bottom>0&&card.getBoundingClientRect().top<innerHeight){
      const img=card.querySelector('img');img.src=item.frames[Math.floor(now/1000*fps)%item.frames.length];
    }
   }
 }
}
requestAnimationFrame(renderLoop);

function updateSelectionUI(){const hint=$('selectedHint');if(hint)hint.textContent=current?'Selected: '+current.name+' · Drag its thumbnail to a move below, or tap Assign on an empty slot.':'Choose a motion, then assign it to a named action below.';}

// ——— V58 action assignment board ———
function saveActions(){try{localStorage.setItem(ACTION_KEY,JSON.stringify(actionData))}catch(e){setActionHelp('Browser storage is unavailable: export the action map to keep it.')}}
function setActionHelp(message){$('actionHelp').textContent=message;}
function displayActor(){return actionFighter==='rin'?'Rin Sable':'Kairo Venn';}
function bindClip(item,key){
 if(!item){setActionHelp('Import some FBX or ZIP files and select a clip first.');return;}
 Action.assign(actionData,actionFighter,key,item);
 activeAction=key;saveActions();refreshActionSlots();applyFilter();
 setActionHelp('Assigned '+item.name+' → '+displayActor()+' / '+(Action.slots[actionFighter].find(s=>s[0]===key)||[])[1]+'. Use Apply to Game & Play to test the assigned move in Training.');
 select(item).then(()=>switchView('character')).catch(e=>setActionHelp('Could not preview: '+e.message));
}
function refreshActionSlots(){
 const host=$('actionSlots');host.textContent='';let lastGroup='';
 for(const [key,name,group] of Action.slots[actionFighter]){
  if(group!==lastGroup){const h=document.createElement('div');h.className='slot-group-name';h.textContent=group;host.appendChild(h);lastGroup=group;}
  const ref=actionData[actionFighter][key];const match=Action.findImport(imported,ref);
  const row=document.createElement('div');row.className='action-slot'+(ref?' filled':'')+(activeAction===key?' active':'');row.dataset.slot=key;
  const title=document.createElement('div');title.className='slot-main';
  const nameEl=document.createElement('b');nameEl.textContent=name;
  const state=document.createElement('small');state.textContent=ref?(match?'✓ '+ref.name:'↻ Reimport to preview: '+ref.name):'Drop a Mixamo motion here';if(match)state.className='slot-has';
  title.append(nameEl,state);title.addEventListener('click',()=>{activeAction=key;refreshActionSlots();if(match)select(match).then(()=>switchView('character'));});
  row.appendChild(title);
  if(ref){
   const preview=document.createElement('button');preview.className='slot-button slot-preview';preview.textContent='▶ Preview';preview.disabled=!match;preview.title=match?'Preview this animation on '+displayActor():'Reimport source FBX or ZIP first';
   preview.addEventListener('click',()=>{activeAction=key;refreshActionSlots();select(match).then(()=>switchView('character'));});row.appendChild(preview);
   const clear=document.createElement('button');clear.className='slot-button slot-clear';clear.textContent='×';clear.title='Remove motion from '+name;clear.addEventListener('click',()=>{delete actionData[actionFighter][key];saveActions();if(activeAction===key)activeAction='';refreshActionSlots();applyFilter();});row.appendChild(clear);
  }else{
   const assign=document.createElement('button');assign.className='slot-button';assign.textContent='↓ Assign';assign.title='Assign the selected animation';assign.disabled=!current;
   assign.addEventListener('click',()=>bindClip(current,key));row.appendChild(assign);
  }
  row.addEventListener('dragenter',e=>{e.preventDefault();row.classList.add('dragover');});
  row.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';row.classList.add('dragover');});
  row.addEventListener('dragleave',()=>row.classList.remove('dragover'));
  row.addEventListener('drop',async e=>{e.preventDefault();e.stopPropagation();row.classList.remove('dragover');
   const id=e.dataTransfer.getData('text/plain');const item=imported.find(i=>i.id===id);
   if(item){bindClip(item,key);return;}
   const files=[...e.dataTransfer.files].filter(f=>/\.fbx$/i.test(f.name));
   if(files.length===1){const oldCount=imported.length;await importFiles(files);if(imported.length>oldCount)bindClip(imported[imported.length-1],key);else setActionHelp('File already exists in the library: select its thumbnail and assign it here.');}
   else setActionHelp('To assign from a ZIP or group of files, import the pack above and then drag the desired preview onto this slot.');
  });
  host.appendChild(row);
 }
 const ref=actionData[actionFighter][activeAction];$('actionTuning').hidden=!ref;
 if(ref){$('tuneName').textContent=(Action.slots[actionFighter].find(v=>v[0]===activeAction)||[])[1]+' · '+ref.name;
  $('tuneSpeed').value=ref.speed;$('tuneYaw').value=ref.yaw;
  $('tuneSpeedValue').textContent=ref.speed.toFixed(2)+'×';$('tuneYawValue').textContent=ref.yaw+'°';}
 $('previewFighterName').textContent=displayActor();
 $('applyGameMoves').disabled=actionFighter!=='kairo';
 $('applyGameMoves').title=actionFighter==='kairo'?'Apply baked Kairo moves in this browser and open Training':'Rin live-playtest integration is not available yet';
}
function exportActionMap(){
 const payload={format:'sky-clash-action-map',version:1,createdAt:new Date().toISOString(),note:'Action-slot assignments ONLY. Does not contain FBX data. Reimport FBX/ZIP files to preview; nothing is installed into live combat automatically.',assignments:Action.sanitize(actionData)};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='sky-clash-action-map.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
 setActionHelp('Exported the Kairo/Rin action map. Keep it with your source ZIPs. This is not yet a playable animation build.');
}
// Both the JSON download and one-click local playtest use identical FBX baking.
async function buildAssignedGamePack({playtest=false}={}){
 if(!GameExporter)throw Error('V72 game motion exporter unavailable. Reload Animation Studio.');
 const motions=[],missing=[],unsupported=[],skipped=[];
 const assignments=Object.entries(actionData[actionFighter]||{});
 const supported=new Set(playtest?LiveBridge?.supportedSlots||[]:
  Action.slots[actionFighter].map(x=>x[0]));
 for(const [slot,ref] of assignments){
  if((playtest&&actionFighter!=='kairo')||!supported.has(slot)){
   skipped.push(slot);continue;
  }
  const item=Action.findImport(imported,ref);
  if(!item){missing.push(ref.name);continue;}
  try{
   setActionHelp('Baking '+ref.name+' for '+displayActor()+' game moves…');
   await delay();
   const binary=await bufferFor(item);
   const fbx=loader.parse(binary,'');
   motions.push(GameExporter.bake(THREE,fbx,{
    slot,character:actionFighter,sourceArchive:item.origin,
    sourceFile:item.fileName,sourceId:item.id,speed:ref.speed,yaw:ref.yaw
   }));
  }catch(e){unsupported.push(ref.name+': '+(e?.message||'cannot bake'));}
 }
 if(!motions.length)
  throw Error('No usable assigned animations found. Reimport your assigned FBX/ZIP files and try again.'+
   (missing.length?' Missing: '+missing.slice(0,2).join(', '):'')+
   (unsupported.length?' Conversion: '+unsupported.slice(0,2).join('; '):''));
 return {pack:GameExporter.pack(motions),count:motions.length,missing,unsupported,skipped};
}
function gamePackNotes(result){
 let message='';
 if(result.missing.length)message+=' Missing source files: '+result.missing.slice(0,2).join(', ')+'.';
 if(result.unsupported.length)message+=' Failed conversions: '+result.unsupported.slice(0,2).join('; ')+'.';
 if(result.skipped.length)message+=' Not playable in this mode: '+result.skipped.join(', ')+'.';
 return message;
}
async function exportGamePack(){
 const btn=$('exportGamePack');btn.disabled=true;
 try{
  const result=await buildAssignedGamePack();
  const fileName='sky-clash-'+actionFighter+'-game-actions-v1.json';
  const url=URL.createObjectURL(new Blob([JSON.stringify(result.pack)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=fileName;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  setActionHelp('Exported '+result.count+' game animations. To permanently publish for everyone, commit the JSON to assets/animations/gameplay/studio-actions-v1.json.'+gamePackNotes(result));
 }catch(e){setActionHelp('Game export failed: '+e.message);}
 finally{btn.disabled=false;}
}
async function applyGameMoves(){
 const btn=$('applyGameMoves');btn.disabled=true;
 try{
  if(actionFighter!=='kairo')throw Error('Local gameplay moves currently support Kairo only.');
  if(!LiveBridge)throw Error('Local game bridge failed to load. Refresh the editor.');
  const result=await buildAssignedGamePack({playtest:true});
  // A partial bake previously opened Training while silently falling back
  // to published punches for the missing assignments. Never claim success
  // when any supported action could not be loaded from its source FBX.
  if(result.missing.length||result.unsupported.length)
   throw Error('Not all assigned Kairo clips were applied.'+
    gamePackNotes(result)+' Reimport the original Mixamo ZIPs and retry.');
  await LiveBridge.save(result.pack);
  setActionHelp('Applied '+result.count+' actual Mixamo game clips to this browser. Opening Training…'+gamePackNotes(result));
  // Opt-in URL is the entire release boundary. Visiting index.html alone
  // always restores approved published combat, jump, idle and flight.
  window.location.assign('index.html?studioPlaytest=local&scene=dojo');
 }catch(e){setActionHelp('Could not apply moves: '+e.message);
  btn.disabled=actionFighter!=='kairo';
 }
}
async function clearAppliedGameMoves(){
 const btn=$('clearAppliedGameMoves');btn.disabled=true;
 try{
  if(!LiveBridge)throw Error('Local game bridge unavailable.');
  await LiveBridge.clear();
  setActionHelp('Local game moves reset. The original published game is unchanged.');
 }catch(e){setActionHelp('Could not reset local moves: '+e.message);}
 finally{btn.disabled=false;}
}

async function showCharacter(){
 if(viewMode!=='character'||!mainRig||!current)return;
 const token=++charToken;$('viewerOverlay').hidden=false;$('viewerOverlay').textContent='Loading '+displayActor()+' model for preview…';
 try{
  if(!charPreview)charPreview=window.SkyClashCharacterMotionPreview.create($('characterViewer'));
  await charPreview.load(actionFighter);if(token!==charToken||viewMode!=='character')return;
  charPreview.render();$('viewerOverlay').hidden=true;
  $('viewerType').textContent='V68 corrected '+displayActor()+' retarget';
  $('selectedStatus').textContent='V68 anatomical forward-axis mapping on '+displayActor()+'. FBX diagnostic remains authoritative; preview does not change gameplay.';
 }catch(e){if(token!==charToken)return;console.warn('VRM preview unavailable',e);setActionHelp('Could not load fighter preview: '+e.message+'. Original Mixamo view still works.');switchView('master');}
}
function switchView(mode){
 viewMode=mode;const isChar=mode==='character';setRigDisplay(mainRig,mode);
 $('viewer').hidden=isChar;$('characterViewer').hidden=!isChar;
 $('viewOriginal').classList.toggle('tab-on',mode==='original');$('viewMaster').classList.toggle('tab-on',mode==='master');$('viewCharacter').classList.toggle('tab-on',isChar);
 if(isChar){if(!mainRig){setActionHelp('Select or assign an animation to preview it on the character.');return;}showCharacter();}
 else {++charToken;$('viewerOverlay').hidden=!mainRig;$('viewerType').textContent=mode==='master'?'Master body · native Mixamo rig':'Original Mixamo diagnostic';$('selectedStatus').textContent=mainRig?(mode==='master'?'Clean body follows Mixamo bones directly — no retargeting.':'Diagnostic mannequin shows unmodified Mixamo motion.'):'Select an animation to preview.';}
}
$('viewOriginal').addEventListener('click',()=>switchView('original'));
$('viewMaster').addEventListener('click',()=>switchView('master'));
$('viewCharacter').addEventListener('click',()=>switchView('character'));
$('actionFighter').addEventListener('change',e=>{actionFighter=e.target.value;activeAction='idle';refreshActionSlots();if(viewMode==='character')showCharacter();});
$('tuneSpeed').addEventListener('input',e=>{const ref=actionData[actionFighter][activeAction];if(!ref)return;ref.speed=Number(e.target.value);$('tuneSpeedValue').textContent=ref.speed.toFixed(2)+'×';saveActions();});
$('tuneYaw').addEventListener('input',e=>{const ref=actionData[actionFighter][activeAction];if(!ref)return;ref.yaw=Number(e.target.value);$('tuneYawValue').textContent=ref.yaw+'°';saveActions();});
$('removeAssigned').addEventListener('click',()=>{if(!activeAction)return;delete actionData[actionFighter][activeAction];saveActions();activeAction='';refreshActionSlots();applyFilter();});
$('exportActions').addEventListener('click',exportActionMap);
$('exportGamePack').addEventListener('click',exportGamePack);
$('applyGameMoves').addEventListener('click',applyGameMoves);
$('clearAppliedGameMoves').addEventListener('click',clearAppliedGameMoves);
$('importActions').addEventListener('click',()=>$('actionMapInput').click());
$('actionMapInput').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data.format!=='sky-clash-action-map'||data.version!==1)throw Error('This is not a V58 action map');const v=Action.sanitize(data.assignments);actionData.kairo=v.kairo;actionData.rin=v.rin;saveActions();refreshActionSlots();setActionHelp('Imported '+Action.count(v)+' action assignments, but this JSON contains NO Mixamo animation data. Reimport the original FBX/ZIP packs, then click Apply to Game & Play. Export Action Map alone does not update the game.');}catch(err){setActionHelp('Could not import map: '+err.message);}e.target.value='';});
$('clearActions').addEventListener('click',()=>{if(!confirm('Clear all '+displayActor()+' action assignments?'))return;actionData[actionFighter]={};saveActions();activeAction='idle';refreshActionSlots();applyFilter();});
refreshActionSlots();

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
// File drops work over the entire page, except the action slots.
document.addEventListener('drop',e=>{if(e.dataTransfer?.files.length&&!e.target.closest('.action-slot')){e.preventDefault();if(!zone.contains(e.target))importFiles([...e.dataTransfer.files]);}});
$('cancelLoad').addEventListener('click',()=>{cancelled=true;workQueue.length=0;setStatus('Stopped thumbnail processing. Imported files remain available.');$('cancelLoad').hidden=true;progress(null);});
$('generateAllPreviews').addEventListener('click',generateRemainingPreviews);
for(const id of ['search','category','tagFilter'])$(id).addEventListener(id==='search'?'input':'change',()=>{page=0;applyFilter();});
$('prevPage').addEventListener('click',()=>{page=Math.max(0,page-1);refreshGrid();});$('nextPage').addEventListener('click',()=>{page++;refreshGrid();});
$('importMissingPacks').addEventListener('click',()=>{
 const cover=PackCatalog?.scan(imported);
 const missing=cover?.packs.filter(p=>p.missing).map(p=>p.name+' ('+p.missing+' missing)').join('; ');
 setStatus('Choose ALL your missing ZIP archives: '+(missing||'No packs missing')+'. They remain in your browser after importing; ChatGPT attachments do not automatically enter the website.');
 $('fileInput').click();
});
$('downloadPreviewGIF').addEventListener('click',async()=>{
 const item=current,button=$('downloadPreviewGIF');
 if(!item||!GIFPreview)return;
 button.disabled=true;button.textContent='Generating GIF…';
 try{
  // The normal thumbnail queue generates frame sequences only for clips
  // visible in the gallery. A selected clip always deserves its own GIF.
  while(busy)await delay();
  if(!item.frames?.length){
   const buffer=await bufferFor(item),fbx=loader.parse(buffer,'');
   const rig=setupRig(thumbStage,fbx);setRigDisplay(rig,'master');
   const frames=[];for(let i=0;i<8;i++){
    poseRig(thumbStage,rig.clip.duration*(i+.22)/8,false);
    render(thumbStage);frames.push(thumbCanvas.toDataURL('image/webp',.65));
   }
   item.frames=frames;item.prepared=true;item.error=null;
   disposeSetup(thumbStage);updateCard(item);updateStats();
  }
  const blob=await GIFPreview.fromDataUrls(item.frames);
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  const clean=item.name.replace(/[^a-z0-9-]+/gi,'-').replace(/^-|-$/g,'');
  a.href=url;a.download='Sky-Clash-'+(clean||'motion')+'-preview.gif';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  setStatus('Saved animated GIF preview for '+item.name+' · '+item.frames.length+' motion frames.');
 }catch(e){
  disposeSetup(thumbStage);setStatus('GIF preview failed for '+item.name+': '+e.message);
 }finally{button.disabled=false;button.textContent='↓ Save preview GIF';}
});
$('playPause').addEventListener('click',()=>{isPlaying=!isPlaying;$('playPause').textContent=isPlaying?'Ⅱ Pause':'▶ Play';});
$('restart').addEventListener('click',()=>{currentT=0;isPlaying=true;$('playPause').textContent='Ⅱ Pause';});
$('scrub').addEventListener('input',e=>{if(mainRig){currentT=(Number(e.target.value)/1000)*mainRig.clip.duration;isPlaying=false;$('playPause').textContent='▶ Play';}});
$('speed').addEventListener('change',e=>{rate=Number(e.target.value)||1;});


// Camera orbit (mouse and touch); this changes only the dedicated 3D preview.
const canvas=$('viewer');let pointer=null;
canvas.addEventListener('pointerdown',e=>{pointer={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;mainStage.yaw+=(e.clientX-pointer.x)*.011;pointer.x=e.clientX;cameraPose(mainStage);});
canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();mainStage.zoom=Math.max(2.7,Math.min(8.5,mainStage.zoom+e.deltaY*.003));cameraPose(mainStage);},{passive:false});
window.addEventListener('resize',()=>resizeStage(mainStage));
const cv=$('characterViewer');let cp=null;cv.addEventListener('pointerdown',e=>{cp={id:e.pointerId,x:e.clientX};cv.setPointerCapture(e.pointerId);});cv.addEventListener('pointermove',e=>{if(!cp||cp.id!==e.pointerId)return;charPreview?.orbit(e.clientX-cp.x);cp.x=e.clientX;});cv.addEventListener('pointerup',()=>cp=null);cv.addEventListener('pointercancel',()=>cp=null);cv.addEventListener('wheel',e=>{e.preventDefault();charPreview?.zoomBy(e.deltaY);},{passive:false});
window.addEventListener('keydown',e=>{if(!current||e.target.matches('input,select,textarea'))return;if(e.code==='Space'){e.preventDefault();$('playPause').click();}});
applyFilter();updateSelectionUI();
switchView('character');
$('clearSavedLibrary').addEventListener('click',async()=>{
 if(!MotionLibrary)return;
 if(!confirm('Remove saved FBX/ZIP packs from this browser? Your current Animation Studio session and action assignments will remain available until you reload.'))return;
 try{
  await MotionLibrary.clear();
  await updateSavedLibraryStatus();
  setStatus('Saved offline packs cleared. Already loaded motions still work until you reload.');
 }catch(e){setStatus('Could not clear saved packs: '+e.message);}
});
setStatus('Opening your saved Mixamo animation library…');
restoreMotionLibrary();
