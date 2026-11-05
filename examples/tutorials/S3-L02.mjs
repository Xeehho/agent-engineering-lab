import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { setTimeout as wait } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const client = new Client({name:"mcp-checks",version:"1.0.0"});
const transport = new StdioClientTransport({
  command:process.execPath,
  args:[fileURLToPath(new URL("./S3-L02-server.mjs",import.meta.url))]
});
const stats = async () => JSON.parse((await client.callTool({name:"stats",arguments:{}})).content[0].text);
try {
  await client.connect(transport);
  assert.equal((await client.listTools()).tools.length,3);
  assert.notEqual((await client.callTool({name:"lookup",arguments:{id:"known"}})).isError,true);
  for (const call of [
    {name:"old_lookup",arguments:{}},
    {name:"lookup",arguments:{id:12}},
    {name:"lookup",arguments:{id:"missing"}}
  ]) assert.equal((await client.callTool(call)).isError,true);
  const controller = new AbortController();
  // 先绑定 rejection 处理，避免取消时产生未处理拒绝。
  const pending = client.callTool({name:"slow",arguments:{}},undefined,{signal:controller.signal})
    .then(() => ({rejected:false}),() => ({rejected:true}));
  const deadline = Date.now()+3000;
  while ((await stats()).active !== 1) {
    assert.ok(Date.now()<deadline,"slow never started");
    await wait(10);
  }
  controller.abort();
  assert.equal((await pending).rejected,true);
  let final;
  do {
    final = await stats();
    if (final.active === 0 && final.cancelled === 1) break;
    assert.ok(Date.now()<deadline,"server did not clean cancelled work");
    await wait(10);
  } while (true);
  assert.deepEqual(final,{active:0,cancelled:1});
  console.log("discovery/success/unknown/invalid/not-found: passed");
  console.log("client cancelled; server active=0, cancelled=1; connection closed");
} finally { await client.close(); }
