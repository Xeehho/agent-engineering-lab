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
