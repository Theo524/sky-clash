/* V82: uploaded Studio Jump/Stop registration, exclusive locomotion
 * layer ownership and direct-action Studio UX.
 */
const assert=require('assert'),fs=require('fs'),path=require('path');
const THREE=require('../js/vendor/three.min.js');
const published=require('../js/v72-published-actions.js');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pack=JSON.parse(read('assets/animations/gameplay/studio-actions-v1.json'));
assert.deepStrictEqual(pack.motions.map(x=>x.slot),['idle','run','jump','runStop']);
assert.strictEqual(pack.motions[0].sourceFile,'Movement/Adventure/idle (2).fbx');
assert.strictEqual(pack.motions[1].sourceFile,'Movement/Male/standard run.fbx');
assert.strictEqual(pack.motions[2].sourceFile,'Movement/Adventure/jumping up.fbx');
assert.strictEqual(pack.motions[3].sourceFile,'Movement/Adventure/run to stop.fbx');
const actions=Object.fromEntries(pack.motions.map(m=>[m.slot,published.decode(THREE,m)]));
assert.strictEqual(actions.jump.frames,8);
assert.strictEqual(actions.runStop.frames,28);
const q=()=>published.BONES.map(()=>new THREE.Quaternion());
const a=q(),b=q();
actions.jump.sample(0,a,false);actions.jump.sample(.20,b,false);
assert(a.some((x,i)=>x.angleTo(b[i])>.04),'Real jump recording must actually change poses');
actions.runStop.sample(0,a,false);actions.runStop.sample(.48,b,false);
assert(a.some((x,i)=>x.angleTo(b[i])>.08),'Real braking motion must actually change poses');
const fighter=(changes={})=>Object.assign({
 hp:100,vel:new THREE.Vector3(),moveIntent:new THREE.Vector3(),t:0,
 sprinting:false,skidT:0,jumping:false,flying:false,dropping:false,
 launched:false,spiked:false,punchT:0,blastT:0,stun:0,downT:0,
 superHitT:0,slamming:false,acro:null,blocking:false,blockHeld:false,
 charging:false,dashing:false,landingMotionT:0,
 },changes);
const jump=fighter({jumping:true,vel:new THREE.Vector3(0,10,0),
  acro:{type:'ninjaLeap'}});
assert.strictEqual(published.choose(jump,actions),'jump',
 'Jump-up must not be hidden by unrelated acrobatics');
jump.vel.y=-4;
assert.strictEqual(published.choose(jump,actions),null,
 'Do not freeze the jump-up pose during downward fall');
jump.jumping=false;jump.flying=true;
assert.strictEqual(published.choose(jump,actions),null,
 'Do not run a grounded jumping clip in controlled flight');
jump.jumping=true;jump.flying=false;jump.vel.y=9;jump.acro={type:'flip'};
assert.strictEqual(published.choose(jump,actions),null,
 'Genuine flips keep their separate animation owner');
const stop=fighter({vel:new THREE.Vector3(0,0,23),sprinting:true});
published.choose(stop,actions);
stop.t=.1;stop.sprinting=false;stop.vel.z=8;stop.skidT=.42;
assert.strictEqual(published.choose(stop,actions),'runStop',
 'Releasing a real Boost activates the real recorded stop');
stop.t=.6;
assert.strictEqual(published.choose(stop,actions),'runStop',
 'Stop must remain visible while fighter slows down');
stop.t=.9;
assert.notStrictEqual(published.choose(stop,actions),'runStop',
 'Braking action must release after the fixed stop interval');
const regular=fighter({vel:new THREE.Vector3(0,0,7),skidT:.42,t:.1});
assert.notStrictEqual(published.choose(regular,actions),'runStop',
 'Ordinary joystick movement must not trigger a Boost-only stop');
const groundDisabled=fighter({jumping:true,vel:new THREE.Vector3(0,9,0),
 sprinting:true,skidT:.42,t:.1});
assert.notStrictEqual(published.choose(groundDisabled,actions),'runStop',
 'There must be no stopping clip while airborne');
const locomotion=read('js/v71-mixamo-gameplay.js');
assert(locomotion.includes('!this.jumping&&!this.flying'),
 'V71 walk knees must not play under takeoff jump');
assert(locomotion.includes('this.slamming||this.v80AnalogRun'),
 'V71 walk knees must not play underneath imported full-body running');
const upper=read('js/v76-upper-body.js');
assert(upper.includes('f.sprinting||f.v80AnalogRun||f.charging'),
 'Old fighting idle upper body must not run underneath full-body normal run');
const adapter=read('js/v72-published-actions.js');
assert(adapter.includes("entry.slot==='runStop'&&(i===0||i>=14)"),
 'Recorded boost stop must leave grounded hips and feet to physics');
const studio=read('animation-studio.html');
assert(!studio.includes('id="quickActionSlot"')&&!studio.includes('id="quickAssign"'),
 'V83 removes the duplicate quick assignment box by user request');
assert(studio.includes('id="actionSlots"'),
 'Existing character action slots still support normal assignment');
assert(!studio.includes('V68 anatomical forward-axis mapping on Kairo Venn.'),
 'Obsolete V68 anatomical status removed from visual editor');
assert(!studio.includes('The <strong>Master base</strong> runs directly'),
 'Verbose, outdated Master base action-board instructions removed');
assert(!studio.includes('Drag its thumbnail to a move below'),
 'Dragging should no longer be the only workflow');
const editor=read('js/animation-studio.js');
assert(!editor.includes('quickAssign')&&!editor.includes('quickActionSlot'),
 'Do not keep event handlers referencing removed DOM controls');
assert(editor.includes("bindClip(item,key)"),
 'Original action slot assignment logic remains operational');
const boot=read('js/v66-game-boot.js'),index=read('index.html');
assert(boot.includes('js/v71-mixamo-gameplay.js?v=820'));
assert(boot.includes('js/v76-upper-body.js?v=820'));
assert(boot.includes('js/v72-published-actions.js?v=820'));
assert(index.includes('js/v66-game-boot.js?v=820'));
console.log('PASS V82: real Mixamo jumping up and grounded Boost stop, no competing gait, approved idle/run, quick Studio assignment');
