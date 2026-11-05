// 本例先看懂“一次决定→执行→带着结果再决定”，不连接真实模型。
const history = [];
const maxRounds = 3;

function searchDocs() {
  // 这是应用提供的普通函数。为了观察流程，文档暂时固定返回。
  return "白屏排查：先收集浏览器控制台报错和最近发布的版本。";
}

function chooseNextAction(toolHistory) {
  // 用固定函数代替模型的决策。真实 Agent 再换成模型适配器。
  if (toolHistory.length === 0) {
    return {
      type: "tools",
      calls: [{ id: "call-1", name: "searchDocs" }],
    };
  }
  return {
    type: "final",
    text: "回复草稿：请补充控制台报错和最近发布版本，我会继续定位。",
  };
}

for (let round = 1; round <= maxRounds; round += 1) {
  const decision = chooseNextAction(history);
  console.log("第" + round + "轮决定：", decision.type);

  if (decision.type === "final") {
    console.log(decision.text);
    break;
  }

  const proposedCall = decision.calls[0];
  const result = searchDocs();
  history.push({ callId: proposedCall.id, result });
  console.log("应用执行工具得到：", result);
}

// assert.equal 是网页提供的核对工具，不是 Agent 协议的一部分。
assert.equal(history.length, 1);
assert.equal(history[0].callId, "call-1");
