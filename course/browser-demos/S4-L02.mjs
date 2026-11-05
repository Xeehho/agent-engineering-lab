// 逻辑时钟 + 内存状态，观察 fencing；不是分布式队列或数据库原子性测试。
let job = { state: "queued", owner: null, token: 0, leaseUntil: 0 };
function claimJob(workerId, now) {
  const available =
    job.state === "queued" || (job.state === "running" && job.leaseUntil <= now);
  if (!available) {
    return null;
  }
  job = {
    ...job,
    state: "running",
    owner: workerId,
    token: job.token + 1,
    leaseUntil: now + 10,
  };
  return job.token;
}
function completeJob(workerId, token, now) {
  if (
    job.state !== "running" ||
    job.owner !== workerId ||
    job.token !== token ||
    job.leaseUntil <= now
  ) {
    return false;
  }
  job = { ...job, state: "succeeded" };
  return true;
}
const oldToken = claimJob("W1", 0);
assert.equal(oldToken, 1);
assert.equal(claimJob("W2", 5), null);
const newToken = claimJob("W2", 11);
assert.equal(newToken, 2);
assert.equal(completeJob("W1", oldToken, 12), false);
assert.equal(completeJob("W2", newToken, 12), true);
assert.equal(claimJob("W3", 100), null);
console.log("W1租约到10，W2在11取得token=2；旧token=1被拒绝。");
console.log(job);
