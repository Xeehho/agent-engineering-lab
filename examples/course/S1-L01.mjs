// S1-L01 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：先分清：收到回答与完成业务");
// 三个候选都假设已经通过网络返回。
const candidates = [
  "不是JSON",
  '{"group":7}',
  '{"group":"火星组"}',
  '{"group":"技术支持"}',
];
function parse(raw) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return "文本不能解析";
  }
  if (!value || typeof value.group !== "string") return "字段类型不对";
  if (!["技术支持", "账务支持"].includes(value.group)) return "业务不允许";
  return "可以分诊";
}
for (const raw of candidates) console.log(parse(raw));
assert.equal(parse(candidates[3]), "可以分诊");

}

{
console.log("实验 2：类型写对了，值就对了吗？");
const reading = JSON.parse('{"value":"8"}');
console.log("实际类型：", typeof reading.value);
try {
  console.log(reading.value.toFixed(1));
} catch (error) {
  console.log(error.name + ": " + error.message);
}

// 这才是实际运行的检查；typeof 断言不会自动改变字符串。
function hasNumericValue(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.value === "number" &&
    Number.isFinite(value.value)
  );
}
assert.equal(hasNumericValue(reading), false);
assert.equal(hasNumericValue({ value: 8 }), true);
assert.equal(hasNumericValue(null), false);
console.log("运行时校验：字符串、数字、null 已分别检查");

}

{
console.log("实验 3：合法 JSON，一定是业务对象吗？");
for (const text of ["null", "[]", '"done"', "42", '{"category":"bug"}']) {
  const value = JSON.parse(text);
  console.log(text, "=>", typeof value, "数组:", Array.isArray(value));
}

}

{
console.log("实验 4：HTTP 503，会直接进入 catch 吗？");
const response = new Response('{"error":"unavailable"}', {
  status: 503,
  headers: { "Content-Type": "application/json" },
});
console.log("status:", response.status);
console.log("ok:", response.ok);
console.log("body:", await response.json());

}

{
console.log("实验 5：固定 Mock，到底证明了什么？");
function mockProvider(input) {
  return {
    category: "bug",
    priority: "medium",
    summary: "订单页白屏",
    missingInformation: [],
  };
}
for (const input of ["订单页白屏", "请增加深色模式"]) {
  console.log("输入：", input);
  console.log("输出：", mockProvider(input));
}

}
