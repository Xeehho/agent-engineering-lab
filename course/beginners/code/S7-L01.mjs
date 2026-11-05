const cases = [
  { id: "普通问答", passed: true, critical: false },
  { id: "租户隔离", passed: false, critical: true },
  { id: "无答案拒答", passed: true, critical: false },
];
const accuracy = cases.filter((item) => item.passed).length / cases.length;
const criticalFailure = cases.some((item) => item.critical && !item.passed);
const release = accuracy >= 0.6 && !criticalFailure;
console.log("关键失败：", criticalFailure, "允许发布：", release);
assert.equal(release, false);
