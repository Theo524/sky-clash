# SKY CLASH — Character Bible v1
**Status:** Creative direction agreed (26 October 2026); candidate roster, not six released characters.
**Game:** Original third-person 3D anime arena fighter, mobile-friendly controls, grounded and aerial combat.
**North star:** The kinetic aerial martial arts of classic anime fighters + the sheer *variety* of strikingly different heroes, monsters, machines, and eccentrics seen in ensemble superhero fiction. Original IP only; no copied characters, costumes, identities, move names or licensed animation.

## 1. What is Sky Clash?

Sky Clash is a fighting-game universe, **not a TV series**. Players should instantly recognise a fighter by their pose, motion, attack sounds, weaknesses and temperament — before seeing their name. Serious bouts, devastating attacks, and dramatic choreography are the priority; personality and occasional visual irony can coexist without forced jokes or comedy cutscenes.

### Creative rules
1. **Martial arts first.** Range, timing, body mechanics, counterplay, footwork, momentum, impact and distinct hit reactions should matter. Energy and magic amplify the physical fight, not replace it.
2. **Variety without randomness.** Characters may be elite human martial artists, supernatural beings, giants, engineered fighters or totally unexpected ordinary people. There is no requirement that every fighter belong to a single alien race or use ki.
3. **One shared, learnable input vocabulary.** Melee, movement, guard/parry, mobility, ranged/special, and awakening should be easy to grasp on touch and keyboard, while timing/context give depth. Distinct movesets must not turn the mobile UI into a keyboard.
4. **Viable counterplay.** Heavy hitters have commitment, speedy fighters trade damage for risk, ranged controllers can be pressured, and unusual matchups have deliberate ways to engage. Nobody wins just because the lore says they are a god.
5. **Combat motion authored per character.** Animation silhouettes, windups, recovery, hit reactions, VFX and personality are not merely reused Kairo poses with recoloured particles.
6. **No mandatory jokes.** The humorous/odd fighter should remain a credible, mechanically serious opponent. Contrasts in attitude or appearance provide personality.
7. **Ground and sky matter.** Some fighters sustain flight, others leap, wall-bounce, dash, vanish, grapple, hover via powers or intercept flyers. Vertical-play accessibility must be fair without granting everyone identical mobility.
8. **No accidental changes to shipped movement.** New combat and character systems should be preview-gated and independently reversible until player visual approval.

### Light-touch world premise (working idea, not canon)
A world where martial discipline, inherited abilities, scientific augmentation and unexplained phenomena exist side-by-side. A competitive fighting circuit and its dangerous challengers pull radically different people together. Avoid committing to cosmic lore, divine power rankings or a sprawling storyline before the fights are fun.

## 2. Starting roster — two existing, four proposals

The names of Kairo and Rin and their core moves come from the live `src/05-character-registry.js`. The remaining characters, backstories and ability names here are *design proposals*, not code or asset commitments.

### Kairo Venn — The Storm Fist
**Status:** EXISTING, playable | **Combat lane:** balanced pressure / traditional martial artist / aerial chase

- **Read-at-a-glance:** Determined, athletic unarmed striker. Compact guard; purposeful pivots; punches travel from hips and shoulders; legs kick with weight. Charged energy gathers at the hands.
- **Signature movement:** Free powered flight, boost, vanish, responsive midair reorientation; existing calmer V152 hover and V153 streamlined forward flight are important movement baselines.
- **Fighting inspirations (techniques, not characters):** Boxing straights/hooks, karate-like pivots, spinning roundhouse/heel kicks, airborne striking and blast-infused finishers.
- **Signature moves (registered):** Storm Fist melee, Aether Shot, charged Aether Breaker, Storm Step mobility, Stormheart awakening.
- **Primary strengths:** Natural launch-and-chase routes; tools at most distances; excellent fundamentals and learnability.
- **Trade-offs:** Predictable midrange rhythm if repeated; high-commitment kicks can be countered; less extreme than specialists.
- **Design personality:** Intense and ambitious rather than constantly angry. Victory should feel earned by technique.
- **First combo objective:** A full-body four-beat authored chain, with hit-confirmed launch and manual air follow-up; see `docs/KAIRO-COMBAT-V1.md`.

### Rin Sable — The Shade Runner
**Status:** EXISTING, playable | **Combat lane:** agile rushdown / ninja / evasive bait-and-punish

- **Read-at-a-glance:** Low centre of gravity, precise steps, hand feints, sudden angle changes; she slips rather than trades heavy blows.
- **Signature movement:** Shadow Step/vanish, fast boost, double jump. **The current registry does not grant continuous flight.** Future aerial access must be balanced using leap, step and intercept mechanics, not a stealth flight toggle.
- **Fighting vocabulary:** Palm, elbow, turning heel kick, rising ninja kick; separate existing four-beat Shade Chain.
- **Signature moves (registered):** Shuriken, Shadow Volley, Shadow Step, Nightveil awakening.
- **Primary strengths:** Fast whiff punishment, side-switch, escape pressure, rapid close-range strings.
- **Trade-offs:** Lower single-hit impact, weaker when cornered/read, vulnerable on a committed dodge.
- **Design personality:** Reserved and observant. Her skill is visibly deliberate, not chaotic.
- **Rule:** Preserve her current ninja motion and melee implementation while authoring Kairo combat; do not make her a recoloured Kairo combo.

### Dagan Voss — The Living Fortress
**Status:** PROPOSED | **Combat lane:** power grappler / armoured close-range bruiser

- **Read-at-a-glance:** Broad shoulders, blocky silhouette, heavy footsteps, enormous weight and deliberate grabs. Surprisingly considerate when not fighting.
- **Origin direction:** Stone-skinned or exceptionally dense humanoid; source of strength to be determined.
- **Fighting vocabulary:** Wrestling clinches, throws, elbows, knee strikes, planted hooks, ground-shaking impacts.
- **Proposed signature:** **Faultline Grip** — punish unsafe attacks with a committed grab and positional throw.
- **Strengths:** High burst damage when close, armour on *select* telegraphed strikes, wall and ground pressure.
- **Trade-offs:** Limited pursuit and ranged answers, susceptible to baited grabs and lateral evasion, large recovery windows.
- **Mobility solution:** Short rocket-like leaps or shockwave leaps; not a graceful long-distance flyer.
- **Personality:** Gentle outside the ring, terrifying only through the sheer physicality of his hits.

### Veyra — The Gravity Witch
**Status:** PROPOSED | **Combat lane:** telekinetic controller / high-skill positional fighter

- **Read-at-a-glance:** Floats almost silently, minimal windup in her limbs, orbiting geometric debris/energy, expressive hands and eyes.
- **Origin direction:** Rare anomaly or gravity technique practitioner — not automatically a goddess.
- **Fighting vocabulary:** Pull and push vectors, floating debris, brief space-control zones, close-range open-palm redirects.
- **Proposed signature:** **Vector Turn** — catches an incoming rush and redirects its trajectory on correct timing.
- **Strengths:** Controls vertical space, interrupts predictable approaches, forces tactical routing.
- **Trade-offs:** Low health/guard endurance, significant commitment/resource costs, cannot endlessly hold opponents helpless.
- **Mobility solution:** Levitation plus short directional bursts; not Kairo's same flight physics with green VFX.
- **Personality:** Confident, cool, slightly unsettling, not a generic villain.

### Rook-09 — The Broken Weapon
**Status:** PROPOSED | **Combat lane:** cybernetic stance-switch bruiser / technical burst

- **Read-at-a-glance:** Asymmetric engineered limbs, visible mechanical recoil, heat and piston exhaust, precise unnatural acceleration.
- **Origin direction:** Former purpose-built combat machine learning to fight on personal terms.
- **Fighting vocabulary:** Piston jabs, mechanical elbow, charged hammer blow, rocket heel, defensive chassis shifts.
- **Proposed signature:** **Overdrive Cycle** — brief overclock increases reach and speed, but overheats and exposes a cooling recovery.
- **Strengths:** Short explosive strings, armoured anti-air, unique mechanical impact feedback.
- **Trade-offs:** Overheat punishment, strong but readable startup poses, less organic evasive recovery.
- **Mobility solution:** Thrusters for short-lived flight and dashes, dependent on heat reserve.
- **Personality:** Takes situations literally; the humour is in contrast with his dangerous ability, not silly combat.

### Mop — The Unlikely Hero
**Status:** PROPOSED, playful working name | **Combat lane:** deceptive technical staff / counters / spacing

- **Read-at-a-glance:** Ordinary-looking maintenance worker and unremarkable clothes; unusual calm while carrying a long cleaning implement.
- **Origin direction:** Ordinary human, astonishing training and impeccable spatial judgement. Do not reveal secret godlike origins solely for a punchline.
- **Fighting vocabulary:** Staff redirections, sweeps, joint leverage, trip attacks, almost effortless precision.
- **Proposed signature:** **Clean Sweep** — punish a committed approach with a staff-led balance break and directional knockdown.
- **Strengths:** Midrange spacing, parries, exploiting enemy recovery, disorienting timing.
- **Trade-offs:** Lower burst than brawlers, vulnerable to ranged zoning when caught without cover, requires reads.
- **Mobility solution:** Ground acrobatics, vaults, leaps and staff-assisted aerial intercepts; not universal ki flight.
- **Personality:** Appears ordinary and talks plainly; mechanically a formidable, serious fighter. No forced joke finishers.

## 3. Contrast matrix — characters must feel different

| Fighter | Range preference | Tempo | Main interaction | Air play | Big weakness |
|---|---|---|---|---|---|
| Kairo | close/mid | rolling pressure | hit-confirm into chase | free powered flight | punishable committed finishers |
| Rin | close | very fast and evasive | side-switch / bait / punish | leap + vanish + intercept | lower raw impact |
| Dagan | point-blank | slow but explosive | grabs / armour / crush | forceful leaps | kiting / whiff recovery |
| Veyra | mid/far | measured and spatial | redirects / pulls / zones | gravity levitation | rushdown under pressure |
| Rook-09 | close/mid | burst + cooldown | overdrive resource | thruster bursts | overheating |
| Mop | mid | calm / reactive | staff counters / sweeps | leaps / vaults | ranged pressure |

Avoid a universal perk stack that erases these weaknesses. Each character still has a basic defence and at least one plausible answer to aerial or long-distance pressure.

## 4. Shared combat grammar: deep but touch-friendly

**Current controls:** Melee (one action), blast/hold-to-charge, guard/parry, dash/boost, vanish, awakening, movement and vertical action. See `src/70-input.js`. Do not add four new attack buttons as a prerequisite.

**Design goal:**
- Tap **Melee** to begin or continue the character-specific four-beat route.
- Real hit contact opens a short, readable **hit-confirm branch**. Whiffs have recovery; block impacts must not fake successful confirms.
- Direction, hold duration or well-timed dash may eventually branch to heavy/launcher/cross-up; each alternative needs mobile thumb testing and an accessible tutorial.
- **Launch** changes vertical combat, then deliberate player input may **chase**. Air juggling has recovery limits and counterplay; nobody is locked in an automatic 30-hit cutscene.
- **Guard**, parry and vanish remain meaningful answers. Successful reads punish repetitive combo flow.
- Special/energy and awakening are powerful route enders/changes, not infinite cancels or guaranteed wins.

**Visual grammar for every strike:** anticipation with hip/foot plant, travel, contact pose, opposing hit reaction, small hitstop, follow-through, recover-to-guard; actual contact must align with impact VFX and sound. Dynamic facing and travelling attacks cannot rotate the skeleton erratically or auto-hit targets outside the real hit volume.

## 5. Character production sequence and acceptance

1. **Kairo combat V1:** implement/film one excellent four-beat ground-to-air martial arts chain with manual follow-up and seamless recovery. Separately compare real Kairo front/side/back WebGL VRM with existing gameplay; preserve all existing noncombat poses.
2. **Rin identity pass:** preserve ninja sprint and four-beat Shade Chain, then independently refine her evasion, elbows, kicks and counter response. Do not reuse Kairo animation without explicit fitting and testing.
3. **One radical contrast fighter:** Dagan (grappler) is a useful first test that the combat architecture supports totally different timing and attacks.
4. **Resource/spacing fighter:** Veyra or Rook-09 tests zoning/overheat systems before committing two more full models.
5. **Mop or another unexpected fighter** comes after the fundamentals, to prove unusual archetypes can be competitive.
6. **Balance pass:** test each pair on stage height, defensive response, camera readability, mobile input bandwidth and clear counterplay.

### Implemented versus proposed: boundaries
- `src/05-character-registry.js` currently exposes **Kairo and Rin only**. This document does not register or spawn the four proposed fighters.
- Existing `src/60-combat.js` already holds distinct Kairo and Rin four-beat chains, contact-delayed melee, launch, air uppercut, meteor kick and falling fist follow-up. This bible specifies an evolution of those mechanics; it does not claim the new cinematic authored animation exists.
- `docs/KAIRO-COMBAT-V1.md` is the implementation and visual acceptance plan.
- No copyright-dependent assets, animations or imitations of named series characters are authorised by this document.

## 6. Still intentionally open

The four new character **names, canonical appearances, origin stories, super move names, character order, power scaling and costumes** are not locked. The desired *diversity and combat readability* are locked as guiding principles. Choose permanent lore after visual concept reviews and playable prototype evidence rather than declaring a final canon early.
