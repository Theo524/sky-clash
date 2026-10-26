# Kairo Pose Lab — honest visual authoring workflow

**User feedback, 26 October 2026:** V153 "stick flying", both V153 and V154 Boost bad, and V155 had an even worse twisted flight stance. **None is visually approved. Do not generate V156 procedural bone corrections.** Keep all rejected versions opt-in as needed for A/B until a genuine authored animation is approved.

## What we actually had before

- `animation-studio.html` imports user FBX/ZIPs, plays them on a diagnostic master and previews them retargeted onto Kairo/Rin; exports baked source motion data.
- `js/v142-hover-keyframes.js` and related "authored flight" scripts were **parametric keyframe target tables**, not independently handcrafted full-rig quaternion motion clips. V100 still tries to correct world-space pelvis, chest, limbs and hands by algorithms every frame.
- `js/v100-pose-authority.js` owns Kairo normal flight but is not the universal final pose writer. V72 owns recorded Boost, and layered legacy wrappers are still present. Separate writers and unverified rig axes can create surprising results.
- Unit tests checked numerical pose targets, not whether the real skinned character's deformation, proportions, foot and forearm anatomy actually looked correct. Some real-VRM WebGL jobs failed. Past subjective claims that the flight was "fixed" were unsupported.

## New tool: [Kairo Pose Lab](../pose-lab.html)

New **standalone authoring tool**, isolated from live game code; it is deliberately not another fighter animation owner.

1. Loads `assets/characters/kairo.vrm` exactly as published through existing Three.js/VRMKit and `VRMUtils.rotateVRM0`.
2. Controls individual **normalized actual Kairo bones** directly through relative-to-real-rest quaternion sliders. Click highlighted 3D joint markers, or select named bones. Rotate view from front, side, back or drag freely and zoom.
3. Captures discrete **full 20-bone snapshots** on a timeline. Playback interpolates via quaternion slerp, not repeated gameplay world-direction solvers. Create distinct poses at acceleration, middle cruise and recovery with separate keyframes.
4. Reports measured **pelvis-to-neck tilt and left/right actual knee bends** from the rendered VRM, to identify ruler-straight limbs. These numerical measures inform review but never replace visual judgement.
5. Exports screenshot PNG and `sky-clash.pose-lab.v1` keyframe JSON. JSON includes the **SHA-256 of the actual Kairo file**, duration, exact normalized bone names, local quaternion xyzw arrays, editable frame notes and interpolation. Import verifies exact model hash/rig/quat normalization, not generic guessed bone directions.
6. Native editor does **not change game.js, gameplay physics/camera/root, Kairo's default flight, Boost or Rin**, and does not automatically publish its output. A separate runtime integration with one authoritatively masked pose owner must be built and real-WebGL-tested after someone reviews/approves a pose clip.
7. Existing Animation Studio links to this Pose Lab; FBX importing, retargeting and final per-character animation assets remain separate workflows.

### Important limits of v1

- The initial reference is Kairo's **actual normalized model rest pose**, not a baked snapshot of the V152 game pose. Do not claim that Pose Lab's idle/rest exactly matches the shipped standing or hover animation. Before replacing powered flight, add a **real V152 pose import / pose snapshot** or use a deliberately authored base clip, and verify pose-to-game transition.
- Sliders expose local normalized-bone axes with explicit relative-to-rest rotations. A rotated limb can still twist unnaturally if authored poorly; the editor makes that visible and fixable, not impossible.
- Currently has manual quaternion keyframes and slerp; **not** full motion-graph features, inverse-kinematics foot locking, contact-driven animation, or Blender-level rig manipulation.
- Review in the browser from three directions first. An exported JSON is an **authored draft**, not shipped animation. Real in-game integration must respect attack/guard/jump priorities, be gated, be filmed on actual VRM and explicitly approved before making default.

## Suggested process from now on

1. **Freeze** V152 calm hover (and previous ground/jump) instead of editing a whole flight stack based on a silhouette description.
2. In Pose Lab, establish/verify the **actual starting posture**. Make and approve **one still pose** for hard forward flight before animating it. Inspect entire spine, hips, knees, ankles, elbows, hands and facial orientation from side/front/back; compare side-by-side.
3. Save a small handful of real quaternion pose snapshots; inspect 30fps/60fps interpolation for hip-to-chest twist and ankle axis changes. Decide acceleration/cruise/braking timing separately.
4. Build a **single-channel pose clip player** in the existing final authoritative writer for Kairo (one writer per bone). Remove V155-specific correction for that gated flight state rather than layering new corrections on it.
5. Test real model on WebGL and user phone, including Boost and free/locked flight, without auto-promoting to the public default.
6. Only once flight works, author ground Boost from an appropriate authentic sprint or manually posed footwork with actual contact beats; don't simply blend a poor 18-frame sprint and another unrelated gait.

### Visual quality gate

- Is the chest/pelvis smooth without twisting?
- Do elbows bend without inverted wrist/hand/forearm?
- Are knees and shoes anatomically directed, with no flying stick or bicycle legs?
- Does the silhouette look believable from side **and back**, not only a forward-facing camera?
- Are transitions between rest, hover, acceleration, sprint, release and guard continuous?
- Does the clip retain model fingerprint and not mutate physics?
- Has the user seen it and approved it before release?

**Engineering check**: `node tools/test-kairo-pose-lab.cjs` via `.github/workflows/pose-lab-browser.yml` runs a headless browser against the real model to confirm joint edits, PNG, JSON round-trip, measured geometry and no browser exceptions. It is a functional editor test, **not proof of an excellent animation**.
