/* Sky Clash V65 — original anime fighter skins.
 * A NEW procedural anime-styled surface, not an old VRM, and not the V60 mannequin.
 * Driven by the exact same live humanoid bones as V64. No retarget or gameplay change.
 * Kairo: navy street-fighter outfit / crimson scarf / azure eyes / dark spiky hair.
 * Rival: plum-and-black martial outfit / silver hair / violet eyes.
 * Preview-quality procedural 3D model; not a standalone exportable VRM/GLB.
 */
(function(global){
 'use strict';
 const VERSION='65.0';
 const REQUIRED=['hips','spine','spine1','spine2','neck','head','leftshoulder','leftarm','leftforearm','lefthand','rightshoulder','rightarm','rightforearm','righthand','leftupleg','leftleg','leftfoot','rightupleg','rightleg','rightfoot'];
 const PALETTE={
  kairo:{
   skin:0xf2c7ac, skinShade:0xd99885, hair:0x151d31, hairLight:0x324b6e,
   iris:0x36bffa, pupil:0x081528, whites:0xfffcf2,
   jacket:0x15233b, jacketLight:0x30445c, shirt:0x151922,
   trousers:0x263247, trouserShade:0x1b2435, boot:0x141d2a,
   sole:0x0b131d, glove:0x1b2635, cuff:0xe1e9e4,
   scarf:0xc82b43, scarfShade:0x871c35, accent:0x41d8f0,
   metal:0xc9d7e6, shadow:0x2c1a23, brow:0x161b2a
  },
  rival:{
   skin:0xdfbea9, skinShade:0xa77c78, hair:0xbac3e5, hairLight:0xf3e8ff,
   iris:0x9c68e8, pupil:0x191022, whites:0xfffafa,
   jacket:0x211d35, jacketLight:0x4a375b, shirt:0x10111d,
   trousers:0x29223e, trouserShade:0x191429, boot:0x171323,
   sole:0x0c0c16, glove:0x29203b, cuff:0xbbb3ce,
   scarf:0x593ba2, scarfShade:0x3c286c, accent:0xc487f5,
   metal:0xe2d5ec, shadow:0x39253a, brow:0x49415e
  }
 };
 function check(bones){
  const missing=REQUIRED.filter(n=>!bones?.has(n));
  return {valid:missing.length===0,missing};
 }
 function create(THREE,bones,root,options={}){
  if(!THREE||!root)throw Error('V65 anime skin requires Three.js and the live humanoid');
  const checkResult=check(bones);
  if(!checkResult.valid)throw Error('V65 anime skin missing '+checkResult.missing.join(', '));
  root.updateMatrixWorld(true);
  const p=PALETTE[options.rival?'rival':'kairo'];
  const parts=[],geometries=new Set(),materials=new Set();
  const meshOwned=[];
  const shaded={};
  for(const [name,hex] of Object.entries(p)){
   const mat=new THREE.MeshToonMaterial({color:hex,side:THREE.FrontSide});
   mat.name='V65_'+name;
   materials.add(mat);shaded[name]=mat;
  }
  const sphere=new THREE.SphereGeometry(1,20,16);
  const hiSphere=new THREE.SphereGeometry(1,28,20);
  geometries.add(sphere);geometries.add(hiSphere);
  const up=new THREE.Vector3(0,1,0);
  const mat=name=>shaded[name];
  function put(parent,geometry,material,pos=[0,0,0],scale=[1,1,1],name='detail'){
   if(!parent)return null;
   const m=new THREE.Mesh(geometry,mat(material));
   m.name='V65_'+name;
   m.position.set(...pos);m.scale.set(...scale);
   m.castShadow=true;m.receiveShadow=true;
   parent.add(m);parts.push(m);meshOwned.push(m);
   return m;
  }
  function orb(parent,material,pos,size,name){
   return put(parent,sphere,material,pos,size,name);
  }
  function box(parent,material,pos,size,name,rot){
   const g=new THREE.BoxGeometry(1,1,1);
   geometries.add(g);
   const m=put(parent,g,material,pos,size,name);
   if(rot)m.rotation.set(...rot);
   return m;
  }
  function tuft(parent,material,base,direction,length,width,name){
   const vector=new THREE.Vector3(...direction).normalize();
   const g=new THREE.ConeGeometry(width,length,6);
   geometries.add(g);
   const point=new THREE.Vector3(...base).addScaledVector(vector,length*.5);
   const m=put(parent,g,material,point.toArray(),[1,1,1],name);
   m.quaternion.setFromUnitVectors(up,vector);
   return m;
  }
  // Skinned tapered elliptical tube. Unlike hard cylinders attached to
  // individual bones, the elbow and knee sections blend over both joints.
  function sleeve(parent,child,material,baseRadius,endRadius,depth=0.83,pad=1.06,name='limb'){
   if(!parent||!child)return null;
   root.updateMatrixWorld(true);
   const direction=child.position.clone(),length=direction.length();
   if(!(length>2&&length<100))return null;
   const g=new THREE.CylinderGeometry(endRadius,baseRadius,length*pad,18,9,false);
   geometries.add(g);
   const pos=g.getAttribute('position');
   const indices=[],weights=[];
   for(let i=0;i<pos.count;i++){
    const y=pos.getY(i), t=THREE.MathUtils.clamp(y/(length*pad)+.5,0,1);
    pos.setXYZ(i,pos.getX(i)*(1-.06*Math.sin(t*Math.PI)),y,pos.getZ(i)*depth);
    const u=THREE.MathUtils.clamp((t-.18)/.76,0,1);
    const w=u*u*(3-2*u);
    indices.push(0,1,0,0);weights.push(1-w,w,0,0);
   }
   pos.needsUpdate=true;
   g.computeVertexNormals();
   g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
   g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
   const q=new THREE.Quaternion().setFromUnitVectors(up,direction.clone().normalize());
   g.applyMatrix4(new THREE.Matrix4().compose(direction.clone().multiplyScalar(.5),q,new THREE.Vector3(1,1,1)));
   g.applyMatrix4(parent.matrixWorld);
   g.applyMatrix4(root.matrixWorld.clone().invert());
   const sk=new THREE.SkinnedMesh(g,mat(material));
   sk.name='V65_skin_'+name;sk.frustumCulled=false;
   sk.castShadow=true;sk.receiveShadow=true;
   root.add(sk);
   sk.bind(new THREE.Skeleton([parent,child]),root.matrixWorld.clone());
   parts.push(sk);meshOwned.push(sk);
   return sk;
  }
  const B=n=>bones.get(n);
  const hips=B('hips'),spine=B('spine'),spine1=B('spine1'),chest=B('spine2'),neck=B('neck'),head=B('head');
  // Flat-shaded athletic silhouette beneath a cropped jacket.
  orb(hips,'trousers',[0,2,0],[15.3,10,10.5],'waist');
  sleeve(hips,spine,'shirt',12.9,13.7,.87,1.18,'waist-to-abdomen');
  sleeve(spine,spine1,'shirt',13.2,15.4,.85,1.22,'abdomen');
  sleeve(spine1,chest,'jacket',16.0,19.5,.73,1.24,'jacket-torso');
  orb(chest,'jacket',[0,2.3,0],[19.2,12.7,10.8],'chest');
  // Asymmetric jacket lapels, exposed high-collar undershirt and emblem.
  box(chest,'shirt',[0,2.9,10.0],[10,16,2.0],'jacket-open-front');
  box(chest,'jacketLight',[-9.0,3,10.1],[6.6,22,2.1],'lapel-left',[0,0,-.16]);
  box(chest,'jacketLight',[9.0,3,10.1],[6.6,22,2.1],'lapel-right',[0,0,.16]);
  box(chest,'accent',[0,-3.5,12.0],[2.1,6.5,.9],'chest-emblem');
  box(chest,'metal',[0,-4.3,12.8],[.8,3.0,.6],'chest-emblem-core');
  box(hips,'scarfShade',[0,7,8.7],[14,3.3,3.1],'waist-ribbon');
  box(hips,'accent',[0,8.2,10.0],[6.4,1.1,1.0],'belt-detail');
  sleeve(chest,neck,'jacket',9.8,6.0,.91,1.17,'collar');
  sleeve(neck,head,'skin',5.7,6.0,.9,1.16,'neck');
  orb(neck,'scarf',[0,7.0,0],[9.6,6.8,9.5],'neck-scarf');
  box(neck,'scarfShade',[0,7.7,9.3],[10,2.0,1.5],'scarf-fold');
  // Long trailing cloth strips, not armor or robotic attachments.
  box(chest,'scarf',[11,-4,-11],[5,26,1.9],'scarf-tail-right',[.16,0,.12]);
  box(chest,'scarfShade',[6,-7,-12],[4,22,1.7],'scarf-tail-left',[-.14,0,-.14]);
  // Anime head: tapered jaw, thin brows and large, legible eyes facing +Z.
  orb(head,'skin',[0,10.1,1.5],[11.6,14.5,10.6],'face');
  orb(head,'skinShade',[0,1.8,5.5],[7.0,5.3,5.8],'jaw');
  orb(head,'skin',[0,4.0,5.7],[7.3,5.2,6.8],'chin');
  orb(head,'skin',[0,7.9,10.3],[3.0,3.7,2.5],'nose-base');
  orb(head,'skinShade',[0,5.7,12.4],[1.3,1.1,.45],'nose-shade');
  box(head,'shadow',[0,1.1,11.1],[4.3,.75,.8],'mouth');
  for(const side of [-1,1]){
   orb(head,'skin',[side*11.3,9.5,1.8],[2.4,4.3,3.2],'ear');
   orb(head,'whites',[side*4.8,11.3,10.9],[3.75,2.55,1.55],'anime-eye');
   orb(head,'iris',[side*4.75,11.3,12.0],[1.65,2.2,.83],'iris');
   orb(head,'pupil',[side*4.75,11.2,12.7],[.71,1.42,.31],'pupil');
   orb(head,'whites',[side*4.37,12.12,12.98],[.45,.60,.22],'eyelight');
   box(head,'brow',[side*4.8,15.8,10.85],[8.3,1.15,1.25],'brow',[0,0,-side*.10]);
   box(head,'hair',[side*5,14.3,11.5],[8.0,.75,1.0],'upper-eyelid',[0,0,-side*.08]);
  }
  // Distinct swept black/navy hair, with secondary coloured streaks.
  orb(head,'hair',[0,21.1,-.9],[12.3,8.2,11.1],'hair-cap');
  orb(head,'hair',[0,18.0,-6.1],[11.5,8.7,5.3],'hair-back');
  for(let i=0;i<9;i++){
   const a=(i-4)/4;
   tuft(head,i%4===0?'hairLight':'hair',[a*9,24.4,-1.2],
    [a*.58,.88,-.48],11+3*(1-Math.abs(a)),3.6,'spiky-crown');
  }
  for(let i=0;i<7;i++){
   const x=-10.5+i*3.5;
   tuft(head,i===4?'hairLight':'hair',[x,23.5,6.5],
    [x/23,-.80,.69],10.0+(i%2)*2,2.9,'swept-bang');
  }
  for(const side of [-1,1]){
   tuft(head,'hair',[side*10,19.4,-2],[side*.36,-.9,-.05],12,3.1,'temple-lock');
   tuft(head,'hair',[side*10,15.9,2],[side*.2,-.9,.2],8.3,2.4,'side-fringe');
  }
  // Two separate long sleeves bend with the elbows. Cloth cuffs follow
  // forearms rather than occupying the centre of the chest.
  for(const side of ['left','right']){
   const sign=side==='left'?1:-1,shoulder=B(side+'shoulder'),
    arm=B(side+'arm'),elbow=B(side+'forearm'),hand=B(side+'hand');
   sleeve(shoulder,arm,'jacket',7.1,7.8,.9,1.5,'shoulder-'+side);
   orb(arm,'jacketLight',[0,0,0],[8.1,7.0,8.1],'soft-shoulder');
   sleeve(arm,elbow,'jacket',8.3,6.4,.90,1.09,'upper-arm-'+side);
   orb(elbow,'jacket',[0,0,0],[6.0,5.8,5.9],'elbow');
   sleeve(elbow,hand,'cuff',5.3,4.7,.88,1.10,'wrapped-forearm-'+side);
   orb(elbow,'accent',[0,3,0],[5.8,2.3,5.4],'sleeve-cuff');
   orb(hand,'glove',[0,1.5,1],[5.1,6.4,5.0],'boxing-glove');
   orb(hand,'cuff',[0,3.9,3.6],[4.0,1.0,1.2],'knuckle-stripe');
   // Dynamic fingers remain bound to source bones (subtle glove divisions).
   for(const finger of ['index','middle','ring','pinky']){
    const f=B(side+'hand'+finger+'1');
    if(f)orb(f,'glove',[0,1.4,0],[1.65,3.0,1.65],'gloved-finger');
   }
   const thigh=B(side+'upleg'),knee=B(side+'leg'),foot=B(side+'foot'),toe=B(side+'toebase');
   sleeve(thigh,knee,'trousers',10.9,8.5,.90,1.10,'thigh-'+side);
   orb(thigh,'trousers',[0,0,0],[10.8,8.2,9.6],'hip-seam');
   sleeve(knee,foot,'trouserShade',8.0,6.8,.86,1.12,'shin-'+side);
   orb(knee,'trousers',[0,0,0],[8.7,7.7,8.2],'knee-cloth');
   orb(knee,'accent',[0,2,6.7],[3.0,1.3,1.0],'trouser-mark');
   orb(foot,'boot',[0,-1,0],[7.2,8.0,7.0],'ankle-boot');
   orb(foot,'accent',[0,4.5,4.3],[7.0,1.5,3.7],'boot-band');
   if(toe){
    sleeve(foot,toe,'sole',6.8,7.2,.91,1.21,'foot-'+side);
    orb(toe,'boot',[0,0,2.7],[7.2,4.8,10.0],'shoe-toe');
    orb(toe,'sole',[0,-3.5,3.6],[7.5,1.3,9.0],'shoe-sole');
   }
  }
  function setVisible(visible){for(const part of parts)part.visible=!!visible;}
  function dispose(){
   for(const obj of meshOwned)obj.removeFromParent();
   for(const g of geometries)g.dispose();
   for(const m of materials)m.dispose();
  }
  return {version:VERSION,parts,setVisible,dispose,source:'anime-original-native-bones',variant:options.rival?'rival':'kairo',boneCount:bones.size};
 }
 const api={version:VERSION,create,check};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 global.SkyClashAnimeKairo=api;
})(typeof window!=='undefined'?window:globalThis);
