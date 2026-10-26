/* V1 assistant boot inventory contract. Reports facts; NEVER approves visuals. */
'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process');
const output=cp.spawnSync(process.execPath,['tools/assistant-checkup.cjs','--json','--strict'],{
 cwd:require('node:path').resolve(__dirname,'..'),encoding:'utf8',timeout:30000,
 maxBuffer:3*1024*1024
});
if(output.error)throw output.error;
assert.equal(output.status,0,output.stderr||output.stdout);
const r=JSON.parse(output.stdout);
assert.equal(r.schema,'sky-clash.assistant-checkup.v1');
assert.equal(r.repository,'Theo524/sky-clash');
assert.deepEqual(r.actual.playable,['kairo_venn','rin_sable']);
assert.equal(r.actual.proposedCount,4);
assert.equal(r.actual.bundleMatchesSource,true);
assert.equal(r.actual.kairoVrmSha256,r.actual.v152PoseModelSha256);
assert.equal(r.actual.defaultFlight,'v156');
assert.equal(r.actual.defaultJump,'v125');
assert.equal(r.actual.release,'V156');
assert.match(r.rejected.V153Flight,/stick/i);
assert.match(r.rejected.V155FlightBoost,/twist/i);
assert.equal(r.visualApproval,'NOT AUTOMATABLE: explicit player review required');
assert.equal(r.passed,true);
assert(r.checks.length>=20);
assert.equal(r.remoteCI,'NOT CHECKED: consult GitHub Actions');
console.log('PASS Sky Clash cross-chat assistant bootstrap: real repo source, model fingerprint, no false visual approval');
