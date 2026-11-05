// S6-L01 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：先按可验收任务路由");
const tasks=[{type:"retrieve",id:1},{type:"draft",id:2},{type:"unknown",id:3}];
const routes={retrieve:"证据检索",draft:"草稿生成"};
for (const task of tasks) console.log(task.id,routes[task.type] ?? "人工澄清/受控回退");
}
