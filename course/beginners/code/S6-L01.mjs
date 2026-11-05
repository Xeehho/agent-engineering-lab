function route(task) {
  if (task.kind === "固定分诊") return "workflow";
  if (task.kind === "跨资料调查") return "specialist";
  return "追问任务范围";
}
console.log(route({ kind: "固定分诊" }));
console.log(route({ kind: "跨资料调查" }));
assert.equal(route({ kind: "未知" }), "追问任务范围");
