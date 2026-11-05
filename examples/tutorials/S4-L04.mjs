import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(":memory:");
try {
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE tasks(id INTEGER PRIMARY KEY,tenant TEXT NOT NULL,state TEXT NOT NULL,created_at INTEGER NOT NULL); CREATE TABLE events(task_id INTEGER REFERENCES tasks(id),version INTEGER,UNIQUE(task_id,version))");
  const insert = db.prepare("INSERT INTO tasks VALUES(?,?,?,?)");
  db.exec("BEGIN");
  for (let i=1;i<=1000;i++) insert.run(i,i%2?"A":"B",i%3?"running":"done",i);
  db.exec("COMMIT");
  const sql = "SELECT id FROM tasks WHERE tenant=? AND state=? ORDER BY created_at DESC,id DESC LIMIT 5";
  const plan = () => db.prepare("EXPLAIN QUERY PLAN "+sql).all("A","running").map(r => r.detail).join(" | ");
  const before = plan();
  db.exec("CREATE INDEX idx_task_feed ON tasks(tenant,state,created_at DESC,id DESC)");
  const after = plan();
  assert.ok(!before.includes("idx_task_feed"));
  assert.ok(after.includes("idx_task_feed"));
  const ids = db.prepare(sql).all("A","running").map(r => r.id);
  assert.deepEqual(ids,[997,995,991,989,985]);
  const prior = db.prepare("SELECT state FROM tasks WHERE id=997").get().state;
  db.exec("BEGIN");
  try {
    db.prepare("UPDATE tasks SET state='done' WHERE id=997").run();
    db.prepare("INSERT INTO events VALUES(?,?)").run(999999,1);
    db.exec("COMMIT");
  } catch {
    db.exec("ROLLBACK");
  }
  assert.equal(db.prepare("SELECT state FROM tasks WHERE id=997").get().state,prior);
  assert.equal(db.prepare("SELECT id FROM tasks WHERE tenant=?").all("A' OR 1=1 --").length,0);
  console.log("query plan uses idx_task_feed; stable top IDs=997,995,991,989,985");
  console.log("foreign-key failure rolled back state; SQL-looking value stayed data");
} finally { db.close(); }
