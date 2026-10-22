/* Sky Clash V68: Kairo's public VRM is hosted with the game.
 * No visible character import control: the user has already published the
 * model to assets/characters/kairo.vrm. Existing local browser uploads may
 * be used as offline fallback, but the public GitHub model always wins.
 */
(function(root){
 'use strict';
 const NAME='sky-clash-v66-characters',STORE='models',KEY='kairo';
 let localUrl=null;
 function saved(){
  return new Promise(resolve=>{
   if(!root.indexedDB)return resolve(null);
   const req=root.indexedDB.open(NAME,1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
   req.onerror=()=>resolve(null);
   req.onsuccess=()=>{
    const db=req.result;
    try{
     const txn=db.transaction(STORE,'readonly'),get=txn.objectStore(STORE).get(KEY);
     get.onsuccess=()=>resolve(get.result||null);
     get.onerror=()=>resolve(null);
     txn.oncomplete=()=>db.close();
    }catch(e){db.close();resolve(null);}
   };
  });
 }
 async function resolve(){
  const url='assets/characters/kairo.vrm';
  try{
   const response=await fetch(url,{method:'HEAD',cache:'no-cache'});
   if(response.ok)return {url,source:'github',name:'Kairo VRM'};
  }catch(e){console.warn('V68 model is not reachable on GitHub Pages',e);}
  // A previously imported browser-local copy can keep a game working offline.
  try{
   const f=await saved();
   if(f){
    if(localUrl)root.URL.revokeObjectURL(localUrl);
    localUrl=root.URL.createObjectURL(f);
    return {url:localUrl,source:'browser',name:f.name||'Local VRM'};
   }
  }catch(e){console.warn('Browser-local VRM not accessible',e);}
  return null;
 }
 root.SkyClashCharacterStore={resolve,saved};
})(window);
