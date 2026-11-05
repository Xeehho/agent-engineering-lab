import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync,rmSync,rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(),"agent-task-"));
const path = join(dir,"tasks.sqlite");
let db = new DatabaseSync(path);
db.exec("CREATE TABLE tasks(id TEXT PRIMARY KEY,state TEXT,version INTEGER); CREATE TABLE events(task_id TEXT,version INTEGER,state TEXT,PRIMARY KEY(task_id,version))");
db.prepare("INSERT INTO tasks VALUES(?,?,?)").run("task-1","queued",0);
const allowed = {queued:["running","cancelled"],running:["succeeded","failed","cancelled"]};
function transition(id,expectedVersion,to) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const row = db.prepare("SELECT * FROM tasks WHERE id=?").get(id);
    if (!row || row.version !== expectedVersion) throw new Error("STALE_VERSION");
    if (!allowed[row.state]?.includes(to)) throw new Error("ILLEGAL_TRANSITION");
    const changed = db.prepare("UPDATE tasks SET state=?,version=version+1 WHERE id=? AND version=?")
      .run(to,id,expectedVersion);
    if (changed.changes !== 1) throw new Error("CONFLICT");
    db.prepare("INSERT INTO events VALUES(?,?,?)").run(id,expectedVersion+1,to);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
try {
  transition("task-1",0,"running");
  db.close(); db = new DatabaseSync(path);
  assert.equal(db.prepare("SELECT state FROM tasks").get().state,"running");
  assert.throws(() => transition("task-1",0,"succeeded"),/STALE/);
  transition("task-1",1,"succeeded");
  assert.throws(() => transition("task-1",2,"failed"),/ILLEGAL/);
  const events = db.prepare("SELECT version,state FROM events ORDER BY version").all();
  assert.deepEqual(events.map(e => [e.version,e.state]),[[1,"running"],[2,"succeeded"]]);
  console.log("reopen: running; stale writer rejected; terminal protected");
  console.log("state and two versioned events committed together");
} finally { db.close(); rmSync(path); rmdirSync(dir); }
