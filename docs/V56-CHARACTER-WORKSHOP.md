# Sky Clash V56 — Character Workshop

## Installation
Unzip the GitHub Update ZIP into the root of the existing Sky Clash repository, preserving `index.html`, `css/`, `js/`, `src/`, `tests/`, and `docs/` paths. Replace matching files. No fighter VRM assets are included or replaced.

This update is based on the exact currently deployed **V55.1** GitHub file hashes and deliberately restores V55 stable character movement/guide-rig code before adding editing capabilities.

## Open
- Main menu → **Character Workshop**.
- Or Dojo → **DOJO** → **Character Workshop**.
- Use the character dropdown to switch Kairo/Rin. Both characters have independent settings.

## Pose editor
- Select **Ready stance**, **Walk in place**, or **Run in place**.
- Adjust **arms**, **legs**, **chest**, **head**, body height, gait stride, cadence, knee lift.
- Use **Front / back view** to inspect from both angles. Preview movement affects only animation; the fighter stays physically in place.
- **Try Shadow Runner preset** applies a conservative bent-knee ninja base for Rin across all three modes. It is optional and adjustable.
- **Restore Kairo baseline** resets Kairo to the V55 default with recorded overlays enabled.
- Save persists to localStorage in the current browser. Use **Export JSON** to back up and share profiles; **Import JSON** restores saved poses and animations.

## Keyframe animation builder
1. Expand **Keyframe Animation Builder**.
2. Set a timeline time (e.g., 0.00s) and adjust the sliders.
3. Choose **Set keyframe**.
4. Move the timeline to e.g. 0.40s, change the pose, set another keyframe.
5. **Play** to interpolate the movement on your selected VRM; **Stop** to return to edit mode.
6. Optionally choose an attack from **Use custom animation for this attack** to test the keyframe offsets during actual melee in the game. This is experimental and OFF by default; preserve a JSON backup, and choose **Not assigned** to revert.

The custom keyframe system adjusts joint rotation **offsets** on top of the safe procedural rig; it does not overwrite original VRM skeleton bases. No automatic automatic root motion or IK is authored by the keyframe builder.

## Recorded clips
- The built-in 28 baked recorded animations remain available in the preview dropdown.
- On Kairo's VRM1 rig, clips can be previewed in the workshop. Kairo's **Use recorded animation overlays in matches** option can be switched off for clean procedural pose editing and saved.
- Rin's VRM0 rig is deliberately NOT driven by the unsafe Mixamo overlay. Use keyframes for Rin until a separate rig-calibrated retargeter exists.
- **Raw FBX files cannot yet be imported from the browser**. This editor previews already-baked clips and authors JSON keyframe poses.

## Safety and scope
- Gameplay physics, movement input, melee damage/hit detection and jump rules are unchanged from the stable V55 baseline. The double-jump crash fix stays in place.
- Character profile edits cannot override hit/stun/down poses; custom melee binding is explicit and opt-in.
- The editor can create and assign keyframe pose offsets, but is **not** a complete model redesign, runtime FBX converter, animation authoring DCC, or full foot-IK system.
- Tested: 22 Node-based regression suites; separate Playwright headless desktop/mobile DOM interactions on the editor. Browser environment blocks HTTP navigation to the full 3D game, so live visual pose quality is **not** verified.
