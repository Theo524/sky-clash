// Run after editing: node tests/smoke.js
// Lightweight structural regression checks. A browser/WebGL playtest is still needed.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const pieces=fs.readdirSync(path.join(root,'src')).filter(x=>x.endsWith('.js')).sort()
  .map(f=>fs.readFileSync(path.join(root,'src',f),'utf8')).join('');
assert.strictEqual(js,pieces,'Bundle must match editable source. Run python tools/build.py.');
assert(html.includes('Sky Clash V38'));
assert(html.includes('assets/fighter.vrm'));
assert(fs.existsSync(path.join(root,'assets/fighter.vrm')));
assert(js.includes('loadVRMInto(this.enemy, modelSource'));
assert(js.includes('loadVRMInto(this.player, modelSource'));
assert(js.includes('meleeRange: 2.5'));
assert(js.includes('B.spineY = i ? -0.30 : 0.30; B.spineX = 0.045'));
assert(html.includes('data-act="melee"') && html.includes('data-act="blast"'));
console.log('V38 structural checks passed. Next: browser gameplay test.');
