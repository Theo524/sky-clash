# Kairo forward flight — anatomical keyframe blueprint v1

**Status:** DESIGN SPECIFICATION ONLY • 2026-10-26 • **no runtime implementation or user approval**.
**Scope:** Kairo free-flight **forward cruise** and entry/exit from the calmer V152 hover reference; NOT ground sprint, Boost, jump, lock-on guard, Rin or combat.
**Owner:** assistant builds/tests on the **actual Kairo VRM0**. The player is **not** expected to open Pose Lab, edit joints, capture photos or export files.

## What this fixes

Player explicitly rejected V153 forward flight as *a stick flying*, old/default and V154 Boost as terrible, and V155 as even worse due to unnatural **twisting**. The next iteration **must not** merely increase forward pitch or layer procedural corrections.

A successful shot looks like an alert, athletic martial artist **actively directing** his flight:
- The chest opens slightly to see ahead; the torso has *subtle* curvature without a corkscrew.
- The legs trail with credible knees/ankles rather than forming a ruler-straight single bar.
- The elbows stay articulated; neither arm is a locked rod or an unnatural twisted shoulder.
- The silhouette is stable while cruising; a few slow secondary motions trail acceleration.
- A forward takeoff *moves through* a recognizable transition instead of snapping into a static airplane pose.

These are animation goals, not a literal claim about aerodynamics or a copy of any existing anime character.

## User refinement — 2026-10-26: still too straight, especially the head

The player reports **a modest improvement, but the forward-flight body is still too straight and the head also too straight**. Do not call the static blueprint a shipped animation: the gameplay boot still uses the V153 forward-flight owner unless a separate implementation has since been merged. The feedback is a request for **visible curvature and independent head/neck acting**, NOT additional spine twists.

### First visual correction to author and film on Kairo

1. **Head must NOT simply continue the torso line.** Use the real neck and head joints with an anatomically small upward gaze/counter-rotation *relative to chest*, so his face aims along the flight path instead of matching the chest's pitched-down axis. Keep the forehead/chin natural — no extreme backward neck snap or tilted skull.
2. **A visible profile bend rather than extra root tilt:** take the pelvis → sternum → neck → eye-line chain and show a connected, gentle sagittal arc. Preserve near-zero relative chest/pelvis **yaw** and roll, so "curvier" never means sideways twisted. The visual difference must remain obvious at thumbnail size.
3. **Knees and elbows must break the plank silhouette:** aim for natural elbow and knee folds and non-mirrored hands/shoes. No foot or wrist inversion, no crossing body in straight flight.
4. **One pose before any motion:** author the cruise keyframe on the actual V152-based Kairo skeleton, capture a 3-view A/B against baseline and rejected V153. Check actual face line, nose direction, shoulder shape, wrist and knee geometry. Do not implement interpolation until a plausible still exists.
5. **No auto-approval:** pass/fail is appearance on the actual skinned model, then player's explicit reaction; numerical angles are secondary. Do not claim this document makes the live animation better.

### Additional render diagnostics

- Measure nose/head-forward vector (derived from the real normalized `head` bone after VRM0 calibration) versus forward travel. Compare it to pelvis→chest forward inclination, and screenshot a horizontal eye-level guide in side view.
- Record a visibly separate **neck flexion versus head flexion**, not one large neck-only backward rotation.
- Add front/back view torsion and visible asymmetry checks; the head should stay centered over shoulders, not roll sideways or swivel.
- In motion, neck settles a beat after chest (subtle animation principle of follow-through), but do **not** introduce repetitive head bobbing.

## 1. Reference examples and what they actually teach

The assistant may use these for movement principles and posing references, **not** copyrighted character tracing, body-template substitution or shipping visual assets.

- **Real horizontal flight / wingsuit:** the <https://www.fai.org/page/wingsuit-flying> emphasizes controlled body position and precision. Take the quiet stability and directional intent. **Do not copy its full-length, perfectly straight fabric-supported wingsuit silhouette.** Kairo flies under his own power.
- **Diver/swimmer streamline:** useful negative control — a competitive streamlined glide is intentionally head-to-toe straight; precisely what the user said Kairo looks like. **Do not equate maximum streamlining with convincing anime flight.**
- **Professional character animation principles:** <https://disneyanimation.com/process/animation/> highlights timing, staging, anatomy, anticipation, follow-through and secondary action. Use these *subtly*, avoiding jitter or exaggerated head bob.
- **Rig and clip blending:** <https://help.autodesk.com/cloudhelp/2026/ENU/Maya-Animation/files/GUID-A8896C5F-5945-41CA-A85C-80064CE90F06.htm> cautions that blends between dissimilar motions may look awkward. The flight performance should enter from the **real existing V152 hover pose**, not a guessed T-pose or a running clip. The original source clip must be visually compatible.
- **Authoring method:** <https://help.autodesk.com/cloudhelp/2026/ENU/Maya-Animation/files/GUID-5C202CB8-EB3C-4ADE-B203-5F93A9FD9104.htm> describes nondestructive layered pose comparison. Author candidate keys on a separate review track; keep the gameplay baseline unchanged.

## 2. Measurement convention — important

**Never paste the angles below directly into `VRM.humanoid.getNormalizedBoneNode(...).rotation.x` (or guessed Y/Z axes).** The actual published Kairo VRM0 carries rest rotations and a VRM0 axis conversion. Direct local angles may rotate knees, pelvis and shoulders around the wrong axes — the source of past twisted results.

All values below are *first-pass visible targets*, NOT verified measurements, never an automatic green-light. Measure **actual rendered world-space anatomical segment vectors** after VRM0 orientation correction:
- **Forward axis:** horizontal movement direction; calibrate once against the real model's converted forward, not hardcoded +Z.
- **Whole-body lean:** visual line from pelvis/hips through upper chest/neck relative to world-up; `0° = upright`, `90° = horizontal`. Evaluate by side-view projection to avoid yaw contaminating pitch.
- **Sagittal curve:** chest gently lifted relative to pelvis in the fore/aft plane. The actual *local spine rotation* necessary is model-dependent.
- **Yaw / roll twist:** relative chest-to-pelvis heading/bank, computed from anatomical reference frames, **not Euler subtraction**.
- **Knee / elbow flexion:** angular change of consecutive actual joint-segment vectors; `0° = straight`, measured separately left and right. If the humanoid rig's knee axis/skin bends are unconventional, manual WebGL review outranks the metric.
- **Foot and wrist:** heading and anatomical continuity are more important than a universal numeric value.

Before keyframe authoring, record the V152 hover baseline geometry and model SHA256. Current editor reference: `assets/animations/reference/kairo-v152-hover.pose.json` (real V100 runtime sample), SHA-bound to `assets/characters/kairo.vrm`. Do not silently overwrite this reference.

## 3. Cruise pose — proposed target envelopes

| Anatomy | First-pass visible target | Hard quality guard |
|---|---|---|
| Pelvis-to-upper-neck global body lean | **42–55° from vertical**, forward | Do not force a 75–90° flat plank; evaluate real silhouette, not pitch alone |
| Chest / upper spine | **6–12°** apparent lift relative to lower torso in sagittal plane | Preserve spine continuity: no folded waist or independent chest yaw correction |
| Chest–pelvis relative yaw | Aim **≤4°** in neutral straight cruise | Reject any visibly twisted ribs or shoulder line even if computed angle passes |
| Chest–pelvis relative roll | Aim **≤3°** in neutral straight cruise | No banking on straight input; turn/bank is a different animation |
| Head / neck | Gaze along horizontal forward path; slight chin raise only if needed | Do not bend neck backward to fake chest lift; no upside-down head |
| Shoulders | Loose, slightly drawn back/down; arms close but separated from ribs | No shrug, elbows through torso or diagonal arm rods |
| Left elbow flexion | **30–45°**, slightly lower than right forearm | Visual forearm fold; wrist not inverted |
| Right elbow flexion | **35–50°** | Mild asymmetry only; not mirrored straight beams |
| Hands | Natural open/relaxed-ready hand near outer hip/thigh line | Hands cannot penetrate thigh/waist; no knuckle-forward T-pose |
| Left knee flexion | **25–40°** relative to straight thigh/shin line | The whole leg trails; do not let knee jut far forward underneath chest |
| Right knee flexion | **20–35°**, distinguishable by **5–10°** | Neither leg is locked; both feet continue from shin direction |
| Ankle/toe direction | Relaxed extension behind, toes broadly along travel | No pointing straight at camera, inversion, bicycle pedals or heel flip |

**These are deliberately starting ranges, not a promised magic answer.** The V152 captured reference has a different left/right knee geometry; first validate the metric convention on the actual VRM0. If Kairo deforms unnaturally even within these ranges, solve the **actual rendered pose** rather than adjusting the numerical range to make a unit test pass.

### Pose language / hierarchy

- Pelvis and chest should rotate as a connected trunk, **not** unrelated world vectors that pull a local human skeleton into an S-shaped torsion.
- For straight cruise, avoid continuous torso yaw oscillation. If needed, add the tiniest follow-through at shoulders/wrists/ankles **after** visual approval of the static pose.
- An anime fighter's flight pose can be a little more expressive than a real athlete: one forearm behind the ribs, the other slightly bent out, knees tucked at subtly different lengths. Do not exaggerate asymmetry into a corkscrew.
- Neck gaze is independent of root translation; keep lock-on and combat priorities unchanged.

## 4. Timing: actual keyframes, not arbitrary state lerps

Suggested first clip length **0.60–0.80 seconds** from V152 hover to cruise. The exact timing is editable after rendered review; drive the clip by forward-intent activation and normalized visual effort, not by frame count or a hardcoded 60fps tick.

| Local time | Beat / authored frame | Whole-body performance | Why |
|---|---|---|---|
| **0.00 s** | **H0**, exact V152 recorded hover | All 20 normalized local quaternions from the SHA-verified reference. Don't reconstruct or re-zero them. | No pop on first frame |
| **0.08–0.12 s** | **A1**, prepare | Eyes/head track travel; torso leans a little; hands start their path; legs barely change. | Anticipation without awkward back-bend |
| **0.20–0.28 s** | **A2**, tip into travel | Pelvis/connected trunk pitch together; chest begins its small relative extension; elbows fold; one knee follows first. | Body has a coherent leading mass |
| **0.38–0.46 s** | **A3**, settle | Both knees are convincingly bent/trailing; shins continue from thighs; elbows settle on either side of trunk. | No head-to-foot stick |
| **0.60–0.80 s** | **C1**, stable cruise | Confirm full silhouette from front, side, back; no ongoing torso twist. | A believable controlled high-speed hold |

Interpolation requirements:
- Store **true local quaternion keyframes for all normalized bones**, not target world-direction formulas. Slerp or equivalent normalized rotation interpolation, with easing tuned from actual rendered motion.
- Pose-to-pose paths must preserve anatomical continuity. Use a held pelvis/chest pair rather than simultaneous independent late-frame corrective writers.
- Dampen micro-motions during cruise. Initial version should hold C1 nearly still; do not introduce flutter until the static keyframe is good.
- On release, reverse/author a smooth short **0.25–0.40 s** route back to hover, avoiding inverse snap or feet suddenly kicking upward. **Do not simply reverse the acceleration animation if that exposes an unnatural hand path**.
- Re-entry, abrupt yaw change, vertical climb, guard, melee and hitstun handoffs may stop/blend the clip. No teleporting root or changing physics to mask poses.
- Frame-rate-independent: sample all states at 30, 60 and 120fps; same visible position at the same wall-clock moment.

## 5. Controlled test scenarios

Use the real published Kairo VRM and a scripted browser, never a substitute mannequin:
1. Side/front/back static **H0** reference screenshot.
2. Side/front/back static **C1** candidate, same camera/framing/scale/light.
3. Overlay trunk/head/shoulder/hip/knee/ankle actual joint landmarks on side view; inspect silhouette at full-size and mobile thumbnail.
4. Animated **H0 → A1 → A2 → A3 → C1**, 24–60fps capture; check rotation vectors, elbows/wrists and legs on every frame.
5. **C1 hold / deceleration / hover handoff**, verify no pose pop or abrupt roll.
6. Turn left/right, ascend/descend, lock-on/guard and interruption: existing controls override without producing a corkscrew. **Initially keep these exact states unchanged**.
7. Test independent `?flightPreview=<new-candidate>` only after the static clip is approved; original V152 and current live V153 remain selectable. **No default promotion without explicit player visual approval.**

Report actual measured numbers **and** the visible result, including failures. Green unit tests alone do not constitute quality acceptance.

## 6. Implementation design — assistant-owned

**Phase I — No game code:**
- Load saved `assets/animations/reference/kairo-v152-hover.pose.json` into Pose Lab with Playwright/headless browser.
- Pose exact real local Kairo joints using automated controls or a dedicated isolated authoring script. Never force guessed local x/y/z angles from these target ranges.
- Capture three-view stills automatically. Review visually, adjust the actual bone quaternion track and export a versioned asset (e.g. `assets/animations/authoring/kairo-forward-cruise-candidate.pose.json`). Label it **candidate**, with VRM SHA256.
- Author 3–5 more exact frames only after C1 static silhouette looks coherent.

**Phase II — opt-in runtime:**
- Introduce a **read-only pose clip sampler** within the V100 final normal-flight path, not a new `Fighter.animate` wrapper or competing VRM bone writer.
- For the gated Kairo forward-flight state, prevent older V142–V155 world-target correctors from also overwriting the clip's tracked joints. Document the explicit single-owner yield/mask behavior.
- Keep V72 Boost on its own owner; do NOT automatically send this normal-forward-flight asset to Boost. A separate grounded sprint and air Boost still need independent real-clip authoring.
- Preserve jump V125, existing V152 hover, V97 ground, Rin, combat, lock-on, and battle/camera physics.
- Actual WebGL capture + user review must pass before this replaces any default.

**Phase III — clean up only when proven safe:**
- Use `docs/REPOSITORY-CLEANUP-AUDIT.md` to retire disapproved V153/V154/V155 preview paths *after* a real replacement passes gameplay tests, screenshot review and player judgment. Never delete current boot dependencies first.

## 7. Definition of done

Not “pitch changed,” not “numeric knee angles hit target,” and not “CI passed.”

**Done means:**
- The actual Kairo VRM visibly has intentional chest/pelvis relationship, human-looking arms/legs and no spine/shoulder/hip twist **from all three views**.
- On hover→cruise→hover he moves fluidly at low and high FPS and looks good *in an ordinary fight*.
- An assistant-produced A/B capture has been inspected visually and can be shown to the player without asking them to use editing tools.
- The player explicitly says the new flight looks better. Only then may it become default.

### Blockers / truth in this version

This file only creates an **executable design target**. It does not create a finished quaternion motion clip, run the game, change `js/v100-pose-authority.js`, fix default V153, touch Boost or claim visual approval. The body target ranges are **creative hypotheses**, not empirically validated joint limits for this model.
