/* V79: collection coverage, looping GIF output, deterministic specific
 * gameplay motion triggers and exclusion rules. Imported FBX archives are
 * deliberately browser-local, not raw copyrighted GitHub assets.
 */
const assert=require('assert'),fs=require('fs'),path=require('path');
const THREE=require('../js/vendor/three.min.js');
const packs=require('../js/v79-pack-catalog.js');
const gif=require('../js/v79-gif-preview.js');
const extras=require('../js/v79-extra-actions.js');
const published=require('../js/v72-published-actions.js');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
assert.strictEqual(packs.expected,230);
assert.deepStrictEqual(packs.PACKS.map(p=>p.count),[69,65,56,40]);
const one=packs.scan([{fileName:'Movement/Adventure/idle (3).fbx',origin:'Movement Pack'}]);
assert.strictEqual(one.loaded,1);
assert.strictEqual(one.packs[0].loaded,1);
assert.strictEqual(one.packs[1].loaded,0);
const four=packs.scan([
 {fileName:'Movement/Adventure/run to stop.fbx',origin:'Sky-Clash-Clean-Movement-Acrobatics-69(2).zip'},
 {fileName:'Kicks/Mma Kick.fbx',origin:'Sky-Clash-Clean-Ninja-Kicks-Capoeira-65(2).zip'},
 {fileName:'Magic/Standing Jump.fbx',origin:'Sky-Clash-Clean-Magic-56(2).zip'},
 {fileName:'Boxing/Lead Jab.fbx',origin:'Sky-Clash-Clean-Boxing-40(2).zip'},
 {fileName:'Boxing/Lead Jab.fbx',origin:'duplicate'}]);
assert.strictEqual(four.loaded,4,'Never count the same FBX twice');
assert.deepStrictEqual(four.packs.map(p=>p.loaded),[1,1,1,1]);
assert.strictEqual(four.complete,false);
assert.strictEqual(packs.clipKey('Movement/Adventure/idle (3).fbx',123,42),
 packs.clipKey('movement\\\\adventure\\\\idle (3).fbx',123,42),
 'Archive name/path separators must not create duplicate clips');
assert.notStrictEqual(packs.clipKey('Movement/Adventure/idle (3).fbx',123,42),
 packs.clipKey('Movement/Adventure/idle (3).fbx',123,43),
 'A changed FBX CRC must remain a distinct source');
// When user publishes the separately generated 7-action compact pack,
// CI also validates its source identity, keyframe sizes and the set of
// allowable runtime slots. Until then, no missing asset should break play.
const optionalPath=path.join(root,'assets/animations/gameplay/extra-actions-v1.json');
if(fs.existsSync(optionalPath)){
 const extra=JSON.parse(fs.readFileSync(optionalPath,'utf8'));
 const expected={
  runStop:'Movement/Adventure/run to stop.fbx',
  idle3:'Movement/Adventure/idle (3).fbx',
  idle4:'Movement/Adventure/idle (4).fbx',
  idle5:'Movement/Adventure/idle (5).fbx',
  idleAdventure:'Movement/Adventure/idle - Adventure.fbx',
  fallingIdle:'Movement/Adventure/falling idle.fbx',
  fallToRoll:'Movement/Adventure/falling to roll.fbx'
 };
 assert.strictEqual(extra.schema,'sky-clash.studio-gamepack.v1');
 assert.strictEqual(extra.revision,1);
 assert.deepStrictEqual(extra.motions.map(m=>m.slot).sort(),Object.keys(expected).sort());
 for(const entry of extra.motions){
  assert.strictEqual(entry.sourceFile,expected[entry.slot]);
  assert.strictEqual(entry.character,'kairo');
  assert.strictEqual(entry.fps,30);
  assert(entry.frames>=3&&entry.frames<=420);
  assert.strictEqual(entry.bones.length,published.BONES.length);
  const bytes=Buffer.from(entry.data,'base64');
  assert.strictEqual(bytes.length,entry.frames*20*4*2,'Invalid raw quaternion length');
  assert(published.decode(THREE,entry),'All optional clips must decode in actual game');
 }
}
const rgba=(r,g,b)=>new Uint8ClampedArray([r,g,b,255,r,g,b,255,r,g,b,255,r,g,b,255]);
const animated=gif.make(2,2,[rgba(255,0,0),rgba(0,255,0),rgba(0,0,255)],140);
assert.strictEqual(String.fromCharCode(...animated.subarray(0,6)),'GIF89a');
assert.strictEqual(animated.at(-1),0x3b);
assert(animated.length>790);
let images=0,comments=0;
for(let i=0;i<animated.length-1;i++){
 if(animated[i]===0x2c)images++;
 if(animated[i]===0x21&&animated[i+1]===0xf9)comments++;
}
assert(images>=3&&comments>=3,'GIF must contain three actual timed animation images');
assert.throws(()=>gif.make(2,2,[rgba(1,2,3)]),/GIF exporter requires/);
// GIF byte/header tests aren't enough: actually DECOMPRESS each emitted
// GIF LZW image to ensure a browser can play the animation, not just save
// a file with a .gif extension.
function decodeLZW(block,minCode,pixels){
 let dict=[],size=minCode+1,next=(1<<minCode)+2,bit=0,previous=null,output=[];
 const clear=1<<minCode,end=clear+1;
 function reset(){dict=[];for(let i=0;i<clear;i++)dict[i]=[i];size=minCode+1;next=end+1;previous=null;}
 function readCode(){let value=0;for(let b=0;b<size;b++){const k=bit++,byte=block[k>>3];value|=((byte>>(k&7))&1)<<b;}return value;}
 reset();
 while(bit+size<=block.length*8){
  const code=readCode();if(code===clear){reset();continue;}
  if(code===end)break;
  let entry=dict[code];
  if(!entry&&code===next&&previous)entry=previous.concat(previous[0]);
  if(!entry)throw Error('Invalid GIF LZW code '+code+' at '+bit+' of '+block.length*8);
  output.push(...entry);
  if(previous&&next<4096){dict[next++]=previous.concat(entry[0]);if(next===(1<<size)&&size<12)size++;}
  previous=entry;
  if(output.length>pixels+100)break;
 }
 assert.strictEqual(output.length,pixels,'Each GIF frame must decode to exactly the image pixel count');
 return output;
}
function framesOfGIF(buf){
 let offset=13+256*3,images=[];
 while(offset<buf.length){
  const lead=buf[offset++];
  if(lead===0x3b)break;
  if(lead===0x21){ // graphic control, application or any extension
   offset++;
   while(true){const n=buf[offset++];if(!n)break;offset+=n;}
  }else if(lead===0x2c){
   const width=buf[offset+4]|(buf[offset+5]<<8),height=buf[offset+6]|(buf[offset+7]<<8);
   const packed=buf[offset+8];offset+=9;
   if(packed&0x80)offset+=3*(1<<((packed&7)+1));
   const min=buf[offset++],compressed=[];
   while(true){const n=buf[offset++];if(!n)break;
    for(let k=0;k<n;k++)compressed.push(buf[offset++]);}
   images.push(decodeLZW(compressed,min,width*height));
  }else throw Error('Invalid GIF block marker '+lead+' at offset '+offset);
 }
 return images;
}
const decoded=framesOfGIF(animated);
assert.strictEqual(decoded.length,3);
assert.deepStrictEqual(decoded.map(f=>f[0]),[224,28,3],'GIF must preserve red/green/blue actual frame colors');

const motions={
 runStop:{seconds:.9},idle3:{seconds:3.266},idle4:{seconds:2.566},
 idle5:{seconds:2.266},idleAdventure:{seconds:4},
 fallingIdle:{seconds:.7},fallToRoll:{seconds:1.8}
};
const actor=()=>({hp:100,vel:new THREE.Vector3(),punchT:0,stun:0,
 blastT:0,superHitT:0,downT:0,slamming:false,blocking:false,
 blockHeld:false,charging:false,acro:null,dashing:false,sprinting:false,
 jumping:false,flying:false,launched:false,spiked:false});
const idle=actor();
for(let i=0;i<710;i++)assert.strictEqual(extras.choose(idle,motions,1/60),null);
let first=null;
for(let i=0;i<30;i++){first=extras.choose(idle,motions,1/60);if(first)break;}
assert(['idle3','idle4','idle5','idleAdventure'].includes(first),
 'After about 12s a randomly selected long-idle variation begins');
idle.vel.x=3;
assert.strictEqual(extras.choose(idle,motions,.1),null,'Joystick input cancels idle gesture');

const normalRun=actor();normalRun.vel.z=8;
extras.choose(normalRun,motions,.1);normalRun.vel.z=.1;
assert.notStrictEqual(extras.choose(normalRun,motions,.1),'runStop',
 'Joystick-only running must NEVER trigger a Boost stop');
const sprint=actor();sprint.sprinting=true;sprint.vel.z=18;
extras.choose(sprint,motions,.1);
sprint.sprinting=false;sprint.vel.z=5;
assert.notStrictEqual(extras.choose(sprint,motions,.1),'runStop',
 'Do not freeze player with rootless old Run to Stop pose');
sprint.vel.z=.2;
sprint.punchT=.3;
assert.strictEqual(extras.choose(sprint,motions,.1),null,'Punch cancels run-stop instantly');

const littleJump=actor();littleJump.jumping=true;littleJump.pos={y:1.4};littleJump.floor=0;
littleJump.vel.y=-4;
assert.strictEqual(extras.choose(littleJump,motions,.033),'fallingIdle');
littleJump.jumping=false;littleJump.pos.y=0;littleJump.vel.y=0;
assert.notStrictEqual(extras.choose(littleJump,motions,.033),'fallToRoll',
 'Ordinary low jump MUST NOT cause a big forward tumble');
const fall=actor();fall.jumping=true;fall.pos={y:6};fall.floor=0;fall.vel.y=-9;fall.vel.z=3;
assert.strictEqual(extras.choose(fall,motions,.033),'fallingIdle','Fast drop descends in a loop');
fall.jumping=false;fall.pos.y=0;fall.vel.y=0;
assert.strictEqual(extras.choose(fall,motions,.033),'fallToRoll',
 'Only substantial falls with horizontal momentum produce a roll');
fall.blocking=true;
assert.strictEqual(extras.choose(fall,motions,.033),null,'Block or hit cancels landing roll');
const flight=actor();flight.flying=true;flight.vel.y=0;
assert.strictEqual(extras.choose(flight,motions,.04),null,'Steady controlled flight should retain original flight pose');
const dead=actor();dead.hp=0;
assert.strictEqual(extras.choose(dead,motions,.1),null,'Dead fighter may not gesture');
const studio=read('animation-studio.html'),game=read('js/v66-game-boot.js');
const app=read('js/animation-studio.js'),adapter=read('js/v72-published-actions.js');
assert(studio.includes('id="downloadPreviewGIF"')&&studio.includes('js/v79-gif-preview.js?v=790'));
assert(studio.includes('id="packCoverage"')&&studio.includes('js/v79-pack-catalog.js?v=791'));
assert(app.includes('GIFPreview.fromDataUrls(item.frames)'),'GIF button must save real rendered motion');
assert(app.includes('seenContent.has(contentKey)'),'Reimport must dedupe same FBX in renamed ZIPs');
assert(game.includes("SkyClashV79ExtraActions.start(window)"),'Optional real-game state scheduler must load');
assert(adapter.includes('options.choose?options.choose(this,actions,dt)'),'Extra motion layer has independent slots');
assert(adapter.includes("fighter[marker]=state"),'Extra actions must never replace the published user idle');
assert(read('js/v76-upper-body.js').includes("state.mode='controlled-air'"),
 'Airborne arm release must fade, never jump into procedural T-pose');
console.log('PASS V79: 230 clips, four packs, timed animated GIF, idle variants, run-stop, falling idle, roll, combat interruption and layered animation ownership');
