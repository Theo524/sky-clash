/* Sky Clash V66 game boot. Select the real Kairo VRM before the engine
 * constructs its fighters; this prevents an old mannequin from attaching
 * while the correct character loads. No binary is sent off-device.
 */
(async function(){
 'use strict';
 const store=window.SkyClashCharacterStore;
 function script(src){
  return new Promise((resolve,reject)=>{
   const e=document.createElement('script');e.src=src;e.async=false;
   e.onload=resolve;e.onerror=()=>reject(Error('Could not load '+src));document.body.appendChild(e);
  });
 }
 let selected=null;
 try{selected=await store.resolve();}catch(e){console.warn('Kairo VRM selection unavailable',e);}
 window.SKY_V66_REAL_KAIRO=!!selected;
 // Roll back only V67 hand orientation without changing the character.
 const handMode=new URLSearchParams(location.search).get('hands');
 // Studio-native hands are the new default. ?hands=legacy compares the
 // previous V67 twisted-wrist/forced-fingers version, no other changes.
 window.SKY_V73_NATIVE_HANDS=handMode!=='legacy'&&handMode!=='original';
 window.SKY_V67_FIST_CORRECTION=handMode!=='original';
 window.HERO_VRM_URL=selected?.url||null;
 window.HERO_VRM_B64=null;
 try{
  await script('js/game.js?v=730');
  await script('js/v62-playable-master.js?v=660');
  await script('js/v63-recorded-motion.js?v=640');
  await script('js/v71-mixamo-gameplay.js?v=710');
  await window.SkyClashV71Walk.start(window);
  await script('js/v72-walk-arms.js?v=720');
  await window.SkyClashV72Arms.start(window);
  await script('js/v72-published-actions.js?v=720');
  await window.SkyClashPublishedGamePack.start(window);
  console.info('Sky Clash V66 model source:',selected?.source||'procedural fallback');
 }catch(err){
  console.error('Sky Clash V66 boot failed',err);
  const status=document.getElementById('bootStatus');
  if(status)status.textContent='Could not start game: '+err.message;
 }
 if(!selected)console.warn('V68: assets/characters/kairo.vrm is missing; procedural fallback remains active');
})();
