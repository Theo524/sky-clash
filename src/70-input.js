/* ---------------- Input ---------------- */
const Input = (() => {
  const keys = new Set();
  const held = { up: false, down: false, block: false, blast: false, dash: false };
  const queued = new Set();
  // Run button: first press = run, second press within the double-tap window = dash
  let lastRunTap = -9;
  let lastBlockTap = -9;
  const pressRun = ev => { const now = (ev && ev.timeStamp ? ev.timeStamp : performance.now()) / 1000; if (now - lastRunTap < TUNING.doubleTap) { queued.add('dash2'); lastRunTap = -9; } else { queued.add('dash'); lastRunTap = now; } };
  const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
  const look = { id: null, lx: 0, ly: 0, dx: 0, dy: 0, active: false };
  const MAX = 52;
  const knob = $('stickKnob'), base = $('stickBase'), zone = $('stickZone');

  const keyAct = { Space: 'dash', KeyJ: 'melee', KeyK: 'blast', KeyT: 'awaken', KeyL: 'lock', KeyV: 'vanish' };
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); Game.togglePause(); return; }
    if (Game.state !== 'playing') return;
    if (keyAct[e.code] && !e.repeat) { if (keyAct[e.code] === 'dash') pressRun(e); else queued.add(keyAct[e.code]); }
    if (['ShiftLeft','ShiftRight','KeyB'].includes(e.code) && !e.repeat && !keys.has(e.code)) {
      const now = (e.timeStamp || performance.now()) / 1000;
      if (now - lastBlockTap < TUNING.doubleTap) { queued.add('vanish'); lastBlockTap = -9; }
      else lastBlockTap = now;
    }
    keys.add(e.code);
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));

  // Stick
  zone.addEventListener('pointerdown', e => {
    if (stick.id !== null || Game.state !== 'playing') return;
    stick.id = e.pointerId; zone.setPointerCapture(e.pointerId);
    const r = base.getBoundingClientRect();
    // floating stick: recentre under the finger if it lands outside the base
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (Math.hypot(e.clientX - cx, e.clientY - cy) > r.width * 0.7) {
      base.style.left = (e.clientX - r.width / 2) + 'px'; base.style.top = (e.clientY - r.height / 2) + 'px'; base.style.bottom = 'auto';
      stick.ox = e.clientX; stick.oy = e.clientY;
    } else { stick.ox = cx; stick.oy = cy; }
    moveStick(e);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === stick.id) moveStick(e); });
  const endStick = e => { if (e.pointerId !== stick.id) return; resetStick(); };
  zone.addEventListener('pointerup', endStick); zone.addEventListener('pointercancel', endStick);
  function moveStick(e) {
    let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy; const d = Math.hypot(dx, dy);
    if (d > MAX) { dx *= MAX / d; dy *= MAX / d; }
    stick.x = dx / MAX; stick.y = -dy / MAX;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  }
  function resetStick() {
    stick.id = null; stick.x = stick.y = 0; knob.style.transform = '';
    base.style.left = ''; base.style.top = ''; base.style.bottom = '';
  }

  // Buttons
  document.querySelectorAll('.cbtn').forEach(b => {
    const act = b.dataset.act;
    let y0 = 0, noBlock = false;
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); if (Game.state !== 'playing') return;
      b.setPointerCapture(e.pointerId); b.classList.add('pressed');
      if (act === 'fly') { y0 = e.clientY; held.up = true; held.down = false; return; }
      // one pad: hold = rise, slide down = descend
      if (act === 'block') {                                                                  // tap/hold = block or parry, double-tap = vanish
        const now = e.timeStamp / 1000;
        if (now - lastBlockTap < TUNING.doubleTap) { queued.add('vanish'); lastBlockTap = -9; noBlock = true; return; }
        lastBlockTap = now; noBlock = false; held.block = true; return;
      }
      if (act in held) held[act] = true;
      if (act === 'dash') pressRun(e); else if (!(act in held) || act === 'blast') queued.add(act);
    });
    if (act === 'fly') b.addEventListener('pointermove', e => {
      if (!b.classList.contains('pressed')) return;
      const dy = e.clientY - y0;
      if (dy > 22 && !held.down) { held.down = true; held.up = false; b.classList.add('descend'); }
      else if (dy < 10 && held.down) { held.down = false; held.up = true; b.classList.remove('descend'); }
    });
    const up = () => {
      b.classList.remove('pressed', 'descend');
      if (act === 'fly') { held.up = held.down = false; return; }
      if (act === 'block') { if (!noBlock) held.block = false; noBlock = false; held.block = false; return; }
      if (act in held) held[act] = false;
    };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  });

  // the camera label at the top doubles as the lock-on toggle
  $('camMode').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (Game.state === 'playing') queued.add('lock'); });

  // Camera drag on empty canvas area (touch or mouse)
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', e => {
    if (look.id !== null || Game.state !== 'playing') return;
    look.id = e.pointerId; look.lx = e.clientX; look.ly = e.clientY; look.active = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== look.id) return;
    look.dx += e.clientX - look.lx; look.dy += e.clientY - look.ly; look.lx = e.clientX; look.ly = e.clientY;
  });
  const endLook = e => { if (e.pointerId === look.id) { look.id = null; look.active = false; } };
  canvas.addEventListener('pointerup', endLook); canvas.addEventListener('pointercancel', endLook);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  return {
    move() {
      let x = stick.x, y = stick.y;
      if (keys.has('KeyA')) x -= 1; if (keys.has('KeyD')) x += 1;
      if (keys.has('KeyW')) y += 1; if (keys.has('KeyS')) y -= 1;
      const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
      return { x, y, mag: Math.min(1, l) };
    },
    vertical() { return ((held.up || keys.has('KeyR') || keys.has('KeyE')) ? 1 : 0) - ((held.down || keys.has('KeyF') || keys.has('KeyQ')) ? 1 : 0); },
    takeLook() {
      let dx = look.dx, dy = look.dy; look.dx = look.dy = 0;
      if (keys.has('ArrowLeft')) dx -= 10; if (keys.has('ArrowRight')) dx += 10;
      if (keys.has('ArrowUp')) dy -= 6; if (keys.has('ArrowDown')) dy += 6;
      return { dx, dy };
    },
    dashHeld() { return held.dash || keys.has('Space'); },
    blastHeld() { return held.blast || keys.has('KeyK'); },
    block() { return held.block || keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyB'); },
    get dragging() { return look.active; },
    consume(a) { if (queued.has(a)) { queued.delete(a); return true; } return false; },
    reset() {   // called on pause/restart so nothing sticks
      lastBlockTap = lastRunTap = -9; keys.clear(); queued.clear(); held.up = held.down = held.block = held.blast = held.dash = false; resetStick();
      look.id = null; look.active = false; look.dx = look.dy = 0;
      document.querySelectorAll('.cbtn.pressed').forEach(b => b.classList.remove('pressed', 'descend'));
    },
    _stick: stick,
  };
})();


