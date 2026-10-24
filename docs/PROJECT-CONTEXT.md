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

## Full moving-jump video review (October 24, 2026)

After PR #71, the automatic 24fps front+side WebGL video captured only
STANDING jump phases. User correctly asked to inspect the WHOLE jump,
especially while walking and running, since V103 moving takeoff and
V109 moving-contact landing differ from the stationary animation.

`tools/capture-jump-video.cjs` now accepts
`VISUAL_JUMP_MOTION=standing|walking|running`. Walking (2.7 units/s)
and V95 normal joystick running (5.6 units/s, **not** Boost) sample
48 deterministic frames of the actual Kairo VRM/WebGL, including
ground stride, compressed moving preparation, launch, ascent, fall
and V109 moving landing. Root moves forward and the camera follows.
Telemetry includes visible arms, knees, feet, toes, V103 launch-stride
weight, root travel, and moving-contact status. The script refuses to
pass if the moving animation does not actually use V103 stride carry or
V109 flow, or if the fighter root did not move.

`.github/workflows/moving-jump-visual-review.yml` runs both walking
and running cases; artifacts are `real-kairo-walking-jump-videos`
and `real-kairo-running-jump-videos`. The original
`Real Kairo Jump Visual Captures` workflow keeps standing captures.
Review all three before changing foot/toe stance, full-body flow or
moving-jump arms. Desktop software WebGL remains approximate relative
to user phone. This is QA tooling ONLY, no changes to animation
controllers, movement physics, default game or approved previews.

V120 arm fluidity is specifically **standing-only**; V101/V103 moving
arms remain separately unapproved for visual polish. If improved moving
arms or stance is desired, create an independently reversible opt-in
preview, compare full-motion videos and obtain user approval.

## V121 loaded whole-leg takeoff direction (2026-10-24, opt-in)

User explicitly likes V119–V120's grounded athletic stance, body, knees,
toes and arms, BUT reports: as soon as the jump is triggered, the **whole
leg (not just the toes)** turns too far straight forward; the feet become
parallel and the stance looks narrow and robotically front-aligned.
This is a crouch → first takeoff-frame *heading* problem, not a need
to redesign the jumping animation. Avoid undoing V118 actual VRM0
forward-axis correction.

Root cause in code: V119 `v119Spring` eased foot turnout to ZERO just
before the buffered jump triggers, and the V100 recorded jump/leg
handoff gradually returns thighs/knees/ankles to a different source
alignment. Existing V115–V120 `guidedLaunchLegs` keeps the local
quaternions only briefly; it can't retain a foot angle that's ALREADY
gone by the last grounded frame.

V121 **short opt-in**: `?jumpPreview=v121` inherits the approved V118
real-world Kairo anatomical +Z, V119 toe and body spring, V120 fluid
arms, and untouched V97 gait. Only while **standing** buffered push-prep
(speed <1.3), sample a small outward (~3.9deg) left/right world-up
FEMUR yaw after the correct world knee bend, and a matched outward
(~3.4deg) shoe heading that holds through the last PREP frame instead
of relaxing to zero. Toe-tip curl still safely unflexes at launch.
The final V100 owner then blends the six true LAST-VISIBLE local
thigh/knee/ankle quaternions into the recorded airborne legs over
~70–275ms, preserving direction through the physical push-off while
allowing normal knee/ankle extension and matching normal midair pose.
No added animation controller, physics, rigs, input or clips.

Moving walking/running takeoffs DO NOT use this stationary fix; the
separate approved V103 stride inheritance remains unchanged pending a
separate moving-jump review. Falling, V109 moving landing, Boost,
flight, combat and Rin unchanged. Public game remains V115; V120
remains the instant rollback and visual comparison.

CI: real VRM0-yawed Three.js femur geometry at four yaw directions
and 30/60/120fps, full V100 + historical wrappers asserting both feet
and thighs retain heading on first ascent frame, gradual release, no
change to V120 arms/torso, and bit-for-bit same MOVING jumper bones.
Real WebGL front/side full-motion V120–V121 captures must be visually
reviewed; green synthetic tests are not phone visual approval.

Links (after green CI and GitHub Pages deployment):
V121: https://theo524.github.io/sky-clash/?jumpPreview=v121
Rollback: https://theo524.github.io/sky-clash/?jumpPreview=v120

## V122 visible toe-out, not merely mathematical bone yaw (2026-10-24)

**User rejected V121 visually:** feet STILL point straight ahead even though
crouch and full jump posture are good. Do not claim 3.4° of LOCAL foot
quaternion rotation means the rendered shoes look outward. V121
successfully preserved that tiny turnout but it was almost imperceptible.

V122 is a STANDING jump-only opt-in (`?jumpPreview=v122`) that inherits
V118 correct real VRM0 facing and anatomical knee bend, V119 toe spring,
V120 compact fluid arms, and V121 thigh heading at slightly stronger
(~5.9°) amplitude. ONLY after the existing planted-foot correction,
sample actual normalized `leftFoot/rightFoot` to `leftToes/rightToes`
WORLD positions, compare their horizontal vectors against verified
`fighter.model.root` +Z, and turn each whole shoe to a visible
~11.5° outward. The last grounded pose is still passed into the one
V100 final writer, then eased toward approved normal recorded airborne
leg pose over ~80–290ms. Toe tip curling continues to release normally.
No local X/Z assumptions; no new controller; no gameplay physics,
movement, Boost, combat, landing, flight or other characters changed.

**Acceptance is now based on REAL visible toe direction**, not just
bone quaternion rotation: separate 30/60/120fps VRM0 geometry checks
confirm both actual foot->toe vectors turn outward relative to Kairo's
gameplay forward at multiple yaw angles, and the full historical
controller chain checks both shoes remain angled from grounded crouch
through the FIRST airborne frame. Existing V121 (and all earlier
version) checks still run unmodified. The standing-jump browser
video workflow compares `v121,v122` from front+side and must pass.
The video viewer should personally confirm on device; mathematical
tests do not guarantee subjective appearance.

V122 candidate: https://theo524.github.io/sky-clash/?jumpPreview=v122
V121 rollback: https://theo524.github.io/sky-clash/?jumpPreview=v121
Public no-preview root remains V115 baseline and is unchanged.

## V123 cohesive expressive jump launch and rise (2026-10-24)

The user explicitly reports that the descent and landing are expressive
enough but the START through UPWARD part is stiff: wants character and
timing through anticipation, takeoff, and ascending rather than "small
crouch → float up → good fall → good land." Treat this as opt-in V123
standing-jump work, preserve V122 visually corrected native VRM0 foot
toe heading (~11.5deg outward), V118 anatomical knees, V120 compact
guard, and the accepted V105–V115 fall/landing/ground.

Opt-in `?jumpPreview=v123`:
- Same ~215ms buffered V122 loaded crouch, but ~9% clearer V118
  anatomically correct knee compression, ~15mm extra pelvis drop,
  ~14–17% stronger cascaded REAL world-space upper-back/chest coil,
  and a staggered larger-but-STILL COMPACT V120 forearm recoil.
- Same real VRM0 toe-vector outward heading from V122, planted soles,
  and V122 80–290ms initial leg yaw handoff.
- Once rising, a bounded `v123Expression('jump',t)` cascade adds
  **measured world-space** spring/chest lift immediately after launch,
  real upper/lower-arm counter-swing and a small delayed two-leg
  airborne knee gather. They release to ZERO before ~0.6sec,
  so original fall and V109/105 contact remain the published approved
  source poses. No fake local-X thigh axis or extra animation wrapper.
- This is a PREP and standing JUMP only experiment. Moving (speed>1.3)
  V103 stride, Boost, flight, combat, Rin, and post-apex fall/landing
  must stay unchanged.

Animated inside the EXISTING V100 final pose owner only. Exports
pure `v123Expression` and `v123WorldRise` for measured Three.js
VRM0/yaw tests at 30/60/120fps. The full historical V100 controller
stack A/B checks V122 vs V123: stronger anticipation and ascent,
identical visible toe-out and aligned first foot frames, and
identical recorded FALL, landing and moving-jump local bones.
Browser review workflow now records V122 vs V123 synced 24fps
real-Kairo front+side MP4s; green tests are not final on-device
aesthetic approval.

V123 candidate (only after deployment):
https://theo524.github.io/sky-clash/?jumpPreview=v123
V122 rollback: https://theo524.github.io/sky-clash/?jumpPreview=v122
Public root V115 is still unchanged. V123 is NOT default unless user
explicitly approves promotion.

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

## V119 natural jump preparation (opt-in, October 24, 2026)

User reviewed the deployed `?jumpPreview=v118` on their phone and
**confirmed knees and body finally bend the CORRECT direction**. Their
remaining feedback: feet and toes face too rigidly straight forward,
and the crouch/torso motion needs more natural fluidity. This **does
not** justify changing the corrected V118 game-facing axis.

V119 **only** for standing jump prep (speed <1.3, push+anatomic):
- Reuses V118 world-corrected knee and V117 world-corrected torso
  inside the SAME existing V100 final pose writer, no new controller.
- Adds a small outward foot turnout (max ~3.4 degrees) relative to
  the approved starting WORLD foot orientation and a real native VRM0
  `leftToes/rightToes` forefoot flex (max ~4.6 degrees). The toe
  joint rotates from its saved entry quaternion every frame (no drift).
  Both are eased back to zero before takeoff, with an explicit restore
  on leaving prep. NO local-X assumption for mirrored toe bones.
- A gentle ~1cm extra pelvic sink and slightly staggered spine/chest
  motion distribute the body load over time instead of one stiff
  whole-body hinge.
- Existing dual-foot plant, world-sole correction, physical jump timer,
  moving jump, V97 gait, combat, Boost, flight, Rin, and compact arms
  are untouched.

Test candidate after merge and GitHub Pages deployment:
https://theo524.github.io/sky-clash/?jumpPreview=v119

Visual-approved direction-only baseline:
https://theo524.github.io/sky-clash/?jumpPreview=v118

Public default remains V115:
https://theo524.github.io/sky-clash/

Automated checks include real Kairo VRM0 geometry (native toes -Z),
30/60/120 fps individual toe/foot kinematics, fixed floor, foot
turnout/yaw limit, neutral takeoff, full historical V100 wrapper
chain with actual VRM0 corrected scene rotation, and approved moving,
combat, flight and ground tests. These do NOT constitute a visual
approval of V119; show the user the preview and ask whether foot/toe
articulation and jump body flow feel natural before promoting it.

## V120 standing jump and ascent arm flow (October 24, 2026)

The user confirmed V119's realistic toes and jump body are **good** and
requested the arms flow more naturally during the crouch and while
ascending: V101 compact guard arm rotations had remained nearly static.
This is *arm animation only*, not a return to the V98–V100 oversized
forward double-hand thrust.

**V120 isolated opt-in:** `?jumpPreview=v120`
- Inherits V119 realistic toe/foot spring, V118 verified real VRM0
  gameplay-forward axis, V97 gait, V101 compact arms, V105–V115 landing,
  unchanged jump/fall clips and combat.
- The EXISTING V100 single airborne pose owner provides a small recoil
  of upper arms/forearms during stationary push-prep, then a staggered
  world-geometric shoulder/elbow arm drive in the first ~0.5 seconds
  of ascent; both arms return to the approved compact guard.
- Targets use the actual shoulder, upper-arm, lower-arm and hand joint
  positions in world space to determine motion axes (VRM0 corrected
  forward is from fighter.model.root, not scene +Z). Avoids assumed
  local-X axis and previous backwards-bend regressions.
- Physically modest angular range, left/right slight natural asymmetry,
  hands and fingers untouched. No other animator or new wrapper.
- **Only** stationary normal jump PREP/upward state when
  `jumpArms=compact` and `jumpPreview=v120`. Moving jumps, falling,
  powered ascent/flight, Boost, landing, combat and Rin remain unchanged.
- All earlier opt-in comparisons and public V115 default remain
  selectable; V119 is the immediate approved visual rollback.

CI checks V120 arm trajectory on actual Three.js mirrored/VRM0-yawed
rigs at 30/60/120fps plus the full V100 historic upper-body wrapper
chain A/B comparing V119 and V120: new shoulder/elbow motion must be
visible, but pelvis/legs, compact wrist and landing must match V119.
Green tests do not substitute real visual approval.

URLs after PR merge and successful GitHub Pages deployment:
- V120 candidate: https://theo524.github.io/sky-clash/?jumpPreview=v120
- V119 approved: https://theo524.github.io/sky-clash/?jumpPreview=v119

**Seeing the game:** We can verify bone geometry and inspect the
published GitHub assets and browser-rendered captures if made
available, but repository/static tests alone do not allow the text
assistant to continuously watch the user's phone. A one-tap recorded
clip or live screen share would materially improve visual review;
never claim to have seen on-device animations without such a capture.

## Automated real-Kairo browser visual inspection (merged PR #69)

**This replaces asking the user to take screenshots for many iterations.**
GitHub Actions includes `.github/workflows/jump-visual-review.yml`
named **Real Kairo Jump Visual Captures** and the source script
`tools/capture-jump-frames.cjs`. The workflow runs Chromium with WebGL
against the actual full Kairo VRM0 (not a mock, generated mannequin, or
old procedural guide), opens the real dojo and saves front+side images
during idle, grounded loading, compressed prep, takeoff, rising and apex.
It also saves a measured elbow/hand/shoulder report. By default it
compares `v119,v120`, but `workflow_dispatch` supports other pairs
as comma-separated `previews` input.

A coding assistant can locate a successful run in GitHub Actions, use
`fetch_workflow_run_artifacts` then `download_workflow_artifact` via
the GitHub connection to obtain **real-kairo-jump-frames** ZIP. If the
artifact is materialized in the current container, extract it to view
the PNG files and measured `measurements.json`. No user screenshot,
screen recording, phone screenshot tool or manual upload is necessary.

**Last validated:** PR #69's final workflow passed on October 24,
2026. The tool was debugged through title-screen overlay removal,
fixed deterministic pose sampling (so slow screenshots do not distort
jump timing), camera zoom and simulated physical lift for ascent.
I inspected actual front/side V119 vs V120 screenshots and measured
real elbow/hand changes. V120's difference is visible but remains
a *subtle* athletic arm counter-swing, not yet user visually approved.
The user should review `?jumpPreview=v120` before any default promotion.

**Limits:** Chromium software WebGL captures the real game model but
cannot perfectly replicate the user's phone GPU, controls, texture
shader settings or subjective appearance. Do not claim to watch the
user's live phone without a separate screen share. No renderer/gameplay
code is modified by the workflow; screenshots are GitHub Actions
artifacts, not silently transmitted from user devices. Future branches
can rerun it for each new opt-in animation comparison.

## Video-based temporal visual review (PR #71, 2026-10-24)

The user explicitly asked for video inspection because still screenshots
are insufficient to judge jump arm timing, popping, delayed body/foot
follow-through and foot skating. The new (opt-in automation) helper
`tools/capture-jump-video.cjs` extends the existing
`Real Kairo Jump Visual Captures` GitHub Actions workflow.

When the workflow is green, download the `real-kairo-jump-videos`
artifact, containing real decoded Kairo WebGL MP4s at **24 FPS**
(`v119-front.mp4`, `v119-side.mp4`, `v120-front.mp4`,
`v120-side.mp4`) plus `v119-vs-v120-front.mp4` and
`v119-vs-v120-side.mp4` comparison films and
`motion-metrics.json` (48 matched timeline frames). Read through
actual motion, not just a frozen screenshot. Recordings cover
idle → standing crouch load → takeoff → ascent → fall → landing.
The workflow can be manually rerun with `previews`, e.g.
`v120,v121`, after the new preview exists in a checked-out revision.

The encoder uses FFmpeg/libx264 from an explicitly installed and
verified runner package. Frames are **rendered through the actual
VRM/WebGL engine** and animated at a deterministic step independently
of capture-wall-clock latency, so two presets align by frame; they
are stitched into time-correct video by FFmpeg. The video-only capture
hides the opaque game HUD overlays so arms, torso and feet are visible.
The earlier real-Kairo PNG snapshot artifact is still preserved.

For cross-chat review, use the connected GitHub action
`fetch_workflow_run_artifacts` → `download_workflow_artifact` and
inspect the MP4s with playback or extract representative frames with
`ffmpeg`. Explicitly confirm that the video ZIP includes nonempty MP4
files and that the workflow passed, rather than inferring success from
a merge. These GitHub artifact links expire after **14 days**; rerun
the workflow for a fresh comparison.

**Caveat:** the sequences use a synthetic-but-deterministic jump
timeline, freezing game physics while advancing the game's real
animation chain; they are *not* natural-speed captures of the user's
particular phone and cannot measure physical controller latency.
The simulated height is only for clear visibility, not a change to
actual game jump physics. Keep approved V119 limbs and default V115
untouched until the user reviews new arm behavior.



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
