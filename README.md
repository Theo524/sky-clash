# Sky Clash

An original 3D anime martial-arts arena fighter with two playable characters: **Kairo Venn** and **Rin Sable**. The published game is at https://theo524.github.io/sky-clash/.

Storm Fist review: https://theo524.github.io/sky-clash/?combatAnim=storm-fist-v1 .
See [controls and authoring](docs/KAIRO-STORM-FIST-PLAYTEST.md).

Assistants should first read [AGENTS.md](AGENTS.md), [current state](docs/ASSISTANT-CURRENT-STATE.md) and the [runbook](docs/ASSISTANT-RUNBOOK.md). They preserve player decisions, animation ownership and the interrupted Blender combat work.

## Development

The game serves static files; Node runs regression/authoring tools, and Python builds the deployment bundle. From the checkout:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node tools/assistant-checkup.cjs --strict
```

Edit `src/*.js`, then run `python3 tools/build.py` to regenerate `js/game.js`. Existing CI commands are in `.github/workflows/v66-character.yml` and `.github/workflows/animation-ownership.yml`. Browser tools use Playwright and Chromium; Blender authoring commands and measured limits are in the [combat foundation report](docs/KAIRO-COMBAT-FOUNDATION-2026-10-27.md). The assistant should run these tools rather than assigning them to the player.

## Animation status

V156 Q is the accepted default forward flight. V164's selected B/B/B/B flight remains an opt-in playtest. Rejected combat Batch A stays withdrawn. The player accepts the original Blender jab; Storm Fist preserves that exact asset and adds sixteen clips using the recovered Blender-to-VRM pipeline and existing V72/V81 player. Its review link preserves baseline stance, flight and Rin. See [current state](docs/ASSISTANT-CURRENT-STATE.md) for validation and remaining limits.

Passing code tests does not establish animation quality or player aesthetic approval. Preserve existing stance, flight, physics and rollback paths while reviewing continuous real-character motion.

## Character model permissions

Kairo and Rin use the existing repository VRM assets; do not replace or rewrite model bytes during cleanup. Rin is derived from the user's VRoid Studio **AvatarSample_C** export, with its distinct face, dark hair, red eyes/mark, clothing and ninja identity preserved. Its sample asset is **not CC0**. The [official sample terms](https://vroid.pixiv.help/hc/en-us/articles/4402394424089-VRoidPreset-A-Z) allow use, editing and redistribution subject to their restrictions, including not selling the sample asset itself for a fee.

Rin's published VRM0 metadata records avatar users `Everyone`, violence `Allow`, and license `Other` with the official terms URL. Commercial and adult-content permissions remain `Disallow`. Keep that licensing record and the user's character assets intact. Historical release details are retained in [project context](docs/PROJECT-CONTEXT.md) and Git history.
