# Sky Clash V47 · Dojo Hub

## Main menu / loading
A dedicated startup loading screen reports model preparation. The menu opens after models finish or after a 12-second safe fallback, so slow model loading cannot trap the user. The menu offers **Enter the Dojo**, **Enter Battle**, and **Settings**.

## Character home: Martial Dojo
A separate, indoor cedar-and-tatami training hall replaces the outdoor tournament arena while in dojo mode. Practice alone against **two swinging heavy bags, a wing-chun wooden dummy, and two projectile targets**. Land punches or energy shots to make equipment react and add to a visible hit counter. Use the dojo selection control to summon a stationary, moving, or sparring partner; solo mode hides them. Restart resets the dojo, Pause offers direct return to the main menu.

## Future character homes
The `src/25-dojo.js` module owns equipment and training collision, not the fighter mesh. It can be replaced by character-specific spaces (e.g. firearm target range) without rebuilding matchmaking, menus or the main arena.

## Install
Extract the V47 GitHub Update ZIP into your repository root while preserving folder structure. In particular overwrite `index.html`, `css/game.css`, `js/game.js`, and upload `src/25-dojo.js` plus the changed source modules. GitHub Pages displays V47 only after deployment.

# Sky Clash V47 — Awakening Unleashed

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


## V47 — Combat Flow & Stamina

- Separate 100-point **stamina bar**: sprinting consumes 16.5 points per second on the floor and 22 in the air, dash costs 17, Vanish 14. Stamina cannot be refilled by dojo KI bonuses. When exhausted, boost locks until stamina is back above 28.
- Stamina recovers after a brief rest; walking and guarding do not require stamina. KI is still used by special abilities.
- Five newly retargeted Quaternius Standard CC0 recordings: idle, crouch idle, crouch locomotion, airborne loop and overhand throw (reserved for high-charge blast release). These blend over the procedural rig and existing locomotion clips.
- More stable aerial speed/turn posture, reduced exaggerated run lean, smoother landing/stop recovery and less noisy idle hover.
- The third combo beat now alternates an animated hook and a short overhand, instead of repeating the exact same 4-hit choreography forever. The sparring AI now occasionally retreats to regain stamina.
- Continue the V46 dojo, loading screen, match, Awakening and defensive Vanish systems.

**Performance note:** CSS and motions are lightweight. These are authored blending improvements, not a full motion-matching database or realistic foot IK. The lower-leg/ground-contact system remains a bounded corrective, and visual device testing is necessary.
