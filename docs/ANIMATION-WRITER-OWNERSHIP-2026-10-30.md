# Kairo animation writer ownership — measured phase 1

October 30, 2026. This is an engineering inventory, **not** an approval to delete animation controllers.

## What is measured

Run **node tests/animation-writer-runtime-audit.js** in the repository. Set **ANIMATION_WRITER_TRACE_JSON=1** to print per-controller joint names and mutation counts.

The test reuses the existing parented Three.js humanoid fixture from tests/v100-single-pose-authority.js. It executes the unmodified shipped controller implementations and intercepts their registration of Fighter.animate. Bone quaternion and position mutator-method calls are attributed to the innermost active wrapper in the nested call stack. A call that is effectively a no-op still counts. Direct x/y/z/w assignments that bypass a mutator method are not counted. This is not a real VRM skin render or final-per-bone unique-writer test.

## Instrumented chain, in install order

| Layer | What the implementation can write | Covered modes |
| --- | --- | --- |
| V76 upper body | Standing/walking upper body from recorded actions | Idle, movement; yields in V100-owned air |
| V72 published actions | Action pose, combat, guard and Boost | Combat/ground; yields in V100-owned air |
| V79 extra actions (via V72 adapter) | Extra action poses | Guard/idle/fall fallback; yields in V100-owned air |
| V81 pose transitions | Transition blend, finger pose, some head correction | Ground and combat; yields in V100-owned air |
| V100 final air | Full-body state-specific air and contact landing pose | Jump, falling and landing on test humanoid |

The automated script takes observations during idle, grounded movement, attack, guard, jump, fall, landing, airborne Boost and ground recovery. For jump/fall/landing it asserts zero tracked older-layer mutations and nonzero V100 mutations. The actual counts and bone names come from the test output, not this document.

## Important gaps

- Normal **V156 flight is not measured** by this fixture. The accepted V156 authored flight data is tied to the exact normalized Kairo VRM0 rig. Using synthetic bone transforms triggers an intentional compatibility rejection; never bypass it.
- V62 master guide, V63 recorded guide, V71 locomotion, optional V72 walk arms, V89 step/foot support and V91 continuity are not included in this dynamic trace.
- The real visible VRM, Kairo mesh, finger geometry, world-space motion, and all 30/60/120 FPS browser transitions remain to be measured.
- Rin is separate and is not characterized by this Kairo audit.

**Decision:** retain all existing animation controllers. The next safe step is a read-only real-game WebGL last-writer audit including all default controllers and the exact Kairo VRM, particularly during V156 cruise, V72 combat/Boost, and the V100-to-ground transition. Do not migrate or remove a layer until those measurements and full regressions exist.

Baseline backup: backup/playable-2026-10-30. Defaults to preserve: approved V97 ground, V125 jump, V156 flight, existing combat, Rin, hitboxes and player controls.
