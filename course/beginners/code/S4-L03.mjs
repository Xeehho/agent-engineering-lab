const draft = { operationId: "send-42", version: 2, text: "新版草稿" };
const approval = { operationId: "send-42", version: 1, actor: "u-A" };
function canExecute(draft, approval) {
  return (
    draft.operationId === approval.operationId && draft.version === approval.version
  );
}
console.log("旧批准可发送新版：", canExecute(draft, approval));
assert.equal(canExecute(draft, approval), false);
