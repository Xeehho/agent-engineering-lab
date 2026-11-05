// S2-L03 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：重复提交为什么可能发出两封邮件");
const completed = new Map();
let sent = 0;
function send(operationId, approved) {
  if (!approved) throw new Error("等待具体确认");
  if (completed.has(operationId)) return completed.get(operationId);
  sent += 1;
  const result = { receipt: "receipt-" + sent };
  completed.set(operationId, result);
  return result;
}
const first = send("operation-42", true);
const retry = send("operation-42", true);
console.log("发送次数：", sent, "同一回执：", first.receipt === retry.receipt);
assert.equal(sent, 1);

}

{
console.log("实验 2：业务意图与重试");
// 浏览器用 Map 观察幂等契约，不提供数据库持久化或并发原子性。
const savedResults = new Map();
let createdDrafts = 0;

function createDraft(authenticatedUser, intentKey, text) {
  if (authenticatedUser.role !== "editor") {
    throw new Error("FORBIDDEN");
  }
  const storageKey = JSON.stringify([authenticatedUser.tenant, intentKey]);
  const previous = savedResults.get(storageKey);
  if (previous) {
    if (previous.text !== text) {
      throw new Error("IDEMPOTENCY_CONFLICT");
    }
    return structuredClone(previous);
  }
  createdDrafts += 1;
  const result = { id: createdDrafts, text };
  savedResults.set(storageKey, result);
  return structuredClone(result);
}

const editor = { tenant: "A", role: "editor" };
const first = createDraft(editor, "intent-42", "收到");
const retry = createDraft(editor, "intent-42", "收到");
assert.deepEqual(first, retry);
assert.equal(createdDrafts, 1);
assert.throws(() => createDraft(editor, "intent-42", "换一份正文"), /CONFLICT/);
assert.throws(
  () => createDraft({ ...editor, role: "viewer" }, "intent-42", "收到"),
  /FORBIDDEN/,
);
createDraft({ tenant: "B", role: "editor" }, "intent-42", "B的内容");
assert.equal(createdDrafts, 2);
console.log("A同键重试不重复；改正文冲突；viewer被拒绝；B独立创建。");
console.log("关闭此实验后 Map 消失，真实持久幂等见进阶 SQLite 实操。");

}
