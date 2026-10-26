# V163 exploratory real-Kairo vertical keyframes — NOT deployed

**Research/authoring branch only.** The player rejected V160–V162's body tilts and hard-to-see arm/leg articulation. This experiment uses the **actual existing Pose Lab** and V152 true normal-flight hover (exactly equivalent to accepted V156/Q hover) to author 4 candidate independent rising/falling 5-keyframe tracks on the exact original Kairo VRM0. No runtime additive rotations and no new pose writer.

Run `node tools/author-kairo-vertical-keyframes.cjs` under the new GitHub workflow `kairo-vertical-keyframes.yml` (Playwright + WebGL required). The workflow saves the exact `sky-clash.pose-lab.v1` quaternions, SHA256, 20 bone labels, real anatomy metrics, and **front/side/back screenshots** at baseline/anticipation/transition/peak/hold. Candidates: controlled ascend/descend and wider open/braking alternatives.

DO NOT copy candidates into `assets/animations/kairo/flight-library.v1.json` or change public V156 Q. First retrieve the visual artifact, compare real silhouette and anatomy from 3 views, and request aesthetic approval. Only then (or as a clearly marked **experimental preview**) author a data-driven V100 sampler for climb/dive, with pure vertical vs forward-mixed game captures and actual video review. Add no new Fighter.animate wrappers or gameplay physics changes.
