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
assert.strictEqual(first,'idle3','After about 12s first natural idle variation begins');
idle.vel.x=3;
assert.strictEqual(extras.choose(idle,motions,.1),null,'Joystick input cancels idle gesture');

const sprint=actor();sprint.sprinting=true;sprint.vel.z=8;
extras.choose(sprint,motions,.1);
sprint.sprinting=false;sprint.vel.z=4;
extras.choose(sprint,motions,.1);
sprint.vel.z=.2;
assert.strictEqual(extras.choose(sprint,motions,.1),'runStop','High-speed run to standing stop triggers braking clip');
sprint.punchT=.3;
assert.strictEqual(extras.choose(sprint,motions,.1),null,'Punch cancels run-stop instantly');

const fall=actor();fall.jumping=true;fall.vel.y=-4;
assert.strictEqual(extras.choose(fall,motions,.033),'fallingIdle','Descending in air enters falling loop');
fall.jumping=false;fall.vel.y=0;
assert.strictEqual(extras.choose(fall,motions,.033),'fallToRoll','Landing after descent plays rolling landing');
fall.blocking=true;
assert.strictEqual(extras.choose(fall,motions,.033),null,'Block or hit cancels landing roll');
const flight=actor();flight.flying=true;flight.vel.y=0;
assert.strictEqual(extras.choose(flight,motions,.04),null,'Steady controlled flight should retain original flight pose');
const dead=actor();dead.hp=0;
assert.strictEqual(extras.choose(dead,motions,.1),null,'Dead fighter may not gesture');
const studio=read('animation-studio.html'),game=read('js/v66-game-boot.js');
const app=read('js/animation-studio.js'),adapter=read('js/v72-published-actions.js');
assert(studio.includes('id="downloadPreviewGIF"')&&studio.includes('js/v79-gif-preview.js?v=790'));
assert(studio.includes('id="packCoverage"')&&studio.includes('js/v79-pack-catalog.js?v=790'));
assert(app.includes('GIFPreview.fromDataUrls(item.frames)'),'GIF button must save real rendered motion');
assert(game.includes("SkyClashV79ExtraActions.start(window)"),'Optional real-game state scheduler must load');
assert(adapter.includes('options.choose?options.choose(this,actions,dt)'),'Extra motion layer has independent slots');
assert(adapter.includes("fighter[marker]=state"),'Extra actions must never replace the published user idle');
assert(read('js/v76-upper-body.js').includes("state.mode='controlled-air'"),
 'Airborne arm release must fade, never jump into procedural T-pose');
console.log('PASS V79: 230 clips, four packs, timed animated GIF, idle variants, run-stop, falling idle, roll, combat interruption and layered animation ownership');
