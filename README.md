# Sky Clash V51 — Falling Fist & Rin Sable

**Install:** Unzip `Sky-Clash-V51-GitHub-Update.zip`. Upload its *extracted files* into `Theo524/sky-clash` in their corresponding folders, preserving `src/`, `css/`, `js/` and `tests/`. In particular, replace `js/game.js`, `index.html` and `css/game.css`; do not upload the ZIP as a single file. Commit and wait for GitHub Pages to deploy.

## Kairo Venn — Ground combo finisher

A confirmed launch now allows a manually entered sequence: Jab → Cross → Hook → Rising Kick → Sky Uppercut → Meteor Kick. The enemy's **actual ground collision** creates a temporary crater and unlocks **FALLING FIST**. Press Melee once more within approximately two seconds. The finisher physically pursues a nearby downed enemy and only deals damage on contact. No long-range teleport or automatic final hit. The falling impact and finishing punch each create their own stone chunks, dust, and brief camera reaction. Low graphics quality uses reduced debris.

## Rin Sable — first playable ninja prototype

Choose **Rin Sable, the Shade Runner** on the main menu. Rin has a distinct purple/black masked procedural outfit, ninja stance, a quicker melee tempo, shurikens in place of Kairo's energy blasts, a charged three-shuriken **Shadow Volley**, ground dash and Vanish-like **Shadow Step**, and **double jump instead of sustained flight**. Rin uses stamina and a separate **Nightveil** Awakening definition. The shared training dojo is available, and blast targets accept shurikens. The core attack choreography and transformation system are still shared as an initial playable prototype—Rin does *not* yet have a fully custom imported rig or bespoke ninja animation library.

Kairo retains his detailed VRM fighter and full aerial flight.

## Testing

Source-bundle integrity, JavaScript syntax, all existing regression checks, a new 30/60/120 FPS finisher simulation, ninja projectile/double-jump/exhaustion tests, and direct Three.js avatar/crater geometry and VFX-cleanup checks. Full WebGL scene rendering on a real mobile browser has **not** been verified here. Test locally on your device after publishing.
