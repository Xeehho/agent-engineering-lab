// 身份由课堂夹具给出；先授权，再查范围缓存，最后读限定租户的数据。
const tickets = [
  { tenant: "A", id: "T-1", title: "A的工单", internalNote: "A内部资料" },
  { tenant: "B", id: "T-1", title: "B的工单", internalNote: "B内部资料" },
];
const resultCache = new Map();
function readTicket(authenticatedUser, ticketId) {
  if (!authenticatedUser.canRead) {
    throw new Error("FORBIDDEN");
  }
  const cacheKey = JSON.stringify([authenticatedUser.tenant, ticketId]);
  if (resultCache.has(cacheKey)) {
    return structuredClone(resultCache.get(cacheKey));
  }
  const ticket = tickets.find(
    (candidate) =>
      candidate.tenant === authenticatedUser.tenant && candidate.id === ticketId,
  );
  const result = ticket ? { id: ticket.id, title: ticket.title } : null;
  resultCache.set(cacheKey, result);
  return structuredClone(result);
}
const alice = { tenant: "A", canRead: true };
const bob = { tenant: "B", canRead: true };
assert.equal(readTicket(alice, "T-1").title, "A的工单");
assert.equal(readTicket(bob, "T-1").title, "B的工单");
assert.equal("internalNote" in readTicket(alice, "T-1"), false);
assert.throws(() => readTicket({ ...alice, canRead: false }, "T-1"), /FORBIDDEN/);
console.log("A/B同编号隔离、字段白名单、缓存命中前撤权：已检查。");
