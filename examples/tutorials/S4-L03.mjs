import assert from "node:assert/strict";
import { createHmac,randomBytes,timingSafeEqual } from "node:crypto";
const key = randomBytes(32);
const consumed = new Set();
// 固定字段顺序，不能接受任意形状对象作为审批契约。
function canonical(a) {
  return JSON.stringify({
    subject:a.subject,task:a.task,version:a.version,action:a.action,
    ticket:a.ticket,text:a.text,expires:a.expires,nonce:a.nonce
  });
}
const sign = payload => createHmac("sha256",key).update(payload).digest();
function issue(action) {
  const payload = canonical(action);
  return {payload,mac:sign(payload).toString("base64url")};
}
function execute(auth,current,token,now) {
  const received = Buffer.from(token.mac,"base64url"), expected = sign(token.payload);
  if (received.length !== expected.length || !timingSafeEqual(received,expected))
    throw new Error("BAD_SIGNATURE");
  const approved = JSON.parse(token.payload);
  if (approved.subject !== auth.subject || !auth.canSend) throw new Error("FORBIDDEN");
  if (canonical(current) !== token.payload) throw new Error("CHANGED_ACTION");
  if (now >= approved.expires) throw new Error("EXPIRED");
  if (consumed.has(approved.nonce)) throw new Error("REPLAY");
  consumed.add(approved.nonce);
  return {sent:true,ticket:approved.ticket};
}
const action = {
  subject:"alice",task:"task-1",version:7,action:"send_reply",
  ticket:"T-42",text:"已修复",expires:100,nonce:"approval-1"
};
const auth = {subject:"alice",canSend:true};
const token = issue(action);
assert.throws(() => execute(auth,{...action,ticket:"T-99"},token,10),/CHANGED/);
assert.throws(() => execute({subject:"bob",canSend:true},action,token,10),/FORBIDDEN/);
assert.throws(() => execute(auth,action,token,100),/EXPIRED/);
assert.deepEqual(execute(auth,action,token,10),{sent:true,ticket:"T-42"});
assert.throws(() => execute(auth,action,token,11),/REPLAY/);
const forged = {...token,payload:token.payload.replace("已修复","请转账")};
assert.throws(() => execute(auth,action,forged,10),/SIGNATURE/);
console.log("changed action / wrong subject / expired / replay / tamper: rejected");
console.log("one exact approved action accepted; no real message sent");
