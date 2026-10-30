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
  // Motion provenance is NOT inferred from FBX skeleton names. Rokoko
  // exports can have "_mixamo" suffixes while still being Rokoko clips.
  // Preserve the original archive/path IDs for existing assignments.
  function sourceGroup(origin,fileName,explicit){
    if(explicit==='rokoko'||explicit==='mixamo'||explicit==='other')
     return explicit;
    const archive=String(origin||''),path=String(fileName||'');
    if(/rokoko/i.test(archive)||/^superhero(?:\s*\(\d+\))?\.zip$/i.test(archive)||
       /^superhero\//i.test(path))return 'rokoko';
    if(/^sky-clash-clean-/i.test(archive)||/mixamo/i.test(archive)||
       /^(movement|acrobatics|ninja|kicks|capoeira|magic|boxing)\//i.test(path))
     return 'mixamo';
    return 'other';
  }
  function packGroup(origin,fileName,source){
    const archive=String(origin||'').replace(/\.zip$/i,'');
    if(source==='rokoko'&&(/superhero/i.test(archive)||/^superhero\//i.test(fileName||'')))
     return 'Rokoko · Superhero';
    if(source==='rokoko')return 'Rokoko · '+(archive||'Loose FBX');
    if(source==='mixamo')return 'Mixamo · '+(archive||'Loose FBX');
    return archive==='Loose FBX'?'Other · Loose FBX':'Other · '+(archive||'Local imports');
  }
  function makeId(origin,filename,size,crc){return [origin,filename,size||0,crc||''].join('::');}
  function match(clip,q,cat,tag,marks){const phrase=String(q||'').trim().toLowerCase();if(phrase&&!(clip.name+' '+clip.origin+' '+clip.fileName).toLowerCase().includes(phrase))return false;if(cat!=='all'&&clip.category!==cat)return false;const m=marks[clip.id]||{};return tag==='all'||!!m[tag];}
  function marksFor(marks,id){return Object.assign({kairo:false,rin:false,saved:false},marks[id]||{});}
  const core={category,displayName,sourceGroup,packGroup,makeId,match,marksFor};
  if(typeof module!=='undefined'&&module.exports)module.exports=core;
  root.SkyClashStudioCore=core;
})(typeof window!=='undefined'?window:globalThis);
