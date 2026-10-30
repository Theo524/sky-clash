/* V69 regression: fake IndexedDB proves imported ZIP/FBX sources reopen with
 * stable identities; no server upload, no duplicated extracts and clear works.
 */
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const code=fs.readFileSync(path.join(__dirname,'../js/v69-motion-library.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../animation-studio.html'),'utf8');
const studio=fs.readFileSync(path.join(__dirname,'../js/animation-studio.js'),'utf8');
assert(html.includes('js/v69-motion-library.js?v=691'));
assert(/js\/animation-studio\.js\?v=\d+/.test(html),'Expected a cache-busted studio script');
assert(html.includes('id="savedLibraryStatus"'));
assert(html.includes('id="clearSavedLibrary"'));
assert(studio.includes('restoreMotionLibrary();'));
assert(studio.includes('await MotionLibrary.save(file,{source:fileSource})'));
assert(studio.includes("const originals=await MotionLibrary.list()"));
assert(studio.includes('explainFBXError(e)'));
assert(studio.includes('const result=await MotionLibrary.save(file,{source:fileSource})'));
assert(studio.includes("if(addedForFile&&!restored&&MotionLibrary)"),'restoring must not duplicate cached packs');
assert(studio.includes("origin:file.name"),'ZIP animation catalog origin must retain source filename');
assert(studio.includes("crc:ent._data?.crc32||''"),'ZIP entries keep original CRC to reconnect saved actions');
function fakeDB(){
 const data=new Map();
 return {
  open(){
   const req={};
   setImmediate(()=>{
    const db={
     objectStoreNames:{contains:()=>true},
     transaction(_store,_mode){
      const tx={oncomplete:null,onerror:null,onabort:null};
      const finish=(r,result)=>{
       setImmediate(()=>{
        if(r){r.result=result;r.onsuccess?.();}
        setImmediate(()=>tx.oncomplete?.());
       });
      };
      tx.objectStore=()=>({
       getAll(){const r={};finish(r,[...data.values()]);return r;},
       put(value){data.set(value.id,value);finish();},
       clear(){data.clear();finish();}
      });
      tx.abort=()=>{tx.onabort?.();};
      return tx;
     },
     close(){}
    };
    req.result=db;req.onsuccess?.();
   });
   return req;
  }
 };
}
(async()=>{
 const context={window:{indexedDB:fakeDB()},console,Date,File,Blob,Promise,Error,Math};
 vm.runInNewContext(code,context,{filename:'v69-motion-library.js'});
 const library=context.window.SkyClashMotionLibrary;
 assert(library,'cache API exists');
 assert.strictEqual((await library.list()).length,0);
 const zip=new File([new Uint8Array([1,2,3,4,5])],'mma-movements.zip',{lastModified:1111});
 const fbx=new File([new Uint8Array([9,8,7])],'boxing.fbx',{lastModified:2222});
 const rokoko=new File([new Uint8Array([4,3,2])],'Superhero.zip',{lastModified:3333});
 let r=await library.save(zip);
 assert.strictEqual(r.saved,true);
 r=await library.save(zip);
 assert.strictEqual(r.saved,false,'duplicate ZIP must not waste browser space');
 await library.save(fbx);
 await library.save(rokoko,{source:'rokoko'});
 assert.strictEqual((await library.info()).count,3);
 assert.strictEqual((await library.info()).bytes,11);
 // Simulate a brand-new studio instance reading the stored source blobs.
 const restored=await library.list();
 assert.deepStrictEqual(restored.map(f=>f.name),['mma-movements.zip','boxing.fbx','Superhero.zip']);
 assert.strictEqual(restored[2].skyClashSource,'rokoko');
 const again=await library.save(rokoko,{source:'rokoko'});
 assert.strictEqual(again.saved,false,'Same archive must not duplicate cached content');
 await library.save(fbx,{source:'rokoko'});
 assert.strictEqual((await library.list())[1].skyClashSource,'rokoko',
  'Explicit source classification should be recoverable for existing cached files');
 assert.strictEqual(restored[0].lastModified,1111);
 assert.strictEqual(restored[0].size,zip.size);
 assert.strictEqual(library.key(restored[0]),library.key(zip),'IDs stable after browser restart');
 assert.deepStrictEqual([...new Uint8Array(await restored[0].arrayBuffer())],[1,2,3,4,5]);
 await library.clear();
 assert.strictEqual((await library.list()).length,0,'cleared library must be empty');
 console.log('PASS: offline FBX/ZIP persistence, stable action IDs, independent Rokoko source metadata, no duplicate imports');
})().catch(e=>{console.error(e);process.exitCode=1;});
