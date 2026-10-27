/* Kairo arm audit on the measured VRM hierarchy, with no runtime pose writes.
 * Native clips are interpolated continuously at 120 Hz. --gameplay accepts
 * verify-kairo-storm-fist.cjs reports and audits their FINAL normalized joints.
 * Capsules are conservative joint-derived torso proxies, not mesh collision.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const THREE=require('../js/vendor/three.min.js');
const mf=require('../docs/KAIRO-COMBAT-NATIVE-RIG-MANIFEST.v1.json');
const args=process.argv.slice(2);
const value=(flag,fallback)=>{const at=args.indexOf(flag);return at<0?fallback:args[at+1];};
const localAnchor='visual-review-output/kairo-combat-foundation/kairo-combat-anchor.json';
const anchorPath=value('--anchor',fs.existsSync(localAnchor)?localAnchor:
 'assets/animations/reference/kairo-combat-anchor.v1.json');
const packPath=value('--pack','assets/animations/kairo/storm-fist.v1.json');
const output=value('--output','visual-review-output/kairo-arm-clearance.json');
const reportOnly=args.includes('--report-only');
const maxSpeed=Number(value('--max-arm-speed','45'));
const a=JSON.parse(fs.readFileSync(anchorPath,'utf8'));
assert.equal(a.rigSignature,mf.rigSignature);assert.equal(a.modelSha256,mf.modelSha256);
assert.deepEqual(a.bones,mf.bones);
const root=new THREE.Object3D(),nodes={};
for(const j of a.joints){
 const n=nodes[j.name]=new THREE.Object3D();(nodes[j.parent]||root).add(n);
 n.position.fromArray(j.localPosition);n.quaternion.fromArray(j.localQuaternion);
}
root.updateMatrixWorld(true);
assert(Math.max(...a.joints.map(j=>nodes[j.name].getWorldPosition(new THREE.Vector3())
 .distanceTo(new THREE.Vector3(...j.position))))<1e-8,'Measured normalized hierarchy did not reconstruct');
const shoulderSpan=new THREE.Vector3(...a.joints.find(j=>j.name==='leftUpperArm').position)
 .distanceTo(new THREE.Vector3(...a.joints.find(j=>j.name==='rightUpperArm').position));
const point=name=>nodes[name].getWorldPosition(new THREE.Vector3());
const lerp=(a,b,t)=>a.clone().lerp(b,t);
function segmentDistance(a,b,c,d){
 const u=b.clone().sub(a),v=d.clone().sub(c),w=a.clone().sub(c);
 const A=u.dot(u),B=u.dot(v),C=v.dot(v),D=u.dot(w),E=v.dot(w),den=A*C-B*B;
 let sn,sd=den,tn,td=den;
 if(den<1e-12){sn=0;sd=1;tn=E;td=C;}else{
  sn=B*E-C*D;tn=A*E-B*D;
  if(sn<0){sn=0;tn=E;td=C;}else if(sn>sd){sn=sd;tn=E+B;td=C;}
 }
 if(tn<0){tn=0;if(-D<0)sn=0;else if(-D>A)sn=sd;else{sn=-D;sd=A;}}
 else if(tn>td){tn=td;if(-D+B<0)sn=0;else if(-D+B>A)sn=sd;else{sn=-D+B;sd=A;}}
 const s=Math.abs(sn)<1e-12?0:sn/sd,t=Math.abs(tn)<1e-12?0:tn/td;
 return w.addScaledVector(u,s).addScaledVector(v,-t).length();
}
function observe(){
 const torso=[['waist','hips','chest',.34],['ribs','chest','upperChest',.39],
  ['upper-chest','upperChest','neck',.30]].map(([name,aa,bb,r])=>
   ({name,a:point(aa),b:point(bb),radius:shoulderSpan*r}));
 let minimum=Infinity,penetration=null,wristAngle=0,wrist=null;
 for(const side of ['left','right']){
  const shoulder=point(side+'UpperArm'),elbow=point(side+'LowerArm'),hand=point(side+'Hand');
  // The shoulder attachment is intentionally embedded; exclude its proximal
  // 30% and include a conservative arm/sleeve radius for the remaining limb.
  const arm=[['upper-arm',lerp(shoulder,elbow,.30),elbow,.115],
   ['forearm',elbow,hand,.10],['wrist',hand,hand.clone().addScalar(1e-9),.115]];
  for(const [part,start,end,r]of arm)for(const body of torso){
   const clearance=segmentDistance(start,end,body.a,body.b)-body.radius-shoulderSpan*r;
   if(clearance<minimum){minimum=clearance;penetration={side,part,torso:body.name};}
  }
  const axis=new THREE.Vector3(side==='left'?-1:1,0,0)
   .applyQuaternion(nodes[side+'Hand'].getWorldQuaternion(new THREE.Quaternion())).normalize();
  const angle=THREE.MathUtils.radToDeg(axis.angleTo(hand.clone().sub(elbow).normalize()));
  if(angle>wristAngle){wristAngle=angle;wrist=side;}
 }
 return {minimumClearance:minimum,nearest:penetration,maximumWristDeflectionDegrees:wristAngle,wrist};
}
function apply(quaternions,hips){
 a.joints.forEach((j,i)=>nodes[j.name].quaternion.fromArray(quaternions[i]));
 nodes.hips.position.fromArray(hips||a.joints[0].localPosition);root.updateMatrixWorld(true);
}
function audit(id,frames,dt){
 let min=Infinity,minAt=null,maxWrist=0,wristAt=null,maxAngular=0,angularAt=null;
 let penetrations=0,deepPenetrations=0,previous=null;
 for(const f of frames){
  apply(f.quaternions,f.hipsPosition);const p=observe();
  if(p.minimumClearance<min){min=p.minimumClearance;minAt={time:f.time,...p.nearest};}
  if(p.minimumClearance<0)penetrations++;
  if(p.minimumClearance<-.01)deepPenetrations++;
  if(p.maximumWristDeflectionDegrees>maxWrist){maxWrist=p.maximumWristDeflectionDegrees;
   wristAt={time:f.time,side:p.wrist};}
  const rotations=mf.bones.map(n=>nodes[n].getWorldQuaternion(new THREE.Quaternion()));
  if(previous)for(let i=6;i<14;i++){
   const speed=rotations[i].angleTo(previous.rotations[i])/Math.max(1e-8,f.time-previous.time||dt);
   if(speed>maxAngular){maxAngular=speed;angularAt={time:f.time,bone:mf.bones[i]};}
  }
  previous={time:f.time,rotations};
 }
 return {id,samples:frames.length,minimumClearance:min,minimumAt:minAt,
  intersectionSamples:penetrations,deepIntersectionSamples:deepPenetrations,
  maximumWristDeflectionDegrees:maxWrist,wristAt,
  maximumArmSpeedRadiansPerSecond:maxAngular,maximumArmSpeedAt:angularAt};
}
function interpolate(clip,fps=120){
 const frames=[];let hi=0;
 for(let n=0;n<=Math.ceil(clip.durationSeconds*fps);n++){
  const t=Math.min(clip.durationSeconds,n/fps);
  while(hi<clip.frames.length-1&&clip.frames[hi].time<t)hi++;
  const b=clip.frames[hi],aa=clip.frames[Math.max(0,hi-1)];
  const w=b.time===aa.time?0:(t-aa.time)/(b.time-aa.time);
  frames.push({time:t,hipsPosition:aa.hipsPosition.map((v,i)=>v+(b.hipsPosition[i]-v)*w),
   quaternions:aa.quaternions.map((q,i)=>new THREE.Quaternion(...q)
    .slerp(new THREE.Quaternion(...b.quaternions[i]),w).normalize().toArray())});
 }
 return frames;
}
const reports=[];
const gpAt=args.indexOf('--gameplay');
const sourceAt=args.indexOf('--source');
if(gpAt>=0){
 const file=args[gpAt+1],game=JSON.parse(fs.readFileSync(file,'utf8')),fps=game.fps;
 assert([30,60,120].includes(fps));
 for(const [id,frames]of [['combo',game.combo.frames],['alternate',game.alternate.frames],
  ['aerial',game.aerial],...game.defenses.map(d=>[d.mode,d.frames]),
  ...(game.handoffs||[]).map(h=>['handoff-'+h.id,h.frames])]){
  reports.push(audit('gameplay-'+id,frames.map((f,i)=>({...f,time:i/fps})),1/fps));
 }
}else if(sourceAt>=0){
 const source=JSON.parse(fs.readFileSync(args[sourceAt+1],'utf8'));
 assert.equal(source.modelSha256,a.modelSha256);
 const C=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2),inverseC=C.clone().invert();
 for(const clip of source.clips){
  const frames=clip.samples.map(sample=>{
   const worlds=sample.deltasWXYZ.map((q,i)=>C.clone().multiply(new THREE.Quaternion(q[1],q[2],q[3],q[0]))
    .multiply(inverseC).multiply(new THREE.Quaternion(...a.joints[i].worldQuaternion)).normalize());
   const quaternions=worlds.map((q,i)=>{
    const parent=mf.parents[i],pi=mf.bones.indexOf(parent);
    return (pi<0?q:worlds[pi].clone().invert().multiply(q)).normalize().toArray();
   });
   return {time:sample.timeSeconds,hipsPosition:sample.jointPositionsGame.hips,quaternions};
  });
  reports.push(audit(clip.clipId,interpolate({...clip,frames}),1/120));
 }
}else{
 const pack=JSON.parse(fs.readFileSync(packPath,'utf8'));assert.equal(pack.modelSha256,a.modelSha256);
 for(const clip of pack.clips)reports.push(audit(clip.clipId,interpolate(clip),1/120));
}
const failures=[];
for(const r of reports){
 if(r.deepIntersectionSamples)failures.push(r.id+': torso proxy penetration '+r.minimumClearance.toFixed(4));
 if(r.maximumWristDeflectionDegrees>50)failures.push(r.id+': wrist deflection '+r.maximumWristDeflectionDegrees.toFixed(1)+'deg');
 if(r.maximumArmSpeedRadiansPerSecond>maxSpeed)failures.push(r.id+': arm speed '+r.maximumArmSpeedRadiansPerSecond.toFixed(1)+'rad/s');
 console.log(r.id+' clearance='+r.minimumClearance.toFixed(4)+' wrist='+r.maximumWristDeflectionDegrees.toFixed(1)+
  'deg armSpeed='+r.maximumArmSpeedRadiansPerSecond.toFixed(1)+'rad/s');
}
const result={schema:'sky-clash.kairo-arm-clearance.v1',modelSha256:a.modelSha256,
 rigSignature:a.rigSignature,shoulderSpan,torsoRadiusBasis:'conservative measured joint proxies',
 status:failures.length?'FAIL':'PASS',failures,reports,
 limitations:['Joint-derived capsules detect deep arm/body crossings, not exact cloth/skin collision',
  'Hand longitudinal-axis deflection excludes finger curl and deliberate palm articulation',
  'Native interpolation does not include state-entry blending; use --gameplay for final-owner poses']};
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(result.status+' KAIRO_ARM_CLEARANCE '+failures.length+' findings; '+output);
if(failures.length&&!reportOnly)process.exitCode=1;
