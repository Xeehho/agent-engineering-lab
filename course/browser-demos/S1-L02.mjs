// 直接在网页运行。assert 是课堂提供的检查工具，失败会中断本次实验。

// 本课只有两个计时器角色：工作计时器模拟任务，截止计时器限制总等待时间。
const taskStatistics = {
  started: 0,
  active: 0,
  cleaned: 0,
};

async function performCancellableWork(durationMs, signal) {
  // 已取消就直接抛出原因；不能先增加计数、发请求，再检查取消。
  signal.throwIfAborted();

  taskStatistics.started += 1;
  taskStatistics.active += 1;

  let workTimer;
  let handleAbort;

  try {
    await new Promise((resolve, reject) => {
      handleAbort = () => reject(signal.reason);
      signal.addEventListener("abort", handleAbort, { once: true });
      workTimer = setTimeout(resolve, durationMs);
    });

    return "done";
  } finally {
    // resolve 和 reject 最终都会经过这里，避免任务结束后仍保留计时器和监听器。
    clearTimeout(workTimer);
    signal.removeEventListener("abort", handleAbort);
    taskStatistics.active -= 1;
    taskStatistics.cleaned += 1;
  }
}

async function runWithDeadline(
  durationMs,
  timeoutMs,
  callerSignal = new AbortController().signal,
) {
  const deadlineController = new AbortController();
  const deadlineTimer = setTimeout(() => {
    deadlineController.abort(new Error("DEADLINE_EXCEEDED"));
  }, timeoutMs);

  // 任意一方取消都会使 combinedSignal 取消，并保留最先发生的原因。
  const combinedSignal = AbortSignal.any([callerSignal, deadlineController.signal]);

  try {
    return await performCancellableWork(durationMs, combinedSignal);
  } finally {
    clearTimeout(deadlineTimer);
  }
}

// 场景一：工作比期限短，正常完成。
assert.equal(await runWithDeadline(2, 100), "done");

// 场景二：工作比期限长，真正的工作函数收到取消。
await assert.rejects(runWithDeadline(100, 5), /DEADLINE_EXCEEDED/);

// 场景三：调用之前已取消，任务根本不应该启动。
const preCancelledController = new AbortController();
preCancelledController.abort(new Error("CALLER_CANCELLED"));
const startedBeforeCall = taskStatistics.started;
await assert.rejects(
  runWithDeadline(100, 500, preCancelledController.signal),
  /CALLER_CANCELLED/,
);
assert.equal(taskStatistics.started, startedBeforeCall);

// 场景四：任务启动后，调用方主动取消。
const inFlightController = new AbortController();
const pendingTask = runWithDeadline(100, 500, inFlightController.signal);
inFlightController.abort(new Error("CALLER_CANCELLED"));
await assert.rejects(pendingTask, /CALLER_CANCELLED/);

assert.equal(taskStatistics.active, 0);
assert.equal(taskStatistics.cleaned, taskStatistics.started);
console.log("success / deadline / pre-cancel / in-flight cancel: passed");
console.log("active=0; every started task cleaned");
