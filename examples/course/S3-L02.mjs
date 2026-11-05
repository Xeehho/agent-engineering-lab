// S3-L02 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：合法消息与成功业务不同");
const responses = [
 {transport:"ok",business:{ok:true,data:{id:"T-42"}}},
 {transport:"ok",business:{ok:false,code:"NOT_FOUND"}}
];
for (const r of responses) console.log(r.transport, "业务成功:",r.business.ok);
console.log("这是教学包裹，不是 MCP 标准返回结构");
}
