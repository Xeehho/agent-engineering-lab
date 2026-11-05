// S4-L04 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：读懂过滤、排序与上限");
// 用数组推演 SQL 的 WHERE / ORDER BY / LIMIT，不执行数据库查询计划。
const tasks = [
  { id: 1, tenant: "A", state: "running", createdAt: 10 },
  { id: 2, tenant: "B", state: "running", createdAt: 30 },
  { id: 3, tenant: "A", state: "done", createdAt: 40 },
  { id: 4, tenant: "A", state: "running", createdAt: 20 },
  { id: 5, tenant: "A", state: "running", createdAt: 20 },
];
function queryTaskFeed(tenant, limit) {
  const allowedRows = tasks.filter(
    (task) => task.tenant === tenant && task.state === "running",
  );
  const sortedRows = allowedRows.sort(
    (left, right) => right.createdAt - left.createdAt || right.id - left.id,
  );
  return sortedRows.slice(0, limit).map((task) => task.id);
}
assert.deepEqual(queryTaskFeed("A", 2), [5, 4]);
assert.deepEqual(queryTaskFeed("B", 2), [2]);
assert.deepEqual(queryTaskFeed("unknown", 2), []);
console.log("A前两条", queryTaskFeed("A", 2));
console.log("同时间用id排序；索引和真实事务在选做SQLite实操中验证。");

}
