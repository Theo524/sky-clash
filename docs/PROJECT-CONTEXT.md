# Sky Clash — project context for future sessions

**Snapshot: October 24, 2026. Recheck the live GitHub main branch and open
pull requests before assuming this is current.**

## Project setup and current status

Sky Clash is a browser-based 3D fighting game featuring Kairo Venn and Rin
Sable. The editable engine is in src/*.js; running python tools/build.py
generates js/game.js. index.html boots through js/v66-game-boot.js, attaching
historical animation layers and the optional final pose owner.

Playable build is still **V115**. Architecture PR #61 merged to main as
commit 45ad5e5318fcb8a35f94bb30dea4584504643fe8. That change
contains the handoff and safety gate, not new character animations.
**Automated success is NOT visual approval.**

- PR #60 (feature/v115-visual-review-lab) was open with passing CI;
  it adds an A/B preview page without modifying the game. Recheck status.
- PR #61 (architecture/animation-ownership-contract) **merged** on
  October 24, 2026. Its previous audit confirmed no live gameplay changes;
  all 70 existing source/animation checks, V100, V115 and ownership checks
  passed. The guard does not yet enforce a unique real VRM writer per frame.
- PR #62 (fix/approved-ground-default) promotes the user-approved
  `movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored`
  **ground** settings on the public root URL when `movementLab` is absent.
  The user confirmed the V115 preview URL had proper walking while the
  plain root URL looked like gliding, then approved this promotion.
  The boot normalizes the browser query before loading scripts. The
  existing `?movementLab=legacy` explicitly restores the previous plain
  ground behavior; `?movementLab=walk` and `?movementLab=step` remain
  explicit A/B modes. No flight, jump, landing or Boost preview is enabled
  automatically. No extra animation controller, rig or source clip added.
  The public build label remains V115, not a new animation redesign.
  Run tests/approved-ground-default.js plus the full regression suite;
  verify the main URL visually on a phone after deployment.

## Root game URL: important default jump correction (October 24, 2026)

After PR #62 promoted ONLY the V97-approved ground flags on the root URL,
the user reported that the jump looked bad again. The default root URL
was still missing the V100–V115 jump/landing flags from the previously
working *full V115 preview*. This was a launch-configuration regression,
**not** a removed animation asset or a new VRM controller.

The fix in PR #63 (verify number/live status) adds only the already
existing jump/landing preview flags automatically when `movementLab`
is absent AND no explicit air/jump A/B flags are present:
`airLab=jump&animator=unified&jumpArms=compact&airLegs=steady&movingJump=carry&landingLab=contact&landingFeet=plant&landingMove=flow&jumpStyle=expressive&jumpPrep=push&jumpFeet=hold&jumpKnees=forward&jumpFacing=locked`.
These enable the existing V100 final owner and V101–V115 refinements;
they do not add new controllers, clips, physics or VRM assets.

**Rollback:** `?jumpMode=legacy` retains the improved V97 ground
movement but suppresses the automatic jump settings. The existing
`?movementLab=legacy` bypasses *all* automatic ground/jump settings.
An explicit A/B mode such as `?jumpPrep=subtle`, `?animator=legacy`,
`?airLab=jump`, or `?flightLab=blend` is preserved without an
unexpected full default jump preset.

**Powered flight remains opt-in:** `flightLab` and `flightStyle` are
not added to the public URL by default; V114 airborne flight still
requires user visual evaluation. Build label remains V115.
Check the latest PR, CI and phone-browser visuals before treating
any default animation as fully approved.

## V116 standing jump experiment (October 24, 2026)

User feedback after deploying PR #63: the jump preparation still looks
nearly upright, and both knees visibly fold the wrong way despite V115
numerical tests. V115's calibrated local-X *derivatives* did not validate
the forward orientation of the entire hip/knee/ankle hinge in rendered VRM.

**V116 candidate, opt-in only**: use
https://theo524.github.io/sky-clash/?jumpPreview=v116
after this candidate is merged and GitHub Pages deployment passes.
The plain URL is **still V115**; V116 is not yet visually approved.
Rollback/comparison:
https://theo524.github.io/sky-clash/

What changes: `jumpPrep=push&jumpKnees=anatomic` enables an existing V100
standing-preparation branch that computes joint rotation axes from live
VRM 3D leg vectors and world forward. Each thigh steers its knee forward;
each shin folds its ankle back below the knee. Shoes preserve the world
orientation recorded on entering prep. The V116 profile adds a deeper
leg compression, visible torso lean and hip load. Real jump physics
timing (215ms stationary/shorter moving), contacts, speed and attack
controllers remain untouched.

Guardrail: V116 acts **only** with anatomic knees during `jumpPrep=push`
at standing launch speed below 1.3; moving jumps explicitly continue
the existing V115 sign-calibrated route. V97 walk/run, V101 guard,
Rin, Boost and flight are not modified; no additional animation wrapper.

Regression tests include 30/60/120fps whole-leg signed knee projection
for mirrored limbs/rotated skeletons, shoe world-facing, static invariants,
and a real full V100 multi-wrapper jump->takeoff path in
`tests/v100-single-pose-authority.js`.

**Not yet established**: real-device front/side/back aesthetics, actual
Kairo mesh/skinned-shoe clearance, and visual user approval. Do not
automatically promote this preset to the default on green CI alone.

## V117 trial after real-device V116 feedback (October 24, 2026)

The user tested the published `?jumpPreview=v116` and reported:
"most of the body bending the opposite direction". Treat the user's
observation as evidence that V116 has NOT passed the visual acceptance
gate, despite passing synthetic world-space leg and knee tests.

**Root cause isolated in source:** V116 steered thigh/shin joints in
world space but still applied *local X* rotation to hips, spine, chest,
and neck. The pelvis local pitch also rotated the whole thigh hierarchy,
which can visually counteract the anatomically measured knee pose.

**V117 opt-in trial:** `?jumpPreview=v117` retains V116 measured knee
hinges but suppresses those local-X *body* rotations in PREP only.
Torso tilt is now calculated by actual world-space vectors from spine to
upper chest and chest to neck. The pelvis retains its original standing
quaternion while the hips lower vertically through the existing jump
preparation. No animation controller, new clip, VRM or physics change.
Existing root game link remains V115; V116 comparison remains available.

URLs (after this PR is merged and GitHub Pages deployed):
- New opt-in candidate: https://theo524.github.io/sky-clash/?jumpPreview=v117
- Prior rejected V116: https://theo524.github.io/sky-clash/?jumpPreview=v116
- V115 rollback/default: https://theo524.github.io/sky-clash/

Validate with actual screen recordings from the target phone; green
quaternion tests and artificial bone fixtures do NOT certify the real
skinned VRM's front/back visual correctness. If V117 still looks wrong,
measure the actual normalized Kairo VRM rest axes and stop iterating
heuristic plus-Z assumptions. V117 must not become the default without
the user's explicit visual acceptance.

## V118 real-VRM facing correction (2026-10-24, opt-in)

User tested V117 on the actual mobile WebGL game and again reported
"nope still bend backwards". The V115/V116/V117 synthetic VRM tests had
mistakenly used the corrected `vrm.scene`'s +Z for anatomical forward.

**Confirmed with the actual `assets/characters/kairo.vrm` (16.6 MB):**
It is **VRM0**, named *Boy TBB*, with both native foot-to-toe vectors
pointing **-Z** (around 16 cm forward). The game calls
`VRMUtils.rotateVRM0(vrm)` before parenting the VRM scene under the
fighter model root (`src/30-character-models.js`). That turns visible
toes into gameplay **+Z**, but the corrected `vrm.scene`'s +Z now points
**backwards** relative to `fighter.model.root` and the mesh toes.
V116/V117 used that reversed child-scene vector for both knees and torso.
Source-code heuristics and their fake unrotated skeletons overlooked this.

**V118 preview:** `?jumpPreview=v118`, after merge/deployment.
Within the existing V100 single-air-pose owner ONLY, observe both real
normalized toe vectors, compare them to fighter root world +Z, and use
that actual physical forward for the standing-prep thigh, shin, torso
constraints. Fall back to fighter model root +Z if toe vectors are not
reliable. No VRM, physics, extra animator, flight, approved ground/arm or
moving-jump changes. Default remains V115, prior previews are preserved.

**Evidence:** `tests/v118-real-kairo-orientation.js` parses the actual
binary VRM0 glTF and confirms toe direction, then recreates the corrective
scene yaw at four facing angles and asserts the old scene +Z is inverted.
Full V100 pipeline test adds corrected-scene/real-toe hierarchy and
checks forward knees/torso, guard, one writer, planted soles and
jump-to-air continuity. Automated tests still cannot certify the actual
skinned character's visual appearance; ask user to test V118 before any
promotion to default. If this doesn't solve it, do not repeat the same
axis-guessing pattern: inspect the actual VRM pose and render screenshots.

Rollback: https://theo524.github.io/sky-clash/
Old comparisons: `?jumpPreview=v116`, `?jumpPreview=v117`.

## The longstanding issue

Historical VRM bone/pose controllers can overlap. Past user reports included:
- Odd finger/Italian-hand gesture while jumping (V98–V99).
- Two arms unnaturally together and forward in midair (V100).
- Both legs touching or flicking while airborne.
- Landing looking physically implausible despite passing tests.
- Shoes sliding during standing jump prep.
- One or both knees bending backwards during takeoff (V114).

This motivated V100 final airborne pose ownership, then many targeted
corrections. We must stop using another animation wrapper to fix every
symptom. The guide rig plus visible VRM are deliberate rig layers; the
underlying problems are competing **writers**, source rig/axes mismatch
and inappropriate source clips or transitions.

## Visual approval history — distinguish approved from experimental

- **Approved references:** V97 standing/walking/running arms, V101 compact
  airborne arm posture, V102 standing jump baseline, as recorded in V103.
- **V98:** jump state separation improved, but midair hand issues remained.
- **V100:** unified final jump/fall/land owner added, but user still saw
  arms pressing forward and an unnatural landing.
- **V103:** moving jump stride carry; proposed canonical Kairo rig, normalized
  clip format, deterministic single animator graph, transition validation.
- **V105–V109:** contact-aware and moving landing experiments; do NOT mark
  all their artistic results approved without user feedback.
- **V110:** jump facing provisionally accepted, per PR #56 discussion.
- **V111:** smoothly blended recorded hover and forward flight. A/B candidate.
- **V112:** readable 215ms standing pre-jump load; user said feet moved.
- **V113:** standing jump foot hold and controlled flight; flight looked too
  much like standing.
- **V114:** guided knees and visually distinctive airborne flight; user
  reported a knee bent backwards during standing preparation.
- **V115:** world-space calibrated forward-knee preparation. CI passed;
  requires real-device visual review.

No claim is made that the latest V115 jump and V114 airborne flight
appearance was ever visually approved.

## Next planned work: FLIGHT, not another jumping rewrite

Available opt-in candidates:
- V111 flightLab=blend, no flightStyle: recorded float/fly loops
- V113 flightLab=blend + flightStyle=controlled: compact controlled pose
- V114 flightLab=blend + flightStyle=airborne: suspended hover and travel

With animator=unified, the V100 final owner handles these normal powered
flight states. It yields for sprinting/Boost, combat, damage and other
high-priority interruptions. Do not add another controller.

Flight risks to inspect before modifying animations:
1. Calibrated V115 forward-knee signs apply to *grounded jump prep*, not
   automatically to the authored flight thigh/knee offsets.
2. fighter.flying means HEIGHT ABOVE THE FLOOR; genuine jumping, dropping
   and combat must retain priority in the animation state resolver.
3. Normal powered flight -> Boost -> hover can cross controller boundaries.
   Check both transitions, not merely a stable flying loop.
4. Verify visible knee direction and leg separation in **world space** on
   the real VRM. Local quaternion continuity does not prove anatomy.
5. Record front, side, and back observations of hover, cruise, ascend,
   descend, turn, Boost handoff, jump and landing.

## Work discipline

- Work from current main on a separate, narrowly scoped feature branch.
- Preserve approved movement, combat, Rin, animations and original assets.
- Introduce independent preview flags and a rollback URL for new behavior.
- Test full V100 controller stack, 30/60/120 FPS and world-space geometry.
- Obtain actual target-device visual feedback before changing a default.
- Merge only after explicit approval and then update this file.

Read AGENTS.md and docs/ANIMATION-OWNERSHIP-CONTRACT.md before starting.
Source entry points include js/v100-pose-authority.js,
src/30-character-models.js, src/45-fighter-controller.js,
js/v66-game-boot.js and tests/v100-single-pose-authority.js.
