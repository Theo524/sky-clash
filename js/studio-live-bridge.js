/* Sky Clash — explicit same-browser Animation Studio → playable game bridge.
 * All data stays in local IndexedDB; nothing is uploaded to the hosted site.
 * The published default never reads local moves without ?studioPlaytest=local.
 */
(function(root){
 'use strict';
 const DB='sky-clash-studio-game-playtest',STORE='packs',KEY='kairo',MAX_BYTES=20*1024*1024;
 const SLOTS=Object.freeze(['idle','walk','run','jump','runStop','dodge',
  'punch1','punch2','punch3','uppercut','kick','meteor',
  'charge','superblast','hit','floating','flying','fallingIdle',
  'landing','boost','guard']);
 const allowed=new Set(SLOTS);
 function validate(pack){
  if(!pack||pack.schema!=='sky-clash.studio-gamepack.v1'||
     pack.revision!==1||!Array.isArray(pack.motions)||
     pack.motions.length<1||pack.motions.length>50)
   throw Error('Not a valid Animation Studio game motion pack');
  const slots=new Set();
  for(const m of pack.motions){
   if(!m||m.character!=='kairo'||!allowed.has(m.slot)||
      typeof m.data!=='string'||!m.data||
      !Number.isInteger(m.frames)||m.frames<3||
      m.frames>420||!Array.isArray(m.bones)||m.bones.length!==20||
      m.encoding!=='int16-le-xyzw-world-bind-delta-base64'||
      !Array.isArray(m.side)||m.side.length!==2||
      !Number.isFinite(m.side[0])||!Number.isFinite(m.side[1]))
    throw Error('Unsupported or damaged Kairo action in local game pack');
   if(slots.has(m.slot))throw Error('Duplicate local move '+m.slot);
   slots.add(m.slot);
  }
  if(JSON.stringify(pack).length>MAX_BYTES)
   throw Error('Local game moves exceed the 20 MB preview limit');
  return [...slots];
 }
 function open(){
  return new Promise((resolve,reject)=>{
   if(!root.indexedDB){reject(Error('This browser cannot save local game moves'));return;}
   const request=root.indexedDB.open(DB,1);
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains(STORE))
     request.result.createObjectStore(STORE,{keyPath:'id'});
   };
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||Error('Cannot open local move storage'));
   request.onblocked=()=>reject(Error('Close another Sky Clash tab and retry'));
  });
 }
 async function transaction(mode,work){
  const db=await open();
  try{
   return await new Promise((resolve,reject)=>{
    let value;
    const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
    tx.oncomplete=()=>resolve(value);
    tx.onerror=()=>reject(tx.error||Error('Local move storage failed'));
    tx.onabort=()=>reject(tx.error||Error('Local move storage cancelled'));
    try{work(store,x=>{value=x;});}
    catch(err){try{tx.abort();}catch(_){}reject(err);}
   });
  }finally{db.close();}
 }
 async function save(pack){
  const slots=validate(pack),updatedAt=Date.now();
  await transaction('readwrite',store=>{
   store.put({id:KEY,pack,updatedAt});
  });
  return {slots,updatedAt};
 }
 async function load(){
  const record=await transaction('readonly',(store,set)=>{
   const request=store.get(KEY);
   request.onsuccess=()=>set(request.result||null);
  });
  if(!record)return null;
  return {pack:record.pack,slots:validate(record.pack),updatedAt:record.updatedAt};
 }
 async function clear(){
  await transaction('readwrite',store=>{store.delete(KEY);});
 }
 const api={save,load,clear,validate,supportedSlots:SLOTS};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashStudioLiveBridge=api;
})(typeof window!=='undefined'?window:globalThis);
