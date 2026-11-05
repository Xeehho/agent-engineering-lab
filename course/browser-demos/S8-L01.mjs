// 直接在网页运行。assert 是课堂提供的检查工具，失败会中断本次实验。
// 证据需要同时匹配需求、类型和当前commit；元数据通过后仍要审阅实际产物。
const requirements = [
  { id: "tenant-isolation", needs: "local-test" },
  { id: "restart-recovery", needs: "restart-test" },
  { id: "model-quality", needs: "live-eval" },
];
// 把每条要求映射到证据，不把缺失或旧版本材料当成功。
function auditEvidence(requirements, evidence, targetCommit) {
  if (!/^[0-9a-f]{40}$/.test(targetCommit)) {
    throw new Error("INVALID_COMMIT");
  }
  return requirements.map((requirement) => {
    const matchingEvidence = evidence.filter(
      (evidenceRecord) =>
        evidenceRecord.requirement === requirement.id &&
        evidenceRecord.commit === targetCommit,
    );
    const hasMatchingEvidence = matchingEvidence.some(
      (evidenceRecord) =>
        evidenceRecord.kind === requirement.needs &&
        evidenceRecord.status === "passed" &&
        typeof evidenceRecord.artifact === "string" &&
        evidenceRecord.artifact.length > 0,
    );
    return {
      id: requirement.id,
      status: hasMatchingEvidence ? "evidenced" : "unverified",
    };
  });
}
const targetCommit = "a".repeat(40);
const evidence = [
  {
    requirement: "tenant-isolation",
    kind: "local-test",
    status: "passed",
    artifact: "isolation.json",
    commit: targetCommit,
  },
  {
    requirement: "restart-recovery",
    kind: "restart-test",
    status: "passed",
    artifact: "restart.log",
    commit: "b".repeat(40),
  },
  {
    requirement: "model-quality",
    kind: "fixture-test",
    status: "passed",
    artifact: "fixture.json",
    commit: targetCommit,
  },
];
let auditRows = auditEvidence(requirements, evidence, targetCommit);
assert.deepEqual(
  auditRows.map((requirement) => requirement.status),
  ["evidenced", "unverified", "unverified"],
);
evidence.push({
  requirement: "restart-recovery",
  kind: "restart-test",
  status: "passed",
  artifact: "restart-new.log",
  commit: targetCommit,
});
auditRows = auditEvidence(requirements, evidence, targetCommit);
assert.equal(auditRows[1].status, "evidenced");
assert.equal(auditRows[2].status, "unverified");
assert.throws(() => auditEvidence(requirements, evidence, "main"), /COMMIT/);
console.log(
  "current-commit isolation evidenced; stale recovery rejected then refreshed",
);
console.log(
  "fixture did not satisfy live-model quality; artifact content still needs review",
);
