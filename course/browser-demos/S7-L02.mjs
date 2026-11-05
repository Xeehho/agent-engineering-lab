// 浏览器显式传递上下文，不使用 Node AsyncLocalStorage 或 OpenTelemetry SDK。
const spans = [];
const logs = [];
let sequence = 0;
async function withSpan(parent, name, operation) {
  sequence += 1;
  const current = {
    traceId: parent?.traceId ?? "trace-" + sequence,
    spanId: "span-" + sequence,
    parentId: parent?.spanId ?? null,
    name,
  };
  const startedAt = performance.now();
  try {
    return await operation(current);
  } finally {
    spans.push({ ...current, durationMs: performance.now() - startedAt });
  }
}
function recordEvent(context, input) {
  logs.push({ traceId: context.traceId, taskId: input.taskId, code: input.code });
}
async function runTask(taskId) {
  return withSpan(null, "task", async (context) => {
    recordEvent(context, { taskId, code: "START", apiKey: "do-not-record" });
    await Promise.all([
      withSpan(context, "docs", async () => "文档"),
      withSpan(context, "ticket", async () => "工单"),
    ]);
  });
}
await Promise.all([runTask("A"), runTask("B")]);
const roots = spans.filter((span) => span.parentId === null);
assert.equal(roots.length, 2);
assert.equal(spans.length, 6);
assert.ok(roots[0].traceId !== roots[1].traceId);
assert.equal(JSON.stringify(logs).includes("do-not-record"), false);
console.table(spans);
console.log("两条任务链路隔离，日志未包含密钥；字段是课堂格式，未接观测平台。");
