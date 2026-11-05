import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
let config = Object.freeze({version:"v2",mode:"primary"});
const knownGood = Object.freeze({version:"v1",mode:"retrieval-only"});
const counts = new Map();
function limited(subject) {
  const n = (counts.get(subject)||0)+1;
  counts.set(subject,n);
  return n>2;
}
async function primary(kind) {
  if (kind==="forbidden") throw Object.assign(new Error("FORBIDDEN"),{status:403});
  throw Object.assign(new Error("TEMPORARY"),{status:503});
}
const server = createServer(async (req,res) => {
  const url = new URL(req.url,"http://127.0.0.1");
  const send = (status,body) => {
    res.writeHead(status,{"content-type":"application/json"});
    res.end(JSON.stringify(body));
  };
  if (url.pathname==="/health") return send(200,{ready:true,version:config.version});
  // 仅为夹具身份，真实服务必须替换为认证中间件。
  const subject = "fixture-user";
  if (limited(subject)) return send(429,{code:"RATE_LIMITED"});
  const snapshot = config;
  try {
    await primary(url.searchParams.get("kind"));
    return send(200,{source:"primary"});
  } catch (error) {
    if (error.status!==503) return send(error.status||500,{code:"REQUEST_REJECTED"});
    return send(200,{source:"retrieval-only",degraded:true,version:snapshot.version});
  }
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
const base = "http://127.0.0.1:"+server.address().port;
try {
  const first = await fetch(base+"/answer");
  assert.deepEqual(await first.json(),{source:"retrieval-only",degraded:true,version:"v2"});
  assert.equal((await fetch(base+"/answer?kind=forbidden")).status,403);
  assert.equal((await fetch(base+"/answer")).status,429);
  config = knownGood;
  assert.deepEqual(await (await fetch(base+"/health")).json(),{ready:true,version:"v1"});
  console.log("localhost HTTP: temporary failure degraded; forbidden stayed 403; third request=429");
  console.log("config pointer rolled back v2 -> v1; no cloud deployment performed");
} finally {
  await new Promise(resolve => server.close(resolve));
}
