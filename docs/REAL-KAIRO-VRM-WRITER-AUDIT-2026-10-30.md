# Real Kairo VRM animation writer attribution — 2026-10-30

## Evidence

The real-model test was run successfully in GitHub Actions on the PR
for this change: https://github.com/Theo524/sky-clash/actions/runs/41078248557

Reproduce on a checkout served at http://127.0.0.1:8765/ with Playwright
1.56.1 installed by running:

    node tools/real-vrm-writer-audit.cjs

Or use the manually dispatchable Kairo Real VRM Bone Writer Audit GitHub
workflow. Per-bone output, registration order and local model/boot SHA256
are uploaded as the real-kairo-vrm-writer-ownership artifact.

The headless Chromium test serves the exact game and the **actual Kairo VRM**.
It injects an observation-only hook into the boot response IN MEMORY using
Playwright's request interception, between loading js/game.js and attaching
the existing controllers. The checked-in boot, game bundle, characters,
animations, physics, controls and visual defaults are not edited.

The observation identifies installed animation wrappers as V71 (Mixamo gait),
V76 (upper body), V72 published actions (twice: normal + V79 adapter), V81
transitions, V89 grounded steps, and V100 final air pose. V62/V63 legacy
procedural guide implementations are not installed on the real Kairo rig.

## Measured ownership on the actual normalized rig

| Sample | V100 owns state? | Last observed writer on 20 Kairo body bones | Earlier changed writers |
| --- | --- | --- | --- |
| Jump | Yes | V100 on all 20 | V71 on 17 |
| Fall | Yes | V100 on all 20 | V71 on 17 |
| Landing | Yes | V100 on all 20 | V71 on 17 |
| V156 cruise | Yes | V100 on all 20 | V71 on 17 |
| V156 hover | Yes | V100 on all 20 | V71 on 17 |
| Ground idle/movement | No | Multiple, see per-bone artifact | V71, V76, V72, often V81 |
| Guard, attack, Boost | No | Multiple, see per-bone artifact | V71, V72, V81; V76 in Boost |

Unlike the synthetic fixture, real Kairo shows V71 mutating 17 body bones
even in V100-owned air frames, before V100 applies the final visible pose.
**This is evidence of overlapping writes, not a reason to remove V71:**
V100 currently wins the final observed normalized joint mutation, but
the older gait still runs. Removing it could change ground motion, the
guide rig or state transitions.

Two independent profiles were run: normal public V156 and optional
combatAnim=storm-fist-v3. In the latter, the Storm Fist V3 native set
loaded (revision storm-fist-v3) and an actual Combat.melee invocation
activated the native original-jab clip in the recorded test sample.
The baseline profile does not load the experimental native set.

## Important limits

- This counts **mutating quaternion/position method calls** on 20 normalized
  humanoid body bones plus two toes; direct component assignment, raw VRM0
  skeleton mutation, fingers and render-time skin deformation can be missed.
- State inputs are deterministically set in the isolated browser; the script
  executes Fighter.animate on the real asset, but does not reproduce every
  physical input/AI/update tick or check collision/aesthetic movement quality.
- The V89 step controller was registered, but this particular controlled
  sample did not observe its tracked joint changes. It is NOT evidence that
  V89 is unused; its step planner needs a true update-loop movement replay.
- V91 is an opt-in continuity layer and is not enabled in the public default.
- An early writer and a final writer on one bone do not necessarily conflict
  visually. This audit does not prove single-author per-bone composition.

**Engineering decision: preserve every controller for now.** A safe next
experiment is to test a narrowly gated V71 yield during V100-owned air,
with side-by-side real-Kairo pose fingerprints and transition/grounding
tests at 30/60/120 FPS. It must NOT remove V71 for walking or combat,
and requires review before any playable default changes.

Original playable rollback: backup/playable-2026-10-30.
