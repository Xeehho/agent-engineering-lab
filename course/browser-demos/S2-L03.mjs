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
