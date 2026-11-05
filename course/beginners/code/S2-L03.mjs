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
