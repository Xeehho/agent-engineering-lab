// S3-L03 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：相同工单编号，不同租户");
const tickets = [{tenant:"A",id:"T-1",text:"A 私有"},{tenant:"B",id:"T-1",text:"B 私有"}];
function readTicket(auth, id) {
  return tickets.find(t => t.tenant === auth.tenant && t.id === id);
}
console.log(readTicket({tenant:"A"},"T-1"));
console.log("身份仅为合成演示，生产中来自认证中间件");
}
