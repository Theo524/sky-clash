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
assert.deepEqual(recorded.bones,NAMES,'Recorded 20-bone hierarchy differs from native');
const recordingBytes=Buffer.from(recorded.data,'base64');
assert.equal(recordingBytes.byteLength,recorded.frames*NAMES.length*4*2);
const recordingView=new DataView(recordingBytes.buffer,recordingBytes.byteOffset,recordingBytes.byteLength);
const sourceWorldDeltas=Array.from({length:recorded.frames},(_,f)=>
  Array.from({length:NAMES.length},(_,j)=>{
    const q=Array.from({length:4},(_,k)=>
      recordingView.getInt16(((f*NAMES.length+j)*4+k)*2,true)/32767);
    const length=Math.hypot(...q);
    return q.map(x=>x/length);
  }));
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
function rotateVec(q,v){
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const t=cross(q.slice(0,3),v).map(x=>2*x),c=cross(q.slice(0,3),t);
  return v.map((x,i)=>x+q[3]*t[i]+c[i]);
}
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
      // Match V72's canonical world-rest-delta rig calibration. All 20
      // sampled joints are interpreted together in FK, without an
      // intervening procedural fighter.animate() resetting the forearms.
      const saved=nodes.map(node=>node.quaternion.clone());
      for(const node of nodes)node.quaternion.identity();
      scene.updateMatrixWorld(true);
      const sceneQ=scene.getWorldQuaternion(new T.Quaternion());
      const invSceneQ=sceneQ.clone().invert();
      const bind=nodes.map(node=>invSceneQ.clone().multiply(
        node.getWorldQuaternion(new T.Quaternion())).normalize());
      const left=nodes[7].getWorldPosition(new T.Vector3());
      const right=nodes[11].getWorldPosition(new T.Vector3());
      const targetSide=left.sub(right).applyQuaternion(invSceneQ);
      targetSide.y=0;targetSide.normalize();
      const sideSrc=new T.Vector3(1,0,0);
      const angle=Math.atan2(sideSrc.z*targetSide.x-sideSrc.x*targetSide.z,
        sideSrc.x*targetSide.x+sideSrc.z*targetSide.z);
      const qBasis=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle);
      const qBasisInv=qBasis.clone().invert();
      nodes.forEach((node,i)=>node.quaternion.copy(saved[i]));
      scene.updateMatrixWorld(true);
      window.__v87Baker={p,h,nodes,rest,base,bind,qBasis,qBasisInv,scene,sceneQ,T};
      return {rest,base,rootHeight,qBasis:qBasis.toArray(),mappedSide:targetSide.toArray()};
    },{names:NAMES});
    const h0=rootAt(START);
    const rawFrames=[];
    for(let i=0;i<=Math.ceil(TOTAL*FPS);i++){
      const t=Math.min(TOTAL,i/FPS),progress=t/TOTAL;
      const sourceTime=START+(END-START)*progress;
      const sourceFrame=sourceTime*30;
      const lo=Math.floor(sourceFrame),hi=Math.min(sourceWorldDeltas.length-1,lo+1);
      const fraction=sourceFrame-lo;
      const current=await page.evaluate(({lo,hi,fraction,a,c})=>{
        const b=window.__v87Baker,T=b.T;
        const {nodes,scene,sceneQ,bind,qBasis,qBasisInv}=b;
        // Source quaternion interpolation is per-bone, while target
        // orientation is evaluated in the measured normalized VRM hierarchy.
        // No old animate() call and no procedural knees, ankles or hands.
        nodes.forEach(node=>node.quaternion.identity());
        scene.updateMatrixWorld(true);
        const delta=new T.Quaternion(),mapped=new T.Quaternion(),
          wanted=new T.Quaternion(),parent=new T.Quaternion();
        for(let j=0;j<nodes.length;j++){
          delta.slerpQuaternions(new T.Quaternion(...a[j]),
            new T.Quaternion(...c[j]),fraction).normalize();
          mapped.copy(qBasis).multiply(delta).multiply(qBasisInv);
          wanted.copy(sceneQ).multiply(mapped).multiply(bind[j]).normalize();
          nodes[j].parent.getWorldQuaternion(parent);
          nodes[j].quaternion.copy(parent.invert().multiply(wanted)).normalize();
          nodes[j].updateMatrixWorld(true);
        }
        return {quaternions:nodes.map(n=>n.quaternion.toArray())};
      },{lo,hi,fraction,a:sourceWorldDeltas[lo],c:sourceWorldDeltas[hi]});
      const h=rootAt(sourceTime);
      // The richer original archive also preserves normalized pelvis
      // translation. Rotate by the EXACT SAME basis as the FK source bones.
      const r=setup.rootHeight;
      const delta=rotateVec(setup.qBasis,h.map((x,j)=>(x-h0[j])*r));
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
    const transitions=rawFrames.slice(1).flatMap((f,i)=>
      f.quaternions.map((q,j)=>({bone:NAMES[j],frame:i+1,
        t0:rawFrames[i].time,t1:f.time,
        degrees:measureDegrees(q,rawFrames[i].quaternions[j])})));
    const worstSteps=transitions.sort((a,b)=>b.degrees-a.degrees).slice(0,15);
    const maxStep=worstSteps[0].degrees;
    if(maxStep>=80){
      fs.writeFileSync(path.join(OUT,'rejected-rotation-steps.json'),
        JSON.stringify({worstSteps,maxStep},null,2));
      console.error('REJECTED VRM high-velocity bone samples',JSON.stringify(worstSteps));
    }
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
