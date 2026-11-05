// S2-L02 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：永不结束的提议如何被截止？");
let calls = 0;
const limit = 3;
while (calls < limit) {
  const decision = {tool:"searchDocs"}; // 固定假决策
  calls++;
  console.log("执行", calls, decision.tool);
}
console.log("停止原因: TOOL_BUDGET_EXCEEDED");
}
