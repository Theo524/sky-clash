/* Sky Clash V66: one real VRM character source shared by game and Animation Studio.
 * File is stored only in this browser (IndexedDB) unless the owner separately
 * publishes assets/characters/kairo.vrm on GitHub Pages. No external uploads.
 */
(function(root){
 'use strict';
 const NAME='sky-clash-v66-characters',STORE='models',KEY='kairo';
 let localUrl=null;
 function database(){
  return new Promise((ok,fail)=>{
   if(!root.indexedDB)return fail(Error('This browser does not support persistent local models'));
   const req=root.indexedDB.open(NAME,1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
   req.onsuccess=()=>ok(req.result);req.onerror=()=>fail(req.error||Error('Could not open model storage'));
  });
 }
 async function saved(){
  const db=await database();
  return new Promise((ok,fail)=>{
   const txn=db.transaction(STORE,'readonly'),q=txn.objectStore(STORE).get(KEY);
   q.onsuccess=()=>ok(q.result||null);q.onerror=()=>fail(q.error);txn.oncomplete=()=>db.close();
  });
 }
 async function put(file){
  if(!file||file.size>30*1024*1024||file.size<100000)throw Error('Choose a valid VRM file under 30 MB');
  if(!/\.vrm$/i.test(file.name))throw Error('Please select a .vrm character model');
  const prefix=await file.slice(0,20).arrayBuffer(),view=new DataView(prefix);
  if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(12,true)<200||view.getUint32(16,true)!==0x4e4f534a)
   throw Error('This is not a valid VRM / glTF 2 binary');
  const db=await database();
  return new Promise((ok,fail)=>{
   const txn=db.transaction(STORE,'readwrite');
   txn.objectStore(STORE).put(file,KEY);
   txn.oncomplete=()=>{db.close();ok();};
   txn.onerror=()=>{db.close();fail(txn.error||Error('Could not save VRM'));};
  });
 }
 async function remove(){
  const db=await database();
  return new Promise((ok,fail)=>{
   const txn=db.transaction(STORE,'readwrite');txn.objectStore(STORE).delete(KEY);
   txn.oncomplete=()=>{db.close();ok();};txn.onerror=()=>{db.close();fail(txn.error);};
  });
 }
 async function resolve(){
  // Local selection overrides public model so the owner can trial replacements.
  try{
   const file=await saved();
   if(file){if(localUrl)root.URL.revokeObjectURL(localUrl);
     localUrl=root.URL.createObjectURL(file);return {url:localUrl,source:'browser',name:file.name};}
  }catch(e){console.warn('V66 local character storage unavailable',e);}
  const url='assets/characters/kairo.vrm';
  try{const resp=await fetch(url,{method:'HEAD',cache:'no-cache'});
   if(resp.ok)return {url,source:'github',name:'Kairo VRM'};
  }catch(e){console.info('V66 public Kairo VRM not yet on GitHub',e);}
  return null;
 }
 function installPicker(){
  if(document.getElementById('v66ModelPicker'))return;
  const box=document.createElement('div');box.id='v66ModelPicker';
  box.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 12px);right:12px;z-index:99999;display:flex;gap:6px;align-items:center;border-radius:12px;background:rgba(10,19,37,.93);border:1px solid #6e90b3;padding:8px;color:white;box-shadow:0 3px 15px #0008;font:12px system-ui';
  const status=document.createElement('span');status.textContent='Kairo: choose VRM';status.style.cssText='max-width:145px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  const btn=document.createElement('button');btn.type='button';btn.textContent='Import VRM';
  btn.style.cssText='padding:6px 10px;border:0;border-radius:6px;background:#39cbe0;color:#071522;font-weight:700;cursor:pointer';
  const input=document.createElement('input');input.type='file';input.accept='.vrm';input.hidden=true;
  btn.onclick=()=>input.click();
  input.onchange=async()=>{
   const file=input.files?.[0];if(!file)return;
   btn.disabled=true;status.textContent='Checking VRM…';
   try{await put(file);status.textContent='Saved '+file.name+' · reloading';root.location.reload();}
   catch(e){status.textContent='Import failed: '+e.message;btn.disabled=false;}
  };
  box.append(status,btn,input);document.body.appendChild(box);
  resolve().then(x=>{if(x)status.textContent='Kairo: '+(x.source==='github'?'GitHub model':'Local VRM');})
    .catch(()=>{});
 }
 root.SkyClashCharacterStore={resolve,put,saved,remove,installPicker};
})(window);
