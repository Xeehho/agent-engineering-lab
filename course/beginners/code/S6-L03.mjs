const runs = [
  { ok: true, cost: 2 },
  { ok: false, cost: 5 },
  { ok: true, cost: 2 },
];
const successes = runs.filter((run) => run.ok).length;
const totalCost = runs.reduce((sum, run) => sum + run.cost, 0);
console.log("成功：", successes + "/" + runs.length);
console.log("总成本：", totalCost, "每次成功成本：", totalCost / successes);
assert.equal(totalCost, 9);
