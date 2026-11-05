import assert from "node:assert/strict";
import { z } from "zod";
const argsSchema = z.object({ticketId:z.string().regex(/^T-\d+$/)}).strict();
const resultSchema = z.object({id:z.string(),status:z.enum(["open","closed"])}).strict();
const tickets = [{id:"T-42",tenant:"A",status:"open"}];
let executions = 0;
const registry = new Map([["getTicket", {
  args:argsSchema, result:resultSchema,
  execute(args,ctx) {
    executions++;
    const ticket = tickets.find(t=>t.id===args.ticketId && t.tenant===ctx.tenant);
    if (!ticket) throw new Error("NOT_FOUND_OR_FORBIDDEN");
    return {id:ticket.id,status:ticket.status};
  }
}]]);
async function dispatch(call,ctx) {
  try {
    const tool = registry.get(call.name);
    if (!tool) throw new Error("UNKNOWN_TOOL");
    const args = tool.args.safeParse(JSON.parse(call.arguments));
    if (!args.success) throw new Error("INVALID_ARGUMENTS");
    const value = await tool.execute(args.data,ctx);
    return {callId:call.id,ok:true,data:tool.result.parse(value)};
  } catch(error) {
    return {callId:call.id,ok:false,code:error instanceof SyntaxError?"INVALID_JSON":error.message};
  }
}
const proposal = {id:"c1",name:"getTicket",arguments:'{"ticketId":"T-42"}'};
assert.equal((await dispatch(proposal,{tenant:"A"})).data.id,"T-42");
assert.equal((await dispatch({...proposal,id:"c2",name:"dropAll"},{tenant:"A"})).code,"UNKNOWN_TOOL");
assert.equal((await dispatch({...proposal,id:"c3",arguments:'{"ticketId":42}'},{tenant:"A"})).code,"INVALID_ARGUMENTS");
const denied = await dispatch({...proposal,id:"c4"},{tenant:"B"});
assert.equal(denied.code,"NOT_FOUND_OR_FORBIDDEN");
assert.equal(denied.callId,"c4");
assert.equal(executions,2);
console.log("valid / unknown / invalid args / wrong tenant: passed");
console.log("invalid proposals never reached execute; result kept callId");
