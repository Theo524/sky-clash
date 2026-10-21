Sky Clash V42 verified runtime repair.

Upload all files while preserving paths:
- index.html -> index.html (repository root; also forces a fresh JS URL)
- js/game.js -> js/game.js (fixes VRMRig.update ReferenceError: vrm is not defined)
- src/30-character-models.js -> src/30-character-models.js (editable source stays aligned)
Do not remove the other folders or graphics libraries.

Tested: injected actual fighter.vrm twice with a stub WebGL renderer. Both models decoded and a match started without any JavaScript exceptions. Actual 3D rendering still needs a device test.
