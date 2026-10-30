# Kairo Animation Base v1 — protected game-ready snapshot

## Why this exists

A previous Studio playtest appeared to revert to old Mixamo punches when
the URL omitted `studioPlaytest=local`. Another old published overhand
could replace a locally assigned punch3, and kicks had no repeat-attack
transition lifecycle. These are selection and ownership failures; newer
animation experiments must not silently overwrite known-good work.

**Base v1 is an explicit, protected user snapshot**, separate from the
temporary working preview. It stores the **real baked motion clip data**
(20-bone quaternion tracks), not just file names or hand-made replacement
keyframes, in browser-local IndexedDB.

## Use it

1. Open Animation Studio in the browser where your Mixamo clips are saved.
   Apply your current assignments and confirm they look good in Training.
2. Return to Studio and click **★ Save current as Base v1**.
   This saves the last *successfully applied* clips, not pending edits.
3. Experiment with new assignments and **Apply to Game & Play**.
   Those working changes never overwrite Base v1.
4. If a preview regresses, click **↺ Restore Base v1**. This restores
   the exact baked clips to the local game and opens Training.
5. Click **↓ Download Base** to keep an independent JSON backup.
   **↑ Import Base Backup** restores this protected snapshot after
   changing browser/device or clearing site storage. Click Restore Base
   after importing to activate it.

Save Base asks before overwriting an existing base; Restore asks before
replacing the working playtest. Reset local moves clears only the
working preview, not the base. These operations do not change Studio
action-map assignments or publish anything to GitHub Pages. The downloaded
JSON contains actual baked rotations; it must be stored privately if the
user does not wish to publish their authored animations.

## Strict precedence

- **Explicit local Studio preview** (`?studioPlaytest=local`):
  the valid applied clip wins for its exact action slot. Legacy
  published Mixamo alternatives and experimental native packs cannot
  displace it. Unassigned slots continue to use existing shipped assets.
- **Normal public game** (without the flag): the approved shipped game
  remains unchanged; browser-local motions and Base v1 are never read.
- **Protected Base v1**: not enabled by a URL flag alone. The user must
  click Restore Base; only then is it the working playtest source.
- The flight-body experiment still requires `&flightBody=alive`;
  use both flags when comparing flight and applied punches.

The baseline is a **saved motion snapshot**, not an automatic record of
"best" or a newly approved public release. A base saved while an
animation is bad will faithfully restore that bad version; save after
you visually approve the motion. No backend is used.

## Repeated kicks

Every locally assigned Kairo kick now has a unique
`attackSerial:kick` transition key, a short handoff from the actually
visible previous 20-bone pose, and a fresh contact state. If the baked
FBX includes sole-contact data, only genuine supporting feet are pinned.
Old motion-pack JSON without contact data keeps the real authored leg
rotations, with no invented two-foot anchor. The corrected 1×
`localKickClock` still aligns the Mixamo leg drive with the existing
gameplay hit time. No new hitboxes, cooldowns or synthetic keyframes.

**Punch 1, Rin, published moves, and the accepted flight stance remain
unchanged** until separately reviewed. Automated regression tests check
several repeated kicks plus save/apply/reset/restore; manual visual
confirmation is still necessary.
