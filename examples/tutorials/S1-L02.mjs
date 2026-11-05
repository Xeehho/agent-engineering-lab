import assert from "node:assert/strict";

const stats = { started: 0, active: 0, cleaned: 0 };
async function work(ms, signal) {
  signal.throwIfAborted();
  stats.started++; stats.active++;
  let timer, onAbort;
  try {
    await new Promise((resolve, reject) => {
      onAbort = () => reject(signal.reason);
      signal.addEventListener("abort", onAbort, { once: true });
      timer = setTimeout(resolve, ms);
    });
    return "done";
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onAbort);
    stats.active--; stats.cleaned++;
  }
}
async function run(ms, timeoutMs, parent = new AbortController().signal) {
  const deadline = new AbortController();
  const timer = setTimeout(
    () => deadline.abort(new Error("DEADLINE_EXCEEDED")), timeoutMs);
  try {
    return await work(ms, AbortSignal.any([parent, deadline.signal]));
  } finally { clearTimeout(timer); }
}

assert.equal(await run(1, 1000), "done");
await assert.rejects(run(100, 5), /DEADLINE_EXCEEDED/);
const cancelled = new AbortController();
cancelled.abort(new Error("USER_CANCELLED"));
const before = stats.started;
await assert.rejects(run(100, 1000, cancelled.signal), /USER_CANCELLED/);
assert.equal(stats.started, before);
const during = new AbortController();
const running = run(100, 1000, during.signal);
during.abort(new Error("USER_CANCELLED"));
await assert.rejects(running, /USER_CANCELLED/);
assert.equal(stats.active, 0);
assert.equal(stats.cleaned, stats.started);
console.log("success / deadline / pre-cancel / in-flight cancel: passed");
console.log("active=0; every started task cleaned");
