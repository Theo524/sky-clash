// V44 build + structural regressions (browser gameplay still required).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const parts=fs.readdirSync(path.join(root,'src')).filter(x=>x.endsWith('.js')).sort()
  .map(x=>fs.readFileSync(path.join(root,'src',x),'utf8')).join('');
assert.strictEqual(js,parts,'Rebuild using python tools/build.py');
assert(html.includes('Sky Clash V44'));
for(const pathPart of ['assets/fighter.vrm','js/vendor/three.min.js','js/vendor/vrmkit.js','css/game.css'])
  assert(fs.existsSync(path.join(root,pathPart)),pathPart+' missing');
for(const key of ['melee','blast','dash','block','fly'])
  assert(html.includes('data-act="'+key+'"'),key+' control missing');
for(const token of ['Spectacle.contact','Spectacle.explosion','Spectacle.dashWake','Spectacle.flightWake',
  'Spectacle.update','Spectacle.clear','swingPlayed','superShot','qHook','airStrike','dashRecoverT','chargeFracture','bodyAura','qShieldDash','qSwordDash','superHitT'])
  assert(js.includes(token),'Missing V44 hook '+token);
assert(!js.includes('this.meteor'), 'Meteor movement effect must not be reintroduced');
console.log('V44 source, effects, controls, models and assets checks passed.');
