/* Exercise the baked Blender jab through the REAL Fighter/V72/V81 stack.
 * No post-animate bone injection. Outputs stay private and unapproved.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
module.exports=async function({page,pack,anchor,output}){
 // No background software-rendering between deterministic simulation ticks.
 // Evidence frames still call the real renderer through Game.loop.
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});
 const reports=[];
 for(const fps of [30,60,120]){
  console.log('NATIVE JAB gameplay replay starting',fps,'Hz');
  const report=await page.evaluate(({fps,pack,anchor})=>{
   const s=window.SkyClash,g=s.Game,p=g.player,e=g.enemy,T=window.THREE;
   const api=window.SkyClashPublishedActions,dt=1/fps;
   const nodes=pack.bones.map(n=>p.vrmRig.vrm.humanoid.getNormalizedBoneNode(n));
   const reset=(distance)=>{
    api.clearNativeCombatPreview();s.Effects.clear();s.Spectacle.clear();p.reset();e.reset();
    p.pos.set(0,p.floor,0);p.spawn.copy(p.pos);e.pos.set(0,e.floor,distance);e.spawn.copy(e.pos);
    p.vel.set(0,0,0);e.vel.set(0,0,0);p.moveIntent.set(0,0,0);e.moveIntent.set(0,0,0);
    p.facing=0;e.facing=Math.PI;p.t=12;e.t=12;p.lastMelee=-20;
    p.attackSerial=0;p.comboCycle=0;p.combo=0;p.meleeCd=0;p.comboFollow=null;
    p.punchT=0;p.stun=0;p.downT=0;p.launched=false;p.spiked=false;
    p.blockHeld=false;p.blocking=false;p.hp=100;e.hp=100;e.invulnT=0;
    // Fighter.reset() intentionally preserves animation adapters. Reset
    // their test clocks as well so paired baseline/native idle recordings
    // compare the SAME phase of the unchanged approved idle animation.
    for(const f of [p,e]){
     Object.assign(f.v72StudioPack,{slot:null,clock:0,weight:0,
      releasingIdle:false,releasingExtra:false,releaseEntry:null});
     Object.assign(f.v76UpperBody,{standClock:0,transition:0,airWeight:0});
     Object.assign(f.v81PoseTransitions,{mode:null,elapsed:1,blend:1,handGrip:0});
    }
    g.mode='dojo';g.dojoRival=true;
    for(let i=0;i<90;i++){p.animate(1/60);e.animate(1/60);}
   };
   const observe=()=>{
    const rig=p.vrmRig.vrm;rig.scene.updateMatrixWorld(true);
    const inverse=rig.scene.matrixWorld.clone().invert();
    const h=rig.humanoid;
    const at=(name)=>h.getNormalizedBoneNode(name).getWorldPosition(new T.Vector3());
    const point=name=>at(name).applyMatrix4(inverse).toArray();
    const hand=at('leftHand');
    const eh=e.vrmRig.vrm.humanoid;
    const chest=eh.getNormalizedBoneNode('upperChest').getWorldPosition(new T.Vector3());
    const time=p.v72StudioPack.nativePreviewTime;
    let poseError=null,hipError=null,footError=null;
    if(p.v72StudioPack.nativePreviewActive){
     let hi=pack.frames.findIndex(f=>f.time>=time);if(hi<0)hi=pack.frames.length-1;
     const lo=Math.max(0,hi-1),a=pack.frames[lo],b=pack.frames[hi];
     const u=(time-a.time)/Math.max(1e-12,b.time-a.time);
     poseError=Math.max(...nodes.map((node,i)=>node.quaternion.angleTo(
      new T.Quaternion().fromArray(a.quaternions[i]).slerp(
       new T.Quaternion().fromArray(b.quaternions[i]),u))));
     const expectedHip=new T.Vector3().fromArray(a.hipsPosition).lerp(
      new T.Vector3().fromArray(b.hipsPosition),u);
     hipError=nodes[0].position.distanceTo(expectedHip);
     footError=Math.max(...['leftFoot','rightFoot'].map(name=>{
      const expected=new T.Vector3().fromArray(a.feet[name]).lerp(
       new T.Vector3().fromArray(b.feet[name]),u);
      return new T.Vector3().fromArray(point(name)).distanceTo(expected);
     }));
    }
    return {elapsed:p.attackElapsed,remaining:p.punchT,hp:e.hp,attackerHp:p.hp,
     native:!!p.v72StudioPack.nativePreviewActive,nativeTime:time,poseError,hipError,footError,
     slot:p.v72StudioPack.slot,v81:p.v81PoseTransitions.mode,blocking:!!p.blocking,
     root:p.pos.toArray(),leftHand:point('leftHand'),
     leftFoot:point('leftFoot'),rightFoot:point('rightFoot'),
     worldLeftFoot:at('leftFoot').toArray(),worldRightFoot:at('rightFoot').toArray(),
     handToTargetChest:hand.distanceTo(chest),
     handToTargetChestXYZ:hand.clone().sub(chest).toArray(),
     quaternions:nodes.map(n=>n.quaternion.toArray())};
   };
   function run(enabled,distance,interrupt){
    reset(distance);
    const idle=observe();
    if(enabled)api.registerNativeCombatPreview(pack);
    const justRegistered=observe();
    // Registration itself must never replace idle/standing.
    p.animate(dt);const registeredIdle=observe();
    s.Combat.melee(p,e);
    const duration=p.attackTotal,contact=p.kickPend.t;
    const frames=[];let interrupted=false,impact=null;
    for(let i=0;i<Math.ceil(fps*1.25);i++){
     if(interrupt&&i*dt>=.12&&!interrupted){p.stun=.3;interrupted=true;}
     const beforeHp=e.hp;p.update(dt);
     const frame=observe();frames.push(frame);e.update(dt);s.Effects.update(dt);s.Spectacle.update(dt);
     if(e.hp<beforeHp)impact=frame;
    }
    // Actual post-strike guard must route back to legacy guard, then idle.
    p.blockHeld=true;
    const guard=[];for(let i=0;i<Math.ceil(fps*.3);i++){p.update(dt);guard.push(observe());}
    p.blockHeld=false;
    const recovery=[];for(let i=0;i<Math.ceil(fps*.4);i++){p.update(dt);recovery.push(observe());}
    return {idle,justRegistered,registeredIdle,duration,contact,frames,impact,guard,recovery};
   }
   const baseline=run(false,1.45,false),native=run(true,1.45,false);
   const whiff=run(true,20,false),interrupt=run(true,1.45,true);
   api.clearNativeCombatPreview();
   return {fps,baseline,native,whiff,interrupt};
  },{fps,pack,anchor});
  fs.writeFileSync(path.join(output,'kairo-jab-gameplay-'+fps+'hz.json'),JSON.stringify(report,null,2));
  const poseDistance=(a,b)=>Math.max(...a.quaternions.map((q,i)=>{
   const r=b.quaternions[i],dot=Math.abs(q.reduce((sum,v,j)=>sum+v*r[j],0));
   return 2*Math.acos(Math.min(1,dot));
  }));
  assert(poseDistance(report.baseline.registeredIdle,report.native.registeredIdle)<1e-5,
   'Explicit preview registration changed the paired approved idle');
  for(const name of ['native','whiff','interrupt']){
   const run=report[name];
   assert.equal(run.duration,.55);assert(Math.abs(run.contact-.24)<1e-8);
   assert.equal(run.registeredIdle.native,false,'Registering a clip changed idle');
   assert(poseDistance(run.idle,run.justRegistered)<1e-7,
    'Registration itself mutated the visible skeleton');
   assert(run.frames.some(f=>f.native),'Native clip never reached real V72');
   assert(run.frames.every(f=>f.poseError===null||f.poseError<1e-5),
    'A later animation layer changed the baked full-body jab');
   assert(run.frames.every(f=>f.hipError===null||f.hipError<1e-6),'A later owner changed native pelvis placement');
   assert(run.frames.every(f=>f.footError===null||f.footError<.004),'Final foot trajectory differs from baked clip');
   assert(run.guard.every(f=>!f.native),'Native pose leaked into guard');
   assert(run.guard.every(f=>f.blocking&&f.slot==='guard'&&f.v81==='guard'),
    'Guard button did not enter actual legacy blocking/guard animation');
   assert(run.recovery.every(f=>!f.native),'Native pose leaked into recovery');
   assert(run.recovery.slice(-Math.ceil(fps*.1)).every(f=>!f.blocking&&
    f.remaining===0&&f.slot==='idle'&&f.v81==='idle'),
    'Recovery did not settle back into real approved idle');
  }
  assert(poseDistance(report.baseline.recovery.at(-1),report.native.recovery.at(-1))<1e-5,
   'The native jab left an offset in the subsequent approved idle');
  assert(report.native.impact,'Real close jab did not damage target');
  assert.equal(report.native.frames.at(-1).hp,report.baseline.frames.at(-1).hp,
   'Animation registration changed gameplay damage');
  assert(report.whiff.frames.every(f=>f.hp===100),'Distant jab caused damage');
  assert(report.interrupt.frames.every(f=>f.hp===100),'Interrupted jab caused damage');
  assert(report.interrupt.frames.filter(f=>f.elapsed>=.12+1/fps).every(f=>!f.native),
   'Native jab survived damage interruption');
  const active=report.native.frames.filter(f=>f.native);
  const entryAngle=poseDistance(report.native.registeredIdle,active[0]);
  // This loose entry-only cut guard catches a broken rest basis; it is
  // not a limit on fast extension later, or a claim of pleasing timing.
  assert(entryAngle<.55,'Native entry cut exceeds 32 degrees in its first frame');
  assert(Math.max(...active.map(f=>f.leftHand.reduce((sum,v,i)=>
   sum+(v-anchor.joints[7].position[i])*anchor.forward[i],0)))>.4,
   'Actual punch did not reach forward');
  // Compare feet to their authored trajectories above: the lead foot now
  // steps deliberately. World rear-foot slip includes the unchanged lunge.
  const worldFootTravel=Math.max(...active.flatMap(f=>
   ['worldLeftFoot','worldRightFoot'].map(name=>
    Math.hypot(...f[name].map((v,i)=>v-report.native.registeredIdle[name][i])))));
  const nearest=run=>run.frames.reduce((a,b)=>
   Math.abs(b.elapsed-.24)<Math.abs(a.elapsed-.24)?b:a);
  const contactDifference=poseDistance(nearest(report.baseline),nearest(report.native));
  assert(contactDifference>.1,'The native contact is indistinguishable from the legacy clip');
  report.measurements={entryMaxJointRadians:entryAngle,
   legacyContactMaxJointDifferenceRadians:contactDifference,
   worldSupportFootTravel:worldFootTravel,
   impactHandToTargetChest:report.native.impact.handToTargetChest,
   interpretation:'Chest-center distance is a measurement, not fist-to-mesh contact approval; world foot travel includes unchanged root lunge'};
  console.log('NATIVE JAB gameplay checked',fps,'Hz',JSON.stringify(report.measurements));
  reports.push(report);
 }
 fs.writeFileSync(path.join(output,'kairo-jab-gameplay.json'),JSON.stringify({
  status:'PRIVATE_UNAPPROVED_ENGINE_REPLAY',sourceSha256:pack.sourceSha256,reports,
  limitations:['One jab, not a complete replacement combo',
   'Lead foot follows authored step; rear support is model-relative and existing lunge still translates root',
   'Collision uses unchanged gameplay volumes; hand-to-mesh contact reported separately']},null,2));
 console.log('PASS real native-jab gameplay at 30/60/120Hz: hit, whiff, damage interruption, guard, recovery');

 // Continuous chronological capture through genuine Fighter.update; no
 // resetting/restoring pose between samples. Render three cameras at each
 // frame on the SAME pose before advancing the clock.
 const dir=path.join(output,'jab-motion');fs.mkdirSync(dir,{recursive:true});
 await page.evaluate(({pack})=>{
  const s=window.SkyClash,g=s.Game,p=g.player,e=g.enemy;
  window.SkyClashPublishedActions.clearNativeCombatPreview();
  s.Effects.clear();s.Spectacle.clear();g.combo={n:0,dmg:0,t:0};
  document.getElementById('comboBox')?.classList.remove('show','hot');
  const panel=document.getElementById('walkLabStatus');if(panel)panel.open=false;
  p.reset();e.reset();p.pos.set(0,p.floor,0);e.pos.set(0,e.floor,1.45);
  p.vel.set(0,0,0);e.vel.set(0,0,0);p.moveIntent.set(0,0,0);
  p.t=12;p.facing=0;e.facing=Math.PI;p.attackSerial=0;p.combo=0;
  p.comboCycle=0;p.meleeCd=0;p.lastMelee=-20;p.blockHeld=false;
  for(let i=0;i<90;i++){p.animate(1/60);e.animate(1/60);}
  window.SkyClashPublishedActions.registerNativeCombatPreview(pack);
  g.mode='dojo';g.dojoRival=true;
  window.__jabFilm={p,e,s};
 },{pack});
 const views={front:[1.2,1.5,3.7],side:[3.7,1.5,.1],back:[-1.2,1.5,-3.7]};
 for(let i=0;i<36;i++){
  if([6,18,35].includes(i))console.log('NATIVE JAB continuous film frame',i+1,'/ 36');
  await page.evaluate(i=>{
   const {p,e,s}=window.__jabFilm;
   if(i===6)s.Combat.melee(p,e);
   p.update(1/24);
   // Render the actual defender response without letting its AI fight.
   e.update(1/24);s.Effects.update(1/24);s.Spectacle.update(1/24);
  },i);
  for(const [view,offset] of Object.entries(views)){
   await page.evaluate(offset=>{
    const {p,s}=window.__jabFilm,cam=s.camera;
    cam.position.set(p.pos.x+offset[0],p.pos.y+offset[1],p.pos.z+offset[2]);
    cam.lookAt(p.pos.x,p.pos.y+1.05,p.pos.z+.35);cam.fov=40;cam.updateProjectionMatrix();
   },offset);
   await page.evaluate(()=>window.SkyClash.Game.loop(performance.now()));
   await page.screenshot({path:path.join(dir,`${view}-${String(i).padStart(3,'0')}.jpg`),
    type:'jpeg',quality:80});
  }
 }
 for(const view of Object.keys(views)){
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','24',
   '-i',path.join(dir,view+'-%03d.jpg'),'-c:v','libx264','-pix_fmt','yuv420p',
   path.join(output,'kairo-jab-continuous-'+view+'.mp4')]);
  const movie=path.join(output,'kairo-jab-continuous-'+view+'.mp4');
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0',
   '-show_entries','stream=nb_frames','-of','json',movie],{encoding:'utf8'}));
  assert.equal(Number(probe.streams[0].nb_frames),36,'Incomplete continuous film');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',movie,
   '-vf','scale=320:240,tile=6x6','-frames:v','1',
   path.join(output,'kairo-jab-sequence-'+view+'.png')]);
 }
 fs.rmSync(dir,{recursive:true,force:true});
 await page.evaluate(()=>window.SkyClashPublishedActions.clearNativeCombatPreview());
};
