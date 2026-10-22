/* Sky Clash V62 — playable native-bone master visual (preview).
 * Native Mixamo-named bones and V60 skin. CURRENT MOTIONS are controlled by
 * the game's procedural pose layer, not by FBX playback. No VRM retargeting.
 * ?classic=1 restores legacy procedural fighters without this layer.
 */
(function () {
 'use strict';
 if(new URLSearchParams(location.search).get('classic')==='1')return;
 // A real imported Kairo VRM takes priority over the V60/V65 procedural geometry.
 if(window.SKY_V66_REAL_KAIRO)return;
 const game=window.SkyClash?.Game, THREE=window.THREE, skin=window.SkyClashMixamoMaster;
 if(!game||!THREE||!skin){console.warn('V62 master unavailable; retaining original geometry');return;}
 function attach(fighter){
  if(!fighter||fighter.vrmRig||fighter.v62Master)return false;
  const m=fighter.model, anchor=new THREE.Group(), bones=new Map(), pose=[];
  anchor.name='V62_NativeMixamo_Master';anchor.scale.setScalar(.01);
  function bone(name,parent,x,y,z,follow){
   const b=new THREE.Bone();b.name='mixamorig:'+name;b.position.set(x,y,z);
   (parent||anchor).add(b);bones.set(name.toLowerCase(),b);
   if(follow)pose.push([b,follow]);return b;
  }
  const hips=bone('Hips',null,0,0,0,m.pelvis);
  const spine=bone('Spine',hips,0,14,0,m.spine);
  const spine1=bone('Spine1',spine,0,15,0);
  const spine2=bone('Spine2',spine1,0,15,0);
  const neck=bone('Neck',spine2,0,18,0);
  const head=bone('Head',neck,0,10,0,m.head);
  bone('HeadTop_End',head,0,22,0);
  for(const side of ['Left','Right']){
   const index=side==='Left'?1:0,sign=side==='Left'?1:-1,a=m.arms[index],l=m.legs[index];
   // V64: bind a readable two-bend martial-arts guard instead of vertical
   // shoulder-to-wrist columns. V63 treats the recorded idle as this bind
   // reference, so the rest pose and motion agree instead of pulling elbows
   // through the chest.
   const shoulder=bone(side+'Shoulder',spine2,sign*15,0,0);
   const arm=bone(side+'Arm',shoulder,sign*8,-6,0,a.sh);
   const forearm=bone(side+'ForeArm',arm,sign*16,-21,17,a.el);
   const hand=bone(side+'Hand',forearm,-sign*14,25,15,a.fist);
   for(const [i,n] of ['Index','Middle','Ring','Pinky'].entries())bone(side+'Hand'+n+'1',hand,(i-1.5)*2,-7,3);
   const upper=bone(side+'UpLeg',hips,sign*14,-8,0,l.hip);
   const knee=bone(side+'Leg',upper,0,-43,0,l.knee);
   const foot=bone(side+'Foot',knee,0,-41,0,l.foot);
   bone(side+'ToeBase',foot,0,-7,10);
  }
  try {
   m.body.add(anchor);anchor.updateMatrixWorld(true);
   // V65 swaps only the visual skin; the V64 skeleton and recorded motions
   // remain untouched. ?skin=master reverts to the previous test mannequin.
   const anime=window.SkyClashAnimeKairo;
   const useAnime=new URLSearchParams(location.search).get('skin')!=='master' && anime?.check(bones).valid;
   let master;
   if(useAnime){
    try{master=anime.create(THREE,bones,anchor,{rival:fighter===game.enemy});}
    catch(err){console.warn('V65 anime skin failed, using original master',err);}
   }
   if(!master)master=skin.create(THREE,bones,anchor);
   if(!master?.parts?.length)throw Error('Master has no meshes');
   for(const part of m.parts)part.visible=false;
   fighter.v62Master={master,anchor,bones,skin:master.source};
   const original=fighter.animate.bind(fighter);
   fighter.animate=function(dt){
    original(dt);
    for(const [bone,from] of pose)bone.quaternion.copy(from.quaternion);
   };
   return true;
  }catch(err){
   console.error('V62 master setup failed; legacy procedural body retained',err);
   anchor.removeFromParent();for(const part of m.parts)part.visible=true;
   return false;
  }
 }
 let applied=0;
 try {
  applied+=Number(attach(game.heroes?.kairo_venn||game.player));
  applied+=Number(attach(game.enemy));
  // Rin retains its own procedural ninja skin; no old VRMs loaded.
  console.info('Sky Clash V62: '+applied+' native-bone master fighter visuals installed. Motion source: procedural game controller; Mixamo FBX playback is NOT yet wired.');
 }catch(err){console.error('Sky Clash V62 setup error',err);}
})();
