# SKY CLASH — CURRENT STATE (assistant quick-start)

**Status as of 2026-10-26.** This is the short, canonical **handoff of user decisions and quality gates**. Do not treat it as live evidence of the latest CI/PR/deployment status. At the start of **every new chat**, verify GitHub main, open PRs, workflows and real source code using the connected GitHub tools. Run the [automated assistant checkup](../tools/assistant-checkup.cjs) in a repository checkout or use its GitHub Actions artifact.

## Purpose and player relationship

- Project: **Sky Clash**, original mobile-friendly 3D anime martial-arts arena fighter, GitHub `Theo524/sky-clash`; public site `https://theo524.github.io/sky-clash/`.
- The user wants **the assistant to do implementation, diagnosis, visual inspection, code reviews and animation authoring**. They explicitly **do not want to operate the Pose Lab, export their own poses, collect screenshots or repeatedly explain this project's architecture**.
- When the user opens a new chat, the GitHub repository—not another chat's unseen context—is the persistent handoff. Read `AGENTS.md`, **this file**, `docs/ASSISTANT-RUNBOOK.md`, the ownership contract, and relevant source. Connector/tool access still requires being available/connected in that chat. Do not pretend cross-chat memory guarantees it.
- Avoid asking the player to operate dev tools when the repo's GitHub Actions or connected tooling can capture/diagnose automatically. **Do not claim visual approval unless the user gave it.**

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

## Source-of-truth reading order

1. `AGENTS.md` **and this page**.
2. `docs/ASSISTANT-RUNBOOK.md` for how to operate GitHub tooling, diagnostics and visual reviews autonomously.
3. `docs/ANIMATION-OWNERSHIP-CONTRACT.md` and `docs/KAIRO-POSE-LAB-WORKFLOW.md` for animation changes.
4. `src/05-character-registry.js`, `src/45-fighter-controller.js`, `src/60-combat.js`, `js/v66-game-boot.js`, `js/v100-pose-authority.js`, `js/v72-published-actions.js` as relevant.
5. `docs/PROJECT-CONTEXT.md` for **long historical background**. It is large, dated, and includes **superseded plans**. Read topical ranges only; do not quote it as the latest state.
6. GitHub branches/PRs/CI artifact **right now**. Report clearly if visibility or verification is missing.

**No live gameplay changes are authorized by this handoff.** User feedback changes design priorities, not permission to call incomplete motion fixes successful.
