let lease = { owner: null, until: 0, token: 0 };
function claim(owner, now) {
  if (now < lease.until) throw new Error("仍被占用");
  lease = { owner, until: now + 10, token: lease.token + 1 };
  return lease.token;
}
function commit(token, now) {
  return token === lease.token && now < lease.until;
}
const old = claim("W1", 0);
const latest = claim("W2", 11);
console.log("旧提交：", commit(old, 12), "新提交：", commit(latest, 12));
assert.equal(commit(old, 12), false);
