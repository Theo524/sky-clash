# V60 — Mixamo-native clean master humanoid (first milestone)

This build delivers **one wholly new, neutral, anime-inspired reference body**, implemented in `assets/characters/master/model.js`. It contains no Kairo/Rin meshes, VRM assets, or robotic equipment.

## Compatibility architecture

- The body attaches to the **original bones from each imported Mixamo FBX**. It does **not** apply VRM 0.x/1.x retargeting or remap Euler angles.
- The 18 core humanoid joint names are validated before model construction. Arms, legs, hands, torso, head and feet move from the imported FBX's own animation.
- The original diagnostic mannequin is still one click away. The existing experimental Kairo/Rin retarget preview is separate and unchanged.
- The character is a **procedural, native bone-weighted reference body**. It is *not yet a unified production-ready skinned character mesh*, VRM or GLB file, nor is it deployed in the playable game.
- The new master appears as the default **Master base** tab in Animation Studio when any FBX motion or ZIP collection is imported. The thumbnail previews also display the master.
- Real gameplay, animation assignments, and Kairo/Rin models remain unchanged.

## User workflow

Open `animation-studio.html`, import the cleaned Mixamo ZIP (or a smaller category ZIP), select a motion, and compare **Master base → Bone diagnostic → On character**. If the master follows the move while a VRM fighter twists, the cause is in the *retargeting*, not in the source FBX.

## Testing and limitations

- The clean model's core bones were verified against **all 230 animations** in the previously cleaned collection: 230/230 match by bone name. This is structural compatibility, not a visual guarantee for every clip.
- A Three.js non-rendering test checked bone attachment movement, finite world positions, visibility toggling and geometry disposal.
- WebGL browser rendering could not be tested in this environment (`Error creating WebGL context`). The appearance, foot contact, and all-clip playback need hands-on visual testing.
- Subsequent milestone: **final unified skinned character mesh on this proven Mixamo-native rig**, then original Kairo/Rin designs. This avoids implying a procedural preview body is a production skin.

Do not distribute the source Mixamo FBX library inside the public site: animations remain on the user's machine and are loaded into the browser by file picker.
