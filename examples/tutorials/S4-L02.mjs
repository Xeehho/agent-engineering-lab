import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(":memory:");
db.exec("CREATE TABLE jobs(id TEXT PRIMARY KEY,state TEXT,owner TEXT,lease_until INTEGER,token INTEGER,attempt INTEGER,next_at INTEGER)");
db.prepare("INSERT INTO jobs VALUES(?,?,?,?,?,?,?)").run("J1","queued",null,0,0,0,0);
function claim(owner,now) {
  return db.prepare("UPDATE jobs SET state='running',owner=?,lease_until=?,token=token+1,attempt=attempt+1 WHERE id='J1' AND attempt<3 AND ((state='queued' AND next_at<=?) OR (state='running' AND lease_until<=?)) RETURNING token")
    .get(owner,now+10,now,now)?.token;
}
function finish(owner,token,now) {
  return db.prepare("UPDATE jobs SET state='succeeded' WHERE id='J1' AND state='running' AND owner=? AND token=? AND lease_until>?")
    .run(owner,token,now).changes === 1;
}
function retry(owner,token,now) {
  return db.prepare("UPDATE jobs SET state='queued',next_at=?,owner=NULL WHERE id='J1' AND state='running' AND owner=? AND token=? AND lease_until>?")
    .run(now+5,owner,token,now).changes === 1;
}
try {
  const old = claim("W1",0);
  assert.equal(old,1);
  assert.equal(claim("W2",5),undefined);
  const current = claim("W2",11);
  assert.equal(current,2);
  assert.equal(finish("W1",old,12),false);
  assert.equal(retry("W2",current,12),true);
  assert.equal(claim("W3",16),undefined);
  const final = claim("W3",17);
  assert.equal(final,3);
  assert.equal(finish("W3",final,18),true);
  assert.equal(claim("W4",100),undefined);
  assert.equal(db.prepare("SELECT attempt FROM jobs").get().attempt,3);
  console.log("lease expiry -> token 2; stale token 1 rejected");
  console.log("retry delayed until 17; attempt 3 succeeded; terminal not reclaimed");
} finally { db.close(); }
