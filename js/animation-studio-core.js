/* Sky Clash V57 Animation Studio: pure catalog, naming & assignment helpers.
 * Kept separate from the Three.js viewer so duplicate names / ZIP entries are testable. */
(function(root){
  'use strict';
  const words = [
    ['kicks', /kick|roundhouse|capoeira|martelo|armada|meia lua|chute|heel|axe kick|leg sweep|rasteira|side kick/i],
    ['combat', /box|punch|jab|hook|uppercut|elbow|knee strike|fighting|takedown|attack|combat|martial|counter|hit combo|block|guard/i],
    ['reaction', /receive|hit reaction|damage|knock|stagger|defeat|fall|death|die|injured/i],
    ['jumps', /jump|flip|roll|acrobat|vault|cartwheel|leap|backflip|breakdance|somersault|kip up/i],
    ['movement', /run|walk|sprint|dodge|strafe|sneak|locomotion|idle|step|slide|turn|crouch|crawl/i],
    ['magic', /magic|spell|cast|power|charge|blast|energy|fireball/i]
  ];
  function category(name){for(const [c,re] of words) if(re.test(name))return c;return 'other';}
  function displayName(filename){return String(filename).split('/').pop().replace(/\.fbx$/i,'').replace(/[_-]+/g,' ').trim();}
  function makeId(origin,filename,size,crc){return [origin,filename,size||0,crc||''].join('::');}
  function match(clip,q,cat,tag,marks){const phrase=String(q||'').trim().toLowerCase();if(phrase&&!(clip.name+' '+clip.origin+' '+clip.fileName).toLowerCase().includes(phrase))return false;if(cat!=='all'&&clip.category!==cat)return false;const m=marks[clip.id]||{};return tag==='all'||!!m[tag];}
  function marksFor(marks,id){return Object.assign({kairo:false,rin:false,saved:false},marks[id]||{});}
  const core={category,displayName,makeId,match,marksFor};
  if(typeof module!=='undefined'&&module.exports)module.exports=core;
  root.SkyClashStudioCore=core;
})(typeof window!=='undefined'?window:globalThis);
