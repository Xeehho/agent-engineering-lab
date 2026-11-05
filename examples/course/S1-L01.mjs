// S1-L01 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：类型写对了，值就对了吗？");
const reading = JSON.parse('{"value":"8"}');
console.log("实际类型：", typeof reading.value);
try {
  console.log(reading.value.toFixed(1));
} catch (error) {
  console.log(error.name + ": " + error.message);
}
}

{
console.log("实验 2：合法 JSON，一定是业务对象吗？");
for (const text of ['null', '[]', '"done"', '42', '{"category":"bug"}']) {
  const value = JSON.parse(text);
  console.log(text, "=>", typeof value, "数组:", Array.isArray(value));
}
}

{
console.log("实验 3：HTTP 503，会直接进入 catch 吗？");
const response = new Response('{"error":"unavailable"}', {
  status: 503,
  headers: { "Content-Type": "application/json" }
});
console.log("status:", response.status);
console.log("ok:", response.ok);
console.log("body:", await response.json());
}

{
console.log("实验 4：固定 Mock，到底证明了什么？");
function mockProvider(input) {
  return { category: "bug", priority: "medium",
    summary: "订单页白屏", missingInformation: [] };
}
for (const input of ["订单页白屏", "请增加深色模式"]) {
  console.log("输入：", input);
  console.log("输出：", mockProvider(input));
}
}
