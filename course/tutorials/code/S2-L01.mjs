import assert from "node:assert/strict";
import { z } from "zod";

// 模型只提供 ticketId；租户身份由应用上下文提供，不能放进可自由修改的参数。
const ticketArgumentsSchema = z
  .object({
    ticketId: z.string().regex(/^T-\d+$/),
  })
  .strict();
const ticketResultSchema = z
  .object({
    id: z.string(),
    status: z.enum(["open", "closed"]),
  })
  .strict();

const fixtureTickets = [{ id: "T-42", tenant: "A", status: "open" }];
let executionAttempts = 0;
const toolRegistry = new Map([
  [
    "getTicket",
    {
      argumentsSchema: ticketArgumentsSchema,
      resultSchema: ticketResultSchema,
      execute(argumentsValue, authenticatedContext) {
        executionAttempts += 1;
        const ticket = fixtureTickets.find(
          (candidate) =>
            candidate.id === argumentsValue.ticketId &&
            candidate.tenant === authenticatedContext.tenant,
        );
        if (!ticket) {
          throw new Error("NOT_FOUND_OR_FORBIDDEN");
        }
        return { id: ticket.id, status: ticket.status };
      },
    },
  ],
]);

const publicErrorCodes = new Set([
  "UNKNOWN_TOOL",
  "INVALID_JSON",
  "INVALID_ARGUMENTS",
  "INVALID_TOOL_RESULT",
  "NOT_FOUND_OR_FORBIDDEN",
]);

async function dispatchToolCall(call, authenticatedContext) {
  try {
    // 第一道边界：只允许调用注册过的工具。
    const registeredTool = toolRegistry.get(call.name);
    if (!registeredTool) {
      throw new Error("UNKNOWN_TOOL");
    }

    // 第二道边界：参数文本先解析，再做实际字段校验。
    let parsedArguments;
    try {
      parsedArguments = JSON.parse(call.arguments);
    } catch {
      throw new Error("INVALID_JSON");
    }
    const validatedArguments =
      registeredTool.argumentsSchema.safeParse(parsedArguments);
    if (!validatedArguments.success) {
      throw new Error("INVALID_ARGUMENTS");
    }

    // 第三道边界：真正执行时仍受可信上下文和资源权限约束。
    const rawResult = await registeredTool.execute(
      validatedArguments.data,
      authenticatedContext,
    );
    const validatedResult = registeredTool.resultSchema.safeParse(rawResult);
    if (!validatedResult.success) {
      throw new Error("INVALID_TOOL_RESULT");
    }

    return { callId: call.id, ok: true, data: validatedResult.data };
  } catch (error) {
    // 未知内部错误不直接暴露堆栈、SQL 或连接信息。
    const code = publicErrorCodes.has(error.message)
      ? error.message
      : "TOOL_EXECUTION_FAILED";
    return { callId: call.id, ok: false, code };
  }
}

const validProposal = {
  id: "c1",
  name: "getTicket",
  arguments: '{"ticketId":"T-42"}',
};
const validResult = await dispatchToolCall(validProposal, { tenant: "A" });
assert.equal(validResult.data.id, "T-42");

const unknownToolResult = await dispatchToolCall(
  { ...validProposal, id: "c2", name: "dropAll" },
  { tenant: "A" },
);
assert.equal(unknownToolResult.code, "UNKNOWN_TOOL");

const invalidArgumentResult = await dispatchToolCall(
  { ...validProposal, id: "c3", arguments: '{"ticketId":42}' },
  { tenant: "A" },
);
assert.equal(invalidArgumentResult.code, "INVALID_ARGUMENTS");

const deniedResult = await dispatchToolCall(
  { ...validProposal, id: "c4" },
  { tenant: "B" },
);
assert.equal(deniedResult.code, "NOT_FOUND_OR_FORBIDDEN");
assert.equal(deniedResult.callId, "c4");
// 成功查询与带授权范围的拒绝查询进入 execute，其他两条在之前被拦截。
assert.equal(executionAttempts, 2);
console.log("valid / unknown / invalid args / wrong tenant: passed");
console.log("invalid proposals never reached execute; result kept callId");
