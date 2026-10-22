# V72 — Walk arm repair and permanent animation publishing

## Why Kairo’s arms looked wrong in the playable game

V71 only sampled pelvis, thighs, knees and feet from Mixamo's `walking - Standard Movement.fbx`. The real character's arms were still controlled by the older procedural fighter model. Animation Studio's V68 preview instead retargets the entire Mixamo skeleton in world-rest-delta space, so its shoulders and elbows moved much more naturally.

V72 adds a **separate optimized arm motion** from the SAME real walking FBX:

- `assets/animations/gameplay/kairo-walk-arms-v1.json` — eight real Mixamo shoulder, upper-arm, lower-arm and hand joints, 32 frames, 30 FPS, no meshes or original FBX distributed.
- `js/v72-walk-arms.js` — applies the arm samples to the existing VRM humanoid using world rest deltas, matching the prior V71 leg-clock and smooth walk blend. Attacks, stun, air movement and dashes always take priority.
- `?arms=procedural` — disables *only* the V72 upper-body layer for comparison. `?walk=procedural` disables the new walking arm animation and the V71 walking animation together.

## Make your own Studio assignments permanent

Once GitHub Pages deploys V72:

1. Open [Animation Studio](https://theo524.github.io/sky-clash/animation-studio.html).
2. Load or restore the Mixamo FBX/ZIP files in the library and choose **Kairo** in the action editor.
3. Assign your preferred `idle`, `walk`, `run`, `punch1`, `kick`, `dodge`, etc. slots, and adjust their speed/yaw in Studio. Preview each in **On Character**.
4. Click **Export for Game (motion data)**. The browser downloads `sky-clash-kairo-game-actions-v1.json`, which includes 30 FPS **real baked quaternion keyframes**, action slot names, facing correction, source IDs, timing, and tuning settings. It is not just an assignment list.
5. In the Sky Clash GitHub repository navigate to `assets/animations/gameplay`, choose **Add file > Upload files**, and upload the exported JSON **renamed exactly** `studio-actions-v1.json`; commit it to `main`.
6. When GitHub Pages deploys, the gameplay loader `js/v72-published-actions.js` will automatically detect the pack. Kairo and his Kairo-based training rival then use the published slots when appropriate. Existing V71 walking, procedural attacks and idle remain fallbacks for unassigned slots.

**GitHub cannot be anonymously modified from the visitor’s web browser.** The export produces a downloadable file; a GitHub commit is required to make those actions permanent for all players. If you want ChatGPT to commit it instead, upload the exported JSON in this conversation.

To restore the previous V71/V72-only gameplay without uninstalling a published pack, use `?studioActions=off`.

### Runtime mapping

| Studio action | Game state using it |
| --- | --- |
| idle | grounded, not moving |
| walk | grounded moving |
| run | sprinting |
| jump | airborne |
| dodge | dashing |
| punch1 | standard punches |
| uppercut | launching uppercuts |
| kick / meteor | kicking attacks |
| charge | charging |
| superblast | blasting |
| hit | stunned |
| Other assigned combat slots | exported and retained, for future individual attack combo wiring |

**Rin:** You can export a Rin pack too, but the V72 automatic game loader only applies imported Kairo assignments so far. Rin's original animations remain unchanged until we test a dedicated Rin retargeted gameplay integration.

### Future editing, backups and compatibility

Your published JSON motion pack is a real GitHub asset, **not browser-local IndexedDB data**. It survives device changes, reinstallations and browser cache clearing; subsequent edits are made by exporting an updated pack and committing a new version. Git history preserves the previous file and offers rollback.

The original source FBX/ZIP archives should still be backed up privately. The game pack only contains compact sampled joint rotations, not FBX meshes, textures or model files. Avoid publicly hosting distributable standalone raw Mixamo FBXs. Changing the animation’s speed/yaw is safe; changing the FBX source skeleton or the target VRM may require a new retargeting calibration and visual testing.

### Validation limits

Automated tests check correct sample decoding, bending elbows, original gameplay not being disabled, attack priority, real Studio track recording/roundtrip and published gamepack schema. They cannot prove every Kairo pose and every source clip looks perfect in a live WebGL browser. For the first published pack, start with your proven `idle`, `walk`, `punch1`, and `kick` before mapping every action.
