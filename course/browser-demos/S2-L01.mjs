// 不安装 Zod 也能学习执行边界：先验证参数，再调用允许的处理器。
let executionCount = 0;
const toolRegistry = {
  getTicket(argumentsValue, authenticatedContext) {
    executionCount += 1;
    if (authenticatedContext.tenant !== "A") {
      throw new Error("FORBIDDEN");
    }
    return { id: argumentsValue.ticketId, status: "open" };
  },
};

function dispatchToolCall(proposal, authenticatedContext) {
  if (!Object.hasOwn(toolRegistry, proposal.name)) {
    throw new Error("UNKNOWN_TOOL");
  }
  const argumentsValue = JSON.parse(proposal.arguments);
  const validObject =
    argumentsValue !== null &&
    typeof argumentsValue === "object" &&
    !Array.isArray(argumentsValue);
  if (
    !validObject ||
    typeof argumentsValue.ticketId !== "string" ||
    !/^T-\d+$/.test(argumentsValue.ticketId) ||
    Object.keys(argumentsValue).some((key) => key !== "ticketId")
  ) {
    throw new Error("INVALID_ARGUMENTS");
  }
  const result = toolRegistry[proposal.name](argumentsValue, authenticatedContext);
  return { callId: proposal.id, data: result };
}

const proposal = { id: "call-1", name: "getTicket", arguments: '{"ticketId":"T-42"}' };
assert.equal(dispatchToolCall(proposal, { tenant: "A" }).data.id, "T-42");
assert.throws(
  () => dispatchToolCall({ ...proposal, name: "deleteAll" }, { tenant: "A" }),
  /UNKNOWN/,
);
assert.throws(
  () =>
    dispatchToolCall({ ...proposal, arguments: '{"ticketId":42}' }, { tenant: "A" }),
  /INVALID/,
);
assert.throws(() => dispatchToolCall(proposal, { tenant: "B" }), /FORBIDDEN/);
assert.equal(executionCount, 2);
console.log("成功、未知工具、非法参数、越权四条路径已检查；执行入口共进入2次。");
