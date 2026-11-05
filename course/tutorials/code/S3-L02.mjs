// 先确认工作已启动，再取消，并观察服务端活动计数归零。
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { setTimeout as wait } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const client = new Client({ name: "mcp-checks", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [fileURLToPath(new URL("./S3-L02-server.mjs", import.meta.url))],
});
const readServerStatistics = async () =>
  JSON.parse((await client.callTool({ name: "stats", arguments: {} })).content[0].text);
try {
  await client.connect(transport);
  assert.equal((await client.listTools()).tools.length, 3);
  assert.notEqual(
    (await client.callTool({ name: "lookup", arguments: { id: "known" } })).isError,
    true,
  );
  for (const toolCall of [
    { name: "old_lookup", arguments: {} },
    { name: "lookup", arguments: { id: 12 } },
    { name: "lookup", arguments: { id: "missing" } },
  ]) {
    assert.equal((await client.callTool(toolCall)).isError, true);
  }
  const cancellationController = new AbortController();
  // 先绑定 rejection 处理，避免取消时产生未处理拒绝。
  const pendingCall = client
    .callTool({ name: "slow", arguments: {} }, undefined, {
      signal: cancellationController.signal,
    })
    .then(
      () => ({ rejected: false }),
      () => ({ rejected: true }),
    );
  const cleanupDeadline = Date.now() + 3000;
  while ((await readServerStatistics()).active !== 1) {
    assert.ok(Date.now() < cleanupDeadline, "slow never started");
    await wait(10);
  }
  cancellationController.abort();
  assert.equal((await pendingCall).rejected, true);
  let finalStatistics;
  do {
    finalStatistics = await readServerStatistics();
    if (finalStatistics.active === 0 && finalStatistics.cancelled === 1) {
      break;
    }
    assert.ok(Date.now() < cleanupDeadline, "server did not clean cancelled work");
    await wait(10);
  } while (true);
  assert.deepEqual(finalStatistics, { active: 0, cancelled: 1 });
  console.log("discovery/success/unknown/invalid/not-found: passed");
  console.log("client cancelled; server active=0, cancelled=1; connection closed");
} finally {
  await client.close();
}
