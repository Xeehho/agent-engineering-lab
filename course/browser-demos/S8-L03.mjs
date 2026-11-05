// 直接在网页运行。assert 是课堂提供的检查工具，失败会中断本次实验。
// 先核验简历声明的证据类型，再计算目标岗位的能力缺口。
const evidenceById = new Map([
  ["mcp-local", { kind: "local-integration", verified: true }],
  ["rag-fixture", { kind: "fixture-metric", verified: true }],
  ["ui-demo", { kind: "browser-demo", verified: true }],
]);
const portfolioClaims = [
  {
    text: "完成本地 MCP 客户端/服务端互通",
    requires: "local-integration",
    evidenceId: "mcp-local",
  },
  {
    text: "生产 RAG 准确率99%",
    requires: "production-eval",
    evidenceId: "rag-fixture",
  },
  {
    text: "实现任务状态与审批界面演示",
    requires: "browser-demo",
    evidenceId: "ui-demo",
  },
  { text: "已承受十万用户并发", requires: "load-test", evidenceId: "missing" },
];
// 证据已验证且类型符合声明需要时，才标记可支持。
function inspectClaims(portfolioClaims, evidenceById) {
  return portfolioClaims.map((claim) => {
    const evidenceRecord = evidenceById.get(claim.evidenceId);
    return {
      ...claim,
      supported: !!evidenceRecord?.verified && evidenceRecord.kind === claim.requires,
    };
  });
}
const claimResults = inspectClaims(portfolioClaims, evidenceById);
assert.deepEqual(
  claimResults.map((r) => r.supported),
  [true, false, true, false],
);
assert.equal(claimResults.filter((r) => r.supported).length, 2);
const fixtureJobs = [
  { id: "frontend-ai", needs: ["React", "streaming", "evaluation"] },
  { id: "agent-app", needs: ["tools", "MCP", "SQL", "evaluation"] },
];
const demonstratedCapabilities = new Set(["React", "streaming", "tools", "MCP"]);
const missingCapabilities = fixtureJobs.map((job) => ({
  id: job.id,
  missing: job.needs.filter((capability) => !demonstratedCapabilities.has(capability)),
}));
assert.deepEqual(missingCapabilities, [
  { id: "frontend-ai", missing: ["evaluation"] },
  { id: "agent-app", missing: ["SQL", "evaluation"] },
]);
console.log("supported claims=2/4; fixture cannot justify production metric");
console.log(
  "gaps: frontend-ai=evaluation; agent-app=SQL,evaluation; jobs are synthetic",
);
