// S8-L02 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：从症状提出可证伪的排错假设");
const events = [
  { name: "model:start", at: 0 },
  { name: "model:end", at: 20 },
  { name: "tool:start", at: 21 },
  { name: "tool:end", at: 921 },
];
function duration(prefix) {
  return (
    events.find((event) => event.name === prefix + ":end").at -
    events.find((event) => event.name === prefix + ":start").at
  );
}
console.log("模型：", duration("model"), "工具：", duration("tool"));
assert.ok(duration("tool") > duration("model"));

}

{
console.log("实验 2：修复旧结果覆盖");
// 直接在网页运行。assert 是课堂提供的检查工具，失败会中断本次实验。
// 先复现无保护 reducer，再用任务ID、版本和终态三个条件拒绝错误事件。
const initialState = { runId: "new", version: 0, status: "running", text: "" };
const eventSequence = [
  { runId: "new", version: 1, status: "running", text: "新任务中间结果" },
  { runId: "old", version: 9, status: "succeeded", text: "旧任务答案" },
  { runId: "new", version: 2, status: "succeeded", text: "新任务最终答案" },
  { runId: "new", version: 1, status: "running", text: "重复中间事件" },
  { runId: "new", version: 3, status: "running", text: "终态后错误事件" },
];
const reduceWithoutGuards = (previousState, event) => ({ ...previousState, ...event });
// 只接受当前任务、更高版本、未结束时的事件。
function reduceWithGuards(previousState, event) {
  if (event.runId !== previousState.runId || event.version <= previousState.version) {
    return previousState;
  }
  if (["succeeded", "failed", "cancelled"].includes(previousState.status)) {
    return previousState;
  }
  return {
    ...previousState,
    version: event.version,
    status: event.status,
    text: event.text,
  };
}
const brokenResult = eventSequence.reduce(reduceWithoutGuards, initialState);
assert.equal(brokenResult.text, "终态后错误事件");
const guardedResult = eventSequence.reduce(reduceWithGuards, initialState);
assert.deepEqual(guardedResult, {
  runId: "new",
  version: 2,
  status: "succeeded",
  text: "新任务最终答案",
});
assert.equal(
  eventSequence.slice(0, 2).reduce(reduceWithGuards, initialState).text,
  "新任务中间结果",
);
assert.equal(
  eventSequence.slice(0, 2).reduce(reduceWithoutGuards, initialState).runId,
  "old",
);
console.log("broken replay reproduced old-result overwrite and terminal regression");
console.log(
  "guarded replay kept new run/version 2/succeeded; upstream cancellation unverified",
);

}
