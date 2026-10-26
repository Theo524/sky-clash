/* Regression policy for assistant-driven quick real-Kairo visuals. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const code=fs.readFileSync('tools/capture-flight-video.cjs','utf8');
const quick=fs.readFileSync('.github/workflows/kairo-quick-flight-stills.yml','utf8');
const full=fs.readFileSync('.github/workflows/kairo-v159-vertical-flight.yml','utf8');
assert(code.includes("const captureMode=process.env.VISUAL_CAPTURE_MODE||'video'"));
assert(code.includes("const quickFrames=Object.freeze([10,24,29,34,40,44,48,55,59])"));
assert(code.includes('timeline.push(datum);')&&
 code.includes('if(quick&&!quickSet.has(i))continue;'),
 'Advance every animation tick, skipping only screenshot work');
assert(code.includes('realVRM:!!vrm?.humanoid')&&code.includes('webgl:!!gl'),
 'Use actual normalized Kairo VRM and real WebGL, no fake rig');
assert(code.includes("}else if(versions.length===2)")&&
 code.includes('compose(path.join(output'),
 'Keep full motion MP4 and A/B composing functional');
assert(code.includes('sampledFrames:quickFrames')&&
 code.includes("if(quick){"),'Quick mode exports full manifest');
assert(quick.includes('VISUAL_CAPTURE_MODE: stills')&&
 quick.includes("      - 'js/v100-pose-authority.js'"),
 'Quick actual-game capture must run automatically on current V100 edits');
assert(full.includes('  workflow_dispatch:'),'Full 24fps WebGL reviewer remains available');
assert(code.indexOf('if(quick){')<code.indexOf('}finally{await browser.close();}'),
 'Quick contact sheets must be assembled before browser closes');
assert(quick.includes('npx playwright install chromium')&&
 quick.includes('npx playwright install-deps chromium'),
 'Browser fast path must preserve a system dependency fallback');
assert(!quick.includes('npx playwright install --with-deps chromium'),
 'Quick preview must not run apt install unconditionally');
console.log('PASS 60-tick quick Kairo WebGL 3-view policy, original MP4 recording retained');
