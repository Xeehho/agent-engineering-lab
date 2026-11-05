function normalize(response) {
  if (response.stop === "truncated") throw new Error("内容不完整");
  if (response.stop !== "complete") throw new Error("未知结束原因");
  if (typeof response.outputText !== "string") throw new Error("缺少文本");
  return { type: "final", text: response.outputText };
}
const fakeProvider = { stop: "complete", outputText: "回复草稿" };
console.log(normalize(fakeProvider).text);
assert.throws(() => normalize({ stop: "truncated", outputText: "半句" }), /不完整/);
