# Kairo real-VRM flight pose library

**Central editable source:** `assets/animations/kairo/flight-library.v1.json` keeps the exact real-model normalized 20-bone hover and cruise clips for Kairo.

| Variant | Real-model pose | Approval | Playable mode |
| --- | --- | --- | --- |
| V156 Q | `q-trailing-athlete` | Accepted **for forward flight**, not all limbs or other motions | Default game |
| V158 U | `u-balanced-trail` | **Experimental, not visually approved** | `?flightPose=v158` |

Both are bound to Kairo VRM SHA256 `775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72`, with identical accepted hover and 0.72 s entry. V157/V158 banking and V159 climb/dive remain small separate V100 normal-flight overlays and **not additional animation writers**.

## Assistant-only workflow

1. Author new candidate on the actual Kairo VRM in Pose Lab; ensure the exact 20 normalized bones and real model hash.
2. Add a clearly named, opt-in experimental candidate in the JSON and extend the allowlisted generator mapping. **Never silently change V156 default Q.**
3. Run `node tools/build-kairo-flight-library.cjs --write`; commit the canonical JSON and generated clip JS files together. `--check` fails CI if either adapter differs.
4. Run `node tests/kairo-flight-library.js`, Kairo pose ownership and legacy character tests; inspect real WebGL 3-view quick sheets, then full video for timing and Boost yield.
5. Only change a locked baseline test digest with the user's explicit visual sign-off; a green test is not aesthetic approval. Keep existing versioned wrappers and URLs for rollback.

**No gameplay changes from this library migration.** V100 still owns Kairo's final normal flight. V72 retains Boost; Rin, grounded movement, jump, physics, combat and camera are untouched.
