/* No heavy Sky Clash visual workflow may accidentally run on ALL PRs.
 * Empty pull_request.paths YAML maps to an ineffective filter and can
 * cause two 48-frame moving-jump videos on unrelated documentation edits.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const dir='.github/workflows';
const workflows=fs.readdirSync(dir).filter(n=>n.endsWith('.yml'));
for(const name of workflows){
 const text=fs.readFileSync(dir+'/'+name,'utf8');
 // If a pull_request event uses paths filtering, require >=1 pattern.
 const match=text.match(/^  pull_request:\s*\n([\s\S]*?)(?=^  (?:push|workflow_dispatch|workflow_call|schedule|repository_dispatch):|^permissions:|^jobs:|\Z)/m);
 if(!match)continue;
 const block=match[1],hasPaths=/^    paths:\s*$/m.test(block);
 if(hasPaths){
  const pathLines=block.split('\n').filter(x=>/^      - ['"]?[^'"\s]/.test(x));
  assert(pathLines.length>0,name+': never leave a blank pull_request.paths block');
 }
}
const jump=fs.readFileSync(dir+'/moving-jump-visual-review.yml','utf8');
assert(jump.includes('  workflow_dispatch:'),'Keep user/manual moving-jump capture available');
assert(!jump.includes('  pull_request:'),'Moving-jump WebGL study must not run for every PR');
console.log('PASS:',workflows.length,'workflow trigger filters are nonempty, moving jump requires manual review');
