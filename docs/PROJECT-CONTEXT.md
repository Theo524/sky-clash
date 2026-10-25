# Sky Clash — project context for future sessions

## V144 — natural relaxed flight arms (2026-10-25)

Player LOVES V143's newly living hover body and V142's flight stance, but
asked for more natural flying arms. V144 **only replaces authored elbow
and hand direction goals**, keeps the V143 torso, legs and flight physics
identical and preserves approved V125 jump and V97 ground/walk/run/combat.
It is a nine-key, 4.6-second loop with staggered left/right upper-arm and
forearm movement: softly bent elbows, wrists below elbows, hands gently
ahead/inward, no boxing guard or airplane arms. Solved against the real
VRM0 bone geometry inside the single V100 owner. The V143 profile remains
available through `?flightPreview=v143` for instant rollback. The player
has requested each iteration be playable at the normal Sky Clash URL:
https://theo524.github.io/sky-clash/. Do not alter approved actions.


## V143 — living flight body animation (2026-10-25)

The player confirmed V142's silhouette is far better, but Kairo looked
frozen inside the flying stance. V143 keeps the EXACT V142 base keyframes
for the distinctive bent/extended legs and layers a 4.6-second, nine-key
secondary body performance: pelvis/chest pitch and bank, subtly independent
shoulders, elbows and wrists, with delayed follow-through and gentle
asymmetric shin movement. V143 modifies the world-space pelvis and chest
solvers to track these small animation goals; V142's previous fixed
upright aim was erasing torso motion. No root bob, physics changes, joint
controller wrappers, or edits to approved V125 jump, V97 ground, running,
walking, combat, Boost or Rin. V142 retained as `?flightPreview=v142`.

Explicit player direction from the previous request: deliver ALL changes on
the playable normal game URL, not merely on an unpublished branch.
Release needs green character/ownership QA plus actual VRM0 WebGL movie review.


## V142 public release — October 25, 2026 (explicit player request)

The player said they should always be able to **play the actual game** with
animation changes and explicitly requested: "just upload and give game link
with all changes". Accordingly V142 was promoted to the normal GitHub Pages
game URL (no debug query parameters needed); default `flightPreview=v142`,
`SkyClashBuild.version=V142`, and an updated HTML boot cache key. The
approved V125 jump, V97 ground, Boost/combat, gameplay physics and Rin are
unchanged. Historical rollback `?flightPreview=v141` remains available.

V142 is a **4.6-second, 9-pose authored skeletal motion** with periodic cubic
interpolation across 25+ pelvis, torso, arm, leg and foot parameters. The
pre-release actual Kairo WebGL review found the initial V142 too crouched;
the subsequent revision uses one lifted/folded thigh and a longer hanging leg.
Front/side Kairo VRM recordings of that correction were inspected. The
player wants to PLAY the release and judge further improvements in game,
rather than approving mockups or a non-public branch. Numeric tests are not
final aesthetic approval. Continue to accept gameplay feedback and refine.

Playable: https://theo524.github.io/sky-clash/
Fallback: https://theo524.github.io/sky-clash/?flightPreview=v141
PR: https://github.com/Theo524/sky-clash/pull/94

## V141 public release — October 25, 2026 (user explicitly requested publishing)

The player explicitly authorized publishing V141 to the normal public game URL
after learning that the experimental branch was not playable there. PR #93
promotes V141 via the same existing V100 final flight pose writer; there is
no separate preview URL required for the player. Default boot normalizes to
`flightPreview=v141`, preserves approved `jumpPreview=v125` and V97
ground movement, and identifies `SkyClashBuild.version='V141'`.
Other game features (Boost, combat, Rin, grounded animations, physics) are
unchanged. Index boot query was cache-busted for browsers and phones.

The V141 flight profile aims for asymmetric suspended knee bends, stronger
dangling-shoe pitch, and relaxed forearms with torso breathing. Five branch
workflow suites passed before publishing: real Kairo powered-flight videos,
hover stills, real Kairo jump captures, VRM character integration, and
animation ownership. Passing machine tests and recording videos do NOT
constitute manual visual approval; the player will review live game.

Historical comparison/rollback: `?flightPreview=v138` restores prior V138
flight; `?flightPreview=v140` accesses V140. Public game:
https://theo524.github.io/sky-clash/.

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

## V130: integrated public build, organic relaxed hovering (2026-10-24)

**Current user direction:** No version picker or special query string should be
necessary. The plain `https://theo524.github.io/sky-clash/` must load the
LATEST coherent game, not the V115 jump. The normal airborne animation should
read like Goku casually hovering, NOT rigidly guarding/blocking; fists only
come up for real combat. Avoid Superman prone travel in this small arena.

**Research/reference:** Bandai Namco's DBZ Kakarot gameplay showcase
https://en.bandainamcoent.eu/dragon-ball/news/dragon-ball-z-kakarot-gameplay-showcase-1
distinguishes ordinary flying/exploration from battle; Goku free-flight
reference screenshot https://steamcommunity.com/sharedfiles/filedetails/?id=1975965532
shows relaxed arms low rather than a boxer guard. Game animator Jonathan Cooper
https://www.gamedeveloper.com/production/the-12-principles-of-animation-in-video-games
supports readable silhouettes, staggered timing and overlapping action; a
reference to principles, not a claim that this code reproduces Goku animation.

**Implementation:** Default boot chooses grounded V97 + standing V125 jump
(including V123 expressive rise and V124/V125 continuous natural feet) + V130
relaxed upright powered hover. Normal URL is canonical; `?jumpPreview=` and
`?flightPreview=` are *debug rollback only*, with historical A/B intact.
V130 inherits the V128 world-space calibrated left/right suspended knees,
subtle V127 torso pulse, heading and root physics. Replace the V129 raised-hand
combat guard with measured loose downward-hanging arms at natural belt level,
elbows slightly away from ribs and slightly forward, wrists ahead of elbows
but BELOW elbows; two out-of-phase low-amplitude sways plus very light staggered
knee relaxation. No independent pose writer or scene bob, no movement controls,
Boost, attacks, jump, landing or VRM asset changes. Keep V129 as opt-in rollback.

**QA:** Run `tests/approved-ground-default.js`,
`tests/v130-relaxed-integrated-flight.js`, full V100 and ownership suites;
actual real-Kairo VRM WebGL front/side/back 8-pose and full 24fps V128/V130
video workflows test independently, including downward relaxed wrists,
non-backward elbows and knee direction. These numerical checks alone cannot
prove phone aesthetics. Ask the player to review the *plain URL* when deployed.

## V129: real-video-led upper-body levitation guard (2026-10-24)

**Latest player feedback after playing V128:** "much better, but not
the upper body, i tought you said you would do better since you can
verify on video or smt". The player is correct. V128 was published
before actual front/side/back flight movie acceptance, which was not
a sufficient art quality gate. Do not repeat this error.

**Footage actually inspected before V129 code work:** downloaded
successful Github real WebGL VRM0 flight capture run 40128409397, artifact
`real-kairo-powered-flight-videos`, including V126/V127 front, side and
back 24fps 60-frame MP4s. Zoomed key frames 8,22,35,47. Both versions
show a dropped near-hip open hand toward the forward direction and a
second arm trailing backward behind the torso, particularly from the
SIDE and BACK. This reads like an idle/walking arm swing, not a calm
levitating fighter ready to attack. Local-X and local-Z upper-arm numbers
were **not** reliable 3D hand placement. The player preferred V128's
world-space-corrected knees and low-amplitude hover.

**V129 proposal:** `?flightPreview=v129` explicitly opt-in, ONLY
flight upper-body articulation. No change to V128's leg solver,
V125 approved jump, torso/neck shape, game hover bob, root/physics,
grounded locomotion, Rin, or Boost/combat ownership. Keep the same
V100 final-authority one-skeleton-writer architecture. Build from
`v128FlightPose` and preserve its pelvis/spine/chest/legs byte-for-byte.
Zero V127 uncalibrated local shoulder/upper/lower arm X/Z pose and
replace with `v129CorrectFlightGuard()`, using the real visible
shoulder→elbow and elbow→hand **world-space** vectors. The right/left
outward axis comes from actual left/right shoulder positions, not
sign-assumed mirrored local VRM0 axes. Guide elbows slightly out,
down, ahead of shoulders. Guide hands INWARD, UP and ahead of elbows.
Lead hand subtly above off-hand. No T-pose, boxer fists in face,
grounded walking-arm counter-swing, or horizontal Superman posture.
260–320ms easing and 5rad/s per-bone cap relative to prior visible
quaternions protects changes and 30/60/120fps stability. No fingers/wrists
forced; native VRoid hands remain unchanged.

**Observed full-controller issue and fix:** The first V129 `aim`
candidate passed its independent arm test but **failed the complete
V100 owner regression**: right elbow -15cm behind shoulder, both hands
~13–20cm BELOW elbows. Per-frame trace proved the proposed arm solver
stopped moving after about 10 frames. The defect was a self-aliasing
quaternion interpolation: `joint.quaternion.copy(previous).slerp(
joint.quaternion,ratio)` overwrote its intended target first, yielding
zero motion. V129 saves `const proposed=joint.quaternion.clone()`
before the reset and interpolates toward `proposed` instead. Existing
V128 leg algorithm remains unchanged. The V129 arm solver also owns
the single 5rad/s arm step budget (legacy flight bound returns the
previous visible arm without counteracting the solver). On the complete
20-bone V100 rig, settled left/right elbow forward ~19.3cm/~13.4cm;
hands forward of elbows ~12.8cm/~16.7cm, above elbows ~15.1cm/~11.5cm.
These are measurements on the synthetic integration rig, **NOT yet
the actual Kairo VRM**. Character and ownership suites PASSED on
commit bc803053.

**Visual review improvement:** The 60-frame V128/V129 front/side/back
real-Kairo capture still runs, with strict positive arm-forward/up
guard telemetry. Added `tools/capture-flight-guard-stills.cjs` and
`.github/workflows/flight-guard-visual-check.yml` to capture 8
fully-settled representative real-Kairo VRM WebGL poses at hover,
cruise, left/right strafe, rise and descent from all three views.
This fast gallery is NOT a continuous motion film; the full video
tests timing. The gallery also fails if either hand is below elbow,
or elbows/hands don't face the opponent on the real model. Need
inspect its MP4 frames/contact sheets before release. Preserve
rollback V128 live while V129 remains draft PR #81
(https://github.com/Theo524/sky-clash/pull/81).

**Art quality checks:** New `tests/v129-real-flight-guard.js` uses
parented THREE actual world joint positions, mirrored/right reversed
local axes at four yaw angles and 30/60/120fps frame rate caps. In the
real Kairo WebGL 24fps front/side/back A/B capture (V128 vs V129), show
BOTH elbow->hand forward, BOTH hand heights above elbows, elbows visibly
outward, both hands above approximately waist level. Capture now emits
`flightGuardWorld.left/right`, `flightGuardFacing` and **fails if either
arm still dangles/trails in settled flight** (frames 20–47). QA camera
moved closer equally for A and B, making wrists readable. A successful
GitHub workflow followed by actual *human inspection* of new
front/side/back film is required BEFORE claiming art validated, merging
or publishing. The old film is useful for diagnosing baseline, NOT
evidence that the new V129 appears good.

**Status:** Experimental branch `lab/v129-real-vrm-flying-upper-guard`.
V128 remains the latest player-approved legs; current live link
`https://theo524.github.io/sky-clash/?flightPreview=v128`.
V129 is not a game URL until merged/Pages deployed.
Do not remove rollback or promote by default.

## V128: real VRM world-space knees, not guessed local-X hinges (2026-10-24)

**Phone feedback after live V127:** "bad, one leg bending the opposite
way it seems." Treat that as an actionable rejected anatomical pose,
not a cosmetic preference. Keep V126/V127 as rollback/comparison while
fixing the rooted cause: V127 sets same-sign numeric local-X knee/thigh
angles on Kairo's *unverified mirrored VRM0 normalized local axes*.
A synthetic idealized rig test made those angles look correct but cannot
prove correct real-world knee/ankle direction. The canonical rig metadata
explicitly says per-limb world-space calibration is necessary.

**V128 candidate opt-in** `?flightPreview=v128`, V127 fallback
`?flightPreview=v127`. Keep V127's torso/guard/quiet hovering motion,
but zero its six unverified local leg X angles and replace ONLY those
airborne joint rotations in V100 final-owner with measured world-space
targets using existing hip->knee, knee->ankle and ankle->toe vectors:
- Project player **gameplay +Z** into world, *not* scene VRM0 -Z and not
  the transient toe direction. Aim each real thigh toward down/forward
  (left higher, right lower) using cross(current limb, target direction)
  converted to the joint's actual current LOCAL basis via inverse WORLD
  quaternion; similarly aim each shin gently down/back beneath its knee.
- Ankle/toe pitch goal follows the shoe's existing horizontal heading
  but inclines toes down. Don't force VRM0 shoes to arbitrary +Z yaw.
- 260ms smooth flight entry, 5rad/s cap relative to previous final joint
  orientation; never modify player root, physics, Y-bob, impact collision,
  approved V125 jump, V126/V127 source poses, default game, ground gait,
  landing, Rin or Boost/combat owner priorities.
- New status telemetry `flightKneeWorld.left/right.kneeForwardCm` checks
  the observed knee displacement anterior to the hip-to-ankle line and
  `flightKneeFacing=FORWARD/NEEDS REVIEW`, without claiming a synthetic
  test proves the actual VRM0 knee looks artistic.
- New world-space 3D tests set intentionally reversed right local shin
  Y-basis across four gameplay root yaw orientations; verify both knees
  move forward, ankles stay staggered, visible toes slope down and pose
  stepping stays within 5rad/s at 30/60/120fps. Existing V125/V127 tests,
  animation ownership/character regressions remain mandatory.

The long real-Kairo GitHub flight visual workflow now records V127/V128
in front/side/back 24fps. An additional screenshot-based real-VRM
world-geometry review is desirable before asserting complete quality.
Current game V127 is player-rejected but remains rollback. This change
must be an *independent experiment* until CI and user visual feedback.
No claim of perfect knee anatomy until actual screenshots/phone review.

Proposed after merge/deploy ONLY:
`https://theo524.github.io/sky-clash/?flightPreview=v128`.
Rollback:
`https://theo524.github.io/sky-clash/?flightPreview=v127`.
No default promotion.

## V127 lifted-knee combat hover: V126 still looks grounded (2026-10-24)

**Player's direct phone/game feedback after V126 merged PR #78:**
"The floating up and down lightly is good but the pose, looks like he
just standing, surely you can get better mechanics." This supersedes
earlier approval of the *direction*, NOT the standing-looking pose.
Keep V126's quiet bob and upright close-battle movement; don't replace it
with faster bob, Superman horizontal flight, an idle mannequin, or Boost.

**Current root cause in V126 authored joint pose:** only ~0.205/0.248rad
forward thigh lift, ~0.34/0.485rad shin bend. The lower body hangs almost
directly beneath a floor-like pelvis. Its arms receive local X-only guard
offsets with zero independent upper-arm lateral float; numerically
"asymmetrical knees" did NOT ensure real suspended geometry.

**V127 candidate (flight ONLY):** `?flightPreview=v127` for an explicitly
opt-in preview after GitHub Pages deployment, with `?flightPreview=v126`
as the exact prior comparison. New `v127SuspendedFlightPose()` runs inside
the same V100 final 20-bone rig writer; no new animator or extra VRM writer.
- Keep V126's faint 2.1rad/s hover breathing and existing physics-driven
  root bob **unchanged**; DO NOT add another oscillation to root height.
- Subtle pelvis tuck and small opposed chest curve, but upper-body total
  pitch stays <0.22rad at ordinary cruise. Avoid a sitting/horizontal pose.
- Deliberate two-joint suspended lower-body pose: LEFT thigh ~-0.625rad,
  shin bend ~1.06rad (one knee lifted clearly forward), RIGHT thigh
  ~-0.248rad, shin bend ~0.535rad (looser low leg). The independent knees
  must differ from V126 in world space, not merely in numeric pose fields.
  Small rise/descent variations retain the asymmetry; travel doesn't
  straighten both legs or kick them behind him.
- Relax BOTH ankles so forefeet slope down from their ankles, not point
  flat like shoes waiting to plant. Avoid ballet pointe and twitch.
- Allow slight mirrored upper-arm Z deviation from V126's compact combat
  guard to let elbows float away from his ribs. Hands keep native/rest
  orientation; no propeller/T-posed arms or new fingers.
- Keep V111/V126 smoothed lateral and vertical directional effort, per-bone
  5rad/s angular limiter, existing state ownership, immediate Boost and
  combat handoff; V125 standing jump, locomotion, landing and Rin unchanged.
- Numeric targets are *authored VRM-local radians*, not verified world
  degrees. Actual VRM0 orientation can differ: evaluate front, side AND back
  captures, particularly hip-knee-ankle projections and shoe toe direction.
  The same-world-quat geometry checks in the new THREE integration test
  are synthetic only, not equivalent to browser-rendered Kairo.

**Engineering QA:** `tests/v127-suspended-flight.js` performs mirrored
3D bone end-point tests (knee lift, hanging toe offset, staggered ankles,
suspended arm offsets), idle/cruise/ascend/descend/bank checks at
30/60/120fps, and old V126 version protection. Existing
`tests/v100-single-pose-authority.js` now compares actual parented visible
bone coordinates at hover for V126 vs V127, verifies V125 jump and approved
ground remain unchanged, then checks immediate Boost/guard interruption.
Capture using the `Real Kairo Powered Flight Visual Captures` workflow,
now defaulting to V126/V127 A/B, with real-WebGL front/side/back 24fps MP4s
and joint telemetry. Green CI isn't artistic approval.

**Status:** V127 is an unmerged experiment on
`lab/v127-suspended-combat-levitation`, draft PR #79
(https://github.com/Theo524/sky-clash/pull/79). Full V66 character and
animation-ownership CI pass on commit aa9126be; powered-flight real-Kairo
video capture is still in progress. This is not yet player-verified. Do not publish
to the plain URL, replace V126, or merge until reviewed with the player.
Proposed preview URL if subsequently deployed:
`https://theo524.github.io/sky-clash/?flightPreview=v127`.
Rollback: `https://theo524.github.io/sky-clash/?flightPreview=v126`.
Source for intent only: Microsoft Animation Principles
`https://learn.microsoft.com/en-us/windows/win32/lwef/animation-principles`,
Jonathan Cooper on staging, asymmetry and overlap
`https://www.gamedeveloper.com/production/the-12-principles-of-animation-in-video-games`.

## Player correction to V126: upright Green Lantern-style combat levitation

The player challenged the premise of aerodynamic/horizontal flight for a
**small close-range battle arena** and described the preferred motion as
calm, natural, more upright, similar to Green Lantern floating. This is a
critical design choice, not a minor tuning request: Kairo must keep facing
an opponent and remain visibly ready to strike at ordinary aerial speeds.
An aggressive horizontal Superman-style pose belongs to deliberate
high-speed Boost/dash, which has a **separate existing animation owner**.

**Revised V126 PR #78 (NOT public/default):** reject the previous
large additive hip+spine+chest travel pitch. At full normal cruise,
new local flight hip/spine/chest sum is only about 0.15 rad versus
about 0.48 rad in the old V114 profile. These are local authored
angular parameters and NOT verified absolute-world torso tilt;
actual VRM yaw/forward axis must still be visually inspected. Keep
one subtly flexed knee more pronounced than the other, ankles gently
pointing down, small living shoulder/guard overlap, smooth vertical
and lateral velocity response, very modest body banking and
opponent-facing head. Avoid windmilling/swimming arms, a stiff
vertical mannequin, or any physics/camera/Boost changes.

Visual reference: the 3D upright Green Lantern character pose in
DC Worlds Collide (https://dcworldscollidegame.com/roster/greenlantern-hal)
and Injustice Mobile's alternate one-knee-raised levitation pose
(https://www.mortalkombatwarehouse.com/krossovers/injusticemobile/characters/greenlantern/).
These illustrate **attitude/silhouette**, not bone orientations or
licensed source material to copy. Readable attack/neutral distinctions
are essential (https://www.rivalslib.com/workshop_guide/art/anticipation_action_recovery.html).

**New hard acceptance tests:** hover torso sum < 0.14 rad,
normal-cruise torso sum < 0.23 rad and less than 55% of V114's
big cumulative lean; maintain asymmetrical relaxed knee flexion and
compact arms; preserve smooth 30/60/120fps directional changes and
all existing V100 state-owner/Boost/guard protections. The resulting
front/side/back WebGL video must be assessed before merging or
calling the art completed. Prior PR was already draft, so it stays
draft. `?flightPreview=v126` only works on main Pages AFTER
explicit visual approval and merge; `?flightPreview=v114` remains
the equivalent baseline.

## V126 powered hover/cruise polish (2026-10-24; isolated test preview)

**Latest player feedback:** V125 standing jump foot/knee coordination is
"much better". Preserve V125 unchanged. User requests the same deep,
example-based animation review for **powered flight** (separate from
jumping, falling, Boost and physics-controlled landing).

Live baseline remains V114 airborne flight opt-in, requiring
`flightLab=blend&flightStyle=airborne`. The public root does NOT enable
powered-flight redesign. V111 recorded float/fly loops continuously blend
by horizontal speed; V113 derives a subtle hover from grounded guard;
V114 has stronger suspended knee asymmetry and forward cruising silhouette.
V114 static pose consists of sampled local X rotations plus a slight
lateral spine bank. V114 inputs sudden vertical or lateral velocity directly,
so snap reversals can instantly change visible thigh/arm/spine direction;
V111's `st.flightMix` alone smooths horizontal speed. V114 doesn't have
quiet hover breathing/arm overlap, so an otherwise decent stance can be
frozen. Do not apply uncalibrated source clip yaw to fix this, and do not
mistake the height-derived `fighter.flying` for intentional jump state.

**V126 preview candidate (subsequently redesigned for upright levitation above):** `?flightPreview=v126` is a *flight-only*
opt-in on top of **V125** as the unchanged ground/jump behavior. A simple
query with `flightPreview=v114` is the exact V114 airborne-flight A/B
with the SAME V125 ground/jump baseline. Both shortcuts configure the
existing unified animator and opt-in flight without enabling it on the
public root. The new `v126FlightPose(mix,vertical,lateral,age)` is built
on `airborneFlightPose` in the SAME V100 final skeleton writer:
- Keep asymmetrical suspended knees and the recognizable compact hover
  fighter guard.
- Gradually increase forward torso/chest drive and trailing leg extension
  with filtered V111 travel weight. Head counters a little to keep the
  direction readable from the side.
- Filter rising/falling and strafe velocities on the existing ~7/s V111
  per-frame exponential clock; modest counter-steer in both shoulders,
  chest and spine, with opposite signs on left/right bank.
- Add sub-degree delayed upper-body hover breathing only while stationary,
  not repeated leg cycles or artificial root movement.
- Retain V111 per-bone max 5rad/s step clamp, facing stabilization, state
  priority and immediate Boost/guard/combat interruption.
- Preserve V125 jump, V97 idle/walk/run, V103 moving takeoff, V109
  landings, all gameplay physics, root translation and camera controls.
- Refuse to promote to default until explicit player/device visual approval.

Sources for silhouette/timing reference (not literal asset copying):
Disney Animation, `https://disneyanimation.com/process/animation/`
(follow-through, overlap, staging and motion timing);
Meta VR animation principles,
`https://developers.meta.com/vr/design/animation/`;
Etherington Brothers' hover-body language sheet,
`https://www.deviantart.com/etheringtonbrothers/art/How-to-draw-CHARACTERS-HOVERING-IN-FLIGHT-TIP-860659245`;
classic flight motion sheets illustrate stronger torso travel direction
versus poised hovering guard. These are artistic references, not claims
of medically optimal flying anatomy.

**Real-geometry acceptance:** new `tools/capture-flight-video.cjs` and
`.github/workflows/flight-visual-review.yml` sample the actual Kairo
WebGL VRM0 at a fixed 24fps from FRONT/SIDE/BACK through 60 frames:
ground, hover, acceleration, cruise, left/right strafe, upward/downward
flight, braking, immediate Boost yield and flight recovery. The capture
checks actual owner state and visible hands/knees/feet. It simulates
velocity input; it is NOT an on-phone physics recording. Artifact:
`real-kairo-powered-flight-videos`. Run synthetic 30/60/120fps
source-unit tests, full V100 historical owner tests, V125 isolation,
prior V114/flight tests, then inspect MP4 A/Bs and ask for player approval.

Preview URL **only once this candidate is actually deployed**:
`https://theo524.github.io/sky-clash/?flightPreview=v126`.
Rollback:
`https://theo524.github.io/sky-clash/?flightPreview=v114`.
Until merged, candidate is in the V126 PR branch and NOT live on Pages.
Previous jump link `?jumpPreview=v125` remains unchanged.

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
- Same ~215ms buffered V122 loaded crouch and unchanged already-good
  V118 anatomical knees/ankles, but ~15mm extra pelvis sink,
  ~14–17% stronger cascaded REAL world-space upper-back/chest coil,
  and a staggered larger-but-STILL COMPACT V120 forearm recoil.
- Same real VRM0 toe-vector outward heading from V122, planted soles,
  and V122 80–290ms initial leg yaw handoff.
- Once rising, a bounded `v123Expression('jump',t)` cascade adds
  **measured world-space** spring/chest lift immediately after launch,
  and a larger real upper/lower-arm counter-swing. The approved V122
  recorded leg push-off and flight arcs are *not* overwritten: an
  experimental extra world-shin gather leaked into fall due to V102
  angular rate limits and was removed after full-stack A/B measured
  1+ rad of unwanted fall difference. After removal, all twenty
  tested fall/landing bone quaternions match V122. The V123
  chest/arms overlay returns to zero before ~0.6sec.
  No fake local-X thigh axis or extra animation wrapper.
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

## V125 whole jump video audit + knee-tracking shoe preview (October 24, 2026; unapproved)

User reports V124 **decent** for foot-position continuity but the feet now appear
too outward/twisted during crouch; requests a deep *full jump* review using the
existing real-Kairo front/side 24fps capture, biomechanics and animation timing.

Evidence inspected: successful V123 headless WebGL 48-frame, 24fps MP4s from
GitHub Actions run 40119454188, comparing V122 and V123, plus telemetry.
The first 5 frames are idle, 5–10 are grounded 215ms preparation, 11–31
represent the upward arc, 32–39 fall, and 40–47 contact recovery. For V123,
actual world ankle->toe yaw relative to gameplay +Z was approximately:
idle **left -45°, right -72°**; at first PREP **+2°, +1°**; last PREP
**-11°, +11°**. This proves WHY V123 visually teleported/re-squared toes
and WHY V124's faithfully inherited original idle yaw can now look twisted
when its V122 fixed outward-femur yaw still bends both knees forward.
The idle fighting stance is intentionally asymmetrical; these are *measured*
world-angle values, not prescribed universal human foot angles.

**Additional full-sequence observation:** late ascent and FALL show extreme
reported planar toe headings, but at those frames the horizontal projection
of the real foot->toe bone is only 2.6–7cm because the toe-to-ankle segment
points almost vertically down (~16cm). Planar heading becomes ill-conditioned
there. Do NOT interpret +/-160° as proof of an airborne foot yaw bug or
rotate the approved falling/landing animation to fix a horizontal-angle
artifact. The front/side sequence shows distinct recoil/load, body-led launch,
upper-arm/chest continuation, air tuck/brace and contact recovery; no evidence
strong enough to justify another wholesale rewrite. Compare against the
biomechanical countermovement sequence (unweight / brake / propulsion /
flight / land) and established anticipation, overlapping action and arcs.

**V125 is opt-in only**: `?jumpPreview=v125` inherits V124's last-visible
idle world positions and 1st prep shoe yaw without teleports. Replace only
its grounded standing-jump V122 fixed outward-femur correction with measured
per-foot toe-knee tracking; gradually moderate each *individual* extreme toe
yaw toward a conservative ±34° envelope during the existing 215ms preparation,
no more than ~34° of turn, and limit the knee tracking plane to ±28°.
These limits are **artistic safety caps, not universal biomechanical norms**.
The shoe pivot happens gradually after initial compression (not instantly
at jump press), with toes/ankles kept in the existing support solver.
Keep V123 torso/compact-arm/recoil/ascent timing, its V102 80–290ms leg
handoff, and unmodified recorded fall, contact, ground and moving jump.
Do not add a wrapper, new animator, off-axis yaw source or physics change.

- Compare new V125 with V124 in ACTUAL Kairo WebGL front/side 24fps films,
  including first idle->prep frames, last loaded ankles, takeoff, apex,
  descent, first landing contact; human aesthetic approval is required.
- Run V100 full wrapper regressions + real native toe synthetic yaw in
  four VRM0 world directions, and all approved source/animation tests.
- Do not confuse V123 film evidence with **V124 or V125** visual proof.
  V124 video run 40121606905 was in progress when this change began;
  current V125 film must finish successfully before claiming visually clear.
- References: McMahon et al. (2018), "Understanding the Key Phases of the
  Countermovement Jump Force-Time Curve" DOI 10.1519/SSC.0000000000000375;
  Jonathan Cooper (Game Anim), discussion of anticipation, arcs and
  overlapping action at https://www.gamedeveloper.com/production/the-12-principles-of-animation-in-video-games

Candidate after separate deployment: `https://theo524.github.io/sky-clash/?jumpPreview=v125`.
Rollback: `https://theo524.github.io/sky-clash/?jumpPreview=v124`.
Public default stays V115. **DO NOT merge/promote without player's review**.

## V124 actual idle-stance shoe continuity (October 24, 2026)

User approves V123's expressive crouch, upward movement, descent and
landing, but points out a DIFFERENT foot issue: standing idle uses a
natural asymmetric foot POSITION and YAW, whereas the instant jump
button is pressed, the crouch teleports both planted shoes into new
locations and faces them unnaturally straight ahead. The problem is
**idle -> PREP onset**, not V122's takeoff-foot turning.

Findings in source:
- V100 PREP entry saved `st.prepFeet` anchors *after*
  `old.call(this,dt)` had already reposed Kairo for the current frame.
  That was NOT the same as the last visible idle shoe positions.
- V122 and V123 deliberately aimed both feet at a symmetric
  ~11.5° outward angle during prep, ignoring individually approved
  normal standing foot heading. Even if "11.5° out" was technically
  correct, changing Kairo's visible idle-to-load shoe arrangement
  looked like a jump-button teleport.

V124 isolated `?jumpPreview=v124`: capture both shoe world locations,
world foot quaternions and actual foot->toe horizontal directions
BEFORE the first older animator tick at the start of buffered PREP,
only when stationary. Transfer these real anchors into V100's existing
PREP support-foot system; use their measured individual toe vectors
instead of V122's fixed equal-angle target. Keep the correct V118
anatomical knee bend and V123 upper-body anticipation/rise, preserve
normal shoe position via existing V106 planted-foot/hip solver.
Do not widen/narrow feet or overwrite approved grounded stance with a
preset; no new animator, IK wrapper, physics or VRM modifications.
V122/V123 and all prior URLs are byte-for-byte rollback options.
Moving jumps V103/109, fall/contact, combat, Boost, flight and Rin
untouched.

QA: strict VRM0 mirrored yaw + different left/right toe orientation
tests, full historical V100 owner integration checking LAST IDLE ->
FIRST crouch world toe angles and ankle coordinates, whole crouch,
same approved compact arms, unchanged moving and landing, then
real WebGL full-motion V123 vs V124 at 24fps plus phase stills.
Do not claim mobile visual approval from automated captures alone.

Candidate: https://theo524.github.io/sky-clash/?jumpPreview=v124
Rollback: https://theo524.github.io/sky-clash/?jumpPreview=v123
Public root remains V115.

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
