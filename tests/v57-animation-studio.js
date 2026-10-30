'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const base=path.resolve(__dirname,'..');
const core=require('../js/animation-studio-core.js');
assert.equal(core.displayName('My Pack/Boxing (1).fbx'),'Boxing (1)');
assert.equal(core.displayName('Ninja/Mma_Kick.fbx'),'Mma Kick');
assert.equal(core.category('Boxing Back Hand Uppercut.fbx'),'combat');
assert.equal(core.category('Roundhouse Kick.fbx'),'kicks');
assert.equal(core.category('Ninja Walk.fbx'),'movement');
assert.equal(core.category('Spin Flip Kick.fbx'),'kicks');
assert.equal(core.sourceGroup('Superhero.zip','Superhero/SuperHeroFlying_mixamo.fbx'),'rokoko',
 'Rokoko Mixamo-compatible skeleton naming does not make the clip a Mixamo product');
assert.equal(core.sourceGroup('Superhero (2).zip','Superhero/Telekenisis_mixamo.fbx'),'rokoko');
assert.equal(core.sourceGroup('Sky-Clash-Clean-Boxing-40.zip','Boxing/Boxing (5).fbx'),'mixamo');
assert.equal(core.sourceGroup('unknown.zip','Random.fbx'),'other');
assert.equal(core.sourceGroup('unknown.zip','Animation_mixamo.fbx','rokoko'),'rokoko',
 'Explicit Rokoko import overrides other filename conventions');
assert.equal(core.packGroup('Superhero.zip','Superhero/IronMan_Combat_mixamo.fbx','rokoko'),'Rokoko · Superhero');
assert.notEqual(core.makeId('Superhero.zip','Superhero/IronMan_Combat_mixamo.fbx',123,4),
 core.makeId('Sky-Clash-Clean-Boxing-40.zip','Superhero/IronMan_Combat_mixamo.fbx',123,4));

assert.notEqual(core.makeId('pack.zip','Boxing.fbx',123,17),core.makeId('pack.zip','Boxing.fbx',123,18));
const one={id:'a',name:'Boxing (1)',fileName:'Boxing (1).fbx',origin:'boxing.zip',category:'combat'},m={a:{kairo:true}};
assert(core.match(one,'boxing','all','kairo',m));
assert(!core.match(one,'boxing','all','rin',m));
assert(!core.match(one,'kick','all','kairo',m));
assert(core.match(one,'BOXING','combat','all',m));
const index=fs.readFileSync(base+'/index.html','utf8');
const studio=fs.readFileSync(base+'/animation-studio.html','utf8');
const script=fs.readFileSync(base+'/js/animation-studio.js','utf8');
for(const t of ['animation-studio.html','V57 / ANIMATION STUDIO','V57.0','ws-studio-link'])assert(index.includes(t),t);
for(const id of ['fileInput','rokokoFileInput','chooseRokoko','packFilter','dropzone','clipGrid','viewer','search','category','tagFilter','markKairo','markRin','markSaved','binKairo','binRin','exportList','scrub','playPause','rootMotion','pageControls'])assert(studio.includes('id="'+id+'"'),id);
for(const source of ['JSZip.loadAsync','FBXLoader','requestAnimationFrame(renderLoop)','makeStage','setupRig','poseRig','toDataURL','IntersectionObserver','Core.makeId','localStorage','MAX_ZIP_BYTES','MAX_FBX_BYTES','PAGE_SIZE=16'])assert(script.includes(source),source);
for(const source of ['all','mixamo','rokoko','other'])
 assert(studio.includes('data-source="'+source+'"'));
for(const expected of ['Rokoko','Mixamo','All packs'])
 assert(studio.includes(expected));
assert(script.includes("await importFiles([...e.target.files],{source:'rokoko'})"));
assert(script.includes('Core.sourceGroup(origin,name,source)'));
assert(script.includes('Core.packGroup(origin,name,provider)'));
assert(script.includes("source:provider,pack:"));
assert(script.includes('window.SkyClashStudioLiveBridge')===false);
assert(fs.existsSync(base+'/js/vendor/jszip.min.js'));
assert(fs.readFileSync(base+'/css/animation-studio.css','utf8').includes('@media(max-width:610px)'));
assert(index.includes('js/game.js?v=570'));
assert.equal(fs.readFileSync(base+'/js/game.js','utf8'),fs.readdirSync(base+'/src').filter(x=>x.endsWith('.js')).sort().map(x=>fs.readFileSync(base+'/src/'+x,'utf8')).join(''));
console.log('PASS V57 studio: naming, duplicate IDs, filtering, import, gallery, preview controls, responsive UI, gameplay-bundle unchanged');
