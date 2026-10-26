# Sky Clash — Kairo Combat V1 Choreography Blueprint
**Status:** DESIGN / NOT IMPLEMENTED. Planned as a preview-gated revision after character direction.
**Depends on:** [Character Bible](CHARACTER-BIBLE.md), existing `src/60-combat.js`, `src/70-input.js`, recorded combat sources and [animation ownership contract](ANIMATION-OWNERSHIP-CONTRACT.md).
**Priority:** A compelling real martial-arts fighter, not a motionless punching particle cannon.

## 1. What already exists

Do **not** throw away the functioning fight to invent a disconnected combat engine.

- `src/05-character-registry.js` registers Kairo's Storm Fist, Aether Shot, Aether Breaker, Storm Step, and Stormheart.
- `src/60-combat.js` gives Kairo a **four-stage melee chain** (with stages 0..3), distinct contact delays/animation durations, hit volumes, block/parry/damage, and hit-confirmed launcher -> Sky Uppercut -> Meteor Kick -> Falling Fist extensions (stages 4..6).
- In the current four-beat ground chain, nominal animation durations are `[.55,.55,.68,.87]` seconds with nominal strike contacts at `[.24,.24,.33,.41]` seconds. Treat these as **current-code baselines**, not approved ideal final timings.
- Rin already has her own palm/elbow/spin/rising chain, at faster timings. **Do not migrate Rin to Kairo timings or VRM retargeting.**
- Inputs already include a mobile Melee button and keyboard J, Blast/charge, block/parry, dash, vanish, awakening and movement. Users should not need to learn six new combat buttons.
- `assets/animations/gameplay/v87-recorded-combat.json` holds recorded Kairo punch, hook, elbow and kick motion slots from an existing baked animation library. Inspect clip compatibility and real VRM retargeting before creating new arm writers.
- V100 currently owns selected Kairo jump/fall/landing/flight final poses and explicitly **yields** for attack and guard; V81 and older animation routes handle combat. **A new attack system must have a single explicit, tested final pose owner** and avoid a new `Fighter.animate` wrapper / competing VRM bone writes.

## 2. Desired visible chain: Storm Fist

The movements below are an artistic specification for a *new* combat preview, not a claim that these exact animations already play.

| Beat | Movement | Whole-body requirement | Contact result | Feel |
|---|---|---|---|---|
| 1 · Lead jab | Compact fast lead-hand jab | Guard hand protects jaw; planted foot rolls inward; shoulder reaches and recoils | Light hit; holds opponent near | Snappy, crisp |
| 2 · Rear straight | Weight-transfer cross | Back heel pivots, hip follows hand, opposite elbow guards | Medium hit; confirm window | Sharp acceleration |
| 3 · Turning hook | Tight body hook or overhand alternating by combo cycle | Ribs and waist rotate; shoulder arcs; knees load for next beat | Heavy hit; believable stagger | Dense, rotational |
| 4 · Rising heel kick | Full hip-driven turning kick | Support foot pivots, knee chambers, heel reaches actual hit space, arms counterbalance | Clear launcher **only on actual hit** | Explosive finish |
| 5 · Sky Uppercut | Fast pursuit strike to an airborne foe | Full leg and torso propulsion; fist rises **through** visible contact | Keeps foe suspended, optional new confirm | Vertical acceleration |
| 6 · Meteor Kick | Reposition then decisive downward aerial kick | Torso rotates, leg extends, unused arm balances | Spike to ground if contact | Heavy downward impact |
| 7 · Falling Fist | Timed, manual ground follow-up | Falling motion driven by gameplay movement; fist braces, opposite arm stabilises | Crater only when the final follow-up connects | Climactic punctuation |

**Movement continuity:** Every beat starts from *the last visible posture*, not a snap to a generic hover/guard/T-pose. Knees, planted feet, torso rotation, wrists and follow-through must be coherent. Kicks are not just a thigh rotation while the torso and pelvis remain still. Hit sound/effect and target reaction coincide with real heel/fist contact.

## 3. Desired gameplay flow

### Initial release: one accessible combo
`tap Melee ×4` -> four distinct attacks -> **actual hit** on beat 4 launches -> **tap Melee in the open follow-up window** -> Sky Uppercut -> deliberate later taps -> Meteor Kick -> Falling Fist.

The full sequence is **not** an automatic cinematic. Player input confirms each extension. Misses and blocked hits cannot launch or unlock the free chase. Attack animations must stay readable even when the opponent dodges or moves out of range.

### Future branches (not prerequisite for V1)
- A deliberate **Melee hold** late in a confirmed chain could trade speed for a guard-crushing body blow. Add only after testing how hold/tap coexist on mobile.
- Timed Melee after a successful parry could trigger a character-specific counter chain, with unmistakable but punishable recovery.
- Directional stick with a hit confirm might request an upward or lateral launcher, but do not make subtle joystick micro-adjustments accidentally change attacks.
- Stormheart might alter the finisher visuals/cancel opportunities; **not** infinite uninterruptible damage.

### Defensive rules
- If the opponent blocks, a heavy strike must show guarded hit reactions; ordinary contacts do not silently become launches.
- A whiff cannot magnetically move Kairo to hit targets outside the volumetric attack check. Existing limited follow-stepping can remain.
- Opponent parries/vanishes interrupt where intended. Hitstun does not allow infinite loops.
- Both players and Rival AI must use the same true hit/guard/launch rules.
- Preserve real collision and spatial framing: no root teleports to hide awkward animations.

## 4. Authoring plan — tackle one pose state at a time

**Stage A: audit and capture**
1. Inspect live Kairo combat in WebGL, not just source pose values. Front / side / rear for a four-beat combo, plus the full airborne route.
2. Measure on real Kairo VRM0: strike hand and heel path, hip-to-chest rotation, foot plant, wrist flip, contact-vs-fx timing, reach vs hitbox and visual pose jumps.
3. Verify V87 recorded source clips and choose if existing punch/kick data is viable. The data may be technically present without matching the target visible animation.

**Stage B: first proper impact**
4. Behind independent `?combatPreview=kairo-v1` (conceptual proposed flag), author **only Kairo beat 1** with lead-hand extension/recoil, stance weight transfer and protected offhand.
5. Require seamless transition idle / walking / hover -> jab -> existing neutral state. Combat priority wins while actual attack is active; when it ends, previous movement owner returns gracefully.
6. Match the contact timestamp to the exact visible VRM fist path and actual collision success, without touching impact outcomes or creating ghost hits.

**Stage C: full four-hit chain**
7. Add beat 2, beat 3 and beat 4 separately, each with shared visual continuity and no sudden reset of torso/feet.
8. If timing must change, update input buffering, hit volumes and active frames together. Never speed up the VRM pose alone while keeping contact delayed at the wrong beat.
9. Real Kairo three-view and moving-target gameplay QA after each beat.

**Stage D: launch, pursuit and branching**
10. Make launch and chase visually distinct while keeping current manual confirm windows, fall/down states and recoveries.
11. Only after the four-beat base wins visual approval: prototype one branch; keep a simple mobile input vocabulary.
12. Rin gets her own independently controlled combat style in a separate feature flag afterward.

## 5. Animation ownership architecture

- Do not add another `Fighter.animate` wrapper, standalone VRM bone writer or competing late-frame correction.
- Prefer a **data-driven attack intent/performance descriptor** (attack ID, beat, phase, contact frame, facing, foot support, animation clip) feeding the existing combat animation adapter or a clearly extended unified single owner.
- Separate simulation results (damage, knockback, hit detection, contact delay, stamina) from visual retargeting.
- Attack transitions: neutral/locomotion -> attack anticipation -> contact -> recoil/follow-through -> locomotion, with correct priority against hitstun, guard, jump and flight. V100 yields in combat today; ownership changes require explicit yield tests and a visual A/B.
- Keep approved V97 ground, V125 jump, V152 hover/V153 hard forward flight, Rin combat, Boost and AI baseline identical when preview is OFF.

## 6. V1 acceptance checklist (do not declare victory from unit tests)

- Kairo performs **four visibly different whole-body martial arts strikes**; beat 1 is not the same generic punch as beat 2; beat 4 has a real spinning/turning kick silhouette.
- On landed strikes, contact VFX, hit reaction and sound occur at the **visible fist/heel contact instant**. Blocked/whiffed hits do not launch, chase or spawn falsely located impact bursts.
- From ground and low-hover, strike entry and release do not expose a rest pose, inverted wrist, glued shoe or abrupt rotation.
- 30, 60 and 120 fps input buffering/animation transitions behave consistently. Rapid taps don't generate a double hit or restart stage 0 incorrectly.
- Lock-on vs free camera, moving opponent, stationary dummy, airborne opponent, blocked opponent and touch inputs all work.
- The air sequence can be pursued by **intentional player action**, stopped via counterplay, and never traps either fighter in an endless juggle.
- Kairo attack work causes **zero baseline change** to Rin, approved idle/walk/run, V125 jump, V152/V153 flight and Boost when the flag is OFF.
- Produce real three-view VRM stills, front/side videos, measurement summaries and user review before promoting to default.

## 7. First concrete implementation slice

**Kairo Storm Fist V1a: single proper lead jab** is the minimum lovable test:
- controlled preview flag on Kairo only;
- authoritative one-clip pose sequence: guarded windup -> shoulder/hip drive -> readable straight line to opponent -> elastic recovery;
- grounded and airborne attack entry supported without changing physics;
- real WebGL video against the present Kairo first punch;
- inspect the whole body and actual fist contact rather than only local joint rotations;
- all existing core combat and movement rollbacks unchanged.

The first code change should address this tiny validated slice, not remodel every fighter and all of combat at once.
