/* V63 real baked motion regression: run with node tests/v63-live-motion.js */
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const THREE=require('../js/vendor/three.min.js');
const root=path.resolve(__dirname,'..');
const native=['hips','spine','spine1','spine2','neck','head','leftshoulder','leftarm','leftforearm','lefthand','rightshoulder','rightarm','rightforearm','righthand','leftupleg','leftleg','leftfoot','lefttoebase','rightupleg','rightleg','rightfoot','righttoebase'];
function makeFighter(){
 const bones=new Map(native.map(n=>[n,new THREE.Bone()]));
 const f={v62Master:{bones},animate(){this.proceduralTicks=(this.proceduralTicks||0)+1;},
   vel:new THREE.Vector3(),flying:false,launched:false,spiked:false,hp:100,
   attackSerial:1,punchT:0,attackElapsed:0,attackTotal:0.42,punchSide:1,attackKind:'punch',
   sprinting:false,dashing:false};
 return f;
}
(async function(){
 const fighter=makeFighter(),enemy=makeFighter();
 const windowObj={THREE,SkyClash:{Game:{heroes:{kairo_venn:fighter},enemy}}};
 const fetch=async u=>({ok:true,async text(){return fs.readFileSync(path.join(root,u.split('?')[0]),'utf8');}});
 const ctx={window:windowObj,location:{search:''},URLSearchParams,THREE,fetch,atob,console,
   Uint8Array,Int16Array,Math,Number,Set,Map,Promise};
 const script=fs.readFileSync(path.join(root,'js/v63-recorded-motion.js'),'utf8');
 vm.runInNewContext(script,ctx,{filename:'v63-recorded-motion.js'});
 await new Promise(resolve=>setImmediate(resolve));
 assert(windowObj.SkyClash.v63.ready,'V63 must load and decode real in-repo recordings');
 assert(fighter.v63Recorded&&enemy.v63Recorded,'Both Kairo and the rival get recorded motion');
 let idle=fighter.v62Master.bones.get('leftleg').quaternion.clone();
 for(let i=0;i<65;i++)fighter.animate(1/60);
 const idleLeg=fighter.v62Master.bones.get('leftleg').quaternion.clone();
 assert(fighter.v63Recorded.active==='mxKIdle','Idle should use recorded Mixamo guard');
 fighter.vel.z=7;
 for(let i=0;i<22;i++)fighter.animate(1/60);
 const step1=fighter.v62Master.bones.get('leftleg').quaternion.clone();
 for(let i=0;i<24;i++)fighter.animate(1/60);
 const step2=fighter.v62Master.bones.get('leftleg').quaternion.clone();
 assert(step1.angleTo(step2)>.02,'Walking must actually bend/animate the knee, not hold a fixed pose');
 fighter.sprinting=true;fighter.vel.z=15;
 for(let i=0;i<22;i++)fighter.animate(1/60);
 assert(fighter.v63Recorded.active==='sprint','Sprint should use the recorded motion');
 fighter.sprinting=false;fighter.vel.z=0;fighter.punchT=.42;fighter.attackSerial++;fighter.attackElapsed=.07;
 for(let i=0;i<8;i++){fighter.attackElapsed+=1/60;fighter.animate(1/60);}
 assert(fighter.v63Recorded.active==='mxKJab','Combat must use actual recorded Mixamo punch');
 fighter.punchT=0;for(let i=0;i<20;i++)fighter.animate(1/60);
 assert(fighter.v63Recorded.active==='mxKIdle','Strike should blend back into Mixamo idle');
 assert(fighter.proceduralTicks>0,'Gameplay physics/visual fallback must still update');
 assert(!windowObj.SkyClash.v63.error,'No playback exceptions');
 assert(idle.angleTo(idleLeg)>=0,'All recorded values stay finite');
 console.log('PASS: real baked Mixamo idle/strike, CC0 stride bending/sprint, two live master drivers and crossfade');
})().catch(e=>{console.error(e);process.exitCode=1;});
