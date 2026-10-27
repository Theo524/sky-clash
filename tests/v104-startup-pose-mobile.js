/* V104: startup animation readiness + late-model pose gate +
 * mobile tap-to-expand diagnostics. No change to V101/V102/V103 motion.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('index.html'),boot=read('js/v66-game-boot.js'),
 css=read('css/game.css'),game=read('src/95-game.js'),
 models=read('src/30-character-models.js');
const match=html.match(/<script>\s*([\s\S]*?const LoadScreen=[\s\S]*?)<\/script>/);
assert(match,'load-screen code must remain inline before the heavy scripts');
function setup(){
 const raf=[],timers=[];
 const elements={};
 for(const id of ['bootFill','bootStatus','bootScreen','titleScreen']){
  elements[id]={style:{},textContent:'',setAttribute(){},
   classes:[],classList:{add(...values){elements[id].classes.push(...values);}}};
 }
 const window={setTimeout:(fn,delay)=>{timers.push({fn,delay});},
  SkyClash:{Game:{state:'title'}}};
 const context={window,document:{getElementById:id=>elements[id]||null},
  requestAnimationFrame:fn=>raf.push(fn),console};
 vm.runInNewContext(match[1],context,{timeout:1000});
 const gate=window.SkyClashLoadScreen;
 assert(gate&&typeof gate.finish==='function'&&
  typeof gate.animationsFinished==='function',
  'boot publishes explicit two-party readiness gate');
 const advance=n=>{
  for(let i=0;i<n;i++){const fn=raf.shift();assert(fn,'expected a warmup frame '+i);fn();}
 };
 const shown=()=>elements.titleScreen.classes.includes('show');
 return {gate,advance,shown,window,timers,raf,elements};
}
{
 const h=setup();
 h.gate.finish('Hero ready');
 assert(!h.shown(),'model-only load MUST NOT display unfinished idle pose');
 h.gate.animationsFinished();
 assert(!h.shown(),'animation controller registration must be followed by rendered settling');
 h.advance(17);
 assert(!h.shown(),'17 frames insufficient: hold through the actual handoff');
 h.advance(1);
 assert(h.shown(),'18 composed frames must release the menu');
 assert(h.elements.bootScreen.classes.includes('finished'));
 assert.equal(h.elements.bootFill.style.width,'100%');
 h.gate.finish('redundant callback');
 assert.equal(h.elements.titleScreen.classes.filter(v=>v==='show').length,1,
  'duplicate callbacks must not animate splash twice');
}
{
 const h=setup();
 h.gate.animationsFinished();
 assert(!h.shown(),'fully installed animation must await the actual Kairo model');
 h.gate.finish('Models ready');
 h.advance(18);assert(h.shown());
}
{
 const h=setup();
 const timeout=h.timers.find(t=>t.delay===12000);
 assert(timeout);
 timeout.fn();
 assert(!h.shown(),'watchdog cannot reveal incomplete controller stack');
 h.gate.animationsFinished();
 h.advance(18);
 assert(h.shown(),'12s fallback must remain playable when a VRM download hangs');
}
assert(models.includes('this.startupPoseHidden=!!(window.SKY_V104_STARTUP_GATE&&opts.studioHands)'),
 'Kairo-specific late-loaded VRM starts invisible');
assert(models.includes('if(this.startupPoseHidden)vrm.scene.visible=false;'));
assert(models.includes('const beforeVisible=vs.visible;vs.visible=true;'),
 'portrait preview must temporarily expose a hidden VRM offscreen');
assert(models.includes('vs.visible=beforeVisible;vs.updateMatrixWorld(true);'),
 'portrait must restore invisible startup state');
assert(game.includes('if(window.SKY_V104_ANIMATIONS_READY&&this.state!==\'paused\')'),
 'late-loaded model cannot reveal before all controllers finish');
assert(game.includes('if(rig.startupPoseFrames>=18)'),
 'late-loaded model waits for a composed final-pose baseline');
assert(game.includes('rig.vrm.scene.visible=true;'));
assert(boot.includes('window.SKY_V104_STARTUP_GATE=true;'));
assert(boot.includes('window.SKY_V104_ANIMATIONS_READY=true;'));
assert(boot.includes('window.SkyClashLoadScreen?.animationsFinished?.();'));
assert(/await script\('js\/game\.js\?v=\d{3,}&startup=104(?:&[A-Za-z][A-Za-z0-9]*=[A-Za-z0-9_-]+)*'\);/.test(boot),
 'Live game must retain the composed-animation startup gate while cache keys advance');
assert(/js\/v66-game-boot\.js\?v=(?:1530|1560)&fix=(?:10[5-9]|11[0-6])/.test(html));
assert(html.includes('css/game.css?v=1040'));
require('./public-game-build.cjs')(html, 104);
assert(/BUILD V(10[4-9]|11[0-5])/.test(read('animation-studio.html')));
assert(boot.includes("document.createElement('details')"));
assert(boot.includes("document.createElement('summary')"));
assert(boot.includes("detail.textContent=stepLab?"));
assert(boot.includes("label.open=!window.matchMedia?."),'narrow screens start collapsed');
assert(boot.includes("heading.textContent=BUILD+"),'build/status remains visible while collapsed');
assert(css.includes('.sky-lab-panel:not([open])'));
assert(css.includes('top:calc(96px + var(--safe-t))'),
 'mobile status lives above thumb controls rather than covering them');
assert(css.includes('max-height:min(39dvh,270px)'),'expanded mobile info scrolls inside a bounded viewport');
assert(css.includes('touch-action:manipulation'));
assert(css.includes('max-width:min(49vw,176px)'),
 'closed mobile tag cannot take the entire screen');
assert(boot.includes('LAND: V100 UNCHANGED'),'unapproved landing still untouched');
const v100=read('js/v100-pose-authority.js');
assert(v100.includes('movingJump')&&v100.includes('steadyLegs')&&v100.includes('compactArms'),
 'all approved V101/V102/V103 jump controls remain available');
console.log('PASS V104: model/controller startup gate + 18-frame warmup + 12s safe fallback + late VRM pose concealment; mobile diagnostics collapsed with accessible detailed view.');
