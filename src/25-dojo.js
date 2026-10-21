/* ---------------- Character training space: Martial Dojo ----------------
 * Environment and equipment are separate from the tournament map. Each prop
 * exposes a hit volume and response that can later be replaced per character.
 */
const Dojo = (() => {
  const room = new THREE.Group(); room.name = 'Martial Dojo'; room.visible = false; scene.add(room);
  const objects = [];
  const mat = (color, roughness=0.92, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
  const wood = mat(0x654330), dark = mat(0x312720), pale = mat(0xcbb796), woodLight=mat(0x927052);
  const tatami=mat(0xaca58a), matEdge=mat(0x50412f), cloth=mat(0x694032), rope=mat(0xbeb394);
  const copper=mat(0xa27848,0.45,0.45), paper=mat(0xe6ddc7,0.8), red=mat(0x903d32);
  const mk=(geo,m,parent=room,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;parent.add(o);return o;};
  const cube=(w,h,d,m,x,y,z,parent=room)=>mk(new THREE.BoxGeometry(w,h,d),m,parent,x,y,z);
  const cyl=(rt,rb,h,m,x,y,z,parent=room,n=12)=>mk(new THREE.CylinderGeometry(rt,rb,h,n),m,parent,x,y,z);
  // Raised training platform matches the gameplay floor height (0.35), without new collision rules.
  cube(43,0.35,43,dark,0,0.16,0);
  cube(41,0.09,41,woodLight,0,0.34,0);
  // One instanced draw call for the floor rather than hundreds of separate tiles.
  const mats = new THREE.InstancedMesh(new THREE.BoxGeometry(2.35,0.015,2.35),tatami,289);
  const tileMatrix=new THREE.Matrix4(), tilePos=new V3(),tileRot=new THREE.Quaternion(),tileScale=new V3(1,1,1),tileColor=new THREE.Color();
  let tileIdx=0;
  for(let i=-8;i<=8;i++)for(let j=-8;j<=8;j++){
    const warm=((i+j)%4===0);
    tilePos.set(i*2.36,0.397,j*2.36);
    tileScale.set(1,1,warm?0.98:1);
    mats.setMatrixAt(tileIdx,tileMatrix.compose(tilePos,tileRot,tileScale));
    mats.setColorAt(tileIdx,tileColor.setHex(warm?0x857962:0xbcb296));
    tileIdx++;
  }
  mats.receiveShadow=true; mats.castShadow=false;room.add(mats);
  // Cedar posts, upper beams and recessed shoji paper panels.
  for(const axis of ['x','z'])for(const sign of [-1,1]){
    for(let i=-4;i<=4;i++){
      const x=axis==='x'?i*5.05:sign*21.3, z=axis==='z'?i*5.05:sign*21.3;
      cube(0.55,13.8,0.55,dark,x,7.1,z);
    }
    for(const y of [3.5,7.6,12.7]){
      const o=axis==='x'?cube(43,0.32,0.45,woodLight,0,y,sign*21.3):cube(0.45,0.32,43,woodLight,sign*21.3,y,0);
      o.castShadow=true;
    }
    for(let i=-4;i<4;i++)for(let level=0;level<2;level++){
      const a=i*5.05+2.52;
      const o=axis==='x'?cube(4.5,3.5,0.09,paper,a,5.45+level*3.9,sign*21.2):cube(0.09,3.5,4.5,paper,sign*21.2,5.45+level*3.9,a);
      o.receiveShadow=false;
      for(let line=-1;line<=1;line++){
        if(axis==='x') cube(0.07,3.8,0.10,wood,a+line*1.1,5.45+level*3.9,sign*21.17);
        else cube(0.10,3.8,0.07,wood,sign*21.17,5.45+level*3.9,a+line*1.1);
      }
    }
  }
  // Overhead crossbeams and rafters. Roof centre remains open to the game camera/flight.
  for(const x of [-17,-9,-1,7,15]) cube(0.42,0.54,43,dark,x,13.3,0);
  for(const z of [-17,-9,-1,7,15]) cube(43,0.54,0.42,dark,0,13.3,z);
  for(let i=0;i<8;i++) {
    const x=-17+i*4.8;
    const lamp=cyl(0.32,0.32,0.8,paper,x,11.8,-18,room,8);lamp.material=paper;
    cyl(0.41,0.41,0.12,wood,x,12.25,-18);cyl(0.41,0.41,0.12,wood,x,11.36,-18);
  }
  // Tokonoma training alcove and a deliberately readable title panel.
  cube(14,0.18,1.2,wood,0,0.56,-19.3);
  cube(10,4.7,0.12,dark,0,8,-20.98);
  cube(9.2,4,0.14,paper,0,8,-20.91);
  for(const xx of [-3.9,-1.3,1.3,3.9]) cube(0.08,4.2,0.17,wood,xx,8,-20.79);
  // Equipment is positioned inside the playable stage and never obstructs the initial spawn.
  function putTarget(id,type,x,z,h,r,parent,swing=null) {
    const p=new V3(x,STAGE_H+h,z);
    const target={id,type,pos:p,radius:r,group:parent,base:parent.rotation.z,hitT:0,recoil:0,velocity:0,hits:0,swing};
    objects.push(target);return target;
  }
  // Two suspended heavy bags with canvas seams and decorative binding.
  function bag(x,z,id) {
    const rig=new THREE.Group();rig.position.set(x,7.3,z);room.add(rig);
    cyl(0.06,0.06,2.9,rope,0,-1.5,0,rig,7);
    const body=cyl(0.64,0.59,3.0,cloth,0,-4.3,0,rig,16);
    cyl(0.64,0.64,0.18,dark,0,-2.76,0,rig,16);
    cyl(0.61,0.61,0.20,dark,0,-5.8,0,rig,16);
    for(let y=-5.55;y<-3.0;y+=0.48) cyl(0.649,0.649,0.023,rope,0,y,0,rig,16);
    // Collision is fixed at the rest position: swinging is a visual response.
    putTarget(id,'bag',x,z,2.5,1.45,rig,rig);
  }
  bag(-7,-2,'heavy-bag');bag(-12,-9,'speed-bag');
  // Traditional wooden wing-chun practice dummy with arm pegs.
  function dummy(x,z,id) {
    const rig=new THREE.Group();rig.position.set(x,STAGE_H,z);room.add(rig);
    cyl(0.18,0.21,0.45,dark,0,0.22,0,rig);
    cyl(0.38,0.40,4.4,woodLight,0,2.6,0,rig,12);
    cyl(0.46,0.42,0.42,wood,0,4.65,0,rig,12);
    const arms=[[-0.9,3.6,0.63],[0.9,3.6,0.63],[0,2.45,0.85]];
    arms.forEach(([ax,ay,az])=>{const arm=cyl(0.13,0.18,1.7,wood,ax,ay,az,rig,9);arm.rotation.z=ax>0?1.03:ax<0?-1.03:0; if(!ax)arm.rotation.x=1.02;});
    const leg=cyl(0.16,0.21,1.65,wood,-0.25,1.1,0.65,rig);leg.rotation.x=0.5;
    cyl(0.58,0.7,0.26,dark,0,0.12,0,rig);
    putTarget(id,'dummy',x,z,2.45,1.05,rig,rig);
  }
  dummy(7,-4,'wood-dummy');
  // Three round marked blast targets on stands. Their colour flashes on a clean hit.
  const targetGeo=new THREE.CylinderGeometry(0.95,0.95,0.12,32);
  const targetMats=[mat(0x2d4751),mat(0xaeb6ad),mat(0x9d5141)];
  function blastTarget(x,z,id) {
    const rig=new THREE.Group();rig.position.set(x,STAGE_H,z);room.add(rig);
    cyl(0.10,0.12,2.1,dark,0,1.05,0,rig);
    cube(1.9,0.14,1.15,wood,0,0.12,0,rig);
    const disk=mk(targetGeo,targetMats[0],rig,0,2.20,0);disk.rotation.x=Math.PI/2;
    for(const [rad,m] of [[0.72,targetMats[1]],[0.44,targetMats[2]],[0.16,targetMats[1]]]){
      const ring=cyl(rad,rad,0.13,m,0,2.20,0.11,rig,32);ring.rotation.x=Math.PI/2;
    }
    putTarget(id,'target',x,z,2.2,1.22,rig,rig);
  }
  blastTarget(0,-12,'centre-target');blastTarget(10,-11,'right-target');
  // Simple racks and scrolls make the place feel inhabited, not a blank test box.
  for(const x of [-17,17]) {
    cube(2.0,3.2,0.5,wood,x,2.0,7.5);
    for(let y=1.6;y<=3.4;y+=0.9) cube(2.5,0.1,0.7,woodLight,x,y,7.5);
    cyl(0.75,0.75,0.18,red,x,0.52,10.5);
  }
  // FX: hit counter, recoil and sparks; no continuously running heavyweight particle systems.
  let score=0;
  function hit(obj,damage,pos) {
    if(!room.visible)return false;
    obj.hits++;score++;obj.hitT=0.24;
    obj.velocity += Math.min(1.4,0.35+damage*0.018)*(Math.random()>0.5?1:-1);
    const c=pos || obj.pos;
    Effects.sparks(c,0xffe0ad,5);
    Effects.flash(c,0xfff0c5,0.7,0.10);
    const stat=$('dojoHits');if(stat)stat.textContent=String(score);
    if(score===1||score%5===0) toast(score===1?'Clean hit!':score+' dojo hits');
    return true;
  }
  function hitMelee(f,stage,kick) {
    if(!room.visible || f!==Game.player)return false;
    const origin=f.center, facing=f.forward();let found=null,closest=Infinity;
    for(const obj of objects) {
      const delta=obj.pos.clone().sub(origin);const dist=delta.length();
      const flat=delta.clone().setY(0);if(flat.lengthSq()<0.001)continue;
      flat.normalize();
      if(dist<3.9+(kick?0.3:0)&&dist<closest&&facing.dot(flat)>0.55){found=obj;closest=dist;}
    }
    return found?hit(found,9+stage*4,found.pos):false;
  }
  function hitBlast(a,b,lvl) {
    if(!room.visible)return false;
    for(const obj of objects) {
      const v=b.clone().sub(a),w=obj.pos.clone().sub(a),length=v.lengthSq();
      const t=length>0?Math.max(0,Math.min(1,w.dot(v)/length)):0;
      const closest=a.clone().addScaledVector(v,t);
      if(closest.distanceTo(obj.pos)<obj.radius+0.58+lvl*0.38) {
        hit(obj,14+lvl*25,closest);
        return true;
      }
    }
    return false;
  }
  function resolveCollisions(f) {
    if(!room.visible)return;
    // Keep the player inside the wooden hall and below the camera-height rafters.
    f.pos.x=Math.max(-19.5,Math.min(19.5,f.pos.x));
    f.pos.z=Math.max(-19.5,Math.min(19.5,f.pos.z));
    f.pos.y=Math.max(STAGE_H,Math.min(10.6,f.pos.y));
    if(f.pos.y>STAGE_H+2.2)return;
    for(const obj of objects) {
      const r=obj.type==='bag'?0.94:0.8;
      const dx=f.pos.x-obj.pos.x,dz=f.pos.z-obj.pos.z,d=Math.hypot(dx,dz);
      if(d<r&&d>0.0001){f.pos.x+=(dx/d)*(r-d);f.pos.z+=(dz/d)*(r-d);}
    }
  }
  function update(dt) {
    if(!room.visible)return;
    for(const obj of objects) {
      obj.hitT=Math.max(0,obj.hitT-dt);
      obj.velocity += (-obj.recoil*13-obj.velocity*5.4)*dt;
      obj.recoil += obj.velocity*dt;
      if(obj.swing){obj.group.rotation.z=obj.recoil*0.22;obj.group.rotation.x=obj.recoil*0.10;}
    }
  }
  function show(on) {room.visible=!!on;if(on){score=0;const stat=$('dojoHits');if(stat)stat.textContent='0';}}
  function resetProps() {score=0;objects.forEach(o=>{o.hits=0;o.hitT=0;o.recoil=0;o.velocity=0;if(o.swing){o.group.rotation.z=0;o.group.rotation.x=0;}});const el=$('dojoHits');if(el)el.textContent='0';}
  return {room, objects, show, update, hitMelee, hitBlast, resolveCollisions, resetProps, get score(){return score;}, kind:'martial'};
})();
