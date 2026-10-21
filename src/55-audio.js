/* ---------------- Lightweight combat audio (procedural/offline) ---------------- */
const Sound = (() => {
  let ctx = null, last = 0;
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
  return { play };
})();

