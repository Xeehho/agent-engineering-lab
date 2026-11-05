const requirements = ["租户隔离", "可取消", "草稿不自动发送"];
const evidence = [
  { requirementId: "租户隔离", scope: "本地受控" },
  { requirementId: "草稿不自动发送", scope: "本地受控" },
];
const missing = requirements.filter(
  (id) => !evidence.some((item) => item.requirementId === id),
);
console.log("缺少证据：", missing.join("、"));
assert.deepEqual(missing, ["可取消"]);
