/* V58 Action Slots — pure data functions, independent from rendering. */
(function(root){
'use strict';
const slots={
  kairo:[
    ['idle','Ready Stance','Movement'],['walk','Walk','Movement'],['run','Run / Sprint','Movement'],['jump','Jump','Movement'],['dodge','Dodge / Evade','Movement'],
    ['punch1','Combo Punch 1','Combat'],['punch2','Combo Punch 2','Combat'],['punch3','Combo Punch 3','Combat'],['uppercut','Launcher Uppercut','Combat'],['kick','Combo Kick','Combat'],['meteor','Meteor Kick','Combat'],
    ['charge','Energy Charge','Powers'],['superblast','Superblast Release','Powers'],['hit','Hit Reaction','Reactions']
  ],
  rin:[
    ['idle','Ninja Ready Stance','Movement'],['walk','Stealth Walk','Movement'],['run','Ninja Run','Movement'],['jump','First Jump','Movement'],['doubleJump','Double Jump','Movement'],['dodge','Shadow Step / Dodge','Movement'],
    ['punch1','Combo Strike 1','Combat'],['punch2','Combo Strike 2','Combat'],['punch3','Combo Strike 3','Combat'],['punch4','Combo Strike 4','Combat'],['kick','Spinning Kick','Combat'],['sweep','Low Sweep','Combat'],
    ['shuriken','Shuriken Throw','Powers'],['awakening','Nightveil Awakening','Powers'],['hit','Hit Reaction','Reactions']
  ]
};
function empty(){return {kairo:{},rin:{}};}
function isSlot(f,s){return !!slots[f]?.some(x=>x[0]===s);}
function refFromItem(item){return {id:item.id,name:item.name,sourceArchive:item.origin,sourceFile:item.fileName,size:item.size,crc:item.crc||'',speed:1,yaw:0};}
function sanitize(raw){const r=empty();for(const f of Object.keys(slots)){const group=raw?.[f]||{};for(const [key] of slots[f]){const x=group[key];if(!x||typeof x!=='object'||typeof x.id!=='string'||typeof x.name!=='string')continue;r[f][key]={id:x.id,name:x.name,sourceArchive:String(x.sourceArchive||''),sourceFile:String(x.sourceFile||''),size:Number(x.size)||0,crc:String(x.crc||''),speed:Math.max(.25,Math.min(2,Number(x.speed)||1)),yaw:Math.max(-180,Math.min(180,Number(x.yaw)||0))};}}return r;}
function assign(state,f,slot,item){if(!isSlot(f,slot)||!item)return false;state[f][slot]=refFromItem(item);return true;}
function findImport(items,ref){if(!ref)return null;const exact=items.find(i=>i.id===ref.id)||items.find(i=>i.origin===ref.sourceArchive&&i.fileName===ref.sourceFile&&i.size===ref.size);if(exact)return exact;const candidates=items.filter(i=>i.fileName===ref.sourceFile&&i.size===ref.size);return candidates.length===1?candidates[0]:null;}
function count(state){return Object.values(state||{}).reduce((n,g)=>n+Object.keys(g||{}).length,0);}
const api={slots,empty,isSlot,refFromItem,sanitize,assign,findImport,count};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.SkyClashActionCore=api;
})(typeof window!=='undefined'?window:globalThis);
