# Sky Clash — coding assistant instructions

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
- Run prior tests AND new tests at 30/60/120 FPS where relevant.
- Never merge, change the visual default, or remove the rollback before
  explicit user approval.

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
