/* Match the public index build to the actual game boot, not a frozen
 * historical release number. Keep each older test's minimum supported
 * version while allowing later game releases without brittle CI failures.
 * The animation-studio.html historical version is intentionally separate.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
module.exports=function assertCurrentPublicBuild(html,minimum){
 assert.equal(typeof html,'string','Public game HTML must be text');
 assert(Number.isInteger(minimum)&&minimum>=1,'Historical minimum version required');
 const boot=fs.readFileSync(path.resolve(__dirname,'../js/v66-game-boot.js'),'utf8');
 const found=boot.match(/\bconst BUILD='V([0-9]+)'/);
 assert(found,'Game boot is missing its authoritative BUILD version');
 const actual=Number(found[1]);
 assert(actual>=minimum,
  'Game public build V'+actual+' predates tested historical feature V'+minimum);
 assert(html.includes('SKY CLASH · BUILD V'+found[1]),
  'Public index build label disagrees with js/v66-game-boot.js: V'+found[1]);
 return actual;
};
