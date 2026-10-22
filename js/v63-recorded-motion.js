/* Sky Clash V63 — recorded fighting motion on the playable V60 master.
 * Uses the already-baked Mixamo FBX quaternion recordings (28 clips) and
 * Quaternius CC0 walk/jog/sprint/jump clips. No runtime FBX, VRM or remote CDN.
 * Source recordings store neutralised world-space REST deltas; recover local
 * deltas in hierarchy order and apply them to the V62 synthetic bone chain.
 * Visual-only: gameplay coordinates and attack contact remain authoritative.
 * ?classic=1 bypasses V62/V63; ?motion=procedural keeps V62 pose driver.
 */
(function () {
 'use strict';
 if (new URLSearchParams(location.search).get('classic')==='1' ||
     new URLSearchParams(location.search).get('motion')==='procedural') return;
 const THREE=window.THREE, game=window.SkyClash?.Game;
 if (!THREE||!game) return;
 const BONE_NAMES=[
  'hips','spine','spine1','spine2','neck','head',
  'leftshoulder','leftarm','leftforearm','lefthand',
  'rightshoulder','rightarm','rightforearm','righthand',
  'leftupleg','leftleg','leftfoot','lefttoebase',
  'rightupleg','rightleg','rightfoot','righttoebase'
 ];
 const PARENTS=[-1,0,1,2,3,4,3,6,7,8,3,10,11,12,0,14,15,16,0,18,19,20];
 const LOWER=new Set([14,15,16,17,18,19,20,21]);
 const upperWeight=i=>LOWER.has(i)?0:i===0?.35:i<6?.72:1;
 const status= {ready:false,motion:'loading',source:'',error:null};
 window.SkyClash.v63=status;
 const qA=new THREE.Quaternion(),qB=new THREE.Quaternion(),qInv=new THREE.Quaternion();
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
 const pose=()=>Array.from({length:22},()=>new THREE.Quaternion());
 // The existing JS sources are *data files* here: parse only JSON metadata and
 // base64 keyframes. Never evaluate or inject fetched source code.
 async function loadPack(url,metaName,rawName){
  const response=await fetch(url,{cache:'no-cache'});
  if(!response.ok)throw Error('Motion data '+response.status+': '+url);
  const source=await response.text();
  const metaRE=new RegExp('const '+metaName+' = (\\{[^\\n]+\\});');
  const rawRE=new RegExp('const '+rawName+" = '([A-Za-z0-9+/=]+)';");
  const metaHit=metaRE.exec(source),rawHit=rawRE.exec(source);
  if(!metaHit||!rawHit)throw Error('Missing baked motion payload: '+url);
  const meta=JSON.parse(metaHit[1]), clips=meta.clips||meta;
  const bin=atob(rawHit[1]), bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  if(bytes.byteLength%2)throw Error('Corrupted motion byte length: '+url);
  const data=new Int16Array(bytes.buffer);
  for(const [name,c] of Object.entries(clips)){
   if(!Number.isInteger(c.o)||c.o<0||c.n<2||c.o+c.n*91>data.length)throw Error('Invalid baked clip: '+name);
  }
  return {clips,data,source:url};
 }
 function sample(pack,name,time,out){
  const c=pack.clips[name];
  if(!c)throw Error('Unknown recorded motion '+name);
  const frames=c.n-1;
  let f=(time*30)%frames;
  if(f<0)f+=frames;
  const i0=Math.floor(f),i1=Math.min(frames,i0+1),u=f-i0;
  const a=c.o+i0*91,b=c.o+i1*91,buf=pack.data,unit=1/32767;
  for(let i=0;i<22;i++){
   const x=a+i*4,y=b+i*4;
   qA.set(buf[x]*unit,buf[x+1]*unit,buf[x+2]*unit,buf[x+3]*unit).normalize();
   qB.set(buf[y]*unit,buf[y+1]*unit,buf[y+2]*unit,buf[y+3]*unit).normalize();
   out[i].slerpQuaternions(qA,qB,u).normalize();
  }
  return out;
 }
 function attach(fighter,mixamo,recorded){
  const rig=fighter?.v62Master;
  if(!rig||fighter.v63Recorded)return false;
  const bones=BONE_NAMES.map(n=>rig.bones.get(n));
  if(bones.some(b=>!b))throw Error('V62 master is missing humanoid joints');
  // The baked quaternions are world-space deltas from a different rest
  // skeleton. Re-reference EACH source to its own neutral first frame so
  // V64's explicit martial guard remains the zero pose. The action layer and
  // locomotion layer can then be blended without swinging elbows through the
  // chest on their first frame.
  const mixRef=pose(),walkRef=pose();
  sample(mixamo,'mxKIdle',0,mixRef);
  sample(recorded,'walk',0,walkRef);
  const mixInv=mixRef.map(q=>q.clone().invert());
  const walkInv=walkRef.map(q=>q.clone().invert());
  function toGuard(p,source){
   const reference=source===mixamo?mixInv:walkInv;
   for(let i=0;i<22;i++)p[i].multiply(reference[i]).normalize();
   return p;
  }
  const state={
    fighter,clock:0,phase:0,idle:0,attack:null,serial:fighter.attackSerial,
    base:pose(),walk:pose(),strike:pose(),last:pose(),desired:pose(),local:pose(),
    active:'mxKIdle'
  };
  for(const q of state.last)q.identity();
  const before=fighter.animate.bind(fighter);
  fighter.animate=function(dt){
   before(dt); // authoritative physics, VFX, and procedural fallback
   try{
    const f=fighter,delta=clamp(Number.isFinite(dt)?dt:0,0,.08);
    state.clock+=delta;
    const hs=Math.hypot(f.vel.x,f.vel.z);
    const ground=!f.flying&&!f.launched&&!f.spiked;
    let baseClip='mxKIdle',pack=mixamo;
    if(f.hp<=0){baseClip='death';pack=recorded;}
    else if(!ground){baseClip='jumpAir';pack=recorded;}
    else if(hs>.55){
     baseClip=f.sprinting||f.dashing?'sprint':'walk';pack=recorded;
    }
    if(ground&&hs>.55){
     state.phase=(state.phase+delta*clamp(hs/3.9,.5,2.5))%1;
     const c=pack.clips[baseClip];
     toGuard(sample(pack,baseClip,state.phase*c.d,state.base),pack);
     if(baseClip==='walk'&&hs>5){
      const run=recorded.clips.jog, w=ease((hs-5)/7);
      toGuard(sample(recorded,'jog',state.phase*run.d,state.walk),recorded);
      for(let i=0;i<22;i++)state.base[i].slerp(state.walk[i],w);
     }
    }else{
     state.idle+=delta;
     toGuard(sample(pack,baseClip,state.idle,state.base),pack);
    }
    if(f.punchT>0&&state.serial!==f.attackSerial){
     state.serial=f.attackSerial;
     const kind=f.attackKind||'punch';
     const name=kind==='kick'||kind==='skyKick'||kind==='ninjaSpin'?'mxRRoundhouse':
       kind==='hook'?'mxKHook':kind==='airStrike'?'mxKElbow':
       f.punchSide===1?'mxKJab':'mxKJabCross';
     state.attack={name,kind,weight:0,progress:0,fade:0};
    }
    if(state.attack){
     const a=state.attack,c=mixamo.clips[a.name];
     if(f.punchT>0){
      a.progress=clamp(f.attackElapsed/Math.max(.08,f.attackTotal||.4),0,1);
      a.weight=Math.min(1,a.weight+delta*18);a.fade=0;
     }else{
      a.fade+=delta;a.weight=Math.max(0,a.weight-delta*7.5);
     }
     if(a.weight<=.001){state.attack=null;}
     else{
      // Use anticipation -> contact -> recovery, not just one frozen hit pose.
      const start=a.kind==='kick'||a.kind==='skyKick'?.18:.10;
      const span=a.kind==='kick'||a.kind==='skyKick'?1.95:1.2;
      toGuard(sample(mixamo,a.name,Math.min(c.d-.005,start+a.progress*span),state.strike),mixamo);
      const punch=!['kick','skyKick','ninjaSpin'].includes(a.kind);
      const w=a.weight*(f.punchT>0?Math.min(1,.35+ease(a.progress/.13)*.65):1);
      for(let i=0;i<22;i++){
       const portion=punch?upperWeight(i):i===0?.65:1;
       state.base[i].slerp(state.strike[i],w*portion);
      }
     }
    }
    // Keyframes are recorded WORLD rest deltas. Convert to local deltas
    // relative to the *parent's* recorded world delta, not the previous
    // frame's rotations. This avoids compounding and bone-roll instability.
    const alpha=1-Math.exp(-delta*15);
    for(let i=0;i<22;i++){
     const parent=PARENTS[i],target=state.local[i];
     if(parent<0)target.copy(state.base[i]);
     else target.copy(qInv.copy(state.base[parent]).invert()).multiply(state.base[i]);
     state.last[i].slerp(target,alpha);
     bones[i].quaternion.copy(state.last[i]);
    }
    state.active=state.attack?.name||baseClip;
    status.motion=state.active;
   }catch(e){
    status.error=String(e);console.error('V63: recorded motion failed; reverting to V62 for '+fighter.name,e);
    fighter.animate=before;fighter.v63Recorded=null;
   }
  };
  fighter.v63Recorded=state;
  return true;
 }
 Promise.all([
  loadPack('src/41-mixamo-animations.js?v=630','meta','raw'),
  loadPack('src/40-recorded-animations.js?v=630','META','RAW')
 ]).then(([mixamo,recorded])=>{
  for(const name of ['mxKIdle','mxKJab','mxKJabCross','mxKHook','mxRRoundhouse']){
   if(!mixamo.clips[name])throw Error('Required Mixamo clip missing: '+name);
  }
  for(const name of ['walk','jog','sprint','jumpAir','death']){
   if(!recorded.clips[name])throw Error('Required locomotion clip missing: '+name);
  }
  const fighters=[game.heroes?.kairo_venn||game.player,game.enemy];
  let count=0;
  for(const fighter of fighters)if(attach(fighter,mixamo,recorded))count++;
  if(!count)throw Error('V62 native master could not be found');
  status.ready=true;status.source='recorded Mixamo + Quaternius motion; gameplay root movement';
  status.motion='mxKIdle';
  console.info('Sky Clash V63: recorded FBX keyframes driving '+count+' gameplay master rigs; Mixamo actions and CC0 locomotion.');
 }).catch(e=>{status.error=String(e);console.error('Sky Clash V63: leaving V62 fallback active',e);});
})();
