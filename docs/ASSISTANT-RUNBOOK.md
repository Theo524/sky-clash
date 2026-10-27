# Sky Clash — assistant operations handbook

Latest verdict: all Storm Fist arms, including the jab, were rejected for
body crossings and weird shapes. Follow the current-state kung fu correction;
older instructions to preserve the jab are superseded. After author/bake run
`node tools/verify-kairo-arm-clearance.cjs`, then audit actual gameplay with
`--gameplay visual-review-output/kairo-storm-fist/gameplay-60hz.json`.
The committed measured anchor supports fast CI without launching a browser.
Audit actual gameplay at all three rates after runtime handoff changes.
Real heavy guard-break recovery can yield to V100 hover; verify that owner,
not a forced ground idle. `STORM_QA_FILM=0` runs numeric gameplay only;
`STORM_QA_ARM_CLOSEUP=1` saves detailed contact images. Reuse unchanged
clip galleries and focus recapture on changed poses.

For the full Storm Fist continuation, follow
[the set author/bake/real-game commands](KAIRO-STORM-FIST-PLAYTEST.md).
The player accepts the original published jab and authorizes the full set in
one task plus Pages review. Preserve the jab asset exactly; extend the existing
measured rig/V72 player. Older single-jab and private-only gates below describe
the earlier stage.

For current fighting-animation work, use the [recovered Blender-to-game route](KAIRO-COMBAT-FOUNDATION-2026-10-27.md#recovered-jab-calibrated-source-and-private-engine-playback).
From the served checkout: capture the real idle anchor → author in Blender →
run `tools/verify-kairo-original-jab.cjs`. This exercises the private V72 native
sampler through actual combat. Pose Lab's V152 flight-pose recipe below is
historical flight guidance, not the starting rig for this grounded jab.
Normal gameplay loads no native jab. The authorized `combatAnim=blender-jab-v1`
playtest loads it through V72; validate automatic entry/fallback with
`node tools/smoke-kairo-jab-playtest.cjs`. Set `PLAYTEST_BASE_URL` to check a
served Pages URL with the same smoke test.


**LATEST 2026-10-27 — V164 DEPLOYED TO MAIN AS OPT-IN PLAYER TEST, NOT DEFAULT.** All four player-selected B choices are now integrated in the existing V100 flight owner: (1) arm clearance B, (2) natural arm sway B, (3) balanced ASCENT B and (4) settling DESCENT B. The exact VRM0 data module `js/v164-selected-kairo-real-flight.js` was generated directly from archived 71 real Pose Lab keyframes via `tools/build-kairo-v164-selected-flight.cjs` / `.github/workflows/kairo-v164-generate-selected-clips.yml`. [PR #135](https://github.com/Theo524/sky-clash/pull/135) is MERGED, commit `d8ab7aded3f0441bf699d3608d723dc16f4b6df2`. **User test URL:** https://theo524.github.io/sky-clash/?flightVertical=v164 . Default normal game remains approved V156 Q! Older V163 stays opt-in. Real in-game WebGL QA [run 40429831902](https://github.com/Theo524/sky-clash/actions/runs/40429831902) **PASSED**, artifact **12700854889** has 9 moments from 3 cameras in V156/V164 comparison, 60-tick telemetry, pure up/down and combined forward vertical plus Boost. All 5 PR checks passed. Front and side camera inspections show upright hover-family silhouette and intentionally subtle B movement; **full combined gameplay is NOT yet player aesthetically approved**, await their playtesting feedback. Do not repeat four choice prompts or revert approved B/B/B/B data; operate toolchain using [V164 guide](docs/KAIRO-V164-SELECTED-FLIGHT-PLAYTEST.md) and the [repository audit](docs/REPOSITORY-ANIMATION-TOOLS-AUDIT-2026-10-26.md).


## QUICK START: real-VRM keyframed up/down flight & fast tool pipeline

**Latest (2026-10-26):** player requested to PLAYTEST `https://theo524.github.io/sky-clash/?flightVertical=v163` and persist tooling knowledge for new chats. Read [V163 guide](KAIRO-V163-PLAYABLE-PREVIEW.md), [tool audit](REPOSITORY-ANIMATION-TOOLS-AUDIT-2026-10-26.md) and [Pose Lab workflow](KAIRO-POSE-LAB-WORKFLOW.md) first. Only V156 Q **forward** is approved; V163 up/down remains experimental.

**Author:** four candidate 20-bone 5-keyframe real Kairo animations baked with `tools/author-kairo-vertical-keyframes.cjs` in Pose Lab/Playwright which is now **available on main**, merged as [PR #129](https://github.com/Theo524/sky-clash/pull/129). Success 40410045312, artifact 12693475823 stores original keyframe JSON and 3-angle render screenshots. Exact Kairo VRM SHA above. Use the editor's `authorWorldPose` / `flightGeometry` to adjust segment anatomy and get meaningful leg/arm poses; no guessed Euler runtime layers. The player should not be asked to operate dev tools.

**Preview and inspect:** `js/v163-real-kairo-vertical-keyframes.js` stores source-recorded full-quaternion pose targets and exact five keyframe timing weights, and `js/v100-pose-authority.js` alone applies them when `flightVertical=v163`. Real-game `tools/capture-flight-video.cjs` has `VISUAL_V163_QA=1` for **pure** up/down and forward+up/down, neutral, Boost. `.github/workflows/kairo-quick-flight-stills.yml` runs actual model 3-view contact sheets and has automated PR triggers; full H.264 video still available. Download and visually inspect the artifacts, not just numerical checks.

**Connected GitHub tools shortcut:** in `functions.exec`, discover `mcp__GitHub__*` through `ALL_TOOLS`; use `fetch_file`, `fetch` HEAD/TREE, batch `create_tree` → `create_commit` → `update_ref`/PR. After checks, `fetch_commit_workflow_runs`, `fetch_workflow_run_jobs`, `fetch_workflow_job_logs`, `fetch_workflow_run_artifacts`, `download_workflow_artifact`, then inspect PNG/JSON. Never change Q clip, Boost, jump, ground, camera, physics or Rin to solve a vertical pose.


**For the assistant, not an assignment for the player.** The player wants us to use developer tools ourselves, not make them pose bones, run scripts or upload screenshots. This repository is the cross-chat external memory. The GitHub connection is the available interface in ChatGPT; a new chat may need to connect/access GitHub before the tools work.

## Latest real-VRM animation/tool audit

See [the 2026-10-26 repository-wide animation and tools audit](REPOSITORY-ANIMATION-TOOLS-AUDIT-2026-10-26.md) before another Kairo climb/dive revision. The player rejected V160–V162 on visual grounds. Use assistant-operated `tools/author-kairo-forward-flight-stills.cjs` / Pose Lab real-keyframe authoring and physically inspect the saved 3-view images; the current flight visual fixture wrongly combines forward speed with most vertical stages. Also inspect existing UE5 30fps `floating`/`flying` clips as possible references, not default motion. Do not treat numeric overlay angles as world-space character lean or passing screenshot-file-size checks as aesthetic proof.

## Fast implementation & CI workflow (2026-10-26)

The player authorized process improvement to make GitHub interaction and actual Kairo animation production quicker, without asking them to manage tools.

1. Batch files on a GitHub branch with one Git tree/commit/ref update rather than many `update_file` requests.
2. Let fast V100 ownership and V66 70+ historical tests run automatically; they are **separate** checks. Never replay the V66 suite inside ownership.
3. Workflow-scoped concurrency cancels superseded **PR** runs, never a main push/deployment. Don’t interpret canceled older runs as failures.
4. The active flight WebGL A/B workflow remains automatic for V100, while old flight/Boost studies and jump reviewers are selectively triggered or dispatched when relevant. If an edit affects jumping within the shared V100 module, **manually dispatch the jump reviewer before merging**. The heavy workflow's YAML-only changes use the fast CI policy test rather than auto-rendering old motion.
5. All browser captures pin Playwright 1.56.1, use a browser cache, and still run genuine WebGL and full video validation. No synthetic character snapshots presented as model captures.
6. Relevant generated visual evidence is reviewed with actual Kairo three-view frames. Only the player can approve aesthetic defaults. Keep the previous accepted game version/playable URL as a rollback.

## Quick first-pass real Kairo motion gallery

Use the new `kairo-quick-flight-stills.yml` GitHub Actions workflow on ordinary Kairo V100 flight edits; it runs the existing `tools/capture-flight-video.cjs` with `VISUAL_CAPTURE_MODE=stills`. The exact same 60 game-animation ticks are simulated; only nine representative moments x front/side/back are screenshotted. Artifacts include `comparison-front.png`, `comparison-side.png`, `comparison-back.png`, original JPEGs and a full `motion-metrics.json`.

Use `workflow_dispatch` on `kairo-v159-vertical-flight.yml` for genuine full 24fps WebGL video when testing transitions, Boost handoff or aesthetic promotion. The full video branch of the script remains untouched by the new capture mode. The assistant retrieves and visually reviews artifacts itself. No user screenshot collection.

## First 3 minutes in ANY new chat

1. **Open `AGENTS.md` and `docs/ASSISTANT-CURRENT-STATE.md` on the repo's current `main`**, not an old branch or a prior assistant message. Check `docs/PROJECT-CONTEXT.md` only if the task needs detailed history; it contains dated stale statements.
2. Verify live repository `main` SHA and the code/build defaults; **inspect open PRs, recently completed/failed GitHub Actions, and any deploy status** using GitHub connector before declaring anything done. If a connector is unavailable, state that honestly instead of inventing current state.
3. Fetch or run `node tools/assistant-checkup.cjs --strict --output=assistant-report` on a checked-out repository, or read the **assistant-readiness** GitHub Actions artifact if a checkout is not accessible. The checkup gathers bundle coherence, actual playable roster, build flags, rig SHA, source/test counts and CI scripts. **It does not certify aesthetic quality, build availability or user approval.**
4. Read relevant code and appropriate docs; state current user feedback and constraints in the proposed change. For animation: separate Kairo normal flight V100 vs Boost V72 vs Rin's systems.
5. Work on one reversible change at a time; independently capture actual WebGL frames/videos on the real Kairo VRM and inspect them before recommending any promotion. Don't merge visual changes as default without the player's **explicit approval**.

### ChatGPT GitHub connector interface

Use the GitHub connector available in the current conversation through its tool discovery; do not assume GitHub code is on the container filesystem or that external shell networking exists.

Common read:
```js
const r=await tools.mcp__GitHub__fetch_file({
  repository_full_name:"Theo524/sky-clash",
  path:"docs/ASSISTANT-CURRENT-STATE.md",
  ref:"main"
});
text(r.result.content);
```
For repository tree, use connector fetch of `https://api.github.com/repos/Theo524/sky-clash/git/trees/main?recursive=1`. For remote CI status, list/check workflow runs and download real WebGL artifacts via the GitHub tools. New branch + files + tests + PR is the normal workflow. `AGENTS.md` must be updated whenever the architecture or safety contract changes.

### What the assistant can automate

| Capability | Real source/tool | Automatic outcome |
|---|---|---|
| Repo truth, asset fingerprint, source bundle coherence | `tools/assistant-checkup.cjs` | Machine JSON + human Markdown; failing safety checks block CI |
| Most Node/syntax/animation regressions | `.github/workflows/animation-ownership.yml`, `.github/workflows/v66-character.yml` | Tests preserve old functionality and owner boundaries |
| Actual Kairo pose editing | `pose-lab.html`, `js/kairo-pose-lab.js` | Exact quaternion authoring on the real model; **assistant should drive via Playwright**, not the player |
| Verified hover baseline | `assets/animations/reference/kairo-v152-hover.pose.json` | Actual V152 V100 gameplay pose with model SHA256; usable in headless Pose Lab |
| Real game jump capture | `tools/capture-jump-frames.cjs`, `tools/capture-jump-video.cjs`, `.github/workflows/jump-visual-review.yml` | Model screenshots, front/side video and timing metadata |
| Real flight capture | `tools/capture-flight-video.cjs`, `tools/capture-flight-guard-stills.cjs`, `.github/workflows/flight-visual-review.yml` | Real VRM in-game 3-view A/B and motion-metrics JSON |
| Pose Lab tests | `tools/test-kairo-pose-lab.cjs`, `.github/workflows/pose-lab-browser.yml` | Model load, edit, JSON roundtrip, real rendered PNG, V152 pose import |
| Character/gameplay source | `src/*.js` + `tools/build.py` | Regenerate checked-in `js/game.js`; don't bypass source |

All existing workflows are **one-off jobs**, not a continuously running independent agent. Visual assets are GitHub Actions artifacts which eventually expire. Check their run status and content before claiming successful visual inspection. The assistant can script Playwright actions and read artifacts; that does **not** imply autonomous access to the user's actual phone or subjective preferences.

### Rig truth and animation engineering boundaries

- Real VRM is `assets/characters/kairo.vrm`, VRM0, normalized bone data via `vrm.humanoid.getNormalizedBoneNode`. Model coordinates and natural knee bend cannot be guessed purely from ordinary axes or textual descriptions. The finger/native rig and source Mixamo bind pose require careful calibration.
- Only two fighters are currently registered in `src/05-character-registry.js`: Kairo and Rin. Four others remain designs.
- V100 is sole selected final Kairo **normal flight/jump** pose owner; V72 recorded action system finalizes **Boost**; Kairo combat/guard/damage and Rin are different paths. Do not create an additional writer that competes per bone/frame.
- New real quaternion clip authored by assistant in Pose Lab is **only a draft** until its in-game import has exactly one final owner, reliable identity/rig mapping, transition blend and true WebGL footage review. Do not ship Pose Lab JSON simply by dropping it into the game. Read `docs/KAIRO-POSE-LAB-WORKFLOW.md`.
- Ground V97 and Kairo V125 jump should stay unchanged unless requested. Rin's ninja sprint is separate.
- The current main's default V153 forward flight and both old/V154 Boosts were **explicitly rejected** by player, as was alternative V155 (twisting). Do not label any of them visually approved because a unit test passes.
- For proposed fighters, per-character single/double/rocket/vault mobility is still design; current Fighter.tryJump() allows two jumps for nonflyers until source is fixed **and generated js/game.js rebuilt**.

### Reproducible visual-quality workflow, requiring minimal player involvement

1. Start with the V152 stored game pose on the **actual** Kairo VRM. Use a Playwright script to set actual normalized bone quaternions via Pose Lab or a detached test renderer; not guessed Euler axes onto dummy skeleton.
2. Pose **one static silhouette**, examine from side/front/back with saved PNGs and annotate actual wrist, knee, foot and chest coordinates. Iterate in isolated tools, not in deployed gameplay.
3. Author multiple exact quaternion frames only when a still silhouette is coherent. Scrub keyframes and check interpolation and contact/turning transitions.
4. Connect the clip to V100/V72 through their existing state ownership with a preview flag; test actual Kairo and strict A/B default vs candidate. Leave user-visible default unchanged until they approve.
5. Use outputs of CI tests, video review and **user** visual judgment together. Never publish misleading "all fixed" copy when only logic tests passed.
6. The player may review a video/clip, but should not have to run 3D development tools or produce source assets.

### What to persist at every meaningful engineering handoff

- **Update `docs/ASSISTANT-CURRENT-STATE.md`**: objective truth, what the user liked/rejected, what is actually shipped vs proposed, current next target, any open blockers.
- Link detailed history in `docs/PROJECT-CONTEXT.md` rather than making the summary infinitely long; avoid contradictory top-level facts.
- **Update this runbook if developer commands, tool layouts, status or safety boundaries change.**
- Keep `AGENTS.md` short enough to be read first, with prominent links. It should point the assistant to the current state and checkup, and tell future models **not** to ask the user to use the editor.
- Check latest PR, CI and site deployment at *the time of answering*; static Markdown dates aren't live checks.
- Treat the assistant checkup `json` as a repository inventory and guardrail. It does not know user approval or WebGL aesthetics without further input.

## Known limitations of cross-chat continuity

A new ChatGPT conversation does not automatically inherit the prior conversation's full transcript, temporary screenshots, locally downloaded ZIPs, transient tool outputs, unsaved drafts or connected account permissions. Storing the relevant **code, design decisions, tests, file references and exact accepted/rejected feedback in GitHub** is what makes another chat able to pick up reliably. **The assistant still has to fetch these sources and verify current status**; a document doesn't force a tool connection or grant permanent independent computer access.

Player action should ordinarily be no more than a new request like *"Continue Sky Clash from GitHub; read AGENTS.md first."* If a future chat lacks GitHub access, reconnecting the GitHub service may be necessary; do not claim that the assistant can bypass permissions.
