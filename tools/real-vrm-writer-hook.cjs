(function(){
 const t={installed:false,registrations:[],current:null,active:false,phase:null,rows:{},last:{},nodes:[]};
 const label=()=>{const stack=new Error().stack||'';const names=[...stack.matchAll(/\/js\/(v[0-9]+-[a-z0-9-]+\.js)/ig)].map(m=>m[1]);return names.find(n=>n!=='v66-game-boot.js')||'unknown-'+t.registrations.length;};
 t.install=function(){
  const f=window.SkyClash?.Game?.heroes?.kairo_venn||window.SkyClash?.Game?.player;
  if(!f||typeof f.animate!=='function')throw Error('Missing Kairo before animation registration');
  let current=f.animate;
  Object.defineProperty(f,'animate',{configurable:true,enumerable:true,get(){return current;},set(fn){
   if(typeof fn!=='function')throw Error('Non-function animation wrapper');
   const owner=label();t.registrations.push(owner);
   current=function(...args){const prev=t.current;t.current=owner;try{return fn.apply(this,args);}finally{t.current=prev;}};
  }});
  t.fighter=f;t.installed=true;
 };
 t.begin=function(phase){t.phase=phase;t.active=true;t.rows={};t.last={};};
 t.end=function(){t.active=false;const stages=Object.entries(t.rows).map(([name,r])=>({name,calls:r.calls,changed:r.changed,bones:Object.keys(r.bones).sort()}));const x={phase:t.phase,stages,lastWriter:t.last,totalChanges:stages.reduce((n,r)=>n+r.changed,0)};t.phase=null;return x;};
 t.attachBones=function(names){
  const rig=t.fighter?.vrmRig?.vrm;
  if(!rig?.humanoid)throw Error('Missing real VRM humanoid');
  const q=['copy','set','identity','setFromEuler','setFromAxisAngle','setFromRotationMatrix','setFromUnitVectors','slerp','slerpQuaternions','multiply','premultiply','multiplyQuaternions','normalize','invert','conjugate'];
  const v=['copy','set','add','sub','lerp','lerpVectors','multiplyScalar','addScaledVector'];
  for(const boneName of names){
   const node=rig.humanoid.getNormalizedBoneNode(boneName);
   if(!node)throw Error('Missing bone '+boneName);
   for(const [value,names] of [[node.quaternion,q],[node.position,v]]){
    for(const method of names){
     const original=value[method];if(typeof original!=='function')continue;
     Object.defineProperty(value,method,{configurable:true,value:function(...args){
      if(!t.active||!t.current)return original.apply(this,args);
      const before=[this.x,this.y,this.z,this.w];
      const result=original.apply(this,args);
      const after=[this.x,this.y,this.z,this.w];
      const changed=before.some((x,i)=>Math.abs(x-after[i])>1e-9);
      const owner=t.current,row=t.rows[owner]||(t.rows[owner]={calls:0,changed:0,bones:{}});
      row.calls++;
      if(changed){row.changed++;row.bones[boneName]=true;t.last[boneName]=owner;}
      return result;
     }});
    }
   }
   t.nodes.push(boneName);
  }
 };
 window.__skyWriterAudit=t;t.install();
})();