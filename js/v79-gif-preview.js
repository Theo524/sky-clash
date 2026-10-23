/* Sky Clash V79 — deterministic animated GIF previews from Studio's
 * eight already-rendered FBX thumbnail frames. No CDN, upload, or external
 * GIF dependency. Fixed RGB332 palette keeps conversion fast for 230 clips.
 */
(function(root){
 'use strict';
 function u16(n){return [n&255,(n>>>8)&255];}
 function lzw(pixels,minCode=8){
  const clear=1<<minCode,end=clear+1;
  let dict=new Map(),next=end+1,width=minCode+1,bb=0,bits=0,bytes=[];
  function put(code){
   bb|=code<<bits;bits+=width;
   while(bits>=8){bytes.push(bb&255);bb>>>=8;bits-=8;}
  }
  put(clear);
  let word=String(pixels[0]||0);
  for(let i=1;i<pixels.length;i++){
   const k=pixels[i],candidate=word+','+k;
   if(dict.has(candidate)){word=candidate;continue;}
   const code=word.includes(',')?dict.get(word):Number(word);
   put(code);
   if(next<4096){
    dict.set(candidate,next++);
    if(next===(1<<width)&&width<12)width++;
   }else{
    put(clear);dict=new Map();next=end+1;width=minCode+1;
   }
   word=String(k);
  }
  put(word.includes(',')?dict.get(word):Number(word));put(end);
  if(bits)bytes.push(bb&255);
  return bytes;
 }
 function make(width,height,frames,delay=140){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>512||height>512||
     !Array.isArray(frames)||frames.length<2||frames.length>24)
   throw Error('GIF exporter requires 2–24 preview frames up to 512×512');
  const out=[71,73,70,56,57,97,...u16(width),...u16(height),0xf7,0,0];
  for(let r=0;r<8;r++)for(let g=0;g<8;g++)for(let b=0;b<4;b++)
   out.push(Math.round(r*255/7),Math.round(g*255/7),Math.round(b*255/3));
  out.push(0x21,0xff,11,...Array.from('NETSCAPE2.0').map(x=>x.charCodeAt(0)),3,1,0,0,0);
  for(const rgba of frames){
   if(rgba.length!==width*height*4)throw Error('Invalid GIF source frame dimensions');
   const indices=new Uint8Array(width*height);
   for(let i=0;i<indices.length;i++){
    const p=i*4;indices[i]=((rgba[p]>>>5)<<5)|((rgba[p+1]>>>5)<<2)|(rgba[p+2]>>>6);
   }
   out.push(0x21,0xf9,4,4,...u16(Math.max(2,Math.round(delay/10))),0,0);
   out.push(0x2c,...u16(0),...u16(0),...u16(width),...u16(height),0,8);
   const encoded=lzw(indices,8);
   for(let i=0;i<encoded.length;i+=255){const n=Math.min(255,encoded.length-i);out.push(n,...encoded.slice(i,i+n));}
   out.push(0);
  }
  out.push(0x3b);
  return new Uint8Array(out);
 }
 async function fromDataUrls(urls,width=176,height=126){
  if(!root.document||!root.Image)throw Error('GIF conversion needs a browser');
  const canvas=root.document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas not supported');
  const images=[];
  for(const src of urls){
   const img=new root.Image();
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Preview image did not decode'));img.src=src;});
   ctx.clearRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
   images.push(ctx.getImageData(0,0,width,height).data);
  }
  return new Blob([make(width,height,images)],{type:'image/gif'});
 }
 const api={make,lzw,fromDataUrls};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashGIFPreview=api;
})(typeof window!=='undefined'?window:globalThis);
