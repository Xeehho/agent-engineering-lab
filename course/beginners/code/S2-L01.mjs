const registry = {
  readTicket: ({ ticketId }) => ({ ticketId, title: "订单页白屏" }),
};
function dispatch(proposal) {
  if (!Object.hasOwn(registry, proposal.name)) throw new Error("未知工具");
  if (typeof proposal.args?.ticketId !== "string") throw new Error("参数不合法");
  return registry[proposal.name](proposal.args);
}
const proposal = { name: "readTicket", args: { ticketId: "T-42" } };
const result = dispatch(proposal);
console.log(result.title);
assert.throws(() => dispatch({ name: "deleteAll", args: {} }), /未知工具/);
