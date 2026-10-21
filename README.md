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

The **uploaded export's embedded VRM metadata** currently says `OnlyAuthor`, `violentUssageName: Disallow` and `licenseName: Redistribution_Prohibited`. We have **not silently changed** these user-selected fields. Since Sky Clash is a public fighting game with a downloadable VRM asset, check/update the export permissions to match your desired distribution before publishing. Do not label this sample CC0.

## Tests

Static JavaScript/regression tests plus geometry/VRM integrity and gameplay-state tests. Browser WebGL visuals **not verified** in this build; inspect the mask alignment, model scale, grounded stance and animations on your device.
