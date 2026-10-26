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

The `kairo-quick-flight-stills.yml` workflow is the **only default real-Kairo WebGL gallery** for current authored clips. Both historical full-video workflows remain available through `workflow_dispatch` but do not auto-run when generated V156/V158 adapters change.

## V160 smoother climb/dive (opt-in player review)

Use `?flightVertical=v160` over V156 accepted normal Kairo flight. V159
remains `?flightVertical=v159` for comparison. V160 does not edit the locked
20 normalized authored joint quaternions or change default gameplay.
Its one final V100 pose writer uses a critically damped vertical leading
channel with delayed torso/limb spring responses. Elbows, thighs and knees
move with the pelvis rather than forming a frozen plank; head counterbalances.
Root position, game physics, Boost, camera and jump ownership remain untouched.
Run `node tests/v160-vertical-followthrough.js` and compare the real VRM
3-camera climb/dive quick sheets before considering aesthetic approval.

## V161 full-body vertical animation (opt-in review)

Preview `?flightVertical=v161`, rollback `?flightVertical=v160`.
V161 preserves the exact accepted V156 Q 20-bone hover and forward-flight
quaternions, normal player default, model SHA and 0.72s blend. The ONE
existing V100 final flight owner now propagates vertical intent through
independently smoothed pelvis, spine, shoulders, arms, thighs, knees and feet.
Climbs curl the legs/open the arms; dives lengthen shins/trail the hands.
Subtle asymmetrical slow airflow drag is masked by vertical effort, so
neutral remains the original authored pose. Head counterbalances torso pitch.

No new pose writer, physics, Boost, jumps, attacks, ground, camera or Rin
changes. CI checks frame-rate-safe 20-bone flow and the real Kairo VRM
front/side/back 60-tick vertical comparison `v156,v161`. The engineering
and still-image tests are not player visual sign-off; V161 remains opt-in.

## V162 vertical flight — upright and visibly expressive (experimental)

Review link: `?flightVertical=v162`. For comparison V161 is
`?flightVertical=v161`; published V156 remains unchanged by default.

Based on reference to Dragon Ball Z: Kakarot's separate ascent/descent
actions and established animation principles (Adobe's follow-through,
overlap, easing and staging), V162 **does not turn altitude movement into
a dive/airplane torso pitch**. Total added V162 pelvis-to-upper-chest lean
is bounded below 5.4 degrees. That does not change approved V156 forward
travel's authored body orientation. Instead, V162 enlarges the actual
normalized VRM 20-bone arm/shoulder, forearm, thigh, shin, hand and shoe
motion and shortens the V161 multistage lag, so descending reads promptly
as its own pose rather than displaying the previous ascent for half a second.
Inertial differences create a little hand/knee follow-through at reversal.
All temporary relative pose rotations start afresh from the V156 clip on
each frame. No root motion, translation, acceleration or gameplay changes.

Run `node tests/v162-upright-vertical-flight.js` for 30/60/120fps
reversal, lean bound, limb readability and original-pose preservation.
The quick actual Kairo WebGL gallery compares V161 against V162 from
front, side and back. Technical passing is not a subjective art approval:
the new candidate remains opt-in for feedback.
