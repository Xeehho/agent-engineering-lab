// S2-L04 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：上下文选择不只是长度");
const context=[{id:"a",relevant:true,allowed:true,current:true},{id:"b",relevant:true,allowed:false,current:true},{id:"c",relevant:true,allowed:true,current:false}];
console.log(context.filter(x=>x.relevant && x.allowed && x.current).map(x=>x.id));
console.log("布尔标签为合成示例，不自动解决真实相关性与权限");
}
