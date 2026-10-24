# Sky Clash — browser-based 3D fighting game

Sky Clash is a playable fighting game with a dojo, battles, character selection, VRM avatars, movement, combos, energy powers, and powered flight. **Current main game build: V115.** The game is deployed as a static website through GitHub Pages.

- **Play:** https://theo524.github.io/sky-clash/
- **Visual animation review:** [qa.html](qa.html) (also at https://theo524.github.io/sky-clash/qa.html once this page is published)
- **Animation Studio:** [animation-studio.html](animation-studio.html)
- **Recent development:** [pull requests](https://github.com/Theo524/sky-clash/pulls?q=is%3Apr)

## Gameplay controls

The game includes touch controls. On desktop, WASD moves, mouse drag/arrows rotate the camera, **R** jumps or flies up, **F** flies down, **Space** boosts, **J** attacks, **K** fires or charges energy, **Shift/B** guards, and **Esc** pauses. The complete controls are available in the game's Controls menu.

## Current animation review — V115

Recent patches V100–V115 progressively refined pose ownership, walk/run transitions, jumping, foot contact, landings, and powered flight.

**V115** calibrates the actual skeleton's forward knee-bending direction separately on each leg, including mirrored VRM bone axes. It is an opt-in comparison profile (jumpKnees=forward), **not yet visually approved** on the target device. The previous V114 guided hinge, V112 push-off, V113 controlled flight and V111 recorded flight remain available for A/B comparison.

Use [the visual review page](qa.html) to select knee and flight profiles, open the game with consistent flags, test the same actions, and copy structured feedback. The reviewer should check stationary and moving jumps, planted shoes, launch frames, hover versus cruise, and ordinary combat. This page changes **no** gameplay, physics, skeleton assets, or animation controller code; it only generates URLs and a local text report.

## Development

The repository is a static HTML/JavaScript game. The editable game engine is split into sequential src/*.js modules, and the deployable js/game.js is generated from them.

To rebuild the engine bundle after editing a source module:

    python tools/build.py

To check the current V115 knee calibration and visual review helpers:

    node tests/v115-forward-knee-calibration.js
    node tests/v115-visual-qa.js

The GitHub Actions workflow .github/workflows/v66-character.yml runs the broader JavaScript regression suite on relevant changes and refreshes the generated game bundle on pushes to main when necessary. **Passing unit/geometry tests does not prove the final pose looks correct in a real WebGL browser**; device testing and explicit visual approval remain necessary.

Key paths:

- index.html, css/game.css — playable interface and styling
- src/ — editable engine source
- js/v100-pose-authority.js — current unified fighter animation/pose authority
- js/v66-game-boot.js — asset loading, preview flags and boot diagnostics
- assets/characters/, assets/rin.vrm — fighter VRM models
- tests/ — regression and gameplay/geometry validation
- qa.html, js/v115-visual-qa.js — opt-in animation preview comparisons and feedback helper

## Rin's avatar permissions

Rin Sable is based on the **VRoid Studio AvatarSample_C** (VRM 0.x, author metadata Theo). Its published asset metadata permits public fighting-game use and violence but retains commercial/adult-content restrictions from the source export. The sample is **not CC0**. See the [official VRoid sample asset terms](https://vroid.pixiv.help/hc/en-us/articles/4402394424089-VRoidPreset-A-Z). Do not assume all assets in this repository have a permissive commercial license.
