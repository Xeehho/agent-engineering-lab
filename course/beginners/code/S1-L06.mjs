function handle(body) {
  if (!body || typeof body.text !== "string" || !body.text.trim()) {
    return { status: 400, json: { error: "需要非空text" } };
  }
  // 固定规则替身，不调用模型。
  return { status: 200, json: { group: "技术支持" } };
}
console.log(handle({ text: "" }).status);
console.log(handle({ text: "订单页白屏" }).json.group);
assert.equal(handle(null).status, 400);
