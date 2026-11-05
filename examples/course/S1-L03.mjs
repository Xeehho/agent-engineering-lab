// S1-L03 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：终态之后的文字能进来吗？");
let state = "running", text = "";
for (const event of [{type:"delta",text:"订单"}, {type:"cancelled"}, {type:"delta",text:"旧结果"}]) {
  if (state !== "running") { console.log("忽略晚到事件", event.type); continue; }
  if (event.type === "delta") text += event.text;
  else state = event.type;
}
console.log({state, text});
}
