/* V48: Character definitions, independent of the shared combat simulation.
 * One fighter is implemented today. Other archetypes will supply their own
 * action handlers and animations rather than inheriting Kairo's blast/flight.
 */
const CharacterRegistry = (() => {
  const characters = Object.freeze({
    kairo_venn: Object.freeze({
      id: 'kairo_venn', name: 'Kairo Venn', epithet: 'The Storm Fist',
      className: 'Hybrid Martial Artist / Energy Warrior', style: 'martial',
      model: 'fighter.vrm', dojo: 'windstone_dojo',
      mobility: Object.freeze({ flight: true, boost: true, vanish: true, doubleJump: false, wallRun: false }),
      resources: Object.freeze({ health: 'health', special: 'ki', stamina: 'stamina', awakening: 'stormheart' }),
      moves: Object.freeze({
        melee: Object.freeze({ id: 'storm_fist', name: 'Storm Fist', type: 'melee_combo', animationSet: 'kairo_unarmed' }),
        ranged: Object.freeze({ id: 'aether_shot', name: 'Aether Shot', type: 'energy_projectile', hold: 'aether_breaker' }),
        charged: Object.freeze({ id: 'aether_breaker', name: 'Aether Breaker', type: 'charge_projectile', input: 'hold_ranged' }),
        mobility: Object.freeze({ id: 'storm_step', name: 'Storm Step', type: 'dash_vanish' }),
        awakening: Object.freeze({ id: 'stormheart', name: 'Stormheart', type: 'transformation', modifies: ['stance','attack_power','aura','movement'] }),
      }),
      training: Object.freeze({ title: 'Windstone Dojo', preferredProps: ['heavy_bag','martial_dummy','ki_target'] }),
    }),
  });
  const defaultId = 'kairo_venn';
  function get(id = defaultId) { return characters[id] || characters[defaultId]; }
  function all() { return Object.values(characters); }
  function can(id, movement) { return !!get(id).mobility[movement]; }
  function move(id, slot) { return get(id).moves[slot] || null; }
  return Object.freeze({ defaultId, get, all, can, move });
})();
