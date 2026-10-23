/* Sky Clash V89 — isolated hand-authored idle → first step → walk → settle.
 * MovementLab=step only. No replacement of the approved idle/run clips.
 * Physics and rendered pose share one state clock; planted support foot is
 * held briefly through the very first stride instead of dragging along.
 */
(function(root){
 'use strict';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
 const eligible=f=>!!(f&&f.hp>0&&!f.flying&&!f.jumping&&!f.dropping&&
  !f.launched&&!f.spiked&&!f.dashing&&!f.sprinting&&!(f.punchT>0)&&
  !(f.downT>0)&&!(f.stun>0)&&!f.blocking&&!f.blockHeld&&
  !f.charging&&!f.slamming&&!(f.blastT>0)&&!(f.superHitT>0));
 function plan(f,dt){
  const delta=clamp(Number.isFinite(dt)?dt:0,0,.065);
  const s=f.v89Step||(f.v89Step={mode:'idle',elapsed:0,scale:0,serial:0,frames:0});
  if(!eligible(f)){
   if(s.mode!=='inactive'){s.mode='inactive';s.elapsed=0;s.serial++;}
   s.scale=1;return s;
  }
  const wants=Math.hypot(f.moveIntent?.x||0,f.moveIntent?.z||0)>.085;
  const speed=Math.hypot(f.vel?.x||0,f.vel?.z||0);
  function enter(next){if(s.mode!==next){s.mode=next;s.elapsed=0;s.serial++;}}
  if(wants){
   if(s.mode==='idle'||s.mode==='inactive')enter(speed>.7?'first-step':'anticipate');
   else if(s.mode==='settle')enter(speed>.7?'walk':'anticipate');
   s.elapsed+=delta;
   if(s.mode==='anticipate'&&s.elapsed>=.115)enter('first-step');
   if(s.mode==='first-step'&&s.elapsed>=.32)enter('walk');
   s.scale=s.mode==='anticipate'?0:
    s.mode==='first-step'?smooth((s.elapsed-.015)/.25):1;
  }else{
   if(s.mode==='anticipate'||s.mode==='inactive')enter('idle');
   else if(s.mode==='first-step'||s.mode==='walk')enter('settle');
   s.elapsed+=delta;
   if(s.mode==='settle'&&s.elapsed>=.22&&speed<.38)enter('idle');
   s.scale=0;
  }
  s.frames++;
  return s;
 }
 // Adjusts one planted foot in world space with bounded two-joint CCD.
 // Small increments, max 16cm travel correction, only in the first stride.
 function pinFoot(THREE,rig,chain,anchor,amount,st){
  if(amount<.02||!chain?.hip||!chain.knee||!chain.foot)return;
  const scene=rig.vrm.scene,foot=chain.foot,delta=new THREE.Quaternion(),
   inParent=new THREE.Quaternion(),inv=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),
   jointP=new THREE.Vector3(),endP=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),
   goal=new THREE.Vector3(),qWorld=new THREE.Quaternion();
  scene.updateMatrixWorld(true);foot.getWorldPosition(endP);
  // Reject unreachable foot anchors instead of violently stretching knees.
  goal.copy(anchor);
  if(goal.distanceTo(endP)>.19)goal.lerp(endP,1-.19/goal.distanceTo(endP));
  for(let k=0;k<2;k++)for(const node of [chain.knee,chain.hip]){
   scene.updateMatrixWorld(true);
   node.getWorldPosition(jointP);foot.getWorldPosition(endP);
   a.subVectors(endP,jointP);b.subVectors(goal,jointP);
   if(a.lengthSq()<1e-7||b.lengthSq()<1e-7)continue;
   a.normalize();b.normalize();
   const angle=Math.acos(clamp(a.dot(b),-1,1));
   if(angle<.002)continue;
   qWorld.setFromUnitVectors(a,b);
   const limit=(node===chain.knee?.055:.095)*amount;
   delta.identity().slerp(qWorld,Math.min(1,limit/angle));
   node.parent.getWorldQuaternion(parentQ);
   inv.copy(parentQ).invert();
   inParent.copy(inv).multiply(delta).multiply(parentQ);
   node.quaternion.premultiply(inParent).normalize();
  }
  scene.updateMatrixWorld(true);
  st.pins++;
 }
 function attach(THREE,f){
  if(!f||typeof f.animate!=='function'||f.v89StepVisual)return null;
  const old=f.animate,axisX=new THREE.Vector3(1,0,0),axisZ=new THREE.Vector3(0,0,1),
   sway=new THREE.Quaternion(),bend=new THREE.Quaternion();
  const st={rig:null,serial:-1,lastMode:null,pins:0,frame:0,left:null,right:null,
   support:null};
  const joints=(hum,side)=>({
   hip:hum.getNormalizedBoneNode(side+'UpperLeg'),
   knee:hum.getNormalizedBoneNode(side+'LowerLeg'),
   foot:hum.getNormalizedBoneNode(side+'Foot')
  });
  f.animate=function(dt){
   old.call(this,dt);
   const g=this.v89Step,rig=this.vrmRig;
   if(!rig?.vrm||!g||g.mode==='inactive')return;
   try{
    if(st.rig!==rig){
     st.rig=rig;const h=rig.vrm.humanoid;
     st.left=joints(h,'left');st.right=joints(h,'right');
     st.hips=h.getNormalizedBoneNode('hips');
     st.spine=h.getNormalizedBoneNode('spine');
     st.support=null;st.serial=-1;
    }
    const scene=rig.vrm.scene,mode=g.mode;
    if(mode==='anticipate'&&st.lastMode!=='anticipate'){
     scene.updateMatrixWorld(true);
     // Alternate the leading leg each time a new walk begins.
     st.lead=st.lead==='right'?'left':'right';
     st.support=st.lead==='right'?st.left:st.right;
     st.anchor=st.support.foot.getWorldPosition(new THREE.Vector3());
    }
    st.lastMode=mode;
    if(mode==='anticipate'||mode==='first-step'){
     const takeoff=mode==='anticipate'?smooth(g.elapsed/.115):1;
     const phase=mode==='first-step'?smooth(g.elapsed/.32):0;
     const fade=mode==='anticipate'?1:
       1-smooth((phase-.65)/.35);
     const lean=(.026*takeoff)*fade;
     const sign=st.lead==='right'?1:-1;
     if(st.hips){
      sway.setFromAxisAngle(axisZ,lean*sign);
      st.hips.quaternion.multiply(sway);
     }
     if(st.spine){
      sway.setFromAxisAngle(axisZ,-lean*.60*sign);
      st.spine.quaternion.multiply(sway);
     }
     // A bespoke preparatory leading-foot lift that dies out as the
     // actual imported walk reaches its normal cyclic gait.
     if(mode==='first-step'){
      const rise=Math.sin(Math.PI*phase)*fade;
      const leg=st.lead==='right'?st.right:st.left;
      const face=rig.legacyAxes?-1:1;
      if(leg.hip){
       bend.setFromAxisAngle(axisX,face*(-.16*rise));
       leg.hip.quaternion.multiply(bend);
      }
      if(leg.knee){
       bend.setFromAxisAngle(axisX,face*(.24*rise));
       leg.knee.quaternion.multiply(bend);
      }
     }
     if(st.support&&st.anchor){
      pinFoot(THREE,rig,st.support,st.anchor,
       mode==='anticipate'?1:1-smooth((phase-.68)/.30),st);
     }
    }
    if(mode==='settle'&&Math.hypot(this.vel?.x||0,this.vel?.z||0)<.55){
     if(st.lastSettleSerial!==g.serial){
      scene.updateMatrixWorld(true);
      st.leftAnchor=st.left.foot.getWorldPosition(new THREE.Vector3());
      st.rightAnchor=st.right.foot.getWorldPosition(new THREE.Vector3());
      st.lastSettleSerial=g.serial;
     }
     const settle=1-smooth(g.elapsed/.22);
     pinFoot(THREE,rig,st.left,st.leftAnchor,settle*.6,st);
     pinFoot(THREE,rig,st.right,st.rightAnchor,settle*.6,st);
    }
    // Approved standing idle is NEVER touched by this module.
    rig.vrm.update(0);
    st.frame++;
    if(root.SkyClashMovementLab){
     root.SkyClashMovementLab.motion=mode;
     root.SkyClashMovementLab.pinCorrections=st.pins;
    }
   }catch(err){
    root.SkyClashMovementLab&&(root.SkyClashMovementLab.error=String(err));
    console.warn('V89 step visuals disabled; original animation stays playable',err);
    this.animate=old;this.v89StepVisual=null;
   }
  };
  f.v89StepVisual=st;return st;
 }
 function start(context=root){
  const status={version:89,ready:false,characters:0};
  context.SkyClashV89=status;
  for(const f of [context.SkyClash?.Game?.heroes?.kairo_venn]){
   if(attach(context.THREE,f))status.characters++;
  }
  status.ready=status.characters>0;
  return status;
 }
 const api={version:89,smooth,eligible,plan,start,attach};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SkyClashWalkStep=api;
})(typeof window!=='undefined'?window:globalThis);
