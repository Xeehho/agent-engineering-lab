// 异步上下文负责关联；观测数据仅采用允许字段，避免整包记录敏感内容。
import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
const traceStorage = new AsyncLocalStorage(),
  finishedSpans = [],
  logEntries = [];
const createRandomId = (bytes) => randomBytes(bytes).toString("hex");
// 创建当前操作并继承父链路，在 finally 记录完成或失败耗时。
async function withSpan(name, operation) {
  const parentSpan = traceStorage.getStore();
  const currentSpan = {
    traceId: parentSpan?.traceId || createRandomId(16),
    spanId: createRandomId(8),
    parentId: parentSpan?.spanId || null,
    name,
  };
  const startedAt = performance.now();
  return traceStorage.run(currentSpan, async () => {
    let status = "ok";
    try {
      return await operation();
    } catch (error) {
      status = "error";
      throw error;
    } finally {
      finishedSpans.push({
        ...currentSpan,
        status,
        durationMs: performance.now() - startedAt,
      });
    }
  });
}
// 只保留允许字段，并带上当前异步链路身份。
function recordEvent(event, eventData) {
  // 采用允许列表，不记录任意 request、headers 或原文。
  const { taskId, code, attempt } = eventData;
  logEntries.push({ ...traceStorage.getStore(), event, taskId, code, attempt });
}
// 一个任务并行创建文档和工单两个子操作。
async function runObservedTask(taskId) {
  return withSpan("task", async () => {
    recordEvent("start", {
      taskId,
      code: "START",
      attempt: 1,
      apiKey: "do-not-record",
    });
    await Promise.all([
      withSpan("docs", async () => {
        await sleep(2);
        recordEvent("read", { taskId, code: "DOCS", attempt: 1 });
      }),
      withSpan("ticket", async () => {
        await sleep(1);
        recordEvent("read", { taskId, code: "TICKET", attempt: 1 });
      }),
    ]);
  });
}
await Promise.all([runObservedTask("A"), runObservedTask("B")]);
assert.equal(finishedSpans.length, 6);
const rootSpans = finishedSpans.filter((spanRecord) => spanRecord.parentId === null);
assert.equal(rootSpans.length, 2);
assert.notEqual(rootSpans[0].traceId, rootSpans[1].traceId);
for (const rootSpan of rootSpans) {
  const childSpans = finishedSpans.filter(
    (spanRecord) => spanRecord.parentId === rootSpan.spanId,
  );
  assert.equal(childSpans.length, 2);
  assert.ok(childSpans.every((spanRecord) => spanRecord.traceId === rootSpan.traceId));
}
assert.equal(JSON.stringify(logEntries).includes("do-not-record"), false);
assert.equal(
  new Set(
    logEntries
      .filter((logEntry) => logEntry.taskId === "A")
      .map((logEntry) => logEntry.traceId),
  ).size,
  1,
);
await assert.rejects(
  withSpan("failure", async () => {
    throw new Error("EXPECTED");
  }),
  /EXPECTED/,
);
assert.equal(finishedSpans.at(-1).status, "error");
console.log("two parallel tasks: isolated traces, two children each");
console.log(
  "allowlist logs omitted key; error span closed; durations measured locally",
);
