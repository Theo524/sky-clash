# Sky Clash V71 — Permanent Mixamo walking (gameplay)

## Real runtime asset

- Action ID: **`kairo.walk`**. The game uses this id at runtime, not a temporary
  Animation Studio/imported FBX selection.
- Asset manifest: `assets/animations/gameplay/actions-v1.json`.
- Optimized motion: `assets/animations/gameplay/kairo-walk-v1.json`.
- Source: user-provided `Sky-Clash-Clean-Movement-Acrobatics-69(1).zip`,
  member `Movement/Standard/walking - Standard Movement.fbx`.
- Exact original FBX SHA256:
  `e9e7c3446f79f526d66ff61bb2a6e8cdaf1721dc5cb3da63d79c3d09b2979f0b`.
- Keyframes: **32 at 30 FPS**, ~1.03s cycle, 7 baked root/leg/foot
  world-rest-delta joints. Quantized `Int16` quaternions, 1.8 KB raw motion,
  base64-encoded in a versioned JSON resource.
- Source animation is not published as an original standalone FBX asset.

## In-game integration

`js/v71-mixamo-gameplay.js` loads the versioned action mapping, decodes the
baked quaternions, and hooks both playable Kairo and his training rival after
the VRM initializes. Real Mixamo knee and foot rotations are mapped onto the
existing normalized VRM humanoid while the existing game controls still own
actual movement, yaw, combat collision and root translation.

Motion blends up when Kairo walks on the ground and down on stopping,
punching, sprinting, falling or becoming stunned. The previous procedural
animations remain in use whenever `kairo.walk` is inactive.

**Rollback / A–B comparison:** `?walk=procedural` disables only this walking
motion without removing the model or changing Animation Studio.
The original `?hands=original` control still operates independently.

## Permanent vs local

Game assets and action maps are **committed to the GitHub repository**, so
these are available to all players and survive browser cache deletion, changes
of device and Studio imports. Changes to the walk's speed thresholds or blend
times can be made in `actions-v1.json`; changing source animation data requires
a new versioned motion file and a manifest update.

Animation Studio's V69 personal library is still browser-local, and any other
FBX clips imported there are **not** yet automatically installed into the
game. Saving an action assignment in the editor is still distinct from
committing an optimized animation/mapping to the public game.

This change applies to **Kairo and the Kairo-derived training rival only**,
not Rin. V68 on-character Mixamo preview remains unchanged.

## Visual verification

CI checks sampler correctness, stored source identity, both knees' animation,
walking/idle blending, VRM0 180° facing, fighter root turns and rollback.
A real WebGL/browser session is still needed to check foot sliding/ground
contact, camera-relative direction and proportions at different speeds.

Future motions can be added under stable action IDs (`kairo.run`,
`kairo.kick`, `kairo.punch`) with individual source and version metadata
without replacing the base character.
