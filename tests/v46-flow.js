const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const THREE=require('../js/vendor/three.min.js');
const cls=new Set();
const elements={};
const $=id=>elements[id] || (elements[id]={classList:{add(...v){v.forEach(x=>cls.add(id+':'+x));},remove(...v){v.forEach(x=>cls.delete(id+':'+x));},toggle(v,on){if(on)cls.add(id+':'+v);else cls.delete(id+':'+v);}},style:{},setAttribute(){},value:'solo'});
const settings={rival:'fight',lockDefault:false,timer:'off',rounds:1};
const Settings={get:n=>settings[n],set:(n,v)=>settings[n]=v};
const arena=[];const dojo=[];
const Arena={setEnvironment:x=>arena.push(x)};
const Dojo={show:x=>dojo.push(x),resetProps(){}};
const menu={closePause(){}};
const GameSrc=fs.readFileSync(path.join(__dirname,'../src/95-game.js'),'utf8');
const core=GameSrc.slice(0,GameSrc.indexOf('Game.init();'))+'\nreturn Game;';
const Game=new Function('THREE','V3','STAGE_H','$','Settings','Arena','Dojo','Menus','Input','Combat','Effects','Spectacle','toast',core)(
 THREE,THREE.Vector3,0.35,$,Settings,Arena,Dojo,menu,{reset(){}},{clear(){}},{clear(){}},{clear(){}},()=>{}
);
const mk=()=>({model:{root:{visible:true},blob:{visible:true}},orb:{visible:false},orbCore:{visible:false},moveIntent:new THREE.Vector3(),spawn:new THREE.Vector3(),reset(){this.pos=this.spawn.clone()}});
Game.player=mk();Game.enemy=mk();Game.restart=()=>{};Game.showPlayUI=()=>{};Game.banner=()=>{};Game.setLock=()=>{};
Game.enterDojo();assert.equal(Game.mode,'dojo');assert.equal(Game.training,true);
assert.equal(Game.enemy.model.root.visible,false);assert.equal(Game.dojoRival,false);assert.equal(settings.rival,'dummy');
assert.equal(arena.at(-1),'dojo');assert.equal(dojo.at(-1),true);
assert.equal(Game.enemy.spawn.z,-120);assert.equal($('dojoRivalMode').value,'solo');
Game.setDojoRival('attacks');assert.equal(Game.dojoRival,true);assert.equal(settings.rival,'attacks');
assert.equal(Game.enemy.model.root.visible,true);
Game.setDojoRival('solo');assert.equal(Game.enemy.model.root.visible,false);
Game.startFight();assert.equal(Game.mode,'fight');assert.equal(Game.training,false);
assert.equal(Game.enemy.model.root.visible,true);assert.equal(arena.at(-1),'highland');
console.log('V46 game mode transitions, solo/no enemy, spawned sparring, fight restoration passed.');
