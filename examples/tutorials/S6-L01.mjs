import assert from "node:assert/strict";
async function workflow(nodes,{maxNodes=8,maxParallel=2}={}) {
  if (nodes.length>maxNodes || maxParallel<1) throw new Error("BUDGET");
  const byId = new Map(nodes.map(n => [n.id,n]));
  if (byId.size !== nodes.length) throw new Error("DUPLICATE");
  for (const node of nodes)
    for (const dep of node.deps) if (!byId.has(dep)) throw new Error("MISSING_DEP");
  const pending = new Set(byId.keys()), results = new Map(), waves = [];
  // 先只验证图，任何环都在执行副作用之前拒绝。
  const visited = new Set();
  while (visited.size<nodes.length) {
    const ready = nodes.filter(n => !visited.has(n.id) && n.deps.every(d => visited.has(d)));
    if (!ready.length) throw new Error("CYCLE");
    ready.forEach(n => visited.add(n.id));
  }
  while (pending.size) {
    const ready = nodes.filter(n => pending.has(n.id) && n.deps.every(d => results.has(d)))
      .slice(0,maxParallel);
    waves.push(ready.map(n => n.id));
    const values = await Promise.all(ready.map(async node => {
      const input = Object.fromEntries(node.deps.map(d => [d,results.get(d)]));
      return [node.id,await node.run(input)];
    }));
    for (const [id,value] of values) { results.set(id,value); pending.delete(id); }
  }
  return {results:Object.fromEntries(results),waves};
}
const nodes = [
  {id:"ticket",deps:[],run:async () => ({id:"T-42",issue:"白屏"})},
  {id:"docs",deps:[],run:async () => ({version:2,fix:"升级依赖"})},
  {id:"draft",deps:["ticket","docs"],run:async ({ticket,docs}) => ticket.issue+"："+docs.fix}
];
const run = await workflow(nodes);
assert.deepEqual(run.waves,[["ticket","docs"],["draft"]]);
assert.equal(run.results.draft,"白屏：升级依赖");
let executed = 0;
await assert.rejects(workflow([
  {id:"a",deps:["b"],run:async () => executed++},
  {id:"b",deps:["a"],run:async () => executed++}
]),/CYCLE/);
assert.equal(executed,0);
await assert.rejects(workflow([{id:"a",deps:["missing"],run:async () => 1}]),/MISSING/);
await assert.rejects(workflow([{id:"a",deps:[],run:async () => {throw new Error("UPSTREAM");}}]),/UPSTREAM/);
console.log("waves=ticket+docs -> draft; cycle rejected before execution");
console.log("missing dependency and upstream failure surfaced; no model agents executed");
