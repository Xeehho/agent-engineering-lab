import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
const transport = new StdioClientTransport({
  command:process.execPath,
  args:[fileURLToPath(new URL("./S3-L01-server.mjs",import.meta.url))],
  stderr:"inherit"
});
let requested;
const send = transport.send.bind(transport);
transport.send = async message => {
  if (message.method === "initialize") requested = message.params.protocolVersion;
  return send(message);
};
const client = new Client({name:"classroom-host",version:"1.0.0"});
try {
  await client.connect(transport);
  assert.equal(LATEST_PROTOCOL_VERSION,"2025-11-25");
  assert.equal(requested,LATEST_PROTOCOL_VERSION);
  assert.equal(client.getServerVersion().name,"ticket-classroom");
  const discovery = await client.listTools();
  assert.deepEqual(discovery.tools.map(t => t.name),["get_ticket"]);
  assert.ok(discovery.tools[0].inputSchema.properties.ticketId);
  const result = await client.callTool({name:"get_ticket",arguments:{ticketId:"T-42"}});
  assert.notEqual(result.isError,true);
  assert.deepEqual(result.structuredContent,{id:"T-42",status:"open"});
  console.log("stdio initialize + tools/list + tools/call: passed");
  console.log("SDK default proposal=2025-11-25; server=ticket-classroom; T-42=open");
} finally {
  await client.close();
}
