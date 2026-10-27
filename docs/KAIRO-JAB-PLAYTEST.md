# Kairo original jab — experimental Pages playtest

The player explicitly authorized this publication for visual playtesting.
This is **not final animation approval**.

Playtest: https://theo524.github.io/sky-clash/?combatAnim=blender-jab-v1

Enter training or a fight as Kairo. His grounded opening melee jab uses the
new Blender-authored step-in. Later combo beats, Rin, idle/guard, flight,
Boost, damage, hitboxes and attack clocks retain their existing behavior.
This is one new jab, not a completed four-strike combat remake.

The clip is the previously verified 35-frame source at
`assets/animations/kairo/original-jab-playtest.v1.json`; the runtime asset
preserves all tested quaternion/pelvis values and omits diagnostic foot paths.
The existing V72 owner samples it and V81 handles hands and recovery. There is
no additional animation system or wrapper. Plain URLs do not fetch the clip.
A failed, invalid or stalled asset load retains original combat; the optional
load is bounded to five seconds, including JSON reading.

## Preserved working version and rollback

Prior main: `038ac13bb5de70c4e5f8473d8586f5ea7d10195e`.

Annotated tag saved on GitHub:
`rollback/pre-blender-jab-2026-10-27-038ac13`.

Immediate animation fallback: open https://theo524.github.io/sky-clash/
without `combatAnim=blender-jab-v1`.

For a complete site rollback, first ensure the checkout is clean and preserve
any later user work. Restore the tagged tree and commit a forward rollback:

```sh
git fetch origin --tags
git switch main
git pull --ff-only origin main
git restore --source=rollback/pre-blender-jab-2026-10-27-038ac13 --staged --worktree -- .
git commit -m "Restore working game before experimental Blender jab"
git push origin main
```

This retains Git history and the experimental source for later inspection;
there is no force push or history reset. Pages deploys the restored main tree.

## Publication checks

The local publication run passed **110 regression commands**. Automatic browser
entry is checked separately for default combat, the opt-in jab, and an unavailable
jab asset. Each checks actual damage, guard, recovered idle and movement at
30/60/120Hz. No test-side clip registration is used for these entry checks.

## Verification and known limits

The prior private source/bake and actual V72/V81 playback passed at
30/60/120Hz, with genuine hit/whiff, cancellation, guard and idle recovery.
The public loader has opt-in/default, 404, offline, invalid, timeout and late
response regressions. `tools/smoke-kairo-jab-playtest.cjs` checks automatic
entry and real jab damage, movement, guard and recovery at all three rates,
including the original-combat path and an unavailable-asset fallback.
It registers no clip itself and does not inject bone poses.

Rear-foot support still includes the existing game's root travel. Wrist/chest
measurements do not establish exact fist/surface contact. The deep fast step-in
needs the player's visual judgment; do not label it finished or approved.

Repository publication and Pages deployment can be checked through GitHub.
Direct live-site requests require `theo524.github.io` to be permitted by the
cloud environment network policy. Report local and live verification separately.
