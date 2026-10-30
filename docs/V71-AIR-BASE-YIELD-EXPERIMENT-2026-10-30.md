# V71 early-base-yield hypothesis — read-only comparison

October 30, 2026.

The real Kairo writer audit measured V71-labeled changes on 17 normalized
body bones before V100 authored the final pose during jump/fall/landing
and V156 flight. **This does NOT imply V71 was applying its walking gait in
the air**. In the shipped V71 wrapper, it first calls the previous
Fighter.animate implementation (which updates the procedural guide rig
and VRM), then checks V100.ownsAir and returns *before* sampling or applying
walking keyframes. Therefore the older writes can be inherited from the
base animation and are attributed to V71 by the nested wrapper trace.

We must not remove V71 or simply move the yield above the predecessor
call without checking what the underlying base animation contributes.

## Developer-only hypothesis

The A/B tool tests an **experiment that is not present in the game**:
when V100 owns the air pose, return from V71 before invoking its
predecessor. This may suppress essential procedural/VRM refresh.

The script tools/compare-v71-air-base.cjs serves an otherwise unchanged
game and the exact Kairo VRM in Chromium/WebGL, uses Playwright to
intercept js/v71-mixamo-gameplay.js only in the experimental page, and
compares baseline and candidate joint quaternion angles, local positions,
world-space landmarks, owner-state decisions, and root positions.

Sampled states include grounded idle, walking, running, jump, fall,
landing, recovery, V156 hover/cruise/braking, Boost, guard, attack,
and ground return. Comparison runs at **30/60/120 FPS** with fixed
per-frame Fighter.animate steps. Output is a local measurement; it does
not exercise every physics collision, joystick input, enemy AI response,
springbone or phone rendering. Browser launch/render timing can affect
the initial pose, so numeric thresholds are a gate for follow-up only,
not proof of seamless animation.

Run on a locally served checkout with playwright@1.56.1:

    node tools/compare-v71-air-base.cjs

Or dispatch workflow "V71 Air Base — Real Kairo A/B Comparison".
Raw per-frame JSON and comparison.json are preserved in Actions.
The experiment *never* changes shipped code, default query normalization,
assets, fighter controllers or the live site.

## Decision rule

Unless real-model evidence shows exact or very close poses on both paths,
do not advance an early base-call yield. Even close pose results require
actual gameplay physics/transition review and player approval. All
default V156 flight, V125 jump, V97 ground and V72 combat must remain.
The original backup is backup/playable-2026-10-30.

## Observed result — first real-Kairo browser run

The comparison completed successfully in GitHub Actions on 2026-10-30:
https://github.com/Theo524/sky-clash/actions/runs/41081341288

The modified V71 branch was actually exercised 115 times at 30 FPS and
122 times each at 60 and 120 FPS. It compared 282 frames per variant
at every frame rate, on the actual Kairo VRM. Larger differences are
inconsistent with a drop-in, visually equivalent removal.

| Rate | Maximum tracked joint angular difference | Maximum world-space landmark difference | Decision |
| --- | ---: | ---: | --- |
| 30 FPS | 3.973 degrees | 11.751 cm | No-go |
| 60 FPS | 11.946 degrees | 10.263 cm | No-go |
| 120 FPS | 23.855 degrees | 7.400 cm | No-go |

The test explicitly does not establish exactly which part of each
difference comes from the candidate vs initial model timing or other
uncontrolled browser factors. But it fails the numeric equivalence gate,
so **do not skip V71's predecessor call on the playable default**.

The comparison script was subsequently enhanced to measure the procedural
guide/body quaternion as well, and to print per-phase discrepancies.
The resulting later CI run supersedes the first for those extra diagnostics.

**Decision: KEEP THE ORIGINAL GAME IMPLEMENTATION.** The V71 gait is
already yielded in air; its predecessor is part of the procedural guide
rig/VRM update chain. A more promising future optimization would
profile direct guide-to-VRM copying separately without skipping
Fighter.animate wholesale, once real transition and rendering tests exist.
