# Sky Clash — current project entry point

Sky Clash is an original 3D anime martial-arts arena fighting game. The **actual playable game** is hosted at https://theo524.github.io/sky-clash/ and the source is in this repository.

**Assistant / new chat starting here?** Read [AGENTS.md](AGENTS.md), [Current State](docs/ASSISTANT-CURRENT-STATE.md), and the [Assistant Runbook](docs/ASSISTANT-RUNBOOK.md) **before making changes or claiming a visual animation is approved**. Run `node tools/assistant-checkup.cjs --strict` in a checkout or inspect the `Assistant Startup and Project Truth Check` workflow artifact for repository facts. Use GitHub tools directly; the player does **not** want to run Pose Lab or capture debugging clips.

Current source registers **Kairo Venn and Rin Sable** only. Four further fighters are design ideas, not gameplay. The game's default V153 forward flight and both old/V154 Boost have been *visually rejected* by the player; V155's alternative was also rejected as twisted. A passing animation code test does not overturn that verdict. Keep gameplay stable and author/review real VRM motion before proposing any new default.

### Legacy release note archive

The V53 description below is historical and **not** the current status of the game.

---

# Sky Clash V53 — Rin Reborn

This patch replaces V52 Rin's recoloured Kairo avatar with the **user-exported VRoid AvatarSample_C** (VRM 0.x, author metadata `Theo`), customised into Rin Sable.

## In this update

- Detailed, distinct VRoid face, dark hair, user's red eyes and eye mark **preserved**.
- Recoloured indigo-black ninja jacket, trousers and boots; excessive high jacket collar lowered in the model mesh.
- Animated curved **fabric nose/mouth mask** and subtle cloth wrist wraps. No metallic headband, no high-neck accessory.
- Same rig/animation system as Kairo, with mandatory VRM0-to-VRM1 facing correction and a portrait that does not reset model rotation.
- Both fighter models are very slightly larger relative to the arena, with retuned ankle/floor constraint.
- Rin's everyday walk uses the smoother motion-clip blend; her much-liked **ninja sprint remains unchanged**.
- Second jump now uses a soft airborne-tuck pose instead of the instant generic flip.
- Rin's **separate four-beat melee:** palm → elbow → turning heel kick → rising ninja kick. Third beat doesn't auto-launch; fourth can lead into aerial pursuit. Kairo's combo is unchanged.
- Compatible with the V51 dojo, Falling Fist, character selection, energy, stamina and shuriken volley.

## Publish

Extract the ZIP, then drag the **contents** (not the ZIP file) into the corresponding locations in the `Theo524/sky-clash` GitHub repository. In particular, **replace** `assets/rin.vrm`, `js/game.js` and the root `index.html`. Commit and wait for GitHub Pages to deploy.

## Model permissions — important

AvatarSample_C itself is a **non-CC0** VRoid Studio sample. Its official terms allow using, editing and freely redistributing it (but not selling the sample asset itself for a fee):
https://vroid.pixiv.help/hc/en-us/articles/4402394424089-VRoidPreset-A-Z

The **published `assets/rin.vrm` metadata** has now been updated with your authorization for public fighting-game use: avatar users `Everyone`, violence `Allow`, and the VRM 0.x license set to `Other` with the official Sample C terms URL attached. This is **not a CC0 license**. We kept commercial and adult-content permissions `Disallow` as in the original export. The model geometry, rig, materials, and textures are identical to the V53 update.

## Tests

Static JavaScript/regression tests plus geometry/VRM integrity and gameplay-state tests. Browser WebGL visuals **not verified** in this build; inspect the mask alignment, model scale, grounded stance and animations on your device.
