# Kairo combat rebuild — Stage 0 foundation (no new animations)

**Status:** Baseline capture tool only. **No playable combat, standing stance, control, hitbox, flight or Boost changes.** User rejected the earlier Batch A / PR #139; it remains rolled back. This is NOT the return of its authored poses or a new preview.

## Engineering aim

A genuinely new animation must first be expressed on the **actual visible Kairo VRM**, recorded in the **actual final game animation pipeline**, and shown through a full uninterrupted action including entering from and returning to the game's original idle. Do not make ten poses and assume that success sampling the contact quaternion demonstrates a fighting move.

New assistant-operated foundation fixture: `tools/diagnose-kairo-combat-pipeline.cjs`. It loads the production game in isolated headless Chromium/WebGL, verifies the real Kairo normalized 20-bone rig and the existing V72, V81, V100 controllers, then freezes only the test page's RAF update. It drives the **real Fighter.update, Combat.melee and gameplay clocks** at 30, 60 and 120 fps. It records every final quaternion/foot/hand position continuously through idle, actual opening jab at an opponent, stance recovery, guard and release, and a separate full four-beat whiff/recovery. No source pose modifications, no new `fighter.animate` wrappers, no gameplay flags.

Workflow: `.github/workflows/kairo-combat-foundation.yml`, scoped to the diagnostic tool itself, 16-minute cap and JSON-only artifact. No unsolicited videos or screenshots. CI may validate real motion state progression, but **cannot pass artistic quality** or demonstrate exact per-bone writer attribution from the state labels alone.

## Mandatory checkpoints before authoring even one replacement

1. **Baseline instrumented:** Confirm all output is from Kairo's *real VRM*, with exact model SHA and 20 correct bones; published status on real V72/V81/V100. Save frame-by-frame real final quaternions, action metadata, clock/contact and world joint paths. Investigate any mismatch rather than tweaking a bone angle.
2. **Writer attribution:** Make an offline instrumentation map of actual changes at each final wrapper (not just `SkyClashPublishedActions.active` status, which is shared for multiple fighters). Identify the *last* writer for each joint/state; establish one unambiguous combat owner and protect idle, V164 flight and Rin. The baseline tracer currently only logs owner **state**, not the actual last writer.
3. **Production authoring:** Assess Blender + actual Kairo VRM, full-body control rig and IK/foot planting. Verify safe conversion of animation data back to the normalized VRM0 game rig without mystery bind offsets, wrist inversion or mismatched fingertips. Do not reuse the rejected `authorWorldPose` pose-direction generator as the main fight choreography pipeline.
4. **One complete original attack:** Only after 1–3, author *one* distinctive Kairo jab with anticipation, contact at the actual gameplay .24s, recoil, foot plant and return to the **unchanged** baseline idle. Compare its moving camera silhouette against the old V87 Mixamo jab at the same in-game distance.
5. **Acceptance before more clips:** Watch the complete action, not static impact screenshots. Confirm convincing elbow/wrist/fist, torso weight transfer, stable shoes, accurate contact, no frame-to-frame pops at 30/60/120fps, guard and whiff cancel. New attacker-target choreography must remain within existing physics/hitboxes. Only then author cross, hook/overhand and launcher, and later Rin.
6. **No premature publication:** All initial work in isolated PRs/tools. User only receives a playable preview **after** the internal full-motion inspection shows an unmistakably distinct coherent result. No default modifications without explicit user visual approval.

## Known current limits

- The current source tools `pose-lab.html` and `js/kairo-pose-lab.js` operate 20 normalized bones, slerp timeline and world-direction aiming but have **no proper IK foot locking, animation-curve motion editing, authored fingers or hip/root performance**. They are validation/reference tools, not a substitute for a production animation rig.
- `js/v72-published-actions.js` retargets world-bind delta Mixamo recordings and masks legs for most punches; `js/v81-pose-transitions.js` separately blends state changes; earlier procedural base `src/45-fighter-controller.js` continues participating. Native local Pose Lab quaternions are **not** interchangeable with Mixamo delta quaternions.
- `src/60-combat.js` owns canonical Kairo contact delays `.24/.24/.33/.41`s and durations `.55/.55/.68/.87`s, with optional V165 multiplying tempo. Never adjust these to mask poor animation alignment.
- Trace metadata alone is **not** an artistic review; don't call the foundation complete without its actual browser run passing. This fixture does not assert good foot plants: it measures inputs to the future acceptance system.
- Historic user feedback: the published Batch A ruined standing/fighting idle and either looked like old Mixamo or looked horrid. This is explicitly rejected; do not offer its old preview URL.

See [rejection](KAIRO-BATCH-A-REJECTED-2026-10-27.md), [full blueprint](KAIRO-RIN-COMBAT-ANIMATION-REDESIGN-BLUEPRINT-2026-10-27.md), and [animation ownership rules](ANIMATION-OWNERSHIP-CONTRACT.md).

## First real-game baseline evidence — 27 October 2026

- **[Diagnostic GitHub Actions run 40528618132](https://github.com/Theo524/sky-clash/actions/runs/40528618132) PASSED** with real Kairo model SHA `775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72`. Captured artifact `12745034913`: full final 20-bone local quaternion and world hand/foot/hip traces at **30fps (222 frames), 60fps (441 frames), 120fps (883 frames)**, original V72/V81/V100 state labels, actual attacker/defender health, canonical Kairo contact clocks and action selections.
- On the live targeted jab, the enemy's HP fell **100 → 94.78** at all three frame rates; after idle recovery, guard and guard release were observed. The four actual out-of-range combo attempts remained **100 HP**, proving recorded whiffs rather than damage through distance.
- **Critical test-harness correction:** The production fighter `reset()` deliberately increments `attackSerial` rather than returning it to zero. The initial sequential 30/60/120 capture therefore used different attack-serial seeds: combo beat two was assigned `punch1` at 30/120 FPS and `punch2` at 60 FPS. **This is NOT evidence of a frame-rate bug in the game.** The fixture now explicitly seeds `attackSerial=0` and `comboCycle=0` on each scenario reset and asserts the live **punch1 → punch2 → punch3 → kick** V72 sequence after confirming an actual hit and actual whiffs. Re-run required on the amended script.
- Initial per-frame maximum horizontal joint deltas while the physics root barely moves (under 0.015 scene units/frame) were **0.268 / 0.139 / 0.165 scene units** at 30/60/120 FPS, respectively; the peak was the **moving right foot of the kick** and is NOT proof of planted-foot sliding. The current trace lacks IK/support-foot annotations, frame-duration normalization, and joint-motion intent; no artistic or planted-foot quality claim can be made from these peak numbers.
- Current V72 slot labels are confirmed from actual full gameplay traces, but this is **not per-bone final-writer attribution**. That remains the next engineering milestone before authoring replacement motions.

The fixture intentionally never loads the rejected opt-in preview, never changes normal-game code, and never publishes altered gameplay assets.

## Reproducible confirmed baseline (amended diagnostic)

- [Run 40531018160](https://github.com/Theo524/sky-clash/actions/runs/40531018160) **PASSED** on commit `333bb5861f785db292bb2783d490146ac1600b80`; artifact **12745733034** was downloaded and the three JSON traces inspected.
- **30 / 60 / 120 FPS:** 222 / 441 / 883 continuous frames; on all three, V72 selected **`punch1 → punch2 → punch3 → kick`** over the complete combo. The deterministic `attackSerial=0` fixture removed the previous run's artificial seed mismatch.
- The genuine nearby jab registered **5.22 damage** at every tested FPS (rival HP 100 → 94.78); the full four-move distant sequence registered **no damage**. The unmodified game's `idle → jab → idle → guard → idle → four strikes → idle` selection states were actually observed.
- The existing animation and standing pose were **not edited** and remain the production source of truth. This test establishes predictable baseline *state selection* and continuous VRM pose capture. It does **not** prove artistic quality, planted feet, correct old-layer per-bone ownership, or satisfactory visual motion. Those are still necessary before any replacement or playable preview.


## 27 October — instrument actual per-joint writer attribution

The first complete baseline workflow succeeded for real Kairo on all three frame rates, checking the unchanged native V72 slots, the real targeted jab hit and the deliberately missed four-beat chain. Follow-up now instruments **the actual 20 normalized bone quaternion objects** directly in Chromium at sampled 60fps frames. During the real `Fighter.update`, wrapped quaternion API calls capture the *closest application JS call-site* and record which module actually changes each joint after other wrappers have run.

Artifacts: `writer-ownership-60fps.json` gives each sampled frame's `changedByOwner`, per-joint `lastChanged` and `lastCalled` (distinct!), plus per-state totals. The unchanged existing per-frame complete quaternion recording remains available at 30/60/120fps. This is **measurement**, not a replacement animation or a gameplay flag; source production files remain untouched.

**Limitations:** A last quaternion-changing call may be V81's *transition*, not V72's underlying authored pose; compare total writes and ordering rather than assuming the last caller alone generated a move. Method instrumentation doesn't observe raw scalar setters, finger joints beyond the named 20, motion through parent/root transforms or unhooked GLTF skeleton internals. Most importantly it doesn't judge animation aesthetics. Before declaring this writer map reliable, CI must exercise and pass a real WebGL run and confirm expected procedural/base and V72 changes, including while idle and fighting.

## Verified live VRM0 writer map — run 40532499034 (PASSED)

[Real Kairo normalized-bone capture workflow](https://github.com/Theo524/sky-clash/actions/runs/40532499034) passed after installing **instrumentation on the actual per-joint `THREE.Quaternion` instances**, with no new game animation or changed engine files. Artifact **12745789463** contains `writer-ownership-60fps.json`. Captured **47** spaced frames throughout real target-hit jab, idle, guard, four-hit whiff and transitions (full 30/60/120fps timelines remain in the same artifact).

Sampled quaternion-changing API call counts, **not unique bones or animation quality scores**: game.js procedural VRM base **5,309**; V76 idle/walk upper body **342**; V72 published recordings **1,258**; V81 final transitions **785**. V100 flight owner correctly did not change any normalized bones in these fully grounded cases.

| Live grounded state (observed at representative post-transition 60fps frame) | Actual last changing source for representative joint |
|---|---|
| Standing: hips, spine, chest, legs, feet | `v72-published-actions.js` |
| Standing: both shoulders, upper/lower arms, wrists/hands | `v76-upper-body.js` |
| Jab/cross/hook steady active: arms, torso | `v72-published-actions.js` |
| Jab/cross/hook steady active: hips and both legs/feet | `game.js` procedural base (V72's intentional punch lower-body mask) |
| Early punch transitions | `v81-pose-transitions.js` often becomes the *last modifier of all 20 bones* while blending from the prior state |
| Guard: arms, torso | `v72-published-actions.js` |
| Guard: support hips, legs and feet | `game.js` procedural base |
| Rising kick: full body including support legs/feet | `v72-published-actions.js` |
| Recovery/standing again | Returns to split V72 lower/body + V76 arms |

These findings **demonstrate mixed owner behavior**, but they do not by themselves prove exactly why the rejected Batch A looked bad. That prototype was removed; its old full-body quaternion data were not playing in this capture.

**Actionable architectural gate:** For any future completely new fighting clip, don't just select 20-bone quaternions in V72. First define who deliberately owns pelvis/leg support during strikes and how V81 receives blended transitions; avoid unconditional `combatReady` over the player's good standing pose. Confirm this on the *final rendered* VRM at meaningful camera distance and in uninterrupted sequence before accepting any authored move.

**Automated regression:** New foundation checks now verify the above baseline's real final writers for idle, punch arm/leg split, guard, kick and V81 transition, with named bones. Their intent is to protect the understanding of the **current** game, not to mandate preserving these exact mixed masks in a future genuinely unified combat system. The resulting CI pass only proves measured engine behavior and never means an aesthetically good strike.

## Native rig interchange proof — new guarded acceptance check

New test `tools/verify-kairo-rig-roundtrip.cjs` uses real Kairo WebGL with the unchanged production controllers to capture a continuously played live standing sample, exact 20 normalized joint hierarchy/positions, the SDK-exposed raw-node map, available finger-joint quaternions, and full original local/world transforms. In a disposable test browser it serializes and re-imports exactly those **normalized local absolute** quaternions on the same VRM; the original live pose must remain unchanged down to tight quaternion/world-position tolerances. The test also intentionally rejects eight incompatible or corrupted input types: raw-GLTF/Blender or Mixamo/world-delta source spaces, wrong model hash, wrong joint order, wrong parent, wrong skeleton signature, non-unit quaternion and wrong dimensions.

Artifacts produce `native-rig-io-proof.json`, which includes a fingerprint for this exact runtime rig. **The captured live standing pose is a measurement, not an instruction to replace the accepted standing motion.** This is deliberately a *native* interchange validation; it does **NOT** yet establish a Blender-to-normalized-VRM0 converter, finger IK, foot planting or artistic quality. Those must be independently verified before authoring/shipping a real attack. GitHub CI must pass this added real-browser check before we mark the data contract as executable.

## Proven native skeleton, recorded permanently — 27 October 2026

- [Real Kairo VRM0 rig interchange test 40534506497](https://github.com/Theo524/sky-clash/actions/runs/40534506497) **PASSED** on the actual visible 20-joint Kairo skeleton; downloadable evidence artifact **12746759008** includes `native-rig-io-proof.json`.
- The exact normalized local quaternion roundtrip had maximum **4.22×10⁻⁸ radians** local/world orientation difference and **4.38×10⁻¹⁶ scene units** world-position difference. Eight deliberately invalid format/hash/hierarchy/quaternion packs were rejected.
- The measured **20-node hierarchy**, 30 finger joints present, 20 raw-node mappings, model SHA and normalized-hierarchy signature are now fixed in the **permanent** source-controlled `docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json`. CI rejects silent changes to that contract.
- This validates only transport of **already-normalized native local joint quaternions back into the same real SDK rig**. It is emphatically **NOT** proof of Blender→VRM0 rotation conversion, Blender IK/feet, polished combat, or a full bind/rest calibration. Raw glTF local rotations must never be fed directly to this normalized interface without a separately proven basis converter.
- The player's previously accepted standing animation remains completely unchanged; the test captures it but must not turn that single frame into a static replacement.

## Blender → real VRM0 transfer proof — exact scope

Dedicated isolated CI workflow `.github/workflows/kairo-blender-vrm-interchange.yml` installs actual Blender and runs `tools/author-kairo-blender-probe.py` on **the original byte-for-byte Kairo VRM0**, imported as GLB using Blender's built-in glTF2 importer. The script validates original 20 humanoid bone names against the source VRM extension, creates a tiny three-keyframe (neutral → 18-degree left upper-arm change → neutral) Blender armature action, and exports the **evaluated Blender-world armature-space delta relative to its original rest**. This is a deliberately non-combat test movement, not a choreographed jab.

`tools/verify-kairo-blender-probe.cjs` then starts the unchanged production game in WebGL on actual Kairo, applies explicit Blender Z-up → glTF/Three Y-up world-rotation conversion, maps the delta to the current world orientation of the matching normalized VRM0 left upper arm, solves the existing parent-relative quaternion, and checks angle preservation, left-hand physical motion, unmoved opposite hand and exact return to the **existing** standing pose. It produces a JSON report; no executable gameplay source, pose clip, physics, default stance or PR #139 rejected animation is touched.

**Scope honesty:** A pass proves a **one-bone evaluated world-space delta transfer**, not a general Blender motion clip converter, 20-bone skeleton retarget, authored fingers, accurate foot IK, or a polished jab. These require separate full-body and motion QA. This test must not be promoted to gameplay just because an artificial tiny arm rotation transfers mathematically.
