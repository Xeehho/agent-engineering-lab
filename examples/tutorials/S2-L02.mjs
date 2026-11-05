import assert from "node:assert/strict";
async function run(decide,{maxRounds=3,maxTools=2,signal=new AbortController().signal}={}) {
  const state = {rounds:0,tools:0,history:[]};
  const deadline = Date.now()+1000;
  for (;;) {
    if (signal.aborted) return {...state,reason:"cancelled"};
    if (Date.now()>=deadline) return {...state,reason:"deadline"};
    if (state.rounds>=maxRounds) return {...state,reason:"model_budget"};
    state.rounds++;
    const decision = await decide(structuredClone(state));
    if (signal.aborted) return {...state,reason:"cancelled"};
    if (decision.type==="final" && typeof decision.text==="string")
      return {...state,reason:"succeeded",answer:decision.text};
    if (decision.type!=="tools" || !Array.isArray(decision.calls))
      return {...state,reason:"invalid_decision"};
    if (!decision.calls.length) return {...state,reason:"no_progress"};
    if (decision.calls.length>maxTools-state.tools)
      return {...state,reason:"tool_budget"};
    for (const call of decision.calls) {
      if (signal.aborted) return {...state,reason:"cancelled"};
      if (call.name!=="searchDocs") return {...state,reason:"unknown_tool"};
      state.tools++;
      state.history.push({callId:call.id,result:"local evidence"});
    }
  }
}
const success = await run(async s=>s.tools
  ? {type:"final",text:"基于本地证据的草稿"}
  : {type:"tools",calls:[{id:"c1",name:"searchDocs"}]});
assert.equal(success.reason,"succeeded");
const repeated = await run(async s=>({type:"tools",calls:[{id:"c"+s.rounds,name:"searchDocs"}]}),{maxRounds:10});
assert.equal(repeated.reason,"tool_budget");
assert.equal(repeated.tools,2);
const batch = await run(async()=>({type:"tools",calls:[1,2,3].map(id=>({id,name:"searchDocs"}))}));
assert.equal(batch.tools,0);
const controller = new AbortController(); controller.abort();
const cancelled = await run(async()=>{throw new Error("should not call");},{signal:controller.signal});
assert.equal(cancelled.rounds,0);
console.log("success=succeeded; repeat=tool_budget; oversized batch executed=0");
console.log("pre-cancel model rounds=0");
