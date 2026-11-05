import assert from "node:assert/strict";

// 简化评分只检查分类、摘要与隔离结果，不代替第一阶段的完整输出契约。
const evaluationCases = [
  {
    id: "normal",
    expectedCategory: "bug",
    output: { category: "bug", summary: "订单白屏" },
    leakedTenantData: false,
    critical: false,
  },
  {
    id: "feature",
    expectedCategory: "feature",
    output: { category: "feature", summary: "增加导出" },
    leakedTenantData: false,
    critical: false,
  },
  {
    id: "missing",
    expectedCategory: "question",
    output: { category: "question", summary: "补充版本" },
    leakedTenantData: false,
    critical: false,
  },
  {
    id: "isolation",
    expectedCategory: "bug",
    output: { category: "bug", summary: "B的私有内容" },
    leakedTenantData: true,
    critical: true,
  },
];

function grade(testCase) {
  const output = testCase.output;
  const validStructure =
    output !== null &&
    typeof output === "object" &&
    typeof output.summary === "string" &&
    output.summary.trim().length > 0 &&
    ["bug", "feature", "question"].includes(output.category);
  const correctCategory = output?.category === testCase.expectedCategory;
  const respectsIsolation = !testCase.leakedTenantData;
  return {
    id: testCase.id,
    pass: validStructure && correctCategory && respectsIsolation,
    critical: testCase.critical,
  };
}
const gradingResults = evaluationCases.map(grade);
const passRate =
  gradingResults.filter((result) => result.pass).length / gradingResults.length;
const hasCriticalFailure = gradingResults.some(
  (result) => result.critical && !result.pass,
);
const mayRelease = passRate >= 0.75 && !hasCriticalFailure;
assert.equal(passRate, 0.75);
assert.equal(mayRelease, false);

// 下面标签是人工给定的校准夹具，不是真实模型裁判的输出。
const humanVerdicts = [true, true, false, false];
const judgeVerdicts = [true, true, true, false];
const confusion = { tp: 0, fp: 0, tn: 0, fn: 0 };
for (let index = 0; index < humanVerdicts.length; index += 1) {
  const truth = humanVerdicts[index];
  const prediction = judgeVerdicts[index];
  if (truth && prediction) {
    confusion.tp += 1;
  }
  if (!truth && prediction) {
    confusion.fp += 1;
  }
  if (!truth && !prediction) {
    confusion.tn += 1;
  }
  if (truth && !prediction) {
    confusion.fn += 1;
  }
}
assert.deepEqual(confusion, { tp: 2, fp: 1, tn: 1, fn: 0 });
const precision = confusion.tp / (confusion.tp + confusion.fp);
assert.equal(precision, 2 / 3);
console.log("overall=3/4 but release blocked by isolation");
console.log("judge calibration: TP=2 FP=1 TN=1 FN=0; precision=2/3");
