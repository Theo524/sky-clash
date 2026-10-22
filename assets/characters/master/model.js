/* Sky Clash V60 — Clean Master Humanoid.
 * Designed from scratch with native Mixamo bones. No VRM, no copied character meshes.
 * The torso and limbs are smoothly skin-weighted to the FBX's native joints;
 * bone motions are NEVER retargeted or rewritten here.
 * Procedural skin-weighted body, not yet a portable FBX/VRM/GLB asset.
 */
(function(root){
'use strict';
const VERSION='60.1';
const REQUIRED=['hips','spine','spine1','spine2','neck','head','leftarm','leftforearm','lefthand','rightarm','rightforearm','righthand','leftupleg','leftleg','leftfoot','rightupleg','rightleg','rightfoot'];
function check(bones){const missing=REQUIRED.filter(n=>!bones?.has(n));return {valid:!missing.length,missing,count:bones?.size||0,version:VERSION};}
function create(THREE,bones,fbx){
 if(!fbx)throw Error('Master needs the native Mixamo FBX scene root for continuous bone-weighted limbs');
 fbx.updateMatrixWorld(true);
 const test=check(bones);if(!test.valid)throw Error('Native Mixamo base needs bones: '+test.missing.join(', '));
 const skin={face:0xffd9bb,shadow:0x8c655f,suit:0x202937,navy:0x151e30,trim:0x4be6de,pants:0x283449,sole:0x101522,wrap:0xdee5e7,hair:0x131927,eyes:0x3ae3e8,black:0x121827,vest:0x414f61};
 const material={};for(const [name,color] of Object.entries(skin))material[name]=new THREE.MeshStandardMaterial({color,metalness:0.02,roughness:name==='eyes'?.23:.82,flatShading:false});
 const shared={sphere:new THREE.SphereGeometry(1,12,9),cyl:new THREE.CylinderGeometry(1,1,1,12,1)};
 const owned=[], parts=[];
 function add(parent,geo,mat,pos,quat,scale){const obj=new THREE.Mesh(geo,material[mat]);obj.name='M60_'+mat;obj.castShadow=true;obj.receiveShadow=true;if(pos)obj.position.copy(pos);if(quat)obj.quaternion.copy(quat);if(scale)obj.scale.set(...scale);parent.add(obj);parts.push(obj);return obj;}
 function ball(parent,mat,xyz,r){return add(parent,shared.sphere,mat,new THREE.Vector3(...xyz),null,r);}
 function between(parent,child,mat,r1,r2=.95*r1,pad=1){if(!parent||!child)return;
   // A genuine GPU-skinned geometry segment driven by TWO NATIVE Mixamo bones.
   // This deforms smoothly across knees/elbows (rather than rigid cylinders).
   // All vertices are authored in the native FBX local coordinate system.
   parent.updateMatrixWorld(true);child.updateMatrixWorld(true);fbx.updateMatrixWorld(true);
   const direction=child.position.clone();const length=direction.length();
   if(length<.25||length>90)return;
   const geometry=new THREE.CylinderGeometry(r2,r1,length*pad,14,6,false);
   const position=geometry.getAttribute('position');
   const indices=[],weights=[];
   for(let i=0;i<position.count;i++){
     const ratio=THREE.MathUtils.clamp(position.getY(i)/(length*pad)+.5,0,1);
     const raw=THREE.MathUtils.clamp((ratio-.25)/.75,0,1);
     const follow=raw*raw*(3-2*raw); // smooth-step, no abrupt weighting
     indices.push(0,1,0,0);
     weights.push(1-follow,follow,0,0);
   }
   geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
   geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
   const toParent=new THREE.Matrix4().compose(
     direction.clone().multiplyScalar(.5),
     new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()),
     new THREE.Vector3(1,1,1)
   );
   geometry.applyMatrix4(toParent);
   geometry.applyMatrix4(parent.matrixWorld);
   geometry.applyMatrix4(fbx.matrixWorld.clone().invert());
   const skeleton=new THREE.Skeleton([parent,child]);
   const mesh=new THREE.SkinnedMesh(geometry,material[mat]);
   mesh.name='M60_skinned_'+mat;
   mesh.frustumCulled=false;
   mesh.castShadow=true;mesh.receiveShadow=true;
   fbx.add(mesh);
   mesh.bind(skeleton,fbx.matrixWorld.clone());
   owned.push(geometry);parts.push(mesh);
 }

 const b=x=>bones.get(x), s=ball;
 // Soft, athletic anatomy beneath the clothing. All dimensions are Mixamo centimetres.
 // Pelvis, spine and chest sections overlap so the joints don't pull apart.
 s(b('hips'),'pants',[0,4,0],[12.3,10.4,8.3]);
 between(b('hips'),b('spine'),'suit',11.8,11.0,1.38);
 s(b('spine'),'suit',[0,4.8,0],[12.4,11.2,8.3]);
 between(b('spine'),b('spine1'),'suit',13.0,14.2,1.3);
 between(b('spine1'),b('spine2'),'vest',14.5,17.5,1.27);
 s(b('spine2'),'vest',[0,1.7,0],[17,11.3,9.0]);
 between(b('spine2'),b('neck'),'vest',10.8,5.9,1.18);
 between(b('neck'),b('head'),'face',4.6,4.5,1.2);
 // Shirt collar and waistband details (modern, clean, no armor/robot parts).
 s(b('hips'),'trim',[0,8,7.0],[11.6,1.7,1.0]);
 s(b('spine1'),'trim',[0,6,9.0],[10.4,.85,1.15]);
 s(b('spine2'),'wrap',[0,8,7.1],[6.2,1.7,1.1]);
 // Arms: cloth sleeves, forearms and gloves.
 for(const lr of ['left','right']){
   const u=b(lr+'arm'),lo=b(lr+'forearm'),hand=b(lr+'hand'),shoulder=b(lr+'shoulder');
   between(shoulder,u,'vest',6.2,6.3,1.3);
   between(u,lo,'suit',6.6,5.2,1.03);
   s(u,'vest',[0,3,0],[7.2,7.0,7.2]);
   s(lo,'trim',[0,1.1,0],[5.2,2.9,5.0]);
   between(lo,hand,'wrap',4.6,3.9,1.03);
   s(hand,'navy',[0,3.0,0],[5.1,7.1,3.8]);
   s(hand,'trim',[0,4.5,3.2],[4.4,1.3,.75]);
   // Fingers are part of the Mixamo hand rig; simplified palms remain usable in all clips.
   for(const f of ['index','middle','ring','pinky']){
      const key=lr+'hand'+f+'1'; const finger=b(key);
      if(finger){s(finger,'navy',[0,2.5,0],[1.6,4,1.6]);}
   }
 }
 // Legs follow hip -> knee -> ankle; toes are native Mixamo joint children.
 for(const lr of ['left','right']){
   const hip=b(lr+'upleg'),knee=b(lr+'leg'),foot=b(lr+'foot'),toe=b(lr+'toebase');
   between(hip,knee,'pants',9.4,7.6,1.01);
   s(hip,'pants',[0,3,0],[10.1,9,9.2]);
   s(knee,'pants',[0,1.4,0],[7.8,8.1,7.3]);
   between(knee,foot,'pants',7.0,5.6,1.03);
   s(foot,'navy',[0,3.2,0],[7.4,8.0,7.4]);
   s(foot,'trim',[0,7.3,1.3],[7.4,1.25,7.5]);
   if(toe){between(foot,toe,'sole',7.2,6.7,1.24);s(toe,'navy',[0,3.4,0],[7.3,9.0,6.3]);}
 }
 // Entirely original stylised face and hair on the native animated head bone.
 // Mixamo normally faces +Z. The body uses its own bind skeleton's local basis.
 const h=b('head');
 s(h,'face',[0,10,3.8],[12.6,14.9,11.2]);
 s(h,'hair',[0,20,1],[13.2,6.3,11.4]);
 s(h,'hair',[0,15,-6],[12.5,9.4,5.6]);
 // Asymmetric swept fringe; separate geometry means readable silhouette even at 2m.
 for(let i=0;i<5;i++){
   const x=-11+i*5.5;const z=9.7-(i%2)*.8;
   const curl=s(h,'hair',[x,18.7-(i%3)*2,z],[3.0,7.5,3.2]);curl.rotation.z=(i-2)*.13;
 }
 // Eyes and brows with accent irises, minimal nose + mouth.
 for(const sign of [-1,1]){
   const x=sign*5.1;
   s(h,'black',[x,11.7,14.0],[3.65,1.9,.8]);
   s(h,'wrap',[x,11.7,14.55],[3.2,1.32,.75]);
   s(h,'eyes',[x+sign*.2,11.5,15.1],[1.22,1.45,.55]);
   const brow=s(h,'hair',[x,15.5,13.65],[4.0,.88,.7]);brow.rotation.z=sign*.08;
 }
 s(h,'shadow',[0,7.0,14.1],[1.4,2.0,.65]);
 s(h,'shadow',[0,3.3,13.4],[2.9,.55,.65]);
 for(const sign of [-1,1])s(h,'face',[sign*12.4,11.0,2.8],[2.1,4.4,2.8]);
 function setVisible(on){for(const item of parts)item.visible=!!on;}
 function dispose(){for(const x of parts)x.parent?.remove(x);for(const g of owned)g.dispose();for(const g of Object.values(shared))g.dispose();for(const m of Object.values(material))m.dispose();}
 return {version:VERSION,parts,setVisible,dispose,source:'native-mixamo-bones',jointCount:test.count};
}

// Inspect an animation's actual keyframe bindings, not just its skeleton.
// This is a diagnostic: an FBX can contain the correct bones yet animate none of them.
function inspectClip(clip,bones){
 const report={valid:false,animatedBones:0,missingBindings:[],invalidTracks:[],warnings:[]};
 if(!clip||!Number.isFinite(clip.duration)||clip.duration<=0||!Array.isArray(clip.tracks)){
   report.warnings.push('No playable animation clip');return report;
 }
 const animated=new Set();
 for(const track of clip.tracks){
   const target=String(track.name||'').split('.')[0].split('/').pop();
   const normalized=target.split(':').pop().replace(/[^a-zA-Z0-9]/g,'').toLowerCase().replace(/^mixamorig\d*/,'');
   if(!normalized)continue;
   if(!bones?.has(normalized)){if(report.missingBindings.length<12)report.missingBindings.push(track.name);continue;}
   const times=track.times,values=track.values;
   if(!times?.length||!values?.length||!Number.isFinite(times[0])||!Number.isFinite(times[times.length-1])||
      times[0]<-0.001||times[times.length-1]>clip.duration+.1||
      !Number.isFinite(values[0])||!Number.isFinite(values[values.length-1])){
      if(report.invalidTracks.length<12)report.invalidTracks.push(track.name);
      continue;
   }
   animated.add(normalized);
 }
 report.animatedBones=animated.size;
 if(!animated.has('hips'))report.warnings.push('Hips have no animation tracks');
 if(animated.size<8)report.warnings.push('Fewer than 8 humanoid bones are animated');
 if(report.missingBindings.length)report.warnings.push('Some track targets are missing from the loaded skeleton');
 if(report.invalidTracks.length)report.warnings.push('Some tracks contain invalid or out-of-range samples');
 report.valid=animated.has('hips')&&animated.size>=8&&!report.invalidTracks.length;
 return report;
}
const api={create,check,inspectClip,requiredBones:REQUIRED,version:VERSION};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.SkyClashMixamoMaster=api;
})(typeof window!=='undefined'?window:globalThis);
