# V163 — playable experimental real-Kairo vertical keyframes

**PLAYTEST**: https://theo524.github.io/sky-clash/?flightVertical=v163

**Comparison**: https://theo524.github.io/sky-clash/ (approved V156 Q default).

## What was actually implemented

V163 uses complete real Kairo VRM0 normalized joint quaternion target poses **from a successful Pose Lab 3-camera WebGL study**, run [40410045312](https://github.com/Theo524/sky-clash/actions/runs/40410045312) artifact **12693475823**. The actual multi-keyframe source data were generated using the assistant-operated script now on `main`, merged via [PR #129](https://github.com/Theo524/sky-clash/pull/129). V163 picks the `ascending-open` and `descending-brake` candidates. The small runtime module `js/v163-real-kairo-vertical-keyframes.js` stores both exact real-model peak quaternion arrays and the Pose Lab timeline `[0,.16,.38,.68,1.2]` and shape weights `[0,.28,.78,1,1]`, reproducing each of the source frames by full-quaternion interpolation from the byte-preserved approved V156 hover.

V100 is the **ONLY** final pose writer for this normal-flight layer. It interpolates the archived full 20-bone quaternions, not estimated Euler joint rotations. During pure ascent/descent V100 begins at approved upright hover instead of forcing the model into an already-forward-leaning cruise. During combined travel it reduces cruise influence. Forward-only flight keeps original accepted Q behaviour. Model SHA and complete bone order are checked. Boost, combat, grounded, jump, physics, root, camera, and Rin were not modified.

**Caveat**: The player rejected V160–V162. The reviewed V163 static poses may still be too subtle, especially the climbing knees. Player specifically asked to try these current changes despite no visual approval. This is an opt-in test, NOT a default replacement or claim of finished art.

## Tools and handoff for the next chat

1. Read [AGENTS.md](../AGENTS.md), [assistant CURRENT STATE](ASSISTANT-CURRENT-STATE.md), [fast runbook](ASSISTANT-RUNBOOK.md), [complete deep tool audit](REPOSITORY-ANIMATION-TOOLS-AUDIT-2026-10-26.md) and [Pose Lab authoring](KAIRO-POSE-LAB-WORKFLOW.md). Never ask the player to install, author, or capture the tests themselves.
2. Real Kairo source: `assets/animations/reference/kairo-v152-hover.pose.json`, identical to V156 Q hover; original model SHA `775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72`. `assets/animations/kairo/flight-library.v1.json` has immutable V156/V158 forward clips; **do not change** for vertical previews.
3. To AUTHOR next vertical clips: use Pose Lab `pose-lab.html`, `js/kairo-pose-lab.js`, headless Playwright `tools/author-kairo-vertical-keyframes.cjs` (currently in draft PR #129) and `.github/workflows/kairo-vertical-keyframes.yml` from that PR; inspect generated real-world anatomical metrics and front/side/back screenshots before promoting.
4. To CAPTURE live gameplay: `tools/capture-flight-video.cjs` and `.github/workflows/kairo-quick-flight-stills.yml`, 60 ticks across true Kairo VRM, auto-compare `v156,v163`, use `VISUAL_V163_QA=1` for pure rise, pure descent, forward-rise, forward-descent, neutral, Boost and recover. Download the GitHub Actions artifact and visually inspect. **Passing CI is not subjective approval.** Full 24fps H.264 film still available in the historical full-video workflow.
5. Use the connected GitHub tools; discover exact calls through `ALL_TOOLS`, batch `create_tree` / `create_commit` and `create_pull_request`, read `fetch_workflow_run_jobs` and `fetch_workflow_job_logs`, download `fetch_workflow_run_artifacts` / `download_workflow_artifact`. Save all decisions to GitHub `AGENTS.md` and `docs/ASSISTANT-CURRENT-STATE.md`, not just conversation history.
