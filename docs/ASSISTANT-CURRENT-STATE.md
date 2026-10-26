# SKY CLASH — CURRENT STATE (assistant quick-start)

**Status as of 2026-10-26.** This is the short, canonical **handoff of user decisions and quality gates**. Do not treat it as live evidence of the latest CI/PR/deployment status. At the start of **every new chat**, verify GitHub main, open PRs, workflows and real source code using the connected GitHub tools. Run the [automated assistant checkup](../tools/assistant-checkup.cjs) in a repository checkout or use its GitHub Actions artifact.

## 2026-10-26 — Latest player verdict and deep GitHub tooling audit

**Current main at audit:** `814570d919c08c56bc6e2e0329d62ca69626827d`; `js/v66-game-boot.js` builds **V156**, defaults to **V156 Q forward flight** (player accepted for forward), with V125 jump. **V159–V162 vertical preview animations are NOT player approved**: the player says normal ascent/descent leans too far, the limb motion is hard to see and the changes look bad even though source/CI checks were green. V161/V162 actual Kairo WebGL renders corroborated this. Previous paragraphs in this document saying `BUILD V153` is current are historical and superseded.

The user explicitly requested deep inspection of the whole repository's useful code, information and tools, particularly **true keyframes**. Full [repository-wide animation/tool audit](REPOSITORY-ANIMATION-TOOLS-AUDIT-2026-10-26.md) maps 267 files, the Pose Lab and Playwright WebGL authoring tools, V152/V156 model-verified baseline, stored recorded 30fps flying/floating clips, single-writer animation ownership, CI and limitations. **Do not repeat V160–V162 additive procedural overlays.** Next create separate real-VRM ascend/descend keyframe candidates offline, first review full side/front/back silhouette (including pure vertical with no horizontal speed), then optionally integrate in V100 behind its own flag. Preserve default Q, combat, Boost, jump, Rin, physics and camera; visual approval is still pending. The player should not be assigned Pose Lab, clip capture or build-tool work.

## 2026-10-26 rapid real-Kairo animation screenshots (no gameplay changes)

After the CI fan-out improvement, the player agreed to the next tool upgrade. Branch `ops/quick-real-kairo-still-previews` introduces a first-pass WebGL contact-sheet mode (9 selected moments per camera, 60 normal animation ticks, no MP4 encoding) inside `tools/capture-flight-video.cjs`. A lightweight `kairo-quick-flight-stills.yml` job automatically runs for current V100 pose work and uploads front/side/back comparison PNGs, JPGs and full tick telemetry. Detailed V159 and legacy full-video reviewers remain manual via workflow_dispatch. The code never changes Kairo, Rin, flight physics, Boost or default V156 gameplay. **Stills cannot authorize final motion deployment without a full-motion inspection.** Check current GitHub status before declaring these changes merged/passed.

## 2026-10-26 central Kairo normal-flight pose library (no gameplay changes)

After the user approved the next developer-tool improvement, `ops/kairo-flight-pose-library` created one SHA-bound canonical Kairo pose file `assets/animations/kairo/flight-library.v1.json`. It stores the **EXACT unchanged Q/V156** accepted forward-flight hover/cruise quaternions and the experimental U/V158 hover/cruise keyframes. A zero-dependency Node script `tools/build-kairo-flight-library.cjs --write` regenerates the existing browser clip wrappers. CI uses `--check` and hashes in `tests/kairo-flight-library.js` (Q `08cfdf64`, U `3f40f49d`) to reject accidental pose changes. V100/boot, V157/V158 bank and V159 vertical pitch, Boost/physics and default V156 remain unchanged. See `docs/KAIRO-FLIGHT-LIBRARY.md`. New user approval is required to replace the normal-flight default. Verify merged PR/CI before making deployment claims.

## 2026-10-26 CI performance overhaul (no gameplay changes)

The player agreed to improve the entire development workflow because GitHub connector calls and many lengthy real-VRM video reviews delayed animation iterations. Branch `ops/speed-up-animation-ci` replaces per-file commits with single batched Git-tree updates, cancels superseded pull-request jobs but not main builds, removes redundant triggers for historical V153/V154/V155/moving-jump captures, pins/caches Chromium in ten browser workflows, and eliminates the duplicate 70+ legacy-node replay from Animation Ownership while the full V66 Character Integration suite remains authoritative. The current V159 flight WebGL A/B trigger is retained for V100 changes. New `tests/ci-workflow-fanout.js` enforces fan-out constraints. Historical capture jobs remain runnable manually. **No game animation, physics, or default version changes.** Check the actual PR and Actions before claiming it is merged/passing.

## Purpose and player relationship

- Project: **Sky Clash**, original mobile-friendly 3D anime martial-arts arena fighter, GitHub `Theo524/sky-clash`; public site `https://theo524.github.io/sky-clash/`.
- The user wants **the assistant to do implementation, diagnosis, visual inspection, code reviews and animation authoring**. They explicitly **do not want to operate the Pose Lab, export their own poses, collect screenshots or repeatedly explain this project's architecture**.
- When the user opens a new chat, the GitHub repository—not another chat's unseen context—is the persistent handoff. Read `AGENTS.md`, **this file**, `docs/ASSISTANT-RUNBOOK.md`, the ownership contract, and relevant source. Connector/tool access still requires being available/connected in that chat. Do not pretend cross-chat memory guarantees it.
- Avoid asking the player to operate dev tools when the repo's GitHub Actions or connected tooling can capture/diagnose automatically. **Do not claim visual approval unless the user gave it.**

## New Kairo vertical flight request — 2026-10-26

The player asked **“what about up and down flight”** after requesting body shift on lateral turns. Existing controller already supports rise/descent with `fighter.vert` and actual `fighter.vel.y`, but the authored Q/V156 normal-flight pose largely reuses the same skeleton for both vertical directions. Branch `feature/kairo-v159-vertical-flight-pitch` builds an **opt-in V159 posture** in the existing V100 Kairo-only final flight owner via `?flightVertical=v159` (independent from `?flightBank=v158&flightPose=v158`). It pitches hips about 18° toward climbing or 16° toward diving, with small chest and independent head countermovement. Velocity + pilot inputs are smoothly blended at 30/60/120fps. No extra Fighter.animate wrapper, physics modifications, Boost, jump, combat or Rin changes. V156 remains default; preserve rollback. A real Kairo VRM/WebGL 3-camera V156/V159 flight capture and tests are required. The player has not seen/approved V159 yet.

## Latest player feedback: V156 forward flight accepted; V157 banking requested — 2026-10-26

The player now says **the real playable V156 Kairo forward flight works well** and asks for the body to move naturally when **shifting left/right or turning**. This replaces earlier feedback that all forward-flight attempts looked straight. Keep the V156 Q pose and its head/elbows/legs **unchanged** as the baseline. On branch `feature/kairo-v157-banked-steering`, draft PR #118 adds an opt-in `?flightBank=v157` to Kairo's existing V100 flight owner: smoothly filtered left/right pelvis-led bank from actual relative side velocity and facing yaw rate, head/neck countermotion, with no root movement or combat/Boost/Rin/ground/jump changes. Pure 30/60/120fps checks pass on the branch; **real WebGL A/B capture is pending evaluation**. Default remains V156; do not assume player visual approval of banking just because they asked for it. Explicit rollback: `?flightPreview=v156` and historical `?flightPreview=v153`.

## Historical pose feedback — superseded for the V156 default — 2026-10-26

User says the forward flight is *better, but still too straight*, **including the head**. This supersedes any assumption that straightened V153 flight or an updated design document solved the on-model appearance. Prioritize real-VRM **connected pelvic/chest curve, distinct independent neck/head counter-rotation and gaze along travel**, plus bent knees/elbows, without twisting the body laterally. The actionable shot/measurement requirements are now at the top of `docs/KAIRO-FORWARD-FLIGHT-BLUEPRINT.md`. **No new in-game animation has been authored or shipped by that spec.** Do not ask the user to operate Pose Lab.

## Kairo forward-flight authoring blueprint — 2026-10-26

The player agreed to start an **exact forward-flight pose and transition specification** after rejecting stick-like V153 and twisted V155 forward flight. The new [forward-flight blueprint](KAIRO-FORWARD-FLIGHT-BLUEPRINT.md) defines creative *first-pass* visible angle ranges (not verified rig joint constraints), small chest/pelvis relative yaw/roll guards, realistic elbow/knee articulation, a 0.60–0.80 s hover-to-cruise multi-keyframe route, anti-twist/hand/foot QA, real Kairo VRM0 keyframe authoring via assistant-operated Playwright/Pose Lab and V100-only eventual integration. No gameplay code/animation was changed by this document. Future work must visually author and film **one full-body cruise pose on real Kairo first**, not produce another procedurally rotated V156. User must approve before promotion. Ground/air Boost are separate and still rejected.

## The latest decisive user feedback (highest priority)

- **Both standard Boost and V154 Boost are terrible.**
- The **V153 hard-forward flight** looked like a straight **stick/plank**, not organic flight.
- **V155 flight/Boost** was **even worse**, with a twisted flight stance. The user's repeated feedback has *overruled numerical tests and assistant subjective optimism*. V153/V154/V155 flight/Boost are **REJECTED VISUALLY**, including V155 despite having passed programming tests.
- User wants tools and a developer workflow that make motion creation **actually accurate and reproducible**, not a train of guessed V156/V157 rotation fixes.
- **Do not promote any rejected pose to default** or make another speculative visual change without a **real-character rendered capture, inspection, and explicit user approval**. Code tests validate behavior, not aesthetics.
- Existing V152 calmer hover is a **reference/starting point**, not automatically an endorsement of everything about flight or Boost. Preserve it while comparing candidates.
- The next best investment is **assistant-only tool infrastructure**: automatic capture, inspection, rig coordinate validation, comparison and repeatable authoring. The human user should have to judge final results, not debug the pipeline.

## What's actually deployed/implemented (verify on main)

- The live public release's boot file `js/v66-game-boot.js` still sets **BUILD V153**, default `flightPreview=v153` and `jumpPreview=v125`; normal Kairo powered flight V153 remains the default **although the user dislikes it**. No one should call it approved.
- Ground locomotion is based on previously accepted V94/V95/V97 work; V125 is Kairo's jump baseline. Preserving these states matters.
- **Only two playable characters:** `Kairo Venn` (`kairo_venn`, martial arts / ki / powered flight), `Rin Sable` (`rin_sable`, ninja / double jump / *no free flight*). Source of truth: `src/05-character-registry.js`.
- Four additional diverse-character proposals (Dagan, Veyra, Rook-09, Mop) are **design concepts, not playable**. `docs/CHARACTER-BIBLE.md` and `docs/KAIRO-COMBAT-V1.md` document variety and proposed four-beat Kairo choreography.
- Real Kairo `assets/characters/kairo.vrm` is VRM0; `js/v100-pose-authority.js` is the final **normal air** pose writer for its opt-in states. `js/v72-published-actions.js` owns **Boost**; V100 yields Boost, combat, guard and damage. The legacy system contains multiple wrappers with owner/yield boundaries; read `docs/ANIMATION-OWNERSHIP-CONTRACT.md` rather than inferring everything is under V100.
- `animation-studio.html` previews/source-bakes FBX imported motions; **not a universal timeline compositor**.
- `pose-lab.html` is a **standalone real VRM0 manual-keyframe tool** built in PR #109 with direct 20-bone quaternion editing, real three-view snapshots, timeline, SHA256-validated JSON and a real captured V152 hover pose `assets/animations/reference/kairo-v152-hover.pose.json`. Its browser tests passed. **It does not feed the game at runtime.** The **assistant** should use it through scripted browser automation when useful; do **not** demand user interaction.
- The Pose Lab V152 start reference is **now available**; older `docs/PROJECT-CONTEXT.md` paragraphs that said capturing it was still pending are historical and superseded by this file and `docs/KAIRO-POSE-LAB-WORKFLOW.md`.
- Game `js/game.js` is **generated**, not an editable source file. Edit `src/*.js`, then `python tools/build.py`. Do not edit `js/game.js` alone.

## Verified facts versus open issues

| Topic | Status | Required next evidence |
|---|---|---|
| V153 hard-forward flight | **User rejected: stick**; currently default in boot | Replace only with separately filmed approved real-VRM animation |
| Standard ground / aerial Boost | **User rejected** | Distinct authentic grounded sprint and aerial Boost clips with foot contacts, body pose and user review |
| V154 Boost | **User rejected**; opt-in `?boostPreview=v154` | Do not default or reuse simply because a unit test passed |
| V155 alternative | **User rejected: twisted**; opt-in `?flightPreview=v155&boostPreview=v155` | Do not iterate blind corrective twists |
| V152 calmer hover | **Reference baseline**, accessible via `?flightPreview=v152` | Correct start pose and smooth transition into a new authored motion |
| Pose Lab | **Standalone tool works**, Chrome/WebGL test passed | Assistant scripted creation/visual QA and explicit single-owner runtime integration |
| Kairo's combat remake | **Plan only**, existing four-beat and aerial moves already work | One beautifully authored lead jab approved before changing full chain |
| More fighter species/mobility | **Design direction**, only Kairo/Rin live | Implement per-character jumpCount later, rebuild generated game; nonfly jumper hardcode noted in bible |
| Cross-chat continuity | **Repo files** persist, not unseen assistant state | New assistant opens AGENTS + this doc, checks live repo/CI, runs checkup |

## Keep the high-level design

The player liked a roster with One-Punch-Man-like **variety** of original fighters (humans, monsters, machines, oddballs) and high-energy Saiyan-style aerial martial-arts spectacle, **not** a TV show or comedy skits. Fighters should have different moves, jumps, double-jumps, heavy leaps, hover, thrusters or powered flight rather than all being reskins. User wants original identities and serious, impactful gameplay.

## Repository cleanup audit — 2026-10-26

The user wants clutter removed without disrupting the game. See [repository cleanup inventory](REPOSITORY-CLEANUP-AUDIT.md): 248 tracked files (~38.08 MB) prior to the cleanup; Kairo and Rin VRMs alone ~32.55 MB (~85.5%). Removed four superseded ZIP-install notes at the repo root (`README.txt`, `V57-INSTALL.txt`, `V58-INSTALL.txt`, `V60-INSTALL.txt`). The V142–V153 flight support files, optional V154/V155 preview files, `src/` plus deployed `js/game.js`, vendor scripts and old regression tests are **not proven safe to delete** just because they carry version numbers. Their teardown requires boot dependency analysis, a real WebGL comparison and a verified new animation architecture. This PR makes no gameplay changes.

## Source-of-truth reading order

1. `AGENTS.md` **and this page**.
2. `docs/ASSISTANT-RUNBOOK.md` for how to operate GitHub tooling, diagnostics and visual reviews autonomously.
3. `docs/ANIMATION-OWNERSHIP-CONTRACT.md` and `docs/KAIRO-POSE-LAB-WORKFLOW.md` for animation changes.
4. `src/05-character-registry.js`, `src/45-fighter-controller.js`, `src/60-combat.js`, `js/v66-game-boot.js`, `js/v100-pose-authority.js`, `js/v72-published-actions.js` as relevant.
5. `docs/PROJECT-CONTEXT.md` for **long historical background**. It is large, dated, and includes **superseded plans**. Read topical ranges only; do not quote it as the latest state.
6. GitHub branches/PRs/CI artifact **right now**. Report clearly if visibility or verification is missing.

**The player's 2026-10-26 explicit instruction authorizes V156 normal-flight integration**, limited to the actual Kairo VRM. No changes to Boost, combat, Rin, physics, or already approved movements are authorized.
