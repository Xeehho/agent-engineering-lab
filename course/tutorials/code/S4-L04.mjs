// 先观察查询计划，再加索引；用失败事务观察状态是否回滚。
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
const database = new DatabaseSync(":memory:");
try {
  database.exec(
    `
PRAGMA foreign_keys = ON;

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  tenant TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE events (
  task_id INTEGER REFERENCES tasks (id),
  version INTEGER,
  UNIQUE (task_id, version)
)
`,
  );
  const insertTask = database.prepare("INSERT INTO tasks VALUES(?,?,?,?)");
  database.exec("BEGIN");
  for (let taskNumber = 1; taskNumber <= 1000; taskNumber++) {
    insertTask.run(
      taskNumber,
      taskNumber % 2 ? "A" : "B",
      taskNumber % 3 ? "running" : "done",
      taskNumber,
    );
  }
  database.exec("COMMIT");
  const taskFeedQuery = `
SELECT
  id
FROM
  tasks
WHERE
  tenant = ?
  AND state = ?
ORDER BY
  created_at DESC,
  id DESC
LIMIT
  5
`;
  const readQueryPlan = () =>
    database
      .prepare("EXPLAIN QUERY PLAN " + taskFeedQuery)
      .all("A", "running")
      .map((r) => r.detail)
      .join(" | ");
  const planBeforeIndex = readQueryPlan();
  database.exec(
    "CREATE INDEX idx_task_feed ON tasks(tenant,state,created_at DESC,id DESC)",
  );
  const planAfterIndex = readQueryPlan();
  assert.ok(!planBeforeIndex.includes("idx_task_feed"));
  assert.ok(planAfterIndex.includes("idx_task_feed"));
  const recentTaskIds = database
    .prepare(taskFeedQuery)
    .all("A", "running")
    .map((r) => r.id);
  assert.deepEqual(recentTaskIds, [997, 995, 991, 989, 985]);
  const previousTaskState = database
    .prepare("SELECT state FROM tasks WHERE id=997")
    .get().state;
  database.exec("BEGIN");
  try {
    database.prepare("UPDATE tasks SET state='done' WHERE id=997").run();
    database.prepare("INSERT INTO events VALUES(?,?)").run(999999, 1);
    database.exec("COMMIT");
  } catch {
    database.exec("ROLLBACK");
  }
  assert.equal(
    database.prepare("SELECT state FROM tasks WHERE id=997").get().state,
    previousTaskState,
  );
  assert.equal(
    database.prepare("SELECT id FROM tasks WHERE tenant=?").all("A' OR 1=1 --").length,
    0,
  );
  console.log("query plan uses idx_task_feed; stable top IDs=997,995,991,989,985");
  console.log("foreign-key failure rolled back state; SQL-looking value stayed data");
} finally {
  database.close();
}
