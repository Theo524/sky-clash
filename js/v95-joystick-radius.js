/* Sky Clash V95 — physical thumbstick radius, never keyboard magnitude.
 * Only the V94-compatible joystick-run preview installs this module.
 */
(function(root){
 'use strict';
 const ENTER=.92,EXIT=.80;
 function decide(previous,radius,allowed=true){
  if(!allowed)return false;
  const r=Number.isFinite(radius)?Math.max(0,Math.min(1,radius)):0;
  return r>=(previous?EXIT:ENTER);
 }
 function physicalRadius(stick){
  return Math.min(1,Math.hypot(stick?.x||0,stick?.y||0));
 }
 const api={version:95,ENTER,EXIT,decide,physicalRadius};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV95Joystick=api;
})(typeof window!=='undefined'?window:globalThis);
