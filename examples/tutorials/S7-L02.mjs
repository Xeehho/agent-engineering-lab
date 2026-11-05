import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { setTimeout as wait } from "node:timers/promises";
const storage = new AsyncLocalStorage(), spans = [], logs = [];
const id = bytes => randomBytes(bytes).toString("hex");
async function span(name,fn) {
  const parent = storage.getStore();
  const current = {traceId:parent?.traceId || id(16),spanId:id(8),parentId:parent?.spanId || null,name};
  const start = performance.now();
  return storage.run(current,async () => {
    let status = "ok";
    try { return await fn(); }
    catch (error) { status="error"; throw error; }
    finally { spans.push({...current,status,durationMs:performance.now()-start}); }
  });
}
function log(event,data) {
  // 采用允许列表，不记录任意 request、headers 或原文。
  const {taskId,code,attempt} = data;
  logs.push({...storage.getStore(),event,taskId,code,attempt});
}
async function task(taskId) {
  return span("task",async () => {
    log("start",{taskId,code:"START",attempt:1,apiKey:"do-not-record"});
    await Promise.all([
      span("docs",async () => {await wait(2); log("read",{taskId,code:"DOCS",attempt:1});}),
      span("ticket",async () => {await wait(1); log("read",{taskId,code:"TICKET",attempt:1});})
    ]);
  });
}
await Promise.all([task("A"),task("B")]);
assert.equal(spans.length,6);
const roots = spans.filter(s => s.parentId===null);
assert.equal(roots.length,2);
assert.notEqual(roots[0].traceId,roots[1].traceId);
for (const root of roots) {
  const children = spans.filter(s => s.parentId===root.spanId);
  assert.equal(children.length,2);
  assert.ok(children.every(s => s.traceId===root.traceId));
}
assert.equal(JSON.stringify(logs).includes("do-not-record"),false);
assert.equal(new Set(logs.filter(l => l.taskId==="A").map(l => l.traceId)).size,1);
await assert.rejects(span("failure",async () => {throw new Error("EXPECTED");}),/EXPECTED/);
assert.equal(spans.at(-1).status,"error");
console.log("two parallel tasks: isolated traces, two children each");
console.log("allowlist logs omitted key; error span closed; durations measured locally");
