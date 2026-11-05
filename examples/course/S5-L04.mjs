// S5-L04 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：检索正确率和回答正确率分开算");
const cases = [{retrieved:true,faithful:true},{retrieved:true,faithful:false},{retrieved:false,faithful:false}];
console.log("检索命中",cases.filter(x=>x.retrieved).length+"/"+cases.length);
console.log("回答合格",cases.filter(x=>x.faithful).length+"/"+cases.length);
console.log("标签为人工假设，不是真实 RAG 实测");
}
