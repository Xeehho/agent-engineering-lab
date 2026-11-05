// S1-L05 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：上下文预算是怎样超掉的？");
const budget = 12000;
const usage = {system:1000, tools:1800, history:5000, evidence:2800, outputReserve:2000};
const planned = Object.values(usage).reduce((a,b) => a+b,0);
console.log({planned,budget,excess:Math.max(0,planned-budget)});
console.log("数值是假设的 token 计数，不是分词器结果");
}
