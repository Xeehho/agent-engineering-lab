// S7-L03 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：服务很忙时，要有明确的拒绝方式");
let active = 0;
const limit = 1;
function enter() {
  if (active >= limit) throw new Error("busy");
  active += 1;
}
function leave() {
  active -= 1;
}
enter();
try {
  assert.throws(enter, /busy/);
  console.log("第二个请求：拒绝进入");
} finally {
  leave();
}
console.log("剩余在途：", active);
assert.equal(active, 0);

}

{
console.log("实验 2：明确区分降级、等待与拒绝");
// 用纯函数验证故障策略，不启动HTTP服务，不发送请求。
function chooseRecovery(status) {
  if (status === 503) {
    return { action: "retrieval-only", degraded: true };
  }
  if (status === 429) {
    return { action: "wait", degraded: false };
  }
  if (status === 403) {
    return { action: "reject", degraded: false };
  }
  return { action: "fail", degraded: false };
}
const requestCounts = new Map();
function allowRequest(subject, limit) {
  const count = requestCounts.get(subject) ?? 0;
  if (count >= limit) {
    return false;
  }
  requestCounts.set(subject, count + 1);
  return true;
}
let activeConfig = Object.freeze({ version: "v2", mode: "primary" });
const previousConfig = Object.freeze({ version: "v1", mode: "retrieval-only" });
assert.equal(chooseRecovery(503).degraded, true);
assert.equal(chooseRecovery(403).action, "reject");
assert.equal(chooseRecovery(429).action, "wait");
assert.equal(allowRequest("alice", 2), true);
assert.equal(allowRequest("alice", 2), true);
assert.equal(allowRequest("alice", 2), false);
activeConfig = previousConfig;
assert.equal(activeConfig.mode, "retrieval-only");
console.log("503降级、403拒绝、429等待；第三次请求限流；配置切回v1。");
console.log("限流是内存计数，真实发布和回滚见选做实操。");

}
