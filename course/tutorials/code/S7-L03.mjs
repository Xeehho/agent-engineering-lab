// 暂时故障可降级，无权限不得绕过；配置变更与请求快照分离。
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
let activeConfig = Object.freeze({ version: "v2", mode: "primary" });
const previousConfig = Object.freeze({ version: "v1", mode: "retrieval-only" });
const requestCounts = new Map();
// 课堂按主体计数，只允许前两次请求，没有实现分布式限流。
function isRateLimited(fixtureSubject) {
  const requestCount = (requestCounts.get(fixtureSubject) || 0) + 1;
  requestCounts.set(fixtureSubject, requestCount);
  return requestCount > 2;
}
// 固定制造503或403，用来验证不同错误的处理策略。
async function callPrimaryFixture(fixtureScenario) {
  primaryAttempts += 1;
  if (fixtureScenario === "forbidden") {
    throw Object.assign(new Error("FORBIDDEN"), { status: 403 });
  }
  throw Object.assign(new Error("TEMPORARY"), { status: 503 });
}
let primaryAttempts = 0;
const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, "http://127.0.0.1");
  const sendJson = (statusCode, responseBody) => {
    response.writeHead(statusCode, { "content-type": "application/json" });
    response.end(JSON.stringify(responseBody));
  };
  if (requestUrl.pathname === "/health") {
    return sendJson(200, { ready: true, version: activeConfig.version });
  }
  if (requestUrl.pathname !== "/answer") {
    return sendJson(404, { code: "NOT_FOUND" });
  }
  // 仅为夹具身份，真实服务必须替换为认证中间件。
  const fixtureSubject = "fixture-user";
  if (isRateLimited(fixtureSubject)) {
    return sendJson(429, { code: "RATE_LIMITED" });
  }
  // 课堂 kind 代替认证中间件的授权结论；主路径和配置降级都不能跳过它。
  if (requestUrl.searchParams.get("kind") === "forbidden") {
    return sendJson(403, { code: "REQUEST_REJECTED" });
  }
  const requestConfigSnapshot = activeConfig;
  if (requestConfigSnapshot.mode === "retrieval-only") {
    return sendJson(200, {
      source: "retrieval-only",
      degraded: true,
      version: requestConfigSnapshot.version,
    });
  }
  try {
    await callPrimaryFixture(requestUrl.searchParams.get("kind"));
    return sendJson(200, { source: "primary" });
  } catch (error) {
    if (error.status !== 503) {
      return sendJson(error.status || 500, { code: "REQUEST_REJECTED" });
    }
    return sendJson(200, {
      source: "retrieval-only",
      degraded: true,
      version: requestConfigSnapshot.version,
    });
  }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const baseUrl = "http://127.0.0.1:" + server.address().port;
try {
  const firstResponse = await fetch(baseUrl + "/answer");
  assert.deepEqual(await firstResponse.json(), {
    source: "retrieval-only",
    degraded: true,
    version: "v2",
  });
  assert.equal((await fetch(baseUrl + "/answer?kind=forbidden")).status, 403);
  assert.equal((await fetch(baseUrl + "/answer")).status, 429);
  activeConfig = previousConfig;
  assert.deepEqual(await (await fetch(baseUrl + "/health")).json(), {
    ready: true,
    version: "v1",
  });
  // 为新验证轮次清空课堂计数；这不是生产环境的自动额度刷新策略。
  requestCounts.clear();
  const attemptsBeforeRollbackRequest = primaryAttempts;
  const rolledBackAnswer = await (await fetch(baseUrl + "/answer")).json();
  assert.equal(rolledBackAnswer.version, "v1");
  assert.equal(primaryAttempts, attemptsBeforeRollbackRequest);
  assert.equal((await fetch(baseUrl + "/answer?kind=forbidden")).status, 403);
  console.log(
    "localhost HTTP: temporary failure degraded; forbidden stayed 403; third request=429",
  );
  console.log("config pointer rolled back v2 -> v1; no cloud deployment performed");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
