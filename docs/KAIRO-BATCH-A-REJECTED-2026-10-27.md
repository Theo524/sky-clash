# Kairo Batch A — rejected player test and rollback (27 October 2026)

## Authoritative verdict

The player tested the 2026-10-27 opt-in playable combat preview (`?combatAnim=kairo-a1`) from PR #139, then explicitly reported: **the standing/fighting stance was ruined; fighting moves looked identical to the previous Mixamo ones or, if changed, looked horrible.** Treat this as a failed playtest. The player's assessment overrides automated Pose Lab geometry scores and staged animation screenshots. Do not describe this experiment as polished, acceptable, or visually successful.

## Immediate safe rollback

- PR #139, merged for playtesting at `29c31e4323358593034f0804ab0ac697f277e7f6`, introduced the experimental opt-in native Kairo animation rig/pack and altered V72/V81 boot/ownership logic.
- Subsequent rollback restores the **entire source tree** of parent main commit `8e77ebdccdc63542c7b11f20162685a325db4fb8` plus these documentation-only rejection records. The rollback reverts the experimental runtime wiring, ten-clip assets, authoring workflow and test changes on main. This means `combatAnim=kairo-a1` no longer activates any new combat layer; omit it rather than calling it a playable option.
- Original Kairo/Rin fighting, standing/idle, guard, grounded/airborne movement, selected V164 flight B/B/B/B, V165 option, physics, hitboxes, attack clocks and default game return to pre-PR behavior.
- For future offline diagnosis, rejected Batch A source and evidence remain in the feature branch `feature/kairo-combat-choreo-batch-a` / closed PR #139; do not re-enable or merge without an overhaul.

## Why prior automated acceptance did not predict this

The prior real-game WebGL fixture **only stepped staged, single-state frame targets**, checking that the encoded pose arrived at the existing pose writer at 5 individual contact timestamps. The test did **not** run an uninterrupted four-strike combination with actual input/physics, did not inspect idle-to-fight-to-idle motion over time at actual gameplay camera distance, did not evaluate whether joint silhouettes were recognizable or professional, and did not compare the result side-by-side with the old Mixamo look. A technical pass was therefore not proof of believable or distinct fight animation.

Potential technical contributors requiring real evidence before any reimplementation:

1. Batch A explicitly changed the full-body neutral selector to `combatReady` on grounded idle, with normalized-local Pose Lab quaternions over V72's established idle; this directly risks spoiling the approved standing silhouette.
2. Full-body normalized-local quaternions were blended into the existing legacy V72/V81 writer rather than validating one uninterrupted animation across every final pose owner, easing blend and hand grip; resulting composite can preserve or contaminate older Mixamo-looking poses.
3. The Pose Lab authoring approximated directions in 20 humanoid normalized bones (no detailed wrist/finger keying, hip/root placement or reliable planted foot anchors). It was judged using isolated contact silhouettes, not recognizable player-camera punches and continuous grounded support.
4. The code kept existing attack timings and contact markers, but no player-like moving/targeted four-hit combo or combat/hurt paired scene was aesthetically reviewed. Real action selection, entry/recovery and layering may not convey the intended new motions.

These are **diagnostic hypotheses**, not proven sole causes. Stop before "fixing" perceived flaws with procedural Euler/hand-rotation overlays; first instrument the actual game animation owner/slot selection and replay the continuous action and default idle against the original unchanged VRM.

## Mandatory acceptance gate for a future fresh attempt

1. Preserve prior approved standing and defense stance *exactly* when not actively engaged; no replacement `combatReady` idle without demonstrated superior continuous idle/entry/exit that the player can choose.
2. Establish character identity and a recognizably distinct original jab, cross, hook/overhand, launcher with full VRM silhouette and planted leg support, fists/face direction and clear physical anticipation-to-contact-to-recoil. Do not use Mixamo lookalikes.
3. Make a genuine uninterrupted real-game Kairo 4-beat sequence at 30/60/120fps with realistic target distance, hit/miss, follow-through, stance reset, guard/parry/reaction, and aerial cancel; capture final V72/V81/V100 stacked result, not isolated source clips. A reviewer must inspect *motion*, not only static pose stills.
4. Preserve user-selected flight V164 B/B/B/B, V156 Q default, optional V165 speed/Boost, Rin, and all root physics/hitboxes; verify opt-in isolated from default and no unintended character layers.
5. Do not deploy or offer another playable experiment as "improved" until the above QA demonstrates a genuine distinguishable and aesthetically worthwhile change, and don't repeat one-pass source keyframe generation and then claim game quality from CI.

**Current state:** Experimental attempt rejected and rolled back, animation blueprint still exists at `docs/KAIRO-RIN-COMBAT-ANIMATION-REDESIGN-BLUEPRINT-2026-10-27.md`. Further work needs a fresh implementation, not toggling the rejected flag back on.
