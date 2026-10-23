# V103 — making Mixamo/VRM animation conflicts a bounded engineering problem

## The actual problem

All 230 source motions may originate from Mixamo, but **source vendor
uniformity does not guarantee matching animation rigs or transitions**:

- Original Movement/Adventure/Male FBX clips were baked to Sky Clash
  world-rest quaternion samples on an approved idle/run baseline.
- UE5/Quinn-prefixed Mixamo clips were baked through a separate Z-up /
  pelvis/spine_01 conversion into the same nominal 20-bone Y-up format.
- The VRM0 Kairo skeleton has different rest axes from VRM1 pipelines;
  fingers, shoulder/wrist bind rotations and body facing can differ.
- Independent legacy runtime writers caused double control. V100 delegates
  airborne motion to one last pose owner, but a single controller still
  cannot compensate for incompatible source clips on its own.
- Animation takes must agree at *boundaries*: source clip end vs another
  clip start, foot contacts, time-warp, ground physics, and speed/momentum.

## Long-term exit criteria for recurring animation fixes

1. **One canonical Kairo target rig.** Record joint names, rest rotations,
   handedness, face-forward orientation, coordinate system, root basis,
   skeleton signature and native finger pose in a versioned metadata file.
   Rebuild selected FBX sources *offline* into this representation; no
   per-source runtime guesses.
2. **One normalized clip resource contract.** Each published action declares
   source FBX hash, target rig signature, units/axes, duration, bone mask,
   loopability, pose at first/last frame, velocity range and optional foot
   contact markers. Reject incompatible clips *at bake time*.
3. **One animator state graph and one per-bone owner** for ground locomotion,
   jump ascent/descent, landing, Boost, guard, attacks and flight. A
   single clock and root-facing convention; no nesting multiple independent
   skeleton writers for the same body part.
4. **Transition-pair validation.** Automated worst-joint angular deltas,
   frame-to-frame angular speed, feet penetrating or hovering, hand spacing,
   and matching run/walk speed for all *enabled* clip transitions.
   Include standing, moving (4.8u/s), normal run (6.2u/s), Boost, guard,
   jump, descent, landing and walk-to-run tests at 30/60/120 FPS.
5. **Visual gate, not just numeric tests.** Review front/side/back footage
   of Kairo on real phone/browser for every newly enabled state and
   transition; compare against explicitly user-approved baseline captures.
   Never automatically swap every one of the 230 clips into runtime.
6. **Remove obsolete wrappers only after migration.** Preserve V94/V95/V97
   approved ground movement, V101 compact arms and V102 standing jump.
   Retire legacy layer-by-layer once equivalent verified actions ship.

This process cannot mathematically guarantee no future animation issues, but
it eliminates whole categories of regressions and makes remaining defects
traceable to a clip, retarget conversion, state transition or body-part owner.

## Current acceptance and release sequence

- **Approved:** V97 idle/walk/run arms; V101 compact airborne arms; V102
  **standing** jump and leg continuity.
- **V103 focus (this change):** moving takeoff only. Use the existing
  approved grounded left/right leg stride at launch, layer a small static
  inherited stride over the existing jump/fall until momentum fades.
  Source leg animation still comes from the same UE5 clips and exactly
  one final pose owner. No gait loop in the air.
- V103 applies only to ordinary walk and the V95 outer-ring **normal run**,
  not the separate Boost/sprint/flight move. The standing jump is unchanged.
- **Next after acceptance:** assess Boost jumping as a separate state, then
  redesign contact-aware landing in a separate experiment. Do not conflate
  running takeoff, aerial steering and landing into one untestable change.

The V103 test URL adds `&movingJump=carry` to the approved V102 parameters.
Removing it restores the approved standing and moving-jump baseline without
changing the recorded assets.
