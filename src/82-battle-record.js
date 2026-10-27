/* Sky Clash battle record: completed arena matches only; persisted locally
 * per fighter. No character animations, physics, inputs or combat changes.
 */
const BattleRecord = (() => {
  'use strict';
  const KEY='skyclash.v1.battle-record';
  const ids=['kairo_venn','rin_sable'];
  const blank=()=>({wins:0,losses:0,streak:0,bestStreak:0});
  const clean=v=>{
    const safe=blank();
    if(!v||typeof v!=='object')return safe;
    for(const field of Object.keys(safe)){
      const n=Number(v[field]);
      safe[field]=Number.isSafeInteger(n)&&n>=0&&n<=999999?n:0;
    }
    safe.streak=Math.min(safe.streak,safe.wins);
    safe.bestStreak=Math.max(safe.streak,Math.min(safe.bestStreak,safe.wins));
    return safe;
  };
  const scores=Object.fromEntries(ids.map(id=>[id,blank()]));
  try {
    const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
    if(saved&&typeof saved==='object')
      for(const id of ids)scores[id]=clean(saved[id]);
  } catch (err) {
    // Storage may be unavailable (private browsing): session-only record.
  }
  function get(id){
    return {...(scores[id]||blank())};
  }
  function finish(id,won){
    if(!ids.includes(id)||typeof won!=='boolean')return null;
    const record=scores[id];
    if(won){
      record.wins++;
      record.streak++;
      record.bestStreak=Math.max(record.bestStreak,record.streak);
    }else{
      record.losses++;
      record.streak=0;
    }
    try{localStorage.setItem(KEY,JSON.stringify(scores));}catch(err){}
    render(id);
    return get(id);
  }
  function label(id){
    const s=get(id);
    const matches=s.wins+s.losses;
    const rate=matches?Math.round(s.wins*100/matches):0;
    return s.wins+' wins · '+s.losses+' losses · '+rate+'% win rate'+
      (s.streak?' · '+s.streak+' win streak':'')+
      (s.bestStreak?' · best '+s.bestStreak:'');
  }
  function render(id){
    const el=document.getElementById('battleRecord');
    if(el)el.textContent='BATTLE RECORD · '+label(id);
  }
  function showMatch(id){
    const el=document.getElementById('overRecord');
    if(el)el.textContent='Your '+(id==='rin_sable'?'Rin':'Kairo')+' record: '+label(id);
  }
  return Object.freeze({get,finish,label,render,showMatch});
})();
