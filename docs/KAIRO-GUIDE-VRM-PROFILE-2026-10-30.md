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
VRM sync happened inside the bridge or afterward. It covers 30, 60, 120 Hz
normal game and an opt-in first-step/stance lab at 60 Hz, sampling idle,
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

_Results will be appended from the actual GitHub Actions run, with a
run ID and observed numbers. No optimization will be merged this phase._
