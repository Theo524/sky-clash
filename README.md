# Sky Clash V42 — Living Energy & Arena Impact

Single-file and modular browser builds for Sky Clash. V42 builds on V41, including all prior mechanics.

## V42 changes
- Melee movement follows a short contact-timed step and plants at impact, rather than constantly driving forward.
- Ground punch and aerial strike recorded clips apply to the upper body, leaving the lower-body footwork/air stance in control.
- The aerial fourth combo is a compact driving air strike, not the full-body roundhouse clip. Launch/spike gameplay is unchanged.
- Vanish uses a coloured near-instant blink with brief wisps, not a teleport ring or connecting trail.
- Floor-dash air-pressure ring and trail remain; aerial dash and high-speed flight gain short upper-body speed streaks. Dash recovery stays upright.
- Awakening aura contours the character's body with low alpha and per-fighter tint; less of a bubble.
- Small blast visuals are preserved. Charged projectiles add an elongated plasma core, fins and stronger impact lighting without large rings.
- The circular ground shadow fades out completely when sufficiently high above the floor.

### New in V42
- Replaced the aura shell with animated bone-anchored energy highlights and wisps, recoloured per fighter.
- Replaced straight awakening lines with burst light, dust, and ground fractures.
- Ground charging fractures the stage visually and lifts small pieces of debris; no terrain collision changes.
- Added a grounded VRM ankle/toe/knee contact correction after retargeted animation to reduce ground penetration.
- Added two retargeted Quaternius UAL2 dash clips for lateral evasions (legs only, no weapon arm poses), plus the ninja aerial idle clip for gentle hovering.
- Reduced recoil overlean after Boost and anchored flight/dash ribbons to character joints.
- Fully charged hits now trigger a dedicated, recorded knockback pose and airborne recoil, plus a softer plasma/smoke explosion. The normal blast is unchanged.
- Perf: the new effects respect the existing quality setting and despawn automatically.

## Publishing
Upload **all contents** of this directory to the root of your GitHub Pages repository, or use the separately provided **V42 Update Only ZIP**, which contains the replacement `index.html` and `js/game.js` for an existing V38+ folder site.

The `src/` modules are editable. Run `python tools/build.py` after editing source to regenerate `js/game.js`. Launch `index.html` through an HTTP server or GitHub Pages for the modular build, or use the standalone HTML file for local playback.

## Validation
`node --check js/game.js`, `node tests/smoke.js`, and `node tests/combat-effects.js`.
Geometry and JavaScript checks are not a substitute for GPU/mobile animation tests.
