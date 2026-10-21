# Sky Clash V44 — Highland Arena & Energy Rework

The complete **modular browser game**, preserving the combat, VRM fighter, original small projectile, Quaternius animation data and existing touch/keyboard controls from V43.

## Changes in V44

- **Charge-up choreography:** compact energy core which never grows to cover the torso; light pressure-driven dust starts early, with a one-time burst of actual irregular lifted floor plates at 90% charge. The ground geometry and physics do not change; the plates are temporary visual effects and fade out. Extra camera shake has been reduced.
- **Awakening:** more visible translucent rising wisps anchored to limbs, upper torso and head; keeps per-character aura colours without a large bubble. The transformation uses a localized stone fracture and dust rather than initial straight glowing lines.
- **Vanish:** stronger coloured full-body afterimages at departure/arrival and several brief directional energy strokes, no circle effect.
- **Camera:** Settings → Camera distance → **Close / Standard / Far**, smooth transitions in free camera and lock-on; a very small shake on initial boost and less shake elsewhere.
- **Arena:** weathered stone paving, irregular mountain ridges, rugged rock outcrops, broken ruins and quieter natural foliage/lighting; removed floating islands and crystal-topped mesas. Stylized procedural environment, **not photoreal scanned assets**. Collision layout remains unchanged.
- **Preserved:** the ground Boost trail/pressure ring, compact standard blast, combat input layout and modular structure. V42's VRM-loading JavaScript fix remains present.

## Publish to GitHub Pages

If your repository already has a V38+ folder layout, download **Sky-Clash-V44-Update-Only.zip**, extract it, and upload the contained `index.html`, `js/game.js` and modified `src/*.js` files **to their matching existing paths**. The ZIP opens directly at the project root — there is no extra enclosing folder.

If the repository lacks those folders, upload the **Full Project ZIP** contents instead. Be careful not to put `index.html` inside a nested directory.

Run `python tools/build.py` to rebuild `js/game.js` from all `src/*.js` files.

For the modular project, use a local HTTP server (`python -m http.server`) or GitHub Pages. The separately provided standalone HTML embeds all necessary libraries/assets for offline testing.

## Checks

```sh
node --check js/game.js
node tests/smoke.js
node tests/combat-effects.js
node tests/fighter-flow.js
node tests/v44-effects.js
node tests/v44-arena.js
```

These checks exercise syntax, environment/effect construction, projectile geometry and cleanup but **do not visually validate** GPU rendering or Android performance.
