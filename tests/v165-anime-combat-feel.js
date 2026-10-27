import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('src/15-anime-feel-v165.js','utf8');
function build(search) {
 const sandbox={window:{location:{search}},URLSearchParams};
 vm.createContext(sandbox);
 vm.runInContext(source+'\nthis.profile=AnimeFeelV165;',sandbox);
 return sandbox.profile;
}
const off=build(''),on=build('?combatFeel=v165'),old=build('?combatFeel=v164');
assert.equal(off.enabled,false);assert.equal(old.enabled,false);
assert.equal(on.enabled,true);assert.equal(on.boostSpeedScale,1.24);
assert.equal(on.boostTurnScale,1.38);
assert.equal(on.tempo(0),.82);assert.equal(on.tempo(3),.94);
assert.equal(on.tempo(-3),.82);assert.equal(on.tempo(99),.94);
assert.equal(on.hitStop(false,'melee'),.043);
const sourceFiles=['src/45-fighter-controller.js','src/60-combat.js',
 'src/52-spectacle.js','src/75-camera.js','js/v72-published-actions.js'];
const sources=Object.fromEntries(sourceFiles.map(p=>[p,fs.readFileSync(p,'utf8')]));
assert(sources[sourceFiles[0]].includes('burstV165?AnimeFeelV165.boostSpeedScale:1'));
assert(sources[sourceFiles[0]].includes('Spectacle.boostIgnition(this)'));
assert(sources[sourceFiles[1]].includes('const beatScale=AnimeFeelV165.enabled?'));
assert(sources[sourceFiles[1]].includes('* agile * beatScale, kick, stage'));
assert(sources[sourceFiles[2]].includes('function boostIgnition(f)'));
assert(sources[sourceFiles[3]].includes('if(AnimeFeelV165.enabled&&camera?.isPerspectiveCamera)'));
assert(sources[sourceFiles[4]].includes('this.attackElapsed'));
assert(fs.readFileSync('tools/build.py','utf8').includes("glob('*.js')"));
console.log('PASS opt-in V165 boost, speed and fighting timing; normal game unchanged');
