let calls = 0;
async function run(signal) {
  // 执行方主动检查通知；不检查就不会自动停。
  if (signal.aborted) return "cancelled";
  calls += 1;
  return "done";
}
const controller = new AbortController();
controller.abort();
console.log(await run(controller.signal));
console.log("实际开始次数：", calls);
assert.equal(calls, 0);
