# V165 boost + speed + fighting-feel preview

Use https://theo524.github.io/sky-clash/?combatFeel=v165&flightVertical=v164
to test the *combined* player-selected B/B/B/B Kairo normal flight along
with a coherent opt-in boost-speed and fighting-rhythm experiment.

This prototype is intentionally NOT a claim that it matches Dragon Ball Z
or any particular licensed game's exact animation. It aims for a more
credible original anime arena-fighter feel:
- stronger physical airborne sprint (1.24×), earlier directional response
  (1.38× sprint steering) without affecting walking, ordinary flight,
  Blast physics, stamina drain, hurtboxes, gravity or collision rules
- one narrow directional air-pressure snap at boost ignition and slightly
  longer wrist/arm speed cuts during sustained fast flight
- gentle 5.5-degree top-speed camera FOV expansion, automatically returning
  to normal as boost ends (only when a perspective camera exists)
- faster actual authored combat beat clocks with coordinated contact
  and cooldown timings, stage-specific 0.82/0.84/0.89/0.94 multipliers
- slightly more committed forward attack drive within existing bounded
  pursuit system, stronger confirmed-hit lines, short hit-freeze/haptics

All code changes are guarded behind `?combatFeel=v165`. Default
https://theo524.github.io/sky-clash/ and earlier opt-in V164 remain
unchanged. Does not add second bone writer or replace the original V72
published-action retargeter. Kairo's approved B stance and up/down motions
remain selected by the separate `flightVertical=v164` parameter.

Next: player needs to actually test boost, movement changes, and punch
feeling in this merged opt-in URL, then give targeted feedback. If full
body Boost animations still look weak, next work is to author better
recorded boost and melee assets in the existing V72 timeline, NOT merely
increase numeric effects indefinitely.

## Build verification

The trusted V66 workflow rebuilt `js/game.js` automatically from the sequential source chunks after the initial PR created them. This doc update retriggers independent CI against the built asset; normal/default flight and speed remain exactly as before. The visual design remains player-review pending.
