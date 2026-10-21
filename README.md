# Sky Clash V50 — Kairo Venn / Compact Dojo

First character-profile milestone and a mobile training-interface fix, based on V47.

**Character 001 — Kairo Venn, the Storm Fist** is a hybrid martial artist and energy warrior. He can still fly, boost through the air, use Vanish, charge an Aether Breaker energy attack and trigger Stormheart Awakening. His personal training space is Windstone Dojo. Current character art/model assets are a temporary stand-in until a custom Kairo model is created.

## In this update
- `src/05-character-registry.js` introduces the first data-driven character record: stable ID, profile, mobility flags, resource slots, move identifiers, and training-room metadata.
- Main-menu and HUD labels use Kairo's identity.
- Dojo controls are collapsed behind a small button by default. The popover appears on demand and closes on partner selection, reset, outside tap or Escape, minimizing obstruction on small mobile screens.
- Kairo's blast charging causes a subtle, smoothly graded camera rumble, not random strong shake.
- All V47 combat/stamina/dojo functionality is preserved.

## Architecture boundary
The registry supplies **definitions**, but the current attack controller still implements Kairo's attacks. Adding an archer or ninja requires new motion/ability implementations and appropriate art; merely adding their names to the registry will not provide their abilities. Their move slots will share control semantics while using different attack handlers in a future iteration.

## Open world
A future optional exploration mode is planned in concept only; **no open world is included** in V50. Separate combat stages and character-specific dojos remain intact.

## Release process
Upload the extracted contents of the update ZIP to the repository root, preserving `js/`, `css/`, and `src/` paths, notably replacing `js/game.js`. Full-project ZIP is also provided.


## V50 — Sky Combo

Press **Melee** four times to complete Kairo's jab → cross → hook → rising-kick launcher. After the launcher **hits** an opponent, press **Melee** again within the follow-up window for a physical rising **Sky Uppercut**. If that uppercut connects, another **Melee** triggers the diving **Meteor Kick**, slamming the opponent down. The move requires proximity and height alignment; a missed launch does not unlock a chase. The Melee button displays the available follow-up.

The new fight motion uses the existing CC0 Quaternius jump and kick leg clips, with hand-crafted uppercut and kick arm poses. Presses after the launch must be new inputs. The regular four-beat chain and dojo targets remain intact.
