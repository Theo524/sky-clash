/* EXPERIMENT ONLY: bake V87 Side Kick's professional 20-bone performance
 * on the measured Kairo VRM, plus original src/41 pelvis trajectory.
 * Deliberately not a gameplay controller, does not modify original assets.
 * Reviews run on a temporary CI file copy; no deployment/commit of an
 * unreviewed candidate.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const OUT='visual-review-output/kairo-v87-side-kick-candidate';
fs.mkdirSync(OUT,{recursive:true});
const PACK='assets/animations/kairo/storm-fist.v3.json';
const SOURCE='src/41-mixamo-animations.js';
const NAMES=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json').bones;
const TOTAL=.87,IMPACT=.41;
const START=.20,END=1.68,FPS=60;
const sourceText=fs.readFileSync(SOURCE,'utf8');
const sourceMeta=JSON.parse(sourceText.match(/const meta = (\{[^\n]+\});/)[1]).mxRSideKick;
assert.equal(sourceMeta.source,'kicking/Side Kick.fbx');
assert.equal(sourceMeta.n,61);
const raw=sourceText.match(/const raw = '([^']+)';/)[1];
const bytes=Buffer.from(raw,'base64');
const rawView=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
const native=JSON.parse(fs.readFileSync(PACK,'utf8'));
const sourcePack=JSON.parse(fs.readFileSync('assets/animations/gameplay/v87-recorded-combat.json','utf8'));
const recorded=sourcePack.motions.find(m=>m.slot==='sideKick');
assert.equal(recorded.sourceId,'mxRSideKick');
assert.equal(recorded.sourceFile,sourceMeta.source);
const old=native.clips.find(c=>c.clipId==='side-kick');
assert(old,'Missing existing side kick');
assert.equal(native.clips.length,19,'No native clips may be dropped');
function rootAt(seconds){
  const frame=Math.max(0,Math.min(sourceMeta.n-1,seconds*30));
  const a=Math.floor(frame),b=Math.min(sourceMeta.n-1,a+1),u=frame-a;
  const out=[];
  for(let k=0;k<3;k++){
    const at=i=>rawView.getInt16((sourceMeta.o+i*91+88+k)*2,true)/10000;
    out.push(at(a)*(1-u)+at(b)*u);
  }
  return out;
}
function smooth01(v){v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);}
function measureDegrees(a,b){
  const d=Math.abs(a.reduce((n,x,i)=>n+x*b[i],0));
  return 2*Math.acos(Math.max(-1,Math.min(1,d)))*180/Math.PI;
}
function qBlend(a,b,t){
  let dot=a.reduce((n,x,i)=>n+x*b[i],0);
  let bq=dot<0?b.map(x=>-x):b.slice();dot=Math.abs(dot);
  if(dot>.9995){const q=a.map((x,i)=>x+(bq[i]-x)*t);const n=Math.hypot(...q);return q.map(x=>x/n);}
  const theta=Math.acos(Math.max(-1,Math.min(1,dot))),sn=Math.sin(theta);
  const w1=Math.sin((1-t)*theta)/sn,w2=Math.sin(t*theta)/sn;
  return a.map((x,i)=>x*w1+bq[i]*w2);
}
async function main(){
  const browser=await chromium.launch({headless:true,args:[
    '--no-sandbox','--enable-webgl','--use-gl=angle',
    '--use-angle=swiftshader','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:960,height:720}});
  try{
    const response=await page.goto('http://127.0.0.1:8765/?recordedCombat=on',
      {waitUntil:'domcontentloaded',timeout:180000});
    assert(response.ok());
    await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
      window.SkyClashPublishedActions?.ready&&
      window.SkyClashPublishedActions?.combatClips?.includes('sideKick')&&
      window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
      null,{timeout:180000});
    await page.locator('#trainBtn').click();
    await page.waitForFunction(()=>
      !document.getElementById('titleScreen').classList.contains('show'));
    const setup=await page.evaluate(({names})=>{
      const s=window.SkyClash,g=s.Game,p=g.player,T=window.THREE;
      if(p.characterId!=='kairo_venn')throw Error('Real Kairo required');
      if(window.SkyClashPublishedActions.nativeCombatSet)
        throw Error('Unexpected native preview controller');
      g.update=()=>{};s.CameraRig.update=()=>{};window.requestAnimationFrame=()=>0;
      p.reset();p.pos.set(0,p.floor,0);p.spawn.copy(p.pos);
      p.vel.set(0,0,0);p.moveIntent.set(0,0,0);p.facing=0;p.t=12;
      p.blockHeld=false;p.blocking=false;p.stun=0;p.downT=0;
      p.punchT=0;p.jumping=false;p.flying=false;p.attackAir=false;
      p.launched=false;p.spiked=false;p.acro=null;
      for(let n=0;n<90;n++)p.animate(1/60);
      const h=p.vrmRig.vrm.humanoid,nodes=names.map(n=>h.getNormalizedBoneNode(n));
      if(nodes.some(n=>!n))throw Error('Missing normalized VRM bone');
      const rest=nodes.map(n=>n.quaternion.toArray());
      const base=nodes[0].position.toArray();
      const scene=p.vrmRig.vrm.scene;
      const rootHeight=scene.worldToLocal(
        h.getNormalizedBoneNode('hips').getWorldPosition(new T.Vector3())
      ).y;
      p.attackKind='sideKick';p.attackSerial=122;
      p.punchT=9;p.attackElapsed=0;p.attackTotal=1;
      p.v72StudioPack.weight=1;
      window.__v87Baker={p,h,nodes,rest,base};
      return {rest,base,rootHeight};
    },{names:NAMES});
    const h0=rootAt(START);
    const rawFrames=[];
    for(let i=0;i<=Math.ceil(TOTAL*FPS);i++){
      const t=Math.min(TOTAL,i/FPS),progress=t/TOTAL;
      const current=await page.evaluate(({t,total})=>{
        const b=window.__v87Baker,p=b.p;
        p.punchT=9;p.attackElapsed=t;p.attackTotal=total;
        p.v72StudioPack.weight=1;
        p.animate(1/60);
        if(p.v72StudioPack.slot!=='sideKick')
          throw Error('SideKick recorded owner not active');
        return {quaternions:b.nodes.map(n=>n.quaternion.toArray()),
          hipLocal:b.nodes[0].position.toArray()};
      },{t,total:TOTAL});
      const sourceTime=START+(END-START)*progress;
      const h=rootAt(sourceTime);
      // src/41 Y-up motion is in source actor coordinates. V72 rotates
      // the source shoulder-side (+X) onto Kairo's measured shoulder-side
      // (-X), a 180-degree Y-axis basis change. Preserve that same basis
      // for the pelvis translation and scale normalized hip heights.
      const r=setup.rootHeight;
      const delta=[-(h[0]-h0[0])*r,(h[1]-h0[1])*r,-(h[2]-h0[2])*r];
      const weight=smooth01(t/.085)*smooth01((TOTAL-t)/.13);
      rawFrames.push({time:+t.toFixed(9),
        hipsPosition:setup.base.map((x,j)=>x+delta[j]*weight),
        quaternions:current.quaternions.map((q,j)=>qBlend(setup.rest[j],q,weight)),
        support:{left:t>.045&&t<TOTAL-.07,right:false}});
    }
    // Exact original standing entry and recovery; no change to guard asset.
    rawFrames[0].hipsPosition=setup.base.slice();
    rawFrames[0].quaternions=setup.rest.map(q=>q.slice());
    rawFrames[rawFrames.length-1].time=TOTAL;
    rawFrames[rawFrames.length-1].hipsPosition=setup.base.slice();
    rawFrames[rawFrames.length-1].quaternions=setup.rest.map(q=>q.slice());
    // No joint may reverse by an instantaneous 90+ degree timestep.
    const maxStep=Math.max(...rawFrames.slice(1).flatMap((f,i)=>
      f.quaternions.map((q,j)=>measureDegrees(q,rawFrames[i].quaternions[j]))));
    assert(maxStep<80,'Sampled VRM has snapping rotation: '+maxStep);
    const candidate={...old,durationSeconds:TOTAL,impactSeconds:IMPACT,
      frames:rawFrames};
    native.clips=native.clips.map(c=>c.clipId==='side-kick'?candidate:c);
    // Explicitly label this preview source, preserving the contract and 19
    // native clip IDs. This is a candidate, NOT aesthetic acceptance.
    native.revision='storm-fist-v3';
    native.sourceSha256=crypto.createHash('sha256').update(
      fs.readFileSync(SOURCE)).digest('hex');
    const file=path.join(OUT,'storm-fist-v3-side-kick-review-only.json');
    fs.writeFileSync(file,JSON.stringify(native)+'\n');
    const report={status:'UNAPPROVED_PRIVATE_CANDIDATE',
      source:'src/41-mixamo-animations.js',sourceFile:sourceMeta.source,
      sourceId:'mxRSideKick',sourceFrames:sourceMeta.n,sourceFps:30,
      preservedNativeClipIds:native.clips.map(c=>c.clipId),
      changedClipId:'side-kick',oldDuration:old.durationSeconds,
      newDuration:TOTAL,impact:IMPACT,sampledFrames:rawFrames.length,
      rawRootMotion:true,blendToOriginalGuard:true,
      rootHeight:setup.rootHeight,maxQuaternionStepDegrees:maxStep,
      supportWindows:'left plant; right strike; no dual-foot lock',
      caveat:'Candidate requires real Kairo front/side visual review; not production approved.'};
    fs.writeFileSync(path.join(OUT,'source-bake-report.json'),
      JSON.stringify(report,null,2)+'\n');
    console.log('BAKED UNAPPROVED V87 side kick: '+rawFrames.length+
      ' real VRM frames, max quaternion step '+maxStep.toFixed(2));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
