# Sky Clash V66 — Boy TBB, real VRM Kairo

This release replaces the **hard-coded robotic Kairo character preview** and makes a real VRM 0.0 avatar available to both the game and Animation Studio.

## The VRM file

Use the user's uploaded **Boy TBB** model. The file is a 16,641,704-byte VRM0/glTF binary exported by VRoid Studio 2.12.0, with a 54-bone humanoid mapping, 3 skinned meshes and no embedded animation clips. Its embedded author field is **@SherryKatzu & @Rarestgrass**, and its embedded licence permits violent acts, modification, commercial use and redistribution. (Permission can change at the source; verify the model's current licence before redistributing.)

SHA-256: `775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72`

## To publish the character to ALL players

1. Rename the uploaded file to exactly **kairo.vrm**.
2. In GitHub, open `Theo524/sky-clash` > `assets` > `characters`.
3. Select **Add file > Upload files** and upload `kairo.vrm` (do not rename `fighter.vrm`).
4. Commit directly to `main`.
5. After GitHub Pages deploys, open `https://theo524.github.io/sky-clash/` and `https://theo524.github.io/sky-clash/animation-studio.html`.

The V66 loader automatically checks `assets/characters/kairo.vrm` and uses the real asset when available.

## Test without GitHub binary upload

Both pages now have an **Import VRM** control in the upper-right corner. Select Boy TBB once in a browser and it is saved to IndexedDB *on that device/browser only*. Both pages then share it, without sending it to a server. To make the model available to visitors, publish the binary to the GitHub asset path above.

## Compatibility and remaining work

The game reuses the existing VRM0 humanoid + recorded animation retargeting engine; Studio displays the same VRM and previews FBX motion. This is **not** guaranteed direct Mixamo compatibility. It still requires visual WebGL checks for elbow and knee alignment, walk-cycle foot placement, skinning and action timing.

The V64/V65 procedural master remains as a fallback until the VRM loads, if the asset is absent or if a model import fails. The old robot file is untouched for rollback but is no longer used as the Kairo Studio preview. Rin is unchanged.

Game bundle `js/game.js` is regenerated from `src/*.js` by the V66 GitHub Action after merge. It should not be hand-edited.
