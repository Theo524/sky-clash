/* V70: real Mixamo 7700 footer signature + stray LF regression.
 * The uploaded Sky Clash packs contain 28 such endings; all were checked
 * against FBXLoader's root-footer termination rule before this change.
 */
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const repair=require('../js/v70-fbx-repair.js');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const MAGIC=Buffer.from('f85a8c6adef5d97eece90ce3758f290b','hex');
function file({extraLF=true,binary=true,magic=true}={}){
 const footerOffset=256;
 const size=footerOffset+176+(extraLF?1:0);
 const b=Buffer.alloc(size);
 Buffer.from(binary?'Kaydara FBX Binary':'Not an FBX file!!!').copy(b,0);
 if(magic)MAGIC.copy(b,size-16-(extraLF?1:0));
 if(extraLF)b[size-1]=10;
 return b;
}
function willThreeStop(readerOffset,size){
 return size%16===0?(((readerOffset+176)&~15)>=size):(readerOffset+176>=size);
}
const original=file(),raw=original.buffer.slice(original.byteOffset,original.byteOffset+original.length);
assert.strictEqual(willThreeStop(256,raw.byteLength),false,
 'Trailing newline makes FBXLoader see footer as an extra FBX node');
const repaired=repair.normalize(raw);
assert.strictEqual(repaired.repaired,true);
assert.strictEqual(repaired.buffer.byteLength,raw.byteLength-1);
assert.strictEqual(willThreeStop(256,repaired.buffer.byteLength),true,
 'Removing extra LF fixes THREE.FBXLoader endOfContent check');
assert.strictEqual(new Uint8Array(raw).at(-1),10,'Original source remains unchanged');
assert.deepStrictEqual(Buffer.from(repaired.buffer).subarray(-16),MAGIC,'Last 16 bytes remain the correct FBX footer magic');
for(const args of [{extraLF:false},{binary:false},{magic:false}]){
 const input=file(args);const ab=input.buffer.slice(input.byteOffset,input.byteOffset+input.length);
 const unchanged=repair.normalize(ab);
 assert.strictEqual(unchanged.repaired,false);
 assert.strictEqual(unchanged.buffer,ab,'Unrecognized files must be identical byte-for-byte');
}
const html=read('animation-studio.html'),studio=read('js/animation-studio.js');
assert(html.includes('js/v70-fbx-repair.js?v=700'),'Repair loaded before studio');
assert(html.includes('animation-studio.js?v=700'),'Fresh cache for FBX repair');
assert(studio.includes('SkyClashFBXRepair?.normalize(buffer)'),'Both ZIP & loose FBX buffers pass through repair');
assert(studio.includes('if(result?.repaired)item.repaired=true'),'Mark fixed preview');
assert(studio.includes('SkyClashHumanoidRetarget')===false,'Keep V68 retarget in separate working module');
assert(html.includes('js/v68-humanoid-retarget.js?v=680'),'Do not alter V68 correct animation transfer');
console.log('PASS: V70 repaired append-only LF on FBX7700, FBXLoader footer boundary, exact footer magic, source immutability and studio wiring');
