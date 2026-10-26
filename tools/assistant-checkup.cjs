#!/usr/bin/env node
/* Read-only Sky Clash assistant diagnostics. Not aesthetic or deployment approval. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const cp=require('node:child_process'),root=path.resolve(__dirname,'..');
const args=process.argv.slice(2),strict=args.includes('--strict'),json=args.includes('--json');
const smoke=args.includes('--smoke'),out=args.find(x=>x.startsWith('--output='))?.slice(9);
const at=p=>path.join(root,p),exists=p=>fs.existsSync(at(p)),read=p=>fs.readFileSync(at(p),'utf8');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),fileHash=p=>exists(p)?hash(fs.readFileSync(at(p))):null;
const checks=[],failures=[];
function check(name,pass,detail=''){checks.push({name,pass:!!pass,detail});if(!pass)failures.push(name+(detail?' — '+detail:''));}
const required=['AGENTS.md','docs/ASSISTANT-CURRENT-STATE.md','docs/ASSISTANT-RUNBOOK.md','docs/PROJECT-CONTEXT.md',
 'docs/ANIMATION-OWNERSHIP-CONTRACT.md','docs/KAIRO-POSE-LAB-WORKFLOW.md',
 'docs/CHARACTER-BIBLE.md','docs/KAIRO-COMBAT-V1.md','js/v66-game-boot.js',
 'js/v100-pose-authority.js','js/v72-published-actions.js','src/05-character-registry.js',
 'js/kairo-pose-lab.js','pose-lab.html','assets/characters/kairo.vrm','assets/rin.vrm',
 'assets/animations/reference/kairo-v152-hover.pose.json','tools/build.py'];
for(const p of required)check('required file: '+p,exists(p));
const safe=p=>exists(p)?read(p):'';
const boot=safe('js/v66-game-boot.js'),registry=safe('src/05-character-registry.js'),
 handoff=safe('docs/ASSISTANT-CURRENT-STATE.md'),agents=safe('AGENTS.md');
const sources=exists('src')?fs.readdirSync(at('src')).filter(p=>p.endsWith('.js')).sort():[];
const builtSource=sources.map(p=>read('src/'+p)).join('');
const bundleEqual=builtSource.length>0&&builtSource===safe('js/game.js');
check('generated js/game.js equals source',bundleEqual,'Regenerate with python tools/build.py if false');
const ids=Array.from(registry.matchAll(/^\s+id:\s*'([^']+)'/gm),m=>m[1]);
check('two playable fighters (Kairo and Rin)',JSON.stringify(ids)===JSON.stringify(['kairo_venn','rin_sable']),ids.join(', '));
const release=boot.match(/const BUILD='([^']+)'/)?.[1]||null,
 flight=boot.match(/flags\.set\('flightPreview','([^']+)'\)/)?.[1]||null,
 jump=boot.match(/flags\.set\('jumpPreview','([^']+)'\)/)?.[1]||null;
check('boot flags detected',!!release&&!!flight&&!!jump,JSON.stringify({release,flight,jump}));
check('AGENTS links quick handoff and runbook',
 agents.includes('ASSISTANT-CURRENT-STATE.md')&&agents.includes('ASSISTANT-RUNBOOK.md'));
check('rejected visuals recorded for new chats',
 /V153/i.test(handoff)&&/V154/i.test(handoff)&&/V155/i.test(handoff)&&
 /stick/i.test(handoff)&&/twist/i.test(handoff)&&/REJECTED/i.test(handoff));
check('no user tool operation requirement',/do not want to operate/i.test(handoff));
const modelSHA=fileHash('assets/characters/kairo.vrm');
let pose=null;
try{pose=JSON.parse(safe('assets/animations/reference/kairo-v152-hover.pose.json'));}
catch(err){check('V152 reference JSON can parse',false,String(err));}
if(pose){
 check('V152 pose belongs to exact Kairo VRM SHA256',!!modelSHA&&pose.modelSha256===modelSHA);
 const norm=q=>Array.isArray(q)&&q.length===4&&q.every(Number.isFinite)&&Math.abs(Math.hypot(...q)-1)<.005;
 check('V152 real 20-bone quaternion reference complete',
  pose.schema==='sky-clash.pose-lab.v1'&&pose.bones?.length===20&&
  pose.keyframes?.length===2&&pose.keyframes.every(f=>f.quaternions?.length===20&&f.quaternions.every(norm)));
}
const workflows=exists('.github/workflows')?fs.readdirSync(at('.github/workflows')).filter(n=>n.endsWith('.yml')):[];
for(const f of ['animation-ownership.yml','v66-character.yml','pose-lab-browser.yml','flight-visual-review.yml'])
 check('workflow '+f,workflows.includes(f));
const tests=exists('tests')?fs.readdirSync(at('tests')).filter(n=>n.endsWith('.js')):[];
const smokes=[];
if(smoke)for(const file of ['tests/animation-ownership-contract.js','tests/approved-ground-default.js','tests/v100-single-pose-authority.js']){
 const result=cp.spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8',timeout:45000,maxBuffer:1048576});
 const pass=result.status===0&&!result.error;
 check('smoke '+file,pass,pass?'':(result.stderr||String(result.error)).slice(-250));
 smokes.push({file,pass,output:(result.stdout||result.stderr||'').slice(-350)});
}
let commit=null;try{const x=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();if(/^[a-f0-9]{40}$/.test(x))commit=x;}catch{}
const report={schema:'sky-clash.assistant-checkup.v1',generatedAt:new Date().toISOString(),
 repository:'Theo524/sky-clash',commit,
 remoteCI:'NOT CHECKED: consult GitHub Actions',pages:'NOT CHECKED',
 visualApproval:'NOT AUTOMATABLE: explicit player review required',
 rejected:{V153Flight:'rigid stick',boost:'bad',V154Boost:'bad',V155FlightBoost:'twisted'},
 actual:{release,defaultFlight:flight,defaultJump:jump,playable:ids,proposedCount:4,
  sourceChunks:sources.length,bundleMatchesSource:bundleEqual,tests:tests.length,workflows:workflows.length,
  kairoVrmSha256:modelSHA,v152PoseModelSha256:pose?.modelSha256||null},
 checks,smokes,passed:!failures.length,failures};
const markdown=['# Sky Clash assistant diagnostic',
 '', 'Commit: '+(commit||'not available'),'Boot: '+release+'; flight='+flight+'; jump='+jump,
 'Registered: '+ids.join(', '),'Generated bundle matches source: '+bundleEqual,
 'Kairo VRM SHA256: '+modelSHA,'V152 pose matches Kairo model: '+(pose?.modelSha256===modelSHA),
 'Tests: '+tests.length+'; GitHub workflows: '+workflows.length,
 '', '## Visual quality: NOT APPROVED','',
 '- V153 forward flight: REJECTED (stick).',
 '- Normal and V154 Boost: REJECTED.',
 '- V155 flight/Boost: REJECTED (twisted).',
 '- Do not confuse green tests with visual quality.',
 '', '## Repository checks', '',
 ...checks.map(x=>(x.pass?'[PASS] ':'[FAIL] ')+x.name+(x.detail?' — '+x.detail:'')),
 '', '## Assistant next actions (not player)', '',
 '1. Read AGENTS.md and docs/ASSISTANT-CURRENT-STATE.md, then docs/ASSISTANT-RUNBOOK.md.',
 '2. Check GitHub main/PRs/CI/Pages live: this report cannot access remote state.',
 '3. Use Playwright real-VRM capture and direct pose tools yourself, never ask user to operate the editor.',
 '4. Keep animation defaults unchanged until the player approves a recorded candidate.',
 '', 'Overall: '+(failures.length?'FAIL':'PASS'),''].join('\n');
if(out){
 const dest=path.resolve(root,out);
 if(!dest.startsWith(root+path.sep))throw Error('Output must be inside repo');
 fs.mkdirSync(dest,{recursive:true});
 fs.writeFileSync(path.join(dest,'assistant-report.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(dest,'assistant-report.md'),markdown+'\n');
}
process.stdout.write(json?JSON.stringify(report,null,2)+'\n':markdown+'\n');
if(strict&&failures.length)process.exitCode=1;
