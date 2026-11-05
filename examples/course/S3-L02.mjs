// S3-L02 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：先连接，再发现，最后分清错误");
let connected = false;
function connect() {
  connected = true;
}
function call(ticketId) {
  if (!connected) throw new Error("连接尚未建立");
  if (ticketId !== "T-42") {
    return { isError: true, content: [{ text: "工单不存在" }] };
  }
  return { isError: false, content: [{ text: "订单页白屏" }] };
}
assert.throws(() => call("T-42"), /连接/);
connect();
console.log(call("missing").isError, call("T-42").content[0].text);

}

{
console.log("实验 2：协议错误与工具失败");
// 对应本课锁定的高层 SDK 错误包装，用纯数据观察三个结果层级。
function simulateCall(message) {
  if (message.method !== "tools/call") {
    return {
      jsonrpc: "2.0",
      id: message.id,
      error: { code: -32601, message: "Method not found" },
    };
  }
  const toolName = message.params.name;
  const argumentsValue = message.params.arguments;
  if (toolName !== "lookup" || typeof argumentsValue?.id !== "string") {
    return {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        isError: true,
        content: [{ type: "text", text: "UNKNOWN_OR_INVALID_TOOL" }],
      },
    };
  }
  const found = argumentsValue.id === "known";
  return {
    jsonrpc: "2.0",
    id: message.id,
    result: {
      isError: !found,
      content: [{ type: "text", text: found ? "FOUND" : "NOT_FOUND" }],
    },
  };
}

const makeCall = (id) => ({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "lookup",
    arguments: { id },
  },
});
assert.equal(simulateCall(makeCall("known")).result.isError, false);
assert.equal(simulateCall(makeCall("missing")).result.isError, true);
assert.equal(simulateCall(makeCall(42)).result.isError, true);
assert.equal(simulateCall({ id: 2, method: "unknown" }).error.code, -32601);
console.log("成功、业务无结果、非法参数、协议未知方法：已分别检查。");
console.log("消息对象可解析不等于业务成功；取消传播需要进阶双端实测。");

}
