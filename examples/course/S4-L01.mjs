// S4-L01 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：任务状态是可检查的记录");
const allowed = {
  queued: ["running"],
  running: ["succeeded", "failed"],
  succeeded: [],
  failed: [],
};
function transition(task, next) {
  if (!allowed[task.state].includes(next)) throw new Error("不允许的状态变化");
  return { ...task, state: next, version: task.version + 1 };
}
let task = { id: "task-42", state: "queued", version: 0 };
task = transition(task, "running");
task = transition(task, "succeeded");
console.log(task.state, task.version);
assert.throws(() => transition(task, "running"), /不允许/);

}

{
console.log("实验 2：状态版本与旧写者");
// 网站内验证状态转换与版本；JSON快照不等于真实数据库持久化。
const allowedTransitions = {
  queued: ["running", "cancelled"],
  running: ["succeeded", "failed", "cancelled"],
};
function transitionTask(task, expectedVersion, nextState) {
  if (task.version !== expectedVersion) {
    throw new Error("STALE_VERSION");
  }
  if (!allowedTransitions[task.state]?.includes(nextState)) {
    throw new Error("ILLEGAL_TRANSITION");
  }
  return { ...task, state: nextState, version: task.version + 1 };
}

let task = { id: "task-1", state: "queued", version: 0 };
task = transitionTask(task, 0, "running");
assert.equal(task.version, 1);
const snapshotText = JSON.stringify(task);
const restoredTask = JSON.parse(snapshotText);
assert.deepEqual(restoredTask, task);
assert.throws(() => transitionTask(task, 0, "succeeded"), /STALE/);
task = transitionTask(task, 1, "succeeded");
assert.equal(task.version, 2);
assert.throws(() => transitionTask(task, 2, "failed"), /ILLEGAL/);
console.log("状态", task);
console.log("旧版本与终态回退被拒绝；真实重启恢复需要选做数据库实操。");

}
