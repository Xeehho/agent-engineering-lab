// S3-L01 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：MCP 是应用之间约定好的说话方式");
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

}

{
console.log("实验 2：先初始化，再发现能力");
// 协议消息推演，不启动 MCP Server，也不冒充真实 SDK 互通。
let initialized = false;
function simulateServer(message) {
  if (message.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        protocolVersion: "2025-11-25",
        capabilities: { tools: {} },
        serverInfo: { name: "browser-fixture", version: "1.0.0" },
      },
    };
  }
  if (message.method === "notifications/initialized") {
    initialized = true;
    return undefined;
  }
  if (!initialized) {
    throw new Error("NOT_INITIALIZED");
  }
  if (message.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        tools: [{ name: "get_ticket", inputSchema: { type: "object" } }],
      },
    };
  }
  throw new Error("UNSUPPORTED_METHOD");
}

assert.throws(() => simulateServer({ id: 0, method: "tools/list" }), /INITIALIZED/);
const response = simulateServer({ jsonrpc: "2.0", id: 1, method: "initialize" });
assert.equal(response.id, 1);
assert.equal(response.result.protocolVersion, "2025-11-25");
simulateServer({ jsonrpc: "2.0", method: "notifications/initialized" });
const discovery = simulateServer({ jsonrpc: "2.0", id: 2, method: "tools/list" });
assert.equal(discovery.result.tools[0].name, "get_ticket");
console.log("初始化响应", response);
console.log("发现响应", discovery);
console.log("这里只推演消息顺序；真实进程和传输互通留在可选实操。");

}
