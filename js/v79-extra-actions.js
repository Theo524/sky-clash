/* Sky Clash V79 — optional specific Mixamo action scheduling.
 *
 * User's Movement pack contains actual animation recordings for:
 * run-to-stop, four long idle variants, falling idle, falling-to-roll.
 * Baked assets are loaded from optional extra-actions-v1.json; absent
 * pack leaves V77 idle/V76 upper body/locomotion completely unchanged.
 *
 * Idle variations are intentionally rare, interruptible and deterministic
 * (roughly every 12–26s of truly idle gameplay, not once each few frames).
 * Punches/blocking/stun/jump cancel optional gestures with original gameplay
 * priority. All motion sampling/VRM retarget reuses V72 publication layer.
 */
(function(root){
 'use strict';
 const PATH='assets/animations/gameplay/extra-actions-v1.json';
 const OPTIONAL=['runStop','idle3','idle4','idle5','idleAdventure','fallingIdle','fallToRoll'];
 const LOOPS=['fallingIdle'];
 const STATE=new WeakMap();
 const speedOf=f=>Math.hypot(f.vel?.x||0,f.vel?.z||0);
 const seq=['idle3','idleAdventure','idle4','idle5'];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function choose(f,actions,dt){
  let s=STATE.get(f);
  if(!s){
   // Small reproducible PRNG per fighter: idle gestures feel random,
   // but tests/replays remain deterministic and rivals can differ.
   let seed=0x1c3a59ef;
   for(const c of String(f.name||'Kairo'))seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
   s={clock:0,rest:0,nextIdle:12,variant:0,lastVariant:null,seed,
    active:null,elapsed:0,wasAir:false,wasDescending:false,speed:0,
    boostWasActive:false,boostStopWindow:0,fallHeight:0,fallSpeed:0,runAge:99};
   STATE.set(f,s);
  }
  dt=clamp(Number.isFinite(dt)?dt:0,0,.08);
  const speed=speedOf(f);
  const wasAir=s.wasAir,wasDescending=s.wasDescending;
  const inAir=!!(f.jumping||f.flying||f.launched||f.spiked);
  const descending=inAir&&!f.launched&&!f.spiked&&(f.vel?.y||0)<-1.1;
  // Only an explicit Boost->non-Boost change can arm the dramatic stop.
  // Normal analog walk/run must never trigger it, even at full joystick.
  const boostFinished=s.boostWasActive&&!f.sprinting;
  s.boostWasActive=!!f.sprinting;
  if(boostFinished&&!inAir)s.boostStopWindow=.62;
  else s.boostStopWindow=Math.max(0,s.boostStopWindow-dt);
  if(inAir){
   s.fallHeight=Math.max(s.fallHeight,Math.max(0,(f.pos?.y||0)-(f.floor||0)));
   if(descending)s.fallSpeed=Math.max(s.fallSpeed,Math.abs(f.vel?.y||0));
  }
  const landedAfterDrop=wasDescending&&!inAir&&s.fallHeight>4.4&&s.fallSpeed>6.5;
  if(!inAir&&!wasAir&&!wasDescending){s.fallHeight=0;s.fallSpeed=0;}
  const hostile=f.hp<=0||f.punchT>0||f.blastT>0||f.superHitT>0||
   f.stun>0||f.downT>0||f.slamming||f.blocking||f.blockHeld||
   f.charging||f.dashing||f.acro;
  if(f.sprinting)s.runAge=0;else s.runAge+=dt;
  s.wasAir=inAir;s.wasDescending=descending;
  s.clock+=dt;
  if(hostile){
   s.active=null;s.rest=0;s.elapsed=0;s.nextIdle=12;
   s.speed=speed;return null;
  }
  if(s.active){
   if(s.active==='fallingIdle'&&!descending)s.active=null;
   else if(s.active==='runStop'&&(inAir||f.sprinting||
            Math.hypot(f.moveIntent?.x||0,f.moveIntent?.z||0)>.72))s.active=null;
   else if(s.active.startsWith('idle')&&(inAir||speed>.6))s.active=null;
   else if(s.active==='fallToRoll'&&(inAir||speed>3.8))s.active=null;
   else if(s.active!=='fallingIdle'){
    s.elapsed+=dt;
    if(s.elapsed>=actions[s.active]?.seconds||!actions[s.active])s.active=null;
   }
  }
  if(s.active){
   s.speed=speed;return s.active;
  }
  // A falling-to-roll is selected only on transition from a downward
  // fall into grounded movement. Don't roll from ordinary jump ascent/flight.
  if(landedAfterDrop&&!f.sprinting&&speed>2.4&&actions.fallToRoll){
   // A proper roll needs a substantial FALL, horizontal motion, and floor
   // contact. Ordinary little jumps get the fighter's lightweight landing.
   s.active='fallToRoll';s.elapsed=0;s.rest=0;s.nextIdle=16;
  }else if(descending&&actions.fallingIdle){
   s.active='fallingIdle';s.elapsed=0;
  }else if(!inAir&&!f.sprinting&&s.boostStopWindow>0&&
           speed>1.3&&Math.hypot(f.moveIntent?.x||0,f.moveIntent?.z||0)<.52&&
           actions.runStop){
   // Boost release only; let the native ground skid drive translation/feet.
   s.active='runStop';s.elapsed=0;s.rest=0;s.boostStopWindow=0;s.nextIdle=14;
  }else if(!inAir&&!f.sprinting&&speed<.42){
   s.rest+=dt;
   if(s.rest>=s.nextIdle){
    const candidates=seq.filter(k=>!!actions[k]);
    if(candidates.length){
     s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;
     let pick=(s.seed>>>8)%candidates.length;
     if(candidates.length>1&&candidates[pick]===s.lastVariant)
      pick=(pick+1)%candidates.length;
     s.active=candidates[pick];s.lastVariant=s.active;
     s.variant++;s.elapsed=0;s.rest=0;
     s.nextIdle=12+((s.seed>>>16)%15); // varied 12–26 second intervals
    }
   }
  }else{s.rest=0;s.nextIdle=12+((s.seed>>>16)%15);}
  if(!inAir&&wasAir){s.fallHeight=0;s.fallSpeed=0;}
  s.speed=speed;
  return s.active;
 }
 async function start(context=root){
  const status={version:79,ready:false,source:PATH,clips:[],characters:0,
   active:'awaiting-gamepack',error:null};
  context.SkyClashExtraActions=status;
  if(new URLSearchParams(context.location?.search||'').get('extraActions')==='off'){
   status.active='disabled';return status;
  }
  try{
   const THREE=context.THREE,Game=context.SkyClash?.Game,
     adapter=context.SkyClashPublishedGamePack;
   if(!THREE||!Game||!adapter)throw Error('Kairo gameplay motion adapter not ready');
   const response=await context.fetch(PATH+'?v=790',{cache:'no-cache'});
   if(response.status===404){
    status.active='not-published';
    return status; // The game continues with its current perfect idle/walk.
   }
   if(!response.ok)throw Error('Optional game motions HTTP '+response.status);
   const pack=await response.json();
   if(pack?.schema!=='sky-clash.studio-gamepack.v1'||pack.revision!==1||
      !Array.isArray(pack.motions)||pack.motions.length>18)
    throw Error('Invalid V79 extra motions manifest');
   const actions={};
   for(const entry of pack.motions){
    if(!OPTIONAL.includes(entry.slot)||entry.character!=='kairo')continue;
    actions[entry.slot]=adapter.decode(THREE,entry);
   }
   if(!Object.keys(actions).length){status.active='empty-gamepack';return status;}
   let count=0;
   for(const f of [Game.heroes?.kairo_venn,Game.enemy]){
    if(!f)continue;
    const handle=adapter.attach(THREE,f,actions,status,{
     marker:'v79ExtraPack',
     choose,
     loopSlots:LOOPS
    });
    if(handle)count++;
   }
   status.ready=count>0;status.characters=count;status.clips=Object.keys(actions);
   status.active=count?'ready':'no-fighters';
  }catch(e){
   status.active='fallback';status.error=String(e);
   console.warn('V79 optional actions unavailable. All prior motions preserved',e);
  }
  return status;
 }
 const api={choose,start,OPTIONAL,LOOPS};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashV79ExtraActions=api;
})(typeof window!=='undefined'?window:globalThis);
