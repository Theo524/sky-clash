# Visual choice — Kairo B arm motion

The user picked B ("arms slightly away from the body"), then asked whether
there should be motion as the character hovers/flies. This experiment shows
**three moving versions of that same B base pose**, not three different
stances. No gameplay or published Q quaternions are modified. User selects
the desired **amount** visually: A quiet, B natural, C expressive.

Run the assistant-operated workflow `.github/workflows/kairo-b-arm-motion-preview.yml`
using headless real Kairo VRM0 Pose Lab. It captures 36 actual WebGL frames,
full 20-bone quaternions of each loop, 3 GIFs and a labeled 3-way animated
GIF. Use the **single comparison animation** in chat to avoid confusing
the user with multiple references. Preserve selected B arm spacing, all
non-arm pose bones, and the user's standing-hover-based vertical flight
preference. Ask for A/B/C before applying to the live flight owner.

Source: V152/V156 real hover, exact SHA; bone aims are rigged ON Kairo's
VRM0 inside `SkyClashPoseLab.authorWorldPose`, not image-only mockups.
Animation phases are baked into real local quaternions, with shoulder
leading elbow and hand a little. Preview stays independent of V100 runtime.
