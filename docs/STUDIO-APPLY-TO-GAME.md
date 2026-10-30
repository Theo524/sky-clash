# One-click Apply to Game — browser-local Kairo moves

## What was missing

Before this feature, assigning FBX motion in Animation Studio changed
only the browser-local editor action map and isolated VRM preview.
Playable Kairo uses a separately published V72 motion pack. "Export for
Game" downloaded baked samples but did not install them, and the
published V87 combat pack could override those punch/kick slots.

## New workflow

1. Open Character Action Editor from Sky Clash.
2. Choose Kairo Venn and import FBX/ZIP source clips.
3. Assign moves to the action slots (Combo Punch 1/2/3, Kick, Uppercut).
4. Click **Apply to Game & Play**. The editor bakes assigned motions,
   saves a playable pack locally in browser IndexedDB, and opens the
   actual game in Training with ?studioPlaytest=local&scene=dojo.
5. The game shows **Kairo: N local moves active**. Expand
   **Inspect loaded Mixamo clips** to verify the actual source FBX
   for every slot, its original length and the saved speed. Test
   individual punches in Training. Use Edit moves to revise, or
   Original game for the published default.

**An exported action-map JSON is only a set of file references**. It is
NOT playable animation data. Import that map, then import the original
Mixamo ZIP/FBX sources before **Apply to Game & Play**. For the user's
16-slot sample map, `fallToRoll`, `idle3` and `idle4` are editor-only,
so at most 13 of those entries are eligible for this local game preview.
If any eligible source is missing or cannot be baked, Studio now reports
the missing names and does NOT silently open Training with old moves.

No manual JSON export, GitHub commit, server account, or upload is
needed for local gameplay playtesting. Loading the normal base game
never reads local moves, even if they were applied earlier. The
public V156 flight, V125 jump, original combat, Rin and original VRM
assets are not altered. Experimental native V3 remains opt-in.

## Details and limits

- Same browser/site origin ONLY. Local moves do not transfer across
  browsers/devices or private sessions; clearing site data removes them.
- Only Kairo is wired into local gameplay. Rin's editor and JSON export
  remain usable but do NOT yet apply into his live fighting controller.
- The Kairo local playtest now supports 21 slots: idle, walk, run, jump,
  runStop, dodge, punch1, punch2, punch3, uppercut, kick, meteor,
  charge, superblast, hit, floating, flying, fallingIdle, landing,
  boost and guard. Editor-only idle variants and fallToRoll are skipped.
  An assigned local jump, fall, landing or flight clip causes V100 to
  yield only for that specific Kairo state; the released animations
  remain in charge of any unassigned air state. Hover uses `floating`;
  powered travel over 3 speed uses `flying`. Physics are unchanged.
- The existing combat state machine chooses moves; assigning punch1
  does not create new input buttons, hitboxes, range or hit timings.
  In local playtest only, an assigned Uppercut or Meteor takes priority
  over the generic punch3/kick fallback on the corresponding follow-up.
  A local motion plays when its corresponding V72 gameplay state occurs.
- **Grounded Kairo punches in both the published V87 game and local
  playtesting** now use authored hip and leg movement alongside the arms.
  Newly applied local Mixamo punches keep source-speed timing around
  their actual arm-strike window: 1× means one source second per gameplay
  second, not compressing a multi-second Boxing clip into ~0.55s. The
  original game owns hit times and cooldowns, so this is a visual
  playback correction, not a combat-balance change.
  New Studio exports include source-foot contact samples. The existing
  two-bone foot correction now releases a moving foot instead of
  locking both shoes to the floor throughout a local stepping punch.
  Older published clips without that metadata retain their prior fallback.
  This is the single grounded punch behavior without an extra legacy
  rollback flag. Hitboxes, input, physics, Rin and native combat remain unchanged.
- Other owners (V81 finger/pose transitions, V100 approved air poses)
  are unchanged. An animation test cannot prove aesthetic acceptance.
- studioActions=off still disables V72. Invalid or absent local data
  triggers visible fallback to the published animations, not a crash.
- Reset local moves clears the local packed actions. Export action map
  JSON and Export for Game remain available for backups and eventual
  manual permanent publication for everyone; local apply does NOT
  publish changes globally.
- Stores compact baked quaternion samples (up to 50 actions, 20 MB).
  Imported FBX/ZIP source files remain in the separate offline library.

## Verification

The PR-scoped workflow runs regression contracts and real
Chromium/WebGL/IndexedDB gameplay tests:
- no local pack → fallback to published animations;
- editor-format baked local punch → actual Kairo V72 punch slot;
- normal URL in SAME browser → published default untouched;
- corrupt local pack → safe fallback;
- preserved animation authority and approved boot default.

Rollback reference: backup/playable-2026-10-30.
