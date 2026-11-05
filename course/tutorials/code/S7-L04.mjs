// 先验证允许的目标与授权，再发请求，最后校验完成状态、文本和计量。
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
// 把外部响应转换成内部结果；课堂只访问回环夹具，不发付费请求。
async function generateTextWithAdapter({
  base: baseUrl,
  model: modelName,
  input: inputText,
  signal: abortSignal,
  allowLive: allowLiveRequest = false,
  key: apiKey,
}) {
  const providerUrl = new URL(baseUrl);
  const isLocalFixture =
    providerUrl.hostname === "127.0.0.1" && providerUrl.protocol === "http:";
  if (
    !isLocalFixture &&
    !(providerUrl.origin === "https://api.openai.com" && allowLiveRequest && apiKey)
  ) {
    throw new Error("LIVE_CALL_NOT_AUTHORIZED");
  }
  const requestHeaders = { "content-type": "application/json" };
  abortSignal?.throwIfAborted();
  if (!isLocalFixture) {
    requestHeaders.authorization = "Bearer " + apiKey;
  }
  const providerResponse = await fetch(new URL("/v1/responses", providerUrl), {
    method: "POST",
    headers: requestHeaders,
    signal: abortSignal,
    body: JSON.stringify({
      model: modelName,
      input: inputText,
      max_output_tokens: 200,
    }),
  });
  if (!providerResponse.ok) {
    await providerResponse.body?.cancel();
    throw Object.assign(new Error("UPSTREAM_HTTP_" + providerResponse.status), {
      status: providerResponse.status,
      retryAfter: providerResponse.headers.get("retry-after"),
    });
  }
  const responsePayload = await providerResponse.json();
  if (
    !responsePayload ||
    responsePayload.status !== "completed" ||
    !Array.isArray(responsePayload.output)
  ) {
    throw new Error("INVALID_OR_INCOMPLETE_RESPONSE");
  }
  const outputText = responsePayload.output
    .filter((outputItem) => outputItem?.type === "message")
    .flatMap((outputItem) =>
      Array.isArray(outputItem.content) ? outputItem.content : [],
    )
    .filter(
      (outputItem) =>
        outputItem?.type === "output_text" && typeof outputItem.text === "string",
    )
    .map((outputItem) => outputItem.text)
    .join("");
  if (!outputText.trim()) {
    throw new Error("NO_TEXT_OUTPUT");
  }
  const reportedUsage = responsePayload.usage;
  if (
    reportedUsage != null &&
    (!Number.isInteger(reportedUsage.input_tokens) ||
      reportedUsage.input_tokens < 0 ||
      !Number.isInteger(reportedUsage.output_tokens) ||
      reportedUsage.output_tokens < 0)
  ) {
    throw new Error("INVALID_USAGE");
  }
  return {
    text: outputText,
    usage:
      reportedUsage == null
        ? null
        : {
            input: reportedUsage.input_tokens,
            output: reportedUsage.output_tokens,
          },
    providerRequestId: providerResponse.headers.get("x-request-id"),
    scope: isLocalFixture ? "fixture" : "live",
  };
}
const server = createServer(async (fixtureRequest, fixtureResponse) => {
  let rawRequestBody = "";
  for await (const chunk of fixtureRequest) {
    rawRequestBody += chunk;
  }
  const responsePayload = JSON.parse(rawRequestBody);
  assert.equal(fixtureRequest.url, "/v1/responses");
  assert.equal(responsePayload.max_output_tokens, 200);
  fixtureResponse.setHeader("content-type", "application/json");
  if (responsePayload.input === "rate") {
    fixtureResponse.writeHead(429, { "retry-after": "2" });
    return fixtureResponse.end('{"error":{"code":"rate_limit"}}');
  }
  if (responsePayload.input === "broken") {
    return fixtureResponse.end('{"status":"completed","output":[]}');
  }
  if (responsePayload.input === "no-usage") {
    return fixtureResponse.end(
      JSON.stringify({
        status: "completed",
        output: [
          { type: "message", content: [{ type: "output_text", text: "计量未知" }] },
        ],
      }),
    );
  }
  if (responsePayload.input === "null") {
    return fixtureResponse.end("null");
  }
  fixtureResponse.setHeader("x-request-id", "fixture-request");
  fixtureResponse.end(
    JSON.stringify({
      status: "completed",
      output: [
        { type: "message", content: [{ type: "output_text", text: "本地夹具回答" }] },
      ],
      usage: { input_tokens: 12, output_tokens: 5 },
    }),
  );
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const baseUrl = "http://127.0.0.1:" + server.address().port;
try {
  const adapterResult = await generateTextWithAdapter({
    base: baseUrl,
    model: "fixture-model",
    input: "hello",
  });
  assert.deepEqual(adapterResult, {
    text: "本地夹具回答",
    usage: { input: 12, output: 5 },
    providerRequestId: "fixture-request",
    scope: "fixture",
  });
  await assert.rejects(
    generateTextWithAdapter({ base: baseUrl, model: "fixture", input: "rate" }),
    (e) => e.status === 429 && e.retryAfter === "2",
  );
  await assert.rejects(
    generateTextWithAdapter({ base: baseUrl, model: "fixture", input: "broken" }),
    /NO_TEXT/,
  );
  const missingUsage = await generateTextWithAdapter({
    base: baseUrl,
    model: "fixture",
    input: "no-usage",
  });
  assert.equal(missingUsage.usage, null);
  await assert.rejects(
    generateTextWithAdapter({ base: baseUrl, model: "fixture", input: "null" }),
    /INVALID_OR_INCOMPLETE/,
  );
  const cancelController = new AbortController();
  cancelController.abort();
  await assert.rejects(
    generateTextWithAdapter({
      base: baseUrl,
      model: "fixture",
      input: "hello",
      signal: cancelController.signal,
    }),
  );
  await assert.rejects(
    generateTextWithAdapter({
      base: "https://api.openai.com",
      model: "unset",
      input: "hello",
    }),
    /NOT_AUTHORIZED/,
  );
  console.log("local Responses-shaped HTTP: text/usage/request-id normalized");
  console.log(
    "429 + empty output + pre-cancel + unauthorized live call rejected; live calls=0",
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
}
