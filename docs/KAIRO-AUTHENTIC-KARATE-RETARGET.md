# Kairo Storm Fist — motion-based kick research (isolated experiment)

**Status:** research-only. **Do not merge or publish until Kairo gameplay footage is aesthetically reviewed.**

The earlier procedural feet-only karate attempts were rejected by the player as visually stiff. This experiment instead retargets **recorded full-body motion of a real martial artist** to the **existing Kairo Blender control rig**. It does not create a second V72/V81 animation owner and retains Kairo's current stance, flight and existing published combat.

## Source and provenance

Carnegie Mellon University Graphics Lab Motion Capture Database:
- Subject 135 trial **04** — front kick, adapted as rising kick.
- Subject 135 trial **07** — roundhouse kick.
- Subject 135 trial **11** — side kick.

Source index: https://mocap.cs.cmu.edu/search.php?subjectnumber=135

Reconstructed BVH mirror: https://github.com/una-dinosauria/cmu-mocap/tree/09a07f54f3bbb58797325f009282d0b2048a2871/data/135

CMU's motion capture terms permit inclusion in game products but not resale of the original motion data itself. Credit the CMU Graphics Lab and maintain this provenance if clips are used.

The three source BVHs are fetched into a temporary directory only during offline builds and their Git blob hashes verified, **not bundled with Sky Clash**.

## Retargeting method

1. Parse native BVH joint hierarchy and full body FK including root trajectories, hip orientation, shin/knee bends, opposite-foot support, spine, arm and shoulder movement.
2. Locate the right-foot striking phase of each source take using the already-reviewed subject 135 motion windows. Align the source kick vector with Kairo's measured in-game forward direction (rather than assuming a raw BVH facing convention).
3. Match performer leg lengths to Kairo's measured normalized VRM skeleton; transfer full-limb and torso motion deltas to Kairo's current Blender IK controls.
4. Smooth entrance and exit into Kairo's existing guard while preserving the character rig; clamp support-foot drift and leg reach.
5. Bake to existing native combat pack; test on Kairo actual VRM and record from game camera.

**Acceptance criteria:** The kick must have visible whole-body anticipation, a recognizable leg chamber, a real sweep/thrust/whip, a planted support shoe, credible contact and recovery into guard. A green bone-path numerical test is necessary but never sufficient.

## Run

The workflow `.github/workflows/kairo-authentic-kick-retarget.yml` downloads motion, authors and bakes the real Kairo animation, runs WebGL QA, and preserves video evidence.

No user-facing gameplay is changed on main by this research branch. Any eventual review release must be opt-in, with previous V3 available for rollback.
