// Regression for V64's bent guard: live master joints must stay outside the
// torso and elbows must remain below the fists in the recorded idle stance.
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const THREE=require('../js/vendor/three.min.js');
const Skin=require('../assets/characters/master/model.js');
const ROOT=path.join(__dirname,'..');
function group(){return new THREE.Group();}
function fighter(){
 const model={body:group(),pelvis:group(),spine:group(),head:group(),arms:[],legs:[],parts:[]};
 for(const sign of [-1,1]){
  model.arms.push({sh:group(),el:group(),fist:group(),side:sign});
  model.legs.push({hip:group(),knee:group(),foot:group(),side:sign});
 }
 const placeholder=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),new THREE.MeshStandardMaterial());
 model.body.add(placeholder);model.parts.push(placeholder);
 return {model,characterId:'kairo_venn',vel:new THREE.Vector3(),hp:100,
  flying:false,launched:false,spiked:false,sprinting:false,dashing:false,
  attackSerial:1,attackKind:'punch',attackElapsed:0,attackTotal:.42,
  punchSide:1,punchT:0,animate(){this.frames=(this.frames||0)+1;}};
}
async function main(){
 const kairo=fighter(),enemy=fighter();
 const sc={Game:{heroes:{kairo_venn:kairo},enemy}};
 const win={SkyClash:sc,SkyClashMixamoMaster:Skin,THREE};
 const base={window:win,THREE,location:{search:''},URLSearchParams,console};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'js/v62-playable-master.js'),'utf8'),base);
 assert(kairo.v62Master&&enemy.v62Master,'both fighters should have the native master');
 const bones=kairo.v62Master.bones;
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1;
  const shoulder=bones.get(side+'shoulder'),upper=bones.get(side+'arm');
  const elbow=bones.get(side+'forearm'),wrist=bones.get(side+'hand');
  assert(sign*shoulder.position.x>10,'shoulder must be clear of torso');
  assert(sign*upper.position.x>5,'upper arm must extend outward');
  assert(sign*elbow.position.x>10,'upper arm extends outward, not inside chest');
  assert(sign*wrist.position.x<0,'forearm returns toward face');
  assert(wrist.position.y>18,'forearm bends upward, not down into pelvis');
 }
 const fetch=async url=>({ok:true,async text(){return fs.readFileSync(path.join(ROOT,url.split('?')[0]),'utf8');}});
 const ctx={...base,fetch,atob,Uint8Array,Int16Array,Set,Map,Math,Number,Promise};
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,'js/v63-recorded-motion.js'),'utf8'),ctx);
 await new Promise(setImmediate);
 assert(sc.v63?.ready,'V63 recorded driver must initialise');
 const left=bones.get('lefthand'),right=bones.get('righthand'),
       le=bones.get('leftforearm'),re=bones.get('rightforearm');
 function joint(n){kairo.model.body.updateMatrixWorld(true);return n.getWorldPosition(new THREE.Vector3());}
 for(let n=0;n<120;n++){
  kairo.animate(1/60);
  if(n%15!==0)continue;
  const lh=joint(left),rh=joint(right),lel=joint(le),rel=joint(re);
  assert(lh.x>.12 && rh.x<-.12,'rest stance arms must not disappear into the chest');
  assert(lh.y>lel.y+.10 && rh.y>rel.y+.10,'both forearms should bend upward in the fighting guard');
 }
 assert(kairo.v63Recorded.active==='mxKIdle');
 assert(!sc.v63.error,'no recorded animation errors');
 console.log('PASS: V64 guard bind, symmetric arms, Mixamo idle joint clearance and raised forearms');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
