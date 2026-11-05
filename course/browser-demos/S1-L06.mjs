// Python 路由的“契约推演”：本代码运行 JavaScript，不解释或执行 Python。
function validateReadingInput(input) {
  const validObject = input !== null && typeof input === "object";
  if (!validObject || !Number.isInteger(input.value) || input.value < 0) {
    return { status: 422, code: "INVALID_INPUT" };
  }
  const delayMs = input.delay_ms ?? 0;
  if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 1000) {
    return { status: 422, code: "INVALID_INPUT" };
  }
  if (delayMs >= 20) {
    return { status: 504, code: "ASSUMED_DEADLINE" };
  }
  return { status: 200, value: input.value * 2 };
}

const cases = [
  { input: { value: 8 }, expected: 200 },
  { input: { value: "8" }, expected: 422 },
  { input: { value: -1 }, expected: 422 },
  { input: { value: 8, delay_ms: 200 }, expected: 504 },
];
for (const testCase of cases) {
  const result = validateReadingInput(testCase.input);
  assert.equal(result.status, testCase.expected);
  console.log("输入", testCase.input, "→", result);
}
assert.equal(validateReadingInput({ value: 8 }).value, 16);
console.log("这里按给定时长推演期限，不证明 Python 事件循环或 ASGI 路由已运行。");
