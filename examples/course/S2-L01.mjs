// S2-L01 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：工具名存在，就能调用吗？");
const allowed = new Map([["getTicket", args => ({id:args.ticketId,status:"open"})]]);
for (const call of [{name:"getTicket",args:{ticketId:"T-42"}},{name:"deleteDatabase",args:{}}]) {
  const handler = allowed.get(call.name);
  console.log(handler ? handler(call.args) : {error:"UNKNOWN_TOOL"});
}
}
