import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setTimeout as wait } from "node:timers/promises";
import { z } from "zod";
const server = new McpServer({name:"mcp-errors",version:"1.0.0"});
let active = 0, cancelled = 0;
const text = value => ({content:[{type:"text",text:JSON.stringify(value)}]});
server.registerTool("lookup", {inputSchema:{id:z.string()}}, async ({id}) => {
  return id === "known" ? text({found:true}) :
    {isError:true,content:[{type:"text",text:"NOT_FOUND"}]};
});
server.registerTool("slow", {inputSchema:{}}, async (_args,extra) => {
  active++;
  try {
    await wait(10000,undefined,{signal:extra.signal});
    return text({done:true});
  } catch (error) {
    if (extra.signal.aborted) cancelled++;
    throw error;
  } finally { active--; }
});
server.registerTool("stats", {inputSchema:{}}, async () => text({active,cancelled}));
await server.connect(new StdioServerTransport());
