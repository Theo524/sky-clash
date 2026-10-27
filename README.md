# Sky Clash

An original 3D anime martial-arts arena fighter with two playable characters: **Kairo Venn** and **Rin Sable**. The published game is at https://theo524.github.io/sky-clash/.

Assistants should first read [AGENTS.md](AGENTS.md), [current state](docs/ASSISTANT-CURRENT-STATE.md) and the [runbook](docs/ASSISTANT-RUNBOOK.md). They preserve player decisions, animation ownership and the interrupted Blender combat work.

## Development

The game serves static files; Node runs regression/authoring tools, and Python builds the deployment bundle. From the checkout:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node tools/assistant-checkup.cjs --strict
```

Edit `src/*.js`, then run `python3 tools/build.py` to regenerate `js/game.js`. Existing CI commands are in `.github/workflows/v66-character.yml` and `.github/workflows/animation-ownership.yml`. Browser tools use Playwright and Chromium; Blender authoring commands and measured limits are in the [combat foundation report](docs/KAIRO-COMBAT-FOUNDATION-2026-10-27.md). The assistant should run these tools rather than assigning them to the player.

## Animation status

V156 Q is the accepted default forward flight. V164's selected B/B/B/B flight remains an opt-in playtest. Rejected combat Batch A was withdrawn and original fighting/standing restored. PR #140's recovered Blender-to-VRM pipeline and original jab are offline development work; the jab remains unapproved and has not replaced playable combat. See [current state](docs/ASSISTANT-CURRENT-STATE.md) for precise scope and [rejection criteria](docs/KAIRO-BATCH-A-REJECTED-2026-10-27.md) before changing fighting animations.

Passing code tests does not establish animation quality or player aesthetic approval. Preserve existing stance, flight, physics and rollback paths while reviewing continuous real-character motion.

## Character model permissions

Kairo and Rin use the existing repository VRM assets; do not replace or rewrite model bytes during cleanup. Rin is derived from the user's VRoid Studio **AvatarSample_C** export, with its distinct face, dark hair, red eyes/mark, clothing and ninja identity preserved. Its sample asset is **not CC0**. The [official sample terms](https://vroid.pixiv.help/hc/en-us/articles/4402394424089-VRoidPreset-A-Z) allow use, editing and redistribution subject to their restrictions, including not selling the sample asset itself for a fee.

Rin's published VRM0 metadata records avatar users `Everyone`, violence `Allow`, and license `Other` with the official terms URL. Commercial and adult-content permissions remain `Disallow`. Keep that licensing record and the user's character assets intact. Historical release details are retained in [project context](docs/PROJECT-CONTEXT.md) and Git history.
