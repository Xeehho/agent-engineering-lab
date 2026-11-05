// 先创建能启动子进程的传输，再让 Client 完成初始化、发现与调用。
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [fileURLToPath(new URL("./S3-L01-server.mjs", import.meta.url))],
  stderr: "inherit",
});
let requestedProtocolVersion;
const sendProtocolMessage = transport.send.bind(transport);
transport.send = async (message) => {
  if (message.method === "initialize") {
    requestedProtocolVersion = message.params.protocolVersion;
  }
  return sendProtocolMessage(message);
};
const client = new Client({ name: "classroom-host", version: "1.0.0" });
try {
  await client.connect(transport);
  assert.equal(LATEST_PROTOCOL_VERSION, "2025-11-25");
  assert.equal(requestedProtocolVersion, LATEST_PROTOCOL_VERSION);
  assert.equal(client.getServerVersion().name, "ticket-classroom");
  const discovery = await client.listTools();
  assert.deepEqual(
    discovery.tools.map((tool) => tool.name),
    ["get_ticket"],
  );
  assert.ok(discovery.tools[0].inputSchema.properties.ticketId);
  const result = await client.callTool({
    name: "get_ticket",
    arguments: { ticketId: "T-42" },
  });
  assert.notEqual(result.isError, true);
  assert.deepEqual(result.structuredContent, { id: "T-42", status: "open" });
  console.log("stdio initialize + tools/list + tools/call: passed");
  console.log("SDK default proposal=2025-11-25; server=ticket-classroom; T-42=open");
} finally {
  await client.close();
}
