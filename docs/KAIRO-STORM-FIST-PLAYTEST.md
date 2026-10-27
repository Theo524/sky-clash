# Storm Fist — coordinated Blender set

Current revision: **kung-fu-v2**. The previous arms and jab were rejected.
All 17 clips are reauthored with a forward lead guard, rear waist chamber,
outward elbow paths, straight forearm-aligned wrists and purposeful fist
turning. Lead/reverse punches extend toward contact; circular backfist,
hammerfist, upward strike and deflections retain different paths.

Review entry: https://theo524.github.io/sky-clash/?combatAnim=storm-fist-v1

Choose Kairo and enter Training or a fight. Tap melee in rhythm to play the
original jab → rear cross → hook (alternate chains use overhand) → rising
kick. Continue after a connected launcher for uppercut → aerial kick →
falling fist. Forward movement on the fourth grounded beat selects a side
kick; sideways movement selects a roundhouse. Guard uses the existing block
control; a timely block plays the parry. Damage triggers light/heavy and
directional reactions. Free aerial melee uses its own strike.

The jab and sixteen other clips use the same measured Blender rig and are
baked onto actual Kairo normalized joints. The older standalone jab asset
is retained only as historical rollback.
V72 selects them using existing gameplay clocks; V81 retains finger grip and
exit blending. The original stance, flight, Rin, hitboxes and move rules are
preserved. New clips approach nearer through the existing bounded pursuit
controller to match their reach; collision separation and travel limits
remain intact. The revised jab uses the new set's bounded approach.
A missing/invalid set falls back to the original game.

Reproduce from a local HTTP server on port 8765:

```sh
node tools/capture-kairo-combat-anchor.cjs
blender --background --factory-startup --python tools/author-kairo-storm-fist.py
node tools/bake-kairo-storm-fist.cjs
node tests/native-combat-set.js
node tools/verify-kairo-arm-clearance.cjs
node tools/verify-kairo-storm-fist.cjs
node tools/verify-kairo-arm-clearance.cjs --gameplay visual-review-output/kairo-storm-fist/gameplay-60hz.json
```

Use `CHROMIUM_PATH=/usr/bin/chromium` for browser tools when the
Playwright headless shell is unavailable. Generated Blender
sources, transfer metrics and real-model review footage live under ignored
`visual-review-output/`; committed authoring tools reproduce them.

Remove the query to restore baseline combat. The old rejected jab remains
at `?combatAnim=blender-jab-v1` for historical comparison; rollback tag
`rollback/pre-blender-jab-2026-10-27-038ac13` is retained.

Validation and remaining limits are recorded in the current-state handoff.
