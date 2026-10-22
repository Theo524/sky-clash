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
 window.HERO_VRM_URL=selected?.url||null;
 window.HERO_VRM_B64=null;
 try{
  await script('js/game.js?v=660');
  await script('js/v62-playable-master.js?v=660');
  await script('js/v63-recorded-motion.js?v=640');
  console.info('Sky Clash V66 model source:',selected?.source||'procedural fallback');
 }catch(err){
  console.error('Sky Clash V66 boot failed',err);
  const status=document.getElementById('bootStatus');
  if(status)status.textContent='Could not start game: '+err.message;
 }
 store?.installPicker?.();
 if(!selected){
  const message=document.getElementById('toast');
  if(message)message.textContent='Import Boy TBB VRM below to replace the placeholder fighter.';
 }
})();
