/* Bake the recovered Blender world-delta transport on Kairo's real VRM.
 * This extends verify-kairo-original-jab.cjs's offline conversion/foot solve;
 * it never installs another runtime animation owner. Kung fu revision 2
 * includes the reauthored jab; the old jab file remains historical rollback.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const OUT=path.resolve('visual-review-output/kairo-combat-foundation');
const sourcePath=path.join(OUT,'blender-storm-fist.json');
const sourceBytes=fs.readFileSync(sourcePath),source=JSON.parse(sourceBytes);
const mf=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json');
const anchorBytes=fs.readFileSync(path.join(OUT,'kairo-combat-anchor.json'));
const anchor=JSON.parse(anchorBytes);
const jab=require('../assets/animations/kairo/original-jab-playtest.v1.json');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const modelHash=hash(fs.readFileSync('assets/characters/kairo.vrm'));
assert.equal(source.schema,'sky-clash.kairo-storm-fist-dcc.v1');
assert.equal(source.modelSha256,modelHash);assert.equal(modelHash,mf.modelSha256);
assert.equal(source.rigSignature,mf.rigSignature);
assert.equal(source.anchorSha256,hash(anchorBytes));
assert.deepEqual(source.bones,mf.bones);assert.deepEqual(source.parents,mf.parents);
assert(Array.isArray(source.clips)&&source.clips.length>0);
assert.equal(new Set(source.clips.map(c=>c.clipId)).size,source.clips.length);
for(const clip of source.clips){
 assert(clip.clipId!=='original-jab'||['kung-fu-v2','storm-fist-v3'].includes(source.revision),
  'Only the explicitly authorized kung fu revision may replace the jab');
 assert(clip.durationSeconds>0&&clip.durationSeconds<4);
 assert(clip.samples.length>=2);
 assert(Math.abs(clip.samples[0].timeSeconds)<1e-8);
 assert(Math.abs(clip.samples.at(-1).timeSeconds-clip.durationSeconds)<1e-8);
 let previous=-1;
 for(const sample of clip.samples){
  assert(sample.timeSeconds>previous);previous=sample.timeSeconds;
  assert.equal(sample.deltasWXYZ.length,mf.bones.length);
  for(const q of sample.deltasWXYZ)
   assert(q.length===4&&q.every(Number.isFinite)&&Math.abs(Math.hypot(...q)-1)<1e-5);
  for(const name of mf.bones)
   assert(sample.jointPositionsGame[name]?.length===3&&sample.jointPositionsGame[name].every(Number.isFinite));
 }
}

async function main(){
 const launch={headless:true,args:['--no-sandbox',
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']};
 const chromiumPath=process.env.CHROMIUM_PATH||'/usr/bin/chromium';
 if(fs.existsSync(chromiumPath))launch.executablePath=chromiumPath;
 const browser=await chromium.launch(launch);
 try{
  const page=await browser.newPage({viewport:{width:800,height:600}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+(process.env.VISUAL_PORT||8765)+'/index.html',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY&&
   window.SkyClashPublishedActions?.ready&&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,null,{timeout:180000});
  await page.locator('#trainBtn').click();
  const baked=await page.evaluate(({source,anchor})=>{
   const s=window.SkyClash,g=s.Game,p=g.player,T=window.THREE;
   g.enterDojo();g.introT=0;g.update=()=>{};s.CameraRig.update=()=>{};
   window.requestAnimationFrame=()=>0;
   p.reset();p.pos.set(0,p.floor,0);p.vel.set(0,0,0);
   p.moveIntent.set(0,0,0);p.facing=0;p.punchT=0;
   p.blockHeld=false;p.blocking=false;p.t=12;
   for(let i=0;i<90;i++)p.animate(1/60);
   if(p.characterId!=='kairo_venn'||!p.v72StudioPack||!p.v81PoseTransitions)
    throw Error('Original Kairo playback stack unavailable');
   const rig=p.vrmRig.vrm,h=rig.humanoid,scene=rig.scene,names=source.bones;
   const nodes=names.map(name=>h.getNormalizedBoneNode(name));
   if(nodes.some(node=>!node))throw Error('Missing normalized Kairo joints');
   nodes.forEach((node,i)=>node.quaternion.fromArray(anchor.joints[i].localQuaternion));
   nodes[0].position.fromArray(anchor.joints[0].localPosition);
   rig.update(0);scene.updateMatrixWorld(true);
   const saved=nodes.map(node=>node.quaternion.clone());
   const world=nodes.map(node=>node.getWorldQuaternion(new T.Quaternion()));
   const qScene=scene.getWorldQuaternion(new T.Quaternion());
   const invScene=qScene.clone().invert();
   const inverse=scene.matrixWorld.clone().invert();
   const C=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
   const invC=C.clone().invert();
   const at=name=>h.getNormalizedBoneNode(name).getWorldPosition(new T.Vector3());
   const restore=()=>{
    nodes.forEach((node,i)=>node.quaternion.copy(saved[i]));
    nodes[0].position.fromArray(anchor.joints[0].localPosition);
    rig.update(0);scene.updateMatrixWorld(true);
   };
   const clips=[],reports=[];
   for(const clip of source.clips){
    let maxFootResidual=0,maxLegCorrection=0,maxTransfer=0,maxPathError=0;
    let worstKneeStep=0,expectedKneeStep=0;
    const frames=[];let previousKnees=null,previousSource=null;
    for(const sample of clip.samples){
     restore();
     const sourcePosition=name=>new T.Vector3().fromArray(sample.jointPositionsGame[name]);
     const hipWorld=sourcePosition('hips').applyMatrix4(scene.matrixWorld);
     nodes[0].position.copy(nodes[0].parent.worldToLocal(hipWorld));
     scene.updateMatrixWorld(true);
     const wants=[];
     for(let i=0;i<nodes.length;i++){
      const a=sample.deltasWXYZ[i];
      const delta=new T.Quaternion(a[1],a[2],a[3],a[0]).normalize();
      const model=C.clone().multiply(delta).multiply(invC);
      const want=qScene.clone().multiply(model).multiply(invScene).multiply(world[i]).normalize();
      wants.push(want);
      scene.updateMatrixWorld(true);
      const par=nodes[i].parent.getWorldQuaternion(new T.Quaternion());
      nodes[i].quaternion.copy(par.invert().multiply(want)).normalize();
     }
     rig.update(0);scene.updateMatrixWorld(true);
     for(let i=0;i<nodes.length;i++)maxTransfer=Math.max(maxTransfer,
      nodes[i].getWorldQuaternion(new T.Quaternion()).angleTo(wants[i]));
     for(const side of ['left','right']){
      const foot=h.getNormalizedBoneNode(side+'Foot');
      const goal=sourcePosition(side+'Foot').applyMatrix4(scene.matrixWorld);
      const sole=foot.getWorldQuaternion(new T.Quaternion());
      const thigh=h.getNormalizedBoneNode(side+'UpperLeg');
      const shin=h.getNormalizedBoneNode(side+'LowerLeg');
      const beforeThigh=thigh.quaternion.clone(),beforeShin=shin.quaternion.clone();
      const rotate=joint=>{
       scene.updateMatrixWorld(true);
       const pivot=joint.getWorldPosition(new T.Vector3());
       const from=at(side+'Foot').sub(pivot),to=goal.clone().sub(pivot);
       if(from.lengthSq()<1e-9||to.lengthSq()<1e-9)return;
       const q=new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
       const angle=q.angleTo(new T.Quaternion());
       if(angle>.23)q.slerpQuaternions(new T.Quaternion(),q,.23/angle);
       const want=q.multiply(joint.getWorldQuaternion(new T.Quaternion()));
       const parent=joint.parent.getWorldQuaternion(new T.Quaternion());
       joint.quaternion.copy(parent.invert().multiply(want)).normalize();
       scene.updateMatrixWorld(true);
      };
      for(let n=0;n<45;n++){
       if(at(side+'Foot').distanceTo(goal)<.0007)break;
       rotate(shin);rotate(thigh);
      }
      foot.quaternion.copy(foot.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(sole)).normalize();
      rig.update(0);scene.updateMatrixWorld(true);
      maxFootResidual=Math.max(maxFootResidual,at(side+'Foot').distanceTo(goal));
      maxLegCorrection=Math.max(maxLegCorrection,
       T.MathUtils.radToDeg(beforeThigh.angleTo(thigh.quaternion)),
       T.MathUtils.radToDeg(beforeShin.angleTo(shin.quaternion)));
     }
     const positions=Object.fromEntries(names.map(name=>[name,at(name).applyMatrix4(inverse).toArray()]));
     for(const name of names)maxPathError=Math.max(maxPathError,
      new T.Vector3().fromArray(positions[name]).distanceTo(sourcePosition(name)));
     const knees=['leftLowerLeg','rightLowerLeg'].map(name=>at(name));
     if(previousKnees)for(let i=0;i<2;i++){
      const name=['leftLowerLeg','rightLowerLeg'][i];
      worstKneeStep=Math.max(worstKneeStep,knees[i].distanceTo(previousKnees[i]));
      expectedKneeStep=Math.max(expectedKneeStep,sourcePosition(name)
       .distanceTo(new T.Vector3().fromArray(previousSource.jointPositionsGame[name]))*
       Math.max(...anchor.rootScale));
     }
     previousKnees=knees;previousSource=sample;
     const frame={time:sample.timeSeconds,quaternions:nodes.map(node=>node.quaternion.toArray()),
      hipsPosition:nodes[0].position.toArray(),feet:{leftFoot:positions.leftFoot,rightFoot:positions.rightFoot}};
     if(sample.support)frame.support=sample.support;
     else if(sample.feet)frame.support={
      left:!!(sample.feet.left?.grounded??sample.feet.leftFoot?.grounded),
      right:!!(sample.feet.right?.grounded??sample.feet.rightFoot?.grounded)};
     frames.push(frame);
    }
    const {samples,...metadata}=clip;
    clips.push({...metadata,frames});
    reports.push({clipId:clip.clipId,frames:frames.length,maxFootResidual,maxLegCorrection,
     maxTransfer,maxPathError,worstKneeStep,expectedKneeStep});
   }
   restore();
   return {clips,reports};
  },{source,anchor});
  assert.deepEqual(errors,[]);
  for(const report of baked.reports){
   assert(report.maxTransfer<1e-5,report.clipId+': quaternion transport mismatch');
   assert(report.maxFootResidual<.004,report.clipId+': foot target drift '+report.maxFootResidual);
   assert(report.maxLegCorrection<10,report.clipId+': excessive foot correction '+report.maxLegCorrection);
   assert(report.maxPathError<.004,report.clipId+': joint path mismatch '+report.maxPathError);
   assert(report.worstKneeStep<=report.expectedKneeStep+.008,report.clipId+': knee trajectory mismatch');
  }
  const reauthoredJab=['kung-fu-v2','storm-fist-v3'].includes(source.revision);
  const pack={schema:'sky-clash.native-combat-set.v1',status:'EXPERIMENTAL_PLAYTEST',
   characterId:'kairo_venn',modelSha256:modelHash,rigSignature:mf.rigSignature,bones:mf.bones,
   revision:source.revision||'storm-fist-v1',
   sourceSha256:hash(sourceBytes),historicalJabSha256:hash(fs.readFileSync('assets/animations/kairo/original-jab-playtest.v1.json')),
   clips:reauthoredJab?baked.clips:[jab,...baked.clips]};
  if(!reauthoredJab)assert.deepEqual(pack.clips[0].frames,jab.frames);
  fs.writeFileSync(source.revision==='storm-fist-v3'?'assets/animations/kairo/storm-fist.v3.json':'assets/animations/kairo/storm-fist.v1.json',JSON.stringify(pack)+'\n');
  fs.writeFileSync(path.join(OUT,'storm-fist-bake-report.json'),JSON.stringify({
   schema:'sky-clash.kairo-storm-fist-bake-report.v1',sourceSha256:pack.sourceSha256,
   revision:pack.revision,historicalJabSha256:pack.historicalJabSha256,clips:baked.reports},null,2)+'\n');
  console.log('PASS KAIRO_STORM_FIST_BAKE '+JSON.stringify({clips:pack.clips.length,
   frames:pack.clips.reduce((n,c)=>n+c.frames.length,0),
   maxFootResidual:Math.max(...baked.reports.map(r=>r.maxFootResidual)),
   maxPathError:Math.max(...baked.reports.map(r=>r.maxPathError)),reauthoredJab}));
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
