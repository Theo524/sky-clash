# V79 — Mixamo Collection, GIF Preview and Specific Gameplay Actions

## Four user-supplied ZIP archives — 230 unique animations

The four valid uploaded archives contain the following **source FBX clips**:

| Pack | Entries | Top-level directories |
| --- | ---: | --- |
| Movement & Acrobatics | 69 | `Movement/`, `Acrobatics/` |
| Ninja, Kicks & Capoeira | 65 | `Ninja/`, `Kicks/`, `Capoeira/` |
| Magic | 56 | `Magic/` |
| Boxing | 40 | `Boxing/` |
| **Total** | **230** | |

The Studio's count reflects **files currently imported in this browser**, not how many exist in the collection. If it says 69, it has the Movement pack but still needs the other three. Multiple ZIPs may be selected together with **Import missing packs**; originals are preserved in IndexedDB by V69 where browser storage permits. Browser cache may be evicted; back up originals separately. A ChatGPT upload is not automatically available in the separate website sandbox.

Imported motion thumbnails are rendered as actual 8-frame looping webp animation sequences. V79 also adds **Save preview GIF** in the clip inspector: export an animated `.gif` from the real decoded FBX preview frames, on demand without requiring web uploads. Thumbnails are generated lazily per visible page to prevent hundreds of simultaneous WebGL parses and crashes. The 230-source collection **does not** automatically mean all 230 have been independently visual-tested on the VRM.

## Game: joystick, flying, jumping

Two separate animation controllers previously abandoned their last grounded pose instantly on jump/fly. V79 treats `jumping` as airborne, allows the user-published idle to fade into controlled flight, and also blends V76's recorded arm pose into the procedural airborne pose over several frames. Punches, blocks, stuns, knockdowns and acrobatics retain priority and cancel pose blending immediately. V77's chosen `idle (2).fbx` and V71/V75 walking assets are not changed.

## Specific action pack (optional until published)

The seven fully baked recordings from the user's Movement ZIP are available as an independent `extra-actions-v1.json` gameplay pack:

| Action slot | Original FBX | Selection rule |
| --- | --- | --- |
| `runStop` | `Movement/Adventure/run to stop.fbx` | On a sudden ground deceleration after running; cancel on movement/attacks |
| `idle3` | `Movement/Adventure/idle (3).fbx` | Long grounded idle gesture |
| `idle4` | `Movement/Adventure/idle (4).fbx` | Another long grounded idle gesture |
| `idle5` | `Movement/Adventure/idle (5).fbx` | Another long grounded idle gesture |
| `idleAdventure` | `Movement/Adventure/idle - Adventure.fbx` | Another long grounded idle gesture |
| `fallingIdle` | `Movement/Adventure/falling idle.fbx` | Loop while descending after a jump, not stationary flight |
| `fallToRoll` | `Movement/Adventure/falling to roll.fbx` | Landing following actual downward fall; interruptible |

The looping idle is still V77 `idle (2)`; long-idle gestures are occasional one-shots after approximately **12–26 seconds of uninterrupted neutral standing**. Fighting, movement, blocking, jump/fly interrupt idle gestures. The state machine is intentionally conservative about changing physics: there is no artificial avatar root displacement or gameplay collision modification.

**Publishing action pack:** Upload the baked compact motion JSON to `assets/animations/gameplay/extra-actions-v1.json` in the repository. The game checks for that path at startup, validates motion keyframes with the existing V72 published-motion decoder, and attaches the state triggers automatically. If the pack isn't published, V79 adds **no blank animations** and leaves V77 idle/V76 walking/flight working unchanged. The optional action pack contains quantized quaternion samples, not source FBX geometry, textures or extracted FBX files. To disable extra game actions for comparison, use `?extraActions=off`.

This does not yet add every animation as a gameplay move, nor map all complex combat attacks to specific states; no action is claimed to be verified beyond its actual event handler. More complex motions require animation masks, timed hitboxes, air/ground permissions and manually checked gameplay conditions.

## Animation source conversion verification

The bespoke FBX bake script read the actual uploaded Binary FBX 7700 files at 30 FPS. For `Movement/Adventure/idle (2).fbx` it generated 301 frames and was compared to the user's independent Animation Studio export: each of the 20 humanoid joints differed by roughly 0–1.1° (quantization/rounding), supporting consistent source-space world-rest deltas.

## Next

Once the pack is committed and GitHub Pages deploys, visually inspect run→stop, 20-second idle and jump→fall→roll. GIF previews in the browser can help vet other motions, but the game must test each move and its timing against hitbox/physics state before expanding beyond the seven mapped animations.
