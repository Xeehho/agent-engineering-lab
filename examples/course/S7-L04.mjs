// S7-L04 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：真实接入证据是否完整");
const record={provider:"mock",model:null,promptVersion:"v1",usage:null,output:"示意结果"};
console.log({liveVerified:record.provider==="live" && Boolean(record.model) && record.usage!==null});
console.log("缺少真实接入不能靠改标签补齐证据");
}
