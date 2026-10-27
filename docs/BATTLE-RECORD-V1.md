# Battle Record V1 — persistent real arena match career

New Sky Clash player-facing progression feature: records arena-fight match
wins/losses, percentage, current win streak and best streak **separately
for Kairo Venn and Rin Sable**, stored only in the browser's local storage
(`skyclash.v1.battle-record`). Title character selection displays its own
record; Victory / Defeat results update it after the final round. Rematches
do not erase it, and dojo sparring, practice, individual round wins and
aborted matches do not count. If browser storage is unavailable the record
remains session-only; no backend data transfer, achievements or matchmaking.

No changes to existing animation owners, B/B/B/B Kairo V164 opt-in,
approved Q V156, Rin movements, combat hit resolution, match scoring,
physics, AI, controls or project models.

Verify with `node tests/battle-record-persistence.js` and existing V66
character integration suite. Designed as a small complete gameplay
feature rather than further animation micro-iterations.
