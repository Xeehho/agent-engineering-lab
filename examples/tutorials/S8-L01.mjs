import assert from "node:assert/strict";
const requirements = [
  {id:"tenant-isolation",needs:"local-test"},
  {id:"restart-recovery",needs:"restart-test"},
  {id:"model-quality",needs:"live-eval"}
];
function audit(requirements,evidence,commit) {
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error("INVALID_COMMIT");
  return requirements.map(r => {
    const matching = evidence.filter(e => e.requirement===r.id && e.commit===commit);
    const valid = matching.some(e => e.kind===r.needs && e.status==="passed" &&
      typeof e.artifact==="string" && e.artifact.length>0);
    return {id:r.id,status:valid?"evidenced":"unverified"};
  });
}
const commit = "a".repeat(40);
const evidence = [
  {requirement:"tenant-isolation",kind:"local-test",status:"passed",artifact:"isolation.json",commit},
  {requirement:"restart-recovery",kind:"restart-test",status:"passed",artifact:"restart.log",commit:"b".repeat(40)},
  {requirement:"model-quality",kind:"fixture-test",status:"passed",artifact:"fixture.json",commit}
];
let rows = audit(requirements,evidence,commit);
assert.deepEqual(rows.map(r => r.status),["evidenced","unverified","unverified"]);
evidence.push({requirement:"restart-recovery",kind:"restart-test",status:"passed",artifact:"restart-new.log",commit});
rows = audit(requirements,evidence,commit);
assert.equal(rows[1].status,"evidenced");
assert.equal(rows[2].status,"unverified");
assert.throws(() => audit(requirements,evidence,"main"),/COMMIT/);
console.log("current-commit isolation evidenced; stale recovery rejected then refreshed");
console.log("fixture did not satisfy live-model quality; artifact content still needs review");
