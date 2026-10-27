# Sky Clash Batch A — Kairo original grounded combat work-in-progress (27 Oct 2026)

**Status:** USER-AUTHORIZED OPT-IN PUBLIC PLAYER TEST via [PR #139](https://github.com/Theo524/sky-clash/pull/139). The preview becomes playable at [Kairo combat animation test](https://theo524.github.io/sky-clash/?combatAnim=kairo-a1) when GitHub Pages reports its main-branch deployment complete. Combine with the selected V164 B/B/B/B flight via [combat + V164 test](https://theo524.github.io/sky-clash/?combatAnim=kairo-a1&flightVertical=v164). **Experimental, not visually approved and NOT the default**; loading the ordinary URL omits the new animation layer. Follow [complete blueprint](KAIRO-RIN-COMBAT-ANIMATION-REDESIGN-BLUEPRINT-2026-10-27.md) and [ownership rules](ANIMATION-OWNERSHIP-CONTRACT.md).

## First working authored asset

- Original authored Kairo real-VRM0 local normalized joint quaternion pack at `assets/animations/combat/kairo/storm-fist-batch-a.pose.json` (source generator `tools/author-kairo-combat-choreography.cjs`, Pose Lab browser on Kairo VRM0, SHA `775b8d8dee887b686f1fbd38300bf83d4385965746589a8fd6a2706bd7193d72`).
- Ten clip lanes: combat-ready, guard, parry, jab, cross, hook, overhand, rising kick, light-hit and heavy-hit. Ground strikes have exact 0.24 / 0.24 / 0.33 / 0.33 / 0.41s **existing gameplay** contacts and their original 0.55 / 0.55 / 0.68 / 0.68 / 0.87s attack durations; five authored semantic poses each.
- The original authored data is **not** a Mixamo pack or a set of additive procedural gameplay rotations. It is a versioned source JSON of **absolute local normalized VRM quaternions**. The new `js/kairo-combat-choreography.js` is only a validating decoder and sampler; `js/v72-published-actions.js` remains the existing final combat writer. `js/v66-game-boot.js` loads decoder only with `?combatAnim=kairo-a1`.
- In the enhanced opt-in preview, **Kairo's grounded four-strike chain, fight-ready, guard, successful parry and light/heavy hit reactions** now select the native local clips through the existing V72 writer; airborne attacks remain V87/legacy. Rin remains entirely on her existing paths. Combat hit detection, timers, movement/root/physics, stamina, flight, Boost and abilities are not modified.
- No new `Fighter.animate` wrapper. V100 still owns flight and yields when Kairo attacks. V89/V91 ground stepping already yields on punches. Maintain V164 selected B/B/B/B and optional V165 speed/Boost exactly.

## Objective authoring evidence (NOT gameplay visual sign-off)

- [GitHub Actions real-Pose-Lab run 40500845184](https://github.com/Theo524/sky-clash/actions/runs/40500845184) passed, artifact 12732502763: exact JSON, 20 named joint samples, original source keys and two-camera reference screenshots.
- **Second Pose Lab authoring pass passed:** [run 40503580894](https://github.com/Theo524/sky-clash/actions/runs/40503580894), native quaternion asset preserved at the permanent path. Real-VRM metrics: Kairo's rear support knee increased from **5.95° to 18.8°**, front from **15.1° to 34.9°**; a compact lateral hook, diagonal overhand and more elevated rising heel replace the earlier arm shoves/horizontal front kick. These are objective joint/silhouette corrections, NOT evidence of a polished playable combo. Source Pose Lab shows open palms because this 20-bone authoring format excludes fingers; V81 in-game grip is tested separately. **Visual approval is still false.**
- A focused PR-triggered real-game WebGL test now exists at `tools/test-kairo-combat-browser.cjs` plus `.github/workflows/kairo-combat-preview.yml`, exercising **the actual Kairo VRM and V72/V81 final writer** for ready, guard, parry, heavy hit, all five contact silhouettes and the pre-existing melee clock. It captures only internal stills, not a flight/Boost film. This is an opt-in technical QA, **not** an end-to-end player input/combat aesthetics test. The first gameplay opt-in still needs an **actual** in-game four-beat uninterrupted combo and hit-contact evaluation, 30/60/120fps simulations, and attacker-to-defender comparison. Do not make this the default or claim a polished four-beat combo based on source JSON/Node tests alone. Merge is specifically authorized **only** to publish the opt-in player evaluation.

## Following work within Batch A

1. Verify draft CI and the exact asset sampler in existing V72. **The first-pass native non-attack loop clock was found to lack `speed`: fixed** with local speed=1, continuous ready loop, and explicit guard/parry/damage selection; opt-in only. Confirm separate Kairo vs Rin owner, grounded-only attack gating, cancellation on guard/stun, and correct default fallback.
2. Run a single targeted real-game WebGL ground-combat QA fixture (no flight/Boost film) to assess entry/exit, attack contact, fist closure, foot planting, and how the rendered animation lines up with the `kickPend` collider. Keep all media internal unless requested.
3. Refine hook/overhand and heel silhouettes and grounding until they look like intentional, connected full-body fights. Adjust source pose targets then regenerate exact Pose Lab data, not runtime Euler offsets. Test after each **batch**, not one PR per pose.
4. When visually strong and safe, polish the already-routed guard/parry and light/heavy reactions in the same owner with transition/interrupt evidence. Extend to Rin in Batch B only after Rin rig verified.

**Rollback:** omit `combatAnim=kairo-a1` to use previous V87/legacy combat. The plain playable game, V164 selected flight and V165 preview retain their previous selections because this experimental branch is enabled only by URL.

## Second pass pending final game-level acceptance

- V72 native playback chooses authored ready/guard/parry/light-hit/heavy-hit on Kairo only when `combatAnim=kairo-a1`. The native code handles its own `speed=1` and loop; no extra writer. V81 selectively recognizes authored combat stun as damage **only when this URL opt-in is present**. Default V81/Boost/flight/physics remain unchanged.
- The real-game browser fixture samples final V72/V81 poses and checks Kairo hand closure, contact keyframes, guard/parry/hit poses and untouched actual melee contact clock. Its completed outcome must be checked in GitHub before claiming pass.
- Owner-contract static checks, V66 regression and V165 tempo tests are mandatory. The optional preview is **not aesthetic-approved**; publication is specifically allowed for user playtesting and does NOT constitute default promotion.

### Actual game browser evidence — 2026-10-27

- Initial focused [in-game QA run 40504840801](https://github.com/Theo524/sky-clash/actions/runs/40504840801) loaded the **real Kairo skinned VRM** on the draft PR, stepped ready/guard/parry/heavy hit and every grounded contact through the live V72/V81 wrapper, matched source quaternion samples and asserted the unchanged 0.24s real melee contact clock. All 18 contact/defense viewpoints were generated. The workflow's final strict console assertion failed on the **pre-existing V63 optional V62 fallback log**, not on new combat data; the revised test permits only this explicitly named known legacy fallback and otherwise fails on browser errors.
- Static ownership suite's new test likewise exposed an outdated assumption that the base animator should run exactly once despite repeated preview frames: its assertion now requires the base animator to remain active for all frames. Add exact full-body adjacent clip-P4/P0 continuity and distinct hook/overhand tests. Re-run required before passing status can be claimed.
- **Aesthetic status:** internal game captures show Kairo in authored punch, guard, parry and kick contact poses in the actual dojo. These are narrow staged contact snapshots, **not** uninterrupted player-input combo playback, hit-pair choreography, foot-slip/character-distance analysis or final art approval. Keep the new clips experimental and do not enable by default.

- Final safety guard: all authored Kairo **grounded** clips—including block/parry/stun—explicitly yield on `jumping`/`flying`, so V100/legacy airborne combat, approved V164 B/B/B/B and V165 Boost remain authoritative. The corresponding unit tests were added.
- The [focused real-game QA run 40505666248](https://github.com/Theo524/sky-clash/actions/runs/40505666248) **PASSED** on the exact Kairo real VRM, with the known legacy V63 fallback isolated; static ownership suite and V66 integration also passed. This verifies playback and contact matching, **not** an uninterrupted physically simulated four-beat combo or aesthetic approval.

## Player-facing experimental link / interpretation

- Test the new Kairo fight animation on the public game: https://theo524.github.io/sky-clash/?combatAnim=kairo-a1
- Compare normal game: https://theo524.github.io/sky-clash/
- Combine new Kairo combat with previously selected V164 B/B/B/B flight: https://theo524.github.io/sky-clash/?combatAnim=kairo-a1&flightVertical=v164
- To compare with opt-in V165 speed/Boost too: https://theo524.github.io/sky-clash/?combatAnim=kairo-a1&flightVertical=v164&combatFeel=v165
- **The preview URL is valid only after the GitHub Pages main deployment succeeds**. If page assets are stale, reload after deployment (don't promise immediate propagation).
- Keep `visualApproval:false`. This is a safe guarded preview, not the finished cinematic full-combo animation. Rin remains legacy. Collision/timing/physics are unchanged. The older V154 standalone Boost visual comparison on PR head failed its angle-difference assert with `combatAnim` disabled. V154 was not changed; no claim of that comparison being green.

