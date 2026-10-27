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

## Generated source verification

The GitHub source-import action successfully validated and committed the unmodified source-backed `js/v164-selected-kairo-real-flight.js` into the feature PR: 71 real 20-bone authored keyframes, 21 + 25 + 25, SHA matched. The playable candidate still needs the full CI/real-Kairo visual pass and Pages deployment before calling it live. This note is intentionally committed via the GitHub connector to retrigger all PR checks after the Actions bot's asset-generation commit (bot pushes don't independently trigger normal workflows).

## Verified merge and in-game QA (2026-10-27)

The opt-in V164 gameplay candidate merged to main in [PR #135](https://github.com/Theo524/sky-clash/pull/135), squash commit `d8ab7aded3f0441bf699d3608d723dc16f4b6df2`. All five required checks passed (animation owner, character integration, original quick real model, selected asset generation, and new V164 pure-vertical real Kairo WebGL capture). The dedicated capture [run #40429831902](https://github.com/Theo524/sky-clash/actions/runs/40429831902) saved actual side, front and back contact sheets, 60-tick telemetry and 27 images per preview in artifact **12700854889**. It specifically exercised pure rise, pure drop, mixed forward rise/drop, original neutral and Boost. Assistant viewed actual screenshots: V164 stays near standing-hover silhouette and B movement is subtle; these visuals are not a claim of user approval of the finished combined animation.

**Game:** https://theo524.github.io/sky-clash/?flightVertical=v164 — approved default Q remains https://theo524.github.io/sky-clash/ . A new chat should check Pages deployment and ask the player to test vertical and forward arms, then iterate source B clip only if actual feedback calls for it. The exact source 3 pose projects are retained in Actions artifacts #12697736565, #12698076236 and #12699498850; module is generated in-repo, not guessed from screenshots.
