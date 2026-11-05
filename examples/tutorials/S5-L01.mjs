import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(":memory:");
db.exec("CREATE TABLE chunks(id TEXT PRIMARY KEY,tenant TEXT,doc TEXT,version INTEGER,start_line INTEGER,end_line INTEGER,text TEXT)");
function split(text,size=3,overlap=1) {
  if (!Number.isInteger(size) || size<1 || overlap<0 || overlap>=size)
    throw new Error("INVALID_WINDOW");
  const lines = text.replaceAll("\r\n","\n").split("\n"), blocks = [];
  for (let start=0;start<lines.length;start+=size-overlap) {
    const end = Math.min(start+size,lines.length);
    blocks.push({start:start+1,end,text:lines.slice(start,end).join("\n")});
    if (end === lines.length) break;
  }
  return blocks;
}
function ingest(tenant,doc,version,text) {
  const chunks = split(text);
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM chunks WHERE tenant=? AND doc=?").run(tenant,doc);
    for (const c of chunks) {
      const digest = createHash("sha256").update(c.text).digest("hex").slice(0,12);
      const id = [tenant,doc,version,c.start,c.end,digest].join(":");
      db.prepare("INSERT INTO chunks VALUES(?,?,?,?,?,?,?)")
        .run(id,tenant,doc,version,c.start,c.end,c.text);
    }
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
try {
  const original = "退款规则\n未发货可申请\n已发货先退货\n审核需两天\n到账以银行为准";
  const blocks = split(original);
  assert.deepEqual(blocks.map(c => [c.start,c.end]),[[1,3],[3,5]]);
  assert.equal(blocks[0].text.split("\n")[2],blocks[1].text.split("\n")[0]);
  ingest("A","refund",1,original);
  ingest("B","refund",1,"B 的独立规则");
  ingest("A","refund",2,"新版规则\n审核需三天");
  assert.equal(db.prepare("SELECT count(*) AS n FROM chunks WHERE tenant='A' AND version=1").get().n,0);
  assert.equal(db.prepare("SELECT count(*) AS n FROM chunks WHERE tenant='B'").get().n,1);
  db.prepare("DELETE FROM chunks WHERE tenant=? AND doc=?").run("A","refund");
  assert.equal(db.prepare("SELECT count(*) AS n FROM chunks WHERE tenant='A'").get().n,0);
  assert.throws(() => split(original,3,3),/WINDOW/);
  console.log("line provenance=1-3,3-5; overlap preserved");
  console.log("A v1 replaced by v2 then deleted; B remained isolated");
} finally { db.close(); }
