/* V165 opt-in: one coherent burst-speed and strike-rhythm profile.
 * Animations remain owned by existing V72/V100. No new bone writers.
 * Enable only with ?combatFeel=v165; default release is unchanged.
 */
const AnimeFeelV165 = Object.freeze({
  enabled:typeof window!=='undefined'&&
    new URLSearchParams(window.location?.search||'').get('combatFeel')==='v165',
  boostSpeedScale:1.24,
  boostTurnScale:1.38,
  // Different strike tempo per beat, but no auto-combo or hitbox reach changes.
  tempo:stage=>[.82,.84,.89,.94][Math.max(0,Math.min(3,stage))]||1,
  hitStop:(heavy,kind)=>heavy?.085:kind==='melee'?.043:.035
});
