const identity = { user: "u-A", tenant: "A" };
const ticket = { id: "T-B", tenant: "B", title: "B公司问题" };
const args = { ticketId: "T-B", tenant: "B" };
function authorize(identity, ticket) {
  return identity.tenant === ticket.tenant;
}
const allowed = authorize(identity, ticket);
console.log("参数声称：", args.tenant, "实际允许：", allowed);
assert.equal(allowed, false);
