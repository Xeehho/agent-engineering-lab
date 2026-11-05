// S7-L04 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：把服务商响应转换成应用自己的结果");
function normalize(response) {
  if (response.stop === "truncated") throw new Error("内容不完整");
  if (response.stop !== "complete") throw new Error("未知结束原因");
  if (typeof response.outputText !== "string") throw new Error("缺少文本");
  return { type: "final", text: response.outputText };
}
const fakeProvider = { stop: "complete", outputText: "回复草稿" };
console.log(normalize(fakeProvider).text);
assert.throws(() => normalize({ stop: "truncated", outputText: "半句" }), /不完整/);

}

{
console.log("实验 2：从响应结构得到内部结果");
// 只解析响应夹具，不发网络请求。unknown usage 保持 null。
function normalizeTextResponse(body) {
  if (!body || body.status !== "completed" || !Array.isArray(body.output)) {
    throw new Error("INCOMPLETE_OR_INVALID");
  }
  const texts = [];
  for (const item of body.output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }
    for (const content of item.content) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        texts.push(content.text);
      }
    }
  }
  const text = texts.join("");
  if (!text.trim()) {
    throw new Error("NO_TEXT");
  }
  const usage = body.usage;
  if (
    usage != null &&
    (!Number.isInteger(usage.input_tokens) ||
      usage.input_tokens < 0 ||
      !Number.isInteger(usage.output_tokens) ||
      usage.output_tokens < 0)
  ) {
    throw new Error("INVALID_USAGE");
  }
  return {
    text,
    usage:
      usage == null
        ? null
        : {
            input: usage.input_tokens,
            output: usage.output_tokens,
          },
  };
}
const response = {
  status: "completed",
  output: [{ type: "message", content: [{ type: "output_text", text: "夹具回答" }] }],
  usage: { input_tokens: 12, output_tokens: 5 },
};
assert.equal(normalizeTextResponse(response).text, "夹具回答");
assert.equal(normalizeTextResponse({ ...response, usage: undefined }).usage, null);
assert.throws(() => normalizeTextResponse(null), /INVALID/);
assert.throws(
  () => normalizeTextResponse({ ...response, status: "incomplete" }),
  /INCOMPLETE/,
);
assert.throws(() => normalizeTextResponse({ ...response, output: [] }), /NO_TEXT/);
assert.throws(
  () => normalizeTextResponse({ ...response, usage: { input_tokens: -1 } }),
  /USAGE/,
);
console.log(normalizeTextResponse(response));
console.log("结构、完成、文本与计量分开检查；没有真实模型调用。");

}
