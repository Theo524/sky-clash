# Sky Clash — assistant operations handbook

**For the assistant, not an assignment for the player.** The player wants us to use developer tools ourselves, not make them pose bones, run scripts or upload screenshots. This repository is the cross-chat external memory. The GitHub connection is the available interface in ChatGPT; a new chat may need to connect/access GitHub before the tools work.

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
