import assert from "node:assert/strict";
const evidence = new Map([
  ["mcp-local",{kind:"local-integration",verified:true}],
  ["rag-fixture",{kind:"fixture-metric",verified:true}],
  ["ui-demo",{kind:"browser-demo",verified:true}]
]);
const claims = [
  {text:"完成本地 MCP 客户端/服务端互通",requires:"local-integration",evidenceId:"mcp-local"},
  {text:"生产 RAG 准确率99%",requires:"production-eval",evidenceId:"rag-fixture"},
  {text:"实现任务状态与审批界面演示",requires:"browser-demo",evidenceId:"ui-demo"},
  {text:"已承受十万用户并发",requires:"load-test",evidenceId:"missing"}
];
function inspect(claims,evidence) {
  return claims.map(c => {
    const e = evidence.get(c.evidenceId);
    return {...c,supported:!!e?.verified && e.kind===c.requires};
  });
}
const rows = inspect(claims,evidence);
assert.deepEqual(rows.map(r => r.supported),[true,false,true,false]);
assert.equal(rows.filter(r => r.supported).length,2);
const jobs = [
  {id:"frontend-ai",needs:["React","streaming","evaluation"]},
  {id:"agent-app",needs:["tools","MCP","SQL","evaluation"]}
];
const demonstrated = new Set(["React","streaming","tools","MCP"]);
const gaps = jobs.map(j => ({id:j.id,missing:j.needs.filter(n => !demonstrated.has(n))}));
assert.deepEqual(gaps,[{id:"frontend-ai",missing:["evaluation"]},{id:"agent-app",missing:["SQL","evaluation"]}]);
console.log("supported claims=2/4; fixture cannot justify production metric");
console.log("gaps: frontend-ai=evaluation; agent-app=SQL,evaluation; jobs are synthetic");
