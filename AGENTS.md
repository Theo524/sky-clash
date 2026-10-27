# Sky Clash — assistant instructions

**Current 2026-10-27 authorization:** the player says the published original
Blender jab looks good; preserve its bytes and choreography. They authorize
the full original Storm Fist set in one coordinated task, autonomous move
iteration, regular pushed checkpoints and publication to existing GitHub Pages
after integrated gameplay testing. This supersedes older single-move/private
gates below. Keep the original game and `blender-jab-v1` rollback routes;
the full-set review uses `combatAnim=storm-fist-v1` through the same V72 owner.

**Experimental jab publication is explicitly authorized by the user.** The
`combatAnim=blender-jab-v1` link opts into the recovered original Blender jab
inside V72. This authorizes playtesting, not final animation approval or a new
default. Preserve rollback tag `rollback/pre-blender-jab-2026-10-27-038ac13`.
See [playtest and restore instructions](docs/KAIRO-JAB-PLAYTEST.md). Earlier
private-only/no-deploy notes describe the preceding development stage.


Read [current state](docs/ASSISTANT-CURRENT-STATE.md) and the [runbook](docs/ASSISTANT-RUNBOOK.md) before implementing or describing the game. Verify the checkout, remote main, open PRs, CI and Pages when access is available; dated documents are not live evidence. Run `node tools/assistant-checkup.cjs --strict` for local bundle, asset and roster facts. Use [project context](docs/PROJECT-CONTEXT.md) for historical detail, not current status.

The player wants the assistant to operate developer tools. Do not ask them to use Pose Lab, export rigs, install packs, capture debugging clips or run tooling the assistant can run. Do not send unsolicited images/videos or repeatedly solicit piecemeal stance/punch choices. State unavailable access honestly.

## Current decisions and scope

- Kairo and Rin are the only playable fighters; other roster ideas are proposals.
- Main's restored game baseline is rollback `038ac13` after rejected PR #139. **Batch A is REJECTED:** it ruined standing/fighting stance and looked like old Mixamo or looked horrible. Its removed `combatAnim=kairo-a1` query is not a working preview. Preserve its history for diagnosis; do not resurrect its assets or wiring. Read [rejection and rebuild criteria](docs/KAIRO-BATCH-A-REJECTED-2026-10-27.md).
- V156 Q normal forward flight is the accepted default. V164 is an opt-in player test with four locked B choices: arm clearance, natural arm sway, balanced ascent, settling descent. Preserve the exact selected data. Full combined gameplay is not aesthetically approved. See [V164 guide](docs/KAIRO-V164-SELECTED-FLIGHT-PLAYTEST.md).
- Older V153 flight was rejected as a rigid stick; standard/V154 Boost were rejected; V155 was rejected as twisted; V160–V162 vertical motion was rejected. A green test cannot overturn player feedback. Preserve rollback routes until an approved replacement is established.
- PR #140's Blender/VRM transfer, foot IK and original-jab work is an **offline foundation**, recovered locally at `87ef542` for continuation. The jab is an unapproved blockout, now available only through the explicitly authorized experimental playtest. See [foundation evidence and limits](docs/KAIRO-COMBAT-FOUNDATION-2026-10-27.md). Check current remote PR status rather than assuming a merge.

## Animation ownership and safety

Read [ownership contract](docs/ANIMATION-OWNERSHIP-CONTRACT.md), [V100 authority](docs/V100-ANIMATION-AUTHORITY.md), [V103 exit criteria](docs/V103-ANIMATION-CONTRACT-AND-MOVING-JUMPS.md), and relevant source before changing animation. [Rig metadata](docs/KAIRO-RIG-CONTRACT.v1.json) is incomplete; never invent bind-pose signatures or approval.

- Do not add another `Fighter.animate` / `fighter.animate` / `f.animate` wrapper or competing final bone writer as a quick fix. Update the ownership plan first. V100 owns selected Kairo prep/jump/fall/landing/normal-flight poses; V72 handles recorded actions/Boost; V81 blends transitions. Ground combat, guard, damage and Rin have other legacy paths. State labels alone do not prove the final per-bone writer.
- The invisible guide rig and visible VRM skeleton are distinct. `fighter.flying` derives from height, not intentional flight; it must not override genuine jumping/dropping.
- Preserve approved ground idle/walk/run/arms (V94/V95/V97), compact jump arms (V101), V102 standing-jump baseline and current V125 jump behavior. V111–V115 experiments are not blanket aesthetic approvals. Keep Rin's ninja sprint, VRM assets, camera, physics, hitboxes, attack clocks and selected flight intact during combat work.
- Work on one animation state at a time with independent opt-in isolation. Never merge, change a visual default or remove rollback without explicit user approval. The current request authorizes development and cleanup, not automatic aesthetic approval. The later explicit publication request authorizes this opt-in jab playtest.
- Edit `src/*.js`, then run `python3 tools/build.py` for the generated `js/game.js`; do not edit the bundle alone.

## Authoring and acceptance

Use actual Kairo VRM data and the recovered Blender control/IK pipeline for combat. Do not repeat the rejected pose-direction generator or guessed Euler overlays. Pose Lab remains useful for exact normalized-joint inspection and references; it is not a substitute for planted feet, authored wrists/fingers, full-body choreography or weight transfer. Read the [Pose Lab workflow](docs/KAIRO-POSE-LAB-WORKFLOW.md) and [tool audit](docs/REPOSITORY-ANIMATION-TOOLS-AUDIT-2026-10-26.md) when relevant.

The first target is one original full-body jab with anticipation, canonical contact at .24s and recovery at .55s to the unchanged standing pose. Inspect continuous real-VRM motion at gameplay distance, including target hit/whiff, entry/recovery and guard, before expanding the combo. Source quaternion agreement, a static contact image or passing IK limits does not certify artistic quality. Validate timing and transitions at 30/60/120 FPS where relevant. Before a playable preview, meet the complete continuous combat gate in the rejection document; no unsolicited preview assets.

For flight data, edit `assets/animations/kairo/flight-library.v1.json` and regenerate using `node tools/build-kairo-flight-library.cjs --write`; validate with `node tests/kairo-flight-library.js`. Preserve V156 Q exactly. V164's 71 selected keyframes are retained under `assets/animations/kairo/selected/v164/` and reproduced by `tools/build-kairo-v164-selected-flight.cjs`.

## Efficient work and handoff

Batch related changes; reuse installed Blender/Chromium and existing outputs. Run focused tests during iteration and the relevant full safety checks at milestones. Keep V66's authoritative regression suite rather than replaying it inside ownership CI. Current V164 WebGL capture handles shared V100 edits; historical film workflows remain available on demand. If V100 changes affect jumping, run the real jump review. Inspect actual motion before recommending a visual change.

Cleanup requires reference/dependency evidence. Old version numbers alone do not make modules, tests, rigs, source chunks or rollback assets disposable. Preserve the two real VRMs, source plus generated bundle, vendor libraries and useful authoring tooling. See [cleanup audit](docs/REPOSITORY-CLEANUP-AUDIT.md).

Before closing animation work, update current state with tested outcomes, exact scope, remaining artistic/technical limits and next action. Add detailed dated evidence to project context, and update the ownership contract/runbook when responsibilities or commands change. Do not claim tests, screenshots, CI, publication or user approval that were not verified.
