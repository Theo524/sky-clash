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
5. The game shows **Kairo: N local moves active**. Test the controls.
   Use Edit moves to revise, or Original game for the default.

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
- The existing V72 runtime supports these 15 Kairo slots: idle, walk,
  run, jump, runStop, dodge, punch1, punch2, punch3, uppercut, kick,
  meteor, charge, superblast, hit. Editor-only idle3/4/5 etc are
  skipped for live Kairo and reported to the user.
- The existing combat state machine chooses moves; assigning punch1
  does not create new input buttons, hitboxes, range or hit timings.
  In local playtest only, an assigned Uppercut or Meteor takes priority
  over the generic punch3/kick fallback on the corresponding follow-up.
  A local motion plays when its corresponding V72 gameplay state occurs.
- Local grounded Kairo punches (punch1/2/3 and uppercut) now apply
  recorded hips and both legs in sync with arms. The existing V72
  two-bone support-foot correction anchors soles before each strike.
  Hitboxes, input, physics, native and public default combat do not change.
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
