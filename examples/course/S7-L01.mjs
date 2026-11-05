// S7-L01 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：平均分掩盖关键错误");
const results=[{score:1,critical:false},{score:1,critical:false},{score:0.9,critical:true}];
const average=results.reduce((s,x)=>s+x.score,0)/results.length;
console.log({average,canRelease:!results.some(x=>x.critical)});
}
