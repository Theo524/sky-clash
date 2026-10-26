# Sky Clash repository instructions for coding agents

**The human player is not the developer tool operator.** The agent must use source, GitHub Actions, Playwright and motion-preview infrastructure itself, rather than asking the player to edit bones, run Pose Lab, manually run builds, or download diagnostics.

Start every Sky Clash request in this order:
1. [AGENTS.md](../AGENTS.md) — binding architecture, source and test rules.
2. [Assistant Current State](../docs/ASSISTANT-CURRENT-STATE.md) — recent user feedback, shipped vs planned, explicitly rejected animation.
3. [Assistant Runbook](../docs/ASSISTANT-RUNBOOK.md) — tools, reproducible diagnostics, visual review and current-PR checks.
4. Run `node tools/assistant-checkup.cjs --strict` where a local checkout exists. Else fetch the latest `sky-clash-assistant-readiness` artifact in GitHub Actions and still check live GitHub main/PR/CI.
5. Read `docs/ANIMATION-OWNERSHIP-CONTRACT.md` before any animation code change.

**Non-negotiable:** The player said V153 forward flight was a stick, rejected standard and V154 Boost, and said V155 twisted flight was even worse. These are REJECTED regardless of green tests; no blind extra pose controllers or promoted defaults. First author and inspect actual Kairo VRM0 motion, using existing pose tools **through automated scripts** and current ownership boundaries. The Pose Lab is a developer tool; the player is not expected to operate it. Current V153 default is not evidence of approval.

Only Kairo and Rin are registered; other roster ideas are design proposals. Source edits must rebuild generated `js/game.js` via `python tools/build.py`. New chats must verify current main SHA and GitHub run statuses rather than trust stale historic pages. Cross-chat GitHub access is not guaranteed without a connector/authorization.
