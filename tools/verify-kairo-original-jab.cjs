/* Private full-Kairo WebGL preview of a truly new Blender IK jab.
 * No runtime animation code, default stance, or physics are changed.
 * Captures review screenshots, test-only pose trace at 30/60/120Hz.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const OUT=path.resolve('visual-review-output/kairo-combat-foundation');
const source=JSON.parse(fs.readFileSync(path.join(OUT,'blender-original-jab-blockout.json'),'utf8'));
const mf=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json');
const modelHash=crypto.createHash('sha256').update(fs.readFileSync('assets/characters/kairo.vrm')).digest('hex');
assert.equal(source.schema,'sky-clash.kairo-original-jab-dcc-blockout.v1');
assert.equal(source.status,'UNAPPROVED_OFFLINE_CHOREOGRAPHY');
assert.equal(source.modelSha256,modelHash);assert.equal(source.rigSignature,mf.rigSignature);
assert.deepEqual(source.bones,mf.bones);assert.deepEqual(source.parents,mf.parents);
assert.equal(source.samples.length,35);
assert(Math.abs(source.impactSeconds-.24)<1e-10);
assert(Math.abs(source.durationSeconds-.55)<1e-10);
assert(source.samples.some(s=>s.phase==='contact'&&Math.abs(s.timeSeconds-.24)<1e-10));
assert(source.maxSourceFootDrift<.003);
for(const s of source.samples)assert(s.deltasWXYZ.length===20&&
 s.deltasWXYZ.every(q=>q.length===4&&q.every(Number.isFinite)&&Math.abs(Math.hypot(...q)-1)<1e-5));
async function main(){
 const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1080,height:720}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,500));});
 try{
  await page.goto('http://127.0.0.1:'+(process.env.VISUAL_PORT||'8765')+'/index.html',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.SKY_V104_ANIMATIONS_READY &&
   window.SkyClashPublishedActions?.ready &&
   window.SkyClash?.Game?.player?.vrmRig?.vrm?.humanoid,
   null,{timeout:180000});
  // Enter through the REAL menu button. Calling g.enterDojo() alone
  // left the main-menu overlay in front of the game in earlier evidence.
  await page.locator('#trainBtn').click();
  await page.waitForFunction(()=>{
   const menu=document.getElementById('titleScreen');
   return menu && !menu.classList.contains('show');
  },null,{timeout:20000});
  const setup=await page.evaluate(()=>{
   const s=window.SkyClash,g=s.Game,p=g.player,T=window.THREE;
   g.enterDojo();g.introT=0;g.update=()=>{};s.CameraRig.update=()=>{};
   p.reset();p.pos.set(0,p.floor,0);p.vel.set(0,0,0);
   p.moveIntent.set(0,0,0);p.facing=0;p.punchT=0;p.blockHeld=false;
   for(let i=0;i<90;i++)p.animate(1/60);
   if(p.characterId!=='kairo_venn'||!p.v72StudioPack||!p.v81PoseTransitions||
     !window.SkyClashV100Animator)throw Error('Actual original Kairo stack not loaded');
   const cv=document.querySelector('canvas');
   if(!(cv?.getContext('webgl2')||cv?.getContext('webgl')))
    throw Error('No real WebGL canvas');
   const rig=p.vrmRig.vrm,h=rig.humanoid,scene=rig.scene;
   scene.updateMatrixWorld(true);
   const names=['hips','spine','chest','upperChest','neck','head',
    'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
    'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
    'leftUpperLeg','leftLowerLeg','leftFoot',
    'rightUpperLeg','rightLowerLeg','rightFoot'];
   const nodes=names.map(n=>h.getNormalizedBoneNode(n));
   if(nodes.some(n=>!n))throw Error('Missing real source-normalized bone');
   const saved=nodes.map(n=>n.quaternion.clone());
   const world=nodes.map(n=>n.getWorldQuaternion(new T.Quaternion()));
   const basePos=Object.fromEntries(['leftFoot','rightFoot','leftHand',
    'rightHand','hips','head'].map(n=>[
      n,h.getNormalizedBoneNode(n).getWorldPosition(new T.Vector3()).toArray()]));
   // Close, review-only camera independent of the approved camera system:
   // freeze CameraRig.update above, never change shipped camera defaults.
   const cam=s.camera;
   if(!cam?.isPerspectiveCamera)throw Error('Expected real game camera');
   cam.position.set(p.pos.x+1.6,p.pos.y+1.65,p.pos.z-3.2);
   cam.lookAt(p.pos.x,p.pos.y+1.12,p.pos.z);
   cam.fov=42;cam.updateProjectionMatrix();
   // Store unmodified Game references inside private page-only test state.
   window.__kairoJabProof={g,p,T,s,rig,h,scene,names,nodes,saved,world,basePos};
   const menu=document.getElementById('titleScreen');
   if(menu?.classList.contains('show'))throw Error('Main menu still hides Kairo');
   return {realKairo:true,realWebGL:true,menuHidden:true};
  });
  assert(setup.realKairo&&setup.realWebGL&&setup.menuHidden);
  async function apply(t){
   return page.evaluate(({t,source})=>{
    const st=window.__kairoJabProof,{T,rig,h,scene,nodes,saved,world,basePos}=st;
    const foot=n=>h.getNormalizedBoneNode(n);
    const vec=a=>new T.Vector3().fromArray(a);
    const at=(n)=>foot(n).getWorldPosition(new T.Vector3());
    const restore=()=>{
     nodes.forEach((node,i)=>node.quaternion.copy(saved[i]));
     rig.update(0);scene.updateMatrixWorld(true);
    };
    const steps=source.samples;
    let hi=steps.findIndex(x=>x.timeSeconds>=t-1e-10);
    if(hi<0)hi=steps.length-1;
    const lo=Math.max(0,hi-1);
    const a=steps[lo],b=steps[hi];
    const p=Math.max(0,Math.min(1,(t-a.timeSeconds)/
      Math.max(1e-12,b.timeSeconds-a.timeSeconds)));
    const deltas=a.deltasWXYZ.map((q,i)=>{
     const r=b.deltasWXYZ[i];
     return new T.Quaternion(q[1],q[2],q[3],q[0]).normalize()
      .slerp(new T.Quaternion(r[1],r[2],r[3],r[0]).normalize(),p);
    });
    restore();
    const C=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
    const qScene=scene.getWorldQuaternion(new T.Quaternion());
    const invScene=qScene.clone().invert();
    let maxTransferError=0;
    const targets=[];
    for(let i=0;i<nodes.length;i++){
     const model=C.clone().multiply(deltas[i]).multiply(C.clone().invert());
     const want=qScene.clone().multiply(model).multiply(invScene)
      .multiply(world[i]).normalize();
     targets.push(want);
     scene.updateMatrixWorld(true);
     const par=nodes[i].parent.getWorldQuaternion(new T.Quaternion());
     nodes[i].quaternion.copy(par.invert().multiply(want)).normalize();
    }
    rig.update(0);scene.updateMatrixWorld(true);
    for(let i=0;i<nodes.length;i++)
     maxTransferError=Math.max(maxTransferError,
      nodes[i].getWorldQuaternion(new T.Quaternion()).angleTo(targets[i]));
    const rawDrift=Math.max(...['leftFoot','rightFoot']
      .map(n=>at(n).distanceTo(vec(basePos[n]))));
    const correct=(side)=>{
     const footNode=foot(side+'Foot'),goal=vec(basePos[side+'Foot']);
     const originally=footNode.getWorldQuaternion(new T.Quaternion());
     const before1=foot(side+'UpperLeg').quaternion.clone();
     const before2=foot(side+'LowerLeg').quaternion.clone();
     const rotate=(joint)=>{
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
      rotate(foot(side+'LowerLeg'));rotate(foot(side+'UpperLeg'));
     }
     const par=footNode.parent.getWorldQuaternion(new T.Quaternion());
     footNode.quaternion.copy(par.invert().multiply(originally)).normalize();
     rig.update(0);scene.updateMatrixWorld(true);
     return {residual:at(side+'Foot').distanceTo(goal),
      thighDeltaDeg:T.MathUtils.radToDeg(before1.angleTo(foot(side+'UpperLeg').quaternion)),
      shinDeltaDeg:T.MathUtils.radToDeg(before2.angleTo(foot(side+'LowerLeg').quaternion))};
    };
    const corrections={left:correct('left'),right:correct('right')};
    const result={t,rawDrift,maxTransferError,corrections,
     leftHand:at('leftHand').toArray(),rightHand:at('rightHand').toArray(),
     leftKnee:at('leftLowerLeg').toArray(),rightKnee:at('rightLowerLeg').toArray(),
     leftFoot:at('leftFoot').toArray(),rightFoot:at('rightFoot').toArray(),
     hipDegrees:T.MathUtils.radToDeg(
       foot('hips').getWorldQuaternion(new T.Quaternion()).angleTo(world[0])),
     leftHandDisplacement:at('leftHand').distanceTo(vec(basePos.leftHand)),
     rightHandDisplacement:at('rightHand').distanceTo(vec(basePos.rightHand))};
    return result;
   },{t,source});
  }
  const all=[];
  const fpsList=process.env.KAIRO_PREVIEW_ONLY==='1'?[60]:[30,60,120];
  for(const fps of fpsList){
   const samples=[];
   for(let n=0;n<=Math.round(fps*.55);n++){
    const t=Math.min(.55,n/fps);
    samples.push(await apply(t));
   }
   // Ensure the precise authored impact time is tested even if fps samples miss it.
   const contact=await apply(.24);
   const peakHand=Math.max(...samples.map(x=>x.leftHandDisplacement),contact.leftHandDisplacement);
   const maxFootResidual=Math.max(...samples.flatMap(x=>[
    x.corrections.left.residual,x.corrections.right.residual]),
    contact.corrections.left.residual,contact.corrections.right.residual);
   const maxLegCorrection=Math.max(...samples.flatMap(x=>[
    x.corrections.left.thighDeltaDeg,x.corrections.left.shinDeltaDeg,
    x.corrections.right.thighDeltaDeg,x.corrections.right.shinDeltaDeg]));
   const maxTransfer=Math.max(...samples.map(x=>x.maxTransferError));
   let worstKneeStep=0;
   for(let i=1;i<samples.length;i++){
    for(const side of ['left','right']){
     const a=vecInJs(samples[i-1][side+'Knee']);
     const b=vecInJs(samples[i][side+'Knee']);
     worstKneeStep=Math.max(worstKneeStep,
      Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]));
    }
   }
   all.push({fps,frameCount:samples.length,peakHand,maxFootResidual,
    maxLegCorrection,maxTransfer,worstKneeStep,contact,samples});
  }
  function vecInJs(x){return x;}
  assert.deepEqual(all.map(x=>x.fps),fpsList);
  for(const pass of all){
   assert(pass.maxTransfer<1e-5);
   assert(pass.maxFootResidual<.004,'Foot IK drift too high');
   assert(pass.maxLegCorrection<10,'Excessive target-foot IK correction');
   assert(pass.worstKneeStep<.09,'Knee joint snaps');
   assert(pass.peakHand>.03,'Actual Kairo left jab hand did not move');
   assert(pass.contact.leftHandDisplacement>.03,
    'No forward arm articulation at actual 0.24s impact');
  }
  const shots=[];
  for(const [name,time] of [
    ['neutral',0],['anticipation',.17],['contact',.24],
    ['extension',.27],['recoil',.35],['recovery',.55]]){
   const r=await apply(time);
   await page.waitForTimeout(90);
   const file='kairo-jab-private-'+name+'.png';
   await page.screenshot({path:path.join(OUT,file)});
   shots.push({phase:name,time,file,leftHandDisplacement:r.leftHandDisplacement,
    footResidual:Math.max(r.corrections.left.residual,r.corrections.right.residual)});
  }
  // Orthogonal side camera makes elbow extension and fist direction
  // inspectable; never alters the character pose or game camera code.
  await apply(.24);
  await page.evaluate(()=>{
   const {p,s}=window.__kairoJabProof;
   const cam=s.camera;
   cam.position.set(p.pos.x+3.25,p.pos.y+1.65,p.pos.z+0.4);
   cam.lookAt(p.pos.x,p.pos.y+1.12,p.pos.z);
   cam.updateProjectionMatrix();
  });
  await page.waitForTimeout(90);
  await page.screenshot({path:path.join(OUT,'kairo-jab-private-contact-side.png')});
  shots.push({phase:'contact-side',time:.24,file:'kairo-jab-private-contact-side.png'});
  const final=await page.evaluate(()=>{
   const st=window.__kairoJabProof;
   const {rig,scene,nodes,saved,T,h,basePos}=st;
   nodes.forEach((n,i)=>n.quaternion.copy(saved[i]));
   rig.update(0);scene.updateMatrixWorld(true);
   return {
    angularDrift:Math.max(...nodes.map((n,i)=>n.quaternion.angleTo(saved[i]))),
    positionDrift:Math.max(...Object.keys(basePos).map(key=>
     h.getNormalizedBoneNode(key).getWorldPosition(new T.Vector3())
      .distanceTo(new T.Vector3().fromArray(basePos[key]))))
   };
  });
  assert(final.angularDrift<1e-6&&final.positionDrift<1e-5,
   'Original Kairo standing stance must be completely restored');
  const unwanted=errors.filter(x=>!x.includes(
    'Sky Clash V63: leaving V62 fallback active Error: V62 native master could not be found'));
  assert.deepEqual(unwanted,[]);
  const report={schema:'sky-clash.kairo-jab-private-real-webgl-review.v1',
    status:'OFFLINE_PREVIEW_NOT_VISUALLY_APPROVED',
    modelSha256:modelHash,impactSeconds:.24,durationSeconds:.55,
    fpsChecks:all.map(x=>({fps:x.fps,frameCount:x.frameCount,
      peakHand:x.peakHand,maxFootResidual:x.maxFootResidual,
      maxLegCorrection:x.maxLegCorrection,
      maxTransfer:x.maxTransfer,worstKneeStep:x.worstKneeStep,
      contact:x.contact})),shots,neutralRestore:final,
    limitations:['No gameplay integration or new attack owner',
      'Screenshots need HUMAN visual critique; passing geometry cannot approve aesthetics',
      'Real game standing stance, physics, combat and flight are unmodified',
      'Contact at 0.24s is authored timing, not real hitbox collision approval']};
  fs.writeFileSync(path.join(OUT,'kairo-jab-private-real-webgl-review.json'),
    JSON.stringify(report,null,2));
  console.log('PASS KAIRO_JAB_PRIVATE_REAL_WEBGL_BLOCKOUT '+JSON.stringify({
   shots:shots.map(x=>x.file),fps:all.map(x=>({
    fps:x.fps,frames:x.frameCount,maxFoot:x.maxFootResidual,
    maxKneeStep:x.worstKneeStep,peakHand:x.peakHand})),
   restore:final,artApproved:false}));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
