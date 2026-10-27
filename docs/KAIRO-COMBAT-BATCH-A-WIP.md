# Sky Clash Batch A — Kairo original grounded combat work-in-progress (27 Oct 2026)

**Status:** DRAFT PR #139, **experimental only**. Not released, not visually approved, no changes to game default. Follow [complete blueprint](KAIRO-RIN-COMBAT-ANIMATION-REDESIGN-BLUEPRINT-2026-10-27.md) and [ownership rules](ANIMATION-OWNERSHIP-CONTRACT.md).

## First working authored asset

- Original authored Kairo real-VRM0 local normalized joint quaternion pack at `assets/animations/combat/kairo/storm-fist-batch-a.pose.json` (source generator `tools/author-kairo-combat-choreography.cjs`, Pose Lab browser on Kairo VRM0, SHA `775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72`).
- Ten clip lanes: combat-ready, guard, parry, jab, cross, hook, overhand, rising kick, light-hit and heavy-hit. Ground strikes have exact 0.24 / 0.24 / 0.33 / 0.33 / 0.41s **existing gameplay** contacts and their original 0.55 / 0.55 / 0.68 / 0.68 / 0.87s attack durations; five authored semantic poses each.
- The original authored data is **not** a Mixamo pack or a set of additive procedural gameplay rotations. It is a versioned source JSON of **absolute local normalized VRM quaternions**. The new `js/kairo-combat-choreography.js` is only a validating decoder and sampler; `js/v72-published-actions.js` remains the existing final combat writer. `js/v66-game-boot.js` loads decoder only with `?combatAnim=kairo-a1`.
- In the enhanced opt-in preview, **Kairo's grounded four-strike chain, fight-ready, guard, successful parry and light/heavy hit reactions** now select the native local clips through the existing V72 writer; airborne attacks remain V87/legacy. Rin remains entirely on her existing paths. Combat hit detection, timers, movement/root/physics, stamina, flight, Boost and abilities are not modified.
- No new `Fighter.animate` wrapper. V100 still owns flight and yields when Kairo attacks. V89/V91 ground stepping already yields on punches. Maintain V164 selected B/B/B/B and optional V165 speed/Boost exactly.

## Objective authoring evidence (NOT gameplay visual sign-off)

- [GitHub Actions real-Pose-Lab run 40500845184](https://github.com/Theo524/sky-clash/actions/runs/40500845184) passed, artifact 12732502763: exact JSON, 20 named joint samples, original source keys and two-camera reference screenshots.
- **Second Pose Lab authoring pass passed:** [run 40503580894](https://github.com/Theo524/sky-clash/actions/runs/40503580894), native quaternion asset preserved at the permanent path. Real-VRM metrics: Kairo's rear support knee increased from **5.95° to 18.8°**, front from **15.1° to 34.9°**; a compact lateral hook, diagonal overhand and more elevated rising heel replace the earlier arm shoves/horizontal front kick. These are objective joint/silhouette corrections, NOT evidence of a polished playable combo. Source Pose Lab shows open palms because this 20-bone authoring format excludes fingers; V81 in-game grip is tested separately. **Visual approval is still false.**
- A focused PR-triggered real-game WebGL test now exists at `tools/test-kairo-combat-browser.cjs` plus `.github/workflows/kairo-combat-preview.yml`, exercising **the actual Kairo VRM and V72/V81 final writer** for ready, guard, parry, heavy hit, all five contact silhouettes and the pre-existing melee clock. It captures only internal stills, not a flight/Boost film. This is an opt-in technical QA, **not** an end-to-end player input/combat aesthetics test. The first gameplay opt-in still needs an **actual** in-game four-beat uninterrupted combo and hit-contact evaluation, 30/60/120fps simulations, and attacker-to-defender comparison. Do not make default or merge based on source JSON/Node tests alone.

## Following work within Batch A

1. Verify draft CI and the exact asset sampler in existing V72. **The first-pass native non-attack loop clock was found to lack `speed`: fixed** with local speed=1, continuous ready loop, and explicit guard/parry/damage selection; opt-in only. Confirm separate Kairo vs Rin owner, grounded-only attack gating, cancellation on guard/stun, and correct default fallback.
2. Run a single targeted real-game WebGL ground-combat QA fixture (no flight/Boost film) to assess entry/exit, attack contact, fist closure, foot planting, and how the rendered animation lines up with the `kickPend` collider. Keep all media internal unless requested.
3. Refine hook/overhand and heel silhouettes and grounding until they look like intentional, connected full-body fights. Adjust source pose targets then regenerate exact Pose Lab data, not runtime Euler offsets. Test after each **batch**, not one PR per pose.
4. When visually strong and safe, polish the already-routed guard/parry and light/heavy reactions in the same owner with transition/interrupt evidence. Extend to Rin in Batch B only after Rin rig verified.

**Rollback:** omit `combatAnim=kairo-a1` to use previous V87/legacy combat. The plain playable game, V164 selected flight and V165 preview remain unchanged by this draft feature.

## Second pass pending final game-level acceptance

- V72 native playback chooses authored ready/guard/parry/light-hit/heavy-hit on Kairo only when `combatAnim=kairo-a1`. The native code handles its own `speed=1` and loop; no extra writer. V81 selectively recognizes authored combat stun as damage **only when this URL opt-in is present**. Default V81/Boost/flight/physics remain unchanged.
- The real-game browser fixture samples final V72/V81 poses and checks Kairo hand closure, contact keyframes, guard/parry/hit poses and untouched actual melee contact clock. Its completed outcome must be checked in GitHub before claiming pass.
- Owner-contract static checks, V66 regression and V165 tempo tests are mandatory. The optional preview is not user-approved and will not be merged merely because it passes technical CI.
