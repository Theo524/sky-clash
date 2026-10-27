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
  hitStop:(heavy,kind)=>heavy?.085:kind==='melee'?.043:.035,
  // Storm Fist uses this existing feel profile, independently of the older
  // flight-speed experiment. An unavailable pack always keeps legacy play.
  stormFist:f=>f?.characterId==='kairo_venn'&&typeof window!=='undefined'&&
    window.SkyClashPublishedActions?.nativeCombatSet?.revision==='storm-fist-v3',
  stormTempo:stage=>[.76,.88,.86,.82][Math.max(0,Math.min(3,stage))],
  stormFollowTempo:phase=>phase===3?.95:.88,
  stormHitStop:(stage,kick,counter)=>counter?.058:
    [ .026,.038,.050,.066,.058,.072,.080 ][Math.max(0,Math.min(6,stage))],
  stormCanLink:f=>AnimeFeelV165.stormFist(f)&&!f.attackAir&&!f.flying&&!f.jumping&&
    (f.attackKind==='punch'||f.attackKind==='hook')&&f.combo>0&&f.punchT>0&&f.attackTotal>0&&
    f.stormHitSerial===f.attackSerial&&!f.kickPend&&
    f.attackElapsed>=f.attackTotal*.78&&f.stun<=0&&!f.launched&&f.hp>0,
  // Integrate the real overlap, so a 26ms stop does not become a full 33ms
  // simulation freeze on a 30Hz screen. Inputs still run on every frame.
  stormStopStep:(real,remaining)=>real-Math.min(real,Math.max(0,remaining))*.92
});
