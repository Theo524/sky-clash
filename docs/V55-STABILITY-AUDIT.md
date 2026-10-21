# Sky Clash V55 — Stability and ninja-rig repair

This is a **targeted reliability repair** based on the V54.2 gameplay files. It is not a new full game or a new avatar. Preserve both installed VRM assets and all assets already in your repository.

## Confirmed root causes and changes

1. **Rin's double jump crashed a game frame.** `Fighter.animateRig`'s `ninjaLeap` path tried to reassign its `const A` action object. On second jump, this threw a JavaScript error before the animation loop could queue the next frame. The invalid assignment was removed; the actual ninja tuck remains in the pose builder. A 200-frame simulated jump/landing test now exercises the live animation method.
2. **Rin's VRM 0.x axes were not the same as Kairo's VRM 1.x.** The VRM 0.x skeleton has left-arm rest vectors along negative X; the newer model's native coordinates use the opposite facing convention. `rotateVRM0` corrects the displayed model yaw but does not make each humanoid bone's procedural local quaternion magically equivalent. V55 explicitly conjugates Rin's procedural joint rotations through the 180-degree Y coordinate change. The result is correct upper-arm, leg, spine and head rotation sense in the older rig.
3. **Recorded clips were not safely retargeted to Rin.** V54 Mixamo/Quaternius world-space deltas can warp that VRM 0.x body even after the earlier FBX Euler-order correction. V55 **turns off those live recorded overlays for Rin**, preserving her procedural hand-to-hand combo, second jump, unique sprint, shurikens, and dodge states. This is a deliberate stability tradeoff pending a bone-by-bone calibrated retarget system. Rin's experimental animation preview in the dojo is disabled; Kairo's remains available.
4. **Forward lean and stiff strafing were compounded.** V55 reduces grounded Rin's root lean and sprint spine bend, preserves an asymmetric open-hand guard and replaces static side-stride knees with a phase-driven lifting/landing cycle. Both fighters now keep procedural foot timing as the primary grounded locomotion driver rather than adding the old recorded walking joint rotations.
5. **Foot penetration.** The VRM ankle/toe floor-height correction gets a greater model lift range with faster settling to correct shoes intersecting uneven terrain. Gameplay collision and health positions are untouched.
6. **Kairo's energy release.** Old charge-pose animation blending is fully cleared on the first blast release frame so two-arm projection cannot fight with a residual recorded upper-body pose. Kairo's existing kick choreography remains in place.
7. **Hardening.** Unexpected VRM rig animation failures now fall back to the procedural fighter instead of terminating the frame. A global frame error is logged and pauses the match while allowing subsequent rendering/UI frames to run. Character reload/restart clears any queued Kairo clip state.

## Testing

- `node --check js/game.js` successful.
- Source-to-bundle equality verified.
- 21 JavaScript test suites passing, including VRM0 rig direction and grounded feet, live 200-frame jump/landing, moving melee at 30/60/120 FPS, three-phase aerial follow-ups, projectile effects, and dojo collisions.
- VRM model files were not changed.
- **Limitation:** Browser visual tests could not navigate to the local server (`net::ERR_BLOCKED_BY_ADMINISTRATOR`), so appearance, exact foot contacts and shader behavior require a real-device test after deployment. The changes are designed to prevent the reported failures but have not been visually verified in a live game.

## Installation

1. Extract V55 GitHub Update ZIP.
2. Upload its contents into your repository, **preserving paths**. Replace matching files (especially `index.html` and `js/game.js` along with edited `src/` files).
3. Wait for GitHub Pages to deploy and hard-refresh your browser (Ctrl+F5 on Windows) to load `js/game.js?v=550`.
4. Select Rin and check idle guard, regular walk, directional strafe, first/second jump, 4-hit melee, shuriken throw, sprint and landing; then select Kairo and test charge/release, punches and kick.

No standalone animation FBX, VRM, or full project files are included in this update ZIP.
