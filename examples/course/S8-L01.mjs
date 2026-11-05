// S8-L01 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：需求能追到验证吗？");
const requirements=[{id:"R1",test:"权限拒绝",evidence:"case-01"},{id:"R2",test:"重启恢复",evidence:null}];
console.table(requirements.map(r=>({...r,status:r.evidence?"有对应材料，待评阅":"缺证据"})));
}
