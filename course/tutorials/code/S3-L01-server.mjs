// Server 只注册只读工具；标准输出由 SDK 用于协议通信。
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const server = new McpServer({ name: "ticket-classroom", version: "1.0.0" });
server.registerTool(
  "get_ticket",
  {
    description: "读取课堂固定工单；不提供业务写入",
    inputSchema: { ticketId: z.string().regex(/^T-\d+$/) },
    outputSchema: { id: z.string(), status: z.string() },
  },
  async ({ ticketId }) => {
    if (ticketId !== "T-42") {
      return { isError: true, content: [{ type: "text", text: "NOT_FOUND" }] };
    }
    const data = { id: ticketId, status: "open" };
    return {
      structuredContent: data,
      content: [{ type: "text", text: JSON.stringify(data) }],
    };
  },
);
await server.connect(new StdioServerTransport());
