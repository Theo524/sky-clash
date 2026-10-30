# Kairo procedural guide → VRM sync profiling

October 30, 2026. **Read-only measurement; no animation changes approved.**

## Why profile this?

Previous real-model audits proved that V100 authors the final normalized
body-bone mutations in selected jump/fall/landing/V156 flight frames.
However, V71's predecessor animation call first updates the procedural
guide rig and copies its pose into the displayed VRM. The Playwright A/B
experiment in PR #153 proved that skipping that predecessor is not
pose-equivalent and can change the guide body and final Kairo position.

The next safe approach is to **measure the actual work** rather than bypass
the animation chain. In particular, multiple VRM.sync/update calls during a
frame could be required: one after guide→VRM mapping, another after a
recorded combat clip or final V100 flight pose. Do **not** assume that a
second VRM update can be dropped merely because the count exceeds one.

## Test-only instrumentation

Run tools/profile-kairo-guide-vrm.cjs against a locally served checkout
with playwright@1.56.1, or use the manual / PR-scoped
"Kairo Guide-to-VRM Sync Profile" workflow.

The tool opens the exact public Kairo VRM in software WebGL, then temporarily
instruments **instance methods in that isolated page only**:
- Fighter.animateRig (procedural guide)
- VRMRig.update (guide-to-normalized VRM bridge and ground-foot correction)
- vrm.update (humanoid-to-skin sync, including later pose layers)
- root VRM scene.updateMatrixWorld and humanoid.getNormalizedBoneNode
- quaternion/position method mutations on the 20 normalized Kairo body bones

It records per-phase counts and instrumented inclusive timings plus whether
VRM sync happened inside the bridge or afterward. It measures the default game at 60 Hz in automatic CI. Set
KAIRO_PROFILE_FULL=1 to collect the full 30, 60, 120 Hz normal-game
matrix and the opt-in first-step/stance lab at 60 Hz, sampling idle,
walk, run, jump, fall, landing, hover, V156 cruise, Boost, guard, attack
and ground recovery. Each phase is driven deterministically using
Fighter.animate rather than player input, to isolate animation cost.

**Limitations:** timings depend on GitHub-hosted runner load and test
instrumentation, and are not user-visible frame-time measurements. A tracked
mutation method call may be a no-op. Some direct quaternion component
assignments are not counted. A VRM sync after the bridge may be necessary
to forward a later pose to the mesh. An absence of changed tracked body
bones does not prove an update is safely removable: fingers, expressions,
springs, floor contacts, timing, and rematch behavior still matter.

## Decision

Only after reviewing the actual trace may we propose a **reversible,
narrow change**, with per-bone A/B fingerprints, visible ground/support
checks and native combat transitions. The live versions of Kairo V97
ground, V125 jump, V156 flight, and Rin remain the baseline.

Pre-cleanup playable backup: backup/playable-2026-10-30.

## Actual 60 FPS Kairo measurements

The instrumented 60 FPS baseline passed in
[GitHub Actions run 41084816088](https://github.com/Theo524/sky-clash/actions/runs/41084816088).
Its downloadable **real-kairo-guide-vrm-profile** artifact contains
the 12 per-state JSON samples plus summary.json. Each state measured
12 animation frames after 4 warm-up frames using actual Kairo VRM0
and software WebGL.

| Sample | VRMRig bridge calls / frame | Total VRM sync calls / frame | Post-bridge sync calls / frame | Post-bridge normalized-bone mutation calls / 12 frames |
| --- | ---: | ---: | ---: | ---: |
| Idle | 1 | 4.00 | 3.00 | 480 |
| Walk | 1 | 5.00 | 4.00 | 1,152 |
| Run | 1 | 4.08 | 3.08 | 408 |
| Jump | 1 | 2.00 | 1.00 | 426 |
| Fall | 1 | 2.00 | 1.00 | 327 |
| Landing | 1 | 2.00 | 1.00 | 240 |
| V156 hover | 1 | 3.00 | 2.00 | 594 |
| V156 cruise | 1 | 3.00 | 2.00 | 600 |
| Boost | 1 | 4.00 | 3.00 | 1,104 |
| Guard | 1 | 3.00 | 2.00 | 677 |
| Attack flags | 1 | 3.00 | 2.00 | 246 |
| Ground return | 1 | 4.00 | 3.00 | 948 |

The post-bridge mutation counts are *changed* quaternion/position
method calls, not the number of distinct bones or guaranteed visibly
different full poses. They are aggregated across all twelve frames.
The scripted "attack" sample sets attack flags; it does not validate
every native melee clip.

Inclusive **instrumented** per-frame bridge times ranged from roughly
0.82 ms (jump/fall) to 2.83 ms (walk) in this particular CI run.
Those measurements include the profiler's own overhead, and can vary
substantially with CI host load; they are NOT production frame-time
benchmarks or a meaningful estimate of FPS improvement.

**Key findings:**
1. The procedural guide-to-VRM bridge already ran **once per frame**
   in every tested state. No duplicate bridge call was observed.
2. An additional 1–4 VRM syncs per frame appeared after the bridge.
   Those same states also had many later *actual* normalized-bone
   writes. Extra syncs are potential investigation targets, **not
   proven redundant**.
3. The next defensible optimization experiment would attribute each
   post-bridge sync to V72/V81/V89/V100 and compare mesh/skin,
   expression and finger state *between syncs* before suppressing even
   one. Preserve the baseline, exact Kairo poses and native combat.
4. The optional step-lab 60 FPS and normal 30/120 FPS cases remain
   available through KAIRO_PROFILE_FULL=1 but **were not run** in
   this first baseline check.

**Decision: NO runtime change.** Retain the current guide update and
all later syncs until their effects and required ordering are verified.

