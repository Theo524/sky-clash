# Sky Clash V58 — Character Action Editor

## What this update does

- Adds per-fighter named action slots for idle, walk, run, jump, dodge, combo attacks and powers.
- Imports FBX or ZIPs exactly as the V57 Animation Studio did, without file renaming.
- Drag an animation preview onto a slot, or select a preview and press **Assign** on any empty slot. Drop one loose FBX directly on a slot if desired. Existing assigned slots can be replaced by dropping another preview.
- Press **Preview** on an assigned slot to watch it on an **experimental isolated VRM preview** of the actual fighter. Switch back to **Original animation** to see the trusted Mixamo skeleton.
- Individual speed and facing angle adjustments are stored with action slots.
- Action assignments save automatically in browser localStorage. Export **Action Map JSON** to back them up; import it to restore selections.

## Important limitations

- **The action map is JSON metadata, not a baked or retargeted FBX bundle.** No raw FBX is included in exports.
- FBX files remain in memory for the current browser tab; on a fresh visit reimport your source ZIPs to preview your saved assignments.
- Retargeting previews are experimental and may still exhibit limb/foot artifacts, especially Rin VRM0. The original Mixamo motion is an independent reference.
- Action slots are **sandbox preview only** until a future validated gameplay animation pipeline is finished. Dragging a clip never changes character combat on the live game.
- Loading 15 MB VRM and parsing FBX takes time and an internet connection for the existing FBX ESM loader.
- File content is processed client-side.

## Installation

Builds on V57. Upload files from V58 update ZIP, preserving their paths. Do not delete existing `assets/*.vrm`, `js/game.js`, or vendor libraries. There is no change to combat modules.

## Verification

24 static and gameplay regression suites passed in the package workspace. Browser-based visual verification of retargeting was not possible (local navigation blocked).
