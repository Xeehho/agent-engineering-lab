// 直接在网页运行。assert 是课堂提供的检查工具，失败会中断本次实验。

// 被测逻辑：从外部 JSON 文本读取非负整数，不负责工单业务。
function parseNonNegativeCount(jsonText) {
  const parsedValue = JSON.parse(jsonText);
  const isObject =
    parsedValue !== null &&
    typeof parsedValue === "object" &&
    !Array.isArray(parsedValue);

  if (!isObject) {
    throw new Error("NOT_OBJECT");
  }
  if (!Number.isInteger(parsedValue.count) || parsedValue.count < 0) {
    throw new Error("INVALID_COUNT");
  }
  return parsedValue.count;
}

// 预期先按契约写好；actual 必须来自实际执行，不能复制 expected。
const testCases = [
  { id: "normal", input: '{"count":2}', expected: 2 },
  { id: "string", input: '{"count":"2"}', expected: "INVALID_COUNT" },
  { id: "null", input: "null", expected: "NOT_OBJECT" },
  { id: "negative", input: '{"count":-1}', expected: "INVALID_COUNT" },
];

function runContractCase(testCase) {
  let actualResult;
  try {
    actualResult = parseNonNegativeCount(testCase.input);
  } catch (error) {
    actualResult = error.message;
  }

  return {
    ...testCase,
    actual: actualResult,
    passed: Object.is(actualResult, testCase.expected),
    environment: "Node/local",
    provider: "none",
  };
}

const evidenceRows = testCases.map(runContractCase);
assert.equal(evidenceRows.filter((row) => row.passed).length, testCases.length);

for (const row of evidenceRows) {
  console.log(row.id + ": " + row.passed + " (" + row.actual + ")");
}
console.log("scope: four local contract cases; no model accuracy claim");
