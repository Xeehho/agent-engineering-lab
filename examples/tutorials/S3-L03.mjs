// 阅读顺序：权限检查 → 参数检查 → 范围缓存键 → 带租户查询 → 字段白名单。
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
const database = new DatabaseSync(":memory:");
database.exec(
  `
CREATE TABLE tickets (
  tenant TEXT,
  id TEXT,
  title TEXT,
  internal_note TEXT,
  PRIMARY KEY (tenant, id)
)
`,
);
const insert = database.prepare("INSERT INTO tickets VALUES(?,?,?,?)");
insert.run("A", "T-1", "A 的订单错误", "A 内部评审");
insert.run("B", "T-1", "B 的付款错误", "B 内部评审");
const cache = new Map();
// 返回当前授权范围的工单副本；缓存命中也必须先通过授权。
function readTicket(authenticatedContext, toolArguments) {
  if (!authenticatedContext || !authenticatedContext.scopes.includes("ticket:read")) {
    throw new Error("FORBIDDEN");
  }
  if (
    typeof toolArguments.id !== "string" ||
    Object.keys(toolArguments).some((k) => k !== "id")
  ) {
    throw new Error("INVALID_ARGUMENTS");
  }
  const cacheKey = JSON.stringify([
    authenticatedContext.tenant,
    authenticatedContext.subject,
    [...authenticatedContext.scopes].sort(),
    authenticatedContext.policyVersion,
    toolArguments.id,
  ]);
  if (cache.has(cacheKey)) {
    return structuredClone(cache.get(cacheKey));
  }
  const ticketRow = database
    .prepare("SELECT id,title FROM tickets WHERE tenant=? AND id=?")
    .get(authenticatedContext.tenant, toolArguments.id);
  const result = ticketRow ? { id: ticketRow.id, title: ticketRow.title } : null;
  cache.set(cacheKey, result);
  return structuredClone(result);
}
try {
  const tenantAContext = {
    tenant: "A",
    subject: "alice",
    scopes: ["ticket:read"],
    policyVersion: 1,
  };
  const tenantBContext = { ...tenantAContext, tenant: "B", subject: "bob" };
  assert.equal(readTicket(tenantAContext, { id: "T-1" }).title, "A 的订单错误");
  assert.equal(readTicket(tenantBContext, { id: "T-1" }).title, "B 的付款错误");
  assert.equal(cache.size, 2);
  assert.equal("internal_note" in readTicket(tenantAContext, { id: "T-1" }), false);
  assert.throws(
    () => readTicket(tenantAContext, { id: "T-1", tenant: "B" }),
    /INVALID/,
  );
  assert.throws(
    () => readTicket({ ...tenantAContext, scopes: [] }, { id: "T-1" }),
    /FORBIDDEN/,
  );
  const callerResult = readTicket(tenantAContext, { id: "T-1" });
  callerResult.title = "污染客户端对象";
  assert.equal(readTicket(tenantAContext, { id: "T-1" }).title, "A 的订单错误");
  console.log("tenant query + scoped cache + field allowlist: passed");
  console.log("model tenant rejected; permission checked before cached replay");
} finally {
  database.close();
}
