# Sky Clash — repository cleanup audit (2026-10-26)

This audit distinguishes **unused deployment notes**, **current runtime dependencies**, **optional rollback paths**, **tests** and **large assets**. It does not treat an old filename as proof that its code is dead. The objective is to remove clutter **without regressing live gameplay**, preserving assistant tooling and real Kairo/Rin VRMs.

## Inventory of `main` at audit start

| Category | Number | On-disk bytes (approx.) | Verdict |
|---|---:|---:|---|
| All checked-in files | 248 | **38.08 MB** (decimal, GitHub Git tree blob totals) | Need selective cleanup |
| Assets | 15 | **33.10 MB** | Includes BOTH playable VRMs; not junk |
| Kairo model `assets/characters/kairo.vrm` | 1 | **16.64 MB** | Must preserve exact visible rig; changing bytes invalidates SHA-bound animation |
| Rin model `assets/rin.vrm` | 1 | **15.91 MB** | Must preserve user's ninja model and existing animations |
| `js/` files | 46 | **2.66 MB** | Includes necessary generated `js/game.js` (1.19 MB) and vendor 3D libraries |
| `src/` files | 19 | **1.19 MB** | Editable source; generated bundled `js/game.js` equals concatenation; KEEP BOTH |
| `tests/` files | 113 | **0.66 MB** | Regression protection; removing tests alone saves little and loses safety |
| `docs/` files | 23 | **0.20 MB** | Includes critical assistant new-chat memory and historical design context |
| `tools/` files | 9 | **0.10 MB** | Automated assistant/CIs use these; not user-facing clutter to purge |

> Total model file bytes: **32,546,932 (~85.5% of all tracked bytes)**. Removing a dozen small JavaScript files will not meaningfully shrink a Git clone compared with those models, nor fix movement quality. Files stored in Git history remain in the historical repository even after deleting them from the current tree.

## Immediate cleanup done on isolated branch

Safely remove four *obsolete root-level ZIP-upload instructions*: `README.txt` (V42), `V57-INSTALL.txt`, `V58-INSTALL.txt`, `V60-INSTALL.txt`. These described uploading old version ZIPs and don't participate in game/Animation Studio/Pose Lab runtime. `README.md` and `docs/ASSISTANT-RUNBOOK.md` now document the actual current development workflow. Combined immediate reduction: about **3,939 bytes**, but important housekeeping.

Do NOT remove the assets, code or tests merely based on version labels.

## Where the real complexity is

The live `index.html` loads the real 3D/VRM vendor libraries, core assets and `js/v66-game-boot.js`. The boot loader, under modern `flightPreview`/unified animation settings, loads interdependent motion helper modules for V142–V149, V150, V152, V153 and V100. `js/v72-published-actions.js` owns Boost; `js/v154-boost-performance.js` and `js/v155-organic-flight.js` remain available via *explicit query params*. Although V153/V154/V155 visual results have been rejected by the player, removing their code without changing boot flags, dependent pose solvers, preview routes and regression tests would create broken startup or false failures.

Concrete dependencies:
- `js/v100-pose-authority.js` is still used for current Kairo flight, jump and landing; **keep**.
- `js/v72-published-actions.js` owns recorded Boost; **keep**.
- `js/v66-game-boot.js`, `src/*.js`, `js/game.js` and `js/vendor/**` are required by the current architecture, not safe deletion targets.
- `pose-lab.html`, `js/kairo-pose-lab.js`, the exact V152 reference pose and GitHub Actions capture scripts are **assistant-facing debugging assets**, not redundant user UI.
- Old `tests/vXXX` scripts may look repetitive but guard behaviors once broken; **keep until a new consolidated test demonstrably covers each contract**.
- `.github/workflows/v154-boost-review.yml` and `v155-organic-boost-review.yml` add CI maintenance noise; consolidate into a single non-blocking visual comparison workflow *after* a supported capture tool supersedes both, rather than deleting real VRM validation.
- `docs/PROJECT-CONTEXT.md` is large and historical, but needed to understand why experiments failed. The short current-state document is now the canonical new-chat entry point; preserve the history until safely archived.

## Next meaningful cleanup phases (separate PRs, each with rollback)

1. **Dependency inventory and consolidation:** author a boot/runtime manifest mapping query flags to JS assets; confirm default and V152 rollback with a real WebGL browser trace. List exactly which loaded resources are necessary for default and for backup preview, and which are truly unreachable.
2. **One flight-system simplification:** after a player-approved quaternion clip exists, retire abandoned V153/V154/V155 *preview-only* paths and replace chains of corrective flight modules with a single clearly owned data-driven clip pipeline. Removing these files is **conditional on having a proven replacement**; the user explicitly rejected their appearance, but removing the default V153 implementation *before* a replacement would break flight.
3. **Consolidate CI:** modernize the legacy 113 script tests behind authoritative behavior/visual tests; collapse duplicate obsolete V154/V155 capture workflows only when the replacement emits equivalent real VRM evidence.
4. **Optimize assets without replacing characters:** measure actual frame/network weight for the two VRMs, then optimize textures/geometry in a separate A/B experiment with rig fingerprint checks and visual approval. Do not rewrite model files or Rin's licensed asset in a speculative cleanup.
5. **Documentation hygiene:** keep `AGENTS.md`, current state, runbook, Character Bible, original rig/ownership docs; move genuinely obsolete installation history out of prominent main tree. Git history already preserves deleted install notes.

## Guardrails for cleanup PRs

- No silent change to Kairo/Rin VRMs, movement/Boost/combat/game balance, player inputs or root movement.
- Keep existing game and rollback URLs working unless a replacement is proven and intentionally approved.
- Run `node tools/assistant-checkup.cjs --strict --smoke`, animation ownership and V66 full integration; any JS deletion additionally needs actual WebGL default and rollback smoke screenshots. Deleting old docs alone needs source/links validation.
- Never claim eliminating more files makes the game faster without measuring **network bytes loaded** and FPS, not only Git tree size.
- GitHub Pages and branch status must be checked live; deleting a file from the current branch does not erase its older commits.
