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

## Storm Fist full-set extension (2026-10-27)

**Kung fu revision 2:** the player rejects the jab and the full set's arms.
The same V72 native set now carries `revision: kung-fu-v2`; its jab receives
the same native handoff, support and bounded approach as the other new moves.
The historical standalone jab route retains its old data for rollback only.
All revised hand orientations are authored from the solved Blender forearm
plus pronation, not pinned to idle world rotation. Elbows use anatomical
outside/down planes; guard/chamber targets move with the torso. No extra
runtime arm writer or animation wrapper is introduced. The older jab-copy
description below records revision 1, not the current player verdict.

The user authorizes coordinated full-set development and Pages review and
accepts the published jab's appearance. V72 remains the only native combat
writer. A model/rig-validated `native-combat-set.v1` contains separately timed
Blender clips for grounded/aerial strikes, guard, parry and directional damage.
V72 selects them using existing attack clocks and animation-only hit/parry
timestamps; physical launch, spike, down and super-hit tumble stay legacy.
Ground support correction runs inside this same native branch only for new
clips with explicit support metadata. V72 captures outgoing joints for a short
handoff, and V81 skips duplicate entry blending while retaining finger grip
and exit blending. The original jab is copied exactly, bypassing these new
handoff/support changes. V100, locomotion, standing assets, flight, Rin, root
physics, collision rules and attack clocks retain their existing ownership.
For the opt-in native set only, the existing movement controller pursues a
shorter measured strike gap for new moves; the published original jab and
default/Rin distances remain unchanged. Falling Fist may add a bounded
70cm vertical aim correction from its wrist to the target chest. Existing
velocity caps, travel budgets, floors, collision separation, damage, hitboxes
and contact clocks stay authoritative; animation never teleports the root.

## Recovered private Blender jab transport (historical foundation)

The local PR #140 continuation adds **no new animate wrapper**. Explicit private
registration on `SkyClashPublishedActions` allows one model/rig-verified native
opening jab to be sampled inside V72's existing action owner. It uses SDK-local
absolute rotations plus per-frame skeleton-local pelvis translation, separate
from Mixamo world-rest deltas. This deliberately full-body branch owns its legs
and pelvis during that jab. Ordinary gameplay loads/registers no native asset. The explicitly authorized
`combatAnim=blender-jab-v1` playtest loads the same verified native pack with
a bounded, nonfatal loader inside V72 startup.

V81 keeps finger grip and the existing exit path, while skipping its additional
body-entry crossfade only when V72 reports that the authored native jab is
active. Damage/guard/air states relinquish native ownership, with attack-serial
cancellation preventing a stale swing from restarting after stun. Original
idle/guard, Rin, V100 flight/jump, root physics and hitboxes remain unchanged.
See `tests/native-combat-private-preview.js` and the real gameplay helper for
this private contract. Full moving world-foot support and fist/mesh contact are
not yet established; this branch is not approval to publish a replacement combo.
