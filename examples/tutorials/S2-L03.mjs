import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "agent-idempotency-"));
const path = join(dir, "drafts.sqlite");
let db = new DatabaseSync(path);
db.exec("CREATE TABLE drafts(tenant TEXT, key TEXT, hash TEXT, body TEXT, PRIMARY KEY(tenant,key))");
const hash = body => createHash("sha256").update(JSON.stringify({text:body.text})).digest("hex");
function createDraft(auth, key, body) {
  if (auth.role !== "editor") throw new Error("FORBIDDEN");
  if (typeof key !== "string" || !key || typeof body.text !== "string")
    throw new Error("INVALID");
  db.exec("BEGIN IMMEDIATE");
  try {
    const prior = db.prepare("SELECT hash,body FROM drafts WHERE tenant=? AND key=?").get(auth.tenant,key);
    let result;
    if (prior) {
      if (prior.hash !== hash(body)) throw new Error("IDEMPOTENCY_CONFLICT");
      result = JSON.parse(prior.body);
    } else {
      result = {id:auth.tenant + ":" + key, text:body.text};
      db.prepare("INSERT INTO drafts VALUES(?,?,?,?)")
        .run(auth.tenant,key,hash(body),JSON.stringify(result));
    }
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
try {
  const auth = {tenant:"A",role:"editor"};
  const first = createDraft(auth,"intent-42",{text:"收到，正在处理"});
  // 模拟提交后响应丢失：丢弃 first，重新打开数据库后重试。
  db.close();
  db = new DatabaseSync(path);
  assert.deepEqual(createDraft(auth,"intent-42",{text:"收到，正在处理"}),first);
  assert.equal(db.prepare("SELECT count(*) AS n FROM drafts").get().n,1);
  assert.throws(() => createDraft(auth,"intent-42",{text:"替换内容"}),/CONFLICT/);
  assert.throws(() => createDraft({tenant:"A",role:"viewer"},"intent-42",{text:"收到，正在处理"}),/FORBIDDEN/);
  createDraft({tenant:"B",role:"editor"},"intent-42",{text:"B 的草稿"});
  assert.equal(db.prepare("SELECT count(*) AS n FROM drafts").get().n,2);
  console.log("reopen + retry: one draft; changed payload: conflict; viewer: forbidden");
  console.log("tenant A/B isolated; SQLite transaction only, no external side effect");
} finally {
  db.close();
  rmSync(path);
  rmdirSync(dir);
}
