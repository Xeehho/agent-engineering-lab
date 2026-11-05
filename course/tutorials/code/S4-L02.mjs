// 使用题目注入的逻辑时间，逐步复现旧工作者与新工作者的竞争。
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
const database = new DatabaseSync(":memory:");
database.exec(
  `
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  state TEXT,
  owner TEXT,
  lease_until INTEGER,
  token INTEGER,
  attempt INTEGER,
  next_at INTEGER
)
`,
);
database
  .prepare("INSERT INTO jobs VALUES(?,?,?,?,?,?,?)")
  .run("J1", "queued", null, 0, 0, 0, 0);
// 原子领取符合条件的任务，并返回这一轮独有的租约 token。
function claimJob(workerId, currentTime) {
  return database
    .prepare(
      `
UPDATE jobs
SET
  state = 'running',
  owner = ?,
  lease_until = ?,
  token = token + 1,
  attempt = attempt + 1
WHERE
  id = 'J1'
  AND attempt < 3
  AND (
    (
      state = 'queued'
      AND next_at <= ?
    )
    OR (
      state = 'running'
      AND lease_until <= ?
    )
  )
RETURNING
  token
`,
    )
    .get(workerId, currentTime + 10, currentTime, currentTime)?.token;
}
// 只有租约仍有效且 token/owner 都匹配，才允许提交成功。
function completeJob(workerId, leaseToken, currentTime) {
  return (
    database
      .prepare(
        `
UPDATE jobs
SET
  state = 'succeeded'
WHERE
  id = 'J1'
  AND state = 'running'
  AND owner = ?
  AND token = ?
  AND lease_until > ?
`,
      )
      .run(workerId, leaseToken, currentTime).changes === 1
  );
}
// 当前拥有者将任务重新排队，next_at 控制下一次可领取时间。
function scheduleRetry(workerId, leaseToken, currentTime) {
  return (
    database
      .prepare(
        `
UPDATE jobs
SET
  state = 'queued',
  next_at = ?,
  owner = NULL
WHERE
  id = 'J1'
  AND state = 'running'
  AND owner = ?
  AND token = ?
  AND lease_until > ?
`,
      )
      .run(currentTime + 5, workerId, leaseToken, currentTime).changes === 1
  );
}
try {
  const expiredLeaseToken = claimJob("W1", 0);
  assert.equal(expiredLeaseToken, 1);
  assert.equal(claimJob("W2", 5), undefined);
  const currentLeaseToken = claimJob("W2", 11);
  assert.equal(currentLeaseToken, 2);
  assert.equal(completeJob("W1", expiredLeaseToken, 12), false);
  assert.equal(scheduleRetry("W2", currentLeaseToken, 12), true);
  assert.equal(claimJob("W3", 16), undefined);
  const finalLeaseToken = claimJob("W3", 17);
  assert.equal(finalLeaseToken, 3);
  assert.equal(completeJob("W3", finalLeaseToken, 18), true);
  assert.equal(claimJob("W4", 100), undefined);
  assert.equal(database.prepare("SELECT attempt FROM jobs").get().attempt, 3);
  console.log("lease expiry -> token 2; stale token 1 rejected");
  console.log("retry delayed until 17; attempt 3 succeeded; terminal not reclaimed");
} finally {
  database.close();
}
