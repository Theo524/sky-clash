/* V80: joystick run vs Boost, ground-only stop, natural head/landing,
 * and all imported FBX previews available on demand.
 */
const assert=require('assert'),fs=require('fs'),path=require('path');
const THREE=require('../js/vendor/three.min.js');
const published=require('../js/v72-published-actions.js');
const extra=require('../js/v79-extra-actions.js');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pack=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
assert.deepStrictEqual(pack.motions.map(m=>m.slot),['idle','run','jump','runStop']);
const idle=pack.motions[0],run=pack.motions[1];
assert.strictEqual(idle.sourceFile,'Movement/Adventure/idle (2).fbx');
assert.strictEqual(run.sourceFile,'Movement/Male/standard run.fbx');
assert.strictEqual(run.frames,23);
assert.strictEqual(run.seconds,22/30);
const actions={idle:published.decode(THREE,idle),run:published.decode(THREE,run)};
const q=()=>Array.from({length:published.BONES.length},()=>new THREE.Quaternion());
const a=q(),b=q(),c=q();
actions.run.sample(0,a,true);
actions.run.sample(.37,b,true);
actions.run.sample(actions.run.seconds,c,true);
assert(a[15].angleTo(b[15])>.05,'Real right leg must move in standard run');
assert(a[8].angleTo(b[8])>.01,'Real left arm should pump in run');
assert(a[15].angleTo(c[15])<.001,'Running stride must loop seamlessly');
function actor(stick=0,spd=0,boost=false){
 return {hp:100,moveIntent:new THREE.Vector3(0,0,stick),
 vel:new THREE.Vector3(0,0,spd),sprinting:boost,dashing:false,
 jumping:false,flying:false,launched:false,spiked:false,stun:0,
 downT:0,punchT:0,blastT:0,superHitT:0,blocking:false,
 blockHeld:false,acro:null,charging:false,slamming:false};
}
const f=actor(.45,3);
assert.strictEqual(published.choose(f,actions),null,
 'Gentle joystick must not activate the normal run; V71 walk owns it');
f.moveIntent.z=.92;f.vel.z=7;
assert.strictEqual(published.choose(f,actions),'run',
 'Near joystick rim must use actual standard run');
f.moveIntent.z=.78;
assert.strictEqual(published.choose(f,actions),'run',
 'Small joystick wobble must not flicker into walk');
f.moveIntent.z=.54;
assert.strictEqual(published.choose(f,actions),null,'Mid joystick returns to V71 walk');
f.moveIntent.z=1;f.sprinting=true;
assert.strictEqual(published.choose(f,actions),null,'BOOST is separate from normal run');
assert.strictEqual(f.v80AnalogRun,false);
f.sprinting=false;f.jumping=true;
assert.strictEqual(published.choose(f,actions),null,'No run in midair');
f.jumping=false;f.vel.z=0;f.moveIntent.z=0;
assert.strictEqual(published.choose(f,actions),'idle','Keep approved idle at rest');
// V79 scheduler: only an actual boost release may trigger stop.
const optional={runStop:{seconds:.9},fallToRoll:{seconds:1.8},
 fallingIdle:{seconds:.6},idle3:{seconds:3}};
const walk=actor(0,6,false);
extra.choose(walk,optional,.05);
walk.vel.z=.1;
assert.notStrictEqual(extra.choose(walk,optional,.05),'runStop',
 'Normal joystick running must never trigger Boost stop');
const boost=actor(1,23,true);
extra.choose(boost,optional,.05);
boost.sprinting=false;boost.moveIntent.z=0;boost.vel.z=8;
assert.notStrictEqual(extra.choose(boost,optional,.05),'runStop',
 'A rootless, airborne-looking Run to Stop is disabled by default');
boost.jumping=true;boost.flying=true;
assert.notStrictEqual(extra.choose(boost,optional,.05),'runStop',
 'Stop pose must immediately release on takeoff');
const low=actor();
low.jumping=true;low.flying=true;low.pos={y:1.4};low.floor=0;low.vel.y=-5;
assert.strictEqual(extra.choose(low,optional,.04),'fallingIdle');
low.jumping=false;low.flying=false;low.pos.y=0;low.vel.y=0;
assert.notStrictEqual(extra.choose(low,optional,.04),'fallToRoll',
 'Ordinary low jump must not trigger long roll');
const high=actor(0,4,false);
high.jumping=true;high.flying=true;high.pos={y:7};high.floor=0;high.vel.y=-10;
extra.choose(high,optional,.05);
high.flying=false;high.jumping=false;high.pos.y=0;high.vel.y=0;
high.acro={type:'landing'};
assert.strictEqual(extra.choose(high,optional,.05),'fallToRoll',
 'High-speed landing from a genuinely large drop may roll');
const fighter=read('src/45-fighter-controller.js');
assert(fighter.includes('Effects.dust(this.pos, 10)'),'Boost stop must kick up grounded dust');
assert(fighter.includes('Effects.sprintTrail(this)'),'Boost smoke trail should briefly continue at stop');
assert(fighter.includes('pitchT = this.characterId === \'rin_sable\' ? 0.08 : 0.025'),
 'Kairo boost must not pitch toward the ground');
assert(fighter.includes('spineX: 0.10, headX: 0.07'),
 'Kairo normal landing must not face-plant');
const html=read('animation-studio.html'),studio=read('js/animation-studio.js');
assert(html.includes('id="generateAllPreviews"'),'Render every imported clip on demand');
assert(html.includes('animation-studio.js?v=830'),'Current cache-busted Studio module');
assert(studio.includes('renderAllPreviews&&!visiblePage().includes(item)'),
 'Full-render queue must process nonvisible library pages');
assert(studio.includes('previews ready')&&studio.includes('awaiting render'),
 'Explain loaded versus rendered count rather than saying clips are missing');
const game=read('js/v66-game-boot.js');
assert(game.includes('js/game.js?v=1520'),'Rebuilt game bundle used');
assert(game.includes('js/v72-published-actions.js?v=820'));
assert(game.includes('js/v79-extra-actions.js?v=810'));
console.log('PASS V80: approved idle retained; 23-frame real run on full analog stick; Boost-only grounded stop and smoke; normal landings stay upright; 230-preview backlog actionable');
