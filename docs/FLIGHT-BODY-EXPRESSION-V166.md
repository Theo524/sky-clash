# V166 — Living body expression in Kairo's accepted flight stance

**Preview only. No public default promotion.** This is visual motion inside
V100's existing final Kairo flight owner; it does **not** replace V156's
real-VRM Q authored hover/cruise frames, alter Kairo's flight physics or
heights, or affect Rin, punches, Boost, jumps, landings or guard.

## Comparison links after this PR is merged and deployed

- Baseline: https://theo524.github.io/sky-clash/?scene=dojo
- Living flight: https://theo524.github.io/sky-clash/?scene=dojo&flightBody=alive
- Isolated V156 stance: https://theo524.github.io/sky-clash/?scene=dojo&flightPreview=v156&flightBody=alive

The preview is selected by **`flightBody=alive`**. Removing that flag
restores precisely the previous authored 20-bone V156 Q stance. No source
clips or global game build version are changed.

## Intent and behavior

The user likes the existing floating pose and rising/falling body height,
but wants the fighter to *express* suspension through the body itself.
Use two quiet interleaved rhythms to make the chest lift, lumbar and
pelvis counter-sway, relaxed guard shoulders and elbows follow a fraction
of a beat later, and the knees soften minimally. Do not make him walk or
pedal while floating, flap both arms like wings, or rotate the whole model
from its authored upright silhouette.

The deviations are **bounded** to below ~3.2 degrees per joint, ease in
over the first 0.72s of flight, and reduce in forward travel. They do not
change hips.position, the VRM scene/root transform, fighter.pos/velocity,
collision, or the existing visual floating height. Every frame starts from
the accepted V156 authored normalized bone quaternions; the tiny overlay is
applied once, in V100, without accumulating across frames or adding a new
Fighter.animate wrapper. Other flight variants remain available.

## Acceptance

1. Compare the normal link to the preview while suspended in place.
   The V156 pose, feet and arms should be recognizably the same.
2. Look for slow chest/shoulder movement and tiny counterbalances, not
   a frozen rig simply translated up and down.
3. Start moving forward: keep the authored travel silhouette. Try
   leaving flight and re-entering: no jerk at the handoff.
4. Check ordinary grounded combat and Rin: unchanged.
5. The new body motion **must not** become the public default until
   the player visually approves it.

`tests/v166-flight-body-expression.js` checks numerical bounds, rhythm
continuity and default guard. The existing Chromium Studio → Game test
checks actual Kairo VRM changes in preview, unchanged fighter height,
and unchanged ordinary flight. Automated checks do not constitute a
player aesthetic sign-off.
