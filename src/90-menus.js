/* ---------------- Menus ---------------- */
const Menus = (() => {
  const pause = $('pauseMenu'), title = $('titleScreen'), over = $('overScreen');
  const views = { main: $('pauseMain'), settings: $('settingsView'), controls: $('controlsView') };
  let settingsReturn = null;   // which overlay to go back to when Settings was opened from title/over
  let lastFocus = null;

  function show(el) { el.classList.add('show'); el.setAttribute('aria-hidden', 'false'); }
  function hide(el) { el.classList.remove('show'); el.setAttribute('aria-hidden', 'true'); }
  function showView(name) {
    Object.entries(views).forEach(([k, v]) => v.classList.toggle('hidden', k !== name));
    pause.querySelector('.panel').classList.toggle('wide', name === 'settings');
    const first = views[name].querySelector('button, input');
    first && first.focus({ preventScroll: true });
    pause.querySelector('.panel').scrollTop = 0;
    disarmRestart();
  }
  function openPause() { $('dojoFromPauseBtn').classList.toggle('hidden',Game.mode==='dojo'); lastFocus = document.activeElement; settingsReturn = null; show(pause); showView('main'); $('resumeBtn').focus({ preventScroll: true }); }
  function closePause() { hide(pause); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
  function openSettingsFrom(overlay) { settingsReturn = overlay; hide(overlay); show(pause); showView('settings'); }
  function back() {
    if (settingsReturn) { hide(pause); show(settingsReturn); (settingsReturn.querySelector('.mbtn') || settingsReturn.querySelector('button')).focus({ preventScroll: true }); settingsReturn = null; }
    else showView('main');
  }
  const currentView = () => Object.keys(views).find(k => !views[k].classList.contains('hidden'));

  // Restart needs a second tap so it can't be hit by accident
  let armed = false, armTimer = 0;
  const restartBtn = $('restartBtn');
  function disarmRestart() { armed = false; clearTimeout(armTimer); restartBtn.textContent = 'Restart match'; restartBtn.classList.remove('danger'); }
  restartBtn.addEventListener('click', () => {
    if (!armed) { armed = true; restartBtn.textContent = 'Tap again to restart'; restartBtn.classList.add('danger'); armTimer = setTimeout(disarmRestart, 2500); return; }
    disarmRestart(); closePause(); Game.restart();
  });
  $('resumeBtn').addEventListener('click', () => Game.resume());
  $('settingsBtn').addEventListener('click', () => showView('settings'));
  $('controlsBtn').addEventListener('click', () => showView('controls'));
  pause.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', back));
  $('startBtn').addEventListener('click', () => { hide(title); Game.startFight(); syncSettingsUI(); });
  $('trainBtn').addEventListener('click', () => { hide(title); Game.enterDojo(); syncSettingsUI(); });
  $('dojoRivalMode').addEventListener('change', e => Game.setDojoRival(e.target.value));
  $('dojoResetBtn').addEventListener('click', () => { Dojo.resetProps(); toast('Equipment reset'); });
  $('dojoHomeBtn').addEventListener('click', () => Game.returnHome());
  $('homeBtn').addEventListener('click', () => Game.returnHome());
  $('dojoFromPauseBtn').addEventListener('click', () => { closePause(); Game.enterDojo(); });
  $('titleSettingsBtn').addEventListener('click', () => openSettingsFrom(title));
  $('rematchBtn').addEventListener('click', () => { hide(over); Game.restart(); });
  $('overSettingsBtn').addEventListener('click', () => openSettingsFrom(over));
  $('overHomeBtn').addEventListener('click', () => { hide(over); Game.returnHome(); });
  // tapping the dimmed backdrop (outside the panel) resumes from the main pause view
  pause.addEventListener('pointerdown', e => { if (e.target === pause && currentView() === 'main' && !settingsReturn) Game.resume(); });

  // keyboard: Esc goes back from sub-views, Tab is trapped inside the open dialog
  document.addEventListener('keydown', e => {
    const open = [pause, title, over].find(o => o.classList.contains('show'));
    if (!open) return;
    if (e.key === 'Tab') {
      const f = [...open.querySelectorAll('button, input')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }, true);

  // ---- settings bindings ----
  const sens = $('setSens'), sensOut = $('sensOut');
  const toggles = { setLockDefault: 'lockDefault', setAutoCam: 'autoCam', setInvertY: 'invertY', setHaptics: 'haptics', setSound: 'sound', setAcrobatics: 'acrobatics', setFps: 'fps' };
  function syncSettingsUI() {
    sens.value = Settings.get('sens'); sensOut.textContent = (+Settings.get('sens')).toFixed(1);
    Object.entries(toggles).forEach(([id, k]) => $(id).checked = !!Settings.get(k));
    document.querySelectorAll('.seg').forEach(seg => {
      const v = Settings.get(seg.dataset.setting);
      seg.querySelectorAll('button').forEach(b => { b.classList.toggle('sel', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v); });
    });
  }
  sens.addEventListener('input', () => { Settings.set('sens', +sens.value); sensOut.textContent = (+sens.value).toFixed(1); });
  Object.entries(toggles).forEach(([id, k]) => $(id).addEventListener('change', e => Settings.set(k, e.target.checked)));
  document.querySelectorAll('.seg').forEach(seg => seg.querySelectorAll('button').forEach(b =>
    b.addEventListener('click', () => { Settings.set(seg.dataset.setting, b.dataset.v); syncSettingsUI(); })));
  $('resetSettingsBtn').addEventListener('click', () => { Settings.reset(); syncSettingsUI(); toast('Settings reset'); });
  syncSettingsUI();

  function showOver(won, score) {
    $('overH').textContent = won ? 'Victory' : 'Defeat';
    $('overSub').textContent = score ? (won ? 'You won the match ' : 'Your rival won the match ') + score + '.' : (won ? 'You defeated your rival.' : 'Your rival won.');
    show(over); $('rematchBtn').focus({ preventScroll: true });
  }
  return { openPause, closePause, showOver, currentView, back, get settingsReturn() { return settingsReturn; } };
})();

let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1400); }


