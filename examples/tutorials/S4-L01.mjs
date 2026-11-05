// 状态快照与事件在同一事务提交；用版本拒绝旧写者。
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const temporaryDirectory = mkdtempSync(join(tmpdir(), "agent-task-"));
const databasePath = join(temporaryDirectory, "tasks.sqlite");
let database = new DatabaseSync(databasePath);
database.exec(
  `
CREATE TABLE tasks (id TEXT PRIMARY KEY, state TEXT, version INTEGER);

CREATE TABLE events (
  task_id TEXT,
  version INTEGER,
  state TEXT,
  PRIMARY KEY (task_id, version)
)
`,
);
database.prepare("INSERT INTO tasks VALUES(?,?,?)").run("task-1", "queued", 0);
const allowedTransitions = {
  queued: ["running", "cancelled"],
  running: ["succeeded", "failed", "cancelled"],
};
// 输入任务、调用方看到的版本、目标状态；非法转换或旧版本都拒绝。
function transitionTask(taskId, expectedVersion, nextState) {
  database.exec("BEGIN IMMEDIATE");
  try {
    const currentTask = database.prepare("SELECT * FROM tasks WHERE id=?").get(taskId);
    if (!currentTask || currentTask.version !== expectedVersion) {
      throw new Error("STALE_VERSION");
    }
    if (!allowedTransitions[currentTask.state]?.includes(nextState)) {
      throw new Error("ILLEGAL_TRANSITION");
    }
    const updateResult = database
      .prepare(
        `
UPDATE tasks
SET
  state = ?,
  version = version + 1
WHERE
  id = ?
  AND version = ?
`,
      )
      .run(nextState, taskId, expectedVersion);
    if (updateResult.changes !== 1) {
      throw new Error("CONFLICT");
    }
    database
      .prepare("INSERT INTO events VALUES(?,?,?)")
      .run(taskId, expectedVersion + 1, nextState);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
try {
  transitionTask("task-1", 0, "running");
  database.close();
  database = new DatabaseSync(databasePath);
  assert.equal(database.prepare("SELECT state FROM tasks").get().state, "running");
  assert.throws(() => transitionTask("task-1", 0, "succeeded"), /STALE/);
  transitionTask("task-1", 1, "succeeded");
  assert.throws(() => transitionTask("task-1", 2, "failed"), /ILLEGAL/);
  const persistedEvents = database
    .prepare("SELECT version,state FROM events ORDER BY version")
    .all();
  assert.deepEqual(
    persistedEvents.map((event) => [event.version, event.state]),
    [
      [1, "running"],
      [2, "succeeded"],
    ],
  );
  console.log("reopen: running; stale writer rejected; terminal protected");
  console.log("state and two versioned events committed together");
} finally {
  database.close();
  rmSync(databasePath);
  rmdirSync(temporaryDirectory);
}
