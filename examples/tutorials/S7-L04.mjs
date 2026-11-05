import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
async function generate({base,model,input,signal,allowLive=false,key}) {
  const url = new URL(base);
  const local = url.hostname==="127.0.0.1" && url.protocol==="http:";
  if (!local && !(url.origin==="https://api.openai.com" && allowLive && key))
    throw new Error("LIVE_CALL_NOT_AUTHORIZED");
  const headers = {"content-type":"application/json"};
  if (!local) headers.authorization = "Bearer "+key;
  const response = await fetch(new URL("/v1/responses",url),{
    method:"POST",headers,signal,
    body:JSON.stringify({model,input,max_output_tokens:200})
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw Object.assign(new Error("UPSTREAM_HTTP_"+response.status),{
      status:response.status,retryAfter:response.headers.get("retry-after")
    });
  }
  const body = await response.json();
  if (body.status!=="completed" || !Array.isArray(body.output))
    throw new Error("INVALID_OR_INCOMPLETE_RESPONSE");
  const text = body.output.filter(x => x.type==="message")
    .flatMap(x => Array.isArray(x.content)?x.content:[])
    .filter(x => x.type==="output_text" && typeof x.text==="string")
    .map(x => x.text).join("");
  if (!text) throw new Error("NO_TEXT_OUTPUT");
  const usage = body.usage;
  if (!usage || !Number.isInteger(usage.input_tokens) || usage.input_tokens<0 ||
      !Number.isInteger(usage.output_tokens) || usage.output_tokens<0)
    throw new Error("INVALID_USAGE");
  return {text,usage:{input:usage.input_tokens,output:usage.output_tokens},
    providerRequestId:response.headers.get("x-request-id"),scope:local?"fixture":"live"};
}
const server = createServer(async (req,res) => {
  let raw="";
  for await (const chunk of req) raw+=chunk;
  const body = JSON.parse(raw);
  assert.equal(req.url,"/v1/responses");
  assert.equal(body.max_output_tokens,200);
  res.setHeader("content-type","application/json");
  if (body.input==="rate") {
    res.writeHead(429,{"retry-after":"2"}); return res.end('{"error":{"code":"rate_limit"}}');
  }
  if (body.input==="broken") return res.end('{"status":"completed","output":[]}');
  res.setHeader("x-request-id","fixture-request");
  res.end(JSON.stringify({
    status:"completed",output:[{type:"message",content:[{type:"output_text",text:"本地夹具回答"}]}],
    usage:{input_tokens:12,output_tokens:5}
  }));
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
const base = "http://127.0.0.1:"+server.address().port;
try {
  const result = await generate({base,model:"fixture-model",input:"hello"});
  assert.deepEqual(result,{text:"本地夹具回答",usage:{input:12,output:5},
    providerRequestId:"fixture-request",scope:"fixture"});
  await assert.rejects(generate({base,model:"fixture",input:"rate"}),e => e.status===429 && e.retryAfter==="2");
  await assert.rejects(generate({base,model:"fixture",input:"broken"}),/NO_TEXT/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(generate({base,model:"fixture",input:"hello",signal:controller.signal}));
  await assert.rejects(generate({base:"https://api.openai.com",model:"unset",input:"hello"}),/NOT_AUTHORIZED/);
  console.log("local Responses-shaped HTTP: text/usage/request-id normalized");
  console.log("429 + empty output + pre-cancel + unauthorized live call rejected; live calls=0");
} finally { await new Promise(resolve => server.close(resolve)); }
