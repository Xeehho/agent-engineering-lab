// 工具必须把请求信号接到真实等待；客户端取消不自动清理服务端工作。
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setTimeout as wait } from "node:timers/promises";
import { z } from "zod";
const server = new McpServer({ name: "mcp-errors", version: "1.0.0" });
let activeTasks = 0,
  cancelledTasks = 0;
const createTextResult = (value) => ({
  content: [{ type: "text", text: JSON.stringify(value) }],
});
server.registerTool("lookup", { inputSchema: { id: z.string() } }, async ({ id }) => {
  return id === "known"
    ? createTextResult({ found: true })
    : { isError: true, content: [{ type: "text", text: "NOT_FOUND" }] };
});
server.registerTool(
  "slow",
  { inputSchema: {} },
  async (unusedArguments, requestContext) => {
    activeTasks++;
    try {
      await wait(10000, undefined, { signal: requestContext.signal });
      return createTextResult({ done: true });
    } catch (error) {
      if (requestContext.signal.aborted) {
        cancelledTasks++;
      }
      throw error;
    } finally {
      activeTasks--;
    }
  },
);
server.registerTool("stats", { inputSchema: {} }, async () =>
  createTextResult({ active: activeTasks, cancelled: cancelledTasks }),
);
await server.connect(new StdioServerTransport());
