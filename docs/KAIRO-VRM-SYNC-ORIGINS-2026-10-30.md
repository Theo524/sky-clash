# Real Kairo VRM sync caller attribution — 2026-10-30

**Scope: measurement only.** No playable controller, VRM, clip or public
default has been changed or is authorized for deletion.

The prior baseline profiler established that the procedural guide→VRM
bridge runs once per frame, while total VRM syncs vary by state: two
for jump/fall/landing, three for V156 flight and combat, four for
idle/Boost, and five for walking. Those are **counts**, not evidence
that an extra sync is unnecessary. See
docs/KAIRO-GUIDE-VRM-PROFILE-2026-10-30.md.

## New measurement

A new test-only tool, tools/audit-kairo-vrm-sync-origins.cjs,
runs the exact checked-out playable game and original Kairo VRM in
offscreen WebGL. It wraps **only Kairo's loaded vrm.update instance**
in the test browser after all normal modules have loaded. It records
for each call:

- Actual caller script and line number (the immediate stack frame),
  distinguishing the base game.js bridge from V71/V72/V81/V89/V100
  or other versioned pose layers.
- Changes to the 20 normalized body bones **since the previous sync**
  within a frame (possible reason a later layer needs another sync).
- Changes to the 20 raw humanoid bones **during the sync**, if the
  rig exposes VRM getRawBoneNode. This is one possible measure of
  sync effect, NOT a complete mesh/expressions/spring proof.
- The count, ordering and overhead-inclusive sync duration.

The standard test runs 60 FPS for the public default and the
experimental Storm Fist V3 **review** pack, including a real melee
API call. The command KAIRO_SYNC_ORIGINS_FULL=1 extends coverage
to 30/120 FPS and the 60 FPS opt-in step lab. It includes idle,
walk, run, jump, fall, landing, V156 hover/cruise, Boost, guard,
attack flags and ground return.

Run the test against the repository served locally on port 8765
with Playwright installed, or use the PR-scoped/manual workflow
"Real Kairo VRM Sync Caller Audit":

    node tools/audit-kairo-vrm-sync-origins.cjs

Evidence is in the GitHub Actions **real-kairo-vrm-sync-origins**
artifact (raw per-frame JSON and summarized per-controller callers).

## Interpretation and safety

- A sync with no *tracked body-bone* change may still update face
  expressions, fingers, spring bones, raw mesh transforms or caches.
  It must **not** be discarded on that fact alone.
- This test drives isolated animation states rather than full
  player input, simulation and AI; the Storm Fist V3 variant is
  optional and has not been visually approved.
- Durations include profiling overhead and hosted-runner variability;
  they are not user-visible frame times or speedup estimates.
- Last VRM sync ordering can matter to animation authority and
  collision even when final normalized joint quaternions match.
- Avoid modifications to Rin or the global VRMRig implementation.

**Safe next step:** if evidence points to a repeated call, test only
that specific call in a browser-only A/B experiment with visual
and skin-space comparisons, including ground contacts, V125 jump,
V156 flight and existing combat. Do not remove or combine syncs
yet. The backup branch is backup/playable-2026-10-30.

## Measured caller results — real Kairo 60 FPS

Passed [GitHub Actions run 41089498761](https://github.com/Theo524/sky-clash/actions/runs/41089498761).
The raw per-frame JSON (including caller line numbers) is in the
real-kairo-vrm-sync-origins workflow artifact.

| State | VRM syncs / frame | Caller order |
| --- | ---: | --- |
| Idle | 4 | Base game → V76 → V72 → V81 |
| Walk | 5 | Base game → V71 → V76 → V72 → V81 |
| Ground run | 4.5 | Base game → V71 → V76 → sometimes V72 → V81 |
| Jump / fall / landing | 2 | Base game → V100 |
| V156 hover / cruise | 3 | Base game → V100 → V100 |
| Boost | 4 | Base game → V76 → V72 → V81 |
| Guard / attack flags / actual melee | 3 | Base game → V72 → V81 |
| Ground return | 4 | Base game → V76 → V72 → V81 |

Both profiles, the normal public default and experimental Storm Fist V3
review flag, observed these controller sources and similar counts across
ten measured frames per state. The optional V3 clip set loaded for
its review profile; this is NOT player approval.

**V100 is called twice during the V156 flight cases.** Both syncs
changed tracked raw Kairo body bones in all ten measured frames.
This is the clearest candidate for further *A/B comparison*, not
proof that either call is unnecessary.

**V81 does not always change tracked raw body bones.** Its last sync
changed zero of those bones in all ten sampled default idle and
melee frames, and all ten optional V3 guard/attack/melee frames.
But it DID change raw bones in all ten walk/run frames and some
Boost and ground-return frames. Fingers, expressions, spring bones,
caches and render-state effects were not ruled out by this test.

The base game's bridge sync changed tracked raw bones on every
sampled frame. V71's independent sync appeared while moving on the
ground, not during V100-owned flight: the recorded V71 gait
already yields in those air states.

**Decision: NO RUNTIME CHANGE.** Preserve every current VRM sync.
If investigating V100's two V156-flight syncs next, suppress only
one in a browser-only test, then compare raw plus normalized skeleton,
world-visible landmarks, expressions and spring state at 30/60/120
FPS. Never merge that removal without full native-combat, ground
contact and transition regressions plus visual review.

