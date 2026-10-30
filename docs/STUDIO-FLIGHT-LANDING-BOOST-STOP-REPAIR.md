# Kairo local Animation Studio: flight, landing and boost-stop repair

**User observations (30 October 2026):** After applying their latest 18-motion Studio game pack, the accepted living flight motion vanished, the new Magic "Standing Land To Standing Idle.fbx" did not play visibly, and releasing Ninja "Run.fbx" Boost exposed an unnatural forward bend with mismatched run-to-stop legs.

## Confirmed causes and narrow changes
- `animation-studio.js` previously navigated to `?studioPlaytest=local&scene=dojo`, silently dropping the accepted **opt-in** `flightBody=alive`. Both Apply and Restore Base now open `?studioPlaytest=local&scene=dojo&flightBody=alive`. This does **not** enable the experimental body expression in the ordinary public game.
- The main V72 writer previously played **all** landings at 2.1x, and masked out hips, including when an actual user-applied full-body Studio landing was available. For the applied Kairo landing ONLY, it now plays the actual sampled Mixamo source at 1x and owns all 20 bones (without moving physics root). The existing live V72 animator extends the finished-contact visual recovery to the imported source duration (capped at 1.25s); the public/legacy landing still uses its unchanged clock and original masked hips.
- The previous run-to-stop intentionally masked hips and **both legs**, leaving the upper-body Mixamo forward lean disconnected from the still procedural legs. For a locally assigned run-to-stop with real foot-contact metadata, the complete baked 20-bone animation now owns the pose. It starts at the first genuinely marked two-foot planted source frame rather than the unsupported airborne run lead-in. The game root/skid/velocity and the public stop remain unchanged. When contact flags are missing, preserve the original protected masked behavior.

For the uploaded clip `Movement/Adventure/run to stop.fbx`, the first `3` (both feet supporting) occurs at about 0.33 seconds into its 0.9-second source. The previous first ~0.33 seconds contain unsupported source feet, which is a bad match for a gameplay root already finishing a skid.

## Compare once this opt-in preview PR is merged

- **New local + flight**: https://theo524.github.io/sky-clash/?scene=dojo&studioPlaytest=local&flightBody=alive
- **Original published fallback**: https://theo524.github.io/sky-clash/?scene=dojo

Use the same browser as Studio Apply to Game. Keep **Base v1** saved before experimenting. These changes do not publish user Mixamo clips or overwrite their browser-local Base.

## Attached Rokoko Superhero ZIP (not published)

The uploaded `Superhero.zip` is a ~5.4 MB archive of nine FBX 7.5 binary animations with `mixamorig:` named bones: Hawkeye Archery, Hulk Transformation, IronMan Combat, SuperHero Flying, Mutant Claws, Laser Eyes, SuperHero Landing/Takeoff, Telekinesis, Watch Over City. The naming is compatible with the expected Mixamo bones, **but on-character playback, source root motion and license details are not yet verified**. No animations from this ZIP were committed to the game or promoted to Base.

The much larger second pack need not be uploaded to ChatGPT. Browse/import selectively into the local Studio instead. Export a compact game-actions JSON of the ones actually assigned for analysis and gameplay playtesting; avoid importing multi-hundred-MB ZIPs all at once if the browser struggles.

## Regression

- JS contract tests: explicit flight opt-in is retained by Apply/Restore; native landing/stop clock handling; no normal public promotion.
- Real Chromium VRM Kairo: saved local motions, landing full source clock + pelvis motion, grounded leg movement in run-to-stop, normal original game fallback and Base saved-data integrity.
- No alterations to Punch 1–3, kick mapping, flight posture, Rin or gameplay hit/physics rules. Keep the PR unmerged until CI + player visual approval.
