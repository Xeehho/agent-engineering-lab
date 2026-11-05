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
