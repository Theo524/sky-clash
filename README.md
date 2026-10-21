# Sky Clash V45 — Awakening Unleashed

This folder deploys directly to GitHub Pages. **Do not upload the ZIP itself**: extract and preserve folder paths.

## Main changes

- Separate Awakening power meter fills from **successful hits, damage taken and real blocked hits**. It is not the same as blue ki used for blasts and dash. The gold POWER button remains visible with progress; at 100% it becomes AWAKEN!
- Tap AWAKEN! to begin a **2.1 second transformation**, with planted martial pose, escalating character-bound energy and a final release. Powers activate after the charge finishes; the transformation is temporarily invulnerable to avoid interruptions.
- Guard double-tap after **blocking** opens a 0.85s defensive escape window, with reduced ki cost and a behind-the-opponent Vanish. Other double-tap Guard / `V` Vanish remains available at normal cost.
- Vanish's old cartoon silhouette is replaced by **articulated afterimages** constructed from the actual character bones, plus short speed accents in the fighter's personal energy colour.
- Original movement/combat buttons and the latest V44 arena preserved.

## Controls

- Keyboard: `T` awaken when meter is full; `Shift`/`B` double-tap or `V` for Vanish. Touch: POWER to awaken, Guard hold to block and double-tap to vanish.
- In training, hit the rival to build the Awakening meter, then try transforming.

## Build

From this directory run `python tools/build.py` to bundle the sequential `src/*.js` into `js/game.js`.
Check `node --check js/game.js` and `node tests/v45-awakening.js` before publishing.

Model / animation credits remain in index.html. Runtime rendering quality requires Android/browser playtesting.
