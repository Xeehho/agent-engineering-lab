// S4-L03 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：“同意”必须对应一份确定的草稿");
const draft = { operationId: "send-42", version: 2, text: "新版草稿" };
const approval = { operationId: "send-42", version: 1, actor: "u-A" };
function canExecute(draft, approval) {
  return (
    draft.operationId === approval.operationId && draft.version === approval.version
  );
}
console.log("旧批准可发送新版：", canExecute(draft, approval));
assert.equal(canExecute(draft, approval), false);

}

{
console.log("实验 2：给具体审批动作签名");
// 实际使用浏览器 Web Crypto 签名；单次消费仍只保存在内存。
const signingKey = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
const encoder = new TextEncoder();
const consumedNonces = new Set();
function serializeApproval(action) {
  return JSON.stringify({
    subject: action.subject,
    ticket: action.ticket,
    text: action.text,
    version: action.version,
    expires: action.expires,
    nonce: action.nonce,
  });
}
async function approve(action) {
  const payload = serializeApproval(action);
  const signature = await crypto.subtle.sign(
    "HMAC",
    signingKey,
    encoder.encode(payload),
  );
  return { payload, signature };
}
async function executeApprovedAction(user, currentAction, approval, now) {
  const validSignature = await crypto.subtle.verify(
    "HMAC",
    signingKey,
    approval.signature,
    encoder.encode(approval.payload),
  );
  if (!validSignature) {
    throw new Error("BAD_SIGNATURE");
  }
  const approvedAction = JSON.parse(approval.payload);
  if (approvedAction.subject !== user.subject) {
    throw new Error("WRONG_SUBJECT");
  }
  if (serializeApproval(currentAction) !== approval.payload) {
    throw new Error("CHANGED_ACTION");
  }
  if (now >= approvedAction.expires) {
    throw new Error("EXPIRED");
  }
  if (consumedNonces.has(approvedAction.nonce)) {
    throw new Error("REPLAY");
  }
  consumedNonces.add(approvedAction.nonce);
  return "accepted";
}
const action = {
  subject: "alice",
  ticket: "T-42",
  text: "已修复",
  version: 7,
  expires: 100,
  nonce: "one",
};
const approval = await approve(action);
await assert.rejects(
  () =>
    executeApprovedAction(
      { subject: "alice" },
      { ...action, ticket: "T-99" },
      approval,
      10,
    ),
  /CHANGED/,
);
await assert.rejects(
  () => executeApprovedAction({ subject: "bob" }, action, approval, 10),
  /SUBJECT/,
);
await assert.rejects(
  () => executeApprovedAction({ subject: "alice" }, action, approval, 100),
  /EXPIRED/,
);
assert.equal(
  await executeApprovedAction({ subject: "alice" }, action, approval, 10),
  "accepted",
);
await assert.rejects(
  () => executeApprovedAction({ subject: "alice" }, action, approval, 11),
  /REPLAY/,
);
console.log("改参数、换主体、过期、重放均被拒绝；原动作只接受一次，没有发送真实消息。");

}
