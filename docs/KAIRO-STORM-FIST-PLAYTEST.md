# Storm Fist — coordinated Blender set

Review entry: https://theo524.github.io/sky-clash/?combatAnim=storm-fist-v1

Choose Kairo and enter Training or a fight. Tap melee in rhythm to play the
original jab → rear cross → hook (alternate chains use overhand) → rising
kick. Continue after a connected launcher for uppercut → aerial kick →
falling fist. Forward movement on the fourth grounded beat selects a side
kick; sideways movement selects a roundhouse. Guard uses the existing block
control; a timely block plays the parry. Damage triggers light/heavy and
directional reactions. Free aerial melee uses its own strike.

The accepted original Blender jab is copied exactly from
`original-jab-playtest.v1.json`. Sixteen additional clips are authored on the
same measured Blender rig, then baked to actual Kairo normalized joints.
V72 selects them using existing gameplay clocks; V81 retains finger grip and
exit blending. The original stance, flight, Rin, hitboxes and move rules are
preserved. A missing/invalid set falls back to the original game.

Reproduce from a local HTTP server on port 8765:

```sh
node tools/capture-kairo-combat-anchor.cjs
blender --background --factory-startup --python tools/author-kairo-storm-fist.py
node tools/bake-kairo-storm-fist.cjs
node tests/native-combat-set.js
node tools/verify-kairo-storm-fist.cjs
```

Use `CHROMIUM_PATH=/usr/bin/chromium` for browser tools when the
Playwright headless shell is unavailable. Generated Blender
sources, transfer metrics and real-model review footage live under ignored
`visual-review-output/`; committed authoring tools reproduce them.

Remove the query to restore baseline combat. The previously accepted jab
review remains at `?combatAnim=blender-jab-v1`; historical rollback tag
`rollback/pre-blender-jab-2026-10-27-038ac13` is retained.

Validation and remaining limits are recorded in the current-state handoff.
