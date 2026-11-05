const item = {
  claim: "实现有限Agent循环并拒绝超预算工具调用",
  artifact: "可复现测试与一次失败复盘",
  scope: "本地受控，无真实模型质量结论",
  reviewed: false,
};
const ready = Boolean(item.claim && item.artifact && item.scope);
console.log("陈述材料齐备：", ready, "已评阅：", item.reviewed);
assert.equal(item.reviewed, false);
