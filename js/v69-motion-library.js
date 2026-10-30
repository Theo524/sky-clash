/* Sky Clash V69 — private, persistent Animation Studio FBX/ZIP collection.
 * The files remain on the user's device in IndexedDB, not uploaded to GitHub.
 * Cache the ORIGINAL ZIP (once), not each unzipped FBX: avoids multiplying
 * disk use for Mixamo packs with hundreds of clips.
 */
(function(root){
 'use strict';
 const DB='sky-clash-animation-studio-v69',TABLE='original-files',MAX_BYTES=400*1024*1024;
 function open(){
  return new Promise((resolve,reject)=>{
   if(!root.indexedDB)return reject(Error('Persistent library not supported in this browser'));
   const request=root.indexedDB.open(DB,1);
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains(TABLE))request.result.createObjectStore(TABLE,{keyPath:'id'});
   };
   request.onerror=()=>reject(request.error||Error('Could not open motion library'));
   request.onsuccess=()=>resolve(request.result);
   request.onblocked=()=>reject(Error('Another tab is blocking the animation library'));
  });
 }
 function key(file){return [file.name,file.size,file.lastModified||0].join('::');}
 function transact(db,mode,operation){
  return new Promise((resolve,reject)=>{
   let result;
   const tx=db.transaction(TABLE,mode);
   tx.oncomplete=()=>resolve(result);
   tx.onerror=()=>reject(tx.error||Error('Motion library transaction failed'));
   tx.onabort=()=>reject(tx.error||Error('Motion library operation cancelled'));
   try{operation(tx.objectStore(TABLE),x=>{result=x;});}
   catch(e){try{tx.abort();}catch(_){}reject(e);}
  }).finally(()=>db.close());
 }
 async function records(){
  const db=await open();
  return transact(db,'readonly',(store,set)=>{
   const request=store.getAll();
   request.onsuccess=()=>set(request.result||[]);
   request.onerror=()=>{};
  });
 }
 function toFile(row){
  if(!row?.blob||!row.name)return null;
  // File's original lastModified preserves the import catalog's ID so
  // saved action assignments reconnect to exactly the same FBX/ZIP.
  const file=new File([row.blob],row.name,{type:row.type||'application/octet-stream',lastModified:row.lastModified||0});
  // Retain explicit source provenance across browser restarts without
  // renaming the original file or changing assignment reference IDs.
  if(row.source)file.skyClashSource=row.source;
  return file;
 }
 async function list(){
  const rows=await records();
  return rows.filter(r=>r?.blob).sort((a,b)=>a.added-b.added).map(toFile).filter(Boolean);
 }
 async function save(file,{source=null}={}){
  if(!file||!/\.(fbx|zip)$/i.test(file.name))throw Error('Expected original FBX or ZIP file');
  if(file.size>MAX_BYTES)throw Error('Motion pack exceeds 400 MB cache limit');
  const rows=await records(),id=key(file);
  const existing=rows.find(r=>r.id===id);
  if(existing){
   if(source&&existing.source!==source){
    const db=await open();
    await transact(db,'readwrite',store=>{store.put({...existing,source});});
   }
   return {saved:false,bytes:rows.reduce((t,r)=>t+(r.size||0),0),count:rows.length};
  }
  const bytes=rows.reduce((t,r)=>t+(r.size||0),0);
  if(bytes+file.size>MAX_BYTES)throw Error('Offline motion cache is full (400 MB). Clear old packs or use fewer ZIP files.');
  const db=await open();
  await transact(db,'readwrite',store=>{
   store.put({id,name:file.name,type:file.type||'application/octet-stream',
    size:file.size,lastModified:file.lastModified||0,added:Date.now(),blob:file,
    source:source||file.skyClashSource||null});
  });
  return {saved:true,bytes:bytes+file.size,count:rows.length+1};
 }
 async function clear(){
  const db=await open();
  await transact(db,'readwrite',store=>{store.clear();});
 }
 async function info(){
  const rows=await records();
  return {count:rows.length,bytes:rows.reduce((t,r)=>t+(r.size||0),0),limit:MAX_BYTES};
 }
 const api={save,list,clear,info,key,limit:MAX_BYTES};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashMotionLibrary=api;
})(typeof window!=='undefined'?window:globalThis);
