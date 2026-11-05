import assert from "node:assert/strict";
const initial = {runId:"new",version:0,status:"running",text:""};
const events = [
  {runId:"new",version:1,status:"running",text:"新任务中间结果"},
  {runId:"old",version:9,status:"succeeded",text:"旧任务答案"},
  {runId:"new",version:2,status:"succeeded",text:"新任务最终答案"},
  {runId:"new",version:1,status:"running",text:"重复中间事件"},
  {runId:"new",version:3,status:"running",text:"终态后错误事件"}
];
const broken = (state,e) => ({...state,...e});
function guarded(state,e) {
  if (e.runId!==state.runId || e.version<=state.version) return state;
  if (["succeeded","failed","cancelled"].includes(state.status)) return state;
  return {...state,version:e.version,status:e.status,text:e.text};
}
const bad = events.reduce(broken,initial);
assert.equal(bad.text,"终态后错误事件");
const good = events.reduce(guarded,initial);
assert.deepEqual(good,{runId:"new",version:2,status:"succeeded",text:"新任务最终答案"});
assert.equal(events.slice(0,2).reduce(guarded,initial).text,"新任务中间结果");
assert.equal(events.slice(0,2).reduce(broken,initial).runId,"old");
console.log("broken replay reproduced old-result overwrite and terminal regression");
console.log("guarded replay kept new run/version 2/succeeded; upstream cancellation unverified");
