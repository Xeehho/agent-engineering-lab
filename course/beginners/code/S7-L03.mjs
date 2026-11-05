let active = 0;
const limit = 1;
function enter() {
  if (active >= limit) throw new Error("busy");
  active += 1;
}
function leave() {
  active -= 1;
}
enter();
try {
  assert.throws(enter, /busy/);
  console.log("第二个请求：拒绝进入");
} finally {
  leave();
}
console.log("剩余在途：", active);
assert.equal(active, 0);
