const evidence = [
  { kind: "controlled", passed: true },
  { kind: "real", passed: false },
];
function canClaimReal(rows) {
  return rows.some((row) => row.kind === "real" && row.passed);
}
console.log("本地检查通过：", evidence[0].passed);
console.log("可声称真实接通：", canClaimReal(evidence));
assert.equal(canClaimReal(evidence), false);
