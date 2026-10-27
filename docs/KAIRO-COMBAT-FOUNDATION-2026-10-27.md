# Kairo combat rebuild — Stage 0 foundation (no new animations)

**Status:** Baseline capture tool only. **No playable combat, standing stance, control, hitbox, flight or Boost changes.** User rejected the earlier Batch A / PR #139; it remains rolled back. This is NOT the return of its authored poses or a new preview.

## Engineering aim

A genuinely new animation must first be expressed on the **actual visible Kairo VRM**, recorded in the **actual final game animation pipeline**, and shown through a full uninterrupted action including entering from and returning to the game's original idle. Do not make ten poses and assume that success sampling the contact quaternion demonstrates a fighting move.

New assistant-operated foundation fixture: `tools/diagnose-kairo-combat-pipeline.cjs`. It loads the production game in isolated headless Chromium/WebGL, verifies the real Kairo normalized 20-bone rig and the existing V72, V81, V100 controllers, then freezes only the test page's RAF update. It drives the **real Fighter.update, Combat.melee and gameplay clocks** at 30, 60 and 120 fps. It records every final quaternion/foot/hand position continuously through idle, actual opening jab at an opponent, stance recovery, guard and release, and a separate full four-beat whiff/recovery. No source pose modifications, no new `fighter.animate` wrappers, no gameplay flags.

Workflow: `.github/workflows/kairo-combat-foundation.yml`, scoped to the diagnostic tool itself, 16-minute cap and JSON-only artifact. No unsolicited videos or screenshots. CI may validate real motion state progression, but **cannot pass artistic quality** or demonstrate exact per-bone writer attribution from the state labels alone.

## Mandatory checkpoints before authoring even one replacement

1. **Baseline instrumented:** Confirm all output is from Kairo's *real VRM*, with exact model SHA and 20 correct bones; published status on real V72/V81/V100. Save frame-by-frame real final quaternions, action metadata, clock/contact and world joint paths. Investigate any mismatch rather than tweaking a bone angle.
2. **Writer attribution:** Make an offline instrumentation map of actual changes at each final wrapper (not just `SkyClashPublishedActions.active` status, which is shared for multiple fighters). Identify the *last* writer for each joint/state; establish one unambiguous combat owner and protect idle, V164 flight and Rin. The baseline tracer currently only logs owner **state**, not the actual last writer.
3. **Production authoring:** Assess Blender + actual Kairo VRM, full-body control rig and IK/foot planting. Verify safe conversion of animation data back to the normalized VRM0 game rig without mystery bind offsets, wrist inversion or mismatched fingertips. Do not reuse the rejected `authorWorldPose` pose-direction generator as the main fight choreography pipeline.
4. **One complete original attack:** Only after 1–3, author *one* distinctive Kairo jab with anticipation, contact at the actual gameplay .24s, recoil, foot plant and return to the **unchanged** baseline idle. Compare its moving camera silhouette against the old V87 Mixamo jab at the same in-game distance.
5. **Acceptance before more clips:** Watch the complete action, not static impact screenshots. Confirm convincing elbow/wrist/fist, torso weight transfer, stable shoes, accurate contact, no frame-to-frame pops at 30/60/120fps, guard and whiff cancel. New attacker-target choreography must remain within existing physics/hitboxes. Only then author cross, hook/overhand and launcher, and later Rin.
6. **No premature publication:** All initial work in isolated PRs/tools. User only receives a playable preview **after** the internal full-motion inspection shows an unmistakably distinct coherent result. No default modifications without explicit user visual approval.

## Known current limits

- The current source tools `pose-lab.html` and `js/kairo-pose-lab.js` operate 20 normalized bones, slerp timeline and world-direction aiming but have **no proper IK foot locking, animation-curve motion editing, authored fingers or hip/root performance**. They are validation/reference tools, not a substitute for a production animation rig.
- `js/v72-published-actions.js` retargets world-bind delta Mixamo recordings and masks legs for most punches; `js/v81-pose-transitions.js` separately blends state changes; earlier procedural base `src/45-fighter-controller.js` continues participating. Native local Pose Lab quaternions are **not** interchangeable with Mixamo delta quaternions.
- `src/60-combat.js` owns canonical Kairo contact delays `.24/.24/.33/.41`s and durations `.55/.55/.68/.87`s, with optional V165 multiplying tempo. Never adjust these to mask poor animation alignment.
- Trace metadata alone is **not** an artistic review; don't call the foundation complete without its actual browser run passing. This fixture does not assert good foot plants: it measures inputs to the future acceptance system.
- Historic user feedback: the published Batch A ruined standing/fighting idle and either looked like old Mixamo or looked horrid. This is explicitly rejected; do not offer its old preview URL.

See [rejection](KAIRO-BATCH-A-REJECTED-2026-10-27.md), [full blueprint](KAIRO-RIN-COMBAT-ANIMATION-REDESIGN-BLUEPRINT-2026-10-27.md), and [animation ownership rules](ANIMATION-OWNERSHIP-CONTRACT.md).
