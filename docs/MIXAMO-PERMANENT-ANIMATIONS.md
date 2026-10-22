# Sky Clash: Saving and Shipping Mixamo Motion (V70)

## What is saved now

- **V69 library:** original FBX/ZIP files are saved in the current browser's IndexedDB, up to 400 MiB when the browser allows it. This is a convenience cache, not permanent game content. Clearing site storage, using another browser, or a quota eviction can remove it.
- **Action Editor:** named action assignments and speed/yaw tuning are stored separately under the browser-local `skyClashV58ActionAssignments` localStorage key. The **Export action map JSON** button backs up these choices, not the FBX/ZIP contents.
- **V70 import repair:** optional append-only newline at end of some FBX binary files is removed **only in memory** before the FBXLoader. Original uploads and IndexedDB copies are untouched.

## How to make a move permanent for every player

1. Choose one real, working action clip (for example, `walk`), import it into Animation Studio, preview it on Kairo, tune its motion and assign it to a slot.
2. Export and keep the action map JSON.
3. In the game's content pipeline, **convert** the selected source motion to a compact animation resource, with stable identifiers, sample rate, source clip name, and retarget/rest-pose metadata. Don't ship raw FBX downloads from the public repository.
4. Check a future build into the `Sky Clash` GitHub repo and wire the action into the game's running `Fighter` controller/animation state transitions. This is a separate development step; Studio assignments **do not yet alter gameplay**.
5. Test idle -> walk -> run -> stop, punching and jumping, feet contact, shoulder/elbow bend and both directions at varying movement speeds.
6. Tag releases and keep an original FBX/ZIP **privately** as the upstream source, so later tuning or replacement can be rebuilt.

## Editing later

Animation clips and maps can be revised, replaced or versioned without changing the underlying VRM. Versioned manifests (for example, action IDs `kairo.walk` and `kairo.punch`) should reference optimized motions, with clip-specific speed, masking, blend times, and retarget parameters. Preserve older manifests as rollback options and verify clip compatibility after upgrading Three.js.

## License and distribution

Adobe's Mixamo FAQ permits royalty-free use in video games, but its community licensing guidance cautions against distributing raw character or animation source files to users outside the team. Incorporate optimized motion data into the running game without publishing a downloadable ZIP or standalone raw-FBX animation pack. Consult Adobe's current Terms for the project's distribution method.

Official: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html

Community distribution guidance: https://community.adobe.com/questions-696/mixamo-faq-licensing-royalties-ownership-eula-and-tos-589400

## Uploaded source diagnostics (Oct 22, 2026)

The four user-supplied Mixamo ZIPs contain exactly **230 FBX Binary 7700** clips. **28** include a spurious LF byte after the valid 16-byte FBX footer, which triggers Three.js FBXLoader's old 176-byte footer detection. V70 normalizes this extra byte for preview; all original files remain unchanged. Full on-character preview behaviour for every clip still requires browser/WebGL confirmation.
