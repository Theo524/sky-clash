/* ---------------- Lightweight combat audio (procedural/offline) ---------------- */
const Sound = (() => {
  let ctx = null, last = 0, stormLast = -1, noiseBuffer = null;
  const config = {
    hit: [155, 58, 0.075, 'triangle', 0.075],
    heavy: [125, 38, 0.15, 'sawtooth', 0.105],
    parry: [540, 1050, 0.16, 'sine', 0.085],
    block: [245, 105, 0.075, 'triangle', 0.055],
    blast: [540, 190, 0.2, 'sawtooth', 0.06],
    charge: [320, 95, 0.36, 'triangle', 0.12],
    dash: [330, 105, 0.13, 'sawtooth', 0.045],
    vanish: [750, 170, 0.12, 'sine', 0.065],
    awaken: [180, 760, 0.6, 'triangle', 0.095],
  };
  function play(which) {
    if (!Settings.get('sound')) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio || !config[which]) return;
    try {
      if (!ctx) ctx = new Audio();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      // Cap identical impact bursts: keeps sound clean during fast, overlapping combos.
      if (now - last < 0.024 && (which === 'hit' || which === 'block')) return;
      last = now;
      const [start, end, dur, wave, vol] = config[which];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = wave; o.frequency.setValueAtTime(start, now);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + dur);
      g.gain.setValueAtTime(0.001, now); g.gain.exponentialRampToValueAtTime(vol, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + dur + 0.015);
      o.onended = () => { o.disconnect(); g.disconnect(); };
    } catch (err) { /* browsers may disable audio; the game remains playable */ }
  }
  function stormContext(){
    if(!Settings.get('sound'))return null;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return null;
    if(!ctx)ctx=new Audio();
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    return ctx;
  }
  function voice(audio,source,duration,volume,pan,filter=null){
    const now=audio.currentTime,gain=audio.createGain();
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(volume,now+.003);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    let output=gain,panner=null;
    if(audio.createStereoPanner){
      panner=audio.createStereoPanner();panner.pan.setValueAtTime(Math.max(-.65,Math.min(.65,pan||0)),now);
      gain.connect(panner);output=panner;
    }
    source.connect(filter||gain);if(filter)filter.connect(gain);
    output.connect(audio.destination);source.start(now);source.stop(now+duration+.01);
    source.onended=()=>{source.disconnect();gain.disconnect();if(filter)filter.disconnect();if(panner)panner.disconnect();};
  }
  function air(audio,start,end,duration,volume,pan){
    // Original synthesized broadband pressure: no downloaded sound assets.
    if(!noiseBuffer){
      noiseBuffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*.35),audio.sampleRate);
      const data=noiseBuffer.getChannelData(0);let seed=0x4b414952;
      for(let i=0;i<data.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
        data[i]=((seed>>>0)/4294967295)*2-1;}
    }
    const source=audio.createBufferSource(),filter=audio.createBiquadFilter();source.buffer=noiseBuffer;
    filter.type='bandpass';filter.Q.setValueAtTime(.72,audio.currentTime);
    filter.frequency.setValueAtTime(start,audio.currentTime);
    filter.frequency.exponentialRampToValueAtTime(end,audio.currentTime+duration);
    voice(audio,source,duration,volume,pan,filter);
  }
  function stormSwing(stage,kick,pan=0){
    try{
      const audio=stormContext();if(!audio)return;
      air(audio,kick?750:1250,kick?2700:3600,kick?.13:.075,kick?.055:.033,pan);
    }catch(err){/* Audio support must not interrupt a strike. */}
  }
  function stormImpact(stage,kick,pan=0){
    try{
      const audio=stormContext();if(!audio||audio.currentTime-stormLast<.024)return;
      stormLast=audio.currentTime;
      const heavy=kick||stage>=3,now=audio.currentTime;
      const tone=audio.createOscillator();tone.type='triangle';
      tone.frequency.setValueAtTime(heavy?142:205+stage*19,now);
      tone.frequency.exponentialRampToValueAtTime(heavy?43:74,now+(heavy?.11:.065));
      voice(audio,tone,heavy?.13:.08,heavy?.078:.055,pan);
      air(audio,heavy?1700:2650,heavy?450:880,heavy?.105:.055,heavy?.11:.072,pan);
    }catch(err){/* Muted/unsupported audio leaves gameplay unchanged. */}
  }
  return { play, stormSwing, stormImpact };
})();

