# Sky Clash — project context for future sessions

**Snapshot: October 24, 2026. Recheck the live GitHub main branch and open
pull requests before assuming this is current.**

## Project setup and current status

Sky Clash is a browser-based 3D fighting game featuring Kairo Venn and Rin
Sable. The editable engine is in src/*.js; running python tools/build.py
generates js/game.js. index.html boots through js/v66-game-boot.js, attaching
historical animation layers and the optional final pose owner.

Main at this snapshot: **V115**, commit 97551be3e0a32e81093b7cb0eaf1fbec4ec03342.
GitHub Actions passed. **Automated success is NOT visual approval.**
PR #60 (feature/v115-visual-review-lab) was open and had passed CI;
it adds an A/B animation testing page without modifying the game.
Verify the PR status instead of assuming it remains open.

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
