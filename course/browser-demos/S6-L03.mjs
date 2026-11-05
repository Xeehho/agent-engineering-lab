// 直接在网页运行。assert 是课堂提供的检查工具，失败会中断本次实验。

// 所有费用和耗时均为合成单位，完整保留失败任务。
const baselineRuns = [
  { id: "a", ok: true, cost: 2, latency: 100 },
  { id: "b", ok: false, cost: 2, latency: 150 },
  { id: "c", ok: true, cost: 2, latency: 120 },
  { id: "d", ok: true, cost: 2, latency: 130 },
];
const candidateRuns = [
  { id: "a", ok: true, cost: 4, latency: 160 },
  { id: "b", ok: true, cost: 5, latency: 180 },
  { id: "c", ok: false, cost: 4, latency: 170 },
  { id: "d", ok: true, cost: 4, latency: 150 },
];

function quantile(values, probability) {
  if (values.length === 0) {
    return null;
  }
  if (!(probability > 0 && probability <= 1)) {
    throw new Error("INVALID_QUANTILE");
  }
  const sortedValues = [...values].sort((left, right) => left - right);
  const rank = Math.ceil(probability * sortedValues.length);
  return sortedValues[rank - 1];
}

function summary(runs) {
  const successCount = runs.filter((run) => run.ok).length;
  const totalCost = runs.reduce((sum, run) => sum + run.cost, 0);
  return {
    successes: successCount,
    n: runs.length,
    total: totalCost,
    costPerSuccess: successCount === 0 ? null : totalCost / successCount,
    p95: quantile(
      runs.map((run) => run.latency),
      0.95,
    ),
  };
}

function paired(baseline, candidate) {
  const candidateById = new Map(candidate.map((run) => [run.id, run]));
  const uniqueBaselineIds = new Set(baseline.map((run) => run.id));
  if (
    candidateById.size !== candidate.length ||
    uniqueBaselineIds.size !== baseline.length ||
    baseline.length !== candidate.length
  ) {
    throw new Error("UNPAIRED");
  }

  const wins = [];
  const losses = [];
  for (const baselineRun of baseline) {
    const candidateRun = candidateById.get(baselineRun.id);
    if (!candidateRun) {
      throw new Error("UNPAIRED");
    }
    if (!baselineRun.ok && candidateRun.ok) {
      wins.push(baselineRun.id);
    }
    if (baselineRun.ok && !candidateRun.ok) {
      losses.push(baselineRun.id);
    }
  }
  return { wins, losses };
}

assert.deepEqual(paired(baselineRuns, candidateRuns), { wins: ["b"], losses: ["c"] });
const baselineSummary = summary(baselineRuns);
const candidateSummary = summary(candidateRuns);
assert.equal(baselineSummary.successes, candidateSummary.successes);
assert.equal(baselineSummary.total, 8);
assert.equal(candidateSummary.total, 17);
assert.equal(baselineSummary.p95, 150);
assert.equal(candidateSummary.p95, 180);
assert.equal(candidateSummary.costPerSuccess, 17 / 3);
assert.throws(() => paired(baselineRuns, candidateRuns.slice(1)), /UNPAIRED/);
assert.equal(summary([]).costPerSuccess, null);

const parallelWallTime = Math.max(40, 60) + 30;
const totalWorkTime = 40 + 60 + 30;
assert.equal(parallelWallTime, 90);
assert.equal(totalWorkTime, 130);
console.log("both success=3/4; candidate wins=b, regressions=c; cost=8 -> 17");
console.log("nearest-rank p95=150 -> 180; parallel wall=90 vs total work=130");
