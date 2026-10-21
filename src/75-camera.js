/* ---------------- Camera rig ----------------
 * Focus model:
 *   lockOn          – the player's chosen mode (Lock button / L)
 *   suspendT > 0    – lock temporarily released because of a dash
 *   focus (0..1)    – how much the camera frames the rival; blended smoothly
 * A dash always sets suspendT, so the camera never chases the rival mid-dash.
 */
const CameraRig = (() => {
  const rig = { yaw: 0, pitch: 0.3, dist: 8.5, focus: 0, suspendT: 0, shakeT: 0, shakeAmp: 0 };
  const look = new V3(), desired = new V3();
  function forward() { return new V3(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw)); }
  function right() { return new V3(Math.cos(rig.yaw), 0, -Math.sin(rig.yaw)); }
  function isLockActive() { return Game.lockOn && rig.suspendT <= 0 && !Game.player.moving; }
  function onDash() {
    if (Game.lockOn) {
      rig.suspendT = TUNING.relockGrace;   // counts down only once the dash ends
      if (Settings.get('dashLock') === 'stay') Game.setLock(false, true);
    }
  }
  function snapBehind(p, e) {
    rig.yaw = camYawFromForward(e.pos.x - p.pos.x, e.pos.z - p.pos.z); rig.pitch = 0.3;
    rig.focus = Game.lockOn ? 1 : 0; rig.suspendT = 0;
    update(0, true);
  }
  function update(dt, instant = false) {
    const p = Game.player, e = Game.enemy;
    if (rig.suspendT > 0 && !p.moving) rig.suspendT -= dt;
    const { dx, dy } = Input.takeLook();
    const sens = Settings.get('sens') * 0.0055;
    const locked = isLockActive();

    if (locked) {
      const target = camYawFromForward(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
      rig.yaw = lerpAngle(rig.yaw, target, instant ? 1 : damp(5, dt));
      rig.yaw -= dx * sens * 0.15;                       // tiny nudge allowed
    } else {
      rig.yaw -= dx * sens;
      if (p.moving) {
        // detached: drift gently with the dash/sprint direction, never towards the rival
        const md = p.dashing ? p.dashDir : new V3(p.vel.x, 0, p.vel.z).normalize();
        const target = camYawFromForward(md.x, md.z);
        const along = Math.abs(forward().dot(md));
        rig.yaw = lerpAngle(rig.yaw, target, damp((p.sprinting ? 2.2 : 1.5) * along, dt));
      } else if (Settings.get('autoCam') && !Input.dragging) {
        const m = Input.move();
        if (m.y > 0.35) rig.yaw = lerpAngle(rig.yaw, camYawFromForward(Math.sin(p.facing), Math.cos(p.facing)), damp(0.9 * m.y, dt));
      }
    }
    rig.pitch = clamp(rig.pitch + dy * sens * (Settings.get('invertY') ? -1 : 1), -0.35, 1.1);

    rig.focus += ((locked ? 1 : 0) - rig.focus) * (instant ? 1 : damp(locked ? 3 : 8, dt));
    // look target: player, pulled toward the rival only while focused
    desired.set(p.pos.x, p.pos.y + 1.5, p.pos.z);
    if (rig.focus > 0.001) {
      const mid = e.center.sub(desired).multiplyScalar(0.3 * rig.focus);
      mid.clampLength(0, 6); desired.add(mid);
    }
    if (instant) look.copy(desired); else look.lerp(desired, damp(14, dt));
    const d = rig.dist + (p.dashing ? 1.2 : p.sprinting ? (p.flying ? 1.8 : 1) : 0);
    const cp = Math.cos(rig.pitch);
    camera.position.set(look.x + Math.sin(rig.yaw) * cp * d, look.y + Math.sin(rig.pitch) * d, look.z + Math.cos(rig.yaw) * cp * d);
    if (camera.position.y < 0.6) camera.position.y = 0.6;
    if (rig.shakeT > 0) {
      rig.shakeT -= dt; const a = rig.shakeAmp * (rig.shakeT / 0.25);
      camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a;
    }
    camera.lookAt(look);
  }
  return { update, forward, right, onDash, snapBehind, isLockActive, shake(a) { rig.shakeT = 0.25; rig.shakeAmp = a; }, rig };
})();


