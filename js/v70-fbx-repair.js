/* Sky Clash V70 — preserve Mixamo FBX files while removing stray LF footer.
 * Some valid FBX Binary 7700 exports were packaged with one *extra* 0x0A
 * after the standard 16-byte footer magic. FBXLoader's fixed 160+16 footer
 * heuristic misidentifies a subset as another root node and throws
 * "THREE.FBXLoader: Unknown property type…".
 *
 * This removes ONLY the exact terminal magic + LF combination, from a COPY
 * passed to FBXLoader. Original FBX/ZIP bytes in the saved library are intact.
 */
(function(root){
 'use strict';
 const START=[75,97,121,100,97,114,97,32,70,66,88,32,66,105,110,97,114,121]; // Kaydara FBX Binary
 const TAIL=[0xf8,0x5a,0x8c,0x6a,0xde,0xf5,0xd9,0x7e,0xec,0xe9,0x0c,0xe3,0x75,0x8f,0x29,0x0b];
 function normalize(buffer){
  if(!(buffer instanceof ArrayBuffer))throw Error('FBX repair expects an ArrayBuffer');
  const bytes=new Uint8Array(buffer);
  if(bytes.length<200||bytes[bytes.length-1]!==0x0a)
   return {buffer,repaired:false};
  for(let i=0;i<START.length;i++)if(bytes[i]!==START[i])return {buffer,repaired:false};
  for(let i=0;i<TAIL.length;i++)if(bytes[bytes.length-17+i]!==TAIL[i])return {buffer,repaired:false};
  // Safe: byte is outside the final 16-byte footer marker, not keyframe data.
  return {buffer:buffer.slice(0,buffer.byteLength-1),repaired:true};
 }
 const api={normalize,version:'70.0'};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashFBXRepair=api;
})(typeof window!=='undefined'?window:globalThis);
