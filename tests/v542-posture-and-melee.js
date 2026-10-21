const assert = require('node:assert/strict');
const fs = require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const animation=read('src/40-recorded-animations.js');
const fighter=read('src/45-fighter-controller.js');
const models=read('src/30-character-models.js');
const combat=read('src/60-combat.js');
const bundled=read('js/game.js');
assert(read('index.html').includes('js/game.js?v=542'),'deploy cache version');
assert.equal(bundled,fs.readdirSync(path.join(root,'src')).filter(x=>x.endsWith('.js')).sort().map(x=>read('src/'+x)).join(''),'bundle synchronized');
// A safe energy release must never schedule an unrelated overhand punch (which causes VRM arm twisting).
assert(animation.includes("this.lastRecordedAction = 'clean-energy-release'"));
assert(!animation.includes("this.play(big ? 'qOverhand' : 'blast'"));
// Disable Mixamo idle overlay, retain unique procedural ninja stance and optional dojo testing room.
assert(!animation.includes("Anim.blend(S,Anim.sample(idle"));
assert(fighter.includes('Shade Runner: asymmetric open-hand guard'));
assert(animation.includes('if (this.nodes[i]) this.nodes[i].quaternion.identity();'),'no inherited shoulder pose');
// Moving punches must retain grounded rhythmic footwork and avoid fixed attack lunges.
assert(fighter.includes('const mobilePunch = this.punchT > 0 && this.attackMoving'));
assert(fighter.includes('if (mobilePunch) B.leg = P.leg.map(leg => leg.slice())'));
assert(animation.includes("(f.punchT > 0 && !mobilePunch)"));
assert(animation.includes('const legT = ninjaRun || busyLegs ? 0 : moveW'));
// Foot-floor correction follows ankle/toe joints and has sufficient clearance range.
assert(models.includes("name.endsWith('Toes') ? 0.070 : 0.150"));
assert(models.includes('clamp(this.footLift + (Number.isFinite(correction) ? correction : 0), -0.025, 0.50)'));
// Kairo's opening punch slower, but the kick is exactly the previous duration.
assert(combat.includes('[0.55,0.55,0.68,0.87]'));
assert(combat.includes('[0.24,0.24,0.33,0.41]'));
// Imported hip offsets no longer change grounded fighter height during normal locomotion.
assert(animation.includes('const wh = (f.downT > 0 || f.launched || f.spiked'));
console.log('V54.2 posture, release arms, foot clearance, readable jab and moving strike guards PASS');
