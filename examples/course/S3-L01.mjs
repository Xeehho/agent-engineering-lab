// S3-L01 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：把角色和业务工具分开");
const deployment = {host:"研发助手",client:"Host 内协议组件",server:"知识工具服务"};
const tool = {name:"getTicket",input:{ticketId:"T-42"}};
console.log(deployment);
console.log("业务能力:", tool);
console.log("这不是 MCP wire message");
}
