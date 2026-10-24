/* Historical animation wrapper tripwire, not proof of one runtime bone write.
 * When adding another animation writer, CI must fail until ownership design
 * and explicit user review justify the change. Do not auto-accept new paths.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

// Current legacy inventory verified against existing Sky Clash runtime files.
// V79 reuses V72's attach() rather than registering its own wrapper.
const EXPECTED = Object.freeze({
  'js/v62-playable-master.js': 1,
  'js/v63-recorded-motion.js': 1,
  'js/v71-mixamo-gameplay.js': 1,
  'js/v72-walk-arms.js': 1,
  'js/v72-published-actions.js': 1,
  'js/v76-upper-body.js': 1,
  'js/v81-pose-transitions.js': 1,
  'js/v89-grounded-step.js': 1,
  'js/v91-stance-continuity.js': 1,
  'js/v100-pose-authority.js': 1
});

function registrations(source) {
  // Detect the existing "fighter.animate = function" pattern AND new
  // arrow-form wrappers; we explicitly do not count restoring "animate=old".
  const classic = /\b(?:[A-Za-z_$][\w$]*|this)\.animate\s*=\s*(?:async\s+)?function\s*\(/g;
  const arrow = /\b(?:[A-Za-z_$][\w$]*|this)\.animate\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g;
  return [...source.matchAll(classic), ...source.matchAll(arrow)].length;
}
assert.equal(registrations('fighter.animate = function(dt){}'), 1);
assert.equal(registrations('f.animate = (dt) => {}'), 1);
assert.equal(registrations('this.animate = async (dt) => {}'), 1);
assert.equal(registrations('fighter.animate = original;'), 0);

function recursiveScripts(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => {
    if (entry.isDirectory()) {
      if (entry.name === 'vendor' || entry.name === 'node_modules') return [];
      return recursiveScripts(path.join(dir,entry.name));
    }
    return entry.isFile() && entry.name.endsWith('.js') ? [path.join(dir, entry.name)] : [];
  });
}
const found = {};
for (const dir of ['js','src']) {
  for (const file of recursiveScripts(path.join(root,dir))) {
    if (path.basename(file) === 'game.js') continue; // generated from src
    const name = path.relative(root,file).replaceAll(path.sep,'/');
    const amount = registrations(fs.readFileSync(file,'utf8'));
    if (amount) found[name] = amount;
  }
}
assert.deepEqual(Object.keys(found).sort(), Object.keys(EXPECTED).sort(),
  'Unreviewed animation wrapper appeared or a documented historical wrapper disappeared. ' +
  'Do not add another writer: update the explicit ownership plan first.');
for (const [file, amount] of Object.entries(EXPECTED))
  assert.equal(found[file],amount,'Changed animation wrapper registrations: '+file);

// These four active historical layers must explicitly yield to V100.
// The optional V79 recorded pack uses the same V72.attach function.
for (const file of [
 'js/v71-mixamo-gameplay.js','js/v72-published-actions.js',
 'js/v76-upper-body.js','js/v81-pose-transitions.js'
]) assert(read(file).includes('SkyClashV100Animator?.ownsAir(this)'),
  file+' must yield when the V100 final pose owner is active');
assert(read('js/v79-extra-actions.js').includes('adapter.attach('),
  'V79 must continue using the yielding V72 adapter');
assert(read('js/v89-grounded-step.js').includes("g.mode==='inactive'"),
  'Grounded foot step controller must be inactive during air motion');
assert(read('js/v91-stance-continuity.js').includes("stage==='inactive'"),
  'Ground continuity must not impose grounded poses while airborne');

// Verify the natural-air priority contract remains explicit. A height-only
// flying getter must NOT outrank actual jump/drop in V100 stateOf().
const authority=read('js/v100-pose-authority.js');
const start=authority.indexOf('function stateOf(f)');
const end=authority.indexOf('function isPreview(',start);
assert(start>=0&&end>start,'state resolver must be present');
const resolver=authority.slice(start,end);
for (const part of [
 'if(f.dropping)return', 'if(f.jumping)return',
 "get('flightLab')==='blend'"
])assert(resolver.includes(part),'Missing explicit animation state priority: '+part);
assert(resolver.indexOf('if(f.dropping)return') <
       resolver.indexOf("get('flightLab')==='blend'"));
assert(resolver.indexOf('if(f.jumping)return') <
       resolver.indexOf("get('flightLab')==='blend'"));
assert(authority.includes('context.SkyClashPoseAuthority?.ready'),
  'V100 must not claim ownership before successful model/recording load');

const boot=read('js/v66-game-boot.js');
assert(boot.includes("window.SkyClashV100Animator.start(window)"));
assert(boot.indexOf('SkyClashV91Stance.start(window)') <
       boot.indexOf('SkyClashV100Animator.start(window)'),
  'V100 final owner must attach after legacy ground/transition layers');

// The rig manifest is deliberately incomplete until the REAL normalized
// VRM skeleton has been measured. Do not fake a canonical bind-pose hash.
const manifest=JSON.parse(read('docs/KAIRO-RIG-CONTRACT.v1.json'));
assert.equal(manifest.status,'DRAFT_INCOMPLETE_DO_NOT_USE_AS_VALIDATED_BIND_POSE');
assert.equal(manifest.targetBoneNames.length,20);
const list=authority.match(/const BONES=\[([\s\S]*?)\];/);
assert(list,'V100 normalized target bone list must remain available');
const names=[...list[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
assert.deepEqual(manifest.targetBoneNames,names,'rig metadata must track actual final-owner bone order');
assert.equal(manifest.unverifiedRequiredForCanonicalRig.sdkNormalizedSkeletonSignature,null);
assert.equal(manifest.unverifiedRequiredForCanonicalRig.sdkNormalizedRestQuaternions,null);
for(const file of ['AGENTS.md','docs/PROJECT-CONTEXT.md',
 'docs/ANIMATION-OWNERSHIP-CONTRACT.md'])
 assert(fs.statSync(path.join(root,file)).size>500,'missing permanent architecture handoff: '+file);

console.log('PASS animation ownership guard: 10 approved historical wrappers, V100 yield/state priority, 20-bone contract, persistent handoff. NOTE: static guard does NOT establish single runtime bone writer.');
