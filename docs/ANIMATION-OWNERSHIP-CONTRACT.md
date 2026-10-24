# Animation ownership contract — Sky Clash

**Status: TARGET ARCHITECTURE; not fully implemented today.**
See docs/V100-ANIMATION-AUTHORITY.md and
docs/V103-ANIMATION-CONTRACT-AND-MOVING-JUMPS.md.

## What is actually happening

The *invisible procedural guide rig* and the *visible VRM humanoid*
are intentionally separate representations. In src/30-character-models.js,
VRMRig.update first copies procedural rotations into the visible rig.
Additional historical animation layers may then modify their target
joints. Some wrap Fighter.animate to call their predecessor and write
later in the same frame.

V100 is attached last for selected Kairo states; its final pose is
authoritative there and V71/V76/V72/V79/V81 yield. V89/V91 stop when
grounded stepping is inactive. Earlier procedural work still runs below
V100 and many ground/combat states are still layered: this is NOT a
universal single-writer implementation.

## Existing wrapper inventory (no new wrappers without review)

| File | Current role |
| --- | --- |
| js/v62-playable-master.js | Master guide-model layer |
| js/v63-recorded-motion.js | Historical master-motion layer |
| js/v71-mixamo-gameplay.js | Recorded gait |
| js/v72-walk-arms.js | Optional legacy walk arms |
| js/v76-upper-body.js | Approved idle/walk upper-body recording |
| js/v72-published-actions.js | Published actions (V79 reuses this adapter) |
| js/v81-pose-transitions.js | Pose changes and fingers |
| js/v89-grounded-step.js | First step / foot support |
| js/v91-stance-continuity.js | Grounded transition limits |
| js/v100-pose-authority.js | Final selected Kairo air pose |

These are historical wrappers, NOT ten independent visible VRM writers
simultaneously active in every state. Some affect the procedural master
or are enabled only by an A/B flag. See boot order in js/v66-game-boot.js.

tests/animation-ownership-contract.js guards against unexpected wrapper
registration and loss of key V100 yield checks. This is a *static tripwire*,
not proof that the final skeleton received a unique write per frame.
The full dynamic V100 multi-wrapper Three.js integration test is still
essential.

## Current state ownership

| Situation | Current final pose | Limitation |
| --- | --- | --- |
| Idle / step / walk / Standard Run | Older approved gait/arms + ground corrections | Layered; do not rewrite |
| Grounded jump preparation | V100, only when enabled and ready | V115 latest knee mode not visually approved |
| Ordinary jump / gravity fall | V100, only when enabled and ready | Preserve compact arms and V102 leg baseline |
| Contact landing | V100, only when enabled and ready | V105–V109 A/B, artistic quality under review |
| Normal powered hover / cruise | V100, requires animator=unified and flightLab=blend | V111/V113/V114 alternative poses |
| Boost, dash, guard, attacks, damage | Legacy/higher-priority animation paths | V100 intentionally yields |
| Rin | Separate existing rig and animations | Outside Kairo V100 migration |

The gameplay property fighter.flying is a HEIGHT getter. It is not
itself evidence of powered flight intent. The V100 state resolver checks
combat/prep/landing/drop/jump before optional powered flight.

## The permanent target

One unambiguous final pose per **humanoid bone, per frame**:

1. Physics/controller produces one state snapshot: jump preparation,
   rise, fall, contact, hover, cruise, Boost, guard, attack, damage, etc.
   Animation never changes gameplay root position or hitboxes.
2. One deterministic state resolver chooses priority and allowed
   animation masks for full-body, legs, upper-body, hands/fingers.
3. All recorded/parametric sources sample into temporary pose buffers
   without writing visible joints. Blends use a single state clock,
   consistent facing, scale and normalized target rest basis.
4. One final pose composer picks/blends one result for each bone and
   commits joint transforms exactly once. Explicit foot-contact
   post-processing is ordered inside that final owner.
5. Every clip declares source fingerprint, target rig fingerprint,
   normalized joint mask/basis, frame rate, time range, looping,
   first/last poses, expected velocity and foot-contact markers.
6. Every source targets one **canonical Kairo normalized rig**, including
   rest joint rotations, handedness, forward axis, VRM0 root conversion,
   scale and native finger pose.

Note: **a single final writer alone cannot fix an incorrectly retargeted
Mixamo recording or an anatomically reversed local knee axis.** The
normalized rig/clip contracts and world-space tests are mandatory too.

## Canonical rig work — do not claim it is already finished

docs/KAIRO-RIG-CONTRACT.v1.json lists the known 20 normalized bone names
and source VRM0 vs gameplay facing conventions. Critical properties are
intentionally null: verified SDK-normalized rest rotations, parent map,
model SHA256, native finger bind quaternions, and rig signature.

Next, inspect the published Kairo VRM0 file and compare its raw glTF
node rest transforms to the SDK's actual *normalized* runtime nodes.
Derive a reproducible normalized skeleton fingerprint and validate it
with real Three.js geometry. Only then use that fingerprint to reject
mismatched published animations during offline bake/export.

## Safe migration, not a big bang rewrite

**Phase 0: inventory + guard.** No runtime pose or physics change. Keep
the existing current-state and transition tests. Block unreviewed
extra animate-wrapper layers in CI.

**Phase 1: measure canonical rig and clip contracts.** Build metadata
from real Kairo; no guessed local axes or clip ownership.

**Phase 2: dev-only per-bone audit.** Attribute actual mutations to
pipeline stages and log the last writer across idle, step, jump, land,
hover, cruise, flight->Boost, Boost->hover, combat. Diagnostics must
not alter motion or cause a second writer.

**Phase 3: migrate one state to one composer.** Start with flight behind
an independent flag, preserving the current V100 implementation and
all approved ground/combat controllers as comparison. Test both state
entry and interruption. Do NOT add a new nested fighter.animate.

**Phase 4: remove older writers carefully.** Only after real WebGL
front/side/back footage, regression tests at 30/60/120fps, world-space
limb checks and explicit user visual approval of that state.

## Merge gates

- No unreviewed new pose writer or changed physics/collision.
- Preserve V97 grounded arms and gait, V101 compact guard, V102 standing
  jump, and Rin's independent fighting behavior.
- Use one narrow PR and one opt-in comparison flag for each change.
- Run tests/v100-single-pose-authority.js plus relevant newer tests.
- Record exact A/B URL, changed state, rollback, visible results and
  explicit approvals in docs/PROJECT-CONTEXT.md.
- Never confuse CI success with finished visual animation.
