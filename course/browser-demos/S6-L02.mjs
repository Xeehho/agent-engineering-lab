// 手动验证结构化交接，来源存在仍不等于结论受支持。
const sources = new Map([
  ["rule-v2", { tenant: "A", current: true }],
  ["private-B", { tenant: "B", current: true }],
]);
function validateHandoff(handoff, context) {
  const allowedKeys = ["taskId", "inputVersion", "claims", "unresolved"];
  if (Object.keys(handoff).some((key) => !allowedKeys.includes(key))) {
    throw new Error("INVALID_FIELD");
  }
  if (handoff.taskId !== context.taskId || handoff.inputVersion !== context.version) {
    throw new Error("STALE");
  }
  if (!Array.isArray(handoff.claims) || !Array.isArray(handoff.unresolved)) {
    throw new Error("INVALID_SHAPE");
  }
  for (const claim of handoff.claims) {
    const source = sources.get(claim.evidenceId);
    if (!source || !source.current || source.tenant !== context.tenant) {
      throw new Error("EVIDENCE");
    }
  }
  return handoff;
}
function reconcile(handoffs) {
  const facts = new Map();
  for (const handoff of handoffs) {
    if (handoff.unresolved.length > 0) {
      return "blocked";
    }
    for (const claim of handoff.claims) {
      if (facts.has(claim.key) && facts.get(claim.key) !== claim.value) {
        return "conflict";
      }
      facts.set(claim.key, claim.value);
    }
  }
  return "ready";
}
const context = { taskId: "T", version: 2, tenant: "A" };
const first = {
  taskId: "T",
  inputVersion: 2,
  claims: [{ key: "reviewDays", value: "2", evidenceId: "rule-v2" }],
  unresolved: [],
};
const second = { ...first, claims: [{ ...first.claims[0], value: "3" }] };
validateHandoff(first, context);
validateHandoff(second, context);
assert.equal(reconcile([first, first]), "ready");
assert.equal(reconcile([first, second]), "conflict");
assert.throws(() => validateHandoff({ ...first, inputVersion: 1 }, context), /STALE/);
assert.throws(() => validateHandoff({ ...first, approved: true }, context), /FIELD/);
console.log("结构、版本和冲突检查已运行；两个同源赞同不是独立核验。");
