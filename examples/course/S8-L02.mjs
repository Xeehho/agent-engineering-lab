// S8-L02 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：一次只改变一个主要因素");
const before={model:"A",prompt:"v1",index:"i1"};
const after={model:"A",prompt:"v2",index:"i1"};
console.log("变化字段",Object.keys(before).filter(k=>before[k]!==after[k]));
console.log("单因素对照仍需同集输入、评分和足够样本");
}
