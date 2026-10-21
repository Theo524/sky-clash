/* Sky Clash V4
 * Systems:
 *   Settings   – persisted user options (localStorage)
 *   Input      – keyboard, mouse, touch stick, touch buttons, camera drag
 *   CameraRig  – free / locked camera; dashes detach focus from the rival
 *   Fighter    – shared fighter model + physics + actions
 *   RivalAI    – computer opponent
 *   Combat     – melee, projectiles, effects
 *   Menus      – title, pause (resume / restart / settings / controls), round over
 *   Game       – state machine + main loop
 */
(() => {
'use strict';
const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);
const wrapAngle = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const lerpAngle = (a, b, t) => a + wrapAngle(b - a) * t;
const yawFromDir = (x, z) => Math.atan2(x, z);              // fighter facing (model faces +Z)
const camYawFromForward = (x, z) => Math.atan2(-x, -z);     // camera yaw whose forward is (x,z)
const smooth01 = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const $ = id => document.getElementById(id);

const ARENA_RADIUS = 62, CEILING = 34;
const TUNING = {
  moveSpeed: 10, walkSpeed: 9, meleeBuffer: 2.15, comboWindow: 1.9, accel: 5.5, decel: 7.5, dashPrep: 0.075, skidTime: 0.2, doubleTap: 0.3, airControl: 0.7, flySpeed: 10,
  dashSpeed: 42, dashTime: 0.22, dashCooldown: 0.42, dashCost: 10,
  relockGrace: 0.45,
  meleeRange: 2.5, kickDelay: 0.1, kickHitStop: 0.105, meleeArc: 1.25, meleeDamage: 6, meleeCooldown: 0.3, lungeRange: 4.25,
  // V49: short pursuit tied to the active strike frames; never full-screen homing.
  meleePursuitRange: 5.35, meleePursuitHeight: 4.0, meleePursuitGround: 2.65,
  meleePursuitAir: 3.5, meleePursuitSpeedGround: 17.5, meleePursuitSpeedAir: 20.0,
  // V50: airborne extensions unlock ONLY after a confirmed ground launcher.
  airFollowWindow: 1.35, airFollowRange: 7.8, airFollowHeight: 6.3,
  airFollowBudget: 5.4, airFollowSpeed: 23.0,
  blastSpeed: 44, blastDamage: 9, blastCost: 14, blastCooldown: 0.34, blastAssistAngle: 0.38,
  awakenCost: 50, awakenTime: 12, awakenSpeed: 1.35, awakenDamage: 1.5, awakenChargeTime: 2.10, awakenGaugeMax: 100, defensiveVanishWindow: 0.85,
  energyRegen: 7,
  // Dedicated physical stamina. Unlike ki, it cannot be refilled by Dojo energy perks.
  staminaMax: 100, staminaSprintGround: 16.5, staminaSprintAir: 22,
  staminaDash: 17, staminaVanish: 14, staminaRecovery: 24,
  staminaRestDelay: 0.72, staminaExhaustThreshold: 28,
  jumpVel: 14, gravity: 34, jumpToFly: 0.28, slamMinHeight: 1.6, slamWind: 0.14, slamSpeed: 42, slamRadius: 5.5, slamDamage: 12, slamUp: 10, slamLag: 0.3,
  sprintSpeed: 23, flySprintSpeed: 30, sprintTurn: 4.5, sprintDrainGround: 2, sprintDrainAir: 6, sprintMinEnergy: 4,
  vanishCost: 20, vanishRefund: 12, vanishCooldown: 0.9, vanishHide: 0.13, vanishInvuln: 0.32, vanishBehind: 2.6, vanishRange: 32, vanishStun: 0.55,
  launchUp: 17, launchStun: 0.95, juggleMax: 6, airHitStun: 0.7, spikeSpeed: 34, downTime: 0.8, chaseRange: 16, techCost: 15,
  chargeMin: 0.22, chargeTime: 0.98, chargeDmg: 19, chargeCost: 26, chargeMove: 0.4,
  guardMax: 100, guardRegen: 30, guardRegenDelay: 0.9, blockMove: 0.35, blockChip: 0.15, parryWindow: 0.18, parryStun: 0.75, guardBreakStun: 1.1,
};

/* ---------------- Settings ---------------- */
const Settings = (() => {
  const KEY = 'skyclash.v4.settings';
  const defaults = { sens: 1.0, dashLock: 'resume', difficulty: 'normal', quality: 'medium',
    lockDefault: false, rival: 'fight', cameraDist: 'standard', autoCam: true, invertY: false, haptics: true, sound: true, acrobatics: true, fps: false, rounds: '3', timer: '99' };
  let data = { ...defaults };
  try { Object.assign(data, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const listeners = [];
  return {
    get: k => data[k],
    set(k, v) { data[k] = v; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} listeners.forEach(f => f(k, v)); },
    reset() { Object.keys(defaults).forEach(k => this.set(k, defaults[k])); },
    onChange: f => listeners.push(f),
    all: () => ({ ...data }),
  };
})();


