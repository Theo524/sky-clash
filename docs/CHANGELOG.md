## V52 — Rin anime avatar styling

Rin now uses a proper fully articulated VRM model with unique ninja clothing colours and bone-attached accessories. Original ninja running pose preserved.

## V51 — Falling Fist & Rin Sable
- Manual ground follow-up unlocked by Meteor Kick's actual ground impact. Includes bounded chase, hit-confirm damage, second crater/debris event, button hint, and knockdown duration.
- Rin Sable ninja added to the character registry, title screen choice, distinctive procedural hood/mask, accelerated melee, physical double jump, no flight, shuriken and charged volley projectiles, violet Nightveil palette.
- New low-graphics particle caps for the meteor-impact effect. Kairo's abilities, VRM assets, dojo and the existing combat remain intact.

## V49 — Moving Combat & Aerial Pursuit
- Attacks track nearby moving opponents through the wind-up, with finite forward/sideways travel and a strict contact frame.
- Aerial punches steer in three dimensions; a grounded fighter can perform a short rising pursuit against reachable airborne foes.
- Volume-based contact accounts for vertical separation without long-range auto-hits.
- No change to controls, stamina, Vanish, Awakening, dojo or normal blast.

# Sky Clash changelog

## V48 — Kairo Venn and Compact Dojo
- Named Character 001 Kairo Venn (hybrid martial artist / energy warrior), retaining flight, Vanish and charged ki attacks.
- Added `src/05-character-registry.js`, the first structured character and move-slot definition.
- Redesigned Dojo tools as a compact, dismissible mobile drawer.
- Added subtly graduated camera tremor when a charged blast builds energy.
- Kept the existing V47 fighting mechanics, training props and movement systems.

## V47 — Combat Flow and Stamina
- Stamina, sprint exhaustion, new HUD.
- 5 CC0 baked animation clips; smoother air blend, recorded guard footwork, idle layers, charged blast release variant.
- Softer sprint/stop lean and flight control; keeps V46 dojo and combat.

# Sky Clash Changelog

## V44 — Highland Arena & Energy Rework
- New visual direction for the existing stage: natural mountain ruins, darker stone paving, more detailed rocks/forest, subtler sunlight/fog. Existing collision bounds maintained.
- New close/standard/far camera option and smooth follow distance; milder camera shake and tiny boost pulse.
- Compact capped charge orb, subtle pressure dust during charge, irregular raised stone plates near full power only, lower shake.
- Bigger *character-anchored* wisps for Awakening with individualized character tint, no aura bubble.
- Recognizable coloured humanoid vanish afterimages at start/end and short energy slash burst.

## V43 — Grounded Combat & Power Charge
- Reduced aggressive ground lift, altered charge orb/energy details and dash recovery.

## V42 — Living Energy & Arena Impact
- Bone-anchored aura, recorded evasive locomotion and aerial idle, floor-contact corrections and super-hit reaction.
- Startup repair fixed VRM animation-crash references.

## V41 — Fluid Combat & Teleport
- Attack contact footwork, air finisher, dash recovery and shadow fading in flight.

## Previous
V40 introduced movement attack blending; V39 added combat effects; V38 modularized Sky Clash.

## V46 — Dojo Hub
- Startup loading splash with progress stages and a 12-second safe model-loading fallback.
- New responsive main menu: Enter Dojo, Enter Battle, Settings.
- Modular martial-arts dojo scene: timber hall, tatami training floor, shoji walls, rafters, equipment racks and training station alcove.
- Five reactive pieces of equipment: two heavy bags, a wooden practice dummy, two projectile targets; punches and blasts score hits.
- Solo by default; summon stationary, moving, or sparring opponents without leaving the dojo.
- Training and battle environments switch cleanly; pause and results can return to the main menu.
- Isolated training room module allows future character-specific practice spaces.
