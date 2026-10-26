# V163 exploratory real-Kairo vertical keyframes — NOT deployed

**Research/authoring branch only.** The player rejected V160–V162's body tilts and hard-to-see arm/leg articulation. This experiment uses the **actual existing Pose Lab** and V152 true normal-flight hover (exactly equivalent to accepted V156/Q hover) to author 4 candidate independent rising/falling 5-keyframe tracks on the exact original Kairo VRM0. No runtime additive rotations and no new pose writer.

Run `node tools/author-kairo-vertical-keyframes.cjs` under the new GitHub workflow `kairo-vertical-keyframes.yml` (Playwright + WebGL required). The workflow saves the exact `sky-clash.pose-lab.v1` quaternions, SHA256, 20 bone labels, real anatomy metrics, and **front/side/back screenshots** at baseline/anticipation/transition/peak/hold. Candidates: controlled ascend/descend and wider open/braking alternatives.

DO NOT copy candidates into `assets/animations/kairo/flight-library.v1.json` or change public V156 Q. First retrieve the visual artifact, compare real silhouette and anatomy from 3 views, and request aesthetic approval. Only then (or as a clearly marked **experimental preview**) author a data-driven V100 sampler for climb/dive, with pure vertical vs forward-mixed game captures and actual video review. Add no new Fighter.animate wrappers or gameplay physics changes.

## Actual real-VRM review, 2026-10-26 (runner 40410045312)

The authored-v163 Pose Lab visual study **PASSED** on GitHub Actions run
`40410045312`; `real-kairo-vertical-pose-keyframe-candidates` artifact
ID `12693475823` stores original real-Kairo screenshots (3 views per
candidate + baseline), four `sky-clash.pose-lab.v1` keyframe JSONs, SHA,
and actual world-space bone metrics. The first attempt `40408916010`
**failed for a legitimate artistic reason**: the original descent target
straightened a knee below 5 degrees. We examined the front/side/back real
Kairo pictures, changed thigh/shin directions, and reran.

Verified authored pose geometries (relative to hover torso = 1.16 deg):

| Clip | Total torso | Left/right elbow | Left/right knee | Wrist separation |
|---|---:|---:|---:|---:|
| V152/V156 hover | 1.16° | 37.47° / 44.36° | 95.72° / 18.62° | 0.39 |
| ascending-controlled | 0.43° | 49.14° / 45.86° | 67.32° / 34.97° | 0.80 |
| descending-controlled | 2.0° | 33.98° / 32.32° | 34.38° / 32.76° | 0.82 |
| ascending-open | 0.43° | 45.12° / 43.27° | 74.33° / 42.86° | 0.84 |
| descending-brake | 2.0° | 45.19° / 44.11° | 38.93° / 37.72° | 0.97 |

These **are real measurements and static screenshots**, not claims of a
satisfying playable ascent/descent: from the small screenshots the poses are
not yet dramatically separated, and the original hovering LEFT knee is
actually more tucked (95.72°) than either authored climbing candidate
(67–74°). Next artistry pass should make the climb leg gather
**more** than baseline, separate raise/lower elbow trajectories, and inspect
real full-motion transitions. Until then these are **draft pose data, not
approved game animation**. Do not check any of these JSONs into the
accepted `flight-library.v1.json` or promote to normal flight by surprise.
Keep stage and visual review separate from CI success.
