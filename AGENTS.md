# Sky Clash — coding assistant instructions

**LATEST (2026-10-26): V163 REAL KEYFRAMED UP/DOWN FLIGHT IS AN OPT-IN PLAYER TEST.** The player explicitly asked us to publish the new Pose Lab animation work **for personal testing** and store *every useful tool/workflow* in GitHub for new chats. First read [V163 preview and tool instructions](docs/KAIRO-V163-PLAYABLE-PREVIEW.md), [complete repository tool audit](docs/REPOSITORY-ANIMATION-TOOLS-AUDIT-2026-10-26.md), [fast runbook](docs/ASSISTANT-RUNBOOK.md), and [current state](docs/ASSISTANT-CURRENT-STATE.md). Test `https://theo524.github.io/sky-clash/?flightVertical=v163`; the default remains player-approved V156 Q forward-only. The source is genuine real-VRM Pose Lab multi-keyframes in a single V100 owner, NOT another V159–V162 Euler overlay. The 4-candidate Pose Lab authoring workflow is **merged into main** as [PR #129](https://github.com/Theo524/sky-clash/pull/129), at `tools/author-kairo-vertical-keyframes.cjs` and `.github/workflows/kairo-vertical-keyframes.yml`. Actions run `40410045312` has the full SHA-bound local quaternion tracks and three-camera screenshots. Inspect actual visuals and respect user's feedback, not just code CI. Use the GitHub connector tools directly so the player does not need to touch any development tools.


## MANDATORY assistant bootstrap (every new chat, any Sky Clash task)

This repo is the cross-chat technical memory. **First read `docs/ASSISTANT-CURRENT-STATE.md` and `docs/ASSISTANT-RUNBOOK.md` before implementing or describing the state of the game**. The historical `docs/PROJECT-CONTEXT.md` is very long and includes superseded progress statements; use it as background, not as current truth. Verify `main`, open PRs, CI and Pages at the time of the question. Use `tools/assistant-checkup.cjs` or its GitHub Actions artifact for local code/asset consistency checks.

**User wants the assistant to operate developer tools, not the user.** Do NOT ask them to use Pose Lab, keyframe bones, capture debugging videos, export rigs, install motion packs or otherwise run development tooling when the assistant can use GitHub, scripted Playwright or CI directly. Present user with results and necessary visual approval only. If GitHub is not connected in the new chat, say so clearly and do not pretend invisible previous-chat access persists.

**Latest player verdict:** standard/V154 Boost remain rejected; V153 was a rigid stick and V155 twisted. On 2026-10-26 the player explicitly requested the corrected real-VRM flight pose be put **in the playable game**, without waiting for Pages' amber→green signal. V156 replaces only Kairo ordinary powered flight in V100; Q was authored on the actual VRM and its side/front/back stills were reviewed. Real-game animation visual validation remains important, and older preview URLs are retained for rollback. Never assume new default implies aesthetic endorsement of every detail; further player corrections may follow.

**Latest vertical-flight verdict (26 October 2026):** The player rejected V160–V162 up/down results as over-tilted and barely moving. No further procedural overlay is artistically approved. **Read [the complete cross-project animation/tools audit](docs/REPOSITORY-ANIMATION-TOOLS-AUDIT-2026-10-26.md)** before the next flight change. The key underused assets are assistant-operated real-VRM Pose Lab keyframes, `tools/author-kairo-forward-flight-stills.cjs`, existing 30fps recorded flying/floating clips, and real WebGL captures. First author and inspect full-body **vertical keyframes**, then integrate opt-in through one V100 owner; keep accepted V156 Q forward flight unchanged. The player is not expected to drive developer tools.

**Read this file before proposing or changing Sky Clash animation code.**
This is the repository's persistent handoff between chats. An assistant reading
only a previous conversation may not have the full project context.

## Read in this order

1. [Project handoff](docs/PROJECT-CONTEXT.md) — history, visual feedback, current focus.
2. [Animation ownership contract](docs/ANIMATION-OWNERSHIP-CONTRACT.md) — wrapper inventory, state boundaries, target architecture.
3. [Kairo rig metadata draft](docs/KAIRO-RIG-CONTRACT.v1.json) — known joint names and explicit unknowns. It is **not a verified bind pose**.
4. [V100 authority](docs/V100-ANIMATION-AUTHORITY.md) and [V103 long-term exit criteria](docs/V103-ANIMATION-CONTRACT-AND-MOVING-JUMPS.md).
5. Check the *current* main commit, PRs and CI; dated documentation snapshots can become stale.

## Non-negotiable rules

- Do not add another Fighter.animate / fighter.animate / f.animate wrapper,
  or another direct VRM bone writer as a quick animation fix. The historical
  wrapper inventory is guarded by tests/animation-ownership-contract.js.
- V100 owns the **final visible Kairo pose** for selected opt-in prep, jump,
  fall, contact landing and powered flight states. Older controllers yield.
  It is NOT universal ownership: Boost, damage, guard, combat, ordinary
  ground locomotion and Rin still rely on older animation paths.
- Distinguish the invisible procedural guide rig from the visible VRM skeleton.
  Two rig representations do not alone prove a controller conflict.
- Fighter.flying is calculated from height, not intentional flight. Do not
  let this override a genuine jumping or dropping state.
- Preserve approved ground idle/walk/run/arms (V94/V95/V97), compact jump
  arms (V101) and the V102 standing jump baseline. V112–V115 knee/jump
  preparations and V111–V114 flight styles require explicit visual approval.
- Fix one animation state at a time, behind independent A/B preview flags.
  Do not change flight physics, collision, VRM assets, Rin's combat, or
  approved movement as collateral damage.
- Do not conflate a green test run with WebGL animation quality. Review
  real Kairo geometry, front/side/back video and explicit user feedback.
- For screenshot-free visual QA, use the existing GitHub Actions workflow
  `.github/workflows/jump-visual-review.yml` (`Real Kairo Jump Visual
  Captures`), download `real-kairo-jump-frames` from a successful run
  and inspect its *actual WebGL VRM0* PNGs and `measurements.json`.
  Capture pairs with the workflow_dispatch `previews` input. This allows
  future chats to see browser-rendered animations without making the user
  take screenshots, but still requires visual approval for phone behavior.
- For timing, fluidity and transitions, also inspect `real-kairo-jump-videos`
  from that same workflow. It contains 24fps front/side H.264 MP4s,
  synchronized A/B composites and `motion-metrics.json` with 48 fixed-time
  frames spanning crouch → rise → fall → landing. This is NOT a continuous
  recording of the user's phone; animations are sampled on a fixed clock
  against the real headless WebGL VRM. Check both recorded angles, not
  bone math alone. A failed video job or empty artifact is a blocker, not
  a pass. The action is also manually dispatchable with a `previews` pair.
- Run prior tests AND new tests at 30/60/120 FPS where relevant.
- Never merge, change the visual default, or remove the rollback before
  explicit user approval.

## Visual authoring tool instead of procedural flight revisions

Before touching Kairo flight or Boost following the user's V153/V154/V155 rejections, read `docs/KAIRO-POSE-LAB-WORKFLOW.md`. Use the standalone `pose-lab.html` for actual real-VRM quaternion editing and manual keyframes. Do not claim previous parametric V142/V153/V155 flight targets were directly authored VRM joint clips. Do not replace game flight merely because the Pose Lab exports a JSON; baseline/transition, runtime single-owner and user visual review are still outstanding.

## One authored Kairo flight pose library

Edit `assets/animations/kairo/flight-library.v1.json`, not generated `js/v156-real-vrm-flight.js` / `js/v158-real-vrm-flight.js`. Regenerate via `node tools/build-kairo-flight-library.cjs --write`; validate via `node tests/kairo-flight-library.js`. Preserve player-liked V156 Q forward-flight data exactly, keep V158 U experimental and retain VRM SHA and 20-bone order. See `docs/KAIRO-FLIGHT-LIBRARY.md`. Do not add another final VRM pose writer.

## Fast animation development workflow (2026-10-26)

- **Batch GitHub edits:** use one `create_tree` + `create_commit` + `update_ref` when multiple files change; never send a separate update request for every source and test file if batching is possible.
- **PR CI:** superseded PR runs cancel automatically, but main-branch runs do not. The 70+ old tests run ONCE in `v66-character.yml`, not again in animation ownership. V100 owner and approved-state safety remain tested.
- **Visual evidence:** the relevant current feature WebGL workflow stays automatic. Historic V153/V154/V155 film reviews and moving/jump variants can be run by `workflow_dispatch` only as needed. This preserves rollback comparisons without flooding Actions. If a change to V100 genuinely affects jump, **manually dispatch `jump-visual-review.yml`**; if changing only current forward flight, run the active V159/appropriate current VRM capture. Always inspect real Kairo front/side/back footage before approving a visual change.
- **Cost control:** ten Chromium workflows pin Playwright 1.56.1 and cache its browser. A fast `tests/ci-workflow-fanout.js` test guards these policies. A green CI status is not evidence of attractive animation.

## Fast Kairo flight previews

- On ordinary V100 flight edits, `.github/workflows/kairo-quick-flight-stills.yml` captures 9 sample frames through 3 cameras on the **real game Kairo VRM0 WebGL renderer**, plus comparison PNGs and the full 60-tick state telemetry. No H.264 encoding during this first aesthetic pass.
- To validate fluidity, response timing, turning reversals and Boost interruptions **before promoting a motion change**, manually dispatch the appropriate complete 24fps real-game film workflow (`kairo-v159-vertical-flight.yml` or `flight-visual-review.yml`). A gallery does not prove that movement flows naturally.
- The assistant should retrieve and inspect contact sheet artifacts, not ask the player to capture screenshots.

## Before closing an animation PR

Update docs/PROJECT-CONTEXT.md with dated PR/status, affected state, flags,
test evidence, rollback, unresolved defects and actual visual feedback.
Update the ownership contract if controller responsibilities change.
Do not invent missing rig signatures, pose approvals or source-clip metadata.

## In a new chat

Tell the assistant: "Analyze Theo524/sky-clash. Read AGENTS.md,
docs/PROJECT-CONTEXT.md and docs/ANIMATION-OWNERSHIP-CONTRACT.md first.
Continue from GitHub main and open PRs, preserve approved animations,
and do not introduce another skeleton controller."

A new chat does not automatically receive the prior chat's complete
engineering context. These version-controlled files are the handoff.
