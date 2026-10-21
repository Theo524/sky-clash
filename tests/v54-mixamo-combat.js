const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/40-recorded-animations.js'),'utf8');
const mixamo=fs.readFileSync(path.join(root,'src/41-mixamo-animations.js'),'utf8');
const bundled=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(index.includes('js/game.js?v=560'));
assert(bundled.includes('const SkyClashMixamo = (() => {'));
assert(!bundled.includes('Sky Clash V54 — NOT BUILT'));
assert.strictEqual(bundled,fs.readdirSync(path.join(root,'src')).filter(x=>x.endsWith('.js')).sort().map(x=>fs.readFileSync(path.join(root,'src',x),'utf8')).join(''));
const ctx={console,atob,Uint8Array,Int16Array,Float32Array,Math};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/vendor/three.min.js'),'utf8'),ctx);
vm.runInContext('const V3=THREE.Vector3;const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)); const damp=(r,t)=>1-Math.exp(-r*t);const smooth01=x=>{x=clamp(x,0,1);return x*x*(3-2*x)}; const ID_Q=new THREE.Quaternion();',ctx);
vm.runInContext(source,ctx);
vm.runInContext(mixamo,ctx);
let result=vm.runInContext(`(()=>{
 const report=[]; const A=Anim; const names=Object.keys(SkyClashMixamo.clips); let maxNormError=0;
 for(const name of names){
   const c=A.clip(name);if(c.n<3 || c.d<=0 || c.d>12) throw new Error('bad clip '+name);
   const a=A.pose(),b=A.pose();
   A.sample(name,0,false,a);A.sample(name,c.d*0.41,false,b);
   for(let i=0;i<A.NB;i++){
     const q=a.q[i];if(!Number.isFinite(q.x+q.y+q.z+q.w))throw new Error('nonfinite '+name);
     maxNormError=Math.max(maxNormError,Math.abs(1-q.length()));
   }
   if(!Number.isFinite(a.h.x+a.h.y+a.h.z) || !Number.isFinite(b.h.x+b.h.y+b.h.z))throw new Error('hip '+name);
   report.push(name);
 }
 // Old CC0 animations remain fully available and unmodified.
 A.sample('qHook',0.15,false,A.pose());A.sample('walk',0.2,true,A.pose());
 // Bind-axis regression: Mixamo FBX uses extrinsic xyz. The incorrect
 // intrinsic XYZ import once twisted the elbows around their long axes.
 // For a correctly retargeted boxing guard, elbow flexion is predominantly Y.
 for (const name of ['mxKIdle','mxRNinjaIdle']) {
   const P=A.sample(name,0,false,A.pose());
   for(const [upper,lower] of [[7,8],[11,12]]){
     const local=P.q[upper].clone().invert().multiply(P.q[lower]);
     if(!(Math.abs(local.y)>Math.abs(local.x)*2.5)){
       throw new Error(name+' elbow retarget axis mismatch: '+JSON.stringify(local));
     }
   }
 }
 const rig={ f:{characterId:'kairo_venn',attackKind:'punch',punchSide:1,attackSerial:13,punchT:0.42,attackTotal:0.42,attackElapsed:0,kickPend:{t:0.15}},vrm:{humanoid:{getNormalizedBoneNode:()=>null}} };
 const layer=new AnimLayer(rig);if(!layer.playStrike()||layer.one.name!=='mxKJab'||!layer.one.sync)throw Error('Kairo strike not bound');
 const kairoHit=layer.one.sync.hitAt;
 rig.f.characterId='rin_sable';rig.f.attackKind='ninjaSpin';rig.f.attackSerial=14;rig.f.attackTotal=0.51;rig.f.punchT=0.51;rig.f.kickPend={t:0.22};
 if(!layer.playStrike()||layer.one.name!=='mxRRoundhouse'||layer.one.mask!==null)throw Error('Rin spinning kick not bound');
 return {numClips:names.length,maxNormError,kairoHit,kairoSample:report.slice(0,5),rinKick:layer.one.name};
 })()`,ctx);
assert.strictEqual(result.numClips,28);
assert(result.maxNormError<1e-5);
for(const name of ['mxKJab','mxKHook','mxRRoundhouse','mxRNinjaIdle','mxRDodgeArc'])assert(mixamo.includes(name));
for(const legacy of ['ninjaPalm','ninjaElbow','ninjaSpin','ninjaRising','skyUppercut','fallingFist'])assert(bundled.includes(legacy));
console.log('V54 FBX bake, 28 registered clips, quaternion interpolation, fallback clips, both combat styles and matching deployment bundle verified',result);
