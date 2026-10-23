/* Sky Clash V79 — coverage of the four USER-PROVIDED Mixamo archives.
 * Catalog references are identifiers ONLY: raw FBXs must be selected once
 * in the browser, and V69 IndexedDB keeps the originals for future visits.
 * One archive ≠ the full collection. 69 is Movement pack, NOT collection cap.
 */
(function(root){
 'use strict';
 const PACKS=Object.freeze([
  {id:'movement',name:'Movement & Acrobatics',count:69,
   directories:['Movement/','Acrobatics/'],archives:['Sky-Clash-Clean-Movement-Acrobatics-69']},
  {id:'ninja',name:'Ninja, Kicks & Capoeira',count:65,
   directories:['Ninja/','Kicks/','Capoeira/'],archives:['Sky-Clash-Clean-Ninja-Kicks-Capoeira-65']},
  {id:'magic',name:'Magic',count:56,
   directories:['Magic/'],archives:['Sky-Clash-Clean-Magic-56']},
  {id:'boxing',name:'Boxing',count:40,
   directories:['Boxing/'],archives:['Sky-Clash-Clean-Boxing-40']}
 ]);
 const expected=PACKS.reduce((n,p)=>n+p.count,0);
 function scan(imported){
  const loaded=new Set(),counts={};
  for(const pack of PACKS)counts[pack.id]=0;
  for(const item of imported){
   const name=String(item.fileName||''),origin=String(item.origin||'');
   const p=PACKS.find(p=>p.directories.some(d=>name.startsWith(d))||
      p.archives.some(s=>origin.startsWith(s)));
   if(p){
    const id=p.id+':'+name.toLowerCase();
    if(!loaded.has(id)){counts[p.id]++;loaded.add(id);}
   }
  }
  return {expected,loaded:loaded.size,complete:loaded.size===expected,
   packs:PACKS.map(p=>({...p,loaded:counts[p.id],missing:Math.max(0,p.count-counts[p.id])}))};
 }
 const api={PACKS,expected,scan};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashPackCatalog=api;
})(typeof window!=='undefined'?window:globalThis);
