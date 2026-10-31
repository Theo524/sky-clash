# Studio: recovery for Rokoko / Unreal FBX motions

**Problem:** the imported Superhero ZIP shows *"This FBX has no playable animation track"* despite source FBX 7.5 files carrying actual AnimationStacks, Layers, CurveNodes, AnimationCurves, and KeyTime/KeyValueFloat samples. The second supplied **AnimPack01.zip** also contains animated Arnold clips.

## What the user supplied and what was inspected

- **Superhero(3).zip**: 9 animated `Superhero/*.fbx` motions. Example `SuperHeroFlying_mixamo.fbx` contains ~594 keyed animation curves. File exports use `mixamorig:` bone names, even though their provenance is Rokoko.
- **AnimPack01.zip**: 30 FBXs, including many keyed Arnold motion clips, plus `Arnold.fbx`, which is a character/model file that contains **no** keyed animation curves. The latter should continue to show an accurate no-animation message.
- The original ZIPs remain private; no licensed/source animations or character meshes are committed to GitHub.

## Repair

1. Leave FBXLoader r158 as the primary loader. **Only** if it supplies no playable duration-bearing clip, a Studio-only recovery helper reads the original binary FBX 7500+ object/connection structure, decompresses its real curve samples, follows animation-layer connections to bone nodes and builds actual quaternion/translation tracks.
2. Sampling is bounded at 30fps with a 150s source limit and 4500-frame cap. Original source curves are not reconstructed from guessed poses; the recovered motion is keyed from the file itself. The original binary is neither rewritten nor replaced.
3. Some Arnold/Maya FBXs have a `KeyTime` start offset (e.g., animation only between seconds 27 and 28 of the saved take). On explicitly Rokoko-sourced imports, move the playable take to start at 0, while preserving its actual motion.
4. The humanoid validation diagnostics normalize the supported Unreal names (`pelvis`→hips, `spine_01`→spine) for inspection only; native mixer bone names are left intact.
5. All four Studio operations use the same import path: lazy thumbnail, selected 3D preview, GIF generation and Apply to Game. The latter still enforces **existing** duration/retargeting rules, so a 33-second superhero clip should be previewed first and trimmed or split before use as a single in-game punch/kick.

## Safety and testing

Synthetic FBX 7500 fixture covers compressed quaternion key data, correct 90° motion, animation-layer linkage, absolute-timestamp normalization and an intentionally unanimated model. CI runs it before Chromium and keeps existing local game checks.

**No change to:** original Mixamo sources, Rokoko source categories, Kairo action assignments, saved Base v1, flight, landing, punches, combat physics, Rin, public published motions. Test the nine actual Superhero clips in the user's browser after merging before claiming visual perfection.
