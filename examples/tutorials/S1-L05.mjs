import assert from "node:assert/strict";

function softmax(logits, temperature) {
  if (!Number.isFinite(temperature) || temperature <= 0) {
    throw new Error("TEMPERATURE_MUST_BE_POSITIVE");
  }
  if (logits.length === 0 || logits.some((value) => !Number.isFinite(value))) {
    throw new Error("LOGITS_MUST_BE_FINITE");
  }

  // 步骤一：缩放分数。温度低时，分数差异被放大。
  const scaledLogits = logits.map((value) => value / temperature);

  // 步骤二：减去最大值，避免 exp(很大的数) 溢出。
  const largestLogit = Math.max(...scaledLogits);
  const exponentials = scaledLogits.map((value) => Math.exp(value - largestLogit));

  // 步骤三：除以总量，使概率之和接近1。
  const exponentialSum = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / exponentialSum);
}

const normalDistribution = softmax([2, 1, 0], 1);
const sharperDistribution = softmax([2, 1, 0], 0.3);
assert.ok(sharperDistribution[0] > normalDistribution[0]);
const probabilitySum = sharperDistribution.reduce((sum, value) => sum + value, 0);
assert.ok(Math.abs(probabilitySum - 1) < 1e-9);
assert.throws(() => softmax([1, 2], 0), /POSITIVE/);
assert.throws(() => softmax([], 1), /FINITE/);

// 这些数字是题目给定的规划单位，不来自 tokenizer，也不来自账单。
const assumedTokenPlan = {
  system: 1000,
  tools: 1800,
  history: 5000,
  evidence: 2800,
  output: 2000,
};
const plannedTotal = Object.values(assumedTokenPlan).reduce(
  (sum, tokenCount) => sum + tokenCount,
  0,
);
const assumedCapacity = 12000;
const exceededBy = Math.max(0, plannedTotal - assumedCapacity);
assert.equal(plannedTotal, 12600);
assert.equal(exceededBy, 600);

console.log("lower temperature: sharper distribution, not a truth guarantee");
console.log("planned=12600; assumed budget=12000; excess=600");
console.log("synthetic numbers; not a tokenizer or provider invoice");
