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

## Verification and player decision
Real Pose Lab runner [40418975917](https://github.com/Theo524/sky-clash/actions/runs/40418975917) **passed**; artifact **12697736565** includes 3 authentic 20-bone Kairo pose JSON tracks (21 frames/2 seconds each), **36 actual WebGL captured frames**, original 3 looping GIFs and a 3-up GIF, geometry metrics. Arms/wrist spacing variation measured A 0.65–0.70m, B 0.63–0.72m, C 0.60–0.76m (camera-visible amplitude; NOT an aesthetic grade). All options preserve the exact same B base anchor, torso and legs. Assistant cleaned the rendered comparison locally for user presentation; editor controls removed in the chat GIF. **Awaiting user pick of A, B or C motion amplitude**. Do not assume B means motion strength B: B was previously picked as the *static stance*, and the A/B/C motion choices are a new separate decision.
