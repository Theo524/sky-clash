# Sky Clash V38 — project edition

This is the recommended folder-based version for GitHub Pages. Upload **the contents of this folder** to the root of your `sky-clash` repository, preserving the paths. Do not upload only `index.html`; it references other files.

```
index.html                   Web entry point
css/game.css                 Game UI and responsive controls
js/game.js                  Browser-ready game logic (generated)
js/vendor/three.min.js      Three.js engine (license preserved in file)
js/vendor/vrmkit.js         VRM loader (license preserved in file)
assets/fighter.vrm          Shared detailed character model, recoloured for rival
src/*.js                    Editable systems (arena, fighters, animation, combat, AI, input, etc.)
tools/build.py              Rebuilds js/game.js after edits
```

To make a code change: edit the appropriate `src/*.js` file, run `python tools/build.py`, then commit both the changed source and `js/game.js`. For small changes you can also modify `js/game.js` directly, but the next build will overwrite it. No npm or network build step is needed.

Host this folder using GitHub Pages (Settings → Pages → Deploy from branch `main`, `/(root)`). The binary .vrm asset uses same-origin fetch and therefore needs a web server; opening this folder's index.html directly from Files may be blocked by browser file restrictions.

For **offline / local file** use the supplied separate standalone `Sky Clash V38 - Rival and Melee Polish.html` instead. It includes everything.

V38 improvements:
- Both fighters use the same detailed VRM character model (distinct opponent palette). If models cannot load, both fallback rigs now use the detailed anime-style shapes.
- Reduced phantom melee reach; rival must move into proper fighting distance.
- Hook uses restrained torso twist and recorded animation without root displacement.
- Existing combat, controls, and modes preserved.

Credits: original in-game credit line remains in index.html. Three.js, VRMKit and original assets retain their licensing text.
