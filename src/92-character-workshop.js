/* V56 Character Workshop — independent, bounded per-fighter pose controls.
 * Profiles are LOCAL to the user's browser. No VRM bone transform is written
 * here: angles modify the already-correct guide rig and VRMRig retargets once.
 */
const CharacterWorkshop = (() => {
  const IDS = ['kairo_venn','rin_sable'];
  const MODES = ['idle','walk','run'];
  const DEFINITIONS = [
    ['rShoulder','Right shoulder',-70,70,1,'Arms'],
    ['rSpread','Right arm spread',-45,45,1,'Arms'],
    ['rElbow','Right elbow',-75,75,1,'Arms'],
    ['lShoulder','Left shoulder',-70,70,1,'Arms'],
    ['lSpread','Left arm spread',-45,45,1,'Arms'],
    ['lElbow','Left elbow',-75,75,1,'Arms'],
    ['rHip','Right thigh',-55,55,1,'Legs'],
    ['rKnee','Right knee',-45,65,1,'Legs'],
    ['lHip','Left thigh',-55,55,1,'Legs'],
    ['lKnee','Left knee',-45,65,1,'Legs'],
    ['chestYaw','Chest turn',-35,35,1,'Body'],
    ['chestPitch','Chest lean',-32,32,1,'Body'],
    ['headPitch','Head tilt',-24,24,1,'Body'],
    ['height','Body height',-25,25,1,'Body'],
    ['stride','Stride length',60,160,1,'Locomotion'],
    ['cadence','Step rhythm',60,165,1,'Locomotion'],
    ['kneelift','Knee lift',50,170,1,'Locomotion']
  ];
  const DEF = Object.fromEntries(DEFINITIONS.map(d=>[d[0],d]));
  const DEFAULT = () => Object.fromEntries(DEFINITIONS.map(d=>[d[0],d[5]==='Locomotion'?100:0]));
  const make = () => Object.fromEntries(IDS.map(id=>[id,Object.fromEntries(MODES.map(mode=>[mode,DEFAULT()]))]));
  const poses = make();
  const options = {kairo_venn:{recorded:true,assigned:'none'},rin_sable:{recorded:false,assigned:'none'}};
  const ACTIONS = ['none','punch','hook','kick','ninjaPalm','ninjaElbow','ninjaSpin','ninjaRising'];
  const takes = {kairo_venn:[],rin_sable:[]};
  let active=false, fighterId='rin_sable', mode='idle', scrub=0, duration=2, playing=false, time=0;
  let clipPreview=false, isDirty=false, openBefore='title';
  const $w=id=>document.getElementById(id);
  const finite=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):0));
  const clone = obj=>JSON.parse(JSON.stringify(obj));
  const deg=Math.PI/180;
  const format=v=>(Math.round(v*10)/10).toString();
  function parsePose(src) {
    const out=DEFAULT();
    if(src&&typeof src==='object') for(const d of DEFINITIONS)if(Object.prototype.hasOwnProperty.call(src,d[0]))
      out[d[0]]=finite(src[d[0]],d[2],d[3]);
    return out;
  }
  function load() {
    try {const raw=JSON.parse(localStorage.getItem('skyClashWorkshopV56')||'null');
      if(!raw||raw.format!=='sky-clash-workshop'||raw.version!==1)return;
      for(const id of IDS){for(const m of MODES)poses[id][m]=parsePose(raw.profiles?.[id]?.[m]);
        if(raw.options?.[id]) {options[id].recorded=!!raw.options[id].recorded;
          options[id].assigned=ACTIONS.includes(raw.options[id].assigned)?raw.options[id].assigned:'none';}
        if(Array.isArray(raw.takes?.[id]))takes[id]=raw.takes[id].slice(0,120).map(f=>({t:finite(f.t,0,8),pose:parsePose(f.pose)})).sort((a,b)=>a.t-b.t);
      }
    }catch(e){console.warn('Workshop profile ignored',e);}
  }
  function payload(){return {format:'sky-clash-workshop',version:1,profiles:clone(poses),takes:clone(takes),options:clone(options)};}
  function save(silent=false){try{localStorage.setItem('skyClashWorkshopV56',JSON.stringify(payload()));isDirty=false;if(!silent)status('Saved to this browser. Export JSON for a backup.');}catch(e){status('Browser storage unavailable. Export JSON instead.');}}
  function status(msg){const el=$w('wsStatus');if(el)el.textContent=msg;}
  function editable(){return poses[fighterId][mode];}
  function refreshInputs(){
    $w('wsFighter').value=fighterId; $w('wsMode').value=mode;
    const values=editable();
    if($w('wsRecorded')){$w('wsRecorded').checked=!!options[fighterId].recorded;$w('wsRecorded').disabled=fighterId==='rin_sable';}
    if($w('wsAssign'))$w('wsAssign').value=options[fighterId].assigned;
    if($w('wsPreset'))$w('wsPreset').textContent=fighterId==='rin_sable'?'✦ Try Shadow Runner preset':'↺ Restore Kairo baseline';
    document.querySelectorAll('#wsSliders input[data-pose]').forEach(input=>{
      input.value=values[input.dataset.pose];
      const out=$w('wso-'+input.dataset.pose);if(out)out.textContent=format(values[input.dataset.pose])+(DEF[input.dataset.pose][5]==='Locomotion'?'%':'°');
    });
    const tip=$w('wsFighterNote');if(tip)tip.textContent=fighterId==='rin_sable'
      ? 'Rin · VRM 0.x: safe guide-rig poses only. Raw Mixamo retargeting is deliberately disabled.'
      : 'Kairo · VRM 1.x: safe pose edits plus baked animation previews.';
    refreshTimeline();
  }
  function renderControls(){
    const target=$w('wsSliders');if(!target)return;target.textContent='';
    let last='';for(const [key,label,min,max,step,group] of DEFINITIONS){
      if(group!==last){last=group;const h=document.createElement('h4');h.textContent=group;target.appendChild(h);}
      const row=document.createElement('label');row.className='ws-slider';
      const cap=document.createElement('span');cap.textContent=label;
      const out=document.createElement('output');out.id='wso-'+key;
      const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;
      input.dataset.pose=key;
      input.addEventListener('input',()=>{
        editable()[key]=finite(input.value,min,max);out.textContent=format(input.value)+(group==='Locomotion'?'%':'°');
        playing=false;isDirty=true;status('Unsaved changes · edit, save, or export');
      });
      row.append(cap,input,out);target.appendChild(row);
    }
  }
  function snapshot(t=Number($w('wsTimeline')?.value||0)){
    const arr=takes[fighterId];const pos=finite(t,0,8), data={t:pos,pose:clone(editable())};
    const ix=arr.findIndex(a=>Math.abs(a.t-pos)<0.035);
    if(ix<0)arr.push(data);else arr[ix]=data;
    arr.sort((a,b)=>a.t-b.t);isDirty=true;refreshTimeline();status('Keyframe set. Add another frame at a different time.');
  }
  function refreshTimeline(){
    const list=$w('wsKeyframes');if(!list)return;list.textContent='';
    const arr=takes[fighterId];
    for(let i=0;i<arr.length;i++){
      const frame=arr[i];const b=document.createElement('button');b.type='button';b.className='ws-key';
      b.textContent=frame.t.toFixed(2)+'s';b.title='Click to edit this pose';
      b.addEventListener('click',()=>{playing=false;mode='idle';const x=frame.pose;Object.assign(editable(),parsePose(x));$w('wsTimeline').value=frame.t;time=frame.t;refreshInputs();});
      list.appendChild(b);
    }
    const n=$w('wsCount');if(n)n.textContent=`${arr.length} frames · ${arr.length<2?'Add at least two to play':''}`;
  }
  function interpolate(arr,t){
    if(!arr.length)return null;
    if(t<=arr[0].t)return arr[0].pose;
    if(t>=arr[arr.length-1].t)return arr[arr.length-1].pose;
    let i=0;while(i<arr.length-2&&arr[i+1].t<t)i++;
    const a=arr[i],b=arr[i+1],u=(t-a.t)/Math.max(0.001,b.t-a.t),v={};
    for(const [key] of DEFINITIONS)v[key]=a.pose[key]+(b.pose[key]-a.pose[key])*u;
    return v;
  }
  function rotateGuidePose(f, P, v){
    if(!v)return P;
    const p={arm:P.arm.map(a=>a.slice()),leg:P.leg.map(a=>a.slice()),spineY:P.spineY,spineX:P.spineX,headX:P.headX};
    const adj=(arr,i,j,key)=>{arr[i][j]+=v[key]*deg;};
    adj(p.arm,0,0,'rShoulder');adj(p.arm,0,1,'rSpread');adj(p.arm,0,2,'rElbow');
    adj(p.arm,1,0,'lShoulder');adj(p.arm,1,1,'lSpread');adj(p.arm,1,2,'lElbow');
    adj(p.leg,0,0,'rHip');adj(p.leg,0,1,'rKnee');adj(p.leg,1,0,'lHip');adj(p.leg,1,1,'lKnee');
    if(actualMode(f)!=='idle' || active&&mode!=='idle') {
      const lift=finite(v.kneelift,50,170)/100;
      p.leg[0][1]=Math.max(0.03,p.leg[0][1]*lift);p.leg[1][1]=Math.max(0.03,p.leg[1][1]*lift);
    }
    p.spineY+=v.chestYaw*deg;p.spineX+=v.chestPitch*deg;p.headX+=v.headPitch*deg;
    f.model.body.position.y+=v.height/100;
    if(f.vrmRig?.anim && active && f===Game.player&&!clipPreview){f.vrmRig.anim.one=null;f.vrmRig.anim.prevOne=null;}
    return p;
  }
  function actualMode(f){
    if(active&&Game?.player===f)return mode;
    if(f.sprinting)return 'run';
    return f.runW>0.40?'walk':'idle';
  }
  function valuesFor(f){
    const id=f.characterId;
    if(!Object.prototype.hasOwnProperty.call(poses,id))return null;
    if(active&&Game?.player===f&&playing&&takes[id].length>=2)
      return interpolate(takes[id],time);
    return poses[id][actualMode(f)];
  }
  function applyPose(f,P){
    if(!P || !f || !f.model)return P;
    if(active&&f===Game.player&&clipPreview)return P;
    // Combat animations retain authority. Editing cannot distort a live strike.
    const editing=active&&f===Game.player;
    if(!editing && (f.stun>0||f.launched||f.downT>0||f.flying||f.awakenChargeT>0))return P;
    if(!editing && f.punchT>0 && options[f.characterId]?.assigned===f.attackKind && takes[f.characterId]?.length>=2){
      const arr=takes[f.characterId],maxT=arr[arr.length-1].t;
      return rotateGuidePose(f,P,interpolate(arr, Math.max(0,Math.min(maxT,(f.attackElapsed/Math.max(0.01,f.attackTotal))*maxT))));
    }
    if(!editing && (f.punchT>0||f.blastT>0||f.charging))return P;
    return rotateGuidePose(f,P,valuesFor(f));
  }
  function motion(f,key){const p=valuesFor(f);return p&&Number.isFinite(p[key])?p[key]/100:1;}
  function previewVelocity(f,dt){
    if(!active||f!==Game.player)return null;
    const speed=mode==='idle'?0:mode==='walk'?5:13;
    return {speed,lz:speed,lx:0};
  }
  function tick(dt){
    if(!active||!playing)return;
    const arr=takes[fighterId];if(arr.length<2){playing=false;return;}
    duration=Math.max(0.5,arr[arr.length-1].t);
    time=(time+dt*Math.max(0.25,Number($w('wsSpeed')?.value)||1))%duration;
    const timeline=$w('wsTimeline');if(timeline){timeline.max=duration;timeline.value=time;}
    if($w('wsTimeOut'))$w('wsTimeOut').textContent=time.toFixed(2)+'s';
  }
  function chooseFighter(id){
    if(!IDS.includes(id)||id===fighterId)return;
    playing=false;clipPreview=false;
    const game=Game,previous=game.state;
    // Reuse the existing character-selection path; no VRM clones or reloading.
    game.state='title';game.selectCharacter(id);game.state=previous;
    game.player.vel.set(0,0,0);game.player.moveIntent.set(0,0,0);
    fighterId=id;game.setLock(false,false);CameraRig.snapBehind(game.player,game.enemy);CameraRig.rig.yaw=game.player.facing;
    refreshInputs();status('Editing '+game.player.name+'. Other fighter profile is unchanged.');
  }
  function playClip(){
    const name=$w('wsClip').value,rig=Game.player?.vrmRig,layer=rig?.anim;
    if(!layer){status('Recorded clips are not calibrated for Rin’s VRM 0.x skeleton. Use keyframes instead.');return;}
    if(!name||!SkyClashMixamo.has(name))return;
    playing=false;clipPreview=true;
    layer.one=null;layer.prevOne=null;
    layer.play(name,{from:0,rate:Number($w('wsSpeed').value)||1,end:Anim.clip(name).d,noH:true,fadeIn:0.12,fadeOut:0.20,blendOut:0.16});
    status('Clip preview: '+SkyClashMixamo.clips[name].source.replace(/^.*\//,'')+'. Pose sliders resume when stopped.');
  }
  function stopClip(){clipPreview=false;const layer=Game.player?.vrmRig?.anim;if(layer){layer.one=null;layer.prevOne=null;}status('Clip stopped. Safe rig is active.');}
  function close(){if(!active)return;active=false;playing=false;stopClip();$w('workshop').classList.add('hidden');document.body.classList.remove('workshop-open');
    if(Game.mode==='dojo'&&Game.state==='playing'){$w('controls').classList.remove('hidden');$w('dojoTools').classList.remove('hidden');}
    Input.reset();}
  function open(){
    if(active)return;
    const wasTitle=Game.state==='title';openBefore=wasTitle?'title':'dojo';
    if(wasTitle){$w('titleScreen').classList.remove('show');$w('titleScreen').setAttribute('aria-hidden','true');}
    if(Game.mode!=='dojo'||Game.state!=='playing')Game.enterDojo();
    fighterId=Game.player.characterId;active=true;playing=false;clipPreview=false;time=0;
    Game.player.vel.set(0,0,0);Game.player.moveIntent.set(0,0,0);Game.setLock(false,false);
    Input.reset();document.body.classList.add('workshop-open');$w('workshop').classList.remove('hidden');
    $w('controls').classList.add('hidden');$w('dojoTools').classList.add('hidden');
    $w('wsTimeline').value=0;CameraRig.snapBehind(Game.player,Game.enemy);CameraRig.rig.yaw=Game.player.facing;
    refreshInputs();status('Workshop ready · changes are previewed live. Save or export your work.');
  }
  function init(){
    renderControls();load();
    $w('wsOpenTitle').addEventListener('click',open);
    $w('wsOpenDojo').addEventListener('click',open);
    $w('wsClose').addEventListener('click',close);
    $w('wsFighter').addEventListener('change',e=>chooseFighter(e.target.value));
    $w('wsMode').addEventListener('change',e=>{playing=false;mode=e.target.value;refreshInputs();});
    $w('wsRecorded').addEventListener('change',e=>{options[fighterId].recorded=!!e.target.checked;isDirty=true;status('Recorded layer changed. Save to keep this choice.');});
    $w('wsAssign').addEventListener('change',e=>{const val=e.target.value;options[fighterId].assigned=ACTIONS.includes(val)?val:'none';
      if(val!=='none'&&fighterId==='kairo_venn')options[fighterId].recorded=false;isDirty=true;refreshInputs();
      status(val==='none'?'Custom move unassigned.':'Custom keyframes assigned to '+val+' · Save to keep.');});
    $w('wsPreset').addEventListener('click',()=>{
      if(fighterId==='rin_sable'){
        Object.assign(poses.rin_sable.idle,parsePose({rShoulder:-8,rSpread:9,rElbow:14,lShoulder:-17,lSpread:-5,lElbow:10,rHip:6,rKnee:15,lHip:-6,lKnee:16,chestYaw:-8,chestPitch:1,headPitch:-2,height:3}));
        Object.assign(poses.rin_sable.walk,parsePose({rShoulder:10,rSpread:5,rElbow:12,lShoulder:-10,lSpread:-3,lElbow:12,rHip:3,rKnee:18,lHip:-3,lKnee:18,chestPitch:1,stride:85,cadence:117,kneelift:124}));
        Object.assign(poses.rin_sable.run,parsePose({rShoulder:12,rElbow:9,lShoulder:11,lElbow:9,rKnee:19,lKnee:19,chestPitch:3,height:3,stride:105,cadence:112,kneelift:135}));
      }else{for(const m of MODES)poses.kairo_venn[m]=DEFAULT();options.kairo_venn.recorded=true;options.kairo_venn.assigned='none';}
      playing=false;isDirty=true;refreshInputs();status('Preset applied to '+fighterId+'. Preview, adjust and Save if you like it.');
    });
    $w('wsResetMode').addEventListener('click',()=>{poses[fighterId][mode]=DEFAULT();playing=false;isDirty=true;refreshInputs();status('This pose reset. Save to keep it.');});
    $w('wsResetFighter').addEventListener('click',()=>{
      if(!confirm('Reset all poses AND keyframes for '+fighterId+'?'))return;
      for(const m of MODES)poses[fighterId][m]=DEFAULT();takes[fighterId]=[];playing=false;isDirty=true;refreshInputs();status('Fighter reset (not saved yet).');
    });
    $w('wsSave').addEventListener('click',()=>save());
    $w('wsExport').addEventListener('click',()=>{
      const file=new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download='sky-clash-character-workshop.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
      status('JSON downloaded. Keep it as a backup / send it for integration.');
    });
    $w('wsImport').addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try {if(file.size>250000)throw Error('File is too large (250 KB max)');
        const data=JSON.parse(await file.text());if(data.format!=='sky-clash-workshop'||data.version!==1)throw Error('Not a workshop profile');
        for(const id of IDS){for(const m of MODES)poses[id][m]=parsePose(data.profiles?.[id]?.[m]);
          takes[id]=Array.isArray(data.takes?.[id])?data.takes[id].slice(0,120).map(f=>({t:finite(f.t,0,8),pose:parsePose(f.pose)})).sort((a,b)=>a.t-b.t):[];
          if(data.options?.[id]) {options[id].recorded=!!data.options[id].recorded;options[id].assigned=ACTIONS.includes(data.options[id].assigned)?data.options[id].assigned:'none';}}
        save(true);playing=false;refreshInputs();status('Workshop JSON imported and saved.');
      }catch(err){status('Import failed: '+err.message);}finally{e.target.value='';}
    });
    $w('wsAddFrame').addEventListener('click',()=>snapshot());
    $w('wsClearFrames').addEventListener('click',()=>{takes[fighterId]=[];playing=false;isDirty=true;refreshTimeline();status('Keyframes cleared (save to keep).');});
    $w('wsPlayFrames').addEventListener('click',()=>{stopClip();if(takes[fighterId].length<2){status('Add at least two keyframes at different times.');return;}playing=true;time=0;mode='idle';refreshInputs();status('Playing your custom animation on the guide rig.');});
    $w('wsStopFrames').addEventListener('click',()=>{playing=false;time=0;status('Keyframe playback stopped.');});
    $w('wsTimeline').addEventListener('input',e=>{playing=false;time=Number(e.target.value);const v=interpolate(takes[fighterId],time);
      if(v)Object.assign(editable(),parsePose(v));refreshInputs();});
    $w('wsPlayClip').addEventListener('click',playClip);$w('wsStopClip').addEventListener('click',stopClip);
    for(const [id,c] of Object.entries(SkyClashMixamo.clips)){
      const option=document.createElement('option');option.value=id;option.textContent=(id.startsWith('mxK')?'Kairo: ':'Rin*: ')+c.source.split('/').pop().replace(/\.fbx$/i,'');$w('wsClip').appendChild(option);
    }
    $w('wsClip').value='mxKJab';
    $w('wsView').addEventListener('click',()=>{const y=CameraRig.rig.yaw;CameraRig.rig.yaw=(y+Math.PI)%(2*Math.PI);});
    refreshInputs();
    document.addEventListener('keydown',e=>{if(active&&e.key==='Escape'){e.stopPropagation();e.preventDefault();close();}},true);
  }
  return {init,open,close,applyPose,motion,previewVelocity,tick,allowRecorded:f=>f&&f.characterId!=='rin_sable'&&!!options[f.characterId]?.recorded,
    get active(){return active;},_allowClipPreview:()=>clipPreview,get isDirty(){return isDirty;},_test:{parsePose,interpolate,poses,takes,options,DEFAULT,DEFINITIONS}};
})();
