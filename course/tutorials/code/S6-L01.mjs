// 先验证依赖图，再分波执行；本例不会自动取消 Promise.all 中的其他任务。
import assert from "node:assert/strict";
// 输入节点列表与并发预算，返回所有结果和每波执行记录。
async function workflow(nodes, { maxNodes = 8, maxParallel = 2 } = {}) {
  if (
    !Number.isInteger(maxNodes) ||
    !Number.isInteger(maxParallel) ||
    nodes.length > maxNodes ||
    maxParallel < 1
  ) {
    throw new Error("BUDGET");
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  if (nodeById.size !== nodes.length) {
    throw new Error("DUPLICATE");
  }
  for (const node of nodes) {
    for (const dependencyId of node.deps) {
      if (!nodeById.has(dependencyId)) {
        throw new Error("MISSING_DEP");
      }
    }
  }
  const pendingNodeIds = new Set(nodeById.keys()),
    completedResults = new Map(),
    waves = [];
  // 先只验证图，任何环都在执行副作用之前拒绝。
  const validatedNodeIds = new Set();
  while (validatedNodeIds.size < nodes.length) {
    const readyNodes = nodes.filter(
      (node) =>
        !validatedNodeIds.has(node.id) &&
        node.deps.every((dependencyId) => validatedNodeIds.has(dependencyId)),
    );
    if (!readyNodes.length) {
      throw new Error("CYCLE");
    }
    readyNodes.forEach((node) => validatedNodeIds.add(node.id));
  }
  while (pendingNodeIds.size) {
    const readyNodes = nodes
      .filter(
        (node) =>
          pendingNodeIds.has(node.id) &&
          node.deps.every((dependencyId) => completedResults.has(dependencyId)),
      )
      .slice(0, maxParallel);
    waves.push(readyNodes.map((node) => node.id));
    const completedWave = await Promise.all(
      readyNodes.map(async (node) => {
        const dependencyResults = Object.fromEntries(
          node.deps.map((dependencyId) => [
            dependencyId,
            completedResults.get(dependencyId),
          ]),
        );
        return [node.id, await node.run(dependencyResults)];
      }),
    );
    for (const [nodeId, value] of completedWave) {
      completedResults.set(nodeId, value);
      pendingNodeIds.delete(nodeId);
    }
  }
  return { results: Object.fromEntries(completedResults), waves };
}
const nodes = [
  { id: "ticket", deps: [], run: async () => ({ id: "T-42", issue: "白屏" }) },
  { id: "docs", deps: [], run: async () => ({ version: 2, fix: "升级依赖" }) },
  {
    id: "draft",
    deps: ["ticket", "docs"],
    run: async ({ ticket, docs }) => ticket.issue + "：" + docs.fix,
  },
];
const workflowResult = await workflow(nodes);
assert.deepEqual(workflowResult.waves, [["ticket", "docs"], ["draft"]]);
assert.equal(workflowResult.results.draft, "白屏：升级依赖");
let executedNodeCount = 0;
await assert.rejects(
  workflow([
    { id: "a", deps: ["b"], run: async () => executedNodeCount++ },
    { id: "b", deps: ["a"], run: async () => executedNodeCount++ },
  ]),
  /CYCLE/,
);
assert.equal(executedNodeCount, 0);
await assert.rejects(
  workflow([{ id: "a", deps: ["missing"], run: async () => 1 }]),
  /MISSING/,
);
await assert.rejects(
  workflow([
    {
      id: "a",
      deps: [],
      run: async () => {
        throw new Error("UPSTREAM");
      },
    },
  ]),
  /UPSTREAM/,
);
console.log("waves=ticket+docs -> draft; cycle rejected before execution");
console.log(
  "missing dependency and upstream failure surfaced; no model agents executed",
);
