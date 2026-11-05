// 交接先验证形状和证据范围，再检查未决事项与冲突。
import assert from "node:assert/strict";
import { z } from "zod";
const handoffSchema = z
  .object({
    taskId: z.string(),
    inputVersion: z.number().int(),
    status: z.enum(["ready", "blocked"]),
    claims: z.array(
      z
        .object({
          key: z.string(),
          value: z.string(),
          evidenceIds: z.array(z.string()).min(1),
        })
        .strict(),
    ),
    unresolved: z.array(z.string()),
  })
  .strict();
const evidence = new Map([
  ["rule-v2", { current: true, tenant: "A", text: "退款审核需两天" }],
  ["rule-v1", { current: false, tenant: "A", text: "旧版需一天" }],
  ["private-B", { current: true, tenant: "B", text: "B 的规则" }],
]);
// 对齐任务、输入版本和来源权限，但不宣称已验证语义支持。
function validateHandoff(rawHandoff, context) {
  const handoff = handoffSchema.parse(rawHandoff);
  if (handoff.taskId !== context.taskId || handoff.inputVersion !== context.version) {
    throw new Error("STALE_HANDOFF");
  }
  for (const claim of handoff.claims) {
    for (const evidenceId of claim.evidenceIds) {
      const sourceEvidence = evidence.get(evidenceId);
      if (
        !sourceEvidence ||
        !sourceEvidence.current ||
        sourceEvidence.tenant !== context.tenant
      ) {
        throw new Error("INVALID_EVIDENCE");
      }
    }
  }
  return handoff;
}
// 相同事实可以合并，冲突或未决事项必须阻止继续。
function reconcile(handoffs) {
  const factValues = new Map();
  for (const handoff of handoffs) {
    if (handoff.status === "blocked" || handoff.unresolved.length) {
      return { status: "blocked", reason: "UNRESOLVED" };
    }
    for (const claim of handoff.claims) {
      if (factValues.has(claim.key) && factValues.get(claim.key) !== claim.value) {
        return { status: "blocked", reason: "CONFLICT", key: claim.key };
      }
      factValues.set(claim.key, claim.value);
    }
  }
  return { status: "ready", facts: Object.fromEntries(factValues) };
}
const fixtureHandoff = {
  taskId: "T",
  inputVersion: 2,
  status: "ready",
  claims: [{ key: "reviewDays", value: "2", evidenceIds: ["rule-v2"] }],
  unresolved: [],
};
const expectedContext = { taskId: "T", version: 2, tenant: "A" };
const acceptedHandoff = validateHandoff(fixtureHandoff, expectedContext);
assert.equal(reconcile([acceptedHandoff, acceptedHandoff]).status, "ready");
const conflictingHandoff = validateHandoff(
  {
    ...fixtureHandoff,
    claims: [{ key: "reviewDays", value: "3", evidenceIds: ["rule-v2"] }],
  },
  expectedContext,
);
assert.deepEqual(reconcile([acceptedHandoff, conflictingHandoff]), {
  status: "blocked",
  reason: "CONFLICT",
  key: "reviewDays",
});
assert.throws(
  () => validateHandoff({ ...fixtureHandoff, inputVersion: 1 }, expectedContext),
  /STALE/,
);
assert.throws(
  () =>
    validateHandoff(
      {
        ...fixtureHandoff,
        claims: [{ key: "x", value: "x", evidenceIds: ["private-B"] }],
      },
      expectedContext,
    ),
  /EVIDENCE/,
);
assert.throws(() =>
  validateHandoff({ ...fixtureHandoff, approved: true }, expectedContext),
);
console.log("handoff schema/version/evidence scope: passed");
console.log("conflict blocked; same-source agreement not treated as independent proof");
