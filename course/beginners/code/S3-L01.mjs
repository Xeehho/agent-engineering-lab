const server = {
  tools: [{ name: "readTicket", description: "只读工单" }],
  call(name) {
    if (name !== "readTicket") throw new Error("未知工具");
    return { title: "订单页白屏" };
  },
};
const client = {
  listTools: () => server.tools,
  callTool: (name) => server.call(name),
};
console.log("Host发现：", client.listTools()[0].name);
console.log("Host得到：", client.callTool("readTicket").title);
assert.equal(client.listTools().length, 1);
