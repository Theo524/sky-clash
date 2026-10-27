/* A functional progression feature: real match results must persist without
 * changing gameplay controls, movement, Kairo/Rin animations, or dojo.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const module=fs.readFileSync('src/82-battle-record.js','utf8');
const game=fs.readFileSync('src/95-game.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const bundle=fs.readFileSync('tools/build.py','utf8');
const storage=new Map();
const el={
 battleRecord:{textContent:''},overRecord:{textContent:''}
};
const localStorage={
 getItem(k){return storage.get(k)||null;},
 setItem(k,v){storage.set(k,v);}
};
const context={localStorage,document:{getElementById(id){return el[id]||null;}}};
vm.createContext(context);vm.runInContext(module+'\nthis.api=BattleRecord;',context);
const b=context.api;
assert.deepEqual({...b.get('kairo_venn')},{wins:0,losses:0,streak:0,bestStreak:0});
assert.equal(b.finish('invalid',true),null);
assert.equal(b.finish('kairo_venn','win'),null);
b.finish('kairo_venn',true);b.finish('kairo_venn',true);
assert.equal(b.get('kairo_venn').wins,2);
assert.equal(b.get('kairo_venn').streak,2);
b.finish('kairo_venn',false);
assert.equal(b.get('kairo_venn').losses,1);
assert.equal(b.get('kairo_venn').streak,0);
assert.equal(b.get('kairo_venn').bestStreak,2);
b.finish('rin_sable',true);
assert.equal(b.get('rin_sable').wins,1);
assert.equal(b.get('kairo_venn').wins,2);
b.showMatch('rin_sable');
assert(el.overRecord.textContent.includes('Rin record: 1 wins'));
assert(el.battleRecord.textContent.includes('1 wins'));
// Saved records survive a browser reload, independently by fighter.
const second={localStorage,document:context.document};
vm.createContext(second);vm.runInContext(module+'\nthis.api=BattleRecord;',second);
assert.equal(second.api.get('kairo_venn').bestStreak,2);
assert.equal(second.api.get('rin_sable').wins,1);
assert(second.api.label('kairo_venn').includes('67% win rate'));
assert(game.includes("if(this.mode==='fight'){")&&
 game.includes('BattleRecord.finish(this.player.characterId,m.pw >= m.need)'),
 'Record only a completed arena match, not practice or each round');
assert(game.includes('BattleRecord.render(who.id)')&&
 game.includes('BattleRecord.showMatch(this.player.characterId)'),
 'Switch fighter records and show results');
assert(html.includes('id="battleRecord"')&&html.includes('id="overRecord"'));
assert(bundle.includes("glob('*.js')"),'new source chunk is included in game');
console.log('PASS persistent arena match record and independent Kairo/Rin careers');
