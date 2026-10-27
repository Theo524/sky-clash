# V164 player-selected Kairo B/B/B/B flight — OPT-IN

**Proposed player test link (after Pages success):**
https://theo524.github.io/sky-clash/?flightVertical=v164

2026-10-27 final visual selections (distinct choices, all explicitly made):
1. B — arms a little away from torso (neutral flight stance).
2. B — natural cyclical arm/forearm motion.
3. B — balanced upright ascending.
4. B — settling upright descending.

These choices were authored using the **real published Kairo VRM0** in Pose Lab. The game asset `js/v164-selected-kairo-real-flight.js` is **GENERATED DIRECTLY** from all **71 ORIGINAL 20-bone quaternion keyframes** in three archived model-SHA-verified JSONs, without guessing bone angles:
- natural arm motion `B-B-animation.pose.json` — run #40418975917 artifact #12697736565 (21 frames);
- balanced ascent `B-ascend-B.pose.json` — run #40421353502 artifact #12698076236 (25 frames);
- settling descent `B-descend-B.pose.json` — run #40425774416 artifact #12699498850 (25 frames).

`tools/build-kairo-v164-selected-flight.cjs` validates rig identity, normalized quaternions and common B anchor. `.github/workflows/kairo-v164-generate-selected-clips.yml` fetches those original Action artifacts, generates the browser data module and commits it to this PR branch. No new pose controller: V100 is sole authored-flight bone writer.

At `?flightVertical=v164`, V100 samples all three tracks using spherical quaternion interpolation, naturally loops chosen B arm motion, blends into/out of rising and settling, suppresses inappropriate Q forward-cruise lean during vertical controls, keeps approved forward torso/head/legs and adds only the selected B arm clearance while travelling forward. This is NOT a claim of player approval of the final combined gameplay motion.

Original V156 forward Q, V163 preview, Kairo/Rin models, Boost, jump, landing, combat and physics remain unchanged. No automatic activation. Inspect dedicated V164 vs V156 [real Kairo WebGL 3-angle comparisons](../.github/workflows/kairo-v164-selected-flight-stills.yml) in GitHub Actions, **including pure ascent, pure descent, forward-mixed directions, neutral hover and Boost**, before merge; green CI is not an aesthetic grade.

Future chats start at `AGENTS.md`, `docs/ASSISTANT-CURRENT-STATE.md`, this document, and `docs/REPOSITORY-ANIMATION-TOOLS-AUDIT-2026-10-26.md`. Show the combined playable link and ask for visual feedback; do not reopen already selected B/B/B/B clip choices.
