# V52 — Rin's Detailed Anime Avatar

- Rin now uses the **same detailed VRM skeleton and animation pipeline** as Kairo.
- The new `assets/rin.vrm` is a recoloured derivative of the existing fighter avatar (original creator credits retained in VRM metadata), with dark shinobi outfit fabrics and violet hair accents.
- Her ninja mask, headband and scarf follow VRM head/neck bones.
- The loved original Shade Runner sprint pose is preserved by not overwriting it with generic locomotion clips.
- Game modes, controls and combat remain unchanged.

**GitHub:** Extract this update ZIP. Upload the extracted `index.html` to the repository root, `js/game.js` to `js/`, `assets/rin.vrm` to `assets/`, and `src/*.js` to `src/`. Do not upload the ZIP itself.

If the new avatar asset fails to load, the previous procedural avatar remains as a fallback.

**Credits:** The recoloured avatar retains the original VRM creator/licensing metadata. The project's VRM character asset remains subject to its original license, not CC0. Quaternius recorded animations remain CC0.
