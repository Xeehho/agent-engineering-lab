import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(":memory:");
db.exec("CREATE TABLE tickets(tenant TEXT,id TEXT,title TEXT,internal_note TEXT,PRIMARY KEY(tenant,id))");
const insert = db.prepare("INSERT INTO tickets VALUES(?,?,?,?)");
insert.run("A","T-1","A 的订单错误","A 内部评审");
insert.run("B","T-1","B 的付款错误","B 内部评审");
const cache = new Map();
function read(auth,args) {
  if (!auth || !auth.scopes.includes("ticket:read")) throw new Error("FORBIDDEN");
  if (typeof args.id !== "string" || Object.keys(args).some(k => k !== "id"))
    throw new Error("INVALID_ARGUMENTS");
  const key = JSON.stringify([auth.tenant,auth.subject,[...auth.scopes].sort(),auth.policyVersion,args.id]);
  if (cache.has(key)) return structuredClone(cache.get(key));
  const row = db.prepare("SELECT id,title FROM tickets WHERE tenant=? AND id=?")
    .get(auth.tenant,args.id);
  const result = row ? {id:row.id,title:row.title} : null;
  cache.set(key,result);
  return structuredClone(result);
}
try {
  const A = {tenant:"A",subject:"alice",scopes:["ticket:read"],policyVersion:1};
  const B = {...A,tenant:"B",subject:"bob"};
  assert.equal(read(A,{id:"T-1"}).title,"A 的订单错误");
  assert.equal(read(B,{id:"T-1"}).title,"B 的付款错误");
  assert.equal(cache.size,2);
  assert.equal("internal_note" in read(A,{id:"T-1"}),false);
  assert.throws(() => read(A,{id:"T-1",tenant:"B"}),/INVALID/);
  assert.throws(() => read({...A,scopes:[]},{id:"T-1"}),/FORBIDDEN/);
  const returned = read(A,{id:"T-1"});
  returned.title = "污染客户端对象";
  assert.equal(read(A,{id:"T-1"}).title,"A 的订单错误");
  console.log("tenant query + scoped cache + field allowlist: passed");
  console.log("model tenant rejected; permission checked before cached replay");
} finally { db.close(); }
