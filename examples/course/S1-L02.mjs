// S1-L02 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：停止等待与停止工作");
const controller = new AbortController();
let working = true;
const task = new Promise(resolve => {
  const timer = setTimeout(() => { working = false; resolve("完成"); }, 80);
  controller.signal.addEventListener("abort", () => {
    clearTimeout(timer); working = false; resolve("已响应取消");
  }, { once: true });
});
controller.abort();
console.log(await task, "仍在工作:", working);
}
