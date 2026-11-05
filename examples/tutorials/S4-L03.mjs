// 审批的内容、身份、版本和期限全部参与绑定；本例不发送真实消息。
import assert from "node:assert/strict";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
const signingKey = randomBytes(32);
const consumedNonces = new Set();
// 固定字段顺序，不能接受任意形状对象作为审批契约。
// 固定字段及顺序，生成审批签名和执行比对使用的同一份字节内容。
function serializeApproval(action) {
  return JSON.stringify({
    subject: action.subject,
    task: action.task,
    version: action.version,
    action: action.action,
    ticket: action.ticket,
    text: action.text,
    expires: action.expires,
    nonce: action.nonce,
  });
}
const computeSignature = (serializedPayload) =>
  createHmac("sha256", signingKey).update(serializedPayload).digest();
// 把展示给审批人的动作序列化并签名；实际登录审批流程尚未接入。
function issueApproval(action) {
  const serializedPayload = serializeApproval(action);
  return {
    payload: serializedPayload,
    mac: computeSignature(serializedPayload).toString("base64url"),
  };
}
// 依次检查签名、身份、参数、期限与重放，全部通过才接受执行。
function executeApprovedAction(
  authenticatedUser,
  currentAction,
  approvalToken,
  currentTime,
) {
  const receivedSignature = Buffer.from(approvalToken.mac, "base64url"),
    expectedSignature = computeSignature(approvalToken.payload);
  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    throw new Error("BAD_SIGNATURE");
  }
  const approvedAction = JSON.parse(approvalToken.payload);
  if (
    approvedAction.subject !== authenticatedUser.subject ||
    !authenticatedUser.canSend
  ) {
    throw new Error("FORBIDDEN");
  }
  if (serializeApproval(currentAction) !== approvalToken.payload) {
    throw new Error("CHANGED_ACTION");
  }
  if (currentTime >= approvedAction.expires) {
    throw new Error("EXPIRED");
  }
  if (consumedNonces.has(approvedAction.nonce)) {
    throw new Error("REPLAY");
  }
  consumedNonces.add(approvedAction.nonce);
  return { sent: true, ticket: approvedAction.ticket };
}
const action = {
  subject: "alice",
  task: "task-1",
  version: 7,
  action: "send_reply",
  ticket: "T-42",
  text: "已修复",
  expires: 100,
  nonce: "approval-1",
};
const authenticatedUser = { subject: "alice", canSend: true };
const approvalToken = issueApproval(action);
assert.throws(
  () =>
    executeApprovedAction(
      authenticatedUser,
      { ...action, ticket: "T-99" },
      approvalToken,
      10,
    ),
  /CHANGED/,
);
assert.throws(
  () =>
    executeApprovedAction({ subject: "bob", canSend: true }, action, approvalToken, 10),
  /FORBIDDEN/,
);
assert.throws(
  () => executeApprovedAction(authenticatedUser, action, approvalToken, 100),
  /EXPIRED/,
);
assert.deepEqual(executeApprovedAction(authenticatedUser, action, approvalToken, 10), {
  sent: true,
  ticket: "T-42",
});
assert.throws(
  () => executeApprovedAction(authenticatedUser, action, approvalToken, 11),
  /REPLAY/,
);
const forged = {
  ...approvalToken,
  payload: approvalToken.payload.replace("已修复", "请转账"),
};
assert.throws(
  () => executeApprovedAction(authenticatedUser, action, forged, 10),
  /SIGNATURE/,
);
console.log("changed action / wrong subject / expired / replay / tamper: rejected");
console.log("one exact approved action accepted; no real message sent");
