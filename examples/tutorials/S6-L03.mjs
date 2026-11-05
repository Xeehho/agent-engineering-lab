import assert from "node:assert/strict";
const baseline = [
  {id:"a",ok:true,cost:2,latency:100},
  {id:"b",ok:false,cost:2,latency:150},
  {id:"c",ok:true,cost:2,latency:120},
  {id:"d",ok:true,cost:2,latency:130}
];
const candidate = [
  {id:"a",ok:true,cost:4,latency:160},
  {id:"b",ok:true,cost:5,latency:180},
  {id:"c",ok:false,cost:4,latency:170},
  {id:"d",ok:true,cost:4,latency:150}
];
function quantile(values,p) {
  const sorted = [...values].sort((a,b) => a-b);
  return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];
}
function summary(rows) {
  const successes = rows.filter(r => r.ok).length;
  const total = rows.reduce((s,r) => s+r.cost,0);
  return {successes,n:rows.length,total,
    costPerSuccess:successes ? total/successes : null,
    p95:quantile(rows.map(r => r.latency),0.95)};
}
function paired(a,b) {
  const lookup = new Map(b.map(r => [r.id,r]));
  if (lookup.size!==b.length || a.length!==b.length || new Set(a.map(r=>r.id)).size!==a.length)
    throw new Error("UNPAIRED");
  const wins=[],losses=[];
  for (const row of a) {
    const other = lookup.get(row.id);
    if (!other) throw new Error("UNPAIRED");
    if (!row.ok && other.ok) wins.push(row.id);
    if (row.ok && !other.ok) losses.push(row.id);
  }
  return {wins,losses};
}
assert.deepEqual(paired(baseline,candidate),{wins:["b"],losses:["c"]});
const a = summary(baseline), b = summary(candidate);
assert.equal(a.successes,b.successes);
assert.equal(a.total,8); assert.equal(b.total,17);
assert.equal(a.p95,150); assert.equal(b.p95,180);
assert.equal(b.costPerSuccess,17/3);
assert.throws(() => paired(baseline,candidate.slice(1)),/UNPAIRED/);
const parallelWall = Math.max(40,60)+30;
const totalWork = 40+60+30;
assert.equal(parallelWall,90); assert.equal(totalWork,130);
console.log("both success=3/4; candidate wins=b, regressions=c; cost=8 -> 17");
console.log("nearest-rank p95=150 -> 180; parallel wall=90 vs total work=130");
