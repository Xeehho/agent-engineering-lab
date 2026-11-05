// S7-L02 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：有任务 ID，但哪一步慢？");
const spans=[{name:"queue",ms:500},{name:"retrieval",ms:80},{name:"model",ms:420},{name:"tool",ms:50}];
console.table(spans);
console.log("串行演示合计",spans.reduce((s,x)=>s+x.ms,0));
console.log("真实并行 span 不能简单相加当墙钟时间");
}
