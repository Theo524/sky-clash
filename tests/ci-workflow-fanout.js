/* Prevent Sky Clash animation CI from regressing into a dozen
 * Chromium recordings for every single V100 normal-flight change.
 * Static workflow policy test; no third-party YAML dependency.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const p=name=>'.github/workflows/'+name+'.yml';
const read=name=>fs.readFileSync(p(name),'utf8');
const all=["kairo-quick-flight-stills","animation-ownership","assistant-readiness","flight-guard-visual-check","flight-visual-review","jump-visual-review","kairo-forward-flight-pose-study","kairo-v157-flight-banking","kairo-v159-vertical-flight","moving-jump-visual-review","pose-lab-browser","v154-boost-review","v155-organic-boost-review","v63-motion","v66-character"];
const heavy=["kairo-quick-flight-stills","flight-guard-visual-check","flight-visual-review","jump-visual-review","kairo-forward-flight-pose-study","kairo-v157-flight-banking","kairo-v159-vertical-flight","moving-jump-visual-review","pose-lab-browser","v154-boost-review","v155-organic-boost-review"];
for(const name of all){
 const txt=read(name);
 assert(txt.includes('concurrency:\n')&&
  txt.includes('cancel-in-progress: ${{ github.event_name == \'pull_request\' }}'),
  name+' must cancel only superseded PRs, never main');
 assert(txt.includes("group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}"),
  name+' must use workflow/PR keyed concurrency');
}
for(const name of heavy){
 const txt=read(name);
 assert(txt.includes('actions/cache@v4')&&
  txt.includes('path: ~/.cache/ms-playwright')&&
  txt.includes("key: ${{ runner.os }}-playwright-chromium-1.56.1"),
  name+' must reuse correct Chromium browser');
 assert(txt.includes('playwright@1.56.1'),'pin Playwright version: '+name);
 assert(!txt.includes("      - '"+p(name)+"'"),
  name+' workflow-only edits should be validated by fast policy test, not GPU jobs');
}
// These archived visual experiments must remain dispatchable but must not
// crowd the runners on an unrelated change to normal Kairo V100 motion.
for(const name of [
 'flight-guard-visual-check','flight-visual-review','jump-visual-review',
 'kairo-v157-flight-banking','v155-organic-boost-review']){
 assert(!read(name).includes("      - 'js/v100-pose-authority.js'"),
  name+' must not automatically record historical animations for each V100 edit');
}
for(const name of [
 'flight-guard-visual-check','flight-visual-review','jump-visual-review',
 'kairo-v157-flight-banking','v154-boost-review','v155-organic-boost-review']){
 assert(!read(name).includes("      - 'js/v66-game-boot.js'"),
  name+' must not start a browser for unrelated loader changes');
}
// Preserve main branch safety: V66 runs the legacy tests once;
// Animation Ownership keeps its independent single-owner/VRM checks.
const character=read('v66-character'),ownership=read('animation-ownership');
assert((character.match(/^\s+- run: node tests\//gm)||[]).length>=70,
 'V66 must retain canonical 70+ regression tests');
assert(!ownership.includes('Re-run all 70 existing V66'),
 'Do not run the complete legacy suite twice on the same PR');
assert(ownership.includes('node tests/animation-ownership-contract.js')&&
 ownership.includes('node tests/v100-single-pose-authority.js'),
 'V100 pose ownership safety must remain automatic');
assert(!read('kairo-quick-flight-stills').includes("      - 'js/v100-pose-authority.js'")&&
 !read('kairo-v164-selected-flight-stills').includes('  pull_request:'),
 'V164 WebGL capture is explicit opt-in rather than a default V100 PR job');
assert(!read('kairo-v159-vertical-flight').includes("      - 'js/v100-pose-authority.js'"),
 'Full V159 MP4 should run on demand, not for every V100 edit');
assert(!read('flight-visual-review').includes("      - 'js/v156-real-vrm-flight.js'"),
 'Historical full flight video must be manually dispatched for real-Q data edits');
assert(!read('kairo-v157-flight-banking').includes('  pull_request:'),
 'Archived V158 full videos are manual only; fast bank tests still run on every owner PR');
assert(!read('kairo-v157-flight-banking').includes("      - 'js/v158-real-vrm-flight.js'"),
 'Historical full V157/V158 video must not re-film every new clip migration');
assert(read('kairo-v159-vertical-flight').includes('  workflow_dispatch:'),
 'Keep actual full-motion filming available on demand');
// Keep costly browser reviews specific; do not film the same pack twice.
const storm=read('kairo-storm-fist-v3-review'),kick=read('storm-fist-v4-kick-visual');
assert(storm.includes("      - 'assets/animations/kairo/storm-fist.v3.json'")&&
 storm.includes("      - 'src/60-combat.js'")&&
 !storm.includes("      - 'src/**'"),
 'Storm Fist real-VRM review must target actual combat changes');
assert(kick.includes('  workflow_dispatch:')&&!kick.includes('  pull_request:')&&
 kick.includes('STORM_QA_MOVES: rising-kick,roundhouse,side-kick,sky-kick'),
 'Focused four-kick film remains available on demand, never duplicated per PR');
const focusedFlight=read('kairo-v164-selected-flight-stills');
assert(!focusedFlight.includes('  pull_request:')&&
 focusedFlight.includes('  workflow_dispatch:')&&
 !focusedFlight.includes("      - 'js/v66-game-boot.js'"),
 'Flight real-VRM visual QA must remain manually runnable without automatic filming');
// Ordinary Studio changes run their targeted integration tests, not
// whole-game legacy suites, Pose Lab captures or multi-minute Storm Fist films.
for(const name of ['kairo-storm-fist-v3-review','v66-character','pose-lab-browser',
 'animation-ownership']){
 const yaml=read(name);
 for(const editor of ['animation-studio.html','js/animation-studio.js']){
  assert(!yaml.includes("      - '"+editor+"'"),
   name+' must not start for ordinary action-editor edits');
 }
}
assert(!read('kairo-storm-fist-v3-review').includes("      - 'js/v72-published-actions.js'"),
 'Editor integration in V72 must never generate full Storm Fist video');
assert(!read('kairo-storm-fist-v3-review').includes("      - 'js/v81-pose-transitions.js'"),
 'Pose-transition code may use manual video review, not PR video by default');
assert(!read('v66-character').includes("      - 'js/v72-*'"),
 'A V72 local combat edit should run targeted studio checks, not all V66 tests');
assert(!read('animation-ownership').includes("      - 'js/**'")&&
 !read('animation-ownership').includes("      - 'tests/**'"),
 'Ownership CI needs narrowly scoped animation scripts rather than every JS/test file');
assert(read('studio-local-game').includes("      - 'js/v72-published-actions.js'")&&
 read('studio-local-game').includes("      - 'js/v72-studio-game-export.js'"),
 'Local editor and game runtime changes must retain targeted verification');
assert(read('kairo-storm-fist-v3-review').includes('  workflow_dispatch:')&&
 read('pose-lab-browser').includes('  workflow_dispatch:'),
 'Keep costly real-model capture available on demand');
for(const name of ['kairo-v164-selected-flight-stills','flight-visual-review','jump-visual-review']){
 assert(!read(name).includes('  pull_request:')&&read(name).includes('  workflow_dispatch:'),
  name+' must be manually dispatched, not film on a routine PR');
}
console.log('PASS: '+all.length+' concurrency guards, '+heavy.length+
 ' cached WebGL workflows, targeted visual fan-out, and full V66 safety retained');
